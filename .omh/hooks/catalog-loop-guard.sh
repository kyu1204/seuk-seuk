#!/bin/bash
set -euo pipefail
INPUT=$(cat)

# --- oh-my-harness event logger ---
_OMH_STATE_DIR='/Users/minkyu/Documents/seuk-seuk/.omh/state'
mkdir -p "$_OMH_STATE_DIR" 2>/dev/null || true
_OMH_HOOK_NAME="$(basename "$0")"
_OMH_EVENT="PreToolUse"
_OMH_DECISION_MODE="block"
_OMH_LOGGED=0
_log_event() {
  # Build the JSONL record entirely through jq so every string field is
  # JSON-escaped (quotes, backslashes, newlines, unicode). The previous
  # printf+%s approach corrupted the line whenever reason or any other
  # field contained these characters, and event-logger.ts silently drops
  # unparseable lines, causing event loss.
  _OMH_LOGGED=1
  local decision="${1:-allow}" reason="${2:-}" meta="${3:-}"
  local ts
  ts="$(date -u +%Y-%m-%dT%H:%M:%SZ)"
  # Meta must be a serialized JSON value (object/array/scalar); fall back
  # to no-meta when invalid so a buggy caller can't drop the event entirely.
  if [ -n "$meta" ] && ! echo "$meta" | jq -e . >/dev/null 2>&1; then
    meta=""
  fi
  if [ -n "$meta" ]; then
    jq -cn \
      --arg ts "$ts" --arg event "$_OMH_EVENT" --arg hook "$_OMH_HOOK_NAME" \
      --arg decision "$decision" --arg reason "$reason" --argjson meta "$meta" \
      '{ts:$ts,event:$event,hook:$hook,decision:$decision,reason:$reason,meta:$meta}' \
      >> "$_OMH_STATE_DIR/events.jsonl"
  else
    jq -cn \
      --arg ts "$ts" --arg event "$_OMH_EVENT" --arg hook "$_OMH_HOOK_NAME" \
      --arg decision "$decision" --arg reason "$reason" \
      '{ts:$ts,event:$event,hook:$hook,decision:$decision,reason:$reason}' \
      >> "$_OMH_STATE_DIR/events.jsonl"
  fi
}

# Emit a Claude/Codex hook decision JSON to stdout with all fields safely
# escaped. Catalog blocks should call this rather than handcrafting JSON
# via echo "{...}" — a file name or pattern containing a quote, backslash,
# or newline would otherwise produce invalid JSON that the runtime cannot
# parse as a block decision.
#
# In ask mode the same hook escalates to the user instead of hard-blocking,
# but only on runtimes that understand a permissionDecision:"ask" response.
# Claude's PreToolUse payload carries a transcript_path field; Codex's does
# not. A runtime we cannot positively identify as Claude falls through to a
# hard block, so a guardrail (e.g. TDD) is never silently downgraded to allow.
# The two requirements (Claude=ask, Codex=block) cannot coexist in one JSON —
# a legacy {decision:"block"} overrides permissionDecision:"ask" on Claude —
# so we branch on the caller instead of emitting a combined object.
_emit_decision() {
  local decision="${1:-block}" reason="${2:-}"
  if [ "${_OMH_DECISION_MODE:-block}" = "ask" ] && [ "$decision" = "block" ]; then
    if printf '%s' "${INPUT:-}" | jq -e 'has("transcript_path")' >/dev/null 2>&1; then
      jq -cn --arg reason "$reason" --arg event "$_OMH_EVENT" \
        '{hookSpecificOutput:{hookEventName:$event,permissionDecision:"ask",permissionDecisionReason:$reason}}'
      return 0
    fi
  fi
  jq -cn --arg decision "$decision" --arg reason "$reason" \
    '{decision:$decision,reason:$reason}'
}
trap '_OMH_EXIT_CODE=$?; if [ "$_OMH_LOGGED" -eq 0 ]; then if [ "$_OMH_EXIT_CODE" -ne 0 ]; then _log_event "error" "hook exited with code $_OMH_EXIT_CODE"; else _log_event "allow"; fi; fi' EXIT
# --- end logger ---

# Architect sessions pass through untouched; only the runner exports this.
[[ "${OMH_LOOP:-}" != "1" ]] && exit 0

TOOL_NAME=$(echo "$INPUT" | jq -r '.tool_name // empty' 2>/dev/null)
FILE_PATH=$(echo "$INPUT" | jq -r '.tool_input.file_path // .tool_input.path // empty' 2>/dev/null)
COMMAND=$(echo "$INPUT" | jq -r '.tool_input.command // empty' 2>/dev/null)

# Codex apply_patch ships the whole patch in tool_input.command and names the
# files in "*** {Add|Update|Delete} File: <path>" headers. Collect those
# paths and treat them like file_path; the Bash write heuristic must NOT run
# over patch text (it would fire on words inside the diff).
PATCH_PATHS=()
if [[ "$TOOL_NAME" == "apply_patch" && -n "$COMMAND" ]]; then
  while IFS= read -r _p; do
    _p="${_p%$'\r'}"
    [[ -n "$_p" ]] && PATCH_PATHS+=("$_p")
  done < <(printf '%s\n' "$COMMAND" | sed -nE 's/^\*\*\* ((Add|Update|Delete) File|Move to): (.+)$/\3/p')
  COMMAND=""
fi
[[ -z "$FILE_PATH" && -z "$COMMAND" && ${#PATCH_PATHS[@]} -eq 0 ]] && exit 0

# Component-boundary matching: wrap both sides in slashes so 'ios' matches
# ios/App.swift and /repo/ios/... but never src/kiosk.ts.
_omh_path_under() {
  local file="/$1/" prefix="${2%/}"
  [[ "$file" == *"/$prefix/"* ]]
}

# Bash coverage: a shell command that mentions a protected path AND carries a
# write indicator is blocked. Reads (cat/grep of a work order) pass.
# ponytail: substring heuristic — a command writing elsewhere while merely
# mentioning a protected path is over-blocked; tighten to arg-level parsing if
# that ever bites. This guards a drifting loop, not a malicious one — evasion
# via split cd chains, variable indirection, pushd, or symlinks is explicitly
# out of scope: winning that arms race needs a filesystem sandbox, not a hook.
_omh_bash_writes_to() {
  local cmd="$1" target="${2%/}"
  [[ -z "$cmd" || -z "$target" ]] && return 1
  [[ "$cmd" == *"$target"* ]] || return 1
  # The path is interpolated into an ERE below: escape its metacharacters so
  # "docs/[orders" cannot break the pattern (grep error = silent bypass) and
  # "docs/o+rders" is compared literally.
  target=$(printf '%s' "$target" | sed -e 's/[][\.*^$(){}?+|]/\\&/g')
  local WRITE_OPS='(tee|mv|cp|rm|touch|truncate|sed[[:space:]]+-i[^[:space:]]*)'
  # write op targeting the protected path directly ...
  echo "$cmd" | grep -qE '(>|>>)[[:space:]]*[^|&;]*'"$target"'|(^|[^[:alnum:]_])'"$WRITE_OPS"'[[:space:]][^|&;]*'"$target" && return 0
  # ... or a cd into it followed by any write op (relative paths escape the
  # direct pattern once the cwd is inside the protected directory)
  echo "$cmd" | grep -qE '(^|[^[:alnum:]_])cd[[:space:]][^|&;]*'"$target" \
    && echo "$cmd" | grep -qE '>|(^|[^[:alnum:]_])'"$WRITE_OPS"'[[:space:]]' 
}

# Any path a tool call names: the direct file_path plus apply_patch headers.
_omh_any_path_under() {
  local prefix="$1" f
  [[ -n "$FILE_PATH" ]] && _omh_path_under "$FILE_PATH" "$prefix" && return 0
  for f in "${PATCH_PATHS[@]+"${PATCH_PATHS[@]}"}"; do
    _omh_path_under "$f" "$prefix" && return 0
  done
  return 1
}

WORK_ORDERS='docs/work-orders'
if _omh_any_path_under "$WORK_ORDERS" || _omh_bash_writes_to "$COMMAND" "$WORK_ORDERS"; then
  REASON="oh-my-harness: loop-guard — the loop must not write its own work orders. Mark the task 'BLOCKED: no work order' and move on; the architect writes work orders."
  _log_event "block" "$REASON"
  _emit_decision "block" "$REASON"
  exit 0
fi

ARCHITECT_ONLY=("docs/work-orders" "docs/design" "app/(home)" "harness.yaml" )
for prefix in "${ARCHITECT_ONLY[@]+"${ARCHITECT_ONLY[@]}"}"; do
  [[ -z "$prefix" ]] && continue
  if _omh_any_path_under "$prefix" || _omh_bash_writes_to "$COMMAND" "$prefix"; then
    REASON="oh-my-harness: loop-guard — $prefix is architect-only. Mark the task 'BLOCKED: architect-only path' and move on."
    _log_event "block" "$REASON"
    _emit_decision "block" "$REASON"
    exit 0
  fi
done

exit 0
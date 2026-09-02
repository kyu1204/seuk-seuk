#!/bin/bash
set -euo pipefail
INPUT=$(cat)

# --- oh-my-harness event logger ---
_OMH_STATE_DIR='/Users/minkyu/Documents/seuk-seuk/.omh/state'
mkdir -p "$_OMH_STATE_DIR" 2>/dev/null || true
_OMH_HOOK_NAME="$(basename "$0")"
_OMH_EVENT="PostToolUse"
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
TOOL_NAME=$(echo "$INPUT" | jq -r '.tool_name // empty' 2>/dev/null)
FILE_PATHS=()
DIRECT_PATH=$(echo "$INPUT" | jq -r '.tool_input.file_path // .tool_input.path // empty' 2>/dev/null)
[[ -n "$DIRECT_PATH" ]] && FILE_PATHS+=("$DIRECT_PATH")
if [[ "$TOOL_NAME" == "apply_patch" ]]; then
  PATCH_TEXT=$(echo "$INPUT" | jq -r '.tool_input.command // empty' 2>/dev/null)
  if [[ -n "$PATCH_TEXT" ]]; then
    while IFS= read -r _OMH_HEADER_PATH; do
      # CRLF patches leave a trailing \r since sed's $ matches before \n
      # only; strip it so filename pattern matching isn't bypassed.
      _OMH_HEADER_PATH="${_OMH_HEADER_PATH%$'\r'}"
      [[ -n "$_OMH_HEADER_PATH" ]] && FILE_PATHS+=("$_OMH_HEADER_PATH")
    done < <(printf '%s\n' "$PATCH_TEXT" | sed -nE 's/^\*\*\* (Add|Update) File: (.+)$/\2/p')
  fi
fi
[[ ${#FILE_PATHS[@]} -eq 0 ]] && exit 0

PATTERN='*.{ts,tsx}'
SCOPE='file'
_OMH_RAN_MODULE=0
for FILE_PATH in "${FILE_PATHS[@]}"; do
  BASENAME=$(basename "$FILE_PATH")
  if [[ "$BASENAME" == $PATTERN ]]; then
    if [[ "${SCOPE:-file}" == "module" ]]; then
      if [[ "$_OMH_RAN_MODULE" -eq 0 ]]; then
        echo "oh-my-harness: Running next lint ..." >&2
        next lint >&2 || true
        _OMH_RAN_MODULE=1
      fi
    else
      echo "oh-my-harness: Running next lint on $FILE_PATH..." >&2
      next lint "$FILE_PATH" >&2 || true
    fi
  fi
done
exit 0
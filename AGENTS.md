# Repository Guidelines

## Project Structure & Module Organization
SeukSeuk uses the Next.js App Router. Route groups under `app/` map to product areas: `(auth)` for Supabase auth flows, `(document)` for document upload and management, and `(sign)` for the signing experience. Shared UI belongs in `components/`, with design-system atoms in `components/ui/`. Page-only helpers live in `app/components/`, while cross-cutting logic sits in `contexts/` and `hooks/`. Supabase clients and server actions live in `lib/` (especially `lib/supabase/*`). Static assets stay in `public/`, Tailwind layers in `styles/`, and database artifacts in `supabase/` alongside the latest `supabase_migration.sql`.

## Build, Test, and Development Commands
- `pnpm dev`: launch the Next.js dev server at `http://localhost:3000`.
- `pnpm build`: produce the production bundle; validates server actions and instrumentation.
- `pnpm start`: serve the prebuilt bundle (run after `pnpm build`).
- `pnpm lint`: run ESLint via Next across server and client components.

## Coding Style & Naming Conventions
Use Node 18+ with TypeScript and 2-space indentation. Follow React casing: `PascalCase` for components/providers, `camelCase` for hooks/utilities (e.g., `useDocumentSignature`, `fetchUserProfile`). Prefer Tailwind classes inline; add shared variants only in `styles/globals.css`. Let ESLint enforce import order and guard browser/server APIs. New Supabase helpers should mirror existing files in `lib/supabase/` and expose a single named export.

## Testing Guidelines
The repo ships without an automated suite; manually exercise auth sign-up, document upload, signing flows, and Paddle webhooks before merging. If you introduce automated coverage, place specs near the feature or under `tests/`, wire a `test` script into `package.json`, and prefer React Testing Library for UI behaviour plus Playwright for signing journeys. Document any seeds or fixtures in `supabase/`.

## Commit & Pull Request Guidelines
Commits follow Conventional Commits with an optional leading emoji, e.g., `✨ feat(paddle): improve webhook logging`. Keep changes scoped per commit instead of stacking WIP checkpoints. Pull requests should include a purpose summary, manual testing notes (commands or steps), linked issues, and screenshots or recordings for UI updates. Request review from the maintainer most familiar with the touched area (auth, documents, signing, or Paddle).

## Security & Configuration Tips
Copy `.env.example` to `.env.local` and populate Supabase keys (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and when needed `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`). Keep secrets out of version control; server-only keys belong in Vercel or local shell exports. Paddle webhook handlers under `app/api/` expect verified signatures—use sandbox keys while testing. Sentry DSNs should live in environment config so instrumentation remains active without leaking credentials.


<!-- oh-my-harness:start:tdd-workflow -->
## TDD Rules
- Write or update the failing test (.test.ts / .test.tsx) BEFORE touching the source file
- Red → Green → Refactor; never skip the red step
- Run `npx vitest run` before every commit; all tests must pass

<!-- oh-my-harness:end:tdd-workflow -->


<!-- oh-my-harness:start:branch-workflow -->
## Branch Rules
- Never commit directly on main
- Before starting work: `git fetch origin && git checkout -b <type>/<topic> origin/main` (always branch from latest main)
- If the current branch is already merged into main, create a NEW branch from latest main instead of reusing it
- Commit per unit of work with a descriptive message (feat/fix/refactor/test prefix)

<!-- oh-my-harness:end:branch-workflow -->


<!-- oh-my-harness:start:nextjs-rules -->
## Next.js Development Rules
- Use App Router (app/ directory), never Pages Router
- Components are Server Components by default; add 'use client' only when needed
- Data mutations go through Server Actions (app/actions/)
- Use next/image for images, next/link for internal links

<!-- oh-my-harness:end:nextjs-rules -->


<!-- oh-my-harness:start:omh-loop-protocol -->
## Autonomous Loop Protocol

The autonomous loop runs one work order per fresh session. `WORKPLAN.md` is the single source of truth.

- Read `WORKPLAN.md` first; it is the single source of truth.
- Pick the next unchecked task and implement it exactly as its work order in `docs/work-orders/<ID>.md` says. Make no design decisions.
- No work order, no work: mark the task "BLOCKED: no work order" and stop. Never write your own work order.
- Run the work order's acceptance commands before ticking any checkbox.
- Architect-only, never edited by the loop: `docs/work-orders`, `docs/design`, `app/(home)`, `harness.yaml`.
- If a task needs a human, or after three failed attempts, mark it "BLOCKED: <reason>" and move on. Never idle waiting for a person.
- One task, one commit; update the checkbox and the progress log in the same commit.
- Print exactly OMH_GOAL_COMPLETE as the final line ONLY when every task is done and verified; otherwise never mention that string in any form.

Start: `omh loop start`
Watch: `omh loop status`, then `tail -f .omh/state/loop/runs/<runId>/events.jsonl`
Stop: `omh loop stop` (`--now` to skip the grace period)
<!-- oh-my-harness:end:omh-loop-protocol -->

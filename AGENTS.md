# Repository Guidelines

## Project Structure & Module Organization
SeukSeuk uses the Next.js App Router. Route groups in `app/` map to product areas: `(auth)` handles Supabase auth flows, `(document)` covers document upload and management, and `(sign)` powers the external signing experience. Page-only pieces sit under `app/components/`. Shared UI lives in `components/` with design-system atoms inside `components/ui/`. Cross-cutting context and hooks belong in `contexts/` and `hooks/`, while `lib/` holds Supabase clients, server actions, and other feature services (`lib/supabase/*.ts` is the canonical entrypoint). Static assets live in `public/`, Tailwind layers in `styles/`, and database artifacts in `supabase/` alongside the latest `supabase_migration.sql`. Sentry instrumentation files (`instrumentation.ts`, `instrumentation-client.ts`) stay at the repo root and load automatically during build.

## Build, Test, and Development Commands
Use Node 18+. Package scripts run identically with `pnpm` or `npm run`.
- `pnpm dev`: start the local Next.js server on `http://localhost:3000`.
- `pnpm build`: create the production bundle; verifies that server actions and instrumentation compile.
- `pnpm start`: serve the prebuilt app (run after `pnpm build`).
- `pnpm lint`: execute ESLint via Next, covering both server and client components.

## Coding Style & Naming Conventions
Stick to TypeScript with 2-space indentation. Follow React best practices: `PascalCase` for components and context providers, `camelCase` for hooks and utilities (`useDocumentSignature`, `fetchUserProfile`). Co-locate styles via Tailwind utility classes; add shared variants in `styles/globals.css` sparingly. Let ESLint guide import ordering and forbidden browser/server API usage. When introducing new Supabase helpers, mirror the patterns in `lib/supabase/` and expose a single named export per file.

## Testing Guidelines
The repo currently ships without an automated test runner, so exercise critical flows (sign-up, document upload, signing, Paddle webhooks) before every PR. If you add automated coverage, place specs near the feature or in a top-level `tests/` directory and wire a `test` script into `package.json` so others can run `pnpm test`. Prefer React Testing Library for component behaviour and Playwright for signing journeys. Document any new fixtures or seeds inside `supabase/` to keep Supabase states reproducible.

## Commit & Pull Request Guidelines
Commits in history follow a Conventional Commit style augmented with leading emojis (e.g. `✨ feat(paddle): improve webhook logging`). Keep that format: emoji (optional but encouraged), type, optional scope, and a concise, imperative message. Group related changes into a single commit; avoid WIP commits in shared branches. Pull requests should include: purpose summary, testing notes (manual steps or commands), linked issues, and screenshots or screen recordings for UI-affecting work. Request review from a maintainer familiar with the touched area (auth, documents, signing, or Paddle).

## Security & Configuration Tips
Copy `.env.example` to `.env.local` and provide Supabase keys: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and, when required, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`. Never commit secrets; the `.env*` files are gitignored. Server-only keys belong in the Vercel dashboard or local shell exports. Webhook handlers under `app/api/` expect verified Paddle signatures—use the sandbox keys when testing locally. Keep Sentry DSN values in environment config so instrumentation hooks stay active without leaking credentials.

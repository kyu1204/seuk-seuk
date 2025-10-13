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

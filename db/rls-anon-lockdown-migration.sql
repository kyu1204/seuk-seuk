-- =============================================================================
-- RLS Anonymous Lockdown Migration — DRAFT (DO NOT APPLY DIRECTLY)
-- =============================================================================
-- Generated: 2026-07-03
-- Branch:    fix/rls-anon-lockdown
--
-- Purpose:
--   Remove the wide-open "Allow public ..." RLS policies (qual/with_check = true)
--   that let the anon publishable key read/update/delete/insert every row in
--   `documents` and `signatures`, plus the over-broad "System functions can
--   manage usage data" policy on `monthly_usage`. After this migration the only
--   remaining access is owner-scoped (auth.uid() = user_id) for authenticated
--   users; the anonymous signing flow runs exclusively through the service-role
--   client in the server actions.
--
-- *** APPLY ORDER — READ BEFORE RUNNING ***
--   Apply the CODE on branch fix/rls-anon-lockdown to production FIRST, then run
--   this migration. The anonymous signer actions
--   (saveSignature / markDocumentCompleted / getDocumentFileSignedUrl /
--    generateSignedPdf / generateSignedPdfFromPdf / createSignedDocumentUploadUrl /
--    checkAndCompletePublication) were switched to the service-role client on
--   that branch. If you drop the public policies BEFORE the code is deployed, the
--   still-anon signer paths lose their documents/signatures access and every
--   in-progress signing flow breaks.
--
-- *** AFTER APPLYING ***
--   1. Run the unauthenticated (logged-out) signing flow end-to-end:
--      open a published short URL, sign every area, submit, and confirm the
--      document reaches `completed` and the signed download works — including a
--      password-protected publication.
--   2. Re-run the Supabase security advisor (mcp get_advisors / dashboard) and
--      confirm the "anon can access documents/signatures" findings are gone.
--   3. Confirm authenticated owner flows still work: dashboard list, upload,
--      publish, delete, template publish, usage widget.
--
-- NOTE: This file performs DDL. It has NOT been executed against any database.
--       Test on a Supabase branch / staging project before production.
--
-- The whole migration runs in a single transaction: signatures policies are
-- rebuilt as DROP + CREATE, and a mid-run failure without a transaction would
-- leave signatures with no policies at all — under RLS that blocks every owner
-- flow (signature area create/read/delete) until manually repaired.
-- =============================================================================

BEGIN;


-- =============================================================================
-- (a) documents — drop the public (anon) policies. Keep the owner policies
--     ("Users can read/insert/update/delete their own documents").
-- =============================================================================
DROP POLICY IF EXISTS "Allow public read access" ON public.documents;
DROP POLICY IF EXISTS "Allow public update"      ON public.documents;
DROP POLICY IF EXISTS "Allow public delete"      ON public.documents;
DROP POLICY IF EXISTS "Allow public insert"      ON public.documents;


-- =============================================================================
-- (b) signatures — drop the public (anon) policies and add owner-scoped
--     policies. `signatures` has no user_id column, so ownership is derived from
--     the parent document. auth.uid() is wrapped in (select ...) so Postgres
--     evaluates it once per query (initplan) instead of once per row.
-- =============================================================================
DROP POLICY IF EXISTS "Allow public read access" ON public.signatures;
DROP POLICY IF EXISTS "Allow public update"      ON public.signatures;
DROP POLICY IF EXISTS "Allow public insert"      ON public.signatures;

CREATE POLICY "Users can read their own signatures" ON public.signatures
  AS PERMISSIVE FOR SELECT
  TO authenticated
  USING (
    exists (
      select 1 from public.documents d
      where d.id = signatures.document_id
        and d.user_id = (select auth.uid())
    )
  );

CREATE POLICY "Users can insert their own signatures" ON public.signatures
  AS PERMISSIVE FOR INSERT
  TO authenticated
  WITH CHECK (
    exists (
      select 1 from public.documents d
      where d.id = signatures.document_id
        and d.user_id = (select auth.uid())
    )
  );

CREATE POLICY "Users can update their own signatures" ON public.signatures
  AS PERMISSIVE FOR UPDATE
  TO authenticated
  USING (
    exists (
      select 1 from public.documents d
      where d.id = signatures.document_id
        and d.user_id = (select auth.uid())
    )
  )
  WITH CHECK (
    exists (
      select 1 from public.documents d
      where d.id = signatures.document_id
        and d.user_id = (select auth.uid())
    )
  );

CREATE POLICY "Users can delete their own signatures" ON public.signatures
  AS PERMISSIVE FOR DELETE
  TO authenticated
  USING (
    exists (
      select 1 from public.documents d
      where d.id = signatures.document_id
        and d.user_id = (select auth.uid())
    )
  );


-- =============================================================================
-- (c) monthly_usage — drop the over-broad "System functions can manage usage
--     data" policy (authenticated, FOR ALL, qual=true, with_check=true) that let
--     any logged-in user read/modify any other user's usage rows.
--
--     Owner access remains covered by:
--       - "Users can view their own usage"   (SELECT, auth.uid() = user_id)
--       - "Users can update their own usage"  (ALL,    auth.uid() = user_id)
--         → FOR ALL covers the direct INSERT/SELECT/UPDATE done by
--           subscription-actions (increment/decrementPublishedCompleted,
--           getCurrentMonthUsage, getUsageWidgetData); with_check falls back to
--           the USING qual for INSERT.
--     Service-role paths (paddle webhook, account deletion, the document status
--     trigger via service-role writes) bypass RLS entirely.
-- =============================================================================
DROP POLICY IF EXISTS "System functions can manage usage data" ON public.monthly_usage;

COMMIT;


-- =============================================================================
-- VERIFICATION QUERIES (run manually AFTER applying — SELECT only)
-- =============================================================================
-- 1. There should be NO remaining public/anon "Allow public ..." policies and
--    no permissive qual/with_check = 'true' policy on these tables:
--
--   select tablename, policyname, roles, cmd, qual, with_check
--   from pg_policies
--   where schemaname = 'public'
--     and tablename in ('documents','signatures','monthly_usage')
--     and (qual = 'true' or with_check = 'true' or roles @> '{public}')
--   order by tablename, cmd, policyname;
--   -- expected: 0 rows
--
-- 2. signatures should now have exactly the 4 owner policies below:
--
--   select policyname, cmd, roles
--   from pg_policies
--   where schemaname = 'public' and tablename = 'signatures'
--   order by cmd, policyname;
--   -- expected:
--   --   "Users can delete their own signatures" | DELETE | {authenticated}
--   --   "Users can insert their own signatures" | INSERT | {authenticated}
--   --   "Users can read their own signatures"   | SELECT | {authenticated}
--   --   "Users can update their own signatures" | UPDATE | {authenticated}
--
-- 3. Full policy dump for the three tables (sanity check):
--
--   select tablename, policyname, permissive, roles, cmd, qual, with_check
--   from pg_policies
--   where schemaname = 'public'
--     and tablename in ('documents','signatures','monthly_usage')
--   order by tablename, cmd, policyname;
-- =============================================================================

-- =============================================================================
-- RLS Performance Migration — DRAFT (DO NOT APPLY DIRECTLY TO PRODUCTION)
-- =============================================================================
-- Generated: 2026-07-03
-- Source: Supabase Performance Advisor findings on branch perf/dashboard-loading
--   - auth_rls_initplan:            27 findings (auth.<fn>() re-evaluated per row)
--   - multiple_permissive_policies: 34 findings (duplicate permissive policies
--                                    for the same table/role/action)
--   - unindexed_foreign_keys:        2 findings (FK columns without a covering index)
--   - unused_index: 13 findings — OUT OF SCOPE for this migration (separate task)
--
-- IMPORTANT — BEFORE APPLYING:
--   1. Test on a Supabase branch or staging project first
--      (supabase db branches / `supabase branches create`), never directly on prod.
--   2. Diff every rewritten policy against the "current policy" snapshot captured
--      below (queried via pg_policies on 2026-07-03) to confirm no behavioral change.
--   3. Pay special attention to the anon-facing policies on `documents` and
--      `publications` — these back the unauthenticated signing flow. Access scope
--      must be byte-for-byte identical before/after.
--   4. After applying: re-run the Supabase performance advisor and confirm
--      auth_rls_initplan / multiple_permissive_policies counts drop to the
--      expected residual (see "Manual review" section below — those are
--      intentionally NOT auto-merged).
--   5. Manually re-test the unauthenticated signing flow end-to-end
--      (view published doc via short URL, submit signature, password-protected
--      docs) since `documents`/`publications`/`signatures` anon policies changed.
--
-- Snapshot of current policies (public schema) used to derive this migration:
--   select schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
--   from pg_policies where schemaname = 'public'
--   order by tablename, cmd, policyname;
-- =============================================================================


-- =============================================================================
-- SECTION A — auth_rls_initplan fix
-- Wrap auth.uid() / auth.jwt() / auth.role() calls in `(select ...)` so Postgres
-- evaluates them once per query (initplan) instead of once per row.
-- Semantics are byte-for-byte preserved — only the evaluation strategy changes.
-- Policies that get folded into a merged policy in SECTION B are NOT repeated
-- here (see notes there); this covers the 22 policies that are NOT touched by
-- any merge.
--
-- SECTIONS A+B run inside a single transaction: each policy is rebuilt as
-- DROP + CREATE, and without a transaction a mid-run failure would leave a
-- (table, cmd) with no policy at all — under RLS that means access denied,
-- breaking e.g. the anon signing flow until manually repaired. SECTION C stays
-- outside the transaction (CREATE INDEX CONCURRENTLY cannot run inside one).
-- =============================================================================

BEGIN;

-- credit_balance ---------------------------------------------------------------
DROP POLICY IF EXISTS "Service role can manage credits" ON public.credit_balance;
CREATE POLICY "Service role can manage credits" ON public.credit_balance
  AS PERMISSIVE FOR ALL
  USING ((select auth.role()) = 'service_role'::text);

DROP POLICY IF EXISTS "Users can view own credit balance" ON public.credit_balance;
CREATE POLICY "Users can view own credit balance" ON public.credit_balance
  AS PERMISSIVE FOR SELECT
  USING ((select auth.uid()) = user_id);

-- credit_transactions ------------------------------------------------------------
DROP POLICY IF EXISTS "Service role can insert transactions" ON public.credit_transactions;
CREATE POLICY "Service role can insert transactions" ON public.credit_transactions
  AS PERMISSIVE FOR INSERT
  WITH CHECK ((select auth.role()) = 'service_role'::text);

DROP POLICY IF EXISTS "Users can view own transactions" ON public.credit_transactions;
CREATE POLICY "Users can view own transactions" ON public.credit_transactions
  AS PERMISSIVE FOR SELECT
  USING ((select auth.uid()) = user_id);

-- "System can update related_document_id for CASCADE" has qual/with_check = true
-- (no auth.*() call) — no change needed.

-- customers ------------------------------------------------------------------
DROP POLICY IF EXISTS "Users can view their own customer data" ON public.customers;
CREATE POLICY "Users can view their own customer data" ON public.customers
  AS PERMISSIVE FOR SELECT
  TO authenticated
  USING ((select auth.uid()) = user_id);

-- "Service role has full access to customers" has qual/with_check = true
-- (no auth.*() call) — no change needed.

-- document_templates ----------------------------------------------------------
DROP POLICY IF EXISTS "Users can create their own templates" ON public.document_templates;
CREATE POLICY "Users can create their own templates" ON public.document_templates
  AS PERMISSIVE FOR INSERT
  WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can view their own templates" ON public.document_templates;
CREATE POLICY "Users can view their own templates" ON public.document_templates
  AS PERMISSIVE FOR SELECT
  USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can update their own templates" ON public.document_templates;
CREATE POLICY "Users can update their own templates" ON public.document_templates
  AS PERMISSIVE FOR UPDATE
  USING ((select auth.uid()) = user_id);

-- monthly_usage ---------------------------------------------------------------
-- NOTE: "Users can update their own usage" and "Users can view their own usage"
-- overlap with the ALL-scoped "System functions can manage usage data" policy
-- (qual = true). That overlap is NOT auto-merged — see "Manual review" section
-- below. We still fix the initplan issue on each policy independently.
DROP POLICY IF EXISTS "Users can update their own usage" ON public.monthly_usage;
CREATE POLICY "Users can update their own usage" ON public.monthly_usage
  AS PERMISSIVE FOR ALL
  TO authenticated
  USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can view their own usage" ON public.monthly_usage;
CREATE POLICY "Users can view their own usage" ON public.monthly_usage
  AS PERMISSIVE FOR SELECT
  TO authenticated
  USING ((select auth.uid()) = user_id);

-- publications (delete/insert/update only — SELECT is merged in SECTION B) ----
DROP POLICY IF EXISTS "Users can delete their own publications" ON public.publications;
CREATE POLICY "Users can delete their own publications" ON public.publications
  AS PERMISSIVE FOR DELETE
  USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can create their own publications" ON public.publications;
CREATE POLICY "Users can create their own publications" ON public.publications
  AS PERMISSIVE FOR INSERT
  WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can update their own publications" ON public.publications;
CREATE POLICY "Users can update their own publications" ON public.publications
  AS PERMISSIVE FOR UPDATE
  USING ((select auth.uid()) = user_id);

-- template_signature_areas ------------------------------------------------------
DROP POLICY IF EXISTS "Users can delete their own template areas" ON public.template_signature_areas;
CREATE POLICY "Users can delete their own template areas" ON public.template_signature_areas
  AS PERMISSIVE FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM document_templates t
    WHERE t.id = template_signature_areas.template_id
      AND t.user_id = (select auth.uid())
  ));

DROP POLICY IF EXISTS "Users can create their own template areas" ON public.template_signature_areas;
CREATE POLICY "Users can create their own template areas" ON public.template_signature_areas
  AS PERMISSIVE FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM document_templates t
    WHERE t.id = template_signature_areas.template_id
      AND t.user_id = (select auth.uid())
  ));

DROP POLICY IF EXISTS "Users can view their own template areas" ON public.template_signature_areas;
CREATE POLICY "Users can view their own template areas" ON public.template_signature_areas
  AS PERMISSIVE FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM document_templates t
    WHERE t.id = template_signature_areas.template_id
      AND t.user_id = (select auth.uid())
  ));

DROP POLICY IF EXISTS "Users can update their own template areas" ON public.template_signature_areas;
CREATE POLICY "Users can update their own template areas" ON public.template_signature_areas
  AS PERMISSIVE FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM document_templates t
    WHERE t.id = template_signature_areas.template_id
      AND t.user_id = (select auth.uid())
  ));

-- users ------------------------------------------------------------------------
DROP POLICY IF EXISTS "Users can insert own profile." ON public.users;
CREATE POLICY "Users can insert own profile." ON public.users
  AS PERMISSIVE FOR INSERT
  WITH CHECK ((select auth.uid()) = id);

DROP POLICY IF EXISTS "Users can view own profile." ON public.users;
CREATE POLICY "Users can view own profile." ON public.users
  AS PERMISSIVE FOR SELECT
  USING ((select auth.uid()) = id);

DROP POLICY IF EXISTS "Users can update own profile." ON public.users;
CREATE POLICY "Users can update own profile." ON public.users
  AS PERMISSIVE FOR UPDATE
  USING ((select auth.uid()) = id);

-- subscriptions ------------------------------------------------------------------
DROP POLICY IF EXISTS "Users can view their own subscriptions" ON public.subscriptions;
CREATE POLICY "Users can view their own subscriptions" ON public.subscriptions
  AS PERMISSIVE FOR SELECT
  TO authenticated
  USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can update their own subscriptions" ON public.subscriptions;
CREATE POLICY "Users can update their own subscriptions" ON public.subscriptions
  AS PERMISSIVE FOR UPDATE
  TO authenticated
  USING ((select auth.uid()) = user_id);


-- =============================================================================
-- SECTION B — multiple_permissive_policies fix (safe merges only)
-- Postgres already OR-combines multiple PERMISSIVE policies for the same
-- table/role/command at query time — merging them into a single policy with an
-- explicit OR does not change *what* rows are visible/writable, only *how many*
-- separate policy evaluations Postgres has to perform per row. Each merge below
-- is only applied where both source policies target the exact same command
-- (no ALL-scoped policy involved), so the OR-combination is a pure, provable
-- simplification with zero behavioral change.
-- =============================================================================

-- documents ----------------------------------------------------------------
-- DELETE: "Allow public delete" (qual = true) OR "Users can delete their own
-- documents" (qual = auth.uid() = user_id) simplifies to `true` (true OR x = true).
-- This exactly matches current combined behavior for anon/authenticated alike.
DROP POLICY IF EXISTS "Allow public delete" ON public.documents;
DROP POLICY IF EXISTS "Users can delete their own documents" ON public.documents;
CREATE POLICY "documents_delete_access" ON public.documents
  AS PERMISSIVE FOR DELETE
  USING (true);

-- INSERT: "Allow public insert" (with_check = true) OR "Users can insert their
-- own documents" (with_check = auth.uid() = user_id) simplifies to `true`.
DROP POLICY IF EXISTS "Allow public insert" ON public.documents;
DROP POLICY IF EXISTS "Users can insert their own documents" ON public.documents;
CREATE POLICY "documents_insert_access" ON public.documents
  AS PERMISSIVE FOR INSERT
  WITH CHECK (true);

-- SELECT: "Allow public read access" (qual = true) OR "Users can read their own
-- documents" (qual = auth.uid() = user_id) simplifies to `true`. This preserves
-- the unauthenticated signing flow's ability to read published documents.
DROP POLICY IF EXISTS "Allow public read access" ON public.documents;
DROP POLICY IF EXISTS "Users can read their own documents" ON public.documents;
CREATE POLICY "documents_select_access" ON public.documents
  AS PERMISSIVE FOR SELECT
  USING (true);

-- UPDATE: "Allow public update" (qual = true, with_check defaults to qual = true
-- per Postgres UPDATE-policy fallback rule) OR "Users can update their own
-- documents" (qual = with_check = auth.uid() = user_id) simplifies to `true`/`true`.
DROP POLICY IF EXISTS "Allow public update" ON public.documents;
DROP POLICY IF EXISTS "Users can update their own documents" ON public.documents;
CREATE POLICY "documents_update_access" ON public.documents
  AS PERMISSIVE FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- publications ----------------------------------------------------------------
-- SELECT: "Public can view active publications" (qual = status = 'active') OR
-- "Users can view their own publications" (qual = auth.uid() = user_id). Unlike
-- the documents merges above, this is a REAL (non-trivial) OR — neither side is
-- unconditionally true. For anon requests auth.uid() is null, so the second
-- disjunct is never true and the effective condition for anon is unchanged
-- (status = 'active'). For authenticated owners, both disjuncts are preserved
-- exactly as before.
DROP POLICY IF EXISTS "Public can view active publications" ON public.publications;
DROP POLICY IF EXISTS "Users can view their own publications" ON public.publications;
CREATE POLICY "publications_select_access" ON public.publications
  AS PERMISSIVE FOR SELECT
  USING (
    (status)::text = 'active'::text
    OR (select auth.uid()) = user_id
  );


-- =============================================================================
-- MANUAL REVIEW REQUIRED — NOT merged in this migration
-- =============================================================================
-- The following multiple_permissive_policies groups mix an ALL-scoped policy
-- with a command-specific policy. Merging them safely requires first splitting
-- the ALL policy into per-command (SELECT/INSERT/UPDATE/DELETE) policies so the
-- merge only touches the overlapping command — otherwise the ALL policy would
-- keep firing for every command anyway, and a naive OR-merge of just the
-- overlapping command would not eliminate the duplicate-policy overhead for the
-- other commands. Both tables involved (credit_balance, monthly_usage) are
-- financial/usage-accounting tables, so we are deliberately not attempting an
-- automatic split-and-merge here — do this as a separate, carefully reviewed
-- change.
--
-- 1) credit_balance / SELECT (5 advisor line-items: anon, authenticated,
--    authenticator, dashboard_user, supabase_privileged_role):
--      - "Service role can manage credits"   (FOR ALL,    qual: auth.role() = 'service_role')
--      - "Users can view own credit balance" (FOR SELECT, qual: auth.uid() = user_id)
--    Both are already rewritten with (select ...) wrapping in SECTION A above,
--    but remain two separate policies pending a manual split/merge decision.
--
-- 2) monthly_usage / DELETE, INSERT, SELECT, UPDATE (4 advisor line-items, all
--    role authenticated):
--      - "System functions can manage usage data" (FOR ALL,    qual: true)
--      - "Users can update their own usage"        (FOR ALL,    qual: auth.uid() = user_id)
--      - "Users can view their own usage"          (FOR SELECT, qual: auth.uid() = user_id)
--    Note "System functions can manage usage data" already has qual = true,
--    meaning any authenticated caller currently has unrestricted access to this
--    table regardless of ownership — this pre-existing over-broad grant is out
--    of scope for this migration; flagging it here for the reviewer's awareness
--    since it affects how safe/meaningful a future merge would be.
-- =============================================================================

COMMIT;


-- =============================================================================
-- SECTION C — unindexed_foreign_keys fix
-- Add covering indexes for FK columns flagged by the advisor.
-- Uses CONCURRENTLY to avoid locking the table during index build; note that
-- CREATE INDEX CONCURRENTLY cannot run inside a transaction block — if applying
-- via a migration runner that wraps migrations in a transaction, split this
-- section into its own non-transactional migration/run.
-- =============================================================================

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_credit_transactions_related_document_id
  ON public.credit_transactions (related_document_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_subscriptions_plan_id
  ON public.subscriptions (plan_id);


-- =============================================================================
-- VERIFICATION QUERIES — run after applying, before/after advisor re-run
-- =============================================================================

-- 1) Confirm no policy still calls auth.uid()/auth.jwt()/auth.role() unwrapped
--    (i.e. NOT preceded by "select "). Should return 0 rows once fully applied,
--    EXCEPT for the two "Manual review" policies noted above, which are already
--    wrapped individually but still flagged by multiple_permissive_policies.
--
-- NOTE: pg_policies deparses expressions via pg_get_expr, so casing/whitespace
-- vary and the auth. schema prefix may be stripped depending on search_path.
-- The pattern below is case-insensitive and tolerates both variations.
--
-- select schemaname, tablename, policyname, cmd, qual, with_check
-- from pg_policies
-- where schemaname = 'public'
--   and (
--     (qual ~* '(auth\.)?(uid|jwt|role)\s*\(\)'
--       and qual !~* '\(\s*select\s+(auth\.)?(uid|jwt|role)\s*\(\)\s*\)')
--     or (with_check ~* '(auth\.)?(uid|jwt|role)\s*\(\)'
--       and with_check !~* '\(\s*select\s+(auth\.)?(uid|jwt|role)\s*\(\)\s*\)')
--   );

-- 2) Count remaining policies per table/cmd — multiple_permissive_policies
--    should now show at most 1 permissive policy per (table, cmd) except the
--    two manual-review tables (credit_balance, monthly_usage) noted above.
--
-- select tablename, cmd, count(*) as policy_count,
--        array_agg(policyname) as policies
-- from pg_policies
-- where schemaname = 'public' and permissive = 'PERMISSIVE'
-- group by tablename, cmd
-- having count(*) > 1
-- order by tablename, cmd;

-- 3) Confirm new indexes exist and are valid (not left invalid from a failed
--    CONCURRENTLY build):
--
-- select indexrelid::regclass as index_name, indisvalid
-- from pg_index
-- where indexrelid::regclass::text in (
--   'public.idx_credit_transactions_related_document_id',
--   'public.idx_subscriptions_plan_id'
-- );

-- 4) Re-run supabase MCP get_advisors(type: "performance") and confirm:
--    auth_rls_initplan -> 0 (or matches only intentionally-skipped manual-review
--    policies, which should already be 0 since those ARE wrapped),
--    multiple_permissive_policies -> 9 (5 credit_balance + 4 monthly_usage,
--    pending manual follow-up), unindexed_foreign_keys -> 0.

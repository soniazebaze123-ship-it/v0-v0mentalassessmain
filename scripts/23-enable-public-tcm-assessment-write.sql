-- Ensure TCM questionnaire assessments can be written by the app client.
-- This project uses custom app auth (not Supabase auth sessions) for patient flows,
-- so auth.uid()-based insert policies can block writes from anon/authenticated clients.

alter table if exists public.tcm_assessments enable row level security;

drop policy if exists "Allow all access to tcm_assessments" on public.tcm_assessments;
create policy "Allow all access to tcm_assessments"
  on public.tcm_assessments
  for all
  to anon, authenticated
  using (true)
  with check (true);

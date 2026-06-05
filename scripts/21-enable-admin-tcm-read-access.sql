-- Enable admin dashboard read access for TCM tables when using anon key in client-side admin panel.
-- WARNING: This grants read access to all users using anon role. Use only in trusted/internal deployments.

do $$
begin
	if to_regclass('public.tcm_assessments') is not null then
		execute 'alter table public.tcm_assessments enable row level security';
		execute 'drop policy if exists "Admin dashboard can read all tcm assessments" on public.tcm_assessments';
		execute 'create policy "Admin dashboard can read all tcm assessments" on public.tcm_assessments for select to anon, authenticated using (true)';
	end if;

	if to_regclass('public.tcm_constitution_results') is not null then
		execute 'alter table public.tcm_constitution_results enable row level security';
		execute 'drop policy if exists "Admin dashboard can read all legacy tcm results" on public.tcm_constitution_results';
		execute 'create policy "Admin dashboard can read all legacy tcm results" on public.tcm_constitution_results for select to anon, authenticated using (true)';
	end if;

	if to_regclass('public.assessment_sessions') is not null then
		execute 'alter table public.assessment_sessions enable row level security';
		execute 'drop policy if exists "Admin dashboard can read assessment sessions" on public.assessment_sessions';
		execute 'create policy "Admin dashboard can read assessment sessions" on public.assessment_sessions for select to anon, authenticated using (true)';
	end if;

	if to_regclass('public.tcm_doctor_reviews') is not null then
		execute 'alter table public.tcm_doctor_reviews enable row level security';
		execute 'drop policy if exists "Admin dashboard can read tcm doctor reviews" on public.tcm_doctor_reviews';
		execute 'create policy "Admin dashboard can read tcm doctor reviews" on public.tcm_doctor_reviews for select to anon, authenticated using (true)';
	end if;

	if to_regclass('public.medical_reports') is not null then
		execute 'alter table public.medical_reports enable row level security';
		execute 'drop policy if exists "Admin dashboard can read medical reports" on public.medical_reports';
		execute 'create policy "Admin dashboard can read medical reports" on public.medical_reports for select to anon, authenticated using (true)';
	end if;
end $$;

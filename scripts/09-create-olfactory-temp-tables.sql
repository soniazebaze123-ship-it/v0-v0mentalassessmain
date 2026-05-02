-- Temporary premium olfactory protocol tables (separate from Odofin)

create table if not exists public.olfactory_temp_tests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid null,
  patient_id text null,
  language text not null,
  test_name text not null,
  tested_at timestamptz not null default now(),
  notes text null,
  total_questions int not null,
  correct_count int not null,
  score_percent int not null,
  risk_level text not null,
  interpretation_en text not null,
  interpretation_zh text not null,
  interpretation_fr text not null,
  raw_result_json jsonb not null,
  created_at timestamptz not null default now()
);

create table if not exists public.olfactory_temp_test_items (
  id uuid primary key default gen_random_uuid(),
  test_id uuid not null references public.olfactory_temp_tests(id) on delete cascade,
  question_id int not null,
  scent_key text not null,
  selected_answer text null,
  correct_answer text not null,
  is_correct boolean not null,
  confidence int null,
  response_time_ms int null,
  created_at timestamptz not null default now()
);

create index if not exists idx_olfactory_temp_tests_user_id
  on public.olfactory_temp_tests(user_id);

create index if not exists idx_olfactory_temp_test_items_test_id
  on public.olfactory_temp_test_items(test_id);

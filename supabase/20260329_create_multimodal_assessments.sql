create extension if not exists pgcrypto;

create table if not exists public.multimodal_assessments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  eeg_input jsonb not null,
  sensory_input jsonb not null,
  blood_input jsonb not null,
  result_payload jsonb not null,
  cognitive_band text not null,
  probable_ad_profile boolean not null default false,
  mixed_non_ad_pattern boolean not null default false,
  specialist_referral boolean not null default false,
  risk_percent numeric(5,2),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists multimodal_assessments_user_id_idx
  on public.multimodal_assessments(user_id);

create index if not exists multimodal_assessments_cognitive_band_idx
  on public.multimodal_assessments(cognitive_band);

create index if not exists multimodal_assessments_created_at_idx
  on public.multimodal_assessments(created_at);

alter table public.multimodal_assessments enable row level security;

drop policy if exists "Users can view their own multimodal assessments" on public.multimodal_assessments;
drop policy if exists "Users can insert their own multimodal assessments" on public.multimodal_assessments;
drop policy if exists "Allow all access to multimodal_assessments" on public.multimodal_assessments;

create policy "Allow all access to multimodal_assessments"
  on public.multimodal_assessments
  for all
  using (true)
  with check (true);
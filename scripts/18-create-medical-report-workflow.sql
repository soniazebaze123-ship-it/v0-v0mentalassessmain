-- Medical report workflow tables for individualized TCM doctor review.
-- Run this in Supabase SQL Editor before using the admin workflow actions.

create table if not exists tcm_doctor_reviews (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  doctor_id uuid null references users(id) on delete set null,
  tcm_constitution text,
  tongue_observation text,
  face_observation text,
  questionnaire_interpretation text,
  tcm_diagnosis text,
  therapy_plan text,
  dietary_advice text,
  follow_up_recommendation text,
  doctor_name text,
  review_date date,
  review_status text not null default 'draft' check (review_status in ('draft', 'reviewed')),
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists medical_reports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  language text not null default 'zh-CN' check (language in ('en', 'zh-CN', 'zh-HK', 'fr')),
  report_status text not null default 'incomplete' check (
    report_status in (
      'incomplete',
      'pending_tcm_review',
      'tcm_reviewed',
      'pending_final_approval',
      'approved',
      'published_to_patient'
    )
  ),
  cognitive_summary text,
  sensory_summary text,
  tcm_summary text,
  final_diagnostic_analysis text,
  treatment_recommendation text,
  doctor_approved_by uuid null references users(id) on delete set null,
  approved_at timestamptz,
  published_to_patient_at timestamptz,
  pdf_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id)
);

create table if not exists report_download_logs (
  id uuid primary key default gen_random_uuid(),
  medical_report_id uuid not null references medical_reports(id) on delete cascade,
  user_id uuid not null references users(id) on delete cascade,
  downloaded_by_role text not null default 'patient' check (downloaded_by_role in ('patient', 'admin', 'doctor')),
  downloaded_at timestamptz not null default now()
);

create index if not exists idx_tcm_doctor_reviews_user_id on tcm_doctor_reviews(user_id);
create index if not exists idx_medical_reports_user_id on medical_reports(user_id);
create index if not exists idx_medical_reports_status on medical_reports(report_status);
create index if not exists idx_report_download_logs_report_id on report_download_logs(medical_report_id);

create or replace function set_updated_at_timestamp()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_tcm_doctor_reviews_updated_at on tcm_doctor_reviews;
create trigger trg_tcm_doctor_reviews_updated_at
before update on tcm_doctor_reviews
for each row execute function set_updated_at_timestamp();

drop trigger if exists trg_medical_reports_updated_at on medical_reports;
create trigger trg_medical_reports_updated_at
before update on medical_reports
for each row execute function set_updated_at_timestamp();

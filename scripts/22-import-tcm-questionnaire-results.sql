-- Import TCM questionnaire results into public.tcm_assessments.
--
-- How to use:
-- 1) Paste your source rows into temp_tcm_import_staging.
-- 2) Run this full script in Supabase SQL Editor.
-- 3) Check the unmatched section and final verification counts.

begin;

create temporary table temp_tcm_import_staging (
  source_user_id uuid,
  source_national_id text,
  source_phone text,
  completed_at timestamptz,

  primary_constitution text not null,
  primary_score numeric(5,2) not null,

  balanced_score numeric(5,2),
  qi_deficiency_score numeric(5,2),
  yang_deficiency_score numeric(5,2),
  yin_deficiency_score numeric(5,2),
  phlegm_dampness_score numeric(5,2),
  damp_heat_score numeric(5,2),
  blood_stasis_score numeric(5,2),
  qi_stagnation_score numeric(5,2),
  special_constitution_score numeric(5,2),

  overall_score integer,

  questionnaire jsonb,
  recommendations jsonb,

  pulse_assessment jsonb,
  tongue_image_url text,
  face_image_url text
) on commit drop;

-- Paste data here. Keep only one of source_user_id / source_national_id / source_phone if needed.
-- Example:
-- insert into temp_tcm_import_staging (
--   source_national_id,
--   completed_at,
--   primary_constitution,
--   primary_score,
--   balanced_score,
--   qi_deficiency_score,
--   yang_deficiency_score,
--   yin_deficiency_score,
--   phlegm_dampness_score,
--   damp_heat_score,
--   blood_stasis_score,
--   qi_stagnation_score,
--   special_constitution_score,
--   overall_score,
--   questionnaire,
--   recommendations,
--   pulse_assessment,
--   tongue_image_url,
--   face_image_url
-- ) values
-- (
--   'A123456789',
--   '2026-01-15T10:30:00Z',
--   'qi_deficiency',
--   72.5,
--   38.2,
--   72.5,
--   40.0,
--   45.0,
--   35.0,
--   30.0,
--   28.0,
--   33.0,
--   26.0,
--   61,
--   '{"q1":4,"q2":3,"q3":2}',
--   '["Avoid cold foods","Sleep earlier"]',
--   '{"selectedPulseIds":["slippery"],"severity":"mild"}',
--   null,
--   null
-- );

-- Preview unresolved rows before import.
with normalized_users as (
  select
    u.id,
    u.national_id,
    regexp_replace(coalesce(u.phone_number, ''), '[^0-9]', '', 'g') as phone_digits
  from public.users u
), matched as (
  select
    s.*,
    nu.id as matched_user_id
  from temp_tcm_import_staging s
  left join normalized_users nu
    on (
      s.source_user_id is not null
      and nu.id = s.source_user_id
    )
    or (
      s.source_user_id is null
      and s.source_national_id is not null
      and nu.national_id = s.source_national_id
    )
    or (
      s.source_user_id is null
      and s.source_national_id is null
      and coalesce(s.source_phone, '') <> ''
      and nu.phone_digits = regexp_replace(coalesce(s.source_phone, ''), '[^0-9]', '', 'g')
    )
)
select
  source_user_id,
  source_national_id,
  source_phone,
  primary_constitution,
  completed_at
from matched
where matched_user_id is null;

-- Insert matched rows into tcm_assessments.
with normalized_users as (
  select
    u.id,
    u.national_id,
    regexp_replace(coalesce(u.phone_number, ''), '[^0-9]', '', 'g') as phone_digits
  from public.users u
), matched as (
  select
    s.*,
    nu.id as matched_user_id
  from temp_tcm_import_staging s
  join normalized_users nu
    on (
      s.source_user_id is not null
      and nu.id = s.source_user_id
    )
    or (
      s.source_user_id is null
      and s.source_national_id is not null
      and nu.national_id = s.source_national_id
    )
    or (
      s.source_user_id is null
      and s.source_national_id is null
      and coalesce(s.source_phone, '') <> ''
      and nu.phone_digits = regexp_replace(coalesce(s.source_phone, ''), '[^0-9]', '', 'g')
    )
), prepared as (
  select
    matched_user_id as user_id,
    primary_constitution,
    primary_score,
    coalesce(balanced_score, 0) as balanced_score,
    coalesce(qi_deficiency_score, 0) as qi_deficiency_score,
    coalesce(yang_deficiency_score, 0) as yang_deficiency_score,
    coalesce(yin_deficiency_score, 0) as yin_deficiency_score,
    coalesce(phlegm_dampness_score, 0) as phlegm_dampness_score,
    coalesce(damp_heat_score, 0) as damp_heat_score,
    coalesce(blood_stasis_score, 0) as blood_stasis_score,
    coalesce(qi_stagnation_score, 0) as qi_stagnation_score,
    coalesce(special_constitution_score, 0) as special_constitution_score,
    coalesce(overall_score, 0) as overall_score,
    jsonb_build_object(
      'questionnaire', coalesce(questionnaire, '{}'::jsonb),
      'pulse_assessment', coalesce(pulse_assessment, '{}'::jsonb),
      'tongue_image_url', tongue_image_url,
      'face_image_url', face_image_url
    ) as answers,
    coalesce(recommendations, '[]'::jsonb) as recommendations,
    coalesce(completed_at, now()) as completed_at
  from matched
)
insert into public.tcm_assessments (
  user_id,
  primary_constitution,
  primary_score,
  balanced_score,
  qi_deficiency_score,
  yang_deficiency_score,
  yin_deficiency_score,
  phlegm_dampness_score,
  damp_heat_score,
  blood_stasis_score,
  qi_stagnation_score,
  special_constitution_score,
  answers,
  recommendations,
  overall_score,
  completed_at,
  created_at,
  updated_at
)
select
  p.user_id,
  p.primary_constitution,
  p.primary_score,
  p.balanced_score,
  p.qi_deficiency_score,
  p.yang_deficiency_score,
  p.yin_deficiency_score,
  p.phlegm_dampness_score,
  p.damp_heat_score,
  p.blood_stasis_score,
  p.qi_stagnation_score,
  p.special_constitution_score,
  p.answers,
  p.recommendations,
  p.overall_score,
  p.completed_at,
  p.completed_at,
  p.completed_at
from prepared p
where not exists (
  select 1
  from public.tcm_assessments t
  where t.user_id = p.user_id
    and t.primary_constitution = p.primary_constitution
    and t.primary_score = p.primary_score
    and t.completed_at = p.completed_at
);

-- Verification.
select count(*) as tcm_assessment_rows from public.tcm_assessments;

select
  u.id as user_id,
  coalesce(u.chinese_name, u.name, u.phone_number) as user_name,
  t.primary_constitution,
  t.primary_score,
  t.overall_score,
  t.completed_at
from public.tcm_assessments t
join public.users u on u.id = t.user_id
order by t.completed_at desc
limit 200;

commit;

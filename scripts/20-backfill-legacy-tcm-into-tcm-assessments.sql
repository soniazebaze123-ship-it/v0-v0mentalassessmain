-- Backfill old-build TCM rows into tcm_assessments.
-- Safe to run multiple times: only inserts rows not previously backfilled.

do $$
begin
  if to_regclass('public.tcm_assessments') is null then
    raise exception 'Table public.tcm_assessments does not exist';
  end if;

  if to_regclass('public.tcm_constitution_results') is null
     or to_regclass('public.assessment_sessions') is null then
    raise notice 'Skipping backfill: legacy tables are not available in this project.';
    return;
  end if;

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
  with legacy_rows as (
    select
      l.id as legacy_id,
      l.session_id,
      s.patient_id as user_id,
      coalesce(s.completed_at, s.test_date, l.updated_at, l.created_at) as completed_at,
      coalesce(l.constitution_primary, l.constitution_secondary, 'Unknown') as primary_constitution,
      coalesce(l.questionnaire, '{}'::jsonb) as questionnaire,
      nullif(trim(l.clinician_comment), '') as clinician_comment,
      l.tongue_image_uri,
      l.facial_image_uri,
      l.created_at,
      l.updated_at
    from public.tcm_constitution_results l
    join public.assessment_sessions s on s.id = l.session_id
  ),
  missing_rows as (
    select lr.*
    from legacy_rows lr
    where not exists (
      select 1
      from public.tcm_assessments t
      where t.answers ->> 'legacy_source' = 'tcm_constitution_results'
        and t.answers ->> 'legacy_source_id' = lr.legacy_id::text
    )
  )
  select
    mr.user_id,
    mr.primary_constitution,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    jsonb_build_object(
      'questionnaire', mr.questionnaire,
      'tongue_image_url', mr.tongue_image_uri,
      'face_image_url', mr.facial_image_uri,
      'legacy_source', 'tcm_constitution_results',
      'legacy_source_id', mr.legacy_id,
      'legacy_session_id', mr.session_id
    ),
    case
      when mr.clinician_comment is null then '[]'::jsonb
      else jsonb_build_array(mr.clinician_comment)
    end,
    0,
    mr.completed_at,
    coalesce(mr.created_at, now()),
    coalesce(mr.updated_at, now())
  from missing_rows mr;
end $$;

-- Optional quick verification after running:
-- select count(*) as migrated_rows
-- from public.tcm_assessments
-- where answers ->> 'legacy_source' = 'tcm_constitution_results';

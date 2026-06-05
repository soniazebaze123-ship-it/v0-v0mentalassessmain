-- Unified TCM results view combining old-build and new-build storage paths.
-- This makes it easy to query every patient TCM result from one place.

do $$
begin
  if to_regclass('public.tcm_assessments') is null then
    raise exception 'Table public.tcm_assessments does not exist';
  end if;

  if to_regclass('public.tcm_constitution_results') is not null
     and to_regclass('public.assessment_sessions') is not null then
    execute $view$
      create or replace view public.unified_tcm_results as
      select
        'new_build'::text as source_build,
        t.id as source_id,
        t.user_id,
        null::uuid as session_id,
        t.completed_at,
        t.primary_constitution,
        t.primary_score,
        t.overall_score,
        t.answers -> 'questionnaire' as questionnaire,
        t.recommendations,
        t.answers ->> 'tongue_image_url' as tongue_image_url,
        t.answers ->> 'face_image_url' as face_image_url,
        null::text as clinician_comment,
        t.created_at,
        t.updated_at
      from public.tcm_assessments t
      union all
      select
        'old_build'::text as source_build,
        l.id as source_id,
        s.patient_id as user_id,
        l.session_id,
        coalesce(s.completed_at, s.test_date, l.updated_at, l.created_at) as completed_at,
        coalesce(l.constitution_primary, l.constitution_secondary, 'Unknown') as primary_constitution,
        null::numeric as primary_score,
        null::integer as overall_score,
        l.questionnaire,
        null::jsonb as recommendations,
        l.tongue_image_uri as tongue_image_url,
        l.facial_image_uri as face_image_url,
        l.clinician_comment,
        l.created_at,
        l.updated_at
      from public.tcm_constitution_results l
      join public.assessment_sessions s on s.id = l.session_id
    $view$;
  else
    execute $view$
      create or replace view public.unified_tcm_results as
      select
        'new_build'::text as source_build,
        t.id as source_id,
        t.user_id,
        null::uuid as session_id,
        t.completed_at,
        t.primary_constitution,
        t.primary_score,
        t.overall_score,
        t.answers -> 'questionnaire' as questionnaire,
        t.recommendations,
        t.answers ->> 'tongue_image_url' as tongue_image_url,
        t.answers ->> 'face_image_url' as face_image_url,
        null::text as clinician_comment,
        t.created_at,
        t.updated_at
      from public.tcm_assessments t
    $view$;
  end if;
end $$;

comment on view public.unified_tcm_results is
'All TCM results across old_build (tcm_constitution_results) and new_build (tcm_assessments).';

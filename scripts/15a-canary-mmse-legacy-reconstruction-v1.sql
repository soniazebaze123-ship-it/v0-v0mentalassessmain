-- ============================================================================
-- CANARY MIGRATION: MMSE legacy reconstruction (sample cohort only)
-- File: 15a-canary-mmse-legacy-reconstruction-v1.sql
-- Purpose:
--   1) Create the same metadata columns/audit table/functions as full migration
--   2) Reconstruct ONLY a small sample of pending MMSE rows (default: 10)
--   3) Allow validation before full cohort execution
-- ============================================================================

BEGIN;

-- --------------------------------------------------------------------------
-- 1) Add versioned scoring metadata columns (idempotent)
-- --------------------------------------------------------------------------
ALTER TABLE public.assessments
  ADD COLUMN IF NOT EXISTS score_legacy INTEGER,
  ADD COLUMN IF NOT EXISTS max_score INTEGER,
  ADD COLUMN IF NOT EXISTS score_percent NUMERIC(5,2),
  ADD COLUMN IF NOT EXISTS scoring_version TEXT,
  ADD COLUMN IF NOT EXISTS scoring_framework TEXT,
  ADD COLUMN IF NOT EXISTS reconstruction_applied BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS recalculated_at TIMESTAMPTZ;

UPDATE public.assessments
SET max_score = CASE
  WHEN UPPER(type) = 'MMSE' THEN 22
  WHEN UPPER(type) IN ('MOCA') THEN 30
  ELSE COALESCE(max_score, 100)
END
WHERE max_score IS NULL;

-- --------------------------------------------------------------------------
-- 2) Audit table and safe parser helper
-- --------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.mmse_reconstruction_audit (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  assessment_id UUID NOT NULL,
  run_label TEXT NOT NULL,
  run_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  old_score INTEGER,
  new_score INTEGER,

  old_score_legacy INTEGER,
  new_score_legacy INTEGER,

  old_max_score INTEGER,
  new_max_score INTEGER,

  old_score_percent NUMERIC(5,2),
  new_score_percent NUMERIC(5,2),

  old_scoring_version TEXT,
  new_scoring_version TEXT,

  old_scoring_framework TEXT,
  new_scoring_framework TEXT,

  old_reconstruction_applied BOOLEAN,
  new_reconstruction_applied BOOLEAN,

  old_recalculated_at TIMESTAMPTZ,
  new_recalculated_at TIMESTAMPTZ,

  old_data JSONB,
  new_data JSONB
);

CREATE INDEX IF NOT EXISTS mmse_reconstruction_audit_assessment_id_idx
  ON public.mmse_reconstruction_audit(assessment_id);

CREATE INDEX IF NOT EXISTS mmse_reconstruction_audit_run_label_idx
  ON public.mmse_reconstruction_audit(run_label);

CREATE OR REPLACE FUNCTION public.try_int(input_text TEXT)
RETURNS INTEGER
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
  RETURN NULLIF(BTRIM(input_text), '')::INTEGER;
EXCEPTION
  WHEN OTHERS THEN
    RETURN NULL;
END;
$$;

-- --------------------------------------------------------------------------
-- 3) Canary subset selection and reconstruction
-- --------------------------------------------------------------------------
WITH params AS (
  SELECT
    'MMSE_RECON_CANARY_V1_2026_05_22'::TEXT AS run_label,
    'MMSE_v1_reconstructed_30'::TEXT AS scoring_version,
    'MentalAssess MMSE Legacy Cohort Recalculation v1 (CANARY)'::TEXT AS scoring_framework
),
canary_ids AS (
  SELECT a.id
  FROM public.assessments a
  WHERE UPPER(a.type) = 'MMSE'
    AND COALESCE(a.reconstruction_applied, false) = false
  ORDER BY a.completed_at ASC NULLS LAST, a.id
  LIMIT 10
),
source AS (
  SELECT
    a.id,
    a.score,
    a.score_legacy,
    a.max_score,
    a.score_percent,
    a.scoring_version,
    a.scoring_framework,
    a.reconstruction_applied,
    a.recalculated_at,
    COALESCE(a.data, '{}'::JSONB) AS d
  FROM public.assessments a
  JOIN canary_ids c ON c.id = a.id
),
calc AS (
  SELECT
    s.*,
    LEAST(5, GREATEST(0,
      COALESCE(
        public.try_int(s.d->>'orientation_time'),
        LEAST(5, COALESCE(public.try_int(s.d->>'orientation'), 0))
      )
    )) AS orientation_time_score,

    CASE
      WHEN (s.d ? 'orientation_country' OR s.d ? 'orientation_president' OR s.d ? 'orientation_sea') THEN
        LEAST(5, GREATEST(0,
          2 * COALESCE(public.try_int(s.d->>'orientation_country'), 0) +
              COALESCE(public.try_int(s.d->>'orientation_president'), 0) +
          2 * COALESCE(public.try_int(s.d->>'orientation_sea'), 0)
        ))
      ELSE
        LEAST(5, GREATEST(0,
          COALESCE(
            public.try_int(s.d->>'orientation_place'),
            GREATEST(
              COALESCE(public.try_int(s.d->>'orientation'), 0) -
              LEAST(5, COALESCE(public.try_int(s.d->>'orientation'), 0)),
              0
            )
          )
        ))
    END AS orientation_place_score,

    LEAST(3, GREATEST(0, COALESCE(public.try_int(s.d->>'registration'), public.try_int(s.d->>'memory_registration'), 0))) AS registration_score,
    LEAST(3, GREATEST(0, COALESCE(public.try_int(s.d->>'delayed_recall'), public.try_int(s.d->>'recall'), public.try_int(s.d->>'vocal_recall_task'), public.try_int(s.d->>'memory_recall'), 0))) AS recall_score,
    LEAST(5, GREATEST(0, COALESCE(public.try_int(s.d->>'attention'), public.try_int(s.d->>'attention_calc'), 0))) AS attention_score,

    CASE
      WHEN COALESCE(public.try_int(s.d->>'naming'), public.try_int(s.d->>'object_naming'), 0) >= 7 THEN 3
      WHEN COALESCE(public.try_int(s.d->>'naming'), public.try_int(s.d->>'object_naming'), 0) >= 5 THEN 2
      WHEN COALESCE(public.try_int(s.d->>'naming'), public.try_int(s.d->>'object_naming'), 0) >= 3 THEN 1
      ELSE 0
    END AS naming_score,

    LEAST(3, GREATEST(0, COALESCE(public.try_int(s.d->>'repetition_extended'), public.try_int(s.d->>'repetition_vocal'), public.try_int(s.d->>'repetition'), 0))) AS repetition_score,
    LEAST(2, GREATEST(0, COALESCE(public.try_int(s.d->>'writing'), public.try_int(s.d->>'writing_task'), 0))) AS writing_score,
    LEAST(1, GREATEST(0, COALESCE(public.try_int(s.d->>'copying'), public.try_int(s.d->>'copying_design'), 0))) AS copying_score
  FROM source s
),
prepared AS (
  SELECT
    c.id,
    c.score AS old_score,
    c.score_legacy AS old_score_legacy,
    c.max_score AS old_max_score,
    c.score_percent AS old_score_percent,
    c.scoring_version AS old_scoring_version,
    c.scoring_framework AS old_scoring_framework,
    c.reconstruction_applied AS old_reconstruction_applied,
    c.recalculated_at AS old_recalculated_at,
    c.d AS old_data,

    (
      c.orientation_time_score +
      c.orientation_place_score +
      c.registration_score +
      c.recall_score +
      c.attention_score +
      c.naming_score +
      c.repetition_score +
      c.writing_score +
      c.copying_score
    ) AS new_score,

    COALESCE(c.score_legacy, c.score) AS new_score_legacy,
    30 AS new_max_score,
    ROUND((
      (
        c.orientation_time_score +
        c.orientation_place_score +
        c.registration_score +
        c.recall_score +
        c.attention_score +
        c.naming_score +
        c.repetition_score +
        c.writing_score +
        c.copying_score
      )::NUMERIC / 30.0
    ) * 100.0, 2) AS new_score_percent,
    p.scoring_version AS new_scoring_version,
    p.scoring_framework AS new_scoring_framework,
    true AS new_reconstruction_applied,
    NOW() AS new_recalculated_at,

    c.d || jsonb_build_object(
      'legacy_mmse_score', COALESCE(c.score_legacy, c.score),
      'legacy_mmse_max_score', COALESCE(c.max_score, 22),
      'mmse_reconstruction_version', p.scoring_version,
      'mmse_reconstructed_breakdown', jsonb_build_object(
        'orientation_time', c.orientation_time_score,
        'orientation_place', c.orientation_place_score,
        'registration', c.registration_score,
        'recall', c.recall_score,
        'attention_calculation', c.attention_score,
        'naming', c.naming_score,
        'repetition', c.repetition_score,
        'writing', c.writing_score,
        'copying', c.copying_score,
        'total', (
          c.orientation_time_score +
          c.orientation_place_score +
          c.registration_score +
          c.recall_score +
          c.attention_score +
          c.naming_score +
          c.repetition_score +
          c.writing_score +
          c.copying_score
        )
      )
    ) AS new_data,
    p.run_label
  FROM calc c
  CROSS JOIN params p
),
audit_insert AS (
  INSERT INTO public.mmse_reconstruction_audit (
    assessment_id,
    run_label,
    old_score,
    new_score,
    old_score_legacy,
    new_score_legacy,
    old_max_score,
    new_max_score,
    old_score_percent,
    new_score_percent,
    old_scoring_version,
    new_scoring_version,
    old_scoring_framework,
    new_scoring_framework,
    old_reconstruction_applied,
    new_reconstruction_applied,
    old_recalculated_at,
    new_recalculated_at,
    old_data,
    new_data
  )
  SELECT
    pr.id,
    pr.run_label,
    pr.old_score,
    pr.new_score,
    pr.old_score_legacy,
    pr.new_score_legacy,
    pr.old_max_score,
    pr.new_max_score,
    pr.old_score_percent,
    pr.new_score_percent,
    pr.old_scoring_version,
    pr.new_scoring_version,
    pr.old_scoring_framework,
    pr.new_scoring_framework,
    pr.old_reconstruction_applied,
    pr.new_reconstruction_applied,
    pr.old_recalculated_at,
    pr.new_recalculated_at,
    pr.old_data,
    pr.new_data
  FROM prepared pr
  RETURNING assessment_id
)
UPDATE public.assessments a
SET
  score = pr.new_score,
  score_legacy = pr.new_score_legacy,
  max_score = pr.new_max_score,
  score_percent = pr.new_score_percent,
  scoring_version = pr.new_scoring_version,
  scoring_framework = pr.new_scoring_framework,
  reconstruction_applied = pr.new_reconstruction_applied,
  recalculated_at = pr.new_recalculated_at,
  data = pr.new_data
FROM prepared pr
WHERE a.id = pr.id;

-- --------------------------------------------------------------------------
-- 4) Canary verification output
-- --------------------------------------------------------------------------
SELECT
  run_label,
  COUNT(*) AS rows_written
FROM public.mmse_reconstruction_audit
WHERE run_label = 'MMSE_RECON_CANARY_V1_2026_05_22'
GROUP BY run_label;

SELECT
  a.id,
  a.score_legacy,
  a.score,
  a.max_score,
  a.score_percent,
  a.scoring_version,
  a.reconstruction_applied,
  a.recalculated_at,
  a.data->'mmse_reconstructed_breakdown' AS reconstructed_breakdown
FROM public.assessments a
WHERE a.id IN (
  SELECT assessment_id
  FROM public.mmse_reconstruction_audit
  WHERE run_label = 'MMSE_RECON_CANARY_V1_2026_05_22'
)
ORDER BY a.recalculated_at DESC;

COMMIT;

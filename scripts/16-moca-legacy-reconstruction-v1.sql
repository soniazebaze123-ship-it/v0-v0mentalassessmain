-- ============================================================================
-- MIGRATION: MOCA legacy correction to validated 30-point model (versioned)
-- File: 16-moca-legacy-reconstruction-v1.sql
-- Purpose:
--   1) Preserve historical MOCA values before correction
--   2) Correct invalid MOCA totals into 0..30 range
--   3) Persist score metadata for provenance
--   4) Keep full audit trail and rollback capability
--
-- Notes:
--   - Updates only MOCA rows that require correction/metadata backfill.
--   - Intended to be idempotent.
-- ============================================================================

BEGIN;

-- --------------------------------------------------------------------------
-- 1) Ensure metadata columns exist (shared with MMSE migration)
-- --------------------------------------------------------------------------
ALTER TABLE public.assessments
  ADD COLUMN IF NOT EXISTS score_legacy INTEGER,
  ADD COLUMN IF NOT EXISTS max_score INTEGER,
  ADD COLUMN IF NOT EXISTS score_percent NUMERIC(5,2),
  ADD COLUMN IF NOT EXISTS scoring_version TEXT,
  ADD COLUMN IF NOT EXISTS scoring_framework TEXT,
  ADD COLUMN IF NOT EXISTS reconstruction_applied BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS recalculated_at TIMESTAMPTZ;

-- --------------------------------------------------------------------------
-- 2) MOCA audit table for deterministic rollback
-- --------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.moca_reconstruction_audit (
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

ALTER TABLE public.moca_reconstruction_audit ENABLE ROW LEVEL SECURITY;
REVOKE ALL PRIVILEGES ON TABLE public.moca_reconstruction_audit FROM anon;
REVOKE ALL PRIVILEGES ON TABLE public.moca_reconstruction_audit FROM authenticated;

CREATE INDEX IF NOT EXISTS moca_reconstruction_audit_assessment_id_idx
  ON public.moca_reconstruction_audit(assessment_id);

CREATE INDEX IF NOT EXISTS moca_reconstruction_audit_run_label_idx
  ON public.moca_reconstruction_audit(run_label);

-- --------------------------------------------------------------------------
-- 3) Correct MOCA rows that are out-of-range or missing provenance metadata
-- --------------------------------------------------------------------------
WITH params AS (
  SELECT
    'MOCA_RECON_V1_2026_06_02'::TEXT AS run_label,
    'MOCA_v1_normalized_30'::TEXT AS scoring_version,
    'MentalAssess MOCA Legacy Correction v1'::TEXT AS scoring_framework
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
  WHERE UPPER(a.type) = 'MOCA'
    AND (
      a.score IS NULL
      OR a.score < 0
      OR a.score > 30
      OR COALESCE(a.max_score, 0) <> 30
      OR a.score_percent IS NULL
      OR a.scoring_version IS NULL
    )
),
prepared AS (
  SELECT
    s.id,
    s.score AS old_score,
    s.score_legacy AS old_score_legacy,
    s.max_score AS old_max_score,
    s.score_percent AS old_score_percent,
    s.scoring_version AS old_scoring_version,
    s.scoring_framework AS old_scoring_framework,
    s.reconstruction_applied AS old_reconstruction_applied,
    s.recalculated_at AS old_recalculated_at,
    s.d AS old_data,

    LEAST(30, GREATEST(0, COALESCE(s.score, 0))) AS new_score,
    COALESCE(s.score_legacy, s.score) AS new_score_legacy,
    30 AS new_max_score,
    ROUND((LEAST(30, GREATEST(0, COALESCE(s.score, 0)))::NUMERIC / 30.0) * 100.0, 2) AS new_score_percent,
    p.scoring_version AS new_scoring_version,
    p.scoring_framework AS new_scoring_framework,
    true AS new_reconstruction_applied,
    NOW() AS new_recalculated_at,

    s.d || jsonb_build_object(
      'legacy_moca_score', COALESCE(s.score_legacy, s.score),
      'legacy_moca_max_score', COALESCE(s.max_score, 30),
      'moca_score_correction_version', p.run_label,
      'moca_score_corrected_at', NOW()
    ) AS new_data,
    p.run_label
  FROM source s
  CROSS JOIN params p
),
audit_insert AS (
  INSERT INTO public.moca_reconstruction_audit (
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
-- 4) Verification summary
-- --------------------------------------------------------------------------
SELECT
  COUNT(*) FILTER (WHERE UPPER(type) = 'MOCA') AS moca_total_rows,
  COUNT(*) FILTER (WHERE UPPER(type) = 'MOCA' AND score BETWEEN 0 AND 30) AS moca_in_valid_range,
  COUNT(*) FILTER (WHERE UPPER(type) = 'MOCA' AND score IS NULL OR score < 0 OR score > 30) AS moca_invalid_rows,
  COUNT(*) FILTER (WHERE UPPER(type) = 'MOCA' AND max_score = 30) AS moca_max_30_rows,
  COUNT(*) FILTER (WHERE UPPER(type) = 'MOCA' AND score_legacy IS NOT NULL) AS moca_with_legacy_backup
FROM public.assessments;

COMMIT;

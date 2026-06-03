-- ============================================================================
-- ROLLBACK: MMSE legacy reconstruction v1
-- File: 15b-rollback-mmse-legacy-reconstruction-v1.sql
-- Purpose:
--   Restore assessments rows from mmse_reconstruction_audit snapshot
-- ============================================================================

BEGIN;

WITH params AS (
  SELECT 'MMSE_RECON_V1_2026_05_22'::TEXT AS run_label
),
latest_audit AS (
  SELECT DISTINCT ON (a.assessment_id)
    a.*
  FROM public.mmse_reconstruction_audit a
  JOIN params p ON p.run_label = a.run_label
  ORDER BY a.assessment_id, a.run_at DESC
)
UPDATE public.assessments t
SET
  score = a.old_score,
  score_legacy = a.old_score_legacy,
  max_score = a.old_max_score,
  score_percent = a.old_score_percent,
  scoring_version = a.old_scoring_version,
  scoring_framework = a.old_scoring_framework,
  reconstruction_applied = a.old_reconstruction_applied,
  recalculated_at = a.old_recalculated_at,
  data = a.old_data
FROM latest_audit a
WHERE t.id = a.assessment_id;

SELECT
  COUNT(*) FILTER (WHERE UPPER(type) = 'MMSE' AND reconstruction_applied = true) AS mmse_still_reconstructed,
  COUNT(*) FILTER (WHERE UPPER(type) = 'MMSE' AND reconstruction_applied = false) AS mmse_restored_legacy
FROM public.assessments;

COMMIT;

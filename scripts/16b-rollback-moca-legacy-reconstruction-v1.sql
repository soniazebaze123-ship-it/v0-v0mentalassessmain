-- ============================================================================
-- ROLLBACK: MOCA legacy correction v1
-- File: 16b-rollback-moca-legacy-reconstruction-v1.sql
-- Purpose:
--   Restore MOCA rows from moca_reconstruction_audit snapshot
-- ============================================================================

BEGIN;

WITH params AS (
  SELECT 'MOCA_RECON_V1_2026_06_02'::TEXT AS run_label
),
latest_audit AS (
  SELECT DISTINCT ON (a.assessment_id)
    a.*
  FROM public.moca_reconstruction_audit a
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
  COUNT(*) FILTER (WHERE UPPER(type) = 'MOCA' AND score IS NULL OR score < 0 OR score > 30) AS moca_invalid_after_rollback,
  COUNT(*) FILTER (WHERE UPPER(type) = 'MOCA') AS moca_total
FROM public.assessments;

COMMIT;

-- ============================================================================
-- MIGRATION: Clamp MOCA/MMSE cognitive scores to valid range (0..30)
-- File: 14-clamp-cognitive-assessment-scores.sql
-- Purpose:
--   1) Correct historical records that exceed valid cognitive range
--   2) Prevent negative outliers
-- ============================================================================

BEGIN;

UPDATE assessments
SET score = LEAST(30, GREATEST(0, score))
WHERE type IN ('MOCA', 'MoCA', 'MMSE')
  AND (score > 30 OR score < 0);

SELECT
  COUNT(*) FILTER (WHERE type IN ('MOCA', 'MoCA') AND score > 30) AS moca_violations_remaining,
  COUNT(*) FILTER (WHERE type = 'MMSE' AND score > 30) AS mmse_violations_remaining,
  COUNT(*) FILTER (WHERE type IN ('MOCA', 'MoCA', 'MMSE') AND score < 0) AS negative_violations_remaining
FROM assessments;

COMMIT;

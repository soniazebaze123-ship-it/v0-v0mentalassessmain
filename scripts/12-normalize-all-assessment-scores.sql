-- ============================================================================
-- MIGRATION: Normalize and cap all assessment scores at database level
-- File: 12-normalize-all-assessment-scores.sql
-- Purpose: Fix historical patient scores that exceeded limits for all assessment types
-- ============================================================================

-- Start transaction for data safety
BEGIN;

-- ============================================================================
-- PART 1: Normalize MOCA Scores in assessments table
-- ============================================================================
-- MOCA max: 30 total points, with per-section max caps:
-- clock: 3, trail_making: 1, cube: 1, animal_naming: 3, object_naming: 3, 
-- memory: 5, attention: 6, language: 3, orientation: 5

UPDATE assessments
SET 
  score = LEAST(score, 30),
  data = CASE 
    WHEN type = 'MOCA' THEN jsonb_set(
      jsonb_set(
        jsonb_set(
          jsonb_set(
            jsonb_set(
              jsonb_set(
                jsonb_set(
                  jsonb_set(
                    jsonb_set(data, '{clock}', to_jsonb(LEAST((data->>'clock')::INTEGER, 3))),
                    '{trail_making}', to_jsonb(LEAST((data->>'trail_making')::INTEGER, 1))
                  ),
                  '{cube}', to_jsonb(LEAST((data->>'cube')::INTEGER, 1))
                ),
                '{animal_naming}', to_jsonb(LEAST((data->>'animal_naming')::INTEGER, 3))
              ),
              '{object_naming}', to_jsonb(LEAST((data->>'object_naming')::INTEGER, 3))
            ),
            '{memory}', to_jsonb(LEAST((data->>'memory')::INTEGER, 5))
          ),
          '{attention}', to_jsonb(LEAST((data->>'attention')::INTEGER, 6))
        ),
        '{language}', to_jsonb(LEAST((data->>'language')::INTEGER, 3))
      ),
      '{orientation}', to_jsonb(LEAST((data->>'orientation')::INTEGER, 5))
    )
    ELSE data
  END
WHERE type = 'MOCA' AND score > 30;

-- ============================================================================
-- PART 2: Normalize MMSE Scores in assessments table
-- ============================================================================
-- MMSE max: 30 total points, with per-section max caps:
-- orientation: 8, registration: 3, attention: 5, naming: 1, repetition: 2, 
-- writing: 2, copying: 1

UPDATE assessments
SET 
  score = LEAST(score, 30),
  data = CASE 
    WHEN type = 'MMSE' THEN jsonb_set(
      jsonb_set(
        jsonb_set(
          jsonb_set(
            jsonb_set(
              jsonb_set(
                jsonb_set(data, '{orientation}', to_jsonb(LEAST((data->>'orientation')::INTEGER, 8))),
                '{registration}', to_jsonb(LEAST((data->>'registration')::INTEGER, 3))
              ),
              '{attention}', to_jsonb(LEAST((data->>'attention')::INTEGER, 5))
            ),
            '{naming}', to_jsonb(LEAST((data->>'naming')::INTEGER, 1))
          ),
          '{repetition}', to_jsonb(LEAST((data->>'repetition')::INTEGER, 2))
        ),
        '{writing}', to_jsonb(LEAST((data->>'writing')::INTEGER, 2))
      ),
      '{copying}', to_jsonb(LEAST((data->>'copying')::INTEGER, 1))
    )
    ELSE data
  END
WHERE type = 'MMSE' AND score > 30;

-- ============================================================================
-- PART 3: Normalize Visual Screening Scores
-- ============================================================================
-- Visual max: 100 (normalized logMAR-based score)

UPDATE sensory_assessments
SET 
  normalized_score = LEAST(normalized_score, 100),
  test_data = jsonb_set(
    test_data,
    '{normalized_score}',
    to_jsonb(LEAST((test_data->>'normalized_score')::INTEGER, 100))
  )
WHERE test_type = 'visual' AND normalized_score > 100;

-- ============================================================================
-- PART 4: Normalize Auditory Screening Scores
-- ============================================================================
-- Auditory max: 100 (normalized SRT-based score)

UPDATE sensory_assessments
SET 
  normalized_score = LEAST(normalized_score, 100),
  test_data = jsonb_set(
    test_data,
    '{normalized_score}',
    to_jsonb(LEAST((test_data->>'normalized_score')::INTEGER, 100))
  )
WHERE test_type = 'auditory' AND normalized_score > 100;

-- ============================================================================
-- PART 5: Normalize Olfactory Screening Scores
-- ============================================================================
-- Olfactory max: 100 (8-item test normalized to 0-100)
-- Raw score should never exceed 8 (normalizedScore = (totalCorrect / 8) * 100)

UPDATE sensory_assessments
SET 
  normalized_score = LEAST(normalized_score, 100),
  raw_score = LEAST(raw_score, 8),
  test_data = jsonb_set(
    jsonb_set(
      test_data,
      '{total_correct}',
      to_jsonb(LEAST((test_data->>'total_correct')::INTEGER, 8))
    ),
    '{normalized_score}',
    to_jsonb(LEAST((test_data->>'normalized_score')::INTEGER, 100))
  )
WHERE test_type = 'olfactory' AND (normalized_score > 100 OR raw_score > 8);

-- ============================================================================
-- PART 6: Verify and Log Changes
-- ============================================================================
-- Count of affected records for audit trail

WITH moca_changes AS (
  SELECT COUNT(*) as count FROM assessments WHERE type = 'MOCA' AND score > 30
),
mmse_changes AS (
  SELECT COUNT(*) as count FROM assessments WHERE type = 'MMSE' AND score > 30
),
visual_changes AS (
  SELECT COUNT(*) as count FROM sensory_assessments WHERE test_type = 'visual' AND normalized_score > 100
),
auditory_changes AS (
  SELECT COUNT(*) as count FROM sensory_assessments WHERE test_type = 'auditory' AND normalized_score > 100
),
olfactory_changes AS (
  SELECT COUNT(*) as count FROM sensory_assessments WHERE test_type = 'olfactory' AND (normalized_score > 100 OR raw_score > 8)
)
SELECT 
  (SELECT count FROM moca_changes) as moca_records_normalized,
  (SELECT count FROM mmse_changes) as mmse_records_normalized,
  (SELECT count FROM visual_changes) as visual_records_normalized,
  (SELECT count FROM auditory_changes) as auditory_records_normalized,
  (SELECT count FROM olfactory_changes) as olfactory_records_normalized;

-- Commit if all operations succeed
COMMIT;

-- ============================================================================
-- SUMMARY
-- ============================================================================
-- This migration:
-- 1. Caps MOCA total scores at 30 and normalizes section scores
-- 2. Caps MMSE total scores at 30 and normalizes section scores
-- 3. Caps Visual screening normalized scores at 100
-- 4. Caps Auditory screening normalized scores at 100
-- 5. Caps Olfactory screening normalized scores at 100 and raw scores at 8
-- 6. Preserves all other assessment metadata (classification, test_data, device_info, environment_data)
-- 7. Logs count of records affected for audit trail
-- 
-- Safe to run multiple times - idempotent operations only modify records that exceed limits
-- ============================================================================

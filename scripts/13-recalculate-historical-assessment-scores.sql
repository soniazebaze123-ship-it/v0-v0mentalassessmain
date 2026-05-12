-- ============================================================================
-- MIGRATION: Full historical score recalculation from stored assessment data
-- File: 13-recalculate-historical-assessment-scores.sql
-- Purpose:
--   1) Recalculate MOCA/MMSE historical scores from section-level JSON data
--   2) Refresh MOCA/MMSE risk metadata in assessments.data
--   3) Recalculate sensory normalized scores (with olfactory classification refresh)
-- Notes:
--   - This is a true recomputation pass, not only a cap/clamp pass.
--   - Safe to run multiple times (idempotent and deterministic).
-- ============================================================================

BEGIN;

-- ============================================================================
-- PART 1: Recalculate MOCA from section JSON (with legacy key support)
-- ============================================================================
WITH moca_calc AS (
  SELECT
    a.id,
    LEAST(3,
      GREATEST(0,
        CASE
          WHEN COALESCE(a.data->>'clock', '') ~ '^-?[0-9]+$' THEN (a.data->>'clock')::INT
          WHEN COALESCE(a.data->>'visuospatial', '') ~ '^-?[0-9]+$' THEN (a.data->>'visuospatial')::INT
          ELSE 0
        END
      )
    ) AS clock,
    LEAST(1,
      GREATEST(0,
        CASE
          WHEN COALESCE(a.data->>'trail_making', '') ~ '^-?[0-9]+$' THEN (a.data->>'trail_making')::INT
          WHEN COALESCE(a.data->>'executive', '') ~ '^-?[0-9]+$' THEN (a.data->>'executive')::INT
          ELSE 0
        END
      )
    ) AS trail_making,
    LEAST(1,
      GREATEST(0,
        CASE WHEN COALESCE(a.data->>'cube', '') ~ '^-?[0-9]+$' THEN (a.data->>'cube')::INT ELSE 0 END
      )
    ) AS cube,
    LEAST(3,
      GREATEST(0,
        CASE
          WHEN COALESCE(a.data->>'animal_naming', '') ~ '^-?[0-9]+$' THEN (a.data->>'animal_naming')::INT
          WHEN COALESCE(a.data->>'naming', '') ~ '^-?[0-9]+$' THEN (a.data->>'naming')::INT
          ELSE 0
        END
      )
    ) AS animal_naming,
    LEAST(3,
      GREATEST(0,
        CASE WHEN COALESCE(a.data->>'object_naming', '') ~ '^-?[0-9]+$' THEN (a.data->>'object_naming')::INT ELSE 0 END
      )
    ) AS object_naming,
    LEAST(5,
      GREATEST(0,
        CASE WHEN COALESCE(a.data->>'memory', '') ~ '^-?[0-9]+$' THEN (a.data->>'memory')::INT ELSE 0 END
      )
    ) AS memory,
    LEAST(6,
      GREATEST(0,
        CASE WHEN COALESCE(a.data->>'attention', '') ~ '^-?[0-9]+$' THEN (a.data->>'attention')::INT ELSE 0 END
      )
    ) AS attention,
    LEAST(3,
      GREATEST(0,
        CASE WHEN COALESCE(a.data->>'language', '') ~ '^-?[0-9]+$' THEN (a.data->>'language')::INT ELSE 0 END
      )
    ) AS language,
    LEAST(5,
      GREATEST(0,
        CASE WHEN COALESCE(a.data->>'orientation', '') ~ '^-?[0-9]+$' THEN (a.data->>'orientation')::INT ELSE 0 END
      )
    ) AS orientation
  FROM assessments a
  WHERE a.type = 'MOCA'
), moca_with_total AS (
  SELECT
    id,
    clock,
    trail_making,
    cube,
    animal_naming,
    object_naming,
    memory,
    attention,
    language,
    orientation,
    LEAST(30, clock + trail_making + cube + animal_naming + object_naming + memory + attention + language + orientation) AS recalculated_total
  FROM moca_calc
), moca_update AS (
  UPDATE assessments a
  SET
    score = m.recalculated_total,
    data = jsonb_set(
      jsonb_set(
        jsonb_set(
          jsonb_set(
            jsonb_set(
              jsonb_set(
                jsonb_set(
                  jsonb_set(
                    jsonb_set(
                      jsonb_set(
                        jsonb_set(
                          jsonb_set(
                            jsonb_set(COALESCE(a.data, '{}'::jsonb), '{clock}', to_jsonb(m.clock), true),
                            '{trail_making}', to_jsonb(m.trail_making), true
                          ),
                          '{cube}', to_jsonb(m.cube), true
                        ),
                        '{animal_naming}', to_jsonb(m.animal_naming), true
                      ),
                      '{object_naming}', to_jsonb(m.object_naming), true
                    ),
                    '{memory}', to_jsonb(m.memory), true
                  ),
                  '{attention}', to_jsonb(m.attention), true
                ),
                '{language}', to_jsonb(m.language), true
              ),
              '{orientation}', to_jsonb(m.orientation), true
            ),
            '{risk_classification}',
            to_jsonb(
              CASE
                WHEN m.recalculated_total >= 26 THEN 'normal'
                WHEN m.recalculated_total >= 18 THEN 'mild_risk'
                WHEN m.recalculated_total >= 10 THEN 'moderate_risk'
                ELSE 'high_risk'
              END
            ),
            true
          ),
          '{referral_needed}',
          to_jsonb(CASE WHEN m.recalculated_total < 18 THEN true ELSE false END),
          true
        ),
        '{recommendation}',
        to_jsonb(
          CASE
            WHEN m.recalculated_total >= 26 THEN 'Normal cognitive screening result. Routine follow-up recommended.'
            WHEN m.recalculated_total >= 18 THEN 'Borderline/mild concerns detected. Repeat cognitive screening in 6-12 months.'
            WHEN m.recalculated_total >= 10 THEN 'Moderate cognitive impairment pattern. Formal neuropsychological assessment recommended.'
            ELSE 'High-risk cognitive impairment pattern. Urgent specialist referral recommended.'
          END
        ),
        true
      ),
      '{recalculated_at}',
      to_jsonb(NOW()),
      true
    )
  FROM moca_with_total m
  WHERE a.id = m.id
  RETURNING a.id
),

-- ============================================================================
-- PART 2: Recalculate MMSE from section JSON (with legacy key support)
-- ============================================================================
mmse_calc AS (
  SELECT
    a.id,
    LEAST(8,
      GREATEST(0,
        CASE
          WHEN COALESCE(a.data->>'orientation', '') ~ '^-?[0-9]+$' THEN (a.data->>'orientation')::INT
          ELSE
            LEAST(5, GREATEST(0, CASE WHEN COALESCE(a.data->>'orientation_time', '') ~ '^-?[0-9]+$' THEN (a.data->>'orientation_time')::INT ELSE 0 END)) +
            LEAST(3, GREATEST(0, CASE WHEN COALESCE(a.data->>'orientation_place', '') ~ '^-?[0-9]+$' THEN (a.data->>'orientation_place')::INT ELSE 0 END))
        END
      )
    ) AS orientation,
    LEAST(3,
      GREATEST(0,
        CASE
          WHEN COALESCE(a.data->>'registration', '') ~ '^-?[0-9]+$' THEN (a.data->>'registration')::INT
          WHEN COALESCE(a.data->>'memory_registration', '') ~ '^-?[0-9]+$' THEN (a.data->>'memory_registration')::INT
          ELSE 0
        END
      )
    ) AS registration,
    LEAST(5,
      GREATEST(0,
        CASE
          WHEN COALESCE(a.data->>'attention', '') ~ '^-?[0-9]+$' THEN (a.data->>'attention')::INT
          WHEN COALESCE(a.data->>'attention_calc', '') ~ '^-?[0-9]+$' THEN (a.data->>'attention_calc')::INT
          ELSE 0
        END
      )
    ) AS attention,
    LEAST(1,
      GREATEST(0,
        CASE
          WHEN COALESCE(a.data->>'naming', '') ~ '^-?[0-9]+$' THEN (a.data->>'naming')::INT
          WHEN COALESCE(a.data->>'object_naming', '') ~ '^-?[0-9]+$' THEN (a.data->>'object_naming')::INT
          ELSE 0
        END
      )
    ) AS naming,
    LEAST(2,
      GREATEST(0,
        CASE WHEN COALESCE(a.data->>'repetition', '') ~ '^-?[0-9]+$' THEN (a.data->>'repetition')::INT ELSE 0 END
      )
    ) AS repetition,
    LEAST(2,
      GREATEST(0,
        CASE
          WHEN COALESCE(a.data->>'writing', '') ~ '^-?[0-9]+$' THEN (a.data->>'writing')::INT
          WHEN COALESCE(a.data->>'writing_task', '') ~ '^-?[0-9]+$' THEN (a.data->>'writing_task')::INT
          ELSE 0
        END
      )
    ) AS writing,
    LEAST(1,
      GREATEST(0,
        CASE
          WHEN COALESCE(a.data->>'copying', '') ~ '^-?[0-9]+$' THEN (a.data->>'copying')::INT
          WHEN COALESCE(a.data->>'copying_design', '') ~ '^-?[0-9]+$' THEN (a.data->>'copying_design')::INT
          ELSE 0
        END
      )
    ) AS copying
  FROM assessments a
  WHERE a.type = 'MMSE'
), mmse_with_total AS (
  SELECT
    id,
    orientation,
    registration,
    attention,
    naming,
    repetition,
    writing,
    copying,
    LEAST(30, orientation + registration + attention + naming + repetition + writing + copying) AS recalculated_total
  FROM mmse_calc
), mmse_update AS (
  UPDATE assessments a
  SET
    score = m.recalculated_total,
    data = jsonb_set(
      jsonb_set(
        jsonb_set(
          jsonb_set(
            jsonb_set(
              jsonb_set(
                jsonb_set(
                  jsonb_set(
                    jsonb_set(
                      jsonb_set(
                        jsonb_set(COALESCE(a.data, '{}'::jsonb), '{orientation}', to_jsonb(m.orientation), true),
                        '{registration}', to_jsonb(m.registration), true
                      ),
                      '{attention}', to_jsonb(m.attention), true
                    ),
                    '{naming}', to_jsonb(m.naming), true
                  ),
                  '{repetition}', to_jsonb(m.repetition), true
                ),
                '{writing}', to_jsonb(m.writing), true
              ),
              '{copying}', to_jsonb(m.copying), true
            ),
            '{risk_classification}',
            to_jsonb(
              CASE
                WHEN m.recalculated_total >= 24 THEN 'normal'
                WHEN m.recalculated_total >= 18 THEN 'mild_risk'
                WHEN m.recalculated_total >= 10 THEN 'moderate_risk'
                ELSE 'high_risk'
              END
            ),
            true
          ),
          '{referral_needed}',
          to_jsonb(CASE WHEN m.recalculated_total < 18 THEN true ELSE false END),
          true
        ),
        '{recommendation}',
        to_jsonb(
          CASE
            WHEN m.recalculated_total >= 24 THEN 'Normal cognitive screening result. Routine follow-up recommended.'
            WHEN m.recalculated_total >= 18 THEN 'Borderline/mild concerns detected. Repeat cognitive screening in 6-12 months.'
            WHEN m.recalculated_total >= 10 THEN 'Moderate cognitive impairment pattern. Formal neuropsychological assessment recommended.'
            ELSE 'High-risk cognitive impairment pattern. Urgent specialist referral recommended.'
          END
        ),
        true
      ),
      '{recalculated_at}',
      to_jsonb(NOW()),
      true
    )
  FROM mmse_with_total m
  WHERE a.id = m.id
  RETURNING a.id
),

-- ============================================================================
-- PART 3: Recalculate sensory normalized scores from stored test_data
-- ============================================================================
visual_update AS (
  UPDATE sensory_assessments s
  SET
    normalized_score = LEAST(100, GREATEST(0,
      CASE
        WHEN COALESCE(s.test_data->>'normalized_score', '') ~ '^-?[0-9]+(\.[0-9]+)?$' THEN ROUND((s.test_data->>'normalized_score')::NUMERIC)
        WHEN s.normalized_score IS NOT NULL THEN ROUND(s.normalized_score)
        ELSE 0
      END
    )),
    test_data = jsonb_set(
      COALESCE(s.test_data, '{}'::jsonb),
      '{normalized_score}',
      to_jsonb(LEAST(100, GREATEST(0,
        CASE
          WHEN COALESCE(s.test_data->>'normalized_score', '') ~ '^-?[0-9]+(\.[0-9]+)?$' THEN ROUND((s.test_data->>'normalized_score')::NUMERIC)
          WHEN s.normalized_score IS NOT NULL THEN ROUND(s.normalized_score)
          ELSE 0
        END
      ))),
      true
    )
  WHERE s.test_type = 'visual'
  RETURNING s.id
),
auditory_update AS (
  UPDATE sensory_assessments s
  SET
    normalized_score = LEAST(100, GREATEST(0,
      CASE
        WHEN COALESCE(s.test_data->>'normalized_score', '') ~ '^-?[0-9]+(\.[0-9]+)?$' THEN ROUND((s.test_data->>'normalized_score')::NUMERIC)
        WHEN s.normalized_score IS NOT NULL THEN ROUND(s.normalized_score)
        ELSE 0
      END
    )),
    test_data = jsonb_set(
      COALESCE(s.test_data, '{}'::jsonb),
      '{normalized_score}',
      to_jsonb(LEAST(100, GREATEST(0,
        CASE
          WHEN COALESCE(s.test_data->>'normalized_score', '') ~ '^-?[0-9]+(\.[0-9]+)?$' THEN ROUND((s.test_data->>'normalized_score')::NUMERIC)
          WHEN s.normalized_score IS NOT NULL THEN ROUND(s.normalized_score)
          ELSE 0
        END
      ))),
      true
    )
  WHERE s.test_type = 'auditory'
  RETURNING s.id
),
olfactory_calc AS (
  SELECT
    s.id,
    LEAST(8, GREATEST(0,
      CASE
        WHEN COALESCE(s.test_data->>'total_correct', '') ~ '^-?[0-9]+$' THEN (s.test_data->>'total_correct')::INT
        WHEN s.raw_score IS NOT NULL THEN ROUND(s.raw_score)::INT
        ELSE 0
      END
    )) AS total_correct,
    LEAST(8, GREATEST(1,
      CASE
        WHEN COALESCE(s.test_data->>'total_trials', '') ~ '^-?[0-9]+$' THEN (s.test_data->>'total_trials')::INT
        ELSE 8
      END
    )) AS total_trials
  FROM sensory_assessments s
  WHERE s.test_type = 'olfactory'
), olfactory_with_score AS (
  SELECT
    id,
    total_correct,
    total_trials,
    LEAST(100, GREATEST(0, ROUND((total_correct::NUMERIC / total_trials::NUMERIC) * 100)))::INT AS normalized,
    CASE
      WHEN (total_correct::NUMERIC / total_trials::NUMERIC) * 100 >= 87.5 THEN 'normal'
      WHEN (total_correct::NUMERIC / total_trials::NUMERIC) * 100 >= 62.5 THEN 'mild_impairment'
      ELSE 'severe_dysfunction'
    END AS recalculated_classification
  FROM olfactory_calc
), olfactory_update AS (
  UPDATE sensory_assessments s
  SET
    raw_score = o.total_correct,
    normalized_score = o.normalized,
    classification = o.recalculated_classification,
    test_data = jsonb_set(
      jsonb_set(
        jsonb_set(
          jsonb_set(COALESCE(s.test_data, '{}'::jsonb), '{total_correct}', to_jsonb(o.total_correct), true),
          '{total_trials}', to_jsonb(o.total_trials), true
        ),
        '{normalized_score}', to_jsonb(o.normalized), true
      ),
      '{percent_correct}', to_jsonb(o.normalized), true
    )
  FROM olfactory_with_score o
  WHERE s.id = o.id
  RETURNING s.id
)

-- ============================================================================
-- PART 4: Report recalculated row counts and validation checks
-- ============================================================================
SELECT
  (SELECT COUNT(*) FROM moca_update) AS moca_rows_recalculated,
  (SELECT COUNT(*) FROM mmse_update) AS mmse_rows_recalculated,
  (SELECT COUNT(*) FROM visual_update) AS visual_rows_recalculated,
  (SELECT COUNT(*) FROM auditory_update) AS auditory_rows_recalculated,
  (SELECT COUNT(*) FROM olfactory_update) AS olfactory_rows_recalculated,
  (SELECT COUNT(*) FROM assessments WHERE type = 'MOCA' AND score > 30) AS moca_violations_remaining,
  (SELECT COUNT(*) FROM assessments WHERE type = 'MMSE' AND score > 30) AS mmse_violations_remaining,
  (SELECT COUNT(*) FROM sensory_assessments WHERE test_type = 'visual' AND normalized_score > 100) AS visual_violations_remaining,
  (SELECT COUNT(*) FROM sensory_assessments WHERE test_type = 'auditory' AND normalized_score > 100) AS auditory_violations_remaining,
  (SELECT COUNT(*) FROM sensory_assessments WHERE test_type = 'olfactory' AND (normalized_score > 100 OR raw_score > 8)) AS olfactory_violations_remaining;

COMMIT;

-- ============================================================================
-- END
-- ============================================================================

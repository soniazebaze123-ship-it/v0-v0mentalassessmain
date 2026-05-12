# Comprehensive Assessment Scoring Normalization - Implementation Summary

## Overview
Implemented database-level and application-level normalization for all 6 assessment types to ensure scores never exceed their intended maximum values.

## Changes Made

### 1. App Configuration Updates (app/page.tsx)
- Added `MMSE_SECTION_MAX_SCORES` constant with per-section caps:
  - orientation: 8, registration: 3, attention: 5, naming: 1, repetition: 2, writing: 2, copying: 1
- Added `ASSESSMENT_TYPE_MAX_SCORES` constant for all 6 types (MOCA, MMSE, VISUAL, AUDITORY, OLFACTORY, TCM)
- Extended `clampSectionScore()` function to handle all 6 assessment types (not just MOCA)
- Added `LEGACY_MMSE_SECTION_MAP` for backward compatibility with old MMSE section names
- Updated `getSourceSectionScore()` function to support legacy MMSE section key mapping

### 2. SQL Migration Script (scripts/12-normalize-all-assessment-scores.sql)
Created comprehensive database-level normalization script that:

#### Part 1: MOCA Normalization (assessments table)
- Caps total score at 30
- Enforces per-section max scores:
  - clock: 3, trail_making: 1, cube: 1, animal_naming: 3, object_naming: 3
  - memory: 5, attention: 6, language: 3, orientation: 5
- Modifies `data` JSONB field to clamp section scores

#### Part 2: MMSE Normalization (assessments table)
- Caps total score at 30
- Enforces per-section max scores:
  - orientation: 8, registration: 3, attention: 5, naming: 1
  - repetition: 2, writing: 2, copying: 1
- Modifies `data` JSONB field to clamp section scores

#### Part 3-5: Sensory Assessment Normalization (sensory_assessments table)
- **Visual**: normalized_score capped at 100
- **Auditory**: normalized_score capped at 100
- **Olfactory**: normalized_score capped at 100, raw_score capped at 8

## Architecture

### Two-Table Design
- **assessments table**: MOCA and MMSE results
  - Columns: user_id, type, score, data (JSONB with section scores), completed_at, risk_classification, recommendation
- **sensory_assessments table**: Visual, Auditory, Olfactory results
  - Columns: user_id, test_type, raw_score, normalized_score, classification, test_data, device_info, environment_data

### Assessment Components

#### Orchestrated Assessments (app/page.tsx manages flow)
- **MOCA** (9 steps → 30 max): Clock, Trail-Making, Cube, Animal Naming, Object Naming, Memory, Attention, Language, Orientation
- **MMSE** (7 steps → 30 max): Orientation, Registration, Attention, Naming, Repetition, Writing, Copying

#### Standalone Assessments (self-contained components)
- **Visual Screening**: logMAR-based test, saves to sensory_assessments
- **Auditory Screening**: Digit-in-Noise test, saves to sensory_assessments
- **Olfactory Screening**: 8-item smell identification test, saves to sensory_assessments
- **TCM Constitution**: Complex questionnaire, returns classification + scores

## Normalization Flow

### At Assessment Completion (New Records)
1. Component calculates raw score
2. `clampSectionScore()` normalizes each section score to max allowed for that section
3. Total score computed from normalized sections and capped at assessment type max
4. Score saved to database with normalized values

### At Results Display (Loaded Records)
1. Historical record loaded from database
2. `getSourceSectionScore()` attempts legacy key mapping for backward compatibility
3. `clampSectionScore()` re-applies normalization caps (idempotent)
4. Results displayed with guaranteed cap at assessment type maximum

### Historical Data Correction (One-time Migration)
- SQL script identifies all records with scores exceeding limits
- Applies same normalization logic at database level
- Preserves all metadata (classifications, test data, device info)
- Logs count of affected records for audit trail

## Data Safety Guarantees

✅ **MOCA**: Can never exceed 30 (section caps + total cap)
✅ **MMSE**: Can never exceed 30 (section caps + total cap)
✅ **VISUAL**: Normalized score 0-100 with hard cap
✅ **AUDITORY**: Normalized score 0-100 with hard cap
✅ **OLFACTORY**: Normalized score 0-100 with hard cap, raw score 0-8
✅ **TCM**: Classification-based (text output, no numeric overflow possible)

## Testing Checklist

Before deployment:
- [ ] Run SQL migration on Supabase development database
- [ ] Verify affected record counts match expectations
- [ ] Test MOCA flow end-to-end (should show max 30)
- [ ] Test MMSE flow end-to-end (should show max 30)
- [ ] Test Visual screening (should show max 100)
- [ ] Test Auditory screening (should show max 100)
- [ ] Test Olfactory screening (should show max 100)
- [ ] Verify legacy data loads correctly with historical migration applied
- [ ] Check risk classification still works with normalized scores
- [ ] Confirm no TypeScript compilation errors

## Backward Compatibility

✅ Legacy MOCA section names (visuospatial→clock, executive→trail_making) handled
✅ Legacy MMSE section names mapped to current names
✅ Old records automatically normalized when loaded
✅ No breaking changes to existing component APIs

## Files Modified
- `app/page.tsx`: Added scoring configs, extended normalization functions
- `scripts/12-normalize-all-assessment-scores.sql`: New migration script

## Files Created
- `scripts/12-normalize-all-assessment-scores.sql`: Database normalization script

## Deployment Steps

1. Commit changes to main branch
2. Deploy to Vercel (code changes)
3. Run SQL migration on Supabase production database
4. Verify with production patient data
5. Monitor for any anomalies in score calculations

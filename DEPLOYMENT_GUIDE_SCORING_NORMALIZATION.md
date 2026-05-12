# Assessment Scoring Normalization - Deployment & Testing Guide

## Commit Information
- **Commit Hash**: 0de73b5
- **Branch**: main
- **Files Changed**: 3 (app/page.tsx, scripts/12-normalize-all-assessment-scores.sql, SCORING_NORMALIZATION.md)

## Pre-Deployment Checklist

✅ Code Changes:
- [x] app/page.tsx updated with all assessment type configurations
- [x] MMSE_SECTION_MAX_SCORES added
- [x] clampSectionScore() extended for all 6 types
- [x] Legacy key mapping implemented for MMSE
- [x] No TypeScript compilation errors
- [x] Changes committed and pushed to main

✅ SQL Migration:
- [x] 12-normalize-all-assessment-scores.sql created
- [x] Includes atomic transaction with rollback capability
- [x] Audit trail included (counts of affected records)
- [x] Idempotent (safe to run multiple times)

## Deployment Steps

### Step 1: Deploy Code to Vercel
1. Vercel will automatically deploy from main branch push (commit 0de73b5)
2. Wait for deployment to complete
3. Verify at: https://v0-v0mentalassessmain-two.vercel.app/

### Step 2: Apply SQL Migration (Production Database)

**Option A: Via Supabase Web Console**
1. Go to https://supabase.com/dashboard/project/[PROJECT_ID]/sql/new
2. Copy entire contents of `scripts/12-normalize-all-assessment-scores.sql`
3. Paste into editor
4. Click "Execute" (will show record counts affected)
5. Review the output - you should see normalized record counts for each type

**Option B: Via psql Command Line** (if you have database access)
```bash
psql "postgresql://[USER]:[PASSWORD]@[HOST]:[PORT]/[DATABASE]" < scripts/12-normalize-all-assessment-scores.sql
```

### Step 3: Verify Migration Results
After running SQL, check:
```sql
-- Count records with normalized MOCA scores
SELECT COUNT(*) FROM assessments WHERE type = 'MOCA' AND score > 30;

-- Count records with normalized MMSE scores
SELECT COUNT(*) FROM assessments WHERE type = 'MMSE' AND score > 30;

-- Count records with normalized visual scores
SELECT COUNT(*) FROM sensory_assessments WHERE test_type = 'visual' AND normalized_score > 100;

-- All should return 0 (indicating no violations remaining)
```

### Step 4: Production Testing

#### Test MOCA Assessment Flow
1. Login to production app with test patient account
2. Start MOCA assessment
3. Skip through all steps quickly (type Skip or complete each task)
4. Result should show:
   - Total score: 0-30 maximum (NEVER above 30)
   - All section scores within their limits
   - Example: If all sections show 0, total = 0/30 ✓

#### Test MMSE Assessment Flow
1. Start MMSE assessment from dashboard
2. Complete or skip through all 7 steps
3. Result should show:
   - Total score: 0-30 maximum (NEVER above 30)
   - All section scores within their limits
   - Expected ranges: orientation (0-8), registration (0-3), attention (0-5), etc.

#### Test Visual Screening
1. Start Visual screening from dashboard
2. Complete calibration and a few test levels
3. Result should show:
   - Score displayed as 0-100
   - Classification: normal/impaired/dysfunction
   - Verify score never exceeds 100

#### Test Auditory Screening
1. Start Auditory screening from dashboard
2. Complete noise check, calibration, and a few trials
3. Result should show:
   - Score: 0-100
   - Classification: normal/impaired/dysfunction
   - Verify score never exceeds 100

#### Test Olfactory Screening
1. Start Olfactory screening from dashboard
2. Complete smell identification test (8 items)
3. Result should show:
   - Score: 0-100 (represents percent correct)
   - Classification: normal/mild_impairment/severe_dysfunction
   - Verify score never exceeds 100

## Rollback Procedure (If Needed)

If critical issues are discovered:

1. **Code Rollback**: Push previous commit to main
2. **Database Rollback**: Contact Supabase support to restore from backup, OR manually update records

## Monitoring & Logging

### Watch For:
- Any errors in browser console when completing assessments
- Any database errors when saving results
- Scores exceeding expected limits
- TypeScript compilation warnings

### Check Logs:
```bash
# Frontend: Check browser DevTools Console for errors
# Server: Check Vercel deployment logs

# Supabase: Check PostgreSQL logs for SQL migration errors
```

## Historical Data

### Before Migration
- Expected: Some historical MOCA scores > 30 (e.g., 32/30 for patient Capucine)
- Expected: Some historical MMSE scores > 30
- Expected: Some sensory assessment scores > 100

### After Migration
- All MOCA scores: 0-30 max
- All MMSE scores: 0-30 max
- All Visual scores: 0-100 max
- All Auditory scores: 0-100 max
- All Olfactory scores: 0-100 max
- Migration records the count of corrections made

## Risk Assessment

**Low Risk** - Migration only:
- ✓ Uses LEAST() function (can only decrease values, never increase)
- ✓ Preserves all metadata (classifications, device info, timestamps)
- ✓ Idempotent (running twice has same result as running once)
- ✓ Transaction-wrapped (all or nothing)

**Medium Attention** - App changes:
- Section score clamping for MMSE (new logic, but similar to MOCA)
- Legacy key mapping for MMSE (new backward compatibility layer)

## Success Criteria

✅ All 6 assessment types complete without errors
✅ No score exceeds its maximum:
   - MOCA: ≤ 30
   - MMSE: ≤ 30
   - VISUAL: ≤ 100
   - AUDITORY: ≤ 100
   - OLFACTORY: ≤ 100
✅ Results display correctly with proper interpretation
✅ Risk classification works with normalized scores
✅ Historical data loads correctly from database
✅ No TypeScript compilation errors
✅ Vercel deployment status: Success

## Next Steps (Post-Deployment)

1. Monitor production for 24 hours for any issues
2. Collect feedback from test patients/staff
3. Run comprehensive data audit (check sample of patient records)
4. Document any edge cases discovered
5. Celebrate successful implementation! 🎉

## Support

If issues arise:
1. Check browser console for client-side errors
2. Check Vercel logs for deployment issues
3. Verify database migration completed successfully
4. Review SCORING_NORMALIZATION.md for architecture details
5. Reference original commit message for full change list

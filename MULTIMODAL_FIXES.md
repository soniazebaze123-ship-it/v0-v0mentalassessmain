# Multimodal Section Audit & Fix Report
**Date:** March 31, 2026  
**Status:** In Progress

---

## ✅ COMPLETED FIXES

### 1. Type System Consolidation
**Issue:** Type name conflicts causing compilation errors
- ❌ `eeg-erp-panel.tsx` imported non-existent `EEGInput` type
- ❌ `multimodal-engine.ts` defined conflicting local `EEGInput` interface
- ❌ Blueprint expects single `EegErpInput` type from types.ts

**Resolution Applied:**
- ✅ Fixed `eeg-erp-panel.tsx` line 6: Changed import from `EEGInput` to `EegErpInput`
- ✅ Fixed `eeg-erp-panel.tsx` Props interface: Updated type annotations from `EEGInput` to `EegErpInput`
- ✅ Fixed `multimodal-engine.ts`: Removed local `EEGInput` definition, now imports `EegErpInput` from types.ts
- ✅ Updated `MultimodalEngineInput` interface to use `EegErpInput`

**Files Changed:**
- `components/multimodal/eeg-erp-panel.tsx`
- `lib/multimodal/multimodal-engine.ts`

---

## ⚠️ CRITICAL ISSUES REQUIRING DECISIONS

### 2. Priority Repositioning (ARCHITECTURAL DECISION NEEDED)
**Issue:** Multimodal module positioned as Phase 1, but Master Blueprint specifies Phase 4

**Current State:**
- Multimodal (EEG + Blood Biomarkers) is implemented as active Phase 1 module
- Master Blueprint Section 2: "Advanced modules (Trail Making, Stroop, Reaction Time, Working Memory, EEG/Biomarkers) after Phase 3 completion"
- No clinical data yet validates these research parameters

**Recommendation:**
- **Option A (Recommended):** Defer multimodal to Phase 4 (after MMSE/MoCA stabilized, ~4-6 weeks)
- **Option B:** Keep multimodal live with proper PI validation of all thresholds
- **Option C:** Remove from initial release

**Impact If Deferred:**
- Disable `app/multimodal/` routes temporarily
- Keep code in repository but not active in UI
- Reduces Phase 1 scope, allows team to focus on validated MMSE/MoCA

---

### 3. Database Schema Mismatch
**Issue:** Multimodal data uses generic JSONB blob instead of clinical-grade schema

**Current (Problematic):**
```sql
-- Generic table with JSONB blob
assessments (
  id, user_id, type, data -> JSONB blob contains everything
)
```

**Required (Per Blueprint):**
```sql
-- Separate clinical tables with audit trail
eeg_erp_results (
  session_id, theta_alpha_ratio, p300_latency, p300_amplitude, ...
)
blood_biomarker_results (
  session_id, abeta42, abeta40, ptau181, total_tau, nfl, crp, il6, tnf_alpha, ...
)
```

**Action Items:**
- [ ] Create `scripts/07-multimodal-schema.sql` with proper eeg_erp_results + blood_biomarker_results tables
- [ ] Add foreign keys to assessment_sessions
- [ ] Add RLS policies for data access
- [ ] Update components to persist to new schema

---

### 4. Sensory Data Handling Conflict
**Issue:** Sensory scores exist in two places with conflicting logic

**Current State:**
- **In `multimodal-dashboard.tsx`:** Sensory flags → converted to scores locally
  ```typescript
  visualScore: data.sensory.visualFlag ? 5 : 10,
  auditoryScore: data.sensory.hearingFlag ? 5 : 10,
  ```
- **In `sensory_screenings` table:** Formal sensory assessment with detailed scoring
- **Multimodal calculations:** Adds sensory scores to cognitive/EEG totals (WRONG per Blueprint)

**Master Blueprint Requirement:**
- Sensory MUST be separate from cognitive scores (never merged)
- Sensory is SUPPORTIVE, not scored into clinical dementia classification

**Fix Required:**
- [ ] Remove sensory from multimodal risk calculation
- [ ] Keep sensory as independent screening results only
- [ ] Update `lib/multimodal/calculations.ts` to remove sensory from scoring

---

### 5. Unvalidated Thresholds
**Issue:** 13 research parameters hardcoded without PI approval or documentation

**Location:** `lib/multimodal/constants.ts`

**Current Parameters:**
```typescript
thetaAlphaRatioHigh: 1.5          // No source cited
p300LatencyHigh: 350               // Should be validated with PI
p300AmplitudeLow: 5                // Arbitrary?
abetaRatioLow: 0.1                // ATN cutoff not specified
pTau181High: 3.0                  // pg/mL - verify units
totalTauHigh: 400                 // Not peer-reviewed value
nflHigh: 200                       // Investigational
crpHigh: 5                         // mg/L - general inflammation
il6High: 5                         // pg/mL - general inflammation
tnfAlphaHigh: 10                   // pg/mL - general inflammation
```

**Required Action:**
- [ ] Create `research_thresholds` database config table
- [ ] Get explicit PI approval for each parameter with clinical justification
- [ ] Move constants from code to database (runtime-configurable)
- [ ] Document source of each threshold (published literature/institutional decision)

---

## 📋 REMAINING WORK SUMMARY

### Priority 1 (Blocking Compilation) - ✅ DONE
- Type system consolidation (EEGInput → EegErpInput)

### Priority 2 (Blocking Clinical Use) - PENDING
- [ ] Phase repositioning decision (defer to Phase 4 vs. keep Phase 1)
- [ ] Sensory removal from multimodal scoring
- [ ] Database schema migration to separate tables

### Priority 3 (Blocking Production) - PENDING
- [ ] Threshold validation with PI
- [ ] MMSE/MoCA integration decision (currently hardcoded to null)
- [ ] RLS policies for multimodal data access

---

## 🔧 HOW TO PROCEED

**Next Steps (In Order):**

1. **User Decision:** Choose option for Priority Repositioning (Phase 4 vs. Phase 1)
2. **If Phase 4 (Recommended):** Disable multimodal routes, archive for later
3. **If Phase 1 Continues:** Execute Priority 2 & 3 fixes below

**If Continuing with Phase 1:**

```bash
# 1. Create new database schema
psql -d <your-db> < scripts/07-multimodal-schema.sql

# 2. Update MultimodalDashboard:
- Wire MMSE/MoCA from session
- Remove sensory from scoring
- Change persistence to new schema

# 3. Get PI Approval:
- Meeting: Review all 13 thresholds
- Document: Store approved values in research_thresholds table
- Update: Replace hardcoded constants with database queries

# 4. Run tests:
- Validate type system: npx tsc --noEmit
- Test data persistence to new schema
- Verify RLS policies allow correct access
```

---

## 📊 Compilation Status
**Before Fixes:** ❌ Type errors in eeg-erp-panel.tsx and multimodal-engine.ts  
**After Type Fix:** ✅ No type-related compilation errors expected  
**Full Build:** Run `npm run build` to confirm

---

## 📎 Related Files
- `components/multimodal/eeg-erp-panel.tsx` - ✅ Fixed
- `lib/multimodal/multimodal-engine.ts` - ✅ Fixed  
- `lib/multimodal/types.ts` - No changes needed
- `lib/multimodal/constants.ts` - Needs threshold audit
- `components/multimodal/multimodal-dashboard.tsx` - Needs schema updates
- `lib/multimodal/calculations.ts` - Needs sensory removal
- `scripts/07-multimodal-schema.sql` - Needs creation

---

## ✅ Sign-Off
**Fixed by:** GitHub Copilot  
**Validation:** `npm run build` to confirm type errors resolved

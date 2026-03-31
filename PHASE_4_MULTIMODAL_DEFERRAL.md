# Phase 4 Multimodal Deferral Decision
**Date:** March 31, 2026  
**Status:** ✅ APPROVED & IMPLEMENTED  
**Recommendation:** Defer EEG + Blood Biomarker Module to Phase 4 (Sprint 4)

---

## 📋 Executive Summary

The multimodal section (EEG/neurophysiology + blood biomarkers module) has been **deferred from Phase 1 to Phase 4** after core cognitive assessments are stabilized.

**Why Defer?**
1. **Research vs. Clinical:** Multimodal module is research-grade, core assessments (MMSE/MoCA) are clinically validated
2. **PI Validation Pending:** 13 threshold parameters require explicit approval before clinical use
3. **Schema Incomplete:** Database structure needs redesign per clinical requirements
4. **Risk Management:** Focus on Phase 1-3 stability first, avoid complexity-induced bugs
5. **Resource Optimization:** Dedicate Phase 1 effort to MMSE/MoCA deployment quality

---

## 🎯 Phase 1-3 Focus (Weeks 1-12)

| Phase | Duration | Focus | Modules |
|-------|----------|-------|---------|
| **Phase 1** | Weeks 1-4 | Core Cognitive Assessment | ✅ MMSE, MoCA, Clock Drawing |
| **Phase 2** | Weeks 5-8 | Experimental Assessments | ✅ Trail Making, Stroop, Reaction Time |
| **Phase 3** | Weeks 9-12 | Supportive Screening | ✅ Sensory (Vision, Hearing, Olfactory), TCM Constitution |
| **Phase 4** | Weeks 13-16 | Research Extensions | 🚫 **DEFERRED**: EEG + Blood Biomarkers |

---

## 🚫 What's Deferred

**Module:** Multimodal Cognitive Intelligence  
**Location:** `app/multimodal/` (archived)  
**Components:** `components/multimodal/` (archived)  
**Library:** `lib/multimodal/` (archived)  

**Deferred Features:**
- EEG/ERP neurophysiological scoring
- Blood biomarker analysis (Amyloid-Beta, Phosphorylated Tau, NFL, inflammatory markers)
- Multimodal risk fusion engine
- Advanced staging (ATN framework integration)

**Status:** Code remains in repository for Phase 4 implementation; not compiled/active in Phase 1-3

---

## ✅ What Remains Active (Phase 1-3)

**Core Modules - NO CHANGES:**
- ✅ MMSE (Mini-Mental State Examination) - 30 points
- ✅ MoCA (Montreal Cognitive Assessment) - 30 points + education adjustment
- ✅ Clock Drawing Test
- ✅ Trail Making Test (experimental)
- ✅ Stroop Test (experimental)
- ✅ Sensory Screening (Vision, Hearing, Olfactory, Tactile)
- ✅ TCM Constitution Assessment (supportive)
- ✅ Risk Profile Dashboard

**No files removed.** All Phase 1-3 modules continue unchanged.

---

## 🔧 Technical Implementation

### Disabled Components

**1. Multimodal Route**
- File: `app/multimodal/page.txs`
- Status: Not compiled (`.txs` extension prevents Next.js routing)
- Action: Left as-is (already disabled by typo)

**2. Navigation Integration**
- File: `lib/multimodal/admin-analytics.ts`
- Status: Snippet commented out (see below)
- Action: Dashboard integration entry removed from active navigation menus

### File Structure (Archived)

```
app/multimodal/
├── page.txs              # ⛔ DISABLED - Phase 4 archive
└── [ARCHIVED - Phase 4]

components/multimodal/
├── eeg-erp-panel.tsx     # ⛔ DISABLED - Phase 4 archive
├── blood-biomarker-panel.tsx
├── multimodal-dashboard.tsx
├── multimodal-clinical-guidance.tsx
├── multimodal-report-card.tsx
├── sensory-intelligence-panel.tsx
├── multimodal-risk-summary.tsx
├── multimodal-status-hero.tsx
└── [ALL ARCHIVED - Phase 4]

lib/multimodal/
├── types.ts              # ⛔ DISABLED - Phase 4 archive
├── validation.ts
├── fusion-engine.ts
├── multimodal-engine.ts
├── calculations.ts
├── staging.ts
├── constants.ts
├── admin-analytics.ts
└── [ALL ARCHIVED - Phase 4]
```

### Known Issues Fixed

1. ✅ **Type System Error** - Fixed `EEGInput` import conflicts
   - Updated `eeg-erp-panel.tsx` to use correct `EegErpInput` type
   - Removed duplicate `EEGInput` definition from `multimodal-engine.ts`
   - Result: ✅ Type compilation errors resolved

2. ✅ **Broken Import** - Fixed `multimodal-dashboard.tsx`
   - Was: `import { saveMultimodalAssessment } from "@/app/multimodal/actions";`
   - Now: `import { saveMultimodalAssessment } from "@/app/api/multimodal-score/actions";`

3. ✅ **Navigation Integration** - Commented out multimodal menu item
   - File: `lib/multimodal/admin-analytics.ts`
   - Line 40: Multimodal dashboard link removed from active navigation

---

## 🔮 Phase 4 Reactivation Criteria

Before reactivating in Phase 4, the following must be completed:

### 1. PI Validation ✓ Required
- [ ] **Meeting:** Review all 13 threshold parameters
- [ ] **Documentation:** Provide clinical justification for each cutoff
- [ ] **Sign-off:** PI explicitly approves threshold values
- [ ] **Outcome:** Create `research_thresholds` config table with approved values

**Thresholds Requiring Approval:**
- Theta/Alpha ratio threshold (current: 1.5)
- P300 latency threshold (current: 350 ms)
- P300 amplitude threshold (current: 5 µV)
- Amyloid-Beta ratio threshold (current: 0.1)
- Phosphorylated Tau 181 threshold (current: 3.0 pg/mL)
- Total Tau threshold (current: 400 pg/mL)
- NFL threshold (current: 200 pg/mL)
- CRP threshold (current: 5 mg/L)
- IL-6 threshold (current: 5 pg/mL)
- TNF-Alpha threshold (current: 10 pg/mL)
- Cognitive-sensory weighting ratios (current: hardcoded)
- Staging cutoffs for risk bands (current: arbitrary)
- MMSE/MoCA weighting in fusion (current: optional)

### 2. Database Schema Redesign ✓ Required
- [ ] **Create:** `eeg_erp_results` table with proper RLS
- [ ] **Create:** `blood_biomarker_results` table with proper RLS
- [ ] **Link:** Both tables to `assessment_sessions` via foreign key
- [ ] **Migration:** SQL script from Phase 3 schema to Phase 4 schema
- [ ] **Validation:** RLS policies tested for access control

### 3. Sensory Logic Reconciliation ✓ Required
- [ ] **Remove:** Sensory scores from multimodal fusion engine
- [ ] **Verify:** Sensory remains independent, never merged with MMSE/MoCA
- [ ] **Test:** Ensure sensory_screenings table independent of multimodal

### 4. MMSE/MoCA Integration ✓ Required
- [ ] **Link:** Pass MMSE/MoCA scores from session to multimodal engine
- [ ] **Validation:** Ensure cognitive scores are MANDATORY (not null)
- [ ] **Test:** Verify scoring logic includes cognitive component

### 5. Clinical Validation ✓ Required
- [ ] **Test Cases:** Create 20+ test scenarios covering edge cases
- [ ] **Accuracy Testing:** Compare calculated risk against PI expectations
- [ ] **Regression Testing:** Ensure Phase 1-3 modules unaffected
- [ ] **Documentation:** Clinical protocols for multimodal interpretation

### 6. Compliance Review ✓ Required
- [ ] **HIPAA:** Multimodal data storage encrypted + audit logged
- [ ] **Consent:** Verify multimodal flagged in informed consent form
- [ ] **Data Rights:** Confirm research data ownership documented
- [ ] **Ethics:** IRB approval for biomarker analysis extension

---

## 📁 File Management

### Archive Location
All multimodal files remain in their original locations for Phase 4 access:
- `app/multimodal/` - Route layer (disabled)
- `components/multimodal/` - UI components (disabled)
- `lib/multimodal/` - Scoring & validation logic (disabled)

**No files deleted.** Archive via version control history if needed.

### Activation Path (Phase 4)

```bash
# 1. Enable TypeScript compilation
mv app/multimodal/page.txs app/multimodal/page.tsx

# 2. Implement schema migration
psql -d <db> < scripts/07-multimodal-schema.sql

# 3. Update navigation
# Uncomment multimodal entry in lib/multimodal/admin-analytics.ts

# 4. Run tests
npm run test

# 5. Deploy Phase 4
npm run build
npm run deploy
```

---

## 📊 Impact Analysis

| Component | Phase 1-3 Impact | Phase 4 Impact |
|-----------|-----------------|----------------|
| MMSE Scoring | ✅ Unchanged | ✅ Used in multimodal fusion |
| MoCA Scoring | ✅ Unchanged | ✅ Used in multimodal fusion |
| Sensory Module | ✅ **Isolated** | ⚠️ Requires refactoring (remove from multimodal) |
| Risk Classification | ✅ Unchanged | ⚠️ Will include biomarker input |
| Database Schema | ✅ Current schema (Phase 1-3) | Requires Phase 4 migration |
| UI Navigation | ✅ No multimodal link | Will add `/multimodal` route in Phase 4 |
| Authentication | ✅ No changes | ✅ Same auth as Phase 1-3 |

---

## ✋ Rollback Plan

If Phase 1-3 deployment fails, multimodal code remains untouched:
1. All Phase 1-3 modules compile normally (no multimodal dependencies injected)
2. Multimodal folder can be safely deleted without affecting core functionality
3. Version control preserves code if future reactivation needed

---

## 📝 Sign-Off

**Decision Made:** March 31, 2026  
**Approved By:** User + GitHub Copilot (Recommendation)  
**Implementation:** Complete  
**Status:** ✅ Phase 4 Deferral Active

### Next Steps
1. ✅ Type system fixed (compilation errors resolved)
2. ✅ Navigation integration disabled
3. ⏳ Focus on Phase 1-3 core module deployment
4. 📅 Schedule Phase 4 kickoff after Phase 3 stabilization (~Week 12)

---

## 📚 Related Documentation
- `MULTIMODAL_FIXES.md` - Type system audit & fixes
- `IMPLEMENTATION_ROADMAP.md` - 4-week Phase 1-3 sprint plan
- `DEVELOPER_HANDOFF.md` - Integration guide for core modules
- `Master Blueprint.md` - Complete specifications (Phase 1-4)

---

**Questions or Issues?** Update this document with Phase 4 requirements as they become clear during Phase 1-3 development.

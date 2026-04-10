# DEVELOPER HANDOFF PACKAGE
# What Your Developer Needs to Know

---

## STATUS UPDATE - April 6, 2026

This handoff now covers two tracks:

1. The original production data-model and clinical persistence upgrade described below.
2. The current multilingual stabilization work that was completed after the original handoff was written.

The app has already been updated to improve multilingual UI behavior, password auth, Qwen translation integration, and hearing-screen localization. The remaining work is not a rebuild. It is a focused stabilization pass.

### What Was Fixed Recently
- Added a shared Qwen translation helper and a translation health endpoint at `/api/translate/health`.
- Fixed registration/login for legacy phone-number users who existed without `password_hash`.
- Added browser-friendly login and registration autofill behavior.
- Expanded translation coverage for MMSE, MoCA, TCM, visual screening, multimodal landing/status screens, and hearing screening.
- Updated spoken hearing digits to use language-aware words and the selected voice when available.

### Verified Production State
- Live app URL: `https://v0-v0mentalassessmain.vercel.app`
- Production is reachable.
- `/api/translate/health` is deployed in production.
- Current production response still reports Qwen as not configured:

```json
{
   "ok": false,
   "provider": "qwen",
   "configured": false,
   "apiKeySource": null,
   "model": "qwen-plus",
   "baseUrl": "https://dashscope-intl.aliyuncs.com/compatible-mode/v1"
}
```

This means runtime translation fallback is still disabled in production until the Vercel environment variables are correctly present on the deployed project.

### Highest-Priority Remaining Issues

#### 1. Multimodal components still have major hardcoded English coverage
Top files to refactor:
- `components/multimodal/multimodal-dashboard.tsx`
- `components/multimodal/multimodal-report-card.tsx`
- `components/multimodal/multimodal-clinical-guidance.tsx`
- `components/multimodal/eeg-erp-panel.tsx`
- `components/multimodal/sensory-intelligence-panel.tsx`
- `components/multimodal/blood-biomarker-panel.tsx`

These components currently contain visible English-only patient or clinician-facing labels such as:
- `Saving...`
- `Multimodal Cognitive Report`
- `Clinical Interpretation & Guidance`
- `Blood Biomarkers`
- `Sensory Intelligence`

#### 2. Some components still use a two-language shortcut that breaks Cantonese and French
Pattern to remove:

```ts
language === "zh" ? chineseText : localizeText(englishText)
```

Known files where this still appears:
- `components/assessments/tcm-constitution.tsx`
- `components/assessments/memory-task.tsx`

This pattern works only for Chinese vs English and leaves Cantonese/French users dependent on fallback behavior.

#### 3. Browser speech is still not reliable enough to be the only multilingual audio strategy
Current behavior is improved, but browser voices remain device-dependent. If no matching local voice exists, spoken output may still degrade or become unavailable.

### Immediate Developer Checklist
- Fix Vercel production env so `/api/translate/health` returns `configured: true`.
- Add explicit multimodal translation keys in `contexts/language-context.tsx` for `en`, `zh`, `yue`, and `fr`.
- Refactor all multimodal panels to use `useLanguage()` and `t()` instead of raw English strings.
- Remove all `language === "zh"` shortcuts from patient-facing flows.
- Run a repo-wide audit for hardcoded English in `app/`, `components/`, and any UI-facing `lib/` utilities.
- Add manual QA coverage for all four languages across text and speech.

### Recommended Architecture Going Forward

#### Text localization
- Use explicit dictionary keys for all core assessment copy, labels, prompts, validation messages, and risk text.
- Treat runtime AI translation as a temporary fallback only for low-risk text.
- Do not rely on runtime translation for clinical instructions, scoring text, consent text, or patient guidance.

#### Speech/audio
- Keep browser speech synthesis only as a non-guaranteed fallback.
- For production multilingual assessment instructions, move to one of these two stable approaches:
   - pre-recorded language-specific audio assets for fixed instructions
   - server-side TTS generation with cached audio files per language and prompt key
- Clinical instruction audio should be deterministic and QA-approved, not generated ad hoc in-browser.

#### AI usage
- Yes, this can still become an AI app.
- The correct architecture is to keep AI outside the scoring truth path.
- Use AI for:
   - translation fallback for non-critical content
   - narrative report drafting
   - summarizing multimodal findings for clinicians
   - anomaly detection suggestions
   - clinical decision support draft text that is reviewed before use
- Do not use AI as the sole source of truth for:
   - MMSE/MoCA score calculation
   - risk thresholds
   - patient safety instructions
   - multilingual consent or required clinical instructions

### Recommended Next Sprint

#### Sprint A: Stabilize multilingual UX
- Production Qwen env verification
- Multimodal i18n refactor
- Remove remaining two-language shortcuts
- Full four-language manual QA pass

#### Sprint B: Make speech production-safe
- Inventory every spoken instruction
- Decide between recorded audio vs server TTS
- Add cached audio lookup by language + instruction key
- Fall back to text-only if audio is unavailable

#### Sprint C: Add AI in the right layer
- Keep deterministic scoring and storage
- Add AI-generated summaries after results are saved
- Log model version and prompt version for traceability
- Keep a human-review path for clinical-facing narrative output

---

## 📌 YOU HAVE RECEIVED 6 IMPLEMENTATION FILES

### 1. **scripts/05-upgrade-schema-phase1.sql** ← RUN THIS FIRST
- Creates 10 new production-grade tables
- Implements Row-Level Security (RLS)
- Preserves ability to roll back if needed
- **Time to run:** ~5-10 seconds
- **After:** Wait for confirmation all tables created successfully

### 2. **scripts/06-rls-policies-complete.sql** ← RUN THIS SECOND
- Implements role-based access control
- Admins can see everything
- Clinicians see only their patients + sessions
- Patients see only their own records
- **After:** Verify policies with: `SELECT schemaname, tablename, rowsecurity FROM pg_tables WHERE rowsecurity = true;`

### 3. **lib/mmse/mmse-service.ts**
- Drop-in service for MMSE item-level scoring
- Implements exact 30-point blueprint scoring
- Includes all scoring functions (orientation, attention, naming, etc.)
- Has `saveMMSEResults()` function to store in database
- **Usage:** Import and call after MMSE assessment completes

### 4. **lib/moca/moca-service.ts**
- MoCA scoring with critical education adjustment
- **IMPORTANT:** Fetches education_level from patients table
- Stores total_score_raw, education_adjustment, total_score_final separately
- Has `saveMoCAResults()` function
- **Usage:** Import and call after MoCA assessment completes

### 5. **lib/recommendations/risk-classification-service.ts**
- Risk classification (normal/mild/moderate/high)
- Generates recommendation text per clinician
- Determines referral_needed status
- Has `saveRecommendations()` function
- **Usage:** Call after scores are saved

### 6. **lib/database.types.ts**
- TypeScript types for all new tables
- **IMPORTANT:** Should be auto-generated from Supabase
- Command: `npx supabase gen types typescript > lib/database.types.ts`

### 7. **IMPLEMENTATION_ROADMAP.md** ← READ THIS CAREFULLY
- 4-week sprint plan with exact tasks
- Prioritized by risk level
- Dependencies clearly marked
- Time estimates for each phase

---

## ⚠️ CRITICAL REQUIREMENTS (Do NOT Skip)

### 1. Education Level is MANDATORY
- patients.education_level must be captured during registration
- Required to apply MoCA +1 point adjustment
- If ≤12 years: +1 point to final score
- If >12 years: no adjustment

### 2. Sensory Scores NEVER Merge into MMSE/MoCA
- Vision, hearing, olfactory stored in separate sensory_screenings table
- Used ONLY for contextual interpretation
- Example: "Normal cognition + multiple sensory deficits = monitor for future decline"
- **If you merge sensory into cognitive totals, the scoring is clinically invalid**

### 3. Item-Level Raw Answers MUST Be Stored
- raw_answers JSON field on mmse_results and moca_results
- Include every single response (even blank ones score as 0)
- Enables: audit trail, detailed reporting, research analysis
- Do NOT skip this - it's required for publication

### 4. Assessment Sessions are the Parent Record
- BEFORE showing first assessment component, create assessment_sessions record
- Get back session_id
- Pass session_id to every result table (mmse_results.session_id, etc.)
- This prevents orphaned data and ensures referential integrity

### 5. RLS Must Be Enforced (Non-Optional)
- Set `is_active = true` on all RLS policies
- Test: clinician_A cannot see clinician_B's patients
- Test: admin CAN see all patients
- Test: patient cannot see other patients' records
- HIPAA compliance depends on this

---

## 🔧 INTEGRATION CHECKLIST

### Step 1: Database Migration (Week 1)
- [ ] Backup current assessments table (export to JSON)
- [ ] Run script 05-upgrade-schema-phase1.sql
- [ ] Run script 06-rls-policies-complete.sql
- [ ] Verify RLS is enabled on all tables
- [ ] Verify patient table has education_level field

### Step 2: Update App Flow (Week 1-2)
- [ ] In `app/page.tsx`: Create assessment_sessions BEFORE starting test
- [ ] In `app/page.tsx`: Pass session_id to each component
- [ ] In each MMSE component: Call `calculateMMSEScores()` at end
- [ ] In each MoCA component: Call `calculateMoCAScores()` at end
- [ ] Update all `onComplete()` callbacks to save to database

### Step 3: Add New Libraries (Week 1)
```bash
npm install @react-pdf/renderer
# OR
npm install pdfkit
```

### Step 4: Implement Services (Week 2)
- [ ] Copy mmse-service.ts to lib/mmse/
- [ ] Copy moca-service.ts to lib/moca/
- [ ] Copy risk-classification-service.ts to lib/recommendations/
- [ ] Update database.types.ts (run Supabase CLI)

### Step 5: Update Components (Week 2-3)
- [ ] mmse-orientation.tsx: import + call mmseService
- [ ] mmse-attention.tsx: import + call mmseService
- [ ] moca-*.tsx: import + call mocaService
- [ ] assessment completion: call classifyRisk() + save recommendations

### Step 6: Test (Week 3-4)
- [ ] Unit test: MMSE scoring (5 test cases)
- [ ] Unit test: MoCA scoring with education=12 years
- [ ] Integration test: Full workflow session → save → retrieve
- [ ] Security test: RLS blocks cross-clinician access
- [ ] Data test: All fields saved to database correctly

---

## 🎯 WHAT THE DEVELOPER NEEDS TO CHANGE IN EXISTING CODE

| File | What to Change | Why |
|------|---|---|
| `app/page.tsx` | Create assessment_sessions BEFORE components | Needed as parent FK for all results |
| `components/assessments/mmse-*.tsx` | Call saveMMSEResults() instead of local state | Must persist to database at item level |
| `components/assessments/moca-*.tsx` | Call saveMoCAResults() with education adjustment | MoCA adjustment is research-critical |
| `components/results-display.tsx` | Pull from mmse_results/moca_results tables | Instead of assessments JSONB blob |
| `lib/supabase.ts` | Regenerate types from new schema | Required for TypeScript |
| `admin-panel.tsx` | Update queries to new table structure | Current queries will break |

---

## ✅ WHAT STAYS THE SAME

- ✅ All UI components (keep visual design)
- ✅ All multilingual translations (keep language-context.tsx)
- ✅ All component styling (Tailwind + card layouts)
- ✅ All assessment logic (same scoring rules, just stored better)
- ✅ Sensory modules keep their UI, just stored separately
- ✅ TCM module keeps its UI, just stored separately

**The app LOOKS identical. The data storage becomes clinically sound.**

---

## 🔐 SECURITY CHECKPOINTS

Before deploying to production:

1. **RLS Verification:**
   ```sql
   SELECT schemaname, tablename, rowsecurity FROM pg_tables 
   WHERE schemaname = 'public' ORDER BY tablename;
   ```
   Should show `rowsecurity = true` for ALL tables.

2. **No Hardcoded Credentials:**
   - Remove any username/password from code
   - Use Supabase Auth for all login
   - Use environment variables for config

3. **No PII in Logs:**
   - Search codebase for `console.log` with patient names, IDs
   - Production build should have these stripped
   - Audit logs handle sensitive tracking

4. **Consent Tracking:**
   - patients.consent_signed_at must be populated
   - Verify before allowing assessment

5. **Audit Trail:**
   - Every data access goes to audit_logs table
   - admin only can view audit_logs
   - Includes: who, what, when, why

---

## 📞 HANDOFF NOTES

### From Me (Copilot):
"Your app is clinically 90% correct already. The database schema and data flow are what need fixing. These 6 files + roadmap should handle that. The scoring logic is already implemented in your components - we're just storing it properly now."

### What Your App Gains:
1. **Clinically defensible data** - item-level scoring
2. **Research publication ready** - all supporting data included
3. **HIPAA compliance** - proper RLS + audit trail
4. **No privacy leaks** - role-based access control
5. **Better reporting** - trend graphs + recommendations

### Timeline:
- Week 1: Database migration + auth upgrade
- Week 2: Service layer + component integration
- Week 3: Testing + refinement
- Week 4: Production deployment + monitoring

### Questions for PI/Dr. Zebaze:
1. Confirm risk threshold values (per section 4.1 of Blueprint)
2. Confirm TCM questionnaire domains (if using TCM module)
3. Approve patient-facing disclaimer text
4. Approve referral language + thresholds
5. Any institution-specific data fields beyond standard schema?

---

**This is NOT a rebuild. This is an upgrade.**  
**Your app stays the same on the outside. The inside becomes production-grade.**

Good luck! 🚀

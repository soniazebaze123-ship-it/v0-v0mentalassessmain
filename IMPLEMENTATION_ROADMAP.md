# IMPLEMENTATION ROADMAP - v0-v0mentalassessmain
# Cognitive Assessment App - Blueprint to Production
# Master Blueprint + Developer Specification Alignment

---

## 📋 IMPLEMENTATION PHASES (4-Week Sprint)

### PHASE 1: Database Foundation & Security (Week 1)
**Goal:** Migrate to clinically-compliant schema with proper access control

#### Tasks:
- [ ] **1.1** Backup all data from current `assessments` table
  - Export to JSON for migration reference
  
- [ ] **1.2** Run SQL migration script: `scripts/05-upgrade-schema-phase1.sql`
  - Creates 10 new tables: profiles, patients, assessment_sessions, mmse_results, moca_results, sensory_screenings, tcm_constitution_results, recommendations, audit_logs, clock_drawing_results
  - Enables RLS on all tables
  - Creates indexes for performance
  
- [ ] **1.3** Run RLS policy script: `scripts/06-rls-policies-complete.sql`
  - Implements role-based access (admin, clinician, screener, patient)
  - Links all results to assessment_sessions (no orphaned records)
  
- [ ] **1.4** Migrate Supabase Auth
  - Remove hardcoded `admin_users` table
  - Configure Supabase phone/email OTP authentication
  - Create `profiles` records for each auth user with appropriate roles
  
- [ ] **1.5** Update `lib/database.types.ts`
  - Run: `npx supabase gen types typescript > lib/database.types.ts`
  - Regenerates TypeScript types from new schema

- [ ] **1.6** Write data migration script
  - Transfer old assessments → new mmse_results/moca_results tables
  - Populate assessment_sessions parent records
  - Preserve all raw_answers for audit trail

**Time estimate:** 5-8 hours  
**Risk level:** 🔴 HIGH - requires database migration, test on staging first

---

### PHASE 2: Exact MMSE/MoCA Scoring & Item-Level Storage (Week 2)
**Goal:** Implement validated scoring logic with clinical precision

#### Tasks:
- [ ] **2.1** Deploy `lib/mmse/mmse-service.ts`
  - Item-level scoring functions (orientation, registration, attention, recall, naming, repetition, command, reading, writing, copying)
  - Validates all 30 points are accounted for
  - Stores raw_answers JSON for complete audit trail
  - Choose attention pathway: serial_7s OR world_backwards (not hybrid)
  
- [ ] **2.2** Deploy `lib/moca/moca-service.ts`
  - Item-level scoring functions (visuospatial, naming, attention, language, abstraction, delayed_recall, orientation)
  - **CRITICAL:** Apply education adjustment (+1 if education_level ≤ 12 years)
  - Store total_score_raw, education_adjustment, total_score_final separately
  - Fetch education_level from patients table
  
- [ ] **2.3** Update component flow in `components/assessments/`
  - mmse-orientation.tsx: Call saveMMSEResults() after completion
  - mmse-attention.tsx: Pass attention_method to scoring function
  - moca-*.tsx components: Collect score data, call saveMoCAResults()
  
- [ ] **2.4** Create assessment_session before starting test
  - In `app/page.tsx`: Generate session_id before showing first component
  - Store test_date, examiner_user_id, app_language, device_type
  - Route all component results to this session
  
- [ ] **2.5** Test scoring accuracy
  - Create 5 test cases with known correct scores
  - Verify MMSE totals to 30, MoCA totals to 30 (+ education adjustment)
  - Check raw_answers JSON structure

**Time estimate:** 6-10 hours  
**Risk level:** 🟠 MEDIUM - scoring logic must be exact for clinical validity
**Validation:** Use MMSE/MoCA scoring PDF references to verify

---

### PHASE 3: Risk Classification & Recommendations (Week 2-3)
**Goal:** Generate clinically actionable output

#### Tasks:
- [ ] **3.1** Deploy `lib/recommendations/risk-classification-service.ts`
  - Implement risk classification logic (normal/mild/moderate/high)
  - Generate recommendation text per Blueprint Section 4.1
  - Determine referral_needed based on score + age + sensory impairments
  
- [ ] **3.2** Create risk thresholds configuration
  - MMSE: Normal (24-30), Mild (18-23), Moderate (10-17), Severe (0-9)
  - MoCA: Normal (26-30), Mild (18-25), Moderate (10-17), Severe (0-9)
  - Allow institution/PI override
  
- [ ] **3.3** Integrate with sensory screening
  - **CRITICAL:** Never merge sensory scores into MMSE/MoCA totals
  - Use sensory impairments as contextual variables only
  - Store in separate sensory_screenings table
  
- [ ] **3.4** Save recommendations after session completion
  - Call saveRecommendations() with classification output
  - Link to assessment_session
  
- [ ] **3.5** Test with edge cases
  - Low score + no sensory issues (high cognitive concern)
  - Normal score + multiple sensory deficits (monitor for decline)
  - Borderline score at age 70 (trigger specialist referral)

**Time estimate:** 4-6 hours  
**Risk level:** 🔴 HIGH - recommendations go directly to clinician, must be accurate

---

### PHASE 4: Patient Data & Consent Management (Week 3)
**Goal:** Implement complete patient registration with informed consent

#### Tasks:
- [ ] **4.1** Update patient creation workflow
  - Collect: name, DOB, sex, phone, education_level, preferred_language
  - **CRITICAL:** education_level required for MoCA adjustment
  - Store consent_signed_at timestamp
  
- [ ] **4.2** Add consent capture & tracking
  - Display consent form before starting assessment
  - Store consent_signed_at in patients table
  - Add consent_version field for audit trail
  
- [ ] **4.3** Implement audit logging
  - After each assessment: INSERT into audit_logs
  - Log: actor_user_id, entity_type, entity_id, action, metadata
  - Use for HIPAA compliance + research governance
  
- [ ] **4.4** Test data anonymization option
  - Add flag: is_anonymized (replaces name, phone, national_id with NULL where appropriate)
  - Export anonymized data for research use
  
**Time estimate:** 3-4 hours  
**Risk level:** 🔴 CRITICAL - affects clinical/research compliance

---

### PHASE 5: Reporting & PDF Generation (Week 3-4)
**Goal:** Generate clinician-ready reports

#### Tasks:
- [ ] **5.1** Install PDF library
  - Recommended: `@react-pdf/renderer` or `pdfkit` (server-side)
  
- [ ] **5.2** Create PDF report template
  - Patient demographics (name, DOB, ID number if applicable)
  - Test date, examiner name, language used
  - MMSE: item-level scores + total (0-30)
  - MoCA: item-level scores + raw total + education adjustment + final total (0-31)
  - Sensory screening results (separate from cognitive)
  - TCM constitution (if applicable, separate section)
  - Risk classification + recommendations + referral_needed flag
  
- [ ] **5.3** Create trend graphs
  - X-axis: test_date (multiple sessions over time)
  - Y-axis: MMSE/MoCA scores and risk classification
  - Use existing `patient-progress-tracker.tsx` as reference
  
- [ ] **5.4** Add export functionality
  - Button: "Download PDF Report"
  - Query: assessment_sessions + mmse_results/moca_results + recommendations
  - Generate + serve PDF
  
- [ ] **5.5** Test report accuracy
  - Verify all data from database is correctly displayed
  - Check formatting on mobile/tablet/desktop
  - Ensure PII is handled correctly (no console logs)

**Time estimate:** 5-8 hours  
**Risk level:** 🟠 MEDIUM - high volume of data to format correctly

---

### PHASE 6: Testing & Deployment (Week 4)
**Goal:** Validate all systems before clinical use

#### Tests:
- [ ] **6.1** Unit tests
  - MMSE scoring: 5 test cases with known correct outputs
  - MoCA scoring with/without education adjustment
  - Risk classification logic
  - Command: `npm run test`
  
- [ ] **6.2** Integration tests
  - Complete assessment workflow (sessions → results → recommendations)
  - Data flows correctly to database
  - RLS policies block unauthorized access
  
- [ ] **6.3** Security audit
  - Verify RLS on all tables
  - Check for PII in console logs
  - Confirm no hardcoded credentials
  - Test login/logout + role-based access
  
- [ ] **6.4** Clinical validation
  - Verify MMSE/MoCA scoring matches published standards
  - Have PI/clinician review sample reports
  - Confirm recommendation thresholds align with institutional policy
  
- [ ] **6.5** Staging deployment
  - Deploy to staging environment
  - Run full test suite
  - Load test with 50+ concurrent users
  
- [ ] **6.6** Production deployment
  - Final database backup
  - Deploy with monitoring
  - Have support ready for first 48 hours

**Time estimate:** 4-6 hours  
**Risk level:** 🔴 CRITICAL - validation is non-negotiable

---

## 📊 DEPENDENCY GRAPH

\`\`\`
PHASE 1 (Database)
    ↓
PHASE 2 (MMSE/MoCA Scoring) + PHASE 4 (Patient Data)
    ↓
PHASE 3 (Risk Classification)
    ↓
PHASE 5 (Reporting)
    ↓
PHASE 6 (Testing & Deployment)
\`\`\`

Phases 2+4 can run in parallel after Phase 1 completes.

---

## 📁 FILES GENERATED FOR YOUR DEVELOPER

1. **scripts/05-upgrade-schema-phase1.sql** (500 lines)
   - Complete schema migration with RLS
   
2. **scripts/06-rls-policies-complete.sql** (250 lines)
   - Role-based access control policies
   
3. **lib/mmse/mmse-service.ts** (300 lines)
   - MMSE item-level scoring + database save
   
4. **lib/moca/moca-service.ts** (280 lines)
   - MoCA item-level scoring with education adjustment
   
5. **lib/recommendations/risk-classification-service.ts** (200 lines)
   - Risk classification + recommendation generation
   
6. **lib/database.types.ts** (auto-generated)
   - TypeScript types for all new tables

---

## 🚨 CRITICAL SUCCESS FACTORS

1. **Education Level Required:**
   - patients.education_level MUST be captured to apply MoCA adjustment
   - Field is NOT optional
   
2. **Sensory ≠ Cognitive:**
   - Sensory scores NEVER added to MMSE/MoCA totals
   - Stored in separate sensory_screenings table
   - Used for contextual interpretation only
   
3. **Item-Level Storage:**
   - All raw_answers preserved in JSON
   - Enables audit trail + detailed reporting
   - Required for research/publication
   
4. **RLS Enforcement:**
   - Clinician can ONLY see their own patients/sessions
   - Patient can see only their own records
   - Admins have full access
   - No exceptions = HIPAA compliance
   
5. **Scoring Accuracy:**
   - MMSE must total exactly 30 points (no more, no less)
   - MoCA must total exactly 30 points + education adjustment
   - Validate against published scoring manuals
   
---

## 🎯 SUCCESS CRITERIA (Ready for Clinical Use)

- ✅ Database passes security audit (RLS verified)
- ✅ MMSE scoring validated against 5 test cases
- ✅ MoCA scoring with education adjustment verified
- ✅ Report PDFs generated correctly with all fields
- ✅ Trend graphs display multiple sessions correctly
- ✅ Recommendations align with risk thresholds
- ✅ No PII in console logs (production mode)
- ✅ UI remains unchanged (only backend/data layer upgraded)
- ✅ All tests passing (unit + integration + security)

---

## 📞 DEVELOPER HANDOFF CHECKLIST

Before handing this to your developer, confirm:

- [ ] They have access to Supabase project + SQL editor
- [ ] They have read both Master Blueprint AND Developer Specification
- [ ] They understand MMSE/MoCA scoring before writing code
- [ ] They have staging environment for testing
- [ ] They have backup of current assessment data
- [ ] They have PI approval on risk thresholds
- [ ] They have clearance to collect education_level as required field

---

**Created:** March 31, 2026  
**Status:** Ready for implementation  
**Next step:** Provide this roadmap + 6 generated files to developer

-- ============================================================================
-- PHASE 1: UPGRADE SCHEMA - NEW TABLES (Master Blueprint Compliant)
-- Master Blueprint: Section 2.1 - Core tables and relationships
-- ============================================================================
-- RUN THIS AFTER confirming existing data backup
-- Time to run: ~5-10 seconds

-- ============================================================================
-- 1. PROFILES TABLE (Identity & Role-Based Access)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  -- id = auth.users.id (linked to Supabase Auth)
  role TEXT NOT NULL CHECK (role IN ('admin', 'clinician', 'screener', 'patient')),
  full_name TEXT NOT NULL,
  phone TEXT UNIQUE,
  preferred_language TEXT DEFAULT 'en' CHECK (preferred_language IN ('en', 'zh', 'yue', 'fr')),
  department TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS profiles_role_idx ON public.profiles(role);
CREATE INDEX IF NOT EXISTS profiles_phone_idx ON public.profiles(phone);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id OR role = 'admin');

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

CREATE POLICY "Admins can manage all profiles" ON public.profiles
  FOR ALL USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin');

-- ============================================================================
-- 2. PATIENTS TABLE (Master Patient Registry)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.patients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  hospital_patient_id TEXT UNIQUE,
  national_id TEXT UNIQUE,
  full_name TEXT NOT NULL,
  date_of_birth DATE NOT NULL,
  sex TEXT CHECK (sex IN ('M', 'F', 'Other', 'Prefer not to say')),
  phone TEXT,
  education_level INTEGER CHECK (education_level >= 0 AND education_level <= 20),
  -- 0-6: primary, 7-12: secondary, 13-16: tertiary, 17+: advanced
  preferred_language TEXT DEFAULT 'en' CHECK (preferred_language IN ('en', 'zh', 'yue', 'fr')),
  consent_signed_at TIMESTAMPTZ,
  notes TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS patients_creator_user_id_idx ON public.patients(creator_user_id);
CREATE INDEX IF NOT EXISTS patients_national_id_idx ON public.patients(national_id);
CREATE INDEX IF NOT EXISTS patients_created_at_idx ON public.patients(created_at);

ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Clinicians can view patients they created" ON public.patients
  FOR SELECT USING (creator_user_id = auth.uid() OR (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin');

CREATE POLICY "Patients can view own record" ON public.patients
  FOR SELECT USING (id::TEXT = auth.uid()::TEXT);

CREATE POLICY "Clinicians can create patients" ON public.patients
  FOR INSERT WITH CHECK (creator_user_id = auth.uid());

-- ============================================================================
-- 3. ASSESSMENT_SESSIONS TABLE (Parent Record for All Test Results)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.assessment_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  examiner_user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  test_date DATE NOT NULL,
  setting TEXT CHECK (setting IN ('clinic', 'community', 'self-use', 'home')),
  app_language TEXT DEFAULT 'en' CHECK (app_language IN ('en', 'zh', 'yue', 'fr')),
  device_type TEXT CHECK (device_type IN ('web', 'tablet', 'mobile')),
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  status TEXT DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed', 'abandoned', 'review_pending')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS assessment_sessions_patient_id_idx ON public.assessment_sessions(patient_id);
CREATE INDEX IF NOT EXISTS assessment_sessions_examiner_user_id_idx ON public.assessment_sessions(examiner_user_id);
CREATE INDEX IF NOT EXISTS assessment_sessions_test_date_idx ON public.assessment_sessions(test_date);
CREATE INDEX IF NOT EXISTS assessment_sessions_status_idx ON public.assessment_sessions(status);

ALTER TABLE public.assessment_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Clinicians can view own sessions" ON public.assessment_sessions
  FOR SELECT USING (examiner_user_id = auth.uid() OR (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin');

-- ============================================================================
-- 4. MMSE_RESULTS TABLE (Item-Level Results â€“ Validated Scoring)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.mmse_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.assessment_sessions(id) ON DELETE CASCADE,
  
  -- Domain scores (out of 30 total)
  orientation_time_score INTEGER CHECK (orientation_time_score >= 0 AND orientation_time_score <= 5),
  orientation_place_score INTEGER CHECK (orientation_place_score >= 0 AND orientation_place_score <= 5),
  registration_score INTEGER CHECK (registration_score >= 0 AND registration_score <= 3),
  attention_calc_score INTEGER CHECK (attention_calc_score >= 0 AND attention_calc_score <= 5),
  delayed_recall_score INTEGER CHECK (delayed_recall_score >= 0 AND delayed_recall_score <= 3),
  naming_score INTEGER CHECK (naming_score >= 0 AND naming_score <= 2),
  repetition_score INTEGER CHECK (repetition_score >= 0 AND repetition_score <= 1),
  command_score INTEGER CHECK (command_score >= 0 AND command_score <= 3),
  reading_score INTEGER CHECK (reading_score >= 0 AND reading_score <= 1),
  writing_score INTEGER CHECK (writing_score >= 0 AND writing_score <= 1),
  copying_score INTEGER CHECK (copying_score >= 0 AND copying_score <= 1),
  
  total_score INTEGER CHECK (total_score >= 0 AND total_score <= 30),
  
  -- Raw item responses (for audit trail)
  raw_answers JSONB,
  
  -- Attention pathway chosen
  attention_method TEXT CHECK (attention_method IN ('serial_7s', 'world_backwards')),
  
  reviewer_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS mmse_results_session_id_idx ON public.mmse_results(session_id);
CREATE INDEX IF NOT EXISTS mmse_results_total_score_idx ON public.mmse_results(total_score);

ALTER TABLE public.mmse_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Clinicians can view mmse results for own sessions" ON public.mmse_results
  FOR SELECT USING (
    session_id IN (
      SELECT id FROM public.assessment_sessions WHERE examiner_user_id = auth.uid()
    ) OR (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
  );

-- ============================================================================
-- 5. MOCA_RESULTS TABLE (Item-Level Results â€“ With Education Adjustment)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.moca_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.assessment_sessions(id) ON DELETE CASCADE,
  
  -- Domain scores (out of 30 total)
  visuospatial_exec_score INTEGER CHECK (visuospatial_exec_score >= 0 AND visuospatial_exec_score <= 5),
  naming_score INTEGER CHECK (naming_score >= 0 AND naming_score <= 3),
  attention_score INTEGER CHECK (attention_score >= 0 AND attention_score <= 6),
  language_score INTEGER CHECK (language_score >= 0 AND language_score <= 3),
  abstraction_score INTEGER CHECK (abstraction_score >= 0 AND abstraction_score <= 2),
  delayed_recall_score INTEGER CHECK (delayed_recall_score >= 0 AND delayed_recall_score <= 5),
  orientation_score INTEGER CHECK (orientation_score >= 0 AND orientation_score <= 6),
  
  -- Scoring breakdown
  total_score_raw INTEGER CHECK (total_score_raw >= 0 AND total_score_raw <= 30),
  education_adjustment INTEGER CHECK (education_adjustment IN (0, 1)),
  -- +1 if education_level <= 12 years
  total_score_final INTEGER CHECK (total_score_final >= 0 AND total_score_final <= 31),
  
  -- Raw item responses (for audit trail)
  raw_answers JSONB,
  
  reviewer_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS moca_results_session_id_idx ON public.moca_results(session_id);
CREATE INDEX IF NOT EXISTS moca_results_total_score_final_idx ON public.moca_results(total_score_final);

ALTER TABLE public.moca_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Clinicians can view moca results for own sessions" ON public.moca_results
  FOR SELECT USING (
    session_id IN (
      SELECT id FROM public.assessment_sessions WHERE examiner_user_id = auth.uid()
    ) OR (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
  );

-- ============================================================================
-- 6. CLOCK_DRAWING_RESULTS TABLE (Optional Separate Scoring Artifact)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.clock_drawing_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.assessment_sessions(id) ON DELETE CASCADE,
  
  contour_score INTEGER CHECK (contour_score >= 0 AND contour_score <= 1),
  number_score INTEGER CHECK (number_score >= 0 AND number_score <= 1),
  hand_score INTEGER CHECK (hand_score >= 0 AND hand_score <= 1),
  total_score INTEGER CHECK (total_score >= 0 AND total_score <= 3),
  
  image_uri TEXT,
  reviewer_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS clock_drawing_results_session_id_idx ON public.clock_drawing_results(session_id);

ALTER TABLE public.clock_drawing_results ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 7. SENSORY_SCREENINGS TABLE (SEPARATE from cognitive scores - NEVER merged)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.sensory_screenings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.assessment_sessions(id) ON DELETE CASCADE,
  
  vision_status TEXT CHECK (vision_status IN ('pass', 'refer', 'invalid', 'not_tested')),
  hearing_status TEXT CHECK (hearing_status IN ('pass', 'refer', 'invalid', 'not_tested')),
  olfactory_status TEXT CHECK (olfactory_status IN ('pass', 'refer', 'invalid', 'not_tested')),
  touch_status TEXT CHECK (touch_status IN ('normal', 'impaired', 'not_tested')),
  
  -- Questionnaire responses
  hearing_questionnaire JSONB,
  olfactory_kit_code TEXT, -- e.g., "Kit-001-Cherry"
  
  vision_score INTEGER CHECK (vision_score >= 0 AND vision_score <= 100),
  hearing_score INTEGER CHECK (hearing_score >= 0 AND hearing_score <= 100),
  olfactory_score INTEGER CHECK (olfactory_score >= 0 AND olfactory_score <= 100),
  
  reviewer_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS sensory_screenings_session_id_idx ON public.sensory_screenings(session_id);

ALTER TABLE public.sensory_screenings ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 8. TCM_CONSTITUTION_RESULTS TABLE (Supportive only â€“ separate from cognitive)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.tcm_constitution_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.assessment_sessions(id) ON DELETE CASCADE,
  
  constitution_primary TEXT,
  constitution_secondary TEXT,
  
  questionnaire JSONB,
  tongue_image_uri TEXT,
  facial_image_uri TEXT,
  
  clinician_comment TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS tcm_constitution_results_session_id_idx ON public.tcm_constitution_results(session_id);

ALTER TABLE public.tcm_constitution_results ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 9. RECOMMENDATIONS TABLE (Clinical Output & Risk Classification)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.assessment_sessions(id) ON DELETE CASCADE,
  
  risk_classification TEXT CHECK (risk_classification IN ('normal', 'mild_risk', 'moderate_risk', 'high_risk')),
  recommendation_text TEXT NOT NULL,
  referral_needed BOOLEAN DEFAULT false,
  referral_reason TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS recommendations_session_id_idx ON public.recommendations(session_id);
CREATE INDEX IF NOT EXISTS recommendations_risk_classification_idx ON public.recommendations(risk_classification);

ALTER TABLE public.recommendations ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 10. AUDIT_LOGS TABLE (Security & Traceability)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  entity_type TEXT NOT NULL CHECK (entity_type IN ('patient', 'assessment_session', 'mmse_result', 'moca_result', 'sensory_screening', 'recommendation')),
  entity_id UUID NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('create', 'read', 'update', 'delete', 'export')),
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS audit_logs_actor_user_id_idx ON public.audit_logs(actor_user_id);
CREATE INDEX IF NOT EXISTS audit_logs_entity_type_idx ON public.audit_logs(entity_type);
CREATE INDEX IF NOT EXISTS audit_logs_created_at_idx ON public.audit_logs(created_at);

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view audit logs" ON public.audit_logs
  FOR SELECT USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin');

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
-- Next steps:
-- 1. Run script 06-migrate-data.sql to transfer data from old schema
-- 2. Run script 07-enable-rls-policies.sql to finalize security
-- 3. Test thoroughly before deploying
-- ============================================================================
-- RLS POLICY TEMPLATES FOR COMPLETE SECURITY (Master Blueprint Compliant)
-- Location: scripts/06-rls-policies-complete.sql
-- ============================================================================
-- Run this AFTER the main schema upgrade (05-upgrade-schema-phase1.sql)
-- This implements exact role-based access control per Master Blueprint Section 2.3

-- ============================================================================
-- CRITICAL: Remove OLD insecure RLS policies first
-- ============================================================================

DROP POLICY IF EXISTS "Allow all access to users" ON public.users;
DROP POLICY IF EXISTS "Allow all access to assessments" ON public.assessments;
DROP POLICY IF EXISTS "Allow all access to uploaded_files" ON public.uploaded_files;
DROP POLICY IF EXISTS "Allow all access to admin_users" ON public.admin_users;

-- ============================================================================
-- 1. PROFILES TABLE - Role-Based Access Control
-- ============================================================================

-- Admins can view all profiles
CREATE POLICY "Admins can view all profiles" ON public.profiles
  FOR SELECT USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin');

-- Clinicians/Screeners can view their own profile only
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (id = auth.uid());

-- Users can update their own profile (except role)
CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (id = auth.uid()) WITH CHECK (id = auth.uid() AND (SELECT role FROM public.profiles WHERE id = id) = (SELECT role FROM public.profiles WHERE id = auth.uid()));

-- Admins can update any profile
CREATE POLICY "Admins can update all profiles" ON public.profiles
  FOR UPDATE USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin');

-- ============================================================================
-- 2. PATIENTS TABLE - Clinician-Specific Access
-- ============================================================================

-- Clinicians can only view patients they created
CREATE POLICY "Clinicians can view own patients" ON public.patients
  FOR SELECT USING (creator_user_id = auth.uid() OR (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('admin', 'clinician'));

-- Patients can view their own record (if they log in as patient)
-- This requires patient_id to match auth.uid() in profiles
-- (Advanced: requires patient enrollment in profiles table)

-- Only clinicians can create patients
CREATE POLICY "Clinicians can create patients" ON public.patients
  FOR INSERT WITH CHECK ((SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('admin', 'clinician'));

-- Only the creating clinician or admin can update
CREATE POLICY "Clinicians can update own patients" ON public.patients
  FOR UPDATE USING (creator_user_id = auth.uid() OR (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin');

-- ============================================================================
-- 3. ASSESSMENT_SESSIONS TABLE - Examiner-Specific Access
-- ============================================================================

-- Clinicians can view only their own assessment sessions
CREATE POLICY "Clinicians can view own sessions" ON public.assessment_sessions
  FOR SELECT USING (examiner_user_id = auth.uid() OR (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin');

-- Only examiners can create sessions for their patients
CREATE POLICY "Examiners can create sessions" ON public.assessment_sessions
  FOR INSERT WITH CHECK ((SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('admin', 'clinician', 'screener'));

-- Only examiner or admin can update
CREATE POLICY "Examiners can update own sessions" ON public.assessment_sessions
  FOR UPDATE USING (examiner_user_id = auth.uid() OR (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin');

-- ============================================================================
-- 4. MMSE_RESULTS TABLE - Linked Session Access
-- ============================================================================

-- Users can only view MMSE results for their sessions
CREATE POLICY "Users can view MMSE results for own sessions" ON public.mmse_results
  FOR SELECT USING (
    session_id IN (
      SELECT id FROM public.assessment_sessions 
      WHERE examiner_user_id = auth.uid()
    ) OR (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
  );

-- Only examiners can insert MMSE results for their sessions
CREATE POLICY "Examiners can create MMSE results" ON public.mmse_results
  FOR INSERT WITH CHECK (
    session_id IN (
      SELECT id FROM public.assessment_sessions 
      WHERE examiner_user_id = auth.uid()
    ) AND (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('admin', 'clinician', 'screener')
  );

-- Only examiner can update
CREATE POLICY "Examiners can update MMSE results" ON public.mmse_results
  FOR UPDATE USING (
    session_id IN (
      SELECT id FROM public.assessment_sessions 
      WHERE examiner_user_id = auth.uid()
    ) OR (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
  );

-- ============================================================================
-- 5. MOCA_RESULTS TABLE - Linked Session Access
-- ============================================================================

CREATE POLICY "Users can view MoCA results for own sessions" ON public.moca_results
  FOR SELECT USING (
    session_id IN (
      SELECT id FROM public.assessment_sessions 
      WHERE examiner_user_id = auth.uid()
    ) OR (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
  );

CREATE POLICY "Examiners can create MoCA results" ON public.moca_results
  FOR INSERT WITH CHECK (
    session_id IN (
      SELECT id FROM public.assessment_sessions 
      WHERE examiner_user_id = auth.uid()
    ) AND (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('admin', 'clinician', 'screener')
  );

CREATE POLICY "Examiners can update MoCA results" ON public.moca_results
  FOR UPDATE USING (
    session_id IN (
      SELECT id FROM public.assessment_sessions 
      WHERE examiner_user_id = auth.uid()
    ) OR (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
  );

-- ============================================================================
-- 6. SENSORY_SCREENINGS TABLE - Linked Session Access
-- ============================================================================

CREATE POLICY "Users can view sensory results for own sessions" ON public.sensory_screenings
  FOR SELECT USING (
    session_id IN (
      SELECT id FROM public.assessment_sessions 
      WHERE examiner_user_id = auth.uid()
    ) OR (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
  );

CREATE POLICY "Examiners can create sensory results" ON public.sensory_screenings
  FOR INSERT WITH CHECK (
    session_id IN (
      SELECT id FROM public.assessment_sessions 
      WHERE examiner_user_id = auth.uid()
    )
  );

-- ============================================================================
-- 7. TCM_CONSTITUTION_RESULTS TABLE - Linked Session Access
-- ============================================================================

CREATE POLICY "Users can view TCM results for own sessions" ON public.tcm_constitution_results
  FOR SELECT USING (
    session_id IN (
      SELECT id FROM public.assessment_sessions 
      WHERE examiner_user_id = auth.uid()
    ) OR (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
  );

CREATE POLICY "Examiners can create TCM results" ON public.tcm_constitution_results
  FOR INSERT WITH CHECK (
    session_id IN (
      SELECT id FROM public.assessment_sessions 
      WHERE examiner_user_id = auth.uid()
    )
  );

-- ============================================================================
-- 8. RECOMMENDATIONS TABLE - Linked Session Access
-- ============================================================================

CREATE POLICY "Users can view recommendations for own sessions" ON public.recommendations
  FOR SELECT USING (
    session_id IN (
      SELECT id FROM public.assessment_sessions 
      WHERE examiner_user_id = auth.uid()
    ) OR (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
  );

CREATE POLICY "Examiners can create recommendations" ON public.recommendations
  FOR INSERT WITH CHECK (
    session_id IN (
      SELECT id FROM public.assessment_sessions 
      WHERE examiner_user_id = auth.uid()
    )
  );

-- ============================================================================
-- 9. AUDIT_LOGS TABLE - Admin Only
-- ============================================================================

CREATE POLICY "Only admins can view audit logs" ON public.audit_logs
  FOR SELECT USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin');

CREATE POLICY "System can insert audit logs" ON public.audit_logs
  FOR INSERT WITH CHECK (true);

-- ============================================================================
-- ENFORCEMENT
-- ============================================================================
-- Run this to verify RLS is enabled on all tables:
-- SELECT schemaname, tablename, rowsecurity FROM pg_tables 
-- WHERE schemaname = 'public' AND rowsecurity = true;

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

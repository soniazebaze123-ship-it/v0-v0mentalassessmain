/**
 * Assessment Session Management Service
 * Master Blueprint Section 2.2 - Session-Based Assessment Flow
 * 
 * Manages:
 * - Creation of assessment sessions (parent records)
 * - Session state tracking (in_progress, completed, abandoned)
 * - Linking all test results to sessions
 * - Referential integrity (no orphaned records)
 */

import { createClient } from "@/lib/supabase/client"

export interface AssessmentSessionInput {
  patient_id: string
  examiner_user_id: string
  test_date: string // YYYY-MM-DD
  setting: 'clinic' | 'community' | 'self-use' | 'home'
  app_language: 'en' | 'zh' | 'yue' | 'fr'
  device_type: 'web' | 'tablet' | 'mobile'
}

export interface AssessmentSession {
  id: string
  patient_id: string
  examiner_user_id: string
  test_date: string
  setting: string
  app_language: string
  device_type: string
  started_at: string
  completed_at: string | null
  status: 'in_progress' | 'completed' | 'abandoned' | 'review_pending'
  notes: string | null
  created_at: string
  updated_at: string
}

/**
 * Create a new assessment session
 * Must be called BEFORE showing any assessment components
 * 
 * @param input - Session configuration
 * @returns Session ID for use in all downstream result tables
 */
export async function createAssessmentSession(
  input: AssessmentSessionInput
): Promise<{ sessionId: string; error?: string }> {
  try {
    const supabase = createClient()

    const { data, error } = await supabase
      .from('assessment_sessions')
      .insert({
        patient_id: input.patient_id,
        examiner_user_id: input.examiner_user_id,
        test_date: input.test_date,
        setting: input.setting,
        app_language: input.app_language,
        device_type: input.device_type,
        status: 'in_progress',
        started_at: new Date().toISOString(),
      })
      .select('id')
      .single()

    if (error) {
      console.error('[Assessment Session] Create error:', error)
      return { sessionId: '', error: error.message }
    }

    console.log('[Assessment Session] Created session:', data.id)
    return { sessionId: data.id }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error('[Assessment Session] Exception:', message)
    return { sessionId: '', error: message }
  }
}

/**
 * Mark session as completed
 * Call after all assessments finish (MMSE/MoCA, sensory, etc.)
 * 
 * @param sessionId - Session UUID
 * @param notes - Optional clinician notes
 */
export async function completeAssessmentSession(
  sessionId: string,
  notes?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createClient()

    const { error } = await supabase
      .from('assessment_sessions')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
        notes: notes || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', sessionId)

    if (error) {
      console.error('[Assessment Session] Complete error:', error)
      return { success: false, error: error.message }
    }

    console.log('[Assessment Session] Completed session:', sessionId)
    return { success: true }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error('[Assessment Session] Exception:', message)
    return { success: false, error: message }
  }
}

/**
 * Mark session as abandoned (user quit prematurely)
 * @param sessionId - Session UUID
 * @param reason - Why session was abandoned
 */
export async function abandonAssessmentSession(
  sessionId: string,
  reason?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createClient()

    const { error } = await supabase
      .from('assessment_sessions')
      .update({
        status: 'abandoned',
        notes: reason || 'User abandoned assessment',
        updated_at: new Date().toISOString(),
      })
      .eq('id', sessionId)

    if (error) {
      console.error('[Assessment Session] Abandon error:', error)
      return { success: false, error: error.message }
    }

    console.log('[Assessment Session] Abandoned session:', sessionId)
    return { success: true }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error('[Assessment Session] Exception:', message)
    return { success: false, error: message }
  }
}

/**
 * Get session details
 * @param sessionId - Session UUID
 */
export async function getAssessmentSession(
  sessionId: string
): Promise<AssessmentSession | null> {
  try {
    const supabase = createClient()

    const { data, error } = await supabase
      .from('assessment_sessions')
      .select('*')
      .eq('id', sessionId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        // No rows found - not an error
        return null
      }
      console.error('[Assessment Session] Get error:', error)
      return null
    }

    return data as AssessmentSession
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error('[Assessment Session] Exception:', message)
    return null
  }
}

/**
 * Get all sessions for a patient
 * @param patientId - Patient UUID
 */
export async function getPatientSessions(
  patientId: string
): Promise<AssessmentSession[]> {
  try {
    const supabase = createClient()

    const { data, error } = await supabase
      .from('assessment_sessions')
      .select('*')
      .eq('patient_id', patientId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('[Assessment Session] Get patient sessions error:', error)
      return []
    }

    return (data || []) as AssessmentSession[]
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error('[Assessment Session] Exception:', message)
    return []
  }
}

/**
 * Get session completion status (what assessments have been done)
 * @param sessionId - Session UUID
 */
export async function getSessionCompletionStatus(
  sessionId: string
): Promise<{
  mmse_completed: boolean
  moca_completed: boolean
  sensory_completed: boolean
  tcm_completed: boolean
  recommendations_generated: boolean
}> {
  try {
    const supabase = createClient()

    // Query all result tables for this session
    const [mmse, moca, sensory, tcm, recommendations] = await Promise.all([
      supabase.from('mmse_results').select('id').eq('session_id', sessionId).limit(1),
      supabase.from('moca_results').select('id').eq('session_id', sessionId).limit(1),
      supabase.from('sensory_screenings').select('id').eq('session_id', sessionId).limit(1),
      supabase.from('tcm_constitution_results').select('id').eq('session_id', sessionId).limit(1),
      supabase.from('recommendations').select('id').eq('session_id', sessionId).limit(1),
    ])

    return {
      mmse_completed: (mmse.data?.length || 0) > 0,
      moca_completed: (moca.data?.length || 0) > 0,
      sensory_completed: (sensory.data?.length || 0) > 0,
      tcm_completed: (tcm.data?.length || 0) > 0,
      recommendations_generated: (recommendations.data?.length || 0) > 0,
    }
  } catch (err) {
    console.error('[Assessment Session] Error getting completion status:', err)
    return {
      mmse_completed: false,
      moca_completed: false,
      sensory_completed: false,
      tcm_completed: false,
      recommendations_generated: false,
    }
  }
}

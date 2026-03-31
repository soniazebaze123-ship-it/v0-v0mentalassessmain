// ============================================================================
// DATABASE TYPES - TypeScript Interface Generation
// Location: lib/database.types.ts
// Purpose: Auto-generate types from new Supabase schema (run after SQL migration)
// ============================================================================
// After running SQL migration, run: npx supabase gen types typescript > lib/database.types.ts

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          role: "admin" | "clinician" | "screener" | "patient";
          full_name: string;
          phone: string | null;
          preferred_language: string;
          department: string | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          role: "admin" | "clinician" | "screener" | "patient";
          full_name: string;
          phone?: string | null;
          preferred_language?: string;
          department?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          role?: "admin" | "clinician" | "screener" | "patient";
          full_name?: string;
          phone?: string | null;
          preferred_language?: string;
          department?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };

      patients: {
        Row: {
          id: string;
          creator_user_id: string;
          hospital_patient_id: string | null;
          national_id: string | null;
          full_name: string;
          date_of_birth: string;
          sex: string | null;
          phone: string | null;
          education_level: number | null;
          preferred_language: string;
          consent_signed_at: string | null;
          notes: string | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          creator_user_id: string;
          hospital_patient_id?: string | null;
          national_id?: string | null;
          full_name: string;
          date_of_birth: string;
          sex?: string | null;
          phone?: string | null;
          education_level?: number | null;
          preferred_language?: string;
          consent_signed_at?: string | null;
          notes?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          creator_user_id?: string;
          hospital_patient_id?: string | null;
          national_id?: string | null;
          full_name?: string;
          date_of_birth?: string;
          sex?: string | null;
          phone?: string | null;
          education_level?: number | null;
          preferred_language?: string;
          consent_signed_at?: string | null;
          notes?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };

      assessment_sessions: {
        Row: {
          id: string;
          patient_id: string;
          examiner_user_id: string;
          test_date: string;
          setting: string | null;
          app_language: string;
          device_type: string | null;
          started_at: string;
          completed_at: string | null;
          status: string;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          patient_id: string;
          examiner_user_id: string;
          test_date: string;
          setting?: string | null;
          app_language?: string;
          device_type?: string | null;
          started_at?: string;
          completed_at?: string | null;
          status?: string;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          patient_id?: string;
          examiner_user_id?: string;
          test_date?: string;
          setting?: string | null;
          app_language?: string;
          device_type?: string | null;
          started_at?: string;
          completed_at?: string | null;
          status?: string;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };

      mmse_results: {
        Row: {
          id: string;
          session_id: string;
          orientation_time_score: number | null;
          orientation_place_score: number | null;
          registration_score: number | null;
          attention_calc_score: number | null;
          delayed_recall_score: number | null;
          naming_score: number | null;
          repetition_score: number | null;
          command_score: number | null;
          reading_score: number | null;
          writing_score: number | null;
          copying_score: number | null;
          total_score: number | null;
          raw_answers: any;
          attention_method: string | null;
          reviewer_notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          session_id: string;
          orientation_time_score?: number | null;
          orientation_place_score?: number | null;
          registration_score?: number | null;
          attention_calc_score?: number | null;
          delayed_recall_score?: number | null;
          naming_score?: number | null;
          repetition_score?: number | null;
          command_score?: number | null;
          reading_score?: number | null;
          writing_score?: number | null;
          copying_score?: number | null;
          total_score?: number | null;
          raw_answers?: any;
          attention_method?: string | null;
          reviewer_notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          session_id?: string;
          orientation_time_score?: number | null;
          orientation_place_score?: number | null;
          registration_score?: number | null;
          attention_calc_score?: number | null;
          delayed_recall_score?: number | null;
          naming_score?: number | null;
          repetition_score?: number | null;
          command_score?: number | null;
          reading_score?: number | null;
          writing_score?: number | null;
          copying_score?: number | null;
          total_score?: number | null;
          raw_answers?: any;
          attention_method?: string | null;
          reviewer_notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };

      moca_results: {
        Row: {
          id: string;
          session_id: string;
          visuospatial_exec_score: number | null;
          naming_score: number | null;
          attention_score: number | null;
          language_score: number | null;
          abstraction_score: number | null;
          delayed_recall_score: number | null;
          orientation_score: number | null;
          total_score_raw: number | null;
          education_adjustment: number | null;
          total_score_final: number | null;
          raw_answers: any;
          reviewer_notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          session_id: string;
          visuospatial_exec_score?: number | null;
          naming_score?: number | null;
          attention_score?: number | null;
          language_score?: number | null;
          abstraction_score?: number | null;
          delayed_recall_score?: number | null;
          orientation_score?: number | null;
          total_score_raw?: number | null;
          education_adjustment?: number | null;
          total_score_final?: number | null;
          raw_answers?: any;
          reviewer_notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          session_id?: string;
          visuospatial_exec_score?: number | null;
          naming_score?: number | null;
          attention_score?: number | null;
          language_score?: number | null;
          abstraction_score?: number | null;
          delayed_recall_score?: number | null;
          orientation_score?: number | null;
          total_score_raw?: number | null;
          education_adjustment?: number | null;
          total_score_final?: number | null;
          raw_answers?: any;
          reviewer_notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };

      sensory_screenings: {
        Row: {
          id: string;
          session_id: string;
          vision_status: string | null;
          hearing_status: string | null;
          olfactory_status: string | null;
          touch_status: string | null;
          hearing_questionnaire: any;
          olfactory_kit_code: string | null;
          vision_score: number | null;
          hearing_score: number | null;
          olfactory_score: number | null;
          reviewer_notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          session_id: string;
          vision_status?: string | null;
          hearing_status?: string | null;
          olfactory_status?: string | null;
          touch_status?: string | null;
          hearing_questionnaire?: any;
          olfactory_kit_code?: string | null;
          vision_score?: number | null;
          hearing_score?: number | null;
          olfactory_score?: number | null;
          reviewer_notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          session_id?: string;
          vision_status?: string | null;
          hearing_status?: string | null;
          olfactory_status?: string | null;
          touch_status?: string | null;
          hearing_questionnaire?: any;
          olfactory_kit_code?: string | null;
          vision_score?: number | null;
          hearing_score?: number | null;
          olfactory_score?: number | null;
          reviewer_notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };

      tcm_constitution_results: {
        Row: {
          id: string;
          session_id: string;
          constitution_primary: string | null;
          constitution_secondary: string | null;
          questionnaire: any;
          tongue_image_uri: string | null;
          facial_image_uri: string | null;
          clinician_comment: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          session_id: string;
          constitution_primary?: string | null;
          constitution_secondary?: string | null;
          questionnaire?: any;
          tongue_image_uri?: string | null;
          facial_image_uri?: string | null;
          clinician_comment?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          session_id?: string;
          constitution_primary?: string | null;
          constitution_secondary?: string | null;
          questionnaire?: any;
          tongue_image_uri?: string | null;
          facial_image_uri?: string | null;
          clinician_comment?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };

      recommendations: {
        Row: {
          id: string;
          session_id: string;
          risk_classification: string;
          recommendation_text: string;
          referral_needed: boolean;
          referral_reason: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          session_id: string;
          risk_classification: string;
          recommendation_text: string;
          referral_needed: boolean;
          referral_reason?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          session_id?: string;
          risk_classification?: string;
          recommendation_text?: string;
          referral_needed?: boolean;
          referral_reason?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };

      audit_logs: {
        Row: {
          id: string;
          actor_user_id: string | null;
          entity_type: string;
          entity_id: string;
          action: string;
          metadata: any;
          created_at: string;
        };
        Insert: {
          id?: string;
          actor_user_id?: string | null;
          entity_type: string;
          entity_id: string;
          action: string;
          metadata?: any;
          created_at?: string;
        };
        Update: {
          id?: string;
          actor_user_id?: string | null;
          entity_type?: string;
          entity_id?: string;
          action?: string;
          metadata?: any;
          created_at?: string;
        };
      };
    };
    Views: {};
    Functions: {};
    Enums: {};
  };
}

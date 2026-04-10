import { createClient } from "@/lib/supabase/client"

export const supabase = createClient()

export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          phone_number: string
          created_at: string
        }
        Insert: {
          id?: string
          phone_number: string
        }
        Update: {
          phone_number?: string
          created_at?: string
        }
      }
      assessments: {
        Row: {
          id: string
          user_id: string
          assessment_type: "MOCA" | "MMSE"
          total_score: number
          section_scores: Record<string, any>
          completed_at: string
          laboratory_analysis?: string
        }
        Insert: {
          user_id: string
          assessment_type: "MOCA" | "MMSE"
          total_score: number
          section_scores: Record<string, any>
          laboratory_analysis?: string
        }
        Update: {
          total_score?: number
          section_scores?: Record<string, any>
          laboratory_analysis?: string
        }
      }
      uploaded_files: {
        Row: {
          id: string
          user_id: string
          filename: string
          file_path: string
          file_type: string
          file_size: number
          uploaded_at: string
        }
        Insert: {
          user_id: string
          filename: string
          file_path: string
          file_type: string
          file_size: number
        }
      }
      admin_users: {
        Row: {
          id: string
          username: string
          password_hash: string
          created_at: string
        }
      }
      user_progress: {
        Row: {
          id: string
          user_id: string
          assessment_type: "MOCA" | "MMSE"
          current_step: number
          scores: number[]
          updated_at: string
        }
        Insert: {
          user_id: string
          assessment_type: "MOCA" | "MMSE"
          current_step: number
          scores: number[]
        }
        Update: {
          current_step?: number
          scores?: number[]
          updated_at?: string
        }
      }
    }
  }
}

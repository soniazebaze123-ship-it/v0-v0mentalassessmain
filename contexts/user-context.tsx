"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"

interface User {
  id: string
  phone_number: string
  email: string
  name?: string
  date_of_birth?: string
  gender?: string
  national_id?: string
}

interface AssessmentProgress {
  assessment_type: "MOCA" | "MMSE"
  current_step: number
  scores: number[]
}

interface UserContextType {
  user: User | null
  loading: boolean
  login: (phoneNumber: string, password: string) => Promise<{ success: boolean; error?: string }>
  register: (
    phoneNumber: string,
    password: string,
    name?: string,
    dateOfBirth?: string,
    gender?: string,
    nationalId?: string,
  ) => Promise<{ success: boolean; error?: string }>
  logout: () => Promise<void>
  progress: Record<string, AssessmentProgress>
  saveProgress: (assessmentType: "MOCA" | "MMSE", step: number, scores: number[]) => Promise<void>
  clearProgress: (assessmentType: "MOCA" | "MMSE") => Promise<void>
}

const UserContext = createContext<UserContextType | undefined>(undefined)

function isSameCalendarDay(value?: string | null) {
  if (!value) {
    return false
  }

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return false
  }

  return date.toDateString() === new Date().toDateString()
}

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [progress, setProgress] = useState<Record<string, AssessmentProgress>>({})
  const getErrorMessage = (error: unknown) => (error instanceof Error ? error.message : "An unexpected error occurred.")

  useEffect(() => {
    const storedUser = localStorage.getItem("mental_assess_dummy_user")
    if (storedUser) {
      const parsedUser = JSON.parse(storedUser)
      setUser(parsedUser)
      loadUserProgress(parsedUser.id)
    } else {
      setLoading(false)
    }
  }, [])

  const loadUserProgress = async (userId: string) => {
    const supabase = createClient()

    try {
      const { data, error } = await supabase.from("user_progress").select("*").eq("user_id", userId)

      if (error) {
        setProgress({})
      } else {
        const newProgress: Record<string, AssessmentProgress> = {}
        data.forEach((p) => {
          const progressTimestamp = (p as { last_updated?: string; updated_at?: string }).last_updated ??
            (p as { last_updated?: string; updated_at?: string }).updated_at

          if (!isSameCalendarDay(progressTimestamp)) {
            return
          }

          newProgress[p.assessment_type] = {
            assessment_type: p.assessment_type,
            current_step: p.current_step,
            scores: p.scores,
          }
        })
        setProgress(newProgress)
      }
    } catch (error) {
      if (process.env.NODE_ENV === "development") {
        console.error("Error loading user progress:", error)
      }
    } finally {
      setLoading(false)
    }
  }

  const login = async (phoneNumber: string, password: string): Promise<{ success: boolean; error?: string }> => {
    setLoading(true)

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ phoneNumber, password }),
      })

      const payload = await response.json()

      if (!response.ok || !payload.user) {
        return { success: false, error: payload.error || "Invalid phone number or password." }
      }

      setUser(payload.user)
      localStorage.setItem("mental_assess_dummy_user", JSON.stringify(payload.user))
      await loadUserProgress(payload.user.id)
      return { success: true }
    } catch (error: unknown) {
      return { success: false, error: getErrorMessage(error) }
    } finally {
      setLoading(false)
    }
  }

  const register = async (
    phoneNumber: string,
    password: string,
    name?: string,
    dateOfBirth?: string,
    gender?: string,
    nationalId?: string,
  ): Promise<{ success: boolean; error?: string }> => {
    setLoading(true)

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          phoneNumber,
          password,
          name,
          dateOfBirth,
          gender,
          nationalId,
        }),
      })

      const payload = await response.json()

      if (!response.ok || !payload.user) {
        return {
          success: false,
          error: payload.error || "Registration failed. Please try again.",
        }
      }

      setUser(payload.user)
      localStorage.setItem("mental_assess_dummy_user", JSON.stringify(payload.user))
      await loadUserProgress(payload.user.id)
      return { success: true }
    } catch (error: unknown) {
      const errorMessage = getErrorMessage(error)
      if (errorMessage.includes("Failed to fetch") || errorMessage.includes("fetch")) {
        return {
          success: false,
          error: "Network error. Please disable browser extensions that may block requests and try again.",
        }
      }
      return { success: false, error: errorMessage }
    } finally {
      setLoading(false)
    }
  }

  const logout = async () => {
    setLoading(true)
    try {
      setUser(null)
      setProgress({})
      localStorage.removeItem("mental_assess_dummy_user")
    } finally {
      setLoading(false)
    }
  }

  const saveProgress = async (assessmentType: "MOCA" | "MMSE", step: number, scores: number[]) => {
    if (!user?.id) {
      return
    }

    const supabase = createClient()

    const newProgressEntry = {
      user_id: user.id,
      assessment_type: assessmentType,
      current_step: step,
      scores,
    }

    try {
      const { error } = await supabase
        .from("user_progress")
        .upsert(newProgressEntry, { onConflict: "user_id, assessment_type" })

      if (error) throw error

      setProgress((prev) => ({
        ...prev,
        [assessmentType]: {
          assessment_type: assessmentType,
          current_step: step,
          scores,
        },
      }))
    } catch (error) {
      if (process.env.NODE_ENV === "development") {
        console.error("Error saving progress:", error)
      }
    }
  }

  const clearProgress = async (assessmentType: "MOCA" | "MMSE") => {
    if (!user?.id) {
      return
    }

    const supabase = createClient()

    try {
      const { error } = await supabase
        .from("user_progress")
        .delete()
        .eq("user_id", user.id)
        .eq("assessment_type", assessmentType)

      if (error) throw error

      setProgress((prev) => {
        const newProgress = { ...prev }
        delete newProgress[assessmentType]
        return newProgress
      })
    } catch (error) {
      if (process.env.NODE_ENV === "development") {
        console.error("Error clearing progress:", error)
      }
    }
  }

  return (
    <UserContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        logout,
        progress,
        saveProgress,
        clearProgress,
      }}
    >
      {children}
    </UserContext.Provider>
  )
}

export function useUser() {
  const context = useContext(UserContext)
  if (context === undefined) {
    throw new Error("useUser must be used within a UserProvider")
  }
  return context
}

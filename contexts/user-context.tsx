"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { v4 as uuidv4 } from "uuid"

interface User {
  id: string
  phone_number: string
  email: string
  name?: string
  date_of_birth?: string
  gender?: string
}

interface AssessmentProgress {
  assessment_type: "MOCA" | "MMSE"
  current_step: number
  scores: number[]
}

interface UserContextType {
  user: User | null
  loading: boolean
  login: (phoneNumber: string) => Promise<{ success: boolean; error?: string }>
  register: (
    phoneNumber: string,
    name?: string,
    dateOfBirth?: string,
    gender?: string,
  ) => Promise<{ success: boolean; error?: string }>
  sendOtp: (phoneNumber: string) => Promise<{ success: boolean; error?: string }>
  logout: () => Promise<void>
  progress: Record<string, AssessmentProgress>
  saveProgress: (assessmentType: "MOCA" | "MMSE", step: number, scores: number[]) => Promise<void>
  clearProgress: (assessmentType: "MOCA" | "MMSE") => Promise<void>
}

const UserContext = createContext<UserContextType | undefined>(undefined)

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [progress, setProgress] = useState<Record<string, AssessmentProgress>>({})

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

  const sendOtp = async (phoneNumber: string): Promise<{ success: boolean; error?: string }> => {
    await new Promise((resolve) => setTimeout(resolve, 500))
    return { success: true }
  }

  const login = async (phoneNumber: string): Promise<{ success: boolean; error?: string }> => {
    setLoading(true)
    const supabase = createClient()

    try {
      const { data, error } = await supabase.from("users").select("*").eq("phone_number", phoneNumber).limit(1)

      if (error) {
        return { success: false, error: "Database error during login." }
      }

      const existingUser = data ? data[0] : null

      if (!existingUser) {
        return { success: false, error: "Invalid phone number. Please register or check your number." }
      }

      setUser(existingUser)
      localStorage.setItem("mental_assess_dummy_user", JSON.stringify(existingUser))
      await loadUserProgress(existingUser.id)
      return { success: true }
    } catch (error: any) {
      return { success: false, error: error.message }
    } finally {
      setLoading(false)
    }
  }

  const register = async (
    phoneNumber: string,
    name?: string,
    dateOfBirth?: string,
    gender?: string,
  ): Promise<{ success: boolean; error?: string }> => {
    setLoading(true)
    const supabase = createClient()

    try {
      console.log("[v0] Starting registration for phone:", phoneNumber, "name:", name)

      const { data: existingUser } = await supabase.from("users").select("id").eq("phone_number", phoneNumber).limit(1)

      if (existingUser && existingUser.length > 0) {
        console.log("[v0] Phone number already exists")
        return { success: false, error: "Phone number already registered." }
      }

      const newUserId = uuidv4()
      const generatedEmail = `${phoneNumber.replace(/[^0-9]/g, "")}@mentalassess.app`

      console.log("[v0] Creating new user with id:", newUserId, "name:", name, "dob:", dateOfBirth, "gender:", gender)

      const { data: newUser, error: insertError } = await supabase
        .from("users")
        .insert({
          id: newUserId,
          phone_number: phoneNumber,
          email: generatedEmail,
          name: name || null,
          date_of_birth: dateOfBirth || null,
          gender: gender || null,
        })
        .select()
        .single()

      console.log("[v0] Insert result:", { newUser, insertError })

      if (insertError || !newUser) {
        console.log("[v0] Registration failed:", insertError)
        return { success: false, error: insertError?.message || "Registration failed. Please try again." }
      }

      console.log("[v0] Registration successful, setting user")
      setUser(newUser)
      localStorage.setItem("mental_assess_dummy_user", JSON.stringify(newUser))
      await loadUserProgress(newUser.id)
      return { success: true }
    } catch (error: any) {
      console.log("[v0] Registration error:", error)
      return { success: false, error: error.message }
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
        sendOtp,
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

"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { v4 as uuidv4 } from "uuid" // Import uuid for generating IDs

interface User {
  id: string // This will be the UUID from public.users
  phone_number: string
  // Add any other custom user profile fields here
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
  register: (phoneNumber: string) => Promise<{ success: boolean; error?: string }>
  sendOtp: (phoneNumber: string) => Promise<{ success: boolean; error?: string }> // Dummy for UI flow
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
    // Dummy Auth: Load user from localStorage on initial load
    const storedUser = localStorage.getItem("mental_assess_dummy_user")
    if (storedUser) {
      const parsedUser = JSON.parse(storedUser)
      setUser(parsedUser)
      loadUserProgress(parsedUser.id) // This is an async call
    } else {
      setLoading(false) // This path correctly sets loading to false
    }
  }, [])

  const loadUserProgress = async (userId: string) => {
    try {
      const { data, error } = await supabase.from("user_progress").select("*").eq("user_id", userId)

      if (error) {
        console.error("Error loading user progress:", error)
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
      console.error("Caught error loading user progress:", error)
    } finally {
      setLoading(false) // Ensure loading is set to false after attempt to load progress
    }
  }

  // Dummy OTP send function - no actual OTP sent, just simulates success for UI flow
  const sendOtp = async (phoneNumber: string): Promise<{ success: boolean; error?: string }> => {
    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 500))
    console.log(`Dummy OTP simulation for ${phoneNumber} completed.`)
    return { success: true }
  }

  const login = async (phoneNumber: string): Promise<{ success: boolean; error?: string }> => {
    setLoading(true)
    try {
      // Query for user by phone number
      const { data, error } = await supabase.from("users").select("*").eq("phone_number", phoneNumber).limit(1) // Use limit(1) instead of single() to handle no rows gracefully

      if (error) {
        console.error("Database error during login:", error)
        return { success: false, error: "Database error during login." }
      }

      const existingUser = data ? data[0] : null // Get the first user if data exists

      if (!existingUser) {
        return { success: false, error: "Invalid phone number. Please register or check your number." }
      }

      setUser(existingUser)
      localStorage.setItem("mental_assess_dummy_user", JSON.stringify(existingUser))
      await loadUserProgress(existingUser.id)
      return { success: true }
    } catch (error: any) {
      console.error("Login error:", error.message)
      return { success: false, error: error.message }
    } finally {
      setLoading(false)
    }
  }

  const register = async (phoneNumber: string): Promise<{ success: boolean; error?: string }> => {
    setLoading(true)
    try {
      // Check if phone number already exists
      const { data: existingUser } = await supabase.from("users").select("id").eq("phone_number", phoneNumber).limit(1)

      if (existingUser && existingUser.length > 0) {
        return { success: false, error: "Phone number already registered." }
      }

      // Generate a new UUID for the user
      const newUserId = uuidv4()

      // Insert new user into public.users table
      const { data: newUser, error: insertError } = await supabase
        .from("users")
        .insert({ id: newUserId, phone_number: phoneNumber })
        .select()
        .single()

      if (insertError || !newUser) {
        console.error("Registration failed:", insertError?.message || "Failed to create user.")
        return { success: false, error: "Registration failed. Please try again." }
      }

      setUser(newUser)
      localStorage.setItem("mental_assess_dummy_user", JSON.stringify(newUser))
      await loadUserProgress(newUser.id)
      return { success: true }
    } catch (error: any) {
      console.error("Registration error:", error.message)
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
    } catch (error) {
      console.error("Error logging out:", error)
    } finally {
      setLoading(false)
    }
  }

  const saveProgress = async (assessmentType: "MOCA" | "MMSE", step: number, scores: number[]) => {
    if (!user?.id) {
      console.error("Cannot save progress: No authenticated user ID.")
      return
    }

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

      if (error) {
        console.error("Supabase error saving progress:", error)
        throw error
      }

      setProgress((prev) => ({
        ...prev,
        [assessmentType]: {
          assessment_type: assessmentType,
          current_step: step,
          scores,
        },
      }))
    } catch (error) {
      console.error("Error saving progress:", error)
    }
  }

  const clearProgress = async (assessmentType: "MOCA" | "MMSE") => {
    if (!user?.id) {
      console.error("Cannot clear progress: No authenticated user ID.")
      return
    }

    try {
      const { error } = await supabase
        .from("user_progress")
        .delete()
        .eq("user_id", user.id)
        .eq("assessment_type", assessmentType)

      if (error) {
        console.error("Supabase error clearing progress:", error)
        throw error
      }

      setProgress((prev) => {
        const newProgress = { ...prev }
        delete newProgress[assessmentType]
        return newProgress
      })
    } catch (error) {
      console.error("Error clearing progress:", error)
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

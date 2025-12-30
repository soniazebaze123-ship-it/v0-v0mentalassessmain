"use client"

import { useState, useEffect } from "react"
import { UserProvider, useUser } from "@/contexts/user-context"
import { Registration } from "@/components/registration"
import { Dashboard } from "@/components/dashboard"
import { ImageUpload } from "@/components/image-upload"
import { ResultsDisplay } from "@/components/results-display"
import { Login } from "@/components/login"
import { AdminPanel } from "@/components/admin-panel"

// MoCA Components
import { InteractiveClock } from "@/components/assessments/interactive-clock"
import { TrailMakingTask } from "@/components/assessments/trail-making-task"
import { AnimalNaming } from "@/components/assessments/animal-naming"
import { MemoryTask } from "@/components/assessments/memory-task"
import { AttentionTask } from "@/components/assessments/attention-task"
import { LanguageAbstraction } from "@/components/assessments/language-abstraction"
import { OrientationTask } from "@/components/assessments/orientation-task"

// MMSE Components
import { MMSEOrientation } from "@/components/assessments/mmse-orientation"
import { MMSEAttention } from "@/components/assessments/mmse-attention"
import { ObjectNaming } from "@/components/assessments/object-naming"
import { MMSERepetition } from "@/components/assessments/mmse-repetition"
import { WritingTask } from "@/components/assessments/writing-task"
import { CopyingDesign } from "@/components/assessments/copying-design"

import { createClient } from "@/lib/supabase/client"
import { useLanguage } from "@/contexts/language-context"

function AppContent() {
  const { user, loading, progress, saveProgress, clearProgress } = useUser()
  const { t } = useLanguage()
  const [currentView, setCurrentView] = useState<
    "login" | "register" | "dashboard" | "moca" | "mmse" | "upload" | "results" | "admin"
  >("login")
  const [currentStep, setCurrentStep] = useState(0)
  const [scores, setScores] = useState<number[]>([])
  const [assessmentType, setAssessmentType] = useState<"MOCA" | "MMSE">("MOCA")
  const [completedAssessments, setCompletedAssessments] = useState<Record<string, any>>({})

  const mocaSteps = [
    { component: InteractiveClock, props: { targetTime: { hour: 2, minute: 10 } } },
    { component: TrailMakingTask, props: {} },
    { component: AnimalNaming, props: {} },
    {
      component: MemoryTask,
      props: { words: t("memory.moca.words"), title: t("moca.memory") },
    },
    { component: AttentionTask, props: {} },
    { component: LanguageAbstraction, props: {} },
    { component: OrientationTask, props: {} },
  ]

  const mmseSteps = [
    { component: MMSEOrientation, props: {} },
    { component: MemoryTask, props: { words: t("memory.mmse.words"), title: t("mmse.registration") } },
    { component: MMSEAttention, props: {} },
    { component: ObjectNaming, props: {} },
    { component: MMSERepetition, props: {} },
    { component: WritingTask, props: {} },
    { component: CopyingDesign, props: {} },
  ]

  // Load completed assessments on mount
  useEffect(() => {
    if (user) {
      loadCompletedAssessments()
    }
  }, [user])

  // Initialize view based on user and loading state
  useEffect(() => {
    if (!loading) {
      if (user) {
        setCurrentView("dashboard")
      } else {
        setCurrentView("login")
      }
    }
  }, [user, loading])

  const loadCompletedAssessments = async () => {
    if (!user) return

    const supabase = createClient()

    try {
      const { data: assessments } = await supabase.from("assessments").select("*").eq("user_id", user.id)

      if (assessments) {
        const completed: Record<string, any> = {}
        assessments.forEach((assessment) => {
          completed[assessment.assessment_type] = {
            totalScore: assessment.total_score,
            sectionScores: assessment.section_scores,
            completedAt: assessment.completed_at,
          }
        })
        setCompletedAssessments(completed)
      }
    } catch (error) {
      if (process.env.NODE_ENV === "development") {
        console.error("Error loading completed assessments:", error)
      }
    }
  }

  const handleStartAssessment = (type: "moca" | "mmse" | "upload") => {
    if (type === "upload") {
      setCurrentView("upload")
    } else {
      const assessmentKey = type.toUpperCase() as "MOCA" | "MMSE"
      if (completedAssessments[assessmentKey]) {
        // Prevent starting if already completed
        alert(t("dashboard.results_final"))
        return
      }

      setCurrentView(type)
      setAssessmentType(assessmentKey)
      setCurrentStep(0)
      setScores([])
      saveProgress(assessmentKey, 0, []) // Save initial progress
    }
  }

  const handleResumeAssessment = (type: "moca" | "mmse", step: number, savedScores: number[]) => {
    const assessmentKey = type.toUpperCase() as "MOCA" | "MMSE"
    if (completedAssessments[assessmentKey]) {
      // Prevent resuming if already completed
      alert(t("dashboard.results_final"))
      return
    }
    setCurrentView(type)
    setAssessmentType(assessmentKey)
    setCurrentStep(step)
    setScores(savedScores)
  }

  const handleViewResults = (type: "moca" | "mmse") => {
    setAssessmentType(type.toUpperCase() as "MOCA" | "MMSE")
    setCurrentView("results")
  }

  const handleStepComplete = async (score: number) => {
    const newScores = [...scores, score]
    setScores(newScores)

    const steps = assessmentType === "MOCA" ? mocaSteps : mmseSteps

    if (currentStep < steps.length - 1) {
      // Save progress
      await saveProgress(assessmentType, currentStep + 1, newScores)
      setCurrentStep(currentStep + 1)
    } else {
      // Assessment complete
      const totalScore = newScores.reduce((sum, s) => sum + s, 0)

      const sectionNames =
        assessmentType === "MOCA"
          ? ["visuospatial", "executive", "naming", "memory", "attention", "language", "orientation"]
          : ["orientation", "registration", "attention", "naming", "repetition", "writing", "copying"]

      const sectionScores = sectionNames.reduce(
        (acc, name, index) => {
          acc[name] = newScores[index] || 0
          return acc
        },
        {} as Record<string, number>,
      )

      const supabase = createClient()

      try {
        await supabase.from("assessments").insert({
          user_id: user!.id, // Use user!.id as it should be present if logged in
          assessment_type: assessmentType,
          total_score: totalScore,
          section_scores: sectionScores,
        })

        // Clear progress after successful completion
        await clearProgress(assessmentType)

        // Update completed assessments state
        setCompletedAssessments((prev) => ({
          ...prev,
          [assessmentType]: { totalScore, sectionScores },
        }))
      } catch (error) {
        if (process.env.NODE_ENV === "development") {
          console.error("Error saving assessment:", error)
        }
      }

      setCurrentView("results")
    }
  }

  const handleSkipTask = () => {
    handleStepComplete(0) // Award 0 points for skipped tasks
  }

  const handleUploadComplete = () => {
    setCurrentView("dashboard")
  }

  const handleBackToDashboard = () => {
    setCurrentView("dashboard")
    setCurrentStep(0)
    setScores([])
    loadCompletedAssessments() // Reload completed assessments to ensure dashboard is up-to-date
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!user) {
    if (currentView === "register") {
      return <Registration onBackToLogin={() => setCurrentView("login")} />
    } else if (currentView === "admin") {
      return <AdminPanel />
    } else {
      return <Login onRegister={() => setCurrentView("register")} onAdminLogin={() => setCurrentView("admin")} />
    }
  }

  if (currentView === "upload") {
    return <ImageUpload onComplete={handleUploadComplete} />
  }

  if (currentView === "results") {
    const assessmentData = completedAssessments[assessmentType]
    const totalScore = assessmentData?.totalScore || scores.reduce((sum, s) => sum + s, 0)
    const maxScore = assessmentType === "MOCA" ? 30 : 30
    const sectionNames =
      assessmentType === "MOCA"
        ? ["visuospatial", "executive", "naming", "memory", "attention", "language", "orientation"]
        : ["orientation", "registration", "attention", "naming", "repetition", "writing", "copying"]

    const sectionScores =
      assessmentData?.sectionScores ||
      sectionNames.reduce(
        (acc, name, index) => {
          acc[name] = scores[index] || 0
          return acc
        },
        {} as Record<string, number>,
      )

    return (
      <ResultsDisplay
        assessmentType={assessmentType}
        totalScore={totalScore}
        maxScore={maxScore}
        sectionScores={sectionScores}
        onBackToDashboard={handleBackToDashboard}
      />
    )
  }

  if (currentView === "moca" || currentView === "mmse") {
    const steps = assessmentType === "MOCA" ? mocaSteps : mmseSteps
    const CurrentComponent = steps[currentStep].component
    const props = steps[currentStep].props

    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <div className="max-w-4xl mx-auto mb-4">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-2xl font-bold">
              {assessmentType} {t("common.assessment")} - {t("common.step")} {currentStep + 1} {t("common.of")}{" "}
              {steps.length}
            </h1>
            <div className="text-sm text-gray-600">
              {t("common.progress")}: {currentStep + 1}/{steps.length}
            </div>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
            />
          </div>
        </div>
        <CurrentComponent onComplete={handleStepComplete} onSkip={handleSkipTask} {...props} />
      </div>
    )
  }

  return (
    <Dashboard
      onStartAssessment={handleStartAssessment}
      onResumeAssessment={handleResumeAssessment}
      onViewResults={handleViewResults}
    >
      <div className="space-y-8 w-full max-w-2xl">
        <LanguageAbstraction onComplete={(score) => console.log("Language Abstraction Score:", score)} />
        <MMSERepetition onComplete={(score) => console.log("MMSE Repetition Score:", score)} />
      </div>
    </Dashboard>
  )
}

export default function Home() {
  return (
    <UserProvider>
      <AppContent />
    </UserProvider>
  )
}

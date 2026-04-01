"use client"

// MentalAssess - Cognitive Assessment Platform v4.1
import { useState, useEffect } from "react"
import { useUser } from "@/contexts/user-context"
import { Registration } from "@/components/registration"
import { Dashboard } from "@/components/dashboard"

import { ResultsDisplay } from "@/components/results-display"
import { RiskProfileDisplay } from "@/components/risk-profile-display"
import { Login } from "@/components/login"
import dynamic from "next/dynamic"
const AdminPanel = dynamic(() => import("@/components/admin-panel").then(mod => mod.AdminPanel), { ssr: false })

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

// Sensory Screening Components
import { VisualScreening } from "@/components/assessments/visual-screening"
import { AuditoryScreening } from "@/components/assessments/auditory-screening"
import { OlfactoryScreening } from "@/components/assessments/olfactory-screening"
import { TCMConstitution } from "@/components/assessments/tcm-constitution"
import { PWAInstallPrompt } from "@/components/pwa-install-prompt"

import { createClient } from "@/lib/supabase/client"
import { useLanguage } from "@/contexts/language-context"

function AppContent() {
  const { user, loading, progress, saveProgress, clearProgress } = useUser()
  const { t } = useLanguage()
  const [currentView, setCurrentView] = useState<
    | "login"
    | "register"
    | "dashboard"
    | "moca"
    | "mmse"
    | "upload"
    | "results"
    | "admin"
    | "visual"
    | "auditory"
    | "olfactory"
    | "tcm"
    | "risk_profile"
  >("login")
  const [currentStep, setCurrentStep] = useState(0)
  const [scores, setScores] = useState<number[]>([])
  const [assessmentType, setAssessmentType] = useState<"MOCA" | "MMSE">("MOCA")
  const [completedAssessments, setCompletedAssessments] = useState<Record<string, any>>({})

  // MoCA uses 5 words: face, velvet, church, daisy, red
  const mocaWords = ["face", "velvet", "church", "daisy", "red"]
  
  const mocaSteps = [
    { component: InteractiveClock, props: { targetTime: { hour: 2, minute: 10 } } },
    { component: TrailMakingTask, props: {} },
    { component: AnimalNaming, props: {} },
    { component: MemoryTask, props: { words: mocaWords, title: "MoCA Memory" } },
    { component: AttentionTask, props: {} },
    { component: LanguageAbstraction, props: {} },
    { component: OrientationTask, props: {} },
  ]

  // MMSE uses 3 words: apple, table, coin
  const mmseWords = ["apple", "table", "coin"]
  
  const mmseSteps = [
    { component: MMSEOrientation, props: {} },
    { component: MemoryTask, props: { words: mmseWords, title: "MMSE Registration" } },
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
          completed[assessment.type] = {
            totalScore: assessment.score,
            sectionScores: assessment.data,
            completedAt: assessment.completed_at,
          }
        })
        setCompletedAssessments(completed)
      }
    } catch (error) {
      // Error loading completed assessments - silently continue
    }
  }

  const handleStartAssessment = (type: "moca" | "mmse" | "upload" | "visual" | "auditory" | "olfactory" | "tcm") => {
    if (type === "visual" || type === "auditory" || type === "olfactory" || type === "tcm") {
      setCurrentView(type)
      return
    }

    if (type === "upload") {
      setCurrentView("upload")
    } else {
      const assessmentKey = type.toUpperCase() as "MOCA" | "MMSE"
      if (completedAssessments[assessmentKey]) {
        alert(t("dashboard.results_final"))
        return
      }

      setCurrentView(type)
      setAssessmentType(assessmentKey)
      setCurrentStep(0)
      setScores([])
      saveProgress(assessmentKey, 0, [])
    }
  }

  const handleResumeAssessment = (type: "moca" | "mmse", step: number, savedScores: number[]) => {
    const assessmentKey = type.toUpperCase() as "MOCA" | "MMSE"
    if (completedAssessments[assessmentKey]) {
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

  const handleViewRiskProfile = () => {
    setCurrentView("risk_profile")
  }

  const handleStepComplete = async (score: number) => {
    const newScores = [...scores, score]
    setScores(newScores)

    const steps = assessmentType === "MOCA" ? mocaSteps : mmseSteps

    if (currentStep < steps.length - 1) {
      await saveProgress(assessmentType, currentStep + 1, newScores)
      setCurrentStep(currentStep + 1)
    } else {
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
        const { data, error } = await supabase
          .from("assessments")
          .insert({
            user_id: user!.id,
            type: assessmentType,
            score: totalScore,
            data: sectionScores,
          })
          .select()

        if (error) {
          alert(`Error saving assessment: ${error.message}`)
          return
        }

        await clearProgress(assessmentType)

        await loadCompletedAssessments()

        setCompletedAssessments((prev) => ({
          ...prev,
          [assessmentType]: { totalScore, sectionScores },
        }))
      } catch (error) {
        alert(`Error saving assessment: ${error instanceof Error ? error.message : "Unknown error"}`)
        return
      }

      setCurrentView("results")
    }
  }

  const handleSkipTask = () => {
    handleStepComplete(0)
  }

  const handleBackToDashboard = () => {
    setCurrentView("dashboard")
    setCurrentStep(0)
    setScores([])
    loadCompletedAssessments()
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

  if (currentView === "visual") {
    return <VisualScreening onComplete={() => handleBackToDashboard()} />
  }

  if (currentView === "auditory") {
    return <AuditoryScreening onComplete={() => handleBackToDashboard()} />
  }

  if (currentView === "olfactory") {
    return <OlfactoryScreening onComplete={() => handleBackToDashboard()} />
  }

  if (currentView === "tcm") {
    return (
      <TCMConstitution
        onComplete={(score, data) => {
          
          handleBackToDashboard()
        }}
        onBack={handleBackToDashboard}
      />
    )
  }

  if (currentView === "risk_profile") {
    return <RiskProfileDisplay onBackToDashboard={handleBackToDashboard} />
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
      onViewRiskProfile={handleViewRiskProfile}
    />
  )
}

export default function Home() {
  return <AppContent />
}

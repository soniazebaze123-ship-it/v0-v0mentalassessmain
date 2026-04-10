"use client"

// MentalAssess - Cognitive Assessment Platform
import { useEffect, useEffectEvent, useState } from "react"
import { useUser } from "@/contexts/user-context"
import { Registration } from "@/components/registration"
import { Dashboard } from "@/components/dashboard"
import { ImageUpload } from "@/components/image-upload"
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
import { Sparkles } from "lucide-react"

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

type CompletedAssessment = {
  totalScore: number
  sectionScores: Record<string, number>
  completedAt: string
}

function AppContent() {
  const { user, loading, saveProgress, clearProgress } = useUser()
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
  const [completedAssessments, setCompletedAssessments] = useState<Record<string, CompletedAssessment>>({})

  const mocaSteps = [
    { component: InteractiveClock, props: { targetTime: { hour: 2, minute: 10 } } },
    { component: TrailMakingTask, props: {} },
    { component: AnimalNaming, props: {} },
    {
      component: MemoryTask,
      props: { words: t("memory.moca.words"), title: t("moca.memory"), assessmentType: "MOCA" },
    },
    { component: AttentionTask, props: {} },
    { component: LanguageAbstraction, props: {} },
    { component: OrientationTask, props: {} },
  ]

  const mmseSteps = [
    { component: MMSEOrientation, props: {} },
    { component: MemoryTask, props: { words: t("memory.mmse.words"), title: t("mmse.registration"), assessmentType: "MMSE" } },
    { component: MMSEAttention, props: {} },
    { component: ObjectNaming, props: {} },
    { component: MMSERepetition, props: {} },
    { component: WritingTask, props: {} },
    { component: CopyingDesign, props: {} },
  ]

  // Load completed assessments on mount
  const loadCompletedAssessments = useEffectEvent(async () => {
    if (!user) return

    const supabase = createClient()

    try {
      const { data: assessments } = await supabase.from("assessments").select("*").eq("user_id", user.id)

      const completed: Record<string, CompletedAssessment> = {}

      if (assessments) {
        assessments.forEach((assessment) => {
          if (!isSameCalendarDay(assessment.completed_at)) {
            return
          }

          completed[assessment.type] = {
            totalScore: assessment.score,
            sectionScores: assessment.data,
            completedAt: assessment.completed_at,
          }
        })
      }

      setCompletedAssessments(completed)
    } catch (error) {
      if (process.env.NODE_ENV === "development") {
        console.error("Error loading completed assessments:", error)
      }
    }
  })

  useEffect(() => {
    if (user) {
      void loadCompletedAssessments()
    }
  }, [user, loadCompletedAssessments])

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

  const handleResetAssessmentSession = async (type: "moca" | "mmse") => {
    const assessmentKey = type.toUpperCase() as "MOCA" | "MMSE"

    await clearProgress(assessmentKey)
    setAssessmentType(assessmentKey)
    setCurrentStep(0)
    setScores([])
    setCurrentView(type)
    await saveProgress(assessmentKey, 0, [])
  }

  const handleViewResults = (type: "moca" | "mmse") => {
    setAssessmentType(type.toUpperCase() as "MOCA" | "MMSE")
    setCurrentView("results")
  }

  const handleViewRiskProfile = () => {
    setCurrentView("risk_profile")
  }

  const handleStepComplete = async (score: number) => {
    console.log("[v0] Step complete - Score:", score, "Assessment:", assessmentType, "Step:", currentStep)
    const newScores = [...scores, score]
    setScores(newScores)

    const steps = assessmentType === "MOCA" ? mocaSteps : mmseSteps

    if (currentStep < steps.length - 1) {
      await saveProgress(assessmentType, currentStep + 1, newScores)
      setCurrentStep(currentStep + 1)
    } else {
      const totalScore = newScores.reduce((sum, s) => sum + s, 0)
      console.log("[v0] Assessment complete - Scores array:", newScores, "Total:", totalScore)

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
        console.log("[v0] Saving assessment to DB:", {
          user_id: user!.id,
          type: assessmentType,
          score: totalScore,
          data: sectionScores,
        })

        const { data, error } = await supabase
          .from("assessments")
          .insert({
            user_id: user!.id,
            type: assessmentType,
            score: totalScore,
            data: sectionScores,
          })
          .select()

        console.log("[v0] Assessment save result:", { data, error })

        if (error) {
          console.error("[v0] Error saving assessment:", error)
          alert(`Error saving assessment: ${error.message}`)
          return
        }

        await clearProgress(assessmentType)

        await loadCompletedAssessments()

        setCompletedAssessments((prev) => ({
          ...prev,
          [assessmentType]: {
            totalScore,
            sectionScores,
            completedAt: new Date().toISOString(),
          },
        }))
      } catch (error) {
        console.error("[v0] Error saving assessment:", error)
        alert(`Error saving assessment: ${error instanceof Error ? error.message : "Unknown error"}`)
        return
      }

      setCurrentView("results")
    }
  }

  const handleSkipTask = () => {
    handleStepComplete(0)
  }

  const handleUploadComplete = () => {
    setCurrentView("dashboard")
  }

  const handleBackToDashboard = () => {
    setCurrentView("dashboard")
    setCurrentStep(0)
    setScores([])
    void loadCompletedAssessments()
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
          console.log("[v0] TCM Constitution completed:", { score, data })
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
    const assessmentTitle = assessmentType === "MOCA" ? t("moca.title") : t("mmse.title")
    const progressPercent = ((currentStep + 1) / steps.length) * 100
    const shellTheme =
      assessmentType === "MOCA"
        ? {
            page: "from-[#eefaf5] via-[#f7fffb] to-[#dff6ee]",
            accent: "from-emerald-500 via-teal-500 to-cyan-500",
            ring: "ring-emerald-100",
            badge: "bg-emerald-100 text-emerald-800",
            panel: "from-white/95 to-emerald-50/90",
            eyebrow: "Cognitive Navigation",
          }
        : {
            page: "from-blue-50 via-slate-50 to-indigo-100",
            accent: "from-blue-500 via-sky-500 to-indigo-500",
            ring: "ring-blue-100",
            badge: "bg-blue-100 text-blue-800",
            panel: "from-white/95 to-blue-50/90",
            eyebrow: "Clinical Orientation",
          }

    return (
      <div className={`min-h-screen bg-gradient-to-br ${shellTheme.page} p-4 md:p-6`}>
        <div className="mx-auto max-w-5xl">
          <div className={`mb-6 overflow-hidden rounded-[28px] border border-white/70 bg-gradient-to-br ${shellTheme.panel} shadow-[0_24px_80px_rgba(15,23,42,0.08)] backdrop-blur ring-1 ${shellTheme.ring}`}>
            <div className="relative px-6 py-6 md:px-8 md:py-7">
              <div className={`absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r ${shellTheme.accent}`} />
              <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold tracking-[0.18em] uppercase ${shellTheme.badge}`}>
                      <Sparkles className="mr-2 h-3.5 w-3.5" />
                      {shellTheme.eyebrow}
                    </span>
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900 md:text-4xl">
                      {assessmentTitle}
                    </h1>
                    <p className="mt-2 text-sm text-slate-600 md:text-base">
                      {t("common.step")} {currentStep + 1} {t("common.of")} {steps.length}
                    </p>
                  </div>
                </div>

                <div className="min-w-44 rounded-2xl border border-white/80 bg-white/80 px-4 py-3 shadow-sm backdrop-blur">
                  <div className="flex items-center justify-between text-xs uppercase tracking-[0.16em] text-slate-500">
                    <span>{t("common.progress")}</span>
                    <span>{currentStep + 1}/{steps.length}</span>
                  </div>
                  <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-slate-200/80">
                    <div
                      className={`h-full rounded-full bg-gradient-to-r ${shellTheme.accent} transition-all duration-500`}
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                  <p className="mt-2 text-right text-xs font-medium text-slate-500">
                    {Math.round(progressPercent)}%
                  </p>
                </div>
              </div>
            </div>
          </div>

          <CurrentComponent onComplete={handleStepComplete} onSkip={handleSkipTask} {...props} />
        </div>
      </div>
    )
  }

  return (
    <Dashboard
      onStartAssessment={handleStartAssessment}
      onResumeAssessment={handleResumeAssessment}
      onResetAssessmentSession={handleResetAssessmentSession}
      onViewResults={handleViewResults}
      onViewRiskProfile={handleViewRiskProfile}
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
    <>
      <AppContent />
      <PWAInstallPrompt />
    </>
  )
}

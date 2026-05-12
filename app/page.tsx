"use client"

// MentalAssess - Cognitive Assessment Platform
import { useCallback, useEffect, useState } from "react"
import { useUser } from "@/contexts/user-context"
import { classifyRisk, type RiskClassificationOutput } from "@/lib/recommendations/risk-classification-service"
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

type AssessmentStep = {
  component: React.ComponentType<any>
  props: Record<string, unknown>
  sectionKey: string
}

// ============================================================================
// ASSESSMENT TYPE MAX SCORES - Per-Section and Per-Type Caps
// ============================================================================
const MOCA_SECTION_MAX_SCORES: Record<string, number> = {
  clock: 3,
  trail_making: 1,
  cube: 1,
  animal_naming: 3,
  object_naming: 3,
  memory: 5,
  attention: 6,
  language: 3,
  orientation: 5,
}

const MMSE_SECTION_MAX_SCORES: Record<string, number> = {
  orientation: 8, // 5 time + 3 place (but collected as single score in current implementation)
  registration: 3,
  attention: 5,
  naming: 1,
  repetition: 2,
  writing: 2,
  copying: 1,
}

// Standalone assessment type max scores (normalized to 0-100)
const ASSESSMENT_TYPE_MAX_SCORES: Record<string, number> = {
  MOCA: 30,
  MMSE: 30,
  VISUAL: 100, // logMAR-based, normalized to 0-100
  AUDITORY: 100, // SRT-based, normalized to 0-100
  OLFACTORY: 100, // 8-item test, already normalized to 0-100
  TCM: 100, // Multi-constitution, normalized to 0-100
}

function clampSectionScore(sectionKey: string, score: number, assessmentType: "MOCA" | "MMSE" | "VISUAL" | "AUDITORY" | "OLFACTORY" | "TCM") {
  const normalizedScore = Number.isFinite(score) ? score : 0
  const safeScore = Math.max(0, normalizedScore)

  if (assessmentType === "MOCA") {
    const maxScore = MOCA_SECTION_MAX_SCORES[sectionKey]
    if (typeof maxScore !== "number") {
      return safeScore
    }
    return Math.min(safeScore, maxScore)
  } else if (assessmentType === "MMSE") {
    const maxScore = MMSE_SECTION_MAX_SCORES[sectionKey]
    if (typeof maxScore !== "number") {
      return safeScore
    }
    return Math.min(safeScore, maxScore)
  }

  // For standalone types (VISUAL, AUDITORY, OLFACTORY, TCM), cap at 100
  return Math.min(safeScore, 100)
}

function getNumericScore(value: unknown) {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : 0
  }

  if (typeof value === "string") {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : 0
  }

  return 0
}

const LEGACY_MOCA_SECTION_MAP: Record<string, string[]> = {
  clock: ["clock", "visuospatial"],
  trail_making: ["trail_making", "executive"],
  cube: ["cube"],
  animal_naming: ["animal_naming", "naming"],
  object_naming: ["object_naming"],
  memory: ["memory"],
  attention: ["attention"],
  language: ["language"],
  orientation: ["orientation"],
}

const LEGACY_MMSE_SECTION_MAP: Record<string, string[]> = {
  orientation: ["orientation", "orientation_time", "orientation_place"],
  registration: ["registration", "memory_registration"],
  attention: ["attention", "attention_calc"],
  naming: ["naming", "object_naming"],
  repetition: ["repetition"],
  writing: ["writing", "writing_task"],
  copying: ["copying", "copying_design"],
}

function getSourceSectionScore(
  sectionKey: string,
  sourceSectionScores: Record<string, unknown>,
  assessmentType: "MOCA" | "MMSE" | "VISUAL" | "AUDITORY" | "OLFACTORY" | "TCM",
) {
  if (assessmentType === "MOCA") {
    const candidateKeys = LEGACY_MOCA_SECTION_MAP[sectionKey] || [sectionKey]
    for (const candidate of candidateKeys) {
      if (candidate in sourceSectionScores) {
        return getNumericScore(sourceSectionScores[candidate])
      }
    }
    return 0
  } else if (assessmentType === "MMSE") {
    const candidateKeys = LEGACY_MMSE_SECTION_MAP[sectionKey] || [sectionKey]
    for (const candidate of candidateKeys) {
      if (candidate in sourceSectionScores) {
        return getNumericScore(sourceSectionScores[candidate])
      }
    }
    return 0
  }

  // For standalone types, attempt direct lookup or return 0
  return getNumericScore(sourceSectionScores[sectionKey] || 0)
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
  const [riskResult, setRiskResult] = useState<RiskClassificationOutput | null>(null)
  const mocaSteps: AssessmentStep[] = [
    { component: InteractiveClock, props: { targetTime: { hour: 2, minute: 10 } }, sectionKey: "clock" },
    { component: TrailMakingTask, props: {}, sectionKey: "trail_making" },
    { component: CopyingDesign, props: { titleKey: "moca.cube", instructionKey: "moca.cube.instruction", imageSrc: "/images/cube.svg" }, sectionKey: "cube" },
    { component: AnimalNaming, props: {}, sectionKey: "animal_naming" },
    { component: ObjectNaming, props: { assessmentMode: "MOCA" }, sectionKey: "object_naming" },
    {
      component: MemoryTask,
      props: { words: t("memory.moca.words"), title: t("moca.memory"), assessmentType: "MOCA" },
      sectionKey: "memory",
    },
    { component: AttentionTask, props: {}, sectionKey: "attention" },
    { component: LanguageAbstraction, props: {}, sectionKey: "language" },
    { component: OrientationTask, props: {}, sectionKey: "orientation" },
  ]

  const mmseSteps: AssessmentStep[] = [
    { component: MMSEOrientation, props: {}, sectionKey: "orientation" },
    { component: MemoryTask, props: { words: t("memory.mmse.words"), title: t("mmse.registration"), assessmentType: "MMSE" }, sectionKey: "registration" },
    { component: MMSEAttention, props: {}, sectionKey: "attention" },
    { component: ObjectNaming, props: { assessmentMode: "MMSE" }, sectionKey: "naming" },
    { component: MMSERepetition, props: {}, sectionKey: "repetition" },
    { component: WritingTask, props: {}, sectionKey: "writing" },
    { component: CopyingDesign, props: {}, sectionKey: "copying" },
  ]

  // Load completed assessments on mount
  const loadCompletedAssessments = useCallback(async () => {
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

          const assessmentKind = assessment.type as "MOCA" | "MMSE"
          const stepsForAssessment = assessmentKind === "MOCA" ? mocaSteps : mmseSteps
          const sectionKeys = stepsForAssessment.map((step) => step.sectionKey)
          const sourceSectionScores =
            assessment.data && typeof assessment.data === "object"
              ? (assessment.data as Record<string, unknown>)
              : {}

          const normalizedSectionScores = sectionKeys.reduce(
            (acc, sectionKey) => {
              const rawScore = getSourceSectionScore(sectionKey, sourceSectionScores, assessmentKind)
              acc[sectionKey] = clampSectionScore(sectionKey, rawScore, assessmentKind)
              return acc
            },
            {} as Record<string, number>,
          )

          const normalizedTotalScore =
            assessmentKind === "MOCA"
              ? Math.min(30, Object.values(normalizedSectionScores).reduce((sum, value) => sum + value, 0))
              : Math.min(30, Object.values(normalizedSectionScores).reduce((sum, value) => sum + value, 0))

          completed[assessmentKind] = {
            totalScore: normalizedTotalScore,
            sectionScores: normalizedSectionScores,
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
  }, [user])

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
    setRiskResult(null)
    setCurrentView("results")
  }

  const handleViewRiskProfile = () => {
    setCurrentView("risk_profile")
  }

  const handleStepComplete = async (score: number) => {
    const steps = assessmentType === "MOCA" ? mocaSteps : mmseSteps
    const currentStepMeta = steps[currentStep]
    const normalizedScore = currentStepMeta
      ? clampSectionScore(currentStepMeta.sectionKey, score, assessmentType)
      : Math.max(0, Number.isFinite(score) ? score : 0)

    console.log("[v0] Step complete - Score:", normalizedScore, "Assessment:", assessmentType, "Step:", currentStep)
    const newScores = [...scores, normalizedScore]
    setScores(newScores)

    if (currentStep < steps.length - 1) {
      await saveProgress(assessmentType, currentStep + 1, newScores)
      setCurrentStep(currentStep + 1)
    } else {
      const sectionScores = steps.reduce(
        (acc, step, index) => {
          const rawScore = newScores[index] || 0
          acc[step.sectionKey] = clampSectionScore(step.sectionKey, rawScore, assessmentType)
          return acc
        },
        {} as Record<string, number>,
      )

      const totalScore = Object.values(sectionScores).reduce((sum, sectionScore) => sum + sectionScore, 0)
      console.log("[v0] Assessment complete - Scores array:", newScores, "Total:", totalScore)

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

        // Compute risk classification and persist in assessment data
        const risk = classifyRisk(
          assessmentType === "MOCA"
            ? { moca_score: totalScore }
            : { mmse_score: totalScore }
        )
        setRiskResult(risk)

        // Persist risk into assessments.data for the saved record
        if (data?.[0]?.id) {
          await supabase
            .from("assessments")
            .update({ data: { ...sectionScores, risk_classification: risk.risk_classification, recommendation: risk.recommendation_text, referral_needed: risk.referral_needed } })
            .eq("id", data[0].id)
        }

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
    return <OlfactoryScreening enhanced onComplete={() => handleBackToDashboard()} />
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
    const maxScore = 30
    const steps = assessmentType === "MOCA" ? mocaSteps : mmseSteps
    const sectionKeys = steps.map((step) => step.sectionKey)

    const sourceSectionScores =
      assessmentData?.sectionScores ||
      sectionKeys.reduce(
        (acc, sectionKey, index) => {
          acc[sectionKey] = scores[index] || 0
          return acc
        },
        {} as Record<string, number>,
      )

    const normalizedSectionScores = sectionKeys.reduce(
      (acc, sectionKey) => {
        const rawScore = getSourceSectionScore(sectionKey, sourceSectionScores, assessmentType)
        acc[sectionKey] = clampSectionScore(sectionKey, rawScore, assessmentType)
        return acc
      },
      {} as Record<string, number>,
    )

    const computedTotal = Object.values(normalizedSectionScores).reduce((sum, value) => sum + value, 0)
    const totalScore = assessmentType === "MOCA" ? Math.min(30, computedTotal) : Math.min(30, computedTotal)

    return (
      <ResultsDisplay
        assessmentType={assessmentType}
        totalScore={totalScore}
        maxScore={maxScore}
        sectionScores={normalizedSectionScores}
        riskResult={riskResult}
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
    />
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

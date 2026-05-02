"use client"

import Link from "next/link"
import { useCallback, useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useLanguage } from "@/contexts/language-context"
import { useUser } from "@/contexts/user-context"
import { supabase } from "@/lib/supabase"
import { Brain, Upload, CheckCircle, Clock, LogOut, Eye, Ear, Flower2, TrendingUp, Leaf, Activity, Sparkles, ShieldCheck } from "lucide-react"
import { InstructionAudio } from "@/components/ui/instruction-audio"
import { ThemeToggle } from "@/components/ui/theme-toggle"

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

interface AssessmentStatus {
  moca: { completed: boolean; score?: number }
  mmse: { completed: boolean; score?: number }
  upload: { completed: boolean; fileCount?: number }
  visual: { completed: boolean; score?: number; classification?: string }
  auditory: { completed: boolean; score?: number; classification?: string }
  olfactory: { completed: boolean; score?: number; classification?: string }
  tcm: { completed: boolean; score?: number }
}

interface DashboardProps {
  onStartAssessment: (type: "moca" | "mmse" | "upload" | "visual" | "auditory" | "olfactory" | "tcm") => void
  onResumeAssessment?: (type: "moca" | "mmse", step: number, scores: number[]) => void
  onResetAssessmentSession?: (type: "moca" | "mmse") => Promise<void>
  onViewResults?: (type: "moca" | "mmse") => void
  onViewRiskProfile?: () => void
}

export function Dashboard({
  onStartAssessment,
  onResumeAssessment,
  onResetAssessmentSession,
  onViewResults,
  onViewRiskProfile,
}: DashboardProps) {
  const [status, setStatus] = useState<AssessmentStatus>({
    moca: { completed: false },
    mmse: { completed: false },
    upload: { completed: false },
    visual: { completed: false },
    auditory: { completed: false },
    olfactory: { completed: false },
    tcm: { completed: false },
  })
  const [loading, setLoading] = useState(true)
  const [hasAnyAssessments, setHasAnyAssessments] = useState(false)
  const { t, language, setLanguage, localizeText } = useLanguage()
  const { user, logout, progress } = useUser()
  const displayName = user?.name?.trim() || "-"
  const displayId = user?.id || "-"
  const displayPhone = user?.phone_number || "-"
  const uiText = useCallback(
    (englishText: string, chineseText: string, cantoneseText?: string, frenchText?: string) =>
      localizeText(englishText, {
        zh: chineseText,
        yue: cantoneseText ?? chineseText,
        fr: frenchText,
      }),
    [localizeText],
  )
  const premiumCardBase =
    "group relative overflow-hidden rounded-[28px] border border-white/70 bg-white/80 shadow-[0_20px_70px_rgba(15,23,42,0.08)] backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_28px_90px_rgba(15,23,42,0.12)]"
  const completedCardSurface = "ring-1 ring-emerald-200 bg-[linear-gradient(135deg,rgba(236,253,245,0.98),rgba(255,255,255,0.98),rgba(220,252,231,0.92))]"

  const loadAssessmentStatus = useCallback(async () => {
    if (!user) return

    try {
      console.log("[v0] Dashboard: Loading assessment status for user:", user.id)

      const { data: assessments } = await supabase.from("assessments").select("*").eq("user_id", user.id)
      console.log("[v0] Dashboard: Found assessments:", assessments)

      const { data: sensoryAssessments } = await supabase.from("sensory_assessments").select("*").eq("user_id", user.id)
      const { data: tcmAssessments } = await supabase.from("tcm_assessments").select("*").eq("user_id", user.id)
      const { data: files } = await supabase.from("uploaded_files").select("*").eq("user_id", user.id)

      const newStatus: AssessmentStatus = {
        moca: { completed: false },
        mmse: { completed: false },
        upload: { completed: false },
        visual: { completed: false },
        auditory: { completed: false },
        olfactory: { completed: false },
        tcm: { completed: false },
      }

      let hasCompleted = false

      if (assessments) {
        assessments.forEach((assessment) => {
          const completedToday = isSameCalendarDay(assessment.completed_at)

          if (assessment.type === "MOCA" || assessment.type === "MoCA") {
            if (completedToday) {
              newStatus.moca = { completed: true, score: assessment.score }
            }
            hasCompleted = true
            console.log("[v0] Dashboard: MoCA completed with score:", assessment.score)
          } else if (assessment.type === "MMSE") {
            if (completedToday) {
              newStatus.mmse = { completed: true, score: assessment.score }
            }
            hasCompleted = true
            console.log("[v0] Dashboard: MMSE completed with score:", assessment.score)
          }
        })
      }

      if (sensoryAssessments) {
        sensoryAssessments.forEach((assessment) => {
          const completedToday = assessment.test_date === new Date().toISOString().split("T")[0]
          const type = assessment.test_type as "visual" | "auditory" | "olfactory"
          if (completedToday) {
            if (type === "olfactory") {
              newStatus.olfactory = {
                completed: true,
                score: Math.round(assessment.raw_score || 0),
                classification: assessment.classification || undefined,
              }
            } else {
              newStatus[type] = {
                completed: true,
                score: Math.round(assessment.normalized_score || 0),
                classification: assessment.classification || undefined,
              }
            }
          }
          hasCompleted = true
        })
      }

      if (tcmAssessments) {
        tcmAssessments.forEach((assessment) => {
          const completedToday = isSameCalendarDay(assessment.completed_at)
          if (completedToday) {
            newStatus.tcm = { completed: true, score: Math.round(assessment.overall_score || 0) }
          }
          hasCompleted = true
        })
      }

      if (files && files.length > 0) {
        newStatus.upload = { completed: true, fileCount: files.length }
      }

      console.log("[v0] Dashboard: Final status:", newStatus)
      setStatus(newStatus)
      setHasAnyAssessments(hasCompleted)
    } catch (error) {
      console.error("[v0] Dashboard: Error loading assessment status:", error)
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    if (user) {
      void loadAssessmentStatus()
    }
  }, [progress, user, loadAssessmentStatus])

  const canTakeTestToday = async (testType: string): Promise<boolean> => {
    if (!user?.id) return false

    const today = new Date().toISOString().split("T")[0]

    try {
      if (testType === "visual" || testType === "auditory" || testType === "olfactory") {
        const { data } = await supabase
          .from("sensory_assessments")
          .select("id")
          .eq("user_id", user.id)
          .eq("test_type", testType)
          .eq("test_date", today)
          .limit(1)

        return !data || data.length === 0
      } else if (testType === "tcm") {
        const { data } = await supabase
          .from("tcm_assessments")
          .select("completed_at")
          .eq("user_id", user.id)

        return !(data ?? []).some((assessment) => isSameCalendarDay(assessment.completed_at))
      } else {
        const { data } = await supabase
          .from("assessments")
          .select("completed_at")
          .eq("user_id", user.id)
          .eq("type", testType.toUpperCase())

        return !(data ?? []).some((assessment) => isSameCalendarDay(assessment.completed_at))
      }
    } catch (error) {
      console.error("Error checking test availability:", error)
      return true
    }
  }

  const handleLogout = () => {
    logout()
  }

  const handleRetake = async (type: "moca" | "mmse" | "visual" | "auditory" | "olfactory" | "tcm") => {
    const canTake = await canTakeTestToday(type)

    if (!canTake) {
      alert(t("dashboard.test_once_per_day"))
      return
    }

    if (confirm(t("dashboard.confirm_retake"))) {
      onStartAssessment(type)
    }
  }

  const handleAssessmentAction = (type: "moca" | "mmse") => {
    const assessmentStatus = status[type]
    const hasProgress = progress[type.toUpperCase()]

    if (assessmentStatus.completed) {
      if (onViewResults) {
        onViewResults(type)
      }
    } else if (hasProgress && onResumeAssessment) {
      onResumeAssessment(type, hasProgress.current_step, hasProgress.scores)
    } else {
      onStartAssessment(type)
    }
  }

  const handleResetSession = async (type: "moca" | "mmse") => {
    if (!onResetAssessmentSession) {
      return
    }

    if (
      confirm(
        uiText(
          "Reset the current session and start again from zero?",
          "要重设当前测试并从零开始吗？",
          "要重設當前測試並由零開始嗎？",
          "Réinitialiser la session en cours et recommencer depuis le début ?",
        ),
      )
    ) {
      await onResetAssessmentSession(type)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>{t("common.loading")}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,0.16),_transparent_28%),radial-gradient(circle_at_top_right,_rgba(16,185,129,0.14),_transparent_24%),linear-gradient(135deg,_#f7fbff_0%,_#eefaf7_45%,_#f4f7ff_100%)] p-4 md:p-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8 overflow-hidden rounded-[32px] border border-white/80 bg-[radial-gradient(circle_at_top_left,_rgba(56,189,248,0.16),_transparent_32%),radial-gradient(circle_at_bottom_right,_rgba(16,185,129,0.14),_transparent_24%),linear-gradient(135deg,_rgba(255,255,255,0.94),_rgba(247,250,255,0.96))] shadow-[0_24px_90px_rgba(15,23,42,0.10)] backdrop-blur-xl">
          <div className="px-6 py-6 md:px-8 md:py-8">
            <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
              <div className="max-w-3xl">
                <div className="mb-3 inline-flex items-center rounded-full bg-slate-900 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-white shadow-sm">
                  <Sparkles className="mr-2 h-3.5 w-3.5" />
                  {uiText("Premium Cognitive Suite", "高级认知评估套件", "高級認知評估套件", "Suite cognitive premium")}
                </div>
                <h1 className="text-3xl font-bold tracking-tight text-slate-900 md:text-4xl">{t("dashboard.title")}</h1>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600 md:text-base">
                  {localizeText(
                    "A clinical-grade screening workspace with guided assessments, multimodal intelligence, and more refined patient interactions.",
                    {
                      zh: "一个具备临床质感的筛查工作台，结合引导式评估、多模态智能与更精致的患者交互体验。",
                      yue: "一個具備臨床質感嘅篩查工作台，結合引導式評估、多模態智能同更精緻嘅病人互動體驗。",
                      fr: "Un espace de dépistage à l’allure clinique, combinant évaluations guidées, intelligence multimodale et interactions patient plus raffinées.",
                    },
                  )}
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-3 xl:min-w-[420px]">
                <div className="rounded-2xl border border-white/80 bg-white/75 p-4 shadow-sm backdrop-blur">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">{t("dashboard.name")}</p>
                  <p className="mt-2 text-lg font-semibold text-slate-900">{displayName}</p>
                </div>
                <div className="rounded-2xl border border-white/80 bg-white/75 p-4 shadow-sm backdrop-blur sm:col-span-2">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">{t("dashboard.id")}</p>
                  <p className="mt-2 truncate font-mono text-sm text-slate-900 md:text-base">{displayId}</p>
                  <p className="mt-1 text-sm text-slate-600">{displayPhone}</p>
                </div>
              </div>
            </div>

            <div className="mt-6 flex flex-col gap-4 border-t border-white/70 pt-5 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex flex-wrap items-center gap-2">
                <Button variant={language === "en" ? "default" : "outline"} size="sm" onClick={() => setLanguage("en")} className={`touch-target rounded-xl ${language === "en" ? "bg-slate-900 text-white hover:bg-slate-800" : "border-white bg-white/80 hover:bg-white"}`}>English</Button>
                <Button variant={language === "zh" ? "default" : "outline"} size="sm" onClick={() => setLanguage("zh")} className={`touch-target rounded-xl ${language === "zh" ? "bg-slate-900 text-white hover:bg-slate-800" : "border-white bg-white/80 hover:bg-white"}`}>中文</Button>
                <Button variant={language === "yue" ? "default" : "outline"} size="sm" onClick={() => setLanguage("yue")} className={`touch-target rounded-xl ${language === "yue" ? "bg-slate-900 text-white hover:bg-slate-800" : "border-white bg-white/80 hover:bg-white"}`}>廣東話</Button>
                <Button variant={language === "fr" ? "default" : "outline"} size="sm" onClick={() => setLanguage("fr")} className={`touch-target rounded-xl ${language === "fr" ? "bg-slate-900 text-white hover:bg-slate-800" : "border-white bg-white/80 hover:bg-white"}`}>Français</Button>
                <ThemeToggle />
                <Button asChild variant="outline" size="sm" className="touch-target rounded-xl border-rose-200 bg-white/80 text-rose-700 hover:bg-rose-50">
                  <Link href="/olfactory-preview">{localizeText("Odofin Preview", { zh: "Odofin预览", yue: "Odofin預覽", fr: "Aperçu Odofin" })}</Link>
                </Button>
                <Button asChild variant="outline" size="sm" className="touch-target rounded-xl border-amber-200 bg-white/80 text-amber-700 hover:bg-amber-50">
                  <Link href="/olfactory-temp">{localizeText("Temporary Olfactory Premium", { zh: "临时嗅觉高级版", yue: "臨時嗅覺高級版", fr: "Olfactif temporaire premium" })}</Link>
                </Button>
              </div>
              <Button variant="outline" onClick={handleLogout} className="touch-target rounded-xl border-red-200 bg-white/80 text-red-700 hover:bg-red-50">
                <LogOut className="w-4 h-4 mr-2" />
                {t("common.logout")}
              </Button>
            </div>
          </div>
        </div>

        {hasAnyAssessments && onViewRiskProfile && (
          <Card className={`mb-7 ${premiumCardBase} border-purple-200/70 bg-[radial-gradient(circle_at_top_right,_rgba(168,85,247,0.16),_transparent_32%),linear-gradient(135deg,_rgba(250,245,255,0.98),_rgba(255,255,255,0.96),_rgba(253,242,248,0.96))]`}>
            <CardHeader>
              <div className="flex items-center justify-between gap-4">
                <div>
                  <Badge className="mb-3 rounded-full bg-purple-100 text-purple-800 shadow-sm hover:bg-purple-100">
                    <ShieldCheck className="mr-2 h-3.5 w-3.5" />
                    {uiText("Insight Layer", "洞察层", "洞察層", "Couche d’analyse")}
                  </Badge>
                  <CardTitle className="flex items-center gap-2 text-slate-900">
                    <TrendingUp className="h-6 w-6 text-purple-600" />
                    {t("risk.profile_title")}
                  </CardTitle>
                </div>
                <div className="hidden rounded-2xl border border-white/80 bg-white/70 px-4 py-3 text-right shadow-sm md:block">
                  <p className="text-xs uppercase tracking-[0.16em] text-slate-500">{uiText("Status", "状态", "狀態", "Statut")}</p>
                  <p className="mt-1 text-sm font-semibold text-purple-700">{uiText("Ready to review", "可查看", "可查看", "Prêt à consulter")}</p>
                </div>
              </div>
              <CardDescription className="max-w-2xl text-sm text-slate-600">
                {localizeText("View your comprehensive dementia risk assessment", {
                  zh: "查看您的综合认知风险评估",
                  yue: "查看你嘅綜合認知風險評估",
                  fr: "Consultez votre évaluation complète du risque de démence",
                })}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={onViewRiskProfile} className="w-full rounded-2xl bg-gradient-to-r from-purple-600 to-fuchsia-600 shadow-md hover:from-purple-700 hover:to-fuchsia-700" size="lg">
                {t("risk.view_profile")}
              </Button>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          <Card className={`${premiumCardBase} ${status.moca.completed ? completedCardSurface : "bg-[linear-gradient(135deg,rgba(239,246,255,0.98),rgba(255,255,255,0.98),rgba(224,242,254,0.92))]"}`}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className={`p-3 rounded-2xl shadow-sm ${status.moca.completed ? "bg-gradient-to-br from-emerald-400 to-green-500 text-white" : "bg-gradient-to-br from-blue-500 to-sky-500 text-white"}`}>
                  <Brain className="w-7 h-7" />
                </div>
                {status.moca.completed && <CheckCircle className="w-6 h-6 text-emerald-500" />}
              </div>
              <CardTitle className="text-lg mt-4 font-semibold">{t("dashboard.moca")}</CardTitle>
              <CardDescription className="text-sm">{t("dashboard.moca.description")}</CardDescription>
              <InstructionAudio instructionKey="moca.title" className="mt-2" />
            </CardHeader>
            <CardContent>
              {status.moca.completed ? (
                <div className="space-y-3">
                  <div className="bg-white/60 backdrop-blur-sm rounded-xl p-3 text-center">
                    <p className="text-3xl font-bold text-emerald-600">{status.moca.score}/30</p>
                    <p className="text-xs text-emerald-700 mt-1">{t("dashboard.completed")}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <Button variant="outline" className="w-full bg-white/80 hover:bg-white text-sm rounded-xl border-emerald-200" onClick={() => handleAssessmentAction("moca")}>{t("common.view_results")}</Button>
                    <Button variant="outline" className="w-full bg-white/80 hover:bg-white text-sm rounded-xl border-dashed border-emerald-300" onClick={() => handleRetake("moca")}>{t("common.retake")}</Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center text-sm text-blue-600">
                    <Clock className="w-4 h-4 mr-1.5" />
                    <span>{progress.MOCA ? t("dashboard.resume") : t("dashboard.pending")}</span>
                  </div>
                  {progress.MOCA ? (
                    <div className="grid grid-cols-2 gap-2">
                      <Button className="w-full bg-gradient-to-r from-blue-500 to-sky-500 hover:from-blue-600 hover:to-sky-600 text-white shadow-md rounded-xl font-medium" onClick={() => handleAssessmentAction("moca")}>{t("common.resume")}</Button>
                      <Button variant="outline" className="w-full bg-white/80 hover:bg-white text-sm rounded-xl border-dashed border-blue-300" onClick={() => handleResetSession("moca")}>
                        {localizeText("Start New Session", {
                          zh: "开始新测试",
                          yue: "開始新測試",
                          fr: "Commencer une nouvelle session",
                        })}
                      </Button>
                    </div>
                  ) : (
                    <Button className="w-full bg-gradient-to-r from-blue-500 to-sky-500 hover:from-blue-600 hover:to-sky-600 text-white shadow-md rounded-xl font-medium" onClick={() => handleAssessmentAction("moca")}>{t("common.start")}</Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className={`${premiumCardBase} ${status.mmse.completed ? completedCardSurface : "bg-[linear-gradient(135deg,rgba(240,253,250,0.98),rgba(255,255,255,0.98),rgba(236,254,255,0.92))]"}`}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className={`p-3 rounded-2xl shadow-sm ${status.mmse.completed ? "bg-gradient-to-br from-emerald-400 to-green-500 text-white" : "bg-gradient-to-br from-teal-500 to-cyan-500 text-white"}`}>
                  <Brain className="w-7 h-7" />
                </div>
                {status.mmse.completed && <CheckCircle className="w-6 h-6 text-emerald-500" />}
              </div>
              <CardTitle className="text-lg mt-4 font-semibold">{t("dashboard.mmse")}</CardTitle>
              <CardDescription className="text-sm">{t("dashboard.mmse.description")}</CardDescription>
              <InstructionAudio instructionKey="mmse.title" className="mt-2" />
            </CardHeader>
            <CardContent>
              {status.mmse.completed ? (
                <div className="space-y-3">
                  <div className="bg-white/60 backdrop-blur-sm rounded-xl p-3 text-center">
                    <p className="text-3xl font-bold text-emerald-600">{status.mmse.score}/30</p>
                    <p className="text-xs text-emerald-700 mt-1">{t("dashboard.completed")}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <Button variant="outline" className="w-full bg-white/80 hover:bg-white text-sm rounded-xl border-emerald-200" onClick={() => handleAssessmentAction("mmse")}>{t("common.view_results")}</Button>
                    <Button variant="outline" className="w-full bg-white/80 hover:bg-white text-sm rounded-xl border-dashed border-emerald-300" onClick={() => handleRetake("mmse")}>{t("common.retake")}</Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center text-sm text-teal-600">
                    <Clock className="w-4 h-4 mr-1.5" />
                    <span>{progress.MMSE ? t("dashboard.resume") : t("dashboard.pending")}</span>
                  </div>
                  {progress.MMSE ? (
                    <div className="grid grid-cols-2 gap-2">
                      <Button className="w-full bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white shadow-md rounded-xl font-medium" onClick={() => handleAssessmentAction("mmse")}>{t("common.resume")}</Button>
                      <Button variant="outline" className="w-full bg-white/80 hover:bg-white text-sm rounded-xl border-dashed border-teal-300" onClick={() => handleResetSession("mmse")}>
                        {localizeText("Start New Session", {
                          zh: "开始新测试",
                          yue: "開始新測試",
                          fr: "Commencer une nouvelle session",
                        })}
                      </Button>
                    </div>
                  ) : (
                    <Button className="w-full bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white shadow-md rounded-xl font-medium" onClick={() => handleAssessmentAction("mmse")}>{t("common.start")}</Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className={`${premiumCardBase} ${status.tcm.completed ? completedCardSurface : "bg-[linear-gradient(135deg,rgba(240,253,244,0.98),rgba(255,255,255,0.98),rgba(236,253,245,0.92))]"}`}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className={`p-3 rounded-2xl shadow-sm ${status.tcm.completed ? "bg-gradient-to-br from-emerald-400 to-green-500 text-white" : "bg-gradient-to-br from-green-500 to-emerald-500 text-white"}`}>
                  <Leaf className="w-7 h-7" />
                </div>
                {status.tcm.completed && <CheckCircle className="w-6 h-6 text-emerald-500" />}
              </div>
              <CardTitle className="text-lg mt-4 font-semibold">{uiText("TCM Constitution", "中医体质辨识", "中醫體質辨識", "Constitution MTC")}</CardTitle>
              <CardDescription className="text-sm">{uiText("Assess your body constitution based on TCM principles", "根据中医理论评估您的体质类型", "根據中醫理論評估你嘅體質類型", "Évaluez votre constitution corporelle selon les principes de la MTC")}</CardDescription>
            </CardHeader>
            <CardContent>
              {status.tcm.completed ? (
                <div className="space-y-3">
                  <div className="bg-white/60 backdrop-blur-sm rounded-xl p-3 text-center">
                    <p className="text-3xl font-bold text-emerald-600">{status.tcm.score}%</p>
                    <p className="text-xs text-emerald-700 mt-1">{t("dashboard.completed")}</p>
                  </div>
                  <Button variant="outline" className="w-full bg-white/80 hover:bg-white text-sm rounded-xl border-dashed border-emerald-300" onClick={() => handleRetake("tcm")}>{t("common.retake")}</Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center text-sm text-green-600">
                    <Clock className="w-4 h-4 mr-1.5" />
                    <span>{t("dashboard.pending")}</span>
                  </div>
                  <Button className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white shadow-md rounded-xl font-medium" onClick={() => onStartAssessment("tcm")}>{t("common.start")}</Button>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className={`${premiumCardBase} bg-[linear-gradient(135deg,rgba(248,250,252,0.98),rgba(255,255,255,0.98),rgba(236,254,255,0.92))]`}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="p-3 rounded-2xl shadow-sm bg-gradient-to-br from-slate-700 to-cyan-600 text-white">
                  <Activity className="w-7 h-7" />
                </div>
              </div>
              <CardTitle className="text-lg mt-4 font-semibold">{t("dashboard.multimodal")}</CardTitle>
              <CardDescription className="text-sm">{t("dashboard.multimodal.description")}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center text-sm text-slate-600">
                  <Clock className="w-4 h-4 mr-1.5" />
                  <span>{localizeText("EEG, blood biomarkers, and sensory fusion preview", {
                    zh: "EEG、血液生物标志物与感觉融合预览",
                    yue: "EEG、血液生物標誌物同感官融合預覽",
                    fr: "Aperçu de la fusion EEG, biomarqueurs sanguins et sensoriels",
                  })}</span>
                </div>
                <Button asChild className="w-full bg-gradient-to-r from-slate-700 to-cyan-600 hover:from-slate-800 hover:to-cyan-700 text-white shadow-md rounded-xl font-medium">
                  <Link href="/multimodal">{localizeText("Open Multimodal Module", {
                    zh: "打开多模态模块",
                    yue: "打開多模態模組",
                    fr: "Ouvrir le module multimodal",
                  })}</Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className={`${premiumCardBase} ${status.upload.completed ? completedCardSurface : "bg-[linear-gradient(135deg,rgba(245,243,255,0.98),rgba(255,255,255,0.98),rgba(250,245,255,0.92))]"}`}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className={`p-3 rounded-2xl shadow-sm ${status.upload.completed ? "bg-gradient-to-br from-emerald-400 to-green-500 text-white" : "bg-gradient-to-br from-violet-500 to-purple-500 text-white"}`}>
                  <Upload className="w-7 h-7" />
                </div>
                {status.upload.completed && <CheckCircle className="w-6 h-6 text-emerald-500" />}
              </div>
              <CardTitle className="text-lg mt-4 font-semibold">{uiText("TCM Image Upload", "中医图像上传", "中醫圖像上傳", "Téléversement d’images MTC")}</CardTitle>
              <CardDescription className="text-sm">{uiText("Upload tongue, face images for TCM diagnosis", "上传舌象、面部等中医诊断图像", "上傳舌象、面部等中醫診斷圖像", "Téléversez des images de la langue et du visage pour l’évaluation MTC")}</CardDescription>
              <InstructionAudio instructionKey="upload.instruction" className="mt-2" />
            </CardHeader>
            <CardContent>
              {status.upload.completed ? (
                <div className="space-y-3">
                  <div className="bg-white/60 backdrop-blur-sm rounded-xl p-3 text-center">
                    <p className="text-lg font-semibold text-emerald-600">{t("dashboard.files_uploaded", { count: status.upload.fileCount })}</p>
                    <p className="text-xs text-emerald-700 mt-1">{t("dashboard.completed")}</p>
                  </div>
                  <Button variant="outline" className="w-full bg-white/80 hover:bg-white text-sm rounded-xl border-emerald-200" onClick={() => onStartAssessment("upload")}>{t("dashboard.manage_files")}</Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center text-sm text-violet-600">
                    <Clock className="w-4 h-4 mr-1.5" />
                    <span>{t("dashboard.pending")}</span>
                  </div>
                  <Button className="w-full bg-gradient-to-r from-violet-500 to-purple-500 hover:from-violet-600 hover:to-purple-600 text-white shadow-md rounded-xl font-medium" onClick={() => onStartAssessment("upload")}>{t("dashboard.upload_files")}</Button>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className={`${premiumCardBase} ${status.visual.completed ? completedCardSurface : "bg-[linear-gradient(135deg,rgba(238,242,255,0.98),rgba(255,255,255,0.98),rgba(239,246,255,0.92))]"}`}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className={`p-3 rounded-2xl shadow-sm ${status.visual.completed ? "bg-gradient-to-br from-emerald-400 to-green-500 text-white" : "bg-gradient-to-br from-indigo-500 to-blue-500 text-white"}`}>
                  <Eye className="w-7 h-7" />
                </div>
                {status.visual.completed && <CheckCircle className="w-6 h-6 text-emerald-500" />}
              </div>
              <CardTitle className="text-lg mt-4 font-semibold">{t("sensory.visual.title")}</CardTitle>
              <CardDescription className="text-sm">{t("sensory.visual.description")}</CardDescription>
            </CardHeader>
            <CardContent>
              {status.visual.completed ? (
                <div className="space-y-3">
                  <div className="bg-white/60 backdrop-blur-sm rounded-xl p-3 text-center">
                    <p className="text-3xl font-bold text-emerald-600">{status.visual.score}%</p>
                    <p className="text-xs text-emerald-700 mt-1">{t("dashboard.completed")}</p>
                  </div>
                  <Button variant="outline" className="w-full bg-white/80 hover:bg-white text-sm rounded-xl border-dashed border-emerald-300" onClick={() => handleRetake("visual")}>{t("common.retake")}</Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center text-sm text-indigo-600">
                    <Clock className="w-4 h-4 mr-1.5" />
                    <span>{t("dashboard.pending")}</span>
                  </div>
                  <Button className="w-full bg-gradient-to-r from-indigo-500 to-blue-500 hover:from-indigo-600 hover:to-blue-600 text-white shadow-md rounded-xl font-medium" onClick={() => onStartAssessment("visual")}>{t("common.start")}</Button>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className={`${premiumCardBase} ${status.auditory.completed ? completedCardSurface : "bg-[linear-gradient(135deg,rgba(255,241,242,0.98),rgba(255,255,255,0.98),rgba(253,242,248,0.92))]"}`}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className={`p-3 rounded-2xl shadow-sm ${status.auditory.completed ? "bg-gradient-to-br from-emerald-400 to-green-500 text-white" : "bg-gradient-to-br from-rose-500 to-pink-500 text-white"}`}>
                  <Ear className="w-7 h-7" />
                </div>
                {status.auditory.completed && <CheckCircle className="w-6 h-6 text-emerald-500" />}
              </div>
              <CardTitle className="text-lg mt-4 font-semibold">{t("sensory.auditory.title")}</CardTitle>
              <CardDescription className="text-sm">{t("sensory.auditory.description")}</CardDescription>
            </CardHeader>
            <CardContent>
              {status.auditory.completed ? (
                <div className="space-y-3">
                  <div className="bg-white/60 backdrop-blur-sm rounded-xl p-3 text-center">
                    <p className="text-3xl font-bold text-emerald-600">{status.auditory.score}%</p>
                    <p className="text-xs text-emerald-700 mt-1">{t("dashboard.completed")}</p>
                  </div>
                  <Button variant="outline" className="w-full bg-white/80 hover:bg-white text-sm rounded-xl border-dashed border-emerald-300" onClick={() => handleRetake("auditory")}>{t("common.retake")}</Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center text-sm text-rose-600">
                    <Clock className="w-4 h-4 mr-1.5" />
                    <span>{t("dashboard.pending")}</span>
                  </div>
                  <Button className="w-full bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white shadow-md rounded-xl font-medium" onClick={() => onStartAssessment("auditory")}>{t("common.start")}</Button>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className={`${premiumCardBase} ${status.olfactory.completed ? completedCardSurface : "bg-[linear-gradient(135deg,rgba(255,251,235,0.98),rgba(255,255,255,0.98),rgba(255,247,237,0.92))]"}`}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className={`p-3 rounded-2xl shadow-sm ${status.olfactory.completed ? "bg-gradient-to-br from-emerald-400 to-green-500 text-white" : "bg-gradient-to-br from-amber-500 to-orange-500 text-white"}`}>
                  <Flower2 className="w-7 h-7" />
                </div>
                {status.olfactory.completed && <CheckCircle className="w-6 h-6 text-emerald-500" />}
              </div>
              <CardTitle className="text-lg mt-4 font-semibold">{t("sensory.olfactory.title")}</CardTitle>
              <CardDescription className="text-sm">{t("sensory.olfactory.description")}</CardDescription>
            </CardHeader>
            <CardContent>
              {status.olfactory.completed ? (
                <div className="space-y-3">
                  <div className="bg-white/60 backdrop-blur-sm rounded-xl p-3 text-center">
                    <p className="text-3xl font-bold text-emerald-600">{status.olfactory.score}/12</p>
                    <p className="text-xs text-emerald-700 mt-1">
                      {status.olfactory.classification === "normal"
                        ? localizeText("Normal identification range", { zh: "识别结果正常", yue: "識別結果正常", fr: "Identification normale" })
                        : localizeText("Review recommended", { zh: "建议复核", yue: "建議覆核", fr: "Révision recommandée" })}
                    </p>
                  </div>
                  <Button variant="outline" className="w-full bg-white/80 hover:bg-white text-sm rounded-xl border-dashed border-emerald-300" onClick={() => handleRetake("olfactory")}>{t("common.retake")}</Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center text-sm text-amber-600">
                    <Clock className="w-4 h-4 mr-1.5" />
                    <span>{t("dashboard.pending")}</span>
                  </div>
                  <Button className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-md rounded-xl font-medium" onClick={() => onStartAssessment("olfactory")}>{t("common.start")}</Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

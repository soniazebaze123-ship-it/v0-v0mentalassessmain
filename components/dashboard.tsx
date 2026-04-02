"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useLanguage } from "@/contexts/language-context"
import { useUser } from "@/contexts/user-context"
import { supabase } from "@/lib/supabase"
import { Brain, CheckCircle, Clock, LogOut, Eye, Ear, Flower2, TrendingUp, Leaf } from "lucide-react"
import { InstructionAudio } from "@/components/ui/instruction-audio"
import { ThemeToggle } from "@/components/ui/theme-toggle"

interface AssessmentStatus {
  moca: { completed: boolean; score?: number }
  mmse: { completed: boolean; score?: number }
  visual: { completed: boolean; score?: number }
  auditory: { completed: boolean; score?: number }
  olfactory: { completed: boolean; score?: number }
  tcm: { completed: boolean; score?: number }
}

interface DashboardProps {
  onStartAssessment: (type: "moca" | "mmse" | "visual" | "auditory" | "olfactory" | "tcm") => void
  onResumeAssessment?: (type: "moca" | "mmse", step: number, scores: number[]) => void
  onViewResults?: (type: "moca" | "mmse") => void
  onViewRiskProfile?: () => void
}

export function Dashboard({ onStartAssessment, onResumeAssessment, onViewResults, onViewRiskProfile }: DashboardProps) {
  const [status, setStatus] = useState<AssessmentStatus>({
    moca: { completed: false },
    mmse: { completed: false },
    visual: { completed: false },
    auditory: { completed: false },
    olfactory: { completed: false },
    tcm: { completed: false },
  })
  const [loading, setLoading] = useState(true)
  const [hasAnyAssessments, setHasAnyAssessments] = useState(false)
  const { t, language, setLanguage } = useLanguage()
  const { user, logout, progress } = useUser()

  useEffect(() => {
    if (user) {
      loadAssessmentStatus()
    }
  }, [user, progress])

  const loadAssessmentStatus = async () => {
    if (!user) return

    try {
      // Load assessment results
      const { data: assessments } = await supabase.from("assessments").select("*").eq("user_id", user.id)

      const { data: sensoryAssessments } = await supabase.from("sensory_assessments").select("*").eq("user_id", user.id)

      const newStatus: AssessmentStatus = {
        moca: { completed: false },
        mmse: { completed: false },
        visual: { completed: false },
        auditory: { completed: false },
        olfactory: { completed: false },
        tcm: { completed: false },
      }

      let hasCompleted = false

      if (assessments) {
        assessments.forEach((assessment) => {
          if (assessment.type === "MOCA" || assessment.type === "MoCA") {
            newStatus.moca = { completed: true, score: assessment.score }
            hasCompleted = true
          } else if (assessment.type === "MMSE") {
            newStatus.mmse = { completed: true, score: assessment.score }
            hasCompleted = true
          }
        })
      }

      if (sensoryAssessments) {
        sensoryAssessments.forEach((assessment) => {
          const type = assessment.test_type as "visual" | "auditory" | "olfactory"
          newStatus[type] = {
            completed: true,
            score: Math.round(assessment.normalized_score || 0),
          }
          hasCompleted = true
        })
      }

      setStatus(newStatus)
      setHasAnyAssessments(hasCompleted)
    } catch (error) {
      // Error loading assessment status - silently continue
    } finally {
      setLoading(false)
    }
  }

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
      } else {
        const { data } = await supabase
          .from("assessments")
          .select("id")
          .eq("user_id", user.id)
          .eq("type", testType.toUpperCase())
          .eq("test_date", today)
          .limit(1)

        return !data || data.length === 0
      }
    } catch (error) {
      // Error checking test availability - allow test
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-teal-50 to-indigo-100 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col lg:flex-row justify-between items-center mb-8 gap-4">
          <div className="text-center lg:text-left">
            <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">{t("dashboard.title")}</h1>
            <p className="text-gray-600 mt-2">
              {t("dashboard.phone")}: {user?.phone_number}
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-2">
            <Button
              variant={language === "en" ? "default" : "outline"}
              size="sm"
              onClick={() => setLanguage("en")}
              className="touch-target"
            >
              English
            </Button>
            <Button
              variant={language === "zh" ? "default" : "outline"}
              size="sm"
              onClick={() => setLanguage("zh")}
              className="touch-target"
            >
              中文
            </Button>
            <Button
              variant={language === "yue" ? "default" : "outline"}
              size="sm"
              onClick={() => setLanguage("yue")}
              className="touch-target"
            >
              廣東話
            </Button>
            <Button
              variant={language === "fr" ? "default" : "outline"}
              size="sm"
              onClick={() => setLanguage("fr")}
              className="touch-target"
            >
              Français
            </Button>
            <ThemeToggle />
          </div>
          <Button
            variant="outline"
            onClick={handleLogout}
            className="touch-target bg-transparent border-red-200 hover:bg-red-50 text-red-700"
          >
            <LogOut className="w-4 h-4 mr-2" />
            {t("common.logout")}
          </Button>
        </div>

        {/* Risk Profile Card (if assessments completed) */}
        {hasAnyAssessments && onViewRiskProfile && (
          <Card className="mb-6 border-2 border-purple-300 bg-gradient-to-r from-purple-50 to-pink-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-6 w-6 text-purple-600" />
                {t("risk.profile_title")}
              </CardTitle>
              <CardDescription>View your comprehensive dementia risk assessment</CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={onViewRiskProfile} className="w-full bg-purple-600 hover:bg-purple-700" size="lg">
                {t("risk.view_profile")}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Assessment Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {/* MoCA Assessment - Vibrant Blue */}
          <Card
            className={`transition-all duration-300 border-0 shadow-xl hover:shadow-2xl hover:scale-[1.02] ${status.moca.completed ? "bg-gradient-to-br from-blue-200 via-blue-100 to-cyan-100 ring-2 ring-blue-500" : "bg-gradient-to-br from-blue-100 via-white to-cyan-50 hover:from-blue-200 hover:to-cyan-100"}`}
          >
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div
                  className={`p-3 rounded-2xl shadow-lg ${status.moca.completed ? "bg-gradient-to-br from-blue-500 to-cyan-500 text-white" : "bg-gradient-to-br from-blue-600 to-cyan-600 text-white"}`}
                >
                  <Brain className="w-7 h-7" />
                </div>
                {status.moca.completed && <CheckCircle className="w-6 h-6 text-blue-600" />}
              </div>
              <CardTitle className="text-lg mt-4 font-bold text-blue-900">{t("dashboard.moca")}</CardTitle>
              <CardDescription className="text-sm text-blue-700">{t("dashboard.moca.description")}</CardDescription>
              <InstructionAudio instructionKey="moca.title" className="mt-2" />
            </CardHeader>
            <CardContent>
              {status.moca.completed ? (
                <div className="space-y-3">
                  <div className="bg-white/80 backdrop-blur-sm rounded-xl p-3 text-center shadow-md border border-blue-200">
                    <p className="text-3xl font-bold text-blue-600">{status.moca.score}/30</p>
                    <p className="text-xs text-blue-500 font-medium mt-1">{t("dashboard.completed")}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      variant="outline"
                      className="w-full bg-white hover:bg-blue-50 text-sm rounded-xl border-2 border-blue-400 text-blue-700 hover:text-blue-800 font-medium"
                      onClick={() => handleAssessmentAction("moca")}
                    >
                      {t("common.view_results")}
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full bg-white hover:bg-blue-50 text-sm rounded-xl border-2 border-dashed border-blue-400 text-blue-700 font-medium"
                      onClick={() => handleRetake("moca")}
                    >
                      {t("common.retake")}
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center text-sm text-blue-700 font-medium">
                    <Clock className="w-4 h-4 mr-1.5" />
                    <span>{progress.MOCA ? t("dashboard.resume") : t("dashboard.pending")}</span>
                  </div>
                  <Button
                    className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white shadow-lg rounded-xl font-bold text-base py-3"
                    onClick={() => handleAssessmentAction("moca")}
                  >
                    {progress.MOCA ? t("common.resume") : t("common.start")}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* MMSE Assessment - Vibrant Purple */}
          <Card
            className={`transition-all duration-300 border-0 shadow-xl hover:shadow-2xl hover:scale-[1.02] ${status.mmse.completed ? "bg-gradient-to-br from-purple-200 via-purple-100 to-fuchsia-100 ring-2 ring-purple-500" : "bg-gradient-to-br from-purple-100 via-white to-fuchsia-50 hover:from-purple-200 hover:to-fuchsia-100"}`}
          >
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div
                  className={`p-3 rounded-2xl shadow-lg ${status.mmse.completed ? "bg-gradient-to-br from-purple-500 to-fuchsia-500 text-white" : "bg-gradient-to-br from-purple-600 to-fuchsia-600 text-white"}`}
                >
                  <Brain className="w-7 h-7" />
                </div>
                {status.mmse.completed && <CheckCircle className="w-6 h-6 text-purple-600" />}
              </div>
              <CardTitle className="text-lg mt-4 font-bold text-purple-900">{t("dashboard.mmse")}</CardTitle>
              <CardDescription className="text-sm text-purple-700">{t("dashboard.mmse.description")}</CardDescription>
              <InstructionAudio instructionKey="mmse.title" className="mt-2" />
            </CardHeader>
            <CardContent>
              {status.mmse.completed ? (
                <div className="space-y-3">
                  <div className="bg-white/80 backdrop-blur-sm rounded-xl p-3 text-center shadow-md border border-purple-200">
                    <p className="text-3xl font-bold text-purple-600">{status.mmse.score}/30</p>
                    <p className="text-xs text-purple-500 font-medium mt-1">{t("dashboard.completed")}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      variant="outline"
                      className="w-full bg-white hover:bg-purple-50 text-sm rounded-xl border-2 border-purple-400 text-purple-700 hover:text-purple-800 font-medium"
                      onClick={() => handleAssessmentAction("mmse")}
                    >
                      {t("common.view_results")}
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full bg-white hover:bg-purple-50 text-sm rounded-xl border-2 border-dashed border-purple-400 text-purple-700 font-medium"
                      onClick={() => handleRetake("mmse")}
                    >
                      {t("common.retake")}
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center text-sm text-purple-700 font-medium">
                    <Clock className="w-4 h-4 mr-1.5" />
                    <span>{progress.MMSE ? t("dashboard.resume") : t("dashboard.pending")}</span>
                  </div>
                  <Button
                    className="w-full bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-700 hover:to-fuchsia-700 text-white shadow-lg rounded-xl font-bold text-base py-3"
                    onClick={() => handleAssessmentAction("mmse")}
                  >
                    {progress.MMSE ? t("common.resume") : t("common.start")}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* TCM Constitution Assessment - Vibrant Green */}
          <Card
            className={`transition-all duration-300 border-0 shadow-xl hover:shadow-2xl hover:scale-[1.02] ${status.tcm.completed ? "bg-gradient-to-br from-green-200 via-green-100 to-emerald-100 ring-2 ring-green-500" : "bg-gradient-to-br from-green-100 via-white to-emerald-50 hover:from-green-200 hover:to-emerald-100"}`}
          >
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div
                  className={`p-3 rounded-2xl shadow-lg ${status.tcm.completed ? "bg-gradient-to-br from-green-500 to-emerald-500 text-white" : "bg-gradient-to-br from-green-600 to-emerald-600 text-white"}`}
                >
                  <Leaf className="w-7 h-7" />
                </div>
                {status.tcm.completed && <CheckCircle className="w-6 h-6 text-green-600" />}
              </div>
              <CardTitle className="text-lg mt-4 font-bold text-green-900">{language === "zh" ? "中医体质辨识" : "TCM Constitution"}</CardTitle>
              <CardDescription className="text-sm text-green-700">
                {language === "zh" 
                  ? "根据中医理论评估您的体质类型" 
                  : "Assess your body constitution based on TCM principles"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {status.tcm.completed ? (
                <div className="space-y-3">
                  <div className="bg-white/80 backdrop-blur-sm rounded-xl p-3 text-center shadow-md border border-green-200">
                    <p className="text-3xl font-bold text-green-600">{status.tcm.score}%</p>
                    <p className="text-xs text-green-500 font-medium mt-1">{t("dashboard.completed")}</p>
                  </div>
                  <Button
                    variant="outline"
                    className="w-full bg-white hover:bg-green-50 text-sm rounded-xl border-2 border-dashed border-green-400 text-green-700 font-medium"
                    onClick={() => handleRetake("tcm")}
                  >
                    {t("common.retake")}
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center text-sm text-green-700 font-medium">
                    <Clock className="w-4 h-4 mr-1.5" />
                    <span>{t("dashboard.pending")}</span>
                  </div>
                  <Button
                    className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-lg rounded-xl font-bold text-base py-3"
                    onClick={() => onStartAssessment("tcm")}
                  >
                    {t("common.start")}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Visual Screening - Vibrant Yellow */}
          <Card
            className={`transition-all duration-300 border-0 shadow-xl hover:shadow-2xl hover:scale-[1.02] ${status.visual.completed ? "bg-gradient-to-br from-yellow-200 via-yellow-100 to-amber-100 ring-2 ring-yellow-500" : "bg-gradient-to-br from-yellow-100 via-white to-amber-50 hover:from-yellow-200 hover:to-amber-100"}`}
          >
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div
                  className={`p-3 rounded-2xl shadow-lg ${status.visual.completed ? "bg-gradient-to-br from-yellow-500 to-amber-500 text-white" : "bg-gradient-to-br from-yellow-500 to-amber-600 text-white"}`}
                >
                  <Eye className="w-7 h-7" />
                </div>
                {status.visual.completed && <CheckCircle className="w-6 h-6 text-yellow-600" />}
              </div>
              <CardTitle className="text-lg mt-4 font-bold text-yellow-900">{t("sensory.visual.title")}</CardTitle>
              <CardDescription className="text-sm text-yellow-700">{t("sensory.visual.description")}</CardDescription>
            </CardHeader>
            <CardContent>
              {status.visual.completed ? (
                <div className="space-y-3">
                  <div className="bg-white/80 backdrop-blur-sm rounded-xl p-3 text-center shadow-md border border-yellow-200">
                    <p className="text-3xl font-bold text-yellow-600">{status.visual.score}%</p>
                    <p className="text-xs text-yellow-500 font-medium mt-1">{t("dashboard.completed")}</p>
                  </div>
                  <Button
                    variant="outline"
                    className="w-full bg-white hover:bg-yellow-50 text-sm rounded-xl border-2 border-dashed border-yellow-400 text-yellow-700 font-medium"
                    onClick={() => handleRetake("visual")}
                  >
                    {t("common.retake")}
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center text-sm text-yellow-700 font-medium">
                    <Clock className="w-4 h-4 mr-1.5" />
                    <span>{t("dashboard.pending")}</span>
                  </div>
                  <Button
                    className="w-full bg-gradient-to-r from-yellow-500 to-amber-600 hover:from-yellow-600 hover:to-amber-700 text-white shadow-lg rounded-xl font-bold text-base py-3"
                    onClick={() => onStartAssessment("visual")}
                  >
                    {t("common.start")}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Auditory Screening - Vibrant Pink */}
          <Card
            className={`transition-all duration-300 border-0 shadow-xl hover:shadow-2xl hover:scale-[1.02] ${status.auditory.completed ? "bg-gradient-to-br from-pink-200 via-pink-100 to-rose-100 ring-2 ring-pink-500" : "bg-gradient-to-br from-pink-100 via-white to-rose-50 hover:from-pink-200 hover:to-rose-100"}`}
          >
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div
                  className={`p-3 rounded-2xl shadow-lg ${status.auditory.completed ? "bg-gradient-to-br from-pink-500 to-rose-500 text-white" : "bg-gradient-to-br from-pink-600 to-rose-600 text-white"}`}
                >
                  <Ear className="w-7 h-7" />
                </div>
                {status.auditory.completed && <CheckCircle className="w-6 h-6 text-pink-600" />}
              </div>
              <CardTitle className="text-lg mt-4 font-bold text-pink-900">{t("sensory.auditory.title")}</CardTitle>
              <CardDescription className="text-sm text-pink-700">{t("sensory.auditory.description")}</CardDescription>
            </CardHeader>
            <CardContent>
              {status.auditory.completed ? (
                <div className="space-y-3">
                  <div className="bg-white/80 backdrop-blur-sm rounded-xl p-3 text-center shadow-md border border-pink-200">
                    <p className="text-3xl font-bold text-pink-600">{status.auditory.score}%</p>
                    <p className="text-xs text-pink-500 font-medium mt-1">{t("dashboard.completed")}</p>
                  </div>
                  <Button
                    variant="outline"
                    className="w-full bg-white hover:bg-pink-50 text-sm rounded-xl border-2 border-dashed border-pink-400 text-pink-700 font-medium"
                    onClick={() => handleRetake("auditory")}
                  >
                    {t("common.retake")}
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center text-sm text-pink-700 font-medium">
                    <Clock className="w-4 h-4 mr-1.5" />
                    <span>{t("dashboard.pending")}</span>
                  </div>
                  <Button
                    className="w-full bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-700 hover:to-rose-700 text-white shadow-lg rounded-xl font-bold text-base py-3"
                    onClick={() => onStartAssessment("auditory")}
                  >
                    {t("common.start")}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Olfactory Screening - Vibrant Orange */}
          <Card
            className={`transition-all duration-300 border-0 shadow-xl hover:shadow-2xl hover:scale-[1.02] ${status.olfactory.completed ? "bg-gradient-to-br from-orange-200 via-orange-100 to-red-100 ring-2 ring-orange-500" : "bg-gradient-to-br from-orange-100 via-white to-red-50 hover:from-orange-200 hover:to-red-100"}`}
          >
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div
                  className={`p-3 rounded-2xl shadow-lg ${status.olfactory.completed ? "bg-gradient-to-br from-orange-500 to-red-500 text-white" : "bg-gradient-to-br from-orange-600 to-red-600 text-white"}`}
                >
                  <Flower2 className="w-7 h-7" />
                </div>
                {status.olfactory.completed && <CheckCircle className="w-6 h-6 text-orange-600" />}
              </div>
              <CardTitle className="text-lg mt-4 font-bold text-orange-900">{t("sensory.olfactory.title")}</CardTitle>
              <CardDescription className="text-sm text-orange-700">{t("sensory.olfactory.description")}</CardDescription>
            </CardHeader>
            <CardContent>
              {status.olfactory.completed ? (
                <div className="space-y-3">
                  <div className="bg-white/80 backdrop-blur-sm rounded-xl p-3 text-center shadow-md border border-orange-200">
                    <p className="text-3xl font-bold text-orange-600">{status.olfactory.score}%</p>
                    <p className="text-xs text-orange-500 font-medium mt-1">{t("dashboard.completed")}</p>
                  </div>
                  <Button
                    variant="outline"
                    className="w-full bg-white hover:bg-orange-50 text-sm rounded-xl border-2 border-dashed border-orange-400 text-orange-700 font-medium"
                    onClick={() => handleRetake("olfactory")}
                  >
                    {t("common.retake")}
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center text-sm text-orange-700 font-medium">
                    <Clock className="w-4 h-4 mr-1.5" />
                    <span>{t("dashboard.pending")}</span>
                  </div>
                  <Button
                    className="w-full bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white shadow-lg rounded-xl font-bold text-base py-3"
                    onClick={() => onStartAssessment("olfactory")}
                  >
                    {t("common.start")}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

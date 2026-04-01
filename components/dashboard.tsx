"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useLanguage } from "@/contexts/language-context"
import { useUser } from "@/contexts/user-context"
import { supabase } from "@/lib/supabase"
import { Brain, Upload, CheckCircle, Clock, LogOut, Eye, Ear, Flower2, TrendingUp, Leaf } from "lucide-react"
import { InstructionAudio } from "@/components/ui/instruction-audio"
import { ThemeToggle } from "@/components/ui/theme-toggle"

interface AssessmentStatus {
  moca: { completed: boolean; score?: number }
  mmse: { completed: boolean; score?: number }
  upload: { completed: boolean; fileCount?: number }
  visual: { completed: boolean; score?: number }
  auditory: { completed: boolean; score?: number }
  olfactory: { completed: boolean; score?: number }
  tcm: { completed: boolean; score?: number }
}

interface DashboardProps {
  onStartAssessment: (type: "moca" | "mmse" | "upload" | "visual" | "auditory" | "olfactory" | "tcm") => void
  onResumeAssessment?: (type: "moca" | "mmse", step: number, scores: number[]) => void
  onViewResults?: (type: "moca" | "mmse") => void
  onViewRiskProfile?: () => void
}

export function Dashboard({ onStartAssessment, onResumeAssessment, onViewResults, onViewRiskProfile }: DashboardProps) {
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

      // Load uploaded files
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

      if (files && files.length > 0) {
        newStatus.upload = { completed: true, fileCount: files.length }
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
          {/* MoCA Assessment */}
          <Card
            className={`transition-all duration-300 border-0 shadow-lg hover:shadow-xl ${status.moca.completed ? "bg-gradient-to-br from-emerald-50 to-green-100 ring-2 ring-emerald-400" : "bg-gradient-to-br from-blue-50 via-white to-sky-50 hover:from-blue-100 hover:to-sky-100"}`}
          >
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div
                  className={`p-3 rounded-2xl shadow-sm ${status.moca.completed ? "bg-gradient-to-br from-emerald-400 to-green-500 text-white" : "bg-gradient-to-br from-blue-500 to-sky-500 text-white"}`}
                >
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
                    <Button
                      variant="outline"
                      className="w-full bg-white/80 hover:bg-white text-sm rounded-xl border-emerald-200"
                      onClick={() => handleAssessmentAction("moca")}
                    >
                      {t("common.view_results")}
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full bg-white/80 hover:bg-white text-sm rounded-xl border-dashed border-emerald-300"
                      onClick={() => handleRetake("moca")}
                    >
                      {t("common.retake")}
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center text-sm text-blue-600">
                    <Clock className="w-4 h-4 mr-1.5" />
                    <span>{progress.MOCA ? t("dashboard.resume") : t("dashboard.pending")}</span>
                  </div>
                  <Button
                    className="w-full bg-gradient-to-r from-blue-500 to-sky-500 hover:from-blue-600 hover:to-sky-600 text-white shadow-md rounded-xl font-medium"
                    onClick={() => handleAssessmentAction("moca")}
                  >
                    {progress.MOCA ? t("common.resume") : t("common.start")}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* MMSE Assessment */}
          <Card
            className={`transition-all duration-300 border-0 shadow-lg hover:shadow-xl ${status.mmse.completed ? "bg-gradient-to-br from-emerald-50 to-green-100 ring-2 ring-emerald-400" : "bg-gradient-to-br from-teal-50 via-white to-cyan-50 hover:from-teal-100 hover:to-cyan-100"}`}
          >
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div
                  className={`p-3 rounded-2xl shadow-sm ${status.mmse.completed ? "bg-gradient-to-br from-emerald-400 to-green-500 text-white" : "bg-gradient-to-br from-teal-500 to-cyan-500 text-white"}`}
                >
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
                    <Button
                      variant="outline"
                      className="w-full bg-white/80 hover:bg-white text-sm rounded-xl border-emerald-200"
                      onClick={() => handleAssessmentAction("mmse")}
                    >
                      {t("common.view_results")}
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full bg-white/80 hover:bg-white text-sm rounded-xl border-dashed border-emerald-300"
                      onClick={() => handleRetake("mmse")}
                    >
                      {t("common.retake")}
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center text-sm text-teal-600">
                    <Clock className="w-4 h-4 mr-1.5" />
                    <span>{progress.MMSE ? t("dashboard.resume") : t("dashboard.pending")}</span>
                  </div>
                  <Button
                    className="w-full bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white shadow-md rounded-xl font-medium"
                    onClick={() => handleAssessmentAction("mmse")}
                  >
                    {progress.MMSE ? t("common.resume") : t("common.start")}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* TCM Constitution Assessment */}
          <Card
            className={`transition-all duration-300 border-0 shadow-lg hover:shadow-xl ${status.tcm.completed ? "bg-gradient-to-br from-emerald-50 to-green-100 ring-2 ring-emerald-400" : "bg-gradient-to-br from-green-50 via-white to-emerald-50 hover:from-green-100 hover:to-emerald-100"}`}
          >
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div
                  className={`p-3 rounded-2xl shadow-sm ${status.tcm.completed ? "bg-gradient-to-br from-emerald-400 to-green-500 text-white" : "bg-gradient-to-br from-green-500 to-emerald-500 text-white"}`}
                >
                  <Leaf className="w-7 h-7" />
                </div>
                {status.tcm.completed && <CheckCircle className="w-6 h-6 text-emerald-500" />}
              </div>
              <CardTitle className="text-lg mt-4 font-semibold">{language === "zh" ? "中医体质辨识" : "TCM Constitution"}</CardTitle>
              <CardDescription className="text-sm">
                {language === "zh" 
                  ? "根据中医理论评估您的体质类型" 
                  : "Assess your body constitution based on TCM principles"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {status.tcm.completed ? (
                <div className="space-y-3">
                  <div className="bg-white/60 backdrop-blur-sm rounded-xl p-3 text-center">
                    <p className="text-3xl font-bold text-emerald-600">{status.tcm.score}%</p>
                    <p className="text-xs text-emerald-700 mt-1">{t("dashboard.completed")}</p>
                  </div>
                  <Button
                    variant="outline"
                    className="w-full bg-white/80 hover:bg-white text-sm rounded-xl border-dashed border-emerald-300"
                    onClick={() => handleRetake("tcm")}
                  >
                    {t("common.retake")}
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center text-sm text-green-600">
                    <Clock className="w-4 h-4 mr-1.5" />
                    <span>{t("dashboard.pending")}</span>
                  </div>
                  <Button
                    className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white shadow-md rounded-xl font-medium"
                    onClick={() => onStartAssessment("tcm")}
                  >
                    {t("common.start")}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* TCM Image Upload */}
          <Card
            className={`transition-all duration-300 border-0 shadow-lg hover:shadow-xl ${status.upload.completed ? "bg-gradient-to-br from-emerald-50 to-green-100 ring-2 ring-emerald-400" : "bg-gradient-to-br from-violet-50 via-white to-purple-50 hover:from-violet-100 hover:to-purple-100"}`}
          >
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div
                  className={`p-3 rounded-2xl shadow-sm ${status.upload.completed ? "bg-gradient-to-br from-emerald-400 to-green-500 text-white" : "bg-gradient-to-br from-violet-500 to-purple-500 text-white"}`}
                >
                  <Upload className="w-7 h-7" />
                </div>
                {status.upload.completed && <CheckCircle className="w-6 h-6 text-emerald-500" />}
              </div>
              <CardTitle className="text-lg mt-4 font-semibold">{language === "zh" ? "中医图像上传" : "TCM Image Upload"}</CardTitle>
              <CardDescription className="text-sm">{language === "zh" ? "上传舌象、面部等中医诊断图像" : "Upload tongue, face images for TCM diagnosis"}</CardDescription>
              <InstructionAudio instructionKey="upload.instruction" className="mt-2" />
            </CardHeader>
            <CardContent>
              {status.upload.completed ? (
                <div className="space-y-3">
                  <div className="bg-white/60 backdrop-blur-sm rounded-xl p-3 text-center">
                    <p className="text-lg font-semibold text-emerald-600">
                      {t("dashboard.files_uploaded", { count: status.upload.fileCount })}
                    </p>
                    <p className="text-xs text-emerald-700 mt-1">{t("dashboard.completed")}</p>
                  </div>
                  <Button
                    variant="outline"
                    className="w-full bg-white/80 hover:bg-white text-sm rounded-xl border-emerald-200"
                    onClick={() => onStartAssessment("upload")}
                  >
                    {t("dashboard.manage_files")}
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center text-sm text-violet-600">
                    <Clock className="w-4 h-4 mr-1.5" />
                    <span>{t("dashboard.pending")}</span>
                  </div>
                  <Button 
                    className="w-full bg-gradient-to-r from-violet-500 to-purple-500 hover:from-violet-600 hover:to-purple-600 text-white shadow-md rounded-xl font-medium"
                    onClick={() => onStartAssessment("upload")}
                  >
                    {t("dashboard.upload_files")}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Visual Screening */}
          <Card
            className={`transition-all duration-300 border-0 shadow-lg hover:shadow-xl ${status.visual.completed ? "bg-gradient-to-br from-emerald-50 to-green-100 ring-2 ring-emerald-400" : "bg-gradient-to-br from-indigo-50 via-white to-blue-50 hover:from-indigo-100 hover:to-blue-100"}`}
          >
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div
                  className={`p-3 rounded-2xl shadow-sm ${status.visual.completed ? "bg-gradient-to-br from-emerald-400 to-green-500 text-white" : "bg-gradient-to-br from-indigo-500 to-blue-500 text-white"}`}
                >
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
                  <Button
                    variant="outline"
                    className="w-full bg-white/80 hover:bg-white text-sm rounded-xl border-dashed border-emerald-300"
                    onClick={() => handleRetake("visual")}
                  >
                    {t("common.retake")}
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center text-sm text-indigo-600">
                    <Clock className="w-4 h-4 mr-1.5" />
                    <span>{t("dashboard.pending")}</span>
                  </div>
                  <Button
                    className="w-full bg-gradient-to-r from-indigo-500 to-blue-500 hover:from-indigo-600 hover:to-blue-600 text-white shadow-md rounded-xl font-medium"
                    onClick={() => onStartAssessment("visual")}
                  >
                    {t("common.start")}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Auditory Screening */}
          <Card
            className={`transition-all duration-300 border-0 shadow-lg hover:shadow-xl ${status.auditory.completed ? "bg-gradient-to-br from-emerald-50 to-green-100 ring-2 ring-emerald-400" : "bg-gradient-to-br from-rose-50 via-white to-pink-50 hover:from-rose-100 hover:to-pink-100"}`}
          >
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div
                  className={`p-3 rounded-2xl shadow-sm ${status.auditory.completed ? "bg-gradient-to-br from-emerald-400 to-green-500 text-white" : "bg-gradient-to-br from-rose-500 to-pink-500 text-white"}`}
                >
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
                  <Button
                    variant="outline"
                    className="w-full bg-white/80 hover:bg-white text-sm rounded-xl border-dashed border-emerald-300"
                    onClick={() => handleRetake("auditory")}
                  >
                    {t("common.retake")}
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center text-sm text-rose-600">
                    <Clock className="w-4 h-4 mr-1.5" />
                    <span>{t("dashboard.pending")}</span>
                  </div>
                  <Button
                    className="w-full bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white shadow-md rounded-xl font-medium"
                    onClick={() => onStartAssessment("auditory")}
                  >
                    {t("common.start")}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Olfactory Screening */}
          <Card
            className={`transition-all duration-300 border-0 shadow-lg hover:shadow-xl ${status.olfactory.completed ? "bg-gradient-to-br from-emerald-50 to-green-100 ring-2 ring-emerald-400" : "bg-gradient-to-br from-amber-50 via-white to-orange-50 hover:from-amber-100 hover:to-orange-100"}`}
          >
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div
                  className={`p-3 rounded-2xl shadow-sm ${status.olfactory.completed ? "bg-gradient-to-br from-emerald-400 to-green-500 text-white" : "bg-gradient-to-br from-amber-500 to-orange-500 text-white"}`}
                >
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
                    <p className="text-3xl font-bold text-emerald-600">{status.olfactory.score}%</p>
                    <p className="text-xs text-emerald-700 mt-1">{t("dashboard.completed")}</p>
                  </div>
                  <Button
                    variant="outline"
                    className="w-full bg-white/80 hover:bg-white text-sm rounded-xl border-dashed border-emerald-300"
                    onClick={() => handleRetake("olfactory")}
                  >
                    {t("common.retake")}
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center text-sm text-amber-600">
                    <Clock className="w-4 h-4 mr-1.5" />
                    <span>{t("dashboard.pending")}</span>
                  </div>
                  <Button
                    className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-md rounded-xl font-medium"
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

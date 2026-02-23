"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useLanguage } from "@/contexts/language-context"
import { useUser } from "@/contexts/user-context"
import { supabase } from "@/lib/supabase"
import { Brain, Upload, CheckCircle, Clock, LogOut, Eye, Ear, Flower2, TrendingUp } from "lucide-react"
import { InstructionAudio } from "@/components/ui/instruction-audio"
import { ThemeToggle } from "@/components/ui/theme-toggle"

interface AssessmentStatus {
  moca: { completed: boolean; score?: number }
  mmse: { completed: boolean; score?: number }
  upload: { completed: boolean; fileCount?: number }
  visual: { completed: boolean; score?: number }
  auditory: { completed: boolean; score?: number }
  olfactory: { completed: boolean; score?: number }
}

interface DashboardProps {
  onStartAssessment: (type: "moca" | "mmse" | "upload" | "visual" | "auditory" | "olfactory") => void
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
      console.log("[v0] Dashboard: Loading assessment status for user:", user.id)

      // Load assessment results
      const { data: assessments } = await supabase.from("assessments").select("*").eq("user_id", user.id)

      console.log("[v0] Dashboard: Found assessments:", assessments)

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
      }

      let hasCompleted = false

      if (assessments) {
        assessments.forEach((assessment) => {
          if (assessment.type === "MOCA" || assessment.type === "MoCA") {
            newStatus.moca = { completed: true, score: assessment.score }
            hasCompleted = true
            console.log("[v0] Dashboard: MoCA completed with score:", assessment.score)
          } else if (assessment.type === "MMSE") {
            newStatus.mmse = { completed: true, score: assessment.score }
            hasCompleted = true
            console.log("[v0] Dashboard: MMSE completed with score:", assessment.score)
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

      console.log("[v0] Dashboard: Final status:", newStatus)
      setStatus(newStatus)
      setHasAnyAssessments(hasCompleted)
    } catch (error) {
      console.error("[v0] Dashboard: Error loading assessment status:", error)
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

  const handleRetake = async (type: "moca" | "mmse" | "visual" | "auditory" | "olfactory") => {
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
            className={`transition-all duration-200 border-2 ${status.moca.completed ? "border-green-500 bg-green-50" : "border-blue-200 bg-white hover:border-blue-400"}`}
          >
            <CardHeader>
              <div className="flex items-center justify-between">
                <div
                  className={`p-3 rounded-full ${status.moca.completed ? "bg-green-100 text-green-600" : "bg-blue-100 text-blue-600"}`}
                >
                  <Brain className="w-8 h-8" />
                </div>
                {status.moca.completed && <CheckCircle className="w-6 h-6 text-green-600" />}
              </div>
              <CardTitle className="text-lg mt-4">{t("dashboard.moca")}</CardTitle>
              <CardDescription>{t("dashboard.moca.description")}</CardDescription>
              <InstructionAudio instructionKey="moca.title" className="mt-2" />
            </CardHeader>
            <CardContent>
              {status.moca.completed ? (
                <div className="space-y-3">
                  <Badge variant="secondary" className="bg-green-100 text-green-800 w-full justify-center py-1">
                    {t("dashboard.completed")}
                  </Badge>
                  <p className="text-center font-bold text-2xl text-green-700">{status.moca.score}/30</p>
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      variant="outline"
                      className="w-full bg-white hover:bg-gray-50 text-sm"
                      onClick={() => handleAssessmentAction("moca")}
                    >
                      {t("common.view_results")}
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full bg-white hover:bg-gray-50 text-sm border-dashed"
                      onClick={() => handleRetake("moca")}
                    >
                      {t("common.retake")}
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <span>{progress.MOCA ? t("dashboard.resume") : t("dashboard.pending")}</span>
                  </div>
                  <Button
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white shadow-md"
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
            className={`transition-all duration-200 border-2 ${status.mmse.completed ? "border-green-500 bg-green-50" : "border-teal-200 bg-white hover:border-teal-400"}`}
          >
            <CardHeader>
              <div className="flex items-center justify-between">
                <div
                  className={`p-3 rounded-full ${status.mmse.completed ? "bg-green-100 text-green-600" : "bg-teal-100 text-teal-600"}`}
                >
                  <Brain className="w-8 h-8" />
                </div>
                {status.mmse.completed && <CheckCircle className="w-6 h-6 text-green-600" />}
              </div>
              <CardTitle className="text-lg mt-4">{t("dashboard.mmse")}</CardTitle>
              <CardDescription>{t("dashboard.mmse.description")}</CardDescription>
              <InstructionAudio instructionKey="mmse.title" className="mt-2" />
            </CardHeader>
            <CardContent>
              {status.mmse.completed ? (
                <div className="space-y-3">
                  <Badge variant="secondary" className="bg-green-100 text-green-800 w-full justify-center py-1">
                    {t("dashboard.completed")}
                  </Badge>
                  <p className="text-center font-bold text-2xl text-green-700">{status.mmse.score}/30</p>
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      variant="outline"
                      className="w-full bg-white hover:bg-gray-50 text-sm"
                      onClick={() => handleAssessmentAction("mmse")}
                    >
                      {t("common.view_results")}
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full bg-white hover:bg-gray-50 text-sm border-dashed"
                      onClick={() => handleRetake("mmse")}
                    >
                      {t("common.retake")}
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <span>{progress.MMSE ? t("dashboard.resume") : t("dashboard.pending")}</span>
                  </div>
                  <Button
                    className="w-full bg-teal-600 hover:bg-teal-700 text-white shadow-md"
                    onClick={() => handleAssessmentAction("mmse")}
                  >
                    {progress.MMSE ? t("common.resume") : t("common.start")}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Image Upload */}
          <Card
            className={`transition-all duration-200 border-2 ${status.upload.completed ? "border-green-500 bg-green-50" : "border-purple-200 bg-white hover:border-purple-400"}`}
          >
            <CardHeader>
              <div className="flex items-center justify-between">
                <div
                  className={`p-3 rounded-full ${status.upload.completed ? "bg-green-100 text-green-600" : "bg-purple-100 text-purple-600"}`}
                >
                  <Upload className="w-8 h-8" />
                </div>
                {status.upload.completed && <CheckCircle className="w-6 h-6 text-green-600" />}
              </div>
              <CardTitle className="text-lg mt-4">{t("dashboard.upload")}</CardTitle>
              <CardDescription>{t("dashboard.upload.description")}</CardDescription>
              <InstructionAudio instructionKey="upload.instruction" className="mt-2" />
            </CardHeader>
            <CardContent>
              {status.upload.completed ? (
                <div className="space-y-2">
                  <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                    {t("dashboard.completed")}
                  </Badge>
                  <p className="text-sm font-medium">
                    {t("dashboard.files_uploaded", { count: status.upload.fileCount })}
                  </p>
                  <Button
                    variant="outline"
                    className="w-full bg-transparent"
                    onClick={() => onStartAssessment("upload")}
                  >
                    {t("dashboard.manage_files")}
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  <Badge variant="outline" className="border-gray-400 text-gray-600">
                    <Clock className="w-3 h-3 mr-1" />
                    {t("dashboard.pending")}
                  </Badge>
                  <Button className="w-full" onClick={() => onStartAssessment("upload")}>
                    {t("dashboard.upload_files")}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Visual Screening */}
          <Card
            className={`transition-all duration-200 border-2 ${status.visual.completed ? "border-green-500 bg-green-50" : "border-indigo-200 bg-white hover:border-indigo-400"}`}
          >
            <CardHeader>
              <div className="flex items-center justify-between">
                <div
                  className={`p-3 rounded-full ${status.visual.completed ? "bg-green-100 text-green-600" : "bg-indigo-100 text-indigo-600"}`}
                >
                  <Eye className="w-8 h-8" />
                </div>
                {status.visual.completed && <CheckCircle className="w-6 h-6 text-green-600" />}
              </div>
              <CardTitle className="text-lg mt-4">{t("sensory.visual.title")}</CardTitle>
              <CardDescription>{t("sensory.visual.description")}</CardDescription>
            </CardHeader>
            <CardContent>
              {status.visual.completed ? (
                <div className="space-y-3">
                  <Badge variant="secondary" className="bg-green-100 text-green-800 w-full justify-center py-1">
                    {t("dashboard.completed")}
                  </Badge>
                  <p className="text-center font-bold text-2xl text-green-700">{status.visual.score}%</p>
                  <Button
                    variant="outline"
                    className="w-full bg-white hover:bg-gray-50 text-sm border-dashed"
                    onClick={() => handleRetake("visual")}
                  >
                    {t("common.retake")}
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <Badge variant="outline" className="border-gray-400 text-gray-600">
                    <Clock className="w-3 h-3 mr-1" />
                    {t("dashboard.pending")}
                  </Badge>
                  <Button
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white shadow-md"
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
            className={`transition-all duration-200 border-2 ${status.auditory.completed ? "border-green-500 bg-green-50" : "border-pink-200 bg-white hover:border-pink-400"}`}
          >
            <CardHeader>
              <div className="flex items-center justify-between">
                <div
                  className={`p-3 rounded-full ${status.auditory.completed ? "bg-green-100 text-green-600" : "bg-pink-100 text-pink-600"}`}
                >
                  <Ear className="w-8 h-8" />
                </div>
                {status.auditory.completed && <CheckCircle className="w-6 h-6 text-green-600" />}
              </div>
              <CardTitle className="text-lg mt-4">{t("sensory.auditory.title")}</CardTitle>
              <CardDescription>{t("sensory.auditory.description")}</CardDescription>
            </CardHeader>
            <CardContent>
              {status.auditory.completed ? (
                <div className="space-y-3">
                  <Badge variant="secondary" className="bg-green-100 text-green-800 w-full justify-center py-1">
                    {t("dashboard.completed")}
                  </Badge>
                  <p className="text-center font-bold text-2xl text-green-700">{status.auditory.score}%</p>
                  <Button
                    variant="outline"
                    className="w-full bg-white hover:bg-gray-50 text-sm border-dashed"
                    onClick={() => handleRetake("auditory")}
                  >
                    {t("common.retake")}
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <Badge variant="outline" className="border-gray-400 text-gray-600">
                    <Clock className="w-3 h-3 mr-1" />
                    {t("dashboard.pending")}
                  </Badge>
                  <Button
                    className="w-full bg-pink-600 hover:bg-pink-700 text-white shadow-md"
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
            className={`transition-all duration-200 border-2 ${status.olfactory.completed ? "border-green-500 bg-green-50" : "border-amber-200 bg-white hover:border-amber-400"}`}
          >
            <CardHeader>
              <div className="flex items-center justify-between">
                <div
                  className={`p-3 rounded-full ${status.olfactory.completed ? "bg-green-100 text-green-600" : "bg-amber-100 text-amber-600"}`}
                >
                  <Flower2 className="w-8 h-8" />
                </div>
                {status.olfactory.completed && <CheckCircle className="w-6 h-6 text-green-600" />}
              </div>
              <CardTitle className="text-lg mt-4">{t("sensory.olfactory.title")}</CardTitle>
              <CardDescription>{t("sensory.olfactory.description")}</CardDescription>
            </CardHeader>
            <CardContent>
              {status.olfactory.completed ? (
                <div className="space-y-3">
                  <Badge variant="secondary" className="bg-green-100 text-green-800 w-full justify-center py-1">
                    {t("dashboard.completed")}
                  </Badge>
                  <p className="text-center font-bold text-2xl text-green-700">{status.olfactory.score}%</p>
                  <Button
                    variant="outline"
                    className="w-full bg-white hover:bg-gray-50 text-sm border-dashed"
                    onClick={() => handleRetake("olfactory")}
                  >
                    {t("common.retake")}
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <Badge variant="outline" className="border-gray-400 text-gray-600">
                    <Clock className="w-3 h-3 mr-1" />
                    {t("dashboard.pending")}
                  </Badge>
                  <Button
                    className="w-full bg-amber-600 hover:bg-amber-700 text-white shadow-md"
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

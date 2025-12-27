"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useLanguage } from "@/contexts/language-context"
import { useUser } from "@/contexts/user-context"
import { supabase } from "@/lib/supabase"
import { Brain, Upload, CheckCircle, Clock, LogOut } from "lucide-react"
import { InstructionAudio } from "@/components/ui/instruction-audio"
import { ThemeToggle } from "@/components/ui/theme-toggle"

interface AssessmentStatus {
  moca: { completed: boolean; score?: number }
  mmse: { completed: boolean; score?: number }
  upload: { completed: boolean; fileCount?: number }
}

interface DashboardProps {
  onStartAssessment: (type: "moca" | "mmse" | "upload") => void
  onResumeAssessment?: (type: "moca" | "mmse", step: number, scores: number[]) => void
  onViewResults?: (type: "moca" | "mmse") => void
}

export function Dashboard({ onStartAssessment, onResumeAssessment, onViewResults }: DashboardProps) {
  const [status, setStatus] = useState<AssessmentStatus>({
    moca: { completed: false },
    mmse: { completed: false },
    upload: { completed: false },
  })
  const [loading, setLoading] = useState(true)
  const { t, language, setLanguage } = useLanguage()
  const { user, logout, progress } = useUser()

  useEffect(() => {
    if (user) {
      loadAssessmentStatus()
    }
  }, [user, progress]) // Depend on progress to update status if an assessment is resumed/completed

  const loadAssessmentStatus = async () => {
    if (!user) return

    try {
      // Load assessment results
      const { data: assessments } = await supabase.from("assessments").select("*").eq("user_id", user.id)

      // Load uploaded files
      const { data: files } = await supabase.from("uploaded_files").select("*").eq("user_id", user.id)

      const newStatus: AssessmentStatus = {
        moca: { completed: false },
        mmse: { completed: false },
        upload: { completed: false },
      }

      if (assessments) {
        assessments.forEach((assessment) => {
          if (assessment.assessment_type === "MOCA") {
            newStatus.moca = { completed: true, score: assessment.total_score }
          } else if (assessment.assessment_type === "MMSE") {
            newStatus.mmse = { completed: true, score: assessment.total_score }
          }
        })
      }

      if (files && files.length > 0) {
        newStatus.upload = { completed: true, fileCount: files.length }
      }

      setStatus(newStatus)
    } catch (error) {
      console.error("Error loading assessment status:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = () => {
    logout()
  }

  const getSectionCardClass = (completed: boolean) => {
    return completed ? "border-blue-500 bg-blue-50 hover:bg-blue-100" : "border-gray-300 bg-gray-50 hover:bg-gray-100"
  }

  const handleAssessmentAction = (type: "moca" | "mmse") => {
    const assessmentStatus = status[type]
    const hasProgress = progress[type.toUpperCase()]

    if (assessmentStatus.completed) {
      // Show results - assessment is completed, cannot restart
      if (onViewResults) {
        onViewResults(type)
      }
    } else if (hasProgress && onResumeAssessment) {
      // Resume assessment
      onResumeAssessment(type, hasProgress.current_step, hasProgress.scores)
    } else {
      // Start new assessment
      onStartAssessment(type)
    }
  }

  const handleRetake = (type: "moca" | "mmse") => {
    if (confirm(t("dashboard.confirm_retake"))) {
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
      <div className="max-w-4xl mx-auto">
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
        </div>
      </div>
    </div>
  )
}

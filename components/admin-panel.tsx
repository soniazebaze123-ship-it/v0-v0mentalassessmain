"use client"

import Image from "next/image"
import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { AssessmentInput } from "@/components/ui/assessment-input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { AssessmentTextarea } from "@/components/ui/assessment-textarea"
import { supabase } from "@/lib/supabase"
import { Users, FileText, BarChart3, Download, Eye, ImageIcon, Clock, LogOut, TrendingUp } from "lucide-react"
import { useLanguage } from "@/contexts/language-context"

// Add imports for new chart components and data utilities
import { AverageScoreChart } from "@/components/admin/average-score-chart"
import { DeteriorationWorkflowChart } from "@/components/admin/deterioration-workflow-chart"
import { ScoreDistributionChart } from "@/components/admin/score-distribution-chart"
import { ProgressTrendChart } from "@/components/admin/progress-trend-chart"
import { PatientProgressTracker } from "@/components/admin/patient-progress-tracker"
import { getPatientTrajectories, getScoreDistribution, getScoreTrends, getTrajectoryWorkflowData } from "@/lib/admin-data-utils"
import { ThemeToggle } from "@/components/ui/theme-toggle"
import { ODOFIN_RISK_CUTOFF, ODOFIN_STRIPS } from "@/lib/odofin-kit"
import { TCM_PULSE_OPTIONS } from "@/lib/tcm-pulse"
import { OLFACTORY_TEMP_PREMIUM_12_QUESTIONS, SCENT_LABELS } from "@/lib/olfactory/config"

interface User {
  id: string
  phone_number: string
  created_at: string
}

export interface Assessment {
  id: string
  user_id: string
  assessment_type: "MOCA" | "MMSE"
  total_score: number
  section_scores: Record<string, number>
  completed_at: string
  laboratory_analysis?: string
}

interface UploadedFile {
  id: string
  user_id: string
  filename: string
  file_path: string
  file_type: string
  file_size: number
  uploaded_at: string
}

interface UserProgress {
  id: string
  user_id: string
  assessment_type: "MOCA" | "MMSE"
  current_step: number
  scores: number[]
  updated_at: string
}

interface SensoryAssessment {
  id: string
  user_id: string
  test_type: "visual" | "auditory" | "olfactory"
  raw_score: number | null
  normalized_score: number | null
  classification: string | null
  test_date: string | null
  test_data?: {
    total_trials?: number
    total_correct?: number
    percent_correct?: number
    strip_results?: Array<{
      strip: number
      selected?: string | null
      correctAnswer?: string | null
      correct: boolean
      timedOut?: boolean
    }>
  }
}

interface TCMAssessment {
  id: string
  user_id: string
  primary_constitution: string
  primary_score: number | null
  overall_score: number | null
  completed_at: string | null
  answers?: {
    pulse_assessment?: {
      selectedPulseIds?: string[]
      severity?: number
      clinicalPulseScore?: number
      notes?: string
    }
  }
}

export function AdminPanel() {
  const { t } = useLanguage()
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [users, setUsers] = useState<User[]>([])
  const [assessments, setAssessments] = useState<Assessment[]>([])
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([])
  const [userProgress, setUserProgress] = useState<UserProgress[]>([])
  const [sensoryAssessments, setSensoryAssessments] = useState<SensoryAssessment[]>([])
  const [tcmAssessments, setTcmAssessments] = useState<TCMAssessment[]>([])
  const [selectedUser, setSelectedUser] = useState<string | null>(null)
  const [labAnalysis, setLabAnalysis] = useState("")
  const [viewingFiles, setViewingFiles] = useState(false)
  const [viewingProgressTracker, setViewingProgressTracker] = useState(false)

  // Add new state variables for chart filtering
  const [selectedTrendUser, setSelectedTrendUser] = useState<string | null>(null)
  const [selectedTrendAssessmentType, setSelectedTrendAssessmentType] = useState<"MOCA" | "MMSE" | "ALL">("ALL")

  useEffect(() => {
    if (isAuthenticated) {
      loadData()
    }
  }, [isAuthenticated])

  const handleLogin = async () => {
    // Simple authentication - in production, use proper authentication
    if (username === "admin" && password === "admin123") {
      setIsAuthenticated(true)
    } else {
      alert("Invalid credentials")
    }
  }

  const handleLogout = () => {
    setIsAuthenticated(false)
    setUsername("")
    setPassword("")
    setSelectedUser(null)
    setUsers([])
    setAssessments([])
    setUploadedFiles([])
    setUserProgress([])
    setSensoryAssessments([])
    setTcmAssessments([])
  }

  const loadData = async () => {
    try {
      const { data: usersData } = await supabase.from("users").select("*").order("created_at", { ascending: false })
      const { data: assessmentsData } = await supabase
        .from("assessments")
        .select("*")
        .order("completed_at", { ascending: false })
      const { data: filesData } = await supabase
        .from("uploaded_files")
        .select("*")
        .order("uploaded_at", { ascending: false })
      const { data: progressData } = await supabase
        .from("user_progress")
        .select("*")
        .order("updated_at", { ascending: false })
      const { data: sensoryData } = await supabase
        .from("sensory_assessments")
        .select("*")
        .order("test_date", { ascending: false })
      const { data: tcmData } = await supabase
        .from("tcm_assessments")
        .select("*")
        .order("completed_at", { ascending: false })

      const mappedAssessments = (assessmentsData || []).map((assessment) => ({
        id: assessment.id,
        user_id: assessment.user_id,
        assessment_type: assessment.type as "MOCA" | "MMSE",
        total_score: assessment.score,
        section_scores: assessment.data?.sections || {},
        completed_at: assessment.completed_at,
        laboratory_analysis: assessment.data?.laboratory_analysis,
      }))

      setUsers(usersData || [])
      setAssessments(mappedAssessments)
      setUploadedFiles(filesData || [])
      setUserProgress(progressData || [])
      setSensoryAssessments((sensoryData || []) as SensoryAssessment[])
      setTcmAssessments((tcmData || []) as TCMAssessment[])
    } catch (error) {
      console.error("Error loading data:", error)
    }
  }

  const updateLabAnalysis = async (assessmentId: string) => {
    try {
      await supabase.from("assessments").update({ laboratory_analysis: labAnalysis }).eq("id", assessmentId)

      setAssessments((prev) =>
        prev.map((a) => (a.id === assessmentId ? { ...a, laboratory_analysis: labAnalysis } : a)),
      )
      setLabAnalysis("")
      alert("Laboratory analysis updated successfully")
    } catch (error) {
      console.error("Error updating lab analysis:", error)
      alert("Failed to update laboratory analysis")
    }
  }

  const exportData = () => {
    const csvData = assessments.map((assessment) => {
      const user = users.find((u) => u.id === assessment.user_id)
      return {
        phone_number: user?.phone_number || "",
        assessment_type: assessment.assessment_type,
        total_score: assessment.total_score,
        section_scores: JSON.stringify(assessment.section_scores),
        completed_at: assessment.completed_at,
        laboratory_analysis: assessment.laboratory_analysis || "",
      }
    })

    const csv = [
      ["Phone Number", "Assessment Type", "Total Score", "Section Scores", "Completed At", "Laboratory Analysis"],
      ...csvData.map((row) => [
        row.phone_number,
        row.assessment_type,
        row.total_score.toString(),
        row.section_scores,
        row.completed_at,
        row.laboratory_analysis,
      ]),
    ]
      .map((row) => row.join(","))
      .join("\n")

    const blob = new Blob([csv], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "assessment-results.csv"
    a.click()
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  const getFileUrl = (filePath: string) => {
    return supabase.storage.from("user-files").getPublicUrl(filePath).data.publicUrl
  }

  if (viewingProgressTracker) {
    return <PatientProgressTracker onBack={() => setViewingProgressTracker(false)} />
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>{t("admin.login_title")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">{t("admin.username")}</Label>
              <AssessmentInput
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter username"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">{t("admin.password")}</Label>
              <AssessmentInput
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
              />
            </div>
            <Button onClick={handleLogin} className="w-full">
              {t("admin.login_button")}
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const getUserAssessments = (userId: string) => {
    return assessments.filter((a) => a.user_id === userId)
  }

  const getUserFiles = (userId: string) => {
    return uploadedFiles.filter((f) => f.user_id === userId)
  }

  const getUserProgress = (userId: string) => {
    return userProgress.filter((p) => p.user_id === userId)
  }

  const getUserSensoryAssessments = (userId: string) => {
    return sensoryAssessments.filter((assessment) => assessment.user_id === userId)
  }

  const getUserTcmAssessments = (userId: string) => {
    return tcmAssessments.filter((assessment) => assessment.user_id === userId)
  }

  const getOlfactoryLabel = (value?: string | null) => {
    if (!value || value === "No answer") return "No answer"
    const translated = t(`sensory.olfactory.smell.${value}`)
    return translated.startsWith("sensory.olfactory.smell.") ? value : translated
  }

  const getPulseLabel = (pulseId: string) => {
    const pulse = TCM_PULSE_OPTIONS.find((option) => option.id === pulseId)
    return pulse ? `${pulse.char} · ${pulse.pinyin} · ${pulse.label}` : pulseId
  }

  const getAverageScores = () => {
    const mocaScores = assessments.filter((a) => a.assessment_type === "MOCA").map((a) => a.total_score)
    const mmseScores = assessments.filter((a) => a.assessment_type === "MMSE").map((a) => a.total_score)

    return {
      moca: mocaScores.length > 0 ? mocaScores.reduce((a, b) => a + b, 0) / mocaScores.length : 0,
      mmse: mmseScores.length > 0 ? mmseScores.reduce((a, b) => a + b, 0) / mmseScores.length : 0,
    }
  }

  const getSectionNames = (assessmentType: string) => {
    if (assessmentType === "MOCA") {
      return {
        visuospatial: t("moca.visuospatial"),
        executive: t("moca.executive"),
        naming: t("moca.naming"),
        memory: t("moca.memory"),
        attention: t("moca.attention"),
        language: t("moca.language"),
        orientation: t("moca.orientation"),
      }
    } else {
      return {
        orientation: t("mmse.orientation"),
        registration: t("mmse.registration"),
        attention: t("mmse.attention"),
        naming: t("mmse.naming"),
        repetition: t("mmse.repetition"),
        writing: t("mmse.writing"),
        copying: t("mmse.copying"),
      }
    }
  }

  const averageScores = getAverageScores()

  // Inside the `AdminPanel` component, after `averageScores` calculation, add the following data preparations:
  const mocaDistributionData = getScoreDistribution(assessments, "MOCA")
  const mmseDistributionData = getScoreDistribution(assessments, "MMSE")
  const trendData = getScoreTrends(assessments, selectedTrendUser, selectedTrendAssessmentType)
  const trajectoryWorkflowData = getTrajectoryWorkflowData(assessments)
  const patientTrajectories = getPatientTrajectories(assessments)

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row justify-between items-center mb-8 gap-4">
          <h1 className="text-3xl font-bold text-center sm:text-left">{t("admin.title")}</h1>
          <div className="flex flex-wrap justify-center sm:justify-end gap-2">
            <Button onClick={() => setViewingProgressTracker(true)} variant="outline">
              <TrendingUp className="w-4 h-4 mr-2" />
              Patient Progress
            </Button>
            <Button onClick={() => setViewingFiles(!viewingFiles)} variant="outline">
              <Eye className="w-4 h-4 mr-2" />
              {viewingFiles ? t("admin.view_assessments") : t("admin.view_files")}
            </Button>
            <Button onClick={exportData} className="flex items-center space-x-2">
              <Download className="w-4 h-4" />
              <span>{t("admin.export_csv")}</span>
            </Button>
            <ThemeToggle />
            <Button onClick={handleLogout} variant="outline" className="flex items-center space-x-2 bg-transparent">
              <LogOut className="w-4 h-4" />
              <span>{t("common.logout")}</span>
            </Button>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <Users className="w-8 h-8 text-blue-600" />
                <div>
                  <p className="text-2xl font-bold">{users.length}</p>
                  <p className="text-sm text-gray-600">{t("admin.total_users")}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <FileText className="w-8 h-8 text-green-600" />
                <div>
                  <p className="text-2xl font-bold">{assessments.length}</p>
                  <p className="text-sm text-gray-600">{t("admin.completed_assessments")}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <BarChart3 className="w-8 h-8 text-purple-600" />
                <div>
                  <p className="text-2xl font-bold">{averageScores.moca.toFixed(1)}</p>
                  <p className="text-sm text-gray-600">{t("admin.avg_moca_score")}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <ImageIcon className="w-8 h-8 text-orange-600" />
                <div>
                  <p className="text-2xl font-bold">{uploadedFiles.length}</p>
                  <p className="text-sm text-gray-600">{t("admin.uploaded_files")}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="mb-8 border-amber-200 bg-[linear-gradient(135deg,rgba(255,251,235,0.98),rgba(255,255,255,0.98),rgba(255,247,237,0.92))]">
          <CardHeader>
            <CardTitle>Odofin Answer Key</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-slate-600">
              Use this clinician-only key to arrange the strips and verify patient scoring. A score below {ODOFIN_RISK_CUTOFF}/12 should be reviewed as olfactory impairment risk.
            </p>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {ODOFIN_STRIPS.map((strip) => (
                <div key={strip.number} className="rounded-xl border border-amber-200 bg-white/90 p-3">
                  <div className="flex items-center justify-between gap-2">
                    <Badge className="bg-amber-500 text-white hover:bg-amber-500">Strip #{strip.number}</Badge>
                    <span className="text-sm font-semibold text-slate-700">{t(`sensory.olfactory.smell.${strip.answer}`)}</span>
                  </div>
                  <p className="mt-2 text-xs text-slate-500">
                    Options: {strip.options.map((option) => t(`sensory.olfactory.smell.${option}`)).join(", ")}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="mb-8 border-cyan-200 bg-[linear-gradient(135deg,rgba(236,254,255,0.98),rgba(255,255,255,0.98),rgba(239,246,255,0.92))]">
          <CardHeader>
            <CardTitle>Temporary Premium Olfactory Key (Examiner Only)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-slate-600">
              This key is only for examiners. Patients should not be shown the correct mapping while completing the temporary premium test.
            </p>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {OLFACTORY_TEMP_PREMIUM_12_QUESTIONS.map((question) => (
                <div key={question.id} className="rounded-xl border border-cyan-200 bg-white/90 p-3">
                  <div className="relative mb-3 h-28 overflow-hidden rounded-lg border bg-slate-50">
                    <Image src={question.imagePath} alt={question.questionCode} fill className="object-contain p-2" sizes="220px" />
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <Badge className="bg-cyan-600 text-white hover:bg-cyan-600">{question.questionCode}</Badge>
                    <span className="text-sm font-semibold text-slate-700">{SCENT_LABELS[question.correctAnswer].en}</span>
                  </div>
                  <p className="mt-2 text-xs text-slate-500">Correct: {SCENT_LABELS[question.correctAnswer].zh}</p>
                  <p className="mt-1 text-xs text-slate-500">Code description: {question.codeDescription.en}</p>
                  <p className="mt-1 text-xs text-slate-500">Options: {question.options.map((option) => SCENT_LABELS[option.key].en).join(", ")}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Add the new chart components below the statistics cards, before the "Users and Details" section. */}
        <div className="space-y-8 mb-8">
          <AverageScoreChart data={averageScores} />
          <ScoreDistributionChart mocaData={mocaDistributionData} mmseData={mmseDistributionData} />
          <ProgressTrendChart
            data={trendData}
            users={users}
            selectedUserId={selectedTrendUser}
            onSelectUser={(value) => setSelectedTrendUser(value === "all" ? null : value)}
            selectedAssessmentType={selectedTrendAssessmentType}
            onSelectAssessmentType={(value) => setSelectedTrendAssessmentType(value)}
          />
          <DeteriorationWorkflowChart
            workflowData={trajectoryWorkflowData}
            trajectories={patientTrajectories}
            users={users}
          />
        </div>

        {/* Users and Details */}
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Users List */}
          <Card>
            <CardHeader>
              <CardTitle>{t("admin.registered_users")}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {users.map((user) => {
                  const userAssessments = getUserAssessments(user.id)
                  const userFiles = getUserFiles(user.id)
                  const userCurrentProgress = getUserProgress(user.id)
                  return (
                    <div
                      key={user.id}
                      className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                        selectedUser === user.id ? "border-blue-500 bg-blue-50" : "hover:bg-gray-50"
                      }`}
                      onClick={() => setSelectedUser(user.id)}
                    >
                      <div className="flex justify-between items-center flex-wrap gap-2">
                        <div>
                          <p className="font-medium">{user.phone_number}</p>
                          <p className="text-sm text-gray-600">
                            {t("admin.registered")}: {new Date(user.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex flex-col items-end space-y-1">
                          <Badge variant="secondary">
                            {t("admin.completed_count", { count: userAssessments.length })}
                          </Badge>
                          <Badge variant="outline">
                            {t("admin.in_progress_count", { count: userCurrentProgress.length })}
                          </Badge>
                          <Badge variant="outline">{t("admin.files_count", { count: userFiles.length })}</Badge>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>

          {/* Details Panel */}
          <Card>
            <CardHeader>
              <CardTitle>
                {selectedUser
                  ? viewingFiles
                    ? t("admin.user_files")
                    : t("admin.assessment_details")
                  : t("admin.select_user")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {selectedUser ? (
                <div className="space-y-4">
                  {viewingFiles ? (
                    // Files View
                    <div className="space-y-4">
                      {getUserFiles(selectedUser).map((file) => (
                        <div key={file.id} className="border rounded-lg p-4 space-y-3">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="font-medium">{file.filename}</p>
                              <p className="text-sm text-gray-600">
                                {formatFileSize(file.file_size)} • {file.file_type}
                              </p>
                              <p className="text-xs text-gray-500">
                                {t("admin.uploaded")}: {new Date(file.uploaded_at).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          {file.file_type.startsWith("image/") && (
                            <div className="relative w-full h-32 bg-gray-100 rounded overflow-hidden">
                              <Image
                                src={getFileUrl(file.file_path) || "/placeholder.svg"}
                                alt={file.filename}
                                fill
                                className="object-cover"
                                onError={(event) => {
                                  if (event.currentTarget.src.endsWith("/placeholder.svg")) {
                                    return
                                  }

                                  event.currentTarget.src = "/placeholder.svg"
                                }}
                              />
                            </div>
                          )}
                        </div>
                      ))}
                      {getUserFiles(selectedUser).length === 0 && (
                        <p className="text-gray-600">{t("admin.no_files_uploaded")}</p>
                      )}
                    </div>
                  ) : (
                    // Assessments View (Completed and In Progress)
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold">{t("admin.completed_assessments")}</h3>
                      {getUserAssessments(selectedUser).map((assessment) => (
                        <div key={assessment.id} className="border rounded-lg p-4 space-y-4">
                          <div className="flex justify-between items-center flex-wrap gap-2">
                            <Badge variant={assessment.assessment_type === "MOCA" ? "default" : "secondary"}>
                              {assessment.assessment_type}
                            </Badge>
                            <span className="text-sm text-gray-600">
                              {new Date(assessment.completed_at).toLocaleDateString()}
                            </span>
                          </div>

                          <div>
                            <p className="font-medium">
                              {t("admin.total_score")}: {assessment.total_score}/30
                            </p>
                            <div className="text-sm text-gray-600 mt-2">
                              <p className="font-medium">{t("admin.section_scores")}:</p>
                              <div className="grid grid-cols-1 gap-1 mt-1">
                                {Object.entries(assessment.section_scores).map(([section, score]) => {
                                  const sectionNames = getSectionNames(assessment.assessment_type)
                                  const sectionName = sectionNames[section as keyof typeof sectionNames] || section
                                  return (
                                    <div key={section} className="flex justify-between">
                                      <span>{sectionName}:</span>
                                      <span className="font-medium">{t("results.points", { score })}</span>
                                    </div>
                                  )
                                })}
                              </div>
                            </div>
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor={`lab-${assessment.id}`}>{t("admin.laboratory_analysis")}</Label>
                            <AssessmentTextarea
                              id={`lab-${assessment.id}`}
                              value={assessment.laboratory_analysis || labAnalysis}
                              onChange={(e) => setLabAnalysis(e.target.value)}
                              placeholder={t("admin.enter_analysis")}
                              rows={3}
                            />
                            <Button
                              size="sm"
                              onClick={() => updateLabAnalysis(assessment.id)}
                              disabled={!labAnalysis.trim()}
                            >
                              {t("admin.update_analysis")}
                            </Button>
                          </div>
                        </div>
                      ))}
                      {getUserAssessments(selectedUser).length === 0 && (
                        <p className="text-gray-600">{t("admin.no_completed_assessments")}</p>
                      )}

                      <h3 className="text-lg font-semibold mt-6">TCM & Pulse Reviews</h3>
                      {getUserTcmAssessments(selectedUser).map((assessment) => (
                        <div key={assessment.id} className="border rounded-lg p-4 space-y-3 bg-emerald-50/60">
                          <div className="flex justify-between items-center flex-wrap gap-2">
                            <Badge variant="outline" className="bg-emerald-100 text-emerald-800">
                              {assessment.primary_constitution}
                            </Badge>
                            <span className="text-sm text-gray-600">
                              {assessment.completed_at ? new Date(assessment.completed_at).toLocaleDateString() : "No date"}
                            </span>
                          </div>
                          <p className="text-sm text-slate-700">
                            Overall score: <span className="font-semibold">{assessment.overall_score ?? "-"}/100</span>
                          </p>
                          {assessment.answers?.pulse_assessment && (
                            <div className="rounded-lg border border-emerald-200 bg-white/90 p-3 text-sm text-slate-700">
                              <p>
                                Pulse severity: <span className="font-semibold">{assessment.answers.pulse_assessment.severity ?? 0}</span>
                                {" • "}
                                Pulse score: <span className="font-semibold">{assessment.answers.pulse_assessment.clinicalPulseScore ?? 0}/100</span>
                              </p>
                              {assessment.answers.pulse_assessment.selectedPulseIds && assessment.answers.pulse_assessment.selectedPulseIds.length > 0 && (
                                <div className="mt-2 flex flex-wrap gap-2">
                                  {assessment.answers.pulse_assessment.selectedPulseIds.map((pulseId) => (
                                    <Badge key={`${assessment.id}-${pulseId}`} variant="outline" className="bg-white">
                                      {getPulseLabel(pulseId)}
                                    </Badge>
                                  ))}
                                </div>
                              )}
                              {assessment.answers.pulse_assessment.notes && (
                                <p className="mt-2 text-xs text-slate-600">Doctor note: {assessment.answers.pulse_assessment.notes}</p>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                      {getUserTcmAssessments(selectedUser).length === 0 && (
                        <p className="text-gray-600">No TCM pulse reviews recorded for this user</p>
                      )}

                      <h3 className="text-lg font-semibold mt-6">Sensory Screenings</h3>
                      {getUserSensoryAssessments(selectedUser).map((assessment) => (
                        <div key={assessment.id} className="border rounded-lg p-4 space-y-3 bg-amber-50/60">
                          <div className="flex justify-between items-center flex-wrap gap-2">
                            <Badge variant="outline" className="bg-amber-100 text-amber-800">
                              {assessment.test_type}
                            </Badge>
                            <span className="text-sm text-gray-600">
                              {assessment.test_date ? new Date(assessment.test_date).toLocaleDateString() : "No date"}
                            </span>
                          </div>
                          <p className="text-sm text-slate-700">
                            Raw score: <span className="font-semibold">{assessment.raw_score ?? "-"}</span>
                            {assessment.test_type === "olfactory" ? " / 12" : ""}
                            {" • "}
                            Classification: <span className="font-semibold">{assessment.classification ?? "-"}</span>
                          </p>
                          {assessment.test_type === "olfactory" && assessment.test_data?.strip_results && (
                            <div className="rounded-lg border border-amber-200 bg-white/90 p-3">
                              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Patient strip responses</p>
                              <div className="mt-2 grid gap-2 sm:grid-cols-2">
                                {assessment.test_data.strip_results.map((result) => (
                                  <div
                                    key={`${assessment.id}-${result.strip}`}
                                    className={`rounded-md border p-2 text-xs ${result.correct ? "border-emerald-200 bg-emerald-50/70 text-emerald-800" : "border-rose-200 bg-rose-50/70 text-rose-800"}`}
                                  >
                                    <div className="flex items-center justify-between gap-2">
                                      <div className="font-semibold">Strip #{result.strip}</div>
                                      <Badge variant="outline" className={result.correct ? "border-emerald-300 bg-white text-emerald-700" : "border-rose-300 bg-white text-rose-700"}>
                                        {result.correct ? "Correct" : result.timedOut ? "Timed out" : "Review"}
                                      </Badge>
                                    </div>
                                    <div>Selected: {getOlfactoryLabel(result.selected)}</div>
                                    <div>Correct: {getOlfactoryLabel(result.correctAnswer)}</div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                      {getUserSensoryAssessments(selectedUser).length === 0 && (
                        <p className="text-gray-600">No sensory screenings recorded for this user</p>
                      )}

                      <h3 className="text-lg font-semibold mt-6">{t("admin.assessments_in_progress")}</h3>
                      {getUserProgress(selectedUser).map((progress) => (
                        <div key={progress.id} className="border rounded-lg p-4 space-y-2 bg-yellow-50">
                          <div className="flex justify-between items-center flex-wrap gap-2">
                            <Badge variant="outline" className="bg-yellow-100 text-yellow-800">
                              <Clock className="w-3 h-3 mr-1" />
                              {progress.assessment_type} ({t("common.in_progress")})
                            </Badge>
                            <span className="text-sm text-gray-600">
                              {t("admin.last_updated")}: {new Date(progress.updated_at).toLocaleDateString()}
                            </span>
                          </div>
                          <p className="font-medium">
                            {t("admin.current_step")}: {progress.current_step + 1}
                          </p>
                          <p className="text-sm text-gray-600">
                            {t("admin.scores_so_far")}: {progress.scores.join(", ")}
                          </p>
                        </div>
                      ))}
                      {getUserProgress(selectedUser).length === 0 && (
                        <p className="text-gray-600">{t("admin.no_progress_assessments")}</p>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-gray-600">{t("admin.select_user")}</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

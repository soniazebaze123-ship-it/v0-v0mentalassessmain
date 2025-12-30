"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { AssessmentInput } from "@/components/ui/assessment-input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { AssessmentTextarea } from "@/components/ui/assessment-textarea"
import { supabase } from "@/lib/supabase"
import { Users, FileText, BarChart3, Download, Eye, ImageIcon, Clock, LogOut, TrendingUp } from "lucide-react"
import Image from "next/image"
import { useLanguage } from "@/contexts/language-context"

// Add imports for new chart components and data utilities
import { AverageScoreChart } from "@/components/admin/average-score-chart"
import { ScoreDistributionChart } from "@/components/admin/score-distribution-chart"
import { ProgressTrendChart } from "@/components/admin/progress-trend-chart"
import { PatientProgressTracker } from "@/components/admin/patient-progress-tracker"
import { getScoreDistribution, getScoreTrends } from "@/lib/admin-data-utils"
import { ThemeToggle } from "@/components/ui/theme-toggle"

interface User {
  id: string
  phone_number: string
  created_at: string
}

interface Assessment {
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

export function AdminPanel() {
  const { t } = useLanguage()
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [users, setUsers] = useState<User[]>([])
  const [assessments, setAssessments] = useState<Assessment[]>([])
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([])
  const [userProgress, setUserProgress] = useState<UserProgress[]>([])
  const [selectedUser, setSelectedUser] = useState<string | null>(null)
  const [labAnalysis, setLabAnalysis] = useState("")
  const [loading, setLoading] = useState(false)
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
  }

  const loadData = async () => {
    setLoading(true)
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
    } catch (error) {
      console.error("Error loading data:", error)
    } finally {
      setLoading(false)
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

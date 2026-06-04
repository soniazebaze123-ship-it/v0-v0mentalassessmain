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
import { Users, FileText, BarChart3, Download, Eye, ImageIcon, Clock, LogOut, TrendingUp, Printer, Sparkles } from "lucide-react"
import { useLanguage } from "@/contexts/language-context"

// Add imports for new chart components and data utilities
import { AverageScoreChart } from "@/components/admin/average-score-chart"
import { DeteriorationWorkflowChart } from "@/components/admin/deterioration-workflow-chart"
import { ScoreDistributionChart } from "@/components/admin/score-distribution-chart"
import { ProgressTrendChart } from "@/components/admin/progress-trend-chart"
import { PatientProgressTracker } from "@/components/admin/patient-progress-tracker"
import { getPatientTrajectories, getScoreDistribution, getScoreTrends, getTrajectoryWorkflowData } from "@/lib/admin-data-utils"
import { ThemeToggle } from "@/components/ui/theme-toggle"
import { TCM_PULSE_OPTIONS } from "@/lib/tcm-pulse"
import { OLFACTORY_PROTOCOL_QUESTION_SET, SCENT_LABELS } from "@/lib/olfactory/config"
import { parseOlfactoryProtocolVersion } from "@/lib/olfactory/protocol"
import type { OlfactoryProtocolVersion } from "@/lib/olfactory/types"

interface User {
  id: string
  phone_number: string
  name?: string | null
  chinese_name?: string | null
  national_id?: string | null
  gender?: string | null
  date_of_birth?: string | null
  city?: string | null
  province?: string | null
  created_at: string
}

type ReportLanguage = "en" | "zh-CN" | "zh-HK" | "fr"

type ReportStatus =
  | "incomplete"
  | "pending_tcm_review"
  | "tcm_reviewed"
  | "pending_final_approval"
  | "approved"
  | "published_to_patient"

type TCMReviewStatus = "draft" | "reviewed"

type ReportLabels = {
  reportTitle: string
  patientInfo: string
  cognitive: string
  sensory: string
  tcm: string
  finalPlan: string
  doctorInputs: string
  treatmentPlan: string
  diagnosis: string
  finalSummary: string
  reportDate: string
  name: string
  idNumber: string
  sex: string
  dateOfBirth: string
  cityProvince: string
  hospital: string
  eegNote: string
  mmseDesignScores: string
  unknown: string
}

const REPORT_LABELS: Record<ReportLanguage, ReportLabels> = {
  en: {
    reportTitle: "Integrated Medical Report",
    patientInfo: "Section 1: Patient Information",
    cognitive: "Section 2: Cognitive Assessment",
    sensory: "Section 3: Sensory Assessment",
    tcm: "Section 4: TCM Assessment",
    finalPlan: "Section 5: Final Recommendation",
    doctorInputs: "Doctor Inputs",
    treatmentPlan: "Treatment Plan",
    diagnosis: "TCM Diagnosis",
    finalSummary: "Final Clinical Summary",
    reportDate: "Report Date",
    name: "Name",
    idNumber: "National ID",
    sex: "Sex",
    dateOfBirth: "Date of Birth",
    cityProvince: "City/Province",
    hospital: "Hospital",
    eegNote: "EEG report is still in process",
    mmseDesignScores: "MMSE Reconstruction Design Scores",
    unknown: "Not provided",
  },
  "zh-CN": {
    reportTitle: "综合医学报告",
    patientInfo: "第一部分：患者信息",
    cognitive: "第二部分：认知评估",
    sensory: "第三部分：感觉评估",
    tcm: "第四部分：中医评估",
    finalPlan: "第五部分：最终建议",
    doctorInputs: "医生补充",
    treatmentPlan: "治疗方案",
    diagnosis: "中医诊断",
    finalSummary: "临床总结",
    reportDate: "报告日期",
    name: "姓名",
    idNumber: "身份证号",
    sex: "性别",
    dateOfBirth: "出生日期",
    cityProvince: "城市/省份",
    hospital: "医院",
    eegNote: "脑电图报告仍在处理中",
    mmseDesignScores: "MMSE重建设计分项",
    unknown: "未提供",
  },
  "zh-HK": {
    reportTitle: "綜合醫療報告",
    patientInfo: "第一部分：病人資料",
    cognitive: "第二部分：認知評估",
    sensory: "第三部分：感官評估",
    tcm: "第四部分：中醫評估",
    finalPlan: "第五部分：最終建議",
    doctorInputs: "醫生補充",
    treatmentPlan: "治療方案",
    diagnosis: "中醫診斷",
    finalSummary: "臨床總結",
    reportDate: "報告日期",
    name: "姓名",
    idNumber: "身份證號",
    sex: "性別",
    dateOfBirth: "出生日期",
    cityProvince: "城市/省份",
    hospital: "醫院",
    eegNote: "腦電圖報告仍在處理中",
    mmseDesignScores: "MMSE重建設計分項",
    unknown: "未提供",
  },
  fr: {
    reportTitle: "Rapport medical integre",
    patientInfo: "Section 1: Informations patient",
    cognitive: "Section 2: Evaluation cognitive",
    sensory: "Section 3: Evaluation sensorielle",
    tcm: "Section 4: Evaluation MTC",
    finalPlan: "Section 5: Recommandation finale",
    doctorInputs: "Saisie medecin",
    treatmentPlan: "Plan therapeutique",
    diagnosis: "Diagnostic MTC",
    finalSummary: "Synthese clinique finale",
    reportDate: "Date du rapport",
    name: "Nom",
    idNumber: "Identifiant national",
    sex: "Sexe",
    dateOfBirth: "Date de naissance",
    cityProvince: "Ville/Province",
    hospital: "Hopital",
    eegNote: "Le rapport EEG est encore en cours",
    mmseDesignScores: "Scores de reconstruction MMSE",
    unknown: "Non renseigne",
  },
}

export interface Assessment {
  id: string
  user_id: string
  assessment_type: "MOCA" | "MMSE"
  total_score: number
  section_scores: Record<string, number>
  scoring_version?: string
  scoring_framework?: string
  max_score?: number
  legacy_score?: number
  legacy_max_score?: number
  score_percent?: number
  reconstruction_applied?: boolean
  recalculated_at?: string
  orientation_audit?: {
    location?: {
      source?: string
      confirmed?: boolean
      sitePresetUsed?: boolean
      testedSite?: string
      geocodeProvider?: string | null
      coordinates?: {
        latitude?: number
        longitude?: number
        accuracyMeters?: number
      } | null
      suggestedPlace?: {
        country?: string
        president?: string
        sea?: string
        province?: string
        city?: string
        building?: string
        place?: string
        room?: string
      }
    }
  }
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
  balanced_score?: number | null
  qi_deficiency_score?: number | null
  yang_deficiency_score?: number | null
  yin_deficiency_score?: number | null
  phlegm_dampness_score?: number | null
  damp_heat_score?: number | null
  blood_stasis_score?: number | null
  qi_stagnation_score?: number | null
  special_constitution_score?: number | null
  recommendations?: string[] | null
  answers?: {
    pulse_assessment?: {
      selectedPulseIds?: string[]
      severity?: number
      clinicalPulseScore?: number
      notes?: string
    }
    questionnaire?: Record<string, number>
    tongue_image_url?: string | null
    face_image_url?: string | null
    uploaded_image_ids?: string[]
  }
}

interface TCMDoctorReview {
  id: string
  user_id: string
  doctor_id?: string | null
  tcm_constitution?: string | null
  tongue_observation?: string | null
  face_observation?: string | null
  questionnaire_interpretation?: string | null
  tcm_diagnosis?: string | null
  therapy_plan?: string | null
  dietary_advice?: string | null
  follow_up_recommendation?: string | null
  doctor_name?: string | null
  review_date?: string | null
  review_status: TCMReviewStatus
  reviewed_at?: string | null
  created_at?: string
  updated_at?: string
}

interface MedicalReport {
  id: string
  user_id: string
  language: ReportLanguage
  report_status: ReportStatus
  cognitive_summary?: string | null
  sensory_summary?: string | null
  tcm_summary?: string | null
  final_diagnostic_analysis?: string | null
  treatment_recommendation?: string | null
  doctor_approved_by?: string | null
  approved_at?: string | null
  published_to_patient_at?: string | null
  created_at?: string
  updated_at?: string
}

function clampCognitiveScore(score: number | null | undefined) {
  const numericScore = typeof score === "number" && Number.isFinite(score) ? score : 0
  return Math.min(30, Math.max(0, numericScore))
}

export function AdminPanel() {
  const { t, localizeText } = useLanguage()
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [users, setUsers] = useState<User[]>([])
  const [assessments, setAssessments] = useState<Assessment[]>([])
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([])
  const [userProgress, setUserProgress] = useState<UserProgress[]>([])
  const [sensoryAssessments, setSensoryAssessments] = useState<SensoryAssessment[]>([])
  const [tcmAssessments, setTcmAssessments] = useState<TCMAssessment[]>([])
  const [doctorReviews, setDoctorReviews] = useState<TCMDoctorReview[]>([])
  const [medicalReports, setMedicalReports] = useState<MedicalReport[]>([])
  const [selectedUser, setSelectedUser] = useState<string | null>(null)
  const [viewingFiles, setViewingFiles] = useState(false)
  const [viewingProgressTracker, setViewingProgressTracker] = useState(false)

  // Add new state variables for chart filtering
  const [selectedTrendUser, setSelectedTrendUser] = useState<string | null>(null)
  const [selectedTrendAssessmentType, setSelectedTrendAssessmentType] = useState<"MOCA" | "MMSE" | "ALL">("ALL")
  const [activeOlfactoryProtocol, setActiveOlfactoryProtocol] = useState<OlfactoryProtocolVersion>("sat_v3_14")
  const [reportLanguage, setReportLanguage] = useState<ReportLanguage>("en")
  const [tcmDiagnosisInput, setTcmDiagnosisInput] = useState("")
  const [tcmTherapyPlanInput, setTcmTherapyPlanInput] = useState("")
  const [finalSummaryInput, setFinalSummaryInput] = useState("")
  const [tcmConstitutionInput, setTcmConstitutionInput] = useState("")
  const [tongueObservationInput, setTongueObservationInput] = useState("")
  const [faceObservationInput, setFaceObservationInput] = useState("")
  const [questionnaireInterpretationInput, setQuestionnaireInterpretationInput] = useState("")
  const [dietaryAdviceInput, setDietaryAdviceInput] = useState("")
  const [followUpRecommendationInput, setFollowUpRecommendationInput] = useState("")
  const [doctorNameInput, setDoctorNameInput] = useState("")
  const [reviewDateInput, setReviewDateInput] = useState("")
  const [workflowMessage, setWorkflowMessage] = useState("")
  const [generatedReport, setGeneratedReport] = useState("")
  const [generatedAllReports, setGeneratedAllReports] = useState("")
  const [patientSearch, setPatientSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<"all" | ReportStatus>("all")
  const [riskFilter, setRiskFilter] = useState<"all" | "high" | "moderate" | "low">("all")
  const [tcmImageFilter, setTcmImageFilter] = useState<"all" | "complete" | "missing_tongue" | "missing_face" | "missing_questionnaire">("all")

  useEffect(() => {
    if (isAuthenticated) {
      loadData()
    }
  }, [isAuthenticated])

  useEffect(() => {
    setGeneratedReport("")
    setGeneratedAllReports("")
    setWorkflowMessage("")

    const existingReview = doctorReviews
      .filter((review) => review.user_id === selectedUser)
      .sort((a, b) => new Date(b.updated_at || b.created_at || 0).getTime() - new Date(a.updated_at || a.created_at || 0).getTime())[0]
    const existingReport = medicalReports.find((report) => report.user_id === selectedUser)

    setTcmConstitutionInput(existingReview?.tcm_constitution || "")
    setTongueObservationInput(existingReview?.tongue_observation || "")
    setFaceObservationInput(existingReview?.face_observation || "")
    setQuestionnaireInterpretationInput(existingReview?.questionnaire_interpretation || "")
    setTcmDiagnosisInput(existingReview?.tcm_diagnosis || "")
    setTcmTherapyPlanInput(existingReview?.therapy_plan || "")
    setDietaryAdviceInput(existingReview?.dietary_advice || "")
    setFollowUpRecommendationInput(existingReview?.follow_up_recommendation || "")
    setDoctorNameInput(existingReview?.doctor_name || "")
    setReviewDateInput(existingReview?.review_date || "")
    setFinalSummaryInput(existingReport?.final_diagnostic_analysis || "")
  }, [selectedUser, doctorReviews, medicalReports])

  const handleLogin = async () => {
    // Simple authentication - in production, use proper authentication
    if (username === "admin" && password === "admin123") {
      setIsAuthenticated(true)
    } else {
      alert(
        localizeText("Invalid credentials", {
          zh: "凭据无效",
          yue: "憑證無效",
          fr: "Identifiants invalides",
        }),
      )
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
      const { data: reviewData, error: reviewError } = await supabase
        .from("tcm_doctor_reviews")
        .select("*")
        .order("updated_at", { ascending: false })
      const { data: reportData, error: reportError } = await supabase
        .from("medical_reports")
        .select("*")
        .order("updated_at", { ascending: false })

      const mappedAssessments = (assessmentsData || []).map((assessment) => {
        const sourceData = assessment.data && typeof assessment.data === "object" ? assessment.data : {}
        const parsedScorePercent =
          typeof assessment.score_percent === "number" && Number.isFinite(assessment.score_percent)
            ? assessment.score_percent
            : typeof sourceData.score_percent === "number" && Number.isFinite(sourceData.score_percent)
              ? sourceData.score_percent
              : undefined
        const parsedLegacyScore =
          typeof assessment.score_legacy === "number" && Number.isFinite(assessment.score_legacy)
            ? assessment.score_legacy
            : typeof sourceData.legacy_mmse_score === "number" && Number.isFinite(sourceData.legacy_mmse_score)
              ? sourceData.legacy_mmse_score
              : undefined
        const parsedLegacyMaxScore =
          typeof sourceData.legacy_mmse_max_score === "number" && Number.isFinite(sourceData.legacy_mmse_max_score)
            ? sourceData.legacy_mmse_max_score
            : assessment.type === "MMSE"
              ? 22
              : undefined
        const sectionScores = Object.fromEntries(
          Object.entries(sourceData).filter(([, value]) => typeof value === "number" && Number.isFinite(value)),
        ) as Record<string, number>
        const sectionMetadata =
          sourceData.section_metadata && typeof sourceData.section_metadata === "object"
            ? (sourceData.section_metadata as Record<string, unknown>)
            : {}
        const orientationAudit =
          sectionMetadata.orientation && typeof sectionMetadata.orientation === "object"
            ? (sectionMetadata.orientation as Assessment["orientation_audit"])
            : undefined

        return {
          id: assessment.id,
          user_id: assessment.user_id,
          assessment_type: assessment.type as "MOCA" | "MMSE",
          total_score: clampCognitiveScore(assessment.score),
          section_scores: sectionScores,
          scoring_version: assessment.scoring_version || assessment.data?.scoring_version,
          scoring_framework: assessment.scoring_framework,
          max_score: assessment.max_score || assessment.data?.max_score,
          legacy_score: parsedLegacyScore,
          legacy_max_score: parsedLegacyMaxScore,
          score_percent: parsedScorePercent,
          reconstruction_applied: Boolean(assessment.reconstruction_applied),
          recalculated_at: assessment.recalculated_at,
          orientation_audit: orientationAudit,
          completed_at: assessment.completed_at,
          laboratory_analysis: assessment.data?.laboratory_analysis,
        }
      })

      setUsers(usersData || [])
      setAssessments(mappedAssessments)
      setUploadedFiles(filesData || [])
      setUserProgress(progressData || [])
      setSensoryAssessments((sensoryData || []) as SensoryAssessment[])
      setTcmAssessments((tcmData || []) as TCMAssessment[])
      if (!reviewError) {
        setDoctorReviews((reviewData || []) as TCMDoctorReview[])
      }
      if (!reportError) {
        setMedicalReports((reportData || []) as MedicalReport[])
      }

      const { data: runtimeData } = await supabase
        .from("olfactory_runtime_settings")
        .select("active_protocol")
        .limit(1)
        .single()
      if (runtimeData?.active_protocol) {
        setActiveOlfactoryProtocol(parseOlfactoryProtocolVersion(runtimeData.active_protocol))
      }
    } catch (error) {
      console.error("Error loading data:", error)
    }
  }

  const exportData = () => {
    const csvData = assessments.map((assessment) => {
      const user = users.find((u) => u.id === assessment.user_id)
      return {
        phone_number: user?.phone_number || "",
        assessment_type: assessment.assessment_type,
        total_score: assessment.total_score,
        legacy_score:
          assessment.assessment_type === "MMSE"
            ? typeof assessment.legacy_score === "number"
              ? assessment.legacy_score
              : ""
            : "",
        reconstructed_score:
          assessment.assessment_type === "MMSE"
            ? assessment.total_score
            : "",
        score_version: assessment.scoring_version || "",
        section_scores: JSON.stringify(assessment.section_scores),
        completed_at: assessment.completed_at,
        laboratory_analysis: assessment.laboratory_analysis || "",
      }
    })

    const csv = [
      [
        "Phone Number",
        "Assessment Type",
        "Total Score",
        "Legacy Score",
        "Reconstructed Score",
        "Score Version",
        "Section Scores",
        "Completed At",
        "Laboratory Analysis",
      ],
      ...csvData.map((row) => [
        row.phone_number,
        row.assessment_type,
        row.total_score.toString(),
        row.legacy_score.toString(),
        row.reconstructed_score.toString(),
        row.score_version,
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
                placeholder={
                  localizeText("Enter username", {
                    zh: "输入用户名",
                    yue: "輸入用戶名",
                    fr: "Saisir le nom d'utilisateur",
                  })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">{t("admin.password")}</Label>
              <AssessmentInput
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={
                  localizeText("Enter password", {
                    zh: "输入密码",
                    yue: "輸入密碼",
                    fr: "Saisir le mot de passe",
                  })
                }
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

  const getUserDoctorReview = (userId: string) => {
    return doctorReviews
      .filter((review) => review.user_id === userId)
      .sort((a, b) => new Date(b.updated_at || b.created_at || 0).getTime() - new Date(a.updated_at || a.created_at || 0).getTime())[0]
  }

  const getUserMedicalReport = (userId: string) => {
    return medicalReports.find((report) => report.user_id === userId)
  }

  const getUserImageFiles = (userId: string, imageKind: "tongue" | "face") => {
    return getUserFiles(userId).filter(
      (file) => file.file_type.startsWith("image/") && new RegExp(imageKind, "i").test(file.filename),
    )
  }

  const getLatestTcmAssessment = (userId: string) => {
    return getUserTcmAssessments(userId)
      .sort((a, b) => new Date(b.completed_at || 0).getTime() - new Date(a.completed_at || 0).getTime())[0]
  }

  // Get image URLs from the TCM assessment record (most reliable source, as URLs are stored directly)
  const getTcmAssessmentImageUrl = (userId: string, imageKind: "tongue" | "face"): string | null => {
    const latest = getLatestTcmAssessment(userId)
    if (!latest?.answers) return null
    return imageKind === "tongue"
      ? (latest.answers.tongue_image_url ?? null)
      : (latest.answers.face_image_url ?? null)
  }

  const getTcmImageState = (userId: string) => {
    const files = getUserFiles(userId)
    const latest = getLatestTcmAssessment(userId)
    // Check both uploaded_files names AND tcm_assessments.answers image URLs
    const hasTongueImage =
      files.some((file) => /tongue/i.test(file.filename)) ||
      !!(latest?.answers?.tongue_image_url)
    const hasFaceImage =
      files.some((file) => /face/i.test(file.filename)) ||
      !!(latest?.answers?.face_image_url)
    const hasQuestionnaire = getUserTcmAssessments(userId).length > 0

    if (!hasTongueImage) return { key: "missing_tongue" as const, label: "Missing tongue" }
    if (!hasFaceImage) return { key: "missing_face" as const, label: "Missing face" }
    if (!hasQuestionnaire) return { key: "missing_questionnaire" as const, label: "Missing questionnaire" }
    return { key: "complete" as const, label: "Complete" }
  }

  const getUserLatestCognitiveRisk = (userId: string) => {
    const userAssessments = getUserAssessments(userId)
    const latestMoca = userAssessments
      .filter((assessment) => assessment.assessment_type === "MOCA")
      .sort((a, b) => new Date(b.completed_at).getTime() - new Date(a.completed_at).getTime())[0]
    const latestMmse = userAssessments
      .filter((assessment) => assessment.assessment_type === "MMSE")
      .sort((a, b) => new Date(b.completed_at).getTime() - new Date(a.completed_at).getTime())[0]

    const mocaRisk = latestMoca && latestMoca.total_score <= 25
    const mmseRisk = latestMmse && latestMmse.total_score <= 24
    const riskFlags = [mocaRisk, mmseRisk].filter(Boolean).length

    if (riskFlags >= 2) return { key: "high" as const, label: "High risk" }
    if (riskFlags === 1) return { key: "moderate" as const, label: "Moderate risk" }
    return { key: "low" as const, label: "Low risk" }
  }

  const getWorkflowStatusForUser = (userId: string): ReportStatus => {
    const report = getUserMedicalReport(userId)
    if (report?.report_status) return report.report_status

    const review = getUserDoctorReview(userId)
    const tcmImageState = getTcmImageState(userId)
    if (tcmImageState.key !== "complete") return "incomplete"
    if (!review) return "pending_tcm_review"
    if (review.review_status === "reviewed") return "pending_final_approval"
    return "pending_tcm_review"
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

  const formatCoordinate = (value?: number) => {
    return typeof value === "number" && Number.isFinite(value) ? value.toFixed(6) : "-"
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
        recall: t("mmse.recall"),
        naming: t("mmse.naming"),
        repetition: t("mmse.repetition"),
        three_stage_command: t("mmse.three_stage_command"),
        reading_command: t("mmse.reading_command"),
        writing: t("mmse.writing"),
        copying: t("mmse.copying"),
      }
    }
  }

  const averageScores = getAverageScores()

  const MMSE_RECONSTRUCTION_KEYS: Array<keyof Assessment["section_scores"]> = [
    "orientation",
    "registration",
    "attention",
    "recall",
    "naming",
    "repetition",
    "three_stage_command",
    "reading_command",
    "writing",
    "copying",
  ]

  const formatMmseReconstructionScores = (assessment?: Assessment) => {
    if (!assessment) return []
    const labels = getSectionNames("MMSE")
    return MMSE_RECONSTRUCTION_KEYS.map((key) => {
      const label = labels[key as keyof typeof labels] || key
      const score = assessment.section_scores?.[key]
      return `- ${label}: ${typeof score === "number" ? score : 0}`
    })
  }

  const getUserDisplayName = (user?: User) => {
    if (!user) return "-"
    return user.chinese_name || user.name || user.phone_number || user.id
  }

  const buildMedicalReport = (userId: string, language: ReportLanguage) => {
    const labels = REPORT_LABELS[language]
    const user = users.find((entry) => entry.id === userId)
    const userAssessments = getUserAssessments(userId)
    const userSensory = getUserSensoryAssessments(userId)
    const userTcm = getUserTcmAssessments(userId)

    const latestMoca = userAssessments
      .filter((assessment) => assessment.assessment_type === "MOCA")
      .sort((a, b) => new Date(b.completed_at).getTime() - new Date(a.completed_at).getTime())[0]
    const latestMmse = userAssessments
      .filter((assessment) => assessment.assessment_type === "MMSE")
      .sort((a, b) => new Date(b.completed_at).getTime() - new Date(a.completed_at).getTime())[0]
    const latestOlfactory = userSensory
      .filter((assessment) => assessment.test_type === "olfactory")
      .sort((a, b) => new Date(b.test_date || 0).getTime() - new Date(a.test_date || 0).getTime())[0]
    const latestAuditory = userSensory
      .filter((assessment) => assessment.test_type === "auditory")
      .sort((a, b) => new Date(b.test_date || 0).getTime() - new Date(a.test_date || 0).getTime())[0]
    const latestVisual = userSensory
      .filter((assessment) => assessment.test_type === "visual")
      .sort((a, b) => new Date(b.test_date || 0).getTime() - new Date(a.test_date || 0).getTime())[0]
    const latestTcm = userTcm
      .sort((a, b) => new Date(b.completed_at || 0).getTime() - new Date(a.completed_at || 0).getTime())[0]

    const mocaRisk = latestMoca && latestMoca.total_score <= 25
    const mmseRisk = latestMmse && latestMmse.total_score <= 24
    const olfactoryRisk = latestOlfactory?.classification?.toLowerCase().includes("severe")
    const riskFlagCount = [mocaRisk, mmseRisk, olfactoryRisk].filter(Boolean).length
    const finalRisk = riskFlagCount >= 2 ? "HIGH" : riskFlagCount === 1 ? "MODERATE" : "LOW"

    return [
      labels.reportTitle,
      `${labels.reportDate}: ${new Date().toLocaleDateString()}`,
      "",
      labels.patientInfo,
      `${labels.name}: ${getUserDisplayName(user)}`,
      `${labels.idNumber}: ${user?.national_id || labels.unknown}`,
      `${labels.sex}: ${user?.gender || labels.unknown}`,
      `${labels.dateOfBirth}: ${user?.date_of_birth || labels.unknown}`,
      `${labels.cityProvince}: guangzhou / guangdong`,
      `${labels.hospital}: 南方医科大学中西结合医院`,
      "",
      labels.cognitive,
      `MMSE: ${latestMmse ? `${latestMmse.total_score}/30` : labels.unknown}`,
      `MoCA: ${latestMoca ? `${latestMoca.total_score}/30` : labels.unknown}`,
      labels.mmseDesignScores,
      ...formatMmseReconstructionScores(latestMmse),
      "",
      labels.sensory,
      `Olfactory: ${latestOlfactory ? `${latestOlfactory.raw_score ?? "-"} (${latestOlfactory.classification || "-"})` : labels.unknown}`,
      `Auditory: ${latestAuditory ? `${latestAuditory.normalized_score ?? "-"} (${latestAuditory.classification || "-"})` : labels.unknown}`,
      `Visual: ${latestVisual ? `${latestVisual.normalized_score ?? "-"} (${latestVisual.classification || "-"})` : labels.unknown}`,
      "",
      labels.tcm,
      `Primary Constitution: ${latestTcm?.primary_constitution || labels.unknown}`,
      `TCM Score: ${latestTcm?.overall_score ?? labels.unknown}`,
      `TCM Constitution (doctor): ${tcmConstitutionInput || labels.unknown}`,
      `Tongue Observation: ${tongueObservationInput || labels.unknown}`,
      `Face Observation: ${faceObservationInput || labels.unknown}`,
      `Questionnaire Interpretation: ${questionnaireInterpretationInput || labels.unknown}`,
      `${labels.diagnosis}: ${tcmDiagnosisInput || labels.unknown}`,
      `${labels.treatmentPlan}: ${tcmTherapyPlanInput || labels.unknown}`,
      `Dietary Advice: ${dietaryAdviceInput || labels.unknown}`,
      `Follow-up Recommendation: ${followUpRecommendationInput || labels.unknown}`,
      `Doctor Name: ${doctorNameInput || labels.unknown}`,
      `Review Date: ${reviewDateInput || labels.unknown}`,
      "",
      labels.finalPlan,
      `Risk Tier: ${finalRisk}`,
      `${labels.finalSummary}: ${finalSummaryInput || labels.unknown}`,
      `${labels.eegNote}.`,
      "",
      `-- ${labels.doctorInputs} --`,
    ].join("\n")
  }

  const handleGenerateReport = () => {
    if (!selectedUser) return
    const reportText = buildMedicalReport(selectedUser, reportLanguage)
    setGeneratedReport(reportText)
  }

  const handleDownloadReport = () => {
    if (!selectedUser || !generatedReport) return
    const user = users.find((entry) => entry.id === selectedUser)
    const filePrefix = getUserDisplayName(user).replace(/\s+/g, "_")
    const blob = new Blob([generatedReport], { type: "text/markdown" })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement("a")
    anchor.href = url
    anchor.download = `MA_${filePrefix}_${reportLanguage}_report.md`
    anchor.click()
    URL.revokeObjectURL(url)
  }

  const handlePrintReport = () => {
    if (!generatedReport) return
    const printWindow = window.open("", "_blank", "noopener,noreferrer,width=900,height=700")
    if (!printWindow) return
    printWindow.document.write(`<pre style="font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; white-space: pre-wrap; padding: 24px; line-height: 1.6;">${generatedReport.replace(/</g, "&lt;")}</pre>`)
    printWindow.document.close()
    printWindow.focus()
    printWindow.print()
  }

  const buildAllMedicalReports = (language: ReportLanguage) => {
    const sections = users.map((user, index) => {
      const report = buildMedicalReport(user.id, language)
      return [`===== Patient ${index + 1} / ${users.length} =====`, report].join("\n")
    })
    return sections.join("\n\n")
  }

  const handleGenerateAllReports = () => {
    const compiledReports = buildAllMedicalReports(reportLanguage)
    setGeneratedAllReports(compiledReports)
  }

  const handleDownloadAllReports = () => {
    if (!generatedAllReports) return
    const blob = new Blob([generatedAllReports], { type: "text/markdown" })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement("a")
    anchor.href = url
    anchor.download = `MA_all_patients_${reportLanguage}_reports.md`
    anchor.click()
    URL.revokeObjectURL(url)
  }

  const handlePrintAllReports = () => {
    if (!generatedAllReports) return
    const printWindow = window.open("", "_blank", "noopener,noreferrer,width=1000,height=800")
    if (!printWindow) return
    printWindow.document.write(`<pre style="font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; white-space: pre-wrap; padding: 24px; line-height: 1.6;">${generatedAllReports.replace(/</g, "&lt;")}</pre>`)
    printWindow.document.close()
    printWindow.focus()
    printWindow.print()
  }

  const saveDoctorReview = async (reviewStatus: TCMReviewStatus) => {
    if (!selectedUser) return
    try {
      const existingReview = getUserDoctorReview(selectedUser)
      const payload = {
        user_id: selectedUser,
        tcm_constitution: tcmConstitutionInput || null,
        tongue_observation: tongueObservationInput || null,
        face_observation: faceObservationInput || null,
        questionnaire_interpretation: questionnaireInterpretationInput || null,
        tcm_diagnosis: tcmDiagnosisInput || null,
        therapy_plan: tcmTherapyPlanInput || null,
        dietary_advice: dietaryAdviceInput || null,
        follow_up_recommendation: followUpRecommendationInput || null,
        doctor_name: doctorNameInput || null,
        review_date: reviewDateInput || null,
        review_status: reviewStatus,
        reviewed_at: reviewStatus === "reviewed" ? new Date().toISOString() : null,
      }

      let savedRecord: TCMDoctorReview | null = null
      if (existingReview?.id) {
        const { data, error } = await supabase
          .from("tcm_doctor_reviews")
          .update(payload)
          .eq("id", existingReview.id)
          .select("*")
          .single()
        if (error) throw error
        savedRecord = data as TCMDoctorReview
      } else {
        const { data, error } = await supabase.from("tcm_doctor_reviews").insert(payload).select("*").single()
        if (error) throw error
        savedRecord = data as TCMDoctorReview
      }

      if (savedRecord) {
        setDoctorReviews((prev) => [savedRecord as TCMDoctorReview, ...prev.filter((review) => review.id !== savedRecord!.id)])
      }

      const existingReport = getUserMedicalReport(selectedUser)
      const autoStatus: ReportStatus = reviewStatus === "reviewed" ? "tcm_reviewed" : "pending_tcm_review"
      if (existingReport?.id) {
        const { data: syncedReport, error: syncError } = await supabase
          .from("medical_reports")
          .update({ report_status: autoStatus, language: reportLanguage })
          .eq("id", existingReport.id)
          .select("*")
          .single()
        if (!syncError && syncedReport) {
          setMedicalReports((prev) => [syncedReport as MedicalReport, ...prev.filter((report) => report.id !== syncedReport.id)])
        }
      } else {
        const { data: insertedReport, error: insertReportError } = await supabase
          .from("medical_reports")
          .insert({ user_id: selectedUser, report_status: autoStatus, language: reportLanguage })
          .select("*")
          .single()
        if (!insertReportError && insertedReport) {
          setMedicalReports((prev) => [insertedReport as MedicalReport, ...prev.filter((report) => report.id !== insertedReport.id)])
        }
      }

      setWorkflowMessage(reviewStatus === "reviewed" ? "TCM review marked as reviewed." : "TCM review draft saved.")
    } catch (error) {
      console.error("Failed to save TCM doctor review:", error)
      setWorkflowMessage("Could not save review. Ensure table tcm_doctor_reviews exists.")
    }
  }

  const updateReportStatus = async (nextStatus: ReportStatus) => {
    if (!selectedUser) return
    try {
      const existingReport = getUserMedicalReport(selectedUser)
      const payload = {
        user_id: selectedUser,
        language: reportLanguage,
        report_status: nextStatus,
        final_diagnostic_analysis: finalSummaryInput || null,
        treatment_recommendation: tcmTherapyPlanInput || null,
        approved_at: nextStatus === "approved" || nextStatus === "published_to_patient" ? new Date().toISOString() : null,
        published_to_patient_at: nextStatus === "published_to_patient" ? new Date().toISOString() : null,
      }

      let savedRecord: MedicalReport | null = null
      if (existingReport?.id) {
        const { data, error } = await supabase
          .from("medical_reports")
          .update(payload)
          .eq("id", existingReport.id)
          .select("*")
          .single()
        if (error) throw error
        savedRecord = data as MedicalReport
      } else {
        const { data, error } = await supabase.from("medical_reports").insert(payload).select("*").single()
        if (error) throw error
        savedRecord = data as MedicalReport
      }

      if (savedRecord) {
        setMedicalReports((prev) => [savedRecord as MedicalReport, ...prev.filter((report) => report.id !== savedRecord!.id)])
      }
      setWorkflowMessage(`Report status updated to ${nextStatus}.`)
    } catch (error) {
      console.error("Failed to update report status:", error)
      setWorkflowMessage("Could not update report status. Ensure table medical_reports exists.")
    }
  }

  const currentSelectedReportStatus = selectedUser ? getWorkflowStatusForUser(selectedUser) : "incomplete"
  const canPublishToPatient =
    currentSelectedReportStatus === "approved" || currentSelectedReportStatus === "published_to_patient"

  const filteredUsers = users.filter((user) => {
    const query = patientSearch.trim().toLowerCase()
    const identityBlob = `${user.phone_number || ""} ${user.name || ""} ${user.national_id || ""}`.toLowerCase()
    if (query && !identityBlob.includes(query)) return false

    const workflowStatus = getWorkflowStatusForUser(user.id)
    if (statusFilter !== "all" && workflowStatus !== statusFilter) return false

    const risk = getUserLatestCognitiveRisk(user.id)
    if (riskFilter !== "all" && risk.key !== riskFilter) return false

    const imageState = getTcmImageState(user.id)
    if (tcmImageFilter !== "all" && imageState.key !== tcmImageFilter) return false

    return true
  })

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
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-6 gap-6 mb-8">
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
                <BarChart3 className="w-8 h-8 text-indigo-600" />
                <div>
                  <p className="text-2xl font-bold">{averageScores.mmse.toFixed(1)}</p>
                  <p className="text-sm text-gray-600">Avg MMSE Score</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <Eye className="w-8 h-8 text-amber-600" />
                <div>
                  <p className="text-2xl font-bold">{sensoryAssessments.length}</p>
                  <p className="text-sm text-gray-600">Sensory Screenings</p>
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

        <Card className="mb-8 border-cyan-200 bg-[linear-gradient(135deg,rgba(236,254,255,0.98),rgba(255,255,255,0.98),rgba(239,246,255,0.92))]">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              {localizeText("Olfactory Examiner Key", {
                zh: "嗅觉评估员参考键",
                yue: "嗅覺評估員參考鍵",
                fr: "Cle examinateur olfactif",
              })}
              <Badge className="bg-cyan-600 text-white hover:bg-cyan-600 text-xs font-normal">
                {localizeText("Active", {
                  zh: "当前",
                  yue: "當前",
                  fr: "Actif",
                })}
                : {activeOlfactoryProtocol === "sat_v3_14" ? "14-item" : activeOlfactoryProtocol === "sat_v2" ? "12-item" : "8-item"} ({activeOlfactoryProtocol})
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-slate-600">
              {localizeText("This key is only for examiners. Scents are shown in the order they are presented to the patient. Patients should not be shown the correct mapping.", {
                zh: "此参考键仅供评估员使用。气味按向患者呈现的顺序显示。请勿向患者显示正确对应关系。",
                yue: "呢個參考鍵只供評估員使用。氣味會按向患者呈現嘅次序顯示。請勿向患者顯示正確對應。",
                fr: "Cette cle est reservee aux examinateurs. Les odeurs sont affichees dans l'ordre de presentation au patient. Ne montrez pas la correspondance correcte au patient.",
              })}
            </p>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {OLFACTORY_PROTOCOL_QUESTION_SET[activeOlfactoryProtocol].map((question) => (
                <div key={question.id} className="rounded-xl border border-cyan-200 bg-white/90 p-3">
                  <div className="flex items-center justify-between gap-2">
                    <Badge className="bg-cyan-600 text-white hover:bg-cyan-600">{question.questionCode}</Badge>
                    <span className="text-sm font-semibold text-slate-700">{SCENT_LABELS[question.correctAnswer].en}</span>
                  </div>
                  <p className="mt-2 text-xs text-slate-500">{localizeText("Correct", { zh: "正确", yue: "正確", fr: "Correct" })}: {SCENT_LABELS[question.correctAnswer].zh}</p>
                  <p className="mt-1 text-xs text-slate-500">{localizeText("Code description", { zh: "编码说明", yue: "編碼說明", fr: "Description du code" })}: {question.codeDescription.en}</p>
                  <p className="mt-1 text-xs text-slate-500">{localizeText("Options", { zh: "选项", yue: "選項", fr: "Options" })}: {question.options.map((option) => SCENT_LABELS[option.key].en).join(", ")}</p>
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
              <CardTitle>Patient Report Review Dashboard</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 md:grid-cols-2 mb-4">
                <AssessmentInput
                  placeholder="Search by phone, name, or national ID"
                  value={patientSearch}
                  onChange={(event) => setPatientSearch(event.target.value)}
                />
                <div className="grid grid-cols-3 gap-2">
                  <select
                    value={statusFilter}
                    onChange={(event) => setStatusFilter(event.target.value as "all" | ReportStatus)}
                    className="h-10 rounded-md border border-slate-200 bg-white px-2 text-xs outline-none focus:ring-2 focus:ring-blue-300"
                  >
                    <option value="all">All status</option>
                    <option value="incomplete">incomplete</option>
                    <option value="pending_tcm_review">pending_tcm_review</option>
                    <option value="tcm_reviewed">tcm_reviewed</option>
                    <option value="pending_final_approval">pending_final_approval</option>
                    <option value="approved">approved</option>
                    <option value="published_to_patient">published_to_patient</option>
                  </select>
                  <select
                    value={riskFilter}
                    onChange={(event) => setRiskFilter(event.target.value as "all" | "high" | "moderate" | "low")}
                    className="h-10 rounded-md border border-slate-200 bg-white px-2 text-xs outline-none focus:ring-2 focus:ring-blue-300"
                  >
                    <option value="all">All risk</option>
                    <option value="high">High risk</option>
                    <option value="moderate">Moderate risk</option>
                    <option value="low">Low risk</option>
                  </select>
                  <select
                    value={tcmImageFilter}
                    onChange={(event) =>
                      setTcmImageFilter(
                        event.target.value as "all" | "complete" | "missing_tongue" | "missing_face" | "missing_questionnaire",
                      )
                    }
                    className="h-10 rounded-md border border-slate-200 bg-white px-2 text-xs outline-none focus:ring-2 focus:ring-blue-300"
                  >
                    <option value="all">All TCM files</option>
                    <option value="complete">Complete</option>
                    <option value="missing_tongue">Missing tongue</option>
                    <option value="missing_face">Missing face</option>
                    <option value="missing_questionnaire">Missing questionnaire</option>
                  </select>
                </div>
              </div>

              <div className="mb-4 overflow-auto rounded-lg border border-slate-200">
                <table className="min-w-full text-sm">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-3 py-2 text-left font-semibold">Patient</th>
                      <th className="px-3 py-2 text-left font-semibold">Cognitive Status</th>
                      <th className="px-3 py-2 text-left font-semibold">TCM Images</th>
                      <th className="px-3 py-2 text-left font-semibold">Report Status</th>
                      <th className="px-3 py-2 text-left font-semibold">Download</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map((user) => {
                      const risk = getUserLatestCognitiveRisk(user.id)
                      const tcmImageState = getTcmImageState(user.id)
                      const workflowStatus = getWorkflowStatusForUser(user.id)
                      return (
                        <tr
                          key={`row-${user.id}`}
                          className={`cursor-pointer border-t ${selectedUser === user.id ? "bg-blue-50" : "hover:bg-slate-50"}`}
                          onClick={() => setSelectedUser(user.id)}
                        >
                          <td className="px-3 py-2">
                            <p className="font-medium">{user.name || user.phone_number}</p>
                            <p className="text-xs text-slate-500">{user.phone_number}</p>
                          </td>
                          <td className="px-3 py-2">{risk.label}</td>
                          <td className="px-3 py-2">{tcmImageState.label}</td>
                          <td className="px-3 py-2">
                            <Badge variant="outline">{workflowStatus}</Badge>
                          </td>
                          <td className="px-3 py-2">{workflowStatus === "published_to_patient" ? "Available" : "Locked"}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              <div className="space-y-4 max-h-96 overflow-y-auto">
                {filteredUsers.map((user) => {
                  const userAssessments = getUserAssessments(user.id)
                  const userFiles = getUserFiles(user.id)
                  const userCurrentProgress = getUserProgress(user.id)
                  const workflowStatus = getWorkflowStatusForUser(user.id)
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
                          <p className="font-medium">{user.name || user.phone_number}</p>
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
                          <Badge variant="outline">{workflowStatus}</Badge>
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
                            {assessment.assessment_type === "MMSE" && (
                              <Badge variant="outline" className="border-blue-200 bg-blue-50 text-blue-700">
                                {assessment.scoring_version || t("mmse.v2_badge")}
                              </Badge>
                            )}
                            <span className="text-sm text-gray-600">
                              {new Date(assessment.completed_at).toLocaleDateString()}
                            </span>
                          </div>

                          <div>
                            <p className="font-medium">
                              {t("admin.total_score")}: {assessment.total_score}/30
                            </p>
                            {assessment.assessment_type === "MMSE" && (
                              <div className="mt-2 rounded-lg border border-blue-200 bg-blue-50/70 p-3 text-sm text-slate-700">
                                <p className="font-semibold text-blue-900">
                                  {localizeText("MMSE Score Provenance", {
                                    zh: "MMSE 评分来源",
                                    yue: "MMSE 評分來源",
                                    fr: "Provenance du score MMSE",
                                  })}
                                </p>
                                <div className="mt-1 grid grid-cols-1 gap-1">
                                  <p>
                                    {localizeText("Reconstructed", {
                                      zh: "重建分数",
                                      yue: "重建分數",
                                      fr: "Score reconstruit",
                                    })}
                                    : <span className="font-semibold">{assessment.total_score}/30</span>
                                  </p>
                                  {typeof assessment.legacy_score === "number" && (
                                    <p>
                                      {localizeText("Legacy", {
                                        zh: "旧版分数",
                                        yue: "舊版分數",
                                        fr: "Score hérité",
                                      })}
                                      : <span className="font-semibold">{assessment.legacy_score}/{assessment.legacy_max_score || 22}</span>
                                    </p>
                                  )}
                                  <p>
                                    {localizeText("Version", {
                                      zh: "版本",
                                      yue: "版本",
                                      fr: "Version",
                                    })}
                                    : <span className="font-semibold">{assessment.scoring_version || "-"}</span>
                                  </p>
                                  {assessment.scoring_framework && (
                                    <p>
                                      {localizeText("Framework", {
                                        zh: "评分框架",
                                        yue: "評分框架",
                                        fr: "Cadre",
                                      })}
                                      : <span className="font-semibold">{assessment.scoring_framework}</span>
                                    </p>
                                  )}
                                  <p>
                                    {localizeText("Reconstruction Applied", {
                                      zh: "已应用重建",
                                      yue: "已套用重建",
                                      fr: "Reconstruction appliquée",
                                    })}
                                    : <span className="font-semibold">{assessment.reconstruction_applied ? localizeText("Yes", { zh: "是", yue: "是", fr: "Oui" }) : localizeText("No", { zh: "否", yue: "否", fr: "Non" })}</span>
                                  </p>
                                  {typeof assessment.score_percent === "number" && (
                                    <p>
                                      {localizeText("Normalized Percent", {
                                        zh: "标准化百分比",
                                        yue: "標準化百分比",
                                        fr: "Pourcentage normalisé",
                                      })}
                                      : <span className="font-semibold">{assessment.score_percent.toFixed(2)}%</span>
                                    </p>
                                  )}
                                  {assessment.recalculated_at && (
                                    <p>
                                      {localizeText("Recalculated At", {
                                        zh: "重算时间",
                                        yue: "重算時間",
                                        fr: "Recalculé le",
                                      })}
                                      : <span className="font-semibold">{new Date(assessment.recalculated_at).toLocaleString()}</span>
                                    </p>
                                  )}
                                </div>
                              </div>
                            )}
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

                            {assessment.assessment_type === "MMSE" && assessment.orientation_audit?.location && (
                              <div className="mt-3 rounded-lg border border-blue-200 bg-blue-50/70 p-3 text-sm text-slate-700">
                                <p className="font-medium text-blue-900">
                                  {localizeText("MMSE Orientation Location Audit", {
                                    zh: "MMSE 定向地点审计",
                                    yue: "MMSE 定向地點審核",
                                    fr: "Audit de localisation MMSE",
                                  })}
                                </p>
                                {(() => {
                                  const coords = assessment.orientation_audit?.location?.coordinates
                                  const hasCoordinates =
                                    typeof coords?.latitude === "number" && Number.isFinite(coords.latitude) &&
                                    typeof coords?.longitude === "number" && Number.isFinite(coords.longitude)

                                  return (
                                <div className="mt-1 grid grid-cols-1 gap-1">
                                  <p>
                                    {localizeText("Source", { zh: "来源", yue: "來源", fr: "Source" })}: <span className="font-semibold">{assessment.orientation_audit.location.source || "manual"}</span>
                                    {" • "}
                                    {localizeText("Confirmed", { zh: "已确认", yue: "已確認", fr: "Confirme" })}: <span className="font-semibold">{assessment.orientation_audit.location.confirmed ? localizeText("Yes", { zh: "是", yue: "是", fr: "Oui" }) : localizeText("No", { zh: "否", yue: "否", fr: "Non" })}</span>
                                  </p>
                                  <p>
                                    {localizeText("Site", { zh: "地点", yue: "地點", fr: "Site" })}: <span className="font-semibold">{assessment.orientation_audit.location.testedSite || "china_guangzhou_hospital"}</span>
                                    {" • "}
                                    {localizeText("Preset used", { zh: "使用预设", yue: "使用預設", fr: "Preconfiguration utilisee" })}: <span className="font-semibold">{assessment.orientation_audit.location.sitePresetUsed ? localizeText("Yes", { zh: "是", yue: "是", fr: "Oui" }) : localizeText("No", { zh: "否", yue: "否", fr: "Non" })}</span>
                                  </p>
                                  {hasCoordinates && (
                                    <p>
                                      {localizeText("Coordinates", { zh: "坐标", yue: "座標", fr: "Coordonnees" })}: <span className="font-semibold">{formatCoordinate(assessment.orientation_audit.location.coordinates?.latitude)}</span>, <span className="font-semibold">{formatCoordinate(assessment.orientation_audit.location.coordinates?.longitude)}</span>
                                      {" • "}
                                      {localizeText("Accuracy (m)", { zh: "精度（米）", yue: "精度（米）", fr: "Precision (m)" })}: <span className="font-semibold">{assessment.orientation_audit.location.coordinates?.accuracyMeters ?? "-"}</span>
                                    </p>
                                  )}
                                  <p>
                                    {localizeText("Place", { zh: "地点层级", yue: "地點層級", fr: "Lieu" })}: <span className="font-semibold">{assessment.orientation_audit.location.suggestedPlace?.country || "-"}</span> / <span className="font-semibold">{assessment.orientation_audit.location.suggestedPlace?.province || "-"}</span> / <span className="font-semibold">{assessment.orientation_audit.location.suggestedPlace?.city || "-"}</span> / <span className="font-semibold">{assessment.orientation_audit.location.suggestedPlace?.building || "-"}</span> / <span className="font-semibold">{assessment.orientation_audit.location.suggestedPlace?.place || assessment.orientation_audit.location.suggestedPlace?.room || "-"}</span>
                                  </p>
                                </div>
                                  )
                                })()}
                              </div>
                            )}
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

                      {(() => {
                        const tongueImages = getUserImageFiles(selectedUser, "tongue")
                        const faceImages = getUserImageFiles(selectedUser, "face")
                        const latestTcmAssessment = getLatestTcmAssessment(selectedUser)
                        const existingDoctorReview = getUserDoctorReview(selectedUser)
                        // Reliable image URLs stored directly on the TCM assessment record
                        const assessmentTongueUrl = latestTcmAssessment?.answers?.tongue_image_url ?? null
                        const assessmentFaceUrl = latestTcmAssessment?.answers?.face_image_url ?? null
                        // Final URL: prefer assessment-stored URL, fall back to uploaded_files match
                        const resolvedTongueUrl = assessmentTongueUrl || (tongueImages[0] ? getFileUrl(tongueImages[0].file_path) : null)
                        const resolvedFaceUrl = assessmentFaceUrl || (faceImages[0] ? getFileUrl(faceImages[0].file_path) : null)
                        // All constitution scores for detailed breakdown
                        const constitutionScores = latestTcmAssessment ? [
                          { key: "balanced", label: "平和质 Balanced", score: latestTcmAssessment.balanced_score },
                          { key: "qi_deficiency", label: "气虚质 Qi Deficiency", score: latestTcmAssessment.qi_deficiency_score },
                          { key: "yang_deficiency", label: "阳虚质 Yang Deficiency", score: latestTcmAssessment.yang_deficiency_score },
                          { key: "yin_deficiency", label: "阴虚质 Yin Deficiency", score: latestTcmAssessment.yin_deficiency_score },
                          { key: "phlegm_dampness", label: "痰湿质 Phlegm-Dampness", score: latestTcmAssessment.phlegm_dampness_score },
                          { key: "damp_heat", label: "湿热质 Damp-Heat", score: latestTcmAssessment.damp_heat_score },
                          { key: "blood_stasis", label: "血瘀质 Blood Stasis", score: latestTcmAssessment.blood_stasis_score },
                          { key: "qi_stagnation", label: "气郁质 Qi Stagnation", score: latestTcmAssessment.qi_stagnation_score },
                          { key: "special_constitution", label: "特禀质 Special", score: latestTcmAssessment.special_constitution_score },
                        ].filter(s => s.score != null) : []

                        return (
                          <div className="mt-6 rounded-2xl border border-emerald-200 bg-[linear-gradient(135deg,rgba(236,253,245,0.96),rgba(255,255,255,0.98),rgba(239,246,255,0.94))] p-5 shadow-sm">
                            <div className="flex items-center justify-between gap-3 flex-wrap">
                              <h3 className="text-lg font-semibold text-emerald-950">TCM Doctor Review Pack</h3>
                              <Badge className="bg-emerald-600 text-white hover:bg-emerald-600">Doctor workspace</Badge>
                            </div>
                            <p className="mt-2 text-sm text-slate-600">
                              Review tongue and face images, questionnaire constitution data, and existing remarks before finalizing the patient report.
                            </p>

                            {/* Tongue and Face images */}
                            <div className="mt-4 grid gap-4 lg:grid-cols-2">
                              <div className="rounded-xl border border-emerald-100 bg-white p-4">
                                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Tongue image (舌象)</p>
                                {resolvedTongueUrl ? (
                                  <div className="mt-3">
                                    <div className="relative h-48 overflow-hidden rounded-lg bg-slate-100">
                                      <Image
                                        src={resolvedTongueUrl}
                                        alt="Tongue image"
                                        fill
                                        className="object-contain"
                                        unoptimized
                                      />
                                    </div>
                                    {tongueImages.length > 1 && (
                                      <div className="mt-3 grid gap-2 grid-cols-3">
                                        {tongueImages.slice(1).map((file) => (
                                          <div key={file.id} className="relative h-20 overflow-hidden rounded-lg bg-slate-100">
                                            <Image src={getFileUrl(file.file_path)} alt={file.filename} fill className="object-cover" unoptimized />
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                ) : (
                                  <p className="mt-3 text-sm text-slate-500">No tongue image uploaded for this patient.</p>
                                )}
                              </div>

                              <div className="rounded-xl border border-emerald-100 bg-white p-4">
                                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Face image (面诊)</p>
                                {resolvedFaceUrl ? (
                                  <div className="mt-3">
                                    <div className="relative h-48 overflow-hidden rounded-lg bg-slate-100">
                                      <Image
                                        src={resolvedFaceUrl}
                                        alt="Face image"
                                        fill
                                        className="object-contain"
                                        unoptimized
                                      />
                                    </div>
                                    {faceImages.length > 1 && (
                                      <div className="mt-3 grid gap-2 grid-cols-3">
                                        {faceImages.slice(1).map((file) => (
                                          <div key={file.id} className="relative h-20 overflow-hidden rounded-lg bg-slate-100">
                                            <Image src={getFileUrl(file.file_path)} alt={file.filename} fill className="object-cover" unoptimized />
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                ) : (
                                  <p className="mt-3 text-sm text-slate-500">No face image uploaded for this patient.</p>
                                )}
                              </div>
                            </div>

                            {/* TCM Questionnaire & Constitution */}
                            <div className="mt-4 grid gap-4 lg:grid-cols-2">
                              <div className="rounded-xl border border-emerald-100 bg-white p-4 text-sm text-slate-700">
                                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">TCM questionnaire and constitution</p>
                                {latestTcmAssessment ? (
                                  <div className="mt-3 space-y-3">
                                    <div className="rounded-lg bg-emerald-50 p-3">
                                      <p>Primary constitution: <span className="font-semibold text-emerald-800">{latestTcmAssessment.primary_constitution?.replace(/_/g, " ") || "-"}</span></p>
                                      <p>Primary score: <span className="font-semibold">{latestTcmAssessment.primary_score != null ? `${latestTcmAssessment.primary_score}%` : "-"}</span></p>
                                      <p>Overall balance score: <span className="font-semibold">{latestTcmAssessment.overall_score ?? "-"}/100</span></p>
                                      <p>Completed: <span className="font-semibold">{latestTcmAssessment.completed_at ? new Date(latestTcmAssessment.completed_at).toLocaleString() : "-"}</span></p>
                                    </div>

                                    {/* All constitution scores */}
                                    {constitutionScores.length > 0 && (
                                      <div>
                                        <p className="text-xs font-semibold text-slate-500 mb-2">Constitution scores breakdown</p>
                                        <div className="space-y-1">
                                          {constitutionScores.sort((a, b) => (b.score ?? 0) - (a.score ?? 0)).map((item) => (
                                            <div key={item.key} className="flex items-center gap-2">
                                              <span className="w-44 text-xs text-slate-600 shrink-0">{item.label}</span>
                                              <div className="flex-1 h-2 rounded-full bg-slate-100 overflow-hidden">
                                                <div
                                                  className={`h-full rounded-full ${item.key === latestTcmAssessment.primary_constitution ? "bg-emerald-500" : "bg-slate-300"}`}
                                                  style={{ width: `${item.score ?? 0}%` }}
                                                />
                                              </div>
                                              <span className="text-xs font-medium w-8 text-right">{item.score}%</span>
                                            </div>
                                          ))}
                                        </div>
                                      </div>
                                    )}

                                    {/* Pulse assessment */}
                                    {latestTcmAssessment.answers?.pulse_assessment && (
                                      <div className="rounded-lg border border-emerald-100 bg-emerald-50/60 p-3">
                                        <p className="text-xs font-semibold text-slate-500 mb-1">Pulse assessment (脉象)</p>
                                        <p>Severity: <span className="font-semibold">{latestTcmAssessment.answers.pulse_assessment.severity ?? 0}/10</span></p>
                                        <p>Clinical pulse score: <span className="font-semibold">{latestTcmAssessment.answers.pulse_assessment.clinicalPulseScore ?? 0}/100</span></p>
                                        {latestTcmAssessment.answers.pulse_assessment.selectedPulseIds && latestTcmAssessment.answers.pulse_assessment.selectedPulseIds.length > 0 && (
                                          <div className="mt-2 flex flex-wrap gap-1">
                                            {latestTcmAssessment.answers.pulse_assessment.selectedPulseIds.map((pulseId) => (
                                              <Badge key={`review-pack-${latestTcmAssessment.id}-${pulseId}`} variant="outline" className="bg-white text-xs">
                                                {getPulseLabel(pulseId)}
                                              </Badge>
                                            ))}
                                          </div>
                                        )}
                                        {latestTcmAssessment.answers.pulse_assessment.notes && (
                                          <p className="mt-2 text-xs text-slate-600">Note: {latestTcmAssessment.answers.pulse_assessment.notes}</p>
                                        )}
                                      </div>
                                    )}

                                    {/* Patient-generated recommendations from questionnaire */}
                                    {latestTcmAssessment.recommendations && latestTcmAssessment.recommendations.length > 0 && (
                                      <div className="rounded-lg border border-amber-100 bg-amber-50/60 p-3">
                                        <p className="text-xs font-semibold text-amber-700 mb-2">Auto-generated recommendations (from questionnaire)</p>
                                        <ul className="space-y-1">
                                          {latestTcmAssessment.recommendations.map((rec, idx) => (
                                            <li key={idx} className="text-xs text-slate-700 flex items-start gap-1">
                                              <span className="text-amber-500 mt-0.5">•</span>
                                              {rec}
                                            </li>
                                          ))}
                                        </ul>
                                      </div>
                                    )}
                                  </div>
                                ) : (
                                  <p className="mt-3 text-sm text-slate-500">No TCM questionnaire assessment is available for this patient.</p>
                                )}
                              </div>

                              {/* Doctor remarks & recommendations */}
                              <div className="rounded-xl border border-emerald-100 bg-white p-4 text-sm text-slate-700">
                                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Doctor remarks and recommendations</p>
                                <div className="mt-3 space-y-2">
                                  <p>
                                    Constitution note: <span className="font-semibold">{existingDoctorReview?.tcm_constitution || tcmConstitutionInput || "-"}</span>
                                  </p>
                                  <p>
                                    Tongue remark: <span className="font-semibold">{existingDoctorReview?.tongue_observation || tongueObservationInput || "-"}</span>
                                  </p>
                                  <p>
                                    Face remark: <span className="font-semibold">{existingDoctorReview?.face_observation || faceObservationInput || "-"}</span>
                                  </p>
                                  <p>
                                    Questionnaire interpretation: <span className="font-semibold">{existingDoctorReview?.questionnaire_interpretation || questionnaireInterpretationInput || "-"}</span>
                                  </p>
                                  <p>
                                    TCM diagnosis: <span className="font-semibold">{existingDoctorReview?.tcm_diagnosis || tcmDiagnosisInput || "-"}</span>
                                  </p>
                                  <p>
                                    Therapy plan: <span className="font-semibold">{existingDoctorReview?.therapy_plan || tcmTherapyPlanInput || "-"}</span>
                                  </p>
                                  <p>
                                    Dietary advice: <span className="font-semibold">{existingDoctorReview?.dietary_advice || dietaryAdviceInput || "-"}</span>
                                  </p>
                                  <p>
                                    Follow-up recommendation: <span className="font-semibold">{existingDoctorReview?.follow_up_recommendation || followUpRecommendationInput || "-"}</span>
                                  </p>
                                  {!existingDoctorReview && (
                                    <p className="text-xs text-slate-400 italic mt-2">No doctor review saved yet. Use the form below to enter remarks.</p>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        )
                      })()}

                      <div className="mt-6 rounded-2xl border border-sky-200 bg-[linear-gradient(135deg,rgba(240,249,255,0.96),rgba(255,255,255,0.98),rgba(238,242,255,0.94))] p-5 shadow-sm">
                        <div className="flex items-center justify-between gap-3 flex-wrap">
                          <h3 className="text-lg font-semibold flex items-center gap-2">
                            <Sparkles className="w-5 h-5 text-sky-600" />
                            Medical Report Studio
                          </h3>
                          <Badge className="bg-sky-600 text-white hover:bg-sky-600">Premium</Badge>
                        </div>
                        <p className="mt-2 text-sm text-slate-600">
                          Individualized report workflow: doctor reviews each patient, approves, then publishes for patient download.
                        </p>

                        <div className="mt-3 rounded-lg border border-slate-200 bg-white p-3 text-xs text-slate-600">
                          Current status: <span className="font-semibold">{currentSelectedReportStatus}</span>
                          {currentSelectedReportStatus !== "published_to_patient" && (
                            <p className="mt-1 text-slate-500">Patient download remains locked until status is published_to_patient.</p>
                          )}
                        </div>

                        <div className="mt-4 grid gap-4 md:grid-cols-3">
                          <div className="space-y-2 md:col-span-1">
                            <Label htmlFor="report-language">Report language</Label>
                            <select
                              id="report-language"
                              value={reportLanguage}
                              onChange={(event) => setReportLanguage(event.target.value as ReportLanguage)}
                              className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-sky-300"
                            >
                              <option value="en">English</option>
                              <option value="zh-CN">简体中文</option>
                              <option value="zh-HK">繁體中文</option>
                              <option value="fr">Français</option>
                            </select>
                          </div>

                          <div className="space-y-2 md:col-span-1">
                            <Label htmlFor="doctor-name">Doctor name</Label>
                            <AssessmentInput
                              id="doctor-name"
                              value={doctorNameInput}
                              onChange={(event) => setDoctorNameInput(event.target.value)}
                              placeholder="TCM doctor name"
                            />
                          </div>

                          <div className="space-y-2 md:col-span-1">
                            <Label htmlFor="review-date">Review date</Label>
                            <AssessmentInput
                              id="review-date"
                              type="date"
                              value={reviewDateInput}
                              onChange={(event) => setReviewDateInput(event.target.value)}
                            />
                          </div>

                          <div className="space-y-2 md:col-span-3">
                            <Label htmlFor="tcm-constitution">TCM constitution</Label>
                            <AssessmentTextarea
                              id="tcm-constitution"
                              value={tcmConstitutionInput}
                              onChange={(event) => setTcmConstitutionInput(event.target.value)}
                              placeholder="Describe constitution type and rationale"
                              rows={2}
                            />
                          </div>

                          <div className="space-y-2 md:col-span-3">
                            <Label htmlFor="tongue-observation">Tongue observation</Label>
                            <AssessmentTextarea
                              id="tongue-observation"
                              value={tongueObservationInput}
                              onChange={(event) => setTongueObservationInput(event.target.value)}
                              placeholder="Color, coating, moisture, fissures"
                              rows={2}
                            />
                          </div>

                          <div className="space-y-2 md:col-span-3">
                            <Label htmlFor="face-observation">Face observation</Label>
                            <AssessmentTextarea
                              id="face-observation"
                              value={faceObservationInput}
                              onChange={(event) => setFaceObservationInput(event.target.value)}
                              placeholder="Complexion, eye region, expression patterns"
                              rows={2}
                            />
                          </div>

                          <div className="space-y-2 md:col-span-3">
                            <Label htmlFor="questionnaire-interpretation">Pulse/questionnaire interpretation</Label>
                            <AssessmentTextarea
                              id="questionnaire-interpretation"
                              value={questionnaireInterpretationInput}
                              onChange={(event) => setQuestionnaireInterpretationInput(event.target.value)}
                              placeholder="Interpret questionnaire and pulse indicators"
                              rows={2}
                            />
                          </div>

                          <div className="space-y-2 md:col-span-3">
                            <Label htmlFor="tcm-diagnosis">TCM diagnosis</Label>
                            <AssessmentTextarea
                              id="tcm-diagnosis"
                              value={tcmDiagnosisInput}
                              onChange={(event) => setTcmDiagnosisInput(event.target.value)}
                              placeholder="Enter TCM diagnosis"
                              rows={2}
                            />
                          </div>
                        </div>

                        <div className="mt-4 space-y-2">
                          <Label htmlFor="tcm-therapy-plan">TCM therapy and regimen plan</Label>
                          <AssessmentTextarea
                            id="tcm-therapy-plan"
                            value={tcmTherapyPlanInput}
                            onChange={(event) => setTcmTherapyPlanInput(event.target.value)}
                            placeholder="Herbs, acupuncture frequency, lifestyle, follow-up interval"
                            rows={3}
                          />
                        </div>

                        <div className="mt-4 space-y-2">
                          <Label htmlFor="dietary-advice">Dietary advice</Label>
                          <AssessmentTextarea
                            id="dietary-advice"
                            value={dietaryAdviceInput}
                            onChange={(event) => setDietaryAdviceInput(event.target.value)}
                            placeholder="Food strategy and restrictions"
                            rows={2}
                          />
                        </div>

                        <div className="mt-4 space-y-2">
                          <Label htmlFor="follow-up-recommendation">Follow-up recommendation</Label>
                          <AssessmentTextarea
                            id="follow-up-recommendation"
                            value={followUpRecommendationInput}
                            onChange={(event) => setFollowUpRecommendationInput(event.target.value)}
                            placeholder="Follow-up schedule and escalation criteria"
                            rows={2}
                          />
                        </div>

                        <div className="mt-4 space-y-2">
                          <Label htmlFor="final-summary">Final clinical summary</Label>
                          <AssessmentTextarea
                            id="final-summary"
                            value={finalSummaryInput}
                            onChange={(event) => setFinalSummaryInput(event.target.value)}
                            placeholder="Integrated recommendation combining neurology + TCM"
                            rows={3}
                          />
                        </div>

                        <div className="mt-4 flex flex-wrap gap-2">
                          <Button onClick={() => saveDoctorReview("draft")} variant="outline">
                            Save TCM draft
                          </Button>
                          <Button onClick={() => saveDoctorReview("reviewed")} variant="outline">
                            Mark TCM reviewed
                          </Button>
                          <Button onClick={() => updateReportStatus("approved")} variant="outline">
                            Approve final report
                          </Button>
                          <Button onClick={() => updateReportStatus("pending_final_approval")} variant="outline">
                            Send to final approval
                          </Button>
                          <Button
                            onClick={() => updateReportStatus("published_to_patient")}
                            variant="outline"
                            disabled={!canPublishToPatient}
                          >
                            Publish to patient
                          </Button>
                        </div>

                        {workflowMessage && (
                          <p className="mt-2 text-xs text-slate-600">{workflowMessage}</p>
                        )}

                        <div className="mt-4 flex flex-wrap gap-2">
                          <Button onClick={handleGenerateReport}>
                            <FileText className="mr-2 h-4 w-4" />
                            Generate report draft
                          </Button>
                          <Button onClick={handleDownloadReport} variant="outline" disabled={!generatedReport}>
                            <Download className="mr-2 h-4 w-4" />
                            Download report
                          </Button>
                          <Button onClick={handlePrintReport} variant="outline" disabled={!generatedReport}>
                            <Printer className="mr-2 h-4 w-4" />
                            Print
                          </Button>
                        </div>

                        <div className="mt-4 flex flex-wrap gap-2">
                          <Button onClick={handleGenerateAllReports} variant="secondary">
                            <Sparkles className="mr-2 h-4 w-4" />
                            Generate all patient reports
                          </Button>
                          <Button onClick={handleDownloadAllReports} variant="outline" disabled={!generatedAllReports}>
                            <Download className="mr-2 h-4 w-4" />
                            Download all reports
                          </Button>
                          <Button onClick={handlePrintAllReports} variant="outline" disabled={!generatedAllReports}>
                            <Printer className="mr-2 h-4 w-4" />
                            Print all reports
                          </Button>
                        </div>

                        {generatedReport && (
                          <div className="mt-4 rounded-xl border border-sky-100 bg-white p-4">
                            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Generated Preview</p>
                            <pre className="max-h-96 overflow-auto whitespace-pre-wrap text-xs leading-6 text-slate-700">{generatedReport}</pre>
                          </div>
                        )}

                        {generatedAllReports && (
                          <div className="mt-4 rounded-xl border border-indigo-100 bg-white p-4">
                            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">All Patients Preview</p>
                            <pre className="max-h-96 overflow-auto whitespace-pre-wrap text-xs leading-6 text-slate-700">{generatedAllReports}</pre>
                          </div>
                        )}
                      </div>

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

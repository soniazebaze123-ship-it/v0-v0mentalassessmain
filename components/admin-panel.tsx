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
import { jsPDF } from "jspdf"

// TCM questionnaire question definitions (mirrored from tcm-constitution.tsx)
const TCM_QUESTIONS_MAP: Record<string, { text: string; textZh: string; constitution: string }> = {
  qi1: { text: "Do you feel tired or fatigued easily?", textZh: "您容易感到疲劳吗？", constitution: "Qi Deficiency" },
  qi2: { text: "Do you get short of breath with minimal effort?", textZh: "您稍微活动就气短吗？", constitution: "Qi Deficiency" },
  qi3: { text: "Do you catch colds more often than others?", textZh: "您比别人更容易感冒吗？", constitution: "Qi Deficiency" },
  yang1: { text: "Do your hands and feet often feel cold?", textZh: "您手脚经常冰凉吗？", constitution: "Yang Deficiency" },
  yang2: { text: "Do you prefer warm drinks and food over cold?", textZh: "您喜欢温热的食物和饮料吗？", constitution: "Yang Deficiency" },
  yang3: { text: "Do you feel cold when others feel comfortable?", textZh: "别人感觉舒适时您觉得冷吗？", constitution: "Yang Deficiency" },
  yin1: { text: "Do you experience dry eyes, mouth, or skin?", textZh: "您经常感到眼睛、口腔或皮肤干燥吗？", constitution: "Yin Deficiency" },
  yin2: { text: "Do you have warm palms, soles, or chest?", textZh: "您手心、脚心或胸口发热吗？", constitution: "Yin Deficiency" },
  yin3: { text: "Do you experience night sweats?", textZh: "您有盗汗的情况吗？", constitution: "Yin Deficiency" },
  pd1: { text: "Does your body feel heavy or sluggish?", textZh: "您感觉身体沉重或迟缓吗？", constitution: "Phlegm-Dampness" },
  pd2: { text: "Is your skin or face oily?", textZh: "您的皮肤或脸部容易出油吗？", constitution: "Phlegm-Dampness" },
  pd3: { text: "Do you feel tightness or fullness in chest/abdomen?", textZh: "您感到胸闷或腹胀吗？", constitution: "Phlegm-Dampness" },
  dh1: { text: "Do you often have a bitter taste in your mouth?", textZh: "您经常口苦或口中有异味吗？", constitution: "Damp-Heat" },
  dh2: { text: "Is your face oily or prone to acne?", textZh: "您的脸部容易出油或长痘吗？", constitution: "Damp-Heat" },
  dh3: { text: "Do you feel irritable or easily angered?", textZh: "您容易烦躁或发脾气吗？", constitution: "Damp-Heat" },
  bs1: { text: "Do you bruise easily?", textZh: "您容易淤青吗？", constitution: "Blood Stasis" },
  bs2: { text: "Do you have dark circles under your eyes?", textZh: "您有黑眼圈吗？", constitution: "Blood Stasis" },
  bs3: { text: "Do you experience fixed, stabbing pain in specific areas?", textZh: "您身体某些部位有固定的刺痛感吗？", constitution: "Blood Stasis" },
  qs1: { text: "Do you feel anxious, depressed, or emotionally unstable?", textZh: "您经常感到焦虑、抑郁或情绪不稳吗？", constitution: "Qi Stagnation" },
  qs2: { text: "Do you sigh frequently or feel chest tightness?", textZh: "您经常叹气或感到胸闷吗？", constitution: "Qi Stagnation" },
  qs3: { text: "Does your mood fluctuate with stress?", textZh: "您的情绪随压力波动吗？", constitution: "Qi Stagnation" },
  sc1: { text: "Do you have allergies (skin, respiratory, or food)?", textZh: "您有过敏症状吗？", constitution: "Special Constitution" },
  sc2: { text: "Are you sensitive to medications or environmental changes?", textZh: "您对药物或环境变化敏感吗？", constitution: "Special Constitution" },
  sc3: { text: "Do you experience seasonal symptoms?", textZh: "您有季节性症状吗？", constitution: "Special Constitution" },
  bal1: { text: "Do you generally feel energetic and refreshed?", textZh: "您通常感到精力充沛吗？", constitution: "Balanced" },
  bal2: { text: "Is your sleep restful and appetite normal?", textZh: "您睡眠质量好、食欲正常吗？", constitution: "Balanced" },
  bal3: { text: "Do you adapt well to environmental changes?", textZh: "您能很好地适应环境变化吗？", constitution: "Balanced" },
}

const LIKERT_LABELS: Record<number, { en: string; zh: string; yue: string; fr: string }> = {
  1: { en: "Never", zh: "从不", yue: "從不", fr: "Jamais" },
  2: { en: "Rarely", zh: "很少", yue: "很少", fr: "Rarement" },
  3: { en: "Sometimes", zh: "有时", yue: "有時", fr: "Parfois" },
  4: { en: "Often", zh: "经常", yue: "經常", fr: "Souvent" },
  5: { en: "Always", zh: "总是", yue: "總是", fr: "Toujours" },
}

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

type ReportContentLabels = {
  cityProvinceValue: string
  hospitalValue: string
  olfactory: string
  auditory: string
  visual: string
  primaryConstitution: string
  tcmScore: string
  tcmConstitutionDoctor: string
  tongueObservation: string
  faceObservation: string
  questionnaireInterpretation: string
  dietaryAdvice: string
  followUpRecommendation: string
  doctorName: string
  reviewDate: string
  questionnaireResponses: string
  autoRecommendations: string
  riskTier: string
  riskHigh: string
  riskModerate: string
  riskLow: string
}

const REPORT_CONTENT_LABELS: Record<ReportLanguage, ReportContentLabels> = {
  en: {
    cityProvinceValue: "Guangzhou / Guangdong",
    hospitalValue: "Nanfang Hospital of Integrated Traditional Chinese and Western Medicine",
    olfactory: "Olfactory",
    auditory: "Auditory",
    visual: "Visual",
    primaryConstitution: "Primary Constitution",
    tcmScore: "TCM Score",
    tcmConstitutionDoctor: "TCM Constitution (doctor)",
    tongueObservation: "Tongue Observation",
    faceObservation: "Face Observation",
    questionnaireInterpretation: "Questionnaire Interpretation",
    dietaryAdvice: "Dietary Advice",
    followUpRecommendation: "Follow-up Recommendation",
    doctorName: "Doctor Name",
    reviewDate: "Review Date",
    questionnaireResponses: "TCM Questionnaire Responses",
    autoRecommendations: "Auto-generated Health Recommendations",
    riskTier: "Risk Tier",
    riskHigh: "HIGH",
    riskModerate: "MODERATE",
    riskLow: "LOW",
  },
  "zh-CN": {
    cityProvinceValue: "广州 / 广东",
    hospitalValue: "南方医科大学中西医结合医院",
    olfactory: "嗅觉",
    auditory: "听觉",
    visual: "视觉",
    primaryConstitution: "主要体质",
    tcmScore: "中医总分",
    tcmConstitutionDoctor: "中医体质（医生）",
    tongueObservation: "舌象观察",
    faceObservation: "面诊观察",
    questionnaireInterpretation: "问卷解读",
    dietaryAdvice: "饮食建议",
    followUpRecommendation: "随访建议",
    doctorName: "医生姓名",
    reviewDate: "评审日期",
    questionnaireResponses: "中医问卷作答",
    autoRecommendations: "问卷自动生成健康建议",
    riskTier: "风险等级",
    riskHigh: "高",
    riskModerate: "中",
    riskLow: "低",
  },
  "zh-HK": {
    cityProvinceValue: "廣州 / 廣東",
    hospitalValue: "南方醫科大學中西醫結合醫院",
    olfactory: "嗅覺",
    auditory: "聽覺",
    visual: "視覺",
    primaryConstitution: "主要體質",
    tcmScore: "中醫總分",
    tcmConstitutionDoctor: "中醫體質（醫生）",
    tongueObservation: "舌象觀察",
    faceObservation: "面診觀察",
    questionnaireInterpretation: "問卷解讀",
    dietaryAdvice: "飲食建議",
    followUpRecommendation: "隨訪建議",
    doctorName: "醫生姓名",
    reviewDate: "評審日期",
    questionnaireResponses: "中醫問卷作答",
    autoRecommendations: "問卷自動生成健康建議",
    riskTier: "風險等級",
    riskHigh: "高",
    riskModerate: "中",
    riskLow: "低",
  },
  fr: {
    cityProvinceValue: "Guangzhou / Guangdong",
    hospitalValue: "Hopital integre de medecine chinoise et occidentale de Nanfang",
    olfactory: "Olfactif",
    auditory: "Auditif",
    visual: "Visuel",
    primaryConstitution: "Constitution principale",
    tcmScore: "Score MTC",
    tcmConstitutionDoctor: "Constitution MTC (medecin)",
    tongueObservation: "Observation de la langue",
    faceObservation: "Observation du visage",
    questionnaireInterpretation: "Interpretation du questionnaire",
    dietaryAdvice: "Conseil dietetique",
    followUpRecommendation: "Recommandation de suivi",
    doctorName: "Nom du medecin",
    reviewDate: "Date de revue",
    questionnaireResponses: "Reponses au questionnaire MTC",
    autoRecommendations: "Recommandations de sante auto-generees",
    riskTier: "Niveau de risque",
    riskHigh: "ELEVE",
    riskModerate: "MODERE",
    riskLow: "FAIBLE",
  },
}

const CONSTITUTION_LABELS: Record<string, { "zh-CN": string; "zh-HK": string; fr: string }> = {
  balanced: { "zh-CN": "平和质", "zh-HK": "平和質", fr: "Constitution equilibree" },
  "qi deficiency": { "zh-CN": "气虚质", "zh-HK": "氣虛質", fr: "Deficience du qi" },
  "yang deficiency": { "zh-CN": "阳虚质", "zh-HK": "陽虛質", fr: "Deficience du yang" },
  "yin deficiency": { "zh-CN": "阴虚质", "zh-HK": "陰虛質", fr: "Deficience du yin" },
  "phlegm-dampness": { "zh-CN": "痰湿质", "zh-HK": "痰濕質", fr: "Mucosites-humidite" },
  "damp-heat": { "zh-CN": "湿热质", "zh-HK": "濕熱質", fr: "Humidite-chaleur" },
  "blood stasis": { "zh-CN": "血瘀质", "zh-HK": "血瘀質", fr: "Stase sanguine" },
  "qi stagnation": { "zh-CN": "气郁质", "zh-HK": "氣鬱質", fr: "Stagnation du qi" },
  "special constitution": { "zh-CN": "特禀质", "zh-HK": "特稟質", fr: "Constitution speciale" },
}

const getConstitutionLabelForLanguage = (value: string, language: ReportLanguage) => {
  if (!value) return value
  const normalized = value.replace(/_/g, " ").toLowerCase()
  const mapping = CONSTITUTION_LABELS[normalized]
  if (!mapping || language === "en") return value.replace(/_/g, " ")
  return mapping[language]
}

const getLikertLabelForReport = (score: number, language: ReportLanguage) => {
  const labels = LIKERT_LABELS[score]
  if (!labels) return String(score)
  if (language === "zh-CN") return labels.zh
  if (language === "zh-HK") return labels.yue
  if (language === "fr") return labels.fr
  return labels.en
}

const getLikertLabelForUi = (score: number, language: "en" | "zh" | "yue" | "fr") => {
  const labels = LIKERT_LABELS[score]
  if (!labels) return String(score)
  if (language === "zh") return labels.zh
  if (language === "yue") return labels.yue
  if (language === "fr") return labels.fr
  return labels.en
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
  const { language, t, localizeText } = useLanguage()
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
  const [tcmImageFilter, setTcmImageFilter] = useState<"all" | "complete" | "missing_images" | "missing_questionnaire">("all")

  useEffect(() => {
    if (language === "zh") {
      setReportLanguage("zh-CN")
      return
    }
    if (language === "yue") {
      setReportLanguage("zh-HK")
      return
    }
    if (language === "fr") {
      setReportLanguage("fr")
      return
    }
    setReportLanguage("en")
  }, [language])

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
    const hasQuestionnaire = getUserTcmAssessments(userId).length > 0
    // Images are optional — questionnaire is mandatory for TCM patients
    const hasTongueImage =
      files.some((file) => /tongue/i.test(file.filename)) ||
      !!(latest?.answers?.tongue_image_url)
    const hasFaceImage =
      files.some((file) => /face/i.test(file.filename)) ||
      !!(latest?.answers?.face_image_url)
    const hasImages = hasTongueImage && hasFaceImage

    if (!hasQuestionnaire) {
      return {
        key: "missing_questionnaire" as const,
        label: localizeText("Missing questionnaire", { zh: "缺少问卷", yue: "缺少問卷", fr: "Questionnaire manquant" }),
      }
    }
    if (!hasImages) {
      return {
        key: "missing_images" as const,
        label: localizeText("Missing images", { zh: "缺少图片", yue: "缺少圖片", fr: "Images manquantes" }),
      }
    }
    return {
      key: "complete" as const,
      label: localizeText("Complete", { zh: "完整", yue: "完整", fr: "Complet" }),
    }
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

    if (riskFlags >= 2) {
      return {
        key: "high" as const,
        label: localizeText("High risk", { zh: "高风险", yue: "高風險", fr: "Risque eleve" }),
      }
    }
    if (riskFlags === 1) {
      return {
        key: "moderate" as const,
        label: localizeText("Moderate risk", { zh: "中风险", yue: "中風險", fr: "Risque modere" }),
      }
    }
    return {
      key: "low" as const,
      label: localizeText("Low risk", { zh: "低风险", yue: "低風險", fr: "Risque faible" }),
    }
  }

  const getReportStatusLabel = (status: ReportStatus) => {
    switch (status) {
      case "incomplete":
        return localizeText("Incomplete", { zh: "资料不完整", yue: "資料不完整", fr: "Incomplet" })
      case "pending_tcm_review":
        return localizeText("Pending TCM review", { zh: "待中医审核", yue: "待中醫審核", fr: "En attente de revue MTC" })
      case "tcm_reviewed":
        return localizeText("TCM reviewed", { zh: "中医已审核", yue: "中醫已審核", fr: "Revue MTC terminee" })
      case "pending_final_approval":
        return localizeText("Pending final approval", { zh: "待最终审批", yue: "待最終審批", fr: "En attente d'approbation finale" })
      case "approved":
        return localizeText("Approved", { zh: "已批准", yue: "已批准", fr: "Approuve" })
      case "published_to_patient":
        return localizeText("Published to patient", { zh: "已发布给患者", yue: "已發布給患者", fr: "Publie au patient" })
      default:
        return status
    }
  }

  const getWorkflowStatusForUser = (userId: string): ReportStatus => {
    const report = getUserMedicalReport(userId)
    if (report?.report_status) return report.report_status

    const review = getUserDoctorReview(userId)
    const tcmImageState = getTcmImageState(userId)
    // Only missing questionnaire blocks workflow; missing images is acceptable
    if (tcmImageState.key === "missing_questionnaire") return "incomplete"
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
        cube: t("moca.cube"),
        clock: localizeText("Clock Drawing", { zh: "画钟任务", yue: "畫鐘任務", fr: "Dessin d'horloge" }),
        trail_making: localizeText("Trail Making", { zh: "连线任务", yue: "連線任務", fr: "Trails" }),
        animal_naming: localizeText("Animal Naming", { zh: "动物命名", yue: "動物命名", fr: "Denomination des animaux" }),
        object_naming: localizeText("Object Naming", { zh: "物体命名", yue: "物件命名", fr: "Denomination des objets" }),
        visuospatial: t("moca.visuospatial"),
        executive: t("moca.executive"),
        naming: t("moca.naming"),
        memory_task: t("moca.memory"),
        memory: t("moca.memory"),
        attention_task: t("moca.attention"),
        attention: t("moca.attention"),
        language_abstraction: t("moca.language"),
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
        legacy_mmse_score: localizeText("Legacy MMSE score", { zh: "旧版 MMSE 分数", yue: "舊版 MMSE 分數", fr: "Score MMSE herite" }),
        legacy_mmse_max_score: localizeText("Legacy MMSE max score", { zh: "旧版 MMSE 满分", yue: "舊版 MMSE 滿分", fr: "Score max MMSE herite" }),
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
    const contentLabels = REPORT_CONTENT_LABELS[language]
    const user = users.find((entry) => entry.id === userId)
    const userAssessments = getUserAssessments(userId)
    const userSensory = getUserSensoryAssessments(userId)
    const userTcm = getUserTcmAssessments(userId)
    // Use saved doctor review when available, fall back to current input state
    const savedReview = getUserDoctorReview(userId)

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
    const finalRisk =
      riskFlagCount >= 2
        ? contentLabels.riskHigh
        : riskFlagCount === 1
          ? contentLabels.riskModerate
          : contentLabels.riskLow

    return [
      labels.reportTitle,
      `${labels.reportDate}: ${new Date().toLocaleDateString()}`,
      "",
      labels.patientInfo,
      `${labels.name}: ${getUserDisplayName(user)}`,
      `${labels.idNumber}: ${user?.national_id || labels.unknown}`,
      `${labels.sex}: ${user?.gender || labels.unknown}`,
      `${labels.dateOfBirth}: ${user?.date_of_birth || labels.unknown}`,
      `${labels.cityProvince}: ${contentLabels.cityProvinceValue}`,
      `${labels.hospital}: ${contentLabels.hospitalValue}`,
      "",
      labels.cognitive,
      `MMSE: ${latestMmse ? `${latestMmse.total_score}/30` : labels.unknown}`,
      `MoCA: ${latestMoca ? `${latestMoca.total_score}/30` : labels.unknown}`,
      labels.mmseDesignScores,
      ...formatMmseReconstructionScores(latestMmse),
      "",
      labels.sensory,
      `${contentLabels.olfactory}: ${latestOlfactory ? `${latestOlfactory.raw_score ?? "-"} (${latestOlfactory.classification || "-"})` : labels.unknown}`,
      `${contentLabels.auditory}: ${latestAuditory ? `${latestAuditory.normalized_score ?? "-"} (${latestAuditory.classification || "-"})` : labels.unknown}`,
      `${contentLabels.visual}: ${latestVisual ? `${latestVisual.normalized_score ?? "-"} (${latestVisual.classification || "-"})` : labels.unknown}`,
      "",
      labels.tcm,
      `${contentLabels.primaryConstitution}: ${latestTcm?.primary_constitution ? getConstitutionLabelForLanguage(latestTcm.primary_constitution, language) : labels.unknown}`,
      `${contentLabels.tcmScore}: ${latestTcm?.overall_score ?? labels.unknown}`,
      `${contentLabels.tcmConstitutionDoctor}: ${savedReview?.tcm_constitution || tcmConstitutionInput || labels.unknown}`,
      `${contentLabels.tongueObservation}: ${savedReview?.tongue_observation || tongueObservationInput || labels.unknown}`,
      `${contentLabels.faceObservation}: ${savedReview?.face_observation || faceObservationInput || labels.unknown}`,
      `${contentLabels.questionnaireInterpretation}: ${savedReview?.questionnaire_interpretation || questionnaireInterpretationInput || labels.unknown}`,
      `${labels.diagnosis}: ${savedReview?.tcm_diagnosis || tcmDiagnosisInput || labels.unknown}`,
      `${labels.treatmentPlan}: ${savedReview?.therapy_plan || tcmTherapyPlanInput || labels.unknown}`,
      `${contentLabels.dietaryAdvice}: ${savedReview?.dietary_advice || dietaryAdviceInput || labels.unknown}`,
      `${contentLabels.followUpRecommendation}: ${savedReview?.follow_up_recommendation || followUpRecommendationInput || labels.unknown}`,
      `${contentLabels.doctorName}: ${savedReview?.doctor_name || doctorNameInput || labels.unknown}`,
      `${contentLabels.reviewDate}: ${savedReview?.review_date || reviewDateInput || labels.unknown}`,
      "",
      // Questionnaire Q&A section
      `── ${contentLabels.questionnaireResponses} ──`,
      ...(latestTcm?.answers?.questionnaire
        ? (() => {
            const qa = latestTcm.answers!.questionnaire!
            const grouped: Record<string, string[]> = {}
            for (const [qid, score] of Object.entries(qa)) {
              const q = TCM_QUESTIONS_MAP[qid]
              if (!q) continue
              if (!grouped[q.constitution]) grouped[q.constitution] = []
              grouped[q.constitution].push(
                `  • ${language === "en" ? q.text : language === "fr" ? q.text : q.textZh}: ${getLikertLabelForReport(score as number, language)}`
              )
            }
            const lines: string[] = []
            for (const [constitution, answers] of Object.entries(grouped)) {
              lines.push(`[${getConstitutionLabelForLanguage(constitution, language)}]`)
              lines.push(...answers)
            }
            return lines
          })()
        : [`  ${labels.unknown}`]),
      "",
      // Auto-generated recommendations from questionnaire
      ...(latestTcm?.recommendations && latestTcm.recommendations.length > 0
        ? [
            `── ${contentLabels.autoRecommendations} ──`,
            ...latestTcm.recommendations.map((r) => `  • ${r}`),
            "",
          ]
        : []),
      "",
      labels.finalPlan,
      `${contentLabels.riskTier}: ${finalRisk}`,
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
    const doc = new jsPDF({
      orientation: "p",
      unit: "pt",
      format: "a4",
    })
    doc.setFontSize(10)
    const lines = doc.splitTextToSize(generatedReport, 545)
    let y = 40
    const lineHeight = 14
    const pageHeight = doc.internal.pageSize.getHeight()
    for (const line of lines) {
      if (y > pageHeight - 30) {
        doc.addPage()
        y = 40
      }
      doc.text(String(line), 30, y)
      y += lineHeight
    }
    doc.save(`MA_${filePrefix}_${reportLanguage}_report.pdf`)
  }

  const handlePrintReport = () => {
    if (!selectedUser) return
    const reportText = generatedReport || buildMedicalReport(selectedUser, reportLanguage)
    if (!generatedReport) {
      setGeneratedReport(reportText)
    }
    const printWindow = window.open("", "_blank", "noopener,noreferrer,width=900,height=700")
    if (!printWindow) return
    printWindow.document.write(`<pre style="font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; white-space: pre-wrap; padding: 24px; line-height: 1.6;">${reportText.replace(/</g, "&lt;")}</pre>`)
    printWindow.document.close()
    printWindow.focus()
    setTimeout(() => {
      printWindow.print()
    }, 150)
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
    const doc = new jsPDF({
      orientation: "p",
      unit: "pt",
      format: "a4",
    })
    doc.setFontSize(10)
    const lines = doc.splitTextToSize(generatedAllReports, 545)
    let y = 40
    const lineHeight = 14
    const pageHeight = doc.internal.pageSize.getHeight()
    for (const line of lines) {
      if (y > pageHeight - 30) {
        doc.addPage()
        y = 40
      }
      doc.text(String(line), 30, y)
      y += lineHeight
    }
    doc.save(`MA_all_patients_${reportLanguage}_reports.pdf`)
  }

  const handlePrintAllReports = () => {
    const allReports = generatedAllReports || buildAllMedicalReports(reportLanguage)
    if (!generatedAllReports) {
      setGeneratedAllReports(allReports)
    }
    const printWindow = window.open("", "_blank", "noopener,noreferrer,width=1000,height=800")
    if (!printWindow) return
    printWindow.document.write(`<pre style="font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; white-space: pre-wrap; padding: 24px; line-height: 1.6;">${allReports.replace(/</g, "&lt;")}</pre>`)
    printWindow.document.close()
    printWindow.focus()
    setTimeout(() => {
      printWindow.print()
    }, 150)
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

      setWorkflowMessage(
        reviewStatus === "reviewed"
          ? localizeText("TCM review marked as reviewed.", {
              zh: "中医审核已标记为完成。",
              yue: "中醫審核已標記為完成。",
              fr: "La revue MTC est marquee comme terminee.",
            })
          : localizeText("TCM review draft saved.", {
              zh: "中医审核草稿已保存。",
              yue: "中醫審核草稿已保存。",
              fr: "Le brouillon de revue MTC est enregistre.",
            }),
      )
    } catch (error) {
      console.error("Failed to save TCM doctor review:", error)
      setWorkflowMessage(
        localizeText("Could not save review. Ensure table tcm_doctor_reviews exists.", {
          zh: "无法保存审核。请确认 tcm_doctor_reviews 表已创建。",
          yue: "無法保存審核。請確認 tcm_doctor_reviews 表已建立。",
          fr: "Impossible d'enregistrer la revue. Verifiez que la table tcm_doctor_reviews existe.",
        }),
      )
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
      setWorkflowMessage(
        localizeText("Report status updated to", {
          zh: "报告状态已更新为",
          yue: "報告狀態已更新為",
          fr: "Le statut du rapport est passe a",
        }) + ` ${getReportStatusLabel(nextStatus)}.`,
      )
    } catch (error) {
      console.error("Failed to update report status:", error)
      setWorkflowMessage(
        localizeText("Could not update report status. Ensure table medical_reports exists.", {
          zh: "无法更新报告状态。请确认 medical_reports 表已创建。",
          yue: "無法更新報告狀態。請確認 medical_reports 表已建立。",
          fr: "Impossible de mettre a jour le statut du rapport. Verifiez que la table medical_reports existe.",
        }),
      )
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
              <CardTitle>
                {localizeText("Patient Report Review Dashboard", {
                  zh: "患者报告审核面板",
                  yue: "患者報告審核面板",
                  fr: "Tableau de revue des rapports patient",
                })}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 md:grid-cols-2 mb-4">
                <AssessmentInput
                  placeholder={localizeText("Search by phone, name, or national ID", {
                    zh: "按手机号、姓名或身份证号搜索",
                    yue: "按手機號、姓名或身份證號搜尋",
                    fr: "Rechercher par telephone, nom ou identifiant national",
                  })}
                  value={patientSearch}
                  onChange={(event) => setPatientSearch(event.target.value)}
                />
                <div className="grid grid-cols-3 gap-2">
                  <select
                    value={statusFilter}
                    onChange={(event) => setStatusFilter(event.target.value as "all" | ReportStatus)}
                    className="h-10 rounded-md border border-slate-200 bg-white px-2 text-xs outline-none focus:ring-2 focus:ring-blue-300"
                  >
                    <option value="all">{localizeText("All status", { zh: "全部状态", yue: "全部狀態", fr: "Tous les statuts" })}</option>
                    <option value="incomplete">{getReportStatusLabel("incomplete")}</option>
                    <option value="pending_tcm_review">{getReportStatusLabel("pending_tcm_review")}</option>
                    <option value="tcm_reviewed">{getReportStatusLabel("tcm_reviewed")}</option>
                    <option value="pending_final_approval">{getReportStatusLabel("pending_final_approval")}</option>
                    <option value="approved">{getReportStatusLabel("approved")}</option>
                    <option value="published_to_patient">{getReportStatusLabel("published_to_patient")}</option>
                  </select>
                  <select
                    value={riskFilter}
                    onChange={(event) => setRiskFilter(event.target.value as "all" | "high" | "moderate" | "low")}
                    className="h-10 rounded-md border border-slate-200 bg-white px-2 text-xs outline-none focus:ring-2 focus:ring-blue-300"
                  >
                    <option value="all">{localizeText("All risk", { zh: "全部风险", yue: "全部風險", fr: "Tous les risques" })}</option>
                    <option value="high">{localizeText("High risk", { zh: "高风险", yue: "高風險", fr: "Risque eleve" })}</option>
                    <option value="moderate">{localizeText("Moderate risk", { zh: "中风险", yue: "中風險", fr: "Risque modere" })}</option>
                    <option value="low">{localizeText("Low risk", { zh: "低风险", yue: "低風險", fr: "Risque faible" })}</option>
                  </select>
                  <select
                    value={tcmImageFilter}
                    onChange={(event) =>
                      setTcmImageFilter(
                        event.target.value as "all" | "complete" | "missing_images" | "missing_questionnaire",
                      )
                    }
                    className="h-10 rounded-md border border-slate-200 bg-white px-2 text-xs outline-none focus:ring-2 focus:ring-blue-300"
                  >
                    <option value="all">{localizeText("All TCM files", { zh: "全部中医资料", yue: "全部中醫資料", fr: "Tous les dossiers MTC" })}</option>
                    <option value="complete">{localizeText("Questionnaire + Images", { zh: "问卷+图片完整", yue: "問卷+圖片完整", fr: "Questionnaire + images" })}</option>
                    <option value="missing_images">{localizeText("Missing images (questionnaire OK)", { zh: "缺少图片（问卷已完成）", yue: "缺少圖片（問卷已完成）", fr: "Images manquantes (questionnaire OK)" })}</option>
                    <option value="missing_questionnaire">{localizeText("Missing questionnaire", { zh: "缺少问卷", yue: "缺少問卷", fr: "Questionnaire manquant" })}</option>
                  </select>
                </div>
              </div>

              <div className="mb-4 overflow-auto rounded-lg border border-slate-200">
                <table className="min-w-full text-sm">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-3 py-2 text-left font-semibold">{localizeText("Patient", { zh: "患者", yue: "患者", fr: "Patient" })}</th>
                      <th className="px-3 py-2 text-left font-semibold">{localizeText("Cognitive Status", { zh: "认知状态", yue: "認知狀態", fr: "Statut cognitif" })}</th>
                      <th className="px-3 py-2 text-left font-semibold">{localizeText("TCM Images", { zh: "中医图片", yue: "中醫圖片", fr: "Images MTC" })}</th>
                      <th className="px-3 py-2 text-left font-semibold">{localizeText("Report Status", { zh: "报告状态", yue: "報告狀態", fr: "Statut du rapport" })}</th>
                      <th className="px-3 py-2 text-left font-semibold">{localizeText("Download", { zh: "下载", yue: "下載", fr: "Telechargement" })}</th>
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
                            <Badge variant="outline">{getReportStatusLabel(workflowStatus)}</Badge>
                          </td>
                          <td className="px-3 py-2">
                            {workflowStatus === "published_to_patient"
                              ? localizeText("Available", { zh: "可下载", yue: "可下載", fr: "Disponible" })
                              : localizeText("Locked", { zh: "锁定", yue: "鎖定", fr: "Verrouille" })}
                          </td>
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
                          <Badge variant="outline">{getReportStatusLabel(workflowStatus)}</Badge>
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
                                    {localizeText("Source", { zh: "来源", yue: "來源", fr: "Source" })}: <span className="font-semibold">{assessment.orientation_audit.location.source || localizeText("manual", { zh: "手动", yue: "手動", fr: "manuel" })}</span>
                                    {" • "}
                                    {localizeText("Confirmed", { zh: "已确认", yue: "已確認", fr: "Confirme" })}: <span className="font-semibold">{assessment.orientation_audit.location.confirmed ? localizeText("Yes", { zh: "是", yue: "是", fr: "Oui" }) : localizeText("No", { zh: "否", yue: "否", fr: "Non" })}</span>
                                  </p>
                                  <p>
                                    {localizeText("Site", { zh: "地点", yue: "地點", fr: "Site" })}: <span className="font-semibold">{assessment.orientation_audit.location.testedSite || localizeText("Guangzhou Hospital", { zh: "广州医院", yue: "廣州醫院", fr: "Hopital de Guangzhou" })}</span>
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

                      <h3 className="text-lg font-semibold mt-6">
                        {localizeText("TCM & Pulse Reviews", { zh: "中医与脉象评估", yue: "中醫與脈象評估", fr: "Revue MTC et pouls" })}
                      </h3>
                      {getUserTcmAssessments(selectedUser).map((assessment) => (
                        <div key={assessment.id} className="border rounded-lg p-4 space-y-3 bg-emerald-50/60">
                          <div className="flex justify-between items-center flex-wrap gap-2">
                            <Badge variant="outline" className="bg-emerald-100 text-emerald-800">
                              {getConstitutionLabelForLanguage(assessment.primary_constitution, reportLanguage)}
                            </Badge>
                            <span className="text-sm text-gray-600">
                              {assessment.completed_at
                                ? new Date(assessment.completed_at).toLocaleDateString()
                                : localizeText("No date", { zh: "无日期", yue: "無日期", fr: "Sans date" })}
                            </span>
                          </div>
                          <p className="text-sm text-slate-700">
                            {localizeText("Overall score", { zh: "总分", yue: "總分", fr: "Score global" })}: <span className="font-semibold">{assessment.overall_score ?? "-"}/100</span>
                          </p>
                          {assessment.answers?.pulse_assessment && (
                            <div className="rounded-lg border border-emerald-200 bg-white/90 p-3 text-sm text-slate-700">
                              <p>
                                {localizeText("Pulse severity", { zh: "脉象严重度", yue: "脈象嚴重度", fr: "Severite du pouls" })}: <span className="font-semibold">{assessment.answers.pulse_assessment.severity ?? 0}</span>
                                {" • "}
                                {localizeText("Pulse score", { zh: "脉象评分", yue: "脈象評分", fr: "Score du pouls" })}: <span className="font-semibold">{assessment.answers.pulse_assessment.clinicalPulseScore ?? 0}/100</span>
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
                                <p className="mt-2 text-xs text-slate-600">{localizeText("Doctor note", { zh: "医生备注", yue: "醫生備註", fr: "Note du medecin" })}: {assessment.answers.pulse_assessment.notes}</p>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                      {getUserTcmAssessments(selectedUser).length === 0 && (
                        <p className="text-gray-600">{localizeText("No TCM pulse reviews recorded for this user", { zh: "该用户暂无中医脉象评估记录", yue: "該用戶暫無中醫脈象評估記錄", fr: "Aucune revue MTC/pouls pour cet utilisateur" })}</p>
                      )}

                      <h3 className="text-lg font-semibold mt-6">{localizeText("Sensory Screenings", { zh: "感觉筛查", yue: "感官篩查", fr: "Depistages sensoriels" })}</h3>
                      {getUserSensoryAssessments(selectedUser).map((assessment) => (
                        <div key={assessment.id} className="border rounded-lg p-4 space-y-3 bg-amber-50/60">
                          <div className="flex justify-between items-center flex-wrap gap-2">
                            <Badge variant="outline" className="bg-amber-100 text-amber-800">
                              {assessment.test_type === "olfactory"
                                ? localizeText("Olfactory", { zh: "嗅觉", yue: "嗅覺", fr: "Olfactif" })
                                : assessment.test_type === "auditory"
                                  ? localizeText("Auditory", { zh: "听觉", yue: "聽覺", fr: "Auditif" })
                                  : localizeText("Visual", { zh: "视觉", yue: "視覺", fr: "Visuel" })}
                            </Badge>
                            <span className="text-sm text-gray-600">
                              {assessment.test_date
                                ? new Date(assessment.test_date).toLocaleDateString()
                                : localizeText("No date", { zh: "无日期", yue: "無日期", fr: "Sans date" })}
                            </span>
                          </div>
                          <p className="text-sm text-slate-700">
                            {localizeText("Raw score", { zh: "原始分", yue: "原始分", fr: "Score brut" })}: <span className="font-semibold">{assessment.raw_score ?? "-"}</span>
                            {assessment.test_type === "olfactory" ? " / 12" : ""}
                            {" • "}
                            {localizeText("Classification", { zh: "分级", yue: "分級", fr: "Classification" })}: <span className="font-semibold">{assessment.classification ?? "-"}</span>
                          </p>
                          {assessment.test_type === "olfactory" && assessment.test_data?.strip_results && (
                            <div className="rounded-lg border border-amber-200 bg-white/90 p-3">
                              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">{localizeText("Patient strip responses", { zh: "患者试纸作答", yue: "患者試紙作答", fr: "Reponses patient par bande" })}</p>
                              <div className="mt-2 grid gap-2 sm:grid-cols-2">
                                {assessment.test_data.strip_results.map((result) => (
                                  <div
                                    key={`${assessment.id}-${result.strip}`}
                                    className={`rounded-md border p-2 text-xs ${result.correct ? "border-emerald-200 bg-emerald-50/70 text-emerald-800" : "border-rose-200 bg-rose-50/70 text-rose-800"}`}
                                  >
                                    <div className="flex items-center justify-between gap-2">
                                      <div className="font-semibold">{localizeText("Strip", { zh: "试纸", yue: "試紙", fr: "Bande" })} #{result.strip}</div>
                                      <Badge variant="outline" className={result.correct ? "border-emerald-300 bg-white text-emerald-700" : "border-rose-300 bg-white text-rose-700"}>
                                        {result.correct
                                          ? localizeText("Correct", { zh: "正确", yue: "正確", fr: "Correct" })
                                          : result.timedOut
                                            ? localizeText("Timed out", { zh: "超时", yue: "超時", fr: "Temps ecoule" })
                                            : localizeText("Review", { zh: "复核", yue: "覆核", fr: "Verifier" })}
                                      </Badge>
                                    </div>
                                    <div>{localizeText("Selected", { zh: "选择", yue: "選擇", fr: "Selection" })}: {getOlfactoryLabel(result.selected)}</div>
                                    <div>{localizeText("Correct", { zh: "正确", yue: "正確", fr: "Correct" })}: {getOlfactoryLabel(result.correctAnswer)}</div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                      {getUserSensoryAssessments(selectedUser).length === 0 && (
                        <p className="text-gray-600">{localizeText("No sensory screenings recorded for this user", { zh: "该用户暂无感觉筛查记录", yue: "該用戶暫無感官篩查記錄", fr: "Aucun depistage sensoriel pour cet utilisateur" })}</p>
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
                              <h3 className="text-lg font-semibold text-emerald-950">{localizeText("TCM Doctor Review Pack", { zh: "中医医生审核包", yue: "中醫醫生審核包", fr: "Pack de revue medecin MTC" })}</h3>
                              <Badge className="bg-emerald-600 text-white hover:bg-emerald-600">
                                {localizeText("Doctor workspace", { zh: "医生工作区", yue: "醫生工作區", fr: "Espace medecin" })}
                              </Badge>
                            </div>
                            <p className="mt-2 text-sm text-slate-600">
                              {localizeText(
                                "Review tongue and face images, questionnaire constitution data, and existing remarks before finalizing the patient report.",
                                {
                                  zh: "在生成患者报告前，先审核舌象、面诊图像、问卷体质数据及已有医生备注。",
                                  yue: "在生成患者報告前，先審核舌象、面診圖像、問卷體質數據及已有醫生備註。",
                                  fr: "Avant finalisation du rapport patient, verifier les images langue/visage, la constitution et les remarques existantes.",
                                },
                              )}
                            </p>

                            {/* Tongue and Face images */}
                            <div className="mt-4 grid gap-4 lg:grid-cols-2">
                              <div className="rounded-xl border border-emerald-100 bg-white p-4">
                                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">{localizeText("Tongue image", { zh: "舌象图像", yue: "舌象圖像", fr: "Image de la langue" })}</p>
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
                                  <p className="mt-3 text-sm text-slate-500">{localizeText("No tongue image uploaded for this patient.", { zh: "该患者未上传舌象图片。", yue: "該患者未上傳舌象圖片。", fr: "Aucune image de langue n'a ete televersee pour ce patient." })}</p>
                                )}
                              </div>

                              <div className="rounded-xl border border-emerald-100 bg-white p-4">
                                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">{localizeText("Face image", { zh: "面诊图像", yue: "面診圖像", fr: "Image du visage" })}</p>
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
                                  <p className="mt-3 text-sm text-slate-500">
                                    {localizeText("No face image uploaded for this patient.", {
                                      zh: "该患者未上传面诊图片。",
                                      yue: "該患者未上傳面診圖片。",
                                      fr: "Aucune image du visage n'a ete televersee pour ce patient.",
                                    })}
                                  </p>
                                )}
                              </div>
                            </div>

                            {/* TCM Questionnaire & Constitution */}
                            <div className="mt-4 grid gap-4 lg:grid-cols-2">
                              <div className="rounded-xl border border-emerald-100 bg-white p-4 text-sm text-slate-700">
                                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                                  {localizeText("TCM questionnaire and constitution", {
                                    zh: "中医问卷与体质",
                                    yue: "中醫問卷與體質",
                                    fr: "Questionnaire MTC et constitution",
                                  })}
                                </p>
                                {latestTcmAssessment ? (
                                  <div className="mt-3 space-y-3">
                                    <div className="rounded-lg bg-emerald-50 p-3">
                                      <p>{localizeText("Primary constitution", { zh: "主要体质", yue: "主要體質", fr: "Constitution principale" })}: <span className="font-semibold text-emerald-800">{latestTcmAssessment.primary_constitution ? getConstitutionLabelForLanguage(latestTcmAssessment.primary_constitution, reportLanguage) : "-"}</span></p>
                                      <p>{localizeText("Primary score", { zh: "主要体质分", yue: "主要體質分", fr: "Score principal" })}: <span className="font-semibold">{latestTcmAssessment.primary_score != null ? `${latestTcmAssessment.primary_score}%` : "-"}</span></p>
                                      <p>{localizeText("Overall balance score", { zh: "总体平衡分", yue: "總體平衡分", fr: "Score d'equilibre global" })}: <span className="font-semibold">{latestTcmAssessment.overall_score ?? "-"}/100</span></p>
                                      <p>{localizeText("Completed", { zh: "完成时间", yue: "完成時間", fr: "Termine le" })}: <span className="font-semibold">{latestTcmAssessment.completed_at ? new Date(latestTcmAssessment.completed_at).toLocaleString() : "-"}</span></p>
                                    </div>

                                    {/* All constitution scores */}
                                    {constitutionScores.length > 0 && (
                                      <div>
                                        <p className="text-xs font-semibold text-slate-500 mb-2">{localizeText("Constitution scores breakdown", { zh: "体质分数明细", yue: "體質分數明細", fr: "Detail des scores de constitution" })}</p>
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
                                        <p className="text-xs font-semibold text-slate-500 mb-1">{localizeText("Pulse assessment", { zh: "脉象评估", yue: "脈象評估", fr: "Evaluation du pouls" })}</p>
                                        <p>{localizeText("Severity", { zh: "严重度", yue: "嚴重度", fr: "Severite" })}: <span className="font-semibold">{latestTcmAssessment.answers.pulse_assessment.severity ?? 0}/10</span></p>
                                        <p>{localizeText("Clinical pulse score", { zh: "临床脉象分", yue: "臨床脈象分", fr: "Score clinique du pouls" })}: <span className="font-semibold">{latestTcmAssessment.answers.pulse_assessment.clinicalPulseScore ?? 0}/100</span></p>
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
                                          <p className="mt-2 text-xs text-slate-600">{localizeText("Note", { zh: "备注", yue: "備註", fr: "Note" })}: {latestTcmAssessment.answers.pulse_assessment.notes}</p>
                                        )}
                                      </div>
                                    )}

                                    {/* Full questionnaire Q&A per question */}
                                    {latestTcmAssessment.answers?.questionnaire && Object.keys(latestTcmAssessment.answers.questionnaire).length > 0 && (() => {
                                      const qa = latestTcmAssessment.answers!.questionnaire!
                                      const grouped: Record<string, Array<{ id: string; textZh: string; text: string; score: number }>> = {}
                                      for (const [qid, score] of Object.entries(qa)) {
                                        const q = TCM_QUESTIONS_MAP[qid]
                                        if (!q) continue
                                        if (!grouped[q.constitution]) grouped[q.constitution] = []
                                        grouped[q.constitution].push({ id: qid, textZh: q.textZh, text: q.text, score: score as number })
                                      }
                                      return (
                                        <div className="rounded-lg border border-slate-100 bg-slate-50/60 p-3">
                                          <p className="text-xs font-semibold text-slate-600 mb-2">{localizeText("Patient questionnaire responses", { zh: "患者问卷答案", yue: "患者問卷答案", fr: "Reponses au questionnaire patient" })}</p>
                                          <div className="space-y-3">
                                            {Object.entries(grouped).map(([constitution, items]) => (
                                              <div key={constitution}>
                                                <p className="text-xs font-semibold text-emerald-700 mb-1">{getConstitutionLabelForLanguage(constitution, reportLanguage)}</p>
                                                <div className="space-y-1">
                                                  {items.map((item) => (
                                                    <div key={item.id} className="flex items-start justify-between gap-2">
                                                      <span className="text-xs text-slate-600 flex-1">
                                                        {language === "en" ? item.text : language === "fr" ? item.text : item.textZh}
                                                      </span>
                                                      <Badge variant="outline" className={`text-xs shrink-0 ${item.score >= 4 ? "border-rose-200 bg-rose-50 text-rose-700" : item.score <= 2 ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-amber-200 bg-amber-50 text-amber-700"}`}>
                                                        {getLikertLabelForUi(item.score, language)}
                                                      </Badge>
                                                    </div>
                                                  ))}
                                                </div>
                                              </div>
                                            ))}
                                          </div>
                                        </div>
                                      )
                                    })()}

                                    {/* Patient-generated recommendations from questionnaire */}
                                    {latestTcmAssessment.recommendations && latestTcmAssessment.recommendations.length > 0 && (
                                      <div className="rounded-lg border border-amber-100 bg-amber-50/60 p-3">
                                        <p className="text-xs font-semibold text-amber-700 mb-2">{localizeText("Auto-generated recommendations (from questionnaire)", { zh: "自动生成建议（来自问卷）", yue: "自動生成建議（來自問卷）", fr: "Recommandations auto-generees (questionnaire)" })}</p>
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
                                  <p className="mt-3 text-sm text-slate-500">{localizeText("No TCM questionnaire assessment is available for this patient.", { zh: "该患者暂无中医问卷评估记录。", yue: "該患者暫無中醫問卷評估記錄。", fr: "Aucune evaluation du questionnaire MTC n'est disponible pour ce patient." })}</p>
                                )}
                              </div>

                              {/* Doctor remarks & recommendations */}
                              <div className="rounded-xl border border-emerald-100 bg-white p-4 text-sm text-slate-700">
                                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">{localizeText("Doctor remarks and recommendations", { zh: "医生备注与建议", yue: "醫生備註與建議", fr: "Remarques et recommandations du medecin" })}</p>
                                <div className="mt-3 space-y-2">
                                  <p>
                                    {localizeText("Constitution note", { zh: "体质备注", yue: "體質備註", fr: "Note constitution" })}: <span className="font-semibold">{existingDoctorReview?.tcm_constitution || tcmConstitutionInput || "-"}</span>
                                  </p>
                                  <p>
                                    {localizeText("Tongue remark", { zh: "舌象备注", yue: "舌象備註", fr: "Remarque langue" })}: <span className="font-semibold">{existingDoctorReview?.tongue_observation || tongueObservationInput || "-"}</span>
                                  </p>
                                  <p>
                                    {localizeText("Face remark", { zh: "面诊备注", yue: "面診備註", fr: "Remarque visage" })}: <span className="font-semibold">{existingDoctorReview?.face_observation || faceObservationInput || "-"}</span>
                                  </p>
                                  <p>
                                    {localizeText("Questionnaire interpretation", { zh: "问卷解读", yue: "問卷解讀", fr: "Interpretation du questionnaire" })}: <span className="font-semibold">{existingDoctorReview?.questionnaire_interpretation || questionnaireInterpretationInput || "-"}</span>
                                  </p>
                                  <p>
                                    {localizeText("TCM diagnosis", { zh: "中医诊断", yue: "中醫診斷", fr: "Diagnostic MTC" })}: <span className="font-semibold">{existingDoctorReview?.tcm_diagnosis || tcmDiagnosisInput || "-"}</span>
                                  </p>
                                  <p>
                                    {localizeText("Therapy plan", { zh: "治疗方案", yue: "治療方案", fr: "Plan therapeutique" })}: <span className="font-semibold">{existingDoctorReview?.therapy_plan || tcmTherapyPlanInput || "-"}</span>
                                  </p>
                                  <p>
                                    {localizeText("Dietary advice", { zh: "饮食建议", yue: "飲食建議", fr: "Conseil dietetique" })}: <span className="font-semibold">{existingDoctorReview?.dietary_advice || dietaryAdviceInput || "-"}</span>
                                  </p>
                                  <p>
                                    {localizeText("Follow-up recommendation", { zh: "随访建议", yue: "隨訪建議", fr: "Recommandation de suivi" })}: <span className="font-semibold">{existingDoctorReview?.follow_up_recommendation || followUpRecommendationInput || "-"}</span>
                                  </p>
                                  {!existingDoctorReview && (
                                    <p className="text-xs text-slate-400 italic mt-2">{localizeText("No doctor review saved yet. Use the form below to enter remarks.", { zh: "尚未保存医生评审，请使用下方表单填写备注。", yue: "尚未保存醫生評審，請使用下方表單填寫備註。", fr: "Aucune revue medecin enregistree. Utilisez le formulaire ci-dessous." })}</p>
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
                            {localizeText("Medical Report Studio", { zh: "医学报告工作台", yue: "醫學報告工作台", fr: "Studio de rapport medical" })}
                          </h3>
                          <Badge className="bg-sky-600 text-white hover:bg-sky-600">{localizeText("Premium", { zh: "高级", yue: "高級", fr: "Premium" })}</Badge>
                        </div>
                        <p className="mt-2 text-sm text-slate-600">
                          {localizeText(
                            "Individualized report workflow: doctor reviews each patient, approves, then publishes for patient download.",
                            {
                              zh: "个体化报告流程：医生逐一审核患者，完成审批后发布给患者下载。",
                              yue: "個體化報告流程：醫生逐一審核患者，完成審批後發布給患者下載。",
                              fr: "Flux personnalise: le medecin revoit, approuve puis publie pour telechargement patient.",
                            },
                          )}
                        </p>

                        <div className="mt-3 rounded-lg border border-slate-200 bg-white p-3 text-xs text-slate-600">
                          {localizeText("Current status", { zh: "当前状态", yue: "當前狀態", fr: "Statut actuel" })}: <span className="font-semibold">{getReportStatusLabel(currentSelectedReportStatus)}</span>
                          {currentSelectedReportStatus !== "published_to_patient" && (
                            <p className="mt-1 text-slate-500">
                              {localizeText("Patient download remains locked until status is published_to_patient.", {
                                zh: "患者下载将在状态变为“已发布给患者”后解锁。",
                                yue: "患者下載將在狀態變為「已發布給患者」後解鎖。",
                                fr: "Le telechargement patient reste verrouille jusqu'au statut Publie au patient.",
                              })}
                            </p>
                          )}
                        </div>

                        <div className="mt-4 grid gap-4 md:grid-cols-3">
                          <div className="space-y-2 md:col-span-1">
                            <Label htmlFor="report-language">{localizeText("Report language", { zh: "报告语言", yue: "報告語言", fr: "Langue du rapport" })}</Label>
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
                            <Label htmlFor="doctor-name">{localizeText("Doctor name", { zh: "医生姓名", yue: "醫生姓名", fr: "Nom du medecin" })}</Label>
                            <AssessmentInput
                              id="doctor-name"
                              value={doctorNameInput}
                              onChange={(event) => setDoctorNameInput(event.target.value)}
                              placeholder={localizeText("TCM doctor name", { zh: "请输入中医医生姓名", yue: "請輸入中醫醫生姓名", fr: "Nom du medecin MTC" })}
                            />
                          </div>

                          <div className="space-y-2 md:col-span-1">
                            <Label htmlFor="review-date">{localizeText("Review date", { zh: "评审日期", yue: "評審日期", fr: "Date de revue" })}</Label>
                            <AssessmentInput
                              id="review-date"
                              type="date"
                              value={reviewDateInput}
                              onChange={(event) => setReviewDateInput(event.target.value)}
                            />
                          </div>

                          <div className="space-y-2 md:col-span-3">
                            <Label htmlFor="tcm-constitution">{localizeText("TCM constitution", { zh: "中医体质", yue: "中醫體質", fr: "Constitution MTC" })}</Label>
                            <AssessmentTextarea
                              id="tcm-constitution"
                              value={tcmConstitutionInput}
                              onChange={(event) => setTcmConstitutionInput(event.target.value)}
                              placeholder={localizeText("Describe constitution type and rationale", { zh: "描述体质类型及判断依据", yue: "描述體質類型及判斷依據", fr: "Decrire le type de constitution et son raisonnement" })}
                              rows={2}
                            />
                          </div>

                          <div className="space-y-2 md:col-span-3">
                            <Label htmlFor="tongue-observation">{localizeText("Tongue observation", { zh: "舌象观察", yue: "舌象觀察", fr: "Observation de la langue" })}</Label>
                            <AssessmentTextarea
                              id="tongue-observation"
                              value={tongueObservationInput}
                              onChange={(event) => setTongueObservationInput(event.target.value)}
                              placeholder={localizeText("Color, coating, moisture, fissures", { zh: "颜色、舌苔、湿润度、裂纹", yue: "顏色、舌苔、濕潤度、裂紋", fr: "Couleur, enduit, humidite, fissures" })}
                              rows={2}
                            />
                          </div>

                          <div className="space-y-2 md:col-span-3">
                            <Label htmlFor="face-observation">{localizeText("Face observation", { zh: "面诊观察", yue: "面診觀察", fr: "Observation du visage" })}</Label>
                            <AssessmentTextarea
                              id="face-observation"
                              value={faceObservationInput}
                              onChange={(event) => setFaceObservationInput(event.target.value)}
                              placeholder={localizeText("Complexion, eye region, expression patterns", { zh: "面色、眼周、神情特征", yue: "面色、眼周、神情特徵", fr: "Teint, zone oculaire, expressions" })}
                              rows={2}
                            />
                          </div>

                          <div className="space-y-2 md:col-span-3">
                            <Label htmlFor="questionnaire-interpretation">{localizeText("Pulse/questionnaire interpretation", { zh: "脉象/问卷解读", yue: "脈象/問卷解讀", fr: "Interpretation pouls/questionnaire" })}</Label>
                            <AssessmentTextarea
                              id="questionnaire-interpretation"
                              value={questionnaireInterpretationInput}
                              onChange={(event) => setQuestionnaireInterpretationInput(event.target.value)}
                              placeholder={localizeText("Interpret questionnaire and pulse indicators", { zh: "解读问卷与脉象指标", yue: "解讀問卷與脈象指標", fr: "Interpreter les indicateurs du questionnaire et du pouls" })}
                              rows={2}
                            />
                          </div>

                          <div className="space-y-2 md:col-span-3">
                            <Label htmlFor="tcm-diagnosis">{localizeText("TCM diagnosis", { zh: "中医诊断", yue: "中醫診斷", fr: "Diagnostic MTC" })}</Label>
                            <AssessmentTextarea
                              id="tcm-diagnosis"
                              value={tcmDiagnosisInput}
                              onChange={(event) => setTcmDiagnosisInput(event.target.value)}
                              placeholder={localizeText("Enter TCM diagnosis", { zh: "填写中医诊断", yue: "填寫中醫診斷", fr: "Saisir le diagnostic MTC" })}
                              rows={2}
                            />
                          </div>
                        </div>

                        <div className="mt-4 space-y-2">
                          <Label htmlFor="tcm-therapy-plan">{localizeText("TCM therapy and regimen plan", { zh: "中医治疗与调理方案", yue: "中醫治療與調理方案", fr: "Plan therapeutique et regimen MTC" })}</Label>
                          <AssessmentTextarea
                            id="tcm-therapy-plan"
                            value={tcmTherapyPlanInput}
                            onChange={(event) => setTcmTherapyPlanInput(event.target.value)}
                            placeholder={localizeText("Herbs, acupuncture frequency, lifestyle, follow-up interval", { zh: "中药、针灸频次、生活方式、随访周期", yue: "中藥、針灸頻次、生活方式、隨訪週期", fr: "Plantes, frequence d'acupuncture, mode de vie, intervalle de suivi" })}
                            rows={3}
                          />
                        </div>

                        <div className="mt-4 space-y-2">
                          <Label htmlFor="dietary-advice">{localizeText("Dietary advice", { zh: "饮食建议", yue: "飲食建議", fr: "Conseil dietetique" })}</Label>
                          <AssessmentTextarea
                            id="dietary-advice"
                            value={dietaryAdviceInput}
                            onChange={(event) => setDietaryAdviceInput(event.target.value)}
                            placeholder={localizeText("Food strategy and restrictions", { zh: "饮食策略与禁忌", yue: "飲食策略與禁忌", fr: "Strategie alimentaire et restrictions" })}
                            rows={2}
                          />
                        </div>

                        <div className="mt-4 space-y-2">
                          <Label htmlFor="follow-up-recommendation">{localizeText("Follow-up recommendation", { zh: "随访建议", yue: "隨訪建議", fr: "Recommandation de suivi" })}</Label>
                          <AssessmentTextarea
                            id="follow-up-recommendation"
                            value={followUpRecommendationInput}
                            onChange={(event) => setFollowUpRecommendationInput(event.target.value)}
                            placeholder={localizeText("Follow-up schedule and escalation criteria", { zh: "随访计划与升级处理标准", yue: "隨訪計劃與升級處理標準", fr: "Calendrier de suivi et criteres d'escalade" })}
                            rows={2}
                          />
                        </div>

                        <div className="mt-4 space-y-2">
                          <Label htmlFor="final-summary">{localizeText("Final clinical summary", { zh: "最终临床总结", yue: "最終臨床總結", fr: "Synthese clinique finale" })}</Label>
                          <AssessmentTextarea
                            id="final-summary"
                            value={finalSummaryInput}
                            onChange={(event) => setFinalSummaryInput(event.target.value)}
                            placeholder={localizeText("Integrated recommendation combining neurology + TCM", { zh: "神经科与中医结合的综合建议", yue: "神經科與中醫結合的綜合建議", fr: "Recommandation integree neurologie + MTC" })}
                            rows={3}
                          />
                        </div>

                        <div className="mt-4 flex flex-wrap gap-2">
                          <Button onClick={() => saveDoctorReview("draft")} variant="outline">
                            {localizeText("Save TCM draft", { zh: "保存中医草稿", yue: "保存中醫草稿", fr: "Enregistrer le brouillon MTC" })}
                          </Button>
                          <Button onClick={() => saveDoctorReview("reviewed")} variant="outline">
                            {localizeText("Mark TCM reviewed", { zh: "标记为中医已审核", yue: "標記為中醫已審核", fr: "Marquer revue MTC terminee" })}
                          </Button>
                          <Button onClick={() => updateReportStatus("approved")} variant="outline">
                            {localizeText("Approve final report", { zh: "批准最终报告", yue: "批准最終報告", fr: "Approuver le rapport final" })}
                          </Button>
                          <Button onClick={() => updateReportStatus("pending_final_approval")} variant="outline">
                            {localizeText("Send to final approval", { zh: "提交最终审批", yue: "提交最終審批", fr: "Envoyer pour approbation finale" })}
                          </Button>
                          <Button
                            onClick={() => updateReportStatus("published_to_patient")}
                            variant="outline"
                            disabled={!canPublishToPatient}
                          >
                            {localizeText("Publish to patient", { zh: "发布给患者", yue: "發布給患者", fr: "Publier au patient" })}
                          </Button>
                        </div>

                        {workflowMessage && (
                          <p className="mt-2 text-xs text-slate-600">{workflowMessage}</p>
                        )}

                        <div className="mt-4 flex flex-wrap gap-2">
                          <Button onClick={handleGenerateReport}>
                            <FileText className="mr-2 h-4 w-4" />
                            {localizeText("Generate report draft", { zh: "生成报告草稿", yue: "生成報告草稿", fr: "Generer le brouillon du rapport" })}
                          </Button>
                          <Button onClick={handleDownloadReport} variant="outline" disabled={!generatedReport}>
                            <Download className="mr-2 h-4 w-4" />
                            {localizeText("Download report", { zh: "下载报告", yue: "下載報告", fr: "Telecharger le rapport" })}
                          </Button>
                          <Button onClick={handlePrintReport} variant="outline" disabled={!selectedUser}>
                            <Printer className="mr-2 h-4 w-4" />
                            {localizeText("Print", { zh: "打印", yue: "列印", fr: "Imprimer" })}
                          </Button>
                        </div>

                        <div className="mt-4 flex flex-wrap gap-2">
                          <Button onClick={handleGenerateAllReports} variant="secondary">
                            <Sparkles className="mr-2 h-4 w-4" />
                            {localizeText("Generate all patient reports", { zh: "生成全部患者报告", yue: "生成全部患者報告", fr: "Generer tous les rapports patient" })}
                          </Button>
                          <Button onClick={handleDownloadAllReports} variant="outline" disabled={!generatedAllReports}>
                            <Download className="mr-2 h-4 w-4" />
                            {localizeText("Download all reports", { zh: "下载全部报告", yue: "下載全部報告", fr: "Telecharger tous les rapports" })}
                          </Button>
                          <Button onClick={handlePrintAllReports} variant="outline" disabled={users.length === 0}>
                            <Printer className="mr-2 h-4 w-4" />
                            {localizeText("Print all reports", { zh: "打印全部报告", yue: "列印全部報告", fr: "Imprimer tous les rapports" })}
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

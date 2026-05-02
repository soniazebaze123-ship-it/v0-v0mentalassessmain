export type LanguageCode = "en" | "zh" | "yue" | "fr"

export type RiskLevel = "normal" | "mild" | "high"

export type OlfactoryProtocolVersion = "temp_v1" | "sat_v2"

export type OlfactoryScentKey =
  | "orange"
  | "leather"
  | "cinnamon"
  | "peppermint"
  | "banana"
  | "lemon"
  | "licorice"
  | "coffee"
  | "cloves"
  | "pineapple"
  | "rose"
  | "fish"

export interface OlfactoryOption {
  key: OlfactoryScentKey
  label: Record<LanguageCode, string>
}

export interface OlfactoryQuestion {
  id: number
  scent: OlfactoryScentKey
  imagePath: string
  questionCode: string
  codeDescription: Record<LanguageCode, string>
  prompt: Record<LanguageCode, string>
  options: OlfactoryOption[]
  correctAnswer: OlfactoryScentKey
}

export interface OlfactoryResponseItem {
  questionId: number
  scent: OlfactoryScentKey
  selectedAnswer: OlfactoryScentKey | null
  correctAnswer: OlfactoryScentKey
  isCorrect: boolean
  confidence: 1 | 2 | 3 | null
  responseTimeMs: number | null
}

export interface OlfactoryTestResult {
  totalQuestions: number
  correctCount: number
  scorePercent: number
  riskLevel: RiskLevel
  interpretation: Record<LanguageCode, string>
  items: OlfactoryResponseItem[]
}

export interface OlfactorySubmission {
  patientId?: string
  language: LanguageCode
  testName: string
  testedAt: string
  protocolVersion?: OlfactoryProtocolVersion
  itemSetVersion?: string
  scoringVersion?: string
  notes?: string
  result: OlfactoryTestResult
}

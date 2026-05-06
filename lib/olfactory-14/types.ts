export type Olfactory14LanguageCode = "en" | "zh" | "yue" | "fr"

export type Olfactory14RiskLevel = "normal" | "mild" | "high"

export type Olfactory14ScentKey =
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
  | "ginger"
  | "alcohol"

export interface Olfactory14Option {
  key: Olfactory14ScentKey
  label: Record<Olfactory14LanguageCode, string>
}

export interface Olfactory14Question {
  id: number
  scent: Olfactory14ScentKey
  prompt: Record<Olfactory14LanguageCode, string>
  options: Olfactory14Option[]
  correctAnswer: Olfactory14ScentKey
}

export interface Olfactory14ResponseItem {
  questionId: number
  scent: Olfactory14ScentKey
  selectedAnswer: Olfactory14ScentKey | null
  correctAnswer: Olfactory14ScentKey
  isCorrect: boolean
  confidence: 1 | 2 | 3 | null
  responseTimeMs: number | null
}

export interface Olfactory14TestResult {
  totalQuestions: number
  correctCount: number
  scorePercent: number
  riskLevel: Olfactory14RiskLevel
  interpretation: Record<Olfactory14LanguageCode, string>
  items: Olfactory14ResponseItem[]
}

export interface Olfactory14Submission {
  patientId?: string
  language: Olfactory14LanguageCode
  testName: string
  testedAt: string
  notes?: string
  result: Olfactory14TestResult
}

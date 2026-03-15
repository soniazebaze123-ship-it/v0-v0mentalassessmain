// ============================================================
// TCM DIAGNOSTIC CONSTITUTION ASSESSMENT & SENSORY SCREENING
// Standalone Copy - Visual, Hearing, Olfactory Tests + TCM
// ============================================================
// This file contains a complete copy of the TCM and Sensory
// screening functionality extracted from the NeuroSense app.
// It can be used as reference or adapted for a new project.
// ============================================================

// ============================================================
// SECTION 1: TYPE DEFINITIONS
// ============================================================

export type TestType = "visual" | "hearing" | "olfactory" | "tcm"
export type RiskLevel = "low" | "moderate" | "high"
export type TumblingEDirection = "up" | "down" | "left" | "right"

// ---- Device & Environment ----

export interface DeviceInfo {
  userAgent: string
  screenWidth: number
  screenHeight: number
  pixelRatio: number
}

export interface EnvironmentData {
  ambientNoiseDBA?: number
  headphoneConfirmed?: boolean
  calibrationPPI?: number
}

// ---- User Profile ----

export interface UserProfile {
  id: string
  name: string
  age?: number
  createdAt: string
  deviceInfo: DeviceInfo
}

// ---- Visual Test ----

export interface VisualCalibration {
  ppi: number
  viewingDistanceCm: number
}

export interface VisualTrialResponse {
  trialIndex: number
  logMAR: number
  presented: TumblingEDirection
  responded: TumblingEDirection
  correct: boolean
  reactionTimeMs: number
}

export interface VisualTestResult {
  calibration: VisualCalibration
  trials: VisualTrialResponse[]
  finalLogMAR: number
  subscore: number
  classification: "normal" | "impaired"
}

// ---- Hearing Test ----

export interface HearingTrialResponse {
  trialIndex: number
  snrDB: number
  digitsPresented: number[]
  digitsResponded: number[]
  correct: boolean
}

export interface HearingTestResult {
  headphoneCheck: boolean
  ambientNoiseDBA: number
  volumeCalibrated: boolean
  trials: HearingTrialResponse[]
  srtDB: number
  subscore: number
  classification: "normal" | "impaired"
}

// ---- Olfactory Test ----

export type OlfactoryMode = "home" | "card"

export interface OlfactoryTrialResponse {
  itemIndex: number
  itemName: string
  correctAnswer: string
  selectedAnswer: string
  correct: boolean
  reactionTimeMs: number
}

export interface OlfactoryTestResult {
  mode: OlfactoryMode
  trials: OlfactoryTrialResponse[]
  rawScore: number
  totalItems: number
  subscore: number
  classification: "normal" | "dysfunction"
}

// ---- TCM Diagnostics ----

export type TCMConstitution =
  | "balanced"
  | "qi_deficiency"
  | "yang_deficiency"
  | "yin_deficiency"
  | "phlegm_dampness"
  | "damp_heat"
  | "blood_stasis"
  | "qi_stagnation"
  | "special_constitution"

export interface TCMQuestionResponse {
  questionId: string
  value: number // 1-5 Likert
}

export interface TCMTestResult {
  responses: TCMQuestionResponse[]
  constitutionScores: Record<TCMConstitution, number>
  primaryConstitution: TCMConstitution
  secondaryConstitution?: TCMConstitution
  subscore: number
  recommendations: string[]
}

// ---- Test Session (generic wrapper) ----

export interface TestSession {
  id: string
  userId: string
  timestamp: string
  type: TestType
  deviceInfo: DeviceInfo
  environmentData: EnvironmentData
  result:
    | VisualTestResult
    | HearingTestResult
    | OlfactoryTestResult
    | TCMTestResult
  computedScore: number
  classification: string
}

// ============================================================
// SECTION 2: CONSTANTS & TEST DATA
// ============================================================

// ---- Risk Level Thresholds ----

export const RISK_THRESHOLDS = {
  low: 25,
  moderate: 45,
} as const

// ---- Visual Test Constants ----

export const CREDIT_CARD_WIDTH_MM = 85.6
export const CREDIT_CARD_HEIGHT_MM = 53.98
export const DEFAULT_VIEWING_DISTANCE_CM = 40
export const VISUAL_NORMAL_THRESHOLD = 0.3 // logMAR
export const LOGMAR_START = 1.0
export const LOGMAR_MIN = -0.3
export const LOGMAR_STEP = 0.1
export const VISUAL_MAX_TRIALS = 30
export const VISUAL_MIN_TRIALS = 15

// ---- Hearing Test Constants ----

export const DIN_START_SNR = 0 // dB SNR
export const DIN_SNR_STEP = 2 // dB step size
export const DIN_MAX_TRIALS = 23
export const DIN_MIN_TRIALS = 15
export const DIN_NORMAL_THRESHOLD = -6 // dB SNR
export const AMBIENT_NOISE_MAX_DBA = 45
export const REFERENCE_TONE_HZ = 1000
export const HEADPHONE_CHECK_HZ = 440
export const HEADPHONE_CHECK_DURATION = 1.0 // seconds

// ---- Olfactory Test Constants ----

export const OLFACTORY_NORMAL_THRESHOLD = 9 // out of 12
export const OLFACTORY_TIME_LIMIT_SEC = 30

export interface OlfactoryItem {
  name: string
  instruction: string
  correctAnswer: string
  distractors: string[]
}

export const OLFACTORY_HOME_ITEMS: OlfactoryItem[] = [
  {
    name: "Coffee",
    instruction: "Smell the coffee grounds or fresh coffee",
    correctAnswer: "Coffee",
    distractors: ["Tea", "Cocoa", "Cinnamon"],
  },
  {
    name: "Lemon",
    instruction: "Smell a fresh lemon or lemon peel",
    correctAnswer: "Lemon / Citrus",
    distractors: ["Apple", "Grape", "Strawberry"],
  },
  {
    name: "Peppermint",
    instruction: "Smell peppermint leaves or extract",
    correctAnswer: "Mint / Peppermint",
    distractors: ["Basil", "Eucalyptus", "Grass"],
  },
  {
    name: "Vinegar",
    instruction: "Carefully smell white vinegar (keep at arm's length)",
    correctAnswer: "Vinegar",
    distractors: ["Lemon juice", "Rubbing alcohol", "Soda water"],
  },
  {
    name: "Peanut Butter",
    instruction: "Smell a spoonful of peanut butter",
    correctAnswer: "Peanut Butter",
    distractors: ["Almond butter", "Chocolate spread", "Honey"],
  },
  {
    name: "Cinnamon",
    instruction: "Smell ground cinnamon or a cinnamon stick",
    correctAnswer: "Cinnamon",
    distractors: ["Nutmeg", "Ginger", "Clove"],
  },
  {
    name: "Garlic",
    instruction: "Smell a fresh garlic clove (peeled)",
    correctAnswer: "Garlic",
    distractors: ["Onion", "Ginger", "Horseradish"],
  },
  {
    name: "Vanilla",
    instruction: "Smell vanilla extract or vanilla bean",
    correctAnswer: "Vanilla",
    distractors: ["Caramel", "Butterscotch", "Almond"],
  },
  {
    name: "Soap",
    instruction: "Smell a bar of soap or hand soap",
    correctAnswer: "Soap / Lavender",
    distractors: ["Detergent", "Perfume", "Shampoo"],
  },
  {
    name: "Banana",
    instruction: "Smell a ripe banana (peeled)",
    correctAnswer: "Banana",
    distractors: ["Mango", "Pineapple", "Peach"],
  },
  {
    name: "Chocolate",
    instruction: "Smell a piece of dark or milk chocolate",
    correctAnswer: "Chocolate",
    distractors: ["Coffee", "Caramel", "Cinnamon"],
  },
  {
    name: "Rose / Perfume",
    instruction: "Smell a flower, rose petal, or floral perfume",
    correctAnswer: "Rose / Floral",
    distractors: ["Lavender", "Jasmine", "Vanilla"],
  },
]

export const OLFACTORY_CARD_ITEMS: OlfactoryItem[] = Array.from(
  { length: 12 },
  (_, i) => ({
    name: `Card ${i + 1}`,
    instruction: `Scratch and smell Card ${i + 1}`,
    correctAnswer: OLFACTORY_HOME_ITEMS[i].correctAnswer,
    distractors: OLFACTORY_HOME_ITEMS[i].distractors,
  })
)

// ---- TCM Constants ----

export const TCM_CONSTITUTIONS: {
  type: TCMConstitution
  name: string
  description: string
  recommendations: string[]
}[] = [
  {
    type: "balanced",
    name: "Balanced (Ping He)",
    description:
      "Energetic, resilient, good sleep and digestion, positive outlook",
    recommendations: [
      "Maintain balanced diet",
      "Regular moderate exercise",
      "Consistent sleep schedule",
    ],
  },
  {
    type: "qi_deficiency",
    name: "Qi Deficiency (Qi Xu)",
    description:
      "Easily fatigued, shortness of breath, weak voice, prone to colds",
    recommendations: [
      "Eat warm, cooked foods",
      "Gentle exercises like tai chi",
      "Avoid overexertion",
      "Consider ginseng or astragalus tea",
    ],
  },
  {
    type: "yang_deficiency",
    name: "Yang Deficiency (Yang Xu)",
    description:
      "Cold hands/feet, prefers warmth, pale complexion, low energy",
    recommendations: [
      "Eat warming foods (ginger, lamb, cinnamon)",
      "Keep warm, especially lower back and feet",
      "Moderate exercise in sunlight",
      "Avoid cold and raw foods",
    ],
  },
  {
    type: "yin_deficiency",
    name: "Yin Deficiency (Yin Xu)",
    description:
      "Dry skin/mouth, night sweats, warm palms/soles, restlessness",
    recommendations: [
      "Eat nourishing, moistening foods (pears, lily bulb)",
      "Avoid spicy and fried foods",
      "Practice meditation and relaxation",
      "Stay hydrated",
    ],
  },
  {
    type: "phlegm_dampness",
    name: "Phlegm-Dampness (Tan Shi)",
    description:
      "Heavy body, oily skin, chest tightness, prone to weight gain",
    recommendations: [
      "Light, bland diet",
      "Reduce dairy and greasy foods",
      "Regular aerobic exercise",
      "Consider barley or Job's tears tea",
    ],
  },
  {
    type: "damp_heat",
    name: "Damp-Heat (Shi Re)",
    description: "Oily face, bitter taste, yellow urine, irritability",
    recommendations: [
      "Eat cooling foods (mung bean, bitter melon)",
      "Avoid alcohol, spicy, and fried foods",
      "Exercise to promote sweating",
      "Keep environment cool and dry",
    ],
  },
  {
    type: "blood_stasis",
    name: "Blood Stasis (Xue Yu)",
    description: "Dark complexion, tendency to bruise, fixed pain locations",
    recommendations: [
      "Exercise regularly to promote circulation",
      "Eat blood-moving foods (hawthorn, turmeric)",
      "Avoid cold foods and environments",
      "Consider light massage or acupressure",
    ],
  },
  {
    type: "qi_stagnation",
    name: "Qi Stagnation (Qi Yu)",
    description:
      "Emotional fluctuations, sighing, chest/flank distension, stress-prone",
    recommendations: [
      "Regular physical activity",
      "Practice stress relief (meditation, breathing)",
      "Eat fragrant, qi-moving foods (citrus peel, mint)",
      "Socialize and engage in hobbies",
    ],
  },
  {
    type: "special_constitution",
    name: "Special Constitution (Te Bing)",
    description:
      "Allergic reactions, sensitive to medications, seasonal symptoms",
    recommendations: [
      "Identify and avoid allergens",
      "Strengthen immunity with balanced nutrition",
      "Gradual exposure to build tolerance",
      "Consult TCM practitioner for personalized advice",
    ],
  },
]

export interface TCMQuestion {
  id: string
  text: string
  constitution: TCMConstitution
}

export const TCM_QUESTIONS: TCMQuestion[] = [
  // Qi Deficiency
  {
    id: "qi1",
    text: "Do you feel tired or fatigued easily?",
    constitution: "qi_deficiency",
  },
  {
    id: "qi2",
    text: "Do you get short of breath or feel breathless with minimal effort?",
    constitution: "qi_deficiency",
  },
  {
    id: "qi3",
    text: "Do you catch colds more often than others?",
    constitution: "qi_deficiency",
  },
  // Yang Deficiency
  {
    id: "yang1",
    text: "Do your hands and feet often feel cold?",
    constitution: "yang_deficiency",
  },
  {
    id: "yang2",
    text: "Do you prefer warm drinks and food over cold?",
    constitution: "yang_deficiency",
  },
  {
    id: "yang3",
    text: "Do you feel cold when others feel comfortable?",
    constitution: "yang_deficiency",
  },
  // Yin Deficiency
  {
    id: "yin1",
    text: "Do you experience dry eyes, mouth, or skin?",
    constitution: "yin_deficiency",
  },
  {
    id: "yin2",
    text: "Do you have warm palms, soles, or chest area?",
    constitution: "yin_deficiency",
  },
  {
    id: "yin3",
    text: "Do you experience night sweats?",
    constitution: "yin_deficiency",
  },
  // Phlegm-Dampness
  {
    id: "pd1",
    text: "Does your body feel heavy or sluggish?",
    constitution: "phlegm_dampness",
  },
  {
    id: "pd2",
    text: "Is your skin or face oily?",
    constitution: "phlegm_dampness",
  },
  {
    id: "pd3",
    text: "Do you feel tightness or fullness in your chest or abdomen?",
    constitution: "phlegm_dampness",
  },
  // Damp-Heat
  {
    id: "dh1",
    text: "Do you often have a bitter or unusual taste in your mouth?",
    constitution: "damp_heat",
  },
  {
    id: "dh2",
    text: "Is your face often oily or prone to acne?",
    constitution: "damp_heat",
  },
  {
    id: "dh3",
    text: "Do you feel irritable or easily angered?",
    constitution: "damp_heat",
  },
  // Blood Stasis
  {
    id: "bs1",
    text: "Do you bruise easily?",
    constitution: "blood_stasis",
  },
  {
    id: "bs2",
    text: "Do you have dark circles under your eyes?",
    constitution: "blood_stasis",
  },
  {
    id: "bs3",
    text: "Do you experience fixed, stabbing pain in specific areas?",
    constitution: "blood_stasis",
  },
  // Qi Stagnation
  {
    id: "qs1",
    text: "Do you often feel anxious, depressed, or emotionally unstable?",
    constitution: "qi_stagnation",
  },
  {
    id: "qs2",
    text: "Do you sigh frequently or feel tightness in your chest?",
    constitution: "qi_stagnation",
  },
  {
    id: "qs3",
    text: "Does your mood fluctuate with stress?",
    constitution: "qi_stagnation",
  },
  // Special Constitution
  {
    id: "sc1",
    text: "Do you have allergies (skin, respiratory, or food)?",
    constitution: "special_constitution",
  },
  {
    id: "sc2",
    text: "Are you sensitive to medications or environmental changes?",
    constitution: "special_constitution",
  },
  {
    id: "sc3",
    text: "Do you experience seasonal symptoms (hay fever, skin issues)?",
    constitution: "special_constitution",
  },
  // Balanced (reverse-scored — high = balanced)
  {
    id: "bal1",
    text: "Do you generally feel energetic and refreshed?",
    constitution: "balanced",
  },
  {
    id: "bal2",
    text: "Is your sleep restful and your appetite normal?",
    constitution: "balanced",
  },
  {
    id: "bal3",
    text: "Do you adapt well to environmental changes?",
    constitution: "balanced",
  },
]

// ============================================================
// SECTION 3: SCORING FUNCTIONS
// ============================================================

// ---- Visual Subscore ----

export function calculateVisualSubscore(logMAR: number): number {
  // Lower logMAR = better vision. 0.0 = 20/20, 1.0 = 20/200
  return Math.max(0, Math.min(100, 100 - logMAR * 100))
}

// ---- Hearing Subscore ----

export function calculateHearingSubscore(srtDB: number): number {
  // Lower SRT = better hearing. -10 dB is excellent, +5 is poor
  return Math.max(0, Math.min(100, 50 - srtDB * 5))
}

// ---- Olfactory Subscore ----

export function calculateOlfactorySubscore(
  correct: number,
  total: number
): number {
  return Math.round((correct / total) * 100)
}

// ---- Risk Level Helpers ----

export function getRiskLabel(level: RiskLevel): string {
  switch (level) {
    case "low":
      return "Low Risk"
    case "moderate":
      return "Moderate Risk"
    case "high":
      return "High Risk"
  }
}

export function getScoreRiskLevel(score: number): RiskLevel {
  const risk = 100 - score
  if (risk > RISK_THRESHOLDS.moderate) return "high"
  if (risk > RISK_THRESHOLDS.low) return "moderate"
  return "low"
}

// ============================================================
// SECTION 4: AUDIO UTILITIES (for Hearing Test)
// ============================================================

let audioContext: AudioContext | null = null

export function getAudioContext(): AudioContext {
  if (!audioContext || audioContext.state === "closed") {
    audioContext = new AudioContext()
  }
  if (audioContext.state === "suspended") {
    audioContext.resume()
  }
  return audioContext
}

// ---- Play a pure tone ----

export function playTone(
  frequencyHz: number,
  durationSec: number,
  gainValue: number = 0.3,
  pan: number = 0 // -1 left, 0 center, 1 right
): Promise<void> {
  return new Promise((resolve) => {
    const ctx = getAudioContext()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    const panner = ctx.createStereoPanner()

    osc.type = "sine"
    osc.frequency.value = frequencyHz
    gain.gain.value = gainValue
    panner.pan.value = pan

    osc.connect(gain)
    gain.connect(panner)
    panner.connect(ctx.destination)

    osc.start()
    osc.stop(ctx.currentTime + durationSec)

    osc.onended = () => {
      osc.disconnect()
      gain.disconnect()
      panner.disconnect()
      resolve()
    }
  })
}

// ---- Generate white noise buffer ----

export function createWhiteNoiseBuffer(
  durationSec: number,
  sampleRate?: number
): AudioBuffer {
  const ctx = getAudioContext()
  const sr = sampleRate || ctx.sampleRate
  const bufferSize = sr * durationSec
  const buffer = ctx.createBuffer(1, bufferSize, sr)
  const data = buffer.getChannelData(0)

  for (let i = 0; i < bufferSize; i++) {
    data[i] = Math.random() * 2 - 1
  }

  return buffer
}

// ---- Play noise with gain control ----

export function playNoise(
  buffer: AudioBuffer,
  gainValue: number
): { source: AudioBufferSourceNode; gain: GainNode } {
  const ctx = getAudioContext()
  const source = ctx.createBufferSource()
  const gain = ctx.createGain()

  source.buffer = buffer
  gain.gain.value = gainValue
  source.connect(gain)
  gain.connect(ctx.destination)
  source.start()

  return { source, gain }
}

// ---- Speak digits using SpeechSynthesis ----

export function speakDigits(digits: number[]): Promise<void> {
  return new Promise((resolve, reject) => {
    if (!("speechSynthesis" in window)) {
      reject(new Error("SpeechSynthesis not supported"))
      return
    }

    const text = digits.join(" ... ")
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.rate = 0.8
    utterance.pitch = 1.0
    utterance.volume = 1.0

    utterance.onend = () => resolve()
    utterance.onerror = (e) => reject(e)

    window.speechSynthesis.cancel()
    window.speechSynthesis.speak(utterance)
  })
}

// ---- Measure ambient noise via microphone ----

export async function measureAmbientNoise(
  durationMs: number = 3000
): Promise<number> {
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
  const ctx = getAudioContext()
  const source = ctx.createMediaStreamSource(stream)
  const analyser = ctx.createAnalyser()
  analyser.fftSize = 2048

  source.connect(analyser)
  const dataArray = new Uint8Array(analyser.fftSize)

  return new Promise((resolve) => {
    const samples: number[] = []
    const interval = setInterval(() => {
      analyser.getByteTimeDomainData(dataArray)
      // Calculate RMS
      let sum = 0
      for (let i = 0; i < dataArray.length; i++) {
        const normalized = (dataArray[i] - 128) / 128
        sum += normalized * normalized
      }
      const rms = Math.sqrt(sum / dataArray.length)
      samples.push(rms)
    }, 100)

    setTimeout(() => {
      clearInterval(interval)
      source.disconnect()
      stream.getTracks().forEach((t) => t.stop())

      // Average RMS and map to approximate dBA
      const avgRms =
        samples.length > 0
          ? samples.reduce((a, b) => a + b, 0) / samples.length
          : 0

      // Rough mapping: RMS 0-1 -> ~20-90 dBA
      const dba = Math.round(20 + avgRms * 700)
      resolve(Math.min(90, Math.max(20, dba)))
    }, durationMs)
  })
}

// ---- SNR mixing utilities ----

export function dbToLinear(db: number): number {
  return Math.pow(10, db / 20)
}

// ---- Play digits with noise at specific SNR ----

export async function playDigitsWithNoise(
  digits: number[],
  snrDB: number,
  noiseGain: number = 0.15
): Promise<void> {
  const ctx = getAudioContext()

  // Start noise
  const noiseDuration = 5 // seconds
  const noiseBuffer = createWhiteNoiseBuffer(noiseDuration)
  const { source: noiseSource, gain: noiseGainNode } = playNoise(
    noiseBuffer,
    noiseGain
  )

  // Wait a moment then play speech
  await new Promise((r) => setTimeout(r, 500))

  // Adjust speech volume relative to noise based on SNR
  const speechLinear = dbToLinear(snrDB)

  try {
    const text = digits.join(" ... ")
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.rate = 0.8
    utterance.pitch = 1.0
    utterance.volume = Math.min(1, Math.max(0.1, speechLinear * 0.5))

    await new Promise<void>((resolve, reject) => {
      utterance.onend = () => resolve()
      utterance.onerror = () => reject()
      window.speechSynthesis.cancel()
      window.speechSynthesis.speak(utterance)
    })
  } finally {
    // Stop noise after speech
    await new Promise((r) => setTimeout(r, 300))
    try {
      noiseSource.stop()
      noiseSource.disconnect()
      noiseGainNode.disconnect()
    } catch {
      // Already stopped
    }
  }
}

// ---- Generate random digit triplet ----

export function generateDigitTriplet(): number[] {
  return Array.from({ length: 3 }, () => Math.floor(Math.random() * 10))
}

// ============================================================
// SECTION 5: LOCAL STORAGE PERSISTENCE
// ============================================================

const PREFIX = "neurosense_"

const KEYS = {
  profile: `${PREFIX}profile`,
  sessions: `${PREFIX}sessions`,
} as const

// ---- Helpers ----

function getItem<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : fallback
  } catch {
    return fallback
  }
}

function setItem<T>(key: string, value: T): void {
  if (typeof window === "undefined") return
  localStorage.setItem(key, JSON.stringify(value))
}

// ---- Profile ----

export function getProfile(): UserProfile | null {
  return getItem<UserProfile | null>(KEYS.profile, null)
}

export function saveProfile(profile: UserProfile): void {
  setItem(KEYS.profile, profile)
}

export function ensureProfile(): UserProfile {
  let profile = getProfile()
  if (!profile) {
    profile = {
      id: crypto.randomUUID(),
      name: "User",
      createdAt: new Date().toISOString(),
      deviceInfo: {
        userAgent: typeof navigator !== "undefined" ? navigator.userAgent : "",
        screenWidth: typeof window !== "undefined" ? window.screen.width : 0,
        screenHeight: typeof window !== "undefined" ? window.screen.height : 0,
        pixelRatio: typeof window !== "undefined" ? window.devicePixelRatio : 1,
      },
    }
    saveProfile(profile)
  }
  return profile
}

// ---- Test Sessions ----

export function getSessions(): TestSession[] {
  return getItem<TestSession[]>(KEYS.sessions, [])
}

export function saveSession(session: TestSession): void {
  const sessions = getSessions()
  sessions.push(session)
  setItem(KEYS.sessions, sessions)
}

export function getSessionsByType(type: TestType): TestSession[] {
  return getSessions().filter((s) => s.type === type)
}

export function getLatestSession(type: TestType): TestSession | null {
  const sessions = getSessionsByType(type)
  if (sessions.length === 0) return null
  return sessions.sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  )[0]
}

// ============================================================
// SECTION 6: REACT COMPONENTS
// ============================================================

// Note: The following components require React and related dependencies.
// They are provided as reference implementations.

/*
// ============================================================
// COMPONENT: TestProgress
// ============================================================

"use client"

import { cn } from "@/lib/utils"

interface TestProgressProps {
  steps: string[]
  currentStep: number
  className?: string
}

export function TestProgress({ steps, currentStep, className }: TestProgressProps) {
  return (
    <div className={cn("w-full", className)} role="progressbar" aria-valuenow={currentStep + 1} aria-valuemin={1} aria-valuemax={steps.length}>
      <div className="flex items-center justify-between gap-1">
        {steps.map((step, index) => {
          const isComplete = index < currentStep
          const isCurrent = index === currentStep
          return (
            <div key={step} className="flex flex-1 flex-col items-center gap-1.5">
              <div className="flex w-full items-center">
                {index > 0 && (
                  <div
                    className={cn(
                      "h-0.5 flex-1 rounded-full transition-colors",
                      isComplete ? "bg-primary" : "bg-muted"
                    )}
                  />
                )}
                <div
                  className={cn(
                    "flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold transition-colors",
                    isComplete && "bg-primary text-primary-foreground",
                    isCurrent && "bg-primary text-primary-foreground ring-2 ring-primary/30 ring-offset-2 ring-offset-background",
                    !isComplete && !isCurrent && "bg-muted text-muted-foreground"
                  )}
                >
                  {isComplete ? (
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                  ) : (
                    index + 1
                  )}
                </div>
                {index < steps.length - 1 && (
                  <div
                    className={cn(
                      "h-0.5 flex-1 rounded-full transition-colors",
                      isComplete ? "bg-primary" : "bg-muted"
                    )}
                  />
                )}
              </div>
              <span
                className={cn(
                  "text-center text-[10px] font-medium leading-tight",
                  isCurrent ? "text-foreground" : "text-muted-foreground"
                )}
              >
                {step}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ============================================================
// COMPONENT: ScoreGauge
// ============================================================

"use client"

import { cn } from "@/lib/utils"
import type { RiskLevel } from "@/lib/types"

interface ScoreGaugeProps {
  score: number // 0-100
  size?: number // px
  strokeWidth?: number
  riskLevel?: RiskLevel
  label?: string
  className?: string
}

const levelColors: Record<RiskLevel, string> = {
  low: "#10b981",
  moderate: "#f59e0b",
  high: "#f43f5e",
}

export function ScoreGauge({
  score,
  size = 160,
  strokeWidth = 12,
  riskLevel = "low",
  label,
  className,
}: ScoreGaugeProps) {
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const progress = Math.max(0, Math.min(100, score))
  const dashOffset = circumference - (progress / 100) * circumference
  const color = levelColors[riskLevel]

  return (
    <div
      className={cn("relative inline-flex items-center justify-center", className)}
      style={{ width: size, height: size }}
      role="meter"
      aria-valuenow={score}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label || `Score: ${score}`}
    >
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-muted/30"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          className="transition-all duration-700 ease-out"
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className="text-3xl font-bold tabular-nums text-foreground">
          {Math.round(score)}
        </span>
        {label && (
          <span className="text-xs font-medium text-muted-foreground">
            {label}
          </span>
        )}
      </div>
    </div>
  )
}

// ============================================================
// COMPONENT: RiskBadge
// ============================================================

"use client"

import { cn } from "@/lib/utils"
import type { RiskLevel } from "@/lib/types"

interface RiskBadgeProps {
  level: RiskLevel
  size?: "sm" | "md" | "lg"
  className?: string
}

const sizeStyles = {
  sm: "px-2 py-0.5 text-xs",
  md: "px-2.5 py-1 text-sm",
  lg: "px-3 py-1.5 text-base",
}

const levelStyles: Record<RiskLevel, string> = {
  low: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300",
  moderate: "bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300",
  high: "bg-rose-100 text-rose-800 dark:bg-rose-900/50 dark:text-rose-300",
}

export function RiskBadge({ level, size = "md", className }: RiskBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full font-medium",
        sizeStyles[size],
        levelStyles[level],
        className
      )}
      role="status"
      aria-label={`Risk level: ${getRiskLabel(level)}`}
    >
      {getRiskLabel(level)}
    </span>
  )
}
*/

// ============================================================
// SECTION 7: PAGE COMPONENTS (React/Next.js)
// ============================================================

/*
// ============================================================
// PAGE: TCM Constitution Assessment (/tcm/page.tsx)
// ============================================================

"use client"

import { useCallback, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { AppShell } from "@/components/app-shell"
import { TestProgress } from "@/components/test-progress"
import { ScoreGauge } from "@/components/score-gauge"
import { RiskBadge } from "@/components/risk-badge"
import { TCM_QUESTIONS, TCM_CONSTITUTIONS } from "@/lib/constants"
import { getScoreRiskLevel } from "@/lib/scoring"
import { ensureProfile, saveSession } from "@/lib/store"
import type { TCMConstitution, TCMQuestionResponse, TCMTestResult } from "@/lib/types"

const STEPS = ["Questionnaire", "Analysis", "Results"]
const LIKERT_OPTIONS = [
  { value: 1, label: "Never" },
  { value: 2, label: "Rarely" },
  { value: 3, label: "Sometimes" },
  { value: 4, label: "Often" },
  { value: 5, label: "Always" },
]

export default function TCMPage() {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [questionIndex, setQuestionIndex] = useState(0)
  const [responses, setResponses] = useState<TCMQuestionResponse[]>([])
  const [result, setResult] = useState<TCMTestResult | null>(null)

  const currentQuestion = TCM_QUESTIONS[questionIndex]
  const totalQuestions = TCM_QUESTIONS.length

  const handleAnswer = useCallback(
    (value: number) => {
      const response: TCMQuestionResponse = {
        questionId: currentQuestion.id,
        value,
      }

      const updatedResponses = [...responses, response]
      setResponses(updatedResponses)

      if (questionIndex < totalQuestions - 1) {
        setQuestionIndex((i) => i + 1)
      } else {
        calculateResults(updatedResponses)
      }
    },
    [currentQuestion, questionIndex, totalQuestions, responses]
  )

  const calculateResults = (allResponses: TCMQuestionResponse[]) => {
    setStep(1)

    // Calculate scores for each constitution
    const constitutionScores: Record<TCMConstitution, number> = {} as Record<TCMConstitution, number>

    for (const constitution of TCM_CONSTITUTIONS) {
      const relatedQuestions = TCM_QUESTIONS.filter(
        (q) => q.constitution === constitution.type
      )
      const relatedResponses = allResponses.filter((r) =>
        relatedQuestions.some((q) => q.id === r.questionId)
      )

      if (relatedResponses.length === 0) {
        constitutionScores[constitution.type] = 0
        continue
      }

      const avgScore =
        relatedResponses.reduce((sum, r) => sum + r.value, 0) / relatedResponses.length

      if (constitution.type === "balanced") {
        constitutionScores[constitution.type] = Math.round((avgScore / 5) * 100)
      } else {
        constitutionScores[constitution.type] = Math.round((avgScore / 5) * 100)
      }
    }

    // Find primary and secondary constitutions (excluding balanced)
    const nonBalanced = Object.entries(constitutionScores)
      .filter(([key]) => key !== "balanced")
      .sort((a, b) => b[1] - a[1])

    const primaryType = nonBalanced[0][0] as TCMConstitution
    const secondaryType =
      nonBalanced[1][1] > 40 ? (nonBalanced[1][0] as TCMConstitution) : undefined

    // If balanced score is highest, mark as balanced
    const isBalanced = constitutionScores.balanced >= 70 && nonBalanced[0][1] < 50
    const finalPrimary = isBalanced ? "balanced" : primaryType

    // Get recommendations
    const primaryConst = TCM_CONSTITUTIONS.find((c) => c.type === finalPrimary)
    const recommendations = primaryConst?.recommendations ?? []

    // Subscore: balanced = 100, high constitution scores = lower subscore
    const subscore = isBalanced
      ? Math.min(100, constitutionScores.balanced)
      : Math.max(0, 100 - nonBalanced[0][1])

    const testResult: TCMTestResult = {
      responses: allResponses,
      constitutionScores,
      primaryConstitution: finalPrimary,
      secondaryConstitution: secondaryType,
      subscore,
      recommendations,
    }

    setResult(testResult)

    const profile = ensureProfile()
    saveSession({
      id: crypto.randomUUID(),
      userId: profile.id,
      timestamp: new Date().toISOString(),
      type: "tcm",
      deviceInfo: profile.deviceInfo,
      environmentData: {},
      result: testResult,
      computedScore: subscore,
      classification: finalPrimary,
    })

    setTimeout(() => setStep(2), 1500)
  }

  const getConstitutionName = (type: TCMConstitution): string => {
    return TCM_CONSTITUTIONS.find((c) => c.type === type)?.name ?? type
  }

  const getConstitutionDescription = (type: TCMConstitution): string => {
    return TCM_CONSTITUTIONS.find((c) => c.type === type)?.description ?? ""
  }

  return (
    <AppShell>
      <div className="flex flex-col gap-4 p-4 pb-24">
        <TestProgress steps={STEPS} currentStep={step} />

        {step === 0 && (
          <div className="flex flex-col gap-4">
            <Progress value={(questionIndex / totalQuestions) * 100} className="w-full" />

            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">TCM Constitution Assessment</CardTitle>
                  <span className="text-sm text-muted-foreground">
                    {questionIndex + 1}/{totalQuestions}
                  </span>
                </div>
              </CardHeader>
              <CardContent className="flex flex-col gap-5">
                <p className="text-center text-lg font-medium leading-relaxed text-foreground">
                  {currentQuestion?.text}
                </p>

                <div className="flex flex-col gap-2">
                  {LIKERT_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => handleAnswer(opt.value)}
                      className="flex items-center justify-between rounded-xl border px-4 py-3.5 text-left transition-colors hover:bg-accent active:bg-accent"
                    >
                      <span className="text-sm font-medium text-foreground">{opt.label}</span>
                      <div className="flex items-center gap-1">
                        {Array.from({ length: 5 }, (_, i) => (
                          <div
                            key={i}
                            className={`h-2 w-2 rounded-full ${
                              i < opt.value ? "bg-primary" : "bg-muted"
                            }`}
                          />
                        ))}
                      </div>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {step === 1 && (
          <Card>
            <CardContent className="flex flex-col items-center gap-4 py-16">
              <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent" />
              <p className="text-lg font-semibold text-foreground">Analyzing your responses...</p>
              <p className="text-sm text-muted-foreground">
                Determining your TCM body constitution
              </p>
            </CardContent>
          </Card>
        )}

        {step === 2 && result && (
          <Card>
            <CardHeader className="text-center">
              <CardTitle>TCM Constitution Results</CardTitle>
              <CardDescription>
                Based on the Traditional Chinese Medicine constitution assessment
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center gap-6">
              <ScoreGauge score={result.subscore} size={160} />

              <div className="w-full max-w-xs rounded-xl border-2 border-primary/30 bg-primary/5 p-4 text-center">
                <p className="text-xs font-medium text-muted-foreground">Primary Constitution</p>
                <p className="mt-1 text-lg font-bold text-primary">
                  {getConstitutionName(result.primaryConstitution)}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {getConstitutionDescription(result.primaryConstitution)}
                </p>
              </div>

              {result.secondaryConstitution && (
                <div className="w-full max-w-xs rounded-xl border bg-muted/50 p-3 text-center">
                  <p className="text-xs font-medium text-muted-foreground">Secondary Tendency</p>
                  <p className="mt-0.5 text-sm font-semibold text-foreground">
                    {getConstitutionName(result.secondaryConstitution)}
                  </p>
                </div>
              )}

              <div className="w-full max-w-xs">
                <h3 className="mb-3 text-sm font-semibold text-foreground">Constitution Scores</h3>
                <div className="flex flex-col gap-2.5">
                  {TCM_CONSTITUTIONS.filter((c) => c.type !== "balanced")
                    .sort(
                      (a, b) =>
                        (result.constitutionScores[b.type] ?? 0) -
                        (result.constitutionScores[a.type] ?? 0)
                    )
                    .map((c) => (
                      <div key={c.type} className="flex flex-col gap-1">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-medium text-foreground">{c.name.split(" (")[0]}</span>
                          <span className="text-xs text-muted-foreground">
                            {result.constitutionScores[c.type] ?? 0}%
                          </span>
                        </div>
                        <Progress
                          value={result.constitutionScores[c.type] ?? 0}
                          className="h-1.5"
                        />
                      </div>
                    ))}
                </div>
              </div>

              {result.recommendations.length > 0 && (
                <div className="w-full max-w-xs rounded-xl bg-muted p-4">
                  <h3 className="text-sm font-semibold text-foreground">Recommendations</h3>
                  <ul className="mt-2 space-y-1.5">
                    {result.recommendations.map((rec, i) => (
                      <li key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
                        <span className="mt-1 block h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                        {rec}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="flex w-full max-w-xs flex-col gap-2">
                <Button onClick={() => router.push("/results")} className="w-full" size="lg">
                  View Full Report
                </Button>
                <Button variant="outline" onClick={() => router.push("/")} className="w-full" size="lg">
                  Back to Dashboard
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </AppShell>
  )
}

// ============================================================
// PAGE: Visual Acuity Test (/sensory/visual/page.tsx)
// ============================================================

// See original file: app/sensory/visual/page.tsx
// Key features:
// - Screen calibration using credit card reference
// - Tumbling-E adaptive staircase test
// - LogMAR calculation and Snellen equivalent
// - 2-down/1-up staircase algorithm

// ============================================================
// PAGE: Hearing Screening Test (/sensory/hearing/page.tsx)
// ============================================================

// See original file: app/sensory/hearing/page.tsx
// Key features:
// - Headphone check (left/right channel verification)
// - Ambient noise measurement via microphone
// - Volume calibration with reference tone
// - Digit-in-noise (DIN) test with adaptive SNR
// - Speech Reception Threshold (SRT) calculation

// ============================================================
// PAGE: Olfactory Screening Test (/sensory/olfactory/page.tsx)
// ============================================================

// See original file: app/sensory/olfactory/page.tsx
// Key features:
// - Two modes: Home items or Odor card test
// - 12-item smell identification test
// - Timer-based responses (30 sec per item)
// - 4-alternative forced choice format

*/

// ============================================================
// END OF STANDALONE SCRIPT
// ============================================================

export {}

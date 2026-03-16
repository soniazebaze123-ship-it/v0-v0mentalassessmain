// Visual Acuity Utilities for logMAR testing
// Based on Bailey-Lovie chart principles with screen calibration

export type TumblingEDirection = "up" | "down" | "left" | "right"

export interface LogMARLevel {
  level: number
  logMAR: number
  size: number // in pixels at standard viewing distance
  orientations: TumblingEDirection[]
}

export interface VisualCalibration {
  ppi: number
  viewingDistanceCm: number
  confirmed: boolean
}

export interface VisualTrialResponse {
  trialIndex: number
  logMAR: number
  presented: TumblingEDirection
  responded: TumblingEDirection
  correct: boolean
  reactionTimeMs: number
}

// ---- Constants from TCM Standalone ----
export const CREDIT_CARD_WIDTH_MM = 85.6
export const CREDIT_CARD_HEIGHT_MM = 53.98
export const DEFAULT_VIEWING_DISTANCE_CM = 40
export const VISUAL_NORMAL_THRESHOLD = 0.3 // logMAR
export const LOGMAR_START = 1.0
export const LOGMAR_MIN = -0.3
export const LOGMAR_STEP = 0.1
export const VISUAL_MAX_TRIALS = 30
export const VISUAL_MIN_TRIALS = 15

// Standard logMAR levels from 1.0 (20/200) to -0.3 (20/10)
// Extended range for better sensitivity
export const LOG_MAR_LEVELS: LogMARLevel[] = [
  { level: 1, logMAR: 1.0, size: 400, orientations: [] },  // 20/200
  { level: 2, logMAR: 0.9, size: 318, orientations: [] },  // 20/160
  { level: 3, logMAR: 0.8, size: 252, orientations: [] },  // 20/126
  { level: 4, logMAR: 0.7, size: 200, orientations: [] },  // 20/100
  { level: 5, logMAR: 0.6, size: 159, orientations: [] },  // 20/80
  { level: 6, logMAR: 0.5, size: 126, orientations: [] },  // 20/63
  { level: 7, logMAR: 0.4, size: 100, orientations: [] },  // 20/50
  { level: 8, logMAR: 0.3, size: 79, orientations: [] },   // 20/40
  { level: 9, logMAR: 0.2, size: 63, orientations: [] },   // 20/32
  { level: 10, logMAR: 0.1, size: 50, orientations: [] },  // 20/25
  { level: 11, logMAR: 0.0, size: 40, orientations: [] },  // 20/20 baseline
  { level: 12, logMAR: -0.1, size: 32, orientations: [] }, // 20/16
  { level: 13, logMAR: -0.2, size: 25, orientations: [] }, // 20/12
  { level: 14, logMAR: -0.3, size: 20, orientations: [] }, // 20/10
]

// Calculate E size in pixels based on logMAR, PPI, and viewing distance
export function calculateOptotypeSize(
  logMAR: number,
  ppi: number,
  viewingDistanceCm: number = DEFAULT_VIEWING_DISTANCE_CM
): number {
  // Standard optotype size formula
  // At logMAR 0 (20/20), the letter subtends 5 arcminutes
  // Each logMAR step is a factor of 10^0.1 ≈ 1.2589
  const arcMinutes = 5 * Math.pow(10, logMAR)
  const radians = (arcMinutes / 60) * (Math.PI / 180)
  const sizeMm = 2 * viewingDistanceCm * 10 * Math.tan(radians / 2)
  const sizePixels = (sizeMm / 25.4) * ppi
  // Minimum 40px to ensure visibility, scale up for better UX
  return Math.max(40, Math.round(sizePixels * 1.5))
}

// Get simple E size for classic (non-calibrated) mode - uses predefined sizes
export function getClassicOptotypeSize(level: number): number {
  const sizes = [180, 150, 120, 100, 85, 70, 60, 50, 45, 40, 36, 32, 28, 24]
  return sizes[level - 1] || 100
}

// Calculate PPI from credit card calibration
export function calculatePPIFromCreditCard(cardWidthPixels: number): number {
  const cardWidthInches = CREDIT_CARD_WIDTH_MM / 25.4
  return Math.round(cardWidthPixels / cardWidthInches)
}

// Estimate screen PPI based on device info
export function estimateScreenPPI(): number {
  if (typeof window === "undefined") return 96

  const dpr = window.devicePixelRatio || 1
  
  // Common device PPI estimates
  const screenWidth = window.screen.width * dpr
  const screenHeight = window.screen.height * dpr
  
  // Rough estimation based on screen resolution
  // Most mobile devices: 320-480 PPI
  // Desktop monitors: 72-144 PPI
  // Retina displays: 200-300+ PPI
  
  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)
  
  if (isMobile) {
    // Mobile devices typically have higher PPI
    if (dpr >= 3) return 458 // iPhone Pro, high-end Android
    if (dpr >= 2) return 326 // iPhone, iPad Retina
    return 163 // Older devices
  } else {
    // Desktop/laptop
    if (dpr >= 2) return 192 // Retina MacBook
    return 96 // Standard monitor
  }
}

export function generateRandomOrientations(count = 5): TumblingEDirection[] {
  const options: TumblingEDirection[] = ["up", "down", "left", "right"]
  const result: TumblingEDirection[] = []

  for (let i = 0; i < count; i++) {
    result.push(options[Math.floor(Math.random() * options.length)])
  }

  return result
}

export function generateRandomDirection(): TumblingEDirection {
  const options: TumblingEDirection[] = ["up", "down", "left", "right"]
  return options[Math.floor(Math.random() * options.length)]
}

// Adaptive staircase algorithm for logMAR
export interface StaircaseState {
  currentLogMAR: number
  reversals: number
  lastDirection: "up" | "down" | null
  responses: { logMAR: number; correct: boolean }[]
  reversalValues: number[]
}

export function initStaircase(): StaircaseState {
  return {
    currentLogMAR: 0.5, // Start at moderate difficulty
    reversals: 0,
    lastDirection: null,
    responses: [],
    reversalValues: [],
  }
}

export function updateStaircase(state: StaircaseState, correct: boolean): StaircaseState {
  const newState = { ...state }
  newState.responses.push({ logMAR: state.currentLogMAR, correct })
  
  // Determine direction
  const direction = correct ? "down" : "up" // correct = smaller letters (harder)
  
  // Check for reversal
  if (state.lastDirection && state.lastDirection !== direction) {
    newState.reversals++
    newState.reversalValues.push(state.currentLogMAR)
  }
  
  // Update logMAR
  const step = newState.reversals < 2 ? 0.2 : 0.1 // Larger steps early, smaller later
  if (correct) {
    newState.currentLogMAR = Math.max(LOGMAR_MIN, state.currentLogMAR - step)
  } else {
    newState.currentLogMAR = Math.min(LOGMAR_START, state.currentLogMAR + step)
  }
  
  newState.lastDirection = direction
  
  return newState
}

export function shouldStopStaircase(state: StaircaseState): boolean {
  // Stop after minimum reversals or max trials
  const minReversals = 6
  const maxTrials = VISUAL_MAX_TRIALS
  const minTrials = VISUAL_MIN_TRIALS
  
  if (state.responses.length >= maxTrials) return true
  if (state.responses.length >= minTrials && state.reversals >= minReversals) return true
  
  return false
}

export function calculateStaircaseResult(state: StaircaseState): number {
  // Use average of last 4 reversal values
  if (state.reversalValues.length >= 4) {
    const lastFour = state.reversalValues.slice(-4)
    return lastFour.reduce((a, b) => a + b, 0) / lastFour.length
  }
  
  // Fallback: use average of all responses in last half
  const lastHalf = state.responses.slice(Math.floor(state.responses.length / 2))
  const correctResponses = lastHalf.filter(r => r.correct)
  if (correctResponses.length > 0) {
    return Math.min(...correctResponses.map(r => r.logMAR))
  }
  
  return state.currentLogMAR
}

export function calculateLogMARScore(results: { level: number; correct: number; total: number }[]): {
  finalLogMAR: number
  classification: "normal" | "impaired" | "dysfunction"
  normalizedScore: number
} {
  // Find the last level where at least 3/5 correct (passed)
  let lastPassedLevel = null
  for (const r of results) {
    if (r.correct >= 3) {
      lastPassedLevel = r
    }
  }

  if (!lastPassedLevel) {
    // Failed all levels - severe dysfunction
    return {
      finalLogMAR: 1.0,
      classification: "dysfunction",
      normalizedScore: 100,
    }
  }

  const logMARLevel = LOG_MAR_LEVELS.find((l) => l.level === lastPassedLevel.level)
  const finalLogMAR = logMARLevel?.logMAR ?? 0.5

  // Classification based on logMAR value
  let classification: "normal" | "impaired" | "dysfunction"
  if (finalLogMAR <= 0.1) classification = "normal"
  else if (finalLogMAR <= 0.3) classification = "impaired"
  else classification = "dysfunction"

  // Normalize to 0-100 scale (higher = better vision)
  // logMAR -0.3 = 100 (excellent), logMAR 1.0 = 0 (poor)
  const normalizedScore = Math.round(((1.0 - finalLogMAR) / 1.3) * 100)

  return {
    finalLogMAR,
    classification,
    normalizedScore: Math.max(0, Math.min(100, normalizedScore)),
  }
}

// Calculate visual subscore (0-100, lower = better)
export function calculateVisualSubscore(logMAR: number): number {
  // Map logMAR -0.3 to 1.0 onto 0-100 scale
  // logMAR <= 0 is normal, >0.3 is impaired
  const clamped = Math.max(LOGMAR_MIN, Math.min(LOGMAR_START, logMAR))
  const normalized = (clamped - LOGMAR_MIN) / (LOGMAR_START - LOGMAR_MIN)
  return Math.round(normalized * 100)
}

export function getDeviceInfo() {
  if (typeof window === "undefined") {
    return {
      userAgent: "unknown",
      screenWidth: 0,
      screenHeight: 0,
      pixelRatio: 1,
      platform: "unknown",
    }
  }
  
  return {
    userAgent: navigator.userAgent,
    screenWidth: window.screen.width,
    screenHeight: window.screen.height,
    pixelRatio: window.devicePixelRatio,
    platform: navigator.platform,
  }
}

// Convert logMAR to Snellen notation
export function logMARToSnellen(logMAR: number): string {
  const denominator = Math.round(20 * Math.pow(10, logMAR))
  return `20/${denominator}`
}

// Get risk level based on logMAR
export function getVisualRiskLevel(logMAR: number): "low" | "moderate" | "high" {
  if (logMAR <= 0.1) return "low"
  if (logMAR <= 0.3) return "moderate"
  return "high"
}

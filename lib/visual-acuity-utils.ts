// Visual Acuity Utilities for logMAR testing
// Based on Bailey-Lovie chart principles

export interface LogMARLevel {
  level: number
  logMAR: number
  size: number // in pixels at standard viewing distance
  orientations: ("up" | "down" | "left" | "right")[]
}

// Standard logMAR levels from 0.3 (20/40) to -0.3 (20/10)
export const LOG_MAR_LEVELS: LogMARLevel[] = [
  { level: 1, logMAR: 0.3, size: 200, orientations: [] },
  { level: 2, logMAR: 0.2, size: 158, orientations: [] },
  { level: 3, logMAR: 0.1, size: 126, orientations: [] },
  { level: 4, logMAR: 0.0, size: 100, orientations: [] }, // 20/20 baseline
  { level: 5, logMAR: -0.1, size: 79, orientations: [] },
  { level: 6, logMAR: -0.2, size: 63, orientations: [] },
  { level: 7, logMAR: -0.3, size: 50, orientations: [] },
]

export function generateRandomOrientations(count = 5): ("up" | "down" | "left" | "right")[] {
  const options: ("up" | "down" | "left" | "right")[] = ["up", "down", "left", "right"]
  const result: ("up" | "down" | "left" | "right")[] = []

  for (let i = 0; i < count; i++) {
    result.push(options[Math.floor(Math.random() * options.length)])
  }

  return result
}

export function calculateLogMARScore(results: { level: number; correct: number; total: number }[]): {
  finalLogMAR: number
  classification: "normal" | "impaired" | "dysfunction"
  normalizedScore: number
} {
  // Find the last level where at least 3/5 correct
  const passedLevel = results.find((r) => r.correct >= 3)

  if (!passedLevel) {
    // Failed all levels - severe dysfunction
    return {
      finalLogMAR: 0.3,
      classification: "dysfunction",
      normalizedScore: 100,
    }
  }

  const logMARLevel = LOG_MAR_LEVELS.find((l) => l.level === passedLevel.level)
  const finalLogMAR = logMARLevel?.logMAR || 0.0

  // Classification based on logMAR value
  let classification: "normal" | "impaired" | "dysfunction"
  if (finalLogMAR <= 0.0) classification = "normal"
  else if (finalLogMAR <= 0.2) classification = "impaired"
  else classification = "dysfunction"

  // Normalize to 0-100 scale (higher = worse)
  // logMAR 0.3 = 100, logMAR -0.3 = 0
  const normalizedScore = ((finalLogMAR + 0.3) / 0.6) * 100

  return {
    finalLogMAR,
    classification,
    normalizedScore: Math.max(0, Math.min(100, normalizedScore)),
  }
}

export function getDeviceInfo() {
  return {
    userAgent: navigator.userAgent,
    screenWidth: window.screen.width,
    screenHeight: window.screen.height,
    pixelRatio: window.devicePixelRatio,
    platform: navigator.platform,
  }
}

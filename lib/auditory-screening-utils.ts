// Auditory Screening Utilities for Digit-in-Noise Test

export interface DigitTrial {
  digit: number
  noiseLevel: number // dB SNR (signal-to-noise ratio)
}

// Standard SNR levels from easy to difficult (-3dB to -21dB)
export const SNR_LEVELS = [-3, -6, -9, -12, -15, -18, -21]

export function generateDigitTrials(trialsPerLevel = 3): DigitTrial[] {
  const trials: DigitTrial[] = []

  for (const snr of SNR_LEVELS) {
    for (let i = 0; i < trialsPerLevel; i++) {
      const digit = Math.floor(Math.random() * 10) // 0-9
      trials.push({ digit, noiseLevel: snr })
    }
  }

  // Shuffle trials
  return trials.sort(() => Math.random() - 0.5)
}

export function calculateAuditoryScore(results: { correct: boolean; snr: number }[]): {
  speechReceptionThreshold: number
  classification: "normal" | "impaired" | "dysfunction"
  normalizedScore: number
  percentCorrect: number
} {
  const totalCorrect = results.filter((r) => r.correct).length
  const percentCorrect = (totalCorrect / results.length) * 100

  // Calculate SRT (Speech Reception Threshold) - the SNR at 50% correct
  // Group by SNR level
  const snrGroups = new Map<number, { correct: number; total: number }>()

  results.forEach((r) => {
    const existing = snrGroups.get(r.snr) || { correct: 0, total: 0 }
    snrGroups.set(r.snr, {
      correct: existing.correct + (r.correct ? 1 : 0),
      total: existing.total + 1,
    })
  })

  // Find threshold where performance drops below 50%
  let srt = -3 // Default to easiest level
  const sortedSnrs = Array.from(snrGroups.entries()).sort((a, b) => b[0] - a[0])

  for (const [snr, stats] of sortedSnrs) {
    const percentCorrect = (stats.correct / stats.total) * 100
    if (percentCorrect >= 50) {
      srt = snr
      break
    }
  }

  // Classification based on SRT
  // Normal: SRT < -9dB, Impaired: -9 to -6dB, Dysfunction: > -6dB
  let classification: "normal" | "impaired" | "dysfunction"
  if (srt <= -9) classification = "normal"
  else if (srt <= -6) classification = "impaired"
  else classification = "dysfunction"

  // Normalize to 0-100 scale (higher = worse)
  // -21dB = 0 (best), -3dB = 100 (worst)
  const normalizedScore = ((srt + 21) / 18) * 100

  return {
    speechReceptionThreshold: srt,
    classification,
    normalizedScore: Math.max(0, Math.min(100, normalizedScore)),
    percentCorrect,
  }
}

export function getDeviceAudioInfo() {
  return {
    userAgent: navigator.userAgent,
    platform: navigator.platform,
    hasAudioContext: typeof AudioContext !== "undefined" || typeof (window as any).webkitAudioContext !== "undefined",
  }
}

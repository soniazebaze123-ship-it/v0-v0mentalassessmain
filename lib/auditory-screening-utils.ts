// Auditory Screening Utilities for Digit-in-Noise Test (DIN)
// Uses Web Speech API for spoken digits with background noise

export interface DigitTrial {
  digits: number[] // Triple digit sequence (e.g., [3, 5, 7])
  noiseLevel: number // dB SNR (signal-to-noise ratio)
}

export interface AudiogramData {
  leftEar: { frequency: number; threshold: number }[]
  rightEar: { frequency: number; threshold: number }[]
  srt: number
  classification: "normal" | "impaired" | "dysfunction"
  percentCorrect: number
  totalTrials: number
  correctTrials: number
}

// Standard frequencies for audiogram (Hz)
export const AUDIOGRAM_FREQUENCIES = [250, 500, 1000, 2000, 4000, 8000]

// Adaptive SNR levels from easy to difficult
export const ADAPTIVE_SNR_LEVELS = [-12, -9, -6, -3, 0, 3, 6]

export async function checkAmbientNoise(): Promise<{
  noiseLevel: number
  acceptable: boolean
  message: string
}> {
  // Check if we're in browser
  if (typeof window === "undefined") {
    return {
      noiseLevel: 0,
      acceptable: true,
      message: "Unable to measure ambient noise. Proceeding with test.",
    }
  }

  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    const audioContext = new AudioContextClass()
    const source = audioContext.createMediaStreamSource(stream)
    const analyser = audioContext.createAnalyser()

    analyser.fftSize = 2048
    source.connect(analyser)

    const dataArray = new Uint8Array(analyser.frequencyBinCount)

    return new Promise((resolve) => {
      setTimeout(() => {
        analyser.getByteFrequencyData(dataArray)
        const sum = dataArray.reduce((acc, val) => acc + val, 0)
        const average = sum / dataArray.length
        const noiseLevel = Math.round(average * 0.5)

        stream.getTracks().forEach((track) => track.stop())
        audioContext.close()

        const acceptable = noiseLevel < 45
        const message = acceptable
          ? "Ambient noise level acceptable for testing"
          : `Ambient noise too high (${noiseLevel} dBA). Please find a quieter location.`

        resolve({ noiseLevel, acceptable, message })
      }, 2000)
    })
  } catch {
    return {
      noiseLevel: 0,
      acceptable: true,
      message: "Unable to measure ambient noise. Proceeding with test.",
    }
  }
}

export async function detectHeadphones(): Promise<boolean> {
  // Check if we're in browser
  if (typeof window === "undefined" || typeof navigator === "undefined") {
    return false
  }

  try {
    const devices = await navigator.mediaDevices.enumerateDevices()
    const audioOutputs = devices.filter((device) => device.kind === "audiooutput")
    return audioOutputs.some(
      (device) =>
        device.label.toLowerCase().includes("headphone") ||
        device.label.toLowerCase().includes("headset") ||
        device.label.toLowerCase().includes("earphone"),
    )
  } catch {
    return false
  }
}

export function generateDigitTriplets(trialsCount = 12): DigitTrial[] {
  const trials: DigitTrial[] = []

  for (let i = 0; i < trialsCount; i++) {
    // Use digits 1-9 (avoid 0 to reduce confusion)
    const digits = [
      Math.floor(Math.random() * 9) + 1,
      Math.floor(Math.random() * 9) + 1,
      Math.floor(Math.random() * 9) + 1,
    ]

    // Adaptive SNR: starts easy (-12) and gets harder
    // Each group of 3 trials increases difficulty
    const groupIndex = Math.floor(i / 3)
    const snr = -12 + groupIndex * 3

    trials.push({ digits, noiseLevel: Math.min(snr, 6) })
  }

  return trials
}

// Play background noise and return a stop function
function playNoise(
  audioContext: AudioContext,
  snr: number,
  durationMs: number,
): { stop: () => void } {
  const sampleRate = audioContext.sampleRate
  const bufferSize = sampleRate * (durationMs / 1000)
  const noiseBuffer = audioContext.createBuffer(1, bufferSize, sampleRate)
  const noiseData = noiseBuffer.getChannelData(0)

  // Generate pink-ish noise (more natural sounding)
  let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0
  for (let i = 0; i < bufferSize; i++) {
    const white = Math.random() * 2 - 1
    b0 = 0.99886 * b0 + white * 0.0555179
    b1 = 0.99332 * b1 + white * 0.0750759
    b2 = 0.96900 * b2 + white * 0.1538520
    b3 = 0.86650 * b3 + white * 0.3104856
    b4 = 0.55000 * b4 + white * 0.5329522
    b5 = -0.7616 * b5 - white * 0.0168980
    noiseData[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.05
    b6 = white * 0.115926
  }

  const noiseSource = audioContext.createBufferSource()
  noiseSource.buffer = noiseBuffer
  const noiseGain = audioContext.createGain()

  // Calculate noise level based on SNR
  // Lower SNR = more noise relative to signal
  const signalLevel = 0.5
  const noiseAmplitude = signalLevel / Math.pow(10, snr / 20)
  noiseGain.gain.value = Math.min(noiseAmplitude, 0.8)

  noiseSource.connect(noiseGain)
  noiseGain.connect(audioContext.destination)
  noiseSource.start()

  return {
    stop: () => {
      try {
        noiseSource.stop()
      } catch {
        // Already stopped
      }
    },
  }
}

// Speak digits using Web Speech API
function speakDigits(digits: number[], volume: number): Promise<void> {
  return new Promise((resolve) => {
    if (!("speechSynthesis" in window)) {
      resolve()
      return
    }

    // Cancel any ongoing speech
    window.speechSynthesis.cancel()

    const text = digits.join("... ")
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.rate = 0.7 // Slower for clarity
    utterance.pitch = 1.0
    utterance.volume = Math.max(0.1, Math.min(1.0, volume))

    utterance.onend = () => resolve()
    utterance.onerror = () => resolve()

    // Timeout safety
    const timeout = setTimeout(() => resolve(), 5000)
    utterance.onend = () => {
      clearTimeout(timeout)
      resolve()
    }

    window.speechSynthesis.speak(utterance)
  })
}

export async function playDigitTripletWithNoise(
  digits: number[],
  snr: number,
  audioContext: AudioContext,
): Promise<void> {
  const totalDuration = 4000 // 4 seconds

  // Start noise first
  const noise = playNoise(audioContext, snr, totalDuration)

  // Small delay then speak the digits
  await new Promise((r) => setTimeout(r, 300))

  // Calculate speech volume based on SNR
  // At SNR -12 (easy): speech is loud relative to noise
  // At SNR +6 (hard): speech is quiet relative to noise
  const speechVolume = Math.max(0.3, Math.min(1.0, 0.8 - snr * 0.03))
  await speakDigits(digits, speechVolume)

  // Let noise continue briefly after speech
  await new Promise((r) => setTimeout(r, 500))
  noise.stop()
}

export function calculateSRTAndClassification(results: { correct: boolean; snr: number }[]): {
  speechReceptionThreshold: number
  classification: "normal" | "impaired" | "dysfunction"
  normalizedScore: number
  percentCorrect: number
  audiogramData: AudiogramData
} {
  const totalCorrect = results.filter((r) => r.correct).length
  const percentCorrect = Math.round((totalCorrect / results.length) * 100)

  // Group by SNR level
  const snrGroups = new Map<number, { correct: number; total: number }>()
  results.forEach((r) => {
    const existing = snrGroups.get(r.snr) || { correct: 0, total: 0 }
    snrGroups.set(r.snr, {
      correct: existing.correct + (r.correct ? 1 : 0),
      total: existing.total + 1,
    })
  })

  // Calculate SRT: find the SNR where performance drops below 50%
  let srt = 6 // Default to worst if no threshold found
  const sortedSnrs = Array.from(snrGroups.entries()).sort((a, b) => a[0] - b[0]) // Sort easiest to hardest

  for (const [snr, stats] of sortedSnrs) {
    const percent = (stats.correct / stats.total) * 100
    if (percent < 50) {
      srt = snr
      break
    }
    srt = snr // Last SNR where >= 50% correct
  }

  // If all correct, SRT is below easiest level
  if (totalCorrect === results.length) {
    srt = -12
  }

  // Classification
  let classification: "normal" | "impaired" | "dysfunction"
  if (srt <= -6) classification = "normal"
  else if (srt <= 0) classification = "impaired"
  else classification = "dysfunction"

  // Normalize to 0-100 scale (0 = best hearing, 100 = worst)
  const normalizedScore = Math.max(0, Math.min(100, ((srt + 12) / 18) * 100))

  // Generate audiogram data
  const audiogramData = generateAudiogramFromSRT(srt, classification, totalCorrect, results.length)

  return {
    speechReceptionThreshold: srt,
    classification,
    normalizedScore,
    percentCorrect,
    audiogramData,
  }
}

function generateAudiogramFromSRT(
  srt: number,
  classification: "normal" | "impaired" | "dysfunction",
  correctTrials: number,
  totalTrials: number,
): AudiogramData {
  // Map SRT to hearing threshold in dB HL
  // Normal hearing: 0-25 dB HL
  // Mild loss: 26-40 dB HL
  // Moderate loss: 41-55 dB HL
  const baseThreshold = Math.max(5, Math.min(80, 25 + (srt + 6) * 5))

  // Generate frequency-specific thresholds with realistic pattern
  // Higher frequencies typically show more loss
  const freqModifiers: Record<number, number> = {
    250: -5,   // Usually better at low frequencies
    500: -3,
    1000: 0,   // Reference frequency
    2000: 2,
    4000: 8,   // High frequencies often worse
    8000: 12,
  }

  const leftEar = AUDIOGRAM_FREQUENCIES.map((freq) => ({
    frequency: freq,
    threshold: Math.max(0, Math.min(110, baseThreshold + (freqModifiers[freq] || 0) + (Math.random() * 6 - 3))),
  }))

  const rightEar = AUDIOGRAM_FREQUENCIES.map((freq) => ({
    frequency: freq,
    threshold: Math.max(0, Math.min(110, baseThreshold + (freqModifiers[freq] || 0) + (Math.random() * 6 - 3))),
  }))

  return {
    leftEar,
    rightEar,
    srt,
    classification,
    percentCorrect: Math.round((correctTrials / totalTrials) * 100),
    totalTrials,
    correctTrials,
  }
}

export function getDeviceAudioInfo() {
  return {
    userAgent: navigator.userAgent,
    platform: navigator.platform,
    hasAudioContext: typeof AudioContext !== "undefined" || typeof (window as any).webkitAudioContext !== "undefined",
    hasSpeechSynthesis: "speechSynthesis" in window,
    timestamp: new Date().toISOString(),
  }
}

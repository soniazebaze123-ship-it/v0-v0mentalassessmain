// Auditory Screening Utilities for Digit-in-Noise Test (DIN)

export interface DigitTrial {
  digits: number[] // Triple digit sequence (e.g., [3, 5, 7])
  noiseLevel: number // dB SNR (signal-to-noise ratio)
}

export interface AudiogramData {
  leftEar: { frequency: number; threshold: number }[]
  rightEar: { frequency: number; threshold: number }[]
  srt: number
  classification: "normal" | "impaired" | "dysfunction"
}

// Standard frequencies for audiogram (Hz)
export const AUDIOGRAM_FREQUENCIES = [125, 250, 500, 1000, 2000, 4000, 8000]

// Adaptive SNR levels from easy to difficult
export const ADAPTIVE_SNR_LEVELS = [-12, -9, -6, -3, 0, 3, 6]

export async function checkAmbientNoise(): Promise<{
  noiseLevel: number
  acceptable: boolean
  message: string
}> {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    const audioContext = new AudioContext()
    const source = audioContext.createMediaStreamSource(stream)
    const analyser = audioContext.createAnalyser()

    analyser.fftSize = 2048
    source.connect(analyser)

    const dataArray = new Uint8Array(analyser.frequencyBinCount)

    return new Promise((resolve) => {
      setTimeout(() => {
        analyser.getByteFrequencyData(dataArray)

        // Calculate average noise level
        const sum = dataArray.reduce((acc, val) => acc + val, 0)
        const average = sum / dataArray.length

        // Convert to approximate dBA (rough estimation)
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
  } catch (error) {
    return {
      noiseLevel: 0,
      acceptable: true,
      message: "Unable to measure ambient noise. Proceeding with test.",
    }
  }
}

export async function detectHeadphones(): Promise<boolean> {
  try {
    const devices = await navigator.mediaDevices.enumerateDevices()
    const audioOutputs = devices.filter((device) => device.kind === "audiooutput")

    // Check if any audio output device suggests headphones
    const hasHeadphones = audioOutputs.some(
      (device) =>
        device.label.toLowerCase().includes("headphone") ||
        device.label.toLowerCase().includes("headset") ||
        device.label.toLowerCase().includes("earphone"),
    )

    return hasHeadphones
  } catch (error) {
    return false
  }
}

export function generateDigitTriplets(trialsCount = 10): DigitTrial[] {
  const trials: DigitTrial[] = []

  // Start with easier SNR levels
  const startingSNR = -9

  for (let i = 0; i < trialsCount; i++) {
    const digits = [Math.floor(Math.random() * 10), Math.floor(Math.random() * 10), Math.floor(Math.random() * 10)]

    // Adaptive SNR based on trial number
    const snr = startingSNR + Math.floor(i / 3) * 3

    trials.push({ digits, noiseLevel: Math.min(snr, 6) })
  }

  return trials
}

export async function playDigitTripletWithNoise(
  digits: number[],
  snr: number,
  audioContext: AudioContext,
): Promise<void> {
  return new Promise((resolve) => {
    const now = audioContext.currentTime
    const digitDuration = 0.4
    const gapDuration = 0.15

    digits.forEach((digit, index) => {
      const startTime = now + index * (digitDuration + gapDuration)

      // Create multi-harmonic tone for digit speech simulation
      const baseFreq = 400 + digit * 100
      const harmonics = [baseFreq, baseFreq * 2, baseFreq * 3]

      harmonics.forEach((freq, harmIndex) => {
        const osc = audioContext.createOscillator()
        const gain = audioContext.createGain()

        osc.frequency.value = freq
        osc.type = "sine"

        const amplitude = 0.4 / (harmIndex + 1)
        gain.gain.setValueAtTime(0, startTime)
        gain.gain.linearRampToValueAtTime(amplitude, startTime + 0.05)
        gain.gain.setValueAtTime(amplitude, startTime + digitDuration - 0.1)
        gain.gain.linearRampToValueAtTime(0, startTime + digitDuration)

        osc.connect(gain)
        gain.connect(audioContext.destination)
        osc.start(startTime)
        osc.stop(startTime + digitDuration)
      })
    })

    // Add noise
    const totalDuration = digits.length * (digitDuration + gapDuration)
    const bufferSize = audioContext.sampleRate * totalDuration
    const noiseBuffer = audioContext.createBuffer(1, bufferSize, audioContext.sampleRate)
    const noiseData = noiseBuffer.getChannelData(0)

    for (let i = 0; i < bufferSize; i++) {
      noiseData[i] = (Math.random() * 2 - 1) * 0.5
    }

    const noiseSource = audioContext.createBufferSource()
    noiseSource.buffer = noiseBuffer
    const noiseGain = audioContext.createGain()

    // Calculate noise level based on SNR
    const signalLevel = 0.4
    const noiseLevel = signalLevel / Math.pow(10, snr / 20)
    noiseGain.gain.value = noiseLevel

    noiseSource.connect(noiseGain)
    noiseGain.connect(audioContext.destination)
    noiseSource.start(now)
    noiseSource.stop(now + totalDuration)

    setTimeout(() => resolve(), totalDuration * 1000 + 200)
  })
}

export function calculateSRTAndClassification(results: { correct: boolean; snr: number }[]): {
  speechReceptionThreshold: number
  classification: "normal" | "impaired" | "dysfunction"
  normalizedScore: number
  percentCorrect: number
  audiogramData: AudiogramData
} {
  const totalCorrect = results.filter((r) => r.correct).length
  const percentCorrect = (totalCorrect / results.length) * 100

  // Group by SNR level
  const snrGroups = new Map<number, { correct: number; total: number }>()

  results.forEach((r) => {
    const existing = snrGroups.get(r.snr) || { correct: 0, total: 0 }
    snrGroups.set(r.snr, {
      correct: existing.correct + (r.correct ? 1 : 0),
      total: existing.total + 1,
    })
  })

  // Calculate SRT (50% threshold)
  let srt = -12
  const sortedSnrs = Array.from(snrGroups.entries()).sort((a, b) => b[0] - a[0])

  for (const [snr, stats] of sortedSnrs) {
    const percent = (stats.correct / stats.total) * 100
    if (percent >= 50) {
      srt = snr
      break
    }
  }

  // Classification: Normal ≤ -6 dB, Impaired > -6 dB
  let classification: "normal" | "impaired" | "dysfunction"
  if (srt <= -6) classification = "normal"
  else if (srt <= 0) classification = "impaired"
  else classification = "dysfunction"

  // Normalize to 0-100 scale (higher = worse)
  const normalizedScore = Math.max(0, Math.min(100, ((srt + 12) / 18) * 100))

  // Generate audiogram data (simulated from SRT)
  const audiogramData = generateAudiogramFromSRT(srt, classification)

  return {
    speechReceptionThreshold: srt,
    classification,
    normalizedScore,
    percentCorrect,
    audiogramData,
  }
}

function generateAudiogramFromSRT(srt: number, classification: "normal" | "impaired" | "dysfunction"): AudiogramData {
  // Convert SRT to approximate hearing threshold in dB HL
  // SRT of -6 dB ≈ 20 dB HL (normal)
  // SRT of 0 dB ≈ 35 dB HL (mild impairment)
  // SRT of 6 dB ≈ 50 dB HL (moderate impairment)

  const baseThreshold = 20 + (srt + 6) * 5

  const leftEar = AUDIOGRAM_FREQUENCIES.map((freq) => ({
    frequency: freq,
    threshold: baseThreshold + (Math.random() * 10 - 5), // Add slight variation
  }))

  const rightEar = AUDIOGRAM_FREQUENCIES.map((freq) => ({
    frequency: freq,
    threshold: baseThreshold + (Math.random() * 10 - 5),
  }))

  return {
    leftEar,
    rightEar,
    srt,
    classification,
  }
}

export function getDeviceAudioInfo() {
  return {
    userAgent: navigator.userAgent,
    platform: navigator.platform,
    hasAudioContext: typeof AudioContext !== "undefined" || typeof (window as any).webkitAudioContext !== "undefined",
    timestamp: new Date().toISOString(),
  }
}

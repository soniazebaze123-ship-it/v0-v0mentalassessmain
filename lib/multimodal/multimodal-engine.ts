import type { BloodInput, EegErpInput, SensoryInput } from "@/lib/multimodal/types"

export interface SensoryEngineInput {
  visualScore?: number | null
  auditoryScore?: number | null
  olfactoryScore?: number | null
}

export interface CognitiveEngineInput {
  mocaScore?: number | null
  mmseScore?: number | null
}

export interface MultimodalEngineInput {
  cognitive: CognitiveEngineInput
  sensory: SensoryEngineInput
  eeg: EegErpInput
  blood: BloodInput
}

export type CognitiveStage =
  | "Normal"
  | "At Risk"
  | "Early MCI"
  | "Intermediate MCI"
  | "Advanced MCI"
  | "Mild Dementia"
  | "Moderate Dementia"
  | "Severe Dementia"

export interface MultimodalEngineResult {
  totalScore: number
  stage: CognitiveStage
  riskLevel: "Low" | "Moderate" | "High" | "Very High"
  domainScores: {
    cognitive: number
    sensory: number
    eeg: number
    blood: number
  }
  biomarkers: {
    abetaRatio: number | null
    amyloidPositive: boolean
    tauPositive: boolean
    neurodegenerationPositive: boolean
    inflammationPositive: boolean
  }
  eegFlags: {
    thetaAlphaRatio: number | null
    slowingDetected: boolean
    p300DelayDetected: boolean
    p300AmplitudeReduced: boolean
  }
  sensoryFlags: {
    visualImpairment: boolean
    auditoryImpairment: boolean
    olfactoryImpairment: boolean
    multisensoryImpairment: boolean
  }
  profile: {
    probableAD: boolean
    mixedNonAD: boolean
    specialistReferral: boolean
  }
  summary: string
}

function calculateAbetaRatio(abeta42: number | null, abeta40: number | null): number | null {
  if (abeta42 === null || abeta40 === null || abeta40 === 0) return null
  return abeta42 / abeta40
}

function scoreCognitive(input: CognitiveEngineInput): number {
  let score = 0

  if (input.mocaScore !== null && input.mocaScore !== undefined) {
    if (input.mocaScore < 18) score += 6
    else if (input.mocaScore <= 25) score += 3
  }

  if (input.mmseScore !== null && input.mmseScore !== undefined) {
    if (input.mmseScore < 14) score += 6
    else if (input.mmseScore <= 20) score += 3
  }

  return score
}

function scoreSensory(input: SensoryEngineInput) {
  let score = 0

  const visualImpairment = input.visualScore !== null && input.visualScore !== undefined
    ? input.visualScore < 7
    : false

  const auditoryImpairment = input.auditoryScore !== null && input.auditoryScore !== undefined
    ? input.auditoryScore < 7
    : false

  const olfactoryImpairment = input.olfactoryScore !== null && input.olfactoryScore !== undefined
    ? input.olfactoryScore < 8
    : false

  if (visualImpairment) score += 1
  if (auditoryImpairment) score += 1
  if (olfactoryImpairment) score += 2

  const multisensoryImpairment =
    [visualImpairment, auditoryImpairment, olfactoryImpairment].filter(Boolean).length >= 2

  if (multisensoryImpairment) score += 2

  return {
    score,
    visualImpairment,
    auditoryImpairment,
    olfactoryImpairment,
    multisensoryImpairment,
  }
}

function scoreEEG(input: EegErpInput) {
  let score = 0

  const thetaAlphaRatio =
    input.thetaPower !== null &&
    input.alphaPower !== null &&
    input.alphaPower !== 0
      ? input.thetaPower / input.alphaPower
      : null

  const slowingDetected = thetaAlphaRatio !== null ? thetaAlphaRatio > 1.5 : false
  const p300DelayDetected =
    input.p300Latency !== null && input.p300Latency > 350
  const p300AmplitudeReduced =
    input.p300Amplitude !== null && input.p300Amplitude < 5

  if (slowingDetected) score += 3
  if (p300DelayDetected) score += 2
  if (p300AmplitudeReduced) score += 2

  return {
    score,
    thetaAlphaRatio,
    slowingDetected,
    p300DelayDetected,
    p300AmplitudeReduced,
  }
}

function scoreBlood(input: BloodInput) {
  let score = 0

  const abetaRatio = calculateAbetaRatio(input.abeta42, input.abeta40)
  const amyloidPositive = abetaRatio !== null ? abetaRatio < 0.1 : false
  const tauPositive = (input.pTau181 ?? 0) > 3.0 || (input.totalTau ?? 0) > 300
  const neurodegenerationPositive = (input.nfl ?? 0) > 30
  const inflammationPositive =
    (input.crp ?? 0) > 3 ||
    (input.il6 ?? 0) > 7 ||
    (input.tnfAlpha ?? 0) > 8

  if (amyloidPositive) score += 3
  if (tauPositive) score += 3
  if (neurodegenerationPositive) score += 2
  if (inflammationPositive) score += 1

  return {
    score,
    abetaRatio,
    amyloidPositive,
    tauPositive,
    neurodegenerationPositive,
    inflammationPositive,
  }
}

function determineStage(totalScore: number): CognitiveStage {
  if (totalScore <= 2) return "Normal"
  if (totalScore <= 5) return "At Risk"
  if (totalScore <= 8) return "Early MCI"
  if (totalScore <= 11) return "Intermediate MCI"
  if (totalScore <= 14) return "Advanced MCI"
  if (totalScore <= 17) return "Mild Dementia"
  if (totalScore <= 20) return "Moderate Dementia"
  return "Severe Dementia"
}

function determineRiskLevel(totalScore: number): "Low" | "Moderate" | "High" | "Very High" {
  if (totalScore <= 5) return "Low"
  if (totalScore <= 11) return "Moderate"
  if (totalScore <= 17) return "High"
  return "Very High"
}

export function runMultimodalEngine(
  input: MultimodalEngineInput,
): MultimodalEngineResult {
  const cognitive = scoreCognitive(input.cognitive)
  const sensory = scoreSensory(input.sensory)
  const eeg = scoreEEG(input.eeg)
  const blood = scoreBlood(input.blood)

  const totalScore = cognitive + sensory.score + eeg.score + blood.score
  const stage = determineStage(totalScore)
  const riskLevel = determineRiskLevel(totalScore)

  const probableAD = blood.amyloidPositive && blood.tauPositive
  const mixedNonAD = blood.inflammationPositive && !probableAD
  const specialistReferral =
    stage === "Mild Dementia" ||
    stage === "Moderate Dementia" ||
    stage === "Severe Dementia" ||
    probableAD

  const summaryParts: string[] = []

  summaryParts.push(`Overall stage: ${stage}.`)
  summaryParts.push(`Risk level: ${riskLevel}.`)

  if (probableAD) {
    summaryParts.push("Biomarker profile is compatible with a probable Alzheimer’s disease pattern.")
  } else if (mixedNonAD) {
    summaryParts.push("Pattern may reflect mixed or non-Alzheimer’s contributors.")
  }

  if (eeg.slowingDetected || eeg.p300DelayDetected || eeg.p300AmplitudeReduced) {
    summaryParts.push("EEG/ERP findings suggest functional cognitive dysfunction.")
  }

  if (sensory.multisensoryImpairment) {
    summaryParts.push("Multiple sensory deficits increase early cognitive risk.")
  }

  if (specialistReferral) {
    summaryParts.push("Specialist assessment is recommended.")
  }

  return {
    totalScore,
    stage,
    riskLevel,
    domainScores: {
      cognitive,
      sensory: sensory.score,
      eeg: eeg.score,
      blood: blood.score,
    },
    biomarkers: {
      abetaRatio: blood.abetaRatio,
      amyloidPositive: blood.amyloidPositive,
      tauPositive: blood.tauPositive,
      neurodegenerationPositive: blood.neurodegenerationPositive,
      inflammationPositive: blood.inflammationPositive,
    },
    eegFlags: {
      thetaAlphaRatio: eeg.thetaAlphaRatio,
      slowingDetected: eeg.slowingDetected,
      p300DelayDetected: eeg.p300DelayDetected,
      p300AmplitudeReduced: eeg.p300AmplitudeReduced,
    },
    sensoryFlags: {
      visualImpairment: sensory.visualImpairment,
      auditoryImpairment: sensory.auditoryImpairment,
      olfactoryImpairment: sensory.olfactoryImpairment,
      multisensoryImpairment: sensory.multisensoryImpairment,
    },
    profile: {
      probableAD,
      mixedNonAD,
      specialistReferral,
    },
    summary: summaryParts.join(" "),
  }
}
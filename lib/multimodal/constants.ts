export const MULTIMODAL_THRESHOLDS = {
  thetaAlphaRatioHigh: 1.5,
  p300LatencyHigh: 350,
  p300AmplitudeLow: 5,
  n200LatencyHigh: 300,
  mmnLatencyHigh: 220,
  olfactoryImpairmentCutoff: 8,
  abetaRatioLow: 0.1,
  pTau181High: 3.0,
  totalTauHigh: 300,
  nflHigh: 30,
  crpHigh: 3,
  il6High: 7,
  tnfAlphaHigh: 8,
} as const;

export const COGNITIVE_BANDS = [
  "Normal Cognition",
  "At-Risk Cognitive Decline",
  "Early MCI",
  "Intermediate MCI",
  "Advanced MCI",
  "Mild Dementia",
  "Moderate Dementia",
  "Severe Dementia",
] as const;
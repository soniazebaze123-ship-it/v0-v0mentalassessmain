import { MULTIMODAL_THRESHOLDS as T } from "./constants";
import type { BloodInput, EegErpInput, SensoryInput } from "./types";

export function calculateAbetaRatio(abeta42: number | null, abeta40: number | null) {
  if (abeta42 === null || abeta40 === null || abeta40 === 0) return null;
  return abeta42 / abeta40;
}

export function scoreEeg(eeg: EegErpInput) {
  let eegScore = 0;

  if ((eeg.thetaAlphaRatio ?? 0) > T.thetaAlphaRatioHigh) eegScore += 2;
  if ((eeg.p300Latency ?? 0) > T.p300LatencyHigh) eegScore += 2;
  if ((eeg.p300Amplitude ?? Number.POSITIVE_INFINITY) < T.p300AmplitudeLow) eegScore += 2;
  if ((eeg.n200Latency ?? 0) > T.n200LatencyHigh) eegScore += 1;
  if ((eeg.mmnLatency ?? 0) > T.mmnLatencyHigh) eegScore += 1;
  if (eeg.connectivityFlag) eegScore += 1;

  return eegScore;
}

export function scoreSensory(sensory: SensoryInput) {
  let sensoryScore = 0;

  if ((sensory.olfactoryScore ?? Number.POSITIVE_INFINITY) <= T.olfactoryImpairmentCutoff) sensoryScore += 2;
  if (sensory.hearingFlag) sensoryScore += 1;
  if (sensory.visualFlag) sensoryScore += 1;

  return sensoryScore;
}

export function scoreBlood(blood: BloodInput) {
  let bloodScore = 0;
  const abetaRatio = calculateAbetaRatio(blood.abeta42, blood.abeta40);

  const amyloidPositive = abetaRatio !== null && abetaRatio < T.abetaRatioLow;
  const tauPositive = (blood.pTau181 ?? 0) > T.pTau181High || (blood.totalTau ?? 0) > T.totalTauHigh;
  const neurodegenerationPositive = (blood.nfl ?? 0) > T.nflHigh;
  const inflammatoryFlag =
    (blood.crp ?? 0) > T.crpHigh ||
    (blood.il6 ?? 0) > T.il6High ||
    (blood.tnfAlpha ?? 0) > T.tnfAlphaHigh;

  if (amyloidPositive) bloodScore += 3;
  if (tauPositive) bloodScore += 3;
  if (neurodegenerationPositive) bloodScore += 2;
  if (inflammatoryFlag) bloodScore += 1;

  return {
    bloodScore,
    abetaRatio,
    amyloidPositive,
    tauPositive,
    neurodegenerationPositive,
    inflammatoryFlag,
  };
}
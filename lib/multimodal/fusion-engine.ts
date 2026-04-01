import { scoreBlood, scoreEeg, scoreSensory } from "./calculations";
import { riskPercentFromScore, stageCognition } from "./staging";
import type { MultimodalFormData, MultimodalResult } from "./types";

export function generateMultimodalResult(data: MultimodalFormData): MultimodalResult {
  const eegScore = scoreEeg(data.eeg);
  const sensoryScore = scoreSensory(data.sensory);
  const blood = scoreBlood(data.blood);

  const totalScore = eegScore + sensoryScore + blood.bloodScore;
  const cognitiveBand = stageCognition(totalScore);
  const riskPercent = riskPercentFromScore(totalScore);

  const probableADProfile = blood.amyloidPositive && blood.tauPositive;
  const mixedNonADPattern = blood.inflammatoryFlag && !probableADProfile;
  const specialistReferral =
    cognitiveBand === "Mild Dementia" ||
    cognitiveBand === "Moderate Dementia" ||
    cognitiveBand === "Severe Dementia" ||
    (probableADProfile && totalScore >= 6);

  const clinicalSummary = [
    `Classification: ${cognitiveBand}.`,
    probableADProfile
      ? "Pattern supports probable Alzheimer’s disease biology."
      : "AD-profile not fully established from current markers.",
    mixedNonADPattern
      ? "Inflammatory or mixed non-AD contributions should be considered."
      : "No strong mixed-pattern flag from current support markers.",
    specialistReferral
      ? "Specialist assessment is recommended."
      : "Routine follow-up and serial monitoring can be considered.",
  ].join(" ");

  return {
    cognitiveBand,
    probableADProfile,
    mixedNonADPattern,
    specialistReferral,
    riskPercent,
    breakdown: {
      eegScore,
      sensoryScore,
      bloodScore: blood.bloodScore,
      totalScore,
      amyloidPositive: blood.amyloidPositive,
      tauPositive: blood.tauPositive,
      neurodegenerationPositive: blood.neurodegenerationPositive,
      inflammatoryFlag: blood.inflammatoryFlag,
      abetaRatio: blood.abetaRatio,
    },
    clinicalSummary,
  };
}
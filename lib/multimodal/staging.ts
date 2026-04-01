import type { CognitiveBand } from "./types";

export function stageCognition(totalScore: number): CognitiveBand {
  if (totalScore === 0) return "Normal Cognition";
  if (totalScore <= 2) return "At-Risk Cognitive Decline";
  if (totalScore <= 5) return "Early MCI";
  if (totalScore <= 8) return "Intermediate MCI";
  if (totalScore <= 11) return "Advanced MCI";
  if (totalScore <= 14) return "Mild Dementia";
  if (totalScore <= 17) return "Moderate Dementia";
  return "Severe Dementia";
}

export function riskPercentFromScore(totalScore: number): number {
  if (totalScore === 0) return 8;
  if (totalScore <= 2) return 24;
  if (totalScore <= 5) return 38;
  if (totalScore <= 8) return 56;
  if (totalScore <= 11) return 72;
  if (totalScore <= 14) return 84;
  if (totalScore <= 17) return 92;
  return 98;
}
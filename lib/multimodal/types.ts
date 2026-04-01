export type CognitiveBand =
  | "Normal Cognition"
  | "At-Risk Cognitive Decline"
  | "Early MCI"
  | "Intermediate MCI"
  | "Advanced MCI"
  | "Mild Dementia"
  | "Moderate Dementia"
  | "Severe Dementia";

export interface EegErpInput {
  thetaAlphaRatio: number | null;
  alphaPower: number | null;
  betaPower: number | null;
  thetaPower: number | null;
  deltaPower: number | null;
  connectivityFlag: boolean;
  p300Latency: number | null;
  p300Amplitude: number | null;
  n200Latency: number | null;
  mmnLatency: number | null;
}

export interface SensoryInput {
  olfactoryScore: number | null;
  hearingFlag: boolean;
  visualFlag: boolean;
  auditoryErpLatency: number | null;
  visualErpLatency: number | null;
  olfactoryErpLatency: number | null;
}

export interface BloodInput {
  abeta42: number | null;
  abeta40: number | null;
  pTau181: number | null;
  totalTau: number | null;
  nfl: number | null;
  crp: number | null;
  il6: number | null;
  tnfAlpha: number | null;
}

export interface MultimodalFormData {
  userId: string;
  eeg: EegErpInput;
  sensory: SensoryInput;
  blood: BloodInput;
  notes?: string;
}

export interface MultimodalScoreBreakdown {
  eegScore: number;
  sensoryScore: number;
  bloodScore: number;
  totalScore: number;
  amyloidPositive: boolean;
  tauPositive: boolean;
  neurodegenerationPositive: boolean;
  inflammatoryFlag: boolean;
  abetaRatio: number | null;
}

export interface MultimodalResult {
  cognitiveBand: CognitiveBand;
  probableADProfile: boolean;
  mixedNonADPattern: boolean;
  specialistReferral: boolean;
  riskPercent: number;
  breakdown: MultimodalScoreBreakdown;
  clinicalSummary: string;
}
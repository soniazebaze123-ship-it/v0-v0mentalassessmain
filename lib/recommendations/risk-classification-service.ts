// ============================================================================
// RISK CLASSIFICATION & RECOMMENDATIONS SERVICE
// Master Blueprint: Section 4.1 - Risk Classification Recommendation
// ============================================================================
// Location: lib/recommendations/risk-classification-service.ts
// Purpose: Generate clinical risk classifications and recommendations

import { createClient } from "@/lib/supabase/client";
import type { MoCAScores } from "@/lib/moca/moca-service";
import type { MMSEScores } from "@/lib/mmse/mmse-service";

export interface RiskClassificationInput {
  mmse_score?: number;
  moca_score?: number;
  sensory_impairments?: {
    vision: boolean;
    hearing: boolean;
    olfactory: boolean;
  };
  multisensory_concerns?: boolean;
  age?: number;
}

export interface RiskClassificationOutput {
  risk_classification: "normal" | "mild_risk" | "moderate_risk" | "high_risk";
  recommendation_text: string;
  referral_needed: boolean;
  referral_reason?: string;
}

// ============================================================================
// THRESHOLDS (per Master Blueprint Section 4.1)
// ============================================================================
// These should be configurable per institution/PI

const THRESHOLDS = {
  MMSE: {
    NORMAL: { min: 24, max: 30 }, // 24-30 = normal cognition
    MILD: { min: 18, max: 23 }, // 18-23 = mild cognitive impairment
    MODERATE: { min: 10, max: 17 }, // 10-17 = moderate impairment
    SEVERE: { min: 0, max: 9 }, // 0-9 = severe impairment
  },
  MOCA: {
    NORMAL: { min: 26, max: 30 }, // 26-30 = normal cognition
    MILD: { min: 18, max: 25 }, // 18-25 = mild cognitive impairment
    MODERATE: { min: 10, max: 17 }, // 10-17 = moderate impairment
    SEVERE: { min: 0, max: 9 }, // 0-9 = severe impairment
  },
};

// ============================================================================
// RISK CLASSIFICATION LOGIC
// ============================================================================

export function classifyRisk(input: RiskClassificationInput): RiskClassificationOutput {
  let riskLevel: "normal" | "mild_risk" | "moderate_risk" | "high_risk" = "normal";
  let riskFactors: string[] = [];

  // Evaluate MMSE score
  if (input.mmse_score !== undefined) {
    if (input.mmse_score >= THRESHOLDS.MMSE.NORMAL.min) {
      riskFactors.push("MMSE: Normal");
    } else if (input.mmse_score >= THRESHOLDS.MMSE.MILD.min) {
      riskLevel = "mild_risk";
      riskFactors.push("MMSE: Borderline/Mild impairment");
    } else if (input.mmse_score >= THRESHOLDS.MMSE.MODERATE.min) {
      riskLevel = "moderate_risk";
      riskFactors.push("MMSE: Moderate impairment");
    } else {
      riskLevel = "high_risk";
      riskFactors.push("MMSE: Severe impairment");
    }
  }

  // Evaluate MoCA score
  if (input.moca_score !== undefined) {
    if (input.moca_score >= THRESHOLDS.MOCA.NORMAL.min) {
      riskFactors.push("MoCA: Normal");
    } else if (input.moca_score >= THRESHOLDS.MOCA.MILD.min) {
      riskLevel = riskLevel === "high_risk" ? "high_risk" : "mild_risk";
      riskFactors.push("MoCA: Borderline/Mild impairment");
    } else if (input.moca_score >= THRESHOLDS.MOCA.MODERATE.min) {
      riskLevel = "moderate_risk";
      riskFactors.push("MoCA: Moderate impairment");
    } else {
      riskLevel = "high_risk";
      riskFactors.push("MoCA: Severe impairment");
    }
  }

  // Evaluate sensory impairments
  if (input.sensory_impairments) {
    const sensoryCount = [
      input.sensory_impairments.vision,
      input.sensory_impairments.hearing,
      input.sensory_impairments.olfactory,
    ].filter(Boolean).length;

    if (sensoryCount >= 2) {
      riskLevel = riskLevel === "normal" ? "mild_risk" : riskLevel;
      riskFactors.push("Multiple sensory deficits (early AD risk marker)");
    } else if (sensoryCount === 1) {
      riskFactors.push("Single sensory deficit noted");
    }
  }

  // Generate recommendation text and referral guidance
  const { recommendationText, referralNeeded, referralReason } =
    generateRecommendation(riskLevel, riskFactors, input);

  return {
    risk_classification: riskLevel,
    recommendation_text: recommendationText,
    referral_needed: referralNeeded,
    referral_reason: referralReason,
  };
}

// ============================================================================
// RECOMMENDATION TEXT GENERATION
// ============================================================================

function generateRecommendation(
  riskLevel: string,
  riskFactors: string[],
  input: RiskClassificationInput
): { recommendationText: string; referralNeeded: boolean; referralReason?: string } {
  const age = input.age || 0;
  const factorSummary = riskFactors.join(" | ");

  switch (riskLevel) {
    case "normal":
      return {
        recommendationText: `Normal cognitive screening result. ${factorSummary}. Routine follow-up recommended annually or per clinical judgment. Continue cognitive health maintenance.`,
        referralNeeded: false,
      };

    case "mild_risk":
      return {
        recommendationText: `Borderline or mild cognitive concerns detected. ${factorSummary}. Recommend cognitive screening repeat in 6-12 months. Consider lifestyle modifications and cognitive training.`,
        referralNeeded: age > 60 ? true : false,
        referralReason:
          age > 60
            ? "Age > 60 with borderline scores warrants neuropsychological review"
            : undefined,
      };

    case "moderate_risk":
      return {
        recommendationText: `Moderate cognitive impairment detected. ${factorSummary}. Formal neuropsychological assessment is strongly recommended. Assess for reversible causes (depression, medication, medical comorbidities).`,
        referralNeeded: true,
        referralReason: "Moderate impairment requires specialist evaluation",
      };

    case "high_risk":
      return {
        recommendationText: `Significant cognitive impairment detected with high concern for neurodegenerative disease. ${factorSummary}. Urgent specialist referral recommended. Initiate diagnostic workup including imaging and biomarker assessment.`,
        referralNeeded: true,
        referralReason:
          "High-risk cognitive impairment pattern - urgent specialist assessment required",
      };

    default:
      return {
        recommendationText:
          "Unable to classify risk. Please review assessment results.",
        referralNeeded: false,
      };
  }
}

// ============================================================================
// SAVE RECOMMENDATIONS TO DATABASE
// ============================================================================

export async function saveRecommendations(
  sessionId: string,
  classification: RiskClassificationOutput
) {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("recommendations")
    .insert({
      session_id: sessionId,
      risk_classification: classification.risk_classification,
      recommendation_text: classification.recommendation_text,
      referral_needed: classification.referral_needed,
      referral_reason: classification.referral_reason,
    })
    .single();

  if (error) {
    throw error;
  }

  return data;
}

// ============================================================================
// RETRIEVE RECOMMENDATIONS
// ============================================================================

export async function getRecommendations(sessionId: string) {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("recommendations")
    .select("*")
    .eq("session_id", sessionId)
    .single();

  if (error && error.code !== "PGRST116") {
    throw error;
  }

  return data;
}

// ============================================================================
// CONFIGURABLE THRESHOLDS (for PI customization)
// ============================================================================

export function updateThresholds(newThresholds: typeof THRESHOLDS) {
  // This would typically be stored in a settings table
  // Configuration per institution can be added here
}

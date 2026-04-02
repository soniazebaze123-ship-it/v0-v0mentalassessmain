import { createClient } from "@/lib/supabase/server";

export async function getMultimodalAssessmentStats() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("multimodal_assessments")
    .select("cognitive_band, risk_percent, probable_ad_profile, specialist_referral, created_at");

  if (error) throw error;

  const rows = data ?? [];
  const total = rows.length;
  const adProfileCount = rows.filter((item) => item.probable_ad_profile).length;
  const referralCount = rows.filter((item) => item.specialist_referral).length;

  const stageDistribution = rows.reduce<Record<string, number>>((acc, item) => {
    acc[item.cognitive_band] = (acc[item.cognitive_band] ?? 0) + 1;
    return acc;
  }, {});

  const averageRisk = total
    ? rows.reduce((sum, item) => sum + Number(item.risk_percent ?? 0), 0) / total
    : 0;

  return {
    total,
    adProfileCount,
    referralCount,
    averageRisk,
    stageDistribution,
  };
}

// ⚠️ PHASE 4 DEFERRED - Multimodal cognitive intelligence
// This module has been deferred to Phase 4 (Sprint 4) after core MMSE/MoCA stabilization
// See: PHASE_4_MULTIMODAL_DEFERRAL.md for rationale and reactivation criteria
/*
15) dashboard.tsx integration snippet (INACTIVE - Phase 4)
{
  id: "multimodal-cognitive-intelligence",
  title: "Multimodal Cognitive Intelligence",
  description: "EEG, sensory markers, and blood biomarkers for early cognitive staging.",
  href: "/multimodal",
}
*/
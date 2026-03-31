"use server";

import { multimodalSchema } from "@/lib/multimodal/validation";
import { generateMultimodalResult } from "@/lib/multimodal/fusion-engine";
import { createClient } from "@/lib/supabase/server";

export async function saveMultimodalAssessment(input: unknown) {
  const parsed = multimodalSchema.safeParse(input);

  if (!parsed.success) {
    return { ok: false as const, error: parsed.error.flatten() };
  }

  const supabase = await createClient();
  const result = generateMultimodalResult(parsed.data);

  const { error } = await supabase.from("multimodal_assessments").insert({
    user_id: parsed.data.userId,
    eeg_input: parsed.data.eeg,
    sensory_input: parsed.data.sensory,
    blood_input: parsed.data.blood,
    result_payload: result,
    cognitive_band: result.cognitiveBand,
    probable_ad_profile: result.probableADProfile,
    mixed_non_ad_pattern: result.mixedNonADPattern,
    specialist_referral: result.specialistReferral,
    risk_percent: result.riskPercent,
    notes: parsed.data.notes ?? null,
  });

  if (error) {
    return { ok: false as const, error: error.message };
  }

  return { ok: true as const, result };
}
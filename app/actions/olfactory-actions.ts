"use server"

import { createClient } from "@/lib/supabase/server"
import type { OlfactorySubmission } from "@/lib/olfactory/types"

interface SaveResultResponse {
  success: boolean
  error?: string
}

export async function saveOlfactoryResult(payload: OlfactorySubmission): Promise<SaveResultResponse> {
  try {
    const supabase = await createClient()
    const { data: authData } = await supabase.auth.getUser()
    const userId = authData.user?.id ?? null

    const { data: testInsert, error: testError } = await supabase
      .from("olfactory_temp_tests")
      .insert({
        user_id: userId,
        patient_id: payload.patientId ?? null,
        language: payload.language,
        test_name: payload.testName,
        tested_at: payload.testedAt,
        protocol_version: payload.protocolVersion ?? "temp_v1",
        item_set_version: payload.itemSetVersion ?? "temp_v1_items_8",
        scoring_version: payload.scoringVersion ?? "temp_v1_scoring",
        notes: payload.notes ?? null,
        total_questions: payload.result.totalQuestions,
        correct_count: payload.result.correctCount,
        score_percent: payload.result.scorePercent,
        risk_level: payload.result.riskLevel,
        interpretation_en: payload.result.interpretation.en,
        interpretation_zh: payload.result.interpretation.zh,
        interpretation_fr: payload.result.interpretation.fr,
        raw_result_json: payload.result,
      })
      .select("id")
      .single()

    if (testError) {
      return { success: false, error: testError.message }
    }

    const itemRows = payload.result.items.map((item) => ({
      test_id: testInsert.id as string,
      question_id: item.questionId,
      scent_key: item.scent,
      selected_answer: item.selectedAnswer,
      correct_answer: item.correctAnswer,
      is_correct: item.isCorrect,
      confidence: item.confidence,
      response_time_ms: item.responseTimeMs,
    }))

    const { error: itemsError } = await supabase.from("olfactory_temp_test_items").insert(itemRows)
    if (itemsError) {
      return { success: false, error: itemsError.message }
    }

    return { success: true }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    }
  }
}

// ============================================================================
// MOCA SERVICE - Item-Level Scoring & Storage with Education Adjustment
// Master Blueprint: Section 4 - Exact MoCA Scoring Logic
// ============================================================================
// Location: lib/moca/moca-service.ts
// Purpose: Save MoCA results with education adjustment per validated rule

import { createClient } from "@/lib/supabase/client";

export interface MoCAItemAnswers {
  // Visuospatial/Executive (5 points)
  trail_making_b_correct: boolean; // 0 or 1
  cube_copy_correct: boolean; // 0 or 1
  clock_contour_correct: boolean; // 0 or 1
  clock_numbers_correct: boolean; // 0 or 1
  clock_hands_correct: boolean; // 0 or 1

  // Naming (3 points)
  naming_animal_1: string; // e.g., "tiger"
  naming_animal_2: string; // e.g., "rhinoceros"
  naming_animal_3: string; // e.g., "camel"

  // Attention (6 points)
  digit_span_forward_correct: boolean; // 0 or 1
  digit_span_backward_correct: boolean; // 0 or 1
  vigilance_tapping_correct: boolean; // 0 or 1
  serial_7s_steps_correct: number; // 0-3 (number of correct subtractions)

  // Language (3 points)
  sentence_1_repetition_correct: boolean; // 0 or 1
  sentence_2_repetition_correct: boolean; // 0 or 1
  verbal_fluency_correct: boolean; // 0 or 1

  // Abstraction (2 points)
  similarity_pair_1_correct: boolean; // 0 or 1
  similarity_pair_2_correct: boolean; // 0 or 1

  // Delayed Recall (5 points)
  recall_word_1: string;
  recall_word_2: string;
  recall_word_3: string;
  recall_word_4: string;
  recall_word_5: string;

  // Orientation (6 points)
  date_correct: boolean; // 0 or 1
  month_correct: boolean; // 0 or 1
  year_correct: boolean; // 0 or 1
  day_correct: boolean; // 0 or 1
  place_correct: boolean; // 0 or 1
  city_correct: boolean; // 0 or 1
}

export interface MoCAScores {
  visuospatial_exec_score: number; // 0-5
  naming_score: number; // 0-3
  attention_score: number; // 0-6
  language_score: number; // 0-3
  abstraction_score: number; // 0-2
  delayed_recall_score: number; // 0-5
  orientation_score: number; // 0-6
  total_score_raw: number; // 0-30
  education_adjustment: number; // 0 or 1
  total_score_final: number; // 0-31
}

// ============================================================================
// SCORING FUNCTIONS (per Master Blueprint Section 4)
// ============================================================================

function scoreVisuospatialExecutive(answers: MoCAItemAnswers): number {
  let score = 0;
  if (answers.trail_making_b_correct) score += 1;
  if (answers.cube_copy_correct) score += 1;
  score += answers.clock_contour_correct ? 1 : 0; // 1 point
  score += answers.clock_numbers_correct ? 1 : 0; // 1 point
  score += answers.clock_hands_correct ? 1 : 0; // 1 point
  return Math.min(score, 5);
}

function scoreNaming(answers: MoCAItemAnswers): number {
  let score = 0;
  const expectedAnimals = ["tiger", "rhinoceros", "camel"];
  const provided = [answers.naming_animal_1, answers.naming_animal_2, answers.naming_animal_3];

  for (let i = 0; i < 3; i++) {
    if (provided[i]?.toLowerCase().includes(expectedAnimals[i].toLowerCase())) {
      score += 1;
    }
  }
  return Math.min(score, 3);
}

function scoreAttention(answers: MoCAItemAnswers): number {
  let score = 0;
  if (answers.digit_span_forward_correct) score += 1; // 1 point
  if (answers.digit_span_backward_correct) score += 1; // 1 point
  if (answers.vigilance_tapping_correct) score += 1; // 1 point
  score += Math.min(answers.serial_7s_steps_correct, 3); // 0-3 points
  return Math.min(score, 6);
}

function scoreLanguage(answers: MoCAItemAnswers): number {
  let score = 0;

  // Moderate sentence: "The nurse is helping the patient in the hospital."
  if (answers.sentence_1_repetition_correct) score += 1; // 1 point

  // Difficult sentence: "The little boy carried a basket of fresh flowers to his grandmother’s house."
  if (answers.sentence_2_repetition_correct) score += 1; // 1 point

  if (answers.verbal_fluency_correct) score += 1; // 1 point

  return Math.min(score, 3);
}

function scoreAbstraction(answers: MoCAItemAnswers): number {
  let score = 0;
  if (answers.similarity_pair_1_correct) score += 1;
  if (answers.similarity_pair_2_correct) score += 1;
  return Math.min(score, 2);
}

function scoreDelayedRecall(
  answers: MoCAItemAnswers,
  registered_words: string[] = ["Velvet", "Church", "Daisy", "Red", "Car"]
): number {
  let score = 0;
  const recalled = [
    answers.recall_word_1,
    answers.recall_word_2,
    answers.recall_word_3,
    answers.recall_word_4,
    answers.recall_word_5,
  ];

  for (let i = 0; i < 5; i++) {
    if (recalled[i]?.toLowerCase().trim() === registered_words[i]?.toLowerCase().trim()) {
      score += 1;
    }
  }
  return Math.min(score, 5);
}

function scoreOrientation(answers: MoCAItemAnswers): number {
  let score = 0;
  if (answers.date_correct) score += 1;
  if (answers.month_correct) score += 1;
  if (answers.year_correct) score += 1;
  if (answers.day_correct) score += 1;
  if (answers.place_correct) score += 1;
  if (answers.city_correct) score += 1;
  return Math.min(score, 6);
}

// ============================================================================
// APPLY EDUCATION ADJUSTMENT (Master Blueprint Critical Rule)
// ============================================================================
// Rule: Add 1 point if education <= 12 years
// Store raw, adjustment, and final separately

export function applyEducationAdjustment(
  totalScore: number,
  _educationYears: number
): { education_adjustment: number; total_score_final: number } {
  // User-configured rule: no education bonus point.
  return {
    education_adjustment: 0,
    total_score_final: Math.min(totalScore, 30),
  };
}

// ============================================================================
// CALCULATE TOTAL MOCA SCORES
// ============================================================================

export function calculateMoCAScores(
  answers: MoCAItemAnswers,
  registeredWords: string[] = ["Velvet", "Church", "Daisy", "Red", "Car"],
  educationYears: number = 12
): MoCAScores {
  const visuospatial_exec_score = scoreVisuospatialExecutive(answers);
  const naming_score = scoreNaming(answers);
  const attention_score = scoreAttention(answers);
  const language_score = scoreLanguage(answers);
  const abstraction_score = scoreAbstraction(answers);
  const delayed_recall_score = scoreDelayedRecall(answers, registeredWords);
  const orientation_score = scoreOrientation(answers);

  const total_score_raw =
    visuospatial_exec_score +
    naming_score +
    attention_score +
    language_score +
    abstraction_score +
    delayed_recall_score +
    orientation_score;

  const { education_adjustment, total_score_final } = applyEducationAdjustment(
    total_score_raw,
    educationYears
  );

  return {
    visuospatial_exec_score,
    naming_score,
    attention_score,
    language_score,
    abstraction_score,
    delayed_recall_score,
    orientation_score,
    total_score_raw,
    education_adjustment,
    total_score_final,
  };
}

// ============================================================================
// SAVE MOCA RESULTS TO DATABASE
// ============================================================================

export async function saveMoCAResults(
  sessionId: string,
  answers: MoCAItemAnswers,
  scores: MoCAScores
) {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("moca_results")
    .insert({
      session_id: sessionId,
      visuospatial_exec_score: scores.visuospatial_exec_score,
      naming_score: scores.naming_score,
      attention_score: scores.attention_score,
      language_score: scores.language_score,
      abstraction_score: scores.abstraction_score,
      delayed_recall_score: scores.delayed_recall_score,
      orientation_score: scores.orientation_score,
      total_score_raw: scores.total_score_raw,
      education_adjustment: scores.education_adjustment,
      total_score_final: scores.total_score_final,
      raw_answers: answers,
    })
    .single();

  if (error) {
    console.error("❌ Error saving MoCA results:", error);
    throw error;
  }

  return data;
}

// ============================================================================
// RETRIEVE MOCA RESULTS
// ============================================================================

export async function getMoCAResults(sessionId: string) {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("moca_results")
    .select("*")
    .eq("session_id", sessionId)
    .single();

  if (error && error.code !== "PGRST116") {
    // PGRST116 = no rows
    console.error("❌ Error retrieving MoCA results:", error);
    throw error;
  }

  return data;
}


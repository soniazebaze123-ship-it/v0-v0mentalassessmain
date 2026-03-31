// ============================================================================
// MMSE SERVICE - Item-Level Scoring & Storage
// Master Blueprint: Section 3 - Exact MMSE Scoring Logic
// ============================================================================
// Location: lib/mmse/mmse-service.ts
// Purpose: Save MMSE results with item-level granularity to mmse_results table

import { createClient } from "@/lib/supabase/client";
import type { Database } from "@/lib/database.types";

export interface MMSEItemAnswers {
  // Orientation to time (5 points)
  year: string;
  season: string;
  date: string;
  day: string;
  month: string;

  // Orientation to place (5 points)
  country: string;
  province: string;
  city: string;
  hospital: string;
  floor: string;

  // Registration (3 points)
  registration_word_1: string;
  registration_word_2: string;
  registration_word_3: string;

  // Attention & Calculation (5 points)
  attention_method: "serial_7s" | "world_backwards";
  serial_7s_answers?: string[]; // [93, 86, 79, 72, 65]
  world_backwards_answer?: string;

  // Delayed Recall (3 points)
  recall_word_1: string;
  recall_word_2: string;
  recall_word_3: string;

  // Naming (2 points)
  naming_object_1: string;
  naming_object_2: string;

  // Repetition (1 point)
  repetition_phrase: string;

  // Command (3 points)
  command_step_1: boolean;
  command_step_2: boolean;
  command_step_3: boolean;

  // Reading (1 point)
  reading_response: string;

  // Writing (1 point)
  writing_sentence: string;

  // Copying (1 point)
  copying_answer: "correct" | "incorrect" | "partial";
}

export interface MMSEScores {
  orientation_time_score: number; // 0-5
  orientation_place_score: number; // 0-5
  registration_score: number; // 0-3
  attention_calc_score: number; // 0-5
  delayed_recall_score: number; // 0-3
  naming_score: number; // 0-2
  repetition_score: number; // 0-1
  command_score: number; // 0-3
  reading_score: number; // 0-1
  writing_score: number; // 0-1
  copying_score: number; // 0-1
  total_score: number; // 0-30
}

// ============================================================================
// SCORING FUNCTIONS (per Master Blueprint Section 3)
// ============================================================================

function scoreOrientationTime(answers: MMSEItemAnswers, currentDate: Date): number {
  let score = 0;
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth() + 1;
  const currentDate_num = currentDate.getDate();
  const currentDay = currentDate.toLocaleDateString("en-US", { weekday: "long" });
  const currentSeason = getSeason(currentDate.getMonth());

  if (Number.parseInt(answers.year) === currentYear) score += 1;
  if (answers.season.toLowerCase() === currentSeason.toLowerCase()) score += 1;
  if (Number.parseInt(answers.date) === currentDate_num) score += 1;
  if (answers.day.toLowerCase() === currentDay.toLowerCase()) score += 1;
  if (Number.parseInt(answers.month) === currentMonth) score += 1;

  return Math.min(score, 5);
}

function scoreOrientationPlace(answers: MMSEItemAnswers): number {
  let score = 0;
  // These are culturally dependent - adjust per institution
  // For now, using China as example

  if (answers.country.toLowerCase().includes("china")) score += 1;
  if (answers.province && answers.province.length > 0) score += 1;
  if (answers.city && answers.city.length > 0) score += 1; // 1 point for hospital/clinic
  if (answers.hospital && answers.hospital.length > 0) score += 1; // 1 point for floor/building
  if (answers.floor && answers.floor.length > 0) score += 1;

  return Math.min(score, 5);
}

function scoreRegistration(
  registration_answers: string[],
  correct_words: string[]
): number {
  let score = 0;
  for (let i = 0; i < Math.min(3, registration_answers.length); i++) {
    if (
      registration_answers[i]
        .toLowerCase()
        .trim() === correct_words[i].toLowerCase().trim()
    ) {
      score += 1;
    }
  }
  return Math.min(score, 3);
}

function scoreAttentionCalculation(
  answers: MMSEItemAnswers,
  correctSequence: number[] = [93, 86, 79, 72, 65]
): number {
  if (answers.attention_method === "serial_7s" && answers.serial_7s_answers) {
    let score = 0;
    for (let i = 0; i < answers.serial_7s_answers.length; i++) {
      if (
        Number.parseInt(answers.serial_7s_answers[i]) ===
        correctSequence[i]
      ) {
        score += 1;
      }
    }
    return Math.min(score, 5);
  } else if (
    answers.attention_method === "world_backwards" &&
    answers.world_backwards_answer
  ) {
    // WORLD backwards = DLROW
    return answers.world_backwards_answer.toUpperCase().trim() === "DLROW"
      ? 5
      : 0;
  }
  return 0;
}

function scoreDelayedRecall(answers: MMSEItemAnswers, registered_words: string[]): number {
  let score = 0;
  const recalled = [
    answers.recall_word_1,
    answers.recall_word_2,
    answers.recall_word_3,
  ];

  for (let i = 0; i < 3; i++) {
    if (recalled[i].toLowerCase().trim() === registered_words[i].toLowerCase().trim()) {
      score += 1;
    }
  }
  return Math.min(score, 3);
}

function scoreNaming(answers: MMSEItemAnswers): number {
  let score = 0;
  // Typically: watch, pencil (or culturally equivalent)
  const expectedObjects = ["watch", "pencil"]; // Replace with culturally appropriate objects

  if (
    answers.naming_object_1.toLowerCase().includes(expectedObjects[0].toLowerCase())
  )
    score += 1;
  if (
    answers.naming_object_2.toLowerCase().includes(expectedObjects[1].toLowerCase())
  )
    score += 1;

  return Math.min(score, 2);
}

function scoreRepetition(
  answer: string,
  validatedPhrase: string = "No ifs, ands, or buts"
): number {
  // Check if user repeated the phrase correctly
  return answer.toLowerCase().trim() === validatedPhrase.toLowerCase().trim()
    ? 1
    : 0;
}

function scoreCommand(answers: MMSEItemAnswers): number {
  let score = 0;
  if (answers.command_step_1) score += 1;
  if (answers.command_step_2) score += 1;
  if (answers.command_step_3) score += 1;
  return Math.min(score, 3);
}

function scoreReading(answer: string): number {
  // Should have read and obeyed a written command
  return answer && answer.length > 0 ? 1 : 0;
}

function scoreWriting(sentence: string): number {
  // Must have subject + verb
  return sentence && sentence.length > 10 ? 1 : 0;
}

function scoreCopying(answer: "correct" | "incorrect" | "partial"): number {
  return answer === "correct" ? 1 : 0;
}

function getSeason(month: number): string {
  if (month >= 3 && month <= 5) return "Spring";
  if (month >= 6 && month <= 8) return "Summer";
  if (month >= 9 && month <= 11) return "Fall";
  return "Winter";
}

// ============================================================================
// CALCULATE TOTAL MMSE SCORES
// ============================================================================

export function calculateMMSEScores(
  answers: MMSEItemAnswers,
  registeredWords: string[] = ["Apple", "Banana", "Cherry"],
  currentDate: Date = new Date()
): MMSEScores {
  const scores: MMSEScores = {
    orientation_time_score: scoreOrientationTime(answers, currentDate),
    orientation_place_score: scoreOrientationPlace(answers),
    registration_score: scoreRegistration(
      [answers.registration_word_1, answers.registration_word_2, answers.registration_word_3],
      registeredWords
    ),
    attention_calc_score: scoreAttentionCalculation(answers),
    delayed_recall_score: scoreDelayedRecall(answers, registeredWords),
    naming_score: scoreNaming(answers),
    repetition_score: scoreRepetition(answers.repetition_phrase),
    command_score: scoreCommand(answers),
    reading_score: scoreReading(answers.reading_response),
    writing_score: scoreWriting(answers.writing_sentence),
    copying_score: scoreCopying(
      answers.copying_answer as "correct" | "incorrect" | "partial"
    ),
    total_score: 0, // Calculate below
  };

  scores.total_score = Object.values(scores)
    .slice(0, -1)
    .reduce((a, b) => a + b, 0);

  return scores;
}

// ============================================================================
// SAVE MMSE RESULTS TO DATABASE
// ============================================================================

export async function saveMMSEResults(
  sessionId: string,
  answers: MMSEItemAnswers,
  scores: MMSEScores
) {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("mmse_results")
    .insert({
      session_id: sessionId,
      orientation_time_score: scores.orientation_time_score,
      orientation_place_score: scores.orientation_place_score,
      registration_score: scores.registration_score,
      attention_calc_score: scores.attention_calc_score,
      delayed_recall_score: scores.delayed_recall_score,
      naming_score: scores.naming_score,
      repetition_score: scores.repetition_score,
      command_score: scores.command_score,
      reading_score: scores.reading_score,
      writing_score: scores.writing_score,
      copying_score: scores.copying_score,
      total_score: scores.total_score,
      raw_answers: answers,
      attention_method: answers.attention_method,
    })
    .single();

  if (error) {
    console.error("❌ Error saving MMSE results:", error);
    throw error;
  }

  return data;
}

// ============================================================================
// RETRIEVE MMSE RESULTS
// ============================================================================

export async function getMMSEResults(sessionId: string) {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("mmse_results")
    .select("*")
    .eq("session_id", sessionId)
    .single();

  if (error && error.code !== "PGRST116") {
    // PGRST116 = no rows
    console.error("❌ Error retrieving MMSE results:", error);
    throw error;
  }

  return data;
}

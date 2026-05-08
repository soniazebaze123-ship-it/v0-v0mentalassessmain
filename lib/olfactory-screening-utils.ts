// Olfactory Screening Utilities for Smell Identification Test

export interface SmellItem {
  id: string
  name: string
  image: string
  category: "food" | "nature" | "household"
}

// Clinical olfactory identification test scents (8 scents, alcohol replaces coffee)
// Images located in /images/olfactory-temp/
export const SMELL_ITEMS: SmellItem[] = [
  { id: "peppermint", name: "Peppermint", image: "/images/olfactory-temp/peppermint.svg", category: "nature" },
  { id: "alcohol",    name: "Alcohol",    image: "/images/olfactory-temp/alcohol.svg",    category: "household" },
  { id: "cloves",     name: "Cloves",     image: "/images/olfactory-temp/cloves.svg",     category: "food" },
  { id: "rose",       name: "Rose",       image: "/images/olfactory-temp/rose.svg",       category: "nature" },
  { id: "ginger",     name: "Ginger",     image: "/images/olfactory-temp/ginger.svg",     category: "food" },
  { id: "jasmine",    name: "Jasmine",    image: "/images/olfactory-temp/jasmine.svg",    category: "nature" },
  { id: "lavender",   name: "Lavender",   image: "/images/olfactory-temp/lavender.svg",   category: "nature" },
  { id: "tea_tree",   name: "Tea Tree",   image: "/images/olfactory-temp/tea-tree.svg",   category: "nature" },
]

export function selectRandomSmells(count = 8): SmellItem[] {
  const shuffled = [...SMELL_ITEMS].sort(() => Math.random() - 0.5)
  return shuffled.slice(0, count)
}

export function generateDistractors(correctSmell: SmellItem, count = 3): SmellItem[] {
  const others = SMELL_ITEMS.filter((item) => item.id !== correctSmell.id)
  const shuffled = others.sort(() => Math.random() - 0.5)
  return shuffled.slice(0, count)
}

export function calculateOlfactoryScore(results: { correct: boolean }[]): {
  totalCorrect: number
  percentCorrect: number
  classification: "normal" | "mild_impairment" | "severe_dysfunction"
  normalizedScore: number
} {
  const totalCorrect = results.filter((r) => r.correct).length
  const total = results.length
  const percentCorrect = (totalCorrect / total) * 100

  // Classification based on clinical sheet:
  // 7-8 correct (out of 8-9): Normal cognition
  // 5-6 correct: Mild impairment
  // 0-4 correct: Severe dysfunction
  let classification: "normal" | "mild_impairment" | "severe_dysfunction"
  if (totalCorrect >= 7) classification = "normal"
  else if (totalCorrect >= 5) classification = "mild_impairment"
  else classification = "severe_dysfunction"

  // Normalize to 0-100 scale based on correct count out of 8
  const normalizedScore = Math.round((totalCorrect / 8) * 100)

  return {
    totalCorrect,
    percentCorrect,
    classification,
    normalizedScore,
  }
}

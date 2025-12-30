// Olfactory Screening Utilities for Smell Identification Test

export interface SmellItem {
  id: string
  name: string
  image: string
  category: "food" | "nature" | "household"
}

// Common smells for identification (culturally appropriate for elderly Asian populations)
export const SMELL_ITEMS: SmellItem[] = [
  { id: "rose", name: "Rose", image: "/images/smells/rose.png", category: "nature" },
  { id: "lemon", name: "Lemon", image: "/images/smells/lemon.png", category: "food" },
  { id: "coffee", name: "Coffee", image: "/images/smells/coffee.png", category: "food" },
  { id: "mint", name: "Mint", image: "/images/smells/mint.png", category: "nature" },
  { id: "orange", name: "Orange", image: "/images/smells/orange.png", category: "food" },
  { id: "soap", name: "Soap", image: "/images/smells/soap.png", category: "household" },
  { id: "vanilla", name: "Vanilla", image: "/images/smells/vanilla.png", category: "food" },
  { id: "garlic", name: "Garlic", image: "/images/smells/garlic.png", category: "food" },
  { id: "chocolate", name: "Chocolate", image: "/images/smells/chocolate.png", category: "food" },
  { id: "pineapple", name: "Pineapple", image: "/images/smells/pineapple.png", category: "food" },
  { id: "cinnamon", name: "Cinnamon", image: "/images/smells/cinnamon.png", category: "food" },
  { id: "grass", name: "Grass", image: "/images/smells/grass.png", category: "nature" },
]

export function selectRandomSmells(count = 6): SmellItem[] {
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
  classification: "normal" | "impaired" | "dysfunction"
  normalizedScore: number
} {
  const totalCorrect = results.filter((r) => r.correct).length
  const total = results.length
  const percentCorrect = (totalCorrect / total) * 100

  // Classification based on identification accuracy
  // Normal: ≥80%, Impaired: 50-79%, Dysfunction: <50%
  let classification: "normal" | "impaired" | "dysfunction"
  if (percentCorrect >= 80) classification = "normal"
  else if (percentCorrect >= 50) classification = "impaired"
  else classification = "dysfunction"

  // Normalize to 0-100 scale (higher = worse)
  // 100% correct = 0, 0% correct = 100
  const normalizedScore = 100 - percentCorrect

  return {
    totalCorrect,
    percentCorrect,
    classification,
    normalizedScore,
  }
}

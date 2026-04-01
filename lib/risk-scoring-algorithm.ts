// Composite Risk Scoring Algorithm for Dementia Screening
// Combines cognitive assessments (MoCA, MMSE) with sensory screening (Visual, Auditory, Olfactory)

export interface CognitiveScores {
  moca?: number // 0-30
  mmse?: number // 0-30
}

export interface SensoryScores {
  visual?: number // 0-100 (normalized, higher = worse impairment)
  auditory?: number // 0-100 (normalized, higher = worse impairment)
  olfactory?: number // 0-100 (normalized, higher = worse impairment)
}

export interface RiskProfile {
  overallRiskScore: number // 0-100 scale
  riskLevel: "low" | "moderate" | "high" | "very_high"
  cognitiveComponent: number // 0-100
  sensoryComponent: number // 0-100
  individualScores: {
    cognitive: CognitiveScores
    sensory: SensoryScores
  }
  recommendations: string[]
  factors: {
    hasCognitiveImpairment: boolean
    hasSensoryImpairment: boolean
    hasMultipleSensoryDeficits: boolean
    severityLevel: "normal" | "mild" | "moderate" | "severe"
  }
}

// Weight factors based on research
const WEIGHTS = {
  cognitive: 0.65, // 65% weight for cognitive assessments
  sensory: 0.35, // 35% weight for sensory assessments
  sensorySubWeights: {
    olfactory: 0.45, // Olfactory has strongest association with dementia
    auditory: 0.3, // Auditory second
    visual: 0.25, // Visual third
  },
}

export function calculateCognitiveScore(scores: CognitiveScores): number {
  // Normalize cognitive scores to 0-100 scale (higher = worse)
  let cognitiveScore = 0
  let count = 0

  if (scores.moca !== undefined) {
    // MoCA: 26-30 = normal, <26 = impairment
    // Convert to 0-100 scale where 30 = 0, 0 = 100
    const mocaImpairment = ((30 - scores.moca) / 30) * 100
    cognitiveScore += mocaImpairment
    count++
  }

  if (scores.mmse !== undefined) {
    // MMSE: 24-30 = normal, <24 = impairment
    // Convert to 0-100 scale where 30 = 0, 0 = 100
    const mmseImpairment = ((30 - scores.mmse) / 30) * 100
    cognitiveScore += mmseImpairment
    count++
  }

  return count > 0 ? cognitiveScore / count : 0
}

export function calculateSensoryScore(scores: SensoryScores): number {
  // Weighted average of sensory impairments
  let sensoryScore = 0
  let totalWeight = 0

  if (scores.olfactory !== undefined) {
    sensoryScore += scores.olfactory * WEIGHTS.sensorySubWeights.olfactory
    totalWeight += WEIGHTS.sensorySubWeights.olfactory
  }

  if (scores.auditory !== undefined) {
    sensoryScore += scores.auditory * WEIGHTS.sensorySubWeights.auditory
    totalWeight += WEIGHTS.sensorySubWeights.auditory
  }

  if (scores.visual !== undefined) {
    sensoryScore += scores.visual * WEIGHTS.sensorySubWeights.visual
    totalWeight += WEIGHTS.sensorySubWeights.visual
  }

  return totalWeight > 0 ? sensoryScore / totalWeight : 0
}

export function calculateCompositeRiskScore(cognitive: CognitiveScores, sensory: SensoryScores): RiskProfile {
  const cognitiveScore = calculateCognitiveScore(cognitive)
  const sensoryScore = calculateSensoryScore(sensory)

  // Calculate overall risk score
  const overallRiskScore = cognitiveScore * WEIGHTS.cognitive + sensoryScore * WEIGHTS.sensory

  // Determine risk level
  let riskLevel: "low" | "moderate" | "high" | "very_high"
  if (overallRiskScore < 25) riskLevel = "low"
  else if (overallRiskScore < 50) riskLevel = "moderate"
  else if (overallRiskScore < 75) riskLevel = "high"
  else riskLevel = "very_high"

  // Analyze factors
  const hasCognitiveImpairment = cognitiveScore > 30
  const hasSensoryImpairment = sensoryScore > 30

  // Count sensory deficits
  const sensoryDeficits = [
    sensory.visual && sensory.visual > 50,
    sensory.auditory && sensory.auditory > 50,
    sensory.olfactory && sensory.olfactory > 50,
  ].filter(Boolean).length

  const hasMultipleSensoryDeficits = sensoryDeficits >= 2

  // Determine severity level
  let severityLevel: "normal" | "mild" | "moderate" | "severe"
  if (overallRiskScore < 20) severityLevel = "normal"
  else if (overallRiskScore < 40) severityLevel = "mild"
  else if (overallRiskScore < 60) severityLevel = "moderate"
  else severityLevel = "severe"

  // Generate recommendations
  const recommendations: string[] = []

  if (hasCognitiveImpairment) {
    recommendations.push("Consider comprehensive neuropsychological evaluation")
    recommendations.push("Discuss cognitive concerns with healthcare provider")
  }

  if (sensory.olfactory && sensory.olfactory > 50) {
    recommendations.push("Olfactory impairment detected - consider neurological consultation")
  }

  if (sensory.auditory && sensory.auditory > 50) {
    recommendations.push("Hearing impairment detected - consider audiological evaluation")
    recommendations.push("Hearing aids may help reduce cognitive decline risk")
  }

  if (sensory.visual && sensory.visual > 50) {
    recommendations.push("Visual impairment detected - consider ophthalmological evaluation")
    recommendations.push("Corrective lenses may improve daily functioning")
  }

  if (hasMultipleSensoryDeficits) {
    recommendations.push("Multiple sensory deficits increase dementia risk - prioritize clinical evaluation")
  }

  if (riskLevel === "high" || riskLevel === "very_high") {
    recommendations.push("High risk profile - recommend immediate clinical assessment")
    recommendations.push("Consider lifestyle modifications: exercise, Mediterranean diet, social engagement")
  }

  if (riskLevel === "moderate") {
    recommendations.push("Moderate risk - schedule follow-up assessment in 6-12 months")
    recommendations.push("Focus on preventive measures and healthy lifestyle")
  }

  if (recommendations.length === 0) {
    recommendations.push("Results within normal range - continue regular health monitoring")
    recommendations.push("Maintain healthy lifestyle to support cognitive health")
  }

  return {
    overallRiskScore: Math.round(overallRiskScore),
    riskLevel,
    cognitiveComponent: Math.round(cognitiveScore),
    sensoryComponent: Math.round(sensoryScore),
    individualScores: {
      cognitive,
      sensory,
    },
    recommendations,
    factors: {
      hasCognitiveImpairment,
      hasSensoryImpairment,
      hasMultipleSensoryDeficits,
      severityLevel,
    },
  }
}

export function getRiskLevelColor(riskLevel: "low" | "moderate" | "high" | "very_high"): string {
  switch (riskLevel) {
    case "low":
      return "text-green-600"
    case "moderate":
      return "text-yellow-600"
    case "high":
      return "text-orange-600"
    case "very_high":
      return "text-red-600"
  }
}

export function getRiskLevelBgColor(riskLevel: "low" | "moderate" | "high" | "very_high"): string {
  switch (riskLevel) {
    case "low":
      return "bg-green-100"
    case "moderate":
      return "bg-yellow-100"
    case "high":
      return "bg-orange-100"
    case "very_high":
      return "bg-red-100"
  }
}

export function getRiskLevelLabel(
  riskLevel: "low" | "moderate" | "high" | "very_high",
  t: (key: string) => string,
): string {
  return t(`risk.level.${riskLevel}`)
}

// Function to fetch all assessment data and calculate composite score
export async function fetchAndCalculateRiskProfile(userId: string, supabase: any): Promise<RiskProfile | null> {
  try {
    const { data: cognitiveData } = await supabase
      .from("assessments")
      .select("type, score")
      .eq("user_id", userId)
      .order("completed_at", { ascending: false })
      .limit(10)

    // Fetch sensory assessments
    const { data: sensoryData } = await supabase
      .from("sensory_assessments")
      .select("test_type, normalized_score")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(10)

    const cognitive: CognitiveScores = {}
    const sensory: SensoryScores = {}

    // Process cognitive data (get most recent of each type)
    if (cognitiveData && cognitiveData.length > 0) {
      const moca = cognitiveData.find((a) => a.type === "MOCA" || a.type === "MoCA")
      const mmse = cognitiveData.find((a) => a.type === "MMSE")

      if (moca) {
        cognitive.moca = moca.score
      }
      if (mmse) {
        cognitive.mmse = mmse.score
      }
    }

    // Process sensory data (get most recent of each type)
    if (sensoryData && sensoryData.length > 0) {
      const visual = sensoryData.find((a) => a.test_type === "visual")
      const auditory = sensoryData.find((a) => a.test_type === "auditory")
      const olfactory = sensoryData.find((a) => a.test_type === "olfactory")

      if (visual) sensory.visual = visual.normalized_score
      if (auditory) sensory.auditory = auditory.normalized_score
      if (olfactory) sensory.olfactory = olfactory.normalized_score
    }

    // Need at least one assessment to calculate risk
    if (Object.keys(cognitive).length === 0 && Object.keys(sensory).length === 0) {
      return null
    }

    return calculateCompositeRiskScore(cognitive, sensory)
  } catch (error) {
    return null
  }
}

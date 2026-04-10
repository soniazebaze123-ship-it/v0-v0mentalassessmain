import type { Assessment } from "@/components/admin-panel" // Assuming Assessment type is exported or defined here

export interface AverageScores {
  moca: number
  mmse: number
}

export interface ScoreDistributionData {
  name: string
  value: number
  color: string
}

export interface TrendData {
  date: string
  score: number
  type: string // Include type for potential multi-line chart
}

// Define score bands for MoCA and MMSE
const MOCA_SCORE_BANDS = [
  { name: "26-30 (Normal)", min: 26, max: 30, color: "#22c55e" }, // green-500
  { name: "18-25 (Mild Impairment)", min: 18, max: 25, color: "#eab308" }, // yellow-500
  { name: "<18 (Possible Decline)", min: 0, max: 17, color: "#ef4444" }, // red-500
]

const MMSE_SCORE_BANDS = [
  { name: "21-28 (Normal)", min: 21, max: 28, color: "#22c55e" }, // green-500
  { name: "15-20 (Mild Impairment)", min: 15, max: 20, color: "#eab308" }, // yellow-500
  { name: "<14 (Severe Impairment)", min: 0, max: 14, color: "#ef4444" }, // red-500
]

export function calculateAverageScores(assessments: Assessment[]): AverageScores {
  if (!assessments || assessments.length === 0) {
    return { moca: 0, mmse: 0 }
  }

  const mocaScores = assessments.filter((a) => a.assessment_type === "MOCA").map((a) => a.total_score)
  const mmseScores = assessments.filter((a) => a.assessment_type === "MMSE").map((a) => a.total_score)

  const avgMoca = mocaScores.length > 0 ? mocaScores.reduce((sum, score) => sum + score, 0) / mocaScores.length : 0
  const avgMmse = mmseScores.length > 0 ? mmseScores.reduce((sum, score) => sum + score, 0) / mmseScores.length : 0

  return { moca: avgMoca, mmse: avgMmse }
}

export function getScoreDistribution(assessments: Assessment[], type: "MOCA" | "MMSE"): ScoreDistributionData[] {
  if (!assessments || assessments.length === 0) {
    const bands = type === "MOCA" ? MOCA_SCORE_BANDS : MMSE_SCORE_BANDS
    return bands.map((band) => ({
      name: band.name,
      value: 0,
      color: band.color,
    }))
  }

  const filteredAssessments = assessments.filter((a) => a.assessment_type === type)
  const scoreCounts: Record<string, number> = {}
  const bands = type === "MOCA" ? MOCA_SCORE_BANDS : MMSE_SCORE_BANDS

  bands.forEach((band) => {
    scoreCounts[band.name] = 0
  })

  filteredAssessments.forEach((assessment) => {
    const score = assessment.total_score
    for (const band of bands) {
      if (score >= band.min && score <= band.max) {
        scoreCounts[band.name]++
        break
      }
    }
  })

  return bands.map((band) => ({
    name: band.name,
    value: scoreCounts[band.name],
    color: band.color,
  }))
}

export function getScoreTrends(
  assessments: Assessment[],
  userId: string | null,
  assessmentType: "MOCA" | "MMSE" | "ALL",
): TrendData[] {
  if (!assessments || assessments.length === 0) {
    return []
  }

  let filteredAssessments = assessments

  if (userId) {
    filteredAssessments = filteredAssessments.filter((a) => a.user_id === userId)
  }

  if (assessmentType !== "ALL") {
    filteredAssessments = filteredAssessments.filter((a) => a.assessment_type === assessmentType)
  }

  // Sort by date to ensure correct trend display
  filteredAssessments.sort((a, b) => new Date(a.completed_at).getTime() - new Date(b.completed_at).getTime())

  return filteredAssessments.map((a) => ({
    date: new Date(a.completed_at).toLocaleDateString(), // Format date for display
    score: a.total_score,
    type: a.assessment_type, // Include type for potential multi-line chart
  }))
}

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

export type TrajectoryStatus = "Improved" | "Stable" | "Deteriorated"

export interface PatientTrajectoryData {
  userId: string
  assessmentType: "MOCA" | "MMSE"
  baselineScore: number
  latestScore: number
  delta: number
  baselineDate: string
  latestDate: string
  status: TrajectoryStatus
}

export interface TrajectoryWorkflowData {
  assessmentType: "MOCA" | "MMSE"
  cohortSize: number
  improvedCount: number
  stableCount: number
  deterioratedCount: number
  baselineAverage: number
  latestAverage: number
  avgDelta: number
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

function getTrajectoryStatus(delta: number): TrajectoryStatus {
  if (delta >= 2) {
    return "Improved"
  }

  if (delta <= -2) {
    return "Deteriorated"
  }

  return "Stable"
}

export function getPatientTrajectories(assessments: Assessment[]): PatientTrajectoryData[] {
  if (!assessments || assessments.length === 0) {
    return []
  }

  const grouped = new Map<string, Assessment[]>()

  assessments.forEach((assessment) => {
    const key = `${assessment.user_id}:${assessment.assessment_type}`
    const existing = grouped.get(key) ?? []
    existing.push(assessment)
    grouped.set(key, existing)
  })

  const trajectories: PatientTrajectoryData[] = []

  grouped.forEach((groupedAssessments) => {
    if (groupedAssessments.length < 2) {
      return
    }

    const sorted = [...groupedAssessments].sort(
      (a, b) => new Date(a.completed_at).getTime() - new Date(b.completed_at).getTime(),
    )

    const baseline = sorted[0]
    const latest = sorted[sorted.length - 1]
    const delta = latest.total_score - baseline.total_score

    trajectories.push({
      userId: latest.user_id,
      assessmentType: latest.assessment_type,
      baselineScore: baseline.total_score,
      latestScore: latest.total_score,
      delta,
      baselineDate: baseline.completed_at,
      latestDate: latest.completed_at,
      status: getTrajectoryStatus(delta),
    })
  })

  return trajectories.sort((a, b) => a.delta - b.delta)
}

export function getTrajectoryWorkflowData(assessments: Assessment[]): TrajectoryWorkflowData[] {
  const trajectories = getPatientTrajectories(assessments)

  return (["MOCA", "MMSE"] as const).map((assessmentType) => {
    const filtered = trajectories.filter((trajectory) => trajectory.assessmentType === assessmentType)
    const cohortSize = filtered.length
    const improvedCount = filtered.filter((trajectory) => trajectory.status === "Improved").length
    const stableCount = filtered.filter((trajectory) => trajectory.status === "Stable").length
    const deterioratedCount = filtered.filter((trajectory) => trajectory.status === "Deteriorated").length
    const baselineAverage =
      cohortSize > 0 ? filtered.reduce((sum, trajectory) => sum + trajectory.baselineScore, 0) / cohortSize : 0
    const latestAverage =
      cohortSize > 0 ? filtered.reduce((sum, trajectory) => sum + trajectory.latestScore, 0) / cohortSize : 0
    const avgDelta = cohortSize > 0 ? filtered.reduce((sum, trajectory) => sum + trajectory.delta, 0) / cohortSize : 0

    return {
      assessmentType,
      cohortSize,
      improvedCount,
      stableCount,
      deterioratedCount,
      baselineAverage,
      latestAverage,
      avgDelta,
    }
  })
}

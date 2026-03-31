"use client"

import { cn } from "@/lib/utils"

export type RiskLevel = "low" | "moderate" | "high"

interface ScoreGaugeProps {
  score: number // 0-100
  size?: number // px
  strokeWidth?: number
  riskLevel?: RiskLevel
  label?: string
  className?: string
}

const levelColors: Record<RiskLevel, string> = {
  low: "#10b981",
  moderate: "#f59e0b",
  high: "#f43f5e",
}

export function ScoreGauge({
  score,
  size = 160,
  strokeWidth = 12,
  riskLevel = "low",
  label,
  className,
}: ScoreGaugeProps) {
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const progress = Math.max(0, Math.min(100, score))
  const dashOffset = circumference - (progress / 100) * circumference
  const color = levelColors[riskLevel]

  return (
    <div
      className={cn("relative inline-flex items-center justify-center", className)}
      style={{ width: size, height: size }}
      role="meter"
      aria-valuenow={score}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label || `Score: ${score}`}
    >
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-muted/30"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          className="transition-all duration-700 ease-out"
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className="text-3xl font-bold tabular-nums text-foreground">
          {Math.round(score)}
        </span>
        {label && (
          <span className="text-xs font-medium text-muted-foreground">
            {label}
          </span>
        )}
      </div>
    </div>
  )
}

export function getScoreRiskLevel(score: number): RiskLevel {
  const risk = 100 - score
  if (risk > 50) return "high"
  if (risk > 25) return "moderate"
  return "low"
}

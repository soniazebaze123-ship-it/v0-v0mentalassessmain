"use client"

import { cn } from "@/lib/utils"

export type RiskLevel = "low" | "moderate" | "high"

interface RiskBadgeProps {
  level: RiskLevel
  size?: "sm" | "md" | "lg"
  className?: string
}

const sizeStyles = {
  sm: "px-2 py-0.5 text-xs",
  md: "px-2.5 py-1 text-sm",
  lg: "px-3 py-1.5 text-base",
}

const levelStyles: Record<RiskLevel, string> = {
  low: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300",
  moderate: "bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300",
  high: "bg-rose-100 text-rose-800 dark:bg-rose-900/50 dark:text-rose-300",
}

function getRiskLabel(level: RiskLevel): string {
  switch (level) {
    case "low":
      return "Low Risk"
    case "moderate":
      return "Moderate Risk"
    case "high":
      return "High Risk"
  }
}

export function RiskBadge({ level, size = "md", className }: RiskBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full font-medium",
        sizeStyles[size],
        levelStyles[level],
        className
      )}
      role="status"
      aria-label={`Risk level: ${getRiskLabel(level)}`}
    >
      {getRiskLabel(level)}
    </span>
  )
}

export { getRiskLabel }

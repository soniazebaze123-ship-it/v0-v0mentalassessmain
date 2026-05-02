"use client"

import { useCallback, useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useLanguage } from "@/contexts/language-context"
import { useUser } from "@/contexts/user-context"
import { supabase } from "@/lib/supabase"
import {
  fetchAndCalculateRiskProfile,
  getRiskLevelColor,
  getRiskLevelBgColor,
  type RiskProfile,
} from "@/lib/risk-scoring-algorithm"
import { AlertCircle, Brain, Eye, Ear, Flower2, TrendingUp, CheckCircle2 } from "lucide-react"

interface RiskProfileDisplayProps {
  onBackToDashboard: () => void
}

export function RiskProfileDisplay({ onBackToDashboard }: RiskProfileDisplayProps) {
  const { t } = useLanguage()
  const { user } = useUser()
  const [riskProfile, setRiskProfile] = useState<RiskProfile | null>(null)
  const [loading, setLoading] = useState(true)

  const loadRiskProfile = useCallback(async () => {
    if (!user) return

    setLoading(true)
    try {
      const profile = await fetchAndCalculateRiskProfile(user.id, supabase)
      setRiskProfile(profile)
    } catch (error) {
      console.error("[v0] Error loading risk profile:", error)
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    if (user) {
      void loadRiskProfile()
    }
  }, [loadRiskProfile, user])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>{t("common.loading")}</p>
        </div>
      </div>
    )
  }

  if (!riskProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <Card className="w-full max-w-2xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-6 w-6 text-yellow-600" />
              {t("risk.profile_title")}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-muted-foreground">{t("risk.no_data")}</p>
            <Button onClick={onBackToDashboard}>{t("results.back_to_dashboard")}</Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-teal-50 to-indigo-100 p-4">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900">{t("risk.profile_title")}</h1>
          <Button onClick={onBackToDashboard} variant="outline">
            {t("results.back_to_dashboard")}
          </Button>
        </div>

        {/* Overall Risk Score Card */}
        <Card className={`border-2 ${getRiskLevelBgColor(riskProfile.riskLevel)}`}>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>{t("risk.overall_score")}</span>
              <Badge className={`${getRiskLevelColor(riskProfile.riskLevel)} text-lg px-4 py-1`}>
                {t(`risk.level.${riskProfile.riskLevel}`)}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center">
              <div className="relative w-48 h-48">
                <svg className="transform -rotate-90 w-48 h-48">
                  <circle
                    cx="96"
                    cy="96"
                    r="88"
                    stroke="currentColor"
                    strokeWidth="12"
                    fill="transparent"
                    className="text-gray-200"
                  />
                  <circle
                    cx="96"
                    cy="96"
                    r="88"
                    stroke="currentColor"
                    strokeWidth="12"
                    fill="transparent"
                    strokeDasharray={`${2 * Math.PI * 88}`}
                    strokeDashoffset={`${2 * Math.PI * 88 * (1 - riskProfile.overallRiskScore / 100)}`}
                    className={getRiskLevelColor(riskProfile.riskLevel)}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-5xl font-bold">{riskProfile.overallRiskScore}</span>
                  <span className="text-sm text-muted-foreground">/ 100</span>
                </div>
              </div>
            </div>
            <div className="mt-6 text-center">
              <p className="text-lg font-medium">{t(`risk.severity.${riskProfile.factors.severityLevel}`)}</p>
            </div>
          </CardContent>
        </Card>

        {/* Component Breakdown */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Cognitive Component */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5 text-blue-600" />
                {t("risk.cognitive_component")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Score</span>
                  <span className="text-2xl font-bold">{riskProfile.cognitiveComponent}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className="bg-blue-600 h-3 rounded-full transition-all duration-500"
                    style={{ width: `${riskProfile.cognitiveComponent}%` }}
                  />
                </div>
              </div>

              <div className="space-y-2 pt-4 border-t">
                {riskProfile.individualScores.cognitive.moca !== undefined && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm">MoCA</span>
                    <span className="font-semibold">{riskProfile.individualScores.cognitive.moca} / 30</span>
                  </div>
                )}
                {riskProfile.individualScores.cognitive.mmse !== undefined && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm">MMSE</span>
                    <span className="font-semibold">{riskProfile.individualScores.cognitive.mmse} / 30</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Sensory Component */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-teal-600" />
                {t("risk.sensory_component")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Score</span>
                  <span className="text-2xl font-bold">{riskProfile.sensoryComponent}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className="bg-teal-600 h-3 rounded-full transition-all duration-500"
                    style={{ width: `${riskProfile.sensoryComponent}%` }}
                  />
                </div>
              </div>

              <div className="space-y-2 pt-4 border-t">
                {riskProfile.individualScores.sensory.visual !== undefined && (
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <Eye className="h-4 w-4" />
                      <span className="text-sm">Visual</span>
                    </div>
                    <span className="font-semibold">{Math.round(riskProfile.individualScores.sensory.visual)}%</span>
                  </div>
                )}
                {riskProfile.individualScores.sensory.auditory !== undefined && (
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <Ear className="h-4 w-4" />
                      <span className="text-sm">Auditory</span>
                    </div>
                    <span className="font-semibold">{Math.round(riskProfile.individualScores.sensory.auditory)}%</span>
                  </div>
                )}
                {riskProfile.individualScores.sensory.olfactory !== undefined && (
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <Flower2 className="h-4 w-4" />
                      <span className="text-sm">Olfactory</span>
                    </div>
                    <span className="font-semibold">{Math.round(riskProfile.individualScores.sensory.olfactory)}%</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Risk Factors */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-orange-600" />
              {t("risk.factors")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div
                className={`p-4 rounded-lg border-2 ${riskProfile.factors.hasCognitiveImpairment ? "border-red-300 bg-red-50" : "border-green-300 bg-green-50"}`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{t("risk.factor.cognitive_impairment")}</span>
                  {riskProfile.factors.hasCognitiveImpairment ? (
                    <AlertCircle className="h-5 w-5 text-red-600" />
                  ) : (
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                  )}
                </div>
              </div>

              <div
                className={`p-4 rounded-lg border-2 ${riskProfile.factors.hasSensoryImpairment ? "border-red-300 bg-red-50" : "border-green-300 bg-green-50"}`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{t("risk.factor.sensory_impairment")}</span>
                  {riskProfile.factors.hasSensoryImpairment ? (
                    <AlertCircle className="h-5 w-5 text-red-600" />
                  ) : (
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                  )}
                </div>
              </div>

              <div
                className={`p-4 rounded-lg border-2 ${riskProfile.factors.hasMultipleSensoryDeficits ? "border-red-300 bg-red-50" : "border-green-300 bg-green-50"}`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{t("risk.factor.multiple_sensory")}</span>
                  {riskProfile.factors.hasMultipleSensoryDeficits ? (
                    <AlertCircle className="h-5 w-5 text-red-600" />
                  ) : (
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recommendations */}
        <Card>
          <CardHeader>
            <CardTitle>{t("risk.recommendations")}</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {riskProfile.recommendations.map((recommendation, index) => (
                <li key={index} className="flex gap-3">
                  <div className="flex-shrink-0 mt-1">
                    <div className="w-2 h-2 rounded-full bg-blue-600" />
                  </div>
                  <span className="text-sm leading-relaxed">{recommendation}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        {/* Action Button */}
        <div className="flex justify-center pb-8">
          <Button onClick={onBackToDashboard} size="lg" className="min-w-[200px]">
            {t("results.back_to_dashboard")}
          </Button>
        </div>
      </div>
    </div>
  )
}

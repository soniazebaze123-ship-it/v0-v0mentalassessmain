"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { CheckCircle, AlertTriangle, XCircle, ShieldAlert, Phone } from "lucide-react"
import { useLanguage } from "@/contexts/language-context"
import type { RiskClassificationOutput } from "@/lib/recommendations/risk-classification-service"

interface ResultsDisplayProps {
  assessmentType: "MOCA" | "MMSE"
  totalScore: number
  maxScore: number
  sectionScores: Record<string, number>
  riskResult?: RiskClassificationOutput | null
  onBackToDashboard: () => void
}

export function ResultsDisplay({
  assessmentType,
  totalScore,
  maxScore,
  sectionScores,
  riskResult,
  onBackToDashboard,
}: ResultsDisplayProps) {
  const { t, localizeText } = useLanguage()
  const assessmentLabel = assessmentType === "MMSE" ? t("mmse.title") : t("moca.title")

  const getRiskRecommendationText = (result: RiskClassificationOutput) => {
    return t(`results.risk_recommendation.${result.risk_classification}`)
  }

  const getReferralReasonText = (result: RiskClassificationOutput) => {
    if (!result.referral_reason) {
      return null
    }

    if (result.risk_classification === "mild_risk") {
      return t("results.referral_reason.mild_risk")
    }

    if (result.risk_classification === "moderate_risk") {
      return t("results.referral_reason.moderate_risk")
    }

    if (result.risk_classification === "high_risk") {
      return t("results.referral_reason.high_risk")
    }

    return result.referral_reason
  }

  const getInterpretation = () => {
    if (assessmentType === "MOCA") {
      if (totalScore >= 26) return { level: t("results.interpretation.normal"), color: "green", icon: CheckCircle }
      if (totalScore >= 18)
        return { level: t("results.interpretation.mild_impairment"), color: "yellow", icon: AlertTriangle }
      return { level: t("results.interpretation.possible_decline"), color: "red", icon: XCircle }
    } else {
      if (totalScore >= 21) return { level: t("results.interpretation.normal"), color: "green", icon: CheckCircle }
      if (totalScore >= 15)
        return { level: t("results.interpretation.mild_impairment"), color: "yellow", icon: AlertTriangle }
      return { level: t("results.interpretation.severe_impairment"), color: "red", icon: XCircle }
    }
  }

  const interpretation = getInterpretation()
  const IconComponent = interpretation.icon

  const getSectionNames = () => {
    if (assessmentType === "MOCA") {
      return {
        clock: t("moca.visuospatial"),
        trail_making: t("moca.executive"),
        cube: t("moca.cube"),
        animal_naming: t("moca.naming"),
        object_naming: localizeText("Object Naming", { zh: "物体命名", yue: "物件命名", fr: "Dénomination d’objets" }),
        memory: t("moca.memory"),
        attention: t("moca.attention"),
        language: t("moca.language"),
        orientation: t("moca.orientation"),
      }
    } else {
      return {
        orientation: t("mmse.orientation"),
        registration: t("mmse.registration"),
        attention: t("mmse.attention"),
        naming: t("mmse.naming"),
        repetition: t("mmse.repetition"),
        writing: t("mmse.writing"),
        copying: t("mmse.copying"),
      }
    }
  }

  const sectionNames = getSectionNames()
  const percentage = (totalScore / maxScore) * 100

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <Card className="w-full max-w-4xl mx-auto">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">{t("results.title", { assessmentType: assessmentLabel })}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-8">
          {/* Overall Score */}
          <div className="text-center space-y-4">
            <div className="text-6xl font-bold text-blue-600">
              {totalScore}/{maxScore}
            </div>
            <Progress value={percentage} className="w-full max-w-md mx-auto h-3" />
            <p className="text-lg text-gray-600">
              {t("results.score_percentage", { percentage: percentage.toFixed(1) })}
            </p>
          </div>

          {/* Interpretation */}
          <div className="text-center space-y-4">
            <div
              className={`inline-flex items-center space-x-2 px-4 py-2 rounded-full ${
                interpretation.color === "green"
                  ? "bg-green-100 text-green-800"
                  : interpretation.color === "yellow"
                    ? "bg-yellow-100 text-yellow-800"
                    : "bg-red-100 text-red-800"
              }`}
            >
              <IconComponent className="w-5 h-5" />
              <span className="font-semibold">{interpretation.level}</span>
            </div>

            <div className="text-sm text-gray-600 max-w-2xl mx-auto">
              {assessmentType === "MOCA" ? (
                <>
                  <p>
                    <strong>{t("results.moca.normal_range")}</strong>
                  </p>
                  <p>
                    <strong>{t("results.moca.mild_range")}</strong>
                  </p>
                  <p>
                    <strong>{t("results.moca.decline_range")}</strong>
                  </p>
                </>
              ) : (
                <>
                  <p>
                    <strong>{t("results.mmse.normal_range")}</strong>
                  </p>
                  <p>
                    <strong>{t("results.mmse.mild_range")}</strong>
                  </p>
                  <p>
                    <strong>{t("results.mmse.severe_range")}</strong>
                  </p>
                </>
              )}
            </div>
          </div>

          {/* Section Breakdown */}
          <div className="space-y-4">
            <h3 className="text-xl font-semibold text-center">{t("results.section_breakdown")}</h3>
            <div className="grid md:grid-cols-2 gap-4">
              {Object.entries(sectionScores).map(([key, score]) => (
                <div key={key} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <span className="font-medium">{sectionNames[key as keyof typeof sectionNames] ?? key}</span>
                  <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                    {t("results.points", { score })}
                  </Badge>
                </div>
              ))}
            </div>
          </div>

          {/* Clinical Risk Classification Panel */}
          {riskResult && (
            <div className={`rounded-2xl border p-5 space-y-3 ${
              riskResult.risk_classification === "normal"
                ? "border-emerald-200 bg-emerald-50"
                : riskResult.risk_classification === "mild_risk"
                ? "border-yellow-200 bg-yellow-50"
                : riskResult.risk_classification === "moderate_risk"
                ? "border-orange-200 bg-orange-50"
                : "border-red-200 bg-red-50"
            }`}>
              <div className="flex items-center gap-3">
                <ShieldAlert className={`h-5 w-5 ${
                  riskResult.risk_classification === "normal" ? "text-emerald-600"
                  : riskResult.risk_classification === "mild_risk" ? "text-yellow-600"
                  : riskResult.risk_classification === "moderate_risk" ? "text-orange-600"
                  : "text-red-600"
                }`} />
                <span className="font-semibold text-slate-800">{t("results.clinical_risk_assessment")}</span>
                <Badge className={`ml-auto ${
                  riskResult.risk_classification === "normal"
                    ? "bg-emerald-100 text-emerald-800"
                    : riskResult.risk_classification === "mild_risk"
                    ? "bg-yellow-100 text-yellow-800"
                    : riskResult.risk_classification === "moderate_risk"
                    ? "bg-orange-100 text-orange-800"
                    : "bg-red-100 text-red-800"
                }`}>
                  {t(`results.risk_classification.${riskResult.risk_classification}`)}
                </Badge>
              </div>
              <p className="text-sm text-slate-700 leading-relaxed">{getRiskRecommendationText(riskResult)}</p>
              {riskResult.referral_needed && (
                <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
                  <Phone className="h-4 w-4 text-red-600 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm font-semibold text-red-800">{t("results.referral_recommended")}</p>
                    {riskResult.referral_reason && (
                      <p className="text-xs text-red-700 mt-0.5">{getReferralReasonText(riskResult)}</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Action Button */}
          <div className="text-center pt-6">
            <Button onClick={onBackToDashboard} className="w-full max-w-xs">
              {t("results.back_to_dashboard")}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

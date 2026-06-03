"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { CheckCircle, AlertTriangle, XCircle, ShieldAlert, Phone, Sparkles } from "lucide-react"
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
      if (totalScore >= 27) return { level: t("results.interpretation.normal"), color: "green", icon: CheckCircle }
      if (totalScore >= 24)
        return { level: t("results.interpretation.subtle_decline"), color: "yellow", icon: AlertTriangle }
      if (totalScore >= 18)
        return { level: t("results.interpretation.mild_impairment"), color: "yellow", icon: AlertTriangle }
      if (totalScore >= 10)
        return { level: t("results.interpretation.moderate_impairment"), color: "orange", icon: ShieldAlert }
      return { level: t("results.interpretation.severe_impairment"), color: "red", icon: XCircle }
    } else {
      if (totalScore >= 28) return { level: t("results.interpretation.normal"), color: "green", icon: CheckCircle }
      if (totalScore >= 25)
        return { level: t("results.interpretation.borderline_decline"), color: "yellow", icon: AlertTriangle }
      if (totalScore >= 21)
        return { level: t("results.interpretation.mild_impairment"), color: "yellow", icon: AlertTriangle }
      if (totalScore >= 10)
        return { level: t("results.interpretation.moderate_impairment"), color: "orange", icon: ShieldAlert }
      return { level: t("results.interpretation.severe_impairment"), color: "red", icon: XCircle }
    }
  }

  const interpretation = getInterpretation()
  const IconComponent = interpretation.icon
  const isMMSE = assessmentType === "MMSE"

  const mmseBands = [
    {
      id: "normal",
      min: 28,
      max: 30,
      range: t("results.mmse.normal_range"),
      label: t("results.interpretation.normal"),
      activeClass: "border-emerald-300 bg-emerald-50 text-emerald-800",
      idleClass: "border-slate-200 bg-white text-slate-600",
    },
    {
      id: "borderline",
      min: 25,
      max: 27,
      range: t("results.mmse.borderline_range"),
      label: t("results.interpretation.borderline_decline"),
      activeClass: "border-amber-300 bg-amber-50 text-amber-800",
      idleClass: "border-slate-200 bg-white text-slate-600",
    },
    {
      id: "mild",
      min: 21,
      max: 24,
      range: t("results.mmse.mild_range"),
      label: t("results.interpretation.mild_impairment"),
      activeClass: "border-yellow-300 bg-yellow-50 text-yellow-800",
      idleClass: "border-slate-200 bg-white text-slate-600",
    },
    {
      id: "moderate",
      min: 10,
      max: 20,
      range: t("results.mmse.moderate_range"),
      label: t("results.interpretation.moderate_impairment"),
      activeClass: "border-orange-300 bg-orange-50 text-orange-800",
      idleClass: "border-slate-200 bg-white text-slate-600",
    },
    {
      id: "severe",
      min: 0,
      max: 9,
      range: t("results.mmse.severe_range"),
      label: t("results.interpretation.severe_impairment"),
      activeClass: "border-red-300 bg-red-50 text-red-800",
      idleClass: "border-slate-200 bg-white text-slate-600",
    },
  ]

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
        recall: t("mmse.recall"),
        naming: t("mmse.naming"),
        repetition: t("mmse.repetition"),
        three_stage_command: t("mmse.three_stage_command"),
        reading_command: t("mmse.reading_command"),
        writing: t("mmse.writing"),
        copying: t("mmse.copying"),
      }
    }
  }

  const sectionNames = getSectionNames()
  const percentage = (totalScore / maxScore) * 100

  return (
    <div className={`min-h-screen p-4 ${
      isMMSE
        ? "relative overflow-hidden bg-[radial-gradient(circle_at_top_right,_rgba(59,130,246,0.18),_transparent_40%),radial-gradient(circle_at_bottom_left,_rgba(14,165,233,0.16),_transparent_45%),linear-gradient(145deg,_#f8fbff,_#edf4ff_45%,_#f7fbff)]"
        : "bg-gradient-to-br from-blue-50 to-indigo-100"
    }`}>
      {isMMSE && (
        <>
          <div className="pointer-events-none absolute -left-24 top-24 h-72 w-72 rounded-full bg-blue-200/35 blur-3xl" />
          <div className="pointer-events-none absolute -right-16 bottom-12 h-80 w-80 rounded-full bg-cyan-200/35 blur-3xl" />
        </>
      )}
      <Card className={`w-full max-w-4xl mx-auto ${
        isMMSE
          ? "relative z-10 border-white/80 bg-white/90 shadow-[0_30px_80px_rgba(15,23,42,0.14)] backdrop-blur"
          : ""
      }`}>
        <CardHeader className="text-center">
          {isMMSE && (
            <div className="mb-3 flex justify-center">
              <span className="inline-flex items-center rounded-full bg-gradient-to-r from-blue-600 to-cyan-500 px-4 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-white">
                <Sparkles className="mr-2 h-3.5 w-3.5" />
                {localizeText("Clinical Signature Edition", {
                  zh: "临床签名版",
                  yue: "臨床簽名版",
                  fr: "Édition signature clinique",
                })}
              </span>
            </div>
          )}
          <CardTitle className="text-2xl">{t("results.title", { assessmentType: assessmentLabel })}</CardTitle>
          {assessmentType === "MMSE" && (
            <div className="mt-3 flex justify-center">
              <Badge variant="outline" className="border-blue-200 bg-blue-50 text-blue-700">
                {t("mmse.v2_badge")}
              </Badge>
            </div>
          )}
        </CardHeader>
        <CardContent className="space-y-8">
          {/* Overall Score */}
          <div className={`text-center space-y-4 ${isMMSE ? "rounded-2xl border border-blue-100 bg-gradient-to-br from-white to-blue-50/60 p-6" : ""}`}>
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
                    : interpretation.color === "orange"
                      ? "bg-orange-100 text-orange-800"
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
                    <strong>{t("results.moca.subtle_range")}</strong>
                  </p>
                  <p>
                    <strong>{t("results.moca.mild_range")}</strong>
                  </p>
                  <p>
                    <strong>{t("results.moca.moderate_range")}</strong>
                  </p>
                  <p>
                    <strong>{t("results.moca.severe_range")}</strong>
                  </p>
                </>
              ) : (
                <>
                  <p>
                    <strong>{t("results.mmse.normal_range")}</strong>
                  </p>
                  <p>
                    <strong>{t("results.mmse.borderline_range")}</strong>
                  </p>
                  <p>
                    <strong>{t("results.mmse.mild_range")}</strong>
                  </p>
                  <p>
                    <strong>{t("results.mmse.moderate_range")}</strong>
                  </p>
                  <p>
                    <strong>{t("results.mmse.severe_range")}</strong>
                  </p>
                </>
              )}
            </div>

            {isMMSE && (
              <div className="mx-auto mt-4 grid max-w-3xl gap-3 text-left md:grid-cols-2">
                {mmseBands.map((band) => {
                  const isActive = totalScore >= band.min && totalScore <= band.max
                  return (
                    <div
                      key={band.id}
                      className={`rounded-xl border px-4 py-3 transition ${isActive ? band.activeClass : band.idleClass}`}
                    >
                      <p className="text-xs font-semibold uppercase tracking-[0.14em]">{band.label}</p>
                      <p className="mt-1 text-sm font-medium">{band.range}</p>
                    </div>
                  )
                })}
              </div>
            )}
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

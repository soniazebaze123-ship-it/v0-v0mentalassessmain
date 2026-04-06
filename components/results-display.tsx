"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { CheckCircle, AlertTriangle, XCircle } from "lucide-react"
import { useLanguage } from "@/contexts/language-context"

interface ResultsDisplayProps {
  assessmentType: "MOCA" | "MMSE"
  totalScore: number
  maxScore: number
  sectionScores: Record<string, number>
  onBackToDashboard: () => void
}

export function ResultsDisplay({
  assessmentType,
  totalScore,
  maxScore,
  sectionScores,
  onBackToDashboard,
}: ResultsDisplayProps) {
  const { t } = useLanguage()
  const assessmentLabel = assessmentType === "MMSE" ? t("mmse.title") : t("moca.title")

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
        visuospatial: t("moca.visuospatial"),
        executive: t("moca.executive"),
        naming: t("moca.naming"),
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
                  <span className="font-medium">{sectionNames[key as keyof typeof sectionNames]}</span>
                  <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                    {t("results.points", { score })}
                  </Badge>
                </div>
              ))}
            </div>
          </div>

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

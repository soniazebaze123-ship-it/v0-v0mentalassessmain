"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AssessmentInput } from "@/components/ui/assessment-input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { useLanguage } from "@/contexts/language-context"
import { InstructionAudio } from "@/components/ui/instruction-audio"

interface MMSEOrientationProps {
  onComplete: (score: number) => void
  onSkip?: () => void
}

export function MMSEOrientation({ onComplete, onSkip }: MMSEOrientationProps) {
  const { t } = useLanguage()
  const [answers, setAnswers] = useState({
    year: "",
    season: "",
    date: "",
    day: "",
    month: "",
    country: "",
    president: "",
    sea: "",
  })

  const handleAnswerChange = (field: string, value: string) => {
    setAnswers((prev) => ({ ...prev, [field]: value }))
  }

  const getCurrentSeason = () => {
    const month = new Date().getMonth() + 1
    if (month >= 3 && month <= 5) return t("common.spring")
    if (month >= 6 && month <= 8) return t("common.summer")
    if (month >= 9 && month <= 11) return t("common.autumn")
    return t("common.winter")
  }

  const getDayName = (dayNumber: number) => {
    const days = [
      t("common.day_sunday"),
      t("common.day_monday"),
      t("common.day_tuesday"),
      t("common.day_wednesday"),
      t("common.day_thursday"),
      t("common.day_friday"),
      t("common.day_saturday"),
    ]
    return days[dayNumber]
  }

  const checkAnswers = () => {
    const now = new Date()
    const currentDate = now.getDate()
    const currentMonth = now.getMonth() + 1
    const currentYear = now.getFullYear()
    const currentDay = getDayName(now.getDay())
    const currentSeason = getCurrentSeason()

    let score = 0

    // Time questions (5 points)
    if (Number.parseInt(answers.year) === currentYear) score += 1
    if (answers.season.toLowerCase().trim() === currentSeason.toLowerCase()) score += 1
    if (Number.parseInt(answers.date) === currentDate) score += 1
    if (answers.day.toLowerCase().trim() === currentDay.toLowerCase()) score += 1
    if (Number.parseInt(answers.month) === currentMonth) score += 1

    // Place questions (3 points)
    if (answers.country.toLowerCase().trim() === t("common.china").toLowerCase()) score += 1
    if (answers.president.toLowerCase().trim() === t("common.president_name").toLowerCase()) score += 2 // Assuming 2 points for president
    // The "sea" question is not scored in typical MMSE orientation, but I'll include a check for completeness if it were.
    // For now, it's just a text input.

    onComplete(score)
  }

  const handleSkip = () => {
    if (onSkip) {
      onSkip()
    } else {
      onComplete(0)
    }
  }

  const isFormComplete =
    answers.year !== "" && answers.month !== "" && answers.day !== "" && answers.date !== "" && answers.country !== ""

  return (
    <Card className="w-full max-w-3xl mx-auto border-t-4 border-blue-500 shadow-lg">
      <CardHeader className="bg-blue-50/50">
        <CardTitle className="text-blue-700">{t("mmse.orientation")}</CardTitle>
        <p className="text-sm text-gray-600">{t("mmse.orientation.instruction")}</p>
        <InstructionAudio instructionKey="mmse.orientation.instruction" className="mt-2" />
      </CardHeader>
      <CardContent className="space-y-8 pt-6">
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-blue-800 border-b pb-2">Time Questions (5 points)</h3>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="year" className="text-base">
                {t("question.year")}
              </Label>
              <AssessmentInput
                id="year"
                type="number"
                value={answers.year}
                onChange={(e) => handleAnswerChange("year", e.target.value)}
                placeholder=""
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="season" className="text-base">
                {t("question.season")}
              </Label>
              <AssessmentInput
                id="season"
                value={answers.season}
                onChange={(e) => handleAnswerChange("season", e.target.value)}
                placeholder=""
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="date" className="text-base">
                {t("question.date")}
              </Label>
              <AssessmentInput
                id="date"
                type="number"
                value={answers.date}
                onChange={(e) => handleAnswerChange("date", e.target.value)}
                placeholder=""
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="day" className="text-base">
                {t("question.day")}
              </Label>
              <AssessmentInput
                id="day"
                value={answers.day}
                onChange={(e) => handleAnswerChange("day", e.target.value)}
                placeholder=""
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="month" className="text-base">
                {t("question.month")}
              </Label>
              <AssessmentInput
                id="month"
                type="number"
                value={answers.month}
                onChange={(e) => handleAnswerChange("month", e.target.value)}
                placeholder=""
              />
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-bold text-blue-800 border-b pb-2">Place Questions (3 points)</h3>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="country" className="text-base">
                {t("question.country")}
              </Label>
              <AssessmentInput
                id="country"
                value={answers.country}
                onChange={(e) => handleAnswerChange("country", e.target.value)}
                placeholder=""
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="president" className="text-base">
                {t("question.president")}
              </Label>
              <AssessmentInput
                id="president"
                value={answers.president}
                onChange={(e) => handleAnswerChange("president", e.target.value)}
                placeholder=""
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="sea" className="text-base">
                {t("question.sea")}
              </Label>
              <AssessmentInput
                id="sea"
                value={answers.sea}
                onChange={(e) => handleAnswerChange("sea", e.target.value)}
                placeholder=""
              />
            </div>
          </div>
        </div>

        <div className="flex justify-center space-x-4">
          <Button variant="outline" onClick={handleSkip}>
            {t("common.skip_task")}
          </Button>
          <Button onClick={checkAnswers} disabled={!isFormComplete} className="w-full max-w-xs">
            {t("common.submit")}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

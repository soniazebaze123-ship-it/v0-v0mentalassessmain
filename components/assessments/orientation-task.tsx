"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AssessmentInput } from "@/components/ui/assessment-input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { useLanguage } from "@/contexts/language-context"
import { InstructionAudio } from "@/components/ui/instruction-audio"

interface OrientationTaskProps {
  onComplete: (score: number) => void
  onSkip?: () => void
}

export function OrientationTask({ onComplete, onSkip }: OrientationTaskProps) {
  const { t } = useLanguage()
  const [answers, setAnswers] = useState({
    date: "",
    month: "",
    year: "",
    day: "",
    country: "",
  })

  const getMonthName = (monthNumber: number) => {
    const months = [
      t("common.month_1"),
      t("common.month_2"),
      t("common.month_3"),
      t("common.month_4"),
      t("common.month_5"),
      t("common.month_6"),
      t("common.month_7"),
      t("common.month_8"),
      t("common.month_9"),
      t("common.month_10"),
      t("common.month_11"),
      t("common.month_12"),
    ]
    return months[monthNumber - 1]
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

  const handleAnswerChange = (field: string, value: string) => {
    setAnswers((prev) => ({ ...prev, [field]: value }))
  }

  const checkAnswers = () => {
    const now = new Date()
    const currentDate = now.getDate()
    const currentMonth = getMonthName(now.getMonth() + 1)
    const currentYear = now.getFullYear()
    const currentDay = getDayName(now.getDay())

    let score = 0

    // Check date
    if (Number.parseInt(answers.date) === currentDate) score += 1

    // Check month (word format)
    if (answers.month.toLowerCase().trim() === currentMonth.toLowerCase()) score += 1

    // Check year
    if (Number.parseInt(answers.year) === currentYear) score += 1

    // Check day
    if (answers.day.toLowerCase().trim() === currentDay.toLowerCase()) score += 1

    // Check country (should be China)
    if (answers.country.toLowerCase().trim() === t("common.china").toLowerCase()) score += 1

    onComplete(score)
  }

  const handleSkip = () => {
    if (onSkip) {
      onSkip()
    } else {
      onComplete(0)
    }
  }

  const isFormComplete = Object.values(answers).every((answer) => answer.trim() !== "")

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>{t("moca.orientation")}</CardTitle>
        <p className="text-sm text-gray-600">{t("moca.orientation.instruction")}</p>
        <InstructionAudio instructionKey="moca.orientation.instruction" className="mt-2" />
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="date">{t("question.date")}</Label>
            <AssessmentInput
              id="date"
              type="number"
              value={answers.date}
              onChange={(e) => handleAnswerChange("date", e.target.value)}
              placeholder=""
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="month">{t("question.month")}</Label>
            <AssessmentInput
              id="month"
              value={answers.month}
              onChange={(e) => handleAnswerChange("month", e.target.value)}
              placeholder=""
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="year">{t("question.year")}</Label>
            <AssessmentInput
              id="year"
              type="number"
              value={answers.year}
              onChange={(e) => handleAnswerChange("year", e.target.value)}
              placeholder=""
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="day">{t("question.day")}</Label>
            <AssessmentInput
              id="day"
              value={answers.day}
              onChange={(e) => handleAnswerChange("day", e.target.value)}
              placeholder=""
            />
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="country">{t("question.country")}</Label>
            <AssessmentInput
              id="country"
              value={answers.country}
              onChange={(e) => handleAnswerChange("country", e.target.value)}
              placeholder=""
            />
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

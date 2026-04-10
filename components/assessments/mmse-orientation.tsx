"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { useLanguage } from "@/contexts/language-context"
import { InstructionAudio } from "@/components/ui/instruction-audio"

interface MMSEOrientationProps {
  onComplete: (score: number) => void
  onSkip?: () => void
}

export function MMSEOrientation({ onComplete, onSkip }: MMSEOrientationProps) {
  const { t, localizeText } = useLanguage()
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

  const currentYear = new Date().getFullYear()
  const dayOptions = [
    { value: "sunday", label: t("common.day_sunday") },
    { value: "monday", label: t("common.day_monday") },
    { value: "tuesday", label: t("common.day_tuesday") },
    { value: "wednesday", label: t("common.day_wednesday") },
    { value: "thursday", label: t("common.day_thursday") },
    { value: "friday", label: t("common.day_friday") },
    { value: "saturday", label: t("common.day_saturday") },
  ]
  const seasonOptions = [
    { value: "spring", label: t("common.spring") },
    { value: "summer", label: t("common.summer") },
    { value: "autumn", label: t("common.autumn") },
    { value: "winter", label: t("common.winter") },
  ]
  const countryOptions = [
    { value: "china", label: t("common.china") },
    { value: "japan", label: localizeText("Japan", { zh: "日本", yue: "日本", fr: "Japon" }) },
    { value: "france", label: localizeText("France", { zh: "法国", yue: "法國", fr: "France" }) },
    { value: "usa", label: localizeText("United States", { zh: "美国", yue: "美國", fr: "États-Unis" }) },
  ]
  const presidentOptions = [
    { value: "xi", label: t("common.president_name") },
    { value: "trump", label: localizeText("Donald Trump", { zh: "唐纳德·特朗普", yue: "當勞·特朗普", fr: "Donald Trump" }) },
    { value: "macron", label: localizeText("Emmanuel Macron", { zh: "埃马纽埃尔·马克龙", yue: "馬克龍", fr: "Emmanuel Macron" }) },
    { value: "kishida", label: localizeText("Fumio Kishida", { zh: "岸田文雄", yue: "岸田文雄", fr: "Fumio Kishida" }) },
  ]
  const seaOptions = [
    {
      value: "south_china_sea",
      label: localizeText("South China Sea", { zh: "南海", yue: "南海", fr: "Mer de Chine méridionale" }),
    },
    {
      value: "pacific_ocean",
      label: localizeText("Pacific Ocean", { zh: "太平洋", yue: "太平洋", fr: "Océan Pacifique" }),
    },
    {
      value: "atlantic_ocean",
      label: localizeText("Atlantic Ocean", { zh: "大西洋", yue: "大西洋", fr: "Océan Atlantique" }),
    },
  ]

  const selectClassName =
    "h-11 w-full rounded-md border border-input bg-background px-3 text-base shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"

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

  const checkAnswers = () => {
    const now = new Date()
    const currentDate = now.getDate()
    const currentMonth = now.getMonth() + 1
    const actualYear = now.getFullYear()
    const currentDay = dayOptions[now.getDay()]?.value
    const currentSeason = seasonOptions.find((option) => option.label === getCurrentSeason())?.value

    let score = 0

    // Time questions (5 points)
    if (Number.parseInt(answers.year) === actualYear) score += 1
    if (answers.season === currentSeason) score += 1
    if (Number.parseInt(answers.date) === currentDate) score += 1
    if (answers.day === currentDay) score += 1
    if (Number.parseInt(answers.month) === currentMonth) score += 1

    // Place questions (3 points)
    if (answers.country === "china") score += 1
    if (answers.president === "xi") score += 1
    if (answers.sea === "south_china_sea") score += 1

    onComplete(score)
  }

  const handleSkip = () => {
    if (onSkip) {
      onSkip()
    } else {
      onComplete(0)
    }
  }

  const isFormComplete = Object.values(answers).every((value) => value !== "")

  return (
    <Card className="w-full max-w-3xl mx-auto border-t-4 border-blue-500 shadow-lg">
      <CardHeader className="bg-blue-50/50">
        <CardTitle className="text-blue-700">{t("mmse.orientation")}</CardTitle>
        <p className="text-sm text-gray-600">{t("mmse.orientation.instruction")}</p>
        <InstructionAudio instructionKey="mmse.orientation.instruction" className="mt-2" />
      </CardHeader>
      <CardContent className="space-y-8 pt-6">
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-blue-800 border-b pb-2">{t("mmse.orientation.time_questions")}</h3>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-3">
                <Label htmlFor="year" className="text-base">
                  {t("question.year")}
                </Label>
                <InstructionAudio text={t("question.year")} />
              </div>
              <select id="year" className={selectClassName} value={answers.year} onChange={(e) => handleAnswerChange("year", e.target.value)}>
                <option value="">{localizeText("Select year", { zh: "请选择年份", yue: "請選擇年份", fr: "Sélectionnez l’année" })}</option>
                {[currentYear - 1, currentYear, currentYear + 1].map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between gap-3">
                <Label htmlFor="season" className="text-base">
                  {t("question.season")}
                </Label>
                <InstructionAudio text={t("question.season")} />
              </div>
              <div className="grid grid-cols-2 gap-2">
                {seasonOptions.map((option) => (
                  <Button
                    key={option.value}
                    type="button"
                    variant={answers.season === option.value ? "default" : "outline"}
                    className="h-11 justify-center text-sm"
                    onClick={() => handleAnswerChange("season", option.value)}
                  >
                    {option.label}
                  </Button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between gap-3">
                <Label htmlFor="date" className="text-base">
                  {t("question.date")}
                </Label>
                <InstructionAudio text={t("question.date")} />
              </div>
              <select id="date" className={selectClassName} value={answers.date} onChange={(e) => handleAnswerChange("date", e.target.value)}>
                <option value="">{localizeText("Select date", { zh: "请选择日期", yue: "請選擇日期", fr: "Sélectionnez la date" })}</option>
                {Array.from({ length: 31 }, (_, index) => index + 1).map((date) => (
                  <option key={date} value={date}>
                    {date}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between gap-3">
                <Label htmlFor="day" className="text-base">
                  {t("question.day")}
                </Label>
                <InstructionAudio text={t("question.day")} />
              </div>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {dayOptions.map((option) => (
                  <Button
                    key={option.value}
                    type="button"
                    variant={answers.day === option.value ? "default" : "outline"}
                    className="h-11 justify-center text-sm"
                    onClick={() => handleAnswerChange("day", option.value)}
                  >
                    {option.label}
                  </Button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between gap-3">
                <Label htmlFor="month" className="text-base">
                  {t("question.month")}
                </Label>
                <InstructionAudio text={t("question.month")} />
              </div>
              <select id="month" className={selectClassName} value={answers.month} onChange={(e) => handleAnswerChange("month", e.target.value)}>
                <option value="">{localizeText("Select month", { zh: "请选择月份", yue: "請選擇月份", fr: "Sélectionnez le mois" })}</option>
                {Array.from({ length: 12 }, (_, index) => index + 1).map((month) => (
                  <option key={month} value={month}>
                    {t(`common.month_${month}`)}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-bold text-blue-800 border-b pb-2">{t("mmse.orientation.place_questions")}</h3>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-3">
                <Label htmlFor="country" className="text-base">
                  {t("question.country")}
                </Label>
                <InstructionAudio text={t("question.country")} />
              </div>
              <div className="grid grid-cols-2 gap-2">
                {countryOptions.map((option) => (
                  <Button
                    key={option.value}
                    type="button"
                    variant={answers.country === option.value ? "default" : "outline"}
                    className="h-11 justify-center text-sm"
                    onClick={() => handleAnswerChange("country", option.value)}
                  >
                    {option.label}
                  </Button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between gap-3">
                <Label htmlFor="president" className="text-base">
                  {t("question.president")}
                </Label>
                <InstructionAudio text={t("question.president")} />
              </div>
              <div className="grid gap-2">
                {presidentOptions.map((option) => (
                  <Button
                    key={option.value}
                    type="button"
                    variant={answers.president === option.value ? "default" : "outline"}
                    className="h-11 justify-start text-sm"
                    onClick={() => handleAnswerChange("president", option.value)}
                  >
                    {option.label}
                  </Button>
                ))}
              </div>
            </div>

            <div className="space-y-2 md:col-span-2">
              <div className="flex items-center justify-between gap-3">
                <Label htmlFor="sea" className="text-base">
                  {t("question.sea")}
                </Label>
                <InstructionAudio text={t("question.sea")} />
              </div>
              <div className="grid gap-2 sm:grid-cols-3">
                {seaOptions.map((option) => (
                  <Button
                    key={option.value}
                    type="button"
                    variant={answers.sea === option.value ? "default" : "outline"}
                    className="h-11 justify-center text-sm"
                    onClick={() => handleAnswerChange("sea", option.value)}
                  >
                    {option.label}
                  </Button>
                ))}
              </div>
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

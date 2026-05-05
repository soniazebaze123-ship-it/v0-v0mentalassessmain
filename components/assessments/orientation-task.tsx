"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { useLanguage } from "@/contexts/language-context"
import { InstructionAudio } from "@/components/ui/instruction-audio"
import { CalendarDays, Compass, MapPin } from "lucide-react"

interface OrientationTaskProps {
  onComplete: (score: number) => void
  onSkip?: () => void
}

export function OrientationTask({ onComplete, onSkip }: OrientationTaskProps) {
  const { t, localizeText } = useLanguage()
  const [answers, setAnswers] = useState({
    date: "",
    month: "",
    year: "",
    day: "",
    country: "",
    city: "",
  })
  const unknownOption = {
    value: "unknown",
    label: localizeText("I don't know", { zh: "我不知道", yue: "我唔知道", fr: "Je ne sais pas" }),
  }

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
  const countryOptions = [
    { value: "china", label: t("common.china") },
    { value: "japan", label: localizeText("Japan", { zh: "日本", yue: "日本", fr: "Japon" }) },
    { value: "france", label: localizeText("France", { zh: "法国", yue: "法國", fr: "France" }) },
    { value: "usa", label: localizeText("United States", { zh: "美国", yue: "美國", fr: "États-Unis" }) },
  ]
  const cityOptions = [
    { value: "beijing", label: t("common.beijing") },
    { value: "shanghai", label: t("common.shanghai") },
    { value: "guangzhou", label: t("common.guangzhou") },
    { value: "shenzhen", label: t("common.shenzhen") },
  ]

  const selectClassName =
    "h-12 w-full rounded-2xl border border-emerald-200/80 bg-white px-4 text-base shadow-sm outline-none transition focus-visible:ring-2 focus-visible:ring-emerald-500"

  const handleAnswerChange = (field: string, value: string) => {
    setAnswers((prev) => ({ ...prev, [field]: value }))
  }

  const checkAnswers = () => {
    const now = new Date()
    const currentDate = now.getDate()
    const currentMonth = now.getMonth() + 1
    const currentYear = now.getFullYear()
    const currentDay = dayOptions[now.getDay()]?.value
    const currentCity = "beijing" // Default city for now

    let score = 0

    // Check date
    if (Number.parseInt(answers.date) === currentDate) score += 1

    // Check month
    if (Number.parseInt(answers.month) === currentMonth) score += 1

    // Check year
    if (Number.parseInt(answers.year) === currentYear) score += 1

    // Check day
    if (answers.day === currentDay) score += 1

    // Check country (should be China)
    if (answers.country === "china") score += 1

    // Check city
    if (answers.city === currentCity) score += 1

    onComplete(score)
  }

  const handleSkip = () => {
    if (onSkip) {
      onSkip()
    } else {
      onComplete(0)
    }
  }

  const isFormComplete = Object.values(answers).every((answer) => answer !== "")

  return (
    <Card className="mx-auto w-full max-w-3xl overflow-hidden border border-emerald-100/80 shadow-[0_24px_70px_rgba(16,185,129,0.10)]">
      <CardHeader className="bg-[radial-gradient(circle_at_top_left,_rgba(16,185,129,0.14),_transparent_42%),linear-gradient(135deg,_rgba(236,253,245,0.96),_rgba(255,255,255,0.98),_rgba(240,253,250,0.95))]">
        <div className="mb-3 flex items-center gap-2 text-emerald-700">
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-100 shadow-sm">
            <Compass className="h-5 w-5" />
          </span>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-600/80">
              {localizeText("Premium Task Layout", { zh: "高级任务布局", yue: "高級任務版面", fr: "Disposition premium" })}
            </p>
            <CardTitle className="text-emerald-900">{t("moca.orientation")}</CardTitle>
          </div>
        </div>
        <p className="text-sm text-slate-600">{t("moca.orientation.instruction")}</p>
        <InstructionAudio instructionKey="moca.orientation.instruction" className="mt-2" />
      </CardHeader>
      <CardContent className="space-y-8 pt-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-emerald-100 pb-2">
            <div className="flex items-center gap-3">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700 shadow-sm">
                <CalendarDays className="h-5 w-5" />
              </span>
              <h3 className="text-lg font-bold text-emerald-800">
                {localizeText("Calendar Orientation", { zh: "日期与时间", yue: "日期同時間", fr: "Orientation temporelle" })}
              </h3>
            </div>
            <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-medium text-emerald-700 shadow-sm">
              {localizeText("5 touch points", { zh: "5 个触点", yue: "5 個觸點", fr: "5 points tactiles" })}
            </span>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <div className="rounded-2xl border border-emerald-100 bg-white/80 p-4 shadow-sm">
              <div className="space-y-2">
              <div className="flex items-center justify-between gap-3">
                <Label htmlFor="date" className="text-base">{t("question.date")}</Label>
                <InstructionAudio text={t("question.date")} />
              </div>
              <select id="date" className={selectClassName} value={answers.date} onChange={(e) => handleAnswerChange("date", e.target.value)}>
                <option value="">{localizeText("Select date", { zh: "请选择日期", yue: "請選擇日期", fr: "Sélectionnez la date" })}</option>
                {Array.from({ length: 31 }, (_, index) => index + 1).map((date) => (
                  <option key={date} value={date}>{date}</option>
                ))}
                <option value={unknownOption.value}>{unknownOption.label}</option>
              </select>
              </div>
            </div>

            <div className="rounded-2xl border border-emerald-100 bg-white/80 p-4 shadow-sm">
              <div className="space-y-2">
              <div className="flex items-center justify-between gap-3">
                <Label htmlFor="month" className="text-base">{t("question.month")}</Label>
                <InstructionAudio text={t("question.month")} />
              </div>
              <select id="month" className={selectClassName} value={answers.month} onChange={(e) => handleAnswerChange("month", e.target.value)}>
                <option value="">{localizeText("Select month", { zh: "请选择月份", yue: "請選擇月份", fr: "Sélectionnez le mois" })}</option>
                {Array.from({ length: 12 }, (_, index) => index + 1).map((month) => (
                  <option key={month} value={month}>{t(`common.month_${month}`)}</option>
                ))}
                <option value={unknownOption.value}>{unknownOption.label}</option>
              </select>
              </div>
            </div>

            <div className="rounded-2xl border border-emerald-100 bg-white/80 p-4 shadow-sm">
              <div className="space-y-2">
              <div className="flex items-center justify-between gap-3">
                <Label htmlFor="year" className="text-base">{t("question.year")}</Label>
                <InstructionAudio text={t("question.year")} />
              </div>
              <select id="year" className={selectClassName} value={answers.year} onChange={(e) => handleAnswerChange("year", e.target.value)}>
                <option value="">{localizeText("Select year", { zh: "请选择年份", yue: "請選擇年份", fr: "Sélectionnez l’année" })}</option>
                {[currentYear - 1, currentYear, currentYear + 1].map((year) => (
                  <option key={year} value={year}>{year}</option>
                ))}
                <option value={unknownOption.value}>{unknownOption.label}</option>
              </select>
              </div>
            </div>

            <div className="rounded-2xl border border-emerald-100 bg-white/80 p-4 shadow-sm">
              <div className="space-y-2">
              <div className="flex items-center justify-between gap-3">
                <Label htmlFor="day" className="text-base">{t("question.day")}</Label>
                <InstructionAudio text={t("question.day")} />
              </div>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {[...dayOptions, unknownOption].map((option) => (
                  <Button
                    key={option.value}
                    type="button"
                    variant={answers.day === option.value ? "default" : "outline"}
                    className={`h-11 justify-center rounded-xl text-sm ${answers.day === option.value ? "bg-emerald-600 shadow-md hover:bg-emerald-700" : "border-emerald-200 bg-white hover:border-emerald-400 hover:bg-emerald-50"}`}
                    onClick={() => handleAnswerChange("day", option.value)}
                  >
                    {option.label}
                  </Button>
                ))}
              </div>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-teal-100 pb-2">
            <div className="flex items-center gap-3">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-teal-100 text-teal-700 shadow-sm">
                <MapPin className="h-5 w-5" />
              </span>
              <h3 className="text-lg font-bold text-teal-800">
                {localizeText("Place Orientation", { zh: "地点定位", yue: "地點定位", fr: "Orientation spatiale" })}
              </h3>
            </div>
            <span className="rounded-full bg-teal-100 px-3 py-1 text-xs font-medium text-teal-700 shadow-sm">
              {localizeText("Quick choice", { zh: "快速选择", yue: "快速選擇", fr: "Choix rapide" })}
            </span>
          </div>

          <div className="rounded-[24px] border border-teal-100 bg-[radial-gradient(circle_at_top_right,_rgba(20,184,166,0.12),_transparent_32%),linear-gradient(135deg,_rgba(240,253,250,1),_rgba(255,255,255,1))] p-5 shadow-sm">
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-3">
                <Label htmlFor="country" className="text-base">{t("question.country")}</Label>
                <InstructionAudio text={t("question.country")} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                {[...countryOptions, unknownOption].map((option) => (
                  <Button
                    key={option.value}
                    type="button"
                    variant={answers.country === option.value ? "default" : "outline"}
                    className={`h-12 justify-center rounded-xl text-sm ${answers.country === option.value ? "bg-teal-600 shadow-md hover:bg-teal-700" : "border-teal-200 bg-white hover:border-teal-400 hover:bg-teal-50"}`}
                    onClick={() => handleAnswerChange("country", option.value)}
                  >
                    {option.label}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-center space-x-4 pt-2">
          <Button variant="outline" onClick={handleSkip}>
            {t("common.skip_task")}
          </Button>
          <Button onClick={checkAnswers} disabled={!isFormComplete} className="w-full max-w-xs bg-gradient-to-r from-emerald-600 to-teal-600 shadow-md hover:from-emerald-700 hover:to-teal-700">
            {t("common.submit")}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

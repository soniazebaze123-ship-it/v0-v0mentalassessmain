"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { useLanguage } from "@/contexts/language-context"
import { InstructionAudio } from "@/components/ui/instruction-audio"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ScrollArea } from "@/components/ui/scroll-area"

interface OrientationTaskProps {
  onComplete: (score: number) => void
  onSkip?: () => void
}

export function OrientationTask({ onComplete, onSkip }: OrientationTaskProps) {
  const { t, language } = useLanguage()
  const [answers, setAnswers] = useState({
    date: "",
    month: "",
    year: "",
    day: "",
    place: "",
    city: "",
  })

  const handleAnswerChange = (field: string, value: string) => {
    setAnswers((prev) => ({ ...prev, [field]: value }))
  }

  // Generate year options (current year +/- 2 years)
  const currentYear = new Date().getFullYear()
  const yearOptions = [currentYear - 2, currentYear - 1, currentYear, currentYear + 1, currentYear + 2]

  // Date options (1-31)
  const dateOptions = Array.from({ length: 31 }, (_, i) => i + 1)

  // Days of the week in different languages
  const getDays = () => {
    const days = {
      en: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
      zh: ["星期日", "星期一", "星期二", "星期三", "星期四", "星期五", "星期六"],
      yue: ["星期日", "星期一", "星期二", "星期三", "星期四", "星期五", "星期六"],
      fr: ["Dimanche", "Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"],
    }
    return days[language as keyof typeof days] || days.en
  }

  // Months in different languages
  const getMonths = () => {
    const months = {
      en: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],
      zh: ["一月", "二月", "三月", "四月", "五月", "六月", "七月", "八月", "九月", "十月", "十一月", "十二月"],
      yue: ["一月", "二月", "三月", "四月", "五月", "六月", "七月", "八月", "九月", "十月", "十一月", "十二月"],
      fr: ["Janvier", "Février", "Mars", "Avril", "Mai", "Juin", "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"],
    }
    return months[language as keyof typeof months] || months.en
  }

  // Place options (hospitals, clinics, etc.)
  const getPlaces = () => {
    const places = {
      en: ["Hospital", "Clinic", "Health Center", "Home", "Office"],
      zh: ["医院", "诊所", "卫生中心", "家里", "办公室"],
      yue: ["醫院", "診所", "衛生中心", "屋企", "辦公室"],
      fr: ["Hôpital", "Clinique", "Centre de santé", "Maison", "Bureau"],
    }
    return places[language as keyof typeof places] || places.en
  }

  // City options
  const getCities = () => {
    const cities = {
      en: ["Guangzhou", "Shenzhen", "Beijing", "Shanghai", "Hangzhou", "Nanjing", "Chengdu", "Wuhan", "Hong Kong", "Macau"],
      zh: ["广州", "深圳", "北京", "上海", "杭州", "南京", "成都", "武汉", "香港", "澳门"],
      yue: ["廣州", "深圳", "北京", "上海", "杭州", "南京", "成都", "武漢", "香港", "澳門"],
      fr: ["Canton", "Shenzhen", "Pékin", "Shanghai", "Hangzhou", "Nankin", "Chengdu", "Wuhan", "Hong Kong", "Macao"],
    }
    return cities[language as keyof typeof cities] || cities.en
  }

  const checkAnswers = () => {
    const now = new Date()
    const currentDate = now.getDate()
    const currentMonth = now.getMonth() // 0-indexed
    const currentYearValue = now.getFullYear()
    const currentDayIndex = now.getDay()

    const days = getDays()
    const months = getMonths()

    let score = 0

    // Date (1 point)
    if (answers.date === currentDate.toString()) score += 1

    // Month (1 point)
    if (answers.month === months[currentMonth]) score += 1

    // Year (1 point)
    if (answers.year === currentYearValue.toString()) score += 1

    // Day of week (1 point)
    if (answers.day === days[currentDayIndex]) score += 1

    // Place (1 point) - any selection is acceptable
    if (answers.place !== "") score += 1

    // City (1 point) - any selection is acceptable
    if (answers.city !== "") score += 1

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

  const days = getDays()
  const months = getMonths()
  const places = getPlaces()
  const cities = getCities()

  const labels = {
    en: {
      title: "Orientation",
      instruction: "Please answer the following questions about time and place.",
      date: "What is today's date?",
      month: "What month is it?",
      year: "What year is it?",
      day: "What day of the week is it?",
      place: "Where are we now?",
      city: "What city are we in?",
      selectDate: "Select date",
      selectMonth: "Select month",
      selectYear: "Select year",
      selectDay: "Select day",
      selectPlace: "Select place",
      selectCity: "Select city",
    },
    zh: {
      title: "定向力",
      instruction: "请回答以下关于时间和地点的问题。",
      date: "今天是几号？",
      month: "现在是几月？",
      year: "现在是哪一年？",
      day: "今天是星期几？",
      place: "我们现在在哪里？",
      city: "我们在哪个城市？",
      selectDate: "选择日期",
      selectMonth: "选择月份",
      selectYear: "选择年份",
      selectDay: "选择星期",
      selectPlace: "选择地点",
      selectCity: "选择城市",
    },
    yue: {
      title: "定向力",
      instruction: "請回答以下關於時間同地點嘅問題。",
      date: "今日係幾號？",
      month: "而家係幾月？",
      year: "而家係邊一年？",
      day: "今日係星期幾？",
      place: "我哋而家喺邊度？",
      city: "我哋喺邊個城市？",
      selectDate: "揀日期",
      selectMonth: "揀月份",
      selectYear: "揀年份",
      selectDay: "揀星期",
      selectPlace: "揀地點",
      selectCity: "揀城市",
    },
    fr: {
      title: "Orientation",
      instruction: "Veuillez répondre aux questions suivantes sur le temps et le lieu.",
      date: "Quelle est la date d'aujourd'hui?",
      month: "En quel mois sommes-nous?",
      year: "En quelle année sommes-nous?",
      day: "Quel jour de la semaine sommes-nous?",
      place: "Où sommes-nous maintenant?",
      city: "Dans quelle ville sommes-nous?",
      selectDate: "Sélectionner la date",
      selectMonth: "Sélectionner le mois",
      selectYear: "Sélectionner l'année",
      selectDay: "Sélectionner le jour",
      selectPlace: "Sélectionner le lieu",
      selectCity: "Sélectionner la ville",
    },
  }

  const l = labels[language as keyof typeof labels] || labels.en

  return (
    <Card className="w-full max-w-2xl mx-auto border-t-4 border-green-500 shadow-lg">
      <CardHeader className="bg-green-50/50">
        <CardTitle className="text-green-700">{l.title}</CardTitle>
        <p className="text-sm text-gray-600">{l.instruction}</p>
        <InstructionAudio instructionKey="moca.orientation.instruction" className="mt-2" />
      </CardHeader>
      <CardContent className="space-y-6 pt-6">
        <div className="grid md:grid-cols-2 gap-6">
          {/* Date */}
          <div className="space-y-2">
            <Label className="text-base font-medium">{l.date}</Label>
            <Select value={answers.date} onValueChange={(value) => handleAnswerChange("date", value)}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder={l.selectDate} />
              </SelectTrigger>
              <SelectContent>
                <ScrollArea className="h-48">
                  {dateOptions.map((date) => (
                    <SelectItem key={date} value={date.toString()}>
                      {date}
                    </SelectItem>
                  ))}
                </ScrollArea>
              </SelectContent>
            </Select>
          </div>

          {/* Month */}
          <div className="space-y-2">
            <Label className="text-base font-medium">{l.month}</Label>
            <Select value={answers.month} onValueChange={(value) => handleAnswerChange("month", value)}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder={l.selectMonth} />
              </SelectTrigger>
              <SelectContent>
                <ScrollArea className="h-48">
                  {months.map((month) => (
                    <SelectItem key={month} value={month}>
                      {month}
                    </SelectItem>
                  ))}
                </ScrollArea>
              </SelectContent>
            </Select>
          </div>

          {/* Year */}
          <div className="space-y-2">
            <Label className="text-base font-medium">{l.year}</Label>
            <Select value={answers.year} onValueChange={(value) => handleAnswerChange("year", value)}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder={l.selectYear} />
              </SelectTrigger>
              <SelectContent>
                {yearOptions.map((year) => (
                  <SelectItem key={year} value={year.toString()}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Day */}
          <div className="space-y-2">
            <Label className="text-base font-medium">{l.day}</Label>
            <Select value={answers.day} onValueChange={(value) => handleAnswerChange("day", value)}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder={l.selectDay} />
              </SelectTrigger>
              <SelectContent>
                {days.map((day) => (
                  <SelectItem key={day} value={day}>
                    {day}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Place */}
          <div className="space-y-2">
            <Label className="text-base font-medium">{l.place}</Label>
            <Select value={answers.place} onValueChange={(value) => handleAnswerChange("place", value)}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder={l.selectPlace} />
              </SelectTrigger>
              <SelectContent>
                {places.map((place) => (
                  <SelectItem key={place} value={place}>
                    {place}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* City */}
          <div className="space-y-2">
            <Label className="text-base font-medium">{l.city}</Label>
            <Select value={answers.city} onValueChange={(value) => handleAnswerChange("city", value)}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder={l.selectCity} />
              </SelectTrigger>
              <SelectContent>
                <ScrollArea className="h-48">
                  {cities.map((city) => (
                    <SelectItem key={city} value={city}>
                      {city}
                    </SelectItem>
                  ))}
                </ScrollArea>
              </SelectContent>
            </Select>
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

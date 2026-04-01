"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { useLanguage } from "@/contexts/language-context"
import { InstructionAudio } from "@/components/ui/instruction-audio"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ScrollArea } from "@/components/ui/scroll-area"

interface MMSEOrientationProps {
  onComplete: (score: number) => void
  onSkip?: () => void
}

export function MMSEOrientation({ onComplete, onSkip }: MMSEOrientationProps) {
  const { t, language } = useLanguage()
  const [answers, setAnswers] = useState({
    year: "",
    season: "",
    date: "",
    day: "",
    month: "",
    country: "",
    province: "",
    city: "",
  })

  const handleAnswerChange = (field: string, value: string) => {
    setAnswers((prev) => ({ ...prev, [field]: value }))
  }

  // Generate year options (current year +/- 2 years)
  const currentYear = new Date().getFullYear()
  const yearOptions = [currentYear - 2, currentYear - 1, currentYear, currentYear + 1, currentYear + 2]

  // Seasons in different languages
  const getSeasons = () => {
    const seasons = {
      en: ["Spring", "Summer", "Autumn", "Winter"],
      zh: ["春天", "夏天", "秋天", "冬天"],
      yue: ["春天", "夏天", "秋天", "冬天"],
      fr: ["Printemps", "Été", "Automne", "Hiver"],
    }
    return seasons[language as keyof typeof seasons] || seasons.en
  }

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

  // Date options (1-31)
  const dateOptions = Array.from({ length: 31 }, (_, i) => i + 1)

  // Country options
  const getCountries = () => {
    const countries = {
      en: ["China", "United States", "United Kingdom", "France", "Japan"],
      zh: ["中国", "美国", "英国", "法国", "日本"],
      yue: ["中國", "美國", "英國", "法國", "日本"],
      fr: ["Chine", "États-Unis", "Royaume-Uni", "France", "Japon"],
    }
    return countries[language as keyof typeof countries] || countries.en
  }

  // Province options (Chinese provinces)
  const getProvinces = () => {
    const provinces = {
      en: ["Guangdong", "Beijing", "Shanghai", "Zhejiang", "Jiangsu", "Sichuan", "Hubei", "Hunan"],
      zh: ["广东省", "北京市", "上海市", "浙江省", "江苏省", "四川省", "湖北省", "湖南省"],
      yue: ["廣東省", "北京市", "上海市", "浙江省", "江蘇省", "四川省", "湖北省", "湖南省"],
      fr: ["Guangdong", "Pékin", "Shanghai", "Zhejiang", "Jiangsu", "Sichuan", "Hubei", "Hunan"],
    }
    return provinces[language as keyof typeof provinces] || provinces.en
  }

  // City options
  const getCities = () => {
    const cities = {
      en: ["Guangzhou", "Shenzhen", "Beijing", "Shanghai", "Hangzhou", "Nanjing", "Chengdu", "Wuhan"],
      zh: ["广州", "深圳", "北京", "上海", "杭州", "南京", "成都", "武汉"],
      yue: ["廣州", "深圳", "北京", "上海", "杭州", "南京", "成都", "武漢"],
      fr: ["Canton", "Shenzhen", "Pékin", "Shanghai", "Hangzhou", "Nankin", "Chengdu", "Wuhan"],
    }
    return cities[language as keyof typeof cities] || cities.en
  }

  const getCurrentSeason = () => {
    const month = new Date().getMonth() + 1
    const seasons = getSeasons()
    if (month >= 3 && month <= 5) return seasons[0] // Spring
    if (month >= 6 && month <= 8) return seasons[1] // Summer
    if (month >= 9 && month <= 11) return seasons[2] // Autumn
    return seasons[3] // Winter
  }

  const checkAnswers = () => {
    const now = new Date()
    const currentDate = now.getDate()
    const currentMonth = now.getMonth() // 0-indexed
    const currentYearValue = now.getFullYear()
    const currentDayIndex = now.getDay()
    const currentSeason = getCurrentSeason()

    const days = getDays()
    const months = getMonths()
    const countries = getCountries()

    let score = 0

    // Time questions (5 points)
    if (answers.year === currentYearValue.toString()) score += 1
    if (answers.season === currentSeason) score += 1
    if (answers.date === currentDate.toString()) score += 1
    if (answers.day === days[currentDayIndex]) score += 1
    if (answers.month === months[currentMonth]) score += 1

    // Place questions (3 points)
    if (answers.country === countries[0]) score += 1 // China is correct
    if (answers.province !== "") score += 1 // Any province selected
    if (answers.city !== "") score += 1 // Any city selected

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
    answers.year !== "" &&
    answers.month !== "" &&
    answers.day !== "" &&
    answers.date !== "" &&
    answers.season !== "" &&
    answers.country !== ""

  const seasons = getSeasons()
  const days = getDays()
  const months = getMonths()
  const countries = getCountries()
  const provinces = getProvinces()
  const cities = getCities()

  const labels = {
    en: {
      timeQuestions: "Time Questions (5 points)",
      placeQuestions: "Place Questions (3 points)",
      year: "What year is it?",
      season: "What season is it?",
      date: "What is today's date?",
      day: "What day of the week is it?",
      month: "What month is it?",
      country: "What country are we in?",
      province: "What province/state are we in?",
      city: "What city are we in?",
      selectYear: "Select year",
      selectSeason: "Select season",
      selectDate: "Select date",
      selectDay: "Select day",
      selectMonth: "Select month",
      selectCountry: "Select country",
      selectProvince: "Select province",
      selectCity: "Select city",
    },
    zh: {
      timeQuestions: "时间问题 (5分)",
      placeQuestions: "地点问题 (3分)",
      year: "现在是哪一年？",
      season: "现在是什么季节？",
      date: "今天是几号？",
      day: "今天是星期几？",
      month: "现在是几月？",
      country: "我们在哪个国家？",
      province: "我们在哪个省份？",
      city: "我们在哪个城市？",
      selectYear: "选择年份",
      selectSeason: "选择季节",
      selectDate: "选择日期",
      selectDay: "选择星期",
      selectMonth: "选择月份",
      selectCountry: "选择国家",
      selectProvince: "选择省份",
      selectCity: "选择城市",
    },
    yue: {
      timeQuestions: "時間問題 (5分)",
      placeQuestions: "地點問題 (3分)",
      year: "而家係邊一年？",
      season: "而家係咩季節？",
      date: "今日係幾號？",
      day: "今日係星期幾？",
      month: "而家係幾月？",
      country: "我哋喺邊個國家？",
      province: "我哋喺邊個省份？",
      city: "我哋喺邊個城市？",
      selectYear: "揀年份",
      selectSeason: "揀季節",
      selectDate: "揀日期",
      selectDay: "揀星期",
      selectMonth: "揀月份",
      selectCountry: "揀國家",
      selectProvince: "揀省份",
      selectCity: "揀城市",
    },
    fr: {
      timeQuestions: "Questions temporelles (5 points)",
      placeQuestions: "Questions spatiales (3 points)",
      year: "En quelle année sommes-nous?",
      season: "En quelle saison sommes-nous?",
      date: "Quelle est la date d'aujourd'hui?",
      day: "Quel jour de la semaine sommes-nous?",
      month: "En quel mois sommes-nous?",
      country: "Dans quel pays sommes-nous?",
      province: "Dans quelle province sommes-nous?",
      city: "Dans quelle ville sommes-nous?",
      selectYear: "Sélectionner l'année",
      selectSeason: "Sélectionner la saison",
      selectDate: "Sélectionner la date",
      selectDay: "Sélectionner le jour",
      selectMonth: "Sélectionner le mois",
      selectCountry: "Sélectionner le pays",
      selectProvince: "Sélectionner la province",
      selectCity: "Sélectionner la ville",
    },
  }

  const l = labels[language as keyof typeof labels] || labels.en

  return (
    <Card className="w-full max-w-3xl mx-auto border-t-4 border-blue-500 shadow-lg">
      <CardHeader className="bg-blue-50/50">
        <CardTitle className="text-blue-700">{t("mmse.orientation")}</CardTitle>
        <p className="text-sm text-gray-600">{t("mmse.orientation.instruction")}</p>
        <InstructionAudio instructionKey="mmse.orientation.instruction" className="mt-2" />
      </CardHeader>
      <CardContent className="space-y-8 pt-6">
        {/* Time Questions */}
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-blue-800 border-b pb-2">{l.timeQuestions}</h3>
          <div className="grid md:grid-cols-2 gap-6">
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

            {/* Season */}
            <div className="space-y-2">
              <Label className="text-base font-medium">{l.season}</Label>
              <Select value={answers.season} onValueChange={(value) => handleAnswerChange("season", value)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={l.selectSeason} />
                </SelectTrigger>
                <SelectContent>
                  {seasons.map((season) => (
                    <SelectItem key={season} value={season}>
                      {season}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

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

            {/* Month */}
            <div className="space-y-2 md:col-span-2">
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
          </div>
        </div>

        {/* Place Questions */}
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-blue-800 border-b pb-2">{l.placeQuestions}</h3>
          <div className="grid md:grid-cols-2 gap-6">
            {/* Country */}
            <div className="space-y-2">
              <Label className="text-base font-medium">{l.country}</Label>
              <Select value={answers.country} onValueChange={(value) => handleAnswerChange("country", value)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={l.selectCountry} />
                </SelectTrigger>
                <SelectContent>
                  {countries.map((country) => (
                    <SelectItem key={country} value={country}>
                      {country}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Province */}
            <div className="space-y-2">
              <Label className="text-base font-medium">{l.province}</Label>
              <Select value={answers.province} onValueChange={(value) => handleAnswerChange("province", value)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={l.selectProvince} />
                </SelectTrigger>
                <SelectContent>
                  <ScrollArea className="h-48">
                    {provinces.map((province) => (
                      <SelectItem key={province} value={province}>
                        {province}
                      </SelectItem>
                    ))}
                  </ScrollArea>
                </SelectContent>
              </Select>
            </div>

            {/* City */}
            <div className="space-y-2 md:col-span-2">
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

"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { AssessmentInput } from "@/components/ui/assessment-input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useUser } from "@/contexts/user-context"
import { useLanguage } from "@/contexts/language-context"
import { ThemeToggle } from "@/components/ui/theme-toggle"

interface RegistrationProps {
  onBackToLogin: () => void
}

type SupportedLanguage = "en" | "zh" | "yue" | "fr"

const DATE_OPTION_COUNT = 120

function getDateFieldOrder(language: SupportedLanguage) {
  switch (language) {
    case "zh":
    case "yue":
      return ["year", "month", "day"] as const
    case "fr":
      return ["day", "month", "year"] as const
    default:
      return ["month", "day", "year"] as const
  }
}

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month, 0).getDate()
}

function formatDateForDisplay(value: string, language: SupportedLanguage) {
  const [year, month, day] = value.split("-").map(Number)

  if (!year || !month || !day) {
    return value
  }

  if (language === "zh" || language === "yue") {
    return `${year}年${month}月${day}日`
  }

  const paddedMonth = String(month).padStart(2, "0")
  const paddedDay = String(day).padStart(2, "0")

  if (language === "fr") {
    return `${paddedDay}/${paddedMonth}/${year}`
  }

  return `${paddedMonth}/${paddedDay}/${year}`
}

function getMonthOptionLabel(month: number, language: SupportedLanguage, t: (key: string) => string) {
  if (language === "zh" || language === "yue") {
    return `${month}月`
  }

  return t(`common.month_${month}`)
}

function getDayOptionLabel(day: number, language: SupportedLanguage) {
  if (language === "zh" || language === "yue") {
    return `${day}日`
  }

  return String(day)
}

function getYearOptionLabel(year: string, language: SupportedLanguage) {
  if (language === "zh" || language === "yue") {
    return `${year}年`
  }

  return year
}

export function Registration({ onBackToLogin }: RegistrationProps) {
  const { t, language, setLanguage } = useLanguage()
  const { register } = useUser()
  const [name, setName] = useState("")
  const [phoneNumber, setPhoneNumber] = useState("")
  const [birthYear, setBirthYear] = useState("")
  const [birthMonth, setBirthMonth] = useState("")
  const [birthDay, setBirthDay] = useState("")
  const [gender, setGender] = useState("")
  const [nationalId, setNationalId] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const currentYear = new Date().getFullYear()
  const yearOptions = Array.from({ length: DATE_OPTION_COUNT }, (_, index) => String(currentYear - index))
  const monthOptions = Array.from({ length: 12 }, (_, index) => index + 1)
  const dayOptions = Array.from(
    { length: birthYear && birthMonth ? getDaysInMonth(Number(birthYear), Number(birthMonth)) : 31 },
    (_, index) => index + 1,
  )
  const dateOfBirth = birthYear && birthMonth && birthDay
    ? `${birthYear}-${String(Number(birthMonth)).padStart(2, "0")}-${String(Number(birthDay)).padStart(2, "0")}`
    : ""

  const handleBirthYearChange = (value: string) => {
    setBirthYear(value)

    if (birthMonth && birthDay) {
      const maxDays = getDaysInMonth(Number(value), Number(birthMonth))
      if (Number(birthDay) > maxDays) {
        setBirthDay(String(maxDays))
      }
    }
  }

  const handleBirthMonthChange = (value: string) => {
    setBirthMonth(value)

    if (birthYear && birthDay) {
      const maxDays = getDaysInMonth(Number(birthYear), Number(value))
      if (Number(birthDay) > maxDays) {
        setBirthDay(String(maxDays))
      }
    }
  }

  const handleBirthDayChange = (value: string) => {
    setBirthDay(value)
  }

  const handleRegister = async (event?: React.FormEvent<HTMLFormElement>) => {
    event?.preventDefault()
    setLoading(true)
    setError(null)

    if (password.length < 8) {
      setError(t("register.error.password_short"))
      setLoading(false)
      return
    }

    if (password !== confirmPassword) {
      setError(t("register.error.password_mismatch"))
      setLoading(false)
      return
    }

    const registerResult = await register(phoneNumber, password, name, dateOfBirth, gender, nationalId)
    if (!registerResult.success) {
      setError(registerResult.error || t("register.error.invalid"))
    }

    setLoading(false)
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold">{t("register.title")}</CardTitle>
          <CardDescription>{t("registration.description")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex justify-center mb-4 space-x-2 flex-wrap gap-2">
            <Button
              variant={language === "en" ? "default" : "outline"}
              size="sm"
              onClick={() => setLanguage("en")}
              className="touch-target"
            >
              English
            </Button>
            <Button
              variant={language === "zh" ? "default" : "outline"}
              size="sm"
              onClick={() => setLanguage("zh")}
              className="touch-target"
            >
              中文
            </Button>
            <Button
              variant={language === "yue" ? "default" : "outline"}
              size="sm"
              onClick={() => setLanguage("yue")}
              className="touch-target"
            >
              廣東話
            </Button>
            <Button
              variant={language === "fr" ? "default" : "outline"}
              size="sm"
              onClick={() => setLanguage("fr")}
              className="touch-target"
            >
              Français
            </Button>
            <ThemeToggle />
          </div>

          <form className="space-y-6" onSubmit={handleRegister} autoComplete="on">
            <div className="space-y-2">
              <Label htmlFor="name">{t("register.name")}</Label>
              <AssessmentInput
                id="name"
                name="name"
                type="text"
                placeholder={t("register.name.placeholder")}
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={loading}
                autoComplete="name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">{t("phone")}</Label>
              <AssessmentInput
                id="phone"
                name="username"
                type="tel"
                placeholder="+86 123 4567 8901"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                disabled={loading}
                autoComplete="username tel"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="dob">{t("register.date_of_birth")}</Label>
              <div className="grid grid-cols-3 gap-2" id="dob">
                {getDateFieldOrder(language).map((field) => {
                  if (field === "year") {
                    return (
                      <Select key={field} value={birthYear} onValueChange={handleBirthYearChange} disabled={loading}>
                        <SelectTrigger aria-label={t("register.date_of_birth.year")}>
                          <SelectValue placeholder={t("register.date_of_birth.year")} />
                        </SelectTrigger>
                        <SelectContent>
                          {yearOptions.map((year) => (
                            <SelectItem key={year} value={year}>
                              {getYearOptionLabel(year, language)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )
                  }

                  if (field === "month") {
                    return (
                      <Select key={field} value={birthMonth} onValueChange={handleBirthMonthChange} disabled={loading}>
                        <SelectTrigger aria-label={t("register.date_of_birth.month")}>
                          <SelectValue placeholder={t("register.date_of_birth.month")} />
                        </SelectTrigger>
                        <SelectContent>
                          {monthOptions.map((month) => (
                            <SelectItem key={month} value={String(month)}>
                              {getMonthOptionLabel(month, language, t)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )
                  }

                  return (
                    <Select key={field} value={birthDay} onValueChange={handleBirthDayChange} disabled={loading}>
                      <SelectTrigger aria-label={t("register.date_of_birth.day")}>
                        <SelectValue placeholder={t("register.date_of_birth.day")} />
                      </SelectTrigger>
                      <SelectContent>
                        {dayOptions.map((day) => (
                          <SelectItem key={day} value={String(day)}>
                            {getDayOptionLabel(day, language)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )
                })}
              </div>
              <input type="hidden" name="bday" value={dateOfBirth} />
              {dateOfBirth ? (
                <p className="text-sm text-muted-foreground">{formatDateForDisplay(dateOfBirth, language)}</p>
              ) : (
                <p className="text-sm text-muted-foreground">{t("register.date_of_birth.placeholder")}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="gender">{t("register.gender")}</Label>
              <Select value={gender} onValueChange={setGender} disabled={loading}>
                <SelectTrigger id="gender">
                  <SelectValue placeholder={t("register.gender.placeholder")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">{t("register.gender.male")}</SelectItem>
                  <SelectItem value="female">{t("register.gender.female")}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="national-id">{t("register.national_id")}</Label>
              <AssessmentInput
                id="national-id"
                name="national-id"
                type="text"
                placeholder={t("register.national_id.placeholder")}
                value={nationalId}
                onChange={(e) => setNationalId(e.target.value)}
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">{t("register.password")}</Label>
              <AssessmentInput
                id="password"
                name="new-password"
                type="password"
                placeholder={t("register.password.placeholder")}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                autoComplete="new-password"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirm-password">{t("register.confirm_password")}</Label>
              <AssessmentInput
                id="confirm-password"
                name="confirm-password"
                type="password"
                placeholder={t("register.confirm_password.placeholder")}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={loading}
                autoComplete="new-password"
              />
            </div>

            <Button
              type="submit"
              className="w-full touch-target"
              disabled={
                loading ||
                phoneNumber.length < 6 ||
                name.trim().length < 2 ||
                !dateOfBirth ||
                !gender ||
                !gender ||
                password.length < 8 ||
                confirmPassword.length < 8
              }
            >
              {loading ? t("common.loading") : t("common.next")}
            </Button>
          </form>

          {error && <p className="text-red-500 text-sm text-center">{error}</p>}

          <div className="text-center text-sm">
            <Button variant="link" onClick={onBackToLogin} className="px-0">
              {t("login.already_account")}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

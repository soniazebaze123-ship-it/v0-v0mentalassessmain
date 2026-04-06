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

export function Registration({ onBackToLogin }: RegistrationProps) {
  const { t, language, setLanguage } = useLanguage()
  const { register } = useUser()
  const [name, setName] = useState("")
  const [phoneNumber, setPhoneNumber] = useState("")
  const [dateOfBirth, setDateOfBirth] = useState("")
  const [gender, setGender] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

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

    const registerResult = await register(phoneNumber, password, name, dateOfBirth, gender)
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
              <AssessmentInput
                id="dob"
                name="bday"
                type="date"
                value={dateOfBirth}
                onChange={(e) => setDateOfBirth(e.target.value)}
                disabled={loading}
                max={new Date().toISOString().split("T")[0]}
                autoComplete="bday"
              />
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

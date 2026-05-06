"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { AssessmentInput } from "@/components/ui/assessment-input"
import { Button } from "@/components/ui/button"
import { useUser } from "@/contexts/user-context"
import { useLanguage } from "@/contexts/language-context"
import { ThemeToggle } from "@/components/ui/theme-toggle"

interface LoginProps {
  onRegister: () => void
  onAdminLogin: () => void
}

export function Login({ onRegister, onAdminLogin }: LoginProps) {
  const { t, language, setLanguage } = useLanguage()
  const { login } = useUser()
  const [phoneNumber, setPhoneNumber] = useState("")
  const [password, setPassword] = useState("")
  const [rememberPhone, setRememberPhone] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const rememberedPhoneNumber = localStorage.getItem("mental_assess_remembered_phone")

    if (rememberedPhoneNumber) {
      setPhoneNumber(rememberedPhoneNumber)
    } else {
      setPhoneNumber("+86 ")
    }
  }, [])

  const handleLogin = async (event?: React.FormEvent<HTMLFormElement>) => {
    event?.preventDefault()
    setLoading(true)
    setError(null)

    if (rememberPhone) {
      localStorage.setItem("mental_assess_remembered_phone", phoneNumber)
    } else {
      localStorage.removeItem("mental_assess_remembered_phone")
    }

    const loginResult = await login(phoneNumber, password)
    if (!loginResult.success) {
      setError(loginResult.error || t("login.error.invalid_credentials"))
    }
    setLoading(false)
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold">{t("login.title")}</CardTitle>
          <CardDescription>{t("login.enter_phone")}</CardDescription>
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

          <form className="space-y-6" onSubmit={handleLogin} autoComplete="on">
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
              <Label htmlFor="password">{t("login.password")}</Label>
              <AssessmentInput
                id="password"
                name="password"
                type="password"
                placeholder={t("login.password.placeholder")}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                autoComplete="current-password"
              />
            </div>

            <label className="flex items-center gap-2 text-sm text-muted-foreground">
              <input
                type="checkbox"
                checked={rememberPhone}
                onChange={(event) => setRememberPhone(event.target.checked)}
                disabled={loading}
              />
              <span>{t("login.remember_phone")}</span>
            </label>

            <Button
              type="submit"
              className="w-full touch-target"
              disabled={loading || phoneNumber.trim().length < 6 || password.length === 0}
            >
              {loading ? t("common.loading") : t("common.next")}
            </Button>
          </form>

          {error && <p className="text-red-500 text-sm text-center">{error}</p>}

          <div className="text-center text-sm">
            <Button variant="link" onClick={onRegister} className="px-0">
              {t("login.new_user")}
            </Button>
          </div>
          <div className="text-center text-sm">
            <Button variant="link" onClick={onAdminLogin} className="px-0">
              {t("login.admin")}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

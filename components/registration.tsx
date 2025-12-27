"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { AssessmentInput } from "@/components/ui/assessment-input"
import { Button } from "@/components/ui/button"
import { useUser } from "@/contexts/user-context"
import { useLanguage } from "@/contexts/language-context"
import { ThemeToggle } from "@/components/ui/theme-toggle"

interface RegistrationProps {
  onBackToLogin: () => void
}

export function Registration({ onBackToLogin }: RegistrationProps) {
  const { t, language, setLanguage } = useLanguage()
  const { register, sendOtp } = useUser()
  const [phoneNumber, setPhoneNumber] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSendOtpAndRegister = async () => {
    setLoading(true)
    setError(null)
    // Simulate OTP send (no actual OTP needed for this dummy auth)
    const otpResult = await sendOtp(phoneNumber)
    if (otpResult.success) {
      // Directly attempt registration after "OTP sent" simulation
      const registerResult = await register(phoneNumber)
      if (!registerResult.success) {
        setError(registerResult.error || t("register.error.invalid"))
      }
    } else {
      setError(otpResult.error || t("register.error.invalid"))
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

          <div className="space-y-2">
            <Label htmlFor="phone">{t("phone")}</Label>
            <AssessmentInput
              id="phone"
              type="tel"
              placeholder="+86 123 4567 8901"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              disabled={loading}
            />
          </div>

          <Button
            onClick={handleSendOtpAndRegister}
            className="w-full touch-target"
            disabled={loading || phoneNumber.length < 10}
          >
            {loading ? t("common.loading") : t("common.next")}
          </Button>

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

"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { X, Download, Smartphone } from "lucide-react"
import { useLanguage } from "@/contexts/language-context"

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>
}

export function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [showPrompt, setShowPrompt] = useState(false)
  const [isIOS, setIsIOS] = useState(false)
  const [isStandalone, setIsStandalone] = useState(false)
  const { language } = useLanguage()

  useEffect(() => {
    // Check if already installed
    const standalone = window.matchMedia("(display-mode: standalone)").matches
    setIsStandalone(standalone)

    // Check if iOS
    const ios = /iPad|iPhone|iPod/.test(navigator.userAgent)
    setIsIOS(ios)

    // Check if dismissed recently
    const dismissed = localStorage.getItem("pwa-install-dismissed")
    if (dismissed) {
      const dismissedTime = parseInt(dismissed, 10)
      // Show again after 7 days
      if (Date.now() - dismissedTime < 7 * 24 * 60 * 60 * 1000) {
        return
      }
    }

    // Listen for install prompt
    const handler = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      setShowPrompt(true)
    }

    window.addEventListener("beforeinstallprompt", handler)

    // For iOS, show prompt after a delay if not installed
    if (ios && !standalone) {
      setTimeout(() => setShowPrompt(true), 3000)
    }

    return () => window.removeEventListener("beforeinstallprompt", handler)
  }, [])

  const handleInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt()
      const { outcome } = await deferredPrompt.userChoice
      if (outcome === "accepted") {
        setShowPrompt(false)
      }
      setDeferredPrompt(null)
    }
  }

  const handleDismiss = () => {
    localStorage.setItem("pwa-install-dismissed", Date.now().toString())
    setShowPrompt(false)
  }

  if (!showPrompt || isStandalone) return null

  const texts = {
    en: {
      title: "Install MentalAssess",
      description: "Add to your home screen for easy access and offline use",
      iosDescription: "Tap the Share button and select 'Add to Home Screen'",
      install: "Install",
      dismiss: "Not now",
    },
    zh: {
      title: "安装 MentalAssess",
      description: "添加到主屏幕以便快速访问和离线使用",
      iosDescription: "点击分享按钮，然后选择"添加到主屏幕"",
      install: "安装",
      dismiss: "暂不安装",
    },
    yue: {
      title: "安裝 MentalAssess",
      description: "加到主畫面方便隨時使用同離線使用",
      iosDescription: "撳分享掣，然後揀「加到主畫面」",
      install: "安裝",
      dismiss: "之後先",
    },
    fr: {
      title: "Installer MentalAssess",
      description: "Ajoutez à l'écran d'accueil pour un accès facile et hors ligne",
      iosDescription: "Appuyez sur le bouton Partager et sélectionnez 'Sur l'écran d'accueil'",
      install: "Installer",
      dismiss: "Plus tard",
    },
  }

  const t = texts[language as keyof typeof texts] || texts.en

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 md:left-auto md:right-4 md:w-96">
      <Card className="shadow-2xl border-2 border-blue-200 bg-white/95 backdrop-blur-sm">
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-blue-500 to-teal-500 rounded-xl">
                <Smartphone className="w-6 h-6 text-white" />
              </div>
              <div>
                <CardTitle className="text-lg">{t.title}</CardTitle>
                <CardDescription className="text-sm">
                  {isIOS ? t.iosDescription : t.description}
                </CardDescription>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 -mt-1 -mr-2"
              onClick={handleDismiss}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>
        {!isIOS && (
          <CardContent className="pt-2 pb-4">
            <div className="flex gap-2">
              <Button
                onClick={handleInstall}
                className="flex-1 bg-gradient-to-r from-blue-500 to-teal-500 hover:from-blue-600 hover:to-teal-600"
              >
                <Download className="w-4 h-4 mr-2" />
                {t.install}
              </Button>
              <Button variant="outline" onClick={handleDismiss}>
                {t.dismiss}
              </Button>
            </div>
          </CardContent>
        )}
      </Card>
    </div>
  )
}

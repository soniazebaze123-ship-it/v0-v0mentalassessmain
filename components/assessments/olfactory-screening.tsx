"use client"

import { useEffect, useEffectEvent, useRef, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useUser } from "@/contexts/user-context"
import { supabase } from "@/lib/supabase"
import { useLanguage } from "@/contexts/language-context"
import { InstructionAudio } from "@/components/ui/instruction-audio"
import {
  selectRandomSmells,
  generateDistractors,
  calculateOlfactoryScore,
  type SmellItem,
} from "@/lib/olfactory-screening-utils"
import { Flower2, Check, X, Timer, AlertCircle } from "lucide-react"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"

interface OlfactoryScreeningProps {
  onComplete: (score: number) => void
  onSkip?: () => void
  enhanced?: boolean
}

const SMELL_ICONS: Record<string, string> = {
  rose: "🌹",
  lemon: "🍋",
  coffee: "☕",
  mint: "🌿",
  cinnamon: "🥮",
  chocolate: "🍫",
  vanilla: "🍦",
  orange: "🍊",
  soap: "🧼",
  garlic: "🧄",
  peppermint: "🍬",
  banana: "🍌",
}

export function OlfactoryScreening({ onComplete, onSkip, enhanced = false }: OlfactoryScreeningProps) {
  const { t, localizeText } = useLanguage()
  const { user } = useUser()
  const uiText = (englishText: string, chineseText: string, cantoneseText?: string, frenchText?: string) =>
    localizeText(englishText, {
      zh: chineseText,
      yue: cantoneseText ?? chineseText,
      fr: frenchText,
    })

  const [testStarted, setTestStarted] = useState(false)
  const [testComplete, setTestComplete] = useState(false)
  const [currentTrialIndex, setCurrentTrialIndex] = useState(0)
  const [results, setResults] = useState<{ correct: boolean }[]>([])
  const [showFeedback, setShowFeedback] = useState(false)
  const [lastAnswerCorrect, setLastAnswerCorrect] = useState(false)

  const [trials] = useState(() => {
    const selectedSmells = selectRandomSmells(6)
    return selectedSmells.map((smell) => ({
      correct: smell,
      options: [smell, ...generateDistractors(smell, 3)].sort(() => Math.random() - 0.5),
    }))
  })

  const currentTrial = trials[currentTrialIndex]
  const premiumShell =
    "mx-auto w-full max-w-4xl overflow-hidden border border-white/70 bg-[radial-gradient(circle_at_top_left,_rgba(249,168,212,0.16),_transparent_28%),linear-gradient(135deg,_rgba(255,255,255,0.97),_rgba(255,251,235,0.98),_rgba(255,247,237,0.94))] shadow-[0_28px_90px_rgba(15,23,42,0.10)]"
  const premiumHeader = "border-b border-white/70 bg-white/85 pb-6"
  const primaryButton =
    "h-12 rounded-full bg-gradient-to-r from-rose-500 via-orange-500 to-amber-500 px-6 text-white shadow-lg shadow-rose-500/20 hover:from-rose-600 hover:via-orange-600 hover:to-amber-600"
  
  // Timer state (30 seconds per question)
  const [timeRemaining, setTimeRemaining] = useState(30)
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  
  const handleTimeUp = useEffectEvent(() => {
    setLastAnswerCorrect(false)
    setShowFeedback(true)

    const newResults = [...results, { correct: false }]
    setResults(newResults)

    setTimeout(() => {
      setShowFeedback(false)
      if (currentTrialIndex < trials.length - 1) {
        setCurrentTrialIndex(currentTrialIndex + 1)
      } else {
        void finishTest(newResults)
      }
    }, 1500)
  })

  // Start timer when test starts or question changes
  useEffect(() => {
    if (testStarted && !testComplete && !showFeedback) {
      setTimeRemaining(30)
      timerRef.current = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            // Time's up - auto-submit as incorrect
            if (timerRef.current) clearInterval(timerRef.current)
            handleTimeUp()
            return 0
          }
          return prev - 1
        })
      }, 1000)
    }
    
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [currentTrialIndex, handleTimeUp, showFeedback, testComplete, testStarted])

  const handleStart = () => {
    setTestStarted(true)
  }

  const handleSelectOption = (selected: SmellItem) => {
    // Clear timer when user answers
    if (timerRef.current) clearInterval(timerRef.current)
    
    const isCorrect = selected.id === currentTrial.correct.id
    setLastAnswerCorrect(isCorrect)
    setShowFeedback(true)

    const newResults = [...results, { correct: isCorrect }]
    setResults(newResults)

    setTimeout(() => {
      setShowFeedback(false)
      if (currentTrialIndex < trials.length - 1) {
        setCurrentTrialIndex(currentTrialIndex + 1)
      } else {
        finishTest(newResults)
      }
    }, 1500)
  }

  const finishTest = async (finalResults: { correct: boolean }[]) => {
    setTestComplete(true)

    const { totalCorrect, percentCorrect, classification, normalizedScore } = calculateOlfactoryScore(finalResults)

    console.log("[v0] Olfactory test complete:", { totalCorrect, percentCorrect, classification, normalizedScore })

    if (user) {
      try {
        await supabase.from("sensory_assessments").insert({
          user_id: user.id,
          test_type: "olfactory",
          raw_score: totalCorrect,
          normalized_score: normalizedScore,
          classification: classification,
          test_data: {
            total_trials: finalResults.length,
            total_correct: totalCorrect,
            percent_correct: percentCorrect,
          },
          device_info: {
            userAgent: navigator.userAgent,
            platform: navigator.platform,
          },
          environment_data: {
            test_type: "smell_identification",
            self_administered: true,
          },
        })
        console.log("[v0] Olfactory screening saved successfully")
      } catch (error) {
        console.error("[v0] Error saving olfactory screening:", error)
      }
    }

    onComplete(Math.round(normalizedScore))
  }

  const handleSkip = () => {
    if (onSkip) {
      onSkip()
    } else {
      onComplete(0)
    }
  }

  if (!testStarted) {
    return (
      <Card className={premiumShell}>
        <CardHeader className={premiumHeader}>
          <CardTitle className="flex items-center gap-2">
            <Flower2 className="h-6 w-6" />
            {t("sensory.olfactory.title")}
          </CardTitle>
          <p className="text-sm text-muted-foreground">{t("sensory.olfactory.description")}</p>
          <InstructionAudio instructionKey="sensory.olfactory.instruction" className="mt-2" />
        </CardHeader>
        <CardContent className="space-y-6 bg-white/75 p-6 sm:p-8">
          <div className="grid gap-4 sm:grid-cols-[1.3fr_0.9fr]">
            <div className="rounded-[28px] border border-rose-100 bg-gradient-to-br from-rose-50 via-orange-50 to-white p-6 shadow-sm">
              <h3 className="font-semibold text-slate-900">{t("sensory.olfactory.setup_title")}</h3>
              <ul className="mt-4 space-y-2 text-sm leading-6 text-slate-600">
                <li>• {t("sensory.olfactory.setup_1")}</li>
                <li>• {t("sensory.olfactory.setup_2")}</li>
                <li>• {t("sensory.olfactory.setup_3")}</li>
                <li>• {t("sensory.olfactory.setup_4")}</li>
              </ul>
            </div>

            <div className="rounded-[28px] border border-slate-200/70 bg-slate-950 p-5 text-white shadow-sm">
              <div className="flex items-center gap-2">
                <Badge className="rounded-full border-0 bg-white/15 px-3 py-1 text-white">
                  {uiText("Smell ID", "气味识别", "氣味識別", "Identification")}
                </Badge>
                {enhanced && (
                  <Badge className="rounded-full border-0 bg-rose-500 px-3 py-1 text-white">
                    {uiText("Enhanced", "增强模式", "增強模式", "Amélioré")}
                  </Badge>
                )}
              </div>
              <p className="mt-4 text-sm leading-6 text-slate-200">{uiText("Choose the label that best matches the smell item shown on each card. You have 30 seconds per round.", "请选择最符合每张卡片气味项目的标签。每轮有30秒。", "請選擇最符合每張卡片氣味項目嘅標籤。每輪有30秒。", "Choisissez l’étiquette qui correspond le mieux à l’odeur affichée. Vous avez 30 secondes par tour.")}</p>
            </div>
          </div>

          <div className="rounded-[28px] border border-amber-200 bg-amber-50/80 p-4 shadow-sm">
            <p className="text-sm text-amber-800">{t("sensory.olfactory.note")}</p>
          </div>

          <div className="flex flex-col items-center justify-center gap-4 pt-4 sm:flex-row">
            <Button variant="outline" onClick={handleSkip} className="h-12 w-full rounded-full border-slate-300 bg-white text-slate-700 hover:bg-slate-50 sm:w-auto">
              {t("common.skip_task")}
            </Button>
            <Button onClick={handleStart} className={primaryButton + " w-full sm:w-auto"}>
              {t("sensory.olfactory.start_test")}
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (testComplete) {
    return (
      <Card className={premiumShell}>
        <CardHeader className={premiumHeader}>
          <CardTitle>{t("sensory.olfactory.complete_title")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6 bg-white/75 p-6 text-center sm:p-8">
          <div className="rounded-[28px] border border-emerald-100 bg-emerald-50/80 p-8 shadow-sm">
            <div className="text-6xl">✓</div>
            <p className="mt-4 text-lg">{t("sensory.olfactory.complete_message")}</p>
          </div>
          <Button onClick={() => onComplete(0)} className={primaryButton + " mt-4"}>
            {t("common.continue")}
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={premiumShell}>
      <CardHeader className={premiumHeader}>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>
              {t("sensory.olfactory.trial")} {currentTrialIndex + 1} / {trials.length}
            </CardTitle>
            <p className="text-sm text-muted-foreground">{t("sensory.olfactory.select_smell")}</p>
          </div>
          {/* Timer display */}
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full ${
            timeRemaining <= 10 ? "bg-red-100 text-red-700" : "bg-gray-100 text-gray-700"
          }`}>
            <Timer className={`h-4 w-4 ${timeRemaining <= 10 ? "animate-pulse" : ""}`} />
            <span className="font-mono font-semibold">{timeRemaining}s</span>
          </div>
        </div>
        {/* Progress bar */}
        <Progress value={((currentTrialIndex) / trials.length) * 100} className="mt-3" />
        {/* Timer progress */}
        <div className="mt-2">
          <Progress 
            value={(timeRemaining / 30) * 100} 
            className={`h-1 ${timeRemaining <= 10 ? "[&>div]:bg-red-500" : "[&>div]:bg-blue-500"}`}
          />
        </div>
      </CardHeader>
      <CardContent className="space-y-6 bg-white/75 p-6 sm:p-8">
        {showFeedback && (
          <div
            className={`flex items-center justify-center gap-2 rounded-[22px] p-4 ${
              lastAnswerCorrect ? "bg-green-100" : "bg-red-100"
            }`}
          >
            {lastAnswerCorrect ? <Check className="h-6 w-6 text-green-600" /> : <X className="h-6 w-6 text-red-600" />}
            <span className="font-medium">
              {lastAnswerCorrect ? t("sensory.olfactory.correct") : t("sensory.olfactory.incorrect")}
            </span>
          </div>
        )}

        {/* Time warning */}
        {timeRemaining <= 10 && !showFeedback && (
          <div className="flex animate-pulse items-center justify-center gap-2 rounded-2xl bg-red-50 p-3 text-red-600">
            <AlertCircle className="h-4 w-4" />
            <span className="text-sm font-medium">
              {timeRemaining <= 5
                ? uiText("Hurry! Time almost up!", "请快一点，时间快到了！", "請快啲，時間就快到！", "Dépêchez-vous, le temps est presque écoulé !")
                : uiText("Running low on time!", "剩余时间不多了！", "剩返唔多時間！", "Il reste peu de temps !")}
            </span>
          </div>
        )}

        <div className="grid grid-cols-2 gap-6">
          {currentTrial.options.map((option) => (
            <button
              key={option.id}
              onClick={() => handleSelectOption(option)}
              disabled={showFeedback}
              className="flex flex-col items-center gap-4 rounded-[28px] border-2 border-slate-200 bg-white p-6 transition-colors hover:border-rose-400 hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <div className="relative flex h-32 w-32 items-center justify-center rounded-[24px] bg-gradient-to-br from-rose-50 via-orange-50 to-amber-50">
                <span className="text-7xl">{SMELL_ICONS[option.id] || "🌸"}</span>
              </div>
              <span className="font-medium text-lg">{t(`sensory.olfactory.smell.${option.id}`)}</span>
            </button>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

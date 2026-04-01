"use client"

import { useState, useEffect, useRef } from "react"
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
import { TestProgress } from "@/components/ui/test-progress"
import { ScoreGauge, getScoreRiskLevel } from "@/components/ui/score-gauge"
import { RiskBadge } from "@/components/ui/risk-badge"

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
  const { t } = useLanguage()
  const { user } = useUser()

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
  
  // Timer state (30 seconds per question)
  const [timeRemaining, setTimeRemaining] = useState(30)
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  
  // Start timer when test starts or question changes
  useEffect(() => {
    if (testStarted && !testComplete && !showFeedback) {
      setTimeRemaining(30)
      timerRef.current = setInterval(() => {
        setTimeRemaining(prev => {
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
  }, [testStarted, currentTrialIndex, showFeedback])
  
  const handleTimeUp = () => {
    setLastAnswerCorrect(false)
    setShowFeedback(true)
    
    const newResults = [...results, { correct: false }]
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
      <Card className="w-full max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Flower2 className="h-6 w-6" />
            {t("sensory.olfactory.title")}
          </CardTitle>
          <p className="text-sm text-muted-foreground">{t("sensory.olfactory.description")}</p>
          <InstructionAudio instructionKey="sensory.olfactory.instruction" className="mt-2" />
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="bg-blue-50 dark:bg-blue-950 p-6 rounded-lg space-y-4">
            <h3 className="font-semibold">{t("sensory.olfactory.setup_title")}</h3>
            <ul className="space-y-2 text-sm">
              <li>• {t("sensory.olfactory.setup_1")}</li>
              <li>• {t("sensory.olfactory.setup_2")}</li>
              <li>• {t("sensory.olfactory.setup_3")}</li>
              <li>• {t("sensory.olfactory.setup_4")}</li>
            </ul>
          </div>

          <div className="bg-yellow-50 dark:bg-yellow-950 p-4 rounded-lg">
            <p className="text-sm">{t("sensory.olfactory.note")}</p>
          </div>

          <div className="flex flex-col sm:flex-row justify-center items-center gap-4 pt-4">
            <Button variant="outline" onClick={handleSkip} className="w-full sm:w-auto bg-transparent">
              {t("common.skip_task")}
            </Button>
            <Button onClick={handleStart} className="w-full sm:w-auto">
              {t("sensory.olfactory.start_test")}
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (testComplete) {
    return (
      <Card className="w-full max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle>{t("sensory.olfactory.complete_title")}</CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <div className="text-6xl">✓</div>
          <p className="text-lg">{t("sensory.olfactory.complete_message")}</p>
          <Button onClick={() => onComplete(0)} className="mt-4">
            {t("common.continue")}
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader className="pb-2">
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
      <CardContent className="space-y-6">
        {showFeedback && (
          <div
            className={`p-4 rounded-lg flex items-center justify-center gap-2 ${
              lastAnswerCorrect ? "bg-green-100 dark:bg-green-900" : "bg-red-100 dark:bg-red-900"
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
          <div className="flex items-center justify-center gap-2 text-red-600 animate-pulse">
            <AlertCircle className="h-4 w-4" />
            <span className="text-sm font-medium">
              {timeRemaining <= 5 ? "Hurry! Time almost up!" : "Running low on time!"}
            </span>
          </div>
        )}

        <div className="grid grid-cols-2 gap-6">
          {currentTrial.options.map((option) => (
            <button
              key={option.id}
              onClick={() => handleSelectOption(option)}
              disabled={showFeedback}
              className="flex flex-col items-center gap-4 p-6 rounded-lg border-2 border-gray-200 hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-950 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="relative w-32 h-32 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950 dark:to-purple-950 rounded-lg flex items-center justify-center">
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

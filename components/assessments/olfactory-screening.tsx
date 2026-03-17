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
    const correctCount = results.filter(r => r.correct).length
    const percentCorrect = Math.round((correctCount / results.length) * 100)
    const riskLevel = percentCorrect >= 83 ? "low" : percentCorrect >= 67 ? "moderate" : "high"
    
    // Age-based norms (based on UPSIT research)
    const ageNorms = [
      { range: "20-39", normal: "5-6/6", threshold: 83 },
      { range: "40-59", normal: "4-6/6", threshold: 67 },
      { range: "60-79", normal: "3-6/6", threshold: 50 },
      { range: "80+", normal: "3-5/6", threshold: 50 },
    ]
    
    return (
      <Card className="w-full max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Flower2 className="h-6 w-6" />
            {t("sensory.olfactory.complete_title")}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Score Display */}
          <div className="flex flex-col items-center py-6">
            <ScoreGauge score={percentCorrect} maxScore={100} size="lg" />
            <RiskBadge risk={getScoreRiskLevel(percentCorrect)} className="mt-4" />
          </div>
          
          {/* Results Summary */}
          <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
            <div className="grid grid-cols-2 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold text-green-600">{correctCount}/{results.length}</p>
                <p className="text-sm text-muted-foreground">Correct Answers</p>
              </div>
              <div>
                <p className="text-2xl font-bold">{percentCorrect}%</p>
                <p className="text-sm text-muted-foreground">Accuracy</p>
              </div>
            </div>
          </div>
          
          {/* Age-Based Norms */}
          <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg">
            <h4 className="font-semibold flex items-center gap-2 mb-3">
              <AlertCircle className="h-4 w-4 text-blue-600" />
              Age-Based Reference Ranges
            </h4>
            <p className="text-sm text-muted-foreground mb-3">
              Smell sensitivity naturally decreases with age. Compare your results:
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {ageNorms.map(norm => (
                <div key={norm.range} className="bg-white dark:bg-gray-800 p-2 rounded text-center text-sm">
                  <p className="font-medium">{norm.range} yrs</p>
                  <p className="text-muted-foreground">{norm.normal}</p>
                </div>
              ))}
            </div>
          </div>
          
          {/* Interpretation */}
          <div className={`p-4 rounded-lg ${
            riskLevel === "low" ? "bg-green-50 dark:bg-green-950 border border-green-200" :
            riskLevel === "moderate" ? "bg-yellow-50 dark:bg-yellow-950 border border-yellow-200" :
            "bg-red-50 dark:bg-red-950 border border-red-200"
          }`}>
            <p className="text-sm">
              {riskLevel === "low" 
                ? "Your smell identification ability appears to be within the normal range for most age groups."
                : riskLevel === "moderate"
                ? "Your results suggest some difficulty with smell identification. This may be normal for older adults, but consider discussing with your doctor."
                : "Your results indicate significant difficulty with smell identification. We recommend consulting a healthcare professional for further evaluation."}
            </p>
          </div>
          
          <Button onClick={() => onComplete(percentCorrect)} className="w-full mt-4">
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

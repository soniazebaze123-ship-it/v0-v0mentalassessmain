"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useUser } from "@/contexts/user-context"
import { supabase } from "@/lib/supabase"
import { useLanguage } from "@/contexts/language-context"
import { InstructionAudio } from "@/components/ui/instruction-audio"
import {
  LOG_MAR_LEVELS,
  generateRandomOrientations,
  calculateLogMARScore,
  getDeviceInfo,
} from "@/lib/visual-acuity-utils"
import { Eye, ArrowUp, ArrowDown, ArrowLeft, ArrowRight } from "lucide-react"
import { TestProgress } from "@/components/ui/test-progress"
import { ScoreGauge, getScoreRiskLevel } from "@/components/ui/score-gauge"
import { RiskBadge } from "@/components/ui/risk-badge"

interface VisualScreeningProps {
  onComplete: (score: number) => void
  onSkip?: () => void
}

export function VisualScreening({ onComplete, onSkip }: VisualScreeningProps) {
  const { t } = useLanguage()
  const { user } = useUser()

  const [currentLevel, setCurrentLevel] = useState(0)
  const [currentTrial, setCurrentTrial] = useState(0)
  const [results, setResults] = useState<{ level: number; correct: number; total: number }[]>([])
  const [levelResponses, setLevelResponses] = useState<boolean[]>([])
  const [testStarted, setTestStarted] = useState(false)
  const [testComplete, setTestComplete] = useState(false)
  const [viewingDistance, setViewingDistance] = useState<"near" | "far">("far")
  const [finalScore, setFinalScore] = useState(0)

  // Generate orientations for current level
  const [orientations] = useState(() => {
    const levels = LOG_MAR_LEVELS.map((level) => ({
      ...level,
      orientations: generateRandomOrientations(5),
    }))
    return levels
  })

  const currentLevelData = orientations[currentLevel]
  const currentOrientation = currentLevelData.orientations[currentTrial]

  const handleStart = () => {
    setTestStarted(true)
  }

  const handleResponse = (response: "up" | "down" | "left" | "right") => {
    const isCorrect = response === currentOrientation
    const newResponses = [...levelResponses, isCorrect]
    setLevelResponses(newResponses)

    // Move to next trial or level
    if (currentTrial < 4) {
      setCurrentTrial(currentTrial + 1)
    } else {
      // Level complete
      const correct = newResponses.filter((r) => r).length
      const newResults = [
        ...results,
        {
          level: currentLevelData.level,
          correct,
          total: 5,
        },
      ]
      setResults(newResults)
      setLevelResponses([])
      setCurrentTrial(0)

      // Check if we should continue or stop
      if (correct < 3 || currentLevel === LOG_MAR_LEVELS.length - 1) {
        // Test complete
        finishTest(newResults)
      } else {
        // Continue to next level
        setCurrentLevel(currentLevel + 1)
      }
    }
  }

  const finishTest = async (finalResults: { level: number; correct: number; total: number }[]) => {
    setTestComplete(true)

    const { finalLogMAR, classification, normalizedScore } = calculateLogMARScore(finalResults)

    const displayScore = Math.round(normalizedScore)
    setFinalScore(displayScore)

    // Save to database
    if (user) {
      try {
        console.log("[v0] Saving visual screening - normalized_score:", normalizedScore, "display score:", displayScore)
        await supabase.from("sensory_assessments").insert({
          user_id: user.id,
          test_type: "visual",
          raw_score: finalLogMAR,
          normalized_score: normalizedScore,
          classification: classification,
          test_data: {
            levels_completed: finalResults,
            viewing_distance: viewingDistance,
            total_trials: finalResults.reduce((sum, r) => sum + r.total, 0),
            total_correct: finalResults.reduce((sum, r) => sum + r.correct, 0),
          },
          device_info: getDeviceInfo(),
          environment_data: {
            test_type: "tumbling_e",
            self_administered: true,
          },
        })
        console.log("[v0] Visual screening saved successfully")
      } catch (error) {
        console.error("[v0] Error saving visual screening:", error)
      }
    }
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
            <Eye className="h-6 w-6" />
            {t("sensory.visual.title")}
          </CardTitle>
          <p className="text-sm text-muted-foreground">{t("sensory.visual.description")}</p>
          <InstructionAudio instructionKey="sensory.visual.instruction" className="mt-2" />
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="bg-blue-50 dark:bg-blue-950 p-6 rounded-lg space-y-4">
            <h3 className="font-semibold">{t("sensory.visual.setup_title")}</h3>
            <ul className="space-y-2 text-sm">
              <li>• {t("sensory.visual.setup_1")}</li>
              <li>• {t("sensory.visual.setup_2")}</li>
              <li>• {t("sensory.visual.setup_3")}</li>
              <li>• {t("sensory.visual.setup_4")}</li>
            </ul>
          </div>

          <div className="space-y-4">
            <label className="text-sm font-medium">{t("sensory.visual.viewing_distance")}</label>
            <div className="flex gap-4">
              <Button
                variant={viewingDistance === "far" ? "default" : "outline"}
                onClick={() => setViewingDistance("far")}
                className="flex-1"
              >
                {t("sensory.visual.distance_far")}
              </Button>
              <Button
                variant={viewingDistance === "near" ? "default" : "outline"}
                onClick={() => setViewingDistance("near")}
                className="flex-1"
              >
                {t("sensory.visual.distance_near")}
              </Button>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row justify-center items-center gap-4 pt-4">
            <Button variant="outline" onClick={handleSkip} className="w-full sm:w-auto bg-transparent">
              {t("common.skip_task")}
            </Button>
            <Button onClick={handleStart} className="w-full sm:w-auto">
              {t("sensory.visual.start_test")}
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
          <CardTitle>{t("sensory.visual.complete_title")}</CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <div className="text-6xl">✓</div>
          <p className="text-lg">{t("sensory.visual.complete_message")}</p>
          <Button onClick={() => onComplete(finalScore)} className="mt-4">
            {t("common.continue")}
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>
          {t("sensory.visual.level")} {currentLevelData.level} / {LOG_MAR_LEVELS.length}
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          {t("sensory.visual.trial")} {currentTrial + 1} / 5
        </p>
      </CardHeader>
      <CardContent className="space-y-8">
        {/* Display the "E" in the correct orientation */}
        <div className="flex items-center justify-center min-h-[400px] bg-gray-50 dark:bg-gray-900 rounded-lg">
          <div
            className="text-black dark:text-white font-bold flex items-center justify-center"
            style={{
              fontSize: `${currentLevelData.size}px`,
              transform:
                currentOrientation === "down"
                  ? "rotate(180deg)"
                  : currentOrientation === "left"
                    ? "rotate(90deg)"
                    : currentOrientation === "right"
                      ? "rotate(-90deg)"
                      : "none",
            }}
          >
            E
          </div>
        </div>

        {/* Response buttons */}
        <div className="space-y-4">
          <p className="text-center text-sm font-medium">{t("sensory.visual.which_direction")}</p>
          <div className="grid grid-cols-2 gap-4">
            <Button size="lg" onClick={() => handleResponse("up")} className="h-20">
              <ArrowUp className="h-8 w-8" />
            </Button>
            <Button size="lg" onClick={() => handleResponse("down")} className="h-20">
              <ArrowDown className="h-8 w-8" />
            </Button>
            <Button size="lg" onClick={() => handleResponse("left")} className="h-20">
              <ArrowLeft className="h-8 w-8" />
            </Button>
            <Button size="lg" onClick={() => handleResponse("right")} className="h-20">
              <ArrowRight className="h-8 w-8" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

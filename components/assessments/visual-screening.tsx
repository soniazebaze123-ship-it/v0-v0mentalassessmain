"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { useUser } from "@/contexts/user-context"
import { supabase } from "@/lib/supabase"
import { useLanguage } from "@/contexts/language-context"
import { InstructionAudio } from "@/components/ui/instruction-audio"
import {
  LOG_MAR_LEVELS,
  generateRandomDirection,
  calculateLogMARScore,
  getDeviceInfo,
  calculatePPIFromCreditCard,
  estimateScreenPPI,
  calculateOptotypeSize,
  getClassicOptotypeSize,
  logMARToSnellen,
  getVisualRiskLevel,
  CREDIT_CARD_WIDTH_MM,
  DEFAULT_VIEWING_DISTANCE_CM,
  type TumblingEDirection,
  type VisualCalibration,
} from "@/lib/visual-acuity-utils"
import { Eye, ArrowUp, ArrowDown, ArrowLeft, ArrowRight, CreditCard, Ruler, CheckCircle2, AlertCircle } from "lucide-react"
import { TestProgress } from "@/components/ui/test-progress"
import { ScoreGauge, getScoreRiskLevel } from "@/components/ui/score-gauge"
import { RiskBadge } from "@/components/ui/risk-badge"

interface VisualScreeningProps {
  onComplete: (score: number) => void
  onSkip?: () => void
  enhanced?: boolean
}

type Phase = "intro" | "calibration" | "distance" | "testing" | "results"

export function VisualScreening({ onComplete, onSkip, enhanced = false }: VisualScreeningProps) {
  const { t, language } = useLanguage()
  const { user } = useUser()

  // Phase management - enhanced starts with calibration, classic skips to testing
  const [phase, setPhase] = useState<Phase>(enhanced ? "intro" : "intro")
  
  // Calibration state
  const [calibration, setCalibration] = useState<VisualCalibration>({
    ppi: estimateScreenPPI(),
    viewingDistanceCm: DEFAULT_VIEWING_DISTANCE_CM,
    confirmed: false,
  })
  const [cardWidthPixels, setCardWidthPixels] = useState(300)
  
  // Test state
  const [currentLevel, setCurrentLevel] = useState(5) // Start at logMAR 0.5 (20/63)
  const [currentTrial, setCurrentTrial] = useState(0)
  const [totalTrials, setTotalTrials] = useState(0)
  const [correctCount, setCorrectCount] = useState(0)
  const [results, setResults] = useState<{ level: number; correct: number; total: number }[]>([])
  const [levelResponses, setLevelResponses] = useState<boolean[]>([])
  const [currentDirection, setCurrentDirection] = useState<TumblingEDirection>(generateRandomDirection())
  const [trialStartTime, setTrialStartTime] = useState<number>(Date.now())
  
  // Results state
  const [finalScore, setFinalScore] = useState(0)
  const [finalLogMAR, setFinalLogMAR] = useState(0)
  const [classification, setClassification] = useState<"normal" | "impaired" | "dysfunction">("normal")

  // Update PPI when card width changes
  useEffect(() => {
    const newPPI = calculatePPIFromCreditCard(cardWidthPixels)
    setCalibration(prev => ({ ...prev, ppi: newPPI }))
  }, [cardWidthPixels])

  // Calculate E size based on current level and calibration
  const currentLevelData = LOG_MAR_LEVELS[currentLevel] || LOG_MAR_LEVELS[5]
  const eSize = enhanced 
    ? calculateOptotypeSize(
        currentLevelData.logMAR,
        calibration.ppi,
        calibration.viewingDistanceCm
      )
    : getClassicOptotypeSize(currentLevelData.level)

  const handleConfirmCalibration = () => {
    setCalibration(prev => ({ ...prev, confirmed: true }))
    setPhase("distance")
  }

  const handleStartTest = () => {
    setPhase("testing")
    setCurrentDirection(generateRandomDirection())
    setTrialStartTime(Date.now())
  }

  const handleResponse = (response: TumblingEDirection) => {
    const reactionTime = Date.now() - trialStartTime
    const isCorrect = response === currentDirection
    const newResponses = [...levelResponses, isCorrect]
    setLevelResponses(newResponses)
    setTotalTrials(prev => prev + 1)
    if (isCorrect) setCorrectCount(prev => prev + 1)

    // Move to next trial or level
    if (currentTrial < 4) {
      setCurrentTrial(currentTrial + 1)
      setCurrentDirection(generateRandomDirection())
      setTrialStartTime(Date.now())
    } else {
      // Level complete - evaluate
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

      // Adaptive staircase logic
      const passed = correct >= 3
      
      if (passed && currentLevel < LOG_MAR_LEVELS.length - 1) {
        // Move to harder level (smaller letters)
        setCurrentLevel(currentLevel + 1)
        setCurrentDirection(generateRandomDirection())
        setTrialStartTime(Date.now())
      } else if (!passed && currentLevel > 0) {
        // Failed - might need to go back or finish
        // If this is second failure at a level or we've done enough trials, finish
        if (newResults.length >= 3 || totalTrials >= 20) {
          finishTest(newResults)
        } else {
          setCurrentLevel(currentLevel - 1)
          setCurrentDirection(generateRandomDirection())
          setTrialStartTime(Date.now())
        }
      } else {
        // Reached end of levels or max trials
        finishTest(newResults)
      }
    }
  }

  const finishTest = async (finalResults: { level: number; correct: number; total: number }[]) => {
    const { finalLogMAR: logMAR, classification: cls, normalizedScore } = calculateLogMARScore(finalResults)

    setFinalLogMAR(logMAR)
    setClassification(cls)
    setFinalScore(Math.round(normalizedScore))
    setPhase("results")

    // Save to database
    if (user) {
      try {
        await supabase.from("sensory_assessments").insert({
          user_id: user.id,
          test_type: "visual",
          raw_score: logMAR,
          normalized_score: normalizedScore,
          classification: cls,
          test_data: {
            levels_completed: finalResults,
            calibration: calibration,
            total_trials: totalTrials,
            total_correct: correctCount,
            snellen_equivalent: logMARToSnellen(logMAR),
          },
          device_info: getDeviceInfo(),
          environment_data: {
            test_type: "tumbling_e_adaptive",
            self_administered: true,
            calibrated: calibration.confirmed,
          },
        })
      } catch (error) {
        console.error("Error saving visual screening:", error)
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

  // Render rotation transform for E
  const getRotation = (direction: TumblingEDirection): string => {
    switch (direction) {
      case "right": return "rotate(0deg)"
      case "down": return "rotate(90deg)"
      case "left": return "rotate(180deg)"
      case "up": return "rotate(270deg)"
      default: return "rotate(0deg)"
    }
  }

  // ========== INTRO PHASE ==========
  if (phase === "intro") {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-3 rounded-full bg-blue-100 text-blue-600">
              <Eye className="h-8 w-8" />
            </div>
            <div>
              <CardTitle>
                {language === "zh" ? "视力检查" : "Visual Acuity Test"}
                {enhanced && <Badge className="ml-2 bg-blue-600">Enhanced</Badge>}
              </CardTitle>
              <CardDescription>
                {enhanced 
                  ? (language === "zh" ? "3-5分钟 · Tumbling-E自适应阶梯测试 (含校准)" : "3-5 min · Tumbling-E adaptive staircase test (with calibration)")
                  : (language === "zh" ? "2-3分钟 · 基础视力测试" : "2-3 min · Basic visual acuity test")}
              </CardDescription>
            </div>
          </div>
          <InstructionAudio instructionKey="sensory.visual.instruction" className="mt-2" />
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg space-y-3">
            <h4 className="font-medium">{language === "zh" ? "测试说明" : "About this test"}:</h4>
            <p className="text-sm text-muted-foreground">
              {enhanced 
                ? (language === "zh" 
                    ? "此测试通过显示不同大小的字母\"E\"来测量您的近视力敏锐度。包含屏幕校准和精确的logMAR评分。"
                    : "This test measures your near-vision sharpness by displaying letter \"E\" in different sizes. Includes screen calibration and precise logMAR scoring.")
                : (language === "zh" 
                    ? "此测试通过显示不同大小的字母\"E\"来快速评估您的视力。"
                    : "This test quickly assesses your visual acuity by displaying letter \"E\" in different sizes.")}
            </p>
          </div>

          {enhanced && (
            <div className="space-y-3">
              <h4 className="font-medium">{language === "zh" ? "测试步骤" : "Test steps"}:</h4>
              <ol className="list-decimal list-inside text-sm text-muted-foreground space-y-2">
                <li>{language === "zh" ? "校准屏幕：使用信用卡调整显示尺寸" : "Screen calibration: Adjust display size using a credit card"}</li>
                <li>{language === "zh" ? "设置距离：将设备保持在40厘米处" : "Set distance: Hold device at 40cm (arm's length)"}</li>
                <li>{language === "zh" ? "开始测试：选择字母\"E\"指向的方向" : "Start test: Select the direction the letter \"E\" is pointing"}</li>
              </ol>
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <Button variant="outline" onClick={handleSkip} className="flex-1">
              {language === "zh" ? "跳过" : "Skip"}
            </Button>
            <Button onClick={() => setPhase(enhanced ? "calibration" : "testing")} className="flex-1">
              {enhanced ? (language === "zh" ? "开始校准" : "Start Calibration") : (language === "zh" ? "开始测试" : "Start Test")}
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  // ========== CALIBRATION PHASE ==========
  if (phase === "calibration") {
    const cardWidthMM = (cardWidthPixels / calibration.ppi) * 25.4
    const cardHeightPixels = cardWidthPixels * (53.98 / 85.6)

    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader>
          <Badge variant="outline" className="w-fit mb-2">
            {language === "zh" ? "第1步：屏幕校准" : "Step 1: Screen Calibration"}
          </Badge>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            {language === "zh" ? "屏幕校准" : "Screen Calibration"}
          </CardTitle>
          <CardDescription>
            {language === "zh" 
              ? "将标准信用卡放在屏幕上，调整滑块使矩形与卡片完全匹配。"
              : "Place a standard credit card against the screen. Adjust the slider until the rectangle matches your card exactly."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Credit Card Outline */}
          <div className="flex justify-center py-4">
            <div 
              className="border-2 border-dashed border-blue-500 rounded-lg bg-blue-50/50 flex items-center justify-center"
              style={{ 
                width: `${cardWidthPixels}px`, 
                height: `${cardHeightPixels}px`,
              }}
            >
              <span className="text-blue-500 text-sm font-medium">
                {language === "zh" ? "信用卡轮廓" : "Credit Card Outline"}
              </span>
            </div>
          </div>

          {/* Slider */}
          <div className="space-y-4">
            <label className="text-sm font-medium">
              {language === "zh" ? "调整尺寸" : "Adjust Size"}
            </label>
            <Slider
              value={[cardWidthPixels]}
              onValueChange={(value) => setCardWidthPixels(value[0])}
              min={200}
              max={500}
              step={1}
              className="w-full"
            />
          </div>

          {/* PPI Display */}
          <div className="bg-muted p-4 rounded-lg text-center">
            <p className="text-sm text-muted-foreground">
              {language === "zh" ? "估算屏幕PPI" : "Estimated screen PPI"}: 
              <span className="font-bold text-foreground ml-2">{calibration.ppi}</span>
            </p>
          </div>

          <div className="flex gap-3">
            <Button variant="outline" onClick={() => setPhase("intro")} className="flex-1">
              <ArrowLeft className="h-4 w-4 mr-2" />
              {language === "zh" ? "返回" : "Back"}
            </Button>
            <Button onClick={handleConfirmCalibration} className="flex-1">
              {language === "zh" ? "确认校准" : "Confirm Calibration"}
              <CheckCircle2 className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  // ========== DISTANCE PHASE ==========
  if (phase === "distance") {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader>
          <Badge variant="outline" className="w-fit mb-2">
            {language === "zh" ? "第2步：设置距离" : "Step 2: Viewing Distance"}
          </Badge>
          <CardTitle className="flex items-center gap-2">
            <Ruler className="h-5 w-5" />
            {language === "zh" ? "设置观看距离" : "Viewing Distance"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 p-6 rounded-lg text-center space-y-4">
            <div className="text-5xl font-bold text-amber-600">40 cm</div>
            <p className="text-lg">
              {language === "zh" ? "约16英寸 / 一臂长度" : "~16 inches / arm's length"}
            </p>
          </div>

          <div className="space-y-3 text-sm text-muted-foreground">
            <p className="flex items-start gap-2">
              <AlertCircle className="h-4 w-4 mt-0.5 text-amber-500 flex-shrink-0" />
              {language === "zh" 
                ? "在整个测试过程中保持设备在此距离稳定不动。"
                : "Hold your device steady at this distance throughout the test."}
            </p>
            <p className="flex items-start gap-2">
              <AlertCircle className="h-4 w-4 mt-0.5 text-amber-500 flex-shrink-0" />
              {language === "zh" 
                ? "您将看到指向不同方向的字母\"E\"。点击与方向匹配的箭头。"
                : "You will see a letter \"E\" pointing in different directions. Tap the arrow matching the direction."}
            </p>
          </div>

          <div className="flex gap-3">
            <Button variant="outline" onClick={() => setPhase("calibration")} className="flex-1">
              <ArrowLeft className="h-4 w-4 mr-2" />
              {language === "zh" ? "返回" : "Back"}
            </Button>
            <Button onClick={handleStartTest} className="flex-1">
              {language === "zh" ? "我准备好了" : "I'm Ready"}
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  // ========== TESTING PHASE ==========
  if (phase === "testing") {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">
                {language === "zh" ? "视力测试" : "Visual Acuity Test"}
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                {language === "zh" ? "等级" : "Level"} {currentLevelData.level} · 
                {language === "zh" ? "试验" : "Trial"} {currentTrial + 1}/5
              </p>
            </div>
            <Badge variant="secondary">
              {logMARToSnellen(currentLevelData.logMAR)}
            </Badge>
          </div>
          <Progress value={(totalTrials / 25) * 100} className="mt-2" />
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Display the "E" */}
          <div className="flex items-center justify-center min-h-[300px] bg-white dark:bg-gray-900 rounded-lg border">
            <div
              style={{
                fontSize: `${eSize}px`,
                fontFamily: "Arial, sans-serif",
                fontWeight: "bold",
                transform: getRotation(currentDirection),
                lineHeight: 1,
              }}
            >
              E
            </div>
          </div>

          {/* Response buttons */}
          <div className="space-y-3">
            <p className="text-center text-sm font-medium">
              {language === "zh" ? "E指向哪个方向？" : "Which direction is the E pointing?"}
            </p>
            <div className="flex flex-col items-center gap-2">
              <Button
                size="lg"
                variant="outline"
                onClick={() => handleResponse("up")}
                className="w-20 h-16"
              >
                <ArrowUp className="h-8 w-8" />
              </Button>
              <div className="flex gap-2">
                <Button
                  size="lg"
                  variant="outline"
                  onClick={() => handleResponse("left")}
                  className="w-20 h-16"
                >
                  <ArrowLeft className="h-8 w-8" />
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  onClick={() => handleResponse("right")}
                  className="w-20 h-16"
                >
                  <ArrowRight className="h-8 w-8" />
                </Button>
              </div>
              <Button
                size="lg"
                variant="outline"
                onClick={() => handleResponse("down")}
                className="w-20 h-16"
              >
                <ArrowDown className="h-8 w-8" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  // ========== RESULTS PHASE ==========
  if (phase === "results") {
    const riskLevel = getVisualRiskLevel(finalLogMAR)
    const snellen = logMARToSnellen(finalLogMAR)

    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle2 className="h-6 w-6 text-green-500" />
            {language === "zh" ? "测试完成" : "Test Complete"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-muted p-4 rounded-lg text-center">
              <p className="text-sm text-muted-foreground mb-1">
                {language === "zh" ? "视力" : "Visual Acuity"}
              </p>
              <p className="text-3xl font-bold">{snellen}</p>
            </div>
            <div className="bg-muted p-4 rounded-lg text-center">
              <p className="text-sm text-muted-foreground mb-1">LogMAR</p>
              <p className="text-3xl font-bold">{finalLogMAR.toFixed(2)}</p>
            </div>
          </div>

          <div className="bg-muted p-4 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">
                {language === "zh" ? "分类" : "Classification"}
              </span>
              <RiskBadge level={riskLevel} />
            </div>
            <p className="font-medium">
              {classification === "normal" 
                ? (language === "zh" ? "正常视力" : "Normal Vision")
                : classification === "impaired"
                  ? (language === "zh" ? "轻度受损" : "Mildly Impaired")
                  : (language === "zh" ? "需要进一步检查" : "Further Evaluation Needed")}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="bg-muted/50 p-3 rounded">
              <p className="text-muted-foreground">{language === "zh" ? "总试验" : "Total Trials"}</p>
              <p className="font-medium">{totalTrials}</p>
            </div>
            <div className="bg-muted/50 p-3 rounded">
              <p className="text-muted-foreground">{language === "zh" ? "正确率" : "Accuracy"}</p>
              <p className="font-medium">{totalTrials > 0 ? Math.round((correctCount / totalTrials) * 100) : 0}%</p>
            </div>
          </div>

          <Button onClick={() => onComplete(finalScore)} className="w-full">
            {language === "zh" ? "继续" : "Continue"}
          </Button>
        </CardContent>
      </Card>
    )
  }

  return null
}

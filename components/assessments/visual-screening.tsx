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
import { Eye, ArrowUp, ArrowDown, ArrowLeft, ArrowRight, ChevronUp, ChevronDown, ChevronLeft, ChevronRight, CreditCard, Ruler, CheckCircle2, AlertCircle } from "lucide-react"
import { TestProgress } from "@/components/ui/test-progress"
import { ScoreGauge, getScoreRiskLevel } from "@/components/ui/score-gauge"
import { RiskBadge } from "@/components/ui/risk-badge"

interface VisualScreeningProps {
  onComplete: (score: number) => void
  onSkip?: () => void
  enhanced?: boolean
}

type Phase = "intro" | "calibration" | "distance" | "practice" | "testing" | "results"

export function VisualScreening({ onComplete, onSkip, enhanced = false }: VisualScreeningProps) {
  const { t, language, localizeText } = useLanguage()
  const { user } = useUser()
  const uiText = (englishText: string, chineseText: string) => localizeText(englishText, { zh: chineseText })

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
  
  // Practice state
  const [practiceDirection, setPracticeDirection] = useState<TumblingEDirection>(generateRandomDirection())
  const [practiceAttempts, setPracticeAttempts] = useState(0)
  const [practiceCorrect, setPracticeCorrect] = useState(false)

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
                {uiText("Visual Acuity Test", "视力检查")}
                {enhanced && <Badge className="ml-2 bg-blue-600">Enhanced</Badge>}
              </CardTitle>
              <CardDescription>
                {enhanced 
                  ? uiText("3-5 min · Tumbling-E adaptive staircase test (with calibration)", "3-5分钟 · Tumbling-E自适应阶梯测试 (含校准)")
                  : uiText("2-3 min · Basic visual acuity test", "2-3分钟 · 基础视力测试")}
              </CardDescription>
            </div>
          </div>
          <InstructionAudio instructionKey="sensory.visual.instruction" className="mt-2" />
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg space-y-3">
            <h4 className="font-medium">{uiText("About this test", "测试说明")}:</h4>
            <p className="text-sm text-muted-foreground">
              {enhanced 
              ? uiText("This test measures your near-vision sharpness by displaying letter \"E\" in different sizes. Includes screen calibration and precise logMAR scoring.", "此测试通过显示不同大小的字母\"E\"来测量您的近视力敏锐度。包含屏幕校准和精确的logMAR评分。")
              : uiText("This test quickly assesses your visual acuity by displaying letter \"E\" in different sizes.", "此测试通过显示不同大小的字母\"E\"来快速评估您的视力。")}
            </p>
          </div>

          {enhanced && (
            <div className="space-y-3">
              <h4 className="font-medium">{uiText("Test steps", "测试步骤")}:</h4>
              <ol className="list-decimal list-inside text-sm text-muted-foreground space-y-2">
                <li>{uiText("Screen calibration: Adjust display size using a credit card", "校准屏幕：使用信用卡调整显示尺寸")}</li>
                <li>{uiText("Set distance: Hold device at 40cm (arm's length)", "设置距离：将设备保持在40厘米处")}</li>
                <li>{uiText("Start test: Select the direction the letter \"E\" is pointing", "开始测试：选择字母\"E\"指向的方向")}</li>
              </ol>
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <Button variant="outline" onClick={handleSkip} className="flex-1">
              {uiText("Skip", "跳过")}
            </Button>
            <Button onClick={() => setPhase(enhanced ? "calibration" : "practice")} className="flex-1">
              {enhanced ? uiText("Start Calibration", "开始校准") : uiText("Start Practice", "开始练习")}
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
            {uiText("Step 1: Screen Calibration", "第1步：屏幕校准")}
          </Badge>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            {uiText("Screen Calibration", "屏幕校准")}
          </CardTitle>
          <CardDescription>
            {uiText("Place a standard credit card against the screen. Adjust the slider until the rectangle matches your card exactly.", "将标准信用卡放在屏幕上，调整滑块使矩形与卡片完全匹配。")}
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
                {uiText("Credit Card Outline", "信用卡轮廓")}
              </span>
            </div>
          </div>

          {/* Slider */}
          <div className="space-y-4">
            <label className="text-sm font-medium">
              {uiText("Adjust Size", "调整尺寸")}
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
              {uiText("Estimated screen PPI", "估算屏幕PPI")}: 
              <span className="font-bold text-foreground ml-2">{calibration.ppi}</span>
            </p>
          </div>

          <div className="flex gap-3">
            <Button variant="outline" onClick={() => setPhase("intro")} className="flex-1">
              <ArrowLeft className="h-4 w-4 mr-2" />
              {uiText("Back", "返回")}
            </Button>
            <Button onClick={handleConfirmCalibration} className="flex-1">
              {uiText("Confirm Calibration", "确认校准")}
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
            {uiText("Step 2: Viewing Distance", "第2步：设置距离")}
          </Badge>
          <CardTitle className="flex items-center gap-2">
            <Ruler className="h-5 w-5" />
            {uiText("Viewing Distance", "设置观看距离")}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 p-6 rounded-lg text-center space-y-4">
            <div className="text-5xl font-bold text-amber-600">40 cm</div>
            <p className="text-lg">
              {uiText("~16 inches / arm's length", "约16英寸 / 一臂长度")}
            </p>
          </div>

          <div className="space-y-3 text-sm text-muted-foreground">
            <p className="flex items-start gap-2">
              <AlertCircle className="h-4 w-4 mt-0.5 text-amber-500 flex-shrink-0" />
              {uiText("Hold your device steady at this distance throughout the test.", "在整个测试过程中保持设备在此距离稳定不动。")}
            </p>
            <p className="flex items-start gap-2">
              <AlertCircle className="h-4 w-4 mt-0.5 text-amber-500 flex-shrink-0" />
              {uiText("You will see a letter \"E\" pointing in different directions. Tap the arrow matching the direction.", "您将看到指向不同方向的字母\"E\"。点击与方向匹配的箭头。")}
            </p>
          </div>

          <div className="flex gap-3">
            <Button variant="outline" onClick={() => setPhase("calibration")} className="flex-1">
              <ArrowLeft className="h-4 w-4 mr-2" />
              {uiText("Back", "返回")}
            </Button>
            <Button onClick={() => setPhase("practice")} className="flex-1">
              {uiText("Start Practice", "开始练习")}
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  // ========== PRACTICE PHASE ==========
  if (phase === "practice") {
    const handlePracticeResponse = (response: TumblingEDirection) => {
      if (response === practiceDirection) {
        setPracticeCorrect(true)
        setTimeout(() => {
          setPhase("testing")
          handleStartTest()
        }, 1500)
      } else {
        setPracticeAttempts(prev => prev + 1)
        setPracticeDirection(generateRandomDirection())
      }
    }

    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">
                {uiText("Practice Round", "练习回合")}
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                {uiText("Get familiar with the controls", "先熟悉一下操作")}
              </p>
            </div>
            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
              {uiText("Practice", "练习")}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-6 bg-slate-50 dark:bg-slate-900 -mx-6 -mb-6 px-6 pb-6 pt-4">
          {practiceCorrect ? (
            <div className="flex flex-col items-center justify-center py-8 space-y-4">
              <div className="p-4 rounded-full bg-green-100 text-green-600">
                <CheckCircle2 className="h-12 w-12" />
              </div>
              <p className="text-lg font-medium text-green-700">
                {uiText("Great! Starting the test...", "太棒了！开始正式测试...")}
              </p>
            </div>
          ) : (
            <>
              {/* Practice E display */}
              <div className="flex items-center justify-center">
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-8 min-w-[200px] min-h-[200px] flex items-center justify-center">
                  <span
                    style={{
                      fontSize: "120px",
                      fontFamily: "'Arial Black', 'Helvetica Neue', Arial, sans-serif",
                      fontWeight: 900,
                      transform: getRotation(practiceDirection),
                      display: "inline-block",
                      lineHeight: 1,
                      color: "#1a1a2e",
                    }}
                  >
                    E
                  </span>
                </div>
              </div>

              {/* Instruction text */}
              <p className="text-center text-base font-medium text-muted-foreground">
                {uiText("Which direction is the E pointing?", "E指向哪个方向？")}
              </p>

              {practiceAttempts > 0 && (
                <p className="text-center text-sm text-amber-600">
                  {uiText("Try again! Tap the direction the E is pointing.", "再试一次！点击E指向的方向。")}
                </p>
              )}

              {/* Response buttons */}
              <div className="flex flex-col items-center gap-3">
                <Button
                  size="lg"
                  variant="outline"
                  onClick={() => handlePracticeResponse("up")}
                  className="w-20 h-14 rounded-xl bg-white hover:bg-gray-50 border-gray-200 shadow-sm"
                >
                  <ChevronUp className="h-6 w-6" />
                </Button>
                <div className="flex gap-3">
                  <Button
                    size="lg"
                    variant="outline"
                    onClick={() => handlePracticeResponse("left")}
                    className="w-20 h-14 rounded-xl bg-white hover:bg-gray-50 border-gray-200 shadow-sm"
                  >
                    <ChevronLeft className="h-6 w-6" />
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    onClick={() => handlePracticeResponse("right")}
                    className="w-20 h-14 rounded-xl bg-white hover:bg-gray-50 border-gray-200 shadow-sm"
                  >
                    <ChevronRight className="h-6 w-6" />
                  </Button>
                </div>
                <Button
                  size="lg"
                  variant="outline"
                  onClick={() => handlePracticeResponse("down")}
                  className="w-20 h-14 rounded-xl bg-white hover:bg-gray-50 border-gray-200 shadow-sm"
                >
                  <ChevronDown className="h-6 w-6" />
                </Button>
              </div>

              {/* Skip practice button */}
              <div className="text-center pt-2">
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => {
                    setPhase("testing")
                    handleStartTest()
                  }}
                  className="text-muted-foreground"
                >
                  {uiText("Skip practice", "跳过练习")}
                </Button>
              </div>
            </>
          )}
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
                {uiText("Visual Acuity Test", "视力测试")}
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                {uiText("Level", "等级")} {currentLevelData.level} · 
                {uiText("Trial", "试验")} {currentTrial + 1}/5
              </p>
            </div>
            <Badge variant="secondary">
              {logMARToSnellen(currentLevelData.logMAR)}
            </Badge>
          </div>
          <Progress value={(totalTrials / 25) * 100} className="mt-2" />
        </CardHeader>
        <CardContent className="space-y-6 bg-slate-50 dark:bg-slate-900 -mx-6 -mb-6 px-6 pb-6 pt-4">
          {/* Display the "E" in a white card */}
          <div className="flex items-center justify-center">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-8 min-w-[200px] min-h-[200px] flex items-center justify-center">
              <span
                style={{
                  fontSize: `${Math.max(eSize, 80)}px`,
                  fontFamily: "'Arial Black', 'Helvetica Neue', Arial, sans-serif",
                  fontWeight: 900,
                  transform: getRotation(currentDirection),
                  display: "inline-block",
                  lineHeight: 1,
                  color: "#1a1a2e",
                }}
              >
                E
              </span>
            </div>
          </div>

          {/* Question text */}
          <p className="text-center text-base font-medium text-muted-foreground">
            {uiText("Which direction is the E pointing?", "E指向哪个方向？")}
          </p>

          {/* Response buttons - cross pattern */}
          <div className="flex flex-col items-center gap-3">
            <Button
              size="lg"
              variant="outline"
              onClick={() => handleResponse("up")}
              className="w-20 h-14 rounded-xl bg-white hover:bg-gray-50 border-gray-200 shadow-sm"
            >
              <ChevronUp className="h-6 w-6" />
            </Button>
            <div className="flex gap-3">
              <Button
                size="lg"
                variant="outline"
                onClick={() => handleResponse("left")}
                className="w-20 h-14 rounded-xl bg-white hover:bg-gray-50 border-gray-200 shadow-sm"
              >
                <ChevronLeft className="h-6 w-6" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={() => handleResponse("right")}
                className="w-20 h-14 rounded-xl bg-white hover:bg-gray-50 border-gray-200 shadow-sm"
              >
                <ChevronRight className="h-6 w-6" />
              </Button>
            </div>
            <Button
              size="lg"
              variant="outline"
              onClick={() => handleResponse("down")}
              className="w-20 h-14 rounded-xl bg-white hover:bg-gray-50 border-gray-200 shadow-sm"
            >
              <ChevronDown className="h-6 w-6" />
            </Button>
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
            {uiText("Test Complete", "测试完成")}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-muted p-4 rounded-lg text-center">
              <p className="text-sm text-muted-foreground mb-1">
                {uiText("Visual Acuity", "视力")}
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
                {uiText("Classification", "分类")}
              </span>
              <RiskBadge level={riskLevel} />
            </div>
            <p className="font-medium">
              {classification === "normal" 
                ? uiText("Normal Vision", "正常视力")
                : classification === "impaired"
                  ? uiText("Mildly Impaired", "轻度受损")
                  : uiText("Further Evaluation Needed", "需要进一步检查")}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="bg-muted/50 p-3 rounded">
              <p className="text-muted-foreground">{uiText("Total Trials", "总试验")}</p>
              <p className="font-medium">{totalTrials}</p>
            </div>
            <div className="bg-muted/50 p-3 rounded">
              <p className="text-muted-foreground">{uiText("Accuracy", "正确率")}</p>
              <p className="font-medium">{totalTrials > 0 ? Math.round((correctCount / totalTrials) * 100) : 0}%</p>
            </div>
          </div>

          <Button onClick={() => onComplete(finalScore)} className="w-full">
            {uiText("Continue", "继续")}
          </Button>
        </CardContent>
      </Card>
    )
  }

  return null
}

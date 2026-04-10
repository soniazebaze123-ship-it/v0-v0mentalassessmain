"use client"

import { useEffect, useRef, useState } from "react"
import { ArrowLeft, ArrowRight, CheckCircle2, ChevronDown, ChevronLeft, ChevronRight, ChevronUp, CreditCard, Eye, Ruler, Sparkles } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { InstructionAudio } from "@/components/ui/instruction-audio"
import { useLanguage } from "@/contexts/language-context"
import { useUser } from "@/contexts/user-context"
import { supabase } from "@/lib/supabase"
import {
  calculateLogMARScore,
  calculateOptotypeSize,
  calculatePPIFromCreditCard,
  CREDIT_CARD_WIDTH_MM,
  DEFAULT_VIEWING_DISTANCE_CM,
  estimateScreenPPI,
  getClassicOptotypeSize,
  getDeviceInfo,
  getVisualRiskLevel,
  LOG_MAR_LEVELS,
  logMARToSnellen,
  type TumblingEDirection,
  type VisualCalibration,
} from "@/lib/visual-acuity-utils"

interface VisualScreeningProps {
  onComplete: (score: number) => void
  onSkip?: () => void
  enhanced?: boolean
}

type VisualPhase = "intro" | "calibration" | "distance" | "practice" | "testing" | "results"

type LevelResult = {
  level: number
  correct: number
  total: number
}

const TEST_LEVELS = LOG_MAR_LEVELS.slice(5, 10)

function randomDirection(): TumblingEDirection {
  const directions: TumblingEDirection[] = ["up", "down", "left", "right"]
  return directions[Math.floor(Math.random() * directions.length)]
}

function getRotation(direction: TumblingEDirection): string {
  switch (direction) {
    case "right":
      return "rotate(0deg)"
    case "down":
      return "rotate(90deg)"
    case "left":
      return "rotate(180deg)"
    case "up":
      return "rotate(270deg)"
    default:
      return "rotate(0deg)"
  }
}

export function VisualScreening({ onComplete, onSkip, enhanced = false }: VisualScreeningProps) {
  const { t, localizeText } = useLanguage()
  const { user } = useUser()
  const uiText = (englishText: string, chineseText: string, cantoneseText?: string, frenchText?: string) =>
    localizeText(englishText, {
      zh: chineseText,
      yue: cantoneseText ?? chineseText,
      fr: frenchText,
    })

  const [phase, setPhase] = useState<VisualPhase>("intro")
  const [calibration, setCalibration] = useState<VisualCalibration>({
    ppi: estimateScreenPPI(),
    viewingDistanceCm: DEFAULT_VIEWING_DISTANCE_CM,
    confirmed: false,
  })
  const [cardWidthPixels, setCardWidthPixels] = useState(320)
  const [practiceDirection, setPracticeDirection] = useState<TumblingEDirection>(randomDirection())
  const [practiceAttempts, setPracticeAttempts] = useState(0)
  const [practiceCorrect, setPracticeCorrect] = useState(false)
  const [levelIndex, setLevelIndex] = useState(0)
  const [trialIndex, setTrialIndex] = useState(0)
  const [currentDirection, setCurrentDirection] = useState<TumblingEDirection>(randomDirection())
  const [levelCorrect, setLevelCorrect] = useState(0)
  const [results, setResults] = useState<LevelResult[]>([])
  const [finalLogMAR, setFinalLogMAR] = useState(0.5)
  const [finalScore, setFinalScore] = useState(0)
  const [classification, setClassification] = useState<"normal" | "impaired" | "dysfunction">("normal")
  const trialStartRef = useRef<number>(0)

  const currentLevel = TEST_LEVELS[Math.min(levelIndex, TEST_LEVELS.length - 1)]
  const totalTrialsCompleted = results.reduce((sum, result) => sum + result.total, 0) + trialIndex
  const totalTrialCount = TEST_LEVELS.length * 5
  const eSize = enhanced
    ? calculateOptotypeSize(currentLevel.logMAR, calibration.ppi, calibration.viewingDistanceCm)
    : getClassicOptotypeSize(currentLevel.level)

  useEffect(() => {
    trialStartRef.current = performance.now()
  }, [levelIndex, trialIndex, currentDirection])

  const premiumShell =
    "mx-auto w-full max-w-4xl overflow-hidden border border-white/70 bg-[radial-gradient(circle_at_top_left,_rgba(56,189,248,0.16),_transparent_28%),linear-gradient(135deg,_rgba(255,255,255,0.96),_rgba(247,250,255,0.98),_rgba(240,249,255,0.95))] shadow-[0_28px_90px_rgba(15,23,42,0.10)]"
  const premiumHeader = "border-b border-white/70 bg-white/80 pb-6"
  const primaryButton =
    "h-12 rounded-full bg-gradient-to-r from-sky-600 via-cyan-500 to-teal-500 px-6 text-white shadow-lg shadow-sky-500/25 hover:from-sky-700 hover:via-cyan-600 hover:to-teal-600"

  const handleSkip = () => {
    if (onSkip) {
      onSkip()
      return
    }

    onComplete(0)
  }

  const handleConfirmCalibration = () => {
    setCalibration((current) => ({
      ...current,
      ppi: calculatePPIFromCreditCard(cardWidthPixels),
      confirmed: true,
    }))
    setPhase("distance")
  }

  const startTesting = () => {
    setResults([])
    setLevelIndex(0)
    setTrialIndex(0)
    setLevelCorrect(0)
    setCurrentDirection(randomDirection())
    setPhase("testing")
  }

  const finalizeTest = async (nextResults: LevelResult[]) => {
    const scoreSummary = calculateLogMARScore(nextResults)
    const normalizedScore = scoreSummary.normalizedScore

    setFinalLogMAR(scoreSummary.finalLogMAR)
    setClassification(scoreSummary.classification)
    setFinalScore(normalizedScore)
    setPhase("results")

    if (user) {
      try {
        await supabase.from("sensory_assessments").insert({
          user_id: user.id,
          test_type: "visual",
          raw_score: scoreSummary.finalLogMAR,
          normalized_score: normalizedScore,
          classification: scoreSummary.classification,
          test_data: {
            levels: nextResults,
            snellen: logMARToSnellen(scoreSummary.finalLogMAR),
            viewing_distance_cm: calibration.viewingDistanceCm,
            calibrated: calibration.confirmed,
            ppi: calibration.ppi,
          },
          device_info: getDeviceInfo(),
          environment_data: {
            enhanced,
            viewing_distance_cm: calibration.viewingDistanceCm,
          },
        })
      } catch (error) {
        console.error("[v0] Error saving visual screening:", error)
      }
    }
  }

  const handleResponse = async (response: TumblingEDirection) => {
    const isCorrect = response === currentDirection
    const nextLevelCorrect = levelCorrect + (isCorrect ? 1 : 0)
    const nextTrialIndex = trialIndex + 1

    if (nextTrialIndex < 5) {
      setLevelCorrect(nextLevelCorrect)
      setTrialIndex(nextTrialIndex)
      setCurrentDirection(randomDirection())
      return
    }

    const completedLevel: LevelResult = {
      level: currentLevel.level,
      correct: nextLevelCorrect,
      total: 5,
    }
    const nextResults = [...results, completedLevel]
    setResults(nextResults)

    if (levelIndex < TEST_LEVELS.length - 1) {
      setLevelIndex(levelIndex + 1)
      setTrialIndex(0)
      setLevelCorrect(0)
      setCurrentDirection(randomDirection())
      return
    }

    await finalizeTest(nextResults)
  }

  if (phase === "intro") {
    return (
      <Card className={premiumShell}>
        <CardHeader className={premiumHeader}>
          <div className="mb-4 flex items-start gap-4">
            <div className="rounded-3xl bg-sky-100 p-3 text-sky-700 shadow-inner shadow-sky-200/70">
              <Eye className="h-7 w-7" />
            </div>
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <Badge className="rounded-full border-0 bg-slate-900 px-3 py-1 text-[11px] uppercase tracking-[0.24em] text-white">
                  {uiText("Sensory Screening", "感觉筛查", "感覺篩查", "Dépistage sensoriel")}
                </Badge>
                {enhanced && (
                  <Badge className="rounded-full border-0 bg-sky-600 px-3 py-1 text-white">
                    {uiText("Enhanced", "增强模式", "增強模式", "Amélioré")}
                  </Badge>
                )}
              </div>
              <CardTitle className="text-3xl text-slate-950">{t("sensory.visual.title")}</CardTitle>
              <CardDescription className="max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">
                {t("sensory.visual.description")}
              </CardDescription>
            </div>
          </div>
          <InstructionAudio instructionKey="sensory.visual.instruction" className="mt-2" />
        </CardHeader>
        <CardContent className="space-y-6 bg-white/75 p-6 sm:p-8">
          <div className="grid gap-4 sm:grid-cols-[1.3fr_0.9fr]">
            <div className="rounded-[28px] border border-sky-100 bg-gradient-to-br from-sky-50 via-cyan-50 to-white p-5 shadow-sm">
              <h4 className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-sky-700">
                {uiText("About this test", "测试说明", "測試說明", "À propos du test")}
              </h4>
              <p className="text-sm leading-6 text-slate-600">
                {enhanced
                  ? uiText(
                      "This premium flow calibrates your screen, confirms viewing distance, and then measures acuity with a structured tumbling-E test.",
                      "此高级流程会先校准屏幕、确认观看距离，然后通过结构化的翻转E测试测量视力。",
                      "此高級流程會先校準屏幕、確認觀看距離，然後透過結構化翻轉E測試量度視力。",
                      "Ce parcours premium calibre l’écran, confirme la distance de vision puis mesure l’acuité avec un test structuré du E directionnel.",
                    )
                  : uiText(
                      "This screening checks how accurately you can identify the direction of the letter E at different sizes.",
                      "此筛查通过不同大小的字母E，检查您辨认方向的准确程度。",
                      "此篩查會透過唔同大小嘅字母E，檢查你辨認方向嘅準確程度。",
                      "Ce dépistage vérifie avec quelle précision vous identifiez la direction de la lettre E à différentes tailles.",
                    )}
              </p>
            </div>

            <div className="rounded-[28px] border border-slate-200/70 bg-slate-950 p-5 text-white shadow-sm">
              <p className="text-xs uppercase tracking-[0.22em] text-sky-200">
                {uiText("What you need", "准备事项", "準備事項", "Préparation")}
              </p>
              <ul className="mt-3 space-y-3 text-sm leading-6 text-slate-200">
                <li>{t("sensory.visual.setup_1")}</li>
                <li>{t("sensory.visual.setup_2")}</li>
                <li>{t("sensory.visual.setup_3")}</li>
              </ul>
            </div>
          </div>

          <div className="rounded-[28px] border border-slate-200/70 bg-white/90 p-5 shadow-sm">
            <h4 className="mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
              <Sparkles className="h-4 w-4 text-sky-600" />
              {uiText("Test steps", "测试步骤", "測試步驟", "Étapes")}
            </h4>
            <ol className="grid gap-3 text-sm text-slate-600 sm:grid-cols-3">
              <li className="rounded-2xl bg-slate-50 p-4">
                {enhanced
                  ? uiText("Calibrate the display with a standard card.", "使用标准卡片校准屏幕。", "用標準卡校準屏幕。", "Calibrez l’écran avec une carte standard.")
                  : uiText("Review the display and prepare your position.", "检查显示并准备好测试姿势。", "檢查顯示並準備測試姿勢。", "Vérifiez l’affichage et préparez votre position.")}
              </li>
              <li className="rounded-2xl bg-slate-50 p-4">
                {uiText("Practice with one orientation round.", "先完成一轮方向练习。", "先完成一輪方向練習。", "Commencez par un court tour d’entraînement.")}
              </li>
              <li className="rounded-2xl bg-slate-50 p-4">
                {uiText("Complete each E-direction response as sizes become smaller.", "随着字母逐渐变小，完成每一次方向判断。", "隨住字母逐漸變細，完成每次方向判斷。", "Répondez à chaque orientation du E à mesure que la taille diminue.")}
              </li>
            </ol>
          </div>

          <div className="flex gap-3 pt-2">
            <Button variant="outline" onClick={handleSkip} className="h-12 flex-1 rounded-full border-slate-300 bg-white text-slate-700 hover:bg-slate-50">
              {t("common.skip_task")}
            </Button>
            <Button onClick={() => setPhase(enhanced ? "calibration" : "practice")} className={primaryButton + " flex-1"}>
              {enhanced ? uiText("Start calibration", "开始校准", "開始校準", "Commencer l’étalonnage") : uiText("Start practice", "开始练习", "開始練習", "Commencer l’entraînement")}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (phase === "calibration") {
    const cardWidthMm = (cardWidthPixels / calibration.ppi) * 25.4
    const cardHeightPixels = cardWidthPixels * (53.98 / 85.6)

    return (
      <Card className={premiumShell}>
        <CardHeader className={premiumHeader}>
          <Badge variant="outline" className="mb-3 w-fit rounded-full border-sky-200 bg-sky-50 px-3 py-1 text-sky-700">
            {uiText("Step 1: Screen calibration", "第1步：屏幕校准", "第1步：屏幕校準", "Étape 1 : étalonnage")}
          </Badge>
          <CardTitle className="flex items-center gap-3 text-2xl text-slate-950">
            <div className="rounded-2xl bg-sky-100 p-2 text-sky-700">
              <CreditCard className="h-5 w-5" />
            </div>
            {uiText("Screen calibration", "屏幕校准", "屏幕校準", "Étalonnage de l’écran")}
          </CardTitle>
          <CardDescription className="max-w-2xl text-sm leading-6 text-slate-600">
            {uiText(
              "Place a standard credit card on the screen and match the outline to the card width.",
              "请将标准信用卡贴在屏幕上，并将轮廓调整到与卡片宽度一致。",
              "請將標準信用卡貼喺屏幕上，並將輪廓調整至同卡嘅闊度一致。",
              "Placez une carte standard sur l’écran et ajustez le contour à sa largeur réelle.",
            )}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 bg-white/75 p-6 sm:p-8">
          <div className="grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
            <div className="rounded-[32px] border border-sky-100 bg-gradient-to-br from-sky-50 via-cyan-50 to-white p-6">
              <div className="flex justify-center py-4">
                <div
                  className="flex items-center justify-center rounded-2xl border-2 border-dashed border-sky-500 bg-white/70"
                  style={{ width: `${cardWidthPixels}px`, height: `${cardHeightPixels}px` }}
                >
                  <span className="text-sm font-medium text-sky-600">{uiText("Card outline", "卡片轮廓", "卡片輪廓", "Contour")}</span>
                </div>
              </div>

              <div className="space-y-4">
                <label className="text-sm font-medium text-slate-700">{uiText("Adjust size", "调整尺寸", "調整尺寸", "Ajuster la taille")}</label>
                <input
                  type="range"
                  min="200"
                  max="500"
                  value={cardWidthPixels}
                  onChange={(event) => setCardWidthPixels(Number.parseInt(event.target.value))}
                  className="w-full"
                />
              </div>
            </div>

            <div className="rounded-[28px] border border-slate-200/70 bg-white/90 p-5 shadow-sm">
              <p className="text-xs uppercase tracking-[0.22em] text-slate-500">{uiText("Calibration status", "校准状态", "校準狀態", "État")}</p>
              <div className="mt-4 rounded-2xl bg-slate-950 p-5 text-white">
                <p className="text-sm text-slate-300">{uiText("Estimated PPI", "估算PPI", "估算PPI", "PPP estimés")}</p>
                <p className="mt-2 text-4xl font-semibold">{calculatePPIFromCreditCard(cardWidthPixels)}</p>
              </div>
              <div className="mt-4 rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">
                <p>
                  {uiText("Measured width", "测量宽度", "量度闊度", "Largeur mesurée")}: <span className="font-semibold text-slate-900">{cardWidthMm.toFixed(1)} mm</span>
                </p>
                <p className="mt-2">
                  {uiText("Target width", "标准宽度", "標準闊度", "Largeur cible")}: <span className="font-semibold text-slate-900">{CREDIT_CARD_WIDTH_MM} mm</span>
                </p>
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <Button variant="outline" onClick={() => setPhase("intro")} className="h-12 flex-1 rounded-full border-slate-300 bg-white text-slate-700 hover:bg-slate-50">
              <ArrowLeft className="mr-2 h-4 w-4" />
              {uiText("Back", "返回", "返回", "Retour")}
            </Button>
            <Button onClick={handleConfirmCalibration} className={primaryButton + " flex-1"}>
              {uiText("Confirm calibration", "确认校准", "確認校準", "Confirmer")}
              <CheckCircle2 className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (phase === "distance") {
    return (
      <Card className={premiumShell}>
        <CardHeader className={premiumHeader}>
          <Badge variant="outline" className="mb-3 w-fit rounded-full border-amber-200 bg-amber-50 px-3 py-1 text-amber-700">
            {uiText("Step 2: Viewing distance", "第2步：观看距离", "第2步：觀看距離", "Étape 2 : distance")}
          </Badge>
          <CardTitle className="flex items-center gap-3 text-2xl text-slate-950">
            <div className="rounded-2xl bg-amber-100 p-2 text-amber-700">
              <Ruler className="h-5 w-5" />
            </div>
            {uiText("Viewing distance", "观看距离", "觀看距離", "Distance de vision")}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6 bg-white/75 p-6 sm:p-8">
          <div className="rounded-[32px] border border-amber-200/70 bg-gradient-to-br from-amber-50 via-orange-50 to-white p-6 text-center shadow-sm">
            <div className="text-5xl font-bold text-amber-600">40 cm</div>
            <p className="mt-3 text-lg text-slate-700">{uiText("About one arm’s length", "约一臂距离", "約一臂距離", "Environ une longueur de bras")}</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <p className="rounded-2xl border border-slate-200/70 bg-white p-4 text-sm leading-6 text-slate-600">{t("sensory.visual.setup_2")}</p>
            <p className="rounded-2xl border border-slate-200/70 bg-white p-4 text-sm leading-6 text-slate-600">{t("sensory.visual.setup_4")}</p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => setPhase("calibration")} className="h-12 flex-1 rounded-full border-slate-300 bg-white text-slate-700 hover:bg-slate-50">
              <ArrowLeft className="mr-2 h-4 w-4" />
              {uiText("Back", "返回", "返回", "Retour")}
            </Button>
            <Button onClick={() => setPhase("practice")} className={primaryButton + " flex-1"}>
              {uiText("Start practice", "开始练习", "開始練習", "Commencer l’entraînement")}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (phase === "practice") {
    const handlePracticeResponse = (response: TumblingEDirection) => {
      if (response === practiceDirection) {
        setPracticeCorrect(true)
        setTimeout(() => startTesting(), 1000)
        return
      }

      setPracticeAttempts((count) => count + 1)
      setPracticeDirection(randomDirection())
    }

    return (
      <Card className={premiumShell}>
        <CardHeader className={premiumHeader}>
          <Badge variant="outline" className="mb-3 w-fit rounded-full border-indigo-200 bg-indigo-50 px-3 py-1 text-indigo-700">
            {uiText("Practice round", "练习回合", "練習回合", "Tour d’entraînement")}
          </Badge>
          <CardTitle className="text-2xl text-slate-950">{uiText("Direction practice", "方向练习", "方向練習", "Pratique d’orientation")}</CardTitle>
          <CardDescription className="text-sm text-slate-600">{uiText("Respond once correctly to begin the full test.", "正确回答一次后即可开始正式测试。", "答啱一次就可以開始正式測試。", "Répondez correctement une fois pour lancer le test complet.")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 bg-white/75 p-6 sm:p-8">
          {practiceCorrect ? (
            <div className="flex flex-col items-center justify-center space-y-4 rounded-[28px] border border-emerald-100 bg-emerald-50/80 p-10 text-center">
              <CheckCircle2 className="h-14 w-14 text-emerald-600" />
              <p className="text-lg font-medium text-emerald-700">{uiText("Practice complete. Starting test...", "练习完成，正在开始测试...", "練習完成，準備開始測試...", "Entraînement terminé. Démarrage du test...")}</p>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-center">
                <div className="flex min-h-[240px] min-w-[240px] items-center justify-center rounded-[32px] border border-slate-200 bg-white p-8 shadow-sm">
                  <span
                    style={{
                      fontSize: "132px",
                      fontFamily: "'Arial Black', 'Helvetica Neue', Arial, sans-serif",
                      fontWeight: 900,
                      transform: getRotation(practiceDirection),
                      display: "inline-block",
                      lineHeight: 1,
                      color: "#0f172a",
                    }}
                  >
                    E
                  </span>
                </div>
              </div>

              <p className="text-center text-base font-medium text-slate-600">{t("sensory.visual.which_direction")}</p>
              {practiceAttempts > 0 && (
                <p className="text-center text-sm text-amber-600">{uiText("Try again. Match the arrow to the E direction.", "再试一次，请选择与E方向匹配的箭头。", "再試一次，請選擇同E方向一致嘅箭頭。", "Réessayez et choisissez la flèche qui correspond à la direction du E.")}</p>
              )}

              <div className="flex flex-col items-center gap-3">
                <Button size="lg" variant="outline" onClick={() => handlePracticeResponse("up")} className="h-14 w-20 rounded-2xl bg-white shadow-sm">
                  <ChevronUp className="h-6 w-6" />
                </Button>
                <div className="flex gap-3">
                  <Button size="lg" variant="outline" onClick={() => handlePracticeResponse("left")} className="h-14 w-20 rounded-2xl bg-white shadow-sm">
                    <ChevronLeft className="h-6 w-6" />
                  </Button>
                  <Button size="lg" variant="outline" onClick={() => handlePracticeResponse("right")} className="h-14 w-20 rounded-2xl bg-white shadow-sm">
                    <ChevronRight className="h-6 w-6" />
                  </Button>
                </div>
                <Button size="lg" variant="outline" onClick={() => handlePracticeResponse("down")} className="h-14 w-20 rounded-2xl bg-white shadow-sm">
                  <ChevronDown className="h-6 w-6" />
                </Button>
              </div>

              <div className="text-center">
                <Button variant="ghost" onClick={startTesting} className="text-slate-500 hover:text-slate-700">
                  {uiText("Skip practice", "跳过练习", "跳過練習", "Ignorer l’entraînement")}
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    )
  }

  if (phase === "testing") {
    return (
      <Card className={premiumShell}>
        <CardHeader className={premiumHeader}>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <CardTitle className="text-2xl text-slate-950">{t("sensory.visual.title")}</CardTitle>
              <p className="mt-2 text-sm text-slate-600">
                {t("sensory.visual.level")} {currentLevel.level} · {t("sensory.visual.trial")} {trialIndex + 1}/5
              </p>
            </div>
            <div className="rounded-2xl border border-white/80 bg-white/80 px-4 py-3 shadow-sm">
              <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Snellen</p>
              <p className="mt-1 text-lg font-semibold text-slate-900">{logMARToSnellen(currentLevel.logMAR)}</p>
            </div>
          </div>
          <div className="mt-4 space-y-2">
            <Progress value={(totalTrialsCompleted / totalTrialCount) * 100} className="h-2.5" />
            <p className="text-right text-xs text-slate-500">{totalTrialsCompleted}/{totalTrialCount}</p>
          </div>
        </CardHeader>
        <CardContent className="space-y-6 bg-white/75 p-6 sm:p-8">
          <div className="flex items-center justify-center">
            <div className="flex min-h-[260px] min-w-[260px] items-center justify-center rounded-[32px] border border-slate-200 bg-white p-8 shadow-sm sm:min-h-[320px] sm:min-w-[320px]">
              <span
                style={{
                  fontSize: `${Math.max(eSize, 80)}px`,
                  fontFamily: "'Arial Black', 'Helvetica Neue', Arial, sans-serif",
                  fontWeight: 900,
                  transform: getRotation(currentDirection),
                  display: "inline-block",
                  lineHeight: 1,
                  color: "#0f172a",
                }}
              >
                E
              </span>
            </div>
          </div>

          <p className="text-center text-base font-medium text-slate-600">{t("sensory.visual.which_direction")}</p>

          <div className="flex flex-col items-center gap-3">
            <Button size="lg" variant="outline" onClick={() => void handleResponse("up")} className="h-14 w-20 rounded-2xl bg-white shadow-sm">
              <ChevronUp className="h-6 w-6" />
            </Button>
            <div className="flex gap-3">
              <Button size="lg" variant="outline" onClick={() => void handleResponse("left")} className="h-14 w-20 rounded-2xl bg-white shadow-sm">
                <ChevronLeft className="h-6 w-6" />
              </Button>
              <Button size="lg" variant="outline" onClick={() => void handleResponse("right")} className="h-14 w-20 rounded-2xl bg-white shadow-sm">
                <ChevronRight className="h-6 w-6" />
              </Button>
            </div>
            <Button size="lg" variant="outline" onClick={() => void handleResponse("down")} className="h-14 w-20 rounded-2xl bg-white shadow-sm">
              <ChevronDown className="h-6 w-6" />
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  const snellen = logMARToSnellen(finalLogMAR)
  const riskLevel = getVisualRiskLevel(finalLogMAR)

  return (
    <Card className={premiumShell}>
      <CardHeader className={premiumHeader}>
        <CardTitle className="flex items-center gap-3 text-2xl text-slate-950">
          <div className="rounded-2xl bg-emerald-100 p-2 text-emerald-700">
            <CheckCircle2 className="h-5 w-5" />
          </div>
          {t("sensory.visual.complete_title")}
        </CardTitle>
        <CardDescription className="text-sm text-slate-600">{t("sensory.visual.complete_message")}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6 bg-white/75 p-6 sm:p-8">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-[28px] border border-emerald-100 bg-emerald-50/70 p-5 text-center shadow-sm">
            <p className="text-sm text-emerald-700">{uiText("Visual acuity", "视力结果", "視力結果", "Acuité visuelle")}</p>
            <p className="mt-2 text-4xl font-bold text-slate-950">{snellen}</p>
          </div>
          <div className="rounded-[28px] border border-slate-200 bg-white p-5 text-center shadow-sm">
            <p className="text-sm text-slate-500">LogMAR</p>
            <p className="mt-2 text-4xl font-bold text-slate-950">{finalLogMAR.toFixed(2)}</p>
          </div>
        </div>

        <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.16em] text-slate-500">{uiText("Classification", "分类", "分類", "Classification")}</p>
              <p className="mt-2 text-lg font-semibold text-slate-900">
                {classification === "normal"
                  ? uiText("Normal vision", "正常视力", "正常視力", "Vision normale")
                  : classification === "impaired"
                    ? uiText("Mildly impaired", "轻度受损", "輕度受損", "Légèrement altérée")
                    : uiText("Further evaluation needed", "建议进一步检查", "建議進一步檢查", "Évaluation complémentaire recommandée")}
              </p>
            </div>
            <Badge className={`rounded-full px-3 py-1 ${riskLevel === "low" ? "bg-emerald-100 text-emerald-700" : riskLevel === "moderate" ? "bg-amber-100 text-amber-700" : "bg-rose-100 text-rose-700"}`}>
              {riskLevel}
            </Badge>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-center">
            <p className="text-xs uppercase tracking-[0.16em] text-slate-500">{uiText("Score", "得分", "得分", "Score")}</p>
            <p className="mt-2 text-2xl font-semibold text-slate-900">{finalScore}%</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-center">
            <p className="text-xs uppercase tracking-[0.16em] text-slate-500">{uiText("Levels tested", "测试等级", "測試等級", "Niveaux testés")}</p>
            <p className="mt-2 text-2xl font-semibold text-slate-900">{results.length}</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-center">
            <p className="text-xs uppercase tracking-[0.16em] text-slate-500">PPI</p>
            <p className="mt-2 text-2xl font-semibold text-slate-900">{calibration.ppi}</p>
          </div>
        </div>

        <Button onClick={() => onComplete(finalScore)} className={primaryButton + " w-full"}>
          {t("common.continue")}
        </Button>
      </CardContent>
    </Card>
  )
}

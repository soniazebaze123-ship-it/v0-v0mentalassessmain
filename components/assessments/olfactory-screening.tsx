"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useUser } from "@/contexts/user-context"
import { supabase } from "@/lib/supabase"
import { useLanguage } from "@/contexts/language-context"
import { InstructionAudio } from "@/components/ui/instruction-audio"
import { calculateOlfactoryScore } from "@/lib/olfactory-screening-utils"
import { ODOFIN_RISK_CUTOFF, ODOFIN_SECONDS_PER_STRIP, ODOFIN_STRIPS, type OdorId } from "@/lib/odofin-kit"
import { Flower2, Check, X, Timer, AlertCircle, Sparkles, FlaskConical, RotateCcw } from "lucide-react"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"

interface OlfactoryScreeningProps {
  onComplete: (score: number) => void
  onSkip?: () => void
  enhanced?: boolean
}

type TrialResult = {
  strip: number
  selected: OdorId | null
  correctAnswer: OdorId
  correct: boolean
  timedOut: boolean
}

const SMELL_ICONS: Record<OdorId, string> = {
  rose: "🌹",
  lemon: "🍋",
  coffee: "☕",
  mint: "🌿",
  orange: "🍊",
  soap: "🧼",
  vanilla: "🍦",
  garlic: "🧄",
  chocolate: "🍫",
  pineapple: "🍍",
  cinnamon: "🟤",
  grass: "🌱",
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
  const [results, setResults] = useState<TrialResult[]>([])
  const [showFeedback, setShowFeedback] = useState(false)
  const [lastAnswerCorrect, setLastAnswerCorrect] = useState(false)
  const [timeRemaining, setTimeRemaining] = useState(ODOFIN_SECONDS_PER_STRIP)
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  const trials = useMemo(() => (enhanced ? ODOFIN_STRIPS : ODOFIN_STRIPS.slice(0, 6)), [enhanced])
  const currentTrial = trials[currentTrialIndex]
  const correctCount = results.filter((result) => result.correct).length
  const premiumShell =
    "mx-auto w-full max-w-4xl overflow-hidden border border-white/70 bg-[radial-gradient(circle_at_top_left,_rgba(249,168,212,0.16),_transparent_28%),linear-gradient(135deg,_rgba(255,255,255,0.97),_rgba(255,251,235,0.98),_rgba(255,247,237,0.94))] shadow-[0_28px_90px_rgba(15,23,42,0.10)]"
  const premiumHeader = "border-b border-white/70 bg-white/85 pb-6"
  const primaryButton =
    "h-12 rounded-full bg-gradient-to-r from-rose-500 via-orange-500 to-amber-500 px-6 text-white shadow-lg shadow-rose-500/20 hover:from-rose-600 hover:via-orange-600 hover:to-amber-600"

  const finishTest = useCallback(
    async (finalResults: TrialResult[]) => {
      setTestComplete(true)

      const scoreSummary = calculateOlfactoryScore(finalResults)
      const odofinClassification =
        scoreSummary.totalCorrect >= ODOFIN_RISK_CUTOFF ? "normal" : scoreSummary.totalCorrect >= 5 ? "impaired" : "dysfunction"

      if (user) {
        try {
          await supabase.from("sensory_assessments").insert({
            user_id: user.id,
            test_type: "olfactory",
            raw_score: scoreSummary.totalCorrect,
            normalized_score: scoreSummary.normalizedScore,
            classification: odofinClassification,
            test_data: {
              protocol: enhanced ? "odofin_12_strip" : "core_olfactory_6_strip",
              total_trials: finalResults.length,
              total_correct: scoreSummary.totalCorrect,
              percent_correct: scoreSummary.percentCorrect,
              strip_results: finalResults,
              cutoff_risk: scoreSummary.totalCorrect < ODOFIN_RISK_CUTOFF,
            },
            device_info: {
              userAgent: navigator.userAgent,
              platform: navigator.platform,
            },
            environment_data: {
              test_type: "scratch_and_sniff_identification",
              self_administered: true,
            },
          })
        } catch (error) {
          console.error("[v0] Error saving olfactory screening:", error)
        }
      }

      onComplete(Math.round(scoreSummary.normalizedScore))
    },
    [enhanced, onComplete, user],
  )

  const advanceToNext = useCallback(
    (newResults: TrialResult[]) => {
      setTimeout(() => {
        setShowFeedback(false)
        if (currentTrialIndex < trials.length - 1) {
          setCurrentTrialIndex((value) => value + 1)
          setTimeRemaining(ODOFIN_SECONDS_PER_STRIP)
        } else {
          void finishTest(newResults)
        }
      }, 900)
    },
    [currentTrialIndex, finishTest, trials.length],
  )

  const handleTimeUp = useCallback(() => {
    if (!currentTrial) return

    setLastAnswerCorrect(false)
    setShowFeedback(true)

    const newResults = [
      ...results,
      {
        strip: currentTrial.number,
        selected: null,
        correctAnswer: currentTrial.answer,
        correct: false,
        timedOut: true,
      },
    ]
    setResults(newResults)
    advanceToNext(newResults)
  }, [advanceToNext, currentTrial, results])

  useEffect(() => {
    if (testStarted && !testComplete && !showFeedback && currentTrial) {
      setTimeRemaining(ODOFIN_SECONDS_PER_STRIP)
      timerRef.current = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
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
  }, [currentTrial, handleTimeUp, showFeedback, testComplete, testStarted])

  const handleStart = () => {
    setTestStarted(true)
    setTestComplete(false)
    setCurrentTrialIndex(0)
    setResults([])
    setShowFeedback(false)
    setLastAnswerCorrect(false)
    setTimeRemaining(ODOFIN_SECONDS_PER_STRIP)
  }

  const handleSelectOption = (selected: OdorId) => {
    if (!currentTrial) return
    if (timerRef.current) clearInterval(timerRef.current)

    const isCorrect = selected === currentTrial.answer
    setLastAnswerCorrect(isCorrect)
    setShowFeedback(true)

    const newResults = [
      ...results,
      {
        strip: currentTrial.number,
        selected,
        correctAnswer: currentTrial.answer,
        correct: isCorrect,
        timedOut: false,
      },
    ]

    setResults(newResults)
    advanceToNext(newResults)
  }

  const handleSkip = () => {
    if (onSkip) {
      onSkip()
    } else {
      onComplete(0)
    }
  }

  const handleRestart = () => {
    setTestStarted(false)
    setTestComplete(false)
    setCurrentTrialIndex(0)
    setResults([])
    setShowFeedback(false)
    setLastAnswerCorrect(false)
    setTimeRemaining(ODOFIN_SECONDS_PER_STRIP)
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
          <div className="grid gap-4 sm:grid-cols-[1.2fr_0.95fr]">
            <div className="rounded-[28px] border border-rose-100 bg-gradient-to-br from-rose-50 via-orange-50 to-white p-6 shadow-sm">
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <Badge className="rounded-full border-0 bg-rose-600 px-3 py-1 text-white">
                  <Sparkles className="mr-1.5 h-3.5 w-3.5" />
                  {uiText("Premium Odofin Flow", "高级 Odofin 流程", "高級 Odofin 流程", "Flux premium Odofin")}
                </Badge>
                <Badge className="rounded-full border-0 bg-slate-900 px-3 py-1 text-white">
                  {uiText(`${trials.length} strips`, `${trials.length} 条试纸`, `${trials.length} 條試紙`, `${trials.length} bandes`)}
                </Badge>
              </div>
              <h3 className="font-semibold text-slate-900">{uiText("How this premium smell task works", "高级嗅觉任务说明", "高級嗅覺任務說明", "Comment fonctionne cette tâche premium")}</h3>
              <ul className="mt-4 space-y-2 text-sm leading-6 text-slate-600">
                <li>• {uiText("Pick the strip number shown on screen.", "拿起屏幕显示编号的试纸。", "拎起螢幕顯示編號嘅試紙。", "Prenez la bande indiquée à l’écran.")}</li>
                <li>• {uiText("Scratch, sniff, and choose the closest smell label.", "刮擦后闻气味，再选择最接近的标签。", "刮開後聞氣味，再揀最接近嘅標籤。", "Grattez, sentez, puis choisissez l’étiquette la plus proche.")}</li>
                <li>• {uiText("A score below 8 suggests impairment risk.", "低于 8 分提示存在风险。", "低於 8 分提示存在風險。", "Un score inférieur à 8 suggère un risque.")}</li>
              </ul>
            </div>

            <div className="rounded-[28px] border border-slate-200/70 bg-slate-950 p-5 text-white shadow-sm">
              <div className="flex items-center gap-2">
                <Badge className="rounded-full border-0 bg-white/15 px-3 py-1 text-white">
                  {uiText("Scratch and Sniff", "刮闻测试", "刮聞測試", "Gratter et sentir")}
                </Badge>
                <Badge className="rounded-full border-0 bg-amber-500 px-3 py-1 text-white">
                  {enhanced ? uiText("Live Premium", "正式高级版", "正式高級版", "Premium en direct") : uiText("Core", "基础版", "基礎版", "Version de base")}
                </Badge>
              </div>
              <p className="mt-4 text-sm leading-6 text-slate-200">
                {uiText(
                  "This assessment now uses the Odofin-style strip workflow instead of the older visual-only smell card flow.",
                  "此评估现已使用 Odofin 风格试纸流程，而不是旧的纯视觉嗅觉卡片流程。",
                  "此評估而家會用 Odofin 風格試紙流程，而唔再係舊式純視覺嗅覺卡片流程。",
                  "Cette évaluation utilise désormais un flux de bandes Odofin au lieu de l’ancien flux visuel seul.",
                )}
              </p>
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
              <FlaskConical className="mr-2 h-4 w-4" />
              {uiText("Start Odofin test", "开始 Odofin 测试", "開始 Odofin 測試", "Démarrer le test Odofin")}
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
          <CardTitle>{uiText("Odofin screening complete", "Odofin 筛查完成", "Odofin 篩查完成", "Dépistage Odofin terminé")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6 bg-white/75 p-6 text-center sm:p-8">
          <div className="rounded-[28px] border border-emerald-100 bg-emerald-50/80 p-8 shadow-sm">
            <div className="text-6xl">✓</div>
            <p className="mt-4 text-4xl font-black text-emerald-700">{correctCount}/{trials.length}</p>
            <p className="mt-3 text-lg text-slate-700">
              {correctCount >= 8
                ? uiText("Normal identification range", "识别结果在正常范围内", "識別結果喺正常範圍內", "Identification dans la plage normale")
                : correctCount >= 5
                  ? uiText("Mild impairment risk", "存在轻度受损风险", "存在輕度受損風險", "Risque léger d’altération")
                  : uiText("Marked impairment risk", "存在明显受损风险", "存在明顯受損風險", "Risque marqué d’altération")}
            </p>
          </div>
          <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button variant="outline" onClick={handleRestart} className="h-12 rounded-full border-slate-300 bg-white text-slate-700 hover:bg-slate-50">
              <RotateCcw className="mr-2 h-4 w-4" />
              {uiText("Retake task", "重新测试", "重新測試", "Recommencer")}
            </Button>
            <Button onClick={() => onComplete(correctCount)} className={primaryButton}>
              {t("common.continue")}
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={premiumShell}>
      <CardHeader className={premiumHeader}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="mb-2 flex items-center gap-2">
              <Badge className="rounded-full border-0 bg-rose-600 px-3 py-1 text-white">
                {uiText("Strip", "试纸", "試紙", "Bande")} #{currentTrial.number}
              </Badge>
              <Badge className="rounded-full border-0 bg-slate-100 px-3 py-1 text-slate-700">
                {currentTrialIndex + 1} / {trials.length}
              </Badge>
            </div>
            <CardTitle>{uiText("Take this strip, scratch and sniff", "请取此试纸并刮擦后闻气味", "請攞呢條試紙並刮開後聞氣味", "Prenez cette bande, grattez et sentez")}</CardTitle>
            <p className="text-sm text-muted-foreground">
              {uiText("Choose the label that best matches what you smell.", "请选择最符合闻到气味的标签。", "請揀最符合聞到氣味嘅標籤。", "Choisissez l’étiquette correspondant le mieux à l’odeur perçue.")}
            </p>
          </div>
          <div className={`flex items-center gap-2 rounded-full px-3 py-1.5 ${timeRemaining <= 10 ? "bg-red-100 text-red-700" : "bg-gray-100 text-gray-700"}`}>
            <Timer className={`h-4 w-4 ${timeRemaining <= 10 ? "animate-pulse" : ""}`} />
            <span className="font-mono font-semibold">{timeRemaining}s</span>
          </div>
        </div>
        <Progress value={(currentTrialIndex / trials.length) * 100} className="mt-3" />
        <div className="mt-2">
          <Progress
            value={(timeRemaining / ODOFIN_SECONDS_PER_STRIP) * 100}
            className={`h-1 ${timeRemaining <= 10 ? "[&>div]:bg-red-500" : "[&>div]:bg-amber-500"}`}
          />
        </div>
      </CardHeader>
      <CardContent className="space-y-6 bg-white/75 p-6 sm:p-8">
        {showFeedback && (
          <div
            className={`flex items-center justify-center gap-2 rounded-[22px] p-4 ${lastAnswerCorrect ? "bg-green-100" : "bg-red-100"}`}
          >
            {lastAnswerCorrect ? <Check className="h-6 w-6 text-green-600" /> : <X className="h-6 w-6 text-red-600" />}
            <span className="font-medium">
              {lastAnswerCorrect ? t("sensory.olfactory.correct") : t("sensory.olfactory.incorrect")}
            </span>
          </div>
        )}

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

        <div className="rounded-[22px] border border-slate-200 bg-[linear-gradient(135deg,rgba(255,255,255,0.98),rgba(255,250,245,0.98))] p-4 text-sm text-slate-700">
          {uiText("Protocol: scratch the numbered strip, sniff for about 2 seconds, then tap one answer.", "流程：刮擦对应编号试纸，闻约2秒，然后点击一个答案。", "流程：刮擦對應編號試紙，聞大約2秒，然後點一個答案。", "Protocole : grattez la bande numérotée, sentez environ 2 secondes, puis touchez une réponse.")}
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {currentTrial.options.map((option) => (
            <button
              key={option}
              onClick={() => handleSelectOption(option)}
              disabled={showFeedback}
              className="flex items-center justify-between gap-4 rounded-[28px] border-2 border-slate-200 bg-white p-5 text-left transition-colors hover:border-rose-400 hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-[18px] bg-gradient-to-br from-rose-50 via-orange-50 to-amber-50 text-3xl">
                  {SMELL_ICONS[option]}
                </div>
                <span className="font-medium text-lg text-slate-800">{t(`sensory.olfactory.smell.${option}`)}</span>
              </div>
              <span className="text-sm font-semibold text-slate-400">→</span>
            </button>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

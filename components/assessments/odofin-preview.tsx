"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { Flower2, Sparkles, Timer, FlaskConical, ArrowRight, Check, X, RotateCcw } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { InstructionAudio } from "@/components/ui/instruction-audio"
import { useLanguage } from "@/contexts/language-context"
import { ODOFIN_RISK_CUTOFF, ODOFIN_SECONDS_PER_STRIP, ODOFIN_STRIPS, type OdorId } from "@/lib/odofin-kit"

type TrialResult = {
  strip: number
  selected: OdorId | "No answer"
  correct: boolean
}

const ODOR_LABELS: Record<OdorId, { en: string; zh: string; yue: string; fr: string }> = {
  rose: { en: "Rose", zh: "玫瑰", yue: "玫瑰", fr: "Rose" },
  lemon: { en: "Lemon", zh: "柠檬", yue: "檸檬", fr: "Citron" },
  coffee: { en: "Coffee", zh: "咖啡", yue: "咖啡", fr: "Café" },
  mint: { en: "Mint", zh: "薄荷", yue: "薄荷", fr: "Menthe" },
  orange: { en: "Orange", zh: "橙子", yue: "橙", fr: "Orange" },
  soap: { en: "Soap", zh: "肥皂", yue: "番梘", fr: "Savon" },
  vanilla: { en: "Vanilla", zh: "香草", yue: "雲呢拿", fr: "Vanille" },
  garlic: { en: "Garlic", zh: "大蒜", yue: "蒜頭", fr: "Ail" },
  chocolate: { en: "Chocolate", zh: "巧克力", yue: "朱古力", fr: "Chocolat" },
  pineapple: { en: "Pineapple", zh: "菠萝", yue: "菠蘿", fr: "Ananas" },
  cinnamon: { en: "Cinnamon", zh: "肉桂", yue: "肉桂", fr: "Cannelle" },
  grass: { en: "Grass", zh: "青草", yue: "青草", fr: "Herbe" },
}

const SECONDS_PER_STRIP = ODOFIN_SECONDS_PER_STRIP

function getClassification(score: number) {
  if (score >= ODOFIN_RISK_CUTOFF) return "normal"
  if (score >= 5) return "mild_impairment"
  return "marked_impairment"
}

export function OdofinPreview() {
  const { localizeText } = useLanguage()
  const [started, setStarted] = useState(false)
  const [index, setIndex] = useState(0)
  const [results, setResults] = useState<TrialResult[]>([])
  const [seconds, setSeconds] = useState(SECONDS_PER_STRIP)
  const [feedback, setFeedback] = useState<"correct" | "incorrect" | null>(null)

  const currentStrip = ODOFIN_STRIPS[index]
  const correctCount = results.filter((r) => r.correct).length
  const done = started && index >= ODOFIN_STRIPS.length

  const options = useMemo(() => currentStrip?.options ?? [], [currentStrip])

  const getOdorLabel = (odor: OdorId) => {
    const labels = ODOR_LABELS[odor]
    return localizeText(labels.en, { zh: labels.zh, yue: labels.yue, fr: labels.fr })
  }

  const audioPrompt = useMemo(() => {
    if (!currentStrip) {
      return { text: "", textOverrides: {} as Partial<Record<"en" | "zh" | "yue" | "fr", string>> }
    }

    const englishOptions = currentStrip.options.map((option) => ODOR_LABELS[option].en).join(", ")
    const chineseOptions = currentStrip.options.map((option) => ODOR_LABELS[option].zh).join("、")
    const cantoneseOptions = currentStrip.options.map((option) => ODOR_LABELS[option].yue).join("、")
    const frenchOptions = currentStrip.options.map((option) => ODOR_LABELS[option].fr).join(", ")

    return {
      text: `Strip ${currentStrip.number}. Listen carefully. Your answer choices are ${englishOptions}. Choose the scent that best matches the strip.`,
      textOverrides: {
        zh: `第 ${currentStrip.number} 号试纸。请仔细听。您的选项是：${chineseOptions}。请选择与试纸最相符的气味。`,
        yue: `第 ${currentStrip.number} 號試紙。請留心聽。你嘅選項係：${cantoneseOptions}。請揀最符合試紙嘅氣味。`,
        fr: `Bande ${currentStrip.number}. Écoutez attentivement. Les choix sont ${frenchOptions}. Choisissez l’odeur qui correspond le mieux à la bande.`,
      },
    }
  }, [currentStrip, localizeText])

  useEffect(() => {
    if (!started || done || feedback) return

    const timer = setInterval(() => {
      setSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(timer)
          if (currentStrip) {
            setResults((old) => [...old, { strip: currentStrip.number, selected: "No answer", correct: false }])
          }
          setFeedback("incorrect")
          setTimeout(() => {
            setFeedback(null)
            setIndex((old) => old + 1)
            setSeconds(SECONDS_PER_STRIP)
          }, 700)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [started, done, feedback, currentStrip])

  const startOver = () => {
    setStarted(false)
    setIndex(0)
    setResults([])
    setSeconds(SECONDS_PER_STRIP)
    setFeedback(null)
  }

  const selectOption = (choice: OdorId) => {
    if (!currentStrip || feedback) return

    const isCorrect = choice === currentStrip.answer
    setResults((old) => [...old, { strip: currentStrip.number, selected: choice, correct: isCorrect }])
    setFeedback(isCorrect ? "correct" : "incorrect")

    setTimeout(() => {
      setFeedback(null)
      setIndex((old) => old + 1)
      setSeconds(SECONDS_PER_STRIP)
    }, 700)
  }

  const classification = getClassification(correctCount)

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_12%_14%,_rgba(244,114,182,0.20),_transparent_34%),radial-gradient(circle_at_85%_15%,_rgba(251,191,36,0.22),_transparent_32%),linear-gradient(145deg,_#fffaf3_0%,_#fff8fb_42%,_#f8fafc_100%)] px-4 py-8 md:px-8">
      <div className="mx-auto w-full max-w-6xl">
        <Card className="overflow-hidden rounded-[34px] border border-white/70 bg-white/78 shadow-[0_34px_120px_rgba(15,23,42,0.12)] backdrop-blur-xl">
          <CardHeader className="border-b border-white/70 bg-[radial-gradient(circle_at_top_left,_rgba(244,114,182,0.16),_transparent_38%),linear-gradient(120deg,_rgba(255,255,255,0.95),_rgba(255,251,235,0.98),_rgba(255,247,237,0.95))]">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="mb-3 flex flex-wrap items-center gap-2">
                  <Badge className="rounded-full border-0 bg-rose-600 px-3 py-1 text-white">
                    <Sparkles className="mr-1.5 h-3.5 w-3.5" />
                    {localizeText("Premium Prototype", { zh: "高级原型", yue: "高級原型", fr: "Prototype premium" })}
                  </Badge>
                  <Badge className="rounded-full border-0 bg-slate-900/90 px-3 py-1 text-white">
                    {localizeText("Odofin 12-Strip Flow", { zh: "Odofin 12条流程", yue: "Odofin 12條流程", fr: "Flux Odofin 12 bandes" })}
                  </Badge>
                </div>
                <CardTitle className="flex items-center gap-2 text-2xl text-slate-900 md:text-3xl">
                  <Flower2 className="h-7 w-7 text-rose-600" />
                  {localizeText("Olfactory Kit Experience Preview", {
                    zh: "嗅觉试纸体验预览",
                    yue: "嗅覺試紙體驗預覽",
                    fr: "Aperçu de l’expérience du kit olfactif",
                  })}
                </CardTitle>
              </div>
              <Button asChild variant="outline" className="rounded-full border-slate-300 bg-white/85">
                <Link href="/">
                  {localizeText("Back to dashboard", { zh: "返回仪表板", yue: "返回主頁", fr: "Retour au tableau" })}
                </Link>
              </Button>
            </div>
          </CardHeader>

          <CardContent className="grid gap-6 p-5 md:grid-cols-[0.82fr_1.18fr] md:p-8">
            <aside className="rounded-[28px] border border-rose-100 bg-[linear-gradient(155deg,rgba(255,241,242,0.95),rgba(255,255,255,0.98),rgba(255,247,237,0.96))] p-5 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-rose-700">
                {localizeText("Protocol", { zh: "流程", yue: "流程", fr: "Protocole" })}
              </p>
              <ul className="mt-3 space-y-2 text-sm leading-6 text-slate-700">
                <li>1. {localizeText("Pick the requested strip number.", { zh: "拿取指定编号试纸。", yue: "攞指定編號試紙。", fr: "Prenez la bande demandée." })}</li>
                <li>2. {localizeText("Scratch, sniff, then choose one label.", { zh: "刮擦并闻气味，然后选择一个标签。", yue: "刮開聞味，再揀一個標籤。", fr: "Grattez, sentez, puis choisissez une étiquette." })}</li>
                <li>3. {localizeText("Continue through all 12 strips.", { zh: "完成全部12条试纸。", yue: "完成全部12條試紙。", fr: "Continuez jusqu’aux 12 bandes." })}</li>
              </ul>

              <div className="mt-5 rounded-2xl border border-white/80 bg-white/85 p-4 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                  {localizeText("Scoring", { zh: "评分", yue: "評分", fr: "Score" })}
                </p>
                <p className="mt-2 text-sm text-slate-700">
                  {localizeText("0-12 direct score. Suggested cutoff: < 8 indicates impairment risk.", {
                    zh: "0-12直接计分，建议阈值：低于8分提示风险。",
                    yue: "0-12直接計分，建議閾值：低於8分提示風險。",
                    fr: "Score direct 0-12. Seuil conseillé: < 8 indique un risque.",
                  })}
                </p>
              </div>
            </aside>

            <section className="rounded-[28px] border border-slate-200/80 bg-white/90 p-5 shadow-sm md:p-6">
              {!started && (
                <div className="space-y-5">
                  <div className="rounded-[22px] border border-amber-200 bg-amber-50/85 p-4 text-amber-900">
                    <p className="text-sm leading-6">
                      {localizeText(
                        "This preview is isolated from production scoring. It demonstrates a premium Odofin-style flow with strip-by-strip interaction.",
                        {
                          zh: "此预览与正式评分隔离，仅用于展示高级Odofin逐条试纸交互流程。",
                          yue: "呢個預覽同正式評分分開，只係展示高級Odofin逐條試紙流程。",
                          fr: "Cet aperçu est isolé du scoring en production et montre un flux premium Odofin bande par bande.",
                        },
                      )}
                    </p>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-3">
                    {[
                      `${ODOFIN_STRIPS.length} strips`,
                      "4 options each",
                      `${SECONDS_PER_STRIP}s per strip`,
                    ].map((item) => (
                      <div key={item} className="rounded-2xl border border-rose-100 bg-rose-50/70 px-4 py-3 text-center text-sm font-semibold text-rose-800">
                        {item}
                      </div>
                    ))}
                  </div>

                  <Button onClick={() => setStarted(true)} className="h-12 w-full rounded-full bg-gradient-to-r from-rose-500 via-orange-500 to-amber-500 text-white shadow-lg shadow-rose-500/20 hover:from-rose-600 hover:via-orange-600 hover:to-amber-600">
                    <FlaskConical className="mr-2 h-4 w-4" />
                    {localizeText("Launch Preview", { zh: "开始预览", yue: "開始預覽", fr: "Lancer l’aperçu" })}
                  </Button>
                </div>
              )}

              {started && !done && currentStrip && (
                <div className="space-y-5">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                        {localizeText("Current strip", { zh: "当前试纸", yue: "目前試紙", fr: "Bande actuelle" })}
                      </p>
                      <p className="mt-1 text-2xl font-bold text-slate-900">#{currentStrip.number}</p>
                    </div>
                    <div className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-semibold ${seconds <= 15 ? "bg-red-100 text-red-700" : "bg-slate-100 text-slate-700"}`}>
                      <Timer className={`h-4 w-4 ${seconds <= 15 ? "animate-pulse" : ""}`} />
                      {seconds}s
                    </div>
                  </div>

                  <Progress value={(index / ODOFIN_STRIPS.length) * 100} className="h-2" />

                  <div className="rounded-[22px] border border-slate-200/90 bg-[linear-gradient(135deg,rgba(255,255,255,0.96),rgba(255,250,245,0.96))] p-5 space-y-4">
                    <p className="text-sm leading-6 text-slate-700">
                      {localizeText("Take strip", { zh: "请拿", yue: "請拎", fr: "Prenez" })} <span className="font-semibold text-rose-700">#{currentStrip.number}</span>,{" "}
                      {localizeText("scratch, sniff for 2 seconds, and choose the closest smell label.", {
                        zh: "刮擦后闻2秒，再选择最接近的气味标签。",
                        yue: "刮開後聞2秒，再揀最接近嘅氣味標籤。",
                        fr: "grattez, sentez 2 secondes, puis choisissez l’étiquette la plus proche.",
                      })}
                    </p>

                    <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-rose-100 bg-rose-50/70 px-4 py-3">
                      <div>
                        <p className="text-sm font-semibold text-rose-800">
                          {localizeText("Audio scent guidance", { zh: "语音气味引导", yue: "語音氣味引導", fr: "Guide audio des odeurs" })}
                        </p>
                        <p className="text-xs text-rose-700">
                          {localizeText("Listen to the spoken answer choices before selecting.", {
                            zh: "可先听语音播报选项，再进行选择。",
                            yue: "可以先聽語音播報選項，再作選擇。",
                            fr: "Écoutez les choix audio avant de sélectionner.",
                          })}
                        </p>
                      </div>
                      <InstructionAudio
                        key={`odor-audio-${currentStrip.number}`}
                        text={audioPrompt.text}
                        textOverrides={audioPrompt.textOverrides}
                        autoPlay
                        className="rounded-full border-rose-200 bg-white/90"
                      />
                    </div>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    {options.map((option) => (
                      <Button
                        key={option}
                        variant="outline"
                        onClick={() => selectOption(option)}
                        disabled={!!feedback}
                        className="h-14 justify-between rounded-2xl border-slate-300 bg-white/85 px-4 text-base font-semibold text-slate-800 hover:border-rose-300 hover:bg-rose-50"
                      >
                        {getOdorLabel(option)}
                        <ArrowRight className="h-4 w-4 opacity-60" />
                      </Button>
                    ))}
                  </div>

                  {feedback && (
                    <div className={`flex items-center gap-2 rounded-2xl px-4 py-3 text-sm font-semibold ${feedback === "correct" ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"}`}>
                      {feedback === "correct" ? <Check className="h-4 w-4" /> : <X className="h-4 w-4" />}
                      {feedback === "correct"
                        ? localizeText("Correct", { zh: "正确", yue: "正確", fr: "Correct" })
                        : localizeText("Recorded and moving on", { zh: "已记录并进入下一题", yue: "已記錄並進入下一題", fr: "Enregistré, passage à la suite" })}
                    </div>
                  )}
                </div>
              )}

              {done && (
                <div className="space-y-5">
                  <div className="rounded-[24px] border border-emerald-200 bg-emerald-50/85 p-5 text-center">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-700">
                      {localizeText("Final score", { zh: "最终得分", yue: "最終分數", fr: "Score final" })}
                    </p>
                    <p className="mt-2 text-5xl font-black text-emerald-700">{correctCount}/12</p>
                    <p className="mt-3 text-sm text-emerald-800">
                      {classification === "normal" && localizeText("Classification: Normal range", { zh: "分级：正常范围", yue: "分級：正常範圍", fr: "Classification : plage normale" })}
                      {classification === "mild_impairment" && localizeText("Classification: Mild impairment risk", { zh: "分级：轻度受损风险", yue: "分級：輕度受損風險", fr: "Classification : risque léger" })}
                      {classification === "marked_impairment" && localizeText("Classification: Marked impairment risk", { zh: "分级：明显受损风险", yue: "分級：明顯受損風險", fr: "Classification : risque marqué" })}
                    </p>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <Button onClick={startOver} variant="outline" className="h-12 rounded-full border-slate-300 bg-white/90">
                      <RotateCcw className="mr-2 h-4 w-4" />
                      {localizeText("Try again", { zh: "再试一次", yue: "再試一次", fr: "Réessayer" })}
                    </Button>
                    <Button asChild className="h-12 rounded-full bg-slate-900 text-white hover:bg-slate-800">
                      <Link href="/">
                        {localizeText("Exit preview", { zh: "退出预览", yue: "退出預覽", fr: "Quitter l’aperçu" })}
                      </Link>
                    </Button>
                  </div>
                </div>
              )}
            </section>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

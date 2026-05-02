"use client"

import { useState, useEffect } from "react"
import { BrainCircuit, GalleryVerticalEnd, Layers3, TimerReset } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AssessmentInput } from "@/components/ui/assessment-input"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { useLanguage } from "@/contexts/language-context"
import { InstructionAudio } from "@/components/ui/instruction-audio"

interface MemoryTaskProps {
  onComplete: (score: number) => void
  onSkip?: () => void
  words: string[] | string
  title: string
  assessmentType: "MOCA" | "MMSE"
}

const memoryWordSets = {
  MOCA: {
    en: ["Face", "Velvet", "Church", "Daisy", "Red"],
    zh: ["面孔", "天鹅绒", "教堂", "雏菊", "红色"],
    yue: ["面", "天鵝絨", "教堂", "雛菊", "紅色"],
    fr: ["Visage", "Velours", "Église", "Marguerite", "Rouge"],
  },
  MMSE: {
    en: ["Apple", "Table", "Penny"],
    zh: ["苹果", "桌子", "硬币"],
    yue: ["蘋果", "枱", "硬幣"],
    fr: ["Pomme", "Table", "Pièce"],
  },
} as const

function normalizeWords(words: string[] | string) {
  if (Array.isArray(words)) {
    return words.map((word) => word.trim()).filter(Boolean)
  }

  return words
    .split(",")
    .map((word) => word.trim())
    .filter(Boolean)
}

function countMatches(expectedWords: string[], answers: string[]) {
  const remainingWords = expectedWords.map((word) => word.toLowerCase().trim())
  let score = 0

  answers.forEach((answer) => {
    const normalizedAnswer = answer.toLowerCase().trim()

    if (!normalizedAnswer) {
      return
    }

    const matchedIndex = remainingWords.findIndex((word) => word === normalizedAnswer)

    if (matchedIndex >= 0) {
      score += 1
      remainingWords.splice(matchedIndex, 1)
    }
  })

  return score
}

export function MemoryTask({ onComplete, onSkip, words, title, assessmentType }: MemoryTaskProps) {
  const { t, language, localizeText } = useLanguage()
  const instructionKey = assessmentType === "MMSE" ? "mmse.registration.instruction" : "moca.memory.instruction"
  const presentationRounds = 2
  const [phase, setPhase] = useState<"countdown" | "presentation" | "recall">("countdown")
  const [countdown, setCountdown] = useState(10)
  const [currentWordIndex, setCurrentWordIndex] = useState(0)
  const [presentationRound, setPresentationRound] = useState(1)
  const fallbackWords = normalizeWords(words)
  const explicitWords = [...memoryWordSets[assessmentType][language]]
  const memoryWords = explicitWords.length === fallbackWords.length ? explicitWords : fallbackWords
  const splitIndex = Math.ceil(memoryWords.length / 2)
  const segmentedWords = [memoryWords.slice(0, splitIndex), memoryWords.slice(splitIndex)].filter((segment) => segment.length > 0)
  const memoryWordsKey = memoryWords.join("|")
  const [recallAnswers, setRecallAnswers] = useState<string[]>(new Array(memoryWords.length).fill(""))
  const uiText = (englishText: string, chineseText: string, cantoneseText?: string, frenchText?: string) =>
    localizeText(englishText, {
      zh: chineseText,
      yue: cantoneseText ?? chineseText,
      fr: frenchText,
    })
  const theme =
    assessmentType === "MMSE"
      ? {
          shell: "border-teal-100/80 shadow-[0_24px_70px_rgba(20,184,166,0.12)]",
          header: "bg-[radial-gradient(circle_at_top_left,_rgba(45,212,191,0.20),_transparent_30%),linear-gradient(135deg,_rgba(240,253,250,0.98),_rgba(255,255,255,0.98),_rgba(236,254,255,0.96))]",
          accent: "text-teal-900",
          badge: "bg-teal-100 text-teal-800",
          progress: "bg-teal-600",
          soft: "border-teal-100 bg-teal-50/80 text-teal-900",
          subtle: "border-slate-200 bg-white/90",
        }
      : {
          shell: "border-blue-100/80 shadow-[0_24px_70px_rgba(59,130,246,0.12)]",
          header: "bg-[radial-gradient(circle_at_top_left,_rgba(96,165,250,0.20),_transparent_30%),linear-gradient(135deg,_rgba(239,246,255,0.98),_rgba(255,255,255,0.98),_rgba(224,242,254,0.96))]",
          accent: "text-blue-950",
          badge: "bg-blue-100 text-blue-800",
          progress: "bg-blue-600",
          soft: "border-blue-100 bg-blue-50/80 text-blue-900",
          subtle: "border-slate-200 bg-white/90",
        }

  useEffect(() => {
    setRecallAnswers(new Array(memoryWords.length).fill(""))
    setCountdown(10)
    setCurrentWordIndex(0)
    setPresentationRound(1)
    setPhase("countdown")
  }, [memoryWords.length, memoryWordsKey])

  useEffect(() => {
    if (phase === "countdown" && countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000)
      return () => clearTimeout(timer)
    } else if (phase === "countdown" && countdown === 0) {
      setPhase("presentation")
    }
  }, [phase, countdown])

  useEffect(() => {
    if (phase === "presentation") {
      if (currentWordIndex < memoryWords.length - 1) {
        const timer = setTimeout(() => {
          setCurrentWordIndex(currentWordIndex + 1)
        }, 3000)
        return () => clearTimeout(timer)
      } else if (presentationRound < presentationRounds) {
        const timer = setTimeout(() => {
          setPresentationRound((previous) => previous + 1)
          setCurrentWordIndex(0)
        }, 3000)
        return () => clearTimeout(timer)
      } else {
        const timer = setTimeout(() => {
          setPhase("recall")
        }, 3000)
        return () => clearTimeout(timer)
      }
    }
  }, [phase, currentWordIndex, memoryWords.length, presentationRound, presentationRounds])

  const handleRecallChange = (index: number, value: string) => {
    const newAnswers = [...recallAnswers]
    newAnswers[index] = value
    setRecallAnswers(newAnswers)
  }

  const checkAnswers = () => {
    onComplete(countMatches(memoryWords, recallAnswers))
  }

  const handleSkip = () => {
    if (onSkip) {
      onSkip()
    } else {
      onComplete(0)
    }
  }

  if (phase === "countdown") {
    return (
      <Card className={`mx-auto w-full max-w-3xl overflow-hidden ${theme.shell}`}>
        <CardHeader className={theme.header}>
          <div className="mb-3 flex items-center gap-2">
            <span className={`inline-flex h-10 w-10 items-center justify-center rounded-2xl ${theme.badge} shadow-sm`}>
              <TimerReset className="h-5 w-5" />
            </span>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                {uiText("Memory warmup", "记忆准备", "記憶準備", "Préparation mémoire")}
              </p>
              <CardTitle className={theme.accent}>{title}</CardTitle>
            </div>
          </div>
          <p className="text-sm text-muted-foreground">
            {t(instructionKey, { count: memoryWords.length })}
          </p>
          <InstructionAudio instructionKey={instructionKey} className="mt-2" />
        </CardHeader>
        <CardContent className="space-y-6 pt-6 text-center">
          <div className="mx-auto flex h-36 w-36 items-center justify-center rounded-full border-8 border-white bg-white shadow-[0_20px_50px_rgba(15,23,42,0.10)]">
            <div className={`text-5xl font-black ${theme.accent}`}>{countdown}</div>
          </div>
          <p className="text-base sm:text-lg">{t("memory.get_ready", { countdown })}</p>
          <div className="rounded-2xl border border-white/80 bg-white/90 p-4 shadow-sm">
            <Progress value={((10 - countdown) / 10) * 100} className="w-full" />
          </div>
          <div className={`rounded-2xl border p-4 text-sm ${theme.soft}`}>
            {uiText(
              "A short countdown gives the participant time to prepare before the memory list begins.",
              "短暂倒计时可让受试者在记忆词列表开始前做好准备。",
              "短暫倒數可以畀受試者喺記憶詞列表開始前做好準備。",
              "Un court compte à rebours laisse au participant le temps de se préparer avant le début de la liste de mots.",
            )}
          </div>
          <Button variant="outline" onClick={handleSkip}>
            {t("common.skip_task")}
          </Button>
        </CardContent>
      </Card>
    )
  }

  if (phase === "presentation") {
    return (
      <Card className={`mx-auto w-full max-w-3xl overflow-hidden ${theme.shell}`}>
        <CardHeader className={theme.header}>
          <div className="mb-3 flex items-center gap-2">
            <span className={`inline-flex h-10 w-10 items-center justify-center rounded-2xl ${theme.badge} shadow-sm`}>
              <GalleryVerticalEnd className="h-5 w-5" />
            </span>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                {uiText("Word presentation", "词语呈现", "詞語呈現", "Présentation des mots")}
              </p>
              <CardTitle className={theme.accent}>{title}</CardTitle>
            </div>
          </div>
          <p className="text-sm text-muted-foreground">
            {t("memory.word_of", { current: Math.min(currentWordIndex + 1, memoryWords.length), total: memoryWords.length })}
          </p>
          <p className="text-xs text-muted-foreground">
            {uiText(
              `Round ${presentationRound} of ${presentationRounds}`,
              `第 ${presentationRound} 轮，共 ${presentationRounds} 轮`,
              `第 ${presentationRound} 輪，共 ${presentationRounds} 輪`,
              `Tour ${presentationRound} sur ${presentationRounds}`,
            )}
          </p>
        </CardHeader>
        <CardContent className="flex min-h-[360px] flex-col items-center justify-center space-y-6 pt-6 text-center">
          {currentWordIndex < memoryWords.length ? (
            <>
              <div className={`rounded-full px-4 py-1 text-xs font-semibold uppercase tracking-wide ${theme.badge}`}>
                {uiText(
                  `Segment ${currentWordIndex < splitIndex ? 1 : 2}`,
                  `第 ${currentWordIndex < splitIndex ? 1 : 2} 段`,
                  `第 ${currentWordIndex < splitIndex ? 1 : 2} 段`,
                  `Segment ${currentWordIndex < splitIndex ? 1 : 2}`,
                )}
              </div>
              <div className="rounded-[32px] border border-white/80 bg-white/95 px-8 py-12 shadow-[0_24px_70px_rgba(15,23,42,0.10)] animate-in fade-in zoom-in duration-300">
                <div className={`text-6xl font-black sm:text-7xl md:text-9xl ${theme.accent}`}>
                {memoryWords[currentWordIndex]}
                </div>
              </div>
              <div className="w-full rounded-2xl border border-white/80 bg-white/90 p-4 shadow-sm">
                <Progress value={((currentWordIndex + 1) / memoryWords.length) * 100} className="h-4 w-full" />
              </div>
            </>
          ) : (
            <div className="text-lg sm:text-2xl text-muted-foreground py-8 sm:py-12">
              {t("memory.preparing_recall")}
            </div>
          )}
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={`mx-auto w-full max-w-3xl overflow-hidden ${theme.shell}`}>
      <CardHeader className={theme.header}>
        <div className="mb-3 flex items-center gap-2">
          <span className={`inline-flex h-10 w-10 items-center justify-center rounded-2xl ${theme.badge} shadow-sm`}>
            <BrainCircuit className="h-5 w-5" />
          </span>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
              {uiText("Recall entry", "回忆作答", "回憶作答", "Rappel")}
            </p>
            <CardTitle className={theme.accent}>
          {title} - {t("memory.submit_recall")}
            </CardTitle>
          </div>
        </div>
        <p className="text-sm text-muted-foreground">
          {t("memory.recall_instruction", { count: memoryWords.length })}
        </p>
        <InstructionAudio instructionKey="memory.recall_instruction" className="mt-2" />
      </CardHeader>
      <CardContent className="space-y-4 pt-6">
        <div className={`rounded-2xl border p-4 text-sm ${theme.soft}`}>
          {uiText(
            "Two-step evaluation: recall the first segment, then the second. Answers can be entered in any order within each segment.",
            "分两步回忆：先回忆第一段，再回忆第二段。每一段中的答案可以按任意顺序填写。",
            "分兩步回憶：先回憶第一段，再回憶第二段。每一段入面嘅答案都可以任意次序填寫。",
            "Évaluation en deux étapes : rappelez d’abord le premier segment, puis le second. Les réponses peuvent être saisies dans n’importe quel ordre à l’intérieur de chaque segment.",
          )}
        </div>

        {segmentedWords.map((segment, segmentIndex) => {
          const answerOffset = segmentedWords.slice(0, segmentIndex).reduce((sum, currentSegment) => sum + currentSegment.length, 0)

          return (
            <div key={segmentIndex} className={`space-y-3 rounded-[24px] border p-5 shadow-sm ${theme.subtle}`}>
              <div>
                <div className="mb-2 flex items-center gap-2">
                  <span className={`inline-flex h-8 w-8 items-center justify-center rounded-xl ${theme.badge}`}>
                    <Layers3 className="h-4 w-4" />
                  </span>
                  <h3 className="text-base font-semibold text-slate-900">
                  {uiText(`Segment ${segmentIndex + 1}`, `第 ${segmentIndex + 1} 段`, `第 ${segmentIndex + 1} 段`, `Segment ${segmentIndex + 1}`)}
                  </h3>
                </div>
                <p className="text-xs text-muted-foreground">
                  {uiText(
                    `Recall ${segment.length} item${segment.length > 1 ? "s" : ""} from this segment.`,
                    `请回忆这一段中的 ${segment.length} 个词语。`,
                    `請回憶呢一段入面嘅 ${segment.length} 個詞語。`,
                    `Rappelez ${segment.length} élément${segment.length > 1 ? "s" : ""} de ce segment.`,
                  )}
                </p>
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                {segment.map((_, index) => {
                  const answerIndex = answerOffset + index

                  return (
                    <div key={answerIndex} className="space-y-2">
                      <label className="text-sm font-medium">
                        {t("common.word")} {answerIndex + 1}:
                      </label>
                      <AssessmentInput
                        value={recallAnswers[answerIndex]}
                        onChange={(e) => handleRecallChange(answerIndex, e.target.value)}
                        className="h-12 w-full"
                      />
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}

        <div className="mt-8 flex justify-center space-x-4">
          <Button variant="outline" onClick={handleSkip}>
            {t("common.skip_task")}
          </Button>
          <Button onClick={checkAnswers} className="w-full max-w-xs">
            {t("memory.submit_recall")}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

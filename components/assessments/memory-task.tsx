"use client"

import { useState, useEffect } from "react"
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
  const [phase, setPhase] = useState<"countdown" | "presentation" | "recall">("countdown")
  const [countdown, setCountdown] = useState(10)
  const [currentWordIndex, setCurrentWordIndex] = useState(0)
  const fallbackWords = normalizeWords(words)
  const explicitWords = [...memoryWordSets[assessmentType][language]]
  const memoryWords = explicitWords.length === fallbackWords.length ? explicitWords : fallbackWords
  const splitIndex = Math.ceil(memoryWords.length / 2)
  const segmentedWords = [memoryWords.slice(0, splitIndex), memoryWords.slice(splitIndex)].filter((segment) => segment.length > 0)
  const [recallAnswers, setRecallAnswers] = useState<string[]>(new Array(memoryWords.length).fill(""))
  const uiText = (englishText: string, chineseText: string, cantoneseText?: string, frenchText?: string) =>
    localizeText(englishText, {
      zh: chineseText,
      yue: cantoneseText ?? chineseText,
      fr: frenchText,
    })

  useEffect(() => {
    setRecallAnswers(new Array(memoryWords.length).fill(""))
    setCountdown(10)
    setCurrentWordIndex(0)
    setPhase("countdown")
  }, [memoryWords.join("|")])

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
      if (currentWordIndex < memoryWords.length) {
        const timer = setTimeout(() => {
          setCurrentWordIndex(currentWordIndex + 1)
        }, 3000)
        return () => clearTimeout(timer)
      } else {
        setPhase("recall")
      }
    }
  }, [phase, currentWordIndex, memoryWords.length])

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
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <p className="text-sm text-muted-foreground">
            {t(instructionKey, { count: memoryWords.length })}
          </p>
          <InstructionAudio instructionKey={instructionKey} className="mt-2" />
        </CardHeader>
        <CardContent className="text-center space-y-6">
          <div className="text-4xl sm:text-6xl font-bold text-blue-600">{countdown}</div>
          <p className="text-base sm:text-lg">{t("memory.get_ready", { countdown })}</p>
          <Progress value={((10 - countdown) / 10) * 100} className="w-full" />
          <Button variant="outline" onClick={handleSkip}>
            {t("common.skip_task")}
          </Button>
        </CardContent>
      </Card>
    )
  }

  if (phase === "presentation") {
    return (
      <Card className="w-full max-w-2xl mx-auto shadow-xl border-2 border-blue-200">
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <p className="text-sm text-muted-foreground">
            {t("memory.word_of", { current: Math.min(currentWordIndex + 1, memoryWords.length), total: memoryWords.length })}
          </p>
        </CardHeader>
        <CardContent className="text-center space-y-6 flex flex-col items-center justify-center min-h-[300px]">
          {currentWordIndex < memoryWords.length ? (
            <>
              <div className="rounded-full bg-blue-50 px-4 py-1 text-xs font-semibold uppercase tracking-wide text-blue-700">
                {uiText(
                  `Segment ${currentWordIndex < splitIndex ? 1 : 2}`,
                  `第 ${currentWordIndex < splitIndex ? 1 : 2} 段`,
                  `第 ${currentWordIndex < splitIndex ? 1 : 2} 段`,
                  `Segment ${currentWordIndex < splitIndex ? 1 : 2}`,
                )}
              </div>
              <div className="text-6xl sm:text-7xl md:text-9xl font-black text-blue-800 py-12 animate-in fade-in zoom-in duration-300">
                {memoryWords[currentWordIndex]}
              </div>
              <Progress value={((currentWordIndex + 1) / memoryWords.length) * 100} className="w-full h-4" />
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
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>
          {title} - {t("memory.submit_recall")}
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          {t("memory.recall_instruction", { count: memoryWords.length })}
        </p>
        <InstructionAudio instructionKey="memory.recall_instruction" className="mt-2" />
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-xl border border-blue-100 bg-blue-50/50 p-4 text-sm text-blue-900">
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
            <div key={segmentIndex} className="space-y-3 rounded-xl border p-4">
              <div>
                <h3 className="text-base font-semibold text-slate-900">
                  {uiText(`Segment ${segmentIndex + 1}`, `第 ${segmentIndex + 1} 段`, `第 ${segmentIndex + 1} 段`, `Segment ${segmentIndex + 1}`)}
                </h3>
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
                        className="w-full"
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

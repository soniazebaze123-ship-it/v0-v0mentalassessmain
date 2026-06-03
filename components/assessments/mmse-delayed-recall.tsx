"use client"

import { useMemo, useState } from "react"
import { Brain } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AssessmentInput } from "@/components/ui/assessment-input"
import { Button } from "@/components/ui/button"
import { useLanguage } from "@/contexts/language-context"
import { InstructionAudio } from "@/components/ui/instruction-audio"

interface MMSEDelayedRecallProps {
  onComplete: (score: number) => void
  onSkip?: () => void
}

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
  const remaining = expectedWords.map((word) => word.toLowerCase().trim())
  let score = 0

  answers.forEach((answer) => {
    const normalized = answer.toLowerCase().trim()
    if (!normalized) {
      return
    }

    const found = remaining.findIndex((word) => word === normalized)
    if (found >= 0) {
      score += 1
      remaining.splice(found, 1)
    }
  })

  return score
}

export function MMSEDelayedRecall({ onComplete, onSkip }: MMSEDelayedRecallProps) {
  const { t, localizeText } = useLanguage()
  const words = useMemo(() => normalizeWords(t("memory.mmse.words")), [t])
  const [answers, setAnswers] = useState<string[]>(new Array(words.length).fill(""))

  const handleChange = (index: number, value: string) => {
    const next = [...answers]
    next[index] = value
    setAnswers(next)
  }

  const handleSubmit = () => {
    onComplete(countMatches(words, answers))
  }

  const handleSkip = () => {
    if (onSkip) {
      onSkip()
    } else {
      onComplete(0)
    }
  }

  return (
    <Card className="mx-auto w-full max-w-3xl overflow-hidden border border-teal-100/80 shadow-[0_24px_70px_rgba(13,148,136,0.12)]">
      <CardHeader className="bg-[radial-gradient(circle_at_top_left,_rgba(45,212,191,0.18),_transparent_30%),linear-gradient(135deg,_rgba(240,253,250,0.98),_rgba(255,255,255,0.98),_rgba(236,253,245,0.96))]">
        <div className="mb-3 flex items-center gap-2">
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-teal-100 text-teal-700 shadow-sm">
            <Brain className="h-5 w-5" />
          </span>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-teal-700/80">
              {localizeText("Delayed recall", {
                zh: "延迟回忆",
                yue: "延遲回憶",
                fr: "Rappel différé",
              })}
            </p>
            <CardTitle className="text-teal-900">{t("mmse.recall")}</CardTitle>
          </div>
        </div>
        <p className="text-sm text-slate-600">
          {t("mmse.recall.instruction")}
        </p>
        <InstructionAudio instructionKey="mmse.recall.instruction" className="mt-2" />
      </CardHeader>
      <CardContent className="space-y-5 pt-6">
        <div className="grid gap-3 md:grid-cols-3">
          {words.map((_, index) => (
            <div key={index} className="space-y-2">
              <label className="text-sm font-medium">
                {localizeText(`Word ${index + 1}`, { zh: `第 ${index + 1} 个词`, yue: `第 ${index + 1} 個詞`, fr: `Mot ${index + 1}` })}
              </label>
              <AssessmentInput
                value={answers[index]}
                onChange={(event) => handleChange(index, event.target.value)}
                className="h-11"
              />
            </div>
          ))}
        </div>

        <div className="flex justify-center space-x-4 pt-2">
          <Button variant="outline" onClick={handleSkip}>
            {t("common.skip_task")}
          </Button>
          <Button onClick={handleSubmit} className="w-full max-w-xs bg-gradient-to-r from-teal-600 to-emerald-500 hover:from-teal-700 hover:to-emerald-600">
            {t("common.submit")}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

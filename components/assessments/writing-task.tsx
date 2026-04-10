"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { useLanguage } from "@/contexts/language-context"
import { InstructionAudio } from "@/components/ui/instruction-audio"

interface WritingTaskProps {
  onComplete: (score: number) => void
  onSkip?: () => void
}

const SENTENCE_TEMPLATES = [
  { subjectKey: "mmse.writing.subject_1", predicateKey: "mmse.writing.predicate_1" },
  { subjectKey: "mmse.writing.subject_2", predicateKey: "mmse.writing.predicate_2" },
  { subjectKey: "mmse.writing.subject_3", predicateKey: "mmse.writing.predicate_3" },
]

function shuffleArray<T>(items: T[]) {
  const next = [...items]

  for (let index = next.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1))
    ;[next[index], next[swapIndex]] = [next[swapIndex], next[index]]
  }

  return next
}

export function WritingTask({ onComplete, onSkip }: WritingTaskProps) {
  const { t } = useLanguage()
  const [sentenceTemplate, setSentenceTemplate] = useState<(typeof SENTENCE_TEMPLATES)[number] | null>(null)
  const [availableParts, setAvailableParts] = useState<string[]>([])
  const [selectedParts, setSelectedParts] = useState<string[]>([])

  useEffect(() => {
    const initialTemplate = SENTENCE_TEMPLATES[Math.floor(Math.random() * SENTENCE_TEMPLATES.length)]
    setSentenceTemplate(initialTemplate)
    setAvailableParts(shuffleArray([initialTemplate.subjectKey, initialTemplate.predicateKey]))
  }, [])

  const handlePartSelect = (partKey: string) => {
    if (selectedParts.includes(partKey) || selectedParts.length >= 2) {
      return
    }

    setSelectedParts((previous) => [...previous, partKey])
  }

  const resetSelection = () => {
    setSelectedParts([])
  }

  const checkAnswer = () => {
    if (!sentenceTemplate) {
      return
    }

    const score =
      selectedParts[0] === sentenceTemplate.subjectKey && selectedParts[1] === sentenceTemplate.predicateKey ? 2 : 0

    onComplete(score)
  }

  const handleSkip = () => {
    if (onSkip) {
      onSkip()
    } else {
      onComplete(0)
    }
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>{t("mmse.writing")}</CardTitle>
        <p className="text-sm text-gray-600">{t("mmse.writing.instruction")}</p>
        <InstructionAudio instructionKey="mmse.writing.instruction" className="mt-2" />
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <Label>{t("question.write_sentence")}</Label>
          <p className="text-sm text-muted-foreground">{t("question.select_sentence_order")}</p>
          <div className="grid gap-3 sm:grid-cols-2">
            {availableParts.map((partKey) => (
              <Button
                key={partKey}
                type="button"
                variant={selectedParts.includes(partKey) ? "default" : "outline"}
                className="min-h-14 whitespace-normal text-base"
                onClick={() => handlePartSelect(partKey)}
              >
                {t(partKey)}
              </Button>
            ))}
          </div>
          <div className="rounded-lg border bg-muted/30 p-4">
            <p className="text-sm font-medium text-muted-foreground">{t("question.built_sentence")}</p>
            <p className="mt-2 min-h-7 text-lg font-medium">{selectedParts.map((partKey) => t(partKey)).join(" ")}</p>
          </div>
        </div>

        <div className="flex justify-center space-x-4">
          <Button variant="outline" onClick={handleSkip}>
            {t("common.skip_task")}
          </Button>
          <Button variant="outline" onClick={resetSelection}>
            {t("common.reset")}
          </Button>
          <Button onClick={checkAnswer} disabled={!sentenceTemplate || selectedParts.length !== 2} className="w-full max-w-xs">
            {t("common.submit")}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

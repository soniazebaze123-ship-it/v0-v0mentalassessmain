"use client"

import { useState } from "react"
import { PenLine, SpellCheck2 } from "lucide-react"
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

const DEFAULT_SENTENCE_TEMPLATE = SENTENCE_TEMPLATES[0]
const DEFAULT_AVAILABLE_PARTS = [DEFAULT_SENTENCE_TEMPLATE.predicateKey, DEFAULT_SENTENCE_TEMPLATE.subjectKey]

export function WritingTask({ onComplete, onSkip }: WritingTaskProps) {
  const { t, localizeText } = useLanguage()
  const [sentenceTemplate] = useState<(typeof SENTENCE_TEMPLATES)[number] | null>(DEFAULT_SENTENCE_TEMPLATE)
  const [availableParts] = useState<string[]>(DEFAULT_AVAILABLE_PARTS)
  const [selectedParts, setSelectedParts] = useState<string[]>([])

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
    if (!sentenceTemplate || selectedParts.length !== 2) {
      onComplete(0)
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
    <Card className="mx-auto w-full max-w-3xl overflow-hidden border border-indigo-100/80 shadow-[0_24px_70px_rgba(99,102,241,0.12)]">
      <CardHeader className="bg-[radial-gradient(circle_at_top_left,_rgba(129,140,248,0.18),_transparent_32%),linear-gradient(135deg,_rgba(238,242,255,0.98),_rgba(255,255,255,0.98),_rgba(224,231,255,0.96))] pb-6">
        <div className="mb-3 flex items-center gap-2 text-indigo-700">
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-100 shadow-sm">
            <PenLine className="h-5 w-5" />
          </span>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-indigo-600/80">
              {localizeText("Premium sentence builder", {
                zh: "高级造句任务",
                yue: "高級造句任務",
                fr: "Construction de phrase premium",
              })}
            </p>
            <CardTitle className="text-indigo-950">{t("mmse.writing")}</CardTitle>
          </div>
        </div>
        <p className="max-w-2xl text-sm text-slate-600">{t("mmse.writing.instruction")}</p>
        <InstructionAudio instructionKey="mmse.writing.instruction" className="mt-2" />
      </CardHeader>
      <CardContent className="space-y-6 pt-6">
        <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="space-y-4 rounded-[26px] border border-indigo-100 bg-indigo-50/70 p-5 shadow-sm">
            <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.16em] text-indigo-700">
              <SpellCheck2 className="h-4 w-4" />
              {localizeText("Compose the sentence", {
                zh: "组成句子",
                yue: "組成句子",
                fr: "Composez la phrase",
              })}
            </div>
            <Label className="text-base text-slate-900">{t("question.write_sentence")}</Label>
            <p className="text-sm leading-6 text-slate-600">{t("question.select_sentence_order")}</p>
            <div className="grid gap-3 sm:grid-cols-2">
            {availableParts.map((partKey) => (
              <Button
                key={partKey}
                type="button"
                variant={selectedParts.includes(partKey) ? "default" : "outline"}
                className="min-h-16 rounded-2xl whitespace-normal text-base"
                onClick={() => handlePartSelect(partKey)}
              >
                {t(partKey)}
              </Button>
            ))}
          </div>
          </div>

          <div className="space-y-4 rounded-[26px] border border-slate-200 bg-white p-5 shadow-sm">
            <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
              <p className="text-sm font-medium text-muted-foreground">{t("question.built_sentence")}</p>
              <p className="mt-3 min-h-20 text-2xl font-semibold text-slate-900">{selectedParts.map((partKey) => t(partKey)).join(" ")}</p>
            </div>
            <div className="rounded-2xl border border-indigo-100 bg-indigo-50/80 p-4 text-sm text-indigo-900">
              {localizeText(
                "Tap the subject first, then the matching predicate to form one complete sentence.",
                {
                  zh: "请先选择主语，再选择匹配的谓语，组成一个完整句子。",
                  yue: "請先揀主語，再揀相應謂語，組成一個完整句子。",
                  fr: "Touchez d’abord le sujet, puis le prédicat correspondant pour former une phrase complète.",
                },
              )}
            </div>
          </div>
        </div>

        <div className="flex justify-center space-x-4">
          <Button variant="outline" onClick={handleSkip}>
            {t("common.skip_task")}
          </Button>
          <Button variant="outline" onClick={resetSelection}>
            {t("common.reset")}
          </Button>
          <Button onClick={checkAnswer} className="w-full max-w-xs">
            {t("common.submit")}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

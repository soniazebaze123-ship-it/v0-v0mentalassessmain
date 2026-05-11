"use client"

import { useState } from "react"
import { Focus, ScanSearch, Sparkles } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AssessmentInput } from "@/components/ui/assessment-input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import Image from "next/image"
import { useLanguage } from "@/contexts/language-context"
import { InstructionAudio } from "@/components/ui/instruction-audio"

interface AttentionTaskProps {
  onComplete: (score: number) => void
  onSkip?: () => void
}

export function AttentionTask({ onComplete, onSkip }: AttentionTaskProps) {
  const { t, localizeText } = useLanguage()
  const [answer, setAnswer] = useState("")

  const checkAnswer = () => {
    const userAnswer = Number.parseInt(answer)
    const correctAnswer = 12
    const score = userAnswer === correctAnswer ? 6 : 0
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
    <Card className="mx-auto w-full max-w-4xl overflow-hidden border border-amber-100/80 shadow-[0_24px_70px_rgba(245,158,11,0.12)]">
      <CardHeader className="bg-[radial-gradient(circle_at_top_left,_rgba(251,191,36,0.20),_transparent_32%),linear-gradient(135deg,_rgba(255,251,235,0.98),_rgba(255,255,255,0.98),_rgba(255,247,237,0.96))] pb-6">
        <div className="mb-3 flex items-center gap-2 text-amber-700">
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-100 shadow-sm">
            <Focus className="h-5 w-5" />
          </span>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-600/80">
              {localizeText("Premium Focus Task", {
                zh: "高级专注任务",
                yue: "高級專注任務",
                fr: "Tâche d’attention premium",
              })}
            </p>
            <CardTitle className="text-amber-950">{t("moca.attention")}</CardTitle>
          </div>
        </div>
        <p className="max-w-2xl text-sm text-slate-600">{t("moca.attention.instruction")}</p>
        <InstructionAudio instructionKey="moca.attention.instruction" className="mt-2" />
      </CardHeader>
      <CardContent className="space-y-6 pt-6">
        <div className="grid gap-6 lg:grid-cols-[1.25fr_0.85fr]">
          <div className="overflow-hidden rounded-[26px] border border-amber-100 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-amber-100 bg-amber-50/70 px-4 py-3">
              <div className="flex items-center gap-2 text-sm font-medium text-amber-800">
                <ScanSearch className="h-4 w-4" />
                {localizeText("Visual scan panel", {
                  zh: "视觉扫描区",
                  yue: "視覺掃描區",
                  fr: "Zone de balayage visuel",
                })}
              </div>
              <div className="rounded-full bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-amber-700 shadow-sm">
                12
              </div>
            </div>
            <div className="relative h-[340px] w-full bg-gray-100 md:h-[420px]">
              <Image src="/images/dogs.png" alt="Multiple dogs in an image" fill className="object-cover" priority />
            </div>
          </div>

          <div className="space-y-4 rounded-[26px] border border-amber-100 bg-[linear-gradient(135deg,rgba(255,251,235,0.96),rgba(255,255,255,0.98))] p-5 shadow-sm">
            <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.16em] text-amber-700">
              <Sparkles className="h-4 w-4" />
              {localizeText("Response station", {
                zh: "作答区",
                yue: "作答區",
                fr: "Zone de réponse",
              })}
            </div>

            <div className="rounded-2xl border border-white/80 bg-white/90 p-4 shadow-sm">
              <Label htmlFor="dog-count" className="text-base font-semibold text-slate-900">
                {localizeText("How many dogs do you see?", {
                  zh: "您看见多少只狗？",
                  yue: "你見到幾多隻狗？",
                  fr: "Combien de chiens voyez-vous ?",
                })}
              </Label>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                {localizeText(
                  "Count all of the dogs in the image, then enter the total below.",
                  {
                    zh: "请数清图片中的所有狗，然后在下方输入总数。",
                    yue: "請數清圖片入面所有狗，然後喺下面輸入總數。",
                    fr: "Comptez tous les chiens dans l’image, puis entrez le total ci-dessous.",
                  },
                )}
              </p>
              <AssessmentInput
                id="dog-count"
                type="number"
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                placeholder=""
                className="mt-4 h-14 w-full text-center text-2xl font-semibold"
                min="0"
              />
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
              <div className="rounded-2xl border border-amber-100 bg-amber-50/80 p-4 text-sm text-amber-900">
                {localizeText(
                  "This task checks focused visual attention and simple quantity tracking.",
                  {
                    zh: "该任务评估视觉专注力与基础数量追踪能力。",
                    yue: "呢個任務會評估視覺專注力同基本數量追蹤能力。",
                    fr: "Cette tâche évalue l’attention visuelle ciblée et le suivi simple des quantités.",
                  },
                )}
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
                {localizeText(
                  "Take a second look before submitting if the count feels uncertain.",
                  {
                    zh: "如果不太确定，请在提交前再看一遍。",
                    yue: "如果唔太肯定，提交之前可以再睇一次。",
                    fr: "Si le compte vous semble incertain, vérifiez une seconde fois avant d’envoyer.",
                  },
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-center space-x-4">
          <Button variant="outline" onClick={handleSkip}>
            {t("common.skip_task")}
          </Button>
          <Button onClick={checkAnswer} className="w-full max-w-xs">
            {t("common.submit")}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

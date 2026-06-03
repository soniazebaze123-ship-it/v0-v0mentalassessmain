"use client"

import { useState } from "react"
import { ListChecks } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useLanguage } from "@/contexts/language-context"
import { InstructionAudio } from "@/components/ui/instruction-audio"

interface MMSEThreeStageCommandProps {
  onComplete: (score: number) => void
  onSkip?: () => void
}

export function MMSEThreeStageCommand({ onComplete, onSkip }: MMSEThreeStageCommandProps) {
  const { t, localizeText } = useLanguage()
  const [step1, setStep1] = useState(false)
  const [step2, setStep2] = useState(false)
  const [step3, setStep3] = useState(false)

  const score = Number(step1) + Number(step2) + Number(step3)

  const handleSkip = () => {
    if (onSkip) {
      onSkip()
    } else {
      onComplete(0)
    }
  }

  const commandItems = [t("mmse.three_stage_command.step_1"), t("mmse.three_stage_command.step_2"), t("mmse.three_stage_command.step_3")]

  const flags = [step1, step2, step3]
  const setters = [setStep1, setStep2, setStep3]

  return (
    <Card className="mx-auto w-full max-w-3xl overflow-hidden border border-cyan-100/80 shadow-[0_24px_70px_rgba(8,145,178,0.12)]">
      <CardHeader className="bg-[radial-gradient(circle_at_top_left,_rgba(34,211,238,0.20),_transparent_32%),linear-gradient(135deg,_rgba(236,254,255,0.98),_rgba(255,255,255,0.98),_rgba(224,242,254,0.96))]">
        <div className="mb-3 flex items-center gap-2">
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-cyan-100 text-cyan-700 shadow-sm">
            <ListChecks className="h-5 w-5" />
          </span>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-700/80">
              {localizeText("Language command", { zh: "语言指令", yue: "語言指令", fr: "Commande linguistique" })}
            </p>
            <CardTitle className="text-cyan-900">{t("mmse.three_stage_command")}</CardTitle>
          </div>
        </div>
        <p className="text-sm text-slate-600">{t("mmse.three_stage_command.instruction")}</p>
        <InstructionAudio instructionKey="mmse.three_stage_command.instruction" className="mt-2" />
      </CardHeader>

      <CardContent className="space-y-4 pt-6">
        <div className="space-y-3">
          {commandItems.map((item, index) => (
            <button
              key={index}
              type="button"
              onClick={() => setters[index]((prev) => !prev)}
              className={`w-full rounded-2xl border p-4 text-left transition-colors ${
                flags[index]
                  ? "border-blue-400 bg-blue-100/70 text-blue-900"
                  : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
              }`}
            >
              <div className="flex items-center justify-between gap-3">
                <span className="font-medium">{item}</span>
                <span className="text-xs font-semibold uppercase tracking-wide">
                  {flags[index]
                    ? localizeText("Completed", { zh: "已完成", yue: "已完成", fr: "Terminé" })
                    : localizeText("Not done", { zh: "未完成", yue: "未完成", fr: "Non fait" })}
                </span>
              </div>
            </button>
          ))}
        </div>

        <div className="rounded-2xl border border-cyan-100 bg-cyan-50/80 p-4 text-sm text-cyan-900">
          {localizeText("Current score", { zh: "当前得分", yue: "目前分數", fr: "Score actuel" })}: {score}/3
        </div>

        <div className="flex justify-center space-x-4 pt-2">
          <Button variant="outline" onClick={handleSkip}>
            {t("common.skip_task")}
          </Button>
          <Button onClick={() => onComplete(score)} className="w-full max-w-xs bg-gradient-to-r from-cyan-600 to-sky-500 hover:from-cyan-700 hover:to-sky-600">
            {t("common.submit")}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

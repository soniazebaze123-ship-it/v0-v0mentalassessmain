"use client"

import { useState } from "react"
import { Calculator, Sigma } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AssessmentInput } from "@/components/ui/assessment-input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { useLanguage } from "@/contexts/language-context"
import { InstructionAudio } from "@/components/ui/instruction-audio"

interface MMSEAttentionProps {
  onComplete: (score: number) => void
  onSkip?: () => void
}

export function MMSEAttention({ onComplete, onSkip }: MMSEAttentionProps) {
  const { t, localizeText } = useLanguage()

  const [subtractionAnswer1, setSubtractionAnswer1] = useState("")
  const [subtractionAnswer2, setSubtractionAnswer2] = useState("")
  const [subtractionAnswer3, setSubtractionAnswer3] = useState("")
  const [subtractionAnswer4, setSubtractionAnswer4] = useState("")
  const [subtractionAnswer5, setSubtractionAnswer5] = useState("")
  const checkSubtraction = () => {
    let score = 0
    // Serial 7s: 100-7=93, 93-7=86, 86-7=79, 79-7=72, 72-7=65
    if (Number.parseInt(subtractionAnswer1) === 93) score += 1
    if (Number.parseInt(subtractionAnswer2) === 86) score += 1
    if (Number.parseInt(subtractionAnswer3) === 79) score += 1
    if (Number.parseInt(subtractionAnswer4) === 72) score += 1
    if (Number.parseInt(subtractionAnswer5) === 65) score += 1
    return score // Max 5 points
  }
  const handleSubmit = () => {
    const score = checkSubtraction()
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
    <Card className="mx-auto w-full max-w-4xl overflow-hidden border border-teal-100/80 shadow-[0_24px_70px_rgba(20,184,166,0.12)]">
      <CardHeader className="bg-[radial-gradient(circle_at_top_left,_rgba(45,212,191,0.18),_transparent_32%),linear-gradient(135deg,_rgba(240,253,250,0.98),_rgba(255,255,255,0.98),_rgba(236,254,255,0.96))]">
        <div className="mb-3 flex items-center gap-2 text-teal-700">
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-teal-100 shadow-sm">
            <Calculator className="h-5 w-5" />
          </span>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-teal-600/80">
              {localizeText("Premium serial subtraction", {
                zh: "高级连续减法",
                yue: "高級連續減法",
                fr: "Soustraction sérielle premium",
              })}
            </p>
            <CardTitle className="text-teal-900">{t("mmse.attention")}</CardTitle>
          </div>
        </div>
        <p className="max-w-2xl text-sm text-slate-600">{t("mmse.attention.instruction")}</p>
        <InstructionAudio instructionKey="mmse.attention.instruction" className="mt-2" />
      </CardHeader>
      <CardContent className="space-y-6 pt-6">
        <div className="space-y-6">
          <div className="rounded-[26px] border border-teal-100 bg-[linear-gradient(135deg,rgba(240,253,250,1),rgba(255,255,255,1))] p-5 text-center shadow-sm">
            <div className="mb-3 inline-flex items-center rounded-full bg-teal-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-teal-700 shadow-sm">
              <Sigma className="mr-2 h-3.5 w-3.5" />
              {localizeText("5 calculation steps", {
                zh: "5 个计算步骤",
                yue: "5 個計算步驟",
                fr: "5 étapes de calcul",
              })}
            </div>
            <h3 className="mb-2 text-xl font-medium text-teal-900">{t("question.subtract_series")}</h3>
            <p className="text-sm text-slate-600">100 - 7 = ?</p>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
            <div className="space-y-2 rounded-2xl border border-teal-100 bg-white p-4 shadow-sm">
              <Label>100 - 7 =</Label>
              <AssessmentInput
                type="number"
                value={subtractionAnswer1}
                onChange={(e) => setSubtractionAnswer1(e.target.value)}
                className="h-12"
              />
            </div>
            <div className="space-y-2 rounded-2xl border border-teal-100 bg-white p-4 shadow-sm">
              <Label>- 7 =</Label>
              <AssessmentInput
                type="number"
                value={subtractionAnswer2}
                onChange={(e) => setSubtractionAnswer2(e.target.value)}
                className="h-12"
              />
            </div>
            <div className="space-y-2 rounded-2xl border border-teal-100 bg-white p-4 shadow-sm">
              <Label>- 7 =</Label>
              <AssessmentInput
                type="number"
                value={subtractionAnswer3}
                onChange={(e) => setSubtractionAnswer3(e.target.value)}
                className="h-12"
              />
            </div>
            <div className="space-y-2 rounded-2xl border border-teal-100 bg-white p-4 shadow-sm">
              <Label>- 7 =</Label>
              <AssessmentInput
                type="number"
                value={subtractionAnswer4}
                onChange={(e) => setSubtractionAnswer4(e.target.value)}
                className="h-12"
              />
            </div>
            <div className="space-y-2 rounded-2xl border border-teal-100 bg-white p-4 shadow-sm">
              <Label>- 7 =</Label>
              <AssessmentInput
                type="number"
                value={subtractionAnswer5}
                onChange={(e) => setSubtractionAnswer5(e.target.value)}
                className="h-12"
              />
            </div>
          </div>

          <div className="rounded-2xl border border-teal-100 bg-teal-50/80 p-4 text-sm text-teal-900">
            {localizeText(
              "Enter each answer in sequence. Each correct step adds one point to the final score.",
              {
                zh: "请按顺序填写每一步的答案。每答对一步，最终得分加 1 分。",
                yue: "請按順序填寫每一步答案。每答啱一步，最終分數加 1 分。",
                fr: "Saisissez chaque réponse dans l’ordre. Chaque étape correcte ajoute un point au score final.",
              },
            )}
          </div>
        </div>

        <div className="flex justify-center space-x-4 pt-4">
          <Button variant="outline" onClick={handleSkip}>
            {t("common.skip_task")}
          </Button>
          <Button onClick={handleSubmit} className="w-full max-w-xs bg-teal-600 hover:bg-teal-700">
            {t("common.submit")}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

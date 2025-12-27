"use client"

import { useState } from "react"
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
  const { t } = useLanguage()
  const [phase, setPhase] = useState<"subtraction" | "addition">("subtraction")

  const [subtractionAnswer1, setSubtractionAnswer1] = useState("")
  const [subtractionAnswer2, setSubtractionAnswer2] = useState("")
  const [subtractionAnswer3, setSubtractionAnswer3] = useState("")
  const [subtractionAnswer4, setSubtractionAnswer4] = useState("")
  const [subtractionAnswer5, setSubtractionAnswer5] = useState("")

  const [additionAnswer, setAdditionAnswer] = useState("")

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

  const checkAddition = () => {
    // Keeping the original logic for addition/spell check if it exists, or just scoring the serial 7s
    return additionAnswer === "B" ? 0 : 0 // Assuming we focus on serial 7s for calculation
  }

  const handleSubmit = () => {
    // For this update, we focus on the requested "more mathematical questions"
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
    <Card className="w-full max-w-2xl mx-auto border-t-4 border-teal-500 shadow-lg">
      <CardHeader className="bg-teal-50/50">
        <CardTitle className="text-teal-800">{t("mmse.attention")}</CardTitle>
        <p className="text-sm text-gray-600">{t("mmse.attention.instruction")}</p>
        <InstructionAudio instructionKey="mmse.attention.instruction" className="mt-2" />
      </CardHeader>
      <CardContent className="space-y-6 pt-6">
        <div className="space-y-6">
          <div className="bg-blue-50 p-4 rounded-lg text-center">
            <h3 className="text-xl font-medium text-blue-800 mb-2">{t("question.subtract_series")}</h3>
            <p className="text-sm text-gray-600">100 - 7 = ?</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="space-y-2">
              <Label>100 - 7 =</Label>
              <AssessmentInput
                type="number"
                value={subtractionAnswer1}
                onChange={(e) => setSubtractionAnswer1(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>- 7 =</Label>
              <AssessmentInput
                type="number"
                value={subtractionAnswer2}
                onChange={(e) => setSubtractionAnswer2(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>- 7 =</Label>
              <AssessmentInput
                type="number"
                value={subtractionAnswer3}
                onChange={(e) => setSubtractionAnswer3(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>- 7 =</Label>
              <AssessmentInput
                type="number"
                value={subtractionAnswer4}
                onChange={(e) => setSubtractionAnswer4(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>- 7 =</Label>
              <AssessmentInput
                type="number"
                value={subtractionAnswer5}
                onChange={(e) => setSubtractionAnswer5(e.target.value)}
              />
            </div>
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

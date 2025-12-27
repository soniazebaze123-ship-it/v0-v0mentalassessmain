"use client"

import { useState } from "react"
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
  const { t } = useLanguage()
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
    <Card className="w-full max-w-3xl mx-auto">
      <CardHeader>
        <CardTitle>{t("moca.attention")}</CardTitle>
        <p className="text-sm text-gray-600">{t("moca.attention.instruction")}</p>
        <InstructionAudio instructionKey="moca.attention.instruction" className="mt-2" />
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="relative w-full h-96 bg-gray-100 rounded-lg overflow-hidden">
          <Image src="/images/dogs.png" alt="Multiple dogs in an image" fill className="object-cover" />
        </div>

        <div className="space-y-4">
          <Label htmlFor="dog-count">{t("question.dogs")}</Label>
          <AssessmentInput
            id="dog-count"
            type="number"
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            placeholder=""
            className="w-full max-w-xs"
            min="0"
          />
        </div>

        <div className="flex justify-center space-x-4">
          <Button variant="outline" onClick={handleSkip}>
            {t("common.skip_task")}
          </Button>
          <Button onClick={checkAnswer} disabled={answer.trim() === ""} className="w-full max-w-xs">
            {t("common.submit")}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import Image from "next/image"
import { useLanguage } from "@/contexts/language-context"
import { InstructionAudio } from "@/components/ui/instruction-audio"

interface CopyingDesignProps {
  onComplete: (score: number) => void
  onSkip?: () => void
}

export function CopyingDesign({ onComplete, onSkip }: CopyingDesignProps) {
  const { t } = useLanguage()
  const [answer, setAnswer] = useState("")

  const checkAnswer = () => {
    const score = answer === "B" ? 3 : 0
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
        <CardTitle>{t("mmse.copying")}</CardTitle>
        <p className="text-sm text-gray-600">{t("mmse.copying.instruction")}</p>
        <InstructionAudio instructionKey="mmse.copying.instruction" className="mt-2" />
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex justify-center">
          <div className="relative w-64 h-64 bg-gray-100 rounded-lg overflow-hidden">
            <Image src="/images/pentagon.png" alt="Pentagon shape" fill className="object-contain" />
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-medium text-center">{t("question.angles")}</h3>

          <RadioGroup value={answer} onValueChange={setAnswer}>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="A" id="option-a" />
              <Label htmlFor="option-a">(A) 5</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="B" id="option-b" />
              <Label htmlFor="option-b">(B) 6</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="C" id="option-c" />
              <Label htmlFor="option-c">(C) 7</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="D" id="option-d" />
              <Label htmlFor="option-d">(D) 8</Label>
            </div>
          </RadioGroup>
        </div>

        <div className="flex justify-center space-x-4">
          <Button variant="outline" onClick={handleSkip}>
            {t("common.skip_task")}
          </Button>
          <Button onClick={checkAnswer} disabled={answer === ""} className="w-full max-w-xs">
            {t("common.submit")}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

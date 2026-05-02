"use client"

import { useState } from "react"
import Image from "next/image"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useLanguage } from "@/contexts/language-context"
import { InstructionAudio } from "@/components/ui/instruction-audio"

interface AnimalNamingProps {
  onComplete: (score: number) => void
  onSkip?: () => void
}

interface AnimalQuestion {
  image: string
  answerKey: string
  optionKeys: string[]
}

const ANIMAL_POOL = [
  { image: "/images/house.png", labelKey: "common.house" },
  { image: "/images/bag.png", labelKey: "common.bag" },
  { image: "/images/tv.png", labelKey: "common.tv" },
]

function buildAnimalQuestions(): AnimalQuestion[] {
  return ANIMAL_POOL.map((animal, index) => {
    const distractor = ANIMAL_POOL[(index + 1) % ANIMAL_POOL.length]

    return {
      image: animal.image,
      answerKey: animal.labelKey,
      optionKeys: index % 2 === 0 ? [animal.labelKey, distractor.labelKey] : [distractor.labelKey, animal.labelKey],
    }
  })
}

export function AnimalNaming({ onComplete, onSkip }: AnimalNamingProps) {
  const { t } = useLanguage()
  const [questions] = useState<AnimalQuestion[]>(buildAnimalQuestions)
  const [selectedAnswers, setSelectedAnswers] = useState<string[]>(Array(buildAnimalQuestions().length).fill(""))

  const handleAnswerSelect = (index: number, optionKey: string) => {
    setSelectedAnswers((previous) => previous.map((value, valueIndex) => (valueIndex === index ? optionKey : value)))
  }

  const checkAnswers = () => {
    const score = questions.reduce((total, question, index) => {
      return total + (selectedAnswers[index] === question.answerKey ? 1 : 0)
    }, 0)

    onComplete(score)
  }

  const handleSkip = () => {
    if (onSkip) {
      onSkip()
      return
    }

    onComplete(0)
  }

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>{t("moca.naming")}</CardTitle>
        <p className="text-sm text-gray-600">{t("moca.naming.instruction")}</p>
        <InstructionAudio instructionKey="moca.naming.instruction" className="mt-2" />
      </CardHeader>
      <CardContent>
        <div className="grid md:grid-cols-3 gap-6">
          {questions.map((question, index) => (
            <div key={question.image} className="space-y-4 rounded-xl border bg-background p-4">
              <div className="relative h-48 w-full overflow-hidden rounded-lg bg-gray-100">
                <Image src={question.image} alt={t(question.answerKey)} fill className="object-contain bg-white p-2" priority />
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">{t("question.tap_correct_name")}</p>
                <div className="grid gap-2">
                  {question.optionKeys.map((optionKey) => (
                    <Button
                      key={optionKey}
                      type="button"
                      variant={selectedAnswers[index] === optionKey ? "default" : "outline"}
                      className="w-full justify-center"
                      onClick={() => handleAnswerSelect(index, optionKey)}
                    >
                      {t(optionKey)}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 flex justify-center space-x-4">
          <Button variant="outline" onClick={handleSkip}>
            {t("common.skip_task")}
          </Button>
          <Button
            onClick={checkAnswers}
            disabled={!questions.length || selectedAnswers.some((answer) => answer === "")}
            className="w-full max-w-xs"
          >
            {t("common.submit")}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

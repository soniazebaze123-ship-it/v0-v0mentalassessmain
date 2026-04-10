"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useLanguage } from "@/contexts/language-context"
import { InstructionAudio } from "@/components/ui/instruction-audio"

interface ObjectNamingProps {
  onComplete: (score: number) => void
  onSkip?: () => void
}

interface ObjectQuestion {
  image: string
  answerKey: string
  optionKeys: string[]
}

const ITEM_POOL = [
  { image: "/images/rice.svg", labelKey: "common.rice" },
  { image: "/images/noodles.svg", labelKey: "common.noodles" },
  { image: "/images/milk.svg", labelKey: "common.milk" },
  { image: "/images/chicken.svg", labelKey: "common.chicken" },
  { image: "/images/fish.svg", labelKey: "common.fish" },
  { image: "/images/egg.svg", labelKey: "common.egg" },
]

function shuffleArray<T>(items: T[]) {
  const next = [...items]

  for (let index = next.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1))
    ;[next[index], next[swapIndex]] = [next[swapIndex], next[index]]
  }

  return next
}

function buildObjectQuestions(): ObjectQuestion[] {
  const selectedItems = shuffleArray(ITEM_POOL).slice(0, 3)

  return selectedItems.map((item) => {
    const distractorPool = ITEM_POOL.filter((candidate) => candidate.labelKey !== item.labelKey)
    const distractor = distractorPool[Math.floor(Math.random() * distractorPool.length)]

    return {
      image: item.image,
      answerKey: item.labelKey,
      optionKeys: shuffleArray([item.labelKey, distractor.labelKey]),
    }
  })
}

export function ObjectNaming({ onComplete, onSkip }: ObjectNamingProps) {
  const { t } = useLanguage()
  const [questions, setQuestions] = useState<ObjectQuestion[]>([])
  const [selectedAnswers, setSelectedAnswers] = useState<string[]>([])

  useEffect(() => {
    const initialQuestions = buildObjectQuestions()
    setQuestions(initialQuestions)
    setSelectedAnswers(Array(initialQuestions.length).fill(""))
  }, [])

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
        <CardTitle>{t("mmse.naming")}</CardTitle>
        <p className="text-sm text-muted-foreground">{t("mmse.naming.instruction")}</p>
        <InstructionAudio instructionKey="mmse.naming.instruction" className="mt-2" />
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {questions.map((question, index) => (
            <div key={`${question.image}-${index}`} className="space-y-4 rounded-xl border bg-background p-4">
              <div className="h-48 w-full overflow-hidden rounded-lg bg-gray-100">
                <img src={question.image} alt={t(question.answerKey)} className="h-full w-full object-contain bg-white p-2" />
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

        <div className="mt-8 flex flex-col sm:flex-row justify-center items-center space-y-4 sm:space-y-0 sm:space-x-4">
          <Button variant="outline" onClick={handleSkip} className="w-full sm:w-auto bg-transparent">
            {t("common.skip_task")}
          </Button>
          <Button
            onClick={checkAnswers}
            disabled={!questions.length || selectedAnswers.some((answer) => answer === "")}
            className="w-full sm:w-auto sm:max-w-xs"
          >
            {t("common.submit")}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

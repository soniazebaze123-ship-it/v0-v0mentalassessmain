"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AssessmentInput } from "@/components/ui/assessment-input"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { useLanguage } from "@/contexts/language-context"
import { InstructionAudio } from "@/components/ui/instruction-audio"

interface MemoryTaskProps {
  onComplete: (score: number) => void
  onSkip?: () => void
  words: string[]
  title: string
}

export function MemoryTask({ onComplete, onSkip, words, title }: MemoryTaskProps) {
  const { t, language } = useLanguage()
  const [phase, setPhase] = useState<"countdown" | "presentation" | "recall">("countdown")
  const [countdown, setCountdown] = useState(10)
  const [currentWordIndex, setCurrentWordIndex] = useState(0)
  const [recallAnswers, setRecallAnswers] = useState<string[]>(new Array(words.length).fill(""))

  // Get localized words
  const localizedWords =
    language === "zh"
      ? title.includes("MoCA")
        ? ["脸", "天鹅绒", "教堂", "雏菊", "红色"]
        : ["苹果", "桌子", "硬币"]
      : words

  // Countdown phase
  useEffect(() => {
    if (phase === "countdown" && countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000)
      return () => clearTimeout(timer)
    } else if (phase === "countdown" && countdown === 0) {
      setPhase("presentation")
    }
  }, [phase, countdown])

  // Word presentation phase
  useEffect(() => {
    if (phase === "presentation") {
      if (currentWordIndex < localizedWords.length) {
        const timer = setTimeout(() => {
          setCurrentWordIndex(currentWordIndex + 1)
        }, 3000)
        return () => clearTimeout(timer)
      } else {
        setPhase("recall")
      }
    }
  }, [phase, currentWordIndex, localizedWords.length])

  const handleRecallChange = (index: number, value: string) => {
    const newAnswers = [...recallAnswers]
    newAnswers[index] = value
    setRecallAnswers(newAnswers)
  }

  const checkAnswers = () => {
    let score = 0
    localizedWords.forEach((word, index) => {
      const userAnswer = recallAnswers[index].toLowerCase().trim()
      if (userAnswer === word.toLowerCase()) {
        score += 1
      }
    })
    onComplete(score)
  }

  const handleSkip = () => {
    if (onSkip) {
      onSkip()
    } else {
      onComplete(0)
    }
  }

  if (phase === "countdown") {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <p className="text-sm text-muted-foreground">
            {t("moca.memory.instruction", { count: localizedWords.length })}
          </p>
          <InstructionAudio instructionKey="moca.memory.instruction" className="mt-2" />
        </CardHeader>
        <CardContent className="text-center space-y-6">
          <div className="text-4xl sm:text-6xl font-bold text-blue-600">{countdown}</div>
          <p className="text-base sm:text-lg">{t("memory.get_ready", { countdown })}</p>
          <Progress value={((10 - countdown) / 10) * 100} className="w-full" />
          <Button variant="outline" onClick={handleSkip}>
            {t("common.skip_task")}
          </Button>
        </CardContent>
      </Card>
    )
  }

  if (phase === "presentation") {
    return (
      <Card className="w-full max-w-2xl mx-auto shadow-xl border-2 border-blue-200">
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <p className="text-sm text-muted-foreground">
            {t("memory.word_of", { current: currentWordIndex + 1, total: localizedWords.length })}
          </p>
        </CardHeader>
        <CardContent className="text-center space-y-6 flex flex-col items-center justify-center min-h-[300px]">
          {currentWordIndex < localizedWords.length ? (
            <>
              <div className="text-6xl sm:text-7xl md:text-9xl font-black text-blue-800 py-12 animate-in fade-in zoom-in duration-300">
                {localizedWords[currentWordIndex]}
              </div>
              <Progress value={((currentWordIndex + 1) / localizedWords.length) * 100} className="w-full h-4" />
            </>
          ) : (
            <div className="text-lg sm:text-2xl text-muted-foreground py-8 sm:py-12">
              {t("memory.preparing_recall")}
            </div>
          )}
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>
          {title} - {t("mmse.registration")}
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          {t("memory.recall_instruction", { count: localizedWords.length })}
        </p>
        <InstructionAudio instructionKey="memory.recall_instruction" className="mt-2" />
      </CardHeader>
      <CardContent className="space-y-4">
        {localizedWords.map((_, index) => (
          <div key={index} className="space-y-2">
            <label className="text-sm font-medium">
              {t("common.word")} {index + 1}:
            </label>
            <AssessmentInput
              value={recallAnswers[index]}
              onChange={(e) => handleRecallChange(index, e.target.value)}
              className="w-full"
            />
          </div>
        ))}

        <div className="mt-8 flex justify-center space-x-4">
          <Button variant="outline" onClick={handleSkip}>
            {t("common.skip_task")}
          </Button>
          <Button
            onClick={checkAnswers}
            disabled={recallAnswers.some((answer) => answer.trim() === "")}
            className="w-full max-w-xs"
          >
            {t("memory.submit_recall")}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

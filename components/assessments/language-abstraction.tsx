"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AssessmentInput } from "@/components/ui/assessment-input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Volume2, VolumeX } from "lucide-react"
import { useLanguage } from "@/contexts/language-context"
import { InstructionAudio } from "@/components/ui/instruction-audio"

interface LanguageAbstractionProps {
  onComplete: (score: number) => void
  onSkip?: () => void
}

export function LanguageAbstraction({ onComplete, onSkip }: LanguageAbstractionProps) {
  const { t, language, getSpeechLanguage } = useLanguage()
  const [phase, setPhase] = useState<"repetition" | "similarity">("repetition")
  const [repetitionAnswer, setRepetitionAnswer] = useState("")
  const [similarityAnswer, setSimilarityAnswer] = useState("")
  const [isPlaying, setIsPlaying] = useState(false)
  const [hasPlayedAudio, setHasPlayedAudio] = useState(false)

  const getSpeechText = () => {
    // Simplified sentences for MoCA Language Abstraction - easier for elderly patients
    const sentences = {
      en: "The cat sat under the table waiting for dinner",
      zh: "他去商店买东西",
      yue: "佢去商店買嘢",
      fr: "Le chat est assis sous la table en attendant le dîner",
    }
    return sentences[language] || sentences.en
  }

  const getCorrectAnswer = () => {
    const answers = {
      en: "the cat sat under the table waiting for dinner",
      zh: "他去商店买东西",
      yue: "佢去商店買嘢",
      fr: "le chat est assis sous la table en attendant le dîner",
    }
    return answers[language] || answers.en
  }

  const playAudio = () => {
    if (!("speechSynthesis" in window)) {
      alert(t("audio.not_supported"))
      return
    }

    // Stop any currently playing speech
    window.speechSynthesis.cancel()

    const textToSpeak = getSpeechText()
    const utterance = new SpeechSynthesisUtterance(textToSpeak)
    utterance.lang = getSpeechLanguage(language)
    utterance.rate = 0.7 // Slower for better comprehension in assessments
    utterance.pitch = 1.0

    // Try to find a native voice for the language
    const voices = window.speechSynthesis.getVoices()
    const languageCode = getSpeechLanguage(language)
    const preferredVoice = voices.find(
      (voice) => voice.lang === languageCode || voice.lang.startsWith(languageCode.split("-")[0]),
    )

    if (preferredVoice) {
      utterance.voice = preferredVoice
    }

    utterance.onstart = () => setIsPlaying(true)
    utterance.onend = () => {
      setIsPlaying(false)
      setHasPlayedAudio(true)
    }
    utterance.onerror = () => {
      alert(t("audio.error_playing") || "Error playing audio.")
      setIsPlaying(false)
    }

    window.speechSynthesis.speak(utterance)
  }

  const checkRepetition = () => {
    const actualTargetSentence = getCorrectAnswer()
    const userAnswer = repetitionAnswer.toLowerCase().trim()
    const correctAnswer = actualTargetSentence.toLowerCase()

    // More flexible matching for different languages
    const similarity = calculateSimilarity(userAnswer, correctAnswer)
    return similarity > 0.8 ? 2 : similarity > 0.6 ? 1 : 0
  }

  const calculateSimilarity = (str1: string, str2: string): number => {
    const words1 = str1.split(/\s+/)
    const words2 = str2.split(/\s+/)
    const maxLength = Math.max(words1.length, words2.length)

    if (maxLength === 0) return 1

    let matches = 0
    words1.forEach((word1) => {
      if (words2.some((word2) => word2.includes(word1) || word1.includes(word2))) {
        matches++
      }
    })

    return matches / maxLength
  }

  const checkSimilarity = () => {
    const score = similarityAnswer === "C" ? 2 : 0
    return score
  }

  const handleSubmit = () => {
    if (phase === "repetition") {
      setPhase("similarity")
    } else {
      const repetitionScore = checkRepetition()
      const similarityScore = checkSimilarity()
      const totalScore = repetitionScore + similarityScore
      onComplete(totalScore)
    }
  }

  const handleSkip = () => {
    if (onSkip) {
      onSkip()
    } else {
      onComplete(0)
    }
  }

  if (phase === "repetition") {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center justify-between flex-wrap gap-4">
            <span>
              {t("moca.language")} - {t("mmse.repetition")}
            </span>
            <InstructionAudio instructionKey="moca.language.instruction" />
          </CardTitle>
          <p className="text-sm text-muted-foreground">{t("mmse.repetition.instruction")}</p>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center space-y-4">
            <Button
              onClick={playAudio}
              disabled={isPlaying}
              className="w-full max-w-xs touch-manipulation min-h-[44px] bg-transparent"
              variant="outline"
            >
              {isPlaying ? (
                <>
                  <VolumeX className="w-4 h-4 mr-2" />
                  {t("audio.playing")}
                </>
              ) : (
                <>
                  <Volume2 className="w-4 h-4 mr-2" />
                  {t("audio.play")}
                </>
              )}
            </Button>

            {hasPlayedAudio && (
              <p className="text-sm text-green-600 dark:text-green-400">✓ {t("audio.played_success")}</p>
            )}
          </div>

          <div className="space-y-4">
            <Label htmlFor="repetition" className="text-base font-medium">
              {t("question.type_sentence")}
            </Label>
            <AssessmentInput
              id="repetition"
              value={repetitionAnswer}
              onChange={(e) => setRepetitionAnswer(e.target.value)}
              placeholder=""
              className="w-full text-base min-h-[44px] touch-manipulation"
              disabled={!hasPlayedAudio}
            />
          </div>

          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Button
              variant="outline"
              onClick={handleSkip}
              className="touch-manipulation min-h-[44px] order-2 sm:order-1 bg-transparent"
            >
              {t("common.skip_task")}
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!hasPlayedAudio || repetitionAnswer.trim() === ""}
              className="w-full max-w-xs touch-manipulation min-h-[44px] order-1 sm:order-2"
            >
              {t("common.next")}: {t("question.similarity")}
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center justify-between flex-wrap gap-4">
          <span>
            {t("moca.language")} - {t("question.similarity")}
          </span>
          <InstructionAudio instructionKey="question.similarity" />
        </CardTitle>
        <p className="text-sm text-muted-foreground">{t("mmse.attention.instruction")}</p>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <h3 className="text-lg font-medium">{t("question.similarity")}</h3>

          <RadioGroup value={similarityAnswer} onValueChange={setSimilarityAnswer} className="space-y-3">
            <div className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-accent/50 touch-manipulation min-h-[44px]">
              <RadioGroupItem value="A" id="option-a" className="touch-manipulation" />
              <Label htmlFor="option-a" className="text-base cursor-pointer flex-1">
                (A) {t("common.walk")}
              </Label>
            </div>
            <div className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-accent/50 touch-manipulation min-h-[44px]">
              <RadioGroupItem value="B" id="option-b" className="touch-manipulation" />
              <Label htmlFor="option-b" className="text-base cursor-pointer flex-1">
                (B) {t("common.run")}
              </Label>
            </div>
            <div className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-accent/50 touch-manipulation min-h-[44px]">
              <RadioGroupItem value="C" id="option-c" className="touch-manipulation" />
              <Label htmlFor="option-c" className="text-base cursor-pointer flex-1">
                (C) {t("common.wheel")}
              </Label>
            </div>
            <div className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-accent/50 touch-manipulation min-h-[44px]">
              <RadioGroupItem value="D" id="option-d" className="touch-manipulation" />
              <Label htmlFor="option-d" className="text-base cursor-pointer flex-1">
                (D) {t("common.jump")}
              </Label>
            </div>
          </RadioGroup>
        </div>

        <div className="flex flex-col sm:flex-row justify-center gap-4">
          <Button
            variant="outline"
            onClick={handleSkip}
            className="touch-manipulation min-h-[44px] order-2 sm:order-1 bg-transparent"
          >
            {t("common.skip_task")}
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={similarityAnswer === ""}
            className="w-full max-w-xs touch-manipulation min-h-[44px] order-1 sm:order-2"
          >
            {t("common.submit")}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

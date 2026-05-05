"use client"

import { useState } from "react"
import { Headphones, Languages, Repeat2, Shapes } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AssessmentInput } from "@/components/ui/assessment-input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { useLanguage } from "@/contexts/language-context"
import { InstructionAudio } from "@/components/ui/instruction-audio"

interface LanguageAbstractionProps {
  onComplete: (score: number) => void
  onSkip?: () => void
}

export function LanguageAbstraction({ onComplete, onSkip }: LanguageAbstractionProps) {
  const { t, language, getSpeechLanguage, localizeText } = useLanguage()
  const [phase, setPhase] = useState<"repetition" | "similarity" | "fluency">("repetition")
  const [repetitionAnswer, setRepetitionAnswer] = useState("")
  const [similarityAnswer, setSimilarityAnswer] = useState("")
  const [fluencyAnswer, setFluencyAnswer] = useState("")
  const [isPlaying, setIsPlaying] = useState(false)
  const [hasPlayedAudio, setHasPlayedAudio] = useState(false)

  const getSpeechText = () => {
    // Enhanced multilingual sentences for MoCA Language Abstraction
    const sentences = {
      en: "The quick brown fox jumps over the lazy dog",
      zh: "那只敏捷的棕色狐狸跳过那只懒洋洋的狗",
      yue: "快速嘅啡色狐狸跳過懶狗",
      fr: "Le renard brun rapide saute par-dessus le chien paresseux",
    }
    return sentences[language] || sentences.en
  }

  const getCorrectAnswer = () => {
    const answers = {
      en: "The quick brown fox jumps over the lazy dog",
      zh: "敏捷的棕色狐狸跳过懒惰的狗",
      yue: "敏捷嘅棕色狐狸跳過懶惰嘅狗",
      fr: "Le renard brun rapide saute par-dessus le chien paresseux",
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
    utterance.onerror = (event) => {
      console.error("SpeechSynthesisUtterance.onerror", event)
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

  const checkFluency = () => {
    const words = fluencyAnswer.split(/\s+/).filter((word) => word.length > 0)
    return words.length >= 11 ? 1 : 0 // 1 point for 11+ words
  }

  const handleSubmit = () => {
    if (phase === "repetition") {
      setPhase("similarity")
    } else if (phase === "similarity") {
      setPhase("fluency")
    } else {
      const repetitionScore = checkRepetition()
      const similarityScore = checkSimilarity()
      const fluencyScore = checkFluency()
      const totalScore = repetitionScore + similarityScore + fluencyScore
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
      <Card className="mx-auto w-full max-w-3xl overflow-hidden border border-fuchsia-100/80 shadow-[0_24px_70px_rgba(217,70,239,0.12)]">
        <CardHeader className="bg-[radial-gradient(circle_at_top_left,_rgba(232,121,249,0.18),_transparent_32%),linear-gradient(135deg,_rgba(253,244,255,0.98),_rgba(255,255,255,0.98),_rgba(250,245,255,0.96))] pb-6">
          <div className="mb-3 flex items-center gap-2 text-fuchsia-700">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-fuchsia-100 shadow-sm">
              <Languages className="h-5 w-5" />
            </span>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-fuchsia-600/80">
                {localizeText("Premium language task", {
                  zh: "高级语言任务",
                  yue: "高級語言任務",
                  fr: "Tâche de langage premium",
                })}
              </p>
              <CardTitle className="text-fuchsia-950">
                {t("moca.language")} - {t("mmse.repetition")}
              </CardTitle>
            </div>
          </div>
          <CardTitle className="flex items-center justify-between flex-wrap gap-4">
            <span className="text-base font-medium text-slate-600">
              {localizeText("Listen carefully and repeat the sentence as accurately as possible.", {
                zh: "请认真听，并尽可能准确地复述这句话。",
                yue: "請留心聽，然後盡量準確噉重複呢句說話。",
                fr: "Écoutez attentivement et répétez la phrase aussi fidèlement que possible.",
              })}
            </span>
            <InstructionAudio instructionKey="moca.language.instruction" />
          </CardTitle>
          <p className="text-sm text-muted-foreground">{t("mmse.repetition.instruction")}</p>
        </CardHeader>
        <CardContent className="space-y-6 pt-6">
          <div className="rounded-[26px] border border-fuchsia-100 bg-[linear-gradient(135deg,rgba(253,244,255,1),rgba(255,255,255,1))] p-5 shadow-sm">
            <div className="mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.16em] text-fuchsia-700">
              <Headphones className="h-4 w-4" />
              {localizeText("Audio cue", { zh: "音频提示", yue: "音頻提示", fr: "Indice audio" })}
            </div>
            <div className="text-center space-y-4">
            <Button
              onClick={playAudio}
              disabled={isPlaying}
              className="w-full max-w-xs touch-manipulation min-h-[48px] rounded-2xl bg-white"
              variant="outline"
            >
              {isPlaying ? (
                <>
                  <Repeat2 className="w-4 h-4 mr-2" />
                  {t("audio.playing")}
                </>
              ) : (
                <>
                  <Headphones className="w-4 h-4 mr-2" />
                  {t("audio.play")}
                </>
              )}
            </Button>

            {hasPlayedAudio && (
              <p className="text-sm text-green-600 dark:text-green-400">✓ {t("audio.played_success")}</p>
            )}
          </div>
          </div>

          <div className="space-y-4 rounded-[26px] border border-slate-200 bg-white p-5 shadow-sm">
            <Label htmlFor="repetition" className="text-base font-medium text-slate-900">
              {t("question.type_sentence")}
            </Label>
            <AssessmentInput
              id="repetition"
              value={repetitionAnswer}
              onChange={(e) => setRepetitionAnswer(e.target.value)}
              placeholder=""
              className="min-h-[48px] w-full text-base touch-manipulation"
              disabled={!hasPlayedAudio}
            />
            <div className="rounded-2xl border border-fuchsia-100 bg-fuchsia-50/80 p-4 text-sm text-fuchsia-900">
              {localizeText(
                "The answer field unlocks after audio playback so the spoken prompt is heard first.",
                {
                  zh: "音频播放后输入框才会启用，以确保先听到语音提示。",
                  yue: "音頻播放之後輸入欄先會啟用，確保先聽到語音提示。",
                  fr: "Le champ de réponse s’active après la lecture audio afin que l’instruction soit d’abord entendue.",
                },
              )}
            </div>
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
    <Card className="mx-auto w-full max-w-3xl overflow-hidden border border-violet-100/80 shadow-[0_24px_70px_rgba(139,92,246,0.12)]">
      <CardHeader className="bg-[radial-gradient(circle_at_top_left,_rgba(167,139,250,0.18),_transparent_32%),linear-gradient(135deg,_rgba(245,243,255,0.98),_rgba(255,255,255,0.98),_rgba(243,232,255,0.96))] pb-6">
        <div className="mb-3 flex items-center gap-2 text-violet-700">
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-violet-100 shadow-sm">
            <Shapes className="h-5 w-5" />
          </span>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-violet-600/80">
              {localizeText("Abstraction step", {
                zh: "抽象理解步骤",
                yue: "抽象理解步驟",
                fr: "Étape d’abstraction",
              })}
            </p>
            <CardTitle className="text-violet-950">
              {t("moca.language")} - {t("question.similarity")}
            </CardTitle>
          </div>
        </div>
        <CardTitle className="flex items-center justify-between flex-wrap gap-4">
          <span className="text-base font-medium text-slate-600">
            {localizeText("Choose the option that best matches the relationship in the prompt.", {
              zh: "请选择最符合题目关系的一项。",
              yue: "請揀最符合題目關係嘅選項。",
              fr: "Choisissez l’option qui correspond le mieux à la relation demandée.",
            })}
          </span>
          <InstructionAudio instructionKey="question.similarity" />
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          {localizeText(
            "This second step checks verbal abstraction after the repetition task.",
            {
              zh: "这一部分在复述任务后评估语言抽象能力。",
              yue: "呢一部分會喺重複任務之後評估語言抽象能力。",
              fr: "Cette seconde étape évalue l’abstraction verbale après la tâche de répétition.",
            },
          )}
        </p>
      </CardHeader>
      <CardContent className="space-y-6 pt-6">
        <div className="space-y-4 rounded-[26px] border border-violet-100 bg-white p-5 shadow-sm">
          <h3 className="text-lg font-medium text-slate-900">{t("question.similarity")}</h3>

          <RadioGroup value={similarityAnswer} onValueChange={setSimilarityAnswer} className="space-y-3">
            <div className="flex min-h-[48px] items-center space-x-3 rounded-2xl border border-violet-100 p-4 hover:bg-violet-50/60 touch-manipulation">
              <RadioGroupItem value="A" id="option-a" className="touch-manipulation" />
              <Label htmlFor="option-a" className="text-base cursor-pointer flex-1">
                (A) {t("common.walk")}
              </Label>
            </div>
            <div className="flex min-h-[48px] items-center space-x-3 rounded-2xl border border-violet-100 p-4 hover:bg-violet-50/60 touch-manipulation">
              <RadioGroupItem value="B" id="option-b" className="touch-manipulation" />
              <Label htmlFor="option-b" className="text-base cursor-pointer flex-1">
                (B) {t("common.run")}
              </Label>
            </div>
            <div className="flex min-h-[48px] items-center space-x-3 rounded-2xl border border-violet-100 p-4 hover:bg-violet-50/60 touch-manipulation">
              <RadioGroupItem value="C" id="option-c" className="touch-manipulation" />
              <Label htmlFor="option-c" className="text-base cursor-pointer flex-1">
                (C) {t("common.wheel")}
              </Label>
            </div>
            <div className="flex min-h-[48px] items-center space-x-3 rounded-2xl border border-violet-100 p-4 hover:bg-violet-50/60 touch-manipulation">
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

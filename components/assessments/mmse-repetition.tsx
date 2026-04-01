"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AssessmentInput } from "@/components/ui/assessment-input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Volume2, VolumeX } from "lucide-react"
import { useLanguage } from "@/contexts/language-context"

interface MMSERepetitionProps {
  onComplete: (score: number) => void
  onSkip?: () => void
}

export function MMSERepetition({ onComplete, onSkip }: MMSERepetitionProps) {
  const { t, language } = useLanguage()
  const [answer, setAnswer] = useState("")
  const [isPlaying, setIsPlaying] = useState(false)
  const [hasPlayedAudio, setHasPlayedAudio] = useState(false)

  const getSpeechText = () => {
    // This text is for the MMSE repetition sentence
    return language === "zh" ? "他画了一幅画" : "He drew a picture"
  }

  const getSpeechLanguage = () => {
    // Map language codes to BCP 47 tags for Web Speech API
    return language === "zh" ? "zh-CN" : "en-US"
  }

  const playAudio = () => {
    if (!("speechSynthesis" in window)) {
      alert(t("audio.not_supported"))
      return
    }

    // Cancel any ongoing speech
    window.speechSynthesis.cancel()

    const textToSpeak = getSpeechText()
    const utterance = new SpeechSynthesisUtterance(textToSpeak)
    utterance.lang = getSpeechLanguage()
    utterance.rate = 0.5 // Slower for repetition tasks
    utterance.pitch = 1.0
    utterance.volume = 1.0

    // Try to find a voice that matches the language
    const voices = window.speechSynthesis.getVoices()
    const preferredVoice = voices.find((voice) => voice.lang.startsWith(getSpeechLanguage().split("-")[0]))

    if (preferredVoice) {
      utterance.voice = preferredVoice
    }

    utterance.onstart = () => setIsPlaying(true)
    utterance.onend = () => {
      setIsPlaying(false)
      setHasPlayedAudio(true)
    }
    utterance.onerror = () => {
      alert(t("audio.error_playing"))
      setIsPlaying(false)
    }

    try {
      window.speechSynthesis.speak(utterance)
    } catch (error) {
      setIsPlaying(false)
      alert(t("audio.error_playing"))
    }
  }

  const checkAnswer = () => {
    const actualTargetSentence = language === "zh" ? "他画了一幅画" : "He drew a picture"
    const score = answer.toLowerCase().trim() === actualTargetSentence.toLowerCase() ? 2 : 0
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
        <CardTitle>{t("mmse.repetition")}</CardTitle>
        <p className="text-sm text-gray-600">{t("mmse.repetition.instruction")}</p>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="text-center space-y-4">
          <Button onClick={playAudio} disabled={isPlaying} className="w-full max-w-xs bg-transparent" variant="outline">
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

          {hasPlayedAudio && <p className="text-sm text-green-600">✓ {t("audio.played_success")}</p>}
        </div>

        <div className="space-y-4">
          <Label htmlFor="repetition">{t("question.type_sentence")}</Label>
          <AssessmentInput
            id="repetition"
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            placeholder=""
            className="w-full"
            disabled={!hasPlayedAudio}
          />
        </div>

        <div className="flex justify-center space-x-4">
          <Button variant="outline" onClick={handleSkip}>
            {t("common.skip_task")}
          </Button>
          <Button onClick={checkAnswer} disabled={!hasPlayedAudio || answer.trim() === ""} className="w-full max-w-xs">
            {t("common.submit")}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

"use client"

import { useMemo, useState } from "react"
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
  const { t, language, getSpeechSettings, getBestVoice } = useLanguage()
  const [answer, setAnswer] = useState("")
  const [isPlaying, setIsPlaying] = useState(false)
  const [hasPlayedAudio, setHasPlayedAudio] = useState(false)

  const targetSentence = useMemo(() => {
    switch (language) {
      case "zh":
        return "他画了一幅画"
      case "yue":
        return "佢畫咗一幅畫"
      case "fr":
        return "Il a dessiné une image"
      default:
        return "He drew a picture"
    }
  }, [language])

  const normalizeText = (text: string) => {
    return text
      .trim()
      .toLowerCase()
      .replace(/[.,!?;:，。！？；：]/g, "")
      .replace(/\s+/g, " ")
  }

  const playAudio = () => {
    if (!("speechSynthesis" in window)) {
      alert(t("audio.not_supported"))
      return
    }

    window.speechSynthesis.cancel()

    const settings = getSpeechSettings(language)
    const utterance = new SpeechSynthesisUtterance(targetSentence)

    utterance.lang = settings.lang
    utterance.rate = 0.75
    utterance.pitch = settings.pitch
    utterance.volume = settings.volume

    const voice = getBestVoice(language)
    if (voice) {
      utterance.voice = voice
    }

    utterance.onstart = () => setIsPlaying(true)
    utterance.onend = () => {
      setIsPlaying(false)
      setHasPlayedAudio(true)
    }
    utterance.onerror = (event) => {
      console.error("SpeechSynthesisUtterance.onerror", event)
      setIsPlaying(false)
      alert(t("audio.error_playing"))
    }

    try {
      window.speechSynthesis.speak(utterance)
    } catch (error) {
      console.error("Failed to start speech synthesis:", error)
      setIsPlaying(false)
      alert(t("audio.error_playing"))
    }
  }

  const checkAnswer = () => {
    const normalizedAnswer = normalizeText(answer)
    const normalizedTarget = normalizeText(targetSentence)
    const score = normalizedAnswer === normalizedTarget ? 2 : 0
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
          <Button
            onClick={playAudio}
            disabled={isPlaying}
            className="w-full max-w-xs"
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
            <p className="text-sm text-green-600">✓ {t("audio.played_success")}</p>
          )}
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

          <Button
            onClick={checkAnswer}
            disabled={!hasPlayedAudio || answer.trim() === ""}
            className="w-full max-w-xs"
          >
            {t("common.submit")}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
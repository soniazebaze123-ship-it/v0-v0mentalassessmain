"use client"

import { useMemo, useState } from "react"
import { AudioLines, MessageSquareQuote, Repeat2 } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AssessmentInput } from "@/components/ui/assessment-input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { useLanguage } from "@/contexts/language-context"

interface MMSERepetitionProps {
  onComplete: (score: number) => void
  onSkip?: () => void
}

export function MMSERepetition({ onComplete, onSkip }: MMSERepetitionProps) {
  const { t, language, getSpeechSettings, getBestVoice, localizeText } = useLanguage()
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
    <Card className="mx-auto w-full max-w-3xl overflow-hidden border border-rose-100/80 shadow-[0_24px_70px_rgba(244,63,94,0.12)]">
      <CardHeader className="bg-[radial-gradient(circle_at_top_left,_rgba(251,113,133,0.18),_transparent_32%),linear-gradient(135deg,_rgba(255,241,242,0.98),_rgba(255,255,255,0.98),_rgba(255,247,237,0.96))] pb-6">
        <div className="mb-3 flex items-center gap-2 text-rose-700">
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-rose-100 shadow-sm">
            <MessageSquareQuote className="h-5 w-5" />
          </span>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-rose-600/80">
              {localizeText("Premium repetition task", {
                zh: "高级复述任务",
                yue: "高級復述任務",
                fr: "Tâche de répétition premium",
              })}
            </p>
            <CardTitle className="text-rose-950">{t("mmse.repetition")}</CardTitle>
          </div>
        </div>
        <p className="max-w-2xl text-sm text-slate-600">{t("mmse.repetition.instruction")}</p>
      </CardHeader>

      <CardContent className="space-y-6 pt-6">
        <div className="rounded-[26px] border border-rose-100 bg-[linear-gradient(135deg,rgba(255,241,242,1),rgba(255,255,255,1))] p-5 shadow-sm text-center">
          <div className="mb-4 inline-flex items-center rounded-full bg-rose-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-rose-700 shadow-sm">
            <AudioLines className="mr-2 h-3.5 w-3.5" />
            {localizeText("Listen first", { zh: "先聆听", yue: "先聆聽", fr: "Écoutez d’abord" })}
          </div>
          <Button
            onClick={playAudio}
            disabled={isPlaying}
            className="w-full max-w-xs rounded-2xl bg-white"
            variant="outline"
          >
            {isPlaying ? (
              <>
                <Repeat2 className="w-4 h-4 mr-2" />
                {t("audio.playing")}
              </>
            ) : (
              <>
                <AudioLines className="w-4 h-4 mr-2" />
                {t("audio.play")}
              </>
            )}
          </Button>

          {hasPlayedAudio && (
            <p className="text-sm text-green-600">✓ {t("audio.played_success")}</p>
          )}
        </div>

        <div className="space-y-4 rounded-[26px] border border-slate-200 bg-white p-5 shadow-sm">
          <Label htmlFor="repetition" className="text-base text-slate-900">{t("question.type_sentence")}</Label>
          <AssessmentInput
            id="repetition"
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            placeholder=""
            className="h-12 w-full"
            disabled={!hasPlayedAudio}
          />
          <div className="rounded-2xl border border-rose-100 bg-rose-50/80 p-4 text-sm text-rose-900">
            {localizeText(
              "Type the sentence only after listening. Scoring requires an exact normalized match.",
              {
                zh: "请先听再输入句子。评分采用规范化后的精确匹配。",
                yue: "請先聽再輸入句子。評分會用標準化後嘅精確匹配。",
                fr: "Saisissez la phrase seulement après l’avoir entendue. Le score exige une correspondance exacte après normalisation.",
              },
            )}
          </div>
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
"use client"

import { useEffect, useMemo, useState } from "react"
import { AudioLines, MessageSquareQuote, Repeat2 } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AssessmentInput } from "@/components/ui/assessment-input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { useLanguage } from "@/contexts/language-context"
import { InstructionAudio } from "@/components/ui/instruction-audio"

interface MMSERepetitionProps {
  onComplete: (score: number) => void
  onSkip?: () => void
}

export function MMSERepetition({ onComplete, onSkip }: MMSERepetitionProps) {
  const { t, language, getSpeechSettings, getBestVoice, localizeText } = useLanguage()
  const [answer, setAnswer] = useState("")
  const [isPlaying, setIsPlaying] = useState(false)
  const [hasPlayed, setHasPlayed] = useState(false)

  const targetSentence1 = useMemo(() => {
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

  const playAudio = async () => {
    const sentence = targetSentence1

    if (!("speechSynthesis" in window)) {
      alert(t("audio.not_supported"))
      return
    }

    window.speechSynthesis.cancel()

    const settings = getSpeechSettings(language)
    const utterance = new SpeechSynthesisUtterance(sentence)

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
      setHasPlayed(true)
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

  useEffect(() => {
    return () => {
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel()
      }
    }
  }, [])

  const checkAnswer = () => {
    const normalizedAnswer = normalizeText(answer)
    const normalizedTarget = normalizeText(targetSentence1)
    const score = normalizedAnswer === normalizedTarget ? 1 : 0
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
    <Card className="mx-auto w-full max-w-3xl overflow-hidden border border-rose-100/80 shadow-[0_24px_70px_rgba(225,29,72,0.12)]">
      <CardHeader className="bg-[radial-gradient(circle_at_top_left,_rgba(251,113,133,0.16),_transparent_34%),linear-gradient(135deg,_rgba(255,241,242,0.98),_rgba(255,255,255,0.98),_rgba(255,245,245,0.96))]">
        <div className="mb-3 flex items-center gap-2 text-rose-700">
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-rose-100 shadow-sm">
            <MessageSquareQuote className="h-5 w-5" />
          </span>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-rose-600/80">
              {localizeText("Premium repetition task", {
                zh: "高级复述任务",
                yue: "高級重複任務",
                fr: "Tache premium de repetition",
              })}
            </p>
            <CardTitle className="text-rose-950">{t("mmse.repetition")}</CardTitle>
          </div>
        </div>
        <p className="max-w-2xl text-sm text-slate-600">{t("mmse.repetition.instruction")}</p>
        <InstructionAudio instructionKey="mmse.repetition.instruction" className="mt-2" />
      </CardHeader>

      <CardContent className="space-y-6 pt-6">
        <div className="rounded-[24px] border border-rose-100 bg-rose-50/60 p-4">
          <div className="grid grid-cols-[1fr,2fr] gap-3">
            <div className="inline-flex items-center justify-center rounded-full bg-rose-100 px-4 py-2 text-sm font-semibold uppercase tracking-[0.16em] text-rose-700">
              <AudioLines className="mr-2 h-4 w-4" />
              {localizeText("Listen first", { zh: "先听音频", yue: "先聽音頻", fr: "Écouter d'abord" })}
            </div>
            <Button
              onClick={() => void playAudio()}
              disabled={isPlaying}
              className="h-12 rounded-full border-slate-300 bg-white"
              variant="outline"
            >
              {isPlaying ? (
                <>
                  <Repeat2 className="mr-2 h-4 w-4" />
                  {t("audio.playing")}
                </>
              ) : (
                <>
                  <AudioLines className="mr-2 h-4 w-4" />
                  {localizeText("Play Audio", {
                    zh: "播放音频",
                    yue: "播放音頻",
                    fr: "Lire l'audio",
                  })}
                </>
              )}
            </Button>
          </div>
        </div>

        <div className="space-y-4 rounded-[24px] border border-slate-200 bg-white p-6 shadow-sm">
          <Label htmlFor="repetition" className="text-base text-slate-900">
            {localizeText("Type the sentence you heard:", {
              zh: "请输入你听到的句子：",
              yue: "請輸入你聽到嘅句子：",
              fr: "Saisissez la phrase entendue :",
            })}
          </Label>

          <AssessmentInput
            id="repetition"
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            placeholder=""
            className="h-12 w-full"
            disabled={!hasPlayed}
          />

          <div className="rounded-2xl border border-rose-100 bg-rose-50/80 p-4 text-sm text-rose-800">
            {localizeText(
              "Type the sentence only after listening. Scoring requires an exact normalized match.",
              {
                zh: "请先听音频再输入句子。评分需要标准化后完全匹配。",
                yue: "請先聽音頻再輸入句子。評分需要標準化後完全匹配。",
                fr: "Saisissez la phrase uniquement après écoute. Le score exige une correspondance normalisée exacte.",
              },
            )}
          </div>
        </div>

        <div className="flex justify-center space-x-4">
          <Button variant="outline" onClick={handleSkip}>
            {t("common.skip_task")}
          </Button>

          <Button onClick={checkAnswer} className="w-full max-w-xs bg-gradient-to-r from-blue-600 to-sky-500 hover:from-blue-700 hover:to-sky-600">
            {t("common.submit")}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
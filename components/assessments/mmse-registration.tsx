"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { BookOpenCheck, Volume2 } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AssessmentInput } from "@/components/ui/assessment-input"
import { Button } from "@/components/ui/button"
import { useLanguage } from "@/contexts/language-context"
import { InstructionAudio } from "@/components/ui/instruction-audio"

interface MMSERegistrationProps {
  onComplete: (score: number) => void
  onSkip?: () => void
}

const PRESENTATION_ROUNDS = 2
const PREP_COUNTDOWN_SECONDS = 10

function normalizeWords(words: string[] | string) {
  if (Array.isArray(words)) {
    return words.map((word) => word.trim()).filter(Boolean)
  }

  return words
    .split(",")
    .map((word) => word.trim())
    .filter(Boolean)
}

function countMatches(expectedWords: string[], answers: string[]) {
  const remaining = expectedWords.map((word) => word.toLowerCase().trim())
  let score = 0

  answers.forEach((answer) => {
    const normalized = answer.toLowerCase().trim()
    if (!normalized) {
      return
    }

    const found = remaining.findIndex((word) => word === normalized)
    if (found >= 0) {
      score += 1
      remaining.splice(found, 1)
    }
  })

  return score
}

export function MMSERegistration({ onComplete, onSkip }: MMSERegistrationProps) {
  const { t, language, localizeText, getSpeechSettings, getBestVoice } = useLanguage()
  const words = useMemo(() => normalizeWords(t("memory.mmse.words")), [t])
  const [answers, setAnswers] = useState<string[]>(new Array(words.length).fill(""))
  const [phase, setPhase] = useState<"countdown" | "presentation" | "registration">("countdown")
  const [currentWordIndex, setCurrentWordIndex] = useState(0)
  const [currentRound, setCurrentRound] = useState(1)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [countdown, setCountdown] = useState(PREP_COUNTDOWN_SECONDS)
  const sequenceRunRef = useRef(0)

  const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

  const speakWord = async (word: string) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      await wait(1200)
      return
    }

    const settings = getSpeechSettings(language)
    const utterance = new SpeechSynthesisUtterance(word)
    utterance.lang = settings.lang
    utterance.rate = 0.72
    utterance.pitch = settings.pitch
    utterance.volume = settings.volume

    const voice = getBestVoice(language)
    if (voice) {
      utterance.voice = voice
    }

    await new Promise<void>((resolve) => {
      utterance.onstart = () => setIsSpeaking(true)
      utterance.onend = () => {
        setIsSpeaking(false)
        resolve()
      }
      utterance.onerror = () => {
        setIsSpeaking(false)
        resolve()
      }
      window.speechSynthesis.speak(utterance)
    })
  }

  const playPresentationSequence = async (runId: number) => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel()
    }

    setPhase("presentation")
    setCurrentRound(1)
    setCurrentWordIndex(0)

    for (let round = 1; round <= PRESENTATION_ROUNDS; round += 1) {
      for (let index = 0; index < words.length; index += 1) {
        if (sequenceRunRef.current !== runId) {
          return
        }

        setCurrentRound(round)
        setCurrentWordIndex(index)
        await speakWord(words[index])
        await wait(500)
      }
      await wait(300)
    }

    if (sequenceRunRef.current === runId) {
      setIsSpeaking(false)
      setPhase("registration")
    }
  }

  const startWarmupAndPresentation = async () => {
    const runId = sequenceRunRef.current + 1
    sequenceRunRef.current = runId

    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel()
    }

    setIsSpeaking(false)
    setPhase("countdown")
    setCountdown(PREP_COUNTDOWN_SECONDS)

    // Small buffer before countdown so the participant can focus on the instruction first.
    await wait(1200)

    for (let seconds = PREP_COUNTDOWN_SECONDS; seconds >= 1; seconds -= 1) {
      if (sequenceRunRef.current !== runId) {
        return
      }

      setCountdown(seconds)
      await wait(1000)
    }

    if (sequenceRunRef.current !== runId) {
      return
    }

    await playPresentationSequence(runId)
  }

  useEffect(() => {
    setAnswers(new Array(words.length).fill(""))
    void startWarmupAndPresentation()

    return () => {
      sequenceRunRef.current += 1
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel()
      }
    }
  }, [words.join("|"), language])

  const handleChange = (index: number, value: string) => {
    const next = [...answers]
    next[index] = value
    setAnswers(next)
  }

  const handleSubmit = () => {
    onComplete(countMatches(words, answers))
  }

  const handleSkip = () => {
    if (onSkip) {
      onSkip()
    } else {
      onComplete(0)
    }
  }

  return (
    <Card className="mx-auto w-full max-w-3xl overflow-hidden border border-blue-100/80 shadow-[0_24px_70px_rgba(37,99,235,0.12)]">
      <CardHeader className="bg-[radial-gradient(circle_at_top_left,_rgba(96,165,250,0.20),_transparent_30%),linear-gradient(135deg,_rgba(239,246,255,0.98),_rgba(255,255,255,0.98),_rgba(224,242,254,0.96))]">
        <div className="mb-3 flex items-center gap-2">
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-100 text-blue-700 shadow-sm">
            <BookOpenCheck className="h-5 w-5" />
          </span>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-700/80">
              {localizeText("Immediate registration", {
                zh: "即时记忆登记",
                yue: "即時記憶登記",
                fr: "Enregistrement immédiat",
              })}
            </p>
            <CardTitle className="text-blue-900">{t("mmse.registration")}</CardTitle>
          </div>
        </div>
        <p className="text-sm text-slate-600">
          {phase === "countdown"
            ? localizeText(
                "A short countdown gives the participant time to prepare before the memory list begins.",
                {
                  zh: "简短倒计时可让受试者在记忆列表开始前做好准备。",
                  yue: "簡短倒數可以俾受試者喺記憶列表開始前做好準備。",
                  fr: "Un court compte à rebours permet au participant de se préparer avant le début de la liste de mémoire.",
                },
              )
            : phase === "presentation"
            ? localizeText(
                "The word cards are being presented with audio. Each word is repeated twice before registration starts.",
                {
                  zh: "词语卡片正在配音展示。每个词会重复两次，然后进入登记阶段。",
                  yue: "詞語卡片正配音展示。每個詞會重複兩次，之後先進入登記階段。",
                  fr: "Les cartes de mots sont présentées avec audio. Chaque mot est répété deux fois avant le début de l’enregistrement.",
                },
              )
            : localizeText(
                "Now ask the patient to register the three words they just heard.",
                {
                  zh: "现在请让受试者登记刚才听到的三个词。",
                  yue: "而家請叫受試者登記頭先聽到嘅三個詞。",
                  fr: "Demandez maintenant au patient d’enregistrer les trois mots qu’il vient d’entendre.",
                },
              )}
        </p>
        <InstructionAudio instructionKey="mmse.registration.instruction" className="mt-2" />
      </CardHeader>
      <CardContent className="space-y-5 pt-6">
        {phase === "countdown" ? (
          <div className="space-y-5">
            <div className="rounded-[26px] border border-teal-100 bg-[radial-gradient(circle_at_top_left,_rgba(45,212,191,0.14),_transparent_35%),linear-gradient(135deg,rgba(240,253,250,0.98),rgba(255,255,255,0.98))] p-6 shadow-sm">
              <div className="mx-auto flex h-36 w-36 items-center justify-center rounded-full bg-white text-6xl font-black text-teal-700 shadow-[0_18px_35px_rgba(20,184,166,0.18)]">
                {countdown}
              </div>
              <p className="mt-6 text-center text-2xl font-semibold text-slate-900">
                {localizeText("Get ready! Words will appear in {{seconds}} seconds...", {
                  zh: "请准备！词语将在 {{seconds}} 秒后出现...",
                  yue: "請準備！詞語會喺 {{seconds}} 秒後出現...",
                  fr: "Préparez-vous ! Les mots apparaîtront dans {{seconds}} secondes...",
                }).replace("{{seconds}}", String(countdown))}
              </p>

              <div className="mt-6 h-4 overflow-hidden rounded-full bg-slate-200">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-blue-600 to-sky-500 transition-all duration-500"
                  style={{ width: `${((PREP_COUNTDOWN_SECONDS - countdown + 1) / PREP_COUNTDOWN_SECONDS) * 100}%` }}
                />
              </div>

              <div className="mt-5 rounded-2xl border border-teal-100 bg-teal-50/80 p-4 text-center text-sm text-teal-900">
                {localizeText(
                  "A short countdown gives the participant time to prepare before the memory list begins.",
                  {
                    zh: "简短倒计时可让受试者在记忆列表开始前做好准备。",
                    yue: "簡短倒數可以俾受試者喺記憶列表開始前做好準備。",
                    fr: "Un court compte à rebours permet au participant de se préparer avant le début de la liste de mémoire.",
                  },
                )}
              </div>
            </div>
          </div>
        ) : phase === "presentation" ? (
          <div className="space-y-4">
            <div className="rounded-2xl border border-blue-100 bg-blue-50/80 p-4 text-sm text-blue-900">
              <div className="mb-2 flex items-center justify-between gap-2">
                <span className="inline-flex items-center rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-blue-700">
                  <Volume2 className="mr-2 h-3.5 w-3.5" />
                  {localizeText("Audio Card Presentation", {
                    zh: "语音卡片展示",
                    yue: "語音卡片展示",
                    fr: "Présentation audio des cartes",
                  })}
                </span>
                <span className="text-xs font-semibold text-blue-700">
                  {localizeText(`Round ${currentRound} of ${PRESENTATION_ROUNDS}`, {
                    zh: `第 ${currentRound} 轮 / 共 ${PRESENTATION_ROUNDS} 轮`,
                    yue: `第 ${currentRound} 輪 / 共 ${PRESENTATION_ROUNDS} 輪`,
                    fr: `Tour ${currentRound} sur ${PRESENTATION_ROUNDS}`,
                  })}
                </span>
              </div>
              <p>
                {localizeText("Listen and watch each card.", {
                  zh: "请听并观看每张卡片。",
                  yue: "請聽並睇每張卡片。",
                  fr: "Écoutez et regardez chaque carte.",
                })}
              </p>
            </div>

            <div className="flex min-h-[220px] items-center justify-center rounded-[28px] border border-blue-100 bg-[linear-gradient(135deg,rgba(239,246,255,1),rgba(255,255,255,1))] p-6 shadow-sm">
              <div className="rounded-[28px] border border-blue-200 bg-white px-10 py-12 text-center shadow-[0_20px_50px_rgba(37,99,235,0.12)] animate-in fade-in zoom-in duration-300">
                <p className="text-6xl font-black text-blue-900">{words[currentWordIndex]}</p>
                <p className="mt-4 text-sm text-slate-500">
                  {isSpeaking
                    ? localizeText("Speaking...", { zh: "正在朗读...", yue: "朗讀中...", fr: "Lecture en cours..." })
                    : localizeText("Preparing next card...", {
                        zh: "准备下一张卡片...",
                        yue: "準備下一張卡片...",
                        fr: "Préparation de la carte suivante...",
                      })}
                </p>
              </div>
            </div>
          </div>
        ) : (
          <>
            <div className="rounded-2xl border border-blue-100 bg-blue-50/80 p-4 text-sm text-blue-900">
              <p className="font-semibold">
                {localizeText("Registration phase", { zh: "登记阶段", yue: "登記階段", fr: "Phase d’enregistrement" })}
              </p>
              <p className="mt-1">
                {localizeText("Enter the three words remembered from the card presentation.", {
                  zh: "请输入刚才卡片展示中记住的三个词。",
                  yue: "請輸入頭先卡片展示記住嘅三個詞。",
                  fr: "Saisissez les trois mots mémorisés pendant la présentation des cartes.",
                })}
              </p>
            </div>

            <div className="grid gap-3 md:grid-cols-3">
              {words.map((_, index) => (
                <div key={index} className="space-y-2">
                  <label className="text-sm font-medium">
                    {localizeText(`Word ${index + 1}`, { zh: `第 ${index + 1} 个词`, yue: `第 ${index + 1} 個詞`, fr: `Mot ${index + 1}` })}
                  </label>
                  <AssessmentInput
                    value={answers[index]}
                    onChange={(event) => handleChange(index, event.target.value)}
                    className="h-11"
                  />
                </div>
              ))}
            </div>
          </>
        )}

        <div className="flex justify-center space-x-4 pt-2">
          <Button variant="outline" onClick={handleSkip}>
            {t("common.skip_task")}
          </Button>
          {phase === "registration" ? (
            <Button onClick={handleSubmit} className="w-full max-w-xs bg-gradient-to-r from-blue-600 to-sky-500 hover:from-blue-700 hover:to-sky-600">
              {t("common.submit")}
            </Button>
          ) : (
            <Button
              type="button"
              variant="outline"
              onClick={() => void startWarmupAndPresentation()}
              className="w-full max-w-xs"
            >
              {localizeText("Replay cards", {
                zh: "重新播放卡片",
                yue: "重新播放卡片",
                fr: "Relire les cartes",
              })}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

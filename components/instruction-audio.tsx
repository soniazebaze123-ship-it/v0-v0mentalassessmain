"use client"

import { useState } from "react"
import { useLanguage } from "@/contexts/language-context"

export default function InstructionAudio({ text }: { text: string }) {
  const { language, getSpeechSettings, getBestVoice, t } = useLanguage()
  const [isPlaying, setIsPlaying] = useState(false)

  const playAudio = () => {
    if (!("speechSynthesis" in window)) {
      alert(t("audio.not_supported"))
      return
    }

    const utterance = new SpeechSynthesisUtterance(text)
    const settings = getSpeechSettings(language)
    const voice = getBestVoice(language)

    utterance.lang = settings.lang
    utterance.rate = settings.rate
    utterance.pitch = settings.pitch
    utterance.volume = settings.volume

    if (voice) utterance.voice = voice

    utterance.onstart = () => setIsPlaying(true)
    utterance.onend = () => setIsPlaying(false)
    utterance.onerror = () => {
      setIsPlaying(false)
      alert(t("audio.error_playing"))
    }

    window.speechSynthesis.cancel()
    window.speechSynthesis.speak(utterance)
  }

  return (
    <button
      onClick={playAudio}
      className="px-4 py-2 bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700"
    >
      {isPlaying ? t("audio.playing") : t("audio.play")}
    </button>
  )
}
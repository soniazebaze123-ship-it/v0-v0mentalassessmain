"use client"

import { useEffect, useRef, useState } from "react"
import { useLanguage } from "@/contexts/language-context"
import { getInstructionAudioSources, playAudioSources, stopAudioPlayback } from "@/lib/instruction-audio"

export default function InstructionAudio({ text, audioId }: { text: string; audioId?: string }) {
  const { language, getSpeechSettings, getBestVoice, t } = useLanguage()
  const [isPlaying, setIsPlaying] = useState(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  const playAudio = async () => {
    const playedFromFile = await playAudioSources({
      sources: getInstructionAudioSources(language, audioId),
      activeAudioRef: audioRef,
      onStart: () => setIsPlaying(true),
      onEnd: () => setIsPlaying(false),
    })

    if (playedFromFile) {
      return
    }

    if (!("speechSynthesis" in window)) {
      alert(t("audio.not_supported"))
      return
    }

    stopAudioPlayback(audioRef)
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
    try {
      window.speechSynthesis.speak(utterance)
    } catch (error) {
      console.error("Speech synthesis error:", error)
      setIsPlaying(false)
      alert(t("audio.error_playing"))
    }
  }

  useEffect(() => {
    return () => {
      stopAudioPlayback(audioRef)

      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel()
      }
    }
  }, [])

  return (
    <button
      onClick={() => void playAudio()}
      className="px-4 py-2 bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700"
    >
      {isPlaying ? t("audio.playing") : t("audio.play")}
    </button>
  )
}
"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Volume2, VolumeX } from "lucide-react"
import { useLanguage } from "@/contexts/language-context"

interface InstructionAudioProps {
  instructionKey: string
  className?: string
}

export function InstructionAudio({ instructionKey, className }: InstructionAudioProps) {
  const { t, getSpeechLanguage, language } = useLanguage()
  const [isPlaying, setIsPlaying] = useState(false)

  const playInstruction = () => {
    if (!("speechSynthesis" in window)) {
      alert(t("audio.not_supported"))
      return
    }

    // Cancel any ongoing speech
    window.speechSynthesis.cancel()

    const instructionText = t(instructionKey)
    const utterance = new SpeechSynthesisUtterance(instructionText)
    utterance.lang = getSpeechLanguage(language)
    utterance.rate = 0.7
    utterance.pitch = 1.0
    utterance.volume = 1.0

    // Try to find a voice that matches the language
    const voices = window.speechSynthesis.getVoices()
    const preferredVoice = voices.find((voice) => voice.lang.startsWith(getSpeechLanguage(language).split("-")[0]))

    if (preferredVoice) {
      utterance.voice = preferredVoice
    }

    utterance.onstart = () => setIsPlaying(true)
    utterance.onend = () => setIsPlaying(false)
    utterance.onerror = (event) => {
      console.error("Speech synthesis error:", event)
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

  // Load voices when component mounts
  useEffect(() => {
    const loadVoices = () => {
      window.speechSynthesis.getVoices()
    }

    if ("speechSynthesis" in window) {
      loadVoices()
      window.speechSynthesis.onvoiceschanged = loadVoices
    }
  }, [])

  return (
    <Button onClick={playInstruction} disabled={isPlaying} variant="outline" size="sm" className={className}>
      {isPlaying ? (
        <>
          <VolumeX className="w-4 h-4 mr-2" />
          {t("audio.instruction_playing")}
        </>
      ) : (
        <>
          <Volume2 className="w-4 h-4 mr-2" />
          {t("audio.instruction")}
        </>
      )}
    </Button>
  )
}

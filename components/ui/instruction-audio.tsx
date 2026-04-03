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
  const { t, getSpeechSettings, getBestVoice, language } = useLanguage()
  const [isPlaying, setIsPlaying] = useState(false)
  const [enhancedInstruction, setEnhancedInstruction] = useState<string | null>(null)

  const resolveInstructionText = async () => {
    if (enhancedInstruction) {
      return enhancedInstruction
    }

    const baseInstruction = t(instructionKey)

    if (language === "en") {
      return baseInstruction
    }

    try {
      const response = await fetch("/api/translate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text: baseInstruction,
          targetLanguage: language,
        }),
      })

      if (!response.ok) {
        return baseInstruction
      }

      const payload = await response.json()
      if (payload.translatedText) {
        setEnhancedInstruction(payload.translatedText)
        return payload.translatedText
      }
    } catch (error) {
      console.error("Instruction translation enhancement failed:", error)
    }

    return baseInstruction
  }

  const playInstruction = async () => {
    if (!("speechSynthesis" in window)) {
      alert(t("audio.not_supported"))
      return
    }

    // Cancel any ongoing speech
    window.speechSynthesis.cancel()

    const instructionText = await resolveInstructionText()
    const speechSettings = getSpeechSettings(language)
    const utterance = new SpeechSynthesisUtterance(instructionText)
    utterance.lang = speechSettings.lang
    utterance.rate = speechSettings.rate
    utterance.pitch = speechSettings.pitch
    utterance.volume = speechSettings.volume

    const preferredVoice = getBestVoice(language)
    if (preferredVoice) {
      utterance.voice = preferredVoice
      utterance.lang = preferredVoice.lang || speechSettings.lang
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

      return () => {
        window.speechSynthesis.onvoiceschanged = null
      }
    }
  }, [])

  useEffect(() => {
    setEnhancedInstruction(null)
  }, [instructionKey, language])

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

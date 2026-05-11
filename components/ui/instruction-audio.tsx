"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Volume2, VolumeX } from "lucide-react"
import { useLanguage } from "@/contexts/language-context"
import { getInstructionAudioSources, playAudioSources, stopAudioPlayback } from "@/lib/instruction-audio"

interface InstructionAudioProps {
  instructionKey?: string
  text?: string
  textOverrides?: Partial<Record<"en" | "zh" | "yue" | "fr", string>>
  autoPlay?: boolean
  className?: string
}

export function InstructionAudio({ instructionKey, text, textOverrides, autoPlay = false, className }: InstructionAudioProps) {
  const { t, localizeText, getSpeechSettings, getBestVoice, language } = useLanguage()
  const [isPlaying, setIsPlaying] = useState(false)
  const [enhancedInstruction, setEnhancedInstruction] = useState<string | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  const baseInstruction = instructionKey ? t(instructionKey) : text ? localizeText(text, textOverrides) : ""

  const resolveInstructionText = useCallback(async () => {
    if (enhancedInstruction) {
      return enhancedInstruction
    }

    if (!baseInstruction) {
      return ""
    }

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
  }, [baseInstruction, enhancedInstruction, language])

  const playInstruction = useCallback(async (showAlerts = true) => {
    const audioSources = instructionKey ? getInstructionAudioSources(language, instructionKey) : []

    if (audioSources.length > 0) {
      const playedFromFile = await playAudioSources({
        sources: audioSources,
        activeAudioRef: audioRef,
        onStart: () => setIsPlaying(true),
        onEnd: () => setIsPlaying(false),
      })

      if (playedFromFile) {
        return
      }
    }

    if (!("speechSynthesis" in window)) {
      if (showAlerts) {
        alert(t("audio.not_supported"))
      }
      return
    }

    stopAudioPlayback(audioRef)
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

      if (showAlerts) {
        alert(t("audio.error_playing"))
      }
    }

    try {
      window.speechSynthesis.speak(utterance)
    } catch (error) {
      console.error("Failed to start speech synthesis:", error)
      setIsPlaying(false)

      if (showAlerts) {
        alert(t("audio.error_playing"))
      }
    }
  }, [getBestVoice, getSpeechSettings, instructionKey, language, resolveInstructionText, t])

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
  }, [instructionKey, language, text, textOverrides])

  useEffect(() => {
    if (!autoPlay || !baseInstruction) {
      return
    }

    void playInstruction(false)
  }, [autoPlay, baseInstruction, playInstruction])

  useEffect(() => {
    return () => {
      stopAudioPlayback(audioRef)

      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel()
      }
    }
  }, [])

  return (
    <Button onClick={() => void playInstruction()} disabled={isPlaying || !baseInstruction} variant="outline" size="sm" className={className}>
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

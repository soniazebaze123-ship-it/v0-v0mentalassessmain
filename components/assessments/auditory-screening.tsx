"use client"

import { useState, useRef, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useUser } from "@/contexts/user-context"
import { supabase } from "@/lib/supabase"
import { useLanguage } from "@/contexts/language-context"
import { InstructionAudio } from "@/components/ui/instruction-audio"
import { generateDigitTrials, calculateAuditoryScore, getDeviceAudioInfo } from "@/lib/auditory-screening-utils"
import { Headphones, Volume2, VolumeX } from "lucide-react"

interface AuditoryScreeningProps {
  onComplete: (score: number) => void
  onSkip?: () => void
}

export function AuditoryScreening({ onComplete, onSkip }: AuditoryScreeningProps) {
  const { t } = useLanguage()
  const { user } = useUser()

  const [testStarted, setTestStarted] = useState(false)
  const [testComplete, setTestComplete] = useState(false)
  const [currentTrialIndex, setCurrentTrialIndex] = useState(0)
  const [userResponse, setUserResponse] = useState("")
  const [results, setResults] = useState<{ correct: boolean; snr: number }[]>([])
  const [isPlaying, setIsPlaying] = useState(false)
  const [audioSetup, setAudioSetup] = useState<"headphones" | "speakers">("headphones")
  const [volumeConfirmed, setVolumeConfirmed] = useState(false)

  const [trials] = useState(() => generateDigitTrials(3))
  const audioContextRef = useRef<AudioContext | null>(null)

  const currentTrial = trials[currentTrialIndex]

  useEffect(() => {
    // Initialize AudioContext
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext
    if (AudioContextClass) {
      audioContextRef.current = new AudioContextClass()
    }

    return () => {
      if (audioContextRef.current) {
        audioContextRef.current.close()
      }
    }
  }, [])

  const playDigitWithNoise = async (digit: number, snr: number) => {
    if (!audioContextRef.current) return

    setIsPlaying(true)

    try {
      const ctx = audioContextRef.current
      const now = ctx.currentTime
      const duration = 0.8

      // Create more complex digit tone using multiple frequencies to simulate speech
      const frequencies = [
        350 + digit * 80, // Base frequency
        700 + digit * 100, // First harmonic
        1400 + digit * 120, // Second harmonic
      ]

      const oscillators = frequencies.map((freq, index) => {
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()

        osc.frequency.value = freq
        osc.type = "sine"

        // Different amplitude for each harmonic
        const amplitude = 0.3 / (index + 1)
        gain.gain.setValueAtTime(0, now)
        gain.gain.linearRampToValueAtTime(amplitude, now + 0.05)
        gain.gain.setValueAtTime(amplitude, now + duration - 0.1)
        gain.gain.linearRampToValueAtTime(0, now + duration)

        osc.connect(gain)
        return { osc, gain }
      })

      // Create noise with envelope
      const bufferSize = ctx.sampleRate * duration
      const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate)
      const noiseData = noiseBuffer.getChannelData(0)

      for (let i = 0; i < bufferSize; i++) {
        noiseData[i] = (Math.random() * 2 - 1) * 0.3
      }

      const noiseSource = ctx.createBufferSource()
      noiseSource.buffer = noiseBuffer
      const noiseGain = ctx.createGain()

      // Calculate noise level based on SNR
      const signalLevel = 0.3
      const noiseLevel = signalLevel / Math.pow(10, snr / 20)
      noiseGain.gain.value = noiseLevel * 0.7

      // Connect everything
      oscillators.forEach(({ osc, gain }) => {
        gain.connect(ctx.destination)
        osc.start(now)
        osc.stop(now + duration)
      })

      noiseSource.connect(noiseGain)
      noiseGain.connect(ctx.destination)
      noiseSource.start(now)
      noiseSource.stop(now + duration)

      setTimeout(
        () => {
          setIsPlaying(false)
        },
        duration * 1000 + 100,
      )
    } catch (error) {
      console.error("[v0] Error playing audio:", error)
      setIsPlaying(false)
    }
  }

  const handleStart = () => {
    if (!volumeConfirmed) {
      alert(t("sensory.auditory.volume_warning"))
      return
    }
    setTestStarted(true)
    // Auto-play first trial
    setTimeout(() => {
      if (currentTrial) {
        playDigitWithNoise(currentTrial.digit, currentTrial.noiseLevel)
      }
    }, 500)
  }

  const handleSubmitResponse = () => {
    const response = Number.parseInt(userResponse)
    const isCorrect = response === currentTrial.digit

    const newResults = [...results, { correct: isCorrect, snr: currentTrial.noiseLevel }]
    setResults(newResults)
    setUserResponse("")

    if (currentTrialIndex < trials.length - 1) {
      setCurrentTrialIndex(currentTrialIndex + 1)
      // Auto-play next trial
      setTimeout(() => {
        playDigitWithNoise(trials[currentTrialIndex + 1].digit, trials[currentTrialIndex + 1].noiseLevel)
      }, 500)
    } else {
      finishTest(newResults)
    }
  }

  const finishTest = async (finalResults: { correct: boolean; snr: number }[]) => {
    setTestComplete(true)

    const { speechReceptionThreshold, classification, normalizedScore, percentCorrect } =
      calculateAuditoryScore(finalResults)

    // Save to database
    if (user) {
      try {
        await supabase.from("sensory_assessments").insert({
          user_id: user.id,
          test_type: "auditory",
          raw_score: speechReceptionThreshold,
          normalized_score: normalizedScore,
          classification: classification,
          test_data: {
            trials: finalResults.length,
            percent_correct: percentCorrect,
            srt: speechReceptionThreshold,
          },
          device_info: getDeviceAudioInfo(),
          environment_data: {
            audio_setup: audioSetup,
            test_type: "digit_in_noise",
          },
        })
      } catch (error) {
        console.error("[v0] Error saving auditory screening:", error)
      }
    }

    onComplete(Math.round(100 - normalizedScore))
  }

  const handleSkip = () => {
    if (onSkip) {
      onSkip()
    } else {
      onComplete(0)
    }
  }

  const handleReplay = () => {
    if (currentTrial) {
      playDigitWithNoise(currentTrial.digit, currentTrial.noiseLevel)
    }
  }

  if (!testStarted) {
    return (
      <Card className="w-full max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Headphones className="h-6 w-6" />
            {t("sensory.auditory.title")}
          </CardTitle>
          <p className="text-sm text-muted-foreground">{t("sensory.auditory.description")}</p>
          <InstructionAudio instructionKey="sensory.auditory.instruction" className="mt-2" />
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="bg-blue-50 dark:bg-blue-950 p-6 rounded-lg space-y-4">
            <h3 className="font-semibold">{t("sensory.auditory.setup_title")}</h3>
            <ul className="space-y-2 text-sm">
              <li>• {t("sensory.auditory.setup_1")}</li>
              <li>• {t("sensory.auditory.setup_2")}</li>
              <li>• {t("sensory.auditory.setup_3")}</li>
              <li>• {t("sensory.auditory.setup_4")}</li>
            </ul>
          </div>

          <div className="space-y-4">
            <label className="text-sm font-medium">{t("sensory.auditory.audio_setup")}</label>
            <div className="flex gap-4">
              <Button
                variant={audioSetup === "headphones" ? "default" : "outline"}
                onClick={() => setAudioSetup("headphones")}
                className="flex-1"
              >
                <Headphones className="h-4 w-4 mr-2" />
                {t("sensory.auditory.headphones")}
              </Button>
              <Button
                variant={audioSetup === "speakers" ? "default" : "outline"}
                onClick={() => setAudioSetup("speakers")}
                className="flex-1"
              >
                <Volume2 className="h-4 w-4 mr-2" />
                {t("sensory.auditory.speakers")}
              </Button>
            </div>
          </div>

          <div className="bg-yellow-50 dark:bg-yellow-950 p-4 rounded-lg space-y-2">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="volume-check"
                checked={volumeConfirmed}
                onChange={(e) => setVolumeConfirmed(e.target.checked)}
                className="h-4 w-4"
              />
              <label htmlFor="volume-check" className="text-sm font-medium cursor-pointer">
                {t("sensory.auditory.volume_confirm")}
              </label>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row justify-center items-center gap-4 pt-4">
            <Button variant="outline" onClick={handleSkip} className="w-full sm:w-auto bg-transparent">
              {t("common.skip_task")}
            </Button>
            <Button onClick={handleStart} disabled={!volumeConfirmed} className="w-full sm:w-auto">
              {t("sensory.auditory.start_test")}
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (testComplete) {
    return (
      <Card className="w-full max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle>{t("sensory.auditory.complete_title")}</CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <div className="text-6xl">✓</div>
          <p className="text-lg">{t("sensory.auditory.complete_message")}</p>
          <Button onClick={() => onComplete(0)} className="mt-4">
            {t("common.continue")}
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>
          {t("sensory.auditory.trial")} {currentTrialIndex + 1} / {trials.length}
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          {t("sensory.auditory.snr_level")}: {currentTrial.noiseLevel}dB
        </p>
      </CardHeader>
      <CardContent className="space-y-8">
        <div className="flex flex-col items-center justify-center min-h-[200px] space-y-6">
          {isPlaying ? (
            <div className="flex items-center gap-4">
              <Volume2 className="h-16 w-16 text-blue-600 animate-pulse" />
              <p className="text-lg">{t("sensory.auditory.listening")}</p>
            </div>
          ) : (
            <div className="flex items-center gap-4">
              <VolumeX className="h-16 w-16 text-gray-400" />
              <p className="text-lg text-muted-foreground">{t("sensory.auditory.ready")}</p>
            </div>
          )}

          <Button onClick={handleReplay} variant="outline" disabled={isPlaying} className="mt-4 bg-transparent">
            <Volume2 className="h-4 w-4 mr-2" />
            {t("sensory.auditory.replay")}
          </Button>
        </div>

        <div className="space-y-4">
          <label className="text-sm font-medium block text-center">{t("sensory.auditory.enter_digit")}</label>
          <Input
            type="number"
            min="0"
            max="9"
            value={userResponse}
            onChange={(e) => setUserResponse(e.target.value)}
            placeholder="0-9"
            className="text-center text-2xl h-16"
            disabled={isPlaying}
          />
          <Button
            onClick={handleSubmitResponse}
            disabled={userResponse === "" || isPlaying}
            className="w-full"
            size="lg"
          >
            {t("common.submit")}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

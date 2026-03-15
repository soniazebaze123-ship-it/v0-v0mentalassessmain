"use client"

import { useState, useRef, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { useUser } from "@/contexts/user-context"
import { supabase } from "@/lib/supabase"
import { useLanguage } from "@/contexts/language-context"
import { InstructionAudio } from "@/components/ui/instruction-audio"
import {
  generateDigitTriplets,
  playDigitTripletWithNoise,
  calculateSRTAndClassification,
  getDeviceAudioInfo,
  checkAmbientNoise,
  detectHeadphones,
  type AudiogramData,
} from "@/lib/auditory-screening-utils"
import { Headphones, Volume2, VolumeX, AlertCircle, CheckCircle2, Mic } from "lucide-react"
import { AudiogramChart } from "@/components/audiogram-chart"
import { TestProgress } from "@/components/ui/test-progress"
import { ScoreGauge, getScoreRiskLevel } from "@/components/ui/score-gauge"
import { RiskBadge } from "@/components/ui/risk-badge"

interface AuditoryScreeningProps {
  onComplete: (score: number) => void
  onSkip?: () => void
}

type TestPhase = "setup" | "noise-check" | "calibration" | "testing" | "complete"

export function AuditoryScreening({ onComplete, onSkip }: AuditoryScreeningProps) {
  const { t } = useLanguage()
  const { user } = useUser()

  const [phase, setPhase] = useState<TestPhase>("setup")
  const [currentTrialIndex, setCurrentTrialIndex] = useState(0)
  const [userResponse, setUserResponse] = useState("")
  const [results, setResults] = useState<{ correct: boolean; snr: number }[]>([])
  const [isPlaying, setIsPlaying] = useState(false)
  const [volumeLevel, setVolumeLevel] = useState(70)
  const [noiseCheckResult, setNoiseCheckResult] = useState<{
    noiseLevel: number
    acceptable: boolean
    message: string
  } | null>(null)
  const [hasHeadphones, setHasHeadphones] = useState<boolean | null>(null)
  const [audiogramData, setAudiogramData] = useState<AudiogramData | null>(null)
  const [finalScore, setFinalScore] = useState(0)
  const [speechSupported, setSpeechSupported] = useState(true)

  const [trials] = useState(() => generateDigitTriplets(12))
  const audioContextRef = useRef<AudioContext | null>(null)

  useEffect(() => {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext
    if (AudioContextClass) {
      audioContextRef.current = new AudioContextClass()
    }
    setSpeechSupported("speechSynthesis" in window)

    return () => {
      if (audioContextRef.current) {
        audioContextRef.current.close()
      }
    }
  }, [])

  const handleNoiseCheck = async () => {
    const result = await checkAmbientNoise()
    setNoiseCheckResult(result)
    if (result.acceptable) {
      setTimeout(() => setPhase("calibration"), 1500)
    }
  }

  const handleHeadphoneCheck = async () => {
    const detected = await detectHeadphones()
    setHasHeadphones(detected)
  }

  useEffect(() => {
    if (phase === "setup") {
      handleHeadphoneCheck()
    }
  }, [phase])

  const handlePlayCalibrationTone = async () => {
    if (!audioContextRef.current) return
    setIsPlaying(true)

    // Use speech synthesis for calibration too
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel()
      const utterance = new SpeechSynthesisUtterance("1... 2... 3")
      utterance.rate = 0.7
      utterance.volume = volumeLevel / 100
      utterance.onend = () => setIsPlaying(false)
      utterance.onerror = () => setIsPlaying(false)
      window.speechSynthesis.speak(utterance)
    } else {
      // Fallback to tone
      const ctx = audioContextRef.current
      const now = ctx.currentTime
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.frequency.value = 1000
      osc.type = "sine"
      gain.gain.setValueAtTime((volumeLevel / 100) * 0.5, now)
      gain.gain.linearRampToValueAtTime(0, now + 1)
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.start(now)
      osc.stop(now + 1)
      setTimeout(() => setIsPlaying(false), 1100)
    }
  }

  const playTrialAtIndex = async (index: number) => {
    const trial = trials[index]
    if (!audioContextRef.current || !trial) return

    setIsPlaying(true)
    console.log("[v0] Playing trial", index + 1, "digits:", trial.digits.join(""), "SNR:", trial.noiseLevel)
    await playDigitTripletWithNoise(trial.digits, trial.noiseLevel, audioContextRef.current)
    setIsPlaying(false)
  }

  const handleStartTest = () => {
    setPhase("testing")
    setCurrentTrialIndex(0)
    setResults([])
    setTimeout(() => playTrialAtIndex(0), 500)
  }

  const handleSubmitResponse = () => {
    const trial = trials[currentTrialIndex]
    const response = userResponse
      .split("")
      .map((d) => Number.parseInt(d))
      .filter((d) => !isNaN(d))

    const isCorrect =
      response.length === 3 &&
      response[0] === trial.digits[0] &&
      response[1] === trial.digits[1] &&
      response[2] === trial.digits[2]

    console.log("[v0] Trial", currentTrialIndex + 1, "- Expected:", trial.digits.join(""), "Got:", userResponse, "Correct:", isCorrect)

    const newResults = [...results, { correct: isCorrect, snr: trial.noiseLevel }]
    setResults(newResults)
    setUserResponse("")

    const nextIndex = currentTrialIndex + 1
    if (nextIndex < trials.length) {
      setCurrentTrialIndex(nextIndex)
      setTimeout(() => playTrialAtIndex(nextIndex), 800)
    } else {
      const correctCount = newResults.filter((r) => r.correct).length
      console.log("[v0] All trials complete. Correct:", correctCount, "/", newResults.length)
      finishTest(newResults)
    }
  }

  const finishTest = async (finalResults: { correct: boolean; snr: number }[]) => {
    setPhase("complete")

    const {
      speechReceptionThreshold,
      classification,
      normalizedScore,
      percentCorrect,
      audiogramData: audiogram,
    } = calculateSRTAndClassification(finalResults)

    setAudiogramData(audiogram)

    // Score: 100 = best hearing, 0 = worst
    const score = Math.round(Math.max(0, Math.min(100, 100 - normalizedScore)))
    setFinalScore(score)

    console.log("[v0] Auditory results - Score:", score, "SRT:", speechReceptionThreshold, "Classification:", classification, "Correct:", percentCorrect + "%")

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
            correct: finalResults.filter((r) => r.correct).length,
            percent_correct: percentCorrect,
            srt: speechReceptionThreshold,
            audiogram: audiogram,
          },
          device_info: getDeviceAudioInfo(),
          environment_data: {
            ambient_noise: noiseCheckResult?.noiseLevel || 0,
            has_headphones: hasHeadphones,
            volume_level: volumeLevel,
          },
        })
      } catch (error) {
        console.error("[v0] Error saving auditory screening:", error)
      }
    }
  }

  const handleSkip = () => {
    if (onSkip) onSkip()
    else onComplete(0)
  }

  // Setup Phase
  if (phase === "setup") {
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
            <h3 className="font-semibold">Test Requirements</h3>
            <ul className="space-y-3 text-sm">
              <li className="flex items-center gap-2">
                {hasHeadphones ? (
                  <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-yellow-600 shrink-0" />
                )}
                <span>Headphones: {hasHeadphones ? "Detected" : "Not detected (recommended)"}</span>
              </li>
              <li className="flex items-center gap-2">
                {speechSupported ? (
                  <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-red-600 shrink-0" />
                )}
                <span>Speech synthesis: {speechSupported ? "Supported" : "Not supported"}</span>
              </li>
              <li className="flex items-start gap-2 pt-2 border-t">
                <Volume2 className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium">How this test works:</p>
                  <ol className="list-decimal list-inside mt-1 space-y-1 text-muted-foreground">
                    <li>You will hear 3 spoken digits with background noise</li>
                    <li>Type the 3 digits you heard in order</li>
                    <li>The noise level increases each round</li>
                    <li>12 trials total</li>
                  </ol>
                </div>
              </li>
            </ul>
          </div>

          <div className="flex flex-col sm:flex-row justify-center items-center gap-4 pt-4">
            <Button variant="outline" onClick={handleSkip} className="w-full sm:w-auto bg-transparent">
              Skip Test
            </Button>
            <Button onClick={() => { setPhase("noise-check"); handleNoiseCheck() }} className="w-full sm:w-auto">
              Start Ambient Noise Check
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Noise Check Phase
  if (phase === "noise-check") {
    return (
      <Card className="w-full max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mic className="h-6 w-6" />
            Checking Ambient Noise
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {noiseCheckResult ? (
            <div className={`p-6 rounded-lg ${noiseCheckResult.acceptable ? "bg-green-50" : "bg-red-50"}`}>
              <div className="flex items-center gap-3 mb-4">
                {noiseCheckResult.acceptable ? (
                  <CheckCircle2 className="h-8 w-8 text-green-600" />
                ) : (
                  <AlertCircle className="h-8 w-8 text-red-600" />
                )}
                <div>
                  <p className="font-semibold">Ambient Noise Level: {noiseCheckResult.noiseLevel} dBA</p>
                  <p className="text-sm text-muted-foreground">{noiseCheckResult.message}</p>
                </div>
              </div>
              {!noiseCheckResult.acceptable && (
                <div className="flex gap-3">
                  <Button onClick={handleNoiseCheck} variant="outline" className="bg-transparent">
                    Check Again
                  </Button>
                  <Button onClick={() => setPhase("calibration")} variant="secondary">
                    Continue Anyway
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-12">
              <Mic className="h-16 w-16 mx-auto mb-4 animate-pulse text-blue-600" />
              <p>Measuring ambient noise level...</p>
              <p className="text-sm text-muted-foreground mt-2">Please remain quiet</p>
            </div>
          )}
        </CardContent>
      </Card>
    )
  }

  // Calibration Phase
  if (phase === "calibration") {
    return (
      <Card className="w-full max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Volume2 className="h-6 w-6" />
            Volume Calibration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="bg-yellow-50 dark:bg-yellow-950 p-6 rounded-lg space-y-2">
            <p className="font-semibold">Adjust your device volume</p>
            <p className="text-sm text-muted-foreground">
              Click "Play Test Sound" below. You should hear "1, 2, 3" spoken clearly.
              Adjust your device volume until you can hear comfortably.
            </p>
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <VolumeX className="h-5 w-5 shrink-0" />
              <input
                type="range"
                min="30"
                max="100"
                value={volumeLevel}
                onChange={(e) => setVolumeLevel(Number.parseInt(e.target.value))}
                className="flex-1"
              />
              <Volume2 className="h-5 w-5 shrink-0" />
              <span className="w-12 text-right font-mono">{volumeLevel}%</span>
            </div>

            <Button
              onClick={handlePlayCalibrationTone}
              disabled={isPlaying}
              variant="outline"
              className="w-full bg-transparent"
            >
              <Volume2 className="h-4 w-4 mr-2" />
              {isPlaying ? "Playing..." : "Play Test Sound"}
            </Button>
          </div>

          <div className="flex justify-center pt-4">
            <Button onClick={handleStartTest} size="lg">
              Start Hearing Test
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Testing Phase
  if (phase === "testing") {
    const currentTrial = trials[currentTrialIndex]
    const correctSoFar = results.filter((r) => r.correct).length

    return (
      <Card className="w-full max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Trial {currentTrialIndex + 1} / {trials.length}</span>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">SNR: {currentTrial.noiseLevel} dB</Badge>
              <Badge variant="secondary" className="text-xs">{correctSoFar} correct</Badge>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-8">
          <div className="flex flex-col items-center justify-center min-h-[180px] space-y-6">
            {isPlaying ? (
              <div className="flex flex-col items-center gap-3">
                <div className="relative">
                  <Volume2 className="h-16 w-16 text-blue-600 animate-pulse" />
                  <div className="absolute -inset-4 border-2 border-blue-200 rounded-full animate-ping opacity-30"></div>
                </div>
                <p className="text-lg font-medium">Listen carefully...</p>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-3">
                <Volume2 className="h-16 w-16 text-muted-foreground" />
                <p className="text-lg text-muted-foreground">Enter the digits you heard</p>
              </div>
            )}

            <Button
              onClick={() => playTrialAtIndex(currentTrialIndex)}
              variant="outline"
              disabled={isPlaying}
              size="sm"
            >
              <Volume2 className="h-4 w-4 mr-2" />
              Replay
            </Button>
          </div>

          <div className="space-y-4">
            <label className="text-sm font-medium block text-center">
              Type the 3 digits you heard
            </label>
            <Input
              type="text"
              inputMode="numeric"
              maxLength={3}
              value={userResponse}
              onChange={(e) => setUserResponse(e.target.value.replace(/[^0-9]/g, ""))}
              placeholder="_ _ _"
              className="text-center text-4xl h-16 font-mono tracking-[0.5em]"
              disabled={isPlaying}
              autoFocus
            />
            <Button
              onClick={handleSubmitResponse}
              disabled={userResponse.length !== 3 || isPlaying}
              className="w-full"
              size="lg"
            >
              Submit Answer
            </Button>
          </div>

          {/* Progress bar */}
          <div className="space-y-1">
            <div className="w-full bg-muted rounded-full h-2">
              <div
                className="bg-primary rounded-full h-2 transition-all"
                style={{ width: `${(results.length / trials.length) * 100}%` }}
              ></div>
            </div>
            <p className="text-center text-xs text-muted-foreground">
              {results.length} of {trials.length} completed
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Complete Phase
  const correctCount = results.filter((r) => r.correct).length

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>Hearing Screening Complete</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="text-center space-y-4">
          <CheckCircle2 className="h-16 w-16 mx-auto text-green-600" />
          <p className="text-lg font-semibold">Your hearing screening is complete!</p>
        </div>

        {/* Key metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-muted px-3 py-3 rounded-lg text-center">
            <p className="text-xs text-muted-foreground">SRT</p>
            <p className="text-xl font-bold">{audiogramData?.srt ?? 0} dB</p>
            <p className="text-xs text-muted-foreground">SNR</p>
          </div>
          <div className="bg-muted px-3 py-3 rounded-lg text-center">
            <p className="text-xs text-muted-foreground">Classification</p>
            <p className={`text-lg font-bold capitalize ${
              audiogramData?.classification === "normal" ? "text-green-600" :
              audiogramData?.classification === "impaired" ? "text-yellow-600" : "text-red-600"
            }`}>{audiogramData?.classification ?? "N/A"}</p>
          </div>
          <div className="bg-muted px-3 py-3 rounded-lg text-center">
            <p className="text-xs text-muted-foreground">Correct</p>
            <p className="text-xl font-bold">{correctCount}/{results.length}</p>
            <p className="text-xs text-muted-foreground">responses</p>
          </div>
          <div className="bg-muted px-3 py-3 rounded-lg text-center">
            <p className="text-xs text-muted-foreground">Ambient Noise</p>
            <p className="text-xl font-bold">{noiseCheckResult?.noiseLevel ?? "N/A"}</p>
            <p className="text-xs text-muted-foreground">dBA</p>
          </div>
        </div>

        {/* Score bar */}
        <div className="space-y-1">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Hearing Score</span>
            <span className="font-semibold">{finalScore}%</span>
          </div>
          <div className="w-full bg-muted rounded-full h-3">
            <div
              className={`rounded-full h-3 transition-all ${
                finalScore >= 70 ? "bg-green-500" : finalScore >= 40 ? "bg-yellow-500" : "bg-red-500"
              }`}
              style={{ width: `${finalScore}%` }}
            ></div>
          </div>
        </div>

        {/* Audiogram chart */}
        {audiogramData && (
          <div className="mt-4">
            <AudiogramChart data={audiogramData} />
          </div>
        )}

        <div className="flex justify-center pt-4">
          <Button onClick={() => onComplete(finalScore)} size="lg">
            Continue
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

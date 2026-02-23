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

  const [trials] = useState(() => generateDigitTriplets(12))
  const audioContextRef = useRef<AudioContext | null>(null)

  const currentTrial = trials[currentTrialIndex]

  useEffect(() => {
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

  const handleStartNoiseCheck = () => {
    setPhase("noise-check")
    handleNoiseCheck()
  }

  const handlePlayCalibrationTone = async () => {
    if (!audioContextRef.current) return

    setIsPlaying(true)
    const ctx = audioContextRef.current
    const now = ctx.currentTime

    const osc = ctx.createOscillator()
    const gain = ctx.createGain()

    osc.frequency.value = 1000
    osc.type = "sine"

    const amplitude = (volumeLevel / 100) * 0.5
    gain.gain.setValueAtTime(amplitude, now)
    gain.gain.linearRampToValueAtTime(0, now + 1)

    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.start(now)
    osc.stop(now + 1)

    setTimeout(() => setIsPlaying(false), 1100)
  }

  const handleStartTest = () => {
    setPhase("testing")
    setTimeout(() => {
      if (currentTrial) {
        playCurrentTrial()
      }
    }, 500)
  }

  const playCurrentTrial = async () => {
    if (!audioContextRef.current || !currentTrial) return

    setIsPlaying(true)
    await playDigitTripletWithNoise(currentTrial.digits, currentTrial.noiseLevel, audioContextRef.current)
    setIsPlaying(false)
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
      setTimeout(() => {
        // Play the NEXT trial using the index directly
        const nextTrial = trials[nextIndex]
        if (audioContextRef.current && nextTrial) {
          setIsPlaying(true)
          playDigitTripletWithNoise(nextTrial.digits, nextTrial.noiseLevel, audioContextRef.current)
            .then(() => setIsPlaying(false))
        }
      }, 500)
    } else {
      console.log("[v0] All trials complete. Correct:", newResults.filter(r => r.correct).length, "/", newResults.length)
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

    // normalizedScore: 0=best, 100=worst. Convert to percentage where 100=best
    const score = Math.round(Math.max(0, Math.min(100, 100 - normalizedScore)))
    setFinalScore(score)
    console.log("[v0] Auditory final score:", score, "normalizedScore:", normalizedScore, "SRT:", speechReceptionThreshold)
  }

  const handleSkip = () => {
    if (onSkip) {
      onSkip()
    } else {
      onComplete(0)
    }
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
            <ul className="space-y-2 text-sm">
              <li className="flex items-center gap-2">
                {hasHeadphones ? (
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-yellow-600" />
                )}
                <span>Headphones detected: {hasHeadphones ? "Yes" : "No"}</span>
              </li>
              <li>Find a quiet environment (ambient noise &lt;45 dBA)</li>
              <li>Adjust volume to comfortable listening level</li>
              <li>You will hear 3 digits with background noise</li>
              <li>Enter the digits you hear in order</li>
            </ul>
          </div>

          <div className="flex flex-col sm:flex-row justify-center items-center gap-4 pt-4">
            <Button variant="outline" onClick={handleSkip} className="w-full sm:w-auto bg-transparent">
              Skip Test
            </Button>
            <Button onClick={handleStartNoiseCheck} className="w-full sm:w-auto">
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
                <Button onClick={handleNoiseCheck} variant="outline" className="mt-4 bg-transparent">
                  Check Again
                </Button>
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
          <div className="bg-yellow-50 dark:bg-yellow-950 p-6 rounded-lg space-y-4">
            <p className="font-semibold">Adjust volume to comfortable level</p>
            <p className="text-sm">Click "Play Test Tone" and adjust until you can hear clearly but comfortably</p>
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <VolumeX className="h-5 w-5" />
              <input
                type="range"
                min="30"
                max="100"
                value={volumeLevel}
                onChange={(e) => setVolumeLevel(Number.parseInt(e.target.value))}
                className="flex-1"
              />
              <Volume2 className="h-5 w-5" />
              <span className="w-12 text-right">{volumeLevel}%</span>
            </div>

            <Button
              onClick={handlePlayCalibrationTone}
              disabled={isPlaying}
              variant="outline"
              className="w-full bg-transparent"
            >
              <Volume2 className="h-4 w-4 mr-2" />
              Play Test Tone
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
    return (
      <Card className="w-full max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>
              Trial {currentTrialIndex + 1} / {trials.length}
            </span>
            <Badge variant="outline">SNR: {currentTrial.noiseLevel}dB</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-8">
          <div className="flex flex-col items-center justify-center min-h-[200px] space-y-6">
            {isPlaying ? (
              <div className="flex items-center gap-4">
                <Volume2 className="h-16 w-16 text-blue-600 animate-pulse" />
                <p className="text-lg">Listening...</p>
              </div>
            ) : (
              <div className="flex items-center gap-4">
                <VolumeX className="h-16 w-16 text-gray-400" />
                <p className="text-lg text-muted-foreground">Ready for input</p>
              </div>
            )}

            <Button onClick={playCurrentTrial} variant="outline" disabled={isPlaying}>
              <Volume2 className="h-4 w-4 mr-2" />
              Replay
            </Button>
          </div>

          <div className="space-y-4">
            <label className="text-sm font-medium block text-center">Enter the 3 digits you heard (e.g., 357)</label>
            <Input
              type="text"
              maxLength={3}
              value={userResponse}
              onChange={(e) => {
                const val = e.target.value.replace(/[^0-9]/g, "")
                setUserResponse(val)
              }}
              placeholder="000"
              className="text-center text-3xl h-16 font-mono"
              disabled={isPlaying}
            />
            <Button
              onClick={handleSubmitResponse}
              disabled={userResponse.length !== 3 || isPlaying}
              className="w-full"
              size="lg"
            >
              Submit
            </Button>
          </div>

          <div className="text-center text-sm text-muted-foreground">
            {results.length} of {trials.length} completed
          </div>
        </CardContent>
      </Card>
    )
  }

  // Complete Phase
  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>Hearing Test Complete</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="text-center space-y-4">
          <CheckCircle2 className="h-16 w-16 mx-auto text-green-600" />
          <p className="text-lg font-semibold">Your hearing screening is complete!</p>
          {audiogramData && (
            <div className="flex flex-wrap justify-center gap-4 mt-2">
              <div className="bg-muted px-4 py-2 rounded-lg">
                <p className="text-xs text-muted-foreground">Speech Reception Threshold</p>
                <p className="text-xl font-bold">{audiogramData.srt} dB SNR</p>
              </div>
              <div className="bg-muted px-4 py-2 rounded-lg">
                <p className="text-xs text-muted-foreground">Classification</p>
                <p className={`text-xl font-bold capitalize ${
                  audiogramData.classification === "normal" ? "text-green-600" :
                  audiogramData.classification === "impaired" ? "text-yellow-600" : "text-red-600"
                }`}>{audiogramData.classification}</p>
              </div>
              <div className="bg-muted px-4 py-2 rounded-lg">
                <p className="text-xs text-muted-foreground">Correct Responses</p>
                <p className="text-xl font-bold">{results.filter(r => r.correct).length}/{results.length}</p>
              </div>
            </div>
          )}
        </div>

        {audiogramData && (
          <div className="mt-6">
            <AudiogramChart data={audiogramData} />
          </div>
        )}

        <div className="text-center space-y-2">
          <p className="text-sm text-muted-foreground">
            Score: <span className="font-semibold text-foreground">{finalScore}%</span>
          </p>
        </div>

        <div className="flex justify-center pt-4">
          <Button onClick={() => onComplete(finalScore)} size="lg">
            Continue
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

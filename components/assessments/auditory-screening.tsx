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
import { Headphones, Volume2, VolumeX, AlertCircle, CheckCircle2, Mic, Circle } from "lucide-react"
import { AudiogramChart } from "@/components/audiogram-chart"

interface AuditoryScreeningProps {
  onComplete: (score: number) => void
  onSkip?: () => void
  enhanced?: boolean
}

type TestPhase = "audio-mode-selection" | "headphone-check" | "noise-check" | "ear-test-left" | "ear-test-right" | "calibration" | "testing" | "complete"
type AudioMode = "headphones" | "speakers"

export function AuditoryScreening({ onComplete, onSkip, enhanced = false }: AuditoryScreeningProps) {
  const { t, language } = useLanguage()
  const { user } = useUser()

  const [phase, setPhase] = useState<TestPhase>("audio-mode-selection")
  const [audioMode, setAudioMode] = useState<AudioMode | null>(null)
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
  const [headphoneCheckComplete, setHeadphoneCheckComplete] = useState(false)
  const [leftEarTested, setLeftEarTested] = useState(false)
  const [rightEarTested, setRightEarTested] = useState(false)
  const [leftEarResponse, setLeftEarResponse] = useState<"heard" | "not-heard" | null>(null)
  const [rightEarResponse, setRightEarResponse] = useState<"heard" | "not-heard" | null>(null)
  const [audiogramData, setAudiogramData] = useState<AudiogramData | null>(null)
  const [finalScore, setFinalScore] = useState(0)
  const [speechSupported, setSpeechSupported] = useState(true)

  const [trials] = useState(() => generateDigitTriplets(12))
  const audioContextRef = useRef<AudioContext | null>(null)

  // Translations
  const translations = {
    en: {
      title: "Hearing Screening",
      selectAudioMode: "Select Audio Mode",
      headphonesOption: "Using Headphones",
      headphonesDesc: "Recommended for accurate results",
      speakersOption: "Quiet Environment (No Headphones)",
      speakersDesc: "Ensure you are in a silent room",
      checkingHeadphones: "Checking Headphones",
      headphonesDetected: "Headphones Detected",
      headphonesNotDetected: "Headphones Not Detected",
      pleaseConnect: "Please connect your headphones and try again",
      recheckHeadphones: "Check Again",
      continueAnyway: "Continue Anyway",
      leftEarTest: "Left Ear Test",
      rightEarTest: "Right Ear Test",
      playTestSound: "Play Test Sound",
      heardSound: "I Heard the Sound",
      didNotHear: "I Did Not Hear",
      earTestInstruction: "Please listen carefully. A tone will be played. Click the button that matches what you heard.",
      leftEarInstruction: "This test is for your LEFT ear. If using headphones, the sound will play in your left ear only.",
      rightEarInstruction: "This test is for your RIGHT ear. If using headphones, the sound will play in your right ear only.",
      noiseCheck: "Checking Ambient Noise",
      calibration: "Volume Calibration",
      startTest: "Start Hearing Test",
      complete: "Hearing Screening Complete",
      trialOf: "Trial {current} of {total}",
      enterDigits: "Enter the 3 digits you heard",
      submit: "Submit",
      replay: "Replay",
      correct: "correct",
      skip: "Skip Test",
      continue: "Continue",
    },
    zh: {
      title: "听力筛查",
      selectAudioMode: "选择音频模式",
      headphonesOption: "使用耳机",
      headphonesDesc: "推荐使用以获得准确结果",
      speakersOption: "安静环境（无耳机）",
      speakersDesc: "请确保您在安静的房间内",
      checkingHeadphones: "正在检测耳机",
      headphonesDetected: "已检测到耳机",
      headphonesNotDetected: "未检测到耳机",
      pleaseConnect: "请连接耳机后重试",
      recheckHeadphones: "重新检测",
      continueAnyway: "继续测试",
      leftEarTest: "左耳测试",
      rightEarTest: "右耳测试",
      playTestSound: "播放测试音",
      heardSound: "我听到了声音",
      didNotHear: "我没有听到",
      earTestInstruction: "请仔细听。将播放一个声音。点击符合您所听到的按钮。",
      leftEarInstruction: "这是左耳测试。如果使用耳机，声音只会在左耳播放。",
      rightEarInstruction: "这是右耳测试。如果使用耳机，声音只会在右耳播放。",
      noiseCheck: "正在检测环境噪音",
      calibration: "音量校准",
      startTest: "开始听力测试",
      complete: "听力筛查完成",
      trialOf: "第 {current} 次，共 {total} 次",
      enterDigits: "输入您听到的3个数字",
      submit: "提交",
      replay: "重播",
      correct: "正确",
      skip: "跳过测试",
      continue: "继续",
    },
    yue: {
      title: "聽力篩查",
      selectAudioMode: "選擇音頻模式",
      headphonesOption: "使用耳機",
      headphonesDesc: "建議使用以獲得準確結果",
      speakersOption: "安靜環境（冇耳機）",
      speakersDesc: "請確保你喺安靜嘅房間入面",
      checkingHeadphones: "正在檢測耳機",
      headphonesDetected: "已檢測到耳機",
      headphonesNotDetected: "未檢測到耳機",
      pleaseConnect: "請連接耳機後重試",
      recheckHeadphones: "重新檢測",
      continueAnyway: "繼續測試",
      leftEarTest: "左耳測試",
      rightEarTest: "右耳測試",
      playTestSound: "播放測試音",
      heardSound: "我聽到咗聲音",
      didNotHear: "我冇聽到",
      earTestInstruction: "請仔細聽。將會播放一個聲音。撳符合你所聽到嘅按鈕。",
      leftEarInstruction: "呢個係左耳測試。如果用耳機，聲音只會喺左耳播放。",
      rightEarInstruction: "呢個係右耳測試。如果用耳機，聲音只會喺右耳播放。",
      noiseCheck: "正在檢測環境噪音",
      calibration: "音量校準",
      startTest: "開始聽力測試",
      complete: "聽力篩查完成",
      trialOf: "第 {current} 次，共 {total} 次",
      enterDigits: "輸入你聽到嘅3個數字",
      submit: "提交",
      replay: "重播",
      correct: "正確",
      skip: "跳過測試",
      continue: "繼續",
    },
    fr: {
      title: "Dépistage Auditif",
      selectAudioMode: "Sélectionnez le Mode Audio",
      headphonesOption: "Utiliser des Écouteurs",
      headphonesDesc: "Recommandé pour des résultats précis",
      speakersOption: "Environnement Calme (Sans Écouteurs)",
      speakersDesc: "Assurez-vous d'être dans une pièce silencieuse",
      checkingHeadphones: "Vérification des Écouteurs",
      headphonesDetected: "Écouteurs Détectés",
      headphonesNotDetected: "Écouteurs Non Détectés",
      pleaseConnect: "Veuillez connecter vos écouteurs et réessayer",
      recheckHeadphones: "Vérifier à Nouveau",
      continueAnyway: "Continuer Quand Même",
      leftEarTest: "Test Oreille Gauche",
      rightEarTest: "Test Oreille Droite",
      playTestSound: "Jouer le Son Test",
      heardSound: "J'ai Entendu le Son",
      didNotHear: "Je N'ai Pas Entendu",
      earTestInstruction: "Écoutez attentivement. Un son sera joué. Cliquez sur le bouton correspondant à ce que vous avez entendu.",
      leftEarInstruction: "Ce test est pour votre oreille GAUCHE. Si vous utilisez des écouteurs, le son sera joué uniquement dans l'oreille gauche.",
      rightEarInstruction: "Ce test est pour votre oreille DROITE. Si vous utilisez des écouteurs, le son sera joué uniquement dans l'oreille droite.",
      noiseCheck: "Vérification du Bruit Ambiant",
      calibration: "Calibration du Volume",
      startTest: "Commencer le Test Auditif",
      complete: "Dépistage Auditif Terminé",
      trialOf: "Essai {current} sur {total}",
      enterDigits: "Entrez les 3 chiffres entendus",
      submit: "Soumettre",
      replay: "Rejouer",
      correct: "correct",
      skip: "Passer le Test",
      continue: "Continuer",
    },
  }

  const txt = translations[language as keyof typeof translations] || translations.en

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

  const handleSelectAudioMode = (mode: AudioMode) => {
    setAudioMode(mode)
    if (mode === "headphones") {
      setPhase("headphone-check")
      handleHeadphoneCheck()
    } else {
      setPhase("noise-check")
      handleNoiseCheck()
    }
  }

  const handleNoiseCheck = async () => {
    const result = await checkAmbientNoise()
    setNoiseCheckResult(result)
    if (result.acceptable) {
      setTimeout(() => {
        if (audioMode === "headphones") {
          setPhase("ear-test-left")
        } else {
          setPhase("calibration")
        }
      }, 1500)
    }
  }

  const handleHeadphoneCheck = async () => {
    const detected = await detectHeadphones()
    setHasHeadphones(detected)
    setHeadphoneCheckComplete(true)
  }

  const handleContinueFromHeadphoneCheck = () => {
    setPhase("noise-check")
    handleNoiseCheck()
  }

  // Play tone for specific ear
  const playEarTestTone = async (ear: "left" | "right") => {
    if (!audioContextRef.current) return
    setIsPlaying(true)

    const ctx = audioContextRef.current
    const now = ctx.currentTime

    // Create oscillator
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    
    // Create stereo panner for ear-specific sound
    const panner = ctx.createStereoPanner()
    panner.pan.value = ear === "left" ? -1 : 1

    osc.frequency.value = 1000
    osc.type = "sine"
    
    gain.gain.setValueAtTime(0, now)
    gain.gain.linearRampToValueAtTime((volumeLevel / 100) * 0.5, now + 0.1)
    gain.gain.setValueAtTime((volumeLevel / 100) * 0.5, now + 0.9)
    gain.gain.linearRampToValueAtTime(0, now + 1)

    osc.connect(gain)
    gain.connect(panner)
    panner.connect(ctx.destination)

    osc.start(now)
    osc.stop(now + 1)

    setTimeout(() => setIsPlaying(false), 1100)
  }

  const handleLeftEarResponse = (heard: boolean) => {
    setLeftEarResponse(heard ? "heard" : "not-heard")
    setLeftEarTested(true)
    setTimeout(() => setPhase("ear-test-right"), 500)
  }

  const handleRightEarResponse = (heard: boolean) => {
    setRightEarResponse(heard ? "heard" : "not-heard")
    setRightEarTested(true)
    setTimeout(() => setPhase("calibration"), 500)
  }

  const handlePlayCalibrationTone = async () => {
    if (!audioContextRef.current) return
    setIsPlaying(true)

    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel()
      const utterance = new SpeechSynthesisUtterance("1... 2... 3")
      utterance.rate = 0.7
      utterance.volume = volumeLevel / 100
      utterance.onend = () => setIsPlaying(false)
      utterance.onerror = () => setIsPlaying(false)
      window.speechSynthesis.speak(utterance)
    } else {
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

    const newResults = [...results, { correct: isCorrect, snr: trial.noiseLevel }]
    setResults(newResults)
    setUserResponse("")

    const nextIndex = currentTrialIndex + 1
    if (nextIndex < trials.length) {
      setCurrentTrialIndex(nextIndex)
      setTimeout(() => playTrialAtIndex(nextIndex), 800)
    } else {
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

    const score = Math.round(Math.max(0, Math.min(100, 100 - normalizedScore)))
    setFinalScore(score)

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
            audio_mode: audioMode,
            left_ear_response: leftEarResponse,
            right_ear_response: rightEarResponse,
          },
          device_info: getDeviceAudioInfo(),
          environment_data: {
            ambient_noise: noiseCheckResult?.noiseLevel || 0,
            has_headphones: hasHeadphones,
            volume_level: volumeLevel,
          },
        })
      } catch (error) {
        // Error saving - silently continue
      }
    }
  }

  const handleSkip = () => {
    if (onSkip) onSkip()
    else onComplete(0)
  }

  // Audio Mode Selection Phase
  if (phase === "audio-mode-selection") {
    return (
      <Card className="w-full max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Headphones className="h-6 w-6" />
            {txt.title}
          </CardTitle>
          <InstructionAudio instructionKey="sensory.auditory.instruction" className="mt-2" />
        </CardHeader>
        <CardContent className="space-y-6">
          <h3 className="text-lg font-semibold text-center">{txt.selectAudioMode}</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Headphones Option */}
            <button
              onClick={() => handleSelectAudioMode("headphones")}
              className="p-6 border-2 rounded-xl hover:border-primary hover:bg-primary/5 transition-all text-left space-y-3"
            >
              <div className="flex items-center gap-3">
                <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-full">
                  <Headphones className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="font-semibold text-lg">{txt.headphonesOption}</p>
                  <p className="text-sm text-muted-foreground">{txt.headphonesDesc}</p>
                </div>
              </div>
              <Badge variant="secondary" className="mt-2">Recommended</Badge>
            </button>

            {/* Speakers/Quiet Environment Option */}
            <button
              onClick={() => handleSelectAudioMode("speakers")}
              className="p-6 border-2 rounded-xl hover:border-primary hover:bg-primary/5 transition-all text-left space-y-3"
            >
              <div className="flex items-center gap-3">
                <div className="p-3 bg-amber-100 dark:bg-amber-900 rounded-full">
                  <VolumeX className="h-8 w-8 text-amber-600 dark:text-amber-400" />
                </div>
                <div>
                  <p className="font-semibold text-lg">{txt.speakersOption}</p>
                  <p className="text-sm text-muted-foreground">{txt.speakersDesc}</p>
                </div>
              </div>
            </button>
          </div>

          <div className="flex justify-center pt-4">
            <Button variant="outline" onClick={handleSkip} className="bg-transparent">
              {txt.skip}
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Headphone Check Phase
  if (phase === "headphone-check") {
    return (
      <Card className="w-full max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Headphones className="h-6 w-6" />
            {txt.checkingHeadphones}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {!headphoneCheckComplete ? (
            <div className="text-center py-12">
              <Headphones className="h-16 w-16 mx-auto mb-4 animate-pulse text-blue-600" />
              <p>{txt.checkingHeadphones}...</p>
            </div>
          ) : (
            <div className={`p-6 rounded-xl ${hasHeadphones ? "bg-green-50 dark:bg-green-950 border-2 border-green-500" : "bg-amber-50 dark:bg-amber-950 border-2 border-amber-500"}`}>
              <div className="flex items-center gap-4">
                {hasHeadphones ? (
                  <>
                    <div className="p-3 bg-green-100 dark:bg-green-900 rounded-full">
                      <CheckCircle2 className="h-10 w-10 text-green-600" />
                    </div>
                    <div>
                      <p className="font-bold text-xl text-green-700 dark:text-green-300">{txt.headphonesDetected}</p>
                      <p className="text-sm text-green-600 dark:text-green-400">Your headphones are ready for testing</p>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="p-3 bg-amber-100 dark:bg-amber-900 rounded-full">
                      <AlertCircle className="h-10 w-10 text-amber-600" />
                    </div>
                    <div>
                      <p className="font-bold text-xl text-amber-700 dark:text-amber-300">{txt.headphonesNotDetected}</p>
                      <p className="text-sm text-amber-600 dark:text-amber-400">{txt.pleaseConnect}</p>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {headphoneCheckComplete && (
            <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
              {!hasHeadphones && (
                <Button variant="outline" onClick={() => { setHeadphoneCheckComplete(false); handleHeadphoneCheck(); }} className="bg-transparent">
                  {txt.recheckHeadphones}
                </Button>
              )}
              <Button onClick={handleContinueFromHeadphoneCheck}>
                {hasHeadphones ? txt.continue : txt.continueAnyway}
              </Button>
            </div>
          )}
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
            {txt.noiseCheck}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {noiseCheckResult ? (
            <div className={`p-6 rounded-lg ${noiseCheckResult.acceptable ? "bg-green-50 dark:bg-green-950" : "bg-red-50 dark:bg-red-950"}`}>
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
                  <Button onClick={() => audioMode === "headphones" ? setPhase("ear-test-left") : setPhase("calibration")} variant="secondary">
                    {txt.continueAnyway}
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

  // Left Ear Test Phase
  if (phase === "ear-test-left") {
    return (
      <Card className="w-full max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <div className="flex items-center gap-2">
              <Circle className="h-4 w-4 fill-blue-500 text-blue-500" />
              {txt.leftEarTest}
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Ear indicator */}
          <div className="flex justify-center">
            <div className="relative">
              <div className="w-32 h-32 rounded-full bg-muted flex items-center justify-center">
                <Headphones className="h-16 w-16 text-muted-foreground" />
              </div>
              {/* Left ear indicator */}
              <div className="absolute -left-2 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-blue-500 animate-pulse" />
              {/* Right ear indicator (dimmed) */}
              <div className="absolute -right-2 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-gray-300" />
            </div>
          </div>

          <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg text-center">
            <p className="text-sm">{txt.leftEarInstruction}</p>
          </div>

          <p className="text-center text-muted-foreground">{txt.earTestInstruction}</p>

          <div className="flex justify-center">
            <Button 
              onClick={() => playEarTestTone("left")} 
              disabled={isPlaying}
              size="lg"
              className="gap-2"
            >
              <Volume2 className="h-5 w-5" />
              {isPlaying ? "Playing..." : txt.playTestSound}
            </Button>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
            <Button 
              onClick={() => handleLeftEarResponse(true)} 
              variant="outline" 
              className="bg-green-50 hover:bg-green-100 border-green-300 text-green-700"
              size="lg"
            >
              <CheckCircle2 className="h-5 w-5 mr-2" />
              {txt.heardSound}
            </Button>
            <Button 
              onClick={() => handleLeftEarResponse(false)} 
              variant="outline"
              className="bg-red-50 hover:bg-red-100 border-red-300 text-red-700"
              size="lg"
            >
              <AlertCircle className="h-5 w-5 mr-2" />
              {txt.didNotHear}
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Right Ear Test Phase
  if (phase === "ear-test-right") {
    return (
      <Card className="w-full max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <div className="flex items-center gap-2">
              {/* Left ear status */}
              {leftEarResponse === "heard" ? (
                <CheckCircle2 className="h-5 w-5 text-green-500" />
              ) : (
                <AlertCircle className="h-5 w-5 text-amber-500" />
              )}
              <Circle className="h-4 w-4 fill-blue-500 text-blue-500" />
              {txt.rightEarTest}
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Ear indicator */}
          <div className="flex justify-center">
            <div className="relative">
              <div className="w-32 h-32 rounded-full bg-muted flex items-center justify-center">
                <Headphones className="h-16 w-16 text-muted-foreground" />
              </div>
              {/* Left ear indicator (tested) */}
              <div className={`absolute -left-2 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full ${leftEarResponse === "heard" ? "bg-green-500" : "bg-amber-500"}`}>
                {leftEarResponse === "heard" && <CheckCircle2 className="h-6 w-6 text-white" />}
              </div>
              {/* Right ear indicator (active) */}
              <div className="absolute -right-2 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-blue-500 animate-pulse" />
            </div>
          </div>

          <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg text-center">
            <p className="text-sm">{txt.rightEarInstruction}</p>
          </div>

          <p className="text-center text-muted-foreground">{txt.earTestInstruction}</p>

          <div className="flex justify-center">
            <Button 
              onClick={() => playEarTestTone("right")} 
              disabled={isPlaying}
              size="lg"
              className="gap-2"
            >
              <Volume2 className="h-5 w-5" />
              {isPlaying ? "Playing..." : txt.playTestSound}
            </Button>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
            <Button 
              onClick={() => handleRightEarResponse(true)} 
              variant="outline" 
              className="bg-green-50 hover:bg-green-100 border-green-300 text-green-700"
              size="lg"
            >
              <CheckCircle2 className="h-5 w-5 mr-2" />
              {txt.heardSound}
            </Button>
            <Button 
              onClick={() => handleRightEarResponse(false)} 
              variant="outline"
              className="bg-red-50 hover:bg-red-100 border-red-300 text-red-700"
              size="lg"
            >
              <AlertCircle className="h-5 w-5 mr-2" />
              {txt.didNotHear}
            </Button>
          </div>
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
            {txt.calibration}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Ear test results summary if headphones were used */}
          {audioMode === "headphones" && (
            <div className="flex justify-center gap-6 p-4 bg-muted rounded-lg">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Left Ear:</span>
                {leftEarResponse === "heard" ? (
                  <Badge variant="default" className="bg-green-500">Passed</Badge>
                ) : (
                  <Badge variant="secondary" className="bg-amber-500 text-white">Check Needed</Badge>
                )}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Right Ear:</span>
                {rightEarResponse === "heard" ? (
                  <Badge variant="default" className="bg-green-500">Passed</Badge>
                ) : (
                  <Badge variant="secondary" className="bg-amber-500 text-white">Check Needed</Badge>
                )}
              </div>
            </div>
          )}

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
              {isPlaying ? "Playing..." : txt.playTestSound}
            </Button>
          </div>

          <div className="flex justify-center pt-4">
            <Button onClick={handleStartTest} size="lg">
              {txt.startTest}
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
            <span>{txt.trialOf.replace("{current}", String(currentTrialIndex + 1)).replace("{total}", String(trials.length))}</span>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">SNR: {currentTrial.noiseLevel} dB</Badge>
              <Badge variant="secondary" className="text-xs">{correctSoFar} {txt.correct}</Badge>
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
                <p className="text-lg text-muted-foreground">{txt.enterDigits}</p>
              </div>
            )}

            <Button
              onClick={() => playTrialAtIndex(currentTrialIndex)}
              variant="outline"
              disabled={isPlaying}
              size="sm"
            >
              <Volume2 className="h-4 w-4 mr-2" />
              {txt.replay}
            </Button>
          </div>

          <div className="space-y-4">
            <label className="text-sm font-medium block text-center">
              {txt.enterDigits}
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
              {txt.submit}
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
        <CardTitle>{txt.complete}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="text-center space-y-4">
          <CheckCircle2 className="h-16 w-16 mx-auto text-green-600" />
          <p className="text-lg font-semibold">{txt.complete}</p>
        </div>

        {/* Ear test results */}
        {audioMode === "headphones" && (
          <div className="flex justify-center gap-6 p-4 bg-muted rounded-lg">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Left Ear:</span>
              {leftEarResponse === "heard" ? (
                <CheckCircle2 className="h-5 w-5 text-green-500" />
              ) : (
                <AlertCircle className="h-5 w-5 text-amber-500" />
              )}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Right Ear:</span>
              {rightEarResponse === "heard" ? (
                <CheckCircle2 className="h-5 w-5 text-green-500" />
              ) : (
                <AlertCircle className="h-5 w-5 text-amber-500" />
              )}
            </div>
          </div>
        )}

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
            <p className="text-xs text-muted-foreground">Score</p>
            <p className="text-xl font-bold">{finalScore}</p>
            <p className="text-xs text-muted-foreground">/ 100</p>
          </div>
        </div>

        {/* Audiogram */}
        {audiogramData && <AudiogramChart data={audiogramData} />}

        <div className="flex justify-center pt-4">
          <Button onClick={() => onComplete(finalScore)} size="lg">
            {txt.continue}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

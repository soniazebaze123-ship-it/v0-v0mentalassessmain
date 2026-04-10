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
import { Headphones, Volume2, VolumeX, AlertCircle, CheckCircle2, Mic, Radio } from "lucide-react"
import { AudiogramChart } from "@/components/audiogram-chart"
import { TestProgress } from "@/components/ui/test-progress"
import { ScoreGauge, getScoreRiskLevel } from "@/components/ui/score-gauge"
import { RiskBadge } from "@/components/ui/risk-badge"

interface AuditoryScreeningProps {
  onComplete: (score: number) => void
  onSkip?: () => void
  enhanced?: boolean
}

type TestPhase = "mode-selection" | "headphone-check" | "ear-test" | "noise-check" | "calibration" | "testing" | "complete"
type AudioMode = "headphones" | "speakers" | null
type EarTest = "left" | "right" | "both" | null

export function AuditoryScreening({ onComplete, onSkip, enhanced = false }: AuditoryScreeningProps) {
  const { t, language } = useLanguage()
  const { user } = useUser()

  const [phase, setPhase] = useState<TestPhase>("mode-selection")
  const [audioMode, setAudioMode] = useState<AudioMode>(null)
  const [headphonesDetected, setHeadphonesDetected] = useState<boolean | null>(null)
  const [headphonesVerified, setHeadphonesVerified] = useState(false)
  const [leftEarTested, setLeftEarTested] = useState(false)
  const [rightEarTested, setRightEarTested] = useState(false)
  const [currentEarTest, setCurrentEarTest] = useState<EarTest>(null)
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
  const [audiogramData, setAudiogramData] = useState<AudiogramData | null>(null)
  const [finalScore, setFinalScore] = useState(0)
  const [speechSupported, setSpeechSupported] = useState(true)

  const [trials] = useState(() => generateDigitTriplets(12))
  const audioContextRef = useRef<AudioContext | null>(null)

  // Translations
  const texts = {
    en: {
      title: "Hearing Assessment",
      description: "Test your hearing ability with digit recognition",
      selectMode: "Select Audio Mode",
      headphonesOption: "Use Headphones",
      headphonesDesc: "Recommended for accurate results",
      speakersOption: "Quiet Environment (No Headphones)",
      speakersDesc: "Make sure you are in a very quiet room",
      headphonesRecommended: "Headphones Strongly Recommended",
      headphonesRecommendedDesc: "For accurate hearing assessment results, please use headphones or earbuds.",
      checkingHeadphones: "Checking for headphones...",
      headphonesDetected: "Headphones Detected",
      headphonesNotDetected: "Headphones Not Detected",
      pleaseConnect: "Please connect your headphones and try again",
      verifyHeadphones: "Verify Headphones",
      continueWithout: "Continue Without Headphones",
      earTest: "Ear Test",
      earTestDesc: "We will test each ear separately to ensure proper audio",
      testLeftEar: "Test Left Ear",
      testRightEar: "Test Right Ear",
      leftEarReady: "Left Ear Ready",
      rightEarReady: "Right Ear Ready",
      playTestSound: "Play Test Sound",
      hearSound: "Did you hear the sound clearly?",
      yesHeard: "Yes, I heard it",
      noDidntHear: "No, I didn't hear it",
      continueToTest: "Continue to Hearing Test",
      bothEarsRequired: "Both ears must be tested before continuing",
      noiseCheck: "Checking Ambient Noise",
      calibration: "Volume Calibration",
      adjustVolume: "Adjust your device volume",
      startTest: "Start Hearing Test",
      skip: "Skip Test",
      complete: "Hearing Screening Complete",
    },
    zh: {
      title: "听力评估",
      description: "通过数字识别测试您的听力能力",
      selectMode: "选择音频模式",
      headphonesOption: "使用耳机",
      headphonesDesc: "推荐使用以获得准确结果",
      speakersOption: "安静环境（不使用耳机）",
      speakersDesc: "请确保您在非常安静的房间",
      headphonesRecommended: "强烈建议使用耳机",
      headphonesRecommendedDesc: "为获得准确的听力评估结果，请使用耳机或耳塞。",
      checkingHeadphones: "正在检测耳机...",
      headphonesDetected: "已检测到耳机",
      headphonesNotDetected: "未检测到耳机",
      pleaseConnect: "请连接耳机后重试",
      verifyHeadphones: "验证耳机",
      continueWithout: "不使用耳机继续",
      earTest: "耳朵测试",
      earTestDesc: "我们将分别测试每只耳朵以确保音频正常",
      testLeftEar: "测试左耳",
      testRightEar: "测试右耳",
      leftEarReady: "左耳就绪",
      rightEarReady: "右耳就绪",
      playTestSound: "播放测试声音",
      hearSound: "您听到声音了吗？",
      yesHeard: "是的，我听到了",
      noDidntHear: "没有，我没听到",
      continueToTest: "继续听力测试",
      bothEarsRequired: "继续前需要测试双耳",
      noiseCheck: "检测环境噪音",
      calibration: "音量校准",
      adjustVolume: "调整设备音量",
      startTest: "开始听力测试",
      skip: "跳过测试",
      complete: "听力筛查完成",
    },
    yue: {
      title: "聽力評估",
      description: "通過數字識別測試您嘅聽力能力",
      selectMode: "揀選音頻模式",
      headphonesOption: "使用耳機",
      headphonesDesc: "建議使用以獲得準確結果",
      speakersOption: "安靜環境（唔使用耳機）",
      speakersDesc: "請確保您喺非常安靜嘅房間",
      headphonesRecommended: "強烈建議使用耳機",
      headphonesRecommendedDesc: "為獲得準確嘅聽力評估結果，請使用耳機或耳塞。",
      checkingHeadphones: "正在檢測耳機...",
      headphonesDetected: "已檢測到耳機",
      headphonesNotDetected: "未檢測到耳機",
      pleaseConnect: "請連接耳機後重試",
      verifyHeadphones: "驗證耳機",
      continueWithout: "唔使用耳機繼續",
      earTest: "耳仔測試",
      earTestDesc: "我哋會分別測試每隻耳仔以確保音頻正常",
      testLeftEar: "測試左耳",
      testRightEar: "測試右耳",
      leftEarReady: "左耳就緒",
      rightEarReady: "右耳就緒",
      playTestSound: "播放測試聲音",
      hearSound: "你聽到聲音未？",
      yesHeard: "係，我聽到咗",
      noDidntHear: "冇，我冇聽到",
      continueToTest: "繼續聽力測試",
      bothEarsRequired: "繼續前需要測試雙耳",
      noiseCheck: "檢測環境噪音",
      calibration: "音量校準",
      adjustVolume: "調整設備音量",
      startTest: "開始聽力測試",
      skip: "跳過測試",
      complete: "聽力篩查完成",
    },
    fr: {
      title: "Evaluation Auditive",
      description: "Testez votre audition avec la reconnaissance de chiffres",
      selectMode: "Sélectionner le Mode Audio",
      headphonesOption: "Utiliser des Ecouteurs",
      headphonesDesc: "Recommandé pour des résultats précis",
      speakersOption: "Environnement Calme (Sans Ecouteurs)",
      speakersDesc: "Assurez-vous d'être dans une pièce très calme",
      headphonesRecommended: "Ecouteurs Fortement Recommandés",
      headphonesRecommendedDesc: "Pour des résultats précis, veuillez utiliser des écouteurs.",
      checkingHeadphones: "Recherche d'écouteurs...",
      headphonesDetected: "Ecouteurs Détectés",
      headphonesNotDetected: "Ecouteurs Non Détectés",
      pleaseConnect: "Veuillez connecter vos écouteurs et réessayer",
      verifyHeadphones: "Vérifier les Ecouteurs",
      continueWithout: "Continuer Sans Ecouteurs",
      earTest: "Test d'Oreille",
      earTestDesc: "Nous testerons chaque oreille séparément",
      testLeftEar: "Tester l'Oreille Gauche",
      testRightEar: "Tester l'Oreille Droite",
      leftEarReady: "Oreille Gauche Prête",
      rightEarReady: "Oreille Droite Prête",
      playTestSound: "Jouer le Son Test",
      hearSound: "Avez-vous entendu le son clairement?",
      yesHeard: "Oui, je l'ai entendu",
      noDidntHear: "Non, je ne l'ai pas entendu",
      continueToTest: "Continuer vers le Test",
      bothEarsRequired: "Les deux oreilles doivent être testées",
      noiseCheck: "Vérification du Bruit Ambiant",
      calibration: "Calibration du Volume",
      adjustVolume: "Ajustez le volume de votre appareil",
      startTest: "Commencer le Test",
      skip: "Passer le Test",
      complete: "Dépistage Auditif Terminé",
    },
  }

  const txt = texts[language as keyof typeof texts] || texts.en

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

  const handleSelectMode = async (mode: AudioMode) => {
    setAudioMode(mode)
    if (mode === "headphones") {
      setPhase("headphone-check")
      // Auto-detect headphones
      const detected = await detectHeadphones()
      setHeadphonesDetected(detected)
    } else {
      // Skip to noise check for speaker mode
      setPhase("noise-check")
      handleNoiseCheck()
    }
  }

  const handleVerifyHeadphones = async () => {
    const detected = await detectHeadphones()
    setHeadphonesDetected(detected)
    if (detected) {
      setHeadphonesVerified(true)
      setTimeout(() => setPhase("ear-test"), 1000)
    }
  }

  const playEarTestSound = async (ear: "left" | "right") => {
    setCurrentEarTest(ear)
    setIsPlaying(true)
    
    if (!audioContextRef.current) return
    
    const ctx = audioContextRef.current
    const now = ctx.currentTime
    
    // Create oscillator for test tone
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    const panner = ctx.createStereoPanner()
    
    osc.frequency.value = 1000 // 1kHz test tone
    osc.type = "sine"
    
    // Pan left or right
    panner.pan.value = ear === "left" ? -1 : 1
    
    gain.gain.setValueAtTime(0, now)
    gain.gain.linearRampToValueAtTime(0.3, now + 0.1)
    gain.gain.setValueAtTime(0.3, now + 0.9)
    gain.gain.linearRampToValueAtTime(0, now + 1)
    
    osc.connect(panner)
    panner.connect(gain)
    gain.connect(ctx.destination)
    
    osc.start(now)
    osc.stop(now + 1)
    
    setTimeout(() => setIsPlaying(false), 1100)
  }

  const handleEarTestConfirm = (heard: boolean, ear: "left" | "right") => {
    if (heard) {
      if (ear === "left") {
        setLeftEarTested(true)
      } else {
        setRightEarTested(true)
      }
    }
    setCurrentEarTest(null)
  }

  const handleNoiseCheck = async () => {
    const result = await checkAmbientNoise()
    setNoiseCheckResult(result)
    if (result.acceptable) {
      setTimeout(() => setPhase("calibration"), 1500)
    }
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
            left_ear_tested: leftEarTested,
            right_ear_tested: rightEarTested,
          },
          device_info: getDeviceAudioInfo(),
          environment_data: {
            ambient_noise: noiseCheckResult?.noiseLevel || 0,
            has_headphones: audioMode === "headphones",
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

  // Mode Selection Phase
  if (phase === "mode-selection") {
    return (
      <Card className="w-full max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Headphones className="h-6 w-6" />
            {txt.title}
          </CardTitle>
          <p className="text-sm text-muted-foreground">{txt.description}</p>
          <InstructionAudio instructionKey="sensory.auditory.instruction" className="mt-2" />
        </CardHeader>
        <CardContent className="space-y-6">
          <h3 className="text-lg font-semibold text-center">{txt.selectMode}</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Headphones Option */}
            <Card 
              className="cursor-pointer hover:border-primary hover:shadow-lg transition-all border-2"
              onClick={() => handleSelectMode("headphones")}
            >
              <CardContent className="p-6 text-center space-y-4">
                <div className="w-20 h-20 mx-auto bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center">
                  <Headphones className="h-10 w-10 text-white" />
                </div>
                <div>
                  <h4 className="font-semibold text-lg">{txt.headphonesOption}</h4>
                  <p className="text-sm text-muted-foreground mt-1">{txt.headphonesDesc}</p>
                </div>
                <Badge className="bg-green-100 text-green-800 border-green-300">
                  {language === "zh" ? "推荐" : language === "yue" ? "推薦" : "Recommended"}
                </Badge>
              </CardContent>
            </Card>

            {/* Speakers/Quiet Environment Option */}
            <Card 
              className="cursor-pointer hover:border-primary hover:shadow-lg transition-all border-2"
              onClick={() => handleSelectMode("speakers")}
            >
              <CardContent className="p-6 text-center space-y-4">
                <div className="w-20 h-20 mx-auto bg-gradient-to-br from-amber-500 to-orange-600 rounded-full flex items-center justify-center">
                  <Radio className="h-10 w-10 text-white" />
                </div>
                <div>
                  <h4 className="font-semibold text-lg">{txt.speakersOption}</h4>
                  <p className="text-sm text-muted-foreground mt-1">{txt.speakersDesc}</p>
                </div>
              </CardContent>
            </Card>
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
            {txt.verifyHeadphones}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center py-8">
            {headphonesDetected === null ? (
              <div className="space-y-4">
                <Headphones className="h-20 w-20 mx-auto text-blue-500 animate-pulse" />
                <p className="text-lg">{txt.checkingHeadphones}</p>
              </div>
            ) : headphonesDetected ? (
              <div className="space-y-4">
                <div className="w-24 h-24 mx-auto bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircle2 className="h-14 w-14 text-green-600" />
                </div>
                <p className="text-xl font-semibold text-green-700">{txt.headphonesDetected}</p>
                {headphonesVerified && (
                  <Badge className="bg-green-500 text-white">
                    <CheckCircle2 className="h-4 w-4 mr-1" />
                    Verified
                  </Badge>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <div className="w-24 h-24 mx-auto bg-amber-100 rounded-full flex items-center justify-center">
                  <AlertCircle className="h-14 w-14 text-amber-600" />
                </div>
                <p className="text-xl font-semibold text-amber-700">{txt.headphonesNotDetected}</p>
                <p className="text-sm text-muted-foreground">{txt.pleaseConnect}</p>
              </div>
            )}
          </div>

          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Button variant="outline" onClick={handleVerifyHeadphones} className="bg-transparent">
              <Headphones className="h-4 w-4 mr-2" />
              {txt.verifyHeadphones}
            </Button>
            {headphonesDetected && headphonesVerified ? (
              <Button onClick={() => setPhase("ear-test")}>
                {txt.continueToTest}
              </Button>
            ) : (
              <Button variant="secondary" onClick={() => { setPhase("noise-check"); handleNoiseCheck() }}>
                {txt.continueWithout}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    )
  }

  // Ear Test Phase
  if (phase === "ear-test") {
    return (
      <Card className="w-full max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Headphones className="h-6 w-6" />
            {txt.earTest}
          </CardTitle>
          <p className="text-sm text-muted-foreground">{txt.earTestDesc}</p>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left Ear */}
            <Card className={`border-2 ${leftEarTested ? "border-green-500 bg-green-50" : "border-gray-200"}`}>
              <CardContent className="p-6 text-center space-y-4">
                <div className={`w-16 h-16 mx-auto rounded-full flex items-center justify-center ${leftEarTested ? "bg-green-500" : "bg-blue-500"}`}>
                  {leftEarTested ? (
                    <CheckCircle2 className="h-8 w-8 text-white" />
                  ) : (
                    <span className="text-2xl font-bold text-white">L</span>
                  )}
                </div>
                <h4 className="font-semibold">{txt.testLeftEar}</h4>
                
                {leftEarTested ? (
                  <Badge className="bg-green-500 text-white">{txt.leftEarReady}</Badge>
                ) : currentEarTest === "left" ? (
                  <div className="space-y-3">
                    <p className="text-sm">{txt.hearSound}</p>
                    <div className="flex gap-2 justify-center">
                      <Button size="sm" onClick={() => handleEarTestConfirm(true, "left")} className="bg-green-600 hover:bg-green-700">
                        {txt.yesHeard}
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => handleEarTestConfirm(false, "left")}>
                        {txt.noDidntHear}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <Button 
                    onClick={() => playEarTestSound("left")} 
                    disabled={isPlaying}
                    variant="outline"
                  >
                    <Volume2 className="h-4 w-4 mr-2" />
                    {txt.playTestSound}
                  </Button>
                )}
              </CardContent>
            </Card>

            {/* Right Ear */}
            <Card className={`border-2 ${rightEarTested ? "border-green-500 bg-green-50" : "border-gray-200"}`}>
              <CardContent className="p-6 text-center space-y-4">
                <div className={`w-16 h-16 mx-auto rounded-full flex items-center justify-center ${rightEarTested ? "bg-green-500" : "bg-blue-500"}`}>
                  {rightEarTested ? (
                    <CheckCircle2 className="h-8 w-8 text-white" />
                  ) : (
                    <span className="text-2xl font-bold text-white">R</span>
                  )}
                </div>
                <h4 className="font-semibold">{txt.testRightEar}</h4>
                
                {rightEarTested ? (
                  <Badge className="bg-green-500 text-white">{txt.rightEarReady}</Badge>
                ) : currentEarTest === "right" ? (
                  <div className="space-y-3">
                    <p className="text-sm">{txt.hearSound}</p>
                    <div className="flex gap-2 justify-center">
                      <Button size="sm" onClick={() => handleEarTestConfirm(true, "right")} className="bg-green-600 hover:bg-green-700">
                        {txt.yesHeard}
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => handleEarTestConfirm(false, "right")}>
                        {txt.noDidntHear}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <Button 
                    onClick={() => playEarTestSound("right")} 
                    disabled={isPlaying}
                    variant="outline"
                  >
                    <Volume2 className="h-4 w-4 mr-2" />
                    {txt.playTestSound}
                  </Button>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="flex justify-center pt-4">
            {leftEarTested && rightEarTested ? (
              <Button onClick={() => { setPhase("noise-check"); handleNoiseCheck() }} size="lg">
                {txt.continueToTest}
              </Button>
            ) : (
              <p className="text-sm text-muted-foreground">{txt.bothEarsRequired}</p>
            )}
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
            {txt.noiseCheck}
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
            {txt.calibration}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="bg-yellow-50 dark:bg-yellow-950 p-6 rounded-lg space-y-2">
            <p className="font-semibold">{txt.adjustVolume}</p>
            <p className="text-sm text-muted-foreground">
              Click "Play Test Sound" below. You should hear "1, 2, 3" spoken clearly.
            </p>
          </div>

          {/* Show ear test status if using headphones */}
          {audioMode === "headphones" && (
            <div className="flex justify-center gap-4">
              <Badge className={leftEarTested ? "bg-green-500 text-white" : "bg-gray-200"}>
                {leftEarTested && <CheckCircle2 className="h-3 w-3 mr-1" />}
                Left Ear {leftEarTested ? "OK" : "Not Tested"}
              </Badge>
              <Badge className={rightEarTested ? "bg-green-500 text-white" : "bg-gray-200"}>
                {rightEarTested && <CheckCircle2 className="h-3 w-3 mr-1" />}
                Right Ear {rightEarTested ? "OK" : "Not Tested"}
              </Badge>
            </div>
          )}

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
          <p className="text-lg font-semibold">Your hearing screening is complete!</p>
        </div>

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

        {audiogramData && <AudiogramChart data={audiogramData} />}

        <div className="flex justify-center pt-4">
          <Button onClick={() => onComplete(finalScore)} size="lg">
            Continue
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

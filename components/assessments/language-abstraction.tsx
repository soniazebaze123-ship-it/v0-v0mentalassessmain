"use client"

import { useState, useRef, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AssessmentInput } from "@/components/ui/assessment-input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Volume2, VolumeX, Mic, MicOff, CheckCircle, XCircle } from "lucide-react"
import { useLanguage } from "@/contexts/language-context"
import { InstructionAudio } from "@/components/ui/instruction-audio"

interface LanguageAbstractionProps {
  onComplete: (score: number) => void
  onSkip?: () => void
}

// Speech Recognition type definitions
interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList
  resultIndex: number
}

interface SpeechRecognitionResultList {
  length: number
  item(index: number): SpeechRecognitionResult
  [index: number]: SpeechRecognitionResult
}

interface SpeechRecognitionResult {
  length: number
  item(index: number): SpeechRecognitionAlternative
  [index: number]: SpeechRecognitionAlternative
  isFinal: boolean
}

interface SpeechRecognitionAlternative {
  transcript: string
  confidence: number
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean
  interimResults: boolean
  lang: string
  start(): void
  stop(): void
  abort(): void
  onresult: ((event: SpeechRecognitionEvent) => void) | null
  onerror: ((event: Event) => void) | null
  onend: (() => void) | null
  onstart: (() => void) | null
}

declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognition
    webkitSpeechRecognition: new () => SpeechRecognition
  }
}

export function LanguageAbstraction({ onComplete, onSkip }: LanguageAbstractionProps) {
  const { t, language, getSpeechLanguage } = useLanguage()
  const [phase, setPhase] = useState<"repetition" | "similarity">("repetition")
  const [repetitionAnswer, setRepetitionAnswer] = useState("")
  const [similarityAnswer, setSimilarityAnswer] = useState("")
  const [isPlaying, setIsPlaying] = useState(false)
  const [hasPlayedAudio, setHasPlayedAudio] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [recordingSupported, setRecordingSupported] = useState(true)
  const [matchResult, setMatchResult] = useState<"correct" | "incorrect" | null>(null)
  const recognitionRef = useRef<SpeechRecognition | null>(null)

  // Check for speech recognition support
  useEffect(() => {
    const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SpeechRecognitionAPI) {
      setRecordingSupported(false)
    }
  }, [])

  const getSentences = () => {
    // Simplified sentences for MoCA Language Abstraction - easier for elderly patients
    return {
      en: "The cat sat under the table waiting for dinner",
      zh: "他去商店买东西",
      yue: "佢去商店買嘢",
      fr: "Le chat est assis sous la table en attendant le dîner",
    }
  }

  const getSpeechText = () => {
    const sentences = getSentences()
    return sentences[language as keyof typeof sentences] || sentences.en
  }

  const getRecognitionLanguage = () => {
    // Map language codes to BCP 47 tags for Web Speech API
    const langMap: Record<string, string> = {
      en: "en-US",
      zh: "zh-CN",
      yue: "zh-HK", // Cantonese
      fr: "fr-FR",
    }
    return langMap[language] || "en-US"
  }

  const playAudio = () => {
    if (!("speechSynthesis" in window)) {
      alert(t("audio.not_supported"))
      return
    }

    window.speechSynthesis.cancel()

    const textToSpeak = getSpeechText()
    const utterance = new SpeechSynthesisUtterance(textToSpeak)
    utterance.lang = getSpeechLanguage(language)
    utterance.rate = 0.7
    utterance.pitch = 1.0

    const voices = window.speechSynthesis.getVoices()
    const languageCode = getSpeechLanguage(language)
    const preferredVoice = voices.find(
      (voice) => voice.lang === languageCode || voice.lang.startsWith(languageCode.split("-")[0]),
    )

    if (preferredVoice) {
      utterance.voice = preferredVoice
    }

    utterance.onstart = () => setIsPlaying(true)
    utterance.onend = () => {
      setIsPlaying(false)
      setHasPlayedAudio(true)
    }
    utterance.onerror = () => {
      alert(t("audio.error_playing") || "Error playing audio.")
      setIsPlaying(false)
    }

    window.speechSynthesis.speak(utterance)
  }

  const startRecording = () => {
    const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SpeechRecognitionAPI) {
      alert(language === "zh" ? "您的浏览器不支持语音识别" : 
            language === "yue" ? "你嘅瀏覽器唔支援語音識別" :
            language === "fr" ? "Votre navigateur ne prend pas en charge la reconnaissance vocale" :
            "Your browser does not support speech recognition")
      return
    }

    const recognition = new SpeechRecognitionAPI()
    recognition.continuous = false
    recognition.interimResults = false
    recognition.lang = getRecognitionLanguage()

    recognition.onstart = () => {
      setIsRecording(true)
      setMatchResult(null)
    }

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const transcript = event.results[0][0].transcript
      setRepetitionAnswer(transcript)
      
      // Check if the recorded speech matches the target sentence
      const isMatch = checkMatch(transcript)
      setMatchResult(isMatch ? "correct" : "incorrect")
    }

    recognition.onerror = () => {
      setIsRecording(false)
    }

    recognition.onend = () => {
      setIsRecording(false)
    }

    recognitionRef.current = recognition
    recognition.start()
  }

  const stopRecording = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop()
      setIsRecording(false)
    }
  }

  const checkMatch = (spokenText: string): boolean => {
    const sentences = getSentences()
    const targetSentence = sentences[language as keyof typeof sentences] || sentences.en
    
    // Normalize both strings for comparison
    const normalizedSpoken = spokenText.toLowerCase().trim().replace(/[.,!?。，！？]/g, "")
    const normalizedTarget = targetSentence.toLowerCase().trim().replace(/[.,!?。，！？]/g, "")
    
    // Calculate similarity
    const similarity = calculateSimilarity(normalizedSpoken, normalizedTarget)
    return similarity > 0.7 // 70% match threshold
  }

  const calculateSimilarity = (str1: string, str2: string): number => {
    // For Chinese/Cantonese, compare character by character
    if (language === "zh" || language === "yue") {
      const chars1 = str1.split("")
      const chars2 = str2.split("")
      const maxLength = Math.max(chars1.length, chars2.length)
      if (maxLength === 0) return 1
      
      let matches = 0
      chars1.forEach((char) => {
        if (chars2.includes(char)) matches++
      })
      return matches / maxLength
    }
    
    // For English/French, compare word by word
    const words1 = str1.split(/\s+/)
    const words2 = str2.split(/\s+/)
    const maxLength = Math.max(words1.length, words2.length)
    if (maxLength === 0) return 1

    let matches = 0
    words1.forEach((word1) => {
      if (words2.some((word2) => word2.includes(word1) || word1.includes(word2))) {
        matches++
      }
    })
    return matches / maxLength
  }

  const checkRepetition = () => {
    const sentences = getSentences()
    const targetSentence = sentences[language as keyof typeof sentences] || sentences.en
    
    const normalizedAnswer = repetitionAnswer.toLowerCase().trim().replace(/[.,!?。，！？]/g, "")
    const normalizedTarget = targetSentence.toLowerCase().trim().replace(/[.,!?。，！？]/g, "")
    
    const similarity = calculateSimilarity(normalizedAnswer, normalizedTarget)
    return similarity > 0.8 ? 2 : similarity > 0.6 ? 1 : 0
  }

  const checkSimilarity = () => {
    const score = similarityAnswer === "C" ? 2 : 0
    return score
  }

  const handleSubmit = () => {
    if (phase === "repetition") {
      setPhase("similarity")
    } else {
      const repetitionScore = checkRepetition()
      const similarityScore = checkSimilarity()
      const totalScore = repetitionScore + similarityScore
      onComplete(totalScore)
    }
  }

  const handleSkip = () => {
    if (onSkip) {
      onSkip()
    } else {
      onComplete(0)
    }
  }

  const getRecordingLabel = () => {
    if (isRecording) {
      return language === "zh" ? "录音中..." : 
             language === "yue" ? "錄音中..." :
             language === "fr" ? "Enregistrement..." :
             "Recording..."
    }
    return language === "zh" ? "点击录音" : 
           language === "yue" ? "撳錄音" :
           language === "fr" ? "Cliquez pour enregistrer" :
           "Click to Record"
  }

  if (phase === "repetition") {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center justify-between flex-wrap gap-4">
            <span>
              {t("moca.language")} - {t("mmse.repetition")}
            </span>
            <InstructionAudio instructionKey="moca.language.instruction" />
          </CardTitle>
          <p className="text-sm text-muted-foreground">{t("mmse.repetition.instruction")}</p>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Play Audio Button */}
          <div className="text-center space-y-4">
            <Button
              onClick={playAudio}
              disabled={isPlaying}
              className="w-full max-w-xs touch-manipulation min-h-[44px] bg-transparent"
              variant="outline"
            >
              {isPlaying ? (
                <>
                  <VolumeX className="w-4 h-4 mr-2" />
                  {t("audio.playing")}
                </>
              ) : (
                <>
                  <Volume2 className="w-4 h-4 mr-2" />
                  {t("audio.play")}
                </>
              )}
            </Button>

            {hasPlayedAudio && (
              <p className="text-sm text-green-600 dark:text-green-400">✓ {t("audio.played_success")}</p>
            )}
          </div>

          {/* Voice Recording Section */}
          {recordingSupported && hasPlayedAudio && (
            <div className="space-y-4 p-4 bg-muted/50 rounded-lg">
              <Label className="text-base font-medium">
                {language === "zh" ? "语音录入" : 
                 language === "yue" ? "語音錄入" :
                 language === "fr" ? "Enregistrement vocal" :
                 "Voice Recording"}
              </Label>
              <div className="flex flex-col items-center gap-4">
                <Button
                  onClick={isRecording ? stopRecording : startRecording}
                  variant={isRecording ? "destructive" : "outline"}
                  className={`w-full max-w-xs min-h-[56px] touch-manipulation ${isRecording ? "animate-pulse" : ""}`}
                  disabled={isPlaying}
                >
                  {isRecording ? (
                    <>
                      <MicOff className="w-5 h-5 mr-2" />
                      {language === "zh" ? "停止录音" : 
                       language === "yue" ? "停止錄音" :
                       language === "fr" ? "Arrêter" :
                       "Stop Recording"}
                    </>
                  ) : (
                    <>
                      <Mic className="w-5 h-5 mr-2" />
                      {getRecordingLabel()}
                    </>
                  )}
                </Button>
                
                {/* Match Result Indicator */}
                {matchResult && (
                  <div className={`flex items-center gap-2 p-3 rounded-lg ${
                    matchResult === "correct" ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400" : 
                    "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
                  }`}>
                    {matchResult === "correct" ? (
                      <>
                        <CheckCircle className="w-5 h-5" />
                        <span>
                          {language === "zh" ? "匹配正确！" : 
                           language === "yue" ? "匹配正確！" :
                           language === "fr" ? "Correspondance correcte !" :
                           "Correct match!"}
                        </span>
                      </>
                    ) : (
                      <>
                        <XCircle className="w-5 h-5" />
                        <span>
                          {language === "zh" ? "请再试一次" : 
                           language === "yue" ? "請再試一次" :
                           language === "fr" ? "Veuillez réessayer" :
                           "Please try again"}
                        </span>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Manual Text Input */}
          <div className="space-y-4">
            <Label htmlFor="repetition" className="text-base font-medium">
              {language === "zh" ? "或在下方输入句子" : 
               language === "yue" ? "或喺下面輸入句子" :
               language === "fr" ? "Ou tapez la phrase ci-dessous" :
               "Or type the sentence below"}
            </Label>
            <AssessmentInput
              id="repetition"
              value={repetitionAnswer}
              onChange={(e) => {
                setRepetitionAnswer(e.target.value)
                setMatchResult(null)
              }}
              placeholder=""
              className="w-full text-base min-h-[44px] touch-manipulation"
              disabled={!hasPlayedAudio}
            />
          </div>

          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Button
              variant="outline"
              onClick={handleSkip}
              className="touch-manipulation min-h-[44px] order-2 sm:order-1 bg-transparent"
            >
              {t("common.skip_task")}
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!hasPlayedAudio || repetitionAnswer.trim() === ""}
              className="w-full max-w-xs touch-manipulation min-h-[44px] order-1 sm:order-2"
            >
              {t("common.next")}: {t("question.similarity")}
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center justify-between flex-wrap gap-4">
          <span>
            {t("moca.language")} - {t("question.similarity")}
          </span>
          <InstructionAudio instructionKey="question.similarity" />
        </CardTitle>
        <p className="text-sm text-muted-foreground">{t("mmse.attention.instruction")}</p>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <h3 className="text-lg font-medium">{t("question.similarity")}</h3>

          <RadioGroup value={similarityAnswer} onValueChange={setSimilarityAnswer} className="space-y-3">
            <div className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-accent/50 touch-manipulation min-h-[44px]">
              <RadioGroupItem value="A" id="option-a" className="touch-manipulation" />
              <Label htmlFor="option-a" className="text-base cursor-pointer flex-1">
                (A) {t("common.walk")}
              </Label>
            </div>
            <div className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-accent/50 touch-manipulation min-h-[44px]">
              <RadioGroupItem value="B" id="option-b" className="touch-manipulation" />
              <Label htmlFor="option-b" className="text-base cursor-pointer flex-1">
                (B) {t("common.run")}
              </Label>
            </div>
            <div className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-accent/50 touch-manipulation min-h-[44px]">
              <RadioGroupItem value="C" id="option-c" className="touch-manipulation" />
              <Label htmlFor="option-c" className="text-base cursor-pointer flex-1">
                (C) {t("common.wheel")}
              </Label>
            </div>
            <div className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-accent/50 touch-manipulation min-h-[44px]">
              <RadioGroupItem value="D" id="option-d" className="touch-manipulation" />
              <Label htmlFor="option-d" className="text-base cursor-pointer flex-1">
                (D) {t("common.jump")}
              </Label>
            </div>
          </RadioGroup>
        </div>

        <div className="flex flex-col sm:flex-row justify-center gap-4">
          <Button
            variant="outline"
            onClick={handleSkip}
            className="touch-manipulation min-h-[44px] order-2 sm:order-1 bg-transparent"
          >
            {t("common.skip_task")}
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={similarityAnswer === ""}
            className="w-full max-w-xs touch-manipulation min-h-[44px] order-1 sm:order-2"
          >
            {t("common.submit")}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

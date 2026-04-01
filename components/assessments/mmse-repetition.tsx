"use client"

import { useState, useRef, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AssessmentInput } from "@/components/ui/assessment-input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Volume2, VolumeX, Mic, MicOff, CheckCircle, XCircle } from "lucide-react"
import { useLanguage } from "@/contexts/language-context"

interface MMSERepetitionProps {
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

export function MMSERepetition({ onComplete, onSkip }: MMSERepetitionProps) {
  const { t, language } = useLanguage()
  const [answer, setAnswer] = useState("")
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
    // Target sentences for all 4 languages
    return {
      en: "He drew a picture",
      zh: "他画了一幅画",
      yue: "佢畫咗幅畫",
      fr: "Il a dessiné une image",
    }
  }

  const getSpeechText = () => {
    const sentences = getSentences()
    return sentences[language as keyof typeof sentences] || sentences.en
  }

  const getSpeechLanguage = () => {
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
    utterance.lang = getSpeechLanguage()
    utterance.rate = 0.5
    utterance.pitch = 1.0
    utterance.volume = 1.0

    const voices = window.speechSynthesis.getVoices()
    const preferredVoice = voices.find((voice) => voice.lang.startsWith(getSpeechLanguage().split("-")[0]))

    if (preferredVoice) {
      utterance.voice = preferredVoice
    }

    utterance.onstart = () => setIsPlaying(true)
    utterance.onend = () => {
      setIsPlaying(false)
      setHasPlayedAudio(true)
    }
    utterance.onerror = () => {
      alert(t("audio.error_playing"))
      setIsPlaying(false)
    }

    try {
      window.speechSynthesis.speak(utterance)
    } catch (error) {
      setIsPlaying(false)
      alert(t("audio.error_playing"))
    }
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
    recognition.lang = getSpeechLanguage()

    recognition.onstart = () => {
      setIsRecording(true)
      setMatchResult(null)
    }

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const transcript = event.results[0][0].transcript
      setAnswer(transcript)
      
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

  const checkAnswer = () => {
    const sentences = getSentences()
    const targetSentence = sentences[language as keyof typeof sentences] || sentences.en
    
    const normalizedAnswer = answer.toLowerCase().trim().replace(/[.,!?。，！？]/g, "")
    const normalizedTarget = targetSentence.toLowerCase().trim().replace(/[.,!?。，！？]/g, "")
    
    const similarity = calculateSimilarity(normalizedAnswer, normalizedTarget)
    const score = similarity > 0.8 ? 2 : similarity > 0.5 ? 1 : 0
    onComplete(score)
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

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>{t("mmse.repetition")}</CardTitle>
        <p className="text-sm text-muted-foreground">{t("mmse.repetition.instruction")}</p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Play Audio Button */}
        <div className="text-center space-y-4">
          <Button onClick={playAudio} disabled={isPlaying} className="w-full max-w-xs bg-transparent" variant="outline">
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

          {hasPlayedAudio && <p className="text-sm text-green-600">✓ {t("audio.played_success")}</p>}
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
                className={`w-full max-w-xs min-h-[56px] ${isRecording ? "animate-pulse" : ""}`}
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
          <Label htmlFor="repetition">
            {language === "zh" ? "或在下方输入句子" : 
             language === "yue" ? "或喺下面輸入句子" :
             language === "fr" ? "Ou tapez la phrase ci-dessous" :
             "Or type the sentence below"}
          </Label>
          <AssessmentInput
            id="repetition"
            value={answer}
            onChange={(e) => {
              setAnswer(e.target.value)
              setMatchResult(null)
            }}
            placeholder=""
            className="w-full"
            disabled={!hasPlayedAudio}
          />
        </div>

        <div className="flex justify-center space-x-4">
          <Button variant="outline" onClick={handleSkip} className="bg-transparent">
            {t("common.skip_task")}
          </Button>
          <Button onClick={checkAnswer} disabled={!hasPlayedAudio || answer.trim() === ""} className="w-full max-w-xs">
            {t("common.submit")}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

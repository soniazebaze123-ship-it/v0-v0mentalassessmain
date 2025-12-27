"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AssessmentTextarea } from "@/components/ui/assessment-textarea"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { useLanguage } from "@/contexts/language-context"
import { InstructionAudio } from "@/components/ui/instruction-audio"

interface WritingTaskProps {
  onComplete: (score: number) => void
  onSkip?: () => void
}

export function WritingTask({ onComplete, onSkip }: WritingTaskProps) {
  const { t } = useLanguage()
  const [sentence, setSentence] = useState("")

  const evaluateSentence = (text: string) => {
    const words = text.trim().split(/\s+/)

    // Basic evaluation: check if sentence has at least 3 words and makes sense
    if (words.length >= 3) {
      // Check for basic sentence structure (contains common verbs, nouns, etc.)
      const commonVerbs = [
        "is",
        "are",
        "was",
        "were",
        "have",
        "has",
        "had",
        "do",
        "does",
        "did",
        "will",
        "would",
        "can",
        "could",
        "should",
        "go",
        "goes",
        "went",
        "come",
        "came",
        "see",
        "saw",
        "get",
        "got",
        "make",
        "made",
        "take",
        "took",
        "give",
        "gave",
        "think",
        "thought",
        "know",
        "knew",
        "say",
        "said",
        "tell",
        "told",
        "work",
        "worked",
        "play",
        "played",
        "run",
        "ran",
        "walk",
        "walked",
        "eat",
        "ate",
        "drink",
        "drank",
        "sleep",
        "slept",
        "read",
        "write",
        "wrote",
        "like",
        "love",
        "want",
        "need",
        "help",
        "helped",
        "look",
        "looked",
        "find",
        "found",
        "feel",
        "felt",
        "seem",
        "seemed",
        "become",
        "became",
        "leave",
        "left",
        "put",
        "call",
        "called",
        "try",
        "tried",
        "ask",
        "asked",
        "turn",
        "turned",
        "move",
        "moved",
        "live",
        "lived",
        "believe",
        "believed",
        "hold",
        "held",
        "bring",
        "brought",
        "happen",
        "happened",
        "sit",
        "sat",
        "stand",
        "stood",
        "lose",
        "lost",
        "pay",
        "paid",
        "meet",
        "met",
        "include",
        "included",
        "continue",
        "continued",
        "set",
        "learn",
        "learned",
        "change",
        "changed",
        "lead",
        "led",
        "understand",
        "understood",
        "watch",
        "watched",
        "follow",
        "followed",
        "stop",
        "stopped",
        "create",
        "created",
        "speak",
        "spoke",
        "spend",
        "spent",
        "grow",
        "grew",
        "open",
        "opened",
        "win",
        "won",
        "offer",
        "offered",
        "remember",
        "remembered",
        "consider",
        "considered",
        "appear",
        "appeared",
        "buy",
        "bought",
        "wait",
        "waited",
        "serve",
        "served",
        "die",
        "died",
        "send",
        "sent",
        "expect",
        "expected",
        "build",
        "built",
        "stay",
        "stayed",
        "fall",
        "fell",
        "cut",
        "reach",
        "reached",
        "kill",
        "killed",
        "remain",
        "remained",
      ]

      const hasVerb = words.some((word) => commonVerbs.includes(word.toLowerCase().replace(/[.,!?;:]/, "")))

      if (hasVerb) {
        return 2 // Full points for coherent sentence with subject and verb
      }
    }

    return 0 // No points if doesn't meet criteria
  }

  const checkAnswer = () => {
    const score = evaluateSentence(sentence)
    onComplete(score)
  }

  const handleSkip = () => {
    if (onSkip) {
      onSkip()
    } else {
      onComplete(0)
    }
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>{t("mmse.writing")}</CardTitle>
        <p className="text-sm text-gray-600">{t("mmse.writing.instruction")}</p>
        <InstructionAudio instructionKey="mmse.writing.instruction" className="mt-2" />
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <Label htmlFor="sentence">{t("question.write_sentence")}</Label>
          <AssessmentTextarea
            id="sentence"
            value={sentence}
            onChange={(e) => setSentence(e.target.value)}
            placeholder=""
            className="w-full min-h-[100px]"
            rows={4}
          />
        </div>

        <div className="flex justify-center space-x-4">
          <Button variant="outline" onClick={handleSkip}>
            {t("common.skip_task")}
          </Button>
          <Button onClick={checkAnswer} disabled={sentence.trim().length < 5} className="w-full max-w-xs">
            {t("common.submit")}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

"use client"

import { useState } from "react"
import Image from "next/image"
import { BadgeCheck, PackageSearch } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useLanguage } from "@/contexts/language-context"
import { InstructionAudio } from "@/components/ui/instruction-audio"

interface ObjectNamingProps {
  assessmentMode?: "MOCA" | "MMSE"
  onComplete: (score: number) => void
  onSkip?: () => void
}

interface ObjectQuestion {
  image: string
  answerKey: string
  optionKeys: string[]
}

const MOCA_OBJECT_POOL = [
  { image: "/images/moca-house.jpeg", labelKey: "common.house" },
  { image: "/images/moca-bag.jpeg", labelKey: "common.bag" },
  { image: "/images/moca-television.webp", labelKey: "common.television" },
]

const MMSE_OBJECT_POOL = [
  { image: "/images/mmse-fish.png", labelKey: "common.fish" },
  { image: "/images/mmse-noodles.jpeg", labelKey: "common.noodles" },
  { image: "/images/mmse-egg.jpeg", labelKey: "common.egg" },
  { image: "/images/mmse-milk.jpeg", labelKey: "common.milk" },
  { image: "/images/mmse-rice.png", labelKey: "common.rice" },
  { image: "/images/mmse-chicken.jpeg", labelKey: "common.chicken" },
  { image: "/images/mmse-towel-paper.jpeg", labelKey: "common.towel_paper" },
]

function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}

function buildObjectQuestions(assessmentMode: "MOCA" | "MMSE"): ObjectQuestion[] {
  const sourcePool = assessmentMode === "MOCA" ? MOCA_OBJECT_POOL : MMSE_OBJECT_POOL
  const randomizedPool = assessmentMode === "MOCA" ? sourcePool : shuffleArray(sourcePool)
  const questionCount = assessmentMode === "MOCA" ? 3 : 6

  return randomizedPool.slice(0, questionCount).map((item, index) => {
    const distractor = randomizedPool[(index + 1) % randomizedPool.length]

    return {
      image: item.image,
      answerKey: item.labelKey,
      optionKeys: index % 2 === 0 ? [item.labelKey, distractor.labelKey] : [distractor.labelKey, item.labelKey],
    }
  })
}

export function ObjectNaming({ assessmentMode = "MMSE", onComplete, onSkip }: ObjectNamingProps) {
  const { t, localizeText } = useLanguage()
  const [questions] = useState<ObjectQuestion[]>(() => buildObjectQuestions(assessmentMode))
  const [selectedAnswers, setSelectedAnswers] = useState<string[]>(() => Array(buildObjectQuestions(assessmentMode).length).fill(""))
  const isMoca = assessmentMode === "MOCA"
  const palette = isMoca
    ? {
        border: "border-cyan-100/80",
        shadow: "shadow-[0_24px_70px_rgba(6,182,212,0.12)]",
        header: "bg-[radial-gradient(circle_at_top_left,_rgba(34,211,238,0.16),_transparent_30%),linear-gradient(135deg,_rgba(236,254,255,0.98),_rgba(255,255,255,0.98),_rgba(240,249,255,0.96))]",
        accentText: "text-cyan-700",
        iconBg: "bg-cyan-100",
        eyebrow: "text-cyan-600/80",
        title: "text-cyan-950",
        infoBox: "border-cyan-100 bg-cyan-50/70 text-cyan-900",
        cardBorder: "border-cyan-100/80",
        promptChip: "bg-cyan-100 text-cyan-700",
        imageBg: "border-cyan-100 bg-[radial-gradient(circle_at_top,_rgba(224,242,254,0.75),transparent_32%),linear-gradient(180deg,#ffffff_0%,#f2fbff_100%)]",
      }
    : {
        border: "border-blue-100/80",
        shadow: "shadow-[0_24px_70px_rgba(37,99,235,0.12)]",
        header: "bg-[radial-gradient(circle_at_top_left,_rgba(96,165,250,0.20),_transparent_30%),linear-gradient(135deg,_rgba(239,246,255,0.98),_rgba(255,255,255,0.98),_rgba(224,242,254,0.96))]",
        accentText: "text-blue-700",
        iconBg: "bg-blue-100",
        eyebrow: "text-blue-600/80",
        title: "text-blue-950",
        infoBox: "border-blue-100 bg-blue-50/70 text-blue-900",
        cardBorder: "border-blue-100/80",
        promptChip: "bg-blue-100 text-blue-700",
        imageBg: "border-blue-100 bg-[radial-gradient(circle_at_top,_rgba(224,242,254,0.75),transparent_32%),linear-gradient(180deg,#ffffff_0%,#f2fbff_100%)]",
      }

  const handleAnswerSelect = (index: number, optionKey: string) => {
    setSelectedAnswers((previous) => previous.map((value, valueIndex) => (valueIndex === index ? optionKey : value)))
  }

  const checkAnswers = () => {
    const correctCount = questions.reduce((total, question, index) => {
      return total + (selectedAnswers[index] === question.answerKey ? 1 : 0)
    }, 0)

    const score = isMoca ? correctCount : Number((correctCount * (2 / questions.length)).toFixed(5))

    onComplete(score)
  }

  const handleSkip = () => {
    if (onSkip) {
      onSkip()
      return
    }

    onComplete(0)
  }

  return (
    <Card className={`mx-auto w-full max-w-5xl overflow-hidden border ${palette.border} ${palette.shadow}`}>
      <CardHeader className={`${palette.header} pb-6`}>
        <div className={`mb-3 flex items-center gap-2 ${palette.accentText}`}>
          <span className={`inline-flex h-10 w-10 items-center justify-center rounded-2xl ${palette.iconBg} shadow-sm`}>
            <PackageSearch className="h-5 w-5" />
          </span>
          <div>
            <p className={`text-xs font-semibold uppercase tracking-[0.18em] ${palette.eyebrow}`}>
              {localizeText("Premium recognition task", {
                zh: "高级识别任务",
                yue: "高級識別任務",
                fr: "Tâche de reconnaissance premium",
              })}
            </p>
            <CardTitle className={palette.title}>{isMoca ? t("moca.naming") : t("mmse.naming")}</CardTitle>
          </div>
        </div>
        <p className="max-w-2xl text-sm text-slate-600">{isMoca ? t("moca.naming.instruction") : t("mmse.naming.instruction")}</p>
        <InstructionAudio instructionKey={isMoca ? "moca.naming.instruction" : "mmse.naming.instruction"} className="mt-2" />
      </CardHeader>
      <CardContent className="pt-6">
        <div className={`mb-6 rounded-[24px] border p-4 text-sm shadow-sm ${palette.infoBox}`}>
          {localizeText(
            "Each card shows a common item. Tap the correct name to complete the recognition set.",
            {
              zh: "每张卡片都会显示一种常见物品。点击正确名称即可完成识别任务。",
              yue: "每張卡都會顯示一種常見物品。按正確名稱就可以完成識別任務。",
              fr: "Chaque carte présente un objet courant. Touchez le bon nom pour compléter la série de reconnaissance.",
            },
          )}
        </div>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
          {questions.map((question, index) => (
            <div key={`${question.image}-${index}`} className={`space-y-4 rounded-[28px] border bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(248,252,255,0.98))] p-4 shadow-[0_18px_45px_rgba(14,116,144,0.10)] transition-transform duration-300 hover:-translate-y-1 ${palette.cardBorder}`}>
              <div className="flex items-center justify-between">
                <div className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] ${palette.promptChip}`}>
                  {localizeText("Prompt", { zh: "题目", yue: "題目", fr: "Invite" })} {index + 1}
                </div>
                {selectedAnswers[index] === question.answerKey && <BadgeCheck className="h-5 w-5 text-emerald-500" />}
              </div>
              <div className={`relative h-60 w-full overflow-hidden rounded-[24px] border shadow-inner ${palette.imageBg}`}>
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom,_rgba(6,182,212,0.08),transparent_45%)]" />
                <Image
                  src={question.image}
                  alt={t(question.answerKey)}
                  fill
                  className="object-contain p-3 drop-shadow-[0_16px_28px_rgba(15,23,42,0.16)]"
                  priority
                />
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">{t("question.tap_correct_name")}</p>
                <div className="grid gap-2">
                  {question.optionKeys.map((optionKey) => (
                    <Button
                      key={optionKey}
                      type="button"
                      variant={selectedAnswers[index] === optionKey ? "default" : "outline"}
                      className="w-full justify-center rounded-xl"
                      onClick={() => handleAnswerSelect(index, optionKey)}
                    >
                      {t(optionKey)}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 flex flex-col sm:flex-row justify-center items-center space-y-4 sm:space-y-0 sm:space-x-4">
          <Button variant="outline" onClick={handleSkip} className="w-full sm:w-auto bg-transparent">
            {t("common.skip_task")}
          </Button>
          <Button
            onClick={checkAnswers}
            className={`w-full sm:w-auto sm:max-w-xs ${
              isMoca
                ? ""
                : "bg-gradient-to-r from-blue-600 to-sky-500 text-white hover:from-blue-700 hover:to-sky-600"
            }`}
          >
            {t("common.submit")}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

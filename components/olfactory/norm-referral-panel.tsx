"use client"

import { useMemo, useState } from "react"
import type { LanguageCode } from "@/lib/olfactory/types"
import {
  getNormReferencedBand,
  type AgeBand,
  type CognitiveContext,
} from "@/lib/olfactory/clinical-interpretation"

import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface NormReferralPanelProps {
  correctCount: number
  totalQuestions: number
  language?: LanguageCode
}

export function NormReferralPanel({
  correctCount,
  totalQuestions,
  language = "en",
}: NormReferralPanelProps) {
  const [ageBand, setAgeBand] = useState<AgeBand>("60-69")
  const [cognitiveContext, setCognitiveContext] = useState<CognitiveContext>("unknown")
  const [hasNasalConfounder, setHasNasalConfounder] = useState(false)
  const [hasRapidDecline, setHasRapidDecline] = useState(false)
  const [hasSafetyConcern, setHasSafetyConcern] = useState(false)

  const output = useMemo(
    () =>
      getNormReferencedBand({
        correctCount,
        totalQuestions,
        ageBand,
        cognitiveContext,
        hasNasalConfounder,
        hasRapidDecline,
        hasSafetyConcern,
        language,
      }),
    [
      correctCount,
      totalQuestions,
      ageBand,
      cognitiveContext,
      hasNasalConfounder,
      hasRapidDecline,
      hasSafetyConcern,
      language,
    ],
  )

  function urgencyClass(urgency: string) {
    if (urgency === "none") return "bg-green-100 text-green-800 hover:bg-green-100"
    if (urgency === "routine") return "bg-blue-100 text-blue-800 hover:bg-blue-100"
    if (urgency === "priority") return "bg-yellow-100 text-yellow-800 hover:bg-yellow-100"
    return "bg-red-100 text-red-800 hover:bg-red-100"
  }

  return (
    <div className="space-y-5 rounded-lg border p-4">
      <div className="space-y-1">
        <h4 className="text-base font-semibold">
          {language === "zh"
            ? "常模参考分层与转诊建议"
            : language === "yue"
              ? "常模參考分層同轉診建議"
              : language === "fr"
                ? "Bandes de reference et recommandation d'orientation"
                : "Norm-Referenced Bands and Referral Recommendation"}
        </h4>
        <p className="text-sm text-muted-foreground">
          {language === "zh"
            ? "用于临床筛查解释，不作为单独诊断依据。"
            : language === "yue"
              ? "用於臨床篩查解讀，唔可以作單獨診斷依據。"
              : language === "fr"
                ? "Pour l'interpretation du depistage clinique, sans diagnostic autonome."
                : "For clinical screening interpretation, not standalone diagnosis."}
        </p>
      </div>

      <div className="space-y-5">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label>
              {language === "zh" ? "年龄段" : language === "yue" ? "年齡段" : language === "fr" ? "Tranche d'age" : "Age band"}
            </Label>
            <Select value={ageBand} onValueChange={(value) => setAgeBand(value as AgeBand)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="50-59">50-59</SelectItem>
                <SelectItem value="60-69">60-69</SelectItem>
                <SelectItem value="70-79">70-79</SelectItem>
                <SelectItem value="80+">80+</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>
              {language === "zh" ? "认知背景" : language === "yue" ? "認知背景" : language === "fr" ? "Contexte cognitif" : "Cognitive context"}
            </Label>
            <Select
              value={cognitiveContext}
              onValueChange={(value) => setCognitiveContext(value as CognitiveContext)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="unknown">Unknown / screening</SelectItem>
                <SelectItem value="healthy">Healthy control</SelectItem>
                <SelectItem value="mci_suspected">MCI suspected</SelectItem>
                <SelectItem value="ad_suspected">AD suspected</SelectItem>
                <SelectItem value="known_ad">Known AD</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <Label className="flex items-center gap-2 rounded-lg border p-3">
            <Checkbox
              checked={hasNasalConfounder}
              onCheckedChange={(value) => setHasNasalConfounder(Boolean(value))}
            />
            <span>
              {language === "zh"
                ? "鼻塞/感冒/过敏"
                : language === "yue"
                  ? "鼻塞/感冒/過敏"
                  : language === "fr"
                    ? "Congestion/rhume/allergie"
                    : "Nasal cold/allergy"}
            </span>
          </Label>

          <Label className="flex items-center gap-2 rounded-lg border p-3">
            <Checkbox
              checked={hasRapidDecline}
              onCheckedChange={(value) => setHasRapidDecline(Boolean(value))}
            />
            <span>
              {language === "zh"
                ? "近期快速下降"
                : language === "yue"
                  ? "近期快速下降"
                  : language === "fr"
                    ? "Declin rapide recent"
                    : "Recent rapid decline"}
            </span>
          </Label>

          <Label className="flex items-center gap-2 rounded-lg border p-3">
            <Checkbox
              checked={hasSafetyConcern}
              onCheckedChange={(value) => setHasSafetyConcern(Boolean(value))}
            />
            <span>
              {language === "zh"
                ? "安全风险/红旗症状"
                : language === "yue"
                  ? "安全風險/紅旗症狀"
                  : language === "fr"
                    ? "Risque de securite / alerte"
                    : "Safety/red flag concern"}
            </span>
          </Label>
        </div>

        <div className="rounded-lg border p-4">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <Badge className={urgencyClass(output.referralUrgency)}>{output.referralUrgency.toUpperCase()}</Badge>
            <Badge variant="outline">{output.percentileLabel}</Badge>
          </div>

          <p className="text-sm font-medium">{output.normBandLabel[language]}</p>
          <p className="mt-2 text-sm">{output.clinicianRecommendation[language]}</p>
          <p className="mt-3 text-xs text-muted-foreground">{output.caveat[language]}</p>
        </div>
      </div>
    </div>
  )
}

"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useLanguage } from "@/contexts/language-context"

interface MultimodalClinicalGuidanceResult {
  summary: string
  stage?: string
  riskLevel?: string
  profile: {
    probableAD: boolean
    mixedNonAD: boolean
    specialistReferral: boolean
  }
  eegFlags: {
    slowingDetected: boolean
    p300DelayDetected: boolean
    p300AmplitudeReduced: boolean
  }
  sensoryFlags: {
    multisensoryImpairment: boolean
  }
}

interface MultimodalClinicalGuidanceProps {
  result: MultimodalClinicalGuidanceResult | null
}

export function MultimodalClinicalGuidance({ result }: MultimodalClinicalGuidanceProps) {
  const { t, localizeText } = useLanguage()
  if (!result) return null

  const text = (en: string, zh: string, yue: string, fr: string) =>
    localizeText(en, { zh, yue, fr })

  const stageLabels: Record<string, string> = {
    Normal: t("multimodal.stage.normal"),
    "At Risk": t("multimodal.stage.at_risk"),
    "Early MCI": t("multimodal.stage.early_mci"),
    "Intermediate MCI": t("multimodal.stage.intermediate_mci"),
    "Advanced MCI": t("multimodal.stage.advanced_mci"),
    "Mild Dementia": t("multimodal.stage.mild_dementia"),
    "Moderate Dementia": t("multimodal.stage.moderate_dementia"),
    "Severe Dementia": t("multimodal.stage.severe_dementia"),
  }

  const riskLabels: Record<string, string> = {
    Low: t("risk.level.low"),
    Moderate: t("risk.level.moderate"),
    High: t("risk.level.high"),
    "Very High": text("Very High", "非常高", "非常高", "Très élevé"),
  }

  return (
    <Card className="rounded-3xl shadow-sm">
      <CardHeader>
        <CardTitle>{text("Clinical Interpretation & Guidance", "临床解读与建议", "臨床解讀同建議", "Interprétation clinique et orientation")}</CardTitle>
      </CardHeader>

      <CardContent className="space-y-4 text-sm text-slate-700">
        <div className="space-y-1">
          {result.stage ? (
            <p>
              {text("Overall stage", "总体阶段", "整體階段", "Stade global")}:
              {" "}
              {stageLabels[result.stage] ?? result.stage}
            </p>
          ) : null}
          {result.riskLevel ? (
            <p>
              {text("Risk level", "风险等级", "風險等級", "Niveau de risque")}:
              {" "}
              {riskLabels[result.riskLevel] ?? result.riskLevel}
            </p>
          ) : null}
          <p>{localizeText(result.summary)}</p>
        </div>

        {result.profile.probableAD && (
          <div className="p-3 bg-red-50 rounded-xl text-red-700">
            {text(
              "Probable Alzheimer’s disease pattern detected (AT(N) positive).",
              "检测到疑似阿尔茨海默病模式（AT(N) 阳性）。",
              "檢測到疑似阿爾茨海默病模式（AT(N) 陽性）。",
              "Un profil probable de maladie d’Alzheimer a été détecté (AT(N) positif).",
            )}
          </div>
        )}

        {result.profile.mixedNonAD && (
          <div className="p-3 bg-yellow-50 rounded-xl text-yellow-700">
            {text(
              "Mixed or non-Alzheimer’s cognitive impairment suspected.",
              "疑似混合型或非阿尔茨海默病性认知损害。",
              "懷疑係混合型或者非阿爾茨海默病性認知受損。",
              "Une atteinte cognitive mixte ou non-Alzheimer est suspectée.",
            )}
          </div>
        )}

        {result.profile.specialistReferral && (
          <div className="p-3 bg-orange-50 rounded-xl text-orange-700">
            {text(
              "Specialist referral strongly recommended.",
              "强烈建议专科转诊。",
              "強烈建議轉介專科。",
              "Une orientation spécialisée est fortement recommandée.",
            )}
          </div>
        )}

        {result.eegFlags.slowingDetected && (
          <p>{text("EEG shows cortical slowing.", "EEG 显示皮层活动减慢。", "EEG 顯示皮層活動減慢。", "L’EEG montre un ralentissement cortical.")}</p>
        )}
        {result.eegFlags.p300DelayDetected && (
          <p>{text("P300 latency delay observed.", "观察到 P300 潜伏期延迟。", "觀察到 P300 潛伏期延遲。", "Un retard de latence P300 a été observé.")}</p>
        )}
        {result.eegFlags.p300AmplitudeReduced && (
          <p>{text("P300 amplitude reduction detected.", "检测到 P300 振幅降低。", "檢測到 P300 振幅下降。", "Une diminution de l’amplitude P300 a été détectée.")}</p>
        )}

        {result.sensoryFlags.multisensoryImpairment && (
          <p>{text("Multiple sensory deficits detected (high early risk marker).", "检测到多项感觉缺陷（提示较高早期风险）。", "檢測到多項感官缺損（屬較高早期風險指標）。", "Plusieurs déficits sensoriels ont été détectés (marqueur de risque précoce élevé).")}</p>
        )}
      </CardContent>
    </Card>
  )
}
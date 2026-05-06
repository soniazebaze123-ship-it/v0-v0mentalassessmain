import type { LanguageCode, RiskLevel } from "@/lib/olfactory/types"

export type AgeBand = "50-59" | "60-69" | "70-79" | "80+"
export type CognitiveContext = "healthy" | "mci_suspected" | "ad_suspected" | "known_ad" | "unknown"
export type ReferralUrgency = "none" | "routine" | "priority" | "urgent"

export interface NormBandInput {
  correctCount: number
  totalQuestions: number
  ageBand?: AgeBand
  cognitiveContext?: CognitiveContext
  hasNasalConfounder?: boolean
  hasRapidDecline?: boolean
  hasSafetyConcern?: boolean
  language: LanguageCode
}

export interface NormBandOutput {
  riskLevel: RiskLevel
  percentileLabel: string
  normBandLabel: Record<LanguageCode, string>
  referralUrgency: ReferralUrgency
  clinicianRecommendation: Record<LanguageCode, string>
  patientFriendlySummary: Record<LanguageCode, string>
  caveat: Record<LanguageCode, string>
}

export function getNormReferencedBand(input: NormBandInput): NormBandOutput {
  const {
    correctCount,
    totalQuestions,
    ageBand = "60-69",
    cognitiveContext = "unknown",
    hasNasalConfounder = false,
    hasRapidDecline = false,
    hasSafetyConcern = false,
  } = input

  const percent = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0

  let riskLevel: RiskLevel = "normal"
  let percentileLabel = "Expected range"
  let referralUrgency: ReferralUrgency = "none"

  if (correctCount >= 12) {
    riskLevel = "normal"
    percentileLabel = "Expected range"
    referralUrgency = "none"
  } else if (correctCount >= 9) {
    riskLevel = "mild"
    percentileLabel = "Borderline / below expected range"
    referralUrgency = "routine"
  } else {
    riskLevel = "high"
    percentileLabel = "Clearly below expected range"
    referralUrgency = "priority"
  }

  if (ageBand === "80+" && correctCount >= 9 && correctCount <= 10) {
    percentileLabel = "Borderline for advanced age"
  }

  if ((cognitiveContext === "mci_suspected" || cognitiveContext === "ad_suspected") && riskLevel === "mild") {
    referralUrgency = "priority"
  }

  if ((cognitiveContext === "mci_suspected" || cognitiveContext === "ad_suspected") && riskLevel === "high") {
    referralUrgency = "urgent"
  }

  if (hasRapidDecline || hasSafetyConcern) {
    referralUrgency = "urgent"
  }

  if (hasNasalConfounder && referralUrgency !== "urgent") {
    referralUrgency = "routine"
  }

  const recommendationText = {
    none: {
      en: "No immediate referral required from olfactory screening alone.",
      zh: "仅根据嗅觉筛查结果，暂不需要立即转诊。",
      yue: "只根據嗅覺篩查結果，暫時唔需要即刻轉診。",
      fr: "Aucune orientation immediate n'est requise sur la base du depistage olfactif seul.",
    },
    routine: {
      en: "Routine follow-up is recommended. Repeat olfactory testing and combine with MoCA/MMSE.",
      zh: "建议常规随访。可复测嗅觉，并结合MoCA/MMSE评估。",
      yue: "建議常規跟進。可以複測嗅覺，並結合MoCA/MMSE評估。",
      fr: "Un suivi de routine est recommande. Repeter le test olfactif et l'associer au MoCA/MMSE.",
    },
    priority: {
      en: "Priority clinical review is recommended, especially if MoCA/MMSE is abnormal or cognitive complaints are present.",
      zh: "建议优先进行临床复查，尤其是在MoCA/MMSE异常或存在认知主诉时。",
      yue: "建議優先做臨床覆查，尤其係MoCA/MMSE異常或者有認知主訴時。",
      fr: "Une revue clinique prioritaire est recommandee, surtout si le MoCA/MMSE est anormal ou s'il existe des plaintes cognitives.",
    },
    urgent: {
      en: "Urgent referral is recommended due to marked olfactory impairment with cognitive concern or red-flag history.",
      zh: "由于明显嗅觉下降并伴随认知风险或警示病史，建议尽快转诊。",
      yue: "因為嗅覺明顯下降並伴隨認知風險或警示病史，建議盡快轉診。",
      fr: "Une orientation urgente est recommandee en raison d'une atteinte olfactive marquee associee a un risque cognitif ou a des signes d'alerte.",
    },
  }[referralUrgency]

  const bandText = {
    normal: {
      en: `Normal/expected olfactory identification band (${correctCount}/${totalQuestions}, ${percent}%).`,
      zh: `嗅觉识别处于正常/预期范围（${correctCount}/${totalQuestions}，${percent}%）。`,
      yue: `嗅覺識別屬於正常/預期範圍（${correctCount}/${totalQuestions}，${percent}%）。`,
      fr: `Identification olfactive dans la plage normale/attendue (${correctCount}/${totalQuestions}, ${percent}%).`,
    },
    mild: {
      en: `Borderline or mildly reduced olfactory identification band (${correctCount}/${totalQuestions}, ${percent}%).`,
      zh: `嗅觉识别处于临界或轻度下降范围（${correctCount}/${totalQuestions}，${percent}%）。`,
      yue: `嗅覺識別屬於臨界或輕度下降範圍（${correctCount}/${totalQuestions}，${percent}%）。`,
      fr: `Identification olfactive limite ou legerement reduite (${correctCount}/${totalQuestions}, ${percent}%).`,
    },
    high: {
      en: `Markedly reduced olfactory identification band (${correctCount}/${totalQuestions}, ${percent}%).`,
      zh: `嗅觉识别明显下降（${correctCount}/${totalQuestions}，${percent}%）。`,
      yue: `嗅覺識別明顯下降（${correctCount}/${totalQuestions}，${percent}%）。`,
      fr: `Identification olfactive nettement reduite (${correctCount}/${totalQuestions}, ${percent}%).`,
    },
  }[riskLevel]

  const caveat = {
    en: "These bands are app-based screening references, not validated diagnostic cutoffs. Interpret with age, education, culture, nasal status, MoCA/MMSE, EEG, MRI and biomarkers.",
    zh: "这些分层属于应用内筛查参考，并非正式诊断阈值。需结合年龄、教育、文化背景、鼻腔状态、MoCA/MMSE、EEG、MRI及生物标志物综合判断。",
    yue: "呢啲分層係應用內篩查參考，唔係正式診斷閾值。要結合年齡、教育、文化背景、鼻腔狀態、MoCA/MMSE、EEG、MRI同生物標誌物一齊判斷。",
    fr: "Ces bandes sont des references de depistage de l'application, et non des seuils diagnostiques valides. A interpreter avec l'age, l'education, la culture, l'etat nasal, le MoCA/MMSE, l'EEG, l'IRM et les biomarqueurs.",
  }

  return {
    riskLevel,
    percentileLabel,
    normBandLabel: bandText,
    referralUrgency,
    clinicianRecommendation: recommendationText,
    patientFriendlySummary: {
      en: `${bandText.en} ${recommendationText.en}`,
      zh: `${bandText.zh} ${recommendationText.zh}`,
      yue: `${bandText.yue} ${recommendationText.yue}`,
      fr: `${bandText.fr} ${recommendationText.fr}`,
    },
    caveat,
  }
}

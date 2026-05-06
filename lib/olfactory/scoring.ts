import type {
  LanguageCode,
  OlfactoryProtocolVersion,
  OlfactoryResponseItem,
  OlfactoryTestResult,
  RiskLevel,
} from "@/lib/olfactory/types"

export function getRiskLevel(correctCount: number, protocolVersion: OlfactoryProtocolVersion): RiskLevel {
  if (protocolVersion === "temp_v1") {
    if (correctCount <= 4) return "high"
    if (correctCount <= 6) return "mild"
    return "normal"
  }

  if (protocolVersion === "sat_v3_14") {
    if (correctCount <= 8) return "high"
    if (correctCount <= 11) return "mild"
    return "normal"
  }

  if (correctCount <= 6) return "high"
  if (correctCount <= 9) return "mild"
  return "normal"
}

export function getInterpretation(riskLevel: RiskLevel, language: LanguageCode): string {
  const text = {
    normal: {
      en: "No significant olfactory impairment detected on this temporary screening.",
      zh: "该临时筛查未见明显嗅觉功能下降。",
      yue: "呢個臨時篩查未見明顯嗅覺功能下降。",
      fr: "Aucune atteinte olfactive significative n'a ete detectee lors de ce depistage temporaire.",
    },
    mild: {
      en: "Mild olfactory impairment suspected. Consider repeat testing or standardized follow-up.",
      zh: "怀疑存在轻度嗅觉功能下降，建议复测或使用标准化工具进一步评估。",
      yue: "懷疑有輕度嗅覺功能下降，建議複測或用標準化工具再評估。",
      fr: "Une atteinte olfactive legere est suspectee. Un nouveau test ou une evaluation standardisee est recommande.",
    },
    high: {
      en: "Marked olfactory impairment suspected. Recommend further standardized assessment.",
      zh: "怀疑存在明显嗅觉功能下降，建议进一步进行标准化评估。",
      yue: "懷疑有明顯嗅覺功能下降，建議進一步做標準化評估。",
      fr: "Une atteinte olfactive marquee est suspectee. Une evaluation standardisee complementaire est recommandee.",
    },
  }

  return text[riskLevel][language]
}

export function buildOlfactoryResult(
  items: OlfactoryResponseItem[],
  language: LanguageCode,
  protocolVersion: OlfactoryProtocolVersion = "sat_v2",
): OlfactoryTestResult {
  const correctCount = items.filter((item) => item.isCorrect).length
  const totalQuestions = items.length
  const scorePercent = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0
  const riskLevel = getRiskLevel(correctCount, protocolVersion)

  return {
    totalQuestions,
    correctCount,
    scorePercent,
    riskLevel,
    interpretation: {
      en: getInterpretation(riskLevel, "en"),
      zh: getInterpretation(riskLevel, "zh"),
      yue: getInterpretation(riskLevel, "yue"),
      fr: getInterpretation(riskLevel, "fr"),
    },
    items,
  }
}

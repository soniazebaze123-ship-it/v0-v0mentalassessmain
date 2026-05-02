export type TCMConstitutionProfile =
  | "balanced"
  | "qi_deficiency"
  | "yang_deficiency"
  | "yin_deficiency"
  | "phlegm_dampness"
  | "damp_heat"
  | "blood_stasis"
  | "qi_stagnation"
  | "special_constitution"

export type PulseGroup = "floating" | "deep" | "slow_irregular" | "rapid" | "deficiency" | "excess"

export type TCMPulseId =
  | "fu"
  | "hong"
  | "ru"
  | "san"
  | "kou"
  | "ge"
  | "chen"
  | "fu2"
  | "lao"
  | "ruo"
  | "chi"
  | "huan"
  | "se"
  | "jie"
  | "shu"
  | "cu"
  | "dong"
  | "ji"
  | "xu"
  | "xi"
  | "wei"
  | "dai"
  | "duan"
  | "shi"
  | "hua"
  | "xian"
  | "jin"
  | "chang"

export interface TCMPulseOption {
  id: TCMPulseId
  char: string
  pinyin: string
  label: string
  group: PulseGroup
  note: string
  constitutionWeights: Partial<Record<TCMConstitutionProfile, number>>
}

export const TCM_PULSE_GROUP_LABELS: Record<PulseGroup, { en: string; zh: string }> = {
  floating: { en: "Floating / superficial pulses", zh: "浮表类脉象" },
  deep: { en: "Deep / sinking pulses", zh: "沉里类脉象" },
  slow_irregular: { en: "Slow / irregular pulses", zh: "迟涩结类脉象" },
  rapid: { en: "Rapid / urgent pulses", zh: "数促动疾类脉象" },
  deficiency: { en: "Deficiency-type pulses", zh: "虚弱类脉象" },
  excess: { en: "Excess / tense pulses", zh: "实滑弦紧类脉象" },
}

export const TCM_PULSE_SEVERITY_OPTIONS = [
  { value: 0, label: "Not assessed", labelZh: "未评估" },
  { value: 1, label: "Mild", labelZh: "轻度" },
  { value: 2, label: "Moderate", labelZh: "中度" },
  { value: 3, label: "Marked", labelZh: "明显" },
] as const

export const TCM_PULSE_OPTIONS: TCMPulseOption[] = [
  { id: "fu", char: "浮", pinyin: "Fu", label: "Floating", group: "floating", note: "Superficial / exterior tendency", constitutionWeights: { damp_heat: 1, special_constitution: 1 } },
  { id: "hong", char: "洪", pinyin: "Hong", label: "Surging", group: "floating", note: "Full and forceful", constitutionWeights: { damp_heat: 2 } },
  { id: "ru", char: "濡", pinyin: "Ru", label: "Soft", group: "floating", note: "Soft and soggy", constitutionWeights: { phlegm_dampness: 2, qi_deficiency: 1 } },
  { id: "san", char: "散", pinyin: "San", label: "Scattered", group: "floating", note: "Diffuse and weak", constitutionWeights: { qi_deficiency: 2, yin_deficiency: 1 } },
  { id: "kou", char: "芤", pinyin: "Kou", label: "Hollow", group: "floating", note: "Empty in the center", constitutionWeights: { blood_stasis: 2, qi_deficiency: 1 } },
  { id: "ge", char: "革", pinyin: "Ge", label: "Drumskin", group: "floating", note: "Tense and empty", constitutionWeights: { blood_stasis: 1, yin_deficiency: 1 } },

  { id: "chen", char: "沉", pinyin: "Chen", label: "Deep", group: "deep", note: "Interior pattern", constitutionWeights: { yang_deficiency: 2 } },
  { id: "fu2", char: "伏", pinyin: "Fu", label: "Hidden", group: "deep", note: "Deep-hidden", constitutionWeights: { yang_deficiency: 1, qi_stagnation: 1 } },
  { id: "lao", char: "牢", pinyin: "Lao", label: "Firm", group: "deep", note: "Deep, taut and forceful", constitutionWeights: { blood_stasis: 1, qi_stagnation: 1 } },
  { id: "ruo", char: "弱", pinyin: "Ruo", label: "Weak", group: "deep", note: "Deep and forceless", constitutionWeights: { qi_deficiency: 2, yang_deficiency: 2 } },

  { id: "chi", char: "迟", pinyin: "Chi", label: "Slow", group: "slow_irregular", note: "Cold tendency", constitutionWeights: { yang_deficiency: 2 } },
  { id: "huan", char: "缓", pinyin: "Huan", label: "Moderate / relaxed", group: "slow_irregular", note: "Relaxed or slow", constitutionWeights: { phlegm_dampness: 1, yang_deficiency: 1 } },
  { id: "se", char: "涩", pinyin: "Se", label: "Choppy", group: "slow_irregular", note: "Rough flow", constitutionWeights: { blood_stasis: 2 } },
  { id: "jie", char: "结", pinyin: "Jie", label: "Knotted", group: "slow_irregular", note: "Irregular and slow", constitutionWeights: { blood_stasis: 2, qi_stagnation: 1 } },

  { id: "shu", char: "数", pinyin: "Shu", label: "Rapid", group: "rapid", note: "Heat tendency", constitutionWeights: { damp_heat: 2, yin_deficiency: 1 } },
  { id: "cu", char: "促", pinyin: "Cu", label: "Hurried", group: "rapid", note: "Rapid and irregular", constitutionWeights: { damp_heat: 2, qi_stagnation: 1 } },
  { id: "dong", char: "动", pinyin: "Dong", label: "Moving", group: "rapid", note: "Slippery, abrupt movement", constitutionWeights: { damp_heat: 1, qi_stagnation: 1 } },
  { id: "ji", char: "疾", pinyin: "Ji", label: "Swift", group: "rapid", note: "Very rapid", constitutionWeights: { damp_heat: 2, yin_deficiency: 1 } },

  { id: "xu", char: "虚", pinyin: "Xu", label: "Deficient", group: "deficiency", note: "Large but empty", constitutionWeights: { qi_deficiency: 2 } },
  { id: "xi", char: "细", pinyin: "Xi", label: "Fine", group: "deficiency", note: "Thin and small", constitutionWeights: { yin_deficiency: 2, qi_deficiency: 1 } },
  { id: "wei", char: "微", pinyin: "Wei", label: "Faint", group: "deficiency", note: "Extremely weak", constitutionWeights: { yang_deficiency: 2, qi_deficiency: 1 } },
  { id: "dai", char: "代", pinyin: "Dai", label: "Intermittent", group: "deficiency", note: "Stops at regular intervals", constitutionWeights: { qi_deficiency: 1, blood_stasis: 1 } },
  { id: "duan", char: "短", pinyin: "Duan", label: "Short", group: "deficiency", note: "Fails to extend", constitutionWeights: { qi_deficiency: 1, qi_stagnation: 1 } },

  { id: "shi", char: "实", pinyin: "Shi", label: "Excess", group: "excess", note: "Forceful fullness", constitutionWeights: { damp_heat: 1, qi_stagnation: 1 } },
  { id: "hua", char: "滑", pinyin: "Hua", label: "Slippery", group: "excess", note: "Smooth like pearls", constitutionWeights: { phlegm_dampness: 2, damp_heat: 1 } },
  { id: "xian", char: "弦", pinyin: "Xian", label: "Wiry", group: "excess", note: "Taut like a string", constitutionWeights: { qi_stagnation: 2, blood_stasis: 1 } },
  { id: "jin", char: "紧", pinyin: "Jin", label: "Tight", group: "excess", note: "Tense and forceful", constitutionWeights: { qi_stagnation: 1, yang_deficiency: 1, blood_stasis: 1 } },
  { id: "chang", char: "长", pinyin: "Chang", label: "Long", group: "excess", note: "Extends beyond normal position", constitutionWeights: { qi_stagnation: 1, damp_heat: 1 } },
]

export function calculatePulseContribution(selectedPulseIds: TCMPulseId[], severity: number) {
  const adjustments: Record<TCMConstitutionProfile, number> = {
    balanced: 0,
    qi_deficiency: 0,
    yang_deficiency: 0,
    yin_deficiency: 0,
    phlegm_dampness: 0,
    damp_heat: 0,
    blood_stasis: 0,
    qi_stagnation: 0,
    special_constitution: 0,
  }

  const selectedOptions = TCM_PULSE_OPTIONS.filter((option) => selectedPulseIds.includes(option.id))

  for (const option of selectedOptions) {
    for (const [constitution, weight] of Object.entries(option.constitutionWeights)) {
      adjustments[constitution as TCMConstitutionProfile] += (weight ?? 0) * severity * 4
    }
  }

  const balanceReduction = Math.min(20, selectedOptions.length * Math.max(severity, 0) * 2)
  const clinicalPulseScore = Math.min(100, selectedOptions.length * Math.max(severity, 0) * 8)

  return {
    adjustments,
    balanceReduction,
    clinicalPulseScore,
    selectedOptions,
  }
}

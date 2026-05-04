"use client"

import { useState, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, ArrowRight, CheckCircle2, Leaf, Heart, Droplets, Wind, Flame, Moon, Sun, Sparkles, Upload, Camera, X, ImageIcon, Activity, ChevronDown, ChevronUp, Check } from "lucide-react"
import { InstructionAudio } from "@/components/ui/instruction-audio"
import { useLanguage } from "@/contexts/language-context"
import { useUser } from "@/contexts/user-context"
import { supabase } from "@/lib/supabase"
import Image from "next/image"

// TCM Constitution Types
type TCMConstitution =
  | "balanced"
  | "qi_deficiency"
  | "yang_deficiency"
  | "yin_deficiency"
  | "phlegm_dampness"
  | "damp_heat"
  | "blood_stasis"
  | "qi_stagnation"
  | "special_constitution"

interface TCMQuestion {
  id: string
  text: string
  textZh?: string
  constitution: TCMConstitution
}

interface ConstitutionInfo {
  type: TCMConstitution
  name: string
  nameZh: string
  description: string
  icon: React.ReactNode
  color: string
  recommendations: string[]
}

interface UploadedImage {
  id: string
  type: "tongue" | "face"
  url: string
  preview: string
}

// Pulse Type Categories (脉象分类)
type PulseCategory = 
  | "floating" // 浮脉类
  | "sinking"  // 沉脉类
  | "slow"     // 迟脉类
  | "rapid"    // 数脉类
  | "deficient" // 虚脉类
  | "excess"   // 实脉类

interface PulseType {
  id: string
  name: string
  nameZh: string
  category: PulseCategory
  description: string
  descriptionZh: string
  clinicalSignificance: string
  clinicalSignificanceZh: string
}

interface PulseCategoryInfo {
  category: PulseCategory
  name: string
  nameZh: string
  description: string
  descriptionZh: string
  color: string
}

// 28 Pulse Types organized by category
const PULSE_CATEGORIES: PulseCategoryInfo[] = [
  {
    category: "floating",
    name: "Floating Pulses",
    nameZh: "浮脉类",
    description: "Pulses felt at the superficial level, indicating exterior patterns",
    descriptionZh: "轻取即得，主表证",
    color: "bg-sky-100 text-sky-800 border-sky-300",
  },
  {
    category: "sinking",
    name: "Sinking Pulses",
    nameZh: "沉脉类",
    description: "Pulses felt at the deep level, indicating interior patterns",
    descriptionZh: "重按始得，主里证",
    color: "bg-indigo-100 text-indigo-800 border-indigo-300",
  },
  {
    category: "slow",
    name: "Slow Pulses",
    nameZh: "迟脉类",
    description: "Pulses with slow rate, indicating cold or deficiency",
    descriptionZh: "脉搏缓慢，主寒证、虚证",
    color: "bg-blue-100 text-blue-800 border-blue-300",
  },
  {
    category: "rapid",
    name: "Rapid Pulses",
    nameZh: "数脉类",
    description: "Pulses with fast rate, indicating heat patterns",
    descriptionZh: "脉搏急速，主热证",
    color: "bg-red-100 text-red-800 border-red-300",
  },
  {
    category: "deficient",
    name: "Deficient Pulses",
    nameZh: "虚脉类",
    description: "Pulses lacking strength, indicating deficiency patterns",
    descriptionZh: "脉力不足，主虚证",
    color: "bg-yellow-100 text-yellow-800 border-yellow-300",
  },
  {
    category: "excess",
    name: "Excess Pulses",
    nameZh: "实脉类",
    description: "Pulses with strength and fullness, indicating excess patterns",
    descriptionZh: "脉力充实，主实证",
    color: "bg-green-100 text-green-800 border-green-300",
  },
]

const PULSE_TYPES: PulseType[] = [
  // Floating Pulses (浮脉类): 浮、洪、濡、散、芤、革
  {
    id: "fu",
    name: "Floating (Fu)",
    nameZh: "浮",
    category: "floating",
    description: "Felt with light touch at superficial level",
    descriptionZh: "轻取即得，举之有余，按之不足",
    clinicalSignificance: "Exterior patterns, wind invasion",
    clinicalSignificanceZh: "主表证，外感风邪",
  },
  {
    id: "hong",
    name: "Surging (Hong)",
    nameZh: "洪",
    category: "floating",
    description: "Large, powerful, like rushing waves",
    descriptionZh: "脉体阔大，充实有力，来盛去衰",
    clinicalSignificance: "Excess heat, high fever",
    clinicalSignificanceZh: "主热盛，阳明经证",
  },
  {
    id: "ru",
    name: "Soggy (Ru)",
    nameZh: "濡",
    category: "floating",
    description: "Floating, thin, soft, lacks strength",
    descriptionZh: "浮而细软，轻取即得，重按不显",
    clinicalSignificance: "Dampness, qi and blood deficiency",
    clinicalSignificanceZh: "主湿困，气血两虚",
  },
  {
    id: "san",
    name: "Scattered (San)",
    nameZh: "散",
    category: "floating",
    description: "Floating, scattered, without root",
    descriptionZh: "浮散无根，稀疏不整，至数不齐",
    clinicalSignificance: "Critical illness, yuan qi exhaustion",
    clinicalSignificanceZh: "主元气离散，脏气衰微",
  },
  {
    id: "kou",
    name: "Hollow (Kou)",
    nameZh: "芤",
    category: "floating",
    description: "Floating, large but hollow in middle like scallion",
    descriptionZh: "浮大中空，如按葱管",
    clinicalSignificance: "Blood loss, yin deficiency",
    clinicalSignificanceZh: "主失血，伤阴",
  },
  {
    id: "ge",
    name: "Leather (Ge)",
    nameZh: "革",
    category: "floating",
    description: "Taut and hard on surface, hollow inside",
    descriptionZh: "浮而搏指，中空外坚，如按鼓皮",
    clinicalSignificance: "Essence and blood depletion",
    clinicalSignificanceZh: "主精血亏虚，半产崩漏",
  },
  // Sinking Pulses (沉脉类): 沉、伏、牢、弱
  {
    id: "chen",
    name: "Sinking (Chen)",
    nameZh: "沉",
    category: "sinking",
    description: "Felt only with heavy pressure at deep level",
    descriptionZh: "轻取不应，重按始得",
    clinicalSignificance: "Interior patterns, yang qi constraint",
    clinicalSignificanceZh: "主里证，阳气郁结",
  },
  {
    id: "fu_deep",
    name: "Hidden (Fu)",
    nameZh: "伏",
    category: "sinking",
    description: "Deeper than sinking, felt only at bone level",
    descriptionZh: "重按推筋着骨始得，甚则伏而不见",
    clinicalSignificance: "Severe interior blockage, pain disorders",
    clinicalSignificanceZh: "主邪闭，厥病，痛极",
  },
  {
    id: "lao",
    name: "Firm (Lao)",
    nameZh: "牢",
    category: "sinking",
    description: "Sinking, long, large, forceful and hard",
    descriptionZh: "沉取实大弦长，坚牢不移",
    clinicalSignificance: "Yin cold accumulation, hernia masses",
    clinicalSignificanceZh: "主阴寒内实，疝气癥积",
  },
  {
    id: "ruo",
    name: "Weak (Ruo)",
    nameZh: "弱",
    category: "sinking",
    description: "Sinking, thin, soft and lacks strength",
    descriptionZh: "沉细而软，应指无力",
    clinicalSignificance: "Qi and blood deficiency",
    clinicalSignificanceZh: "主气血不足",
  },
  // Slow Pulses (迟脉类): 迟、缓、涩、结
  {
    id: "chi",
    name: "Slow (Chi)",
    nameZh: "迟",
    category: "slow",
    description: "Less than 4 beats per breath (under 60 bpm)",
    descriptionZh: "一息不足四至，约每分钟60次以下",
    clinicalSignificance: "Cold patterns, yang deficiency",
    clinicalSignificanceZh: "主寒证，阳虚",
  },
  {
    id: "huan",
    name: "Moderate (Huan)",
    nameZh: "缓",
    category: "slow",
    description: "About 4 beats per breath, relaxed and gentle",
    descriptionZh: "一息四至，来去缓怠",
    clinicalSignificance: "Dampness, spleen deficiency, or normal pulse",
    clinicalSignificanceZh: "主湿病，脾虚，或为平脉",
  },
  {
    id: "se",
    name: "Choppy (Se)",
    nameZh: "涩",
    category: "slow",
    description: "Thin, slow, rough like scraping bamboo",
    descriptionZh: "往来艰涩，如轻刀刮竹，迟滞不畅",
    clinicalSignificance: "Blood stasis, essence deficiency, phlegm obstruction",
    clinicalSignificanceZh: "主精伤血少，血瘀痰阻",
  },
  {
    id: "jie",
    name: "Knotted (Jie)",
    nameZh: "结",
    category: "slow",
    description: "Slow with irregular pauses",
    descriptionZh: "脉来缓慢，时有中止，止无定数",
    clinicalSignificance: "Yin excess, qi stagnation, cold phlegm, blood stasis",
    clinicalSignificanceZh: "主阴盛气结，寒痰血瘀",
  },
  // Rapid Pulses (数脉类): 数、促、动、疾
  {
    id: "shuo",
    name: "Rapid (Shu)",
    nameZh: "数",
    category: "rapid",
    description: "More than 5 beats per breath (over 90 bpm)",
    descriptionZh: "一息五至以上，约每分钟90次以上",
    clinicalSignificance: "Heat patterns, deficiency fire",
    clinicalSignificanceZh: "主热证，虚火",
  },
  {
    id: "cu",
    name: "Hasty (Cu)",
    nameZh: "促",
    category: "rapid",
    description: "Rapid with irregular pauses",
    descriptionZh: "脉来数而时有中止，止无定数",
    clinicalSignificance: "Yang excess heat, qi stagnation, phlegm and blood stasis",
    clinicalSignificanceZh: "主阳盛实热，气滞痰瘀",
  },
  {
    id: "dong",
    name: "Stirring (Dong)",
    nameZh: "动",
    category: "rapid",
    description: "Short, slippery, rapid, like jumping beans",
    descriptionZh: "脉形如豆，滑数有力，厥厥动摇，无头无尾",
    clinicalSignificance: "Pain, fright, shock",
    clinicalSignificanceZh: "主痛，主惊",
  },
  {
    id: "ji",
    name: "Racing (Ji)",
    nameZh: "疾",
    category: "rapid",
    description: "Extremely rapid, over 7-8 beats per breath",
    descriptionZh: "脉来急疾，一息七八至",
    clinicalSignificance: "Yang exhaustion, critical condition",
    clinicalSignificanceZh: "主阳气欲脱，元气将竭",
  },
  // Deficient Pulses (虚脉类): 虚、细、微、代、短
  {
    id: "xu",
    name: "Empty (Xu)",
    nameZh: "虚",
    category: "deficient",
    description: "Soft and without strength at all levels",
    descriptionZh: "三部脉举之无力，按之空虚",
    clinicalSignificance: "Qi and blood deficiency",
    clinicalSignificanceZh: "主气血两虚",
  },
  {
    id: "xi",
    name: "Thin (Xi)",
    nameZh: "细",
    category: "deficient",
    description: "Thin as silk thread, soft but distinct",
    descriptionZh: "脉细如线，应指明显",
    clinicalSignificance: "Qi and blood deficiency, dampness",
    clinicalSignificanceZh: "主气血两虚，湿邪",
  },
  {
    id: "wei",
    name: "Faint (Wei)",
    nameZh: "微",
    category: "deficient",
    description: "Extremely thin and soft, barely perceptible",
    descriptionZh: "极细极软，按之欲绝，若有若无",
    clinicalSignificance: "Yang qi declining, critical deficiency",
    clinicalSignificanceZh: "主阳气衰微，气血大虚",
  },
  {
    id: "dai",
    name: "Intermittent (Dai)",
    nameZh: "代",
    category: "deficient",
    description: "Regular pauses at fixed intervals",
    descriptionZh: "脉来缓弱，中止有定数，良久方来",
    clinicalSignificance: "Organ qi decline, wind patterns, pain, fright",
    clinicalSignificanceZh: "主脏气衰微，风证，痛证，惊恐",
  },
  {
    id: "duan",
    name: "Short (Duan)",
    nameZh: "短",
    category: "deficient",
    description: "Felt only in one position, not reaching cun or chi",
    descriptionZh: "首尾俱短，不能满部",
    clinicalSignificance: "Qi deficiency, qi stagnation",
    clinicalSignificanceZh: "主气虚，气郁",
  },
  // Excess Pulses (实脉类): 实、滑、弦、紧、长
  {
    id: "shi",
    name: "Full (Shi)",
    nameZh: "实",
    category: "excess",
    description: "Forceful at all three positions and levels",
    descriptionZh: "三部脉充实有力，来去俱盛",
    clinicalSignificance: "Excess patterns, heat and stagnation",
    clinicalSignificanceZh: "主实证",
  },
  {
    id: "hua",
    name: "Slippery (Hua)",
    nameZh: "滑",
    category: "excess",
    description: "Smooth and flowing, like pearls rolling",
    descriptionZh: "往来流利，如盘走珠",
    clinicalSignificance: "Phlegm, dampness, food stagnation, excess heat, pregnancy",
    clinicalSignificanceZh: "主痰饮，食积，实热，孕妇",
  },
  {
    id: "xian",
    name: "Wiry (Xian)",
    nameZh: "弦",
    category: "excess",
    description: "Taut and straight, like pressing a bow string",
    descriptionZh: "端直以长，如按琴弦",
    clinicalSignificance: "Liver and gallbladder disorders, pain, phlegm retention, malaria",
    clinicalSignificanceZh: "主肝胆病，痛证，痰饮，疟疾",
  },
  {
    id: "jin",
    name: "Tight (Jin)",
    nameZh: "紧",
    category: "excess",
    description: "Tense and taut, like twisted rope",
    descriptionZh: "绷急弹指，如转索状",
    clinicalSignificance: "Cold, pain disorders",
    clinicalSignificanceZh: "主寒，主痛",
  },
  {
    id: "chang",
    name: "Long (Chang)",
    nameZh: "长",
    category: "excess",
    description: "Extends beyond normal position length",
    descriptionZh: "首尾端直，超过本位",
    clinicalSignificance: "Excess patterns, heat excess, yang excess",
    clinicalSignificanceZh: "主阳气有余，阳证热证实证",
  },
]

// Constitution data
const TCM_CONSTITUTIONS: ConstitutionInfo[] = [
  {
    type: "balanced",
    name: "Balanced (Ping He)",
    nameZh: "平和质",
    description: "Energetic, resilient, good sleep and digestion, positive outlook",
    icon: <Sparkles className="h-6 w-6" />,
    color: "bg-green-100 text-green-800 border-green-300",
    recommendations: [
      "Maintain balanced diet",
      "Regular moderate exercise",
      "Consistent sleep schedule",
    ],
  },
  {
    type: "qi_deficiency",
    name: "Qi Deficiency (Qi Xu)",
    nameZh: "气虚质",
    description: "Easily fatigued, shortness of breath, weak voice, prone to colds",
    icon: <Wind className="h-6 w-6" />,
    color: "bg-yellow-100 text-yellow-800 border-yellow-300",
    recommendations: [
      "Eat warm, cooked foods",
      "Gentle exercises like tai chi",
      "Avoid overexertion",
      "Consider ginseng or astragalus tea",
    ],
  },
  {
    type: "yang_deficiency",
    name: "Yang Deficiency (Yang Xu)",
    nameZh: "阳虚质",
    description: "Cold hands/feet, prefers warmth, pale complexion, low energy",
    icon: <Sun className="h-6 w-6" />,
    color: "bg-orange-100 text-orange-800 border-orange-300",
    recommendations: [
      "Eat warming foods (ginger, lamb, cinnamon)",
      "Keep warm, especially lower back and feet",
      "Moderate exercise in sunlight",
      "Avoid cold and raw foods",
    ],
  },
  {
    type: "yin_deficiency",
    name: "Yin Deficiency (Yin Xu)",
    nameZh: "阴虚质",
    description: "Dry skin/mouth, night sweats, warm palms/soles, restlessness",
    icon: <Moon className="h-6 w-6" />,
    color: "bg-blue-100 text-blue-800 border-blue-300",
    recommendations: [
      "Eat nourishing, moistening foods (pears, lily bulb)",
      "Avoid spicy and fried foods",
      "Practice meditation and relaxation",
      "Stay hydrated",
    ],
  },
  {
    type: "phlegm_dampness",
    name: "Phlegm-Dampness (Tan Shi)",
    nameZh: "痰湿质",
    description: "Heavy body, oily skin, chest tightness, prone to weight gain",
    icon: <Droplets className="h-6 w-6" />,
    color: "bg-slate-100 text-slate-800 border-slate-300",
    recommendations: [
      "Light, bland diet",
      "Reduce dairy and greasy foods",
      "Regular aerobic exercise",
      "Consider barley or Job's tears tea",
    ],
  },
  {
    type: "damp_heat",
    name: "Damp-Heat (Shi Re)",
    nameZh: "湿热质",
    description: "Oily face, bitter taste, yellow urine, irritability",
    icon: <Flame className="h-6 w-6" />,
    color: "bg-red-100 text-red-800 border-red-300",
    recommendations: [
      "Eat cooling foods (mung bean, bitter melon)",
      "Avoid alcohol, spicy, and fried foods",
      "Exercise to promote sweating",
      "Keep environment cool and dry",
    ],
  },
  {
    type: "blood_stasis",
    name: "Blood Stasis (Xue Yu)",
    nameZh: "血瘀质",
    description: "Dark complexion, tendency to bruise, fixed pain locations",
    icon: <Heart className="h-6 w-6" />,
    color: "bg-purple-100 text-purple-800 border-purple-300",
    recommendations: [
      "Exercise regularly to promote circulation",
      "Eat blood-moving foods (hawthorn, turmeric)",
      "Avoid cold foods and environments",
      "Consider light massage or acupressure",
    ],
  },
  {
    type: "qi_stagnation",
    name: "Qi Stagnation (Qi Yu)",
    nameZh: "气郁质",
    description: "Emotional fluctuations, sighing, chest/flank distension, stress-prone",
    icon: <Wind className="h-6 w-6" />,
    color: "bg-indigo-100 text-indigo-800 border-indigo-300",
    recommendations: [
      "Regular physical activity",
      "Practice stress relief (meditation, breathing)",
      "Eat fragrant, qi-moving foods (citrus peel, mint)",
      "Socialize and engage in hobbies",
    ],
  },
  {
    type: "special_constitution",
    name: "Special Constitution (Te Bing)",
    nameZh: "特禀质",
    description: "Allergic reactions, sensitive to medications, seasonal symptoms",
    icon: <Leaf className="h-6 w-6" />,
    color: "bg-pink-100 text-pink-800 border-pink-300",
    recommendations: [
      "Identify and avoid allergens",
      "Strengthen immunity with balanced nutrition",
      "Gradual exposure to build tolerance",
      "Consult TCM practitioner for personalized advice",
    ],
  },
]

// Questions for TCM assessment
const TCM_QUESTIONS: TCMQuestion[] = [
  // Qi Deficiency
  { id: "qi1", text: "Do you feel tired or fatigued easily?", textZh: "您容易感到疲劳吗？", constitution: "qi_deficiency" },
  { id: "qi2", text: "Do you get short of breath or feel breathless with minimal effort?", textZh: "您稍微活动就气短吗？", constitution: "qi_deficiency" },
  { id: "qi3", text: "Do you catch colds more often than others?", textZh: "您比别人更容易感冒吗？", constitution: "qi_deficiency" },
  // Yang Deficiency
  { id: "yang1", text: "Do your hands and feet often feel cold?", textZh: "您手脚经常冰凉吗？", constitution: "yang_deficiency" },
  { id: "yang2", text: "Do you prefer warm drinks and food over cold?", textZh: "您喜欢温热的食物和饮料吗？", constitution: "yang_deficiency" },
  { id: "yang3", text: "Do you feel cold when others feel comfortable?", textZh: "别人感觉舒适时您觉得冷吗？", constitution: "yang_deficiency" },
  // Yin Deficiency
  { id: "yin1", text: "Do you experience dry eyes, mouth, or skin?", textZh: "您经常感到眼睛、口腔或皮肤干燥吗？", constitution: "yin_deficiency" },
  { id: "yin2", text: "Do you have warm palms, soles, or chest area?", textZh: "您手心、脚心或胸口发热吗？", constitution: "yin_deficiency" },
  { id: "yin3", text: "Do you experience night sweats?", textZh: "您有盗汗的情况吗？", constitution: "yin_deficiency" },
  // Phlegm-Dampness
  { id: "pd1", text: "Does your body feel heavy or sluggish?", textZh: "您感觉身体沉重或迟缓吗？", constitution: "phlegm_dampness" },
  { id: "pd2", text: "Is your skin or face oily?", textZh: "您的皮肤或脸部容易出油吗？", constitution: "phlegm_dampness" },
  { id: "pd3", text: "Do you feel tightness or fullness in your chest or abdomen?", textZh: "您感到胸闷或腹胀吗？", constitution: "phlegm_dampness" },
  // Damp-Heat
  { id: "dh1", text: "Do you often have a bitter or unusual taste in your mouth?", textZh: "您经常口苦或口中有异味吗？", constitution: "damp_heat" },
  { id: "dh2", text: "Is your face often oily or prone to acne?", textZh: "您的脸部容易出油或长痘吗？", constitution: "damp_heat" },
  { id: "dh3", text: "Do you feel irritable or easily angered?", textZh: "您容易烦躁或发脾气吗？", constitution: "damp_heat" },
  // Blood Stasis
  { id: "bs1", text: "Do you bruise easily?", textZh: "您容易淤青吗？", constitution: "blood_stasis" },
  { id: "bs2", text: "Do you have dark circles under your eyes?", textZh: "您有黑眼圈吗？", constitution: "blood_stasis" },
  { id: "bs3", text: "Do you experience fixed, stabbing pain in specific areas?", textZh: "您身体某些部位有固定的刺痛感吗？", constitution: "blood_stasis" },
  // Qi Stagnation
  { id: "qs1", text: "Do you often feel anxious, depressed, or emotionally unstable?", textZh: "您经常感到焦虑、抑郁或情绪不稳吗？", constitution: "qi_stagnation" },
  { id: "qs2", text: "Do you sigh frequently or feel tightness in your chest?", textZh: "您经常叹气或感到胸闷吗？", constitution: "qi_stagnation" },
  { id: "qs3", text: "Does your mood fluctuate with stress?", textZh: "您的情绪随压力波动吗？", constitution: "qi_stagnation" },
  // Special Constitution
  { id: "sc1", text: "Do you have allergies (skin, respiratory, or food)?", textZh: "您有过敏症状吗（皮肤、呼吸道或食物）？", constitution: "special_constitution" },
  { id: "sc2", text: "Are you sensitive to medications or environmental changes?", textZh: "您对药物或环境变化敏感吗？", constitution: "special_constitution" },
  { id: "sc3", text: "Do you experience seasonal symptoms (hay fever, skin issues)?", textZh: "您有季节性症状吗（花粉症、皮肤问题）？", constitution: "special_constitution" },
  // Balanced (reverse-scored)
  { id: "bal1", text: "Do you generally feel energetic and refreshed?", textZh: "您通常感到精力充沛吗？", constitution: "balanced" },
  { id: "bal2", text: "Is your sleep restful and your appetite normal?", textZh: "您睡眠质量好、食欲正常吗？", constitution: "balanced" },
  { id: "bal3", text: "Do you adapt well to environmental changes?", textZh: "您能很好地适应环境变化吗？", constitution: "balanced" },
]

// Likert scale options
const LIKERT_OPTIONS = [
  { value: 1, label: "Never", labelZh: "从不" },
  { value: 2, label: "Rarely", labelZh: "很少" },
  { value: 3, label: "Sometimes", labelZh: "有时" },
  { value: 4, label: "Often", labelZh: "经常" },
  { value: 5, label: "Always", labelZh: "总是" },
]

interface TCMConstitutionProps {
  onComplete: (score: number, data: {
    primaryConstitution: TCMConstitution
    secondaryConstitution?: TCMConstitution
    constitutionScores: Record<TCMConstitution, number>
    recommendations: string[]
  }) => void
  onBack: () => void
}

export function TCMConstitution({ onComplete, onBack }: TCMConstitutionProps) {
  const { language, localizeText } = useLanguage()
  const { user } = useUser()
  const uiText = (englishText: string, chineseText: string, cantoneseText?: string, frenchText?: string) =>
    localizeText(englishText, {
      zh: chineseText,
      yue: cantoneseText ?? chineseText,
      fr: frenchText,
    })
  const [phase, setPhase] = useState<"intro" | "image_upload" | "pulse_diagnosis" | "questions" | "results">("intro")
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [responses, setResponses] = useState<Record<string, number>>({})
  const [results, setResults] = useState<{
    primaryConstitution: TCMConstitution
    secondaryConstitution?: TCMConstitution
    constitutionScores: Record<TCMConstitution, number>
    recommendations: string[]
  } | null>(null)
  
  // Image upload state
  const [uploadedImages, setUploadedImages] = useState<UploadedImage[]>([])
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [dragActive, setDragActive] = useState(false)
  const [uploadError, setUploadError] = useState("")
  const [currentUploadType, setCurrentUploadType] = useState<"tongue" | "face">("tongue")
  
  // Pulse diagnosis state
  const [selectedPulses, setSelectedPulses] = useState<string[]>([])
  const [pulseNotes, setPulseNotes] = useState("")
  const [expandedCategory, setExpandedCategory] = useState<PulseCategory | null>(null)

  const progress = (currentQuestion / TCM_QUESTIONS.length) * 100

  // Image upload handlers
  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }, [])

  const handleDrop = useCallback((e: React.DragEvent, type: "tongue" | "face") => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleImageUpload(e.dataTransfer.files[0], type)
    }
  }, [])

  const handleImageUpload = async (file: File, type: "tongue" | "face") => {
    if (!file.type.startsWith("image/")) {
      setUploadError(uiText("Please upload an image file", "请上传图片文件"))
      return
    }
    if (file.size > 10 * 1024 * 1024) {
      setUploadError(uiText("Image size must be less than 10MB", "图片大小不能超过10MB"))
      return
    }

    setUploading(true)
    setUploadProgress(0)
    setUploadError("")

    try {
      const fileExt = file.name.split(".").pop()
      const fileName = `tcm/${user?.id}/${type}-${Date.now()}.${fileExt}`
      
      const { error: uploadError } = await supabase.storage
        .from("user-files")
        .upload(fileName, file, { cacheControl: "3600", upsert: false })

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage.from("user-files").getPublicUrl(fileName)
      
      // Save to database
      const { data: fileRecord, error: dbError } = await supabase
        .from("uploaded_files")
        .insert({
          user_id: user?.id,
          filename: `${type}_image.${fileExt}`,
          file_path: fileName,
          file_type: file.type,
          file_size: file.size,
        })
        .select()
        .single()

      if (dbError) throw dbError

      const preview = URL.createObjectURL(file)
      
      // Remove existing image of same type
      setUploadedImages(prev => {
        const filtered = prev.filter(img => img.type !== type)
        return [...filtered, { id: fileRecord.id, type, url: publicUrl, preview }]
      })
      
      setUploadProgress(100)
    } catch (error) {
      console.error("Upload error:", error)
      setUploadError(uiText("Upload failed, please try again", "上传失败，请重试"))
    } finally {
      setUploading(false)
    }
  }

  const removeImage = async (imageId: string) => {
    try {
      await supabase.from("uploaded_files").delete().eq("id", imageId)
      setUploadedImages(prev => prev.filter(img => img.id !== imageId))
    } catch (error) {
      console.error("Error removing image:", error)
    }
  }

  const handleResponse = (value: number) => {
    const question = TCM_QUESTIONS[currentQuestion]
    setResponses(prev => ({ ...prev, [question.id]: value }))
  }

  const handleNext = () => {
    if (currentQuestion < TCM_QUESTIONS.length - 1) {
      setCurrentQuestion(currentQuestion + 1)
    } else {
      calculateResults()
    }
  }

  const handlePrev = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1)
    } else {
      // Go back to pulse diagnosis when at first question
      setPhase("pulse_diagnosis")
    }
  }

  const calculateResults = () => {
    // Initialize scores for each constitution
    const scores: Record<TCMConstitution, number> = {
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

    const counts: Record<TCMConstitution, number> = {
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

    // Calculate raw scores
    TCM_QUESTIONS.forEach(q => {
      const response = responses[q.id] || 3 // Default to 3 (sometimes)
      scores[q.constitution] += response
      counts[q.constitution] += 1
    })

    // Normalize scores (0-100)
    const normalizedScores: Record<TCMConstitution, number> = {} as Record<TCMConstitution, number>
    Object.keys(scores).forEach(key => {
      const constitution = key as TCMConstitution
      const maxScore = counts[constitution] * 5
      normalizedScores[constitution] = Math.round((scores[constitution] / maxScore) * 100)
    })

    // For balanced constitution, higher score is better
    // For other constitutions, higher score indicates more imbalance
    
    // Find primary constitution (highest score, excluding balanced if others are high)
    const imbalanceScores = Object.entries(normalizedScores)
      .filter(([key]) => key !== "balanced")
      .sort(([, a], [, b]) => b - a)

    const balancedScore = normalizedScores.balanced

    let primaryConstitution: TCMConstitution
    let secondaryConstitution: TCMConstitution | undefined

    // If balanced score is high and imbalance scores are low, person is balanced
    if (balancedScore >= 70 && imbalanceScores[0][1] < 50) {
      primaryConstitution = "balanced"
      if (imbalanceScores[0][1] >= 40) {
        secondaryConstitution = imbalanceScores[0][0] as TCMConstitution
      }
    } else {
      primaryConstitution = imbalanceScores[0][0] as TCMConstitution
      if (imbalanceScores[1][1] >= 50 && imbalanceScores[1][1] >= imbalanceScores[0][1] - 15) {
        secondaryConstitution = imbalanceScores[1][0] as TCMConstitution
      }
    }

    // Get recommendations
    const primaryInfo = TCM_CONSTITUTIONS.find(c => c.type === primaryConstitution)
    const secondaryInfo = secondaryConstitution ? TCM_CONSTITUTIONS.find(c => c.type === secondaryConstitution) : undefined

    const recommendations = [
      ...(primaryInfo?.recommendations || []),
      ...(secondaryInfo?.recommendations.slice(0, 2) || []),
    ]

    const resultData = {
      primaryConstitution,
      secondaryConstitution,
      constitutionScores: normalizedScores,
      recommendations,
    }

    setResults(resultData)
    setPhase("results")
  }

  const getConstitutionInfo = (type: TCMConstitution) => {
    return TCM_CONSTITUTIONS.find(c => c.type === type)
  }

  const handleComplete = () => {
    if (results) {
      // Calculate overall score (100 = perfectly balanced, lower = more imbalanced)
      const balancedScore = results.constitutionScores.balanced
      const imbalanceScores = Object.entries(results.constitutionScores)
        .filter(([key]) => key !== "balanced")
        .map(([, score]) => score)
      const avgImbalance = imbalanceScores.reduce((a, b) => a + b, 0) / imbalanceScores.length
      const overallScore = Math.round((balancedScore + (100 - avgImbalance)) / 2)

      onComplete(overallScore, results)
    }
  }

  // Intro phase
  if (phase === "intro") {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="p-4 bg-primary/10 rounded-full">
              <Leaf className="h-12 w-12 text-primary" />
            </div>
          </div>
          <CardTitle className="text-2xl">
            {uiText("TCM Constitution Assessment", "中医体质辨识")}
          </CardTitle>
          <CardDescription className="text-base mt-2">
            {uiText("Assess your body constitution based on Traditional Chinese Medicine principles and receive personalized health recommendations", "根据中医理论评估您的体质类型，获取个性化健康建议")}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <InstructionAudio
            text={uiText("This assessment will evaluate your body constitution through 27 questions. Please answer honestly based on your physical condition over the past year.", "本测试将通过27个问题评估您的体质类型。请根据您近一年的身体状况如实作答。")}
          />

          <div className="bg-muted p-4 rounded-lg space-y-2">
            <h4 className="font-medium">{uiText("Instructions", "测试说明")}:</h4>
            <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
              <li>{uiText("Step 1: Upload tongue and face images (optional)", "第一步：上传舌象和面部照片（可选）")}</li>
              <li>{uiText("Step 2: Answer 27 constitution questionnaire questions", "第二步：回答27个体质问卷问题")}</li>
              <li>{uiText("Step 3: Pulse diagnosis - Select observed pulse types (optional)", "第三步：脉诊 - 选择观察到的脉象（可选）")}</li>
              <li>{uiText("Answer based on your condition in the past year", "根据您过去一年的状况作答")}</li>
              <li>{uiText("Results will show your constitution type and recommendations", "完成后将显示您的体质类型和建议")}</li>
            </ul>
          </div>

          <div className="flex gap-3">
            <Button variant="outline" onClick={onBack} className="flex-1">
              <ArrowLeft className="h-4 w-4 mr-2" />
              {uiText("Back", "返回")}
            </Button>
            <Button onClick={() => setPhase("image_upload")} className="flex-1">
              {uiText("Start Assessment", "开始测试")}
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Image Upload phase
  if (phase === "image_upload") {
    const tongueImage = uploadedImages.find(img => img.type === "tongue")
    const faceImage = uploadedImages.find(img => img.type === "face")

    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader>
          <div className="flex items-center justify-between mb-2">
            <Badge variant="outline">
              {uiText("Step 1: Image Collection", "第1步：图像采集")}
            </Badge>
            <Button variant="ghost" size="sm" onClick={onBack}>
              {uiText("Exit", "退出")}
            </Button>
          </div>
          <CardTitle className="text-xl">
            {uiText("Upload Tongue and Face Images", "上传舌象和面部照片")}
          </CardTitle>
          <CardDescription>
            {uiText("TCM diagnosis uses tongue and facial observation to help determine constitution. This step is optional.", "中医诊断通过观察舌象和面色来辅助判断体质。此步骤为可选，您可以跳过直接进入问卷。")}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {uploadError && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-red-600 text-sm">{uploadError}</p>
            </div>
          )}

          {/* Tongue Image Upload */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Camera className="h-5 w-5 text-red-500" />
              <h4 className="font-medium">{uiText("Tongue Image", "舌象照片")}</h4>
            </div>
            {tongueImage ? (
              <div className="relative border rounded-lg p-2">
                <div className="relative w-full h-40 bg-gray-100 rounded overflow-hidden">
                  <Image src={tongueImage.preview} alt="Tongue" fill className="object-cover" />
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeImage(tongueImage.id)}
                  className="absolute top-2 right-2 bg-white/80 hover:bg-white text-red-500"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div
                className={`relative border-2 border-dashed rounded-lg p-6 text-center transition-colors cursor-pointer ${
                  dragActive ? "border-red-500 bg-red-50" : "border-gray-300 hover:border-red-400"
                }`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={(e) => handleDrop(e, "tongue")}
              >
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => e.target.files?.[0] && handleImageUpload(e.target.files[0], "tongue")}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  disabled={uploading}
                />
                <ImageIcon className="w-10 h-10 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-600">
                  {uiText("Drag & drop or click to upload tongue image", "拖放或点击上传舌象照片")}
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  {uiText("Take photo in natural light with tongue extended naturally", "请在自然光下拍摄，舌头自然伸出")}
                </p>
              </div>
            )}
          </div>

          {/* Face Image Upload */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Camera className="h-5 w-5 text-blue-500" />
              <h4 className="font-medium">{uiText("Face Image", "面部照片")}</h4>
            </div>
            {faceImage ? (
              <div className="relative border rounded-lg p-2">
                <div className="relative w-full h-40 bg-gray-100 rounded overflow-hidden">
                  <Image src={faceImage.preview} alt="Face" fill className="object-cover" />
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeImage(faceImage.id)}
                  className="absolute top-2 right-2 bg-white/80 hover:bg-white text-red-500"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div
                className={`relative border-2 border-dashed rounded-lg p-6 text-center transition-colors cursor-pointer ${
                  dragActive ? "border-blue-500 bg-blue-50" : "border-gray-300 hover:border-blue-400"
                }`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={(e) => handleDrop(e, "face")}
              >
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => e.target.files?.[0] && handleImageUpload(e.target.files[0], "face")}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  disabled={uploading}
                />
                <ImageIcon className="w-10 h-10 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-600">
                  {uiText("Drag & drop or click to upload face image", "拖放或点击上传面部照片")}
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  {uiText("Take frontal photo in natural light, preferably without makeup", "请在自然光下拍摄正面照片，无化妆为佳")}
                </p>
              </div>
            )}
          </div>

          {/* Upload Progress */}
          {uploading && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>{uiText("Uploading...", "上传中...")}</span>
                <span>{Math.round(uploadProgress)}%</span>
              </div>
              <Progress value={uploadProgress} className="w-full" />
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <Button variant="outline" onClick={() => setPhase("intro")} className="flex-1">
              <ArrowLeft className="h-4 w-4 mr-2" />
              {uiText("Back", "返回")}
            </Button>
            <Button onClick={() => setPhase("pulse_diagnosis")} className="flex-1" disabled={uploading}>
              {uploadedImages.length > 0 
                ? uiText("Continue to Questionnaire", "继续问卷")
                : uiText("Skip, Go to Questionnaire", "跳过，直接问卷")}
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Pulse Diagnosis phase (Step 3)
  if (phase === "pulse_diagnosis") {
    const togglePulse = (pulseId: string) => {
      setSelectedPulses(prev => 
        prev.includes(pulseId) 
          ? prev.filter(id => id !== pulseId)
          : [...prev, pulseId]
      )
    }

    const toggleCategory = (category: PulseCategory) => {
      setExpandedCategory(prev => prev === category ? null : category)
    }

    const getPulsesByCategory = (category: PulseCategory) => {
      return PULSE_TYPES.filter(p => p.category === category)
    }

    const getSelectedPulseInfo = () => {
      return PULSE_TYPES.filter(p => selectedPulses.includes(p.id))
    }

    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader>
          <div className="flex items-center justify-between mb-2">
            <Badge variant="outline">
              {uiText("Step 3: Pulse Diagnosis", "第3步：脉诊")}
            </Badge>
            <Button variant="ghost" size="sm" onClick={onBack}>
              {uiText("Exit", "退出")}
            </Button>
          </div>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-primary/10 rounded-full">
              <Activity className="h-6 w-6 text-primary" />
            </div>
            <div>
              <CardTitle className="text-xl">
                {uiText("Pulse Diagnosis (Mai Zhen)", "脉诊")}
              </CardTitle>
              <CardDescription>
                {uiText("Select the pulse types observed during examination. This step is optional.", "选择检查时观察到的脉象类型。此步骤为可选。")}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <InstructionAudio
            text={uiText(
              "Traditional Chinese Medicine uses pulse diagnosis to assess the body's condition. There are 28 classic pulse types organized into 6 categories. Select any pulses that have been observed.",
              "中医通过脉诊来评估身体状况。经典脉象共28种，分为6大类。请选择已观察到的脉象。"
            )}
          />

          {/* Summary of selected pulses */}
          {selectedPulses.length > 0 && (
            <div className="bg-primary/5 border border-primary/20 rounded-lg p-3">
              <h4 className="text-sm font-medium mb-2">
                {uiText(`Selected Pulses (${selectedPulses.length})`, `已选脉象 (${selectedPulses.length}个)`)}
              </h4>
              <div className="flex flex-wrap gap-2">
                {getSelectedPulseInfo().map(pulse => (
                  <Badge 
                    key={pulse.id} 
                    variant="secondary"
                    className="cursor-pointer hover:bg-destructive/20"
                    onClick={() => togglePulse(pulse.id)}
                  >
                    {localizeText(pulse.name, { zh: pulse.nameZh, yue: pulse.nameZh })}
                    <X className="h-3 w-3 ml-1" />
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Pulse Categories Accordion */}
          <div className="space-y-2">
            {PULSE_CATEGORIES.map(category => {
              const pulses = getPulsesByCategory(category.category)
              const selectedInCategory = pulses.filter(p => selectedPulses.includes(p.id)).length
              const isExpanded = expandedCategory === category.category

              return (
                <div key={category.category} className="border rounded-lg overflow-hidden">
                  {/* Category Header */}
                  <button
                    onClick={() => toggleCategory(category.category)}
                    className={`w-full flex items-center justify-between p-3 text-left transition-colors ${category.color}`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="font-medium">
                        {localizeText(category.name, { zh: category.nameZh, yue: category.nameZh })}
                      </span>
                      <span className="text-xs opacity-70">
                        ({pulses.length} {uiText("types", "种")})
                      </span>
                      {selectedInCategory > 0 && (
                        <Badge variant="default" className="text-xs">
                          {selectedInCategory} {uiText("selected", "已选")}
                        </Badge>
                      )}
                    </div>
                    {isExpanded ? (
                      <ChevronUp className="h-5 w-5" />
                    ) : (
                      <ChevronDown className="h-5 w-5" />
                    )}
                  </button>

                  {/* Category Description */}
                  {isExpanded && (
                    <div className="px-3 py-2 bg-muted/50 text-sm text-muted-foreground">
                      {localizeText(category.description, { zh: category.descriptionZh, yue: category.descriptionZh })}
                    </div>
                  )}

                  {/* Pulse Types */}
                  {isExpanded && (
                    <div className="p-3 space-y-2">
                      {pulses.map(pulse => {
                        const isSelected = selectedPulses.includes(pulse.id)
                        return (
                          <div
                            key={pulse.id}
                            onClick={() => togglePulse(pulse.id)}
                            className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${
                              isSelected 
                                ? "border-primary bg-primary/5" 
                                : "border-muted hover:border-primary/50"
                            }`}
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <span className="font-medium text-lg">{pulse.nameZh}</span>
                                  <span className="text-sm text-muted-foreground">
                                    {pulse.name.replace(` (${pulse.nameZh})`, "").replace(`(${pulse.nameZh})`, "")}
                                  </span>
                                </div>
                                <p className="text-sm text-muted-foreground mt-1">
                                  {localizeText(pulse.description, { zh: pulse.descriptionZh, yue: pulse.descriptionZh })}
                                </p>
                                <p className="text-xs text-primary mt-1">
                                  <span className="font-medium">{uiText("Clinical significance", "临床意义")}: </span>
                                  {localizeText(pulse.clinicalSignificance, { zh: pulse.clinicalSignificanceZh, yue: pulse.clinicalSignificanceZh })}
                                </p>
                              </div>
                              <div className={`flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                                isSelected ? "bg-primary border-primary" : "border-muted-foreground/30"
                              }`}>
                                {isSelected && <Check className="h-4 w-4 text-primary-foreground" />}
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {/* Optional notes field */}
          <div className="space-y-2">
            <Label htmlFor="pulse-notes">
              {uiText("Additional Notes (Optional)", "附加备注（可选）")}
            </Label>
            <textarea
              id="pulse-notes"
              value={pulseNotes}
              onChange={(e) => setPulseNotes(e.target.value)}
              placeholder={uiText(
                "Enter any additional observations about pulse quality, rhythm, or other characteristics...",
                "输入关于脉象质量、节律或其他特征的附加观察..."
              )}
              className="w-full min-h-[80px] p-3 border rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button variant="outline" onClick={() => setPhase("image_upload")} className="flex-1">
              <ArrowLeft className="h-4 w-4 mr-2" />
              {uiText("Back", "返回")}
            </Button>
            <Button onClick={() => setPhase("questions")} className="flex-1">
              {selectedPulses.length > 0 
                ? uiText("Continue to Questionnaire", "继续问卷")
                : uiText("Skip, Go to Questionnaire", "跳过，直接问卷")}
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Questions phase
  if (phase === "questions") {
    const question = TCM_QUESTIONS[currentQuestion]
    const currentResponse = responses[question.id]

    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader>
          <div className="flex items-center justify-between mb-2">
            <Badge variant="outline">
              {uiText(
                `Question ${currentQuestion + 1} of ${TCM_QUESTIONS.length}`,
                `问题 ${currentQuestion + 1} / ${TCM_QUESTIONS.length}`,
                `問題 ${currentQuestion + 1} / ${TCM_QUESTIONS.length}`,
                `Question ${currentQuestion + 1} sur ${TCM_QUESTIONS.length}`,
              )}
            </Badge>
            <Button variant="ghost" size="sm" onClick={onBack}>
              {uiText("Exit", "退出")}
            </Button>
          </div>
          <Progress value={progress} className="h-2" />
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center py-4">
            <h3 className="text-xl font-medium">
              {localizeText(question.text, { zh: question.textZh, yue: question.textZh })}
            </h3>
          </div>

          <RadioGroup
            value={currentResponse?.toString()}
            onValueChange={(value) => handleResponse(parseInt(value))}
            className="space-y-3"
          >
            {LIKERT_OPTIONS.map((option) => (
              <div
                key={option.value}
                className={`flex items-center space-x-3 p-4 rounded-lg border-2 transition-colors cursor-pointer ${
                  currentResponse === option.value
                    ? "border-primary bg-primary/5"
                    : "border-muted hover:border-primary/50"
                }`}
                onClick={() => handleResponse(option.value)}
              >
                <RadioGroupItem value={option.value.toString()} id={`option-${option.value}`} />
                <Label htmlFor={`option-${option.value}`} className="flex-1 cursor-pointer text-base">
                  {localizeText(option.label, { zh: option.labelZh, yue: option.labelZh })}
                </Label>
                <span className="text-sm text-muted-foreground">{option.value}</span>
              </div>
            ))}
          </RadioGroup>

          <div className="flex gap-3 pt-4">
            <Button
              variant="outline"
              onClick={handlePrev}
              className="flex-1"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              {currentQuestion === 0 ? uiText("Back to Pulse Diagnosis", "返回脉诊") : uiText("Previous", "上一题")}
            </Button>
            <Button
              onClick={handleNext}
              disabled={!currentResponse}
              className="flex-1"
            >
              {currentQuestion === TCM_QUESTIONS.length - 1
                ? uiText("View Results", "查看结果")
                : uiText("Next", "下一题")}
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Results phase
  if (phase === "results" && results) {
    const primaryInfo = getConstitutionInfo(results.primaryConstitution)
    const secondaryInfo = results.secondaryConstitution
      ? getConstitutionInfo(results.secondaryConstitution)
      : null

    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="p-4 bg-primary/10 rounded-full">
              <CheckCircle2 className="h-12 w-12 text-green-600" />
            </div>
          </div>
          <CardTitle className="text-2xl">
            {uiText("Your Constitution Results", "体质辨识结果")}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Primary Constitution */}
          {primaryInfo && (
            <div className={`p-4 rounded-lg border-2 ${primaryInfo.color}`}>
              <div className="flex items-center gap-3 mb-2">
                {primaryInfo.icon}
                <div>
                  <Badge className="mb-1">{uiText("Primary Constitution", "主要体质")}</Badge>
                  <h3 className="text-lg font-semibold">
                    {localizeText(primaryInfo.name, { zh: primaryInfo.nameZh, yue: primaryInfo.nameZh })}
                  </h3>
                </div>
              </div>
              <p className="text-sm opacity-80">{localizeText(primaryInfo.description)}</p>
              <div className="mt-2">
                <span className="text-sm font-medium">{localizeText("Score")}: {results.constitutionScores[results.primaryConstitution]}%</span>
              </div>
            </div>
          )}

          {/* Secondary Constitution */}
          {secondaryInfo && (
            <div className={`p-4 rounded-lg border ${secondaryInfo.color} opacity-80`}>
              <div className="flex items-center gap-3 mb-2">
                {secondaryInfo.icon}
                <div>
                  <Badge variant="outline" className="mb-1">{uiText("Secondary Constitution", "次要体质")}</Badge>
                  <h3 className="text-base font-medium">
                    {localizeText(secondaryInfo.name, { zh: secondaryInfo.nameZh, yue: secondaryInfo.nameZh })}
                  </h3>
                </div>
              </div>
              <p className="text-sm opacity-80">{localizeText(secondaryInfo.description)}</p>
            </div>
          )}

          {/* All Constitution Scores */}
          <div className="space-y-2">
            <h4 className="font-medium">{uiText("Constitution Score Details", "体质分数详情")}</h4>
            <div className="grid grid-cols-2 gap-2">
              {TCM_CONSTITUTIONS.map((constitution) => (
                <div
                  key={constitution.type}
                  className="flex items-center justify-between p-2 bg-muted rounded text-sm"
                >
                  <span className="truncate">{localizeText(constitution.name.split(" (")[0], { zh: constitution.nameZh, yue: constitution.nameZh })}</span>
                  <span className="font-medium ml-2">{results.constitutionScores[constitution.type]}%</span>
                </div>
              ))}
            </div>
          </div>

          {/* Recommendations */}
          <div className="bg-green-50 dark:bg-green-950 p-4 rounded-lg">
            <h4 className="font-medium text-green-800 dark:text-green-200 mb-2">
              {uiText("Health Recommendations", "健康建议")}
            </h4>
            <ul className="list-disc list-inside text-sm text-green-700 dark:text-green-300 space-y-1">
              {results.recommendations.slice(0, 6).map((rec, idx) => (
                <li key={idx}>{localizeText(rec)}</li>
              ))}
            </ul>
          </div>

          <Button onClick={handleComplete} className="w-full" size="lg">
            {uiText("Complete and Continue", "完成并继续")}
          </Button>
        </CardContent>
      </Card>
    )
  }

  return null
}

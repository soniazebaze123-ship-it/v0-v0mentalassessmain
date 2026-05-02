import type { LanguageCode, OlfactoryProtocolVersion, OlfactoryQuestion, OlfactoryScentKey } from "@/lib/olfactory/types"

export const SCENT_LABELS: Record<OlfactoryScentKey, Record<LanguageCode, string>> = {
  orange: { en: "Orange", zh: "橙子", yue: "橙", fr: "Orange" },
  leather: { en: "Leather", zh: "皮革", yue: "皮革", fr: "Cuir" },
  cinnamon: { en: "Cinnamon", zh: "肉桂", yue: "肉桂", fr: "Cannelle" },
  peppermint: { en: "Peppermint", zh: "薄荷", yue: "薄荷", fr: "Menthe poivree" },
  banana: { en: "Banana", zh: "香蕉", yue: "香蕉", fr: "Banane" },
  lemon: { en: "Lemon", zh: "柠檬", yue: "檸檬", fr: "Citron" },
  licorice: { en: "Licorice", zh: "甘草", yue: "甘草", fr: "Reglisse" },
  coffee: { en: "Coffee", zh: "咖啡", yue: "咖啡", fr: "Cafe" },
  cloves: { en: "Cloves", zh: "丁香", yue: "丁香", fr: "Clous de girofle" },
  pineapple: { en: "Pineapple", zh: "菠萝", yue: "菠蘿", fr: "Ananas" },
  rose: { en: "Rose", zh: "玫瑰", yue: "玫瑰", fr: "Rose" },
  fish: { en: "Fish", zh: "鱼", yue: "魚", fr: "Poisson" },
}

const label = (key: OlfactoryScentKey) => SCENT_LABELS[key]

const prompt = {
  en: "What is this smell?",
  zh: "这是什么气味？",
  yue: "呢個係咩氣味？",
  fr: "Quelle est cette odeur ?",
}

function codeDescription(code: string, en: string, zh: string, yue: string, fr: string) {
  return {
    en: `${code}: ${en}`,
    zh: `${code}: ${zh}`,
    yue: `${code}: ${yue}`,
    fr: `${code}: ${fr}`,
  }
}

function imagePath(key: OlfactoryScentKey) {
  return `/images/olfactory-temp/${key}.svg`
}

export const OLFACTORY_TEMP_PREMIUM_12_QUESTIONS: OlfactoryQuestion[] = [
  {
    id: 1,
    questionCode: "T-01",
    scent: "orange",
    imagePath: imagePath("orange"),
    codeDescription: codeDescription("T-01", "Bright citrus peel, juicy and fresh", "明亮柑橘果皮调，清新多汁", "明亮柑橘果皮調，清新多汁", "Agrume vif, frais et juteux"),
    prompt,
    options: [
      { key: "orange", label: label("orange") },
      { key: "lemon", label: label("lemon") },
      { key: "pineapple", label: label("pineapple") },
      { key: "banana", label: label("banana") },
    ],
    correctAnswer: "orange",
  },
  {
    id: 2,
    questionCode: "T-02",
    scent: "leather",
    imagePath: imagePath("leather"),
    codeDescription: codeDescription("T-02", "Dry animalic, earthy and warm", "干燥皮革调，带泥土与温暖质感", "乾燥皮革調，帶泥土同溫暖質感", "Note cuir seche, animale et terreuse"),
    prompt,
    options: [
      { key: "leather", label: label("leather") },
      { key: "coffee", label: label("coffee") },
      { key: "fish", label: label("fish") },
      { key: "cloves", label: label("cloves") },
    ],
    correctAnswer: "leather",
  },
  {
    id: 3,
    questionCode: "T-03",
    scent: "cinnamon",
    imagePath: imagePath("cinnamon"),
    codeDescription: codeDescription("T-03", "Sweet warm spice with woody edge", "甜暖辛香并带木质感", "甜暖辛香同木質感", "Epice chaude sucree avec nuance boisee"),
    prompt,
    options: [
      { key: "cinnamon", label: label("cinnamon") },
      { key: "cloves", label: label("cloves") },
      { key: "licorice", label: label("licorice") },
      { key: "coffee", label: label("coffee") },
    ],
    correctAnswer: "cinnamon",
  },
  {
    id: 4,
    questionCode: "T-04",
    scent: "peppermint",
    imagePath: imagePath("peppermint"),
    codeDescription: codeDescription("T-04", "Cooling herbal with sharp lift", "清凉草本调，带明显清冽感", "清涼草本調，帶明顯清冽感", "Herbe rafraichissante, tonique et nette"),
    prompt,
    options: [
      { key: "peppermint", label: label("peppermint") },
      { key: "licorice", label: label("licorice") },
      { key: "lemon", label: label("lemon") },
      { key: "orange", label: label("orange") },
    ],
    correctAnswer: "peppermint",
  },
  {
    id: 5,
    questionCode: "T-05",
    scent: "banana",
    imagePath: imagePath("banana"),
    codeDescription: codeDescription("T-05", "Ripe sweet fruit with creamy note", "成熟甜果调，带奶香感", "成熟甜果調，帶奶香感", "Fruit mur sucre avec note cremeuse"),
    prompt,
    options: [
      { key: "banana", label: label("banana") },
      { key: "pineapple", label: label("pineapple") },
      { key: "orange", label: label("orange") },
      { key: "rose", label: label("rose") },
    ],
    correctAnswer: "banana",
  },
  {
    id: 6,
    questionCode: "T-06",
    scent: "lemon",
    imagePath: imagePath("lemon"),
    codeDescription: codeDescription("T-06", "Sharp sour citrus top note", "尖锐酸感柑橘前调", "尖銳酸感柑橘前調", "Agrume acide et vif en tete"),
    prompt,
    options: [
      { key: "lemon", label: label("lemon") },
      { key: "orange", label: label("orange") },
      { key: "peppermint", label: label("peppermint") },
      { key: "pineapple", label: label("pineapple") },
    ],
    correctAnswer: "lemon",
  },
  {
    id: 7,
    questionCode: "T-07",
    scent: "licorice",
    imagePath: imagePath("licorice"),
    codeDescription: codeDescription("T-07", "Sweet herbal root with dark tone", "甜草本根茎调，偏深沉", "甜草本根莖調，偏深沉", "Racine herbacee sucree au ton sombre"),
    prompt,
    options: [
      { key: "licorice", label: label("licorice") },
      { key: "cinnamon", label: label("cinnamon") },
      { key: "cloves", label: label("cloves") },
      { key: "peppermint", label: label("peppermint") },
    ],
    correctAnswer: "licorice",
  },
  {
    id: 8,
    questionCode: "T-08",
    scent: "coffee",
    imagePath: imagePath("coffee"),
    codeDescription: codeDescription("T-08", "Roasted bitter and warm", "烘焙苦香，温暖醇厚", "烘焙苦香，溫暖醇厚", "Torrifie, amer et chaud"),
    prompt,
    options: [
      { key: "coffee", label: label("coffee") },
      { key: "leather", label: label("leather") },
      { key: "cinnamon", label: label("cinnamon") },
      { key: "fish", label: label("fish") },
    ],
    correctAnswer: "coffee",
  },
  {
    id: 9,
    questionCode: "T-09",
    scent: "cloves",
    imagePath: imagePath("cloves"),
    codeDescription: codeDescription("T-09", "Dry spicy clove bud profile", "干燥丁香辛香特征", "乾燥丁香辛香特徵", "Profil sec et epice du clou de girofle"),
    prompt,
    options: [
      { key: "cloves", label: label("cloves") },
      { key: "cinnamon", label: label("cinnamon") },
      { key: "coffee", label: label("coffee") },
      { key: "licorice", label: label("licorice") },
    ],
    correctAnswer: "cloves",
  },
  {
    id: 10,
    questionCode: "T-10",
    scent: "pineapple",
    imagePath: imagePath("pineapple"),
    codeDescription: codeDescription("T-10", "Tropical tart-sweet fruit profile", "热带果香，酸甜明显", "熱帶果香，酸甜明顯", "Fruit tropical acidule et sucre"),
    prompt,
    options: [
      { key: "pineapple", label: label("pineapple") },
      { key: "banana", label: label("banana") },
      { key: "orange", label: label("orange") },
      { key: "lemon", label: label("lemon") },
    ],
    correctAnswer: "pineapple",
  },
  {
    id: 11,
    questionCode: "T-11",
    scent: "rose",
    imagePath: imagePath("rose"),
    codeDescription: codeDescription("T-11", "Classic floral sweet profile", "经典甜花香特征", "經典甜花香特徵", "Profil floral classique et doux"),
    prompt,
    options: [
      { key: "rose", label: label("rose") },
      { key: "orange", label: label("orange") },
      { key: "leather", label: label("leather") },
      { key: "banana", label: label("banana") },
    ],
    correctAnswer: "rose",
  },
  {
    id: 12,
    questionCode: "T-12",
    scent: "fish",
    imagePath: imagePath("fish"),
    codeDescription: codeDescription("T-12", "Marine salty animalic profile", "海洋咸鲜与动物感特征", "海洋鹹鮮同動物感特徵", "Profil marin sale et animal"),
    prompt,
    options: [
      { key: "fish", label: label("fish") },
      { key: "leather", label: label("leather") },
      { key: "coffee", label: label("coffee") },
      { key: "cloves", label: label("cloves") },
    ],
    correctAnswer: "fish",
  },
]

export const OLFACTORY_TEMP_V1_8_QUESTIONS: OlfactoryQuestion[] = OLFACTORY_TEMP_PREMIUM_12_QUESTIONS.slice(0, 8)

export const OLFACTORY_PROTOCOL_QUESTION_SET: Record<OlfactoryProtocolVersion, OlfactoryQuestion[]> = {
  temp_v1: OLFACTORY_TEMP_V1_8_QUESTIONS,
  sat_v2: OLFACTORY_TEMP_PREMIUM_12_QUESTIONS,
}

export const OLFACTORY_COPY = {
  title: {
    en: "Premium Temporary Olfactory Screening",
    zh: "高级临时嗅觉筛查",
    yue: "高級臨時嗅覺篩查",
    fr: "Depistage olfactif temporaire premium",
  },
  subtitle: {
    en: "Standalone temporary protocol (not Odofin) with coded prompts and blinded patient flow",
    zh: "独立临时流程（不属于 Odofin），采用编码提示与盲化受试者流程",
    yue: "獨立臨時流程（唔屬於 Odofin），用編碼提示同盲化受試者流程",
    fr: "Protocole temporaire autonome (non Odofin) avec invites codees et parcours patient en aveugle",
  },
  activeProtocolLabel: {
    en: "Active protocol",
    zh: "当前协议",
    yue: "目前協議",
    fr: "Protocole actif",
  },
  protocolName: {
    temp_v1: {
      en: "Temporary V1 (8-item)",
      zh: "临时V1（8项）",
      yue: "臨時V1（8項）",
      fr: "Temporaire V1 (8 items)",
    },
    sat_v2: {
      en: "Saturday V2 (12-item)",
      zh: "周六V2（12项）",
      yue: "星期六V2（12項）",
      fr: "Samedi V2 (12 items)",
    },
  },
  instructionsTitle: { en: "Instructions", zh: "说明", yue: "說明", fr: "Instructions" },
  instructions: {
    en: [
      "This tool is temporary and separate from Odofin.",
      "Patient should keep eyes closed during scent presentation.",
      "Present one odor at a time at 2-3 cm for around 3 seconds.",
      "Use the coded prompt and image card for protocol consistency.",
      "Leave 20-30 seconds between odors.",
    ],
    zh: [
      "此工具为临时流程，并与 Odofin 分离。",
      "呈现气味时受试者应保持闭眼。",
      "每次仅呈现一种气味，距离鼻子2-3厘米，约3秒。",
      "使用图像卡与编码提示保持流程一致性。",
      "两种气味之间间隔20-30秒。",
    ],
    yue: [
      "呢個工具係臨時流程，並且同 Odofin 分開。",
      "呈現氣味時受試者應該保持合眼。",
      "每次只呈現一種氣味，離鼻2-3厘米，約3秒。",
      "用圖像卡同編碼提示保持流程一致。",
      "兩種氣味之間相隔20-30秒。",
    ],
    fr: [
      "Cet outil est temporaire et separe d'Odofin.",
      "Le patient doit garder les yeux fermes pendant la presentation.",
      "Presentez une odeur a la fois a 2-3 cm pendant environ 3 secondes.",
      "Utilisez la carte image et l'invite codee pour standardiser le protocole.",
      "Attendez 20-30 secondes entre les odeurs.",
    ],
  },
  start: { en: "Start test", zh: "开始测试", yue: "開始測試", fr: "Commencer" },
  next: { en: "Next", zh: "下一题", yue: "下一題", fr: "Suivant" },
  previous: { en: "Previous", zh: "上一题", yue: "上一題", fr: "Precedent" },
  finish: { en: "Finish test", zh: "完成测试", yue: "完成測試", fr: "Terminer" },
  confidence: { en: "Confidence", zh: "把握程度", yue: "把握程度", fr: "Confiance" },
  confidenceLow: { en: "Not sure", zh: "不确定", yue: "唔肯定", fr: "Pas sur" },
  confidenceMid: { en: "Sure", zh: "比较确定", yue: "比較肯定", fr: "Sur" },
  confidenceHigh: { en: "Very sure", zh: "非常确定", yue: "非常肯定", fr: "Tres sur" },
  results: { en: "Results", zh: "结果", yue: "結果", fr: "Resultats" },
  restart: { en: "Restart", zh: "重新开始", yue: "重新開始", fr: "Recommencer" },
  save: { en: "Save result", zh: "保存结果", yue: "保存結果", fr: "Enregistrer" },
  testName: {
    en: "Temporary Premium 12-Odor Identification Test",
    zh: "临时高级12气味识别测试",
    yue: "臨時高級12氣味識別測試",
    fr: "Test premium temporaire d'identification olfactive a 12 odeurs",
  },
  testNameByProtocol: {
    temp_v1: {
      en: "Temporary Premium 8-Odor Identification Test",
      zh: "临时高级8气味识别测试",
      yue: "臨時高級8氣味識別測試",
      fr: "Test premium temporaire d'identification olfactive a 8 odeurs",
    },
    sat_v2: {
      en: "Temporary Premium 12-Odor Identification Test",
      zh: "临时高级12气味识别测试",
      yue: "臨時高級12氣味識別測試",
      fr: "Test premium temporaire d'identification olfactive a 12 odeurs",
    },
  },
}

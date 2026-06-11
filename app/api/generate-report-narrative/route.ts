import { generateText } from "ai"

export const maxDuration = 60

type ReportLanguage = "en" | "zh-CN" | "zh-HK" | "fr"

interface NarrativePayload {
  language: ReportLanguage
  patientName?: string | null
  age?: number | string | null
  sex?: string | null
  riskFactors?: string | null
  questionnaireSummary?: string | null
  mmseScore: number | null
  mmseClass: string
  mocaScore: number | null
  mocaClass: string
  overallSeverity: string
  eegCorrelationText: string
  tcmConstitution?: string | null
  tcmConstitutionLabel?: string | null
  tcmPulseSummary?: string | null
  sensorySummary?: string | null
  tongueImageUrl?: string | null
  faceImageUrl?: string | null
}

const LANGUAGE_INSTRUCTION: Record<ReportLanguage, string> = {
  en: "Write the narrative in professional clinical English.",
  "zh-CN": "用专业的临床简体中文撰写叙述。",
  "zh-HK": "用專業的臨床繁體中文（香港）撰寫敘述。",
  fr: "Rediger le compte rendu en francais clinique professionnel.",
}

export async function POST(req: Request) {
  let payload: NarrativePayload
  try {
    payload = (await req.json()) as NarrativePayload
  } catch {
    return Response.json({ error: "Invalid request body" }, { status: 400 })
  }

  const language = payload.language || "en"

  // These values are computed deterministically by the app per the medical spec.
  // The AI must NOT alter them — it only writes the surrounding professional prose.
  const lockedFacts = [
    payload.patientName ? `Patient: ${payload.patientName}` : null,
    payload.age != null && payload.age !== "" ? `Age: ${payload.age}` : null,
    payload.sex ? `Sex: ${payload.sex}` : null,
    payload.riskFactors ? `Reported risk factors: ${payload.riskFactors}` : null,
    payload.questionnaireSummary ? `Questionnaire responses: ${payload.questionnaireSummary}` : null,
    `MMSE score: ${payload.mmseScore ?? "Not provided"} (classification: ${payload.mmseClass})`,
    `MoCA score: ${payload.mocaScore ?? "Not provided"} (classification: ${payload.mocaClass})`,
    `Overall cognitive severity classification (higher-severity rule applied): ${payload.overallSeverity}`,
    `EEG correlation statement (must be quoted verbatim): "${payload.eegCorrelationText}"`,
    payload.tcmConstitutionLabel
      ? `TCM primary constitution: ${payload.tcmConstitutionLabel}`
      : "TCM primary constitution: not specified",
    payload.tcmPulseSummary ? `TCM pulse findings: ${payload.tcmPulseSummary}` : null,
    payload.sensorySummary ? `Olfactory / sensory assessment: ${payload.sensorySummary}` : "Olfactory / sensory assessment: not provided",
  ]
    .filter(Boolean)
    .join("\n")

  const hasImages = Boolean(payload.tongueImageUrl || payload.faceImageUrl)

  const systemPrompt = `You are a senior neurologist and cognitive medicine specialist writing a formal medical report for hospital documentation. ${LANGUAGE_INSTRUCTION[language]}

You are synthesising the patient's MMSE score, MoCA score, olfactory assessment, tongue assessment, facial analysis, demographic information, risk factors, and questionnaire responses into a structured physician report.

STRICT RULES:
- The scores, classifications, overall severity, and the EEG correlation statement are pre-computed and clinically locked. Reproduce them EXACTLY. Never change a number, a classification word, or the EEG sentence.
- Quote the provided EEG correlation statement verbatim within the EEG section.
- The EEG Functional Correlation Status must be one of exactly: Normal, Mild Abnormality, Moderate Abnormality, or Severe Abnormality, and must be consistent with the locked overall cognitive severity classification.
- Always make clear, in substance, that the EEG functional correlation is an estimated correlation derived from the cognitive scores and does NOT represent findings from an actual EEG examination.
- Do not invent diagnoses, medications, or findings unsupported by the supplied data.
- Write in concise, formal physician language suitable for hospital documentation.
- Do NOT mention that the text was generated, do NOT reference AI, algorithms, machine learning, or model outputs, and do NOT use phrases such as "I am an AI".
- Use PLAIN TEXT only. Do NOT use markdown, asterisks, bold markers, or any symbols around headings. Write each section heading on its own line exactly as titled (e.g. "EEG Functional Correlation Status"), followed by the paragraph on the next line.
${hasImages ? "- TCM tongue and/or facial images are attached. Describe only clearly visible, clinically relevant observations (e.g. tongue body colour, coating, moisture, facial complexion) and relate them to the stated constitution. If a feature is not clearly visible, do not speculate." : ""}

REQUIRED STRUCTURE — output exactly these four labelled sections, in order, each as a short formal paragraph:
1. EEG Functional Correlation Status — state the status (Normal / Mild Abnormality / Moderate Abnormality / Severe Abnormality), quote the locked EEG correlation statement verbatim, and include the estimated-correlation caveat.
2. Primary Clinical Impression — a concise diagnostic impression integrating cognitive, olfactory, and TCM findings.
3. Clinical Interpretation — formal physician interpretation weaving together MMSE, MoCA, overall severity, olfactory/sensory findings, and TCM constitution${hasImages ? " informed by the attached tongue/face images" : ""}.
4. Recommendations — evidence-based, actionable recommendations (further evaluation, follow-up cadence, lifestyle/risk-factor modification, referrals as appropriate).`

  const textInstruction = `Generate the formal medical report using the following locked clinical facts. Use the exact four-section structure defined in your instructions.

${lockedFacts}`

  try {
    const userContent: Array<
      { type: "text"; text: string } | { type: "image"; image: URL }
    > = [{ type: "text", text: textInstruction }]

    if (payload.tongueImageUrl) {
      try {
        userContent.push({ type: "image", image: new URL(payload.tongueImageUrl) })
      } catch {
        // ignore malformed url
      }
    }
    if (payload.faceImageUrl) {
      try {
        userContent.push({ type: "image", image: new URL(payload.faceImageUrl) })
      } catch {
        // ignore malformed url
      }
    }

    const { text } = await generateText({
      model: "google/gemini-2.5-flash",
      system: systemPrompt,
      messages: [{ role: "user", content: userContent }],
      maxOutputTokens: 1400,
    })

    return Response.json({ narrative: text.trim() })
  } catch (error) {
    console.log("[v0] AI narrative generation error:", error instanceof Error ? error.message : error)
    return Response.json({ error: "Failed to generate narrative" }, { status: 500 })
  }
}

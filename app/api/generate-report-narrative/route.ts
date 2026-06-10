import { generateText } from "ai"

export const maxDuration = 60

type ReportLanguage = "en" | "zh-CN" | "zh-HK" | "fr"

interface NarrativePayload {
  language: ReportLanguage
  patientName?: string | null
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
    `MMSE score: ${payload.mmseScore ?? "Not provided"} (classification: ${payload.mmseClass})`,
    `MoCA score: ${payload.mocaScore ?? "Not provided"} (classification: ${payload.mocaClass})`,
    `Overall cognitive severity classification (higher-severity rule applied): ${payload.overallSeverity}`,
    `EEG correlation statement (must be quoted verbatim): "${payload.eegCorrelationText}"`,
    payload.tcmConstitutionLabel
      ? `TCM primary constitution: ${payload.tcmConstitutionLabel}`
      : "TCM primary constitution: not specified",
    payload.tcmPulseSummary ? `TCM pulse findings: ${payload.tcmPulseSummary}` : null,
    payload.sensorySummary ? `Sensory assessment: ${payload.sensorySummary}` : "Sensory assessment: not provided",
  ]
    .filter(Boolean)
    .join("\n")

  const hasImages = Boolean(payload.tongueImageUrl || payload.faceImageUrl)

  const systemPrompt = `You are a senior clinical physician writing the narrative portion of a cognitive and Traditional Chinese Medicine (TCM) screening report. ${LANGUAGE_INSTRUCTION[language]}

STRICT RULES:
- The scores, classifications, overall severity, and the EEG correlation statement are pre-computed and clinically locked. Reproduce them EXACTLY. Never change a number, a classification word, or the EEG sentence.
- Quote the provided EEG correlation statement verbatim.
- Always include this caveat in substance: the EEG classification is an estimated correlation derived from the MMSE and MoCA scores and does NOT represent findings from an actual EEG examination.
- Do not invent diagnoses, medications, or findings that are not supported by the supplied data.
- Be concise, professional, and readable for a referring clinician. 2-4 short paragraphs. No markdown headings, no bullet lists, no disclaimers beyond the EEG caveat.
${hasImages ? "- TCM tongue and/or facial images are attached. Describe only clearly visible, clinically relevant observations (e.g. tongue body colour, coating, moisture, facial complexion) and relate them to the stated constitution. If a feature is not clearly visible, do not speculate." : ""}`

  const textInstruction = `Write the final clinical narrative summary using the following locked clinical facts:

${lockedFacts}

The narrative must weave together: the cognitive findings (MMSE + MoCA + overall severity), the EEG correlation statement with its caveat, the TCM constitution-related findings${hasImages ? " informed by the attached tongue/face images" : ""}, and the sensory findings.`

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
      maxOutputTokens: 900,
    })

    return Response.json({ narrative: text.trim() })
  } catch (error) {
    console.log("[v0] AI narrative generation error:", error instanceof Error ? error.message : error)
    return Response.json({ error: "Failed to generate narrative" }, { status: 500 })
  }
}

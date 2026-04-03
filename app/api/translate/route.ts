import { NextResponse } from "next/server"

const languageNames = {
  en: "English",
  zh: "Simplified Chinese",
  yue: "Cantonese",
  fr: "French",
} as const

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const text = typeof body.text === "string" ? body.text.trim() : ""
    const targetLanguage = body.targetLanguage as keyof typeof languageNames | undefined

    if (!text || !targetLanguage || !(targetLanguage in languageNames)) {
      return NextResponse.json({ error: "Text and targetLanguage are required." }, { status: 400 })
    }

    if (targetLanguage === "en") {
      return NextResponse.json({ translatedText: text, provider: "static" })
    }

    const apiKey = process.env.QWEN_API_KEY ?? process.env.DASHSCOPE_API_KEY
    const model = process.env.QWEN_MODEL ?? "qwen-plus"
    const baseUrl = process.env.QWEN_BASE_URL ?? "https://dashscope-intl.aliyuncs.com/compatible-mode/v1"

    if (!apiKey) {
      return NextResponse.json({ translatedText: text, provider: "fallback" })
    }

    const response = await fetch(`${baseUrl.replace(/\/$/, "")}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          {
            role: "system",
            content:
              "You translate cognitive assessment instructions for older adults. Return only the translated text. Preserve placeholders like {index}, numbers, and clinical meaning. Keep wording simple and natural for spoken playback.",
          },
          {
            role: "user",
            content: `Translate this into ${languageNames[targetLanguage]}:\n\n${text}`,
          },
        ],
        temperature: 0.2,
      }),
      cache: "no-store",
    })

    if (!response.ok) {
      const errorText = await response.text()
      return NextResponse.json(
        { translatedText: text, provider: "fallback", error: `Qwen request failed: ${errorText}` },
        { status: 200 },
      )
    }

    const payload = await response.json()
    const translatedText = payload?.choices?.[0]?.message?.content?.trim()

    return NextResponse.json({ translatedText: translatedText || text, provider: "qwen" })
  } catch (error) {
    return NextResponse.json(
      {
        translatedText: "",
        provider: "fallback",
        error: error instanceof Error ? error.message : "Unexpected translation error.",
      },
      { status: 500 },
    )
  }
}
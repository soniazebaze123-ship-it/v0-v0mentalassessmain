import { NextRequest, NextResponse } from "next/server"

const QWEN_API_URL = "https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions"

export async function POST(request: NextRequest) {
  try {
    const { text, targetLanguage, sourceLanguage = "auto" } = await request.json()

    if (!text || !targetLanguage) {
      return NextResponse.json(
        { error: "Missing required fields: text and targetLanguage" },
        { status: 400 }
      )
    }

    const apiKey = process.env.QWEN_API_KEY
    if (!apiKey) {
      return NextResponse.json(
        { error: "QWEN_API_KEY is not configured" },
        { status: 500 }
      )
    }

    const languageNames: Record<string, string> = {
      en: "English",
      zh: "Simplified Chinese (简体中文)",
      yue: "Cantonese (粤语/廣東話)",
      fr: "French (Français)",
    }

    const targetLangName = languageNames[targetLanguage] || targetLanguage
    const sourceLangName = sourceLanguage === "auto" ? "the source language" : (languageNames[sourceLanguage] || sourceLanguage)

    const systemPrompt = `You are a professional medical translator specializing in cognitive health assessments. 
Translate the following text from ${sourceLangName} to ${targetLangName}.
- Maintain medical terminology accuracy
- Keep the tone professional but accessible for elderly patients
- Preserve any formatting, placeholders like {name}, or special characters
- Only return the translated text, no explanations`

    const response = await fetch(QWEN_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "qwen-turbo",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: text },
        ],
        temperature: 0.3,
        max_tokens: 2000,
      }),
    })

    if (!response.ok) {
      const errorData = await response.text()
      console.error("[v0] Qwen API error:", errorData)
      return NextResponse.json(
        { error: "Translation service error", details: errorData },
        { status: response.status }
      )
    }

    const data = await response.json()
    const translatedText = data.choices?.[0]?.message?.content?.trim()

    if (!translatedText) {
      return NextResponse.json(
        { error: "No translation returned" },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      translatedText,
      sourceLanguage,
      targetLanguage,
    })
  } catch (error) {
    console.error("[v0] Translation error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

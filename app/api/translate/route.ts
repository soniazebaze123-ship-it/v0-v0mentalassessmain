import { NextResponse } from "next/server"

import { getLanguageNames, translateWithQwen, type SupportedLanguage } from "./qwen"

const languageNames = getLanguageNames()

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const text = typeof body.text === "string" ? body.text.trim() : ""
    const targetLanguage = body.targetLanguage as SupportedLanguage | undefined

    if (!text || !targetLanguage || !(targetLanguage in languageNames)) {
      return NextResponse.json({ error: "Text and targetLanguage are required." }, { status: 400 })
    }

    const result = await translateWithQwen(text, targetLanguage)

    return NextResponse.json(result)
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
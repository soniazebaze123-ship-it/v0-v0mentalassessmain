import { NextResponse } from "next/server"

import { getQwenConfig, translateWithQwen } from "../qwen"

export async function GET(request: Request) {
  const url = new URL(request.url)
  const liveCheck = url.searchParams.get("live") === "1"
  const { apiKey, apiKeySource, baseUrl, model } = getQwenConfig()

  if (!liveCheck) {
    return NextResponse.json(
      {
        ok: Boolean(apiKey),
        provider: "qwen",
        configured: Boolean(apiKey),
        apiKeySource,
        model,
        baseUrl,
      },
      { status: apiKey ? 200 : 503 },
    )
  }

  try {
    const result = await translateWithQwen("Good morning", "fr")
    const isHealthy = result.provider === "qwen" && result.translatedText.trim().length > 0

    return NextResponse.json(
      {
        ok: isHealthy,
        provider: result.provider,
        configured: Boolean(apiKey),
        apiKeySource,
        model,
        baseUrl,
        sampleInput: "Good morning",
        sampleOutput: result.translatedText,
        error: "error" in result ? result.error : undefined,
      },
      { status: isHealthy ? 200 : 503 },
    )
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        provider: "qwen",
        configured: Boolean(apiKey),
        apiKeySource,
        model,
        baseUrl,
        error: error instanceof Error ? error.message : "Unexpected health check error.",
      },
      { status: 503 },
    )
  }
}
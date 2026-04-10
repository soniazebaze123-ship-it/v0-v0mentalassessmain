const languageNames = {
  en: "English",
  zh: "Simplified Chinese",
  yue: "Cantonese",
  fr: "French",
} as const

type ChatMessage = {
  role: "system" | "user" | "assistant"
  content: string
}

export type SupportedLanguage = keyof typeof languageNames

export function getLanguageNames() {
  return languageNames
}

export function getQwenConfig() {
  const apiKey = process.env.QWEN_API_KEY ?? process.env.DASHSCOPE_API_KEY
  const model = process.env.QWEN_MODEL ?? "qwen-plus"
  const baseUrl = process.env.QWEN_BASE_URL ?? "https://dashscope-intl.aliyuncs.com/compatible-mode/v1"
  const apiKeySource = process.env.QWEN_API_KEY ? "QWEN_API_KEY" : process.env.DASHSCOPE_API_KEY ? "DASHSCOPE_API_KEY" : null

  return {
    apiKey,
    apiKeySource,
    model,
    baseUrl,
  }
}

export async function requestQwenChatCompletion(messages: ChatMessage[], temperature = 0.2) {
  const { apiKey, model, baseUrl } = getQwenConfig()

  if (!apiKey) {
    return { ok: false as const, error: "Missing Qwen API key." }
  }

  const response = await fetch(`${baseUrl.replace(/\/$/, "")}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages,
      temperature,
    }),
    cache: "no-store",
  })

  if (!response.ok) {
    return {
      ok: false as const,
      error: `Qwen request failed: ${await response.text()}`,
    }
  }

  const payload = await response.json()
  const content = payload?.choices?.[0]?.message?.content?.trim()

  return {
    ok: true as const,
    content,
  }
}

export async function translateWithQwen(text: string, targetLanguage: SupportedLanguage) {
  if (targetLanguage === "en") {
    return { translatedText: text, provider: "static" as const }
  }

  const result = await requestQwenChatCompletion(
    [
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
    0.2,
  )

  if (!result.ok) {
    return {
      translatedText: text,
      provider: "fallback" as const,
      error: result.error,
    }
  }

  return {
    translatedText: result.content || text,
    provider: "qwen" as const,
  }
}
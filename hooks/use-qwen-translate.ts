"use client"

import { useState, useCallback } from "react"

interface TranslateOptions {
  sourceLanguage?: string
}

interface TranslateResult {
  translatedText: string
  success: boolean
  error?: string
}

export function useQwenTranslate() {
  const [isTranslating, setIsTranslating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const translate = useCallback(
    async (
      text: string,
      targetLanguage: string,
      options?: TranslateOptions
    ): Promise<TranslateResult> => {
      setIsTranslating(true)
      setError(null)

      try {
        const response = await fetch("/api/translate", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            text,
            targetLanguage,
            sourceLanguage: options?.sourceLanguage || "auto",
          }),
        })

        const data = await response.json()

        if (!response.ok || !data.success) {
          const errorMsg = data.error || "Translation failed"
          setError(errorMsg)
          return { translatedText: text, success: false, error: errorMsg }
        }

        return {
          translatedText: data.translatedText,
          success: true,
        }
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : "Translation error"
        setError(errorMsg)
        return { translatedText: text, success: false, error: errorMsg }
      } finally {
        setIsTranslating(false)
      }
    },
    []
  )

  const translateBatch = useCallback(
    async (
      texts: string[],
      targetLanguage: string,
      options?: TranslateOptions
    ): Promise<TranslateResult[]> => {
      setIsTranslating(true)
      setError(null)

      try {
        const results = await Promise.all(
          texts.map((text) => translate(text, targetLanguage, options))
        )
        return results
      } finally {
        setIsTranslating(false)
      }
    },
    [translate]
  )

  return {
    translate,
    translateBatch,
    isTranslating,
    error,
  }
}

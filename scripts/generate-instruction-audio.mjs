import fs from "node:fs/promises"
import path from "node:path"
import process from "node:process"

import { instructionAudioCatalog, supportedAudioLanguages } from "./instruction-audio-catalog.mjs"

const dryRun = process.argv.includes("--dry-run")
const rootDir = process.cwd()
const outputRootDir = path.join(rootDir, "public", "audio", "instructions")

function getTtsConfig() {
  return {
    apiKey:
      process.env.TTS_API_KEY ??
      process.env.OPENAI_API_KEY ??
      process.env.QWEN_API_KEY ??
      process.env.DASHSCOPE_API_KEY ??
      "",
    baseUrl: (process.env.TTS_BASE_URL ?? process.env.OPENAI_BASE_URL ?? process.env.QWEN_BASE_URL ?? "https://api.openai.com/v1").replace(/\/$/, ""),
    model: process.env.TTS_MODEL ?? process.env.OPENAI_TTS_MODEL ?? "gpt-4o-mini-tts",
    responseFormat: process.env.TTS_RESPONSE_FORMAT ?? "mp3",
    voiceMap: {
      en: process.env.TTS_VOICE_EN ?? process.env.TTS_VOICE ?? "alloy",
      zh: process.env.TTS_VOICE_ZH ?? process.env.TTS_VOICE ?? "alloy",
      yue: process.env.TTS_VOICE_YUE ?? process.env.TTS_VOICE ?? "alloy",
      fr: process.env.TTS_VOICE_FR ?? process.env.TTS_VOICE ?? "alloy",
    },
  }
}

function validateCatalog() {
  for (const entry of instructionAudioCatalog) {
    if (!entry.audioId) {
      throw new Error("Catalog entry is missing audioId.")
    }

    for (const language of supportedAudioLanguages) {
      if (!entry.texts?.[language]?.trim()) {
        throw new Error(`Catalog entry ${entry.audioId} is missing text for ${language}.`)
      }
    }
  }
}

async function ensureOutputDirs() {
  await Promise.all(
    supportedAudioLanguages.map((language) => fs.mkdir(path.join(outputRootDir, language), { recursive: true })),
  )
}

async function synthesizeSpeech({ apiKey, baseUrl, model, responseFormat, voice, text }) {
  const response = await fetch(`${baseUrl}/audio/speech`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      voice,
      input: text,
      response_format: responseFormat,
    }),
  })

  if (!response.ok) {
    throw new Error(`TTS request failed (${response.status}): ${await response.text()}`)
  }

  return Buffer.from(await response.arrayBuffer())
}

async function writeAudioFile(filePath, contents) {
  await fs.writeFile(filePath, contents)
}

async function main() {
  validateCatalog()

  const config = getTtsConfig()
  const plannedFiles = []

  for (const entry of instructionAudioCatalog) {
    for (const language of supportedAudioLanguages) {
      plannedFiles.push({
        audioId: entry.audioId,
        language,
        text: entry.texts[language],
        outputPath: path.join(outputRootDir, language, `${entry.audioId}.${config.responseFormat}`),
      })
    }
  }

  if (dryRun) {
    for (const file of plannedFiles) {
      console.log(`[dry-run] ${path.relative(rootDir, file.outputPath)} <- ${file.audioId} (${file.language})`)
    }
    return
  }

  if (!config.apiKey) {
    throw new Error(
      "Missing TTS API key. Set TTS_API_KEY, OPENAI_API_KEY, QWEN_API_KEY, or DASHSCOPE_API_KEY before running generate:audio.",
    )
  }

  await ensureOutputDirs()

  for (const file of plannedFiles) {
    const voice = config.voiceMap[file.language]
    console.log(`Generating ${path.relative(rootDir, file.outputPath)} using voice ${voice}`)
    const contents = await synthesizeSpeech({
      apiKey: config.apiKey,
      baseUrl: config.baseUrl,
      model: config.model,
      responseFormat: config.responseFormat,
      voice,
      text: file.text,
    })
    await writeAudioFile(file.outputPath, contents)
  }

  console.log(`Generated ${plannedFiles.length} audio files in ${path.relative(rootDir, outputRootDir)}`)
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error)
  process.exitCode = 1
})
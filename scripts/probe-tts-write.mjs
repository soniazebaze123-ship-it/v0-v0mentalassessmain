import fs from "node:fs/promises"

const outPath = "c:/Users/Sonia Zebaze/Desktop/clone app/v0-v0mentalassessmain/scripts/probe-result.json"
const key = process.env.TTS_API_KEY || process.env.OPENAI_API_KEY || process.env.QWEN_API_KEY || ""

if (!key) {
  console.error("NO_KEY")
  process.exit(1)
}

const result = {
  startedAt: new Date().toISOString(),
}

try {
  const controller = new AbortController()
  setTimeout(() => controller.abort(), 20000)

  const response = await fetch("https://api.openai.com/v1/audio/speech", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify({
      model: "gpt-4o-mini-tts",
      voice: "alloy",
      input: "Test audio generation",
      response_format: "mp3",
    }),
    signal: controller.signal,
  })

  const body = Buffer.from(await response.arrayBuffer())
  result.status = response.status
  result.bytes = body.length
  result.ok = response.ok
  if (!response.ok) {
    result.errorBody = body.toString("utf8").slice(0, 1200)
  }
} catch (error) {
  result.error = error instanceof Error ? error.message : String(error)
}

result.finishedAt = new Date().toISOString()
await fs.writeFile(outPath, JSON.stringify(result, null, 2), "utf8")

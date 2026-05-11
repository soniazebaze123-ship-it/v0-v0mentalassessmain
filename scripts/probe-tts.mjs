const key = process.env.TTS_API_KEY || ""

if (!key) {
  console.error("NO_KEY")
  process.exit(1)
}

const controller = new AbortController()
setTimeout(() => controller.abort(), 20000)

try {
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
  console.log(`STATUS=${response.status}`)
  console.log(`BYTES=${body.length}`)
  if (!response.ok) {
    console.log(body.toString("utf8").slice(0, 1200))
  }
} catch (error) {
  console.log(`ERROR=${error instanceof Error ? error.message : String(error)}`)
}

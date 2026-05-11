export type AudioLanguage = "en" | "zh" | "yue" | "fr"

const AUDIO_EXTENSIONS = ["mp3", "wav", "m4a"] as const

function sanitizeAudioId(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

export function getInstructionAudioSources(language: AudioLanguage, audioId?: string | null) {
  if (!audioId) {
    return []
  }

  const sanitizedAudioId = sanitizeAudioId(audioId)
  if (!sanitizedAudioId) {
    return []
  }

  return AUDIO_EXTENSIONS.map((extension) => `/audio/instructions/${language}/${sanitizedAudioId}.${extension}`)
}

export function stopAudioPlayback(audioRef: { current: HTMLAudioElement | null }) {
  if (!audioRef.current) {
    return
  }

  audioRef.current.pause()
  audioRef.current.currentTime = 0
  audioRef.current = null
}

function loadAudio(source: string): Promise<HTMLAudioElement> {
  return new Promise((resolve, reject) => {
    const audio = new Audio()
    let settled = false

    const cleanup = () => {
      audio.oncanplaythrough = null
      audio.onerror = null
    }

    const finish = (handler: () => void) => {
      if (settled) {
        return
      }

      settled = true
      cleanup()
      handler()
    }

    const timeoutId = window.setTimeout(() => {
      finish(() => reject(new Error(`Timed out while loading audio: ${source}`)))
    }, 4000)

    const clearTimer = () => window.clearTimeout(timeoutId)

    audio.preload = "auto"
    audio.src = source
    audio.oncanplaythrough = () => {
      clearTimer()
      finish(() => resolve(audio))
    }
    audio.onerror = () => {
      clearTimer()
      finish(() => reject(new Error(`Unable to load audio: ${source}`)))
    }
    audio.load()
  })
}

interface PlayAudioSourcesOptions {
  sources: string[]
  activeAudioRef: { current: HTMLAudioElement | null }
  onStart?: () => void
  onEnd?: () => void
}

export async function playAudioSources({ sources, activeAudioRef, onStart, onEnd }: PlayAudioSourcesOptions) {
  stopAudioPlayback(activeAudioRef)

  for (const source of sources) {
    try {
      const audio = await loadAudio(source)
      activeAudioRef.current = audio
      audio.onended = () => {
        if (activeAudioRef.current === audio) {
          activeAudioRef.current = null
        }
        onEnd?.()
      }
      audio.onerror = () => {
        if (activeAudioRef.current === audio) {
          activeAudioRef.current = null
        }
        onEnd?.()
      }

      onStart?.()
      await audio.play()
      return true
    } catch {
      continue
    }
  }

  return false
}
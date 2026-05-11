# Audio Asset Naming

The app now tries normal HTML audio files first and falls back to browser speech only when no matching file exists.

## Folder structure

Store audio files under:

- `public/audio/instructions/en/`
- `public/audio/instructions/zh/`
- `public/audio/instructions/yue/`
- `public/audio/instructions/fr/`

Supported file extensions:

- `.mp3`
- `.wav`
- `.m4a`

## Shared instruction button naming

For `InstructionAudio` components that use an `instructionKey`, the filename is the key lowercased with punctuation replaced by `-`.

Examples:

- `instructionKey="moca.title"` -> `public/audio/instructions/en/moca-title.mp3`
- `instructionKey="mmse.title"` -> `public/audio/instructions/fr/mmse-title.mp3`
- `instructionKey="sensory.visual.instruction"` -> `public/audio/instructions/zh/sensory-visual-instruction.mp3`

## Special assessment sentence files

These two assessment screens use explicit audio IDs:

- `public/audio/instructions/en/mmse-repetition-target-sentence.mp3`
- `public/audio/instructions/zh/mmse-repetition-target-sentence.mp3`
- `public/audio/instructions/yue/mmse-repetition-target-sentence.mp3`
- `public/audio/instructions/fr/mmse-repetition-target-sentence.mp3`
- `public/audio/instructions/en/moca-language-moderate.mp3`
- `public/audio/instructions/zh/moca-language-moderate.mp3`
- `public/audio/instructions/yue/moca-language-moderate.mp3`
- `public/audio/instructions/fr/moca-language-moderate.mp3`
- `public/audio/instructions/en/moca-language-difficult.mp3`
- `public/audio/instructions/zh/moca-language-difficult.mp3`
- `public/audio/instructions/yue/moca-language-difficult.mp3`
- `public/audio/instructions/fr/moca-language-difficult.mp3`

## Effect on the current app

- If a file exists, the app plays it with normal HTML audio.
- If a file does not exist, the app keeps using the current browser speech path.
- Non-audio features are unchanged.

## Generate files before deploy

The repo now includes a batch generator for the current instruction set.

1. Set one of these API keys in your shell or Vercel environment:
	- `TTS_API_KEY`
	- `OPENAI_API_KEY`
	- `QWEN_API_KEY`
	- `DASHSCOPE_API_KEY`
2. Optionally set:
	- `TTS_BASE_URL`
	- `TTS_MODEL`
	- `TTS_VOICE`
	- `TTS_VOICE_EN`
	- `TTS_VOICE_ZH`
	- `TTS_VOICE_YUE`
	- `TTS_VOICE_FR`
3. Preview the files that will be created:
	- `npm run generate:audio:dry`
4. Generate the audio assets:
	- `npm run generate:audio`

The generator writes the resulting audio files into `public/audio/instructions/` so the app can serve them as normal HTML audio.

The initial catalog lives in `scripts/instruction-audio-catalog.mjs`. Extend that file as you add more spoken prompts.
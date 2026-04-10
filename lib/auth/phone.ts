function normalizePhoneDigits(value: string) {
  return value.replace(/\D/g, "")
}

export function normalizePhoneNumber(value: string) {
  const trimmed = value.trim()
  const digits = normalizePhoneDigits(trimmed)

  if (!digits) {
    return ""
  }

  return trimmed.startsWith("+") ? `+${digits}` : digits
}

export function getPhoneLookupCandidates(value: string) {
  const trimmed = value.trim()
  const collapsedWhitespace = trimmed.replace(/\s+/g, "")
  const digits = normalizePhoneDigits(trimmed)
  const normalized = normalizePhoneNumber(trimmed)

  return Array.from(new Set([trimmed, collapsedWhitespace, digits, digits ? `+${digits}` : "", normalized].filter(Boolean)))
}

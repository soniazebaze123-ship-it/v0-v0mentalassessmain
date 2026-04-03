import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto"

const HASH_ALGORITHM = "scrypt"
const HASH_KEY_LENGTH = 64

export function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex")
  const derivedKey = scryptSync(password, salt, HASH_KEY_LENGTH).toString("hex")

  return `${HASH_ALGORITHM}:${HASH_KEY_LENGTH}:${salt}:${derivedKey}`
}

export function verifyPassword(password: string, storedHash: string) {
  const [algorithm, keyLengthValue, salt, expectedHash] = storedHash.split(":")

  if (algorithm !== HASH_ALGORITHM || !keyLengthValue || !salt || !expectedHash) {
    return false
  }

  const keyLength = Number.parseInt(keyLengthValue, 10)

  if (!Number.isFinite(keyLength) || keyLength <= 0) {
    return false
  }

  const actualHash = scryptSync(password, salt, keyLength).toString("hex")

  return timingSafeEqual(Buffer.from(actualHash, "hex"), Buffer.from(expectedHash, "hex"))
}
import { OLFACTORY_TEMP_PREMIUM_12_QUESTIONS } from "@/lib/olfactory/config"
import type { OlfactoryProtocolVersion, OlfactoryQuestion } from "@/lib/olfactory/types"

export const OLFACTORY_ITEM_SET_VERSION = "premium_12_v1"
export const OLFACTORY_SCORING_VERSION = "score_12_v1"

// Keep both protocol entries live so Saturday can be switched by config only.
const PROTOCOL_QUESTION_BANK: Record<OlfactoryProtocolVersion, OlfactoryQuestion[]> = {
  temp_v1: OLFACTORY_TEMP_PREMIUM_12_QUESTIONS,
  sat_v2: OLFACTORY_TEMP_PREMIUM_12_QUESTIONS,
}

export function getOlfactoryQuestionsForProtocol(protocolVersion: OlfactoryProtocolVersion): OlfactoryQuestion[] {
  return PROTOCOL_QUESTION_BANK[protocolVersion] ?? PROTOCOL_QUESTION_BANK.temp_v1
}

export function parseOlfactoryProtocolVersion(value: string | null | undefined): OlfactoryProtocolVersion {
  return value === "sat_v2" ? "sat_v2" : "temp_v1"
}

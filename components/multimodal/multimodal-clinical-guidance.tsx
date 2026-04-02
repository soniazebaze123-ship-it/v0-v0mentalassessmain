"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface MultimodalClinicalGuidanceResult {
  summary: string
  profile: {
    probableAD: boolean
    mixedNonAD: boolean
    specialistReferral: boolean
  }
  eegFlags: {
    slowingDetected: boolean
    p300DelayDetected: boolean
    p300AmplitudeReduced: boolean
  }
  sensoryFlags: {
    multisensoryImpairment: boolean
  }
}

interface MultimodalClinicalGuidanceProps {
  result: MultimodalClinicalGuidanceResult | null
}

export function MultimodalClinicalGuidance({ result }: MultimodalClinicalGuidanceProps) {
  if (!result) return null

  return (
    <Card className="rounded-3xl shadow-sm">
      <CardHeader>
        <CardTitle>Clinical Interpretation & Guidance</CardTitle>
      </CardHeader>

      <CardContent className="space-y-4 text-sm text-slate-700">
        <p>{result.summary}</p>

        {result.profile.probableAD && (
          <div className="p-3 bg-red-50 rounded-xl text-red-700">
            Probable Alzheimer’s disease pattern detected (AT(N) positive).
          </div>
        )}

        {result.profile.mixedNonAD && (
          <div className="p-3 bg-yellow-50 rounded-xl text-yellow-700">
            Mixed or non-Alzheimer’s cognitive impairment suspected.
          </div>
        )}

        {result.profile.specialistReferral && (
          <div className="p-3 bg-orange-50 rounded-xl text-orange-700">
            Specialist referral strongly recommended.
          </div>
        )}

        {/* EEG */}
        {result.eegFlags.slowingDetected && (
          <p>EEG shows cortical slowing.</p>
        )}
        {result.eegFlags.p300DelayDetected && (
          <p>P300 latency delay observed.</p>
        )}
        {result.eegFlags.p300AmplitudeReduced && (
          <p>P300 amplitude reduction detected.</p>
        )}

        {/* Sensory */}
        {result.sensoryFlags.multisensoryImpairment && (
          <p>Multiple sensory deficits detected (high early risk marker).</p>
        )}
      </CardContent>
    </Card>
  )
}
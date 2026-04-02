"use client"

import { useEffect, useMemo, useState, useTransition } from "react"

import { useUser } from "@/contexts/user-context"
import { createClient } from "@/lib/supabase/client"
import { runMultimodalEngine, type MultimodalEngineResult } from "@/lib/multimodal/multimodal-engine"
import type { MultimodalFormData } from "@/lib/multimodal/types"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { EegErpPanel } from "./eeg-erp-panel"
import { SensoryIntelligencePanel } from "./sensory-intelligence-panel"
import { BloodBiomarkerPanel } from "./blood-biomarker-panel"
import { MultimodalStatusHero } from "./multimodal-status-hero"
import { MultimodalRiskSummary } from "./multimodal-risk-summary"
import { MultimodalClinicalGuidance } from "./multimodal-clinical-guidance"

const initialData: MultimodalFormData = {
  userId: "",
  eeg: {
    thetaAlphaRatio: null,
    alphaPower: null,
    betaPower: null,
    thetaPower: null,
    deltaPower: null,
    connectivityFlag: false,
    p300Latency: null,
    p300Amplitude: null,
    n200Latency: null,
    mmnLatency: null,
  },
  sensory: {
    olfactoryScore: null,
    hearingFlag: false,
    visualFlag: false,
    auditoryErpLatency: null,
    visualErpLatency: null,
    olfactoryErpLatency: null,
  },
  blood: {
    abeta42: null,
    abeta40: null,
    pTau181: null,
    totalTau: null,
    nfl: null,
    crp: null,
    il6: null,
    tnfAlpha: null,
  },
  notes: "",
}

function toRiskPercent(result: MultimodalEngineResult) {
  return Math.min(100, Math.max(0, Number(((result.totalScore / 21) * 100).toFixed(2))))
}

function saveDraftLocally(data: MultimodalFormData, preview: MultimodalEngineResult) {
  const drafts = JSON.parse(window.localStorage.getItem("mental_assess_multimodal_drafts") ?? "[]") as Array<Record<string, unknown>>

  drafts.unshift({
    savedAt: new Date().toISOString(),
    userId: data.userId,
    eeg: data.eeg,
    sensory: data.sensory,
    blood: data.blood,
    notes: data.notes ?? "",
    result: preview,
  })

  window.localStorage.setItem("mental_assess_multimodal_drafts", JSON.stringify(drafts.slice(0, 10)))
}

export function MultimodalDashboard() {
  const { user } = useUser()
  const [data, setData] = useState<MultimodalFormData>(initialData)
  const [message, setMessage] = useState("")
  const [isPending, startTransition] = useTransition()

  useEffect(() => {
    if (!user?.id) {
      return
    }

    setData((current) => (current.userId ? current : { ...current, userId: user.id }))
  }, [user?.id])

  const preview = useMemo(() => {
    try {
      return runMultimodalEngine({
        cognitive: {
          mocaScore: null,
          mmseScore: null,
        },
        sensory: {
          visualScore: data.sensory.visualFlag ? 5 : 10,
          auditoryScore: data.sensory.hearingFlag ? 5 : 10,
          olfactoryScore: data.sensory.olfactoryScore,
        },
        eeg: data.eeg,
        blood: data.blood,
      })
    } catch {
      return null
    }
  }, [data])

  function handleSave() {
    setMessage("")

    startTransition(async () => {
      if (!preview) {
        setMessage("Enter assessment values to generate a multimodal result before saving.")
        return
      }

      const supabase = createClient()
      const riskPercent = toRiskPercent(preview)
      const { error } = await supabase.from("multimodal_assessments").insert({
        user_id: data.userId,
        eeg_input: data.eeg,
        sensory_input: data.sensory,
        blood_input: data.blood,
        result_payload: preview,
        cognitive_band: preview.stage,
        probable_ad_profile: preview.profile.probableAD,
        mixed_non_ad_pattern: preview.profile.mixedNonAD,
        specialist_referral: preview.profile.specialistReferral,
        risk_percent: riskPercent,
        notes: data.notes?.trim() || null,
      })

      if (error) {
        saveDraftLocally(data, preview)
        if (error.code === "PGRST205") {
          setMessage("Supabase table multimodal_assessments is not deployed yet. Saved locally in this browser for preview. Apply supabase/20260329_create_multimodal_assessments.sql in Supabase to enable persistent saves.")
          return
        }

        setMessage(`Supabase save failed (${error.message}). Saved locally in this browser for preview.`)
        return
      }

      setMessage("Multimodal assessment saved successfully.")
    })
  }

  return (
    <div className="space-y-6 p-4 md:p-8">
      <MultimodalStatusHero result={preview} />
      <MultimodalRiskSummary result={preview} />

      <div className="grid gap-6 xl:grid-cols-3">
        <EegErpPanel value={data.eeg} onChange={(next) => setData({ ...data, eeg: next })} />
        <SensoryIntelligencePanel value={data.sensory} onChange={(next) => setData({ ...data, sensory: next })} />
        <BloodBiomarkerPanel value={data.blood} onChange={(next) => setData({ ...data, blood: next })} />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_0.8fr]">
        <Card className="rounded-3xl shadow-sm">
          <CardHeader>
            <CardTitle>Assessment Metadata</CardTitle>
            <CardDescription>Attach the multimodal record to a user and save clinician notes.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="userId">User ID</Label>
              <input
                id="userId"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={data.userId}
                onChange={(e) => setData({ ...data, userId: e.target.value })}
                placeholder="Paste user UUID or use the logged-in user"
              />
            </div>
            {user ? (
              <p className="text-xs text-slate-500">
                Signed in as {user.name?.trim() || user.phone_number} ({user.id})
              </p>
            ) : null}
            <div className="space-y-2">
              <Label htmlFor="notes">Clinical Notes</Label>
              <Textarea
                id="notes"
                value={data.notes ?? ""}
                onChange={(e) => setData({ ...data, notes: e.target.value })}
                placeholder="Add clinician interpretation, medication context, functional observations, or follow-up notes"
              />
            </div>
            <Button onClick={handleSave} disabled={isPending || !data.userId || !preview} className="rounded-2xl">
              {isPending ? "Saving..." : "Save Multimodal Assessment"}
            </Button>
            {message ? <p className="text-sm text-slate-600">{message}</p> : null}
          </CardContent>
        </Card>

        <MultimodalClinicalGuidance result={preview} />
      </div>
    </div>
  )
}
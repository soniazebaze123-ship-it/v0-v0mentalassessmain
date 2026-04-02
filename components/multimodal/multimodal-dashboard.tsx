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

interface SavedMultimodalAssessment {
  id: string
  user_id: string
  eeg_input: MultimodalFormData["eeg"]
  sensory_input: MultimodalFormData["sensory"]
  blood_input: MultimodalFormData["blood"]
  cognitive_band: string
  probable_ad_profile: boolean
  mixed_non_ad_pattern: boolean
  specialist_referral: boolean
  risk_percent: number | null
  notes: string | null
  created_at: string
  updated_at?: string
}

export function MultimodalDashboard() {
  const { user } = useUser()
  const [data, setData] = useState<MultimodalFormData>(initialData)
  const [selectedAssessmentId, setSelectedAssessmentId] = useState<string | null>(null)
  const [message, setMessage] = useState("")
  const [savedAssessments, setSavedAssessments] = useState<SavedMultimodalAssessment[]>([])
  const [historyMessage, setHistoryMessage] = useState("")
  const [historyLoading, setHistoryLoading] = useState(false)
  const [isPending, startTransition] = useTransition()

  async function loadSavedAssessments(activeUserId: string) {
    const supabase = createClient()

    setHistoryLoading(true)
    setHistoryMessage("")

    const { data: rows, error } = await supabase
      .from("multimodal_assessments")
      .select(
        "id, user_id, eeg_input, sensory_input, blood_input, cognitive_band, probable_ad_profile, mixed_non_ad_pattern, specialist_referral, risk_percent, notes, created_at, updated_at",
      )
      .eq("user_id", activeUserId)
      .order("created_at", { ascending: false })
      .limit(10)

    if (error) {
      setSavedAssessments([])
      setHistoryMessage(`Unable to load saved multimodal assessments: ${error.message}`)
      setHistoryLoading(false)
      return
    }

    setSavedAssessments((rows ?? []) as SavedMultimodalAssessment[])
    setHistoryLoading(false)
  }

  useEffect(() => {
    if (!user?.id) {
      return
    }

    setData((current) => (current.userId ? current : { ...current, userId: user.id }))
    void loadSavedAssessments(user.id)
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
      const payload = {
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
        updated_at: new Date().toISOString(),
      }

      const query = selectedAssessmentId
        ? supabase.from("multimodal_assessments").update(payload).eq("id", selectedAssessmentId)
        : supabase.from("multimodal_assessments").insert(payload)

      const { error } = await query

      if (error) {
        saveDraftLocally(data, preview)
        if (error.code === "PGRST205") {
          setMessage("Supabase table multimodal_assessments is not deployed yet. Saved locally in this browser for preview. Apply supabase/20260329_create_multimodal_assessments.sql in Supabase to enable persistent saves.")
          return
        }

        setMessage(`Supabase save failed (${error.message}). Saved locally in this browser for preview.`)
        return
      }

      setMessage(selectedAssessmentId ? "Multimodal assessment updated successfully." : "Multimodal assessment saved successfully.")

      if (data.userId) {
        await loadSavedAssessments(data.userId)
      }
    })
  }

  function loadAssessmentIntoForm(assessment: SavedMultimodalAssessment) {
    setSelectedAssessmentId(assessment.id)
    setData({
      userId: assessment.user_id,
      eeg: assessment.eeg_input,
      sensory: assessment.sensory_input,
      blood: assessment.blood_input,
      notes: assessment.notes ?? "",
    })
    setMessage(`Loaded saved multimodal assessment from ${new Date(assessment.created_at).toLocaleString()}.`)
  }

  function handleCreateNewRecord() {
    setSelectedAssessmentId(null)
    setData({
      ...initialData,
      userId: user?.id ?? data.userId,
    })
    setMessage("Started a new multimodal assessment record.")
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
            {selectedAssessmentId ? (
              <div className="rounded-xl border border-cyan-200 bg-cyan-50 px-3 py-2 text-sm text-cyan-900">
                Editing saved assessment {selectedAssessmentId}
              </div>
            ) : null}
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
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button onClick={handleSave} disabled={isPending || !data.userId || !preview} className="rounded-2xl sm:flex-1">
                {isPending ? "Saving..." : selectedAssessmentId ? "Update Multimodal Assessment" : "Save Multimodal Assessment"}
              </Button>
              <Button variant="outline" onClick={handleCreateNewRecord} className="rounded-2xl sm:flex-1">
                Create New Record
              </Button>
            </div>
            {message ? <p className="text-sm text-slate-600">{message}</p> : null}
          </CardContent>
        </Card>

        <MultimodalClinicalGuidance result={preview} />
      </div>

      <Card className="rounded-3xl shadow-sm">
        <CardHeader>
          <CardTitle>Saved Multimodal Assessments</CardTitle>
          <CardDescription>Review recent EEG and biomarker assessments for this user and reload any record into the form.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {historyLoading ? <p className="text-sm text-slate-500">Loading saved assessments...</p> : null}
          {!historyLoading && historyMessage ? <p className="text-sm text-slate-600">{historyMessage}</p> : null}
          {!historyLoading && !historyMessage && savedAssessments.length === 0 ? (
            <p className="text-sm text-slate-500">No saved multimodal assessments yet for this user.</p>
          ) : null}

          <div className="grid gap-4 lg:grid-cols-2">
            {savedAssessments.map((assessment) => (
              <div key={assessment.id} className="rounded-2xl border bg-slate-50 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{assessment.cognitive_band}</p>
                    <p className="text-xs text-slate-500">{new Date(assessment.created_at).toLocaleString()}</p>
                    {assessment.updated_at && assessment.updated_at !== assessment.created_at ? (
                      <p className="text-xs text-slate-400">Updated {new Date(assessment.updated_at).toLocaleString()}</p>
                    ) : null}
                  </div>
                  <div className="rounded-full bg-white px-3 py-1 text-xs font-medium text-slate-700">
                    Risk {assessment.risk_percent ?? 0}%
                  </div>
                </div>

                <div className="mt-3 flex flex-wrap gap-2 text-xs">
                  <span className={`rounded-full px-2 py-1 ${assessment.probable_ad_profile ? "bg-red-100 text-red-700" : "bg-slate-200 text-slate-700"}`}>
                    {assessment.probable_ad_profile ? "Probable AD" : "No AD flag"}
                  </span>
                  <span className={`rounded-full px-2 py-1 ${assessment.mixed_non_ad_pattern ? "bg-amber-100 text-amber-700" : "bg-slate-200 text-slate-700"}`}>
                    {assessment.mixed_non_ad_pattern ? "Mixed / Non-AD" : "No mixed pattern"}
                  </span>
                  <span className={`rounded-full px-2 py-1 ${assessment.specialist_referral ? "bg-orange-100 text-orange-700" : "bg-slate-200 text-slate-700"}`}>
                    {assessment.specialist_referral ? "Referral recommended" : "No referral"}
                  </span>
                </div>

                {assessment.notes ? <p className="mt-3 line-clamp-3 text-sm text-slate-600">{assessment.notes}</p> : null}

                <div className="mt-4">
                  <Button variant="outline" className="w-full bg-white" onClick={() => loadAssessmentIntoForm(assessment)}>
                    Edit This Record
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
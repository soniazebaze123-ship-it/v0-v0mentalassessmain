"use client";

// ⚠️ PHASE 4 DEFERRED - Multimodal module archived for future implementation
// This component will be reactivated when multimodal scoring is clinically validated
// See: PHASE_4_MULTIMODAL_DEFERRAL.md for context

import { useMemo, useState, useTransition } from "react";
import { saveMultimodalAssessment } from "@/app/api/multimodal-score/actions";
import { runMultimodalEngine } from "@/lib/multimodal/multimodal-engine";
import type { MultimodalFormData } from "@/lib/multimodal/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { EegErpPanel } from "./eeg-erp-panel";
import { SensoryIntelligencePanel } from "./sensory-intelligence-panel";
import { BloodBiomarkerPanel } from "./blood-biomarker-panel";
import { MultimodalStatusHero } from "./multimodal-status-hero";
import { MultimodalRiskSummary } from "./multimodal-risk-summary";
import { MultimodalClinicalGuidance } from "./multimodal-clinical-guidance";

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
};

export function MultimodalDashboard() {
  const [data, setData] = useState<MultimodalFormData>(initialData);
  const [message, setMessage] = useState("");
  const [isPending, startTransition] = useTransition();

  const preview = useMemo(() => {
  try {
    return runMultimodalEngine({
      cognitive: {
        // ⚠️ For now optional (until we connect MMSE/MoCA later)
        mocaScore: null,
        mmseScore: null,
      },
      sensory: {
        visualScore: data.sensory.visualFlag ? 5 : 10,
        auditoryScore: data.sensory.hearingFlag ? 5 : 10,
        olfactoryScore: data.sensory.olfactoryScore,
      },
      eeg: {
        thetaPower: data.eeg.thetaPower,
        alphaPower: data.eeg.alphaPower,
        p300Latency: data.eeg.p300Latency,
        p300Amplitude: data.eeg.p300Amplitude,
      },
      blood: data.blood,
    });
  } catch {
    return null;
  }
}, [data]);

  function handleSave() {
    setMessage("");
    startTransition(async () => {
      const response = await saveMultimodalAssessment(data);
      if (!response.ok) {
        setMessage("Unable to save multimodal assessment.");
        return;
      }
      setMessage("Multimodal assessment saved successfully.");
    });
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
                placeholder="Paste Supabase user UUID"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Clinical Notes</Label>
              <Textarea
                id="notes"
                value={data.notes ?? ""}
                onChange={(e) => setData({ ...data, notes: e.target.value })}
                placeholder="Add clinician interpretation, medication context, functional observations, or follow-up notes"
              />
            </div>
            <Button onClick={handleSave} disabled={isPending || !data.userId} className="rounded-2xl">
              {isPending ? "Saving..." : "Save Multimodal Assessment"}
            </Button>
            {message ? <p className="text-sm text-slate-600">{message}</p> : null}
          </CardContent>
        </Card>

        <MultimodalClinicalGuidance result={preview} />
      </div>
    </div>
  );
}
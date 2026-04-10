"use client";

import type { MultimodalFormData } from "@/lib/multimodal/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";

interface Props {
  data: MultimodalFormData;
  onChange: (next: MultimodalFormData) => void;
  onSave: () => void;
  saving: boolean;
}

function toNullableNumber(value: string): number | null {
  if (value.trim() === "") return null;
  const parsed = Number(value);
  return Number.isNaN(parsed) ? null : parsed;
}

export function MultimodalIntakeForm({ data, onChange, onSave, saving }: Props) {
  return (
    <div className="space-y-6">
      <Card className="rounded-3xl shadow-sm">
        <CardHeader>
          <CardTitle>User Link</CardTitle>
          <CardDescription>Attach this assessment to an existing user profile.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label htmlFor="userId">User ID</Label>
            <Input
              id="userId"
              value={data.userId}
              onChange={(e) => onChange({ ...data, userId: e.target.value })}
              placeholder="Paste Supabase user UUID"
            />
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="rounded-3xl shadow-sm">
          <CardHeader>
            <CardTitle>EEG / ERP</CardTitle>
            <CardDescription>Resting EEG and task-based cognition markers.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              ["thetaAlphaRatio", "Theta / Alpha Ratio"],
              ["alphaPower", "Alpha Power"],
              ["betaPower", "Beta Power"],
              ["thetaPower", "Theta Power"],
              ["deltaPower", "Delta Power"],
              ["p300Latency", "P300 Latency (ms)"],
              ["p300Amplitude", "P300 Amplitude (µV)"],
              ["n200Latency", "N200 Latency (ms)"],
              ["mmnLatency", "MMN Latency (ms)"],
            ].map(([key, label]) => (
              <div className="space-y-2" key={key}>
                <Label htmlFor={key}>{label}</Label>
                <Input
                  id={key}
                  type="number"
                  value={(data.eeg as Record<string, number | null | boolean>)[key] as number | null ?? ""}
                  onChange={(e) =>
                    onChange({
                      ...data,
                      eeg: {
                        ...data.eeg,
                        [key]: toNullableNumber(e.target.value),
                      },
                    })
                  }
                />
              </div>
            ))}
            <div className="flex items-center justify-between rounded-2xl border p-3">
              <Label htmlFor="connectivityFlag">Connectivity Disruption Flag</Label>
              <Switch
                id="connectivityFlag"
                checked={data.eeg.connectivityFlag}
                onCheckedChange={(checked) => onChange({ ...data, eeg: { ...data.eeg, connectivityFlag: checked } })}
              />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-3xl shadow-sm">
          <CardHeader>
            <CardTitle>Sensory Intelligence</CardTitle>
            <CardDescription>Preclinical sensory risk markers.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              ["olfactoryScore", "Olfactory Score"],
              ["auditoryErpLatency", "Auditory ERP Latency"],
              ["visualErpLatency", "Visual ERP Latency"],
              ["olfactoryErpLatency", "Olfactory ERP Latency"],
            ].map(([key, label]) => (
              <div className="space-y-2" key={key}>
                <Label htmlFor={key}>{label}</Label>
                <Input
                  id={key}
                  type="number"
                  value={(data.sensory as Record<string, number | null | boolean>)[key] as number | null ?? ""}
                  onChange={(e) =>
                    onChange({
                      ...data,
                      sensory: {
                        ...data.sensory,
                        [key]: toNullableNumber(e.target.value),
                      },
                    })
                  }
                />
              </div>
            ))}
            <div className="flex items-center justify-between rounded-2xl border p-3">
              <Label htmlFor="hearingFlag">Hearing Concern</Label>
              <Switch
                id="hearingFlag"
                checked={data.sensory.hearingFlag}
                onCheckedChange={(checked) => onChange({ ...data, sensory: { ...data.sensory, hearingFlag: checked } })}
              />
            </div>
            <div className="flex items-center justify-between rounded-2xl border p-3">
              <Label htmlFor="visualFlag">Visual Concern</Label>
              <Switch
                id="visualFlag"
                checked={data.sensory.visualFlag}
                onCheckedChange={(checked) => onChange({ ...data, sensory: { ...data.sensory, visualFlag: checked } })}
              />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-3xl shadow-sm">
          <CardHeader>
            <CardTitle>Blood Biomarkers</CardTitle>
            <CardDescription>ATN-oriented biomarker staging.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              ["abeta42", "Aβ42"],
              ["abeta40", "Aβ40"],
              ["pTau181", "p-tau181"],
              ["totalTau", "Total Tau"],
              ["nfl", "NfL"],
              ["crp", "CRP"],
              ["il6", "IL-6"],
              ["tnfAlpha", "TNF-α"],
            ].map(([key, label]) => (
              <div className="space-y-2" key={key}>
                <Label htmlFor={key}>{label}</Label>
                <Input
                  id={key}
                  type="number"
                  value={(data.blood as Record<string, number | null>)[key] ?? ""}
                  onChange={(e) =>
                    onChange({
                      ...data,
                      blood: {
                        ...data.blood,
                        [key]: toNullableNumber(e.target.value),
                      },
                    })
                  }
                />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card className="rounded-3xl shadow-sm">
        <CardHeader>
          <CardTitle>Clinical Notes</CardTitle>
          <CardDescription>Optional reviewer or clinician notes.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            value={data.notes ?? ""}
            onChange={(e) => onChange({ ...data, notes: e.target.value })}
            placeholder="Add interpretation notes, medication context, or follow-up recommendations"
          />
          <Button onClick={onSave} disabled={saving || !data.userId} className="rounded-2xl">
            {saving ? "Saving..." : "Save Multimodal Assessment"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import type { SensoryInput } from "@/lib/multimodal/types";

interface Props {
  value: SensoryInput;
  onChange: (next: SensoryInput) => void;
}

function toNullableNumber(value: string): number | null {
  if (value.trim() === "") return null;
  const parsed = Number(value);
  return Number.isNaN(parsed) ? null : parsed;
}

export function SensoryIntelligencePanel({ value, onChange }: Props) {
  const fields: Array<[keyof SensoryInput, string]> = [
    ["olfactoryScore", "Olfactory Identification Score"],
    ["auditoryErpLatency", "Auditory ERP Latency"],
    ["visualErpLatency", "Visual ERP Latency"],
    ["olfactoryErpLatency", "Olfactory ERP Latency"],
  ];

  return (
    <Card className="rounded-3xl shadow-sm">
      <CardHeader>
        <CardTitle>Sensory Intelligence</CardTitle>
        <CardDescription>Olfactory, auditory, and visual markers to strengthen preclinical cognitive screening.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {fields.map(([key, label]) => (
          <div className="space-y-2" key={key}>
            <Label htmlFor={String(key)}>{label}</Label>
            <Input
              id={String(key)}
              type="number"
              value={typeof value[key] === "number" ? (value[key] as number) : ""}
              onChange={(e) => onChange({ ...value, [key]: toNullableNumber(e.target.value) } as SensoryInput)}
            />
          </div>
        ))}

        <div className="flex items-center justify-between rounded-2xl border p-3">
          <Label htmlFor="hearingFlag">Hearing Concern</Label>
          <Switch
            id="hearingFlag"
            checked={value.hearingFlag}
            onCheckedChange={(checked) => onChange({ ...value, hearingFlag: checked })}
          />
        </div>

        <div className="flex items-center justify-between rounded-2xl border p-3">
          <Label htmlFor="visualFlag">Visual Concern</Label>
          <Switch
            id="visualFlag"
            checked={value.visualFlag}
            onCheckedChange={(checked) => onChange({ ...value, visualFlag: checked })}
          />
        </div>
      </CardContent>
    </Card>
  );
}
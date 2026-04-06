"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useLanguage } from "@/contexts/language-context";
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
  const { localizeText } = useLanguage()
  const text = (en: string, zh: string, yue: string, fr: string) =>
    localizeText(en, { zh, yue, fr })

  const fields: Array<[keyof SensoryInput, string]> = [
    ["olfactoryScore", "Olfactory Identification Score"],
    ["auditoryErpLatency", "Auditory ERP Latency"],
    ["visualErpLatency", "Visual ERP Latency"],
    ["olfactoryErpLatency", "Olfactory ERP Latency"],
  ];

  return (
    <Card className="rounded-3xl shadow-sm">
      <CardHeader>
        <CardTitle>{text("Sensory Intelligence", "感觉智能", "感官智能", "Intelligence sensorielle")}</CardTitle>
        <CardDescription>
          {text(
            "Olfactory, auditory, and visual markers to strengthen preclinical cognitive screening.",
            "通过嗅觉、听觉和视觉标志物增强临床前认知筛查。",
            "透過嗅覺、聽覺同視覺標誌物加強臨床前認知篩查。",
            "Des marqueurs olfactifs, auditifs et visuels pour renforcer le dépistage cognitif préclinique.",
          )}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {fields.map(([key, label]) => (
          <div className="space-y-2" key={key}>
            <Label htmlFor={String(key)}>{text(
              label,
              key === "olfactoryScore" ? "嗅觉识别得分" : key === "auditoryErpLatency" ? "听觉 ERP 潜伏期" : key === "visualErpLatency" ? "视觉 ERP 潜伏期" : "嗅觉 ERP 潜伏期",
              key === "olfactoryScore" ? "嗅覺識別分數" : key === "auditoryErpLatency" ? "聽覺 ERP 潛伏期" : key === "visualErpLatency" ? "視覺 ERP 潛伏期" : "嗅覺 ERP 潛伏期",
              key === "olfactoryScore" ? "Score d’identification olfactive" : key === "auditoryErpLatency" ? "Latence ERP auditive" : key === "visualErpLatency" ? "Latence ERP visuelle" : "Latence ERP olfactive",
            )}</Label>
            <Input
              id={String(key)}
              type="number"
              value={typeof value[key] === "number" ? (value[key] as number) : ""}
              onChange={(e) => onChange({ ...value, [key]: toNullableNumber(e.target.value) } as SensoryInput)}
            />
          </div>
        ))}

        <div className="flex items-center justify-between rounded-2xl border p-3">
          <Label htmlFor="hearingFlag">{text("Hearing Concern", "听力问题", "聽力問題", "Préoccupation auditive")}</Label>
          <Switch
            id="hearingFlag"
            checked={value.hearingFlag}
            onCheckedChange={(checked) => onChange({ ...value, hearingFlag: checked })}
          />
        </div>

        <div className="flex items-center justify-between rounded-2xl border p-3">
          <Label htmlFor="visualFlag">{text("Visual Concern", "视力问题", "視力問題", "Préoccupation visuelle")}</Label>
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
"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Brain, AlertTriangle, CheckCircle2 } from "lucide-react";
import { useLanguage } from "@/contexts/language-context";

export function MultimodalStatusHero({ result }: any) {
  const { t, localizeText } = useLanguage();
  if (!result) return null;

  const text = (en: string, zh: string, yue: string, fr: string) =>
    localizeText(en, { zh, yue, fr })

  const colorMap: Record<string, string> = {
    Normal: "text-green-600",
    "At Risk": "text-yellow-600",
    "Early MCI": "text-orange-500",
    "Intermediate MCI": "text-orange-600",
    "Advanced MCI": "text-red-500",
    "Mild Dementia": "text-red-600",
    "Moderate Dementia": "text-red-700",
    "Severe Dementia": "text-red-800",
  };

  const stageLabelMap: Record<string, string> = {
    Normal: t("multimodal.stage.normal"),
    "At Risk": t("multimodal.stage.at_risk"),
    "Early MCI": t("multimodal.stage.early_mci"),
    "Intermediate MCI": t("multimodal.stage.intermediate_mci"),
    "Advanced MCI": t("multimodal.stage.advanced_mci"),
    "Mild Dementia": t("multimodal.stage.mild_dementia"),
    "Moderate Dementia": t("multimodal.stage.moderate_dementia"),
    "Severe Dementia": t("multimodal.stage.severe_dementia"),
  };

  const riskLabelMap: Record<string, string> = {
    Low: t("risk.level.low"),
    Moderate: t("risk.level.moderate"),
    High: t("risk.level.high"),
  };

  const Icon =
    result.riskLevel === "Low"
      ? CheckCircle2
      : result.riskLevel === "Moderate"
      ? Brain
      : AlertTriangle;

  return (
    <Card className="rounded-3xl shadow-sm">
      <CardContent className="flex flex-col md:flex-row items-center justify-between gap-4 p-6">
        <div>
          <p className="text-sm text-slate-500">{text("Cognitive Status", "认知状态", "認知狀態", "État cognitif")}</p>
          <h1 className={`text-2xl font-bold ${colorMap[result.stage]}`}>
            {stageLabelMap[result.stage] ?? result.stage}
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            {text("Risk Level", "风险等级", "風險等級", "Niveau de risque")}: {riskLabelMap[result.riskLevel] ?? result.riskLevel}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Icon className="w-8 h-8 text-slate-700" />
        </div>
      </CardContent>
    </Card>
  );
}
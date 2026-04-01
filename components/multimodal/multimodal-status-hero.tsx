"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Brain, AlertTriangle, CheckCircle2 } from "lucide-react";

export function MultimodalStatusHero({ result }: any) {
  if (!result) return null;

  const colorMap = {
    "Normal": "text-green-600",
    "At Risk": "text-yellow-600",
    "Early MCI": "text-orange-500",
    "Intermediate MCI": "text-orange-600",
    "Advanced MCI": "text-red-500",
    "Mild Dementia": "text-red-600",
    "Moderate Dementia": "text-red-700",
    "Severe Dementia": "text-red-800",
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
          <p className="text-sm text-slate-500">Cognitive Status</p>
          <h1 className={`text-2xl font-bold ${colorMap[result.stage]}`}>
            {result.stage}
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Risk Level: {result.riskLevel}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Icon className="w-8 h-8 text-slate-700" />
        </div>
      </CardContent>
    </Card>
  );
}
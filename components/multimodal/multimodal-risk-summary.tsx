"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useLanguage } from "@/contexts/language-context";

export function MultimodalRiskSummary({ result }: any) {
  const { localizeText } = useLanguage();
  if (!result) return null;

  return (
    <Card className="rounded-3xl shadow-sm">
      <CardHeader>
        <CardTitle>{localizeText("Multimodal Risk Breakdown", "多模态风险分解")}</CardTitle>
      </CardHeader>

      <CardContent className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 bg-slate-50 rounded-xl">
          <p className="text-xs text-slate-500">{localizeText("Cognitive", "认知")}</p>
          <p className="text-xl font-semibold">{result.domainScores.cognitive}</p>
        </div>

        <div className="p-4 bg-slate-50 rounded-xl">
          <p className="text-xs text-slate-500">{localizeText("Sensory", "感觉")}</p>
          <p className="text-xl font-semibold">{result.domainScores.sensory}</p>
        </div>

        <div className="p-4 bg-slate-50 rounded-xl">
          <p className="text-xs text-slate-500">EEG</p>
          <p className="text-xl font-semibold">{result.domainScores.eeg}</p>
        </div>

        <div className="p-4 bg-slate-50 rounded-xl">
          <p className="text-xs text-slate-500">{localizeText("Biomarkers", "生物标志物")}</p>
          <p className="text-xl font-semibold">{result.domainScores.blood}</p>
        </div>

        {/* Biomarker flags */}
        <div className="col-span-full mt-4 space-y-2 text-sm">
          {result.biomarkers.amyloidPositive && (
            <p className="text-red-600">⚠ {localizeText("Amyloid positive", "淀粉样蛋白阳性")}</p>
          )}
          {result.biomarkers.tauPositive && (
            <p className="text-red-600">⚠ {localizeText("Tau pathology detected", "检测到 Tau 病理变化")}</p>
          )}
          {result.biomarkers.neurodegenerationPositive && (
            <p className="text-orange-600">⚠ {localizeText("Neurodegeneration marker elevated", "神经退行性标志物升高")}</p>
          )}
          {result.biomarkers.inflammationPositive && (
            <p className="text-yellow-600">⚠ {localizeText("Inflammatory profile present", "存在炎症相关特征")}</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
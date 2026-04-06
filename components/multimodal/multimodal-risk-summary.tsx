"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useLanguage } from "@/contexts/language-context";

export function MultimodalRiskSummary({ result }: any) {
  const { localizeText } = useLanguage();
  if (!result) return null;

  const text = (en: string, zh: string, yue: string, fr: string) =>
    localizeText(en, { zh, yue, fr })

  return (
    <Card className="rounded-3xl shadow-sm">
      <CardHeader>
        <CardTitle>{text("Multimodal Risk Breakdown", "多模态风险分解", "多模態風險拆解", "Répartition du risque multimodal")}</CardTitle>
      </CardHeader>

      <CardContent className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 bg-slate-50 rounded-xl">
          <p className="text-xs text-slate-500">{text("Cognitive", "认知", "認知", "Cognitif")}</p>
          <p className="text-xl font-semibold">{result.domainScores.cognitive}</p>
        </div>

        <div className="p-4 bg-slate-50 rounded-xl">
          <p className="text-xs text-slate-500">{text("Sensory", "感觉", "感官", "Sensoriel")}</p>
          <p className="text-xl font-semibold">{result.domainScores.sensory}</p>
        </div>

        <div className="p-4 bg-slate-50 rounded-xl">
          <p className="text-xs text-slate-500">EEG</p>
          <p className="text-xl font-semibold">{result.domainScores.eeg}</p>
        </div>

        <div className="p-4 bg-slate-50 rounded-xl">
          <p className="text-xs text-slate-500">{text("Biomarkers", "生物标志物", "生物標誌物", "Biomarqueurs")}</p>
          <p className="text-xl font-semibold">{result.domainScores.blood}</p>
        </div>

        {/* Biomarker flags */}
        <div className="col-span-full mt-4 space-y-2 text-sm">
          {result.biomarkers.amyloidPositive && (
            <p className="text-red-600">⚠ {text("Amyloid positive", "淀粉样蛋白阳性", "澱粉樣蛋白陽性", "Profil amyloïde positif")}</p>
          )}
          {result.biomarkers.tauPositive && (
            <p className="text-red-600">⚠ {text("Tau pathology detected", "检测到 Tau 病理变化", "檢測到 Tau 病理變化", "Pathologie Tau détectée")}</p>
          )}
          {result.biomarkers.neurodegenerationPositive && (
            <p className="text-orange-600">⚠ {text("Neurodegeneration marker elevated", "神经退行性标志物升高", "神經退行性標誌物升高", "Marqueur de neurodégénérescence élevé")}</p>
          )}
          {result.biomarkers.inflammationPositive && (
            <p className="text-yellow-600">⚠ {text("Inflammatory profile present", "存在炎症相关特征", "存在炎症相關特徵", "Profil inflammatoire présent")}</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function MultimodalRiskSummary({ result }: any) {
  if (!result) return null;

  return (
    <Card className="rounded-3xl shadow-sm">
      <CardHeader>
        <CardTitle>Multimodal Risk Breakdown</CardTitle>
      </CardHeader>

      <CardContent className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 bg-slate-50 rounded-xl">
          <p className="text-xs text-slate-500">Cognitive</p>
          <p className="text-xl font-semibold">{result.domainScores.cognitive}</p>
        </div>

        <div className="p-4 bg-slate-50 rounded-xl">
          <p className="text-xs text-slate-500">Sensory</p>
          <p className="text-xl font-semibold">{result.domainScores.sensory}</p>
        </div>

        <div className="p-4 bg-slate-50 rounded-xl">
          <p className="text-xs text-slate-500">EEG</p>
          <p className="text-xl font-semibold">{result.domainScores.eeg}</p>
        </div>

        <div className="p-4 bg-slate-50 rounded-xl">
          <p className="text-xs text-slate-500">Biomarkers</p>
          <p className="text-xl font-semibold">{result.domainScores.blood}</p>
        </div>

        {/* Biomarker flags */}
        <div className="col-span-full mt-4 space-y-2 text-sm">
          {result.biomarkers.amyloidPositive && (
            <p className="text-red-600">⚠ Amyloid positive</p>
          )}
          {result.biomarkers.tauPositive && (
            <p className="text-red-600">⚠ Tau pathology detected</p>
          )}
          {result.biomarkers.neurodegenerationPositive && (
            <p className="text-orange-600">⚠ Neurodegeneration marker elevated</p>
          )}
          {result.biomarkers.inflammationPositive && (
            <p className="text-yellow-600">⚠ Inflammatory profile present</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
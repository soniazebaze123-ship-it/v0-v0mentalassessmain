"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface Props {
  distribution: Record<string, number>;
}

export function MultimodalStageDistributionChart({ distribution }: Props) {
  const rows = Object.entries(distribution);

  return (
    <Card className="rounded-3xl shadow-sm">
      <CardHeader>
        <CardTitle>Multimodal Stage Distribution</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {rows.length === 0 ? (
          <p className="text-sm text-slate-600">No multimodal assessment data yet.</p>
        ) : (
          rows.map(([label, value]) => (
            <div key={label} className="flex items-center justify-between rounded-2xl bg-slate-50 p-3">
              <span className="text-sm text-slate-700">{label}</span>
              <span className="text-sm font-semibold">{value}</span>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { EegErpInput } from "@/lib/multimodal/types";

interface Props {
  value: EegErpInput;
  onChange: (next: EegErpInput) => void;
}

function toNullableNumber(value: string): number | null {
  if (value.trim() === "") return null;
  const parsed = Number(value);
  return Number.isNaN(parsed) ? null : parsed;
}

export function EegErpPanel({ value, onChange }: Props) {
  const thetaAlphaRatio =
    value.thetaPower !== null && value.alphaPower !== null && value.alphaPower !== 0
      ? value.thetaPower / value.alphaPower
      : null;

  const slowingFlag = thetaAlphaRatio !== null && thetaAlphaRatio > 1.5;
  const p300DelayFlag = (value.p300Latency ?? 0) > 350;
  const p300AmplitudeFlag = (value.p300Amplitude ?? 0) < 5;

  return (
    <Card className="rounded-3xl shadow-sm">
      <CardHeader>
        <CardTitle>EEG / Neurophysiology</CardTitle>
        <CardDescription>
          Resting-state EEG and ERP (P300) indicators for early cognitive dysfunction.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Resting EEG */}
        <div className="rounded-2xl border bg-slate-50 p-4">
          <h3 className="text-sm font-semibold text-slate-900">Resting EEG Activity</h3>
          <p className="mt-1 text-xs text-slate-600">
            Theta/Alpha ratio is used to detect early cortical slowing.
          </p>

          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Theta Power</Label>
              <Input
                type="number"
                value={value.thetaPower ?? ""}
                onChange={(e) =>
                  onChange({ ...value, thetaPower: toNullableNumber(e.target.value) })
                }
              />
            </div>

            <div className="space-y-2">
              <Label>Alpha Power</Label>
              <Input
                type="number"
                value={value.alphaPower ?? ""}
                onChange={(e) =>
                  onChange({ ...value, alphaPower: toNullableNumber(e.target.value) })
                }
              />
            </div>
          </div>

          <div className="mt-4 bg-white border rounded-xl p-4">
            <div className="flex justify-between">
              <span className="text-sm font-medium">Theta / Alpha Ratio</span>
              <span className="font-semibold">
                {thetaAlphaRatio === null ? "—" : thetaAlphaRatio.toFixed(2)}
              </span>
            </div>

            <p className={`mt-2 text-sm ${slowingFlag ? "text-red-600" : "text-slate-600"}`}>
              {thetaAlphaRatio === null
                ? "Enter theta and alpha power values."
                : slowingFlag
                ? "Cortical slowing detected (early cognitive dysfunction risk)."
                : "No significant slowing detected."}
            </p>
          </div>
        </div>

        {/* ERP P300 */}
        <div className="rounded-2xl border bg-slate-50 p-4">
          <h3 className="text-sm font-semibold text-slate-900">Event-Related Potentials (P300)</h3>
          <p className="mt-1 text-xs text-slate-600">
            P300 reflects cognitive processing speed and attention.
          </p>

          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>P300 Latency (ms)</Label>
              <Input
                type="number"
                value={value.p300Latency ?? ""}
                onChange={(e) =>
                  onChange({ ...value, p300Latency: toNullableNumber(e.target.value) })
                }
              />
            </div>

            <div className="space-y-2">
              <Label>P300 Amplitude (µV)</Label>
              <Input
                type="number"
                value={value.p300Amplitude ?? ""}
                onChange={(e) =>
                  onChange({ ...value, p300Amplitude: toNullableNumber(e.target.value) })
                }
              />
            </div>
          </div>

          <div className="mt-4 space-y-2 text-sm">
            <p className={p300DelayFlag ? "text-red-600" : "text-slate-600"}>
              {p300DelayFlag
                ? "Delayed latency detected (slower cognitive processing)."
                : "Latency within expected range."}
            </p>

            <p className={p300AmplitudeFlag ? "text-red-600" : "text-slate-600"}>
              {p300AmplitudeFlag
                ? "Reduced amplitude detected (attention/memory impairment)."
                : "Amplitude within expected range."}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
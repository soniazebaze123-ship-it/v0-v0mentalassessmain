"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { BloodInput } from "@/lib/multimodal/types";

interface Props {
  value: BloodInput;
  onChange: (next: BloodInput) => void;
}

function toNullableNumber(value: string): number | null {
  if (value.trim() === "") return null;
  const parsed = Number(value);
  return Number.isNaN(parsed) ? null : parsed;
}

function calculateAbetaRatio(abeta42: number | null, abeta40: number | null): number | null {
  if (abeta42 === null || abeta40 === null || abeta40 === 0) return null;
  return abeta42 / abeta40;
}

export function BloodBiomarkerPanel({ value, onChange }: Props) {
  const abetaRatio = calculateAbetaRatio(value.abeta42, value.abeta40);

  const amyloidFlag = abetaRatio !== null && abetaRatio < 0.1;
  const tauFlag = (value.pTau181 ?? 0) > 3.0 || (value.totalTau ?? 0) > 300;
  const neurodegenerationFlag = (value.nfl ?? 0) > 30;
  const inflammationFlag =
    (value.crp ?? 0) > 3 || (value.il6 ?? 0) > 7 || (value.tnfAlpha ?? 0) > 8;

  return (
    <Card className="rounded-3xl shadow-sm">
      <CardHeader>
        <CardTitle>Blood Biomarkers</CardTitle>
        <CardDescription>
          ATN-oriented biochemical markers with neurodegeneration and inflammatory support indicators.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        <div className="rounded-2xl border bg-slate-50 p-4">
          <h3 className="text-sm font-semibold text-slate-900">Amyloid Pathology (A)</h3>
          <p className="mt-1 text-xs text-slate-600">
            Aβ42, Aβ40, and the Aβ42/Aβ40 ratio are used to estimate amyloid-related risk.
          </p>

          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="abeta42">Aβ42</Label>
              <Input
                id="abeta42"
                type="number"
                value={value.abeta42 ?? ""}
                onChange={(e) =>
                  onChange({ ...value, abeta42: toNullableNumber(e.target.value) })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="abeta40">Aβ40</Label>
              <Input
                id="abeta40"
                type="number"
                value={value.abeta40 ?? ""}
                onChange={(e) =>
                  onChange({ ...value, abeta40: toNullableNumber(e.target.value) })
                }
              />
            </div>
          </div>

          <div className="mt-4 rounded-2xl bg-white p-4 border">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-slate-700">Aβ42 / Aβ40 Ratio</span>
              <span className="text-lg font-semibold text-slate-900">
                {abetaRatio === null ? "—" : abetaRatio.toFixed(3)}
              </span>
            </div>
            <p className={`mt-2 text-sm ${amyloidFlag ? "text-red-600" : "text-slate-600"}`}>
              {abetaRatio === null
                ? "Enter both Aβ42 and Aβ40 to calculate the ratio."
                : amyloidFlag
                ? "Low ratio detected: amyloid-positive pattern flagged."
                : "Ratio currently not in amyloid-positive range."}
            </p>
          </div>
        </div>

        <div className="rounded-2xl border bg-slate-50 p-4">
          <h3 className="text-sm font-semibold text-slate-900">Tau Pathology (T)</h3>
          <p className="mt-1 text-xs text-slate-600">
            p-tau181 and total tau help estimate tau-related pathology.
          </p>

          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="pTau181">p-tau181</Label>
              <Input
                id="pTau181"
                type="number"
                value={value.pTau181 ?? ""}
                onChange={(e) =>
                  onChange({ ...value, pTau181: toNullableNumber(e.target.value) })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="totalTau">Total Tau</Label>
              <Input
                id="totalTau"
                type="number"
                value={value.totalTau ?? ""}
                onChange={(e) =>
                  onChange({ ...value, totalTau: toNullableNumber(e.target.value) })
                }
              />
            </div>
          </div>

          <p className={`mt-4 text-sm ${tauFlag ? "text-red-600" : "text-slate-600"}`}>
            {tauFlag
              ? "Tau-related abnormality flagged."
              : "No tau abnormality currently flagged from entered values."}
          </p>
        </div>

        <div className="rounded-2xl border bg-slate-50 p-4">
          <h3 className="text-sm font-semibold text-slate-900">Neurodegeneration (N)</h3>
          <p className="mt-1 text-xs text-slate-600">
            NfL is used as a support marker for neurodegeneration.
          </p>

          <div className="mt-4 space-y-2">
            <Label htmlFor="nfl">NfL</Label>
            <Input
              id="nfl"
              type="number"
              value={value.nfl ?? ""}
              onChange={(e) =>
                onChange({ ...value, nfl: toNullableNumber(e.target.value) })
              }
            />
          </div>

          <p className={`mt-4 text-sm ${neurodegenerationFlag ? "text-red-600" : "text-slate-600"}`}>
            {neurodegenerationFlag
              ? "Neurodegeneration support marker flagged."
              : "No neurodegeneration flag currently triggered from NfL."}
          </p>
        </div>

        <div className="rounded-2xl border bg-slate-50 p-4">
          <h3 className="text-sm font-semibold text-slate-900">Inflammatory Support Markers</h3>
          <p className="mt-1 text-xs text-slate-600">
            CRP, IL-6, and TNF-α may support mixed or non-AD inflammatory patterns.
          </p>

          <div className="mt-4 grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="crp">CRP</Label>
              <Input
                id="crp"
                type="number"
                value={value.crp ?? ""}
                onChange={(e) =>
                  onChange({ ...value, crp: toNullableNumber(e.target.value) })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="il6">IL-6</Label>
              <Input
                id="il6"
                type="number"
                value={value.il6 ?? ""}
                onChange={(e) =>
                  onChange({ ...value, il6: toNullableNumber(e.target.value) })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="tnfAlpha">TNF-α</Label>
              <Input
                id="tnfAlpha"
                type="number"
                value={value.tnfAlpha ?? ""}
                onChange={(e) =>
                  onChange({ ...value, tnfAlpha: toNullableNumber(e.target.value) })
                }
              />
            </div>
          </div>

          <p className={`mt-4 text-sm ${inflammationFlag ? "text-amber-600" : "text-slate-600"}`}>
            {inflammationFlag
              ? "Inflammatory support pattern detected."
              : "No inflammatory support flag currently triggered."}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
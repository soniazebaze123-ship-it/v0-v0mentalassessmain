"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useLanguage } from "@/contexts/language-context";
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
  const { localizeText } = useLanguage()
  const abetaRatio = calculateAbetaRatio(value.abeta42, value.abeta40);

  const amyloidFlag = abetaRatio !== null && abetaRatio < 0.1;
  const tauFlag = (value.pTau181 ?? 0) > 3.0 || (value.totalTau ?? 0) > 300;
  const neurodegenerationFlag = (value.nfl ?? 0) > 30;
  const inflammationFlag =
    (value.crp ?? 0) > 3 || (value.il6 ?? 0) > 7 || (value.tnfAlpha ?? 0) > 8;
  const text = (en: string, zh: string, yue: string, fr: string) =>
    localizeText(en, { zh, yue, fr })

  return (
    <Card className="rounded-3xl shadow-sm">
      <CardHeader>
        <CardTitle>{text("Blood Biomarkers", "血液生物标志物", "血液生物標誌物", "Biomarqueurs sanguins")}</CardTitle>
        <CardDescription>
          {text(
            "ATN-oriented biochemical markers with neurodegeneration and inflammatory support indicators.",
            "以 ATN 为导向的生化标志物，并结合神经退行性和炎症支持指标。",
            "以 ATN 為導向嘅生化標誌物，並結合神經退行性同炎症支援指標。",
            "Des marqueurs biochimiques orientés ATN avec des indicateurs de soutien neurodégénératif et inflammatoire.",
          )}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        <div className="rounded-2xl border bg-slate-50 p-4">
          <h3 className="text-sm font-semibold text-slate-900">{text("Amyloid Pathology (A)", "淀粉样病理（A）", "澱粉樣病理（A）", "Pathologie amyloïde (A)")}</h3>
          <p className="mt-1 text-xs text-slate-600">
            {text("Aβ42, Aβ40, and the Aβ42/Aβ40 ratio are used to estimate amyloid-related risk.", "Aβ42、Aβ40 以及 Aβ42/Aβ40 比值用于估计淀粉样相关风险。", "Aβ42、Aβ40 同 Aβ42/Aβ40 比值用嚟估計澱粉樣相關風險。", "Aβ42, Aβ40 et le ratio Aβ42/Aβ40 sont utilisés pour estimer le risque amyloïde.")}
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
                ? text("Enter both Aβ42 and Aβ40 to calculate the ratio.", "请输入 Aβ42 和 Aβ40 以计算比值。", "請輸入 Aβ42 同 Aβ40 去計算比值。", "Saisissez Aβ42 et Aβ40 pour calculer le ratio.")
                : amyloidFlag
                ? text("Low ratio detected: amyloid-positive pattern flagged.", "检测到低比值：提示淀粉样阳性模式。", "檢測到低比值：提示澱粉樣陽性模式。", "Un ratio faible a été détecté : profil amyloïde positif signalé.")
                : text("Ratio currently not in amyloid-positive range.", "当前比值未落入淀粉样阳性范围。", "目前比值未落入澱粉樣陽性範圍。", "Le ratio n’est pas actuellement dans la plage amyloïde positive.")}
            </p>
          </div>
        </div>

        <div className="rounded-2xl border bg-slate-50 p-4">
          <h3 className="text-sm font-semibold text-slate-900">{text("Tau Pathology (T)", "Tau 病理（T）", "Tau 病理（T）", "Pathologie Tau (T)")}</h3>
          <p className="mt-1 text-xs text-slate-600">
            {text("p-tau181 and total tau help estimate tau-related pathology.", "p-tau181 和总 tau 有助于估计 tau 相关病理。", "p-tau181 同 total tau 有助評估 tau 相關病理。", "Le p-tau181 et le tau total aident à estimer la pathologie liée à Tau.")}
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
              ? text("Tau-related abnormality flagged.", "提示 tau 相关异常。", "提示 tau 相關異常。", "Une anomalie liée à Tau a été signalée.")
              : text("No tau abnormality currently flagged from entered values.", "根据当前输入值，未提示 tau 异常。", "根據目前輸入數值，未見 tau 異常提示。", "Aucune anomalie Tau n’est actuellement signalée à partir des valeurs saisies.")}
          </p>
        </div>

        <div className="rounded-2xl border bg-slate-50 p-4">
          <h3 className="text-sm font-semibold text-slate-900">{text("Neurodegeneration (N)", "神经退行性改变（N）", "神經退行性變化（N）", "Neurodégénérescence (N)")}</h3>
          <p className="mt-1 text-xs text-slate-600">
            {text("NfL is used as a support marker for neurodegeneration.", "NfL 用作神经退行性改变的支持性标志物。", "NfL 用作神經退行性變化嘅支援標誌物。", "La NfL est utilisée comme marqueur de soutien de la neurodégénérescence.")}
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
              ? text("Neurodegeneration support marker flagged.", "提示神经退行性支持标志物异常。", "提示神經退行性支援標誌物異常。", "Un marqueur de soutien neurodégénératif a été signalé.")
              : text("No neurodegeneration flag currently triggered from NfL.", "当前 NfL 未触发神经退行性标记。", "目前 NfL 未觸發神經退行性標記。", "Aucun drapeau de neurodégénérescence n’est actuellement déclenché par la NfL.")}
          </p>
        </div>

        <div className="rounded-2xl border bg-slate-50 p-4">
          <h3 className="text-sm font-semibold text-slate-900">{text("Inflammatory Support Markers", "炎症支持标志物", "炎症支援標誌物", "Marqueurs de soutien inflammatoire")}</h3>
          <p className="mt-1 text-xs text-slate-600">
            {text("CRP, IL-6, and TNF-α may support mixed or non-AD inflammatory patterns.", "CRP、IL-6 和 TNF-α 可为混合型或非 AD 炎症模式提供支持。", "CRP、IL-6 同 TNF-α 可支持混合型或者非 AD 炎症模式。", "La CRP, l’IL-6 et le TNF-α peuvent soutenir des profils inflammatoires mixtes ou non-MA.")}
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
              ? text("Inflammatory support pattern detected.", "检测到炎症支持模式。", "檢測到炎症支援模式。", "Un profil de soutien inflammatoire a été détecté.")
              : text("No inflammatory support flag currently triggered.", "当前未触发炎症支持标记。", "目前未觸發炎症支援標記。", "Aucun drapeau de soutien inflammatoire n’est actuellement déclenché.")}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
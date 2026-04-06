"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useLanguage } from "@/contexts/language-context";
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
  const { localizeText } = useLanguage()
  const thetaAlphaRatio =
    value.thetaPower !== null && value.alphaPower !== null && value.alphaPower !== 0
      ? value.thetaPower / value.alphaPower
      : null;

  const slowingFlag = thetaAlphaRatio !== null && thetaAlphaRatio > 1.5;
  const p300DelayFlag = (value.p300Latency ?? 0) > 350;
  const p300AmplitudeFlag = (value.p300Amplitude ?? 0) < 5;
  const text = (en: string, zh: string, yue: string, fr: string) =>
    localizeText(en, { zh, yue, fr })

  return (
    <Card className="rounded-3xl shadow-sm">
      <CardHeader>
        <CardTitle>{text("EEG / Neurophysiology", "EEG / 神经生理", "EEG / 神經生理", "EEG / Neurophysiologie")}</CardTitle>
        <CardDescription>
          {text(
            "Resting-state EEG and ERP (P300) indicators for early cognitive dysfunction.",
            "静息态 EEG 与 ERP（P300）指标用于早期认知功能障碍评估。",
            "靜息態 EEG 同 ERP（P300）指標用於評估早期認知功能障礙。",
            "Les indicateurs EEG au repos et ERP (P300) aident à repérer un dysfonctionnement cognitif précoce.",
          )}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Resting EEG */}
        <div className="rounded-2xl border bg-slate-50 p-4">
          <h3 className="text-sm font-semibold text-slate-900">{text("Resting EEG Activity", "静息 EEG 活动", "靜息 EEG 活動", "Activité EEG au repos")}</h3>
          <p className="mt-1 text-xs text-slate-600">
            {text(
              "Theta/Alpha ratio is used to detect early cortical slowing.",
              "Theta/Alpha 比值用于检测早期皮层活动减慢。",
              "Theta/Alpha 比值用嚟檢測早期皮層活動減慢。",
              "Le rapport thêta/alpha est utilisé pour détecter un ralentissement cortical précoce.",
            )}
          </p>

          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>{text("Theta Power", "Theta 功率", "Theta 功率", "Puissance thêta")}</Label>
              <Input
                type="number"
                value={value.thetaPower ?? ""}
                onChange={(e) =>
                  onChange({ ...value, thetaPower: toNullableNumber(e.target.value) })
                }
              />
            </div>

            <div className="space-y-2">
              <Label>{text("Alpha Power", "Alpha 功率", "Alpha 功率", "Puissance alpha")}</Label>
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
              <span className="text-sm font-medium">{text("Theta / Alpha Ratio", "Theta / Alpha 比值", "Theta / Alpha 比值", "Rapport thêta / alpha")}</span>
              <span className="font-semibold">
                {thetaAlphaRatio === null ? "—" : thetaAlphaRatio.toFixed(2)}
              </span>
            </div>

            <p className={`mt-2 text-sm ${slowingFlag ? "text-red-600" : "text-slate-600"}`}>
              {thetaAlphaRatio === null
                ? text("Enter theta and alpha power values.", "请输入 theta 和 alpha 功率值。", "請輸入 theta 同 alpha 功率值。", "Saisissez les valeurs de puissance thêta et alpha.")
                : slowingFlag
                ? text("Cortical slowing detected (early cognitive dysfunction risk).", "检测到皮层活动减慢（提示早期认知功能障碍风险）。", "檢測到皮層活動減慢（提示早期認知功能障礙風險）。", "Un ralentissement cortical a été détecté (risque précoce de dysfonctionnement cognitif).")
                : text("No significant slowing detected.", "未检测到明显活动减慢。", "未檢測到明顯活動減慢。", "Aucun ralentissement significatif détecté.")}
            </p>
          </div>
        </div>

        {/* ERP P300 */}
        <div className="rounded-2xl border bg-slate-50 p-4">
          <h3 className="text-sm font-semibold text-slate-900">{text("Event-Related Potentials (P300)", "事件相关电位（P300）", "事件相關電位（P300）", "Potentiels évoqués (P300)")}</h3>
          <p className="mt-1 text-xs text-slate-600">
            {text("P300 reflects cognitive processing speed and attention.", "P300 反映认知处理速度与注意力。", "P300 反映認知處理速度同注意力。", "Le P300 reflète la vitesse de traitement cognitif et l’attention.")}
          </p>

          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>{text("P300 Latency (ms)", "P300 潜伏期（毫秒）", "P300 潛伏期（毫秒）", "Latence P300 (ms)")}</Label>
              <Input
                type="number"
                value={value.p300Latency ?? ""}
                onChange={(e) =>
                  onChange({ ...value, p300Latency: toNullableNumber(e.target.value) })
                }
              />
            </div>

            <div className="space-y-2">
              <Label>{text("P300 Amplitude (µV)", "P300 振幅（µV）", "P300 振幅（µV）", "Amplitude P300 (µV)")}</Label>
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
                ? text("Delayed latency detected (slower cognitive processing).", "检测到潜伏期延迟（认知处理速度较慢）。", "檢測到潛伏期延遲（認知處理較慢）。", "Une latence retardée a été détectée (traitement cognitif plus lent).")
                : text("Latency within expected range.", "潜伏期在预期范围内。", "潛伏期喺預期範圍內。", "La latence se situe dans la plage attendue.")}
            </p>

            <p className={p300AmplitudeFlag ? "text-red-600" : "text-slate-600"}>
              {p300AmplitudeFlag
                ? text("Reduced amplitude detected (attention/memory impairment).", "检测到振幅降低（提示注意力/记忆受损）。", "檢測到振幅下降（提示注意力 / 記憶受損）。", "Une amplitude réduite a été détectée (atteinte de l’attention / de la mémoire).")
                : text("Amplitude within expected range.", "振幅在预期范围内。", "振幅喺預期範圍內。", "L’amplitude se situe dans la plage attendue.")}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
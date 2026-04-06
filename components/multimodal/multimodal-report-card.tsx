"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useLanguage } from "@/contexts/language-context";
import type { MultimodalResult } from "@/lib/multimodal/types";

interface Props {
  result: MultimodalResult;
  patientName?: string;
}

export function MultimodalReportCard({ result, patientName }: Props) {
  const { t, localizeText } = useLanguage()
  const text = (en: string, zh: string, yue: string, fr: string) =>
    localizeText(en, { zh, yue, fr })

  const stageLabels: Record<string, string> = {
    "Normal Cognition": t("multimodal.stage.normal"),
    "At-Risk Cognitive Decline": t("multimodal.stage.at_risk"),
    "Early MCI": t("multimodal.stage.early_mci"),
    "Intermediate MCI": t("multimodal.stage.intermediate_mci"),
    "Advanced MCI": t("multimodal.stage.advanced_mci"),
    "Mild Dementia": t("multimodal.stage.mild_dementia"),
    "Moderate Dementia": t("multimodal.stage.moderate_dementia"),
    "Severe Dementia": t("multimodal.stage.severe_dementia"),
  }

  return (
    <Card className="rounded-3xl shadow-sm">
      <CardHeader>
        <CardTitle>{text("Multimodal Cognitive Report", "多模态认知报告", "多模態認知報告", "Rapport cognitif multimodal")}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm text-slate-700">
        <p><strong>{text("Patient:", "患者：", "病人：", "Patient :")}</strong> {patientName ?? text("Unnamed patient", "未命名患者", "未命名病人", "Patient non nommé")}</p>
        <p><strong>{text("Stage:", "阶段：", "階段：", "Stade :")}</strong> {stageLabels[result.cognitiveBand] ?? result.cognitiveBand}</p>
        <p><strong>{text("Risk:", "风险：", "風險：", "Risque :")}</strong> {result.riskPercent}%</p>
        <p><strong>{text("Probable AD profile:", "疑似 AD 谱系：", "疑似 AD 譜系：", "Profil probable MA :")}</strong> {result.probableADProfile ? text("Yes", "是", "係", "Oui") : text("No", "否", "唔係", "Non")}</p>
        <p><strong>{text("Mixed / Non-AD pattern:", "混合型 / 非 AD 模式：", "混合型 / 非 AD 模式：", "Profil mixte / non-MA :")}</strong> {result.mixedNonADPattern ? text("Yes", "是", "係", "Oui") : text("No", "否", "唔係", "Non")}</p>
        <p><strong>{text("Specialist referral:", "专科转诊：", "專科轉介：", "Orientation spécialisée :")}</strong> {result.specialistReferral ? text("Recommended", "建议", "建議", "Recommandée") : text("Not currently required", "当前不需要", "暫時唔需要", "Pas nécessaire pour le moment")}</p>
        <p><strong>{text("Summary:", "总结：", "總結：", "Résumé :")}</strong> {localizeText(result.clinicalSummary)}</p>
      </CardContent>
    </Card>
  );
}
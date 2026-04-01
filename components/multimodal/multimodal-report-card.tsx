import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { MultimodalResult } from "@/lib/multimodal/types";

interface Props {
  result: MultimodalResult;
  patientName?: string;
}

export function MultimodalReportCard({ result, patientName }: Props) {
  return (
    <Card className="rounded-3xl shadow-sm">
      <CardHeader>
        <CardTitle>Multimodal Cognitive Report</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm text-slate-700">
        <p><strong>Patient:</strong> {patientName ?? "Unnamed patient"}</p>
        <p><strong>Stage:</strong> {result.cognitiveBand}</p>
        <p><strong>Risk:</strong> {result.riskPercent}%</p>
        <p><strong>Probable AD profile:</strong> {result.probableADProfile ? "Yes" : "No"}</p>
        <p><strong>Mixed / Non-AD pattern:</strong> {result.mixedNonADPattern ? "Yes" : "No"}</p>
        <p><strong>Specialist referral:</strong> {result.specialistReferral ? "Recommended" : "Not currently required"}</p>
        <p><strong>Summary:</strong> {result.clinicalSummary}</p>
      </CardContent>
    </Card>
  );
}
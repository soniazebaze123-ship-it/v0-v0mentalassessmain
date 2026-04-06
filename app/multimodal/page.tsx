"use client"

import Link from "next/link"

import { MultimodalDashboard } from "@/components/multimodal/multimodal-dashboard"
import { Button } from "@/components/ui/button"
import { useLanguage } from "@/contexts/language-context"

export default function MultimodalPage() {
  const { t, localizeText } = useLanguage()

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      <div className="mx-auto max-w-7xl px-4 py-6 md:px-8">
        <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-sky-600">{localizeText("Phase 4", "第 4 阶段")}</p>
            <h1 className="text-3xl font-bold text-slate-900">{t("multimodal.title")}</h1>
            <p className="mt-2 max-w-3xl text-sm text-slate-600 md:text-base">
              {localizeText(
                "EEG, sensory markers, and blood biomarkers combined into a single risk preview and clinician workflow.",
                "将 EEG、感觉标志物和血液生物标志物整合为单一风险预览与临床工作流。",
              )}
            </p>
          </div>
          <Button asChild variant="outline" className="bg-white/80">
            <Link href="/">{localizeText("Back to Dashboard", "返回仪表板")}</Link>
          </Button>
        </div>

        <MultimodalDashboard />
      </div>
    </main>
  )
}
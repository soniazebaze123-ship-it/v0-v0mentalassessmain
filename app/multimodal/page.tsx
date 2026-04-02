import Link from "next/link"

import { MultimodalDashboard } from "@/components/multimodal/multimodal-dashboard"
import { Button } from "@/components/ui/button"

export default function MultimodalPage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      <div className="mx-auto max-w-7xl px-4 py-6 md:px-8">
        <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-sky-600">Phase 4</p>
            <h1 className="text-3xl font-bold text-slate-900">Multimodal Cognitive Intelligence</h1>
            <p className="mt-2 max-w-3xl text-sm text-slate-600 md:text-base">
              EEG, sensory markers, and blood biomarkers combined into a single risk preview and clinician workflow.
            </p>
          </div>
          <Button asChild variant="outline" className="bg-white/80">
            <Link href="/">Back to Dashboard</Link>
          </Button>
        </div>

        <MultimodalDashboard />
      </div>
    </main>
  )
}
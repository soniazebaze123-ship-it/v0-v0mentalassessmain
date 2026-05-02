"use client"

import Link from "next/link"
import { ArrowLeft, Sparkles } from "lucide-react"
import { AnimalNaming } from "@/components/assessments/animal-naming"
import { ObjectNaming } from "@/components/assessments/object-naming"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useLanguage } from "@/contexts/language-context"

export default function PremiumPreviewPage() {
  const { localizeText } = useLanguage()

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(56,189,248,0.15),_transparent_28%),linear-gradient(135deg,_#f7fbff_0%,_#eefaf7_45%,_#f4f7ff_100%)] p-4 md:p-8">
      <div className="mx-auto flex max-w-6xl flex-col gap-6">
        <Card className="overflow-hidden border-white/80 bg-white/85 shadow-[0_24px_90px_rgba(15,23,42,0.10)] backdrop-blur-xl">
          <CardHeader>
            <div className="mb-3 inline-flex w-fit items-center rounded-full bg-slate-900 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-white">
              <Sparkles className="mr-2 h-3.5 w-3.5" />
              {localizeText("Preview workspace", {
                zh: "预览工作区",
                yue: "預覽工作區",
                fr: "Espace d’aperçu",
              })}
            </div>
            <CardTitle className="text-3xl text-slate-900">
              {localizeText("Premium visual card preview", {
                zh: "高级视觉卡片预览",
                yue: "高級視覺卡片預覽",
                fr: "Aperçu des cartes visuelles premium",
              })}
            </CardTitle>
            <CardDescription className="max-w-3xl text-base text-slate-600">
              {localizeText("Review the upgraded object cards and the proposed premium animal section before confirming the final design.", {
                zh: "在确认最终设计之前，请先查看升级后的物品卡片以及建议中的高级动物区。",
                yue: "確認最終設計之前，可以先睇升級後嘅物件卡片，同埋建議中嘅高級動物區。",
                fr: "Examinez les cartes d’objets améliorées ainsi que la proposition premium pour la section animaux avant de confirmer le design final.",
              })}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline" className="rounded-xl bg-white/80">
              <Link href="/">
                <ArrowLeft className="mr-2 h-4 w-4" />
                {localizeText("Back to dashboard", {
                  zh: "返回仪表板",
                  yue: "返回主版面",
                  fr: "Retour au tableau de bord",
                })}
              </Link>
            </Button>
          </CardContent>
        </Card>

        <section className="space-y-3">
          <h2 className="text-2xl font-semibold text-slate-900">
            {localizeText("Animal section preview", {
              zh: "动物区预览",
              yue: "動物區預覽",
              fr: "Aperçu de la section animaux",
            })}
          </h2>
          <AnimalNaming onComplete={() => {}} />
        </section>

        <section className="space-y-3">
          <h2 className="text-2xl font-semibold text-slate-900">
            {localizeText("Object section preview", {
              zh: "物品区预览",
              yue: "物品區預覽",
              fr: "Aperçu de la section objets",
            })}
          </h2>
          <ObjectNaming onComplete={() => {}} />
        </section>
      </div>
    </main>
  )
}

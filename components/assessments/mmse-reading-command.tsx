"use client"

import { useState } from "react"
import { BookText } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useLanguage } from "@/contexts/language-context"
import { InstructionAudio } from "@/components/ui/instruction-audio"

interface MMSEReadingCommandProps {
  onComplete: (score: number) => void
  onSkip?: () => void
}

export function MMSEReadingCommand({ onComplete, onSkip }: MMSEReadingCommandProps) {
  const { t, localizeText } = useLanguage()
  const [obeyed, setObeyed] = useState<boolean | null>(null)

  const commandText = t("mmse.reading_command.text")

  const handleSkip = () => {
    if (onSkip) {
      onSkip()
    } else {
      onComplete(0)
    }
  }

  return (
    <Card className="mx-auto w-full max-w-3xl overflow-hidden border border-sky-100/80 shadow-[0_24px_70px_rgba(14,165,233,0.12)]">
      <CardHeader className="bg-[radial-gradient(circle_at_top_left,_rgba(56,189,248,0.20),_transparent_30%),linear-gradient(135deg,_rgba(240,249,255,0.98),_rgba(255,255,255,0.98),_rgba(224,242,254,0.96))]">
        <div className="mb-3 flex items-center gap-2">
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-sky-100 text-sky-700 shadow-sm">
            <BookText className="h-5 w-5" />
          </span>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-700/80">
              {localizeText("Reading comprehension", {
                zh: "阅读理解",
                yue: "閱讀理解",
                fr: "Compréhension écrite",
              })}
            </p>
            <CardTitle className="text-sky-900">{t("mmse.reading_command")}</CardTitle>
          </div>
        </div>
        <p className="text-sm text-slate-600">{t("mmse.reading_command.instruction")}</p>
        <InstructionAudio instructionKey="mmse.reading_command.instruction" className="mt-2" />
      </CardHeader>

      <CardContent className="space-y-5 pt-6">
        <div className="rounded-[20px] border border-sky-200 bg-white px-6 py-8 text-center shadow-sm">
          <p className="text-3xl font-black tracking-[0.08em] text-sky-800">{commandText}</p>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Button
            type="button"
            variant={obeyed === true ? "default" : "outline"}
            className={obeyed === true ? "bg-emerald-600 hover:bg-emerald-700" : ""}
            onClick={() => setObeyed(true)}
          >
            {t("mmse.reading_command.obeyed")}
          </Button>
          <Button
            type="button"
            variant={obeyed === false ? "default" : "outline"}
            className={obeyed === false ? "bg-rose-600 hover:bg-rose-700" : ""}
            onClick={() => setObeyed(false)}
          >
            {t("mmse.reading_command.not_obeyed")}
          </Button>
        </div>

        <div className="flex justify-center space-x-4 pt-2">
          <Button variant="outline" onClick={handleSkip}>
            {t("common.skip_task")}
          </Button>
          <Button onClick={() => onComplete(obeyed ? 1 : 0)} className="w-full max-w-xs bg-gradient-to-r from-cyan-600 to-sky-500 hover:from-cyan-700 hover:to-sky-600">
            {t("common.submit")}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

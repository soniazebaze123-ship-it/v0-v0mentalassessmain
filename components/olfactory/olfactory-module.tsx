"use client"

import Link from "next/link"
import { useMemo, useState, useTransition } from "react"
import { ArrowLeft, Clock3, FlaskConical, Sparkles } from "lucide-react"
import { OLFACTORY_COPY, OLFACTORY_PROTOCOL_QUESTION_SET, SCENT_LABELS } from "@/lib/olfactory/config"
import { buildOlfactoryResult } from "@/lib/olfactory/scoring"
import type {
  LanguageCode,
  OlfactoryProtocolVersion,
  OlfactoryResponseItem,
  OlfactoryScentKey,
  OlfactorySubmission,
} from "@/lib/olfactory/types"
import { saveOlfactoryResult } from "@/app/actions/olfactory-actions"
import { useLanguage } from "@/contexts/language-context"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { InstructionAudio } from "@/components/ui/instruction-audio"
import { NormReferralPanel } from "@/components/olfactory/norm-referral-panel"

type Phase = "intro" | "testing" | "results"

interface OlfactoryModuleProps {
  protocolVersion?: OlfactoryProtocolVersion
}

function asOlfactoryLanguage(language: string): LanguageCode {
  if (language === "zh" || language === "fr" || language === "yue") return language
  return "en"
}

export function OlfactoryModule({ protocolVersion = "sat_v2" }: OlfactoryModuleProps) {
  const { language } = useLanguage()
  const activeLanguage = asOlfactoryLanguage(language)
  const questions = OLFACTORY_PROTOCOL_QUESTION_SET[protocolVersion]
  const copy = OLFACTORY_COPY

  const [phase, setPhase] = useState<Phase>("intro")
  const [currentIndex, setCurrentIndex] = useState(0)
  const [patientId, setPatientId] = useState("")
  const [notes, setNotes] = useState("")
  const [startTime, setStartTime] = useState<number | null>(null)
  const [startedAtISO, setStartedAtISO] = useState<string>("")
  const [isPending, startTransition] = useTransition()
  const [saveMessage, setSaveMessage] = useState<string>("")

  const [answers, setAnswers] = useState<Record<number, OlfactoryScentKey | null>>(
    Object.fromEntries(questions.map((question) => [question.id, null])),
  )

  const [confidenceMap, setConfidenceMap] = useState<Record<number, 1 | 2 | 3 | null>>(
    Object.fromEntries(questions.map((question) => [question.id, null])),
  )

  const [responseTimes, setResponseTimes] = useState<Record<number, number | null>>(
    Object.fromEntries(questions.map((question) => [question.id, null])),
  )

  const currentQuestion = questions[currentIndex]
  const progress = ((currentIndex + (phase === "results" ? 1 : 0)) / questions.length) * 100

  const result = useMemo(() => {
    const items: OlfactoryResponseItem[] = questions.map((question) => {
      const selected = answers[question.id]
      return {
        questionId: question.id,
        scent: question.scent,
        selectedAnswer: selected,
        correctAnswer: question.correctAnswer,
        isCorrect: selected === question.correctAnswer,
        confidence: confidenceMap[question.id],
        responseTimeMs: responseTimes[question.id],
      }
    })

    return buildOlfactoryResult(items, activeLanguage, protocolVersion)
  }, [activeLanguage, answers, confidenceMap, protocolVersion, questions, responseTimes])

  const audioPrompt = useMemo(() => {
    const englishOptions = currentQuestion.options.map((option) => SCENT_LABELS[option.key].en).join(", ")
    const chineseOptions = currentQuestion.options.map((option) => SCENT_LABELS[option.key].zh).join("、")
    const cantoneseOptions = currentQuestion.options.map((option) => SCENT_LABELS[option.key].yue).join("、")
    const frenchOptions = currentQuestion.options.map((option) => SCENT_LABELS[option.key].fr).join(", ")

    return {
      text: `Question ${currentIndex + 1}. Code ${currentQuestion.questionCode}. Smell the strip and choose one answer from: ${englishOptions}.`,
      textOverrides: {
        zh: `第 ${currentIndex + 1} 题，编码 ${currentQuestion.questionCode}。请闻气味条，并从以下选项中选择一个答案：${chineseOptions}。`,
        yue: `第 ${currentIndex + 1} 題，編碼 ${currentQuestion.questionCode}。請聞氣味條，然後由以下選項揀一個答案：${cantoneseOptions}。`,
        fr: `Question ${currentIndex + 1}, code ${currentQuestion.questionCode}. Sentez la bandelette puis choisissez une réponse parmi : ${frenchOptions}.`,
      } as const,
    }
  }, [currentIndex, currentQuestion])

  function beginTest() {
    setPhase("testing")
    setCurrentIndex(0)
    setStartedAtISO(new Date().toISOString())
    setStartTime(Date.now())
    setSaveMessage("")
  }

  function handleSelectAnswer(value: string) {
    const responseTime = startTime !== null ? Math.max(Date.now() - startTime, 0) : null

    setAnswers((previous) => ({
      ...previous,
      [currentQuestion.id]: value as OlfactoryScentKey,
    }))

    setResponseTimes((previous) => ({
      ...previous,
      [currentQuestion.id]: responseTime,
    }))
  }

  function handleConfidence(value: string) {
    setConfidenceMap((previous) => ({
      ...previous,
      [currentQuestion.id]: Number(value) as 1 | 2 | 3,
    }))
  }

  function goNext() {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((previous) => previous + 1)
      setStartTime(Date.now())
      return
    }

    setPhase("results")
  }

  function goPrevious() {
    if (currentIndex > 0) {
      setCurrentIndex((previous) => previous - 1)
      setStartTime(Date.now())
    }
  }

  function restart() {
    setPhase("intro")
    setCurrentIndex(0)
    setPatientId("")
    setNotes("")
    setStartedAtISO("")
    setStartTime(null)
    setSaveMessage("")

    setAnswers(Object.fromEntries(questions.map((question) => [question.id, null])))
    setConfidenceMap(Object.fromEntries(questions.map((question) => [question.id, null])))
    setResponseTimes(Object.fromEntries(questions.map((question) => [question.id, null])))
  }

  function getRiskBadgeClass(riskLevel: string) {
    if (riskLevel === "normal") return "bg-emerald-100 text-emerald-800 hover:bg-emerald-100"
    if (riskLevel === "mild") return "bg-amber-100 text-amber-800 hover:bg-amber-100"
    return "bg-rose-100 text-rose-800 hover:bg-rose-100"
  }

  function saveResult() {
    const itemSetVersionByProtocol: Record<OlfactoryProtocolVersion, string> = {
      temp_v1: "temp_v1_items_8",
      sat_v2: "sat_v2_items_12",
      sat_v3_14: "sat_v3_14_items_14",
    }

    const scoringVersionByProtocol: Record<OlfactoryProtocolVersion, string> = {
      temp_v1: "temp_v1_scoring",
      sat_v2: "sat_v2_scoring",
      sat_v3_14: "sat_v3_14_scoring",
    }

    const payload: OlfactorySubmission = {
      patientId: patientId || undefined,
      language: activeLanguage,
      testName: copy.testNameByProtocol[protocolVersion][activeLanguage],
      testedAt: startedAtISO || new Date().toISOString(),
      protocolVersion,
      itemSetVersion: itemSetVersionByProtocol[protocolVersion],
      scoringVersion: scoringVersionByProtocol[protocolVersion],
      notes: notes || undefined,
      result,
    }

    startTransition(async () => {
      const response = await saveOlfactoryResult(payload)

      if (response.success) {
        setSaveMessage(
          activeLanguage === "zh"
            ? "结果已保存。"
            : activeLanguage === "yue"
              ? "結果已保存。"
              : activeLanguage === "fr"
                ? "Resultat enregistre."
                : "Result saved.",
        )
        return
      }

      setSaveMessage(
        activeLanguage === "zh"
          ? `保存失败：${response.error ?? "未知错误"}`
          : activeLanguage === "yue"
            ? `保存失敗：${response.error ?? "未知錯誤"}`
            : activeLanguage === "fr"
              ? `Echec de l'enregistrement : ${response.error ?? "erreur inconnue"}`
              : `Save failed: ${response.error ?? "unknown error"}`,
      )
    })
  }

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6">
      <div className="overflow-hidden rounded-xl border border-white/80 bg-[radial-gradient(circle_at_top_left,_rgba(251,191,36,0.18),_transparent_30%),radial-gradient(circle_at_top_right,_rgba(16,185,129,0.10),_transparent_36%),linear-gradient(135deg,_rgba(255,255,255,0.97),_rgba(255,251,235,0.95),_rgba(255,247,237,0.92))] shadow-[0_22px_80px_rgba(15,23,42,0.10)]">
        <div className="space-y-2 p-6 pb-4">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <Badge className="border-0 bg-amber-600 text-white hover:bg-amber-600">
              <FlaskConical className="mr-1.5 h-3.5 w-3.5" />
              {activeLanguage === "zh"
                ? "嗅觉任务14项模块"
                : activeLanguage === "yue"
                  ? "嗅覺任務14項模組"
                  : activeLanguage === "fr"
                    ? "Module olfactif 14 items"
                    : "Olfactory Task 14 Module"}
            </Badge>
          </div>
          <h2 className="text-2xl font-semibold tracking-tight">{copy.title[activeLanguage]}</h2>
          <p className="text-sm text-muted-foreground">{copy.subtitle[activeLanguage]}</p>
          <p className="text-xs font-medium text-slate-500">
            {copy.activeProtocolLabel[activeLanguage]}: {copy.protocolName[protocolVersion][activeLanguage]}
          </p>
        </div>
        <div className="space-y-4 px-6 pb-6">
          <div className="flex items-center justify-between gap-3">
            <Progress value={progress} className="h-2" />
            <Button asChild variant="outline" className="rounded-full">
              <Link href="/">
                <ArrowLeft className="mr-2 h-4 w-4" />
                {activeLanguage === "zh"
                  ? "返回"
                  : activeLanguage === "yue"
                    ? "返回"
                    : activeLanguage === "fr"
                      ? "Retour"
                      : "Back"}
              </Link>
            </Button>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="patient-id">Patient ID</Label>
              <Input
                id="patient-id"
                value={patientId}
                onChange={(event) => setPatientId(event.target.value)}
                placeholder="Optional"
              />
            </div>
            <div className="space-y-2">
              <Label>{copy.testNameByProtocol[protocolVersion][activeLanguage]}</Label>
              <div className="rounded-md border bg-white/80 px-3 py-2 text-sm">{questions.length} items</div>
            </div>
          </div>
        </div>
      </div>

      {phase === "intro" && (
        <div className="rounded-xl border bg-white p-6 shadow-sm">
          <div className="mb-4">
            <h3 className="text-xl font-semibold">{copy.instructionsTitle[activeLanguage]}</h3>
          </div>
          <div className="space-y-4">
            <ul className="list-disc space-y-2 pl-5 text-sm">
              {copy.instructions[activeLanguage].map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                placeholder={
                  activeLanguage === "zh"
                    ? "可填写受试者状态、鼻塞、配合度等"
                    : activeLanguage === "yue"
                      ? "可以填受試者狀態、鼻塞、配合度等"
                      : activeLanguage === "fr"
                        ? "Ajoutez des notes cliniques sur la congestion, la cooperation, etc."
                        : "Add clinical notes about congestion, cooperation, and patient condition."
                }
              />
            </div>

            <Button onClick={beginTest}>{copy.start[activeLanguage]}</Button>
          </div>
        </div>
      )}

      {phase === "testing" && (
        <div className="overflow-hidden rounded-[28px] border border-white/80 bg-[radial-gradient(circle_at_top_left,_rgba(244,114,182,0.12),_transparent_35%),radial-gradient(circle_at_top_right,_rgba(251,191,36,0.12),_transparent_38%),linear-gradient(140deg,_rgba(255,255,255,0.98),_rgba(255,251,235,0.96),_rgba(255,247,237,0.94))] shadow-[0_24px_90px_rgba(15,23,42,0.12)]">
          <div className="space-y-2 border-b border-white/80 bg-[linear-gradient(120deg,_rgba(255,255,255,0.92),_rgba(255,250,245,0.94))] p-6">
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <Badge className="rounded-full border-0 bg-rose-600 px-3 py-1 text-white">
                <Sparkles className="mr-1.5 h-3.5 w-3.5" />
                {activeLanguage === "zh"
                  ? "高级流程"
                  : activeLanguage === "yue"
                    ? "高級流程"
                    : activeLanguage === "fr"
                      ? "Flux premium"
                      : "Premium Flow"}
              </Badge>
              <Badge className="rounded-full border-0 bg-slate-900 px-3 py-1 text-white">
                {activeLanguage === "zh"
                  ? "受试者盲测"
                  : activeLanguage === "yue"
                    ? "受試者盲測"
                    : activeLanguage === "fr"
                      ? "Mode a l'aveugle"
                      : "Blinded Patient Mode"}
              </Badge>
            </div>
              <h3 className="text-xl font-semibold">
              {activeLanguage === "zh"
                ? `第 ${currentIndex + 1} 题 / 共 ${questions.length} 题`
                : activeLanguage === "yue"
                  ? `第 ${currentIndex + 1} 題 / 共 ${questions.length} 題`
                  : activeLanguage === "fr"
                    ? `Question ${currentIndex + 1} / ${questions.length}`
                    : `Question ${currentIndex + 1} / ${questions.length}`}
              </h3>
              <p className="text-sm text-muted-foreground">
              {activeLanguage === "zh"
                ? `编码：${currentQuestion.questionCode}`
                : activeLanguage === "yue"
                  ? `編碼：${currentQuestion.questionCode}`
                  : activeLanguage === "fr"
                    ? `Code : ${currentQuestion.questionCode}`
                    : `Code: ${currentQuestion.questionCode}`}
              </p>
            </div>

            <div className="space-y-6 p-6">
            <div className="rounded-[22px] border border-rose-100 bg-[linear-gradient(155deg,rgba(255,241,242,0.9),rgba(255,255,255,0.96),rgba(255,247,237,0.94))] p-5 text-center shadow-sm">
              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-rose-700">
                {activeLanguage === "zh"
                  ? "请闻气味条后，从以下选项中选择您辨认出的气味"
                  : activeLanguage === "yue"
                    ? "請聞氣味條後，從以下選項中揀選你辨認到嘅氣味"
                    : activeLanguage === "fr"
                      ? "Sentez la bandelette puis sélectionnez l'odeur que vous reconnaissez"
                      : "Smell the strip, then select the scent you recognise"}
              </p>
              <div className="flex items-center justify-center gap-2 text-xs text-slate-500">
                <Clock3 className="h-3.5 w-3.5" />
                {activeLanguage === "zh"
                  ? "记录响应时间用于后续认知联合分析"
                  : activeLanguage === "yue"
                    ? "記錄反應時間，用於後續認知聯合分析"
                    : activeLanguage === "fr"
                      ? "Le temps de réponse est enregistré pour l'analyse combinée cognitive"
                      : "Response time is captured for later cognitive fusion analysis"}
              </div>

              <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-rose-200 bg-rose-50/75 px-4 py-3 text-left">
                <div>
                  <p className="text-sm font-semibold text-rose-800">
                    {activeLanguage === "zh"
                      ? "语音气味引导"
                      : activeLanguage === "yue"
                        ? "語音氣味引導"
                        : activeLanguage === "fr"
                          ? "Guide audio des odeurs"
                          : "Audio scent guidance"}
                  </p>
                  <p className="text-xs text-rose-700">
                    {activeLanguage === "zh"
                      ? "可先听语音播报选项，再进行选择。"
                      : activeLanguage === "yue"
                        ? "可以先聽語音播報選項，再作選擇。"
                        : activeLanguage === "fr"
                          ? "Ecoutez les choix audio avant de selectionner."
                          : "Listen to the spoken answer choices before selecting."}
                  </p>
                </div>
                <InstructionAudio
                  key={currentQuestion.questionCode}
                  text={audioPrompt.text}
                  textOverrides={audioPrompt.textOverrides}
                  autoPlay
                  className="rounded-full border-rose-300 bg-white text-rose-700 hover:bg-rose-50"
                />
              </div>
            </div>

            <div className="space-y-3 rounded-[22px] border border-slate-200/90 bg-[linear-gradient(135deg,rgba(255,255,255,0.95),rgba(255,250,245,0.9))] p-5">
              <Label className="text-base font-semibold text-slate-800">{currentQuestion.prompt[activeLanguage]}</Label>

              <RadioGroup
                value={answers[currentQuestion.id] ?? ""}
                onValueChange={handleSelectAnswer}
                className="grid grid-cols-1 gap-3 md:grid-cols-2"
              >
                {currentQuestion.options.map((option) => (
                  <Label
                    key={option.key}
                    htmlFor={`${currentQuestion.id}-${option.key}`}
                    className="flex cursor-pointer items-center gap-3 rounded-xl border border-slate-200 bg-white/80 p-4 transition hover:border-rose-300 hover:bg-rose-50/60"
                  >
                    <RadioGroupItem id={`${currentQuestion.id}-${option.key}`} value={option.key} />
                    <span className="font-medium text-slate-700">{option.label[activeLanguage]}</span>
                  </Label>
                ))}
              </RadioGroup>
            </div>

            <div className="space-y-3 rounded-[22px] border border-amber-200/80 bg-amber-50/60 p-5">
              <Label className="font-semibold text-amber-900">{copy.confidence[activeLanguage]}</Label>
              <RadioGroup
                value={confidenceMap[currentQuestion.id]?.toString() ?? ""}
                onValueChange={handleConfidence}
                className="grid grid-cols-1 gap-3 md:grid-cols-3"
              >
                <Label
                  htmlFor={`confidence-low-${currentQuestion.id}`}
                  className="flex cursor-pointer items-center gap-3 rounded-xl border border-amber-200 bg-white/80 p-4 transition hover:border-amber-300 hover:bg-amber-100/60"
                >
                  <RadioGroupItem id={`confidence-low-${currentQuestion.id}`} value="1" />
                  <span>{copy.confidenceLow[activeLanguage]}</span>
                </Label>
                <Label
                  htmlFor={`confidence-mid-${currentQuestion.id}`}
                  className="flex cursor-pointer items-center gap-3 rounded-xl border border-amber-200 bg-white/80 p-4 transition hover:border-amber-300 hover:bg-amber-100/60"
                >
                  <RadioGroupItem id={`confidence-mid-${currentQuestion.id}`} value="2" />
                  <span>{copy.confidenceMid[activeLanguage]}</span>
                </Label>
                <Label
                  htmlFor={`confidence-high-${currentQuestion.id}`}
                  className="flex cursor-pointer items-center gap-3 rounded-xl border border-amber-200 bg-white/80 p-4 transition hover:border-amber-300 hover:bg-amber-100/60"
                >
                  <RadioGroupItem id={`confidence-high-${currentQuestion.id}`} value="3" />
                  <span>{copy.confidenceHigh[activeLanguage]}</span>
                </Label>
              </RadioGroup>
            </div>

            <div className="flex flex-wrap gap-3">
              <Button type="button" variant="outline" onClick={goPrevious} disabled={currentIndex === 0} className="rounded-full border-slate-300 bg-white/90">
                {copy.previous[activeLanguage]}
              </Button>

              {currentIndex < questions.length - 1 ? (
                <Button
                  type="button"
                  onClick={goNext}
                  disabled={!answers[currentQuestion.id]}
                  className="rounded-full bg-gradient-to-r from-rose-500 via-orange-500 to-amber-500 text-white shadow-lg shadow-rose-500/20 hover:from-rose-600 hover:via-orange-600 hover:to-amber-600"
                >
                  {copy.next[activeLanguage]}
                </Button>
              ) : (
                <Button
                  type="button"
                  onClick={goNext}
                  disabled={!answers[currentQuestion.id]}
                  className="rounded-full bg-gradient-to-r from-rose-500 via-orange-500 to-amber-500 text-white shadow-lg shadow-rose-500/20 hover:from-rose-600 hover:via-orange-600 hover:to-amber-600"
                >
                  {copy.finish[activeLanguage]}
                </Button>
              )}
            </div>
          </div>
        </div>
      )}

      {phase === "results" && (
        <div className="rounded-xl border bg-white p-6 shadow-sm">
          <div className="mb-4 space-y-1">
            <h3 className="text-xl font-semibold">{copy.results[activeLanguage]}</h3>
            <p className="text-sm text-muted-foreground">{copy.testNameByProtocol[protocolVersion][activeLanguage]}</p>
          </div>

          <div className="space-y-6">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
              <div className="rounded-lg border p-4">
                <div className="text-sm text-muted-foreground">Total items</div>
                <div className="text-2xl font-semibold">{result.totalQuestions}</div>
              </div>

              <div className="rounded-lg border p-4">
                <div className="text-sm text-muted-foreground">Correct</div>
                <div className="text-2xl font-semibold">{result.correctCount}</div>
              </div>

              <div className="rounded-lg border p-4">
                <div className="text-sm text-muted-foreground">Score %</div>
                <div className="text-2xl font-semibold">{result.scorePercent}%</div>
              </div>

              <div className="rounded-lg border p-4">
                <div className="text-sm text-muted-foreground">Risk level</div>
                <div className="mt-2">
                  <Badge className={getRiskBadgeClass(result.riskLevel)}>{result.riskLevel}</Badge>
                </div>
              </div>
            </div>

            <div className="rounded-lg border p-4">
              <div className="mb-2 text-sm font-medium">Interpretation</div>
              <p className="text-sm">{result.interpretation[activeLanguage]}</p>
            </div>

            <NormReferralPanel
              correctCount={result.correctCount}
              totalQuestions={result.totalQuestions}
              language={activeLanguage}
            />

            <div className="rounded-lg border border-cyan-200 bg-cyan-50/70 p-4 text-sm text-cyan-800">
              <div className="mb-2 flex items-center gap-2 font-medium">
                <Sparkles className="h-4 w-4" />
                {activeLanguage === "zh"
                  ? "受试者端不显示正确答案"
                  : activeLanguage === "yue"
                    ? "受試者端唔顯示正確答案"
                    : activeLanguage === "fr"
                      ? "Les bonnes reponses restent reservees a l'examinateur"
                      : "Correct-answer key remains examiner-only"}
              </div>
              <p>
                {activeLanguage === "zh"
                  ? "答案键仅在管理员页面提供给检查者。"
                  : activeLanguage === "yue"
                    ? "答案鍵只會喺管理員頁面提供比檢查者。"
                    : activeLanguage === "fr"
                      ? "La cle des reponses est disponible uniquement dans la section administrateur."
                      : "The response key is available only in the admin examiner section."}
              </p>
            </div>

            <div className="space-y-3">
              <div className="text-sm font-medium">Response summary</div>

              {result.items.map((item) => {
                const question = questions.find((entry) => entry.id === item.questionId)

                return (
                <div key={item.questionId} className="rounded-lg border p-4 text-sm">
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    <span className="font-medium">{question?.questionCode ?? `Item ${item.questionId}`}</span>
                    <Badge variant="outline">Recorded</Badge>
                  </div>

                  <div>
                    <strong>Your answer:</strong> {item.selectedAnswer ? SCENT_LABELS[item.selectedAnswer][activeLanguage] : "-"}
                  </div>
                  <div>
                    <strong>Confidence:</strong> {item.confidence ?? "-"}
                  </div>
                  <div>
                    <strong>Response time:</strong> {item.responseTimeMs ? `${item.responseTimeMs} ms` : "-"}
                  </div>
                </div>
                )
              })}
            </div>

            <div className="flex flex-wrap gap-3">
              <Button variant="outline" onClick={restart}>
                {copy.restart[activeLanguage]}
              </Button>
              <Button onClick={saveResult} disabled={isPending}>
                {copy.save[activeLanguage]}
              </Button>
            </div>

            {saveMessage ? <p className="text-sm">{saveMessage}</p> : null}
          </div>
        </div>
      )}
    </div>
  )
}

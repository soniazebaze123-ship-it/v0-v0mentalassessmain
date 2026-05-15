"use client"

import Link from "next/link"
import { useMemo, useState, useTransition } from "react"
import { ArrowLeft, Sparkles } from "lucide-react"
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

  const localizedText = {
    patientId: activeLanguage === "zh" ? "受试者编号" : activeLanguage === "yue" ? "受試者編號" : activeLanguage === "fr" ? "ID patient" : "Patient ID",
    optional: activeLanguage === "zh" ? "可选" : activeLanguage === "yue" ? "可選" : activeLanguage === "fr" ? "Optionnel" : "Optional",
    items: activeLanguage === "zh" ? "项" : activeLanguage === "yue" ? "項" : activeLanguage === "fr" ? "items" : "items",
    notes: activeLanguage === "zh" ? "备注" : activeLanguage === "yue" ? "備註" : activeLanguage === "fr" ? "Notes" : "Notes",
    totalItems: activeLanguage === "zh" ? "总项目数" : activeLanguage === "yue" ? "總項目數" : activeLanguage === "fr" ? "Nombre total d'items" : "Total items",
    correct: activeLanguage === "zh" ? "答对" : activeLanguage === "yue" ? "答對" : activeLanguage === "fr" ? "Correct" : "Correct",
    scorePercent: activeLanguage === "zh" ? "得分百分比" : activeLanguage === "yue" ? "得分百分比" : activeLanguage === "fr" ? "Score %" : "Score %",
    riskLevel: activeLanguage === "zh" ? "风险等级" : activeLanguage === "yue" ? "風險等級" : activeLanguage === "fr" ? "Niveau de risque" : "Risk level",
    interpretation: activeLanguage === "zh" ? "结果解释" : activeLanguage === "yue" ? "結果解釋" : activeLanguage === "fr" ? "Interpretation" : "Interpretation",
    responseSummary: activeLanguage === "zh" ? "作答摘要" : activeLanguage === "yue" ? "作答摘要" : activeLanguage === "fr" ? "Resume des reponses" : "Response summary",
    recorded: activeLanguage === "zh" ? "已记录" : activeLanguage === "yue" ? "已記錄" : activeLanguage === "fr" ? "Enregistre" : "Recorded",
    yourAnswer: activeLanguage === "zh" ? "你的答案：" : activeLanguage === "yue" ? "你的答案：" : activeLanguage === "fr" ? "Votre reponse :" : "Your answer:",
    confidence: activeLanguage === "zh" ? "把握程度：" : activeLanguage === "yue" ? "把握程度：" : activeLanguage === "fr" ? "Confiance :" : "Confidence:",
    responseTime: activeLanguage === "zh" ? "反应时间：" : activeLanguage === "yue" ? "反應時間：" : activeLanguage === "fr" ? "Temps de reponse :" : "Response time:",
    resultSaved: activeLanguage === "zh" ? "结果已保存。" : activeLanguage === "yue" ? "結果已保存。" : activeLanguage === "fr" ? "Resultat enregistre." : "Result saved.",
    unknownError: activeLanguage === "zh" ? "未知错误" : activeLanguage === "yue" ? "未知錯誤" : activeLanguage === "fr" ? "erreur inconnue" : "unknown error",
    saveFailedPrefix: activeLanguage === "zh" ? "保存失败：" : activeLanguage === "yue" ? "保存失敗：" : activeLanguage === "fr" ? "Echec de l'enregistrement : " : "Save failed: ",
  }

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
        setSaveMessage(localizedText.resultSaved)
        return
      }

      setSaveMessage(`${localizedText.saveFailedPrefix}${response.error ?? localizedText.unknownError}`)
    })
  }

  return (
    <div className="mx-auto w-full max-w-5xl space-y-4">
      <div className="border bg-white">
        <div className="space-y-2 p-6 pb-4">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <Badge className="border-0 bg-amber-600 text-white hover:bg-amber-600">
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
            <Button asChild variant="outline">
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
              <Label htmlFor="patient-id">{localizedText.patientId}</Label>
              <Input
                id="patient-id"
                value={patientId}
                onChange={(event) => setPatientId(event.target.value)}
                placeholder={localizedText.optional}
              />
            </div>
            <div className="space-y-2">
              <Label>{copy.testNameByProtocol[protocolVersion][activeLanguage]}</Label>
              <div className="border px-3 py-2 text-sm">{questions.length} {localizedText.items}</div>
            </div>
          </div>
        </div>
      </div>

      {phase === "intro" && (
        <div className="border bg-white p-6">
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
              <Label htmlFor="notes">{localizedText.notes}</Label>
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
        <div className="border bg-white">
          <div className="space-y-2 border-b p-6">
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
            <div className="space-y-2">
              <p className="text-sm">
                {activeLanguage === "zh"
                  ? "请闻气味条后，从以下选项中选择您辨认出的气味"
                  : activeLanguage === "yue"
                    ? "請聞氣味條後，從以下選項中揀選你辨認到嘅氣味"
                    : activeLanguage === "fr"
                      ? "Sentez la bandelette puis sélectionnez l'odeur que vous reconnaissez"
                      : "Smell the strip, then select the scent you recognise"}
              </p>
              <InstructionAudio
                key={currentQuestion.questionCode}
                text={audioPrompt.text}
                textOverrides={audioPrompt.textOverrides}
                autoPlay
              />
            </div>

            <div className="space-y-3 border p-5">
              <Label className="text-base font-semibold">{currentQuestion.prompt[activeLanguage]}</Label>

              <RadioGroup
                value={answers[currentQuestion.id] ?? ""}
                onValueChange={handleSelectAnswer}
                className="grid grid-cols-1 gap-3 md:grid-cols-2"
              >
                {currentQuestion.options.map((option) => (
                  <Label
                    key={option.key}
                    htmlFor={`${currentQuestion.id}-${option.key}`}
                    className="flex cursor-pointer items-center gap-3 border p-4 transition hover:bg-muted/50"
                  >
                    <RadioGroupItem id={`${currentQuestion.id}-${option.key}`} value={option.key} />
                    <span className="font-medium">{option.label[activeLanguage]}</span>
                  </Label>
                ))}
              </RadioGroup>
            </div>

            <div className="space-y-3 border p-5">
              <Label className="font-semibold">{copy.confidence[activeLanguage]}</Label>
              <RadioGroup
                value={confidenceMap[currentQuestion.id]?.toString() ?? ""}
                onValueChange={handleConfidence}
                className="grid grid-cols-1 gap-3 md:grid-cols-3"
              >
                <Label
                  htmlFor={`confidence-low-${currentQuestion.id}`}
                  className="flex cursor-pointer items-center gap-3 border p-4 transition hover:bg-muted/50"
                >
                  <RadioGroupItem id={`confidence-low-${currentQuestion.id}`} value="1" />
                  <span>{copy.confidenceLow[activeLanguage]}</span>
                </Label>
                <Label
                  htmlFor={`confidence-mid-${currentQuestion.id}`}
                  className="flex cursor-pointer items-center gap-3 border p-4 transition hover:bg-muted/50"
                >
                  <RadioGroupItem id={`confidence-mid-${currentQuestion.id}`} value="2" />
                  <span>{copy.confidenceMid[activeLanguage]}</span>
                </Label>
                <Label
                  htmlFor={`confidence-high-${currentQuestion.id}`}
                  className="flex cursor-pointer items-center gap-3 border p-4 transition hover:bg-muted/50"
                >
                  <RadioGroupItem id={`confidence-high-${currentQuestion.id}`} value="3" />
                  <span>{copy.confidenceHigh[activeLanguage]}</span>
                </Label>
              </RadioGroup>
            </div>

            <div className="flex flex-wrap gap-3">
              <Button type="button" variant="outline" onClick={goPrevious} disabled={currentIndex === 0}>
                {copy.previous[activeLanguage]}
              </Button>

              {currentIndex < questions.length - 1 ? (
                <Button
                  type="button"
                  onClick={goNext}
                  disabled={!answers[currentQuestion.id]}
                  className="bg-slate-900 text-white hover:bg-slate-800"
                >
                  {copy.next[activeLanguage]}
                </Button>
              ) : (
                <Button
                  type="button"
                  onClick={goNext}
                  disabled={!answers[currentQuestion.id]}
                  className="bg-slate-900 text-white hover:bg-slate-800"
                >
                  {copy.finish[activeLanguage]}
                </Button>
              )}
            </div>
          </div>
        </div>
      )}

      {phase === "results" && (
        <div className="border bg-white p-6">
          <div className="mb-4 space-y-1">
            <h3 className="text-xl font-semibold">{copy.results[activeLanguage]}</h3>
            <p className="text-sm text-muted-foreground">{copy.testNameByProtocol[protocolVersion][activeLanguage]}</p>
          </div>

          <div className="space-y-6">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
              <div className="border p-4">
                <div className="text-sm text-muted-foreground">{localizedText.totalItems}</div>
                <div className="text-2xl font-semibold">{result.totalQuestions}</div>
              </div>

              <div className="border p-4">
                <div className="text-sm text-muted-foreground">{localizedText.correct}</div>
                <div className="text-2xl font-semibold">{result.correctCount}</div>
              </div>

              <div className="border p-4">
                <div className="text-sm text-muted-foreground">{localizedText.scorePercent}</div>
                <div className="text-2xl font-semibold">{result.scorePercent}%</div>
              </div>

              <div className="border p-4">
                <div className="text-sm text-muted-foreground">{localizedText.riskLevel}</div>
                <div className="mt-2">
                  <Badge className={getRiskBadgeClass(result.riskLevel)}>{result.riskLevel}</Badge>
                </div>
              </div>
            </div>

            <div className="border p-4">
              <div className="mb-2 text-sm font-medium">{localizedText.interpretation}</div>
              <p className="text-sm">{result.interpretation[activeLanguage]}</p>
            </div>

            <NormReferralPanel
              correctCount={result.correctCount}
              totalQuestions={result.totalQuestions}
              language={activeLanguage}
            />

            <div className="border p-4 text-sm">
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
              <div className="text-sm font-medium">{localizedText.responseSummary}</div>

              {result.items.map((item) => {
                const question = questions.find((entry) => entry.id === item.questionId)

                return (
                <div key={item.questionId} className="border p-4 text-sm">
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    <span className="font-medium">{question?.questionCode ?? `Item ${item.questionId}`}</span>
                    <Badge variant="outline">{localizedText.recorded}</Badge>
                  </div>

                  <div>
                    <strong>{localizedText.yourAnswer}</strong> {item.selectedAnswer ? SCENT_LABELS[item.selectedAnswer][activeLanguage] : "-"}
                  </div>
                  <div>
                    <strong>{localizedText.confidence}</strong> {item.confidence ?? "-"}
                  </div>
                  <div>
                    <strong>{localizedText.responseTime}</strong> {item.responseTimeMs ? `${item.responseTimeMs} ms` : "-"}
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

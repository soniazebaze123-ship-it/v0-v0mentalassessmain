"use client"

import { useEffect, useMemo, useState, useTransition } from "react"

import { useLanguage } from "@/contexts/language-context"
import { useUser } from "@/contexts/user-context"
import { createClient } from "@/lib/supabase/client"
import { runMultimodalEngine, type MultimodalEngineResult } from "@/lib/multimodal/multimodal-engine"
import type { MultimodalFormData } from "@/lib/multimodal/types"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { EegErpPanel } from "./eeg-erp-panel"
import { SensoryIntelligencePanel } from "./sensory-intelligence-panel"
import { BloodBiomarkerPanel } from "./blood-biomarker-panel"
import { MultimodalStatusHero } from "./multimodal-status-hero"
import { MultimodalRiskSummary } from "./multimodal-risk-summary"
import { MultimodalClinicalGuidance } from "./multimodal-clinical-guidance"

const initialData: MultimodalFormData = {
  userId: "",
  eeg: {
    thetaAlphaRatio: null,
    alphaPower: null,
    betaPower: null,
    thetaPower: null,
    deltaPower: null,
    connectivityFlag: false,
    p300Latency: null,
    p300Amplitude: null,
    n200Latency: null,
    mmnLatency: null,
  },
  sensory: {
    olfactoryScore: null,
    hearingFlag: false,
    visualFlag: false,
    auditoryErpLatency: null,
    visualErpLatency: null,
    olfactoryErpLatency: null,
  },
  blood: {
    abeta42: null,
    abeta40: null,
    pTau181: null,
    totalTau: null,
    nfl: null,
    crp: null,
    il6: null,
    tnfAlpha: null,
  },
  notes: "",
}

function toRiskPercent(result: MultimodalEngineResult) {
  return Math.min(100, Math.max(0, Number(((result.totalScore / 21) * 100).toFixed(2))))
}

function saveDraftLocally(data: MultimodalFormData, preview: MultimodalEngineResult) {
  const drafts = JSON.parse(window.localStorage.getItem("mental_assess_multimodal_drafts") ?? "[]") as Array<Record<string, unknown>>

  drafts.unshift({
    savedAt: new Date().toISOString(),
    userId: data.userId,
    eeg: data.eeg,
    sensory: data.sensory,
    blood: data.blood,
    notes: data.notes ?? "",
    result: preview,
  })

  window.localStorage.setItem("mental_assess_multimodal_drafts", JSON.stringify(drafts.slice(0, 10)))
}

interface SavedMultimodalAssessment {
  id: string
  user_id: string
  eeg_input: MultimodalFormData["eeg"]
  sensory_input: MultimodalFormData["sensory"]
  blood_input: MultimodalFormData["blood"]
  cognitive_band: string
  probable_ad_profile: boolean
  mixed_non_ad_pattern: boolean
  specialist_referral: boolean
  risk_percent: number | null
  notes: string | null
  created_at: string
  updated_at?: string
}

export function MultimodalDashboard() {
  const { t, localizeText } = useLanguage()
  const { user } = useUser()
  const [data, setData] = useState<MultimodalFormData>(initialData)
  const [selectedAssessmentId, setSelectedAssessmentId] = useState<string | null>(null)
  const [message, setMessage] = useState("")
  const [savedAssessments, setSavedAssessments] = useState<SavedMultimodalAssessment[]>([])
  const [historyMessage, setHistoryMessage] = useState("")
  const [historyLoading, setHistoryLoading] = useState(false)
  const [isPending, startTransition] = useTransition()

  const text = (en: string, zh: string, yue: string, fr: string) =>
    localizeText(en, { zh, yue, fr })

  const formatStage = (stage: string) => {
    const labels: Record<string, string> = {
      Normal: t("multimodal.stage.normal"),
      "Normal Cognition": t("multimodal.stage.normal"),
      "At Risk": t("multimodal.stage.at_risk"),
      "At-Risk Cognitive Decline": t("multimodal.stage.at_risk"),
      "Early MCI": t("multimodal.stage.early_mci"),
      "Intermediate MCI": t("multimodal.stage.intermediate_mci"),
      "Advanced MCI": t("multimodal.stage.advanced_mci"),
      "Mild Dementia": t("multimodal.stage.mild_dementia"),
      "Moderate Dementia": t("multimodal.stage.moderate_dementia"),
      "Severe Dementia": t("multimodal.stage.severe_dementia"),
    }

    return labels[stage] ?? stage
  }

  async function loadSavedAssessments(activeUserId: string) {
    const supabase = createClient()

    setHistoryLoading(true)
    setHistoryMessage("")

    const { data: rows, error } = await supabase
      .from("multimodal_assessments")
      .select(
        "id, user_id, eeg_input, sensory_input, blood_input, cognitive_band, probable_ad_profile, mixed_non_ad_pattern, specialist_referral, risk_percent, notes, created_at, updated_at",
      )
      .eq("user_id", activeUserId)
      .order("created_at", { ascending: false })
      .limit(10)

    if (error) {
      setSavedAssessments([])
      setHistoryMessage(
        `${text(
          "Unable to load saved multimodal assessments:",
          "无法加载已保存的多模态评估：",
          "無法載入已儲存嘅多模態評估：",
          "Impossible de charger les évaluations multimodales enregistrées :",
        )} ${error.message}`,
      )
      setHistoryLoading(false)
      return
    }

    setSavedAssessments((rows ?? []) as SavedMultimodalAssessment[])
    setHistoryLoading(false)
  }

  useEffect(() => {
    if (!user?.id) {
      return
    }

    setData((current) => (current.userId ? current : { ...current, userId: user.id }))
    void loadSavedAssessments(user.id)
  }, [user?.id])

  const preview = useMemo(() => {
    try {
      return runMultimodalEngine({
        cognitive: {
          mocaScore: null,
          mmseScore: null,
        },
        sensory: {
          visualScore: data.sensory.visualFlag ? 5 : 10,
          auditoryScore: data.sensory.hearingFlag ? 5 : 10,
          olfactoryScore: data.sensory.olfactoryScore,
        },
        eeg: data.eeg,
        blood: data.blood,
      })
    } catch {
      return null
    }
  }, [data])

  function handleSave() {
    setMessage("")

    startTransition(async () => {
      if (!preview) {
        setMessage(
          text(
            "Enter assessment values to generate a multimodal result before saving.",
            "请先输入评估数值，生成多模态结果后再保存。",
            "請先輸入評估數值，生成多模態結果後先好儲存。",
            "Saisissez d’abord les valeurs d’évaluation afin de générer un résultat multimodal avant l’enregistrement.",
          ),
        )
        return
      }

      const supabase = createClient()
      const riskPercent = toRiskPercent(preview)
      const payload = {
        user_id: data.userId,
        eeg_input: data.eeg,
        sensory_input: data.sensory,
        blood_input: data.blood,
        result_payload: preview,
        cognitive_band: preview.stage,
        probable_ad_profile: preview.profile.probableAD,
        mixed_non_ad_pattern: preview.profile.mixedNonAD,
        specialist_referral: preview.profile.specialistReferral,
        risk_percent: riskPercent,
        notes: data.notes?.trim() || null,
        updated_at: new Date().toISOString(),
      }

      const query = selectedAssessmentId
        ? supabase.from("multimodal_assessments").update(payload).eq("id", selectedAssessmentId)
        : supabase.from("multimodal_assessments").insert(payload)

      const { error } = await query

      if (error) {
        saveDraftLocally(data, preview)
        if (error.code === "PGRST205") {
          setMessage(
            text(
              "Supabase table multimodal_assessments is not deployed yet. Saved locally in this browser for preview. Apply supabase/20260329_create_multimodal_assessments.sql in Supabase to enable persistent saves.",
              "Supabase 表 multimodal_assessments 尚未部署。已为预览保存在当前浏览器中。请在 Supabase 中执行 supabase/20260329_create_multimodal_assessments.sql 以启用持久保存。",
              "Supabase 表 multimodal_assessments 仲未部署。已經為預覽暫存在而家呢個瀏覽器。請喺 Supabase 執行 supabase/20260329_create_multimodal_assessments.sql 以啟用持久儲存。",
              "La table Supabase multimodal_assessments n’est pas encore déployée. Une copie locale a été enregistrée dans ce navigateur pour aperçu. Exécutez supabase/20260329_create_multimodal_assessments.sql dans Supabase pour activer l’enregistrement persistant.",
            ),
          )
          return
        }

        setMessage(
          `${text(
            "Supabase save failed",
            "Supabase 保存失败",
            "Supabase 儲存失敗",
            "Échec de l’enregistrement Supabase",
          )} (${error.message}). ${text(
            "Saved locally in this browser for preview.",
            "已为预览保存在当前浏览器中。",
            "已經為預覽暫存在呢個瀏覽器。",
            "Une copie locale a été enregistrée dans ce navigateur pour aperçu.",
          )}`,
        )
        return
      }

      setMessage(
        selectedAssessmentId
          ? text(
              "Multimodal assessment updated successfully.",
              "多模态评估更新成功。",
              "多模態評估更新成功。",
              "L’évaluation multimodale a été mise à jour avec succès.",
            )
          : text(
              "Multimodal assessment saved successfully.",
              "多模态评估保存成功。",
              "多模態評估儲存成功。",
              "L’évaluation multimodale a été enregistrée avec succès.",
            ),
      )

      if (data.userId) {
        await loadSavedAssessments(data.userId)
      }
    })
  }

  function loadAssessmentIntoForm(assessment: SavedMultimodalAssessment) {
    setSelectedAssessmentId(assessment.id)
    setData({
      userId: assessment.user_id,
      eeg: assessment.eeg_input,
      sensory: assessment.sensory_input,
      blood: assessment.blood_input,
      notes: assessment.notes ?? "",
    })
    const savedAt = new Date(assessment.created_at).toLocaleString()
    setMessage(
      text(
        `Loaded saved multimodal assessment from ${savedAt}.`,
        `已加载 ${savedAt} 保存的多模态评估。`,
        `已載入喺 ${savedAt} 儲存嘅多模態評估。`,
        `Évaluation multimodale enregistrée le ${savedAt} chargée.`,
      ),
    )
  }

  function handleCreateNewRecord() {
    setSelectedAssessmentId(null)
    setData({
      ...initialData,
      userId: user?.id ?? data.userId,
    })
    setMessage(
      text(
        "Started a new multimodal assessment record.",
        "已开始新的多模态评估记录。",
        "已開始新嘅多模態評估記錄。",
        "Un nouvel enregistrement d’évaluation multimodale a été créé.",
      ),
    )
  }

  return (
    <div className="space-y-6 p-4 md:p-8">
      <MultimodalStatusHero result={preview} />
      <MultimodalRiskSummary result={preview} />

      <div className="grid gap-6 xl:grid-cols-3">
        <EegErpPanel value={data.eeg} onChange={(next) => setData({ ...data, eeg: next })} />
        <SensoryIntelligencePanel value={data.sensory} onChange={(next) => setData({ ...data, sensory: next })} />
        <BloodBiomarkerPanel value={data.blood} onChange={(next) => setData({ ...data, blood: next })} />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_0.8fr]">
        <Card className="rounded-3xl shadow-sm">
          <CardHeader>
            <CardTitle>
              {text("Assessment Metadata", "评估元数据", "評估中繼資料", "Métadonnées de l’évaluation")}
            </CardTitle>
            <CardDescription>
              {text(
                "Attach the multimodal record to a user and save clinician notes.",
                "将多模态记录关联到用户并保存临床备注。",
                "將多模態記錄關聯到用戶並儲存臨床備註。",
                "Associez le dossier multimodal à un utilisateur et enregistrez les notes cliniques.",
              )}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {selectedAssessmentId ? (
              <div className="rounded-xl border border-cyan-200 bg-cyan-50 px-3 py-2 text-sm text-cyan-900">
                {text(
                  `Editing saved assessment ${selectedAssessmentId}`,
                  `正在编辑已保存的评估 ${selectedAssessmentId}`,
                  `而家編輯緊已儲存評估 ${selectedAssessmentId}`,
                  `Modification de l’évaluation enregistrée ${selectedAssessmentId}`,
                )}
              </div>
            ) : null}
            <div className="space-y-2">
              <Label htmlFor="userId">{t("multimodal.user_id")}</Label>
              <input
                id="userId"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={data.userId}
                onChange={(e) => setData({ ...data, userId: e.target.value })}
                placeholder={text(
                  "Paste user UUID or use the logged-in user",
                  "粘贴用户 UUID 或使用当前登录用户",
                  "貼上用戶 UUID 或者使用目前登入嘅用戶",
                  "Collez l’UUID de l’utilisateur ou utilisez l’utilisateur connecté",
                )}
              />
            </div>
            {user ? (
              <p className="text-xs text-slate-500">
                {text(
                  `Signed in as ${user.name?.trim() || user.phone_number} (${user.id})`,
                  `当前登录为 ${user.name?.trim() || user.phone_number}（${user.id}）`,
                  `目前登入身份係 ${user.name?.trim() || user.phone_number}（${user.id}）`,
                  `Connecté en tant que ${user.name?.trim() || user.phone_number} (${user.id})`,
                )}
              </p>
            ) : null}
            <div className="space-y-2">
              <Label htmlFor="notes">{t("multimodal.notes")}</Label>
              <Textarea
                id="notes"
                value={data.notes ?? ""}
                onChange={(e) => setData({ ...data, notes: e.target.value })}
                placeholder={text(
                  "Add clinician interpretation, medication context, functional observations, or follow-up notes",
                  "添加临床解释、用药背景、功能观察或随访备注",
                  "加入臨床解讀、用藥背景、功能觀察或者跟進備註",
                  "Ajoutez l’interprétation clinique, le contexte médicamenteux, les observations fonctionnelles ou les notes de suivi",
                )}
              />
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button onClick={handleSave} disabled={isPending || !data.userId || !preview} className="rounded-2xl sm:flex-1">
                {isPending
                  ? text("Saving...", "保存中...", "儲存中...", "Enregistrement...")
                  : selectedAssessmentId
                    ? text(
                        "Update Multimodal Assessment",
                        "更新多模态评估",
                        "更新多模態評估",
                        "Mettre à jour l’évaluation multimodale",
                      )
                    : t("multimodal.save")}
              </Button>
              <Button variant="outline" onClick={handleCreateNewRecord} className="rounded-2xl sm:flex-1">
                {text("Create New Record", "创建新记录", "建立新記錄", "Créer un nouvel enregistrement")}
              </Button>
            </div>
            {message ? <p className="text-sm text-slate-600">{message}</p> : null}
          </CardContent>
        </Card>

        <MultimodalClinicalGuidance result={preview} />
      </div>

      <Card className="rounded-3xl shadow-sm">
        <CardHeader>
          <CardTitle>
            {text(
              "Saved Multimodal Assessments",
              "已保存的多模态评估",
              "已儲存嘅多模態評估",
              "Évaluations multimodales enregistrées",
            )}
          </CardTitle>
          <CardDescription>
            {text(
              "Review recent EEG and biomarker assessments for this user and reload any record into the form.",
              "查看该用户最近的 EEG 和生物标志物评估，并将任一记录重新载入表单。",
              "查看呢位用戶最近嘅 EEG 同生物標誌物評估，並且將任何記錄重新載入表格。",
              "Consultez les évaluations EEG et biomarqueurs récentes de cet utilisateur et rechargez n’importe quel dossier dans le formulaire.",
            )}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {historyLoading ? (
            <p className="text-sm text-slate-500">
              {text("Loading saved assessments...", "正在加载已保存的评估...", "載入緊已儲存評估...", "Chargement des évaluations enregistrées...")}
            </p>
          ) : null}
          {!historyLoading && historyMessage ? <p className="text-sm text-slate-600">{historyMessage}</p> : null}
          {!historyLoading && !historyMessage && savedAssessments.length === 0 ? (
            <p className="text-sm text-slate-500">
              {text(
                "No saved multimodal assessments yet for this user.",
                "该用户尚无已保存的多模态评估。",
                "呢位用戶暫時未有已儲存嘅多模態評估。",
                "Aucune évaluation multimodale enregistrée pour cet utilisateur pour le moment.",
              )}
            </p>
          ) : null}

          <div className="grid gap-4 lg:grid-cols-2">
            {savedAssessments.map((assessment) => (
              <div key={assessment.id} className="rounded-2xl border bg-slate-50 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{formatStage(assessment.cognitive_band)}</p>
                    <p className="text-xs text-slate-500">{new Date(assessment.created_at).toLocaleString()}</p>
                    {assessment.updated_at && assessment.updated_at !== assessment.created_at ? (
                      <p className="text-xs text-slate-400">
                        {text(
                          `Updated ${new Date(assessment.updated_at).toLocaleString()}`,
                          `更新于 ${new Date(assessment.updated_at).toLocaleString()}`,
                          `更新於 ${new Date(assessment.updated_at).toLocaleString()}`,
                          `Mis à jour le ${new Date(assessment.updated_at).toLocaleString()}`,
                        )}
                      </p>
                    ) : null}
                  </div>
                  <div className="rounded-full bg-white px-3 py-1 text-xs font-medium text-slate-700">
                    {text("Risk", "风险", "風險", "Risque")} {assessment.risk_percent ?? 0}%
                  </div>
                </div>

                <div className="mt-3 flex flex-wrap gap-2 text-xs">
                  <span className={`rounded-full px-2 py-1 ${assessment.probable_ad_profile ? "bg-red-100 text-red-700" : "bg-slate-200 text-slate-700"}`}>
                    {assessment.probable_ad_profile
                      ? text("Probable AD", "疑似 AD", "疑似 AD", "Probable MA")
                      : text("No AD flag", "无 AD 标记", "冇 AD 標記", "Aucun drapeau MA")}
                  </span>
                  <span className={`rounded-full px-2 py-1 ${assessment.mixed_non_ad_pattern ? "bg-amber-100 text-amber-700" : "bg-slate-200 text-slate-700"}`}>
                    {assessment.mixed_non_ad_pattern
                      ? text("Mixed / Non-AD", "混合型 / 非 AD", "混合型 / 非 AD", "Mixte / non-MA")
                      : text("No mixed pattern", "无混合模式", "冇混合模式", "Aucun profil mixte")}
                  </span>
                  <span className={`rounded-full px-2 py-1 ${assessment.specialist_referral ? "bg-orange-100 text-orange-700" : "bg-slate-200 text-slate-700"}`}>
                    {assessment.specialist_referral
                      ? text("Referral recommended", "建议转诊", "建議轉介", "Orientation recommandée")
                      : text("No referral", "无需转诊", "唔需要轉介", "Pas d’orientation")}
                  </span>
                </div>

                {assessment.notes ? <p className="mt-3 line-clamp-3 text-sm text-slate-600">{assessment.notes}</p> : null}

                <div className="mt-4">
                  <Button variant="outline" className="w-full bg-white" onClick={() => loadAssessmentIntoForm(assessment)}>
                    {text("Edit This Record", "编辑此记录", "編輯呢條記錄", "Modifier cet enregistrement")}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
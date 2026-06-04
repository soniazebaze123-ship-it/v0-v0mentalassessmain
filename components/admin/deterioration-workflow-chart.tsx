"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import { useLanguage } from "@/contexts/language-context"

import type { PatientTrajectoryData, TrajectoryWorkflowData } from "@/lib/admin-data-utils"

interface DeteriorationWorkflowChartProps {
  workflowData: TrajectoryWorkflowData[]
  trajectories: PatientTrajectoryData[]
  users: { id: string; phone_number: string }[]
}

function formatDelta(delta: number) {
  if (delta > 0) {
    return `+${delta.toFixed(1)}`
  }

  return delta.toFixed(1)
}

export function DeteriorationWorkflowChart({ workflowData, trajectories, users }: DeteriorationWorkflowChartProps) {
  const { localizeText } = useLanguage()
  const mostConcerningTrajectories = trajectories.filter((trajectory) => trajectory.status === "Deteriorated").slice(0, 6)

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {localizeText("Research Progress and Deterioration Workflow", {
            zh: "研究进展与恶化流程",
            yue: "研究進展與惡化流程",
            fr: "Progression de recherche et workflow de deterioration",
          })}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-8">
        <ResponsiveContainer width="100%" height={320}>
          <BarChart data={workflowData} margin={{ top: 20, right: 20, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="assessmentType" />
            <YAxis allowDecimals={false} />
            <Tooltip />
            <Legend />
            <Bar
              dataKey="improvedCount"
              name={localizeText("Improved", { zh: "改善", yue: "改善", fr: "Ameliore" })}
              stackId="status"
              fill="#22c55e"
              radius={[4, 4, 0, 0]}
            />
            <Bar
              dataKey="stableCount"
              name={localizeText("Stable", { zh: "稳定", yue: "穩定", fr: "Stable" })}
              stackId="status"
              fill="#94a3b8"
            />
            <Bar
              dataKey="deterioratedCount"
              name={localizeText("Deteriorated", { zh: "恶化", yue: "惡化", fr: "Deteriore" })}
              stackId="status"
              fill="#ef4444"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>

        <div className="grid gap-4 lg:grid-cols-2">
          {workflowData.map((item) => (
            <div key={item.assessmentType} className="rounded-2xl border bg-slate-50 p-5">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-slate-900">
                    {item.assessmentType} {localizeText("cohort workflow", { zh: "队列流程", yue: "隊列流程", fr: "workflow de cohorte" })}
                  </p>
                  <p className="text-xs text-slate-500">
                    {item.cohortSize} {localizeText("patients with repeated assessments", {
                      zh: "名重复评估患者",
                      yue: "名重複評估患者",
                      fr: "patients avec evaluations repetees",
                    })}
                  </p>
                </div>
                <div className={`rounded-full px-3 py-1 text-xs font-semibold ${item.avgDelta < 0 ? "bg-red-100 text-red-700" : item.avgDelta > 0 ? "bg-emerald-100 text-emerald-700" : "bg-slate-200 text-slate-700"}`}>
                  {localizeText("Avg delta", { zh: "平均变化", yue: "平均變化", fr: "Delta moyen" })} {formatDelta(item.avgDelta)}
                </div>
              </div>

              <div className="mt-4 flex items-center gap-3 overflow-x-auto">
                <div className="min-w-[120px] rounded-xl bg-white p-3 shadow-sm">
                  <p className="text-xs uppercase tracking-wide text-slate-500">{localizeText("Baseline", { zh: "基线", yue: "基線", fr: "Reference" })}</p>
                  <p className="mt-1 text-2xl font-bold text-slate-900">{item.baselineAverage.toFixed(1)}</p>
                </div>
                <div className="text-xl text-slate-400">→</div>
                <div className="min-w-[120px] rounded-xl bg-white p-3 shadow-sm">
                  <p className="text-xs uppercase tracking-wide text-slate-500">{localizeText("Latest", { zh: "最新", yue: "最新", fr: "Recent" })}</p>
                  <p className="mt-1 text-2xl font-bold text-slate-900">{item.latestAverage.toFixed(1)}</p>
                </div>
                <div className="text-xl text-slate-400">→</div>
                <div className="min-w-[200px] rounded-xl bg-white p-3 shadow-sm">
                  <p className="text-xs uppercase tracking-wide text-slate-500">{localizeText("Outcome mix", { zh: "结果构成", yue: "結果構成", fr: "Repartition des resultats" })}</p>
                  <div className="mt-2 flex flex-wrap gap-2 text-xs font-medium">
                    <span className="rounded-full bg-emerald-100 px-2 py-1 text-emerald-700">{localizeText("Improved", { zh: "改善", yue: "改善", fr: "Ameliore" })} {item.improvedCount}</span>
                    <span className="rounded-full bg-slate-200 px-2 py-1 text-slate-700">{localizeText("Stable", { zh: "稳定", yue: "穩定", fr: "Stable" })} {item.stableCount}</span>
                    <span className="rounded-full bg-red-100 px-2 py-1 text-red-700">{localizeText("Deteriorated", { zh: "恶化", yue: "惡化", fr: "Deteriore" })} {item.deterioratedCount}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="rounded-2xl border bg-slate-50 p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-slate-900">
                {localizeText("Priority deterioration watchlist", {
                  zh: "优先恶化观察名单",
                  yue: "優先惡化觀察名單",
                  fr: "Liste prioritaire de deterioration",
                })}
              </p>
              <p className="text-xs text-slate-500">
                {localizeText("Patients with the largest score drops across repeated assessments.", {
                  zh: "重复评估中分数下降幅度最大的患者。",
                  yue: "重複評估中分數下降幅度最大的患者。",
                  fr: "Patients presentant les baisses de score les plus importantes.",
                })}
              </p>
            </div>
          </div>

          {mostConcerningTrajectories.length === 0 ? (
            <p className="mt-4 text-sm text-slate-500">
              {localizeText("No deteriorating repeated-assessment trajectories yet.", {
                zh: "暂无恶化的重复评估轨迹。",
                yue: "暫無惡化的重複評估軌跡。",
                fr: "Aucune trajectoire de deterioration reperee pour le moment.",
              })}
            </p>
          ) : (
            <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {mostConcerningTrajectories.map((trajectory) => {
                const user = users.find((item) => item.id === trajectory.userId)

                return (
                  <div key={`${trajectory.userId}-${trajectory.assessmentType}`} className="rounded-xl bg-white p-4 shadow-sm">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-sm font-semibold text-slate-900">{user?.phone_number ?? trajectory.userId}</p>
                        <p className="text-xs text-slate-500">{trajectory.assessmentType}</p>
                      </div>
                      <span className="rounded-full bg-red-100 px-2 py-1 text-xs font-semibold text-red-700">
                        {formatDelta(trajectory.delta)}
                      </span>
                    </div>

                    <div className="mt-3 text-sm text-slate-600">
                      <p>{localizeText("Baseline", { zh: "基线", yue: "基線", fr: "Reference" })}: {trajectory.baselineScore} {localizeText("on", { zh: "于", yue: "於", fr: "le" })} {new Date(trajectory.baselineDate).toLocaleDateString()}</p>
                      <p>{localizeText("Latest", { zh: "最新", yue: "最新", fr: "Recent" })}: {trajectory.latestScore} {localizeText("on", { zh: "于", yue: "於", fr: "le" })} {new Date(trajectory.latestDate).toLocaleDateString()}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
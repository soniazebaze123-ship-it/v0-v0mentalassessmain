"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"

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
  const mostConcerningTrajectories = trajectories.filter((trajectory) => trajectory.status === "Deteriorated").slice(0, 6)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Research Progress and Deterioration Workflow</CardTitle>
      </CardHeader>
      <CardContent className="space-y-8">
        <ResponsiveContainer width="100%" height={320}>
          <BarChart data={workflowData} margin={{ top: 20, right: 20, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="assessmentType" />
            <YAxis allowDecimals={false} />
            <Tooltip />
            <Legend />
            <Bar dataKey="improvedCount" name="Improved" stackId="status" fill="#22c55e" radius={[4, 4, 0, 0]} />
            <Bar dataKey="stableCount" name="Stable" stackId="status" fill="#94a3b8" />
            <Bar dataKey="deterioratedCount" name="Deteriorated" stackId="status" fill="#ef4444" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>

        <div className="grid gap-4 lg:grid-cols-2">
          {workflowData.map((item) => (
            <div key={item.assessmentType} className="rounded-2xl border bg-slate-50 p-5">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-slate-900">{item.assessmentType} cohort workflow</p>
                  <p className="text-xs text-slate-500">{item.cohortSize} patients with repeated assessments</p>
                </div>
                <div className={`rounded-full px-3 py-1 text-xs font-semibold ${item.avgDelta < 0 ? "bg-red-100 text-red-700" : item.avgDelta > 0 ? "bg-emerald-100 text-emerald-700" : "bg-slate-200 text-slate-700"}`}>
                  Avg delta {formatDelta(item.avgDelta)}
                </div>
              </div>

              <div className="mt-4 flex items-center gap-3 overflow-x-auto">
                <div className="min-w-[120px] rounded-xl bg-white p-3 shadow-sm">
                  <p className="text-xs uppercase tracking-wide text-slate-500">Baseline</p>
                  <p className="mt-1 text-2xl font-bold text-slate-900">{item.baselineAverage.toFixed(1)}</p>
                </div>
                <div className="text-xl text-slate-400">→</div>
                <div className="min-w-[120px] rounded-xl bg-white p-3 shadow-sm">
                  <p className="text-xs uppercase tracking-wide text-slate-500">Latest</p>
                  <p className="mt-1 text-2xl font-bold text-slate-900">{item.latestAverage.toFixed(1)}</p>
                </div>
                <div className="text-xl text-slate-400">→</div>
                <div className="min-w-[200px] rounded-xl bg-white p-3 shadow-sm">
                  <p className="text-xs uppercase tracking-wide text-slate-500">Outcome mix</p>
                  <div className="mt-2 flex flex-wrap gap-2 text-xs font-medium">
                    <span className="rounded-full bg-emerald-100 px-2 py-1 text-emerald-700">Improved {item.improvedCount}</span>
                    <span className="rounded-full bg-slate-200 px-2 py-1 text-slate-700">Stable {item.stableCount}</span>
                    <span className="rounded-full bg-red-100 px-2 py-1 text-red-700">Deteriorated {item.deterioratedCount}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="rounded-2xl border bg-slate-50 p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-slate-900">Priority deterioration watchlist</p>
              <p className="text-xs text-slate-500">Patients with the largest score drops across repeated assessments.</p>
            </div>
          </div>

          {mostConcerningTrajectories.length === 0 ? (
            <p className="mt-4 text-sm text-slate-500">No deteriorating repeated-assessment trajectories yet.</p>
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
                      <p>Baseline: {trajectory.baselineScore} on {new Date(trajectory.baselineDate).toLocaleDateString()}</p>
                      <p>Latest: {trajectory.latestScore} on {new Date(trajectory.latestDate).toLocaleDateString()}</p>
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
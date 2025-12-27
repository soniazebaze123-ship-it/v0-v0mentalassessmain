"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"
import { useLanguage } from "@/contexts/language-context"
import type { AverageScores } from "@/lib/admin-data-utils"

interface AverageScoreChartProps {
  data: AverageScores
}

export function AverageScoreChart({ data }: AverageScoreChartProps) {
  const { t } = useLanguage()

  const chartData = [
    {
      name: t("dashboard.moca"),
      score: data.moca,
      max: 30,
    },
    {
      name: t("dashboard.mmse"),
      score: data.mmse,
      max: 30,
    },
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("admin.avg_scores_title")}</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis domain={[0, 30]} />
            <Tooltip />
            <Legend />
            <Bar dataKey="score" name={t("common.score")} fill="#3b82f6" />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}

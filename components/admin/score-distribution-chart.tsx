"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts"
import { useLanguage } from "@/contexts/language-context"
import type { ScoreDistributionData } from "@/lib/admin-data-utils"

interface ScoreDistributionChartProps {
  mocaData: ScoreDistributionData[]
  mmseData: ScoreDistributionData[]
}

export function ScoreDistributionChart({ mocaData, mmseData }: ScoreDistributionChartProps) {
  const { t } = useLanguage()

  return (
    <div className="grid lg:grid-cols-2 gap-8">
      {/* MOCA Distribution */}
      <Card>
        <CardHeader>
          <CardTitle>
            {t("dashboard.moca")} - {t("admin.score_distribution")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={mocaData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
              <YAxis />
              <Tooltip />
              <Bar dataKey="value" name={t("common.count")} radius={[8, 8, 0, 0]}>
                {mocaData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* MMSE Distribution */}
      <Card>
        <CardHeader>
          <CardTitle>
            {t("dashboard.mmse")} - {t("admin.score_distribution")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={mmseData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
              <YAxis />
              <Tooltip />
              <Bar dataKey="value" name={t("common.count")} radius={[8, 8, 0, 0]}>
                {mmseData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  )
}

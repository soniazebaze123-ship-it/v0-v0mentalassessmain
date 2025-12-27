"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"
import { useLanguage } from "@/contexts/language-context"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { TrendData } from "@/lib/admin-data-utils"

interface ProgressTrendChartProps {
  data: TrendData[]
  users: { id: string; phone_number: string }[]
  selectedUserId: string | null
  onSelectUser: (userId: string | null) => void
  selectedAssessmentType: "MOCA" | "MMSE" | "ALL"
  onSelectAssessmentType: (type: "MOCA" | "MMSE" | "ALL") => void
}

export function ProgressTrendChart({
  data,
  users,
  selectedUserId,
  onSelectUser,
  selectedAssessmentType,
  onSelectAssessmentType,
}: ProgressTrendChartProps) {
  const { t } = useLanguage()

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("admin.progress_trend_title")}</CardTitle>
        <div className="flex flex-col sm:flex-row gap-4 mt-4">
          <Select onValueChange={onSelectUser} value={selectedUserId || "all"}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder={t("admin.select_user_filter")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("admin.all_users")}</SelectItem>
              {users.map((user) => (
                <SelectItem key={user.id} value={user.id}>
                  {user.phone_number}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select onValueChange={onSelectAssessmentType} value={selectedAssessmentType}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder={t("admin.select_assessment_type")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">{t("admin.all_assessments")}</SelectItem>
              <SelectItem value="MOCA">{t("dashboard.moca")}</SelectItem>
              <SelectItem value="MMSE">{t("dashboard.mmse")}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={350}>
          <LineChart
            data={data}
            margin={{
              top: 5,
              right: 30,
              left: 20,
              bottom: 5,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis domain={[0, 30]} />
            <Tooltip />
            <Legend />
            {selectedAssessmentType === "ALL" && !selectedUserId ? (
              <>
                <Line type="monotone" dataKey="score" stroke="#8884d8" name={t("common.score")} />
              </>
            ) : (
              <Line type="monotone" dataKey="score" stroke="#82ca9d" name={t("common.score")} />
            )}
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}

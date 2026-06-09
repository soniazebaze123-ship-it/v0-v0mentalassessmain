import React, { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"

export function AuditTrail({ userId }: { userId: string | null }) {
  const [entries, setEntries] = useState<any[]>([])

  useEffect(() => {
    if (!userId) return
    const load = async () => {
      try {
        const { data: notes } = await supabase.from("admin_notes").select("section, note, updated_at").eq("user_id", userId).order("updated_at", { ascending: false }).limit(10)
        const { data: progress } = await supabase.from("user_progress").select("assessment_type, current_step, last_updated, updated_at").eq("user_id", userId).order("updated_at", { ascending: false }).limit(10)
        const combined: any[] = []
        if (notes) combined.push(...notes.map((n: any) => ({ type: "note", ...n })))
        if (progress) combined.push(...progress.map((p: any) => ({ type: "progress", ...p })))
        combined.sort((a, b) => new Date(b.updated_at || b.last_updated).getTime() - new Date(a.updated_at || a.last_updated).getTime())
        setEntries(combined.slice(0, 20))
      } catch (err) {
        console.warn("AuditTrail load failed", err)
      }
    }
    load()
  }, [userId])

  if (!userId) return null

  return (
    <div className="border rounded-lg p-3 bg-white">
      <h4 className="font-semibold mb-2">Recent activity</h4>
      <div className="space-y-2 text-sm text-slate-700">
        {entries.length === 0 && <div className="text-xs text-slate-500">No recent activity</div>}
        {entries.map((e, i) => (
          <div key={i} className="flex justify-between items-start">
            <div>
              <div className="font-medium">{e.type === "note" ? `Remark (${e.section})` : `Progress (${e.assessment_type})`}</div>
              <div className="text-xs text-slate-500">{e.note || (e.current_step != null ? `Step ${e.current_step}` : "")}</div>
            </div>
            <div className="text-xs text-slate-400">{new Date(e.updated_at || e.last_updated).toLocaleString()}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default AuditTrail

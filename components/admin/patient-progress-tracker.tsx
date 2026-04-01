"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { createClient } from "@/lib/supabase/client"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"
import { ArrowLeft } from "lucide-react"

interface PatientProgressTrackerProps {
  onBack: () => void
}

interface Patient {
  id: string
  name: string
  phone_number: string
  date_of_birth: string
  gender: string
}

interface AssessmentHistory {
  date: string
  moca?: number
  mmse?: number
  visual?: number
  auditory?: number
  olfactory?: number
  composite_risk?: number
}

export function PatientProgressTracker({ onBack }: PatientProgressTrackerProps) {
  const [patients, setPatients] = useState<Patient[]>([])
  const [selectedPatientId, setSelectedPatientId] = useState<string>("")
  const [history, setHistory] = useState<AssessmentHistory[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    loadPatients()
  }, [])

  useEffect(() => {
    if (selectedPatientId) {
      loadPatientHistory(selectedPatientId)
    }
  }, [selectedPatientId])

  const loadPatients = async () => {
    const supabase = createClient()
    const { data } = await supabase.from("users").select("id, name, phone_number, date_of_birth, gender").order("name")

    if (data) {
      setPatients(data)
    }
  }

  const loadPatientHistory = async (patientId: string) => {
    setLoading(true)
    const supabase = createClient()

    try {
      // Get cognitive assessments
      const { data: cognitiveData } = await supabase
        .from("assessments")
        .select("type, score, test_date")
        .eq("user_id", patientId)
        .order("test_date")

      // Get sensory assessments
      const { data: sensoryData } = await supabase
        .from("sensory_assessments")
        .select("test_type, normalized_score, test_date")
        .eq("user_id", patientId)
        .order("test_date")

      // Get composite risk scores
      const { data: riskData } = await supabase
        .from("composite_risk_scores")
        .select("composite_risk_score, calculated_at")
        .eq("user_id", patientId)
        .order("calculated_at")

      // Organize data by date
      const historyMap = new Map<string, AssessmentHistory>()

      cognitiveData?.forEach((item) => {
        const date = item.test_date || new Date().toISOString().split("T")[0]
        if (!historyMap.has(date)) {
          historyMap.set(date, { date })
        }
        const entry = historyMap.get(date)!
        if (item.type === "MOCA") entry.moca = item.score
        if (item.type === "MMSE") entry.mmse = item.score
      })

      sensoryData?.forEach((item) => {
        const date = item.test_date || new Date().toISOString().split("T")[0]
        if (!historyMap.has(date)) {
          historyMap.set(date, { date })
        }
        const entry = historyMap.get(date)!
        if (item.test_type === "visual") entry.visual = Math.round(item.normalized_score || 0)
        if (item.test_type === "auditory") entry.auditory = Math.round(item.normalized_score || 0)
        if (item.test_type === "olfactory") entry.olfactory = Math.round(item.normalized_score || 0)
      })

      riskData?.forEach((item) => {
        const date = item.calculated_at?.split("T")[0] || new Date().toISOString().split("T")[0]
        if (!historyMap.has(date)) {
          historyMap.set(date, { date })
        }
        const entry = historyMap.get(date)!
        entry.composite_risk = Math.round(item.composite_risk_score || 0)
      })

      const sortedHistory = Array.from(historyMap.values()).sort((a, b) => a.date.localeCompare(b.date))
      setHistory(sortedHistory)
    } catch (error) {
      // Error loading patient history - silently continue
    } finally {
      setLoading(false)
    }
  }

  const selectedPatient = patients.find((p) => p.id === selectedPatientId)

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Admin Panel
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Patient Progress Tracker</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-medium">Select Patient</label>
            <Select value={selectedPatientId} onValueChange={setSelectedPatientId}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a patient..." />
              </SelectTrigger>
              <SelectContent>
                {patients.map((patient) => (
                  <SelectItem key={patient.id} value={patient.id}>
                    {patient.name} ({patient.phone_number})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedPatient && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold mb-2">Patient Information</h3>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-gray-600">Name:</span> {selectedPatient.name}
                </div>
                <div>
                  <span className="text-gray-600">Phone:</span> {selectedPatient.phone_number}
                </div>
                <div>
                  <span className="text-gray-600">Date of Birth:</span> {selectedPatient.date_of_birth || "N/A"}
                </div>
                <div>
                  <span className="text-gray-600">Gender:</span> {selectedPatient.gender || "N/A"}
                </div>
              </div>
            </div>
          )}

          {loading && <p className="text-center text-gray-500">Loading history...</p>}

          {!loading && history.length > 0 && (
            <div className="space-y-6">
              <div>
                <h3 className="font-semibold mb-4">Cognitive Assessment Trends</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={history}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis domain={[0, 30]} />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="moca" stroke="#3b82f6" name="MoCA" />
                    <Line type="monotone" dataKey="mmse" stroke="#8b5cf6" name="MMSE" />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <div>
                <h3 className="font-semibold mb-4">Sensory Assessment Trends</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={history}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis domain={[0, 100]} />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="visual" stroke="#6366f1" name="Visual" />
                    <Line type="monotone" dataKey="auditory" stroke="#ec4899" name="Auditory" />
                    <Line type="monotone" dataKey="olfactory" stroke="#f59e0b" name="Olfactory" />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <div>
                <h3 className="font-semibold mb-4">Composite Risk Score Trend</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={history}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis domain={[0, 100]} />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="composite_risk" stroke="#ef4444" name="Risk Score" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {!loading && selectedPatientId && history.length === 0 && (
            <p className="text-center text-gray-500">No assessment history found for this patient.</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

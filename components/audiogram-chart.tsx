"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { AudiogramData } from "@/lib/auditory-screening-utils"
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
  ReferenceArea,
} from "recharts"

interface AudiogramChartProps {
  data: AudiogramData
  showTitle?: boolean
}

export function AudiogramChart({ data, showTitle = true }: AudiogramChartProps) {
  // Transform data for Recharts scatter plot
  const leftEarData = data.leftEar.map((point) => ({
    frequency: point.frequency,
    threshold: Math.round(point.threshold),
    ear: "Left",
  }))

  const rightEarData = data.rightEar.map((point) => ({
    frequency: point.frequency,
    threshold: Math.round(point.threshold),
    ear: "Right",
  }))

  // Custom X-axis tick formatter for audiogram frequencies
  const formatFrequency = (value: number) => {
    if (value >= 1000) return `${value / 1000}k`
    return String(value)
  }

  // Custom tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const d = payload[0].payload
      return (
        <div className="bg-background border rounded-lg px-3 py-2 shadow-md text-sm">
          <p className="font-semibold">{d.ear} Ear</p>
          <p>Frequency: {d.frequency} Hz</p>
          <p>Threshold: {d.threshold} dB HL</p>
        </div>
      )
    }
    return null
  }

  // Custom shape for left ear (X marker)
  const LeftEarMarker = (props: any) => {
    const { cx, cy } = props
    if (!cx || !cy) return null
    const s = 7
    return (
      <g>
        <line x1={cx - s} y1={cy - s} x2={cx + s} y2={cy + s} stroke="#2563eb" strokeWidth="2.5" />
        <line x1={cx + s} y1={cy - s} x2={cx - s} y2={cy + s} stroke="#2563eb" strokeWidth="2.5" />
      </g>
    )
  }

  // Custom shape for right ear (O marker)
  const RightEarMarker = (props: any) => {
    const { cx, cy } = props
    if (!cx || !cy) return null
    return <circle cx={cx} cy={cy} r={7} fill="none" stroke="#dc2626" strokeWidth="2.5" />
  }

  return (
    <Card className="w-full">
      {showTitle && (
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Audiogram Results</CardTitle>
          <div className="flex flex-wrap items-center gap-4 text-sm">
            <div className="flex items-center gap-1.5">
              <span className="text-blue-600 font-bold text-base">X</span>
              <span>Left Ear</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3.5 h-3.5 rounded-full border-2 border-red-600 inline-block"></span>
              <span>Right Ear</span>
            </div>
            <div className="ml-auto text-xs">
              <span className="font-semibold">SRT: {data.srt} dB SNR</span>
              <span className={`ml-2 px-2 py-0.5 rounded-full text-xs font-medium ${
                data.classification === "normal"
                  ? "bg-green-100 text-green-800"
                  : data.classification === "impaired"
                    ? "bg-yellow-100 text-yellow-800"
                    : "bg-red-100 text-red-800"
              }`}>
                {data.classification}
              </span>
            </div>
          </div>
        </CardHeader>
      )}
      <CardContent>
        <div className="w-full" style={{ height: 380 }}>
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart margin={{ top: 10, right: 20, bottom: 30, left: 20 }}>
              {/* Hearing loss zone backgrounds */}
              <ReferenceArea y1={0} y2={25} fill="#ccfbf1" fillOpacity={0.5} />
              <ReferenceArea y1={25} y2={40} fill="#fef9c3" fillOpacity={0.5} />
              <ReferenceArea y1={40} y2={55} fill="#ffedd5" fillOpacity={0.5} />
              <ReferenceArea y1={55} y2={70} fill="#fed7aa" fillOpacity={0.5} />
              <ReferenceArea y1={70} y2={90} fill="#fee2e2" fillOpacity={0.5} />
              <ReferenceArea y1={90} y2={120} fill="#fecaca" fillOpacity={0.5} />

              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />

              <XAxis
                dataKey="frequency"
                type="number"
                scale="log"
                domain={[200, 10000]}
                ticks={[250, 500, 1000, 2000, 4000, 8000]}
                tickFormatter={formatFrequency}
                label={{ value: "Frequency (Hz)", position: "bottom", offset: 10, fontSize: 13 }}
                stroke="#6b7280"
                fontSize={11}
              />

              <YAxis
                dataKey="threshold"
                type="number"
                domain={[-10, 120]}
                reversed={true}
                ticks={[0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100, 110, 120]}
                label={{ value: "Hearing Level (dB HL)", angle: -90, position: "insideLeft", offset: -5, fontSize: 13 }}
                stroke="#6b7280"
                fontSize={11}
              />

              {/* Reference lines for classification boundaries */}
              <ReferenceLine y={25} stroke="#15803d" strokeDasharray="5 5" strokeWidth={1.5} />
              <ReferenceLine y={40} stroke="#a16207" strokeDasharray="5 5" strokeWidth={1.5} />
              <ReferenceLine y={70} stroke="#dc2626" strokeDasharray="5 5" strokeWidth={1.5} />

              <Tooltip content={<CustomTooltip />} />

              <Scatter
                name="Left Ear"
                data={leftEarData}
                shape={<LeftEarMarker />}
                line={{ stroke: "#2563eb", strokeWidth: 2 }}
              />
              <Scatter
                name="Right Ear"
                data={rightEarData}
                shape={<RightEarMarker />}
                line={{ stroke: "#dc2626", strokeWidth: 2 }}
              />
            </ScatterChart>
          </ResponsiveContainer>
        </div>

        {/* Hearing loss zone legend */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-1.5 mt-3 text-xs">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-sm border border-gray-300" style={{ backgroundColor: "#ccfbf1" }}></div>
            <span>Normal (0-25 dB)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-sm border border-gray-300" style={{ backgroundColor: "#fef9c3" }}></div>
            <span>Mild (26-40 dB)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-sm border border-gray-300" style={{ backgroundColor: "#ffedd5" }}></div>
            <span>Moderate (41-55 dB)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-sm border border-gray-300" style={{ backgroundColor: "#fed7aa" }}></div>
            <span>Mod-Severe (56-70 dB)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-sm border border-gray-300" style={{ backgroundColor: "#fee2e2" }}></div>
            <span>Severe (71-90 dB)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-sm border border-gray-300" style={{ backgroundColor: "#fecaca" }}></div>
            <span>Profound (90+ dB)</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

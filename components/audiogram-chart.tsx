"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { AudiogramData } from "@/lib/auditory-screening-utils"

interface AudiogramChartProps {
  data: AudiogramData
  showTitle?: boolean
}

export function AudiogramChart({ data, showTitle = true }: AudiogramChartProps) {
  const frequencies = [125, 250, 500, 1000, 2000, 4000, 8000]
  const thresholds = [0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100, 110, 120]

  // Hearing loss categories with SVG-compatible fill colors
  const categories = [
    { name: "Normal Hearing", start: 0, end: 25, fill: "#ccfbf1", legendColor: "bg-teal-100" },
    { name: "Mild Hearing Loss", start: 25, end: 40, fill: "#fef9c3", legendColor: "bg-yellow-100" },
    { name: "Moderate Hearing Loss", start: 40, end: 55, fill: "#ffedd5", legendColor: "bg-orange-100" },
    { name: "Moderately-Severe", start: 55, end: 70, fill: "#fed7aa", legendColor: "bg-orange-200" },
    { name: "Severe Hearing Loss", start: 70, end: 90, fill: "#fee2e2", legendColor: "bg-red-100" },
    { name: "Profound Hearing Loss", start: 90, end: 120, fill: "#fecaca", legendColor: "bg-red-200" },
  ]

  const getYPosition = (threshold: number) => {
    const chartHeight = 400
    return (threshold / 120) * chartHeight
  }

  const getXPosition = (freqIndex: number) => {
    const chartWidth = 600
    const padding = 60
    return padding + (freqIndex / (frequencies.length - 1)) * (chartWidth - 2 * padding)
  }

  return (
    <Card className="w-full">
      {showTitle && (
        <CardHeader>
          <CardTitle>Audiogram Results</CardTitle>
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-2">
              <span className="text-blue-600 font-bold text-lg">X</span>
              <span>Left Ear</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-4 h-4 rounded-full border-2 border-red-600 inline-block"></span>
              <span>Right Ear</span>
            </div>
            <div className="ml-auto">
              <span className="font-semibold">SRT: {data.srt} dB SNR</span>
              <span className="ml-2 text-muted-foreground">({data.classification})</span>
            </div>
          </div>
        </CardHeader>
      )}
      <CardContent>
        <div className="relative w-full" style={{ height: "450px" }}>
          <svg viewBox="0 0 700 450" className="w-full h-full">
            {/* Background zones */}
            {categories.map((cat, idx) => (
              <rect
                key={idx}
                x="60"
                y={getYPosition(cat.start)}
                width="580"
                height={getYPosition(cat.end) - getYPosition(cat.start)}
                fill={cat.fill}
                opacity="0.5"
              />
            ))}

            {/* Grid lines */}
            {thresholds.map((threshold, idx) => (
              <g key={`threshold-${idx}`}>
                <line
                  x1="60"
                  y1={getYPosition(threshold)}
                  x2="640"
                  y2={getYPosition(threshold)}
                  stroke="#ccc"
                  strokeWidth="1"
                />
                <text x="45" y={getYPosition(threshold) + 5} fontSize="12" textAnchor="end" fill="#666">
                  {threshold}
                </text>
              </g>
            ))}

            {frequencies.map((freq, idx) => (
              <g key={`freq-${idx}`}>
                <line
                  x1={getXPosition(idx)}
                  y1="0"
                  x2={getXPosition(idx)}
                  y2="400"
                  stroke="#ccc"
                  strokeWidth="1"
                  strokeDasharray="4"
                />
                <text x={getXPosition(idx)} y="420" fontSize="12" textAnchor="middle" fill="#666">
                  {freq}
                </text>
              </g>
            ))}

            {/* Y-axis label */}
            <text
              x="15"
              y="200"
              fontSize="14"
              textAnchor="middle"
              fill="#333"
              transform="rotate(-90 15 200)"
              fontWeight="600"
            >
              Hearing Level (dB HL)
            </text>

            {/* X-axis label */}
            <text x="350" y="445" fontSize="14" textAnchor="middle" fill="#333" fontWeight="600">
              Frequency (Hz)
            </text>

            {/* Left ear line (blue, X markers - standard audiogram) */}
            <polyline
              points={data.leftEar
                .map((point, idx) => `${getXPosition(idx)},${getYPosition(point.threshold)}`)
                .join(" ")}
              fill="none"
              stroke="#2563eb"
              strokeWidth="2.5"
            />

            {/* Left ear X markers */}
            {data.leftEar.map((point, idx) => {
              const cx = getXPosition(idx)
              const cy = getYPosition(point.threshold)
              const s = 6
              return (
                <g key={`left-${idx}`}>
                  <line x1={cx - s} y1={cy - s} x2={cx + s} y2={cy + s} stroke="#2563eb" strokeWidth="2.5" />
                  <line x1={cx + s} y1={cy - s} x2={cx - s} y2={cy + s} stroke="#2563eb" strokeWidth="2.5" />
                  <text x={cx} y={cy - 10} fontSize="9" textAnchor="middle" fill="#2563eb">
                    {Math.round(point.threshold)}
                  </text>
                </g>
              )
            })}

            {/* Right ear line (red, O markers - standard audiogram) */}
            <polyline
              points={data.rightEar
                .map((point, idx) => `${getXPosition(idx)},${getYPosition(point.threshold)}`)
                .join(" ")}
              fill="none"
              stroke="#dc2626"
              strokeWidth="2.5"
            />

            {/* Right ear O markers */}
            {data.rightEar.map((point, idx) => {
              const cx = getXPosition(idx)
              const cy = getYPosition(point.threshold)
              return (
                <g key={`right-${idx}`}>
                  <circle cx={cx} cy={cy} r="6" fill="none" stroke="#dc2626" strokeWidth="2.5" />
                  <text x={cx} y={cy + 18} fontSize="9" textAnchor="middle" fill="#dc2626">
                    {Math.round(point.threshold)}
                  </text>
                </g>
              )
            })}
          </svg>

          {/* Legend for hearing loss categories */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-4 text-xs">
            {categories.map((cat, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <div className={`w-4 h-4 ${cat.legendColor} border border-gray-300`}></div>
                <span>{cat.name}</span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

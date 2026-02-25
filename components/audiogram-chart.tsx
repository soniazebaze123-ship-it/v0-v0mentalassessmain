"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { AudiogramData } from "@/lib/auditory-screening-utils"

interface AudiogramChartProps {
  data: AudiogramData
  showTitle?: boolean
}

const FREQ_LABELS = ["250", "500", "1k", "2k", "4k", "8k"]
const FREQ_VALUES = [250, 500, 1000, 2000, 4000, 8000]
const DB_TICKS = [-10, 0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100, 110, 120]

// Hearing loss zones
const ZONES = [
  { label: "Normal", y1: -10, y2: 25, color: "#ccfbf1" },
  { label: "Mild", y1: 25, y2: 40, color: "#fef9c3" },
  { label: "Moderate", y1: 40, y2: 55, color: "#ffedd5" },
  { label: "Mod-Severe", y1: 55, y2: 70, color: "#fed7aa" },
  { label: "Severe", y1: 70, y2: 90, color: "#fee2e2" },
  { label: "Profound", y1: 90, y2: 120, color: "#fecaca" },
]

export function AudiogramChart({ data, showTitle = true }: AudiogramChartProps) {
  // Chart dimensions
  const W = 600
  const H = 400
  const PAD = { top: 30, right: 30, bottom: 50, left: 60 }
  const plotW = W - PAD.left - PAD.right
  const plotH = H - PAD.top - PAD.bottom

  // Map frequency index (0-5) to X position
  const xPos = (idx: number) => PAD.left + (idx / (FREQ_VALUES.length - 1)) * plotW

  // Map dB HL to Y position (inverted: -10 at top, 120 at bottom)
  const yPos = (db: number) => {
    const ratio = (db - (-10)) / (120 - (-10))
    return PAD.top + ratio * plotH
  }

  // Build polyline strings
  const leftPoints = data.leftEar.map((p, i) => `${xPos(i)},${yPos(p.threshold)}`).join(" ")
  const rightPoints = data.rightEar.map((p, i) => `${xPos(i)},${yPos(p.threshold)}`).join(" ")

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
              <span
                className={`ml-2 px-2 py-0.5 rounded-full text-xs font-medium ${
                  data.classification === "normal"
                    ? "bg-green-100 text-green-800"
                    : data.classification === "impaired"
                      ? "bg-yellow-100 text-yellow-800"
                      : "bg-red-100 text-red-800"
                }`}
              >
                {data.classification}
              </span>
            </div>
          </div>
        </CardHeader>
      )}
      <CardContent>
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="w-full"
          style={{ maxHeight: 420 }}
          role="img"
          aria-label="Audiogram showing hearing thresholds for left and right ears"
        >
          {/* Hearing loss zone backgrounds */}
          {ZONES.map((z) => (
            <rect
              key={z.label}
              x={PAD.left}
              y={yPos(z.y1)}
              width={plotW}
              height={yPos(z.y2) - yPos(z.y1)}
              fill={z.color}
              opacity="0.5"
            />
          ))}

          {/* Grid lines - horizontal */}
          {DB_TICKS.map((db) => (
            <g key={`h-${db}`}>
              <line
                x1={PAD.left}
                y1={yPos(db)}
                x2={PAD.left + plotW}
                y2={yPos(db)}
                stroke="#d1d5db"
                strokeWidth="0.5"
                strokeDasharray={db % 20 === 0 ? "0" : "4 4"}
              />
              <text x={PAD.left - 8} y={yPos(db) + 4} textAnchor="end" fontSize="10" fill="#6b7280">
                {db}
              </text>
            </g>
          ))}

          {/* Grid lines - vertical */}
          {FREQ_VALUES.map((_, i) => (
            <g key={`v-${i}`}>
              <line
                x1={xPos(i)}
                y1={PAD.top}
                x2={xPos(i)}
                y2={PAD.top + plotH}
                stroke="#d1d5db"
                strokeWidth="0.5"
                strokeDasharray="4 4"
              />
              <text
                x={xPos(i)}
                y={PAD.top + plotH + 18}
                textAnchor="middle"
                fontSize="11"
                fill="#6b7280"
              >
                {FREQ_LABELS[i]}
              </text>
            </g>
          ))}

          {/* Axis labels */}
          <text x={W / 2} y={H - 5} textAnchor="middle" fontSize="12" fill="#374151" fontWeight="500">
            Frequency (Hz)
          </text>
          <text
            x={15}
            y={H / 2}
            textAnchor="middle"
            fontSize="12"
            fill="#374151"
            fontWeight="500"
            transform={`rotate(-90, 15, ${H / 2})`}
          >
            Hearing Level (dB HL)
          </text>

          {/* Classification boundary labels */}
          <text x={PAD.left + plotW + 2} y={yPos(25) + 4} fontSize="8" fill="#15803d" fontWeight="500">
            25
          </text>
          <text x={PAD.left + plotW + 2} y={yPos(40) + 4} fontSize="8" fill="#a16207" fontWeight="500">
            40
          </text>
          <text x={PAD.left + plotW + 2} y={yPos(70) + 4} fontSize="8" fill="#dc2626" fontWeight="500">
            70
          </text>

          {/* Left ear line (blue) */}
          <polyline points={leftPoints} fill="none" stroke="#2563eb" strokeWidth="2" />

          {/* Left ear X markers */}
          {data.leftEar.map((p, i) => {
            const cx = xPos(i)
            const cy = yPos(p.threshold)
            const s = 6
            return (
              <g key={`l-${i}`}>
                <line x1={cx - s} y1={cy - s} x2={cx + s} y2={cy + s} stroke="#2563eb" strokeWidth="2.5" />
                <line x1={cx + s} y1={cy - s} x2={cx - s} y2={cy + s} stroke="#2563eb" strokeWidth="2.5" />
                <text x={cx} y={cy - 10} fontSize="9" textAnchor="middle" fill="#2563eb" fontWeight="600">
                  {Math.round(p.threshold)}
                </text>
              </g>
            )
          })}

          {/* Right ear line (red) */}
          <polyline points={rightPoints} fill="none" stroke="#dc2626" strokeWidth="2" />

          {/* Right ear O markers */}
          {data.rightEar.map((p, i) => {
            const cx = xPos(i)
            const cy = yPos(p.threshold)
            return (
              <g key={`r-${i}`}>
                <circle cx={cx} cy={cy} r="6" fill="none" stroke="#dc2626" strokeWidth="2.5" />
                <text x={cx} y={cy + 18} fontSize="9" textAnchor="middle" fill="#dc2626" fontWeight="600">
                  {Math.round(p.threshold)}
                </text>
              </g>
            )
          })}

          {/* Plot border */}
          <rect
            x={PAD.left}
            y={PAD.top}
            width={plotW}
            height={plotH}
            fill="none"
            stroke="#9ca3af"
            strokeWidth="1"
          />
        </svg>

        {/* Hearing loss zone legend */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-1.5 mt-3 text-xs">
          {ZONES.map((z) => (
            <div key={z.label} className="flex items-center gap-1.5">
              <div
                className="w-3 h-3 rounded-sm border border-gray-300"
                style={{ backgroundColor: z.color }}
              ></div>
              <span>
                {z.label} ({z.y1 < 0 ? `${z.y1}` : z.y1}-{z.y2} dB)
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

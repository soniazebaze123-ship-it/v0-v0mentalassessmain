"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { AudiogramData } from "@/lib/auditory-screening-utils"

interface AudiogramChartProps {
  data: AudiogramData
  showTitle?: boolean
}

const FREQ_LABELS = ["250", "500", "1k", "2k", "4k", "8k"]

// Hearing loss zone info for legend
const ZONES = [
  { label: "Normal", range: "-10-25 dB", bgClass: "bg-teal-100" },
  { label: "Mild", range: "25-40 dB", bgClass: "bg-yellow-100" },
  { label: "Moderate", range: "40-55 dB", bgClass: "bg-orange-100" },
  { label: "Mod-Severe", range: "55-70 dB", bgClass: "bg-orange-200" },
  { label: "Severe", range: "70-90 dB", bgClass: "bg-red-100" },
  { label: "Profound", range: "90+ dB", bgClass: "bg-red-200" },
]

export function AudiogramChart({ data, showTitle = true }: AudiogramChartProps) {
  // Get classification color class
  const classificationClass = 
    data.classification === "normal" 
      ? "bg-green-100 text-green-800" 
      : data.classification === "impaired" 
        ? "bg-yellow-100 text-yellow-800" 
        : "bg-red-100 text-red-800"

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
              <span className={`ml-2 px-2 py-0.5 rounded-full text-xs font-medium ${classificationClass}`}>
                {data.classification}
              </span>
            </div>
          </div>
        </CardHeader>
      )}
      <CardContent>
        {/* Audiogram Table Display */}
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="bg-muted">
                <th className="border p-2 text-left">Frequency</th>
                {FREQ_LABELS.map((label, i) => (
                  <th key={i} className="border p-2 text-center font-medium">{label} Hz</th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border p-2 font-medium">
                  <span className="flex items-center gap-1.5">
                    <span className="text-blue-600 font-bold">X</span> Left Ear (dB)
                  </span>
                </td>
                {data.leftEar.map((point, i) => {
                  const threshold = Math.round(point.threshold)
                  const bgColor = getThresholdColor(threshold)
                  return (
                    <td key={i} className={`border p-2 text-center font-semibold ${bgColor}`}>
                      {threshold}
                    </td>
                  )
                })}
              </tr>
              <tr>
                <td className="border p-2 font-medium">
                  <span className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-full border-2 border-red-600 inline-block"></span> Right Ear (dB)
                  </span>
                </td>
                {data.rightEar.map((point, i) => {
                  const threshold = Math.round(point.threshold)
                  const bgColor = getThresholdColor(threshold)
                  return (
                    <td key={i} className={`border p-2 text-center font-semibold ${bgColor}`}>
                      {threshold}
                    </td>
                  )
                })}
              </tr>
            </tbody>
          </table>
        </div>

        {/* Test Statistics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
          <div className="bg-muted p-3 rounded-lg text-center">
            <p className="text-xs text-muted-foreground">SRT</p>
            <p className="text-lg font-bold">{data.srt} dB</p>
          </div>
          <div className="bg-muted p-3 rounded-lg text-center">
            <p className="text-xs text-muted-foreground">Correct</p>
            <p className="text-lg font-bold">{data.correctTrials}/{data.totalTrials}</p>
          </div>
          <div className="bg-muted p-3 rounded-lg text-center">
            <p className="text-xs text-muted-foreground">Accuracy</p>
            <p className="text-lg font-bold">{data.percentCorrect}%</p>
          </div>
          <div className={`p-3 rounded-lg text-center ${classificationClass}`}>
            <p className="text-xs opacity-80">Classification</p>
            <p className="text-lg font-bold capitalize">{data.classification}</p>
          </div>
        </div>

        {/* Hearing loss zone legend */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-1.5 mt-4 text-xs">
          {ZONES.map((z) => (
            <div key={z.label} className="flex items-center gap-1.5">
              <div className={`w-3 h-3 rounded-sm border border-gray-300 ${z.bgClass}`}></div>
              <span>{z.label} ({z.range})</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

// Helper function to get background color based on threshold
function getThresholdColor(threshold: number): string {
  if (threshold <= 25) return "bg-teal-100"
  if (threshold <= 40) return "bg-yellow-100"
  if (threshold <= 55) return "bg-orange-100"
  if (threshold <= 70) return "bg-orange-200"
  if (threshold <= 90) return "bg-red-100"
  return "bg-red-200"
}

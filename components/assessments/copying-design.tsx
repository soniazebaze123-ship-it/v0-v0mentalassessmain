"use client"

import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { InstructionAudio } from "@/components/ui/instruction-audio"
import { useLanguage } from "@/contexts/language-context"

interface CopyingDesignProps {
  onComplete: (score: number) => void
  onSkip?: () => void
}

export function CopyingDesign({ onComplete, onSkip }: CopyingDesignProps) {
  const { t, localizeText } = useLanguage()
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const isDrawingRef = useRef(false)
  const lastPointRef = useRef<{ x: number; y: number } | null>(null)
  const [hasDrawn, setHasDrawn] = useState(false)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) {
      return
    }

    const context = canvas.getContext("2d")
    if (!context) {
      return
    }

    context.lineCap = "round"
    context.lineJoin = "round"
    context.lineWidth = 3
    context.strokeStyle = "#111827"
  }, [])

  const getPoint = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) {
      return null
    }

    const rect = canvas.getBoundingClientRect()
    return {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    }
  }

  const handlePointerDown = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    const point = getPoint(event)

    if (!canvas || !point) {
      return
    }

    const context = canvas.getContext("2d")
    if (!context) {
      return
    }

    canvas.setPointerCapture(event.pointerId)
    isDrawingRef.current = true
    lastPointRef.current = point
    context.beginPath()
    context.moveTo(point.x, point.y)
    context.lineTo(point.x, point.y)
    context.stroke()
    setHasDrawn(true)
  }

  const handlePointerMove = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current) {
      return
    }

    const canvas = canvasRef.current
    const point = getPoint(event)

    if (!canvas || !point) {
      return
    }

    const context = canvas.getContext("2d")
    if (!context) {
      return
    }

    const lastPoint = lastPointRef.current ?? point
    context.beginPath()
    context.moveTo(lastPoint.x, lastPoint.y)
    context.lineTo(point.x, point.y)
    context.stroke()
    lastPointRef.current = point
  }

  const stopDrawing = () => {
    isDrawingRef.current = false
    lastPointRef.current = null
  }

  const clearDrawing = () => {
    const canvas = canvasRef.current
    if (!canvas) {
      return
    }

    const context = canvas.getContext("2d")
    if (!context) {
      return
    }

    context.clearRect(0, 0, canvas.width, canvas.height)
    setHasDrawn(false)
  }

  const handleSubmit = () => {
    onComplete(hasDrawn ? 1 : 0)
  }

  const handleSkip = () => {
    if (onSkip) {
      onSkip()
    } else {
      onComplete(0)
    }
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>{t("mmse.copying")}</CardTitle>
        <p className="text-sm text-gray-600">{t("mmse.copying.instruction")}</p>
        <InstructionAudio instructionKey="mmse.copying.instruction" className="mt-2" />
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div className="flex justify-center">
            <div className="relative h-64 w-64 overflow-hidden rounded-lg border bg-gray-100">
              <Image src="/images/pentagon.png" alt="Reference shape" fill className="object-contain" />
            </div>
          </div>

          <p className="text-center text-sm text-muted-foreground">
            {localizeText("Draw the same shape in the box below.", {
              zh: "请在下方方框内画出相同的图形。",
              yue: "請喺下面方框內畫出相同嘅圖形。",
              fr: "Dessinez la même figure dans la zone ci-dessous.",
            })}
          </p>

          <div className="rounded-xl border-2 border-dashed border-slate-300 bg-white p-3 shadow-sm">
            <canvas
              ref={canvasRef}
              width={720}
              height={360}
              className="h-64 w-full touch-none rounded-lg bg-slate-50"
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={stopDrawing}
              onPointerCancel={stopDrawing}
              onPointerLeave={stopDrawing}
            />
          </div>
        </div>

        <div className="flex justify-center space-x-4">
          <Button variant="outline" onClick={handleSkip}>
            {t("common.skip_task")}
          </Button>
          <Button variant="outline" onClick={clearDrawing}>
            {t("common.reset")}
          </Button>
          <Button onClick={handleSubmit} disabled={!hasDrawn} className="w-full max-w-xs">
            {t("common.submit")}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

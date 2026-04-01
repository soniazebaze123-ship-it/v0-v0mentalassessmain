"use client"

import { useState, useRef, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Image from "next/image"
import { useLanguage } from "@/contexts/language-context"
import { InstructionAudio } from "@/components/ui/instruction-audio"
import { Eraser, RotateCcw, Check } from "lucide-react"

interface CopyingDesignProps {
  onComplete: (score: number) => void
  onSkip?: () => void
}

export function CopyingDesign({ onComplete, onSkip }: CopyingDesignProps) {
  const { t, language } = useLanguage()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [hasDrawn, setHasDrawn] = useState(false)
  const [lastPoint, setLastPoint] = useState<{ x: number; y: number } | null>(null)

  // Initialize canvas
  useEffect(() => {
    const canvas = canvasRef.current
    if (canvas) {
      const ctx = canvas.getContext("2d")
      if (ctx) {
        ctx.fillStyle = "#ffffff"
        ctx.fillRect(0, 0, canvas.width, canvas.height)
        ctx.strokeStyle = "#000000"
        ctx.lineWidth = 3
        ctx.lineCap = "round"
        ctx.lineJoin = "round"
      }
    }
  }, [])

  const getCoordinates = (e: React.TouchEvent | React.MouseEvent) => {
    const canvas = canvasRef.current
    if (!canvas) return null

    const rect = canvas.getBoundingClientRect()
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height

    if ("touches" in e) {
      const touch = e.touches[0]
      return {
        x: (touch.clientX - rect.left) * scaleX,
        y: (touch.clientY - rect.top) * scaleY,
      }
    } else {
      return {
        x: (e.clientX - rect.left) * scaleX,
        y: (e.clientY - rect.top) * scaleY,
      }
    }
  }

  const startDrawing = (e: React.TouchEvent | React.MouseEvent) => {
    e.preventDefault()
    const coords = getCoordinates(e)
    if (coords) {
      setIsDrawing(true)
      setLastPoint(coords)
      setHasDrawn(true)
    }
  }

  const draw = (e: React.TouchEvent | React.MouseEvent) => {
    e.preventDefault()
    if (!isDrawing || !lastPoint) return

    const canvas = canvasRef.current
    const ctx = canvas?.getContext("2d")
    const coords = getCoordinates(e)

    if (ctx && coords) {
      ctx.beginPath()
      ctx.moveTo(lastPoint.x, lastPoint.y)
      ctx.lineTo(coords.x, coords.y)
      ctx.stroke()
      setLastPoint(coords)
    }
  }

  const stopDrawing = () => {
    setIsDrawing(false)
    setLastPoint(null)
  }

  const clearCanvas = () => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext("2d")
    if (ctx && canvas) {
      ctx.fillStyle = "#ffffff"
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      setHasDrawn(false)
    }
  }

  const evaluateDrawing = () => {
    const canvas = canvasRef.current
    if (!canvas) {
      onComplete(0)
      return
    }

    const ctx = canvas.getContext("2d")
    if (!ctx) {
      onComplete(0)
      return
    }

    // Get image data to analyze the drawing
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
    const data = imageData.data

    // Count non-white pixels (drawn pixels)
    let drawnPixels = 0
    let totalPixels = data.length / 4

    for (let i = 0; i < data.length; i += 4) {
      const r = data[i]
      const g = data[i + 1]
      const b = data[i + 2]
      // If not white (allowing some tolerance)
      if (r < 250 || g < 250 || b < 250) {
        drawnPixels++
      }
    }

    const coverage = drawnPixels / totalPixels

    // Analyze if drawing resembles interlocking pentagons
    // Check different regions of the canvas for drawing activity
    const width = canvas.width
    const height = canvas.height
    
    // Divide canvas into regions to check for pentagon-like shapes
    const regions = [
      { x: 0, y: 0, w: width / 2, h: height }, // Left half
      { x: width / 2, y: 0, w: width / 2, h: height }, // Right half
      { x: width / 4, y: height / 4, w: width / 2, h: height / 2 }, // Center (overlap area)
    ]

    let activeRegions = 0
    regions.forEach((region) => {
      const regionData = ctx.getImageData(region.x, region.y, region.w, region.h)
      let regionDrawn = 0
      for (let i = 0; i < regionData.data.length; i += 4) {
        if (regionData.data[i] < 250) regionDrawn++
      }
      if (regionDrawn > (region.w * region.h) * 0.01) {
        activeRegions++
      }
    })

    // Scoring based on drawing analysis:
    // - 0 points: No drawing or minimal scribbles (coverage < 1%)
    // - 1 point: Some drawing but incomplete (coverage 1-3%, or only 1 region active)
    // - 2 points: Drawing present but not well-formed (coverage 3-8%, 2 regions active)
    // - 3 points: Good attempt with overlapping shapes (coverage > 8%, all 3 regions active)

    let score = 0

    if (coverage < 0.01) {
      score = 0 // Minimal or no drawing
    } else if (coverage < 0.03 || activeRegions < 2) {
      score = 1 // Some attempt
    } else if (coverage < 0.08 || activeRegions < 3) {
      score = 2 // Partial success
    } else {
      score = 3 // Good attempt with overlapping shapes
    }

    onComplete(score)
  }

  const handleSkip = () => {
    if (onSkip) {
      onSkip()
    } else {
      onComplete(0)
    }
  }

  const instructions = {
    en: "Look at the two overlapping pentagons below. Draw the same shapes in the drawing area. Try to copy them as accurately as possible, including where they overlap.",
    zh: "请看下面两个相交的五边形。在绘图区域画出相同的图形。请尽量准确地复制它们，包括它们重叠的部分。",
    yue: "請睇下面兩個相交嘅五邊形。喺繪圖區域畫出相同嘅圖形。請盡量準確咁複製佢哋，包括佢哋重疊嘅部分。",
    fr: "Regardez les deux pentagones qui se chevauchent ci-dessous. Dessinez les mêmes formes dans la zone de dessin.",
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>
          {language === "zh" ? "复制图形" : language === "yue" ? "複製圖形" : t("mmse.copying")}
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          {instructions[language as keyof typeof instructions] || instructions.en}
        </p>
        <InstructionAudio instructionKey="mmse.copying.instruction" className="mt-2" />
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Reference Image */}
        <div className="space-y-2">
          <p className="text-sm font-medium text-center">
            {language === "zh" ? "参考图形：" : language === "yue" ? "參考圖形：" : "Reference Shape:"}
          </p>
          <div className="flex justify-center">
            <div className="relative w-48 h-48 bg-gray-50 rounded-lg overflow-hidden border-2 border-gray-200">
              <Image src="/images/pentagon.png" alt="Interlocking pentagons" fill className="object-contain p-2" />
            </div>
          </div>
        </div>

        {/* Drawing Canvas */}
        <div className="space-y-2">
          <p className="text-sm font-medium text-center">
            {language === "zh" ? "在此处绘图：" : language === "yue" ? "喺呢度繪圖：" : "Draw Here:"}
          </p>
          <div className="flex justify-center">
            <div className="relative border-2 border-blue-300 rounded-lg overflow-hidden bg-white shadow-inner">
              <canvas
                ref={canvasRef}
                width={300}
                height={300}
                className="touch-none cursor-crosshair"
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                onTouchStart={startDrawing}
                onTouchMove={draw}
                onTouchEnd={stopDrawing}
              />
            </div>
          </div>
        </div>

        {/* Drawing Tools */}
        <div className="flex justify-center gap-4">
          <Button variant="outline" size="sm" onClick={clearCanvas}>
            <RotateCcw className="w-4 h-4 mr-2" />
            {language === "zh" ? "清除" : language === "yue" ? "清除" : "Clear"}
          </Button>
        </div>

        {/* Submit Buttons */}
        <div className="flex justify-center space-x-4 pt-4">
          <Button variant="outline" onClick={handleSkip}>
            {t("common.skip_task")}
          </Button>
          <Button onClick={evaluateDrawing} disabled={!hasDrawn} className="min-w-[120px]">
            <Check className="w-4 h-4 mr-2" />
            {t("common.submit")}
          </Button>
        </div>

        {/* Scoring Guide */}
        <div className="text-xs text-muted-foreground text-center border-t pt-4">
          <p>
            {language === "zh" 
              ? "评分标准：图形完整且重叠部分正确 = 3分" 
              : language === "yue"
              ? "評分標準：圖形完整且重疊部分正確 = 3分"
              : "Scoring: Complete shapes with correct overlap = 3 points"}
          </p>
        </div>
      </CardContent>
    </Card>
  )
}

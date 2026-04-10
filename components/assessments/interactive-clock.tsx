"use client"

import type React from "react"
import { useEffect, useEffectEvent, useRef, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useLanguage } from "@/contexts/language-context"
import { InstructionAudio } from "@/components/ui/instruction-audio"

interface InteractiveClockProps {
  onComplete: (score: number) => void
  targetTime: { hour: number; minute: number }
  onSkip?: () => void
}

export function InteractiveClock({ onComplete, targetTime, onSkip }: InteractiveClockProps) {
  const { t } = useLanguage()
  const [hourAngle, setHourAngle] = useState(0)
  const [minuteAngle, setMinuteAngle] = useState(0)
  const [isDragging, setIsDragging] = useState<"hour" | "minute" | null>(null)
  const [isMobile, setIsMobile] = useState(false)
  const clockRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }

    checkMobile()
    window.addEventListener("resize", checkMobile)
    return () => window.removeEventListener("resize", checkMobile)
  }, [])

  const getAngleFromPosition = (x: number, y: number, centerX: number, centerY: number) => {
    const angle = Math.atan2(y - centerY, x - centerX) * (180 / Math.PI) + 90
    return angle < 0 ? angle + 360 : angle
  }

  const snapToIncrement = (angle: number, increment: number) => {
    return Math.round(angle / increment) * increment
  }

  const handleMouseDown = (hand: "hour" | "minute") => (e: React.MouseEvent) => {
    e.preventDefault()
    setIsDragging(hand)
  }

  // Add touch event handlers
  const handleTouchStart = (hand: "hour" | "minute") => (e: React.TouchEvent) => {
    e.preventDefault()
    setIsDragging(hand)
  }

  const handleMouseMove = useEffectEvent((e: MouseEvent) => {
    if (!isDragging || !clockRef.current) return

    const rect = clockRef.current.getBoundingClientRect()
    const centerX = rect.left + rect.width / 2
    const centerY = rect.top + rect.height / 2

    const angle = getAngleFromPosition(e.clientX, e.clientY, centerX, centerY)

    if (isDragging === "hour") {
      const snappedAngle = snapToIncrement(angle, 30) // 30 degrees per hour
      setHourAngle(snappedAngle)
    } else if (isDragging === "minute") {
      const snappedAngle = snapToIncrement(angle, 6) // 6 degrees per minute
      setMinuteAngle(snappedAngle)
    }
  })

  const handleTouchMove = useEffectEvent((e: TouchEvent) => {
    if (!isDragging || !clockRef.current) return

    const rect = clockRef.current.getBoundingClientRect()
    const touch = e.touches[0]
    const centerX = rect.left + rect.width / 2
    const centerY = rect.top + rect.height / 2

    const angle = getAngleFromPosition(touch.clientX, touch.clientY, centerX, centerY)

    if (isDragging === "hour") {
      const snappedAngle = snapToIncrement(angle, 30)
      setHourAngle(snappedAngle)
    } else if (isDragging === "minute") {
      const snappedAngle = snapToIncrement(angle, 6)
      setMinuteAngle(snappedAngle)
    }
  })

  const handleMouseUp = useEffectEvent(() => {
    setIsDragging(null)
  })

  const handleTouchEnd = useEffectEvent(() => {
    setIsDragging(null)
  })

  // Update useEffect to include touch events
  useEffect(() => {
    if (isDragging) {
      document.addEventListener("mousemove", handleMouseMove)
      document.addEventListener("mouseup", handleMouseUp)
      document.addEventListener("touchmove", handleTouchMove, { passive: false })
      document.addEventListener("touchend", handleTouchEnd)
      return () => {
        document.removeEventListener("mousemove", handleMouseMove)
        document.removeEventListener("mouseup", handleMouseUp)
        document.removeEventListener("touchmove", handleTouchMove)
        document.removeEventListener("touchend", handleTouchEnd)
      }
    }
  }, [handleMouseMove, handleMouseUp, handleTouchEnd, handleTouchMove, isDragging])

  const getCurrentTime = () => {
    // Convert angles to time
    const hour = Math.round(hourAngle / 30) % 12 || 12
    const minute = Math.round(minuteAngle / 6) % 60
    return { hour, minute }
  }

  const checkAnswer = () => {
    const currentTime = getCurrentTime()
    let score = 0

    // Check if hour hand is correct (pointing to 2)
    if (currentTime.hour === targetTime.hour) {
      score += 1
    }

    // Check if minute hand is correct (pointing to 10 minutes)
    if (currentTime.minute === targetTime.minute) {
      score += 1
    }

    // Full points if both are correct
    if (score === 2) {
      score = 3
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

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>{t("moca.visuospatial")}</CardTitle>
        <p className="text-sm text-muted-foreground">{t("moca.visuospatial.instruction")}</p>
        <InstructionAudio instructionKey="moca.visuospatial.instruction" className="mt-2" />
      </CardHeader>
      <CardContent className="flex flex-col items-center space-y-6">
        <div
          ref={clockRef}
          className={`relative bg-white dark:bg-gray-100 rounded-full border-4 border-gray-800 dark:border-gray-700 shadow-lg ${
            isMobile ? "w-72 h-72" : "w-80 h-80"
          }`}
          style={{ cursor: isDragging ? "grabbing" : "grab" }}
        >
          {/* Clock numbers - 12 at top, clockwise */}
          {[...Array(12)].map((_, i) => {
            const number = i === 0 ? 12 : i // 12 at position 0, then 1-11
            const angle = (i * 30 - 90) * (Math.PI / 180) // Start at -90 degrees (top)
            const radius = isMobile ? 115 : 130
            const x = Math.cos(angle) * radius
            const y = Math.sin(angle) * radius

            return (
              <div
                key={number}
                className="absolute w-8 h-8 flex items-center justify-center font-bold text-lg text-gray-800"
                style={{
                  left: `calc(50% + ${x}px - 16px)`,
                  top: `calc(50% + ${y}px - 16px)`,
                }}
              >
                {number}
              </div>
            )
          })}

          {/* Hour markers */}
          {[...Array(12)].map((_, i) => {
            const angle = i * 30
            const topOffset = isMobile ? "8px" : "10px"
            const transformOrigin = isMobile ? "50% 136px" : "50% 150px"
            return (
              <div
                key={i}
                className="absolute w-1 h-6 bg-gray-600"
                style={{
                  left: "calc(50% - 2px)",
                  top: topOffset,
                  transformOrigin: transformOrigin,
                  transform: `rotate(${angle}deg)`,
                }}
              />
            )
          })}

          {/* Minute markers */}
          {[...Array(60)].map((_, i) => {
            if (i % 5 !== 0) {
              const angle = i * 6
              const topOffset = isMobile ? "8px" : "10px"
              const transformOrigin = isMobile ? "50% 136px" : "50% 150px"
              return (
                <div
                  key={i}
                  className="absolute w-0.5 h-3 bg-gray-400"
                  style={{
                    left: "calc(50% - 1px)",
                    top: topOffset,
                    transformOrigin: transformOrigin,
                    transform: `rotate(${angle}deg)`,
                  }}
                />
              )
            }
            return null
          })}

          {/* Hour hand - thinner on mobile */}
          <div
            className={`absolute bg-gray-800 rounded-full cursor-grab touch-target ${
              isDragging === "hour" ? "bg-blue-600" : ""
            } ${isMobile ? "w-0.5" : "w-2"}`}
            style={{
              height: isMobile ? "48px" : "80px",
              left: isMobile ? "calc(50% - 1px)" : "calc(50% - 4px)",
              top: isMobile ? "calc(50% - 48px)" : "calc(50% - 80px)",
              transformOrigin: isMobile ? "50% 48px" : "50% 80px",
              transform: `rotate(${hourAngle}deg)`,
            }}
            onMouseDown={handleMouseDown("hour")}
            onTouchStart={handleTouchStart("hour")}
          />

          {/* Minute hand - thinner on mobile */}
          <div
            className={`absolute bg-gray-600 rounded-full cursor-grab touch-target ${
              isDragging === "minute" ? "bg-blue-600" : ""
            } ${isMobile ? "w-0.5" : "w-1"}`}
            style={{
              height: isMobile ? "66px" : "110px",
              left: isMobile ? "calc(50% - 1px)" : "calc(50% - 2px)",
              top: isMobile ? "calc(50% - 66px)" : "calc(50% - 110px)",
              transformOrigin: isMobile ? "50% 66px" : "50% 110px",
              transform: `rotate(${minuteAngle}deg)`,
            }}
            onMouseDown={handleMouseDown("minute")}
            onTouchStart={handleTouchStart("minute")}
          />

          {/* Center dot */}
          <div
            className={`absolute bg-gray-800 rounded-full ${isMobile ? "w-3 h-3" : "w-4 h-4"}`}
            style={{
              left: isMobile ? "calc(50% - 6px)" : "calc(50% - 8px)",
              top: isMobile ? "calc(50% - 6px)" : "calc(50% - 8px)",
            }}
          />
        </div>

        <div className="flex space-x-4">
          <Button variant="outline" onClick={handleSkip}>
            {t("common.skip_task")}
          </Button>
          <Button onClick={checkAnswer} className="w-full max-w-xs">
            {t("common.submit")}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

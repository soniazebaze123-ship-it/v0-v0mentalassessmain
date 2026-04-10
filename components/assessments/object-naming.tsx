"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AssessmentInput } from "@/components/ui/assessment-input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import Image from "next/image"
import { useUser } from "@/contexts/user-context"
import { supabase } from "@/lib/supabase"
import { useLanguage } from "@/contexts/language-context"
import { InstructionAudio } from "@/components/ui/instruction-audio"

interface ObjectNamingProps {
  onComplete: (score: number) => void
  onSkip?: () => void
}

interface UploadedImage {
  id: string
  filename: string
  file_path: string
  url: string
}

export function ObjectNaming({ onComplete, onSkip }: ObjectNamingProps) {
  const { t } = useLanguage()
  const { user } = useUser()
  const [answers, setAnswers] = useState<string[]>(["", "", ""])
  const [uploadedImages, setUploadedImages] = useState<UploadedImage[]>([])
  const [loading, setLoading] = useState(true)

  const defaultObjects = [
    { image: "/images/house.png", name: t("common.house"), alt: t("common.house") },
    { image: "/images/bag.png", name: t("common.bag"), alt: t("common.bag") },
    { image: "/images/tv.png", name: t("common.television"), alt: t("common.television") },
  ]

  useEffect(() => {
    loadUploadedImages()
  }, [user])

  const loadUploadedImages = async () => {
    if (!user) {
      setLoading(false)
      return
    }

    try {
      const { data: files } = await supabase
        .from("uploaded_files")
        .select("*")
        .eq("user_id", user.id)
        .like("file_type", "image%")
        .limit(3)

      if (files && files.length >= 3) {
        const images = files.slice(0, 3).map((file) => ({
          id: file.id,
          filename: file.filename,
          file_path: file.file_path,
          url: supabase.storage.from("user-files").getPublicUrl(file.file_path).data.publicUrl,
        }))
        setUploadedImages(images)
      }
    } catch (error) {
      // Error loading uploaded images - silently continue
    } finally {
      setLoading(false)
    }
  }

  const objects =
    uploadedImages.length >= 3
      ? uploadedImages.map((img, index) => ({
          image: img.url,
          name: `${t("common.object")}${index + 1}`, // Generic name for uploaded images
          alt: img.filename,
        }))
      : defaultObjects

  const handleAnswerChange = (index: number, value: string) => {
    const newAnswers = [...answers]
    newAnswers[index] = value
    setAnswers(newAnswers)
  }

  const checkAnswers = () => {
    let score = 0
    objects.forEach((object, index) => {
      const userAnswer = answers[index].toLowerCase().trim()
      // For default objects, check against localized name. For uploaded, any non-empty answer gets a point.
      if (uploadedImages.length >= 3) {
        if (userAnswer !== "") {
          score += 1
        }
      } else {
        if (userAnswer === object.name.toLowerCase()) {
          score += 1
        }
      }
    })
    onComplete(score)
  }

  const handleSkip = () => {
    if (onSkip) {
      onSkip()
    } else {
      onComplete(0)
    }
  }

  if (loading) {
    return (
      <Card className="w-full max-w-4xl mx-auto">
        <CardContent className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>{t("mmse.naming")}</CardTitle>
        <p className="text-sm text-muted-foreground">{t("mmse.naming.instruction")}</p>
        <InstructionAudio instructionKey="mmse.naming.instruction" className="mt-2" />
        {uploadedImages.length >= 3 && <p className="text-sm text-green-600">✓ {t("upload.using_uploaded_images")}</p>}
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {objects.map((object, index) => (
            <div key={index} className="space-y-4">
              <div
                className={`relative w-full bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden ${
                  // Special handling for Object 2 (index 1) on mobile - reduce height
                  index === 1 ? "h-40 sm:h-48" : "h-48"
                }`}
              >
                <Image
                  src={object.image || "/placeholder.svg"}
                  alt={object.alt}
                  fill
                  className={`${
                    // Special handling for Object 2 (index 1) - contain instead of cover for better fit
                    index === 1 ? "object-contain p-2" : "object-cover"
                  }`}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor={`object-${index}`} className="text-sm font-medium">
                  {t("question.object_label", { index: index + 1 })}
                </Label>
                <AssessmentInput
                  id={`object-${index}`}
                  value={answers[index]}
                  onChange={(e) => handleAnswerChange(index, e.target.value)}
                  placeholder=""
                  className="w-full"
                />
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 flex flex-col sm:flex-row justify-center items-center space-y-4 sm:space-y-0 sm:space-x-4">
          <Button variant="outline" onClick={handleSkip} className="w-full sm:w-auto bg-transparent">
            {t("common.skip_task")}
          </Button>
          <Button
            onClick={checkAnswers}
            disabled={answers.some((answer) => answer.trim() === "")}
            className="w-full sm:w-auto sm:max-w-xs"
          >
            {t("common.submit")}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

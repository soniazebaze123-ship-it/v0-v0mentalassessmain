"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AssessmentInput } from "@/components/ui/assessment-input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import Image from "next/image"
import { useLanguage } from "@/contexts/language-context"
import { useUser } from "@/contexts/user-context"
import { supabase } from "@/lib/supabase"
import { InstructionAudio } from "@/components/ui/instruction-audio"

interface AnimalNamingProps {
  onComplete: (score: number) => void
  onSkip?: () => void
}

interface UploadedImage {
  id: string
  filename: string
  file_path: string
  url: string
}

export function AnimalNaming({ onComplete, onSkip }: AnimalNamingProps) {
  const { t, language } = useLanguage()
  const { user } = useUser()
  const [answers, setAnswers] = useState<string[]>(["", "", ""])
  const [uploadedImages, setUploadedImages] = useState<UploadedImage[]>([])
  const [loading, setLoading] = useState(true)

  // Animal names with all accepted variations for scoring
  const animalData = [
    { 
      image: "/images/tiger.png", 
      displayName: t("common.tiger"),
      acceptedAnswers: ["tiger", "老虎", "虎", "lǎohǔ", "老虎仔", "大虎"]
    },
    { 
      image: "/images/rhinoceros.png", 
      displayName: t("common.rhinoceros"),
      acceptedAnswers: ["rhinoceros", "rhino", "犀牛", "xīniú", "犀牛仔"]
    },
    { 
      image: "/images/camel.png", 
      displayName: t("common.camel"),
      acceptedAnswers: ["camel", "骆驼", "駱駝", "luòtuo", "骆驼仔"]
    },
  ]
  
  const defaultAnimals = animalData.map(animal => ({
    image: animal.image,
    name: animal.displayName,
    alt: animal.displayName,
    acceptedAnswers: animal.acceptedAnswers
  }))

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

  const animals =
    uploadedImages.length >= 3
      ? uploadedImages.map((img, index) => ({
          image: img.url,
          name: `${t("common.animal")}${index + 1}`, // Generic name for uploaded images
          alt: img.filename,
        }))
      : defaultAnimals

  const handleAnswerChange = (index: number, value: string) => {
    const newAnswers = [...answers]
    newAnswers[index] = value
    setAnswers(newAnswers)
  }

  const checkAnswers = () => {
    let score = 0
    animals.forEach((animal, index) => {
      const userAnswer = answers[index].toLowerCase().trim()
      // For default animals, check against all accepted answers (Chinese, Cantonese, English, Pinyin)
      if (uploadedImages.length >= 3) {
        // For uploaded images, any non-empty answer gets a point
        if (userAnswer !== "") {
          score += 1
        }
      } else {
        // Check if user answer matches any accepted variation
        const isCorrect = animal.acceptedAnswers?.some((accepted: string) => 
          userAnswer === accepted.toLowerCase() || 
          accepted.toLowerCase().includes(userAnswer) ||
          userAnswer.includes(accepted.toLowerCase())
        ) || userAnswer === animal.name.toLowerCase()
        
        if (isCorrect) {
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
        <CardTitle>{t("moca.naming")}</CardTitle>
        <p className="text-sm text-gray-600">{t("moca.naming.instruction")}</p>
        <InstructionAudio instructionKey="moca.naming.instruction" className="mt-2" />
        {uploadedImages.length >= 3 && <p className="text-sm text-green-600">✓ {t("upload.using_uploaded_images")}</p>}
      </CardHeader>
      <CardContent>
        <div className="grid md:grid-cols-3 gap-6">
          {animals.map((animal, index) => (
            <div key={index} className="space-y-4">
              <div className="relative w-full h-48 bg-gray-100 rounded-lg overflow-hidden">
                <Image src={animal.image || "/placeholder.svg"} alt={animal.alt} fill className="object-cover" />
              </div>
              <div className="space-y-2">
                <Label htmlFor={`animal-${index}`}>{t("question.animal_label", { index: index + 1 })}</Label>
                <AssessmentInput
                  id={`animal-${index}`}
                  value={answers[index]}
                  onChange={(e) => handleAnswerChange(index, e.target.value)}
                  placeholder=""
                  className="w-full"
                />
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 flex justify-center space-x-4">
          <Button variant="outline" onClick={handleSkip}>
            {t("common.skip_task")}
          </Button>
          <Button
            onClick={checkAnswers}
            disabled={answers.some((answer) => answer.trim() === "")}
            className="w-full max-w-xs"
          >
            {t("common.submit")}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

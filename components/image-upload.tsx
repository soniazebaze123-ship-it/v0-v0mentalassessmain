"use client"

import Image from "next/image"
import type React from "react"
import { useState, useCallback, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { useUser } from "@/contexts/user-context"
import { supabase } from "@/lib/supabase"
import { Upload, X, FileText, ImageIcon } from "lucide-react"
import { useLanguage } from "@/contexts/language-context"

interface UploadedFile {
  id: string
  name: string
  size: number
  type: string
  url: string
  preview?: string
}

interface ImageUploadProps {
  onComplete: () => void
}

export function ImageUpload({ onComplete }: ImageUploadProps) {
  const { t } = useLanguage()
  const [files, setFiles] = useState<UploadedFile[]>([])
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [dragActive, setDragActive] = useState(false)
  const [error, setError] = useState("")
  const { user } = useUser()

  useEffect(() => {
    const loadExistingFiles = async () => {
      if (!user) {
        setFiles([])
        return
      }

      try {
        const { data, error: loadError } = await supabase
          .from("uploaded_files")
          .select("id, filename, file_path, file_type, file_size, uploaded_at")
          .eq("user_id", user.id)
          .order("uploaded_at", { ascending: false })

        if (loadError) {
          throw loadError
        }

        setFiles(
          (data ?? []).map((file) => {
            const {
              data: { publicUrl },
            } = supabase.storage.from("user-files").getPublicUrl(file.file_path)

            return {
              id: file.id,
              name: file.filename,
              size: file.file_size,
              type: file.file_type,
              url: publicUrl,
              preview: file.file_type.startsWith("image/") ? publicUrl : undefined,
            }
          }),
        )
      } catch (loadError) {
        console.error("Error loading uploaded files:", loadError)
        setError(t("upload.error.failed"))
      }
    }

    loadExistingFiles()
  }, [user, t])

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }, [])

  const handleFiles = useCallback(async (fileList: File[]) => {
    if (!user) {
      setError(t("upload.error.failed"))
      return
    }

    const validFiles = fileList.filter((file) => {
      const validTypes = ["image/png", "image/jpeg", "image/jpg", "application/pdf"]
      return validTypes.includes(file.type) && file.size <= 10 * 1024 * 1024
    })

    if (validFiles.length === 0) {
      setError(t("upload.error.invalid_file_type_size"))
      return
    }

    setUploading(true)
    setUploadProgress(0)
    setError("")

    try {
      for (let i = 0; i < validFiles.length; i++) {
        const file = validFiles[i]
        const fileExt = file.name.split(".").pop()
        const fileName = `${user.id}/${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`

        const { error: uploadError } = await supabase.storage
          .from("user-files")
          .upload(fileName, file, {
            cacheControl: "3600",
            upsert: false,
          })

        if (uploadError) {
          console.error("Upload error:", uploadError)
          throw uploadError
        }

        const { error: dbError } = await supabase
          .from("uploaded_files")
          .insert({
            user_id: user.id,
            filename: file.name,
            file_path: fileName,
            file_type: file.type,
            file_size: file.size,
          })

        if (dbError) throw dbError

        setUploadProgress(((i + 1) / validFiles.length) * 100)
      }

      const { data, error: reloadError } = await supabase
        .from("uploaded_files")
        .select("id, filename, file_path, file_type, file_size, uploaded_at")
        .eq("user_id", user.id)
        .order("uploaded_at", { ascending: false })

      if (reloadError) {
        throw reloadError
      }

      setFiles(
        (data ?? []).map((file) => {
          const {
            data: { publicUrl },
          } = supabase.storage.from("user-files").getPublicUrl(file.file_path)

          return {
            id: file.id,
            name: file.filename,
            size: file.file_size,
            type: file.file_type,
            url: publicUrl,
            preview: file.file_type.startsWith("image/") ? publicUrl : undefined,
          }
        }),
      )
    } catch (error) {
      console.error("Upload error:", error)
      setError(`${t("upload.error.failed")}: ${error instanceof Error ? error.message : "Unknown error"}`)
    } finally {
      setUploading(false)
      setUploadProgress(0)
    }
  }, [t, user])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      void handleFiles(Array.from(e.dataTransfer.files))
    }
  }, [handleFiles])

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      void handleFiles(Array.from(e.target.files))
    }
  }

  const removeFile = async (fileId: string) => {
    try {
      // Remove from database
      await supabase.from("uploaded_files").delete().eq("id", fileId)

      // Remove from state
      setFiles((prev) => prev.filter((f) => f.id !== fileId))
    } catch (error) {
      console.error("Error removing file:", error)
      setError(t("upload.error.remove_failed"))
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  const getFileIcon = (type: string) => {
    if (type.startsWith("image/")) return <ImageIcon className="w-8 h-8" />
    if (type === "application/pdf") return <FileText className="w-8 h-8" />
    return <FileText className="w-8 h-8" />
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <Card className="w-full max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle>{t("dashboard.upload")}</CardTitle>
          <p className="text-sm text-gray-600">{t("upload.instruction")}</p>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Upload Area */}
          <div
            className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              dragActive ? "border-blue-500 bg-blue-50" : "border-gray-300 hover:border-gray-400"
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <input
              type="file"
              multiple
              accept=".png,.jpg,.jpeg,.pdf"
              onChange={handleFileInput}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              disabled={uploading}
            />

            <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-lg font-medium text-gray-700 mb-2">{t("upload.drag_drop")}</p>
            <p className="text-sm text-gray-500">{t("upload.file_types")}</p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          {/* Upload Progress */}
          {uploading && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>{t("upload.uploading")}</span>
                <span>{Math.round(uploadProgress)}%</span>
              </div>
              <Progress value={uploadProgress} className="w-full" />
            </div>
          )}

          {/* Uploaded Files */}
          {files.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">{t("upload.uploaded_files", { count: files.length })}</h3>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {files.map((file) => (
                  <div key={file.id} className="border rounded-lg p-4 space-y-3">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center space-x-2 flex-1 min-w-0">
                        {getFileIcon(file.type)}
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium truncate" title={file.name}>
                            {file.name}
                          </p>
                          <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFile(file.id)}
                        className="text-red-500 hover:text-red-700 p-1"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>

                    {/* Image Preview */}
                    {file.preview && (
                      <div className="relative w-full h-32 bg-gray-100 rounded overflow-hidden">
                        <Image
                          src={file.preview || file.url || "/placeholder.svg"}
                          alt={file.name}
                          fill
                          className="object-cover"
                          onError={(event) => {
                            if (event.currentTarget.src.endsWith("/placeholder.svg")) {
                              return
                            }

                            event.currentTarget.src = "/placeholder.svg"
                          }}
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Submit Button */}
          <div className="flex justify-center pt-6">
            <Button onClick={onComplete} disabled={uploading} className="w-full max-w-xs">
              {t("upload.complete_section")}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

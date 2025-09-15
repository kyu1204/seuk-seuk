"use client"

import type React from "react"

import { useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { Upload, FileImage, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import AreaSelector from "@/components/area-selector"
import { uploadDocument } from "@/app/actions/document-actions"
import { useLanguage } from "@/contexts/language-context"
import type { SignatureArea } from "@/lib/supabase/database.types"

export default function DocumentUpload() {
  const { t } = useLanguage()
  const router = useRouter()
  const [document, setDocument] = useState<string | null>(null)
  const [fileName, setFileName] = useState<string>("")
  const [originalFile, setOriginalFile] = useState<File | null>(null)
  const [signatureAreas, setSignatureAreas] = useState<SignatureArea[]>([])
  const [isSelecting, setIsSelecting] = useState<boolean>(false)
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const documentContainerRef = useRef<HTMLDivElement>(null)
  const [scrollPosition, setScrollPosition] = useState<{ top: number; left: number }>({ top: 0, left: 0 })

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setFileName(file.name)
      setOriginalFile(file)
      setError(null)

      const reader = new FileReader()
      reader.onload = (event) => {
        setDocument(event.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleAddSignatureArea = () => {
    // Save current scroll position before switching to selection mode
    if (documentContainerRef.current) {
      const scrollTop = documentContainerRef.current.scrollTop
      const scrollLeft = documentContainerRef.current.scrollLeft

      setScrollPosition({
        top: scrollTop,
        left: scrollLeft,
      })
    }
    setIsSelecting(true)
  }

  const handleAreaSelected = (area: SignatureArea) => {
    // Simply store the area coordinates as they are
    setSignatureAreas([...signatureAreas, area])
    setIsSelecting(false)
  }

  const handleRemoveArea = (index: number) => {
    const updatedAreas = [...signatureAreas]
    updatedAreas.splice(index, 1)
    setSignatureAreas(updatedAreas)
  }

  const handleClearDocument = () => {
    setDocument(null)
    setFileName("")
    setOriginalFile(null)
    setSignatureAreas([])
    setError(null)
  }

  const handleGetSignature = async () => {
    if (!originalFile || signatureAreas.length === 0) {
      setError("Please upload a document and add at least one signature area")
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      // Create FormData for the server action
      const formData = new FormData()
      formData.append('file', originalFile)
      formData.append('filename', fileName)
      formData.append('signatureAreas', JSON.stringify(signatureAreas))

      // Upload document using server action
      const result = await uploadDocument(formData)

      if (result.error) {
        setError(result.error)
        return
      }

      if (result.success && result.shortUrl) {
        // Redirect to the signing page with the short URL
        router.push(`/sign/${result.shortUrl}`)
      } else {
        setError("Failed to create document link")
      }
    } catch (error) {
      console.error("Error uploading document:", error)
      setError("An unexpected error occurred while uploading the document")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-8">
      {!document ? (
        <Card className="border-dashed border-2">
          <CardContent className="p-6">
            <div className="flex flex-col items-center justify-center space-y-4 py-12">
              <div className="rounded-full bg-primary/10 p-4">
                <FileImage className="h-10 w-10 text-primary" />
              </div>
              <div className="text-center space-y-2">
                <h3 className="font-medium text-lg">{t("upload.title")}</h3>
                <p className="text-muted-foreground text-sm">{t("upload.description")}</p>
              </div>
              <label htmlFor="document-upload">
                <div className="cursor-pointer">
                  <Button onClick={() => fileInputRef.current?.click()} type="button">
                    <Upload className="mr-2 h-4 w-4" />
                    {t("upload.button")}
                  </Button>
                </div>
                <input
                  id="document-upload"
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileChange}
                />
              </label>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold">{fileName}</h2>
            <Button variant="outline" onClick={handleClearDocument}>
              <Trash2 className="mr-2 h-4 w-4" />
              {t("upload.clear")}
            </Button>
          </div>

          <div className="relative border rounded-lg overflow-hidden">
            {isSelecting ? (
              <AreaSelector
                image={document}
                onAreaSelected={handleAreaSelected}
                onCancel={() => setIsSelecting(false)}
                existingAreas={signatureAreas}
                initialScrollPosition={scrollPosition}
              />
            ) : (
              <div ref={documentContainerRef} className="relative overflow-auto" style={{ maxHeight: "70vh" }}>
                <img
                  src={document || "/placeholder.svg"}
                  alt="Document"
                  className="w-full h-auto object-contain"
                  draggable="false"
                />
                {signatureAreas.map((area, index) => (
                  <div
                    key={index}
                    className="absolute border-2 border-red-500 bg-red-500/10 flex items-center justify-center"
                    style={{
                      position: "absolute",
                      left: `${area.x}px`,
                      top: `${area.y}px`,
                      width: `${area.width}px`,
                      height: `${area.height}px`,
                      pointerEvents: "auto",
                      cursor: "pointer",
                    }}
                    onClick={() => handleRemoveArea(index)}
                  >
                    <span className="text-xs font-medium text-red-600">
                      {t("upload.signature")} {index + 1}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex flex-wrap gap-4">
            <Button onClick={handleAddSignatureArea} disabled={isSelecting}>
              {t("upload.addSignatureArea")}
            </Button>
            <Button
              variant="default"
              onClick={handleGetSignature}
              disabled={signatureAreas.length === 0 || isLoading || !originalFile}
              className="ml-auto"
            >
              {isLoading ? t("upload.generating") : t("upload.getSignature")}
            </Button>
          </div>

          {error && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md text-red-600 text-sm">
              {error}
            </div>
          )}
        </div>
      )}
    </div>
  )
}


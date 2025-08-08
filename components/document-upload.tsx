"use client"

import type React from "react"

import { useState, useRef, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Upload, FileImage, Trash2, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import AreaSelector from "@/components/area-selector"
import { useLanguage } from "@/contexts/language-context"
import { createDocument, saveSignatureAreas, createDocumentShare, getDocumentSignedUrl } from "@/app/actions/document"
import { Tables } from "@/lib/database-types"

type Document = Tables<'documents'>

export default function DocumentUpload() {
  const { t } = useLanguage()
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  
  // File upload states
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [documentTitle, setDocumentTitle] = useState<string>("")
  const [document, setDocument] = useState<string | null>(null)
  const [currentDocument, setCurrentDocument] = useState<Document | null>(null)
  
  // Signature area states
  const [signatureAreas, setSignatureAreas] = useState<Array<{ x: number; y: number; width: number; height: number }>>(
    [],
  )
  const [isSelecting, setIsSelecting] = useState<boolean>(false)
  
  // UI states
  const [isUploading, setIsUploading] = useState<boolean>(false)
  const [isGeneratingLink, setIsGeneratingLink] = useState<boolean>(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const documentContainerRef = useRef<HTMLDivElement>(null)
  const [scrollPosition, setScrollPosition] = useState<{ top: number; left: number }>({ top: 0, left: 0 })

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
      if (!allowedTypes.includes(file.type)) {
        toast.error(t("upload.invalidFileType"))
        return
      }

      // Validate file size (50MB)
      if (file.size > 50 * 1024 * 1024) {
        toast.error(t("upload.fileTooLarge"))
        return
      }

      setSelectedFile(file)
      setDocumentTitle(file.name.split('.')[0]) // Remove extension for default title
      
      // Create preview for images
      if (file.type.startsWith('image/')) {
        const reader = new FileReader()
        reader.onload = (event) => {
          setDocument(event.target?.result as string)
        }
        reader.readAsDataURL(file)
      } else {
        // For PDFs, we'll need a different preview mechanism or placeholder
        setDocument('/pdf-placeholder.png')
      }
    }
  }

  const handleUploadDocument = async () => {
    if (!selectedFile || !documentTitle.trim()) {
      toast.error(t("upload.missingRequiredFields"))
      return
    }

    setIsUploading(true)
    
    try {
      const formData = new FormData()
      formData.append('file', selectedFile)
      formData.append('title', documentTitle.trim())

      const result = await createDocument(formData)
      
      if (result.success && result.data) {
        setCurrentDocument(result.data)
        toast.success(t("upload.success"))
      } else {
        toast.error(result.error || t("upload.failed"))
      }
    } catch (error) {
      console.error('Upload error:', error)
      toast.error(t("upload.failed"))
    } finally {
      setIsUploading(false)
    }
  }

  const handleAddSignatureArea = () => {
    if (!currentDocument) {
      toast.error(t("upload.uploadFirst"))
      return
    }

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

  const handleAreaSelected = async (area: { x: number; y: number; width: number; height: number }) => {
    const newAreas = [
      ...signatureAreas,
      {
        x: area.x,
        y: area.y,
        width: area.width,
        height: area.height,
      },
    ]
    
    setSignatureAreas(newAreas)
    setIsSelecting(false)

    // Save to database immediately
    if (currentDocument) {
      const result = await saveSignatureAreas(currentDocument.id, newAreas)
      if (!result.success) {
        toast.error(result.error || t("upload.saveAreasFailed"))
        // Rollback local state
        setSignatureAreas(signatureAreas)
      }
    }
  }

  const handleRemoveArea = async (index: number) => {
    const newAreas = [...signatureAreas]
    newAreas.splice(index, 1)
    setSignatureAreas(newAreas)

    // Save to database immediately
    if (currentDocument) {
      const result = await saveSignatureAreas(currentDocument.id, newAreas)
      if (!result.success) {
        toast.error(result.error || t("upload.saveAreasFailed"))
        // Rollback local state
        setSignatureAreas([...signatureAreas])
      }
    }
  }

  const handleClearDocument = () => {
    setSelectedFile(null)
    setDocument(null)
    setDocumentTitle("")
    setCurrentDocument(null)
    setSignatureAreas([])
    setIsSelecting(false)
    
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleGenerateSigningLink = async () => {
    if (!currentDocument || signatureAreas.length === 0) {
      toast.error(t("upload.noSignatureAreas"))
      return
    }

    setIsGeneratingLink(true)

    try {
      // Create document share
      const shareResult = await createDocumentShare(currentDocument.id, {
        expiresInDays: 30 // Default 30 days expiry
      })

      if (shareResult.success && shareResult.data) {
        const shortUrl = shareResult.data
        toast.success(t("upload.linkGenerated"))
        
        // Redirect to signing page
        router.push(`/sign/${shortUrl}`)
      } else {
        toast.error(shareResult.error || t("upload.linkGenerationFailed"))
      }
    } catch (error) {
      console.error('Generate link error:', error)
      toast.error(t("upload.linkGenerationFailed"))
    } finally {
      setIsGeneratingLink(false)
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
                <p className="text-muted-foreground text-xs">
                  {t("upload.supportedFormats")} • {t("upload.maxSize")}
                </p>
              </div>
              <Button 
                onClick={() => fileInputRef.current?.click()} 
                type="button"
                disabled={isUploading}
              >
                <Upload className="mr-2 h-4 w-4" />
                {t("upload.button")}
              </Button>
              <input
                id="document-upload"
                ref={fileInputRef}
                type="file"
                accept="image/*,application/pdf"
                className="hidden"
                onChange={handleFileChange}
              />
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* Document info and controls */}
          {!currentDocument ? (
            <Card>
              <CardContent className="p-6 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="document-title">{t("upload.documentTitle")}</Label>
                  <Input
                    id="document-title"
                    value={documentTitle}
                    onChange={(e) => setDocumentTitle(e.target.value)}
                    placeholder={t("upload.titlePlaceholder")}
                  />
                </div>
                <div className="flex gap-4">
                  <Button 
                    onClick={handleUploadDocument}
                    disabled={isUploading || !documentTitle.trim()}
                  >
                    {isUploading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {isUploading ? t("upload.uploading") : t("upload.uploadDocument")}
                  </Button>
                  <Button variant="outline" onClick={handleClearDocument}>
                    <Trash2 className="mr-2 h-4 w-4" />
                    {t("upload.clear")}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-semibold">{currentDocument.title}</h2>
                <p className="text-muted-foreground text-sm">
                  {t("upload.status")}: {currentDocument.status}
                </p>
              </div>
              <Button variant="outline" onClick={handleClearDocument}>
                <Trash2 className="mr-2 h-4 w-4" />
                {t("upload.clear")}
              </Button>
            </div>
          )}

          {/* Document preview */}
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
                    className="absolute border-2 border-red-500 bg-red-500/10 flex items-center justify-center cursor-pointer hover:bg-red-500/20 transition-colors"
                    style={{
                      position: "absolute",
                      left: `${area.x}px`,
                      top: `${area.y}px`,
                      width: `${area.width}px`,
                      height: `${area.height}px`,
                    }}
                    onClick={() => handleRemoveArea(index)}
                    title={t("upload.clickToRemove")}
                  >
                    <span className="text-xs font-medium text-red-600">
                      {t("upload.signature")} {index + 1}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Action buttons */}
          {currentDocument && (
            <div className="flex flex-wrap gap-4">
              <Button 
                onClick={handleAddSignatureArea} 
                disabled={isSelecting || !currentDocument}
                variant="outline"
              >
                {t("upload.addSignatureArea")}
              </Button>
              <Button
                onClick={handleGenerateSigningLink}
                disabled={signatureAreas.length === 0 || isGeneratingLink}
                className="ml-auto"
              >
                {isGeneratingLink && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isGeneratingLink ? t("upload.generating") : t("upload.getSignature")}
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
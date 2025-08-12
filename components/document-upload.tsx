"use client"

import type React from "react"

import { useState, useRef, useTransition, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Upload, FileImage, Trash2, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import AreaSelector from "@/components/area-selector"
import { useLanguage } from "@/contexts/language-context"
import { createDocument, saveSignatureAreas, createDocumentShare, getDocumentSignedUrl, getDocumentById } from "@/app/actions/document"
import { Tables } from "@/lib/database-types"
import SignatureRequestDialog from "@/components/signature-request-dialog"

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
  const [showSignatureRequestDialog, setShowSignatureRequestDialog] = useState<boolean>(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const documentContainerRef = useRef<HTMLDivElement>(null)
  const imageRef = useRef<HTMLImageElement>(null)
  const [scrollPosition, setScrollPosition] = useState<{ top: number; left: number }>({ top: 0, left: 0 })

  // Load existing document if there's a document ID in localStorage or URL
  useEffect(() => {
    const loadExistingDocument = async () => {
      // Try to get document ID from localStorage (for demo purposes)
      const storedDocumentId = localStorage.getItem('currentDocumentId')
      if (storedDocumentId) {
        console.log('🔄 [UI] Loading existing document:', storedDocumentId)
        
        try {
          const result = await getDocumentById(storedDocumentId)
          console.log('📊 [UI] getDocumentById 결과:', result)
          
          if (result.success && result.data) {
            console.log('✅ [UI] 기존 문서 로드 성공:', {
              documentId: result.data.id,
              title: result.data.title,
              signatureAreaCount: result.data.signature_areas.length
            })
            
            setCurrentDocument(result.data)
            
            // Load signature areas from database
            if (result.data.signature_areas && result.data.signature_areas.length > 0) {
              const areas = result.data.signature_areas.map(area => ({
                x: area.x,
                y: area.y,
                width: area.width,
                height: area.height
              }))
              console.log('📥 [UI] 서명 영역 로드:', areas)
              setSignatureAreas(areas)
            }
            
            // Get signed URL for document display
            const signedUrlResult = await getDocumentSignedUrl(result.data.id)
            if (signedUrlResult.success && signedUrlResult.data) {
              console.log('🖼️ [UI] 문서 이미지 URL 로드 성공')
              setDocument(signedUrlResult.data)
            }
          } else {
            console.log('❌ [UI] 기존 문서 로드 실패:', result.error)
            // Clear invalid document ID from storage
            localStorage.removeItem('currentDocumentId')
          }
        } catch (error) {
          console.error('❌ [UI] 기존 문서 로드 예외:', error)
          localStorage.removeItem('currentDocumentId')
        }
      }
    }
    
    loadExistingDocument()
  }, [])

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
    console.log('🚀 [UI] handleUploadDocument 시작')
    
    if (!selectedFile || !documentTitle.trim()) {
      console.error('❌ [UI] 필수 필드 누락:', { hasFile: !!selectedFile, title: documentTitle })
      toast.error(t("upload.missingRequiredFields"))
      return
    }

    console.log('📄 [UI] 업로드 정보:', {
      fileName: selectedFile.name,
      fileSize: selectedFile.size,
      title: documentTitle.trim()
    })

    setIsUploading(true)
    
    try {
      const formData = new FormData()
      formData.append('file', selectedFile)
      formData.append('title', documentTitle.trim())

      console.log('📞 [UI] createDocument 서버 액션 호출 중...')
      const result = await createDocument(formData)
      
      console.log('📊 [UI] 서버 액션 결과:', {
        success: result.success,
        hasData: !!result.data,
        error: result.error
      })
      
      if (result.success && result.data) {
        console.log('✅ [UI] currentDocument 설정:', result.data.id)
        setCurrentDocument(result.data)
        
        // Store document ID for persistence
        localStorage.setItem('currentDocumentId', result.data.id)
        console.log('💾 [UI] 문서 ID localStorage 저장:', result.data.id)
        
        toast.success(t("upload.success"))
      } else {
        console.error('❌ [UI] 업로드 실패:', result.error)
        toast.error(result.error || t("upload.failed"))
      }
    } catch (error) {
      console.error('❌ [UI] 업로드 예외:', error)
      toast.error(t("upload.failed"))
    } finally {
      console.log('🏁 [UI] setIsUploading(false)')
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
    console.log('🎯 [UI] handleAreaSelected 호출됨:', area)
    console.log('📊 [UI] 현재 signatureAreas:', signatureAreas)
    console.log('📄 [UI] currentDocument:', currentDocument?.id)
    
    // 좌표를 정수로 변환 (데이터베이스가 integer 타입이므로)
    const newArea = {
      x: Math.round(area.x),
      y: Math.round(area.y),
      width: Math.round(area.width),
      height: Math.round(area.height),
    }
    console.log('🔢 [UI] 정수 변환된 영역:', newArea)
    
    const newAreas = [
      ...signatureAreas,
      newArea,
    ]
    
    console.log('🔄 [UI] newAreas 로컬 상태에만 설정:', newAreas)
    setSignatureAreas(newAreas)
    setIsSelecting(false)
    
    // 로컬 상태에만 저장, 데이터베이스 저장은 "저장하기" 버튼으로 분리
    console.log('📝 [UI] 서명 영역을 로컬에 임시 저장했습니다. "저장하기" 버튼을 누르면 데이터베이스에 저장됩니다.')
  }

  const handleRemoveArea = async (index: number) => {
    const newAreas = [...signatureAreas]
    newAreas.splice(index, 1)
    setSignatureAreas(newAreas)
    console.log('🗑️ [UI] 서명 영역을 로컬에서 제거했습니다. "저장하기" 버튼을 누르면 데이터베이스에 반영됩니다.')
  }

  const handleSaveSignatureAreas = async () => {
    if (!currentDocument) {
      toast.error(t("upload.uploadFirst"))
      return
    }

    console.log('💾 [UI] 서명 영역 저장 시작:', signatureAreas)
    
    try {
      const result = await saveSignatureAreas(currentDocument.id, signatureAreas)
      console.log('📊 [UI] saveSignatureAreas 결과:', result)
      
      if (result.success) {
        console.log('✅ [UI] 서명 영역 저장 성공!')
        toast.success(t("upload.signatureAreasSaved"))
      } else {
        console.error('❌ [UI] 서명 영역 저장 실패:', result.error)
        toast.error(result.error || t("upload.saveAreasFailed"))
      }
    } catch (error) {
      console.error('❌ [UI] 서명 영역 저장 예외:', error)
      toast.error(t("upload.saveAreasFailed"))
    }
  }

  const handleClearDocument = () => {
    setSelectedFile(null)
    setDocument(null)
    setDocumentTitle("")
    setCurrentDocument(null)
    setSignatureAreas([])
    setIsSelecting(false)
    
    // Clear localStorage
    localStorage.removeItem('currentDocumentId')
    console.log('🗑️ [UI] localStorage 문서 ID 제거')
    
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleOpenSignatureRequest = async () => {
    console.log('🚀 [UI] handleOpenSignatureRequest 시작')
    
    if (!currentDocument || signatureAreas.length === 0) {
      toast.error(t("upload.noSignatureAreas"))
      return
    }

    // 서명 영역이 데이터베이스에 저장되어 있는지 확인하고, 필요시 자동 저장
    console.log('💾 [UI] 서명 영역 자동 저장 확인 중...')
    try {
      const result = await saveSignatureAreas(currentDocument.id, signatureAreas)
      console.log('📊 [UI] 서명 영역 자동 저장 결과:', result)
      
      if (result.success) {
        console.log('✅ [UI] 서명 영역 자동 저장 성공, 다이얼로그 열기')
        setShowSignatureRequestDialog(true)
      } else {
        console.error('❌ [UI] 서명 영역 자동 저장 실패:', result.error)
        toast.error(result.error || t("upload.saveAreasFailed"))
      }
    } catch (error) {
      console.error('❌ [UI] 서명 영역 자동 저장 예외:', error)
      toast.error(t("upload.saveAreasFailed"))
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
                    onClick={() => {
                      console.log('🎯 [DEBUG] Upload button clicked:', {
                        hasSelectedFile: !!selectedFile,
                        documentTitle: documentTitle,
                        documentTitleTrim: documentTitle.trim(),
                        isUploading: isUploading
                      })
                      handleUploadDocument()
                    }}
                    disabled={isUploading || !documentTitle.trim()}
                    className={`${isUploading || !documentTitle.trim() ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
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
              <div ref={documentContainerRef} className="relative">
                <img
                  ref={imageRef}
                  src={document || "/placeholder.svg"}
                  alt={t("upload.documentAlt")}
                  className="w-full h-auto object-contain"
                  draggable="false"
                />
{signatureAreas.map((area, index) => {
                  // Calculate percentage-based positioning if image is loaded
                  if (!imageRef.current) return null
                  
                  const img = imageRef.current
                  const imgNaturalWidth = img.naturalWidth
                  const imgNaturalHeight = img.naturalHeight
                  
                  // Skip if image is not loaded yet
                  if (!imgNaturalWidth || !imgNaturalHeight) return null
                  
                  // Convert pixel values to percentages based on natural image size
                  const leftPercent = (area.x / imgNaturalWidth) * 100
                  const topPercent = (area.y / imgNaturalHeight) * 100
                  const widthPercent = (area.width / imgNaturalWidth) * 100
                  const heightPercent = (area.height / imgNaturalHeight) * 100
                  
                  return (
                    <div
                      key={index}
                      className="absolute border-2 border-red-500 bg-red-500/10 flex items-center justify-center cursor-pointer hover:bg-red-500/20 transition-colors"
                      style={{
                        left: `${leftPercent}%`,
                        top: `${topPercent}%`,
                        width: `${widthPercent}%`,
                        height: `${heightPercent}%`,
                      }}
                      onClick={() => handleRemoveArea(index)}
                      title={t("upload.clickToRemove")}
                    >
                      <span className="text-xs font-medium text-red-600">
                        {t("upload.signature")} {index + 1}
                      </span>
                    </div>
                  )
                })}
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
              {signatureAreas.length > 0 && (
                <Button
                  onClick={handleSaveSignatureAreas}
                  disabled={isSelecting}
                  variant="default"
                >
                  {t("upload.saveSignatureAreas")}
                </Button>
              )}
              <Button
                onClick={handleOpenSignatureRequest}
                disabled={signatureAreas.length === 0}
                className="ml-auto"
              >
                {t("upload.getSignature")}
              </Button>
            </div>
          )}
        </div>
      )}
      
      {/* Signature Request Dialog */}
      {currentDocument && (
        <SignatureRequestDialog
          isOpen={showSignatureRequestDialog}
          onClose={() => setShowSignatureRequestDialog(false)}
          document={currentDocument}
          signatureAreas={signatureAreas}
        />
      )}
    </div>
  )
}
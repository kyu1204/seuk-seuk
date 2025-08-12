"use client"

import { useEffect, useState, useRef, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import SignatureModal from "@/components/signature-modal"
import SignerOnboarding from "@/components/signer-onboarding"
import SubmitConfirmationModal from "@/components/submit-confirmation-modal"
import { Card, CardContent } from "@/components/ui/card"
import { Lock, Loader2, HelpCircle, Send } from "lucide-react"
import { useLanguage } from "@/contexts/language-context"
import LanguageSelector from "@/components/language-selector"
import { toast } from "sonner"
import { 
  getSharedDocument, 
  submitSignature, 
  checkDocumentStatus,
  submitDocument,
  type DocumentWithAreas,
  type SignerInfo 
} from "@/app/actions/signing"

export default function SignPage({ params }: { params: { id: string } }) {
  const { t } = useLanguage()
  const router = useRouter()
  
  // Document state
  const [documentData, setDocumentData] = useState<DocumentWithAreas | null>(null)
  const [documentUrl, setDocumentUrl] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  
  // Password state
  const [requiresPassword, setRequiresPassword] = useState<boolean>(false)
  const [password, setPassword] = useState<string>("")
  const [isCheckingPassword, setIsCheckingPassword] = useState<boolean>(false)
  
  // Signature state
  const [selectedArea, setSelectedArea] = useState<string | null>(null)
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false)
  const [signerInfo, setSignerInfo] = useState<SignerInfo>({})
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false)
  
  
  // Onboarding state
  const [showOnboarding, setShowOnboarding] = useState<boolean>(false)
  const [hasSeenOnboarding, setHasSeenOnboarding] = useState<boolean>(false)
  
  // Submit state
  const [showSubmitModal, setShowSubmitModal] = useState<boolean>(false)
  const [isSubmittingDocument, setIsSubmittingDocument] = useState<boolean>(false)
  
  // Document status
  const [documentStatus, setDocumentStatus] = useState<{
    status: string
    totalAreas: number
    signedAreas: number
    isComplete: boolean
  } | null>(null)
  
  const documentContainerRef = useRef<HTMLDivElement>(null)
  const imageRef = useRef<HTMLImageElement>(null)

  // Load document on mount
  useEffect(() => {
    loadDocument()
  }, [params.id])

  // Check if user has seen onboarding for this session
  useEffect(() => {
    const hasSeenOnboardingKey = `onboarding_seen_${params.id}`
    const hasSeen = sessionStorage.getItem(hasSeenOnboardingKey) === 'true'
    setHasSeenOnboarding(hasSeen)
    
    // Show onboarding if document is loaded and user hasn't seen it
    if (documentData && !hasSeen && !requiresPassword && !error) {
      setShowOnboarding(true)
    }
  }, [params.id, documentData, requiresPassword, error])

  // Check document status periodically
  useEffect(() => {
    if (documentData?.id) {
      const interval = setInterval(() => {
        checkStatus()
      }, 5000) // Check every 5 seconds

      return () => clearInterval(interval)
    }
  }, [documentData?.id])

  const checkStatus = useCallback(async (docId?: string) => {
    const documentId = docId || documentData?.id
    if (!documentId) return

    try {
      const result = await checkDocumentStatus(documentId)
      if (result.success && result.data) {
        setDocumentStatus(result.data)
      }
    } catch (err) {
      console.error('Check status error:', err)
    }
  }, [documentData?.id])

  const loadDocument = useCallback(async (passwordAttempt?: string) => {
    console.log('🔄 [loadDocument] 시작:', {
      shortUrl: params.id,
      hasPasswordAttempt: !!passwordAttempt,
      requiresPassword,
      currentPassword: password
    })
    
    setIsLoading(true)
    setError(null)
    
    try {
      const result = await getSharedDocument(params.id, passwordAttempt)
      console.log('📊 [loadDocument] getSharedDocument 결과:', {
        success: result.success,
        requiresPassword: result.requiresPassword,
        hasData: !!result.data,
        error: result.error,
        isSubmitted: result.isSubmitted
      })
      
      if (!result.success) {
        if (result.requiresPassword) {
          setRequiresPassword(true)
          setIsLoading(false)
          if (passwordAttempt) {
            console.log('❌ [loadDocument] 비밀번호 인증 실패')
            toast.error(result.error || t("sign.invalidPassword"))
          }
          return
        }

        // Handle submitted document
        if (result.isSubmitted) {
          setError(result.error || t("submit.submitted"))
          setIsLoading(false)
          return
        }
        
        setError(result.error || t("sign.documentNotFound"))
        setIsLoading(false)
        return
      }

      if (result.data) {
        console.log('✅ [loadDocument] 문서 로드 성공, 비밀번호 상태 업데이트')
        // Password authentication was successful - save the password and clear the requirement
        if (passwordAttempt) {
          setPassword(passwordAttempt)
        }
        setRequiresPassword(false)
        
        setDocumentData(result.data)
        setDocumentUrl(result.data.signedUrl)
        await checkStatus(result.data.id)
      }
    } catch (err) {
      console.error('❌ [loadDocument] 예외:', err)
      setError(t("sign.loadError"))
    } finally {
      setIsLoading(false)
    }
  }, [params.id, requiresPassword, password, t, checkStatus])

  const handlePasswordSubmit = useCallback(async () => {
    console.log('🔐 [handlePasswordSubmit] 시작:', {
      passwordState: password,
      passwordLength: password.length,
      trimmedPassword: password.trim(),
      trimmedLength: password.trim().length
    })
    
    if (!password.trim()) {
      console.log('❌ [handlePasswordSubmit] 비밀번호가 비어있음')
      toast.error(t("sign.passwordRequired"))
      return
    }

    setIsCheckingPassword(true)
    console.log('🚀 [handlePasswordSubmit] loadDocument 호출:', password.trim())
    await loadDocument(password.trim())
    setIsCheckingPassword(false)
  }, [password, t, loadDocument])

  const handleAreaClick = (areaId: string) => {
    // Check if area is already signed
    const isAlreadySigned = documentData?.signatures?.some(
      sig => sig.signature_area_id === areaId
    )
    
    if (isAlreadySigned) {
      toast.info(t("sign.alreadySigned"))
      return
    }

    setSelectedArea(areaId)
    setIsModalOpen(true)
  }

  const handleSignatureComplete = async (signatureData: string, updatedSignerInfo: SignerInfo) => {
    if (!documentData || !selectedArea) return

    setIsSubmitting(true)
    
    try {
      console.log('🚀 [SignPage] handleSignatureComplete 시작:', {
        documentId: documentData.id,
        selectedArea,
        signerInfo: updatedSignerInfo
      })
      
      // Update signer info if it was changed in the modal
      setSignerInfo(updatedSignerInfo)
      
      const result = await submitSignature(
        documentData.id,
        selectedArea,
        signatureData,
        updatedSignerInfo
      )

      if (result.success) {
        console.log('✅ [SignPage] 서명 제출 성공')
        toast.success(t("sign.signatureSubmitted"))
        setIsModalOpen(false)
        setSelectedArea(null)
        
        // Reload document to get updated signatures
        // Pass the current password (if any) for reload
        console.log('🔄 [SignPage] 문서 재로드 시작 (비밀번호 있음:', !!password, ')')
        await loadDocument(password || undefined)
        await checkStatus()
      } else {
        console.error('❌ [SignPage] 서명 제출 실패:', result.error)
        toast.error(result.error || t("sign.signatureError"))
      }
    } catch (err) {
      console.error('❌ [SignPage] 서명 제출 예외:', err)
      toast.error(t("sign.signatureError"))
    } finally {
      setIsSubmitting(false)
    }
  }


  // Onboarding handlers
  const handleOnboardingStart = () => {
    const hasSeenOnboardingKey = `onboarding_seen_${params.id}`
    sessionStorage.setItem(hasSeenOnboardingKey, 'true')
    setHasSeenOnboarding(true)
    setShowOnboarding(false)
  }

  const handleOnboardingClose = () => {
    const hasSeenOnboardingKey = `onboarding_seen_${params.id}`
    sessionStorage.setItem(hasSeenOnboardingKey, 'true')
    setHasSeenOnboarding(true)
    setShowOnboarding(false)
  }

  const handleShowOnboarding = () => {
    setShowOnboarding(true)
  }

  // Submit handlers
  const handleShowSubmitModal = () => {
    setShowSubmitModal(true)
  }

  const handleCloseSubmitModal = () => {
    setShowSubmitModal(false)
  }

  const handleSubmitDocument = async () => {
    if (!documentData) return

    setIsSubmittingDocument(true)
    
    try {
      console.log('🚀 [handleSubmitDocument] 문서 제출 시작:', {
        documentId: documentData.id,
        signerInfo
      })
      
      const result = await submitDocument(documentData.id, signerInfo)

      if (result.success) {
        console.log('✅ [handleSubmitDocument] 문서 제출 성공')
        toast.success(t("submit.success"))
        setShowSubmitModal(false)
        
        // Redirect to a success page or show success state
        setTimeout(() => {
          router.push("/")
        }, 2000)
      } else {
        console.error('❌ [handleSubmitDocument] 문서 제출 실패:', result.error)
        toast.error(result.error || t("submit.error"))
      }
    } catch (err) {
      console.error('❌ [handleSubmitDocument] 제출 중 예외:', err)
      toast.error(t("submit.error"))
    } finally {
      setIsSubmittingDocument(false)
    }
  }

  const handleSignerInfoChange = (updatedInfo: SignerInfo) => {
    setSignerInfo(updatedInfo)
  }

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-16 flex justify-center items-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>{t("sign.loading")}</p>
        </div>
      </div>
    )
  }

  if (requiresPassword) {
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-md mx-auto">
          <Card>
            <CardContent className="p-6">
              <div className="text-center mb-6">
                <Lock className="h-12 w-12 text-primary mx-auto mb-4" />
                <h2 className="text-2xl font-semibold mb-2">{t("sign.passwordRequired")}</h2>
                <p className="text-muted-foreground">{t("sign.passwordRequiredDesc")}</p>
              </div>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="password">{t("sign.password")}</Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => {
                      console.log('⌨️ [Input] 비밀번호 입력:', {
                        inputValue: e.target.value,
                        inputLength: e.target.value.length
                      })
                      setPassword(e.target.value)
                    }}
                    onKeyDown={(e) => e.key === 'Enter' && handlePasswordSubmit()}
                    placeholder={t("sign.enterPassword")}
                  />
                </div>
                <Button 
                  onClick={handlePasswordSubmit}
                  disabled={isCheckingPassword || !password.trim()}
                  className="w-full"
                >
                  {isCheckingPassword && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {isCheckingPassword ? t("sign.checking") : t("sign.submit")}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-16">
        <Card>
          <CardContent className="p-6">
            <div className="text-center py-8">
              <h2 className="text-2xl font-semibold mb-4">{t("sign.notFound")}</h2>
              <p className="text-muted-foreground mb-6">{error}</p>
              <Button onClick={() => router.push("/")}>{t("sign.returnHome")}</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!documentData || !documentUrl) {
    return (
      <div className="container mx-auto px-4 py-16">
        <Card>
          <CardContent className="p-6">
            <div className="text-center py-8">
              <h2 className="text-2xl font-semibold mb-4">{t("sign.notFound")}</h2>
              <p className="text-muted-foreground mb-6">{t("sign.notFoundDesc")}</p>
              <Button onClick={() => router.push("/")}>{t("sign.returnHome")}</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h1 className="text-3xl font-bold mb-2">{documentData.title}</h1>
          <p className="text-muted-foreground">{t("sign.clickAreas")}</p>
          {documentStatus && (
            <p className="text-sm text-muted-foreground mt-1">
              {t("sign.progress", {
                signed: documentStatus.signedAreas.toString(),
                total: documentStatus.totalAreas.toString()
              })}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          {hasSeenOnboarding && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleShowOnboarding}
              className="gap-2 min-h-[44px] px-4"
              style={{ touchAction: "manipulation" }}
            >
              <HelpCircle className="h-4 w-4" />
              {t("signer.onboarding.title") || "가이드"}
            </Button>
          )}
          <LanguageSelector />
        </div>
      </div>


      {/* Document with signature areas */}
      <div className="relative border rounded-lg overflow-hidden mb-6">
        <div 
          ref={documentContainerRef} 
          className="relative" 
          style={{
            WebkitOverflowScrolling: "touch", // Smooth scrolling on iOS
            touchAction: "pan-x pan-y" // Allow panning but prevent zooming
          }}
        >
          <img
            ref={imageRef}
            src={documentUrl}
            alt={t("sign.documentAlt")}
            className="w-full h-auto object-contain"
            draggable="false"
            style={{ userSelect: "none" }}
          />

{documentData.signature_areas.map((area) => {
            const isSigned = documentData.signatures?.some(sig => sig.signature_area_id === area.id)
            
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
            
            // Ensure minimum touch target size (convert to percentage)
            const minTouchTargetPercent = (44 / imgNaturalWidth) * 100
            const adjustedWidthPercent = Math.max(widthPercent, minTouchTargetPercent)
            const adjustedHeightPercent = Math.max(heightPercent, minTouchTargetPercent)
            
            // Center the touch target if it's larger than the original area
            const xOffsetPercent = widthPercent < minTouchTargetPercent ? (widthPercent - adjustedWidthPercent) / 2 : 0
            const yOffsetPercent = heightPercent < minTouchTargetPercent ? (heightPercent - adjustedHeightPercent) / 2 : 0

            return (
              <div
                key={area.id}
                className={`absolute cursor-pointer transition-all active:scale-95 ${
                  isSigned
                    ? "border-2 border-green-500 bg-green-500/10 hover:bg-green-500/20"
                    : "border-2 border-red-500 bg-red-500/10 animate-pulse hover:bg-red-500/20 active:bg-red-500/30"
                }`}
                style={{
                  left: `${leftPercent + xOffsetPercent}%`,
                  top: `${topPercent + yOffsetPercent}%`,
                  width: `${adjustedWidthPercent}%`,
                  height: `${adjustedHeightPercent}%`,
                  minWidth: "44px",
                  minHeight: "44px",
                  touchAction: "manipulation"
                }}
                onClick={() => handleAreaClick(area.id)}
                onTouchStart={() => {}} // Ensure touch events are properly handled
                title={isSigned ? t("sign.signedArea") : t("sign.clickToSign")}
              >
                {isSigned ? (
                  <div className="w-full h-full flex items-center justify-center">
                    <div className="bg-green-600 text-white px-2 py-1 rounded text-xs font-medium shadow-sm">
                      ✓ {t("sign.signed")}
                    </div>
                  </div>
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <span className="text-xs font-medium text-red-600 bg-white/90 px-2 py-1 rounded shadow-sm border border-red-200">
                      {t("sign.clickToSign")}
                    </span>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex justify-end gap-2">
        <Button 
          onClick={handleShowSubmitModal} 
          disabled={isSubmittingDocument}
          variant="default"
          className="gap-2 min-h-[44px] px-6 text-base font-medium"
          style={{ touchAction: "manipulation" }}
        >
          <Send className="h-5 w-5" />
          {t("submit.document") || "문서 제출"}
        </Button>
      </div>

      {/* Status indicator */}
      {documentStatus && (
        <div className={`mt-4 p-4 border rounded-md ${
          documentStatus.isComplete 
            ? "bg-green-50 border-green-200" 
            : "bg-blue-50 border-blue-200"
        }`}>
          <p className={`text-sm ${
            documentStatus.isComplete ? "text-green-800" : "text-blue-800"
          }`}>
            {documentStatus.isComplete ? (
              t("submit.documentComplete") || "모든 서명이 완료되어 문서를 제출할 수 있습니다"
            ) : (
              t("sign.completionStatus", {
                signed: documentStatus.signedAreas.toString(),
                total: documentStatus.totalAreas.toString()
              })
            )}
          </p>
        </div>
      )}

      {/* Signature Modal */}
      {isModalOpen && selectedArea && (
        <SignatureModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false)
            setSelectedArea(null)
          }}
          onComplete={handleSignatureComplete}
          signerInfo={signerInfo}
          onSignerInfoChange={handleSignerInfoChange}
          isSubmitting={isSubmitting}
        />
      )}


      {/* Signer Onboarding Modal */}
      <SignerOnboarding
        isOpen={showOnboarding}
        onClose={handleOnboardingClose}
        onStart={handleOnboardingStart}
        documentTitle={documentData.title}
        totalSignatureAreas={documentData.signature_areas.length}
      />

      {/* Submit Confirmation Modal */}
      <SubmitConfirmationModal
        isOpen={showSubmitModal}
        onClose={handleCloseSubmitModal}
        onConfirm={handleSubmitDocument}
        isSubmitting={isSubmittingDocument}
        documentTitle={documentData.title}
        signatureCount={documentStatus?.signedAreas || 0}
        totalAreas={documentStatus?.totalAreas || 0}
      />
    </div>
  )
}
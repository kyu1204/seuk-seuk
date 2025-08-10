"use client"

import { useEffect, useState, useRef, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import SignatureModal from "@/components/signature-modal"
import { Card, CardContent } from "@/components/ui/card"
import { Download, RefreshCw, Lock, Loader2 } from "lucide-react"
import { useLanguage } from "@/contexts/language-context"
import LanguageSelector from "@/components/language-selector"
import { toast } from "sonner"
import { 
  getSharedDocument, 
  submitSignature, 
  generateFinalDocument, 
  checkDocumentStatus,
  type DocumentWithAreas 
} from "@/app/actions/signing"

interface SignerInfo {
  name?: string
  email?: string
}

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
  
  // Document generation state
  const [isGenerating, setIsGenerating] = useState<boolean>(false)
  const [signedDocumentUrl, setSignedDocumentUrl] = useState<string | null>(null)
  const [showDownloadModal, setShowDownloadModal] = useState<boolean>(false)
  
  // Document status
  const [documentStatus, setDocumentStatus] = useState<{
    status: string
    totalAreas: number
    signedAreas: number
    isComplete: boolean
  } | null>(null)
  
  const documentContainerRef = useRef<HTMLDivElement>(null)

  // Load document on mount
  useEffect(() => {
    loadDocument()
  }, [params.id])

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
        error: result.error
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

  const handleSignatureComplete = async (signatureData: string) => {
    if (!documentData || !selectedArea) return

    setIsSubmitting(true)
    
    try {
      console.log('🚀 [SignPage] handleSignatureComplete 시작:', {
        documentId: documentData.id,
        selectedArea,
        signerInfo
      })
      
      const result = await submitSignature(
        documentData.id,
        selectedArea,
        signatureData,
        signerInfo
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

  const handleGenerateDocument = async () => {
    if (!documentData || !documentStatus?.isComplete) return

    setIsGenerating(true)
    
    try {
      const result = await generateFinalDocument(documentData.id)
      
      if (result.success && result.data) {
        setSignedDocumentUrl(result.data.downloadUrl)
        setShowDownloadModal(true)
        toast.success(t("sign.documentGenerated"))
      } else {
        toast.error(result.error || t("sign.generationError"))
      }
    } catch (err) {
      console.error('Generate document error:', err)
      toast.error(t("sign.generationError"))
    } finally {
      setIsGenerating(false)
    }
  }

  const handleDownload = () => {
    if (!signedDocumentUrl || !documentData) return

    try {
      const link = document.createElement("a")
      link.href = signedDocumentUrl
      link.download = `signed_${documentData.title}.png`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      toast.success(t("sign.downloadStarted"))
    } catch (err) {
      console.error('Download error:', err)
      toast.error(t("sign.downloadError"))
    }
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
        <LanguageSelector />
      </div>

      {/* Signer Info Form */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="signer-name">{t("sign.signerName")}</Label>
              <Input
                id="signer-name"
                value={signerInfo.name || ""}
                onChange={(e) => setSignerInfo(prev => ({ ...prev, name: e.target.value }))}
                placeholder={t("sign.signerNamePlaceholder")}
              />
            </div>
            <div>
              <Label htmlFor="signer-email">{t("sign.signerEmail")}</Label>
              <Input
                id="signer-email"
                type="email"
                value={signerInfo.email || ""}
                onChange={(e) => setSignerInfo(prev => ({ ...prev, email: e.target.value }))}
                placeholder={t("sign.signerEmailPlaceholder")}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Document with signature areas */}
      <div className="relative border rounded-lg overflow-hidden mb-6">
        <div ref={documentContainerRef} className="relative overflow-auto" style={{ maxHeight: "70vh" }}>
          <img
            src={documentUrl}
            alt={t("sign.documentAlt")}
            className="w-full h-auto object-contain"
            draggable="false"
            style={{ userSelect: "none" }}
          />

          {documentData.signature_areas.map((area) => {
            const isSigned = documentData.signatures?.some(sig => sig.signature_area_id === area.id)

            return (
              <div
                key={area.id}
                className={`absolute cursor-pointer transition-all ${
                  isSigned
                    ? "border-2 border-green-500 bg-green-500/10"
                    : "border-2 border-red-500 bg-red-500/10 animate-pulse hover:bg-red-500/20"
                }`}
                style={{
                  left: `${area.x}px`,
                  top: `${area.y}px`,
                  width: `${area.width}px`,
                  height: `${area.height}px`,
                }}
                onClick={() => handleAreaClick(area.id)}
                title={isSigned ? t("sign.signedArea") : t("sign.clickToSign")}
              >
                {isSigned ? (
                  <div className="w-full h-full flex items-center justify-center">
                    <div className="bg-green-600 text-white px-2 py-1 rounded text-xs font-medium">
                      ✓ {t("sign.signed")}
                    </div>
                  </div>
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <span className="text-xs font-medium text-red-600 bg-white/80 px-2 py-1 rounded">
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
          onClick={handleGenerateDocument} 
          disabled={!documentStatus?.isComplete || isGenerating}
          variant={documentStatus?.isComplete ? "default" : "secondary"}
        >
          {isGenerating ? (
            <>
              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              {t("sign.generating")}
            </>
          ) : (
            <>
              <Download className="mr-2 h-4 w-4" />
              {t("sign.downloadDocument")}
            </>
          )}
        </Button>
      </div>

      {/* Status indicator */}
      {documentStatus && !documentStatus.isComplete && (
        <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-md">
          <p className="text-blue-800 text-sm">
            {t("sign.completionStatus", {
              signed: documentStatus.signedAreas.toString(),
              total: documentStatus.totalAreas.toString()
            })}
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
          isSubmitting={isSubmitting}
        />
      )}

      {/* Download Modal */}
      {showDownloadModal && signedDocumentUrl && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-auto">
            <h2 className="text-2xl font-bold mb-4">{t("sign.signedDocument")}</h2>

            <div className="border rounded-lg overflow-hidden mb-4">
              <img
                src={signedDocumentUrl}
                alt={t("sign.signedDocumentAlt")}
                className="max-w-full h-auto"
                style={{ maxWidth: "100%" }}
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowDownloadModal(false)}>
                {t("sign.close")}
              </Button>
              <Button onClick={handleDownload}>
                <Download className="mr-2 h-4 w-4" />
                {t("sign.download")}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
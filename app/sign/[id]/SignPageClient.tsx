'use client'

import { useEffect, useState, useRef } from "react"
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
import { validateDocumentShare } from "@/app/actions/sharing"
import { 
  submitSignature, 
  generateFinalDocument, 
  checkDocumentStatus,
  type DocumentWithAreas 
} from "@/app/actions/signing"
import { useDocumentRealtime } from "@/lib/realtime-client"

interface SignerInfo {
  name?: string
  email?: string
}

interface SignPageClientProps {
  shortUrl: string
  initialData?: {
    document: DocumentWithAreas
    signedUrl: string
    shareId: string
  }
  requiresPassword?: boolean
  error?: string
}

export default function SignPageClient({ 
  shortUrl, 
  initialData, 
  requiresPassword: initialRequiresPassword, 
  error: initialError 
}: SignPageClientProps) {
  const { t } = useLanguage()
  const router = useRouter()
  
  // Document state
  const [documentData, setDocumentData] = useState<DocumentWithAreas | null>(initialData?.document || null)
  const [documentUrl, setDocumentUrl] = useState<string | null>(initialData?.signedUrl || null)
  const [shareId] = useState<string | null>(initialData?.shareId || null)
  const [isLoading, setIsLoading] = useState<boolean>(!initialData && !initialRequiresPassword && !initialError)
  const [error, setError] = useState<string | null>(initialError || null)
  
  // Password state
  const [requiresPassword, setRequiresPassword] = useState<boolean>(initialRequiresPassword || false)
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
  
  // Realtime integration
  const realtime = useDocumentRealtime(documentData?.id || null)

  // Set up realtime subscriptions when we have document data
  useEffect(() => {
    if (!documentData?.id) return

    // Subscribe to real-time document status updates
    const unsubscribe = realtime.subscribeToDocument((status) => {
      console.log('Realtime status update:', status)
      setDocumentStatus({
        status: status.isComplete ? 'completed' : 'in_progress',
        totalAreas: status.totalAreas,
        signedAreas: status.signedAreas,
        isComplete: status.isComplete
      })

      // Show toast for new signatures
      if (status.lastSignature && status.signedAreas > (documentStatus?.signedAreas || 0)) {
        const signerName = status.lastSignature.signer_name || 'Someone'
        toast.success(`${signerName} signed the document`, {
          description: `Progress: ${status.signedAreas}/${status.totalAreas} signatures`
        })
      }

      // Auto-refresh page data when document is complete
      if (status.isComplete && !documentStatus?.isComplete) {
        toast.success('All signatures completed! Document is ready for download.')
      }
    })

    return unsubscribe
  }, [documentData?.id, documentStatus?.signedAreas])

  // Cleanup realtime connection on unmount
  useEffect(() => {
    return () => {
      realtime.disconnect()
    }
  }, [])

  const loadDocumentWithPassword = async (passwordAttempt: string) => {
    setIsCheckingPassword(true)
    setError(null)
    
    try {
      // Get user agent and IP for audit logging
      const userAgent = navigator.userAgent
      const result = await validateDocumentShare(shortUrl, passwordAttempt, userAgent)
      
      if (!result.success) {
        if (result.requiresPassword) {
          setRequiresPassword(true)
          setError(result.error || t("sign.invalidPassword"))
        } else {
          setError(result.error || t("sign.documentNotFound"))
        }
        return
      }

      if (result.data) {
        setDocumentData(result.data.document)
        setDocumentUrl(result.data.signedUrl)
        setRequiresPassword(false)
        // Initial status will be handled by realtime subscription
      }
    } catch (err) {
      console.error('Load document error:', err)
      setError(t("sign.loadError"))
    } finally {
      setIsCheckingPassword(false)
    }
  }

  const checkStatus = async (docId?: string) => {
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
  }

  const handlePasswordSubmit = async () => {
    if (!password.trim()) {
      toast.error(t("sign.passwordRequired"))
      return
    }

    await loadDocumentWithPassword(password.trim())
  }

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
      const result = await submitSignature(
        documentData.id,
        selectedArea,
        signatureData,
        signerInfo
      )

      if (result.success) {
        toast.success(t("sign.signatureSubmitted"))
        setIsModalOpen(false)
        setSelectedArea(null)
        
        // Refresh the page to get updated data
        router.refresh()
      } else {
        toast.error(result.error || t("sign.signatureError"))
      }
    } catch (err) {
      console.error('Submit signature error:', err)
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

  // Loading state
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

  // Error state
  if (error && !requiresPassword) {
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-md mx-auto text-center">
          <h2 className="text-2xl font-semibold mb-4 text-destructive">{t("sign.error")}</h2>
          <p className="text-muted-foreground mb-6">{error}</p>
          <Button onClick={() => router.push('/')} variant="outline">
            {t("sign.goHome")}
          </Button>
        </div>
      </div>
    )
  }

  // Password required state
  if (requiresPassword) {
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="fixed top-4 right-4">
          <LanguageSelector />
        </div>
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
                    onChange={(e) => setPassword(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handlePasswordSubmit()}
                    placeholder={t("sign.passwordPlaceholder")}
                    disabled={isCheckingPassword}
                  />
                </div>
                {error && (
                  <p className="text-sm text-destructive">{error}</p>
                )}
                <Button 
                  onClick={handlePasswordSubmit} 
                  className="w-full"
                  disabled={isCheckingPassword}
                >
                  {isCheckingPassword && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {t("sign.submit")}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  // Main signing interface
  if (!documentData || !documentUrl) {
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-md mx-auto text-center">
          <h2 className="text-2xl font-semibold mb-4">{t("sign.noDocument")}</h2>
          <Button onClick={() => router.push('/')} variant="outline">
            {t("sign.goHome")}
          </Button>
        </div>
      </div>
    )
  }

  const isSigned = (areaId: string) => {
    return documentData.signatures?.some(sig => sig.signature_area_id === areaId) || false
  }

  const isComplete = documentStatus?.isComplete || false
  const total = documentStatus?.totalAreas || documentData.signature_areas?.length || 0
  const signed = documentStatus?.signedAreas || documentData.signatures?.length || 0

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold">{documentData.title}</h1>
              <div className="flex items-center space-x-4 mt-2 text-sm text-muted-foreground">
                <span>{t("sign.progress")}: {signed}/{total}</span>
                <div className="flex items-center space-x-2">
                  <div className="w-20 bg-muted rounded-full h-2">
                    <div
                      className="bg-primary h-2 rounded-full transition-all"
                      style={{ width: `${total > 0 ? (signed / total) * 100 : 0}%` }}
                    />
                  </div>
                  <span>{total > 0 ? Math.round((signed / total) * 100) : 0}%</span>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              {isComplete && (
                <Button
                  onClick={handleGenerateDocument}
                  disabled={isGenerating}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {isGenerating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  <Download className="mr-2 h-4 w-4" />
                  {t("sign.generateDocument")}
                </Button>
              )}
              <Button
                onClick={() => checkStatus()}
                variant="outline"
                size="sm"
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
              <LanguageSelector />
            </div>
          </div>
        </div>
      </div>

      {/* Document viewer */}
      <div className="container mx-auto px-4 py-8">
        <div className="relative inline-block" ref={documentContainerRef}>
          <img
            src={documentUrl}
            alt={documentData.title}
            className="max-w-full h-auto border rounded-lg shadow-lg"
            style={{ maxHeight: '80vh' }}
          />
          
          {/* Signature areas overlay */}
          {documentData.signature_areas?.map((area) => {
            const signed = isSigned(area.id)
            return (
              <button
                key={area.id}
                onClick={() => handleAreaClick(area.id)}
                className={`absolute border-2 border-dashed transition-all duration-200 ${
                  signed 
                    ? 'border-green-500 bg-green-500/10 cursor-default' 
                    : 'border-primary bg-primary/10 hover:bg-primary/20 cursor-pointer'
                }`}
                style={{
                  left: area.x,
                  top: area.y,
                  width: area.width,
                  height: area.height,
                }}
                disabled={signed}
                title={signed ? t("sign.alreadySigned") : t("sign.clickToSign")}
              >
                {signed && (
                  <div className="flex items-center justify-center h-full">
                    <span className="text-green-700 font-medium text-sm">
                      ✓ {t("sign.signed")}
                    </span>
                  </div>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* Signature Modal */}
      {selectedArea && (
        <SignatureModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onComplete={handleSignatureComplete}
        />
      )}

      {/* Download Modal */}
      {showDownloadModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md mx-4">
            <CardContent className="p-6">
              <div className="text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Download className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="text-xl font-semibold mb-2">{t("sign.documentReady")}</h3>
                <p className="text-muted-foreground mb-6">{t("sign.documentReadyDesc")}</p>
                <div className="flex space-x-3">
                  <Button
                    onClick={handleDownload}
                    className="flex-1"
                  >
                    <Download className="mr-2 h-4 w-4" />
                    {t("sign.download")}
                  </Button>
                  <Button
                    onClick={() => setShowDownloadModal(false)}
                    variant="outline"
                    className="flex-1"
                  >
                    {t("sign.close")}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
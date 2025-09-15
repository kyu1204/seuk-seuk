"use client"

import { useEffect, useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import SignatureModal from "@/components/signature-modal"
import { Card, CardContent } from "@/components/ui/card"
import { Download, RefreshCw } from "lucide-react"
import { useLanguage } from "@/contexts/language-context"
import LanguageSelector from "@/components/language-selector"

interface DocumentData {
  image: string
  areas: Array<{ x: number; y: number; width: number; height: number }>
  fileName: string
  signatures?: Array<{ areaIndex: number; signature: string }>
}

export default function SignPage({ params }: { params: { id: string } }) {
  const { t } = useLanguage()
  const router = useRouter()
  const [documentData, setDocumentData] = useState<DocumentData | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [selectedArea, setSelectedArea] = useState<number | null>(null)
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false)
  const [isGenerating, setIsGenerating] = useState<boolean>(false)
  const [signedImageUrl, setSignedImageUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [showDownloadModal, setShowDownloadModal] = useState<boolean>(false)
  const documentContainerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // In a real app, you would fetch the document data from an API
    // using the ID from params. For this demo, we'll use localStorage.
    try {
      const storedData = localStorage.getItem("documentToSign")
      if (storedData) {
        const parsedData = JSON.parse(storedData) as DocumentData
        setDocumentData(parsedData)
      }
    } catch (error) {
      console.error("Error loading document:", error)
    } finally {
      setIsLoading(false)
    }
  }, [params.id])

  const handleAreaClick = (index: number) => {
    setSelectedArea(index)
    setIsModalOpen(true)
  }

  const handleSignatureComplete = (signatureData: string) => {
    if (documentData && selectedArea !== null) {
      const updatedData = { ...documentData }
      if (!updatedData.signatures) {
        updatedData.signatures = []
      }

      // Add or update signature
      const existingIndex = updatedData.signatures.findIndex((s) => s.areaIndex === selectedArea)
      if (existingIndex >= 0) {
        updatedData.signatures[existingIndex].signature = signatureData
      } else {
        updatedData.signatures.push({
          areaIndex: selectedArea,
          signature: signatureData,
        })
      }

      setDocumentData(updatedData)
      localStorage.setItem("documentToSign", JSON.stringify(updatedData))
      setIsModalOpen(false)
    }
  }

  const handleGenerateDocument = async () => {
    if (!documentData || !documentData.signatures || isGenerating) return

    setIsGenerating(true)
    setError(null)

    try {
      // Get the current document container dimensions
      if (!documentContainerRef.current) {
        throw new Error("Document container not found")
      }

      const docImage = documentContainerRef.current.querySelector("img")
      if (!docImage) {
        throw new Error("Document image not found")
      }

      // Get the natural dimensions of the document image
      const naturalWidth = (docImage as HTMLImageElement).naturalWidth
      const naturalHeight = (docImage as HTMLImageElement).naturalHeight

      // Get the displayed dimensions
      const displayedWidth = docImage.clientWidth
      const displayedHeight = docImage.clientHeight

      // Calculate the scale ratio between natural and displayed size
      const scaleX = naturalWidth / displayedWidth
      const scaleY = naturalHeight / displayedHeight

      // Create a new image element with the original document
      const originalImage = new Image()
      originalImage.crossOrigin = "anonymous"

      // Wait for the original image to load
      await new Promise((resolve, reject) => {
        originalImage.onload = resolve
        originalImage.onerror = reject
        originalImage.src = documentData.image
      })

      // Create a canvas with the original image dimensions
      const canvas = document.createElement("canvas")
      canvas.width = originalImage.naturalWidth
      canvas.height = originalImage.naturalHeight
      const ctx = canvas.getContext("2d")

      if (!ctx) {
        throw new Error("Could not get canvas context")
      }

      // Draw the original document
      ctx.drawImage(originalImage, 0, 0)

      // Draw each signature at the correct position
      for (const signature of documentData.signatures) {
        if (signature.areaIndex === undefined) continue

        const area = documentData.areas[signature.areaIndex]
        if (!area) continue

        // Create a new image for the signature
        const signatureImage = new Image()
        signatureImage.crossOrigin = "anonymous"

        // Wait for the signature image to load
        await new Promise((resolve, reject) => {
          signatureImage.onload = resolve
          signatureImage.onerror = reject
          signatureImage.src = signature.signature
        })

        // Calculate the actual position and size in the original image
        const actualX = area.x * scaleX
        const actualY = area.y * scaleY
        const actualWidth = area.width * scaleX
        const actualHeight = area.height * scaleY

        // Calculate the signature's aspect ratio
        const signatureAspectRatio = signatureImage.width / signatureImage.height

        // Calculate dimensions that maintain the signature's aspect ratio
        // while fitting within the designated area
        let drawWidth,
          drawHeight,
          offsetX = 0,
          offsetY = 0

        const areaAspectRatio = actualWidth / actualHeight

        if (signatureAspectRatio > areaAspectRatio) {
          // Signature is wider than the area (relative to height)
          drawWidth = actualWidth
          drawHeight = drawWidth / signatureAspectRatio
          offsetY = (actualHeight - drawHeight) / 2 // Center vertically
        } else {
          // Signature is taller than the area (relative to width)
          drawHeight = actualHeight
          drawWidth = drawHeight * signatureAspectRatio
          offsetX = (actualWidth - drawWidth) / 2 // Center horizontally
        }

        // Draw the signature at the correct position and size, maintaining aspect ratio
        ctx.drawImage(signatureImage, actualX + offsetX, actualY + offsetY, drawWidth, drawHeight)
      }

      // Convert to data URL
      const dataUrl = canvas.toDataURL("image/png")

      // Set the signed image URL and show download modal
      setSignedImageUrl(dataUrl)
      setShowDownloadModal(true)
    } catch (err) {
      console.error("Error generating signed document:", err)
      setError(err instanceof Error ? err.message : "Failed to generate signed document")
    } finally {
      setIsGenerating(false)
    }
  }

  // Handle download
  const handleDownload = () => {
    if (!signedImageUrl || !documentData) return

    try {
      const link = document.createElement("a")
      link.href = signedImageUrl

      // Use the original filename if available
      const filename = documentData.fileName
        ? `signed_${documentData.fileName.replace(/\.[^/.]+$/, "")}.png`
        : "signed_document.png"

      link.download = filename
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } catch (err) {
      console.error("Error downloading document:", err)
      setError("Failed to download document")
    }
  }

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-16 flex justify-center">
        <p>{t("sign.loading")}</p>
      </div>
    )
  }

  if (!documentData) {
    return (
      <div className="container mx-auto px-4 py-16">
        <Card>
          <CardContent className="p-6">
            <div className="text-center py-8">
              <h2 className="text-2xl font-semibold mb-4">{t("sign.notFound")}</h2>
              <p className="text-muted-foreground mb-6">{t("sign.notFoundDesc")}</p>
              <Button onClick={() => router.push("/dashboard")}>{t("sign.returnHome")}</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const allAreasSigned =
    documentData.signatures &&
    documentData.areas.every((_, index) => documentData.signatures!.some((s) => s.areaIndex === index))

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-end mb-4">
        <LanguageSelector />
      </div>
      <div className="max-w-5xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">{documentData.fileName}</h1>
          <p className="text-muted-foreground">{t("sign.clickAreas")}</p>
        </div>

        <div className="relative border rounded-lg overflow-hidden mb-6">
          <div ref={documentContainerRef} className="relative overflow-auto" style={{ maxHeight: "70vh" }}>
            <img
              src={documentData.image || "/placeholder.svg"}
              alt="Document"
              className="w-full h-auto object-contain"
              draggable="false"
              style={{ userSelect: "none" }}
            />

            {documentData.areas.map((area, index) => {
              const isSigned = documentData.signatures?.some((s) => s.areaIndex === index)

              return (
                <div
                  key={index}
                  className={`absolute cursor-pointer ${
                    isSigned
                      ? "border-green-500 bg-green-500/10"
                      : "border-2 border-red-500 bg-red-500/10 animate-pulse"
                  }`}
                  style={{
                    left: `${area.x}px`,
                    top: `${area.y}px`,
                    width: `${area.width}px`,
                    height: `${area.height}px`,
                  }}
                  onClick={() => handleAreaClick(index)}
                >
                  {isSigned ? (
                    <div className="w-full h-full relative">
                      <img
                        src={
                          documentData.signatures!.find((s) => s.areaIndex === index)!.signature || "/placeholder.svg"
                        }
                        alt="Signature"
                        className="w-full h-full object-contain"
                      />
                    </div>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <span className="text-xs font-medium text-red-600">{t("sign.clickToSign")}</span>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button onClick={handleGenerateDocument} disabled={!allAreasSigned || isGenerating}>
            {isGenerating ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                {t("sign.generating")}
              </>
            ) : (
              <>
                <Download className="mr-2 h-4 w-4" />
                {t("sign.saveDocument")}
              </>
            )}
          </Button>
        </div>

        {error && <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md text-red-600">{error}</div>}
      </div>

      {isModalOpen && selectedArea !== null && (
        <SignatureModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onComplete={handleSignatureComplete}
          existingSignature={documentData.signatures?.find((s) => s.areaIndex === selectedArea)?.signature}
        />
      )}

      {/* Download Modal */}
      {showDownloadModal && signedImageUrl && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-auto">
            <h2 className="text-2xl font-bold mb-4">{t("sign.signedDocument")}</h2>

            <div className="border rounded-lg overflow-hidden mb-4">
              <img
                src={signedImageUrl || "/placeholder.svg"}
                alt="Signed Document"
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


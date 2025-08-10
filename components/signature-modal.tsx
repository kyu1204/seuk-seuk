"use client"

import type React from "react"

import { useRef, useState, useEffect } from "react"
import Image from "next/image"
import { Trash2, User, Mail } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { useLanguage } from "@/contexts/language-context"

interface SignerInfo {
  name?: string
  email?: string
}

interface SignatureModalProps {
  isOpen: boolean
  onClose: () => void
  onComplete: (signatureData: string, signerInfo: SignerInfo) => void
  existingSignature?: string
  signerInfo: SignerInfo
  onSignerInfoChange: (info: SignerInfo) => void
  isSubmitting?: boolean
}

export default function SignatureModal({ 
  isOpen, 
  onClose, 
  onComplete, 
  existingSignature,
  signerInfo,
  onSignerInfoChange,
  isSubmitting = false
}: SignatureModalProps) {
  const { t } = useLanguage()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [hasSignature, setHasSignature] = useState(!!existingSignature)
  const [lastX, setLastX] = useState(0)
  const [lastY, setLastY] = useState(0)
  const PEN_WIDTH = 5 // Increased from default
  const [isInfoValid, setIsInfoValid] = useState(false)

  // Validate signer info
  useEffect(() => {
    const isValid = signerInfo.name && signerInfo.name.trim().length > 0
    setIsInfoValid(!!isValid)
  }, [signerInfo])

  // Load saved signer info from localStorage on open
  useEffect(() => {
    if (isOpen && !signerInfo.name && !signerInfo.email) {
      const savedInfo = localStorage.getItem('signerInfo')
      if (savedInfo) {
        try {
          const parsed = JSON.parse(savedInfo)
          onSignerInfoChange(parsed)
        } catch (e) {
          console.warn('Failed to parse saved signer info:', e)
        }
      }
    }
  }, [isOpen, signerInfo, onSignerInfoChange])

  // Save signer info to localStorage when it changes
  useEffect(() => {
    if (signerInfo.name || signerInfo.email) {
      localStorage.setItem('signerInfo', JSON.stringify(signerInfo))
    }
  }, [signerInfo])

  // Initialize canvas when component mounts or when isOpen changes
  useEffect(() => {
    if (!isOpen) return

    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Set up the canvas with thicker line
    ctx.lineWidth = PEN_WIDTH
    ctx.lineCap = "round"
    ctx.lineJoin = "round"
    ctx.strokeStyle = "#000000"

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Load existing signature if available
    if (existingSignature) {
      const img = new Image()
      img.crossOrigin = "anonymous"
      img.onload = () => {
        if (ctx) {
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
        }
      }
      img.src = existingSignature
    }
  }, [existingSignature, isOpen])

  // Get coordinates for mouse or touch event with proper scaling for mobile
  const getCoordinates = (e: MouseEvent | TouchEvent, canvas: HTMLCanvasElement) => {
    const rect = canvas.getBoundingClientRect()
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height
    let clientX, clientY

    if ("touches" in e) {
      const touch = e.touches[0] || e.changedTouches?.[0]
      if (!touch) return { x: 0, y: 0 }
      clientX = touch.clientX
      clientY = touch.clientY
    } else {
      clientX = e.clientX
      clientY = e.clientY
    }

    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY,
    }
  }

  // Start drawing
  const handleStart = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return

    // Prevent default behavior (scrolling, etc)
    if ("touches" in e) {
      e.preventDefault()
    }

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Ensure the line width is set correctly
    ctx.lineWidth = PEN_WIDTH
    ctx.lineCap = "round"
    ctx.lineJoin = "round"
    ctx.strokeStyle = "#000000"

    setIsDrawing(true)
    setHasSignature(true)

    const coords = getCoordinates(e.nativeEvent, canvas)
    setLastX(coords.x)
    setLastY(coords.y)

    // Start a new path
    ctx.beginPath()
    ctx.moveTo(coords.x, coords.y)
  }

  // Draw line
  const handleMove = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas || !isDrawing) return

    // Prevent default behavior (scrolling, etc)
    if ("touches" in e) {
      e.preventDefault()
    }

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Ensure the line width is set correctly for each stroke
    ctx.lineWidth = PEN_WIDTH

    const coords = getCoordinates(e.nativeEvent, canvas)

    // Draw line from last position to current position
    ctx.beginPath()
    ctx.moveTo(lastX, lastY)
    ctx.lineTo(coords.x, coords.y)
    ctx.stroke()

    // Update last position
    setLastX(coords.x)
    setLastY(coords.y)
  }

  // Stop drawing
  const handleEnd = () => {
    setIsDrawing(false)
  }

  // Clear canvas
  const clearCanvas = () => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    ctx.clearRect(0, 0, canvas.width, canvas.height)
    setHasSignature(false)
  }

  // Complete signature
  const handleComplete = () => {
    if (!canvasRef.current || !hasSignature || !isInfoValid) return

    const signatureData = canvasRef.current.toDataURL("image/png")
    onComplete(signatureData, signerInfo)
  }

  const handleSignerInfoChange = (field: 'name' | 'email', value: string) => {
    onSignerInfoChange({
      ...signerInfo,
      [field]: value
    })
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t("signature.title")}</DialogTitle>
        </DialogHeader>

        {/* Signer Information */}
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4">
            <div>
              <Label htmlFor="signer-name" className="flex items-center gap-2 text-sm font-medium">
                <User className="h-4 w-4" />
                {t("sign.signerName")} <span className="text-red-500">*</span>
              </Label>
              <Input
                id="signer-name"
                value={signerInfo.name || ""}
                onChange={(e) => handleSignerInfoChange('name', e.target.value)}
                placeholder={t("sign.signerNamePlaceholder")}
                className={`h-11 ${!isInfoValid && signerInfo.name !== undefined ? "border-red-300 focus:border-red-500" : ""}`}
                autoComplete="name"
              />
            </div>
            <div>
              <Label htmlFor="signer-email" className="flex items-center gap-2 text-sm font-medium">
                <Mail className="h-4 w-4" />
                {t("sign.signerEmail")} <span className="text-muted-foreground text-xs">({t("common.optional") || "선택사항"})</span>
              </Label>
              <Input
                id="signer-email"
                type="email"
                value={signerInfo.email || ""}
                onChange={(e) => handleSignerInfoChange('email', e.target.value)}
                placeholder={t("sign.signerEmailPlaceholder")}
                className="h-11"
                autoComplete="email"
              />
            </div>
          </div>
        </div>

        <div className="border rounded-md p-1 my-4 bg-gray-50">
          <canvas
            ref={canvasRef}
            width={400}
            height={200}
            className="w-full bg-white cursor-crosshair rounded touch-none"
            style={{ 
              touchAction: "none",
              minHeight: "150px",
              maxHeight: "250px"
            }}
            onMouseDown={handleStart}
            onMouseMove={handleMove}
            onMouseUp={handleEnd}
            onMouseLeave={handleEnd}
            onTouchStart={handleStart}
            onTouchMove={handleMove}
            onTouchEnd={handleEnd}
          />
        </div>

        <p className="text-sm text-muted-foreground text-center">{t("signature.instruction")}</p>

        <DialogFooter className="flex justify-between sm:justify-between">
          <Button type="button" variant="outline" onClick={clearCanvas}>
            <Trash2 className="mr-2 h-4 w-4" />
            {t("signature.clear")}
          </Button>
          <Button 
            type="button" 
            onClick={handleComplete} 
            disabled={!hasSignature || !isInfoValid || isSubmitting}
          >
            {isSubmitting ? (
              <>
                <div className="mr-2 h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                {t("signature.submitting") || "제출 중..."}
              </>
            ) : (
              t("signature.sign")
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}


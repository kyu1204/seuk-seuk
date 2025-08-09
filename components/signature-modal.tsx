"use client"

import { useState, useCallback } from "react"
import { Trash2, Undo } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { useLanguage } from "@/contexts/language-context"
import SignatureInput from "./signature/SignatureInput"

interface SignatureModalProps {
  isOpen: boolean
  onClose: () => void
  onComplete: (signatureData: string) => void
  existingSignature?: string
}

export default function SignatureModal({ isOpen, onClose, onComplete, existingSignature }: SignatureModalProps) {
  const { t } = useLanguage()

  // Handle signature completion from SignatureInput
  const handleSignatureComplete = useCallback((signatureData: string, signatureType: 'draw' | 'type' | 'upload') => {
    onComplete(signatureData)
    onClose()
  }, [onComplete, onClose])

  // Handle cancel
  const handleCancel = useCallback(() => {
    onClose()
  }, [onClose])

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t("signature.title")}</DialogTitle>
        </DialogHeader>

        <div className="py-4">
          <SignatureInput
            onSignatureComplete={handleSignatureComplete}
            onCancel={handleCancel}
            existingSignature={existingSignature}
          />
        </div>
      </DialogContent>
    </Dialog>
  )
}


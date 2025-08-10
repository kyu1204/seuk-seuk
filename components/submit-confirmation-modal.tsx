"use client"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { AlertTriangle, CheckCircle, Send } from "lucide-react"
import { useLanguage } from "@/contexts/language-context"

interface SubmitConfirmationModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  isSubmitting: boolean
  documentTitle: string
  signatureCount: number
  totalAreas: number
}

export default function SubmitConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  isSubmitting,
  documentTitle,
  signatureCount,
  totalAreas
}: SubmitConfirmationModalProps) {
  const { t } = useLanguage()

  const isComplete = signatureCount === totalAreas

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isComplete ? (
              <CheckCircle className="h-5 w-5 text-green-600" />
            ) : (
              <AlertTriangle className="h-5 w-5 text-amber-600" />
            )}
            {t("submit.confirmTitle") || "문서 제출 확인"}
          </DialogTitle>
          <DialogDescription>
            {t("submit.confirmDescription", { title: documentTitle }) || 
             `"${documentTitle}" 문서를 제출하시겠습니까?`}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Signature Status */}
          <div className="bg-muted/50 p-4 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="font-medium text-sm">
                {t("submit.signatureStatus") || "서명 상태"}
              </span>
              <span className={`text-sm font-medium ${
                isComplete ? "text-green-600" : "text-amber-600"
              }`}>
                {signatureCount}/{totalAreas} {t("submit.completed") || "완료"}
              </span>
            </div>
            
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all ${
                  isComplete ? "bg-green-600" : "bg-amber-500"
                }`}
                style={{ width: `${(signatureCount / totalAreas) * 100}%` }}
              />
            </div>
          </div>

          {/* Warning Messages */}
          {!isComplete && (
            <div className="bg-amber-50 border border-amber-200 p-3 rounded-lg">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-amber-800">
                  <p className="font-medium mb-1">
                    {t("submit.incompleteWarning") || "아직 서명이 완료되지 않았습니다"}
                  </p>
                  <p>
                    {t("submit.incompleteWarningDetail") || 
                     "일부 영역에 서명하지 않은 상태로 제출하시겠습니까?"}
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="bg-blue-50 border border-blue-200 p-3 rounded-lg">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-blue-800">
                <p className="font-medium mb-1">
                  {t("submit.finalWarning") || "제출 후 수정 불가"}
                </p>
                <p>
                  {t("submit.finalWarningDetail") || 
                   "문서를 제출하면 더 이상 수정할 수 없습니다. 신중히 결정해 주세요."}
                </p>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isSubmitting}
          >
            {t("common.cancel") || "취소"}
          </Button>
          <Button
            onClick={onConfirm}
            disabled={isSubmitting}
            className="gap-2"
          >
            {isSubmitting ? (
              <>
                <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                {t("submit.submitting") || "제출 중..."}
              </>
            ) : (
              <>
                <Send className="h-4 w-4" />
                {t("submit.confirm") || "제출하기"}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
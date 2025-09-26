"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useLanguage } from "@/contexts/language-context";
import { AlertTriangle } from "lucide-react";

interface DeleteDocumentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isLoading?: boolean;
  documentName: string;
}

export default function DeleteDocumentModal({
  isOpen,
  onClose,
  onConfirm,
  isLoading = false,
  documentName,
}: DeleteDocumentModalProps) {
  const { t } = useLanguage();

  const handleConfirm = () => {
    onConfirm();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-500" />
            문서 삭제
          </DialogTitle>
          <DialogDescription className="text-left">
            정말로 이 문서를 삭제하시겠습니까?
            <br />
            <br />
            <strong className="text-foreground">"{documentName}"</strong>
            <br />
            <br />
            이 작업은 되돌릴 수 없습니다. 문서와 관련된 모든 서명 영역이 함께 삭제됩니다.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isLoading}
          >
            취소
          </Button>
          <Button
            variant="destructive"
            onClick={handleConfirm}
            disabled={isLoading}
          >
            {isLoading ? "삭제 중..." : "삭제"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
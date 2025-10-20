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

interface BulkDeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isLoading: boolean;
}

export function BulkDeleteModal({
  isOpen,
  onClose,
  onConfirm,
  isLoading,
}: BulkDeleteModalProps) {
  const { t } = useLanguage();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-500" />
            {t("dashboard.bulkDelete.modalTitle")}
          </DialogTitle>
          <DialogDescription className="text-left space-y-3 pt-2">
            <p className="font-medium text-foreground">
              {t("dashboard.bulkDelete.modalWarning")}
            </p>

            <p className="text-destructive font-medium">
              {t("dashboard.bulkDelete.irreversible")}
            </p>
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            {t("dashboard.bulkDelete.cancel")}
          </Button>
          <Button variant="destructive" onClick={onConfirm} disabled={isLoading}>
            {isLoading
              ? t("dashboard.bulkDelete.deleting")
              : t("dashboard.bulkDelete.confirmDelete")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

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

interface BulkDeleteModalItem {
  id: string;
  name: string;
  status: string;
}

interface BulkDeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isLoading: boolean;
  items: BulkDeleteModalItem[];
  progressLabel?: string;
}

export function BulkDeleteModal({
  isOpen,
  onClose,
  onConfirm,
  isLoading,
  items,
  progressLabel,
}: BulkDeleteModalProps) {
  const { t } = useLanguage();

  const draftCount = items.filter((item) => item.status === "draft").length;
  const completedCount = items.filter((item) => item.status === "completed").length;
  const topItems = items.slice(0, 3);
  const remaining = items.length - topItems.length;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            {t("dashboard.bulkDelete.modalTitle")}
          </DialogTitle>
          <DialogDescription className="text-left space-y-3 pt-2">
            <p className="font-medium text-foreground">
              {t("dashboard.bulkDelete.modalWarning", { count: items.length })}
            </p>

            <ul className="list-disc pl-5 text-foreground">
              {topItems.map((item) => (
                <li key={item.id}>{item.name}</li>
              ))}
            </ul>
            {remaining > 0 && (
              <p>{t("dashboard.bulkDelete.andMore", { count: remaining })}</p>
            )}

            {draftCount > 0 && (
              <p className="text-destructive font-medium">
                {t("dashboard.bulkDelete.draftWarning", { count: draftCount })}
              </p>
            )}
            {completedCount > 0 && (
              <p>
                {t("dashboard.bulkDelete.completedWarning", { count: completedCount })}
              </p>
            )}

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
              ? progressLabel ?? t("dashboard.bulkDelete.deleting")
              : t("dashboard.bulkDelete.confirmDelete", { count: items.length })}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

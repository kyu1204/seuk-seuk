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
import type { Document } from "@/lib/supabase/database.types";

interface BulkDeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isLoading: boolean;
  documents: Document[];
}

export function BulkDeleteModal({
  isOpen,
  onClose,
  onConfirm,
  isLoading,
  documents,
}: BulkDeleteModalProps) {
  const { t } = useLanguage();

  // Separate documents by status
  const draftDocs = documents.filter((d) => d.status === "draft");
  const completedDocs = documents.filter((d) => d.status === "completed");

  // Display up to 5 document names
  const displayDocs = documents.slice(0, 5);
  const remainingCount = documents.length - 5;

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

            {/* Document list */}
            <div className="bg-muted rounded-md p-3 max-h-[200px] overflow-y-auto">
              <ul className="space-y-1 text-sm">
                {displayDocs.map((doc) => (
                  <li key={doc.id} className="truncate">
                    • {doc.alias || doc.filename}
                  </li>
                ))}
                {remainingCount > 0 && (
                  <li className="text-muted-foreground italic">
                    {t("dashboard.bulkDelete.andMore", { count: remainingCount })}
                  </li>
                )}
              </ul>
            </div>

            {/* Status-specific warnings */}
            <div className="space-y-2 text-sm">
              {draftDocs.length > 0 && (
                <p className="text-orange-600 dark:text-orange-400">
                  {t("dashboard.bulkDelete.draftWarning", { count: draftDocs.length })}
                </p>
              )}
              {completedDocs.length > 0 && (
                <p className="text-blue-600 dark:text-blue-400">
                  {t("dashboard.bulkDelete.completedWarning", {
                    count: completedDocs.length,
                  })}
                </p>
              )}
            </div>

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

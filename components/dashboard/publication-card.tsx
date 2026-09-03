"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { DocumentTile } from "@/components/dashboard/document-tile";
import { Lock, Copy, Trash2, ExternalLink, Link2 } from "lucide-react";
import { useLanguage } from "@/contexts/language-context";
import type { ClientPublication } from "@/lib/supabase/database.types";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { deletePublication } from "@/app/actions/publication-actions";
import { toast } from "sonner";

interface PublicationCardProps {
  publication: ClientPublication;
  onDelete?: () => void;
  isSelectionMode?: boolean;
  isSelected?: boolean;
  onToggleSelection?: (publicationId: string, canDelete: boolean) => void;
}

export function PublicationCard({
  publication,
  onDelete,
  isSelectionMode = false,
  isSelected = false,
  onToggleSelection,
}: PublicationCardProps) {
  const { t, language } = useLanguage();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Publications can always be selected/deleted; non-completed ones are reset to draft.
  const canDelete = true;

  const formattedDate = new Date(publication.created_at ?? "").toLocaleDateString(
    language === "ko" ? "ko-KR" : "en-US",
    {
      year: "numeric",
      month: "short",
      day: "numeric",
    }
  );

  const shareUrl = `${window.location.origin}/sign/${publication.short_url}`;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      toast.success(t("dashboard.publications.card.copied"));
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);

    try {
      const result = await deletePublication(publication.id);

      if (result.error) {
        toast.error(result.error);
      } else {
        onDelete?.();
      }
    } catch (err) {
      console.error("Delete error:", err);
      toast.error(t("dashboard.publications.delete.error"));
    } finally {
      setIsDeleting(false);
      setShowDeleteDialog(false);
    }
  };

  const handleViewSignPage = () => {
    window.open(shareUrl, "_blank");
  };

  return (
    <>
      <DocumentTile
        href={isSelectionMode ? undefined : `/publication/${publication.short_url}`}
        status={(publication.status ?? "active") as "active" | "completed" | "expired"}
        title={publication.name}
        metaLeft={formattedDate}
        metaRight={t("dashboard.publications.card.documentCount", {
          count: (publication as any).documentCount,
        })}
        selectable={isSelectionMode}
        selected={isSelected}
        onSelectToggle={() => onToggleSelection?.(publication.id, canDelete)}
        icon={<Link2 className="h-10 w-10" strokeWidth={1.5} />}
        thumbnail={
          (publication as any).requiresPassword ? (
            <Lock className="h-3.5 w-3.5" />
          ) : undefined
        }
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              aria-label={t("dashboard.publications.card.copyLink")}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleCopyLink();
              }}
              className="h-8 px-2"
            >
              <Copy className="h-3 w-3" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              aria-label={t("dashboard.publications.card.open")}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleViewSignPage();
              }}
              className="h-8 px-2"
            >
              <ExternalLink className="h-3 w-3" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              aria-label={t("dashboard.publications.delete.title")}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setShowDeleteDialog(true);
              }}
              className="h-8 px-2 hover:bg-destructive hover:text-destructive-foreground"
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        }
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("dashboard.publications.delete.title")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("dashboard.publications.delete.description", { name: publication.name })}
              <br />
              {publication.status === "completed"
                ? t("dashboard.publications.delete.warningCompleted")
                : t("dashboard.publications.delete.warningReset")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>{t("dashboard.publications.delete.cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? t("dashboard.publications.delete.deleting") : t("dashboard.publications.delete.confirm")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

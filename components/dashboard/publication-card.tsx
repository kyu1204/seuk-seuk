"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, FileText, Lock, Copy, Trash2, ExternalLink, Check } from "lucide-react";
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
import { useRouter } from "next/navigation";
import Link from "next/link";

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
  const router = useRouter();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  // Check if publication can be deleted (only completed)
  const canDelete = publication.status === "completed";

  const getStatusBadge = (status: ClientPublication["status"]) => {
    const statusMap = {
      active: {
        label: t("dashboard.publications.status.active"),
        variant: "default" as const,
      },
      completed: {
        label: t("dashboard.publications.status.completed"),
        variant: "success" as const,
      },
      expired: {
        label: t("dashboard.publications.status.expired"),
        variant: "secondary" as const,
      },
    };

    return statusMap[status] || statusMap.active;
  };

  const statusBadge = getStatusBadge(publication.status);
  const formattedDate = new Date(publication.created_at).toLocaleDateString(
    language === "ko" ? "ko-KR" : "en-US",
    {
      year: "numeric",
      month: "short",
      day: "numeric",
    }
  );

  // Truncate name if it's too long
  const truncateName = (name: string, maxLength: number = 35) => {
    if (name.length <= maxLength) return name;
    return name.slice(0, maxLength) + "...";
  };

  const shareUrl = `${window.location.origin}/sign/${publication.short_url}`;

  // Handle checkbox click
  const handleCheckboxClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onToggleSelection?.(publication.id, canDelete);
  };

  // Handle card click in selection mode
  const handleCardClick = (e: React.MouseEvent) => {
    if (isSelectionMode) {
      e.preventDefault();
      e.stopPropagation();
      handleCheckboxClick(e);
    }
  };

  const handleCopyLink = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    try {
      await navigator.clipboard.writeText(shareUrl);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);

    try {
      const result = await deletePublication(publication.id);

      if (result.error) {
        alert(result.error);
      } else {
        // Call parent callback to refresh list
        onDelete?.();
      }
    } catch (err) {
      console.error("Delete error:", err);
      alert("Failed to delete publication");
    } finally {
      setIsDeleting(false);
      setShowDeleteDialog(false);
    }
  };

  const handleOpenDeleteDialog = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setShowDeleteDialog(true);
  };

  const handleViewSignPage = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    window.open(shareUrl, "_blank");
  };

  return (
    <>
      <Link
        href={isSelectionMode ? "#" : `/publication/${publication.short_url}`}
        className="block"
        onClick={handleCardClick}
      >
        <Card
          className={`transition-all duration-200 ${
            !isSelectionMode && "hover:shadow-md hover:border-primary/20"
          } h-64 flex flex-col ${
            isSelected ? "border-primary shadow-md" : ""
          } ${
            isSelectionMode ? "cursor-pointer" : ""
          }`}
        >
          <CardHeader className="pb-3 flex-1 flex flex-col justify-between">
            <div className="flex items-start justify-between gap-2 mb-2">
              <div className="flex items-center gap-2">
                <Badge variant={statusBadge.variant} className="flex-shrink-0 text-xs">
                  {statusBadge.label}
                </Badge>
                {publication.requiresPassword && (
                  <Lock className="h-3 w-3 text-muted-foreground" />
                )}
              </div>

              {/* Selection Checkbox - only in selection mode, positioned at top-right */}
              {isSelectionMode && (
                <div
                  className={`z-10 ${
                    canDelete ? "cursor-pointer" : "cursor-not-allowed opacity-50"
                  }`}
                  onClick={handleCheckboxClick}
                  title={
                    canDelete
                      ? isSelected
                        ? t("dashboard.bulkDelete.deselect")
                        : t("dashboard.bulkDelete.select")
                      : t("dashboard.publications.bulkDelete.cannotDelete")
                  }
                >
                  <div
                    className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
                      isSelected
                        ? "bg-primary border-primary"
                        : "bg-background border-gray-300 hover:border-primary"
                    } ${!canDelete && "bg-gray-100 dark:bg-gray-800"}`}
                  >
                    {isSelected && (
                      <svg
                        className="w-3 h-3 text-primary-foreground"
                        fill="none"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path d="M5 13l4 4L19 7"></path>
                      </svg>
                    )}
                  </div>
                </div>
              )}
            </div>

          <div className="flex flex-col items-center text-center space-y-3">
            <FileText className="h-8 w-8 text-primary flex-shrink-0" />
            <h3
              className="font-medium text-sm leading-relaxed text-center px-2 break-words"
              title={publication.name}
            >
              {truncateName(publication.name)}
            </h3>
            <div className="text-xs text-muted-foreground">
              {publication.documentCount}{t("dashboard.publications.card.documentCount")}
            </div>
          </div>
        </CardHeader>

        <CardContent className="pt-0 pb-4 mt-auto space-y-3">
          <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
            <Calendar className="h-3 w-3" />
            <time dateTime={publication.created_at}>{formattedDate}</time>
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopyLink}
              className="flex-1 h-8 text-xs"
            >
              {isCopied ? (
                <>
                  <Check className="h-3 w-3 mr-1" />
                  {t("dashboard.publications.card.copied")}
                </>
              ) : (
                <>
                  <Copy className="h-3 w-3 mr-1" />
                  {t("dashboard.publications.card.copyLink")}
                </>
              )}
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={handleViewSignPage}
              className="h-8 px-2"
            >
              <ExternalLink className="h-3 w-3" />
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={handleOpenDeleteDialog}
              className="h-8 px-2 hover:bg-destructive hover:text-destructive-foreground"
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        </CardContent>
        </Card>
      </Link>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("dashboard.publications.delete.title")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("dashboard.publications.delete.description", { name: publication.name })}
              <br />
              {t("dashboard.publications.delete.warning")}
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

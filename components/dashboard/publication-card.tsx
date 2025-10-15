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

interface PublicationCardProps {
  publication: ClientPublication;
  onDelete?: () => void;
}

export function PublicationCard({ publication, onDelete }: PublicationCardProps) {
  const { t } = useLanguage();
  const router = useRouter();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  const getStatusBadge = (status: ClientPublication["status"]) => {
    const statusMap = {
      active: {
        label: "활성",
        variant: "default" as const,
      },
      completed: {
        label: "완료",
        variant: "success" as const,
      },
      expired: {
        label: "만료",
        variant: "secondary" as const,
      },
    };

    return statusMap[status] || statusMap.active;
  };

  const statusBadge = getStatusBadge(publication.status);
  const formattedDate = new Date(publication.created_at).toLocaleDateString(
    "ko-KR",
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
      <Card className="transition-all duration-200 hover:shadow-md hover:border-primary/20 h-64 flex flex-col">
        <CardHeader className="pb-3 flex-1 flex flex-col justify-between">
          <div className="flex items-start justify-between gap-2 mb-2">
            <Badge variant={statusBadge.variant} className="flex-shrink-0 text-xs">
              {statusBadge.label}
            </Badge>
            {publication.requiresPassword && (
              <Lock className="h-3 w-3 text-muted-foreground" />
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
              {publication.documentCount}개 문서
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
                  복사됨
                </>
              ) : (
                <>
                  <Copy className="h-3 w-3 mr-1" />
                  링크
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

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>발행 삭제</AlertDialogTitle>
            <AlertDialogDescription>
              "{publication.name}" 발행을 삭제하시겠습니까?
              <br />
              이 발행에 포함된 모든 문서는 초안 상태로 돌아갑니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>취소</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? "삭제 중..." : "삭제"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

import Link from "next/link";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, FileText } from "lucide-react";
import { useLanguage } from "@/contexts/language-context";
import type { Document } from "@/lib/supabase/database.types";

interface DocumentCardProps {
  document: Document;
  isSelectionMode: boolean;
  isSelected: boolean;
  onToggleSelection: (documentId: string, canDelete: boolean) => void;
}

export function DocumentCard({ document, isSelectionMode, isSelected, onToggleSelection }: DocumentCardProps) {
  const { t, language } = useLanguage();

  // Check if document can be deleted (draft or completed)
  const canDelete = document.status === "draft" || document.status === "completed";

  // Handle checkbox click
  const handleCheckboxClick = (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent link navigation
    e.stopPropagation();
    onToggleSelection(document.id, canDelete);
  };

  const getStatusBadge = (status: Document["status"]) => {
    const statusMap = {
      draft: {
        label: t("status.draft"),
        variant: "secondary" as const,
      },
      published: {
        label: t("status.published"),
        variant: "default" as const,
      },
      completed: {
        label: t("status.completed"),
        variant: "success" as const,
      },
    };

    return statusMap[status] || statusMap.draft;
  };

  const statusBadge = getStatusBadge(document.status);
  const formattedDate = new Date(document.created_at).toLocaleDateString(
    language === "ko" ? "ko-KR" : "en-US",
    {
      year: "numeric",
      month: "short",
      day: "numeric",
    }
  );

  // Truncate filename if it's too long
  const truncateFilename = (filename: string, maxLength: number = 45) => {
    if (filename.length <= maxLength) return filename;
    return filename.slice(0, maxLength) + "...";
  };

  // Display alias if exists, otherwise show filename
  const displayName = document.alias || document.filename;

  // Handle card click in selection mode
  const handleCardClick = (e: React.MouseEvent) => {
    if (isSelectionMode) {
      e.preventDefault();
      e.stopPropagation();
      handleCheckboxClick(e);
    }
  };

  return (
    <div className="relative">
      {/* Document Card */}
      <Link
        href={isSelectionMode ? "#" : `/document/${document.id}`}
        className="block group"
        onClick={handleCardClick}
      >
        <Card
          className={`transition-all duration-200 ${
            !isSelectionMode && "hover:shadow-md hover:border-primary/20 group-hover:scale-[1.02]"
          } h-48 flex flex-col ${
            isSelected ? "border-primary shadow-md" : ""
          } ${
            isSelectionMode ? "cursor-pointer" : ""
          }`}
        >
          <CardHeader className="pb-3 flex-1 flex flex-col justify-between">
            <div className="flex items-start justify-between gap-2 mb-2">
              <Badge variant={statusBadge.variant} className="flex-shrink-0 text-xs">
                {statusBadge.label}
              </Badge>

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
                      : t("dashboard.bulkDelete.cannotDelete")
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
                title={displayName}
              >
                {truncateFilename(displayName)}
              </h3>
            </div>
          </CardHeader>
          <CardContent className="pt-0 pb-4 mt-auto">
            <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
              <Calendar className="h-3 w-3" />
              <time dateTime={document.created_at}>{formattedDate}</time>
            </div>
          </CardContent>
        </Card>
      </Link>
    </div>
  );
}
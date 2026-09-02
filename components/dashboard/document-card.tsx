import { DocumentTile } from "@/components/dashboard/document-tile";
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

  const formattedDate = new Date(document.created_at).toLocaleDateString(
    language === "ko" ? "ko-KR" : "en-US",
    {
      year: "numeric",
      month: "short",
      day: "numeric",
    }
  );

  // Display alias if exists, otherwise show filename
  const displayName = document.alias || document.filename;

  return (
    <DocumentTile
      href={isSelectionMode ? undefined : `/document/${document.id}`}
      status={(document.status ?? "draft") as "draft" | "published" | "completed"}
      title={displayName}
      metaLeft={formattedDate}
      metaRight={t("dashboard.card.areas", { count: document.page_count })}
      selectable={isSelectionMode}
      selected={isSelected}
      onSelectToggle={() => onToggleSelection(document.id, canDelete)}
      disabledReason={isSelectionMode && !canDelete ? t("dashboard.bulkDelete.cannotDelete") : undefined}
    />
  );
}
"use client";

import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/language-context";
import { Trash2, X } from "lucide-react";

interface BulkDeleteHeaderProps {
  selectedCount: number;
  onSelectAll: () => void;
  onDeselectAll: () => void;
  onDelete: () => void;
  onExitSelectionMode: () => void;
  isDeleting: boolean;
}

export function BulkDeleteHeader({
  selectedCount,
  onSelectAll,
  onDeselectAll,
  onDelete,
  onExitSelectionMode,
  isDeleting,
}: BulkDeleteHeaderProps) {
  const { t } = useLanguage();

  return (
    <div className="sticky top-0 z-10 bg-background border-b border-border shadow-sm mb-6 py-3 px-4 animate-in slide-in-from-top duration-200">
      <div className="flex flex-col gap-3">
        {/* Top row - Selection count and exit button */}
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">
            {t("dashboard.bulkDelete.selected", { count: selectedCount })}
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={onExitSelectionMode}
            disabled={isDeleting}
            className="h-8"
            title={t("dashboard.selectionMode.exit")}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Bottom row - Action buttons */}
        <div className="flex flex-col sm:flex-row gap-2 sm:items-center sm:justify-between">
          {/* Selection controls */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onSelectAll}
              disabled={isDeleting}
              className="h-8 text-xs flex-1 sm:flex-none"
            >
              {t("dashboard.bulkDelete.selectAll")}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={onDeselectAll}
              disabled={isDeleting}
              className="h-8 text-xs flex-1 sm:flex-none"
            >
              {t("dashboard.bulkDelete.deselectAll")}
            </Button>
          </div>

          {/* Delete button */}
          <Button
            variant="destructive"
            size="sm"
            onClick={onDelete}
            disabled={selectedCount === 0 || isDeleting}
            className="h-8 w-full sm:w-auto"
          >
            <Trash2 className="mr-2 h-3 w-3" />
            {isDeleting
              ? t("dashboard.bulkDelete.deleting")
              : t("dashboard.bulkDelete.deleteSelected")}
          </Button>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import { FileX, CheckSquare } from "lucide-react";
import { useLanguage } from "@/contexts/language-context";
import { getUserPublications, deletePublication } from "@/app/actions/publication-actions";
import type { ClientPublication } from "@/lib/supabase/database.types";
import { PublicationCard } from "./publication-card";
import { DashboardSkeleton } from "./dashboard-skeleton";
import { Button } from "@/components/ui/button";
import { BulkDeleteHeader } from "@/components/dashboard/bulk-delete-header";
import { BulkDeleteModal } from "@/components/dashboard/bulk-delete-modal";
import Link from "next/link";
import { toast } from "sonner";

interface PublicationsListProps {
  statusFilter?: "all" | "active" | "completed" | "expired";
}

export function PublicationsList({ statusFilter = "all" }: PublicationsListProps) {
  const { t } = useLanguage();
  const [publications, setPublications] = useState<ClientPublication[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Selection state for bulk delete
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedPublicationIds, setSelectedPublicationIds] = useState<Set<string>>(new Set());
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);
  const [isBulkDeleteModalOpen, setIsBulkDeleteModalOpen] = useState(false);

  const loadPublications = async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await getUserPublications();

      if (result.error) {
        setError(result.error);
      } else {
        // Apply status filter
        let filtered = result.publications || [];
        if (statusFilter !== "all") {
          filtered = filtered.filter(pub => pub.status === statusFilter);
        }
        setPublications(filtered);
      }
    } catch (err) {
      console.error("Failed to load publications:", err);
      setError("Failed to load publications");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPublications();
    // Clear selection and exit selection mode when filter changes
    setSelectedPublicationIds(new Set());
    setIsSelectionMode(false);
  }, [statusFilter]);

  const handleDelete = () => {
    // Reload publications after deletion
    loadPublications();
  };

  // Toggle individual publication selection
  const togglePublicationSelection = (publicationId: string, canDelete: boolean) => {
    if (!canDelete) return;

    setSelectedPublicationIds((prev) => {
      const next = new Set(prev);
      if (next.has(publicationId)) {
        next.delete(publicationId);
      } else {
        next.add(publicationId);
      }
      return next;
    });
  };

  // Select all deletable publications
  const handleSelectAll = () => {
    const deletablePublicationIds = publications
      .filter((pub) => pub.status === "completed")
      .map((pub) => pub.id);

    setSelectedPublicationIds(new Set(deletablePublicationIds));
  };

  // Deselect all publications
  const handleDeselectAll = () => {
    setSelectedPublicationIds(new Set());
  };

  // Enter selection mode
  const handleEnterSelectionMode = () => {
    setIsSelectionMode(true);
  };

  // Exit selection mode
  const handleExitSelectionMode = () => {
    setIsSelectionMode(false);
    setSelectedPublicationIds(new Set());
  };

  // Open bulk delete modal
  const handleBulkDeleteClick = () => {
    if (selectedPublicationIds.size === 0) return;
    setIsBulkDeleteModalOpen(true);
  };

  // Execute bulk delete
  const handleBulkDeleteConfirm = async () => {
    setIsBulkDeleting(true);

    const selectedIds = Array.from(selectedPublicationIds);
    const selectedPubs = publications.filter((pub) => selectedIds.includes(pub.id));

    let successCount = 0;
    let failCount = 0;
    const failures: { name: string; error: string }[] = [];

    // Delete each publication sequentially
    for (const pub of selectedPubs) {
      try {
        const result = await deletePublication(pub.id);

        if (result.error) {
          failCount++;
          failures.push({
            name: pub.name,
            error: result.error,
          });
        } else {
          successCount++;
        }
      } catch (error) {
        failCount++;
        failures.push({
          name: pub.name,
          error: "Unexpected error occurred",
        });
      }
    }

    // Close modal and reset state
    setIsBulkDeleteModalOpen(false);
    setIsBulkDeleting(false);

    // Show results
    if (successCount > 0) {
      toast.success(t("dashboard.publications.bulkDelete.successMessage", { count: successCount }));
    }

    if (failCount > 0) {
      const errorMessage = failures.map((f) => `${f.name}: ${f.error}`).join(", ");
      toast.error(t("dashboard.publications.bulkDelete.errorMessage", { count: failCount, details: errorMessage }));
    }

    // Clear selection and exit selection mode if all succeeded
    if (failCount === 0) {
      setSelectedPublicationIds(new Set());
      setIsSelectionMode(false);
    } else {
      // Keep failed publications selected for retry
      const failedIds = failures
        .map((f) => selectedPubs.find((p) => p.name === f.name)?.id)
        .filter(Boolean) as string[];
      setSelectedPublicationIds(new Set(failedIds));
    }

    // Reload publications
    loadPublications();
  };

  if (loading) {
    return <DashboardSkeleton />;
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600">Error: {error}</p>
      </div>
    );
  }

  return (
    <>
      {/* Selection Button - show when not in selection mode and have publications */}
      {!isSelectionMode && publications.length > 0 && (
        <div className="flex justify-end mb-6">
          <Button
            variant="outline"
            size="sm"
            onClick={handleEnterSelectionMode}
            className="gap-2"
          >
            <CheckSquare className="h-4 w-4" />
            {t("dashboard.selectionMode.enter")}
          </Button>
        </div>
      )}

      {/* Bulk Delete Header - show when in selection mode */}
      {isSelectionMode && (
        <BulkDeleteHeader
          selectedCount={selectedPublicationIds.size}
          onSelectAll={handleSelectAll}
          onDeselectAll={handleDeselectAll}
          onDelete={handleBulkDeleteClick}
          onExitSelectionMode={handleExitSelectionMode}
          isDeleting={isBulkDeleting}
        />
      )}

      {/* Publications or Empty State */}
      {publications.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="rounded-full bg-muted p-6 mb-6">
            <FileX className="h-12 w-12 text-muted-foreground" />
          </div>
          <h3 className="text-xl font-semibold mb-2">{t("dashboard.publications.empty.title")}</h3>
          <p className="text-muted-foreground mb-6 max-w-md">
            {t("dashboard.publications.empty.description")}
          </p>
          <Link href="/publish">
            <Button size="lg" className="gap-2">
              {t("dashboard.publications.empty.action")}
            </Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Publications Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {publications.map((publication) => (
              <PublicationCard
                key={publication.id}
                publication={publication}
                onDelete={handleDelete}
                isSelectionMode={isSelectionMode}
                isSelected={selectedPublicationIds.has(publication.id)}
                onToggleSelection={togglePublicationSelection}
              />
            ))}
          </div>
        </div>
      )}

      {/* Bulk Delete Modal */}
      <BulkDeleteModal
        isOpen={isBulkDeleteModalOpen}
        onClose={() => setIsBulkDeleteModalOpen(false)}
        onConfirm={handleBulkDeleteConfirm}
        isLoading={isBulkDeleting}
      />
    </>
  );
}

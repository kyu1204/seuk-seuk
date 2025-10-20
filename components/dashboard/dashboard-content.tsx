"use client";

import { deleteDocument, getDashboardData } from "@/app/actions/document-actions";
import { BulkDeleteHeader } from "@/components/dashboard/bulk-delete-header";
import { BulkDeleteModal } from "@/components/dashboard/bulk-delete-modal";
import { DashboardSkeleton } from "@/components/dashboard/dashboard-skeleton";
import { InfiniteScrollDocuments } from "@/components/dashboard/infinite-scroll-documents";
import { PublicationsList } from "@/components/dashboard/publications-list";
import { StatusFilter } from "@/components/dashboard/status-filter";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useLanguage } from "@/contexts/language-context";
import { useAuth } from "@/hooks/use-auth";
import type { Document } from "@/lib/supabase/database.types";
import { CheckSquare, FileX, Upload } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

type TabType = "documents" | "publications";

export function DashboardContent() {
  const { t } = useLanguage();
  const { user, loading: authLoading, isAuthenticated } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabType>("documents");
  const [documents, setDocuments] = useState<Document[]>([]);
  const [hasMore, setHasMore] = useState(false);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<"all" | "draft" | "published" | "completed">("all");
  const [publicationStatus, setPublicationStatus] = useState<"all" | "active" | "completed" | "expired">("all");
  const [statusCounts, setStatusCounts] = useState<{
    all: number;
    draft: number;
    published: number;
    completed: number;
  }>({
    all: 0,
    draft: 0,
    published: 0,
    completed: 0,
  });

  // Selection state for bulk delete
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedDocumentIds, setSelectedDocumentIds] = useState<Set<string>>(new Set());
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);
  const [isBulkDeleteModalOpen, setIsBulkDeleteModalOpen] = useState(false);

  // Load dashboard data (documents + counts) when filter changes or on mount
  useEffect(() => {
    if (authLoading) return;

    if (!isAuthenticated) {
      router.push("/login");
      return;
    }

    const loadDashboardData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Load both documents and counts in one optimized call
        const statusFilter = selectedStatus === "all" ? undefined : selectedStatus;
        const result = await getDashboardData(1, 12, statusFilter);

        if (result.error) {
          setError(result.error);
        } else {
          setDocuments(result.documents);
          setHasMore(result.hasMore);
          setTotal(result.total);
          setStatusCounts(result.counts);
        }
      } catch (err) {
        setError("Failed to load dashboard data");
        console.error("Error loading dashboard data:", err);
      } finally {
        setLoading(false);
      }
    };

    // Clear selection and exit selection mode when filter changes
    setSelectedDocumentIds(new Set());
    setIsSelectionMode(false);

    loadDashboardData();
  }, [authLoading, isAuthenticated, selectedStatus, router]);

  // Toggle individual document selection
  const toggleDocumentSelection = (documentId: string, canDelete: boolean) => {
    if (!canDelete) return;

    setSelectedDocumentIds((prev) => {
      const next = new Set(prev);
      if (next.has(documentId)) {
        next.delete(documentId);
      } else {
        next.add(documentId);
      }
      return next;
    });
  };

  // Select all deletable documents on current page
  const handleSelectAll = () => {
    const deletableDocIds = documents
      .filter((doc) => doc.status === "draft" || doc.status === "completed")
      .map((doc) => doc.id);

    setSelectedDocumentIds(new Set(deletableDocIds));
  };

  // Deselect all documents
  const handleDeselectAll = () => {
    setSelectedDocumentIds(new Set());
  };

  // Enter selection mode
  const handleEnterSelectionMode = () => {
    setIsSelectionMode(true);
  };

  // Exit selection mode
  const handleExitSelectionMode = () => {
    setIsSelectionMode(false);
    setSelectedDocumentIds(new Set());
  };

  // Open bulk delete modal
  const handleBulkDeleteClick = () => {
    if (selectedDocumentIds.size === 0) return;
    setIsBulkDeleteModalOpen(true);
  };

  // Execute bulk delete
  const handleBulkDeleteConfirm = async () => {
    setIsBulkDeleting(true);

    const selectedIds = Array.from(selectedDocumentIds);
    const selectedDocs = documents.filter((doc) => selectedIds.includes(doc.id));

    let successCount = 0;
    let failCount = 0;
    const failures: { name: string; error: string }[] = [];

    // Delete each document sequentially
    for (const doc of selectedDocs) {
      try {
        const result = await deleteDocument(doc.id);

        if (result.error) {
          failCount++;
          failures.push({
            name: doc.alias || doc.filename,
            error: result.error,
          });
        } else {
          successCount++;
        }
      } catch (error) {
        failCount++;
        failures.push({
          name: doc.alias || doc.filename,
          error: "Unexpected error occurred",
        });
      }
    }

    // Close modal and reset state
    setIsBulkDeleteModalOpen(false);
    setIsBulkDeleting(false);

    // Show results
    if (successCount > 0) {
      toast.success(t("dashboard.bulkDelete.successMessage", { count: successCount }));
    }

    if (failCount > 0) {
      const errorMessage = failures.map((f) => `${f.name}: ${f.error}`).join(", ");
      toast.error(t("dashboard.bulkDelete.errorMessage", { count: failCount, details: errorMessage }));
    }

    // Clear selection and exit selection mode if all succeeded
    if (failCount === 0) {
      setSelectedDocumentIds(new Set());
      setIsSelectionMode(false);
    } else {
      // Keep failed documents selected for retry
      const failedIds = failures
        .map((f) => selectedDocs.find((d) => (d.alias || d.filename) === f.name)?.id)
        .filter(Boolean) as string[];
      setSelectedDocumentIds(new Set(failedIds));
    }

    // Reload dashboard data
    const statusFilter = selectedStatus === "all" ? undefined : selectedStatus;
    const result = await getDashboardData(1, 12, statusFilter);

    if (!result.error) {
      setDocuments(result.documents);
      setHasMore(result.hasMore);
      setTotal(result.total);
      setStatusCounts(result.counts);
    }
  };

  // Show loading while checking auth or loading documents
  if (authLoading || loading) {
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
      {/* Tab Switcher */}
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as TabType)} className="mb-6">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="documents">{t("dashboard.tabs.documents")}</TabsTrigger>
          <TabsTrigger value="publications">{t("dashboard.tabs.publications")}</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Documents Tab */}
      {activeTab === "documents" && (
        <>
          {/* Status Filter and Selection Button */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-6">
            {/* Status Filter for Documents */}
            <StatusFilter
              selectedStatus={selectedStatus}
              onStatusChange={setSelectedStatus}
              counts={statusCounts}
            />

            {/* Selection Mode Toggle Button */}
            {!isSelectionMode && documents.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleEnterSelectionMode}
                className="gap-2 self-end"
              >
                <CheckSquare className="h-4 w-4" />
                {t("dashboard.selectionMode.enter")}
              </Button>
            )}
          </div>

          {/* Bulk Delete Header - show when in selection mode */}
          {isSelectionMode && (
            <BulkDeleteHeader
              selectedCount={selectedDocumentIds.size}
              onSelectAll={handleSelectAll}
              onDeselectAll={handleDeselectAll}
              onDelete={handleBulkDeleteClick}
              onExitSelectionMode={handleExitSelectionMode}
              isDeleting={isBulkDeleting}
            />
          )}

          {/* Documents or Empty State */}
          {documents.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <div className="rounded-full bg-muted p-6 mb-6">
                <FileX className="h-12 w-12 text-muted-foreground" />
              </div>
              <h3 className="text-xl font-semibold mb-2">{t("dashboard.empty.title")}</h3>
              <p className="text-muted-foreground mb-6 max-w-md">
                {t("dashboard.empty.description")}
              </p>
              <Link href="/upload">
                <Button size="lg" className="gap-2">
                  <Upload className="h-4 w-4" />
                  {t("dashboard.empty.action")}
                </Button>
              </Link>
            </div>
          ) : (
            <InfiniteScrollDocuments
              initialDocuments={documents}
              initialHasMore={hasMore}
              status={selectedStatus === "all" ? undefined : selectedStatus}
              isSelectionMode={isSelectionMode}
              selectedDocumentIds={selectedDocumentIds}
              onToggleSelection={toggleDocumentSelection}
            />
          )}
        </>
      )}

      {/* Publications Tab */}
      {activeTab === "publications" && (
        <PublicationsList statusFilter={publicationStatus} />
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
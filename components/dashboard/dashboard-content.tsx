"use client";

import { deleteDocument, getDashboardData } from "@/app/actions/document-actions";
import { BulkDeleteHeader } from "@/components/dashboard/bulk-delete-header";
import { BulkDeleteModal } from "@/components/dashboard/bulk-delete-modal";
import { DashboardSkeleton } from "@/components/dashboard/dashboard-skeleton";
import { InfiniteScrollDocuments } from "@/components/dashboard/infinite-scroll-documents";
import { PublicationsList } from "@/components/dashboard/publications-list";
import { TemplatesList } from "@/components/dashboard/templates-list";
import { StatusFilter } from "@/components/dashboard/status-filter";
import { resolveTab, type TabType } from "@/components/dashboard/dashboard-tabs";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useLanguage } from "@/contexts/language-context";
import type { Document } from "@/lib/supabase/database.types";
import { CheckSquare, FileX, Upload } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

interface DashboardInitialData {
  documents: Document[];
  hasMore: boolean;
  total: number;
  counts: {
    all: number;
    draft: number;
    published: number;
    completed: number;
  };
  error?: string;
}

interface DashboardContentProps {
  initialData: DashboardInitialData;
}

export function DashboardContent({ initialData }: DashboardContentProps) {
  const { t } = useLanguage();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [activeTab, setActiveTabState] = useState<TabType>(() =>
    resolveTab(searchParams.get("tab"))
  );
  const [documents, setDocuments] = useState<Document[]>(initialData.documents);
  const [hasMore, setHasMore] = useState(initialData.hasMore);
  const [total, setTotal] = useState(initialData.total);
  // Data is prefetched on the server, so no initial client-side loading state.
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(initialData.error ?? null);
  const [selectedStatus, setSelectedStatus] = useState<"all" | "draft" | "published" | "completed">("all");
  const [publicationStatus, setPublicationStatus] = useState<"all" | "active" | "completed" | "expired">("all");
  const [statusCounts, setStatusCounts] = useState<{
    all: number;
    draft: number;
    published: number;
    completed: number;
  }>(initialData.counts);

  // Skip the first client fetch — the server already provided the "all" data.
  const isFirstLoad = useRef(true);

  // Selection state for bulk delete
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedDocumentIds, setSelectedDocumentIds] = useState<Set<string>>(new Set());
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);
  const [isBulkDeleteModalOpen, setIsBulkDeleteModalOpen] = useState(false);
  const [bulkDeleteProgress, setBulkDeleteProgress] = useState<{ done: number; total: number } | null>(null);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load both documents and counts in one optimized call
      const statusFilter = selectedStatus === "all" ? undefined : selectedStatus;
      const result = await getDashboardData(1, 12, statusFilter);

      if (result.error) {
        setError(t("dashboard.error.load"));
      } else {
        setDocuments(result.documents);
        setHasMore(result.hasMore);
        setTotal(result.total);
        setStatusCounts(result.counts);
      }
    } catch (err) {
      setError(t("dashboard.error.load"));
      console.error("Error loading dashboard data:", err);
    } finally {
      setLoading(false);
    }
  };

  // Reload dashboard data (documents + counts) when the status filter changes.
  // The first render is skipped because the server already prefetched the data.
  useEffect(() => {
    if (isFirstLoad.current) {
      isFirstLoad.current = false;
      return;
    }

    // Clear selection and exit selection mode when filter changes
    setSelectedDocumentIds(new Set());
    setIsSelectionMode(false);

    loadDashboardData();
  }, [selectedStatus]);

  useEffect(() => {
    setActiveTabState(resolveTab(searchParams.get("tab")));
  }, [searchParams]);

  const setActiveTab = (tab: TabType) => {
    setActiveTabState(tab);
    router.replace(`/dashboard?tab=${tab}`, { scroll: false });
  };

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

  const selectedDocs = documents.filter((doc) => selectedDocumentIds.has(doc.id));
  const bulkDeleteItems = selectedDocs.map((doc) => ({
    id: doc.id,
    name: doc.alias || doc.filename,
    status: doc.status ?? "draft",
  }));

  // Execute bulk delete
  const handleBulkDeleteConfirm = async () => {
    setIsBulkDeleting(true);

    const docsToDelete = selectedDocs;
    setBulkDeleteProgress({ done: 0, total: docsToDelete.length });

    let successCount = 0;
    const failedIds = new Set<string>();

    // Delete each document sequentially
    for (const [index, doc] of docsToDelete.entries()) {
      try {
        const result = await deleteDocument(doc.id);

        if (result.error) {
          failedIds.add(doc.id);
        } else {
          successCount++;
        }
      } catch (error) {
        failedIds.add(doc.id);
      }
      setBulkDeleteProgress({ done: index + 1, total: docsToDelete.length });
    }

    // Close modal and reset state
    setIsBulkDeleteModalOpen(false);
    setIsBulkDeleting(false);
    setBulkDeleteProgress(null);

    // Show results
    if (successCount > 0) {
      toast.success(t("dashboard.bulkDelete.successMessage", { count: successCount }));
    }

    if (failedIds.size > 0) {
      toast.error(t("dashboard.bulkDelete.errorMessage", { count: failedIds.size, details: "" }));
    }

    // Clear selection and exit selection mode if all succeeded
    if (failedIds.size === 0) {
      setSelectedDocumentIds(new Set());
      setIsSelectionMode(false);
    } else {
      // Keep failed documents selected for retry
      setSelectedDocumentIds(failedIds);
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

  // Show loading while (re)loading documents after a filter change
  if (loading) {
    return <DashboardSkeleton />;
  }

  if (error) {
    return (
      <div className="text-center py-8 space-y-4">
        <p className="text-destructive">{error}</p>
        <Button variant="outline" onClick={loadDashboardData}>
          {t("common.retry")}
        </Button>
      </div>
    );
  }

  return (
    <>
      {/* Tab Switcher */}
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as TabType)} className="mb-6">
        <TabsList className="grid w-full max-w-md grid-cols-3">
          <TabsTrigger value="documents">
            {t("dashboard.tabs.documents")}
            <span className="text-muted-foreground ml-1">({statusCounts.all})</span>
          </TabsTrigger>
          <TabsTrigger value="publications">{t("dashboard.tabs.publications")}</TabsTrigger>
          <TabsTrigger value="templates">{t("dashboard.tabs.templates")}</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Documents Tab */}
      {activeTab === "documents" && (
        <>
          {/* Status Filter and Selection Button */}
          <div className="flex items-center justify-between gap-3 mb-5 min-w-0">
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
                className="gap-2 shrink-0"
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

      {/* Templates Tab */}
      {activeTab === "templates" && <TemplatesList />}

      {/* Bulk Delete Modal */}
      <BulkDeleteModal
        isOpen={isBulkDeleteModalOpen}
        onClose={() => setIsBulkDeleteModalOpen(false)}
        onConfirm={handleBulkDeleteConfirm}
        isLoading={isBulkDeleting}
        items={bulkDeleteItems}
        progressLabel={
          bulkDeleteProgress
            ? t("dashboard.bulkDelete.progress", bulkDeleteProgress)
            : undefined
        }
      />
    </>
  );
}

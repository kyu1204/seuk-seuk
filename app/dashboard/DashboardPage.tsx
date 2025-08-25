"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/contexts/language-context";
import { deleteDocument } from "@/app/actions/document";
import { Button } from "@/components/ui/button";
import { Plus, FolderOpen } from "lucide-react";
import { toast } from "sonner";
import type { User as SupabaseUser } from "@supabase/supabase-js";

// Dashboard components
import DocumentList from "./components/DocumentList";
import DocumentFilters from "./components/DocumentFilters";
import { getDocumentsAction } from "./actions";
import {
  DocumentWithStats,
  DocumentAction,
  DocumentFilter,
  DocumentCounts,
  SortOptions,
  DocumentListState,
} from "./types/dashboard";

interface DashboardPageProps {
  user: SupabaseUser;
}

export default function DashboardPage({ user }: DashboardPageProps) {
  const { t } = useLanguage();
  const router = useRouter();

  // Dashboard state
  const [documentState, setDocumentState] = useState<DocumentListState>({
    documents: [],
    loading: true,
    filter: "all",
    searchQuery: "",
    sortOptions: { field: "created_at", order: "desc" },
    counts: { all: 0, draft: 0, published: 0, completed: 0, expired: 0 },
  });

  // Load documents
  const loadDocuments = useCallback(async () => {
    try {
      setDocumentState((prev) => ({ ...prev, loading: true }));

      const { data, counts, error } = await getDocumentsAction(
        documentState.filter,
        documentState.searchQuery || undefined,
        documentState.sortOptions
      );

      if (error) {
        throw new Error(error);
      }

      setDocumentState((prev) => ({
        ...prev,
        documents: data,
        counts,
        loading: false,
        error: undefined,
      }));
    } catch (error) {
      console.error("Failed to load documents:", error);
      setDocumentState((prev) => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : "Unknown error",
      }));
      toast.error(t("dashboard.loadError") || "Failed to load documents");
    }
  }, [
    documentState.filter,
    documentState.searchQuery,
    documentState.sortOptions,
    t,
  ]);

  // Initial load
  useEffect(() => {
    loadDocuments();
  }, [loadDocuments]);

  // Handle document actions
  const handleDocumentAction = useCallback(
    async (action: DocumentAction, documentId: string) => {
      const document = documentState.documents.find((d) => d.id === documentId);

      try {
        switch (action) {
          case "view":
            if (document) {
              // Navigate to document detail page
              router.push(`/document/${document.id}`);
            }
            break;

          case "edit":
            if (document) {
              router.push(`/upload/${document.id}`);
            }
            break;

          case "share":
            // Open share dialog or navigate to share page
            toast.info("Share feature coming soon");
            break;

          case "delete":
            if (document) {
              toast.promise(deleteDocument(documentId), {
                loading: t("dashboard.deleting") || "Deleting...",
                success: () => {
                  loadDocuments(); // Refresh list
                  return (
                    t("dashboard.deleteSuccess") ||
                    "Document deleted successfully"
                  );
                },
                error: (error) => {
                  console.error("Delete error:", error);
                  return (
                    t("dashboard.deleteError") || "Failed to delete document"
                  );
                },
              });
            }
            break;

          case "download":
            toast.info("Download feature coming soon");
            break;
        }
      } catch (error) {
        console.error("Document action error:", error);
        toast.error(
          t("dashboard.actionError", { action }) ||
            `Failed to ${action} document`
        );
      }
    },
    [documentState.documents, router, loadDocuments, t]
  );

  // Handle filter changes
  const handleFilterChange = useCallback((filter: DocumentFilter) => {
    setDocumentState((prev) => ({ ...prev, filter }));
  }, []);

  const handleSearchChange = useCallback((searchQuery: string) => {
    setDocumentState((prev) => ({ ...prev, searchQuery }));
  }, []);

  const handleSortChange = useCallback((sortOptions: SortOptions) => {
    setDocumentState((prev) => ({ ...prev, sortOptions }));
  }, []);

  const handleCreateNew = useCallback(() => {
    router.push("/upload");
  }, [router]);

  const handleClearFilters = useCallback(() => {
    setDocumentState((prev) => ({
      ...prev,
      filter: "all",
      searchQuery: "",
    }));
  }, []);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight mb-2">
            {t("dashboard.welcome", {
              name:
                user.user_metadata?.name || user.email?.split("@")[0] || "User",
            })}
          </h1>
          <p className="text-muted-foreground">{t("dashboard.description")}</p>
        </div>

        {/* Main Content */}
        <div className="space-y-6">
          <div className="flex items-center justify-end">
            <Button onClick={handleCreateNew} className="gap-2">
              <Plus className="h-4 w-4" />
              {t("dashboard.createNewDocument")}
            </Button>
          </div>

          <DocumentFilters
            currentFilter={documentState.filter}
            counts={documentState.counts}
            searchQuery={documentState.searchQuery}
            sortOptions={documentState.sortOptions}
            onFilterChange={handleFilterChange}
            onSearchChange={handleSearchChange}
            onSortChange={handleSortChange}
          />

          <DocumentList
            documents={documentState.documents}
            loading={documentState.loading}
            filter={documentState.filter}
            searchQuery={documentState.searchQuery}
            onDocumentAction={handleDocumentAction}
            onCreateNew={handleCreateNew}
            onClearFilters={handleClearFilters}
          />
        </div>
      </div>
    </div>
  );
}

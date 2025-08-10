"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import DocumentUpload from "@/components/document-upload";
import LanguageSelector from "@/components/language-selector";
import { useLanguage } from "@/contexts/language-context";
import { signOut as serverSignOut } from "@/app/auth/actions";
import { deleteDocument } from "@/app/actions/document";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  ArrowLeft,
  LogOut,
  Settings,
  User,
  Plus,
  FolderOpen,
} from "lucide-react";
import Link from "next/link";
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
  const [activeTab, setActiveTab] = useState<"documents" | "upload">(
    "documents"
  );
  const [documentState, setDocumentState] = useState<DocumentListState>({
    documents: [],
    loading: true,
    filter: "all",
    searchQuery: "",
    sortOptions: { field: "created_at", order: "desc" },
    counts: { all: 0, draft: 0, published: 0, completed: 0, expired: 0 },
  });

  const handleSignOut = async () => {
    // Use server action for sign out - it handles redirect automatically
    const formData = new FormData();
    await serverSignOut(formData);
  };

  const getUserDisplayName = () => {
    return (
      user.user_metadata?.name ||
      user.user_metadata?.full_name ||
      user.email?.split("@")[0] ||
      "User"
    );
  };

  const getUserInitials = () => {
    const name = getUserDisplayName();
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

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
              // Navigate to sign page
              router.push(`/s/${document.id}`); // Adjust path as needed
            }
            break;

          case "edit":
            // Switch to upload tab and load document for editing
            setActiveTab("upload");
            // You might want to pass document ID to DocumentUpload component
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
    setActiveTab("upload");
  }, []);

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
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <Link href="/">
            <Button variant="ghost" size="sm" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              <span>{t("dashboard.backToHome")}</span>
            </Button>
          </Link>

          <div className="flex items-center gap-4">
            <LanguageSelector />

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="relative h-10 w-10 rounded-full"
                >
                  <Avatar className="h-10 w-10">
                    <AvatarImage
                      src={user.user_metadata?.avatar_url}
                      alt={getUserDisplayName()}
                    />
                    <AvatarFallback>{getUserInitials()}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">
                      {getUserDisplayName()}
                    </p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {user.email}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <User className="mr-2 h-4 w-4" />
                  <span>{t("dashboard.profile")}</span>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Settings className="mr-2 h-4 w-4" />
                  <span>{t("dashboard.settings")}</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>{t("dashboard.signOut")}</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight mb-2">
            {t("dashboard.welcome", { name: getUserDisplayName() })}
          </h1>
          <p className="text-muted-foreground">{t("dashboard.description")}</p>
        </div>

        {/* Main Content */}
        <Tabs
          value={activeTab}
          onValueChange={(value) =>
            setActiveTab(value as "documents" | "upload")
          }
          className="space-y-6"
        >
          <div className="flex items-center justify-end">
            {activeTab === "documents" && (
              <Button onClick={handleCreateNew} className="gap-2">
                <Plus className="h-4 w-4" />
                {t("dashboard.createNewDocument")}
              </Button>
            )}
          </div>

          {/* Documents Tab */}
          <TabsContent value="documents" className="space-y-6">
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
          </TabsContent>

          {/* Upload Tab */}
          <TabsContent value="upload" className="space-y-6">
            <DocumentUpload />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

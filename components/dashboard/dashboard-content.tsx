"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getUserDocuments, getUserDocumentCounts } from "@/app/actions/document-actions";
import { FileX, Upload } from "lucide-react";
import { InfiniteScrollDocuments } from "@/components/dashboard/infinite-scroll-documents";
import { StatusFilter } from "@/components/dashboard/status-filter";
import { DashboardSkeleton } from "@/components/dashboard/dashboard-skeleton";
import { useLanguage } from "@/contexts/language-context";
import { useAuth } from "@/hooks/use-auth";
import type { Document } from "@/lib/supabase/database.types";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export function DashboardContent() {
  const { t } = useLanguage();
  const { user, loading: authLoading, isAuthenticated } = useAuth();
  const router = useRouter();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [hasMore, setHasMore] = useState(false);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<"all" | "draft" | "published" | "completed">("all");
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

  // Load status counts once on mount
  useEffect(() => {
    if (authLoading) return;

    if (!isAuthenticated) {
      router.push("/login");
      return;
    }

    const loadStatusCounts = async () => {
      try {
        const counts = await getUserDocumentCounts();
        if (counts.error) {
          console.error("Error loading counts:", counts.error);
        } else {
          setStatusCounts(counts);
        }
      } catch (err) {
        console.error("Error loading status counts:", err);
      }
    };

    loadStatusCounts();
  }, [authLoading, isAuthenticated, router]);

  // Load documents when filter changes
  useEffect(() => {
    if (authLoading || !isAuthenticated) return;

    const loadDocuments = async () => {
      try {
        setLoading(true);
        setError(null);

        // Load documents with current filter
        const statusFilter = selectedStatus === "all" ? undefined : selectedStatus;
        const result = await getUserDocuments(1, 12, statusFilter);

        if (result.error) {
          setError(result.error);
        } else {
          setDocuments(result.documents);
          setHasMore(result.hasMore);
          setTotal(result.total);
        }
      } catch (err) {
        setError("Failed to load documents");
        console.error("Error loading documents:", err);
      } finally {
        setLoading(false);
      }
    };

    loadDocuments();
  }, [authLoading, isAuthenticated, selectedStatus]);

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
      {/* Status Filter */}
      <StatusFilter
        selectedStatus={selectedStatus}
        onStatusChange={setSelectedStatus}
        counts={statusCounts}
      />

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
        />
      )}
    </>
  );
}
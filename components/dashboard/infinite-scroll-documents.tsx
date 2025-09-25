"use client";

import { useState, useEffect, useCallback } from "react";
import { useInView } from "react-intersection-observer";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { useLanguage } from "@/contexts/language-context";
import { getUserDocumentsClient } from "@/app/actions/document-actions";
import type { Document } from "@/lib/supabase/database.types";
import { DocumentCard } from "./document-card";
import { DocumentCardsSkeletonGrid } from "./document-card-skeleton";

interface InfiniteScrollDocumentsProps {
  initialDocuments: Document[];
  initialHasMore: boolean;
  status?: "draft" | "published" | "completed";
}

export function InfiniteScrollDocuments({
  initialDocuments,
  initialHasMore,
  status,
}: InfiniteScrollDocumentsProps) {
  const { t } = useLanguage();
  const [documents, setDocuments] = useState<Document[]>(initialDocuments);
  const [page, setPage] = useState(2); // Start from page 2 (page 1 is SSR)
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Intersection Observer for infinite scroll
  const { ref, inView } = useInView({
    threshold: 0,
    triggerOnce: false,
  });

  const loadMoreDocuments = useCallback(async () => {
    if (isLoadingMore || !hasMore) return;

    setIsLoadingMore(true);
    setError(null);

    try {
      const result = await getUserDocumentsClient(page, 12, status);

      if (result.error) {
        setError(result.error);
        toast.error(result.error);
        return;
      }

      if (result.documents.length > 0) {
        setDocuments(prev => [...prev, ...result.documents]);
        setPage(prev => prev + 1);
      }

      setHasMore(result.hasMore);
    } catch (err) {
      const errorMessage = t("dashboard.error.loadMore");
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoadingMore(false);
    }
  }, [page, hasMore, isLoadingMore, status, t]);

  // Load more when the trigger element comes into view
  useEffect(() => {
    if (inView && hasMore && !isLoadingMore) {
      loadMoreDocuments();
    }
  }, [inView, hasMore, isLoadingMore, loadMoreDocuments]);

  return (
    <div className="space-y-6">
      {/* Documents Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {documents.map((document) => (
          <DocumentCard key={document.id} document={document} />
        ))}
      </div>

      {/* Loading More Indicator */}
      {hasMore && (
        <div ref={ref} className="flex justify-center py-8">
          {isLoadingMore ? (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>{t("dashboard.loading.more")}</span>
            </div>
          ) : (
            // This div acts as the intersection trigger
            <div className="h-4" />
          )}
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="flex justify-center py-8">
          <div className="text-center">
            <p className="text-sm text-destructive mb-2">{error}</p>
            <button
              onClick={loadMoreDocuments}
              className="text-sm text-primary hover:underline"
              disabled={isLoadingMore}
            >
              {t("dashboard.retry")}
            </button>
          </div>
        </div>
      )}

      {/* End of List */}
      {!hasMore && documents.length > 0 && (
        <div className="text-center py-8">
          <p className="text-sm text-muted-foreground">
            {t("dashboard.end.message")}
          </p>
        </div>
      )}
    </div>
  );
}
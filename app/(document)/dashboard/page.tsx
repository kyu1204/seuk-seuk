"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getUserDocuments } from "@/app/actions/document-actions";
import { createClientSupabase } from "@/lib/supabase/client";
import { DocumentDashboard } from "@/components/dashboard/document-dashboard";
import { InfiniteScrollDocuments } from "@/components/dashboard/infinite-scroll-documents";
import { useLanguage } from "@/contexts/language-context";
import { useAuth } from "@/hooks/use-auth";
import type { Document } from "@/lib/supabase/database.types";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export default function DashboardPage() {
  const { t } = useLanguage();
  const { user, loading: authLoading, isAuthenticated } = useAuth();
  const router = useRouter();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [hasMore, setHasMore] = useState(false);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;

    if (!isAuthenticated) {
      router.push("/login");
      return;
    }

    // Load initial documents
    const loadDocuments = async () => {
      try {
        setLoading(true);
        const result = await getUserDocuments(1, 12);

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
  }, [authLoading, isAuthenticated, router]);

  // Show loading while checking auth or loading documents
  if (authLoading || loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="flex items-center justify-between mb-8">
              <div className="space-y-2">
                <div className="h-9 w-48 bg-gray-200 rounded"></div>
                <div className="h-5 w-64 bg-gray-200 rounded"></div>
              </div>
              <div className="h-10 w-32 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-8">
            <p className="text-red-600">Error: {error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (documents.length === 0) {
    return <DocumentDashboard documents={[]} total={0} />;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight mb-2">
              {t("dashboard.title")}
            </h1>
            <p className="text-muted-foreground">
              {t("dashboard.description", { total })}
            </p>
          </div>
          <Link href="/upload">
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              {t("dashboard.upload")}
            </Button>
          </Link>
        </div>

        {/* Infinite Scroll Documents */}
        <InfiniteScrollDocuments
          initialDocuments={documents}
          initialHasMore={hasMore}
        />
      </div>
    </div>
  );
}
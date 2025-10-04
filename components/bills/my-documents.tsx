"use client";

import { useEffect, useState } from "react";
import { createClientSupabase } from "@/lib/supabase/client";
import { useLanguage } from "@/contexts/language-context";
import type { Document } from "@/lib/supabase/database.types";
import { LoadingScreen } from "@/components/bills/loading-screen";
import { DocumentDetailCard } from "@/components/bills/document-detail-card";
import { NoDocumentsView } from "@/components/bills/no-documents-view";
import { FileText, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export function MyDocuments() {
  const { t } = useLanguage();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchDocuments() {
      try {
        const supabase = createClientSupabase();

        // Get current user
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          setError("User not authenticated");
          setLoading(false);
          return;
        }

        // Fetch user's documents
        const { data, error: fetchError } = await supabase
          .from("documents")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false });

        if (fetchError) {
          console.error("Error fetching documents:", fetchError);
          setError("Failed to load documents");
        } else {
          setDocuments(data || []);
        }
      } catch (err) {
        console.error("Error:", err);
        setError("An unexpected error occurred");
      } finally {
        setLoading(false);
      }
    }

    fetchDocuments();
  }, []);

  if (loading) {
    return <LoadingScreen />;
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (documents.length === 0) {
    return <NoDocumentsView />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-muted-foreground">
        <FileText className="h-5 w-5" />
        <span className="text-sm">
          {t("bills.totalDocuments", { count: documents.length })}
        </span>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {documents.map((document) => (
          <DocumentDetailCard key={document.id} document={document} />
        ))}
      </div>
    </div>
  );
}

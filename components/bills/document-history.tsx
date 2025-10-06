"use client";

import { useEffect, useState } from "react";
import { createClientSupabase } from "@/lib/supabase/client";
import { useLanguage } from "@/contexts/language-context";
import type { Document } from "@/lib/supabase/database.types";
import { LoadingScreen } from "@/components/bills/loading-screen";
import { DataTable } from "@/components/bills/data-table";
import { columns } from "@/components/bills/columns";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export function DocumentHistory() {
  const { t } = useLanguage();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchDocumentHistory() {
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

        // Fetch user's document history
        const { data, error: fetchError } = await supabase
          .from("documents")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false });

        if (fetchError) {
          console.error("Error fetching document history:", fetchError);
          setError("Failed to load document history");
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

    fetchDocumentHistory();
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

  return (
    <div className="space-y-6">
      <div className="text-sm text-muted-foreground">
        {t("bills.historyDescription")}
      </div>
      <DataTable columns={columns} data={documents} />
    </div>
  );
}

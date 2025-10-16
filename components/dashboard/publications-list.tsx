"use client";

import { useState, useEffect } from "react";
import { FileX } from "lucide-react";
import { useLanguage } from "@/contexts/language-context";
import { getUserPublications } from "@/app/actions/publication-actions";
import type { ClientPublication } from "@/lib/supabase/database.types";
import { PublicationCard } from "./publication-card";
import { DashboardSkeleton } from "./dashboard-skeleton";
import { Button } from "@/components/ui/button";
import Link from "next/link";

interface PublicationsListProps {
  statusFilter?: "all" | "active" | "completed" | "expired";
}

export function PublicationsList({ statusFilter = "all" }: PublicationsListProps) {
  const { t } = useLanguage();
  const [publications, setPublications] = useState<ClientPublication[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
  }, [statusFilter]);

  const handleDelete = () => {
    // Reload publications after deletion
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

  if (publications.length === 0) {
    return (
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
    );
  }

  return (
    <div className="space-y-6">
      {/* Publications Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {publications.map((publication) => (
          <PublicationCard
            key={publication.id}
            publication={publication}
            onDelete={handleDelete}
          />
        ))}
      </div>
    </div>
  );
}

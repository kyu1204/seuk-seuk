"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Plus, Upload, FileX } from "lucide-react";
import { useLanguage } from "@/contexts/language-context";
import type { Document } from "@/lib/supabase/database.types";
import { DocumentCard } from "./document-card";

interface DocumentDashboardProps {
  documents: Document[];
  total: number;
}

export function DocumentDashboard({ documents, total }: DocumentDashboardProps) {
  const { t } = useLanguage();

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
            <Button size="lg" className="gap-2">
              <Plus className="h-4 w-4" />
              {t("dashboard.upload")}
            </Button>
          </Link>
        </div>

        {/* Documents Grid */}
        {documents.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {documents.map((document) => (
              <DocumentCard key={document.id} document={document} />
            ))}
          </div>
        ) : (
          <EmptyState />
        )}
      </div>
    </div>
  );
}

function EmptyState() {
  const { t } = useLanguage();

  return (
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
  );
}
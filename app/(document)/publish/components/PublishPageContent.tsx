"use client";

import { ProjectBreadcrumb } from "@/components/breadcrumb";
import PublishForm from "@/components/publish/publish-form";
import type { Document } from "@/lib/supabase/database.types";
import { useLanguage } from "@/contexts/language-context";
import { PublicationsList } from "@/components/dashboard/publications-list";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Upload } from "lucide-react";

interface PublishPageContentProps {
  documents: Document[];
}

export default function PublishPageContent({ documents }: PublishPageContentProps) {
  const { t } = useLanguage();

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        {/* Breadcrumb */}
        <ProjectBreadcrumb />

        <h1 className="text-2xl font-bold mb-6">{t("publish.title")}</h1>

        {documents.length === 0 ? (
          <div className="space-y-8">
            {/* No drafts message */}
            <div className="bg-muted px-4 py-8 rounded-lg text-center max-w-2xl mx-auto">
              <p className="text-muted-foreground mb-4">
                {t("publish.noDrafts")}
              </p>
              <Link href="/upload">
                <Button className="gap-2">
                  <Upload className="h-4 w-4" />
                  {t("publish.uploadDocument")}
                </Button>
              </Link>
            </div>

            {/* Show existing publications */}
            <div>
              <h2 className="text-xl font-semibold mb-4">{t("publish.existingPublications")}</h2>
              <PublicationsList />
            </div>
          </div>
        ) : (
          <div className="max-w-2xl mx-auto">
            <PublishForm documents={documents} />
          </div>
        )}
      </div>
    </div>
  );
}

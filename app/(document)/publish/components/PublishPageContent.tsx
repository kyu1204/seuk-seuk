"use client";

import { ProjectBreadcrumb } from "@/components/breadcrumb";
import PublishForm from "@/components/publish/publish-form";
import type { Document } from "@/lib/supabase/database.types";
import { useLanguage } from "@/contexts/language-context";

interface PublishPageContentProps {
  documents: Document[];
}

export default function PublishPageContent({ documents }: PublishPageContentProps) {
  const { t } = useLanguage();

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto">
        {/* Breadcrumb */}
        <ProjectBreadcrumb />

        <h1 className="text-2xl font-bold mb-6">{t("publish.title")}</h1>
        <PublishForm documents={documents} />
      </div>
    </div>
  );
}

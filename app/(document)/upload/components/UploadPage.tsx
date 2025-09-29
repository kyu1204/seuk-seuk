"use client";

import DocumentUpload from "@/components/document-upload";
import { useLanguage } from "@/contexts/language-context";
import { ProjectBreadcrumb } from "@/components/breadcrumb";

export default function UploadPageComponent() {
  const { t } = useLanguage();

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-5xl mx-auto">
        {/* Breadcrumb */}
        <ProjectBreadcrumb />

        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight mb-2">
            {t("upload.title")}
          </h1>
          <p className="text-muted-foreground">{t("upload.description")}</p>
        </div>

        <DocumentUpload />
      </div>
    </div>
  );
}

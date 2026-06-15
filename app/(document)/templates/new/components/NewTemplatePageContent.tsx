"use client";

import DocumentUpload from "@/components/document-upload";
import { ProjectBreadcrumb } from "@/components/breadcrumb";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/language-context";
import { Sparkles } from "lucide-react";
import Link from "next/link";

interface NewTemplatePageContentProps {
  allowed: boolean;
}

export function NewTemplatePageContent({ allowed }: NewTemplatePageContentProps) {
  const { t } = useLanguage();

  if (!allowed) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-5xl mx-auto">
          <ProjectBreadcrumb />
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="rounded-full bg-primary/10 p-6 mb-6">
              <Sparkles className="h-12 w-12 text-primary" />
            </div>
            <h1 className="text-2xl font-bold mb-2">
              {t("templates.upgrade.title")}
            </h1>
            <p className="text-muted-foreground mb-6 max-w-md">
              {t("templates.upgrade.description")}
            </p>
            <Button asChild size="lg">
              <Link href="/pricing">{t("templates.upgrade.cta")}</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-5xl mx-auto">
        <ProjectBreadcrumb />

        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight mb-2">
            {t("templates.create")}
          </h1>
          <p className="text-muted-foreground">
            {t("templates.create.description")}
          </p>
        </div>

        <DocumentUpload mode="template" />
      </div>
    </div>
  );
}

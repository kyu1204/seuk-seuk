"use client";

import { useLanguage } from "@/contexts/language-context";
import { Button } from "@/components/ui/button";
import { FileText } from "lucide-react";
import Link from "next/link";

export function NoDocumentsView() {
  const { t } = useLanguage();

  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <div className="mb-6 p-4 rounded-full bg-muted">
        <FileText className="h-12 w-12 text-muted-foreground" />
      </div>
      <h3 className="text-xl font-semibold mb-2">
        {t("bills.noDocuments.title")}
      </h3>
      <p className="text-muted-foreground mb-6 max-w-md">
        {t("bills.noDocuments.description")}
      </p>
      <Link href="/upload">
        <Button size="lg" className="gap-2">
          <FileText className="h-5 w-5" />
          {t("bills.noDocuments.action")}
        </Button>
      </Link>
    </div>
  );
}

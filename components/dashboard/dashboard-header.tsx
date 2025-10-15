"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Plus, Share2 } from "lucide-react";
import { UsageWidget } from "./usage-widget";
import { useLanguage } from "@/contexts/language-context";

export function DashboardHeader() {
  const { t } = useLanguage();

  return (
    <div className="space-y-8 mb-8">
      {/* Header Section */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">
            {t("dashboard.header.title")}
          </h1>
          <p className="text-muted-foreground">
            {t("dashboard.header.description")}
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/publish">
            <Button variant="outline" className="gap-2">
              <Share2 className="h-4 w-4" />
              문서 발행
            </Button>
          </Link>
          <Link href="/upload">
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              {t("dashboard.upload")}
            </Button>
          </Link>
        </div>
      </div>

      {/* Usage Widget */}
      <div className="max-w-md">
        <UsageWidget />
      </div>
    </div>
  );
}
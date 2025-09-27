"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
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
        <Link href="/upload">
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            {t("dashboard.upload")}
          </Button>
        </Link>
      </div>

      {/* Usage Widget */}
      <div className="max-w-md">
        <UsageWidget />
      </div>
    </div>
  );
}
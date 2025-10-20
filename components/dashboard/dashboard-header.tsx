"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Plus, Share2 } from "lucide-react";
import { UsageWidget } from "./usage-widget";
import { useLanguage } from "@/contexts/language-context";

export function DashboardHeader() {
  const { t } = useLanguage();

  return (
    <div className="space-y-6 mb-8">
      {/* Title and Description */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight mb-2">
          {t("dashboard.header.title")}
        </h1>
        <p className="text-sm sm:text-base text-muted-foreground">
          {t("dashboard.header.description")}
        </p>
      </div>

      {/* Action Buttons - Mobile & Desktop: 2 buttons in a row */}
      <div className="flex flex-row gap-2">
        <Link href="/publish" className="flex-1 sm:flex-initial">
          <Button variant="outline" className="w-full gap-2">
            <Share2 className="h-4 w-4" />
            {t("dashboard.publish")}
          </Button>
        </Link>
        <Link href="/upload" className="flex-1 sm:flex-initial">
          <Button className="w-full gap-2">
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
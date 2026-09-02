"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Link2, Upload } from "lucide-react";
import { UsageWidget } from "./usage-widget";
import type { UsageWidgetData } from "./usage-widget";
import { useLanguage } from "@/contexts/language-context";

interface DashboardHeaderProps {
  usage: UsageWidgetData;
}

export function DashboardHeader({ usage }: DashboardHeaderProps) {
  const { t } = useLanguage();

  return (
    <div className="space-y-6 mb-8">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        {/* Title and Description */}
        <div>
          <h1 className="text-xl font-bold tracking-tight mb-2">
            {t("dashboard.header.title")}
          </h1>
          <p className="text-sm text-muted-foreground">
            {t("dashboard.header.description")}
          </p>
        </div>

        {/* Action Buttons - Mobile: Full width row, Desktop: Right aligned */}
        <div className="flex flex-row gap-2">
          <Link href="/publish" className="flex-1 sm:flex-initial">
            <Button variant="outline" className="w-full gap-2">
              <Link2 className="h-4 w-4" />
              {t("dashboard.publish")}
            </Button>
          </Link>
          <Link href="/upload" className="flex-1 sm:flex-initial">
            <Button className="w-full gap-2">
              <Upload className="h-4 w-4" />
              {t("dashboard.upload.document")}
            </Button>
          </Link>
        </div>
      </div>

      {/* Usage Widget */}
      <UsageWidget data={usage} />
    </div>
  );
}
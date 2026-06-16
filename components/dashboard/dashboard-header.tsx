"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronDown, FileStack, Plus, Share2, Upload } from "lucide-react";
import { UsageWidget } from "./usage-widget";
import { useLanguage } from "@/contexts/language-context";

export function DashboardHeader() {
  const { t } = useLanguage();

  return (
    <div className="space-y-8 mb-8">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        {/* Title and Description */}
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight mb-2">
            {t("dashboard.header.title")}
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            {t("dashboard.header.description")}
          </p>
        </div>

        {/* Action Buttons - Mobile: Full width row, Desktop: Right aligned */}
        <div className="flex flex-row gap-2">
          <Link href="/publish" className="flex-1 sm:flex-initial">
            <Button variant="outline" className="w-full gap-2">
              <Share2 className="h-4 w-4" />
              {t("dashboard.publish")}
            </Button>
          </Link>
          <div className="flex-1 sm:flex-initial">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button className="w-full gap-2 sm:w-auto">
                  <Plus className="h-4 w-4" />
                  {t("dashboard.upload")}
                  <ChevronDown className="h-4 w-4 opacity-70" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64">
                <DropdownMenuItem asChild>
                  <Link href="/upload" className="cursor-pointer">
                    <Upload className="mr-2 h-4 w-4" />
                    <div className="flex flex-col">
                      <span>{t("dashboard.upload.document")}</span>
                      <span className="text-xs text-muted-foreground">
                        {t("dashboard.upload.documentDescription")}
                      </span>
                    </div>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/templates/new" className="cursor-pointer">
                    <FileStack className="mr-2 h-4 w-4" />
                    <div className="flex flex-col">
                      <span>{t("dashboard.upload.template")}</span>
                      <span className="text-xs text-muted-foreground">
                        {t("dashboard.upload.templateDescription")}
                      </span>
                    </div>
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {/* Usage Widget */}
      <div className="max-w-md">
        <UsageWidget />
      </div>
    </div>
  );
}
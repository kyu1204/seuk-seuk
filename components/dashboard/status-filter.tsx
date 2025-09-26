"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/language-context";

interface StatusFilterProps {
  selectedStatus: "all" | "draft" | "published" | "completed";
  onStatusChange: (status: "all" | "draft" | "published" | "completed") => void;
  counts?: {
    all: number;
    draft: number;
    published: number;
    completed: number;
  };
}

export function StatusFilter({ selectedStatus, onStatusChange, counts }: StatusFilterProps) {
  const { t } = useLanguage();

  const filterOptions = [
    { key: "all", label: t("dashboard.filter.all"), count: counts?.all },
    { key: "draft", label: t("dashboard.filter.draft"), count: counts?.draft },
    { key: "published", label: t("dashboard.filter.published"), count: counts?.published },
    { key: "completed", label: t("dashboard.filter.completed"), count: counts?.completed },
  ] as const;

  return (
    <div className="flex flex-wrap gap-2 mb-6">
      {filterOptions.map((option) => (
        <Button
          key={option.key}
          variant={selectedStatus === option.key ? "default" : "outline"}
          onClick={() => onStatusChange(option.key)}
          className="gap-2"
        >
          {option.label}
          {counts && option.count !== undefined && (
            <span className="px-1.5 py-0.5 text-xs rounded-full bg-background/20">
              {option.count}
            </span>
          )}
        </Button>
      ))}
    </div>
  );
}
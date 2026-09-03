"use client";

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
    <div className="flex gap-2 overflow-x-auto md:flex-wrap md:overflow-visible [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden -mx-4 px-4 md:mx-0 md:px-0">
      {filterOptions.map((option) => (
        <button
          key={option.key}
          type="button"
          onClick={() => onStatusChange(option.key)}
          className={`h-[30px] shrink-0 whitespace-nowrap rounded-full px-3 text-sm transition-colors ${
            selectedStatus === option.key
              ? "bg-primary/10 text-primary border-primary/30 border"
              : "border text-muted-foreground bg-transparent"
          }`}
        >
          {option.label}
          {counts && option.count !== undefined && ` ${option.count}`}
        </button>
      ))}
    </div>
  );
}
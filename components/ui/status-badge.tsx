"use client";

import { Check } from "lucide-react";
import { useLanguage } from "@/contexts/language-context";
import { cn } from "@/lib/utils";
import { statusBadgeClass, statusLabelKey, type BadgeStatus } from "./status-badge-utils";

export { statusBadgeClass, statusLabelKey, type BadgeStatus } from "./status-badge-utils";

interface StatusBadgeProps {
  status: BadgeStatus;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const { t } = useLanguage();

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 h-6 px-2.5 rounded-full text-xs font-medium",
        statusBadgeClass(status),
        className
      )}
    >
      {status === "completed" && <Check className="h-3 w-3" />}
      {t(statusLabelKey(status))}
    </span>
  );
}

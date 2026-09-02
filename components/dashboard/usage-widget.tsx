"use client";

import Link from "next/link";
import type {
  UsageLimits,
  Subscription,
} from "@/app/actions/subscription-actions";
import type { CreditBalance } from "@/app/actions/credit-actions";
import { useLanguage } from "@/contexts/language-context";

export interface UsageWidgetData {
  limits: UsageLimits | null;
  subscription: Subscription | null;
  credits: CreditBalance;
  error?: string;
}

function progressClass(progress: number, atLimit: boolean) {
  if (atLimit) return "bg-seal";
  if (progress >= 80) return "bg-amber";
  return "bg-primary";
}

export function UsageWidget({ data }: { data: UsageWidgetData }) {
  const { t } = useLanguage();
  const { limits, error } = data;
  const credits = data.credits ?? { create_credits: 0, publish_credits: 0 };

  if (error || !limits) {
    return (
      <div className="rounded-xl border bg-card px-5 py-3.5 text-sm text-muted-foreground">
        {error || t("usage.error.message")}
      </div>
    );
  }

  const monthlyLimit = limits.monthlyCreationLimit;
  const activeLimit = limits.activeDocumentLimit;

  const monthlyUnlimited = monthlyLimit === -1;
  const activeUnlimited = activeLimit === -1;

  const monthlyProgress =
    monthlyUnlimited || monthlyLimit === 0
      ? 0
      : (limits.currentMonthlyCreated / monthlyLimit) * 100;
  const activeProgress =
    activeUnlimited || activeLimit === 0
      ? 0
      : (limits.currentActiveDocuments / activeLimit) * 100;

  const monthlyAtLimit = !limits.canCreateNew && credits.create_credits === 0;
  const activeAtLimit = !limits.canPublishMore && credits.publish_credits === 0;
  const anyAtLimit = monthlyAtLimit || activeAtLimit;

  return (
    <div className="rounded-xl border bg-card px-5 py-3.5 flex flex-col md:flex-row gap-5 md:items-center">
      <div className="flex-1 space-y-1.5">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">{t("usage.summary.sent")}</span>
          <span className="font-medium">
            {limits.currentMonthlyCreated}
            {monthlyUnlimited
              ? `/${t("usage.monthly.unlimited")}`
              : `/${monthlyLimit}건`}
          </span>
        </div>
        {!monthlyUnlimited && (
          <div className="h-1.5 rounded-full bg-muted overflow-hidden">
            <div
              className={`h-full rounded-full ${progressClass(monthlyProgress, monthlyAtLimit)}`}
              style={{ width: `${Math.min(monthlyProgress, 100)}%` }}
            />
          </div>
        )}
      </div>

      <div className="flex-1 space-y-1.5">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">{t("usage.summary.active")}</span>
          <span className="font-medium">
            {limits.currentActiveDocuments}
            {activeUnlimited
              ? `/${t("usage.monthly.unlimited")}`
              : `/${activeLimit}건`}
          </span>
        </div>
        {!activeUnlimited && (
          <div className="h-1.5 rounded-full bg-muted overflow-hidden">
            <div
              className={`h-full rounded-full ${progressClass(activeProgress, activeAtLimit)}`}
              style={{ width: `${Math.min(activeProgress, 100)}%` }}
            />
          </div>
        )}
      </div>

      {anyAtLimit && (
        <p className="text-xs text-seal">{t("usage.limit.reachedHint")}</p>
      )}

      <Link
        href="/pricing"
        className="text-sm font-medium text-primary hover:underline whitespace-nowrap"
      >
        {t("usage.managePlan")}
      </Link>
    </div>
  );
}

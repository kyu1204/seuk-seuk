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

  const planName = data.subscription?.plan?.name ?? t("usage.plan.free");

  const tile = (
    label: string,
    used: number,
    limit: number,
    unlimited: boolean,
    progress: number,
    atLimit: boolean
  ) => (
    <div className="rounded-xl border bg-card p-4 shadow-sm flex flex-col gap-3">
      <span className="text-sm text-muted-foreground">{label}</span>
      <div className="flex items-baseline gap-1.5">
        <span className="text-2xl font-bold tabular-nums tracking-tight">{used}</span>
        {unlimited ? (
          <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
            {t("usage.monthly.unlimited")}
          </span>
        ) : (
          <span className="text-sm text-muted-foreground tabular-nums">/ {limit}건</span>
        )}
      </div>
      {!unlimited && (
        <div className="h-1.5 rounded-full bg-muted overflow-hidden">
          <div
            className={`h-full rounded-full ${progressClass(progress, atLimit)}`}
            style={{ width: `${Math.min(progress, 100)}%` }}
          />
        </div>
      )}
    </div>
  );

  const compactStat = (label: string, used: number, limit: number, unlimited: boolean, progress: number, atLimit: boolean) => (
    <div className="flex-1 min-w-0 flex flex-col gap-1.5">
      <span className="text-[11px] text-muted-foreground truncate">{label}</span>
      <span className="text-base font-semibold tabular-nums leading-none">
        {used}
        <span className="text-xs font-normal text-muted-foreground">
          {" / "}
          {unlimited ? t("usage.monthly.unlimited") : `${limit}건`}
        </span>
      </span>
      <div className="h-1 rounded-full bg-muted overflow-hidden">
        <div
          className={`h-full rounded-full ${unlimited ? "bg-primary/30" : progressClass(progress, atLimit)}`}
          style={{ width: unlimited ? "100%" : `${Math.min(progress, 100)}%` }}
        />
      </div>
    </div>
  );

  return (
    <>
      {/* 모바일: 카드 한 장에 두 지표를 나란히, 플랜은 아래 한 줄 */}
      <div className="sm:hidden rounded-xl border bg-card p-4 shadow-sm flex flex-col gap-3">
        <div className="flex gap-4">
          {compactStat(t("usage.summary.sent"), limits.currentMonthlyCreated, monthlyLimit, monthlyUnlimited, monthlyProgress, monthlyAtLimit)}
          <div className="w-px bg-border" />
          {compactStat(t("usage.summary.active"), limits.currentActiveDocuments, activeLimit, activeUnlimited, activeProgress, activeAtLimit)}
        </div>
        <div className="flex items-center justify-between border-t pt-2.5 text-xs">
          <span className={anyAtLimit ? "text-seal" : "text-muted-foreground"}>
            {anyAtLimit
              ? t("usage.limit.reachedHint")
              : `${planName} ${t("usage.plan.suffix")}`}
          </span>
          <Link href="/pricing" className="font-medium text-primary">
            {t("usage.managePlan")}
          </Link>
        </div>
      </div>

      {/* 태블릿 이상: 타일 3개 */}
      <div className="hidden sm:grid gap-4 sm:grid-cols-2 lg:grid-cols-3">      {tile(t("usage.summary.sent"), limits.currentMonthlyCreated, monthlyLimit, monthlyUnlimited, monthlyProgress, monthlyAtLimit)}
      {tile(t("usage.summary.active"), limits.currentActiveDocuments, activeLimit, activeUnlimited, activeProgress, activeAtLimit)}
      <div className="rounded-xl border bg-card p-4 shadow-sm flex flex-col gap-3 sm:col-span-2 lg:col-span-1">
        <span className="text-sm text-muted-foreground">{t("usage.summary.plan")}</span>
        <div className="flex items-baseline justify-between gap-3">
          <span className="text-2xl font-bold tracking-tight">
            {planName} {t("usage.plan.suffix")}
          </span>
          <Link href="/pricing" className="text-sm font-medium text-primary hover:underline whitespace-nowrap">
            {t("usage.managePlan")}
          </Link>
        </div>
        {anyAtLimit ? (
          <p className="text-xs text-seal">{t("usage.limit.reachedHint")}</p>
        ) : (
          <p className="text-xs text-muted-foreground">{t("usage.summary.planHint")}</p>
        )}
      </div>
      </div>
    </>
  );
}

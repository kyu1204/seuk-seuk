"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  FileText,
  TrendingUp,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  BookPlus,
} from "lucide-react";
import {
  getUserUsageLimits,
  getCurrentSubscription,
} from "@/app/actions/subscription-actions";
import type {
  UsageLimits,
  Subscription,
} from "@/app/actions/subscription-actions";
import { getCreditBalance } from "@/app/actions/credit-actions";
import type { CreditBalance } from "@/app/actions/credit-actions";
import { useLanguage } from "@/contexts/language-context";
import Link from "next/link";
import { useRouter } from "next/navigation";

export function UsageWidget() {
  const { t } = useLanguage();
  const router = useRouter();
  const [limits, setLimits] = useState<UsageLimits | null>(null);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [credits, setCredits] = useState<CreditBalance>({ create_credits: 0, publish_credits: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    async function fetchUsageData() {
      try {
        const [limitsResult, subscriptionResult, creditsResult] = await Promise.all([
          getUserUsageLimits(),
          getCurrentSubscription(),
          getCreditBalance(),
        ]);

        if (limitsResult.error) {
          setError(limitsResult.error);
          return;
        }

        if (subscriptionResult.error) {
          setError(subscriptionResult.error);
          return;
        }

        setLimits(limitsResult.limits);
        setSubscription(subscriptionResult.subscription);

        // 크레딧 조회 (에러는 무시하고 0으로 유지)
        if (creditsResult.credits) {
          setCredits(creditsResult.credits);
        }
      } catch (err) {
        setError("Failed to load usage data");
        console.error("Usage widget error:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchUsageData();
  }, []);

  if (loading) {
    return (
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <Card>
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
              <CardTitle className="flex items-center gap-2 text-lg">
                <FileText className="h-5 w-5" />
                {t("usage.title")}
                {isOpen ? (
                  <ChevronUp className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                )}
              </CardTitle>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="pt-0">
              <div className="space-y-4">
                <div className="h-4 bg-muted rounded animate-pulse" />
                <div className="h-4 bg-muted rounded animate-pulse w-3/4" />
                <div className="h-4 bg-muted rounded animate-pulse w-1/2" />
              </div>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>
    );
  }

  if (error || !limits) {
    return (
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <Card>
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-destructive" />
                {t("usage.error.title")}
                {isOpen ? (
                  <ChevronUp className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                )}
              </CardTitle>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="pt-0">
              <p className="text-sm text-muted-foreground">
                {error || t("usage.error.message")}
              </p>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>
    );
  }

  // Calculate effective limits including credits
  const effectiveMonthlyLimit = limits.monthlyCreationLimit === -1
    ? -1
    : limits.monthlyCreationLimit + credits.create_credits;

  const effectiveActiveLimit = limits.activeDocumentLimit === -1
    ? -1
    : limits.activeDocumentLimit + credits.publish_credits;

  // Calculate progress with division-by-zero protection
  const monthlyProgress =
    effectiveMonthlyLimit === -1 || effectiveMonthlyLimit === 0
      ? 0
      : (limits.currentMonthlyCreated / effectiveMonthlyLimit) * 100;

  const activeProgress =
    effectiveActiveLimit === -1 || effectiveActiveLimit === 0
      ? 0
      : (limits.currentActiveDocuments / effectiveActiveLimit) * 100;

  const isMonthlyNearLimit = monthlyProgress >= 80;
  const isActiveNearLimit = activeProgress >= 80;

  const planName = subscription?.plan?.name ?? "Basic";
  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <Card>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                <CardTitle className="text-lg">{t("usage.title")}</CardTitle>
                {isOpen ? (
                  <ChevronUp className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                )}
              </div>
              <Badge variant={planName === "Basic" ? "secondary" : "default"}>
                {planName === "Basic" ? t("usage.plan.free") : planName} {t("usage.plan.suffix")}
              </Badge>
            </div>
            <CardDescription>{t("usage.description")}</CardDescription>
          </CardHeader>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent className="space-y-6 pt-0">
            {/* Monthly Creation Usage */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">{t("usage.monthly.title")}</span>
                <span
                  className={
                    isMonthlyNearLimit ? "text-destructive font-medium" : ""
                  }
                >
                  {limits.currentMonthlyCreated}{" "}
                  {effectiveMonthlyLimit === -1
                    ? `/ ${t("usage.monthly.unlimited")}`
                    : `/ ${effectiveMonthlyLimit}`}
                  {credits.create_credits > 0 && (
                    <span className="text-primary ml-1">
                      (+{credits.create_credits}{t("usage.credit.unit", " docs")})
                    </span>
                  )}
                </span>
              </div>
              {effectiveMonthlyLimit !== -1 && (
                <Progress
                  value={monthlyProgress}
                  className={`h-2 ${
                    isMonthlyNearLimit ? "[&>div]:bg-destructive" : ""
                  }`}
                />
              )}
              {!limits.canCreateNew && credits.create_credits === 0 && (
                <p className="mt-1 text-xs text-destructive">
                  {t("usage.monthly.limit.reached")}
                </p>
              )}
              {!limits.canCreateNew && credits.create_credits > 0 && (
                <p className="mt-1 text-xs text-primary">
                  {t("usage.credit.available")}
                </p>
              )}
            </div>

            {/* Active Documents Usage */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium whitespace-pre-line">{t("usage.active.title")}</span>
                <span
                  className={
                    isActiveNearLimit ? "text-destructive font-medium" : ""
                  }
                >
                  {limits.currentActiveDocuments}{" "}
                  {effectiveActiveLimit === -1
                    ? `/ ${t("usage.monthly.unlimited")}`
                    : `/ ${effectiveActiveLimit}`}
                  {credits.publish_credits > 0 && (
                    <span className="text-primary ml-1">
                      (+{credits.publish_credits}{t("usage.credit.unit", " docs")})
                    </span>
                  )}
                </span>
              </div>
              {effectiveActiveLimit !== -1 && (
                <Progress
                  value={activeProgress}
                  className={`h-2 ${
                    isActiveNearLimit ? "[&>div]:bg-destructive" : ""
                  }`}
                />
              )}
              {!limits.canPublishMore && credits.publish_credits === 0 && (
                <p className="mt-1 text-xs text-destructive">
                  {t("usage.active.limit.reached")}
                </p>
              )}
              {!limits.canPublishMore && credits.publish_credits > 0 && (
                <p className="mt-1 text-xs text-primary">
                  {t("usage.credit.publishAvailable")}
                </p>
              )}
            </div>

            {/* Credit Purchase CTA - Show when any limit is reached */}
            {((!limits.canCreateNew && credits.create_credits === 0) ||
              (!limits.canPublishMore && credits.publish_credits === 0)) && (
              <div className="pt-4 border-t">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">
                      {t("usage.credit.needMore", "추가 문서가 필요하신가요?")}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {t("usage.credit.purchaseDesc", "추가문서를 구매하여 더 많이 이용하세요")}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    className="gap-2"
                    onClick={() => router.push("/pricing")}
                  >
                    <BookPlus className="h-4 w-4" />
                    {t("usage.credit.recharge")}
                  </Button>
                </div>
              </div>
            )}

            {/* Upgrade CTA - Show only when not Enterprise or when no subscription (treat as Free) */}
            {planName !== "Enterprise" && (
              <div className="pt-4 border-t">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">
                      {t("usage.upgrade.title")}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {(() => {
                        const key = planName.toLowerCase();
                        return key === "free" || key === "basic";
                      })()
                        ? t("usage.upgrade.description.free")
                        : t("usage.upgrade.description.pro")}
                    </p>
                  </div>
                  <Link href="/pricing">
                    <Button size="sm" className="gap-2">
                      <TrendingUp className="h-4 w-4" />
                      {t("usage.upgrade.button")}
                    </Button>
                  </Link>
                </div>
              </div>
            )}

            {/* Plan Features Summary */}
            {subscription?.plan?.features &&
              subscription.plan.features.length > 0 && (
                <div className="pt-4 border-t">
                  <p className="text-sm font-medium mb-2">
                    {t("usage.features.title")}
                  </p>
                  <ul className="text-xs text-muted-foreground space-y-1">
                    {subscription.plan.features
                      .slice(0, 2)
                      .map((feature, index) => (
                        <li key={index} className="flex items-center gap-2">
                          <div className="w-1 h-1 bg-primary rounded-full" />
                          {feature}
                        </li>
                      ))}
                  </ul>
                </div>
              )}
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}

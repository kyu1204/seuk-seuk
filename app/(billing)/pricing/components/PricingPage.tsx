"use client";

import type {
  Subscription,
  SubscriptionPlan,
  UsageLimits,
} from "@/app/actions/subscription-actions";
import {
  getSubscriptionPlans,
  getUsageWidgetData,
} from "@/app/actions/subscription-actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useLanguage } from "@/contexts/language-context";
import { usePaddlePrices } from "@/hooks/usePaddlePrices";
import { PADDLE_PRICE_TIERS } from "@/lib/paddle/pricing-config";
import { resolvePlanCta } from "@/lib/paddle/plan-cta";
import { Environments, initializePaddle, Paddle } from "@paddle/paddle-js";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Check, Star } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export function PricingPage() {
  const { t, language } = useLanguage();
  const router = useRouter();
  const [paddle, setPaddle] = useState<Paddle | undefined>(undefined);
  const { prices: paddlePrices, loading: paddleLoading } =
    usePaddlePrices(paddle);
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">(
    "monthly"
  );
  const [creditQuantity, setCreditQuantity] = useState(5);

  const getPlanDescription = (planName: string) => {
    const planKey = planName.toLowerCase();
    return t(`pricingPage.plans.${planKey}.description`);
  };

  function extractFeaturesByLanguage(raw: unknown): string[] {
    try {
      if (!raw) return [];
      if (Array.isArray(raw) && raw.every((x) => typeof x === "string")) {
        return raw as string[];
      }
      if (typeof raw === "string") {
        const parsed = JSON.parse(raw);
        if (
          parsed &&
          typeof parsed === "object" &&
          Array.isArray(parsed[language])
        ) {
          return parsed[language] as string[];
        }
      }
      if (
        typeof raw === "object" &&
        raw !== null &&
        Array.isArray((raw as any)[language])
      ) {
        return (raw as Record<string, string[]>)[language] || [];
      }
    } catch (e) {
      console.warn("Failed to parse plan features by language", e);
    }
    return [];
  }

  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [currentSubscription, setCurrentSubscription] =
    useState<Subscription | null>(null);
  const [usageLimits, setUsageLimits] = useState<UsageLimits | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [plansResult, usageResult] = await Promise.all([
        getSubscriptionPlans(),
        getUsageWidgetData(),
      ]);

      if (plansResult.error) {
        setError(plansResult.error);
        return;
      }

      const sortedPlans = plansResult.plans.sort((a, b) => a.order - b.order);

      setPlans(sortedPlans);
      setCurrentSubscription(usageResult.subscription);
      setUsageLimits(usageResult.limits);
    } catch (err) {
      setError(t("pricingPage.loadError"));
      console.error("Pricing page error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Paddle 초기화
  useEffect(() => {
    if (
      process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN &&
      process.env.NEXT_PUBLIC_PADDLE_ENV
    ) {
      initializePaddle({
        token: process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN,
        environment: process.env.NEXT_PUBLIC_PADDLE_ENV as Environments,
      })
        .then((paddleInstance) => {
          if (paddleInstance) {
            setPaddle(paddleInstance);
          }
        })
        .catch((err) => {
          console.warn("Paddle initialization skipped (likely local/no access)", err);
          setPaddle(undefined);
        });
    }
  }, []);

  const handleSelectPlan = (planId: string, planName: string, cta: ReturnType<typeof resolvePlanCta>) => {
    if (cta.disabled) return;

    if (cta.href) {
      router.push(cta.href);
      return;
    }

    const nameKey = planName.toLowerCase();
    if (nameKey === "free" || nameKey === "basic") {
      return;
    }

    const tier = PADDLE_PRICE_TIERS.find(
      (tier) => tier.name.toLowerCase() === nameKey || tier.id === nameKey
    );

    if (tier) {
      const priceId =
        billingCycle === "yearly" ? tier.priceId.year : tier.priceId.month;
      if (priceId) {
        router.push(`/checkout/${priceId}`);
        return;
      }
    }

    toast.error(t("pricingPage.loadError"));
  };

  const resolveCurrentPlanId = (): string | undefined => {
    if (currentSubscription?.plan_id) return currentSubscription.plan_id;
    const joinedName = currentSubscription?.plan?.name;
    if (joinedName) {
      const match = plans.find(
        (p) => p.name.toLowerCase() === joinedName.toLowerCase()
      );
      if (match) return match.id;
    }
    return plans[0]?.id;
  };

  const currentPlan = plans.find((p) => p.id === resolveCurrentPlanId());
  const currentRank = currentPlan?.order ?? 0;

  const getPopularPlanId = () => plans.find((plan) => plan.is_popular)?.id;

  const planDisplayName = (planKey: string, rawName: string) => {
    const translated = t(`pricing.${planKey}.name`);
    return translated === `pricing.${planKey}.name` ? rawName : translated;
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <div className="h-8 bg-muted rounded animate-pulse mb-4 w-1/3 mx-auto" />
            <div className="h-4 bg-muted rounded animate-pulse w-2/3 mx-auto" />
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="animate-pulse rounded-xl border bg-card h-[420px]"
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto text-center">
          <h1 className="text-2xl font-bold mb-4">
            {t("pricingPage.errorTitle")}
          </h1>
          <Button onClick={loadData} variant="outline" className="mr-2">
            {t("common.retry")}
          </Button>
          <Button onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            {t("pricingPage.backButton")}
          </Button>
        </div>
      </div>
    );
  }

  const popularPlanId = getPopularPlanId();

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col items-center gap-4 mb-8 text-center">
          <h1 className="text-4xl font-bold tracking-tight">
            {t("pricingPage.title")}
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl">
            {currentPlan
              ? usageLimits
                ? t("pricingPage.currentPlan", {
                    planName: planDisplayName(
                      currentPlan.name.toLowerCase(),
                      currentPlan.name
                    ),
                    used: usageLimits.currentMonthlyCreated,
                    limit:
                      usageLimits.monthlyCreationLimit === -1
                        ? t("pricingPage.unlimited")
                        : usageLimits.monthlyCreationLimit,
                  })
                : t("pricingPage.currentPlanNoUsage", {
                    planName: planDisplayName(
                      currentPlan.name.toLowerCase(),
                      currentPlan.name
                    ),
                  })
              : t("pricingPage.subtitle")}
          </p>

          <div
            role="radiogroup"
            aria-label={t("pricing.billing.label")}
            className="inline-flex items-center rounded-md border p-1 bg-muted"
          >
            {(["monthly", "yearly"] as const).map((cycle) => (
              <button
                key={cycle}
                role="radio"
                aria-checked={billingCycle === cycle}
                className={`px-3 py-1 rounded-sm text-sm focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none ${
                  billingCycle === cycle
                    ? "bg-background text-foreground"
                    : "text-muted-foreground"
                }`}
                onClick={() => setBillingCycle(cycle)}
              >
                {t(`pricing.billing.${cycle}`)}
              </button>
            ))}
          </div>
        </div>

        {/* Pricing Cards */}
        {paddleLoading ? (
          <div className="grid gap-6 md:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="animate-pulse rounded-xl border bg-card h-[420px]"
              />
            ))}
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-3">
            {plans.map((plan) => {
              const planKey = plan.name.toLowerCase();
              const isPopular = plan.id === popularPlanId;
              const isCurrent = plan.id === resolveCurrentPlanId();
              const isFree = planKey === "free" || planKey === "basic";
              const isEnterprise = planKey.includes("enterprise");
              const cta = resolvePlanCta({
                planKey,
                isCurrent,
                isFree,
                isEnterprise,
                currentRank,
                planRank: plan.order,
              });

              return (
                <Card
                  key={plan.id}
                  className={`relative flex flex-col gap-5 rounded-xl border bg-card p-7 ${
                    isCurrent ? "border-primary shadow-md" : ""
                  }`}
                >
                  {isCurrent ? (
                    <div className="absolute -top-3 left-6">
                      <Badge className="bg-primary text-primary-foreground px-3 py-1">
                        {t("pricingPage.currentBadge")}
                      </Badge>
                    </div>
                  ) : isPopular ? (
                    <div className="absolute -top-3 left-6">
                      <Badge className="bg-primary text-primary-foreground px-3 py-1">
                        <Star className="h-3 w-3 mr-1" />
                        {t("pricing.popular")}
                      </Badge>
                    </div>
                  ) : null}

                  <div className="text-center">
                    <h3 className="text-xl font-bold">
                      {planDisplayName(planKey, plan.name)}
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      {getPlanDescription(plan.name)}
                    </p>
                    <div className="mt-4">
                      <span className="text-4xl font-bold tabular-nums">
                        {(() => {
                          const paddleTier = PADDLE_PRICE_TIERS.find(
                            (tier) =>
                              tier.name.toLowerCase() === planKey ||
                              (["free", "basic"].includes(planKey) &&
                                tier.id === "free")
                          );
                          const priceId =
                            billingCycle === "yearly"
                              ? paddleTier?.priceId.year
                              : paddleTier?.priceId.month;

                          if (paddleTier && priceId && paddlePrices[priceId]) {
                            const price = paddlePrices[priceId];
                            const numericPrice = price.replace(/[^\d.]/g, "");
                            return `$${Math.floor(parseFloat(numericPrice))}`;
                          }

                          const dbPrice =
                            billingCycle === "yearly"
                              ? (plan as any).yearly_price
                              : (plan as any).monthly_price;
                          if (dbPrice === 0) return t("pricingPage.free");
                          if (dbPrice === -1) return t("pricingPage.contact");
                          return dbPrice != null
                            ? `$${Math.floor(dbPrice)}`
                            : "...";
                        })()}
                      </span>
                      {(() => {
                        const cycleDbPrice =
                          billingCycle === "yearly"
                            ? (plan as any).yearly_price
                            : (plan as any).monthly_price;
                        return cycleDbPrice != null && cycleDbPrice > 0;
                      })() && (
                        <span className="text-muted-foreground ml-1">
                          {billingCycle === "monthly"
                            ? t("pricingPage.perMonth")
                            : t("pricingPage.perYear")}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex-1 flex flex-col gap-3">
                    <div className="flex items-center gap-3">
                      <Check className="h-4 w-4 text-primary flex-shrink-0" />
                      <span className="text-sm">
                        {plan.monthly_document_limit === -1
                          ? t("pricing.limitUnlimitedPerMonth")
                          : t("pricing.limitPerMonth", {
                              count: plan.monthly_document_limit,
                            })}
                      </span>
                    </div>
                    {extractFeaturesByLanguage((plan as any).features).map(
                      (feature, index) => (
                        <div key={index} className="flex items-center gap-3">
                          <Check className="h-4 w-4 text-primary flex-shrink-0" />
                          <span className="text-sm">{feature}</span>
                        </div>
                      )
                    )}
                  </div>

                  <Button
                    className="w-full mt-auto"
                    variant={isPopular || isCurrent ? "default" : "outline"}
                    disabled={cta.disabled}
                    onClick={() => handleSelectPlan(plan.id, plan.name, cta)}
                  >
                    {t(cta.labelKey)}
                  </Button>
                </Card>
              );
            })}
          </div>
        )}

        {/* Credit Section */}
        <div className="mt-16 border-t pt-16">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold mb-2">
              {t("pricing.credit.title")}
            </h2>
            <p className="text-muted-foreground">
              {t("pricing.credit.description")}
            </p>
          </div>

          <Card className="max-w-md mx-auto">
            <CardContent className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex flex-col gap-4 w-full">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div>
                    <h3 className="font-semibold text-base sm:text-lg">
                      {t("pricing.credit.name")}
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      {t("pricing.credit.unit")}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm text-muted-foreground line-through">
                      $1.00
                    </span>
                    <span className="text-base font-semibold">$0.50</span>
                    <Badge className="bg-seal-soft text-seal text-xs">
                      50% OFF
                    </Badge>
                  </div>
                </div>

                <div>
                  <Label htmlFor="creditQuantity" className="text-sm">
                    <span className="block sm:inline">
                      {t("pricing.credit.quantity")}
                    </span>{" "}
                    <span className="block sm:inline text-xs text-muted-foreground">
                      {t("pricing.credit.quantityRange")}
                    </span>
                  </Label>
                  <Input
                    id="creditQuantity"
                    type="number"
                    min="5"
                    max="20"
                    value={creditQuantity}
                    onChange={(e) =>
                      setCreditQuantity(
                        Math.min(20, Math.max(5, parseInt(e.target.value) || 5))
                      )
                    }
                    className="mt-2"
                  />
                </div>

                <div className="bg-muted p-3 rounded space-y-2">
                  <div className="flex justify-between items-center text-sm gap-2">
                    <span className="flex-shrink-0">
                      {t("pricing.credit.total")}
                    </span>
                    <span className="font-bold text-base">
                      ${(creditQuantity * 0.5).toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between items-start text-sm gap-2">
                    <span className="text-muted-foreground flex-shrink-0">
                      {t("pricing.credit.receive")}
                    </span>
                    <span className="text-right">
                      {t("pricing.credit.breakdown", {
                        count: creditQuantity,
                      })}
                    </span>
                  </div>
                </div>

                <Button
                  className="w-full"
                  onClick={() =>
                    router.push(`/checkout/credit?quantity=${creditQuantity}`)
                  }
                >
                  {t("pricing.credit.purchase")}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Additional Info */}
        <div className="mt-12 text-center text-sm text-muted-foreground">
          <p>{t("pricingPage.additionalInfo")}</p>
          <p className="mt-2">{t("pricingPage.additionalInfo2")}</p>
        </div>
      </div>
    </div>
  );
}

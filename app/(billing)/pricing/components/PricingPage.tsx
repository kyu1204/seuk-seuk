"use client";

import type {
  Subscription,
  SubscriptionPlan,
} from "@/app/actions/subscription-actions";
import {
  getCurrentSubscription,
  getSubscriptionPlans,
} from "@/app/actions/subscription-actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useLanguage } from "@/contexts/language-context";
import { usePaddlePrices } from "@/hooks/usePaddlePrices";
import { PADDLE_PRICE_TIERS } from "@/lib/paddle/pricing-config";
import { Environments, initializePaddle, Paddle } from "@paddle/paddle-js";
import { ArrowLeft, Check, Star } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export function PricingPage() {
  const { t, language } = useLanguage();
  const router = useRouter();
  const [paddle, setPaddle] = useState<Paddle | undefined>(undefined);
  const { prices: paddlePrices, loading: paddleLoading } =
    usePaddlePrices(paddle);
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">(
    "monthly"
  );

  // Static plan mapping based on plan names
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const [plansResult, subscriptionResult] = await Promise.all([
          getSubscriptionPlans(),
          getCurrentSubscription(),
        ]);

        if (plansResult.error) {
          setError(plansResult.error);
          return;
        }

        // 플랜 순서 정렬: order 컬럼 사용
        const sortedPlans = plansResult.plans.sort((a, b) => a.order - b.order);

        setPlans(sortedPlans);
        setCurrentSubscription(subscriptionResult.subscription);
      } catch (err) {
        setError(t("pricingPage.loadError"));
        console.error("Pricing page error:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
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

  const handleSelectPlan = (planId: string, planName: string) => {
    const nameKey = planName.toLowerCase();
    // Free plan: no checkout
    if (nameKey === "free") {
      // Free 플랜은 별도 처리 불필요
      alert(t("pricingPage.alertMessage", { planName }));
      return;
    }

    // Enterprise plan: contact
    if (nameKey.includes("enterprise")) {
      // Enterprise 플랜은 Contact Us 페이지로 이동
      router.push("/contact");
      return;
    }

    // Paid plans (Starter, Pro, etc.) → Paddle checkout
    const tier = PADDLE_PRICE_TIERS.find(
      (t) => t.name.toLowerCase() === nameKey || t.id === nameKey
    );

    if (tier) {
      const priceId =
        billingCycle === "yearly" ? tier.priceId.year : tier.priceId.month;
      if (priceId) {
        router.push(`/checkout/${priceId}`);
        return;
      }
    }

    // Fallback
    alert(t("pricingPage.alertMessage", { planName }));
  };

  const resolveCurrentPlanId = (): string | undefined => {
    // 1) Direct by plan_id
    if (currentSubscription?.plan_id) return currentSubscription.plan_id;
    // 2) Match by plan name from joined relation
    const joinedName = currentSubscription?.plan?.name;
    if (joinedName) {
      const match = plans.find(
        (p) => p.name.toLowerCase() === joinedName.toLowerCase()
      );
      if (match) return match.id;
    }
    // 3) Fallback to lowest tier (first in sorted list) so Free is treated as current
    return plans[0]?.id;
  };

  const isCurrentPlan = (planId: string) => {
    const resolved = resolveCurrentPlanId();
    return resolved ? resolved === planId : false;
  };

  const isLowerPlan = (plan: SubscriptionPlan) => {
    if (!currentSubscription) return false;
    const currentPlan = plans.find((p) => p.id === currentSubscription.plan_id);
    if (!currentPlan) return false;
    return plan.order < currentPlan.order;
  };

  const getPopularPlanId = () => {
    // 인기 플랜은 DB의 is_popular 기준
    return plans.find((plan) => plan.is_popular)?.id;
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <div className="h-8 bg-muted rounded animate-pulse mb-4" />
            <div className="h-4 bg-muted rounded animate-pulse w-2/3 mx-auto" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-96 bg-muted rounded animate-pulse" />
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
          <p className="text-muted-foreground mb-6">{error}</p>
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
    <>
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold tracking-tight mb-4">
              {t("pricingPage.title")}
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              {t("pricingPage.description")}
            </p>
          </div>
          <div className="flex justify-center mb-8">
            <div className="inline-flex items-center rounded-md border p-1 bg-muted">
              <button
                className={`px-3 py-1 rounded-sm text-sm ${
                  billingCycle === "monthly"
                    ? "bg-background text-foreground"
                    : "text-muted-foreground"
                }`}
                onClick={() => setBillingCycle("monthly")}
              >
                {t("pricing.billing.monthly")}
              </button>
              <button
                className={`px-3 py-1 rounded-sm text-sm ${
                  billingCycle === "yearly"
                    ? "bg-background text-foreground"
                    : "text-muted-foreground"
                }`}
                onClick={() => setBillingCycle("yearly")}
              >
                {t("pricing.billing.yearly")}
              </button>
            </div>
          </div>

          {/* Current Subscription Info */}
          {(() => {
            const nameFromSub = currentSubscription?.plan?.name;
            const resolvedId = resolveCurrentPlanId();
            const nameFromResolved = plans.find((p) => p.id === resolvedId)?.name;
            const displayName = nameFromSub || nameFromResolved;
            return displayName ? (
            <div className="mb-8 p-4 bg-muted/50 rounded-lg text-center">
              <p className="text-sm text-muted-foreground">
                {t("pricingPage.currentPlan", {
                  planName: displayName,
                })}
              </p>
            </div>
            ) : null;
          })()}

          {/* Pricing Cards */}
          {paddleLoading ? (
            <div className="flex justify-center items-center min-h-[400px]">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {plans.map((plan) => {
                const isPopular = plan.id === popularPlanId;
                const isCurrent = isCurrentPlan(plan.id);
                const isLower = isLowerPlan(plan);

                return (
                  <Card
                    key={plan.id}
                    className={`relative flex flex-col h-full ${
                      isPopular
                        ? "border-primary shadow-lg scale-105"
                        : isCurrent
                        ? "border-green-500"
                        : ""
                    }`}
                  >
                    {isPopular && (
                      <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                        <Badge className="bg-primary text-primary-foreground px-3 py-1">
                          <Star className="h-3 w-3 mr-1" />
                          {t("pricingPage.popular")}
                        </Badge>
                      </div>
                    )}

                    {isCurrent && (
                      <div className="absolute -top-3 right-4">
                        <Badge
                          variant="outline"
                          className="bg-green-50 text-green-700 border-green-200"
                        >
                          {t("pricingPage.currentBadge")}
                        </Badge>
                      </div>
                    )}

                    <CardHeader className="text-center pb-4">
                      <CardTitle className="text-xl font-bold">
                        {plan.name}
                      </CardTitle>
                      <CardDescription className="text-sm">
                        {getPlanDescription(plan.name)}
                      </CardDescription>
                      <div className="mt-4">
                        <span className="text-4xl font-bold">
                          {(() => {
                            // 플랜 이름으로 Paddle Tier 찾기
                            const planKey = plan.name.toLowerCase();
                            const paddleTier = PADDLE_PRICE_TIERS.find(
                              (tier) => tier.name.toLowerCase() === planKey
                            );
                            const priceId =
                              billingCycle === "yearly"
                                ? paddleTier?.priceId.year
                                : paddleTier?.priceId.month;

                            // Paddle 가격이 있는 경우 사용
                            if (paddleTier && priceId && paddlePrices[priceId]) {
                              const price = paddlePrices[priceId];
                              const numericPrice = price.replace(/[^\d.]/g, "");
                              return `$${Math.floor(parseFloat(numericPrice))}`;
                            }

                            // DB 가격 사용 (USD)
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
                        {(((plan as any).monthly_price ?? 0) > 0 ||
                          ((plan as any).yearly_price ?? 0) > 0) && (
                          <span className="text-muted-foreground ml-1">
                            {billingCycle === "monthly"
                              ? t("pricingPage.perMonth")
                              : t("pricingPage.perYear")}
                          </span>
                        )}
                      </div>
                    </CardHeader>

                    <CardContent className="pt-4 flex-1 flex flex-col">
                      {/* Features */}
                      <div className="space-y-3 mb-6 flex-1">
                        <div className="flex items-center gap-3">
                          <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                          <span className="text-sm">
                            {plan.monthly_document_limit === -1
                              ? t("pricing.limitUnlimitedPerMonth")
                              : t("pricing.limitPerMonth", {
                                  count: plan.monthly_document_limit,
                                })}
                          </span>
                        </div>
                        {/* Removed Active Documents line as requested */}
                        {extractFeaturesByLanguage((plan as any).features).map((feature, index) => (
                          <div key={index} className="flex items-center gap-3">
                            <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                            <span className="text-sm">{feature}</span>
                          </div>
                        ))}
                      </div>

                      {/* CTA Button */}
                      <Button
                        className={`w-full mt-auto ${
                          isLower ? "opacity-50 cursor-not-allowed" : ""
                        }`}
                        variant={isPopular ? "default" : "outline"}
                        disabled={isCurrent || isLower}
                        onClick={() => handleSelectPlan(plan.id, plan.name)}
                      >
                        {isCurrent
                          ? t("pricingPage.currentlyUsing")
                          : isLower
                          ? t("pricingPage.lowerPlan")
                          : ((plan as any).monthly_price ?? 0) === 0
                          ? t("pricingPage.startFree")
                          : ((plan as any).monthly_price ?? 0) === -1 ||
                            ((plan as any).yearly_price ?? 0) === -1
                          ? t("pricingPage.contactUs")
                          : t("pricingPage.selectPlan")}
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}

          {/* Additional Info */}
          <div className="mt-12 text-center text-sm text-muted-foreground">
            <p>{t("pricingPage.additionalInfo")}</p>
            <p className="mt-2">{t("pricingPage.additionalInfo2")}</p>
          </div>
        </div>
      </div>
    </>
  );
}

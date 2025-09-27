"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Star, ArrowLeft } from "lucide-react";
import { useLanguage } from "@/contexts/language-context";
import {
  getSubscriptionPlans,
  getCurrentSubscription,
} from "@/app/actions/subscription-actions";
import type {
  SubscriptionPlan,
  Subscription,
} from "@/app/actions/subscription-actions";
import Link from "next/link";
import { useRouter } from "next/navigation";
import SiteHeader from "@/components/site-header";

export function PricingPage() {
  const { t } = useLanguage();
  const router = useRouter();

  // Static plan mapping based on plan names
  const getPlanDescription = (planName: string) => {
    const planKey = planName.toLowerCase();
    return t(`pricingPage.plans.${planKey}.description`);
  };

  const getPlanFeatures = (planName: string) => {
    const planKey = planName.toLowerCase();
    const features = [];

    // Try to get features dynamically, fallback if key doesn't exist
    for (let i = 1; i <= 4; i++) {
      const featureKey = `pricingPage.plans.${planKey}.feature${i}`;
      const feature = t(featureKey);
      if (feature !== featureKey) { // If translation exists
        features.push(feature);
      }
    }

    return features;
  };
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

  const handleSelectPlan = (planId: string, planName: string) => {
    // TODO: 결제 모듈 연동 구현
    console.log(`Selected plan: ${planName} (${planId})`);
    alert(t("pricingPage.alertMessage", { planName }));
  };

  const isCurrentPlan = (planId: string) => {
    return currentSubscription?.plan_id === planId;
  };

  const getPopularPlanId = () => {
    // Pro 플랜을 인기 플랜으로 설정 (이름이 'Pro'인 플랜)
    return plans.find((plan) => plan.name.toLowerCase().includes("pro"))?.id;
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
      <SiteHeader showScrollEffect={false} />
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

          {/* Current Subscription Info */}
          {currentSubscription && (
            <div className="mb-8 p-4 bg-muted/50 rounded-lg text-center">
              <p className="text-sm text-muted-foreground">
                {t("pricingPage.currentPlan", {
                  planName: currentSubscription.plan.name,
                })}
              </p>
            </div>
          )}

          {/* Pricing Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {plans.map((plan) => {
              const isPopular = plan.id === popularPlanId;
              const isCurrent = isCurrentPlan(plan.id);

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
                        {plan.price_cents === 0
                          ? t("pricingPage.free")
                          : plan.price_cents === -1
                          ? t("pricingPage.contact")
                          : `$${plan.price_cents}`}
                      </span>
                      {plan.price_cents > 0 && (
                        <span className="text-muted-foreground ml-1">
                          {t("pricingPage.perMonth")}
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
                          {t("pricingPage.documentsPerMonth")}:{" "}
                          {plan.monthly_document_limit === -1
                            ? t("pricingPage.unlimited")
                            : `${plan.monthly_document_limit}`}
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                        <span className="text-sm">
                          {t("pricingPage.activeDocuments")}:{" "}
                          {plan.active_document_limit === -1
                            ? t("pricingPage.unlimited")
                            : `${plan.active_document_limit}`}
                        </span>
                      </div>
                      {getPlanFeatures(plan.name).map((feature, index) => (
                        <div key={index} className="flex items-center gap-3">
                          <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                          <span className="text-sm">{feature}</span>
                        </div>
                      ))}
                    </div>

                    {/* CTA Button */}
                    <Button
                      className="w-full mt-auto"
                      variant={isPopular ? "default" : "outline"}
                      disabled={isCurrent}
                      onClick={() => handleSelectPlan(plan.id, plan.name)}
                    >
                      {isCurrent
                        ? t("pricingPage.currentlyUsing")
                        : !plan.price_cents || plan.price_cents === 0
                        ? t("pricingPage.startFree")
                        : plan.price_cents === -1
                        ? t("pricingPage.contactUs")
                        : t("pricingPage.selectPlan")}
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>

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

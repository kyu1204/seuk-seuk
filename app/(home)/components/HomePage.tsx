"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useLanguage } from "@/contexts/language-context";
import { cn } from "@/lib/utils";
import {
  ArrowRight,
  Check,
  ChevronUp,
  FileSignature,
  Shield,
  Zap,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import {
  getSubscriptionPlans,
  type SubscriptionPlan,
} from "@/app/actions/subscription-actions";
import { Environments, initializePaddle, Paddle } from "@paddle/paddle-js";
import { usePaddlePrices } from "@/hooks/usePaddlePrices";
import { PADDLE_PRICE_TIERS } from "@/lib/paddle/pricing-config";

export default function HomePageComponent() {
  const { t, language } = useLanguage();
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">(
    "monthly"
  );
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [paddle, setPaddle] = useState<Paddle | undefined>(undefined);
  const { prices: paddlePrices, loading: paddleLoading } =
    usePaddlePrices(paddle);

  useEffect(() => {
    async function loadPlans() {
      const { plans: fetchedPlans } = await getSubscriptionPlans();
      setPlans(fetchedPlans);
    }
    loadPlans();
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
      }).then((paddleInstance) => {
        if (paddleInstance) {
          setPaddle(paddleInstance);
        }
      });
    }
  }, []);

  const features = [
    {
      icon: <FileSignature className="h-10 w-10 text-primary" />,
      title: t("home.features.easy.title"),
      description: t("home.features.easy.description"),
    },
    {
      icon: <Shield className="h-10 w-10 text-primary" />,
      title: t("home.features.secure.title"),
      description: t("home.features.secure.description"),
    },
    {
      icon: <Zap className="h-10 w-10 text-primary" />,
      title: t("home.features.fast.title"),
      description: t("home.features.fast.description"),
    },
  ];

  // DB 데이터와 Paddle 가격을 기반으로 pricing plans 생성
  const pricingPlans = plans.map((plan, index) => {
    const planKey = plan.name.toLowerCase();
    const isEnterprise =
      (plan as any).monthly_price === -1 || (plan as any).yearly_price === -1;

    // Paddle 가격 가져오기
    let displayPrice = "";
    if ((plan as any).monthly_price === 0) {
      displayPrice = t("pricing.free.price");
    } else if (isEnterprise) {
      displayPrice = t("pricingPage.contact");
    } else {
      // Pro 플랜인 경우 Paddle 가격 사용
      const paddleTier = PADDLE_PRICE_TIERS.find(
        (tier) =>
          tier.name.toLowerCase() === planKey ||
          (["free", "basic"].includes(planKey) && tier.id === "free")
      );
      const priceId =
        billingCycle === "yearly"
          ? paddleTier?.priceId.year
          : paddleTier?.priceId.month;
      if (paddleTier && priceId && paddlePrices[priceId]) {
        const price = paddlePrices[priceId];
        // 포맷된 가격 문자열에서 숫자만 추출 (예: "$10.00" -> "10.00")
        const numericPrice = price.replace(/[^0-9.]/g, "");
        displayPrice = `$${Math.floor(parseFloat(numericPrice))}`;
      } else if (paddleLoading) {
        displayPrice = "...";
      } else {
        // Fallback to DB price (USD in monthly_price/yearly_price)
        const dbPrice =
          billingCycle === "yearly"
            ? (plan as any).yearly_price
            : (plan as any).monthly_price;
        displayPrice = dbPrice != null ? `$${Math.floor(dbPrice)}` : "...";
      }
    }

    // Features from DB by language: features column shape { ko: string[]; en: string[] }
    const planFeatures = extractFeaturesByLanguage(plan.features, language);
    const limitFeature =
      plan.monthly_document_limit === -1
        ? t("pricing.limitUnlimitedPerMonth")
        : t("pricing.limitPerMonth", {
            count: plan.monthly_document_limit,
          });
    const mergedFeatures = [limitFeature, ...planFeatures];

    return {
      name: t(`pricing.${planKey}.name`),
      description: t(`pricing.${planKey}.description`),
      price: displayPrice,
      features: mergedFeatures,
      cta: t(`pricing.${planKey}.cta`),
      popular: !!plan.is_popular,
    };
  });

  function extractFeaturesByLanguage(
    raw: unknown,
    lang: "ko" | "en"
  ): string[] {
    try {
      if (!raw) return [];
      // If already an array of strings
      if (Array.isArray(raw) && raw.every((x) => typeof x === "string")) {
        return raw as string[];
      }
      // If stringified JSON
      if (typeof raw === "string") {
        const parsed = JSON.parse(raw);
        if (
          parsed &&
          typeof parsed === "object" &&
          Array.isArray(parsed[lang])
        ) {
          return parsed[lang] as string[];
        }
      }
      // If JSON object
      if (
        typeof raw === "object" &&
        raw !== null &&
        Array.isArray((raw as any)[lang])
      ) {
        return (raw as Record<string, string[]>)[lang] || [];
      }
    } catch (e) {
      console.warn("Failed to parse plan features by language", e);
    }
    return [];
  }

  const testimonials = [
    {
      quote: t("home.testimonials.quote1"),
      author: t("home.testimonials.author1"),
      role: t("home.testimonials.role1"),
    },
    {
      quote: t("home.testimonials.quote2"),
      author: t("home.testimonials.author2"),
      role: t("home.testimonials.role2"),
    },
    {
      quote: t("home.testimonials.quote3"),
      author: t("home.testimonials.author3"),
      role: t("home.testimonials.role3"),
    },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 md:py-32">
        <div className="absolute inset-0 bg-dot-pattern opacity-30"></div>
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6 gradient-text">
              {t("home.hero.title")}
            </h1>
            <p className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto">
              {t("home.hero.description")}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/dashboard">
                <Button
                  size="lg"
                  className="bg-primary hover:bg-primary/90 gap-2 text-white"
                >
                  {t("home.hero.cta")}
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-pattern opacity-10"></div>
        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4 gradient-text">
              {t("home.featuresTitle")}
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              {t("home.featuresDescription")}
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card
                key={index}
                className={cn(
                  "bg-card border-primary/10 hover:border-primary/30 transition-all duration-300",
                  index % 2 === 0 ? "card-angled" : "card-angled-right"
                )}
              >
                <CardContent className="p-8">
                  <div className="rounded-full bg-primary/10 p-4 mb-6 w-fit">
                    {feature.icon}
                  </div>
                  <h3 className="text-xl font-semibold mb-3">
                    {feature.title}
                  </h3>
                  <p className="text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section
        id="testimonials"
        className="py-20 bg-secondary/50 relative overflow-hidden"
      >
        <div className="absolute inset-0 bg-dot-pattern opacity-5"></div>
        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4 gradient-text">
              {t("home.testimonialsTitle")}
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              {t("home.testimonialsDescription")}
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {testimonials.map((testimonial, index) => (
              <Card
                key={index}
                className={cn(
                  "bg-card border-primary/10 hover:border-primary/30 transition-all duration-300",
                  index % 2 === 0 ? "card-angled" : "card-angled-right"
                )}
              >
                <CardContent className="p-8">
                  <div className="mb-4 text-primary">
                    <svg
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M11.3 6.2H6.8C5.8 6.2 5 7 5 8V12.5C5 13.5 5.8 14.3 6.8 14.3H9.3V16.8C9.3 17.8 10.1 18.6 11.1 18.6H11.3C11.5 18.6 11.8 18.5 12 18.3L14.5 15.8C14.7 15.6 14.8 15.3 14.8 15.1V9.7C14.8 7.8 13.2 6.2 11.3 6.2Z"
                        fill="currentColor"
                      />
                      <path
                        d="M19.3 6.2H17.8V12.8C17.8 13.1 17.7 13.4 17.5 13.6L15.7 15.4C16.2 15.7 16.8 15.8 17.3 15.8H17.8V18.3C17.8 19.3 18.6 20.1 19.6 20.1H19.8C20 20.1 20.3 20 20.5 19.8L23 17.3C23.2 17.1 23.3 16.8 23.3 16.6V9.7C23.3 7.8 21.7 6.2 19.8 6.2H19.3Z"
                        fill="currentColor"
                      />
                    </svg>
                  </div>
                  <p className="text-foreground mb-6 italic">
                    "{testimonial.quote}"
                  </p>
                  <div>
                    <p className="font-semibold">{testimonial.author}</p>
                    <p className="text-sm text-muted-foreground">
                      {testimonial.role}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-pattern opacity-10"></div>
        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold mb-4 gradient-text">
              {t("home.pricingTitle")}
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              {t("home.pricingDescription")}
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

          {paddleLoading ? (
            <div className="flex justify-center items-center min-h-[400px]">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
          ) : (
            <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
              {pricingPlans.map((plan, index) => {
                const isPro = plans[index]?.name.toLowerCase() === "pro";
                return (
                <Card
                  key={index}
                  className={cn(
                    "flex flex-col h-full bg-card border-primary/10 hover:border-primary/30 transition-all duration-300",
                    plan.popular ? "border-primary shadow-lg relative" : "",
                    index === 0
                      ? "card-angled"
                      : index === 2
                      ? "card-angled-right"
                      : ""
                  )}
                >
                  {plan.popular && (
                    <div className="absolute top-0 right-0 transform translate-x-1/4 -translate-y-1/3">
                      <div className="bg-primary text-primary-foreground text-xs font-bold px-3 py-1 rounded-full">
                        {t("pricing.popular")}
                      </div>
                    </div>
                  )}
                  {isPro && !plan.popular && (
                    <div className="absolute top-0 right-0 transform translate-x-1/4 -translate-y-1/3">
                      <div className="bg-green-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                        {t("pricing.pro.freeTrial")}
                      </div>
                    </div>
                  )}
                  <CardContent className="p-8 h-full flex flex-col">
                    <h3 className="text-xl font-bold mb-2">{plan.name}</h3>
                    <p className="text-muted-foreground text-sm mb-6">
                      {plan.description}
                    </p>
                    <div className="mb-6">
                      <span className="text-4xl font-bold">{plan.price}</span>
                      {plan.price !== t("pricingPage.contact") &&
                        plan.price !== t("pricing.free.price") && (
                        <span className="text-muted-foreground ml-2">
                          {billingCycle === "monthly"
                            ? t("pricingPage.perMonth")
                            : t("pricingPage.perYear")}
                        </span>
                      )}
                    </div>
                    <ul className="space-y-3 mb-8">
                      {plan.features.map((feature, i) => (
                        <li key={i} className="flex items-start">
                          <Check className="h-5 w-5 text-primary shrink-0 mr-2" />
                          <span className="text-sm">{feature}</span>
                        </li>
                      ))}
                    </ul>
                    <Link
                      className="mt-auto block"
                      href={`${
                        plan.price === t("pricingPage.contact") ? "/contact" : "/pricing"
                      }`}
                    >
                      <Button
                        variant={plan.popular ? "default" : "outline"}
                        className="w-full"
                      >
                        {plan.cta}
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-primary/5 relative overflow-hidden">
        <div className="absolute inset-0 bg-dot-pattern opacity-10"></div>
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl font-bold mb-4 gradient-text">
              {t("home.cta.title")}
            </h2>
            <p className="text-muted-foreground mb-8 max-w-2xl mx-auto">
              {t("home.cta.description")}
            </p>
            <Link href="/contact">
              <Button
                size="lg"
                className="bg-primary hover:bg-primary/90 gap-2 text-white"
              >
                {t("home.cta.button")}
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-secondary py-12 mt-auto">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <FileSignature className="h-6 w-6 text-primary" />
              <span className="font-bold">{t("app.title")}</span>
            </div>
            <div className="flex flex-col md:flex-row items-center gap-4 text-sm text-muted-foreground">
              <Link
                href="/term"
                className="hover:text-primary transition-colors"
              >
                {t("footer.terms")}
              </Link>
              <span className="hidden md:inline">•</span>
              <Link
                href="/privacy"
                className="hover:text-primary transition-colors"
              >
                {t("footer.privacy")}
              </Link>
              <span className="hidden md:inline">•</span>
              <span>
                &copy; {new Date().getFullYear()} SeukSeuk.{" "}
                {t("home.footer.rights")}
              </span>
            </div>
          </div>
        </div>
      </footer>

      <ScrollToTopButton />
    </div>
  );
}

function ScrollToTopButton() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  if (!scrolled) return null;

  return (
    <button
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      className="fixed bottom-6 right-6 p-3 rounded-full bg-primary text-white shadow-lg hover:bg-primary/90 transition-all z-50"
    >
      <ChevronUp className="h-5 w-5" />
    </button>
  );
}

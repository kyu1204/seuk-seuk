"use client";

import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/language-context";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";
import {
  ArrowRight,
  Check,
  ChevronUp,
  FileSignature,
  Link2,
  MousePointerClick,
  Upload,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState, type CSSProperties } from "react";
import {
  getSubscriptionPlans,
  type SubscriptionPlan,
} from "@/app/actions/subscription-actions";
import { Environments, initializePaddle, Paddle } from "@paddle/paddle-js";
import { usePaddlePrices } from "@/hooks/usePaddlePrices";
import { PADDLE_PRICE_TIERS } from "@/lib/paddle/pricing-config";

export default function HomePageComponent() {
  const { t, language } = useLanguage();
  const { isAuthenticated } = useAuth();
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">(
    "monthly"
  );
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [paddle, setPaddle] = useState<Paddle | undefined>(undefined);
  const { prices: paddlePrices, loading: paddleLoading } =
    usePaddlePrices(paddle);

  const startHref = isAuthenticated ? "/dashboard" : "/register";
  const startLabel = isAuthenticated
    ? t("home.hero.ctaLoggedIn")
    : t("home.hero.cta");

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

  // DB 데이터와 Paddle 가격을 기반으로 pricing plans 생성
  const pricingPlans = plans.map((plan) => {
    const planKey = plan.name.toLowerCase();
    const isFree = (plan as any).monthly_price === 0;
    const isEnterprise =
      (plan as any).monthly_price === -1 || (plan as any).yearly_price === -1;

    let displayPrice = "";
    if (isFree) {
      displayPrice = t("pricing.free.price");
    } else if (isEnterprise) {
      displayPrice = t("pricingPage.contact");
    } else {
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
        const numericPrice = price.replace(/[^0-9.]/g, "");
        displayPrice = `$${Math.floor(parseFloat(numericPrice))}`;
      } else if (paddleLoading) {
        displayPrice = "...";
      } else {
        const dbPrice =
          billingCycle === "yearly"
            ? (plan as any).yearly_price
            : (plan as any).monthly_price;
        displayPrice = dbPrice != null ? `$${Math.floor(dbPrice)}` : "...";
      }
    }

    const planFeatures = extractFeaturesByLanguage(plan.features, language);
    const limitFeature =
      plan.monthly_document_limit === -1
        ? t("pricing.limitUnlimitedPerMonth")
        : t("pricing.limitPerMonth", {
            count: plan.monthly_document_limit,
          });

    // 플랜 성격에 따라 목적지를 분기한다. 무료는 바로 시작, 유료는 결제 페이지, 엔터프라이즈는 문의.
    const href = isEnterprise ? "/contact" : isFree ? startHref : "/pricing";

    return {
      name: t(`pricing.${planKey}.name`),
      description: t(`pricing.${planKey}.description`),
      price: displayPrice,
      showPeriod: !isFree && !isEnterprise,
      features: [limitFeature, ...planFeatures],
      cta: t(`pricing.${planKey}.cta`),
      popular: !!plan.is_popular,
      isPro: planKey === "pro",
      href,
    };
  });

  function extractFeaturesByLanguage(
    raw: unknown,
    lang: "ko" | "en"
  ): string[] {
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
          Array.isArray(parsed[lang])
        ) {
          return parsed[lang] as string[];
        }
      }
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

  const steps = [
    {
      icon: Upload,
      title: t("home.steps.upload.title"),
      description: t("home.steps.upload.description"),
    },
    {
      icon: MousePointerClick,
      title: t("home.steps.areas.title"),
      description: t("home.steps.areas.description"),
    },
    {
      icon: Link2,
      title: t("home.steps.send.title"),
      description: t("home.steps.send.description"),
    },
  ];

  const signerPoints = [
    t("home.signer.noAccount"),
    t("home.signer.mobile"),
    t("home.signer.batch"),
    t("home.signer.password"),
  ];

  const senderPoints = [
    t("home.sender.templates"),
    t("home.sender.bundle"),
    t("home.sender.expiry"),
    t("home.sender.signedPdf"),
    t("home.sender.dashboard"),
  ];

  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Hero */}
      <section className="relative overflow-hidden pt-10 pb-16 md:pt-16 md:pb-24">
        {/* 목업 뒤에서 아주 느리게 떠다니는 잉크 번짐 하나. 히어로의 유일한 배경 장식. */}
        <div
          aria-hidden
          className="home-glow pointer-events-none absolute right-[-10%] top-[10%] -z-10 h-[520px] w-[520px] rounded-full bg-primary/10 blur-3xl"
        />
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-[1.05fr_1fr] gap-12 lg:gap-16 items-center">
            <div className="max-w-xl">
              <p
                className="home-rise text-sm font-medium tracking-wide text-primary mb-5"
                style={delay(0)}
              >
                {t("home.hero.eyebrow")}
              </p>
              <h1 className="text-4xl md:text-5xl lg:text-[3.4rem] font-bold leading-[1.15] tracking-[-0.02em] mb-6 [text-wrap:balance]">
                <KineticTitle text={t("home.hero.title")} startMs={120} />
              </h1>
              <p
                className="home-rise text-lg text-muted-foreground leading-relaxed mb-8"
                style={delay(620)}
              >
                {t("home.hero.description")}
              </p>
              <div
                className="home-rise flex flex-col sm:flex-row gap-3"
                style={delay(760)}
              >
                <Link href={startHref}>
                  <Button size="lg" className="group w-full sm:w-auto gap-2">
                    {startLabel}
                    <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                  </Button>
                </Link>
                <a href="#how-it-works" className="w-full sm:w-auto">
                  <Button
                    size="lg"
                    variant="ghost"
                    className="w-full sm:w-auto text-foreground"
                  >
                    {t("home.hero.secondary")}
                  </Button>
                </a>
              </div>
              <p
                className="home-rise mt-5 text-sm text-muted-foreground"
                style={delay(900)}
              >
                {t("home.hero.note")}
              </p>
            </div>

            <div className="home-rise" style={delay(300)}>
              <SigningMock />
            </div>
          </div>
        </div>
      </section>

      {/* How it works — 실제 순서가 있는 흐름이라 번호를 붙인다 */}
      <section id="how-it-works" className="py-16 md:py-24 bg-muted/40 border-y">
        <div className="container mx-auto px-4">
          <div className="home-view max-w-2xl mb-12">
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight mb-3 [text-wrap:balance]">
              {t("home.steps.title")}
            </h2>
            <p className="text-muted-foreground">
              {t("home.steps.description")}
            </p>
          </div>
          <ol className="grid md:grid-cols-3 gap-8 md:gap-6">
            {steps.map((step, i) => (
              <li
                key={step.title}
                className="home-view relative flex md:block gap-4"
                style={delay(i * 120)}
              >
                <div className="flex items-center gap-3 mb-4 shrink-0">
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-semibold tabular-nums">
                    {i + 1}
                  </span>
                  <step.icon
                    className="hidden md:block h-5 w-5 text-muted-foreground"
                    aria-hidden
                  />
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-1.5">{step.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {step.description}
                  </p>
                </div>
              </li>
            ))}
          </ol>
          <p className="mt-10 text-sm text-muted-foreground border-t pt-6 max-w-2xl">
            {t("home.steps.after")}
          </p>
        </div>
      </section>

      {/* For signers / for senders */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-20">
            <div className="home-view">
              <p className="text-sm font-medium text-primary mb-3">
                {t("home.signer.eyebrow")}
              </p>
              <h2 className="text-2xl md:text-3xl font-bold tracking-tight mb-4 [text-wrap:balance]">
                {t("home.signer.title")}
              </h2>
              <p className="text-muted-foreground mb-8">
                {t("home.signer.description")}
              </p>
              <ul className="space-y-3">
                {signerPoints.map((point) => (
                  <li key={point} className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="home-view" style={delay(120)}>
              <p className="text-sm font-medium text-primary mb-3">
                {t("home.sender.eyebrow")}
              </p>
              <h2 className="text-2xl md:text-3xl font-bold tracking-tight mb-4 [text-wrap:balance]">
                {t("home.sender.title")}
              </h2>
              <p className="text-muted-foreground mb-8">
                {t("home.sender.description")}
              </p>
              <ul className="space-y-3">
                {senderPoints.map((point) => (
                  <li key={point} className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-16 md:py-24 bg-muted/40 border-y">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-10">
            <div className="max-w-xl">
              <h2 className="text-2xl md:text-3xl font-bold tracking-tight mb-3">
                {t("home.pricingTitle")}
              </h2>
              <p className="text-muted-foreground">
                {t("home.pricingDescription")}
              </p>
            </div>
            <div
              role="radiogroup"
              aria-label={t("pricing.billing.label")}
              className="inline-flex self-start items-center rounded-md border bg-background p-1"
            >
              {(["monthly", "yearly"] as const).map((cycle) => (
                <button
                  key={cycle}
                  type="button"
                  role="radio"
                  aria-checked={billingCycle === cycle}
                  onClick={() => setBillingCycle(cycle)}
                  className={cn(
                    "px-3 py-1.5 rounded-sm text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    billingCycle === cycle
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {t(`pricing.billing.${cycle}`)}
                </button>
              ))}
            </div>
          </div>

          {paddleLoading || pricingPlans.length === 0 ? (
            <div className="grid md:grid-cols-3 gap-6">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="h-[420px] rounded-lg border bg-background animate-pulse"
                  aria-hidden
                />
              ))}
            </div>
          ) : (
            <div className="grid md:grid-cols-3 gap-6">
              {pricingPlans.map((plan, i) => (
                <div
                  key={plan.name}
                  style={delay(i * 100)}
                  className={cn(
                    "home-view relative flex flex-col rounded-lg border bg-background p-7 transition-shadow duration-300 hover:shadow-md",
                    plan.popular && "border-primary shadow-md"
                  )}
                >
                  {(plan.popular || plan.isPro) && (
                    <span className="absolute -top-3 left-6 rounded-full bg-primary px-3 py-0.5 text-xs font-semibold text-primary-foreground">
                      {plan.popular
                        ? t("pricing.popular")
                        : t("pricing.pro.freeTrial")}
                    </span>
                  )}
                  <h3 className="text-lg font-semibold">{plan.name}</h3>
                  <p className="text-sm text-muted-foreground mt-1 mb-6">
                    {plan.description}
                  </p>
                  <div className="mb-6 flex items-baseline gap-1.5">
                    <span className="text-4xl font-bold tracking-tight tabular-nums">
                      {plan.price}
                    </span>
                    {plan.showPeriod && (
                      <span className="text-muted-foreground text-sm">
                        {billingCycle === "monthly"
                          ? t("pricingPage.perMonth")
                          : t("pricingPage.perYear")}
                      </span>
                    )}
                  </div>
                  <ul className="space-y-2.5 mb-8">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-2 text-sm">
                        <Check className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Link href={plan.href} className="mt-auto block">
                    <Button
                      variant={plan.popular ? "default" : "outline"}
                      className="w-full"
                    >
                      {plan.cta}
                    </Button>
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="home-view max-w-2xl">
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight mb-3 [text-wrap:balance]">
              {t("home.cta.title")}
            </h2>
            <p className="text-muted-foreground mb-8">
              {t("home.cta.description")}
            </p>
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              <Link href={startHref}>
                <Button size="lg" className="w-full sm:w-auto gap-2">
                  {startLabel}
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link
                href="/contact"
                className="text-sm text-muted-foreground underline-offset-4 hover:underline"
              >
                {t("home.cta.contact")}
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-10 mt-auto">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="flex items-center gap-2">
              <FileSignature className="h-5 w-5 text-primary" />
              <span className="font-semibold">{t("app.title")}</span>
            </div>
            <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-muted-foreground">
              <Link href="/term" className="hover:text-foreground transition-colors">
                {t("footer.terms")}
              </Link>
              <Link href="/privacy" className="hover:text-foreground transition-colors">
                {t("footer.privacy")}
              </Link>
              <Link href="/contact" className="hover:text-foreground transition-colors">
                {t("home.cta.contact")}
              </Link>
              <span>&copy; {new Date().getFullYear()} SeukSeuk</span>
            </div>
          </div>
        </div>
      </footer>

      <ScrollToTopButton label={t("home.scrollTop")} />
    </div>
  );
}

/**
 * 히어로 우측의 제품 미리보기. 서명 요청 문서 한 장과 서명 칸 두 개를 보여주고,
 * 그중 하나에 손글씨 서명이 "슥" 그어지는 것으로 서비스가 하는 일을 설명한다.
 * 모션은 이 한 곳에만 쓴다. prefers-reduced-motion에서는 그어진 상태로 정지.
 */
function SigningMock() {
  const { t } = useLanguage();
  const cardRef = useRef<HTMLDivElement>(null);

  // 마우스 위치에 따라 카드가 아주 살짝(최대 3도) 기운다. 터치·reduced-motion 환경은 CSS에서 무시.
  const handleMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = cardRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width - 0.5;
    const y = (e.clientY - r.top) / r.height - 0.5;
    el.style.setProperty("--rx", `${(-y * 6).toFixed(2)}deg`);
    el.style.setProperty("--ry", `${(x * 6).toFixed(2)}deg`);
  };
  const handleLeave = () => {
    const el = cardRef.current;
    if (!el) return;
    el.style.setProperty("--rx", "0deg");
    el.style.setProperty("--ry", "0deg");
  };

  return (
    <div
      className="relative mx-auto w-full max-w-md lg:max-w-none [perspective:1200px]"
      aria-hidden
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
    >
      <div
        ref={cardRef}
        className="home-tilt rounded-xl border bg-card shadow-[0_24px_60px_-24px_hsl(var(--foreground)/0.25)] p-5 sm:p-7"
      >
        {/* 문서 상단: 보낸 사람 + 진행 상태 */}
        <div className="flex items-center justify-between gap-3 mb-6">
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground truncate">
              {t("home.mock.request")}
            </p>
            <p className="font-semibold truncate">{t("home.mock.docTitle")}</p>
          </div>
          <span className="shrink-0 rounded-full bg-primary/10 text-primary px-2.5 py-1 text-xs font-medium tabular-nums">
            {t("home.mock.progress")}
          </span>
        </div>

        {/* 본문 텍스트 자리 */}
        <div className="space-y-2.5 mb-7">
          <div className="h-2 rounded bg-muted w-11/12" />
          <div className="h-2 rounded bg-muted w-full" />
          <div className="h-2 rounded bg-muted w-4/5" />
          <div className="h-2 rounded bg-muted w-full" />
          <div className="h-2 rounded bg-muted w-2/3" />
        </div>

        <div className="grid grid-cols-2 gap-4">
          {/* 서명된 칸 */}
          <div>
            <p className="text-[11px] text-muted-foreground mb-1.5">
              {t("home.mock.partyA")}
            </p>
            <div className="relative h-20 rounded-md border border-seal/60 bg-seal-soft/60 overflow-hidden">
              <svg
                viewBox="0 0 200 80"
                className="absolute inset-0 h-full w-full"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path
                  className="home-signature-stroke text-foreground"
                  d="M18 52 C 30 20, 44 18, 48 40 S 58 66, 66 44 S 78 14, 88 36 S 100 62, 112 42 C 122 26, 132 28, 138 40 S 150 58, 160 44 S 176 26, 184 40"
                />
              </svg>
              <span
                className="home-pop absolute right-1.5 top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-seal text-primary-foreground"
                style={delay(1650)}
              >
                <Check className="h-3 w-3" />
              </span>
            </div>
          </div>
          {/* 아직 비어 있는 칸 */}
          <div>
            <p className="text-[11px] text-muted-foreground mb-1.5">
              {t("home.mock.partyB")}
            </p>
            <div className="home-hint flex h-20 items-center justify-center rounded-md border-2 border-dashed border-primary/50 bg-primary/5 text-xs font-medium text-primary">
              {t("home.mock.tapToSign")}
            </div>
          </div>
        </div>
      </div>

      {/* 링크 발송 상태 칩 */}
      <div
        className="home-rise absolute -bottom-4 left-4 sm:left-8 flex items-center gap-2 rounded-full border bg-background px-3 py-1.5 text-xs shadow-sm"
        style={delay(1900)}
      >
        <Link2 className="h-3.5 w-3.5 text-muted-foreground" />
        <span>{t("home.mock.linkSent")}</span>
      </div>
    </div>
  );
}

/** CSS 커스텀 프로퍼티로 등장 지연을 넘긴다. globals.css의 .home-rise/.home-word/.home-pop이 읽는다. */
function delay(ms: number): CSSProperties {
  return { "--d": `${ms}ms` } as CSSProperties;
}

/**
 * 히어로 제목을 단어 단위로 아래에서 위로 드러낸다(kinetic type, 한 번만).
 * 줄바꿈(\n)은 그대로 줄로 유지하고, 단어마다 60ms씩 지연을 더한다.
 */
function KineticTitle({ text, startMs }: { text: string; startMs: number }) {
  let index = 0;
  return (
    <>
      {text.split("\n").map((line, li) => (
        <span key={li} className="block">
          {line.split(" ").map((word, wi) => {
            const d = startMs + index++ * 60;
            return (
              <span
                key={`${li}-${wi}`}
                className="inline-block overflow-hidden align-bottom pb-[0.1em] -mb-[0.1em] mr-[0.25em] last:mr-0"
              >
                <span className="home-word block" style={delay(d)}>
                  {word}
                </span>
              </span>
            );
          })}
        </span>
      ))}
    </>
  );
}

function ScrollToTopButton({ label }: { label: string }) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 600);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  if (!scrolled) return null;

  return (
    <button
      type="button"
      aria-label={label}
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      className="fixed bottom-6 right-6 p-3 rounded-full border bg-background text-foreground shadow-md hover:bg-muted transition-colors z-50"
    >
      <ChevronUp className="h-5 w-5" />
    </button>
  );
}

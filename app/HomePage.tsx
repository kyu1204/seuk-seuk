"use client";

import { useLanguage } from "@/contexts/language-context";
import { useAuth } from "@/contexts/auth-context";
import LanguageSelector from "@/components/language-selector";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import {
  ArrowRight,
  Check,
  FileSignature,
  Shield,
  Zap,
  ChevronUp,
  LogOut,
  User,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { useState, useEffect, useTransition } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export default function HomePage() {
  const { t } = useLanguage();
  const { user, loading, signOut } = useAuth();
  const router = useRouter();
  const [scrolled, setScrolled] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [shouldRedirectToHome, setShouldRedirectToHome] = useState(false);

  // 로그아웃 성공 후 사용자 상태가 변경되면 즉시 리다이렉트
  useEffect(() => {
    if (shouldRedirectToHome && !user && !loading) {
      router.push("/");
      setShouldRedirectToHome(false);
    }
  }, [user, loading, shouldRedirectToHome, router]);

  const handleSignOut = async () => {
    startTransition(async () => {
      try {
        // useAuth의 signOut 함수 사용 (클라이언트 사이드)
        await signOut();
        toast.success("로그아웃이 완료되었습니다", { duration: 1000 });
        // 리다이렉트 플래그 설정 - useEffect에서 user 상태 변화를 감지하여 즉시 리다이렉트
        setShouldRedirectToHome(true);
      } catch (error) {
        console.error("Sign out error:", error);
        toast.error("로그아웃 중 오류가 발생했습니다", { duration: 1000 });
      }
    });
  };

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
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

  const pricingPlans = [
    {
      name: t("pricing.light.name"),
      description: t("pricing.light.description"),
      price: "$5",
      features: [
        t("pricing.light.feature1"),
        t("pricing.light.feature2"),
        t("pricing.light.feature3"),
      ],
      cta: t("pricing.light.cta"),
      popular: false,
    },
    {
      name: t("pricing.pro.name"),
      description: t("pricing.pro.description"),
      price: "$20",
      features: [
        t("pricing.pro.feature1"),
        t("pricing.pro.feature2"),
        t("pricing.pro.feature3"),
        t("pricing.pro.feature4"),
      ],
      cta: t("pricing.pro.cta"),
      popular: true,
    },
    {
      name: t("pricing.enterprise.name"),
      description: t("pricing.enterprise.description"),
      price: t("pricing.enterprise.price"),
      features: [
        t("pricing.enterprise.feature1"),
        t("pricing.enterprise.feature2"),
        t("pricing.enterprise.feature3"),
        t("pricing.enterprise.feature4"),
      ],
      cta: t("pricing.enterprise.cta"),
      popular: false,
    },
  ];

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
      {/* Header */}
      <header
        className={cn(
          "sticky top-0 z-50 w-full transition-all duration-200",
          scrolled
            ? "bg-background/80 backdrop-blur-md border-b"
            : "bg-transparent"
        )}
      >
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <Link href="/" className="flex items-center gap-2">
              <FileSignature className="h-8 w-8 text-primary" />
              <span className="font-bold text-xl">{t("app.title")}</span>
            </Link>
            <div className="flex items-center gap-4">
              <ThemeToggle />
              <LanguageSelector />
              {!loading &&
                (user ? (
                  <div className="flex items-center gap-3">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          className="relative h-9 w-9 rounded-full"
                        >
                          <Avatar className="h-9 w-9">
                            <AvatarImage
                              src={user.user_metadata?.avatar_url}
                              alt={
                                user.user_metadata?.full_name ||
                                user.email ||
                                "User"
                              }
                            />
                            <AvatarFallback>
                              {user.user_metadata?.full_name
                                ? user.user_metadata.full_name
                                    .charAt(0)
                                    .toUpperCase()
                                : user.email?.charAt(0).toUpperCase() || "U"}
                            </AvatarFallback>
                          </Avatar>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent className="w-56" align="end">
                        <DropdownMenuLabel className="font-normal">
                          <div className="flex flex-col space-y-1">
                            <p className="text-sm font-medium leading-none">
                              {user.user_metadata?.full_name || "사용자"}
                            </p>
                            <p className="text-xs leading-none text-muted-foreground">
                              {user.email}
                            </p>
                          </div>
                        </DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem asChild>
                          <Link href="/upload" className="cursor-pointer">
                            <User className="mr-2 h-4 w-4" />
                            <span>{t("home.dashboard")}</span>
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={handleSignOut}
                          className="cursor-pointer"
                          disabled={isPending}
                        >
                          <LogOut className="mr-2 h-4 w-4" />
                          <span>
                            {isPending ? "로그아웃 중..." : "로그아웃"}
                          </span>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Link href="/login">
                      <Button className="bg-primary hover:bg-primary/90">
                        {t("login.logIn")}
                      </Button>
                    </Link>
                  </div>
                ))}
            </div>
          </div>
        </div>
      </header>

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
              <Link href="/upload">
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
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4 gradient-text">
              {t("home.pricingTitle")}
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              {t("home.pricingDescription")}
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {pricingPlans.map((plan, index) => (
              <Card
                key={index}
                className={cn(
                  "flex flex-col bg-card border-primary/10 hover:border-primary/30 transition-all duration-300",
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
                <CardContent className="p-8">
                  <h3 className="text-xl font-bold mb-2">{plan.name}</h3>
                  <p className="text-muted-foreground text-sm mb-6">
                    {plan.description}
                  </p>
                  <div className="mb-6">
                    <span className="text-4xl font-bold">{plan.price}</span>
                    {plan.price !== t("pricing.enterprise.price") && (
                      <span className="text-muted-foreground ml-2">
                        {t("pricing.perMonth")}
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
                  <Button
                    className={cn(
                      "w-full",
                      plan.popular
                        ? "bg-primary hover:bg-primary/90 text-white"
                        : "bg-secondary hover:bg-secondary/80"
                    )}
                  >
                    {plan.cta}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
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
            <Link href="/upload">
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
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center gap-2 mb-4 md:mb-0">
              <FileSignature className="h-6 w-6 text-primary" />
              <span className="font-bold">{t("app.title")}</span>
            </div>
            <div className="text-sm text-muted-foreground">
              &copy; {new Date().getFullYear()} SeukSeuk.{" "}
              {t("home.footer.rights")}
            </div>
          </div>
        </div>
      </footer>

      {/* Scroll to top button */}
      {scrolled && (
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          className="fixed bottom-6 right-6 p-3 rounded-full bg-primary text-white shadow-lg hover:bg-primary/90 transition-all z-50"
        >
          <ChevronUp className="h-5 w-5" />
        </button>
      )}
    </div>
  );
}

"use client";

import { useLanguage } from "@/contexts/language-context";
import LanguageSelector from "@/components/language-selector";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import UserAvatar from "@/components/user-avatar";
import { useAuth } from "@/hooks/use-auth";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { FileSignature } from "lucide-react";
import { cn } from "@/lib/utils";

interface SiteHeaderProps {
  showScrollEffect?: boolean;
}

export default function SiteHeader({}: SiteHeaderProps) {
  const { t } = useLanguage();
  const { user, loading, isAuthenticated } = useAuth();
  const pathname = usePathname();

  const navLinkClass = (href: string) =>
    cn(
      pathname?.startsWith(href)
        ? "text-foreground font-semibold"
        : "text-muted-foreground"
    );

  return (
    <header className="sticky top-0 z-50 h-16 border-b bg-background/95 backdrop-blur">
      <div className="container mx-auto px-4 h-full flex justify-between items-center">
        <div className="flex items-center gap-6">
          <Link href="/" aria-label={t("app.title")} className="flex items-center gap-2">
            <FileSignature className="h-[22px] w-[22px] text-primary" />
            <span className="font-bold text-lg">{t("app.title")}</span>
          </Link>
          {isAuthenticated && (
            <nav aria-label="site navigation" className="hidden md:flex gap-6 text-sm">
              <Link href="/dashboard" className={navLinkClass("/dashboard")}>
                {t("header.nav.documents")}
              </Link>
              <Link href="/pricing" className={navLinkClass("/pricing")}>
                {t("header.nav.pricing")}
              </Link>
              <Link href="/bills" className={navLinkClass("/bills")}>
                {t("header.nav.bills")}
              </Link>
            </nav>
          )}
        </div>
        <div className="flex items-center gap-4">
          <ThemeToggle />
          <LanguageSelector />
          {loading ? (
            <Skeleton className="h-8 w-12 rounded-md" />
          ) : isAuthenticated ? (
            <UserAvatar user={user!} />
          ) : (
            <Link href="/login">
              <Button variant="default" size="sm">
                {t("login.logIn")}
              </Button>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}

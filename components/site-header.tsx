"use client";

import { useLanguage } from "@/contexts/language-context";
import LanguageSelector from "@/components/language-selector";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import UserAvatar from "@/components/user-avatar";
import { useAuth } from "@/hooks/use-auth";
import Link from "next/link";
import { FileSignature } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";

interface SiteHeaderProps {
  showScrollEffect?: boolean;
}

export default function SiteHeader({
  showScrollEffect = true,
}: SiteHeaderProps) {
  const { t } = useLanguage();
  const { user, loading, isAuthenticated } = useAuth();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    if (!showScrollEffect) return;

    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [showScrollEffect]);

  return (
    <header
      className={cn(
        "sticky top-0 z-50 w-full transition-all duration-200",
        showScrollEffect && scrolled
          ? "bg-background/80 backdrop-blur-md border-b"
          : showScrollEffect
          ? "bg-transparent"
          : "bg-background border-b"
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
            {loading ? (
              /* 로딩 중일 때 스켈레톤 표시 - 아바타와 버튼 사이의 중간 크기 */
              <Skeleton className="h-8 w-12 rounded-md" />
            ) : isAuthenticated ? (
              /* 로그인 상태일 때 사용자 아바타 표시 */
              <UserAvatar user={user!} />
            ) : (
              /* 비로그인 상태일 때 로그인 버튼 표시 */
              <Link href="/login">
                <Button className="bg-primary hover:bg-primary/90">
                  {t("login.logIn")}
                </Button>
              </Link>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

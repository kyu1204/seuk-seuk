"use client";

import { useLanguage } from "@/contexts/language-context";
import LanguageSelector from "@/components/language-selector";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { FileSignature } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";

interface SiteHeaderProps {
  showScrollEffect?: boolean;
}

export default function SiteHeader({ showScrollEffect = true }: SiteHeaderProps) {
  const { t } = useLanguage();
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
            <Link href="/login">
              <Button className="bg-primary hover:bg-primary/90">
                {t("login.logIn")}
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}
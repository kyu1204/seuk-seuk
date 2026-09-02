"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/language-context";

export default function ErrorPage() {
  const { t } = useLanguage();
  const searchParams = useSearchParams();
  const isAuthError = searchParams.get("type") === "auth";

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-primary/5 to-primary/10">
      <div className="w-full max-w-md">
        <div className="bg-background rounded-lg shadow-lg p-8 border text-center space-y-4">
          <h1 className="text-xl font-semibold text-destructive">
            {t("error.title")}
          </h1>
          <p className="text-sm text-muted-foreground">
            {t("error.description")}
          </p>
          {isAuthError && (
            <Link href="/forgot-password">
              <Button className="w-full">{t("error.retryReset")}</Button>
            </Link>
          )}
          <Link href="/">
            <Button variant="outline" className="w-full">
              {t("error.home")}
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

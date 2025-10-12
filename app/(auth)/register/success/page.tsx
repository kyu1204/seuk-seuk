"use client";

import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/language-context";
import { CheckCircle2, FileSignature, Mail } from "lucide-react";
import Link from "next/link";

export default function RegisterSuccessPage() {
  const { t } = useLanguage();

  return (
    <div className="flex min-h-screen">
      {/* Left side - Pattern background */}
      <div className="hidden md:block md:w-1/2 relative bg-primary/5 overflow-hidden">
        <div className="absolute inset-0 bg-dot-pattern opacity-30"></div>
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-primary/5"></div>
        <div className="absolute inset-0 flex items-center justify-center p-12">
          <div className="max-w-md text-center">
            <FileSignature className="h-20 w-20 text-primary mx-auto mb-6" />
            <h1 className="text-4xl font-bold mb-4 gradient-text">
              {t("register.success.title")}
            </h1>
            <p className="text-lg text-muted-foreground">
              {t("register.joinMessage")}
            </p>
          </div>
        </div>
      </div>

      {/* Right side - Success message */}
      <div className="w-full md:w-1/2 flex flex-col">
        <div className="flex justify-end p-4">
          <Link href="/">
            <Button variant="ghost" size="sm">
              {t("register.backToHome")}
            </Button>
          </Link>
        </div>

        <div className="flex-1 flex items-center justify-center p-8">
          <div className="w-full max-w-md space-y-8">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-6">
                <CheckCircle2 className="h-8 w-8 text-primary" />
              </div>

              <h2 className="text-3xl font-bold tracking-tight mb-2">
                {t("register.success.title")}
              </h2>

              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/5 text-primary text-sm font-medium mb-6">
                <Mail className="h-4 w-4" />
                {t("register.success.emailSent")}
              </div>
            </div>

            <div className="space-y-4 text-center">
              <p className="text-muted-foreground">
                {t("register.success.description")}
              </p>

              <p className="text-sm text-muted-foreground">
                {t("register.success.checkSpam")}
              </p>
            </div>

            <div className="space-y-4">
              <Link href="/login" className="block">
                <Button className="w-full bg-primary hover:bg-primary/90">
                  {t("register.success.goToLogin")}
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

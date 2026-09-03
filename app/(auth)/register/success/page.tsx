"use client";

import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/language-context";
import { CheckCircle2, Mail } from "lucide-react";
import Link from "next/link";
import { AuthShell } from "../../components/auth-shell";

export default function RegisterSuccessPage() {
  const { t } = useLanguage();

  return (
    <AuthShell title={t("register.success.checkEmail")}>
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-6">
          <CheckCircle2 className="h-8 w-8 text-primary" />
        </div>

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

      <Link href="/login" className="block">
        <Button className="w-full bg-primary hover:bg-primary/90">
          {t("register.success.goToLogin")}
        </Button>
      </Link>
    </AuthShell>
  );
}

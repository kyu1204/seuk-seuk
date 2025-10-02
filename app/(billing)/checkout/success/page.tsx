"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle } from "lucide-react";
import SiteHeader from "@/components/site-header";
import { useLanguage } from "@/contexts/language-context";

export default function CheckoutSuccessPage() {
  const { t } = useLanguage();

  return (
    <div className="w-full min-h-screen">
      <SiteHeader showScrollEffect={false} />
      <div className="container mx-auto px-4 py-16 max-w-2xl">
        <Card className="text-center">
          <CardHeader>
            <div className="mx-auto mb-4">
              <CheckCircle className="h-16 w-16 text-green-500" />
            </div>
            <CardTitle className="text-2xl">{t("checkout.success.title")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              {t("checkout.success.message")}
            </p>
            <p className="text-sm text-muted-foreground">
              {t("checkout.success.emailInfo")}
            </p>
            <div className="pt-4">
              <Link href="/dashboard">
                <Button size="lg">{t("checkout.success.dashboard")}</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

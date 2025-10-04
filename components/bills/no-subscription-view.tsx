"use client";

import { useLanguage } from "@/contexts/language-context";
import { Button } from "@/components/ui/button";
import { CreditCard } from "lucide-react";
import Link from "next/link";

export function NoSubscriptionView() {
  const { t } = useLanguage();

  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <div className="mb-6 p-4 rounded-full bg-muted">
        <CreditCard className="h-12 w-12 text-muted-foreground" />
      </div>
      <h3 className="text-xl font-semibold mb-2">
        {t("bills.noSubscription.title")}
      </h3>
      <p className="text-muted-foreground mb-6 max-w-md">
        {t("bills.noSubscription.description")}
      </p>
      <Link href="/pricing">
        <Button size="lg" className="gap-2">
          <CreditCard className="h-5 w-5" />
          {t("bills.noSubscription.action")}
        </Button>
      </Link>
    </div>
  );
}

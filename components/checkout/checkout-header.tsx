"use client";

import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/language-context";
import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

export function CheckoutHeader() {
  const { t } = useLanguage();
  const router = useRouter();

  return (
    <div className="flex items-center gap-4">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => router.back()}
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        {t("checkout.backButton")}
      </Button>
    </div>
  );
}

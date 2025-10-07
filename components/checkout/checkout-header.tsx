"use client";

import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/language-context";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";

export function CheckoutHeader() {
  const { t } = useLanguage();

  return (
    <div>
      <Link href={"/pricing"} className="inline-block">
        <Button
          variant={"secondary"}
          className={
            "h-[32px] border-border px-3 rounded-[4px] flex items-center gap-2 bg-white"
          }
        >
          <ChevronLeft className="w-4 h-4" />
          <span className="text-sm">{t("checkout.backButton")}</span>
        </Button>
      </Link>
    </div>
  );
}

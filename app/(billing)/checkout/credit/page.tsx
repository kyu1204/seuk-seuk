"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { initializePaddle, Paddle, Environments } from "@paddle/paddle-js";
import { PADDLE_CREDIT_PRICE_ID, PADDLE_CREDIT_DISCOUNT_ID } from "@/lib/paddle/pricing-config";
import { Button } from "@/components/ui/button";
import { ArrowLeft, BookPlus } from "lucide-react";
import { useLanguage } from "@/contexts/language-context";
import "../../../styles/checkout.css";

export default function CreditCheckoutPage() {
  const { t } = useLanguage();
  const router = useRouter();
  const searchParams = useSearchParams();

  // Validate and sanitize quantity parameter
  const rawQuantity = parseInt(searchParams.get("quantity") || "5", 10);
  const quantity = Number.isNaN(rawQuantity)
    ? 5 // Default to 5 if invalid
    : Math.min(20, Math.max(5, rawQuantity)); // Clamp to [5, 20]

  const [paddle, setPaddle] = useState<Paddle | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (
      !paddle?.Initialized &&
      process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN &&
      process.env.NEXT_PUBLIC_PADDLE_ENV
    ) {
      initializePaddle({
        token: process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN,
        environment: process.env.NEXT_PUBLIC_PADDLE_ENV as Environments,
        eventCallback: (event) => {
          console.log("Paddle event:", event);
          if (event.name === "checkout.error") {
            console.error("Paddle checkout error:", event);
          }
        },
        checkout: {
          settings: {
            variant: "one-page",
            displayMode: "inline",
            theme: "light",
            frameTarget: "paddle-credit-checkout-frame",
            frameInitialHeight: 450,
            frameStyle:
              "width: 100%; background-color: transparent; border: none",
            successUrl: `${window.location.origin}/checkout/success`,
          },
        },
      }).then(async (paddleInstance) => {
        if (paddleInstance && PADDLE_CREDIT_PRICE_ID) {
          setPaddle(paddleInstance);
          console.log("Opening Paddle checkout with:", {
            priceId: PADDLE_CREDIT_PRICE_ID,
            quantity,
          });
          paddleInstance.Checkout.open({
            items: [{ priceId: PADDLE_CREDIT_PRICE_ID, quantity }],
            discountId: PADDLE_CREDIT_DISCOUNT_ID,
            customData: {
              type: "credit",
              quantity: quantity.toString(),
            },
          });
          setLoading(false);
        }
      });
    }
  }, [paddle?.Initialized, quantity]);

  return (
    <div className="w-full min-h-screen relative overflow-hidden bg-white dark:bg-background">
      <div className="mx-auto max-w-6xl relative px-4 md:px-8 py-6 flex flex-col gap-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.back()}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            {t("checkout.credit.back")}
          </Button>
        </div>

        {/* Main Content */}
        <div className="rounded-lg bg-white dark:bg-card border-2 shadow-lg p-6 md:p-10 md:min-h-[400px] flex flex-col md:flex-row gap-8">
          {/* Left: Order Summary */}
          <div className="w-full md:w-[350px] space-y-6">
            <div className="flex items-center gap-3">
              <BookPlus className="h-8 w-8 text-primary" />
              <h1 className="text-2xl font-bold">{t("checkout.credit.title")}</h1>
            </div>

            <div className="space-y-4 border rounded-lg p-4">
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t("checkout.credit.quantity")}</span>
                <span className="font-medium">{quantity} {t("pricing.credit.per")}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t("checkout.credit.unitPrice")}</span>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground line-through">$1.00</span>
                  <span className="font-medium">$0.50</span>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">{t("checkout.credit.discount", "할인")}</span>
                <span className="text-sm font-medium">50% OFF</span>
              </div>
              <div className="border-t pt-4 flex justify-between">
                <span className="font-bold">{t("checkout.credit.total")}</span>
                <span className="font-bold text-xl text-primary">${(quantity * 0.5).toFixed(2)}</span>
              </div>
            </div>

            <div className="bg-muted p-4 rounded-lg">
              <p className="text-sm font-medium mb-2">{t("checkout.credit.receive")}:</p>
              <p className="text-sm text-muted-foreground">
                {t("checkout.credit.breakdown", { count: quantity })}
              </p>
            </div>
          </div>

          {/* Right: Paddle Checkout */}
          <div className="flex-1 min-w-[375px] lg:min-w-[500px]">
            <div className="text-base leading-5 font-semibold mb-6">
              {t("checkout.credit.pay")}
            </div>
            {loading && (
              <div className="flex items-center justify-center h-[300px]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            )}
            <div className="paddle-credit-checkout-frame" />
          </div>
        </div>
      </div>
    </div>
  );
}

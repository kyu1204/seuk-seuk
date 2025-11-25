"use client";

import { PriceSection } from "@/components/checkout/price-section";
import {
  type Environments,
  initializePaddle,
  type Paddle,
} from "@paddle/paddle-js";
import type { CheckoutEventsData } from "@paddle/paddle-js/types/checkout/events";
import throttle from "lodash.throttle";
import { useCallback, useEffect, useState } from "react";
import { useLanguage } from "@/contexts/language-context";

interface Props {
  userEmail?: string;
  validatedPriceId: string;
}

export function CheckoutContents({ userEmail, validatedPriceId }: Props) {
  const { t } = useLanguage();
  const priceId = validatedPriceId;

  const [quantity, setQuantity] = useState<number>(1);
  const [paddle, setPaddle] = useState<Paddle | null>(null);
  const [checkoutData, setCheckoutData] = useState<CheckoutEventsData | null>(
    null
  );
  const [loading, setLoading] = useState(true);

  const handleCheckoutEvents = (event: CheckoutEventsData) => {
    setCheckoutData(event);
  };

  const updateItems = useCallback(
    throttle((paddle: Paddle, priceId: string, quantity: number) => {
      paddle.Checkout.updateItems([{ priceId, quantity }]);
    }, 1000),
    []
  );

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
          if (event.data && event.name) {
            handleCheckoutEvents(event.data);
          }
        },
        checkout: {
          settings: {
            variant: "one-page",
            displayMode: "inline",
            theme: "light",
            allowLogout: !userEmail,
            frameTarget: "paddle-checkout-frame",
            frameInitialHeight: 450,
            frameStyle:
              "width: 100%; background-color: transparent; border: none",
            successUrl: `${window.location.origin}/checkout/success`,
          },
        },
      }).then(async (paddleInstance) => {
        if (paddleInstance && priceId) {
          setPaddle(paddleInstance);
          paddleInstance.Checkout.open({
            ...(userEmail && { customer: { email: userEmail } }),
            items: [{ priceId: priceId, quantity: 1 }],
          });
          setLoading(false);
        }
      });
    }
  }, [paddle?.Initialized, priceId, userEmail]);

  useEffect(() => {
    if (paddle && priceId && paddle.Initialized) {
      updateItems(paddle, priceId, quantity);
    }
  }, [paddle, priceId, quantity, updateItems]);

  return (
    <div className="rounded-lg bg-white dark:bg-card border-2 shadow-lg p-6 md:p-10 md:min-h-[400px] flex flex-col md:flex-row gap-8">
      {/* Left: Order Summary */}
      <div className="w-full md:w-[350px]">
        <PriceSection
          checkoutData={checkoutData}
          quantity={quantity}
          handleQuantityChange={setQuantity}
        />
      </div>

      {/* Right: Paddle Checkout */}
      <div className="flex-1 min-w-0 md:min-w-[375px] lg:min-w-[500px]">
        <div className="text-base leading-5 font-semibold mb-6">
          {t("checkout.paymentDetails")}
        </div>
        {loading && (
          <div className="flex items-center justify-center h-[300px]">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        )}
        <div className="paddle-checkout-frame" />
      </div>
    </div>
  );
}

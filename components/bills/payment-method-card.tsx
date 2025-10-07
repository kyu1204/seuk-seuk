"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CreditCard, RefreshCw } from "lucide-react";
import { getPrimaryPaymentMethod } from "@/lib/paddle/get-payment-methods";
import { getSubscriptions } from "@/lib/paddle/get-subscriptions";
import { formatDateByLang } from "@/lib/date/format";
import { useLanguage } from "@/contexts/language-context";
import { Environments, initializePaddle, Paddle } from "@paddle/paddle-js";
import { createPaymentMethodChangeTransaction } from "@/lib/paddle/get-payment-method-change-transaction";

export function PaymentMethodCard() {
  const { t, language } = useLanguage();
  const [brand, setBrand] = useState<string | undefined>(undefined);
  const [last4, setLast4] = useState<string | undefined>(undefined);
  const [expiry, setExpiry] = useState<string | undefined>(undefined);
  const [nextBilling, setNextBilling] = useState<string | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [paddle, setPaddle] = useState<Paddle | undefined>(undefined);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const [pm, subs] = await Promise.all([
          getPrimaryPaymentMethod(),
          getSubscriptions(),
        ]);
        if (pm.method) {
          setBrand(pm.method.brand);
          setLast4(pm.method.last4);
          if (pm.method.expiryMonth && pm.method.expiryYear) {
            setExpiry(`${pm.method.expiryMonth}/${pm.method.expiryYear}`);
          }
        }
        const first = subs.data && subs.data.length > 0 ? subs.data[0] : undefined;
        if (first?.nextBilledAt) {
          setNextBilling(formatDateByLang(first.nextBilledAt, "date", language));
        }
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [language]);

  useEffect(() => {
    if (
      process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN &&
      process.env.NEXT_PUBLIC_PADDLE_ENV
    ) {
      initializePaddle({
        token: process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN,
        environment: process.env.NEXT_PUBLIC_PADDLE_ENV as Environments,
      })
        .then((p) => setPaddle(p))
        .catch(() => setPaddle(undefined));
    }
  }, []);

  const masked = last4 ? `**** **** **** ${last4}` : undefined;

  async function handleUpdateCard() {
    try {
      setUpdating(true);
      const res = await createPaymentMethodChangeTransaction();
      if (res.transactionId && paddle) {
        paddle.checkout.open({ transactionId: res.transactionId });
      }
    } finally {
      setUpdating(false);
    }
  }

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-4 w-4" /> {t("bills.paymentMethod")}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 h-full flex flex-col">
        {loading ? (
          <div className="space-y-2">
            <div className="h-4 bg-muted rounded animate-pulse w-1/2" />
            <div className="h-4 bg-muted rounded animate-pulse w-1/3" />
          </div>
        ) : (
          <>
            <div className="text-sm">
              <div className="text-muted-foreground">Card</div>
              <div className="font-medium">
                {brand ? `${brand.toUpperCase()} ${masked || ""}` : "No card on file"}
              </div>
            </div>
            {expiry && (
              <div className="text-sm">
                <div className="text-muted-foreground">Expiry</div>
                <div className="font-medium">{expiry}</div>
              </div>
            )}
            {nextBilling && (
              <div className="text-sm">
                <div className="text-muted-foreground">Next billing date</div>
                <div className="font-medium">{nextBilling}</div>
              </div>
            )}
            <Button onClick={handleUpdateCard} disabled={!paddle || updating} className="gap-2 mt-auto">
              <RefreshCw className="h-4 w-4" />
              {updating ? "Updating..." : "Update card"}
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}

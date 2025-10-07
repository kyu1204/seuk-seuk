"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CreditCard, RefreshCw } from "lucide-react";
import { formatDateByLang } from "@/lib/date/format";
import { useLanguage } from "@/contexts/language-context";
import { Environments, initializePaddle, Paddle } from "@paddle/paddle-js";
import { toast } from "@/components/ui/use-toast";
import { createPaymentMethodChangeTransaction } from "@/lib/paddle/get-payment-method-change-transaction";
import type { Transaction, Subscription } from "@paddle/paddle-node-sdk";

interface PaymentMethodCardProps {
  transactions?: Transaction[];
  subscription?: Subscription;
}

function findPaymentMethodDetails(transactions?: Transaction[]) {
  const transactionWithPaymentDetails = transactions?.find(
    (transaction) => transaction.payments?.[0]?.methodDetails
  );
  const firstValidPaymentMethod = transactionWithPaymentDetails?.payments?.[0]?.methodDetails;
  return firstValidPaymentMethod || null;
}

export function PaymentMethodCard({ transactions, subscription }: PaymentMethodCardProps) {
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
        const paymentDetails = findPaymentMethodDetails(transactions);
        if (paymentDetails?.type === "card" && paymentDetails.card) {
          setBrand(paymentDetails.card.type);
          setLast4(paymentDetails.card.last4);
          if (paymentDetails.card.expiryMonth && paymentDetails.card.expiryYear) {
            setExpiry(`${paymentDetails.card.expiryMonth}/${paymentDetails.card.expiryYear}`);
          }
        }
        if (subscription?.nextBilledAt) {
          setNextBilling(formatDateByLang(subscription.nextBilledAt, "date", language));
        }
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [language, transactions, subscription]);

  useEffect(() => {
    if (
      process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN &&
      process.env.NEXT_PUBLIC_PADDLE_ENV
    ) {
      initializePaddle({
        token: process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN,
        environment: process.env.NEXT_PUBLIC_PADDLE_ENV as Environments,
        eventCallback: async (event) => {
          // When checkout completes, refresh card data
          if (event?.name === "checkout.completed") {
            // Refresh the page to get updated transactions
            window.location.reload();
          }
        },
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
      if (!res.transactionId) {
        toast({ title: "Failed to start card update", description: res.error || "No transaction created" });
        return;
      }
      if (!paddle) {
        toast({ title: "Paddle not initialized", description: "Please try again later." });
        return;
      }
      // Use correct Paddle JS API (capitalized Checkout)
      paddle.Checkout.open({ transactionId: res.transactionId });
      // Also set a delayed refresh in case events are missed
      setTimeout(() => {
        window.location.reload();
      }, 3000);
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

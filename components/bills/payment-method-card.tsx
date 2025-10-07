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
import { parseMoney } from "@/lib/paddle/parse-money";
import { getPrimaryPaymentMethod } from "@/lib/paddle/get-payment-methods";
import { getSubscriptions } from "@/lib/paddle/get-subscriptions";

interface PaymentMethodCardProps {
  transactions?: Transaction[];
  subscription?: Subscription;
}

function findPaymentMethodDetails(transactions?: Transaction[]) {
  const transactionWithPaymentDetails = transactions?.find(
    (transaction) => transaction.payments?.[0]?.methodDetails
  );
  const firstValidPaymentMethod =
    transactionWithPaymentDetails?.payments?.[0]?.methodDetails;
  return firstValidPaymentMethod || null;
}

export function PaymentMethodCard({
  transactions,
  subscription,
}: PaymentMethodCardProps) {
  const { t, language } = useLanguage();
  const [brand, setBrand] = useState<string | undefined>(undefined);
  const [last4, setLast4] = useState<string | undefined>(undefined);
  const [expiry, setExpiry] = useState<string | undefined>(undefined);
  const [nextBilling, setNextBilling] = useState<string | undefined>(undefined);
  const [nextPaymentAmount, setNextPaymentAmount] = useState<
    string | undefined
  >(undefined);
  const [isCanceling, setIsCanceling] = useState(false);
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
          if (
            paymentDetails.card.expiryMonth &&
            paymentDetails.card.expiryYear
          ) {
            setExpiry(
              `${paymentDetails.card.expiryMonth}/${paymentDetails.card.expiryYear}`
            );
          }
        } else {
          // Fallback: fetch from server using Paddle APIs
          const pm = await getPrimaryPaymentMethod();
          if (pm.method) {
            setBrand(pm.method.brand);
            setLast4(pm.method.last4);
            if (pm.method.expiryMonth && pm.method.expiryYear) {
              setExpiry(`${pm.method.expiryMonth}/${pm.method.expiryYear}`);
            }
          }
        }

        // Next billing info
        let cancelingStatus =
          subscription?.scheduledChange?.action === "cancel";
        if (subscription) {
          setIsCanceling(!!cancelingStatus);
          if (subscription.nextBilledAt) {
            setNextBilling(
              formatDateByLang(subscription.nextBilledAt, "date", language)
            );
          } else if (
            cancelingStatus &&
            subscription?.scheduledChange?.effectiveAt
          ) {
            setNextBilling(
              formatDateByLang(
                subscription.scheduledChange.effectiveAt,
                "date",
                language
              )
            );
          } else if (subscription?.currentBillingPeriod?.endsAt) {
            setNextBilling(
              formatDateByLang(
                subscription.currentBillingPeriod.endsAt,
                "date",
                language
              )
            );
          }
          if (
            subscription?.nextTransaction?.details?.totals?.total &&
            subscription?.currencyCode
          ) {
            setNextPaymentAmount(
              parseMoney(
                subscription.nextTransaction.details.totals.total,
                subscription.currencyCode
              )
            );
          }
        } else {
          // Fallback: derive from latest subscription if needed
          const subs = await getSubscriptions();
          const first =
            subs.data && subs.data.length > 0 ? subs.data[0] : undefined;
          cancelingStatus = first?.scheduledChange?.action === "cancel";
          setIsCanceling(!!cancelingStatus);
          if (first?.nextBilledAt) {
            setNextBilling(
              formatDateByLang(first.nextBilledAt, "date", language)
            );
          }
          if (
            first?.nextTransaction?.details?.totals?.total &&
            first?.currencyCode
          ) {
            setNextPaymentAmount(
              parseMoney(
                first.nextTransaction.details.totals.total,
                first.currencyCode
              )
            );
          }
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
          // When checkout completes, refresh card data without full reload
          if (event?.name === "checkout.completed") {
            const pm = await getPrimaryPaymentMethod();
            if (pm.method) {
              setBrand(pm.method.brand);
              setLast4(pm.method.last4);
              if (pm.method.expiryMonth && pm.method.expiryYear) {
                setExpiry(`${pm.method.expiryMonth}/${pm.method.expiryYear}`);
              }
            }
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
        toast({
          title: "Failed to start card update",
          description: res.error || "No transaction created",
        });
        return;
      }
      if (!paddle) {
        toast({
          title: "Paddle not initialized",
          description: "Please try again later.",
        });
        return;
      }
      // Use correct Paddle JS API (capitalized Checkout)
      paddle.Checkout.open({ transactionId: res.transactionId });
    } finally {
      setUpdating(false);
    }
  }

  return (
    <Card className="h-full">
      <CardContent className="p-6">
        {loading ? (
          <div className="space-y-2">
            <div className="h-4 bg-muted rounded animate-pulse w-1/2" />
            <div className="h-4 bg-muted rounded animate-pulse w-1/3" />
          </div>
        ) : (
          <div
            className={`grid grid-cols-1 ${
              isCanceling ? "" : "md:grid-cols-2"
            } gap-6`}
          >
            {/* Left side - Payment method (hidden when canceling) */}
            {!isCanceling && (
              <div className="space-y-4 flex flex-col">
                <h3 className="text-lg font-semibold">
                  {t("bills.paymentMethod")}
                </h3>
                <div className="flex-1 space-y-3">
                  <div className="flex items-center gap-2">
                    <CreditCard className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">
                      {masked || "No card on file"}
                    </span>
                  </div>
                  {expiry && (
                    <div className="text-sm text-muted-foreground">
                      Expires {expiry}
                    </div>
                  )}
                </div>
                <Button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    void handleUpdateCard();
                  }}
                  disabled={!paddle || updating}
                  variant="outline"
                  className="w-full"
                >
                  {updating ? t("bills.card.updating") : t("bills.card.update")}
                </Button>
              </div>
            )}

            {/* Right side - Next payment or Subscription ends */}
            {(nextBilling || nextPaymentAmount) && (
              <div
                className={`space-y-4 flex flex-col ${
                  !isCanceling
                    ? "md:border-l border-t md:border-t-0 border-border pt-6 md:pt-0 md:pl-6"
                    : ""
                }`}
              >
                <h3 className="text-lg font-semibold">
                  {isCanceling
                    ? t("bills.subscriptionEnds")
                    : t("bills.nextPayment")}
                </h3>
                <div className="flex-1 flex flex-col justify-center">
                  <div className="flex flex-col gap-2">
                    {!isCanceling && nextPaymentAmount && (
                      <div className="text-2xl md:text-3xl font-semibold">
                        {nextPaymentAmount}
                      </div>
                    )}
                    {nextBilling && (
                      <div className="text-xl md:text-2xl font-medium">
                        {!isCanceling && (
                          <span className="text-muted-foreground text-base">
                            due{" "}
                          </span>
                        )}
                        {nextBilling}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

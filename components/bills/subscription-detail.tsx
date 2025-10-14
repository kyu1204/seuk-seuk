"use client";

import { useEffect, useState } from "react";
import { getSubscription } from "@/lib/paddle/get-subscription";
import type { Subscription } from "@paddle/paddle-node-sdk";
import { LoadingScreen } from "@/components/bills/loading-screen";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Status } from "@/components/bills/status";
import { parseMoney } from "@/lib/paddle/parse-money";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { cancelSubscription } from "@/lib/paddle/cancel-subscription";
import { toast } from "@/components/ui/use-toast";
import { useLanguage } from "@/contexts/language-context";
import { formatDateByLang } from "@/lib/date/format";

interface Props {
  subscriptionId: string;
  onCancelSuccess?: () => void | Promise<void>;
}

export function SubscriptionDetail({ subscriptionId, onCancelSuccess }: Props) {
  const { t, language } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  
  const [error, setError] = useState<string | null>(null);
  const [canceling, setCanceling] = useState(false);

  useEffect(() => {
    async function fetchData() {
      try {
        const [subscriptionResponse] = await Promise.all([
          getSubscription(subscriptionId),
        ]);

        if (subscriptionResponse.error) {
          setError(subscriptionResponse.error);
        } else if (subscriptionResponse.data) {
          setSubscription(subscriptionResponse.data);
        }

        
      } catch (err) {
        console.error("Error:", err);
        setError(t("bills.error.loadSubscriptionDetail"));
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [subscriptionId]);

  if (loading) {
    return <LoadingScreen />;
  }

  if (error || !subscription) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          {error || "Failed to load subscription"}
        </AlertDescription>
      </Alert>
    );
  }

  const subscriptionItem = subscription.items[0];
  const price =
    subscriptionItem.quantity *
    parseFloat(subscription?.recurringTransactionDetails?.totals.total ?? "0");
  const formattedPrice = parseMoney(
    price.toString(),
    subscription.currencyCode
  );
  const frequency =
    subscription.billingCycle.frequency === 1
      ? `/${subscription.billingCycle.interval}`
      : `every ${subscription.billingCycle.frequency} ${subscription.billingCycle.interval}s`;

  const formattedStartedDate = formatDateByLang(
    subscription.startedAt as string,
    "date",
    language
  );

  const isCanceling = subscription.scheduledChange?.action === "cancel";
  const cancelEffectiveAt = isCanceling ? subscription.scheduledChange?.effectiveAt : null;

  const showCancel =
    !isCanceling &&
    ["active", "trialing", "past_due", "paused"].includes(
      (subscription.status || "").toLowerCase()
    );

  async function onConfirmCancel() {
    if (!subscription) return;
    try {
      setCanceling(true);
      const subscriptionIdToCancel = subscription.id;
      const res = await cancelSubscription(
        subscriptionIdToCancel,
        "next_billing_period"
      );
      if (!res.ok) {
        toast({ title: t("bills.cancel.failed"), description: res.error });
        return;
      }
      toast({ title: t("bills.cancel.scheduled") });
      // Refresh subscription details
      const fresh = await getSubscription(subscriptionId);
      if (fresh.data) setSubscription(fresh.data);
      // Notify parent to refresh all data
      if (onCancelSuccess) await onCancelSuccess();
    } catch (err: any) {
      toast({ title: t("bills.cancel.failed"), description: err?.message });
    } finally {
      setCanceling(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Subscription Header */}
      <div className="space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h2 className="text-3xl font-medium truncate">
              {subscriptionItem.product.name}
            </h2>
            <div className="mt-3 flex items-center gap-6 flex-wrap">
              <div className="flex gap-1 items-end">
                <span className="text-3xl font-medium">{formattedPrice}</span>
                <span className="text-muted-foreground text-sm">
                  {frequency}
                </span>
              </div>
              <Status status={subscription.status} />
            </div>
          </div>
          {showCancel && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" disabled={canceling}>
                  {canceling
                    ? t("bills.cancel.canceling")
                    : t("bills.cancel.action")}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>{t("bills.cancel.title")}</AlertDialogTitle>
                  <AlertDialogDescription>
                    {t("bills.cancel.description")}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>
                    {t("bills.cancel.keep")}
                  </AlertDialogCancel>
                  <AlertDialogAction onClick={onConfirmCancel}>
                    {t("bills.cancel.confirm")}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
        <div className="text-muted-foreground text-base">
          {t("bills.startedOn")} {formattedStartedDate}
        </div>
      </div>

    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { getSubscriptions } from "@/lib/paddle/get-subscriptions";
import type { Subscription } from "@paddle/paddle-node-sdk";
import { LoadingScreen } from "@/components/bills/loading-screen";
import { NoSubscriptionView } from "@/components/bills/no-subscription-view";
import { SubscriptionDetail } from "@/components/bills/subscription-detail";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { useLanguage } from "@/contexts/language-context";

export function SubscriptionsTab() {
  const { t } = useLanguage();
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchSubscriptions() {
      try {
        const { data, error: fetchError } = await getSubscriptions();

        if (fetchError) {
          setError(fetchError);
        } else {
          setSubscriptions(data || []);
        }
      } catch (err) {
        console.error("Error:", err);
        setError(t("bills.error.loadSubscriptions"));
      } finally {
        setLoading(false);
      }
    }

    fetchSubscriptions();
  }, []);

  if (loading) {
    return <LoadingScreen />;
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (subscriptions.length === 0) {
    return <NoSubscriptionView />;
  }

  // For now, show only the first subscription
  return <SubscriptionDetail subscriptionId={subscriptions[0].id} />;
}

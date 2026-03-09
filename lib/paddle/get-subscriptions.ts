"use server";

import { SubscriptionResponse } from "@/lib/api.types";
import { getCustomerId } from "@/lib/paddle/get-customer-id";
import { getErrorMessage, parseSDKResponse } from "@/lib/paddle/data-helpers";
import { getPaddleInstance } from "@/lib/paddle/get-paddle-instance";

export async function getSubscriptions(): Promise<SubscriptionResponse> {
  try {
    const customerId = await getCustomerId();
    if (customerId) {
      const subscriptionCollection = getPaddleInstance().subscriptions.list({
        customerId: [customerId],
        perPage: 20,
        include: ['next_transaction', 'recurring_transaction_details'],
      });
      const subscriptions = await subscriptionCollection.next();
      return {
        data: parseSDKResponse(subscriptions ?? []),
        hasMore: subscriptionCollection.hasMore,
        totalRecords: subscriptionCollection.estimatedTotal,
      };
    }
    // No customer yet (user never paid) — return empty without error
    return { data: [], hasMore: false, totalRecords: 0 };
  } catch (e) {
    console.error("Error fetching subscriptions:", e);
    return getErrorMessage();
  }
  // Unreachable, but satisfy return type
  // (we already return above when no customer)
}

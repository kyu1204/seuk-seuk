"use server";

import { getPaddleInstance } from "@/lib/paddle/get-paddle-instance";
import { getCustomerId } from "@/lib/paddle/get-customer-id";
import { parseSDKResponse } from "@/lib/paddle/data-helpers";
import type { SubscriptionEffectiveFrom } from "@paddle/paddle-node-sdk/dist/types/enums/subscription/subscription-effective-from";

export async function cancelSubscription(
  subscriptionId: string,
  effectiveFrom: SubscriptionEffectiveFrom = "next_billing_period"
): Promise<{ ok: boolean; error?: string; status?: string }> {
  try {
    const customerId = await getCustomerId();
    if (!customerId) {
      return { ok: false, error: "Missing customer context" };
    }

    const paddle = getPaddleInstance();

    // Verify the subscription belongs to the current customer
    const sub = await paddle.subscriptions.get(subscriptionId);
    const subJson = parseSDKResponse(sub);
    if (subJson.customerId !== customerId) {
      return { ok: false, error: "Unauthorized subscription access" };
    }

    const canceled = await paddle.subscriptions.cancel(subscriptionId, {
      effectiveFrom,
    });
    const canceledJson = parseSDKResponse(canceled);

    return { ok: true, status: canceledJson.status };
  } catch (e: any) {
    console.error("Error canceling subscription:", e);
    const message = e?.message || "Failed to cancel subscription";
    return { ok: false, error: message };
  }
}


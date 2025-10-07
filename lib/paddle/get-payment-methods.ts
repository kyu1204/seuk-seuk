"use server";

import { getCustomerId } from "@/lib/paddle/get-customer-id";
import { getPaddleInstance } from "@/lib/paddle/get-paddle-instance";
import { parseSDKResponse } from "@/lib/paddle/data-helpers";

export interface PaymentMethodSummary {
  id: string;
  brand?: string;
  last4?: string;
  expiryMonth?: number;
  expiryYear?: number;
  savedAt?: string;
}

export async function getPrimaryPaymentMethod(
  overrideCustomerId?: string
): Promise<{
  method: PaymentMethodSummary | null;
  error?: string;
}> {
  try {
    const customerId = overrideCustomerId || (await getCustomerId());
    if (!customerId) return { method: null };

    const paddle = getPaddleInstance();
    const collection = paddle.paymentMethods.list(customerId, { perPage: 50 });
    const list = await collection.next();
    const methods = parseSDKResponse(list || []);
    if (!methods || methods.length === 0) return { method: null };

    // Prefer card methods first, then most recently updated
    const sorted = methods
      .filter((m: any) => !!m.card)
      .sort((a: any, b: any) =>
        (b.updatedAt || b.savedAt || "").localeCompare(
          a.updatedAt || a.savedAt || ""
        )
      );
    const m = (sorted[0] || methods[0]) as any;
    const summary: PaymentMethodSummary = {
      id: m.id,
      brand: m.card?.type,
      last4: m.card?.last4,
      expiryMonth: m.card?.expiryMonth,
      expiryYear: m.card?.expiryYear,
      savedAt: m.savedAt,
    };
    return { method: summary };
  } catch (e: any) {
    console.error("Error fetching payment methods:", e);
    return { method: null, error: e?.message || "Failed to fetch payment methods" };
  }
}

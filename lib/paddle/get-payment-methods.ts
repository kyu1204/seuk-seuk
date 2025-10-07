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
    async function fetchByCustomer(cid: string) {
      const paddle = getPaddleInstance();
      const collection = paddle.paymentMethods.list(cid, {
        perPage: 50,
        orderBy: "updated_at_desc",
      } as any);
      const list = await collection.next();
      return parseSDKResponse(list || []);
    }

    const primaryId = overrideCustomerId || (await getCustomerId());
    if (!primaryId) return { method: null };

    let methods: any[] = await fetchByCustomer(primaryId);
    // If override id returns nothing, try fallback id
    if ((!methods || methods.length === 0) && overrideCustomerId) {
      const fallbackId = await getCustomerId();
      if (fallbackId && fallbackId !== overrideCustomerId) {
        methods = await fetchByCustomer(fallbackId);
      }
    }

    if (!methods || methods.length === 0) return { method: null };

    // Prefer card methods first, then most recently updated; if none, allow PayPal
    const cardSorted = methods
      .filter((m: any) => !!m.card)
      .sort((a: any, b: any) =>
        (b.updatedAt || b.savedAt || "").localeCompare(
          a.updatedAt || a.savedAt || ""
        )
      );
    const m = (cardSorted[0] || methods[0]) as any;
    const summary: PaymentMethodSummary = {
      id: m.id,
      brand: m.card?.type || (m.paypal ? "paypal" : undefined),
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

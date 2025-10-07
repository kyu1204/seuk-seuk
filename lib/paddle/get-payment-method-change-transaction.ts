"use server";

import { getCustomerId } from "@/lib/paddle/get-customer-id";
import { getPaddleInstance } from "@/lib/paddle/get-paddle-instance";

export async function createPaymentMethodChangeTransaction(): Promise<{
  transactionId?: string;
  error?: string;
}> {
  try {
    const customerId = await getCustomerId();
    if (!customerId) return { error: "Missing customer" };
    const paddle = getPaddleInstance();
    // Find an active subscription for this customer
    const subs = paddle.subscriptions.list({ customerId: [customerId], perPage: 5 });
    const list = await subs.next();
    const active = (list || []).find((s: any) => (s.status || "").toLowerCase() === "active");
    const target = active || (list || [])[0];
    if (!target) return { error: "No subscription found" };
    const tx = await paddle.subscriptions.getPaymentMethodChangeTransaction(target.id);
    return { transactionId: tx.id };
  } catch (e: any) {
    console.error("Error creating payment method change transaction:", e);
    return { error: e?.message || "Failed to create payment method change transaction" };
  }
}


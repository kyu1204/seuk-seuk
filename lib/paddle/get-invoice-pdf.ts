"use server";

import { getPaddleInstance } from "@/lib/paddle/get-paddle-instance";

export async function getInvoicePdf(
  transactionId: string
): Promise<{ url?: string; error?: string }> {
  try {
    const paddle = getPaddleInstance();

    // Get invoice PDF URL from Paddle API
    // The SDK doesn't have a built-in method, so we use the underlying API client
    const response = await paddle.transactions.getInvoicePDF(transactionId);

    if (!response || !response.url) {
      return { error: "Invoice PDF not available" };
    }

    return { url: response.url };
  } catch (error) {
    console.error("Error fetching invoice PDF:", error);
    return { error: "Failed to fetch invoice PDF" };
  }
}

"use server";

import { createServerSupabase } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/service-role";

export interface CreditBalance {
  create_credits: number;
  publish_credits: number;
}

/**
 * Get current user's credit balance
 */
export async function getCreditBalance(): Promise<{
  credits?: CreditBalance;
  error?: string;
}> {
  try {
    const supabase = await createServerSupabase();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return { error: "User not authenticated" };
    }

    const { data, error } = await supabase
      .from("credit_balance")
      .select("create_credits, publish_credits")
      .eq("user_id", user.id)
      .single();

    if (error) {
      // 레코드가 없는 경우 0으로 반환
      if (error.code === "PGRST116") {
        return {
          credits: {
            create_credits: 0,
            publish_credits: 0,
          },
        };
      }
      console.error("Get credit balance error:", error);
      return { error: "Failed to get credit balance" };
    }

    return {
      credits: {
        create_credits: data.create_credits,
        publish_credits: data.publish_credits,
      },
    };
  } catch (error) {
    console.error("Get credit balance error:", error);
    return { error: "An unexpected error occurred" };
  }
}

/**
 * Check if a document was created using credit
 */
export async function wasDocumentCreatedWithCredit(
  documentId: string,
  type: "create" | "publish"
): Promise<{ usedCredit: boolean; error?: string }> {
  try {
    const supabase = await createServerSupabase();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return { usedCredit: false, error: "User not authenticated" };
    }

    const serviceSupabase = createServiceRoleClient();

    // Check if there's a deduction transaction for this document
    const transactionType = type === "create" ? "use_create" : "use_publish";
    const { data, error } = await serviceSupabase
      .from("credit_transactions")
      .select("id")
      .eq("user_id", user.id)
      .eq("related_document_id", documentId)
      .eq("transaction_type", transactionType)
      .maybeSingle();

    if (error) {
      console.error("Check credit usage error:", error);
      return { usedCredit: false, error: "Failed to check credit usage" };
    }

    return { usedCredit: !!data };
  } catch (error) {
    console.error("Check credit usage error:", error);
    return { usedCredit: false, error: "An unexpected error occurred" };
  }
}

/**
 * Refund credit when a document is deleted
 */
export async function refundCredit(
  type: "create" | "publish",
  documentId: string
): Promise<{ success?: boolean; error?: string }> {
  try {
    const supabase = await createServerSupabase();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return { error: "User not authenticated" };
    }

    const serviceSupabase = createServiceRoleClient();

    // 1. Record refund transaction
    const { error: transactionError } = await serviceSupabase
      .from("credit_transactions")
      .insert({
        user_id: user.id,
        transaction_type: `refund_${type}`,
        create_credits: type === "create" ? 1 : 0,
        publish_credits: type === "publish" ? 1 : 0,
        related_document_id: documentId,
      });

    if (transactionError) {
      console.error("Refund transaction error:", transactionError);
      return { error: "Failed to record refund transaction" };
    }

    // 2. Increment credit balance
    const { data: balance } = await serviceSupabase
      .from("credit_balance")
      .select("create_credits, publish_credits")
      .eq("user_id", user.id)
      .single();

    const { error: balanceError } = await serviceSupabase
      .from("credit_balance")
      .upsert({
        user_id: user.id,
        create_credits: (balance?.create_credits || 0) + (type === "create" ? 1 : 0),
        publish_credits: (balance?.publish_credits || 0) + (type === "publish" ? 1 : 0),
        updated_at: new Date().toISOString(),
      }, { onConflict: "user_id" });

    if (balanceError) {
      console.error("Refund balance error:", balanceError);
      return { error: "Failed to refund credit balance" };
    }

    return { success: true };
  } catch (error) {
    console.error("Refund credit error:", error);
    return { error: "An unexpected error occurred" };
  }
}

/**
 * Deduct credit atomically using DB function
 */
export async function deductCredit(
  type: "create" | "publish",
  documentId: string
): Promise<{ success?: boolean; error?: string }> {
  try {
    const supabase = await createServerSupabase();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return { error: "User not authenticated" };
    }

    const serviceSupabase = createServiceRoleClient();

    const { data, error } = await serviceSupabase.rpc("deduct_credit_atomic", {
      p_user_id: user.id,
      p_type: type,
      p_document_id: documentId,
    });

    // Check for RPC error first
    if (error) {
      console.error("Deduct credit RPC error:", error);
      if (error.message?.includes("Insufficient credits")) {
        return { error: "크레딧이 부족합니다" };
      }
      return { error: "Failed to deduct credit" };
    }

    // Check the boolean return value from deduct_credit_atomic
    if (!data) {
      console.error("Deduct credit failed: insufficient balance", {
        userId: user.id,
        type,
        documentId,
        returnValue: data,
      });
      return { error: "크레딧이 부족합니다" };
    }

    // Only return success when data === true
    console.log("Credit deduction successful", {
      userId: user.id,
      type,
      documentId,
    });
    return { success: true };
  } catch (error) {
    console.error("Deduct credit error:", error);
    return { error: "An unexpected error occurred" };
  }
}

/**
 * Add credits to user balance (called from webhook)
 * Uses atomic DB function to ensure:
 * - Idempotency (duplicate webhook protection via paddle_transaction_id UNIQUE constraint)
 * - Thread-safety (atomic transaction + balance update)
 * - Data consistency (transaction record + balance always in sync)
 */
export async function addCredits(
  userId: string,
  quantity: number,
  paddleTransactionId: string
): Promise<{ success?: boolean; error?: string }> {
  try {
    const serviceSupabase = createServiceRoleClient();

    // Call atomic DB function
    const { data, error } = await serviceSupabase.rpc("add_credits_atomic", {
      p_user_id: userId,
      p_quantity: quantity,
      p_paddle_transaction_id: paddleTransactionId,
    });

    if (error) {
      console.error("Add credits error:", error);
      return { error: "Failed to add credits" };
    }

    // data is array of {success: boolean, error_message: text | null}
    const result = data?.[0];

    if (!result?.success) {
      const errorMsg = result?.error_message || "Failed to add credits";
      console.error("Add credits failed:", errorMsg);
      return { error: errorMsg };
    }

    // Log if this was a duplicate (idempotent retry)
    if (result.error_message === "Already processed") {
      console.log(`Idempotent webhook: ${paddleTransactionId} already processed`);
    }

    return { success: true };
  } catch (error) {
    console.error("Add credits error:", error);
    return { error: "An unexpected error occurred" };
  }
}

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

    if (error) {
      console.error("Deduct credit error:", error);
      if (error.message?.includes("Insufficient credits")) {
        return { error: "크레딧이 부족합니다" };
      }
      return { error: "Failed to deduct credit" };
    }

    return { success: true };
  } catch (error) {
    console.error("Deduct credit error:", error);
    return { error: "An unexpected error occurred" };
  }
}

/**
 * Add credits to user balance (called from webhook)
 */
export async function addCredits(
  userId: string,
  quantity: number,
  paddleTransactionId: string
): Promise<{ success?: boolean; error?: string }> {
  try {
    const serviceSupabase = createServiceRoleClient();

    // 1. 트랜잭션 기록
    const { error: transactionError } = await serviceSupabase
      .from("credit_transactions")
      .insert({
        user_id: userId,
        transaction_type: "purchase",
        create_credits: quantity,
        publish_credits: quantity,
        paddle_transaction_id: paddleTransactionId,
      });

    if (transactionError) {
      console.error("Credit transaction error:", transactionError);
      return { error: "Failed to record transaction" };
    }

    // 2. 잔액 업데이트 (upsert)
    const { data: existing } = await serviceSupabase
      .from("credit_balance")
      .select("create_credits, publish_credits")
      .eq("user_id", userId)
      .single();

    const newCreateCredits = (existing?.create_credits || 0) + quantity;
    const newPublishCredits = (existing?.publish_credits || 0) + quantity;

    const { error: balanceError } = await serviceSupabase
      .from("credit_balance")
      .upsert(
        {
          user_id: userId,
          create_credits: newCreateCredits,
          publish_credits: newPublishCredits,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id" }
      );

    if (balanceError) {
      console.error("Credit balance error:", balanceError);
      return { error: "Failed to update balance" };
    }

    return { success: true };
  } catch (error) {
    console.error("Add credits error:", error);
    return { error: "An unexpected error occurred" };
  }
}

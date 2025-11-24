"use server";

import { createServerSupabase } from "@/lib/supabase/server";
import { getCreditBalance } from "./credit-actions";

// Types
export interface SubscriptionPlan {
  id: string;
  name: string;
  monthly_document_limit: number;
  active_document_limit: number;
  monthly_price?: number; // USD
  yearly_price?: number; // USD
  features: string[];
  is_active: boolean;
  is_hidden: boolean;
  is_popular?: boolean;
  order: number;
}

export interface Subscription {
  id: string;
  user_id: string;
  plan_id: string;
  status: "trial" | "active" | "cancelled" | "expired";
  starts_at: string;
  ends_at: string | null;
  trial_ends_at: string | null;
  plan: SubscriptionPlan;
}

export interface MonthlyUsage {
  id: string;
  user_id: string;
  year_month: string;
  documents_created: number;
  published_completed_count: number;
}

export interface UsageLimits {
  monthlyCreationLimit: number;
  activeDocumentLimit: number;
  canCreateNew: boolean;
  canPublishMore: boolean;
  currentMonthlyCreated: number;
  currentActiveDocuments: number;
}

/**
 * Get current user's subscription with plan details
 */
export async function getCurrentSubscription(): Promise<{
  subscription: Subscription | null;
  error?: string;
}> {
  try {
    const supabase = await createServerSupabase();

    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return {
        subscription: null,
        error: "User not authenticated",
      };
    }

    // Get user's current subscription with plan details
    // Note: We don't filter by plan.is_active because users may have
    // subscriptions to hidden/inactive plans (e.g., Enterprise)
    // IMPORTANT: Also check ends_at to handle expired subscriptions
    // even if webhook hasn't updated status yet
    const now = new Date().toISOString();
    const { data: subscription, error } = await supabase
      .from("subscriptions")
      .select(
        `
        *,
        plan:subscription_plans!plan_id(*)
      `
      )
      .eq("user_id", user.id)
      .eq("status", "active")
      .or(`ends_at.is.null,ends_at.gt.${now}`)
      .single();

    if (error) {
      // No rows -> user has no active subscription; not an error
      if ((error as any).code === "PGRST116") {
        return { subscription: null };
      }
      console.error("[getCurrentSubscription] Error:", error, "for user:", user.id);
      return {
        subscription: null,
        error: "Failed to get subscription",
      };
    }

    return {
      subscription: subscription as Subscription,
    };
  } catch (error) {
    console.error("Get subscription error:", error);
    return {
      subscription: null,
      error: "An unexpected error occurred",
    };
  }
}

/**
 * Get current month's usage for the user
 */
export async function getCurrentMonthUsage(): Promise<{
  usage: MonthlyUsage | null;
  error?: string;
}> {
  try {
    const supabase = await createServerSupabase();

    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return {
        usage: null,
        error: "User not authenticated",
      };
    }

    const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM format

    // Get or create monthly usage record
    let { data: usage, error } = await supabase
      .from("monthly_usage")
      .select("*")
      .eq("user_id", user.id)
      .eq("year_month", currentMonth)
      .single();

    if (error && error.code === "PGRST116") {
      // Record doesn't exist, create it
      const { data: newUsage, error: createError } = await supabase
        .from("monthly_usage")
        .insert({
          user_id: user.id,
          year_month: currentMonth,
          documents_created: 0,
          published_completed_count: 0,
        })
        .select()
        .single();

      if (createError) {
        console.error("Create usage record error:", createError);
        return {
          usage: null,
          error: "Failed to create usage record",
        };
      }

      usage = newUsage;
    } else if (error) {
      console.error("Get usage error:", error);
      return {
        usage: null,
        error: "Failed to get usage",
      };
    }

    return {
      usage: usage as MonthlyUsage,
    };
  } catch (error) {
    console.error("Get usage error:", error);
    return {
      usage: null,
      error: "An unexpected error occurred",
    };
  }
}

/**
 * Get user's usage limits and current status
 */
export async function getUserUsageLimits(): Promise<{
  limits: UsageLimits | null;
  error?: string;
}> {
  try {
    const [subscriptionResult, usageResult] = await Promise.all([
      getCurrentSubscription(),
      getCurrentMonthUsage(),
    ]);

    if (usageResult.error || !usageResult.usage) {
      return {
        limits: null,
        error: usageResult.error || "Failed to get usage",
      };
    }

    const { subscription } = subscriptionResult;
    const { usage } = usageResult;

    const supabase = await createServerSupabase();

    // If no active subscription, fall back to the lowest (by order) active plan (Free)
    let monthlyLimit: number;
    let activeLimit: number;
    if (!subscription) {
      const { data: fallbackPlans } = await supabase
        .from("subscription_plans")
        .select("monthly_document_limit, active_document_limit")
        .eq("is_active", true)
        .order("order", { ascending: true })
        .limit(1);
      monthlyLimit = fallbackPlans?.[0]?.monthly_document_limit ?? 0;
      activeLimit = fallbackPlans?.[0]?.active_document_limit ?? 0;
    } else {
      monthlyLimit = subscription.plan.monthly_document_limit;
      activeLimit = subscription.plan.active_document_limit;
    }

    const limits: UsageLimits = {
      monthlyCreationLimit: monthlyLimit,
      activeDocumentLimit: activeLimit,
      canCreateNew:
        monthlyLimit === -1 || usage.documents_created < monthlyLimit,
      canPublishMore:
        activeLimit === -1 || usage.published_completed_count < activeLimit,
      currentMonthlyCreated: usage.documents_created,
      currentActiveDocuments: usage.published_completed_count,
    };

    return {
      limits,
    };
  } catch (error) {
    console.error("Get usage limits error:", error);
    return {
      limits: null,
      error: "An unexpected error occurred",
    };
  }
}

/**
 * Check if user can create a new document
 */
export async function canCreateDocument(): Promise<{
  canCreate: boolean;
  usingCredit?: boolean;
  reason?: string;
  error?: string;
}> {
  try {
    const { limits, error } = await getUserUsageLimits();

    if (error || !limits) {
      return {
        canCreate: false,
        error: error || "Failed to check limits",
      };
    }

    // Check monthly limit first
    if (limits.canCreateNew) {
      return { canCreate: true, usingCredit: false };
    }

    // If monthly limit reached, check credits
    const { credits, error: creditsError } = await getCreditBalance();
    if (creditsError) {
      return { canCreate: false, error: creditsError };
    }

    if (credits && credits.create_credits > 0) {
      return { canCreate: true, usingCredit: true };
    }

    return {
      canCreate: false,
      reason: "월 문서 생성 한도 및 크레딧 모두 소진",
    };
  } catch (error) {
    console.error("Can create document error:", error);
    return {
      canCreate: false,
      error: "An unexpected error occurred",
    };
  }
}

/**
 * Check if user can publish a document
 */
export async function canPublishDocument(): Promise<{
  canPublish: boolean;
  reason?: string;
  error?: string;
}> {
  try {
    const { limits, error } = await getUserUsageLimits();

    if (error || !limits) {
      return {
        canPublish: false,
        error: error || "Failed to check limits",
      };
    }

    if (!limits.canPublishMore) {
      return {
        canPublish: false,
        reason: `활성 문서 제한에 도달했습니다. (${limits.currentActiveDocuments}/${limits.activeDocumentLimit}) 일부 문서를 삭제하거나 업그레이드하세요.`,
      };
    }

    return {
      canPublish: true,
    };
  } catch (error) {
    console.error("Can publish document error:", error);
    return {
      canPublish: false,
      error: "An unexpected error occurred",
    };
  }
}

/**
 * Check if user can create a new publication
 * A publication contains documents that will be published, so this checks
 * if the user has room for more active documents
 */
export async function canCreatePublication(documentCount: number = 1): Promise<{
  canCreate: boolean;
  reason?: string;
  error?: string;
}> {
  try {
    const { limits, error } = await getUserUsageLimits();

    if (error || !limits) {
      return {
        canCreate: false,
        error: error || "Failed to check limits",
      };
    }

    // Calculate total available (monthly + credits)
    const { credits, error: creditsError } = await getCreditBalance();
    if (creditsError) {
      return { canCreate: false, error: creditsError };
    }

    const monthlyRemaining =
      limits.activeDocumentLimit === -1
        ? Infinity
        : limits.activeDocumentLimit - limits.currentActiveDocuments;

    const totalAvailable =
      monthlyRemaining === Infinity
        ? Infinity
        : monthlyRemaining + (credits?.publish_credits || 0);

    if (totalAvailable >= documentCount) {
      return { canCreate: true };
    }

    return {
      canCreate: false,
      reason: `${documentCount}개 발행 불가 (사용 가능: ${totalAvailable}개)`,
    };
  } catch (error) {
    console.error("Can create publication error:", error);
    return {
      canCreate: false,
      error: "An unexpected error occurred",
    };
  }
}

/**
 * Update monthly usage when a document is created
 */
export async function incrementDocumentCreated(): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const supabase = await createServerSupabase();

    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return {
        success: false,
        error: "User not authenticated",
      };
    }

    const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM format

    // Use RPC function to properly increment or create the record
    const { error } = await supabase.rpc("increment_documents_created", {
      target_user_id: user.id,
      target_year_month: currentMonth,
    });

    if (error) {
      console.error("Increment document created error:", error);
      return {
        success: false,
        error: "Failed to update usage",
      };
    }

    return {
      success: true,
    };
  } catch (error) {
    console.error("Increment document created error:", error);
    return {
      success: false,
      error: "An unexpected error occurred",
    };
  }
}

/**
 * Decrement monthly document created count when deleting a document
 */
export async function decrementDocumentCreated(): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const supabase = await createServerSupabase();

    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return {
        success: false,
        error: "User not authenticated",
      };
    }

    const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM format

    // Use RPC function to decrement the count (won't go below 0)
    const { error } = await supabase.rpc("decrement_documents_created", {
      target_user_id: user.id,
      target_year_month: currentMonth,
    });

    if (error) {
      console.error("Decrement document created error:", error);
      return {
        success: false,
        error: "Failed to update usage",
      };
    }

    return {
      success: true,
    };
  } catch (error) {
    console.error("Decrement document created error:", error);
    return {
      success: false,
      error: "An unexpected error occurred",
    };
  }
}

/**
 * Update monthly published/completed count when a document is published or completed
 */
export async function incrementPublishedCompleted(count: number = 1): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const supabase = await createServerSupabase();

    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return {
        success: false,
        error: "User not authenticated",
      };
    }

    const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM format

    // Get or create usage record
    let { data: usage, error: getError } = await supabase
      .from("monthly_usage")
      .select("*")
      .eq("user_id", user.id)
      .eq("year_month", currentMonth)
      .single();

    if (getError && getError.code === "PGRST116") {
      // Record doesn't exist, create it
      const { data: newUsage, error: createError } = await supabase
        .from("monthly_usage")
        .insert({
          user_id: user.id,
          year_month: currentMonth,
          documents_created: 0,
          published_completed_count: count,
        })
        .select()
        .single();

      if (createError) {
        console.error("Create usage record error:", createError);
        return {
          success: false,
          error: "Failed to create usage record",
        };
      }
      return { success: true };
    } else if (getError) {
      console.error("Get usage error:", getError);
      return {
        success: false,
        error: "Failed to get usage",
      };
    }

    // Update existing record
    const { error: updateError } = await supabase
      .from("monthly_usage")
      .update({
        published_completed_count: (usage?.published_completed_count || 0) + count,
      })
      .eq("user_id", user.id)
      .eq("year_month", currentMonth);

    if (updateError) {
      console.error("Increment published completed error:", updateError);
      return {
        success: false,
        error: "Failed to update usage",
      };
    }

    return {
      success: true,
    };
  } catch (error) {
    console.error("Increment published completed error:", error);
    return {
      success: false,
      error: "An unexpected error occurred",
    };
  }
}

/**
 * Decrement monthly published/completed count when deleting a published/completed document
 */
export async function decrementPublishedCompleted(count: number = 1): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const supabase = await createServerSupabase();

    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return {
        success: false,
        error: "User not authenticated",
      };
    }

    const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM format

    // Get or create usage record first
    let { data: usage, error: getError } = await supabase
      .from("monthly_usage")
      .select("*")
      .eq("user_id", user.id)
      .eq("year_month", currentMonth)
      .single();

    if (getError && getError.code === "PGRST116") {
      // Record doesn't exist, create it with 0 count (nothing to decrement)
      return { success: true };
    } else if (getError) {
      console.error("Get usage error:", getError);
      return {
        success: false,
        error: "Failed to get usage",
      };
    }

    // Only decrement if count is greater than 0
    if (usage && usage.published_completed_count > 0) {
      const newCount = Math.max(0, usage.published_completed_count - count);
      const { error: updateError } = await supabase
        .from("monthly_usage")
        .update({
          published_completed_count: newCount,
        })
        .eq("user_id", user.id)
        .eq("year_month", currentMonth);

      if (updateError) {
        console.error("Decrement published completed error:", updateError);
        return {
          success: false,
          error: "Failed to update usage",
        };
      }
    }

    return {
      success: true,
    };
  } catch (error) {
    console.error("Decrement published completed error:", error);
    return {
      success: false,
      error: "An unexpected error occurred",
    };
  }
}

/**
 * Get all available subscription plans
 */
export async function getSubscriptionPlans(): Promise<{
  plans: SubscriptionPlan[];
  error?: string;
}> {
  try {
    const supabase = await createServerSupabase();

    const { data: plans, error } = await supabase
      .from("subscription_plans")
      .select("*")
      .eq("is_active", true)
      .eq("is_hidden", false)
      .order("order", { ascending: true });

    if (error) {
      console.error("Get subscription plans error:", error);
      return {
        plans: [],
        error: "Failed to get subscription plans",
      };
    }

    return {
      plans: plans as SubscriptionPlan[],
    };
  } catch (error) {
    console.error("Get subscription plans error:", error);
    return {
      plans: [],
      error: "An unexpected error occurred",
    };
  }
}

/**
 * Get the Basic (free) plan details as fallback
 * Used when user has no active subscription
 */
export async function getBasicPlan(): Promise<{
  plan: Pick<SubscriptionPlan, 'monthly_document_limit' | 'active_document_limit'> | null;
  error?: string;
}> {
  try {
    const supabase = await createServerSupabase();

    // Get the lowest order active plan (Basic/Free)
    const { data: fallbackPlans, error } = await supabase
      .from("subscription_plans")
      .select("monthly_document_limit, active_document_limit")
      .eq("is_active", true)
      .order("order", { ascending: true })
      .limit(1);

    if (error) {
      console.error("Get basic plan error:", error);
      return {
        plan: null,
        error: "Failed to get basic plan",
      };
    }

    if (!fallbackPlans || fallbackPlans.length === 0) {
      return {
        plan: null,
        error: "No active plans found",
      };
    }

    return {
      plan: fallbackPlans[0],
    };
  } catch (error) {
    console.error("Get basic plan error:", error);
    return {
      plan: null,
      error: "An unexpected error occurred",
    };
  }
}

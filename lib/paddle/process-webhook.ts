import {
  CustomerCreatedEvent,
  CustomerUpdatedEvent,
  EventEntity,
  EventName,
  SubscriptionCreatedEvent,
  SubscriptionUpdatedEvent,
  TransactionCompletedEvent,
} from "@paddle/paddle-node-sdk";
import { createServiceSupabase } from "@/lib/supabase/server";
import { PADDLE_PRICE_TIERS } from "./pricing-config";

/**
 * Paddle Webhook Processing Architecture
 *
 * Event Flow & Responsibilities:
 *
 * 1. subscription.created/updated
 *    - Creates/updates subscription record with paddle_customer_id
 *    - Does NOT require customer or user linking at this stage
 *    - Links to user only if customer data already exists
 *
 * 2. transaction.completed (PRIMARY LINKING MECHANISM)
 *    - Main event that connects customer → user → subscription
 *    - Looks up customer by customerId
 *    - Finds user by email from customer record
 *    - Links all unlinked subscriptions to the user
 *    - Updates users.current_subscription_id
 *
 * 3. customer.created/updated (SUPPLEMENTARY)
 *    - Creates/updates customer records with email
 *    - May not fire for existing customers
 *    - Provides fallback linking but NOT relied upon for primary flow
 *
 * Key Design Decisions:
 * - transaction.completed is guaranteed to fire after successful payment
 * - customer.created may not fire for existing customers (Paddle behavior)
 * - Removed dependency on customer.created for critical linking logic
 * - All database operations use service role to bypass RLS
 */
export class ProcessWebhook {
  async processEvent(eventData: EventEntity) {
    console.log(`Processing Paddle webhook event: ${eventData.eventType}`);

    switch (eventData.eventType) {
      case EventName.SubscriptionCreated:
      case EventName.SubscriptionUpdated:
        await this.updateSubscriptionData(eventData);
        break;
      case EventName.CustomerCreated:
      case EventName.CustomerUpdated:
        await this.updateCustomerData(eventData);
        break;
      case EventName.TransactionCompleted:
        await this.handleTransactionCompleted(eventData);
        break;
      default:
        console.log(`Unhandled event type: ${eventData.eventType}`);
    }
  }

  private async updateSubscriptionData(
    eventData: SubscriptionCreatedEvent | SubscriptionUpdatedEvent
  ) {
    const supabase = createServiceSupabase();

    try {
      // customer_id로 customers 테이블에서 user_id 조회 (있을 수도, 없을 수도 있음)
      const { data: customerData } = await supabase
        .from("customers")
        .select("user_id")
        .eq("customer_id", eventData.data.customerId)
        .single();

      console.log(`Processing subscription for customer ${eventData.data.customerId}, user_id: ${customerData?.user_id || 'not linked yet'}`);
      // customer가 없거나 user_id가 없어도 계속 진행 - transaction.completed에서 연결됨

      // 2. Paddle Price ID로부터 플랜 결정
      const priceId = eventData.data.items[0].price?.id;
      const planName = this.determinePlanFromPriceId(priceId);

      // 3. subscription_plans 테이블에서 plan_id 조회
      const { data: planData, error: planError } = await supabase
        .from("subscription_plans")
        .select("id")
        .eq("name", planName)
        .eq("is_active", true)
        .single();

      if (planError || !planData) {
        console.error(`Failed to find plan for name: ${planName}`, planError);
        return;
      }

      // 4. 기존 subscriptions 테이블에 Paddle 구독 정보 upsert
      const subscriptionStatus = this.mapPaddleStatus(eventData.data.status);

      // paddle_subscription_id로 기존 구독 찾기
      const { data: existingSubscription } = await supabase
        .from("subscriptions")
        .select("id, user_id")
        .eq("paddle_subscription_id", eventData.data.id)
        .single();

      let subscriptionId: string;

      if (existingSubscription) {
        // 기존 Paddle 구독 업데이트
        const { data: updatedSub, error: updateError } = await supabase
          .from("subscriptions")
          .update({
            plan_id: planData.id,
            status: subscriptionStatus,
            paddle_customer_id: eventData.data.customerId,
            paddle_price_id: priceId,
            payment_provider: "paddle",
            updated_at: new Date().toISOString(),
          })
          .eq("id", existingSubscription.id)
          .select("id")
          .single();

        if (updateError) {
          console.error("Failed to update subscription:", updateError);
          throw updateError;
        }

        subscriptionId = updatedSub!.id;
        console.log(`Updated Paddle subscription: ${subscriptionId}`);
      } else {
        // 새로운 Paddle 구독 생성
        // user_id가 있으면 기존 활성 구독 비활성화
        if (customerData.user_id) {
          await supabase
            .from("subscriptions")
            .update({ status: "canceled", updated_at: new Date().toISOString() })
            .eq("user_id", customerData.user_id)
            .eq("status", "active");
        }

        const { data: newSub, error: insertError } = await supabase
          .from("subscriptions")
          .insert({
            user_id: customerData.user_id || null,
            plan_id: planData.id,
            status: subscriptionStatus,
            paddle_subscription_id: eventData.data.id,
            paddle_customer_id: eventData.data.customerId,
            paddle_price_id: priceId,
            payment_provider: "paddle",
            starts_at: new Date().toISOString(),
          })
          .select("id")
          .single();

        if (insertError) {
          console.error("Failed to create subscription:", insertError);
          throw insertError;
        }

        subscriptionId = newSub!.id;
        console.log(`Created new Paddle subscription: ${subscriptionId}`);
      }

      // 5. users.current_subscription_id 업데이트 (user_id가 있을 때만)
      if (customerData?.user_id) {
        const { error: userUpdateError } = await supabase
          .from("users")
          .update({ current_subscription_id: subscriptionId })
          .eq("id", customerData.user_id);

        if (userUpdateError) {
          console.error(
            "Failed to update user's current_subscription_id:",
            userUpdateError
          );
        }

        console.log(
          `Updated user ${customerData.user_id} subscription to ${planName} (${subscriptionStatus})`
        );
      } else {
        console.log(
          `Created subscription ${subscriptionId} for ${planName} (${subscriptionStatus}) - waiting for transaction.completed to link to user`
        );
      }
    } catch (error) {
      console.error("Error processing subscription webhook:", error);
      throw error;
    }
  }

  /**
   * Handle customer.created/updated events
   * Note: This creates/updates customer records but is NOT the primary linking mechanism.
   * transaction.completed is the main event that links customers/subscriptions to users.
   * This event may not fire for existing customers, so don't depend on it for critical flow.
   */
  private async updateCustomerData(
    eventData: CustomerCreatedEvent | CustomerUpdatedEvent
  ) {
    const supabase = createServiceSupabase();

    try {
      console.log(`[customer.${eventData.eventType.includes('created') ? 'created' : 'updated'}] Processing customer ${eventData.data.id} with email ${eventData.data.email}`);

      // 이메일로 사용자 찾기 (Supabase Auth Admin API 사용)
      const {
        data: { users },
        error: userError,
      } = await supabase.auth.admin.listUsers();
      const user = users?.find((u) => u.email === eventData.data.email);

      const { error } = await supabase
        .from("customers")
        .upsert({
          customer_id: eventData.data.id,
          email: eventData.data.email,
          user_id: user?.id ?? null,
        })
        .select();

      if (error) {
        console.error("[customer] Failed to upsert customer:", error);
        throw error;
      }

      console.log(`[customer] Upserted customer: ${eventData.data.id} with email ${eventData.data.email}, user: ${user?.id || 'not found'}`);

      // user_id가 있으면, 이 customer의 subscription을 찾아서 user_id 연결 (보조적 역할)
      if (user?.id) {
        // paddle_customer_id로 정확하게 이 customer의 subscription 찾기
        const { data: subscriptions } = await supabase
          .from("subscriptions")
          .select("id, paddle_subscription_id, status")
          .eq("paddle_customer_id", eventData.data.id)
          .is("user_id", null);

        if (subscriptions && subscriptions.length > 0) {
          console.log(`[customer] Found ${subscriptions.length} unlinked subscription(s) for customer ${eventData.data.id} - linking to user ${user.id}`);

          for (const sub of subscriptions) {
            // subscription의 user_id 업데이트
            const { error: subUpdateError } = await supabase
              .from("subscriptions")
              .update({ user_id: user.id, updated_at: new Date().toISOString() })
              .eq("id", sub.id);

            if (subUpdateError) {
              console.error(`[customer] Failed to link subscription ${sub.id}:`, subUpdateError);
              continue;
            }

            // users 테이블의 current_subscription_id 업데이트 (active인 경우만)
            if (sub.status === 'active' && sub === subscriptions[0]) {
              await supabase
                .from("users")
                .update({ current_subscription_id: sub.id })
                .eq("id", user.id);
            }

            console.log(`[customer] Linked subscription ${sub.id} (${sub.paddle_subscription_id}) to user ${user.id}`);
          }
        }
      }
    } catch (error) {
      console.error("[customer] Error processing webhook:", error);
      throw error;
    }
  }

  /**
   * Handle transaction.completed event - PRIMARY METHOD for linking customer/user/subscription
   * This is the main event that ties everything together after a successful payment
   */
  private async handleTransactionCompleted(eventData: TransactionCompletedEvent) {
    const supabase = createServiceSupabase();

    try {
      const customerId = eventData.data.customerId;

      if (!customerId) {
        console.log("No customer_id in transaction.completed event");
        return;
      }

      console.log(`[transaction.completed] Processing for customer ${customerId}`);

      // 1. customers 테이블에서 customer 조회
      const { data: customerData, error: customerError } = await supabase
        .from("customers")
        .select("user_id, email")
        .eq("customer_id", customerId)
        .single();

      if (customerError || !customerData) {
        console.log(`[transaction.completed] Customer ${customerId} not found in database - waiting for customer.created event`);
        return;
      }

      console.log(`[transaction.completed] Found customer ${customerId} with email ${customerData.email}, user_id: ${customerData.user_id || 'not linked'}`);

      // 2. user_id가 없으면 이메일로 user 찾아서 업데이트
      if (!customerData.user_id && customerData.email) {
        console.log(`[transaction.completed] Looking up user by email: ${customerData.email}`);

        const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();

        if (listError) {
          console.error(`[transaction.completed] Failed to list users:`, listError);
          return;
        }

        const user = users?.find((u) => u.email === customerData.email);

        if (user) {
          console.log(`[transaction.completed] Found user ${user.id} for email ${customerData.email}`);

          // 2a. customers 테이블에 user_id 업데이트
          const { error: customerUpdateError } = await supabase
            .from("customers")
            .update({ user_id: user.id })
            .eq("customer_id", customerId);

          if (customerUpdateError) {
            console.error(`[transaction.completed] Failed to update customer with user_id:`, customerUpdateError);
            return;
          }

          console.log(`[transaction.completed] Updated customer ${customerId} with user_id ${user.id}`);

          // 2b. 이 customer의 모든 unlinked subscriptions 찾아서 연결
          const { data: subscriptions, error: subsError } = await supabase
            .from("subscriptions")
            .select("id, paddle_subscription_id, status")
            .eq("paddle_customer_id", customerId)
            .is("user_id", null);

          if (subsError) {
            console.error(`[transaction.completed] Failed to fetch subscriptions:`, subsError);
            return;
          }

          if (subscriptions && subscriptions.length > 0) {
            console.log(`[transaction.completed] Found ${subscriptions.length} unlinked subscription(s) for customer ${customerId}`);

            for (const sub of subscriptions) {
              // subscription에 user_id 연결
              const { error: subUpdateError } = await supabase
                .from("subscriptions")
                .update({ user_id: user.id, updated_at: new Date().toISOString() })
                .eq("id", sub.id);

              if (subUpdateError) {
                console.error(`[transaction.completed] Failed to link subscription ${sub.id}:`, subUpdateError);
                continue;
              }

              // 가장 최근 active subscription만 users 테이블에 업데이트
              if (sub.status === 'active' && sub === subscriptions[0]) {
                const { error: userUpdateError } = await supabase
                  .from("users")
                  .update({ current_subscription_id: sub.id })
                  .eq("id", user.id);

                if (userUpdateError) {
                  console.error(`[transaction.completed] Failed to update user's current_subscription_id:`, userUpdateError);
                }
              }

              console.log(`[transaction.completed] Successfully linked subscription ${sub.id} (${sub.paddle_subscription_id}) to user ${user.id}`);
            }

            console.log(`[transaction.completed] ✅ Successfully linked all subscriptions for customer ${customerId} to user ${user.id}`);
          } else {
            console.log(`[transaction.completed] No unlinked subscriptions found for customer ${customerId}`);
          }
        } else {
          console.warn(`[transaction.completed] No user found with email ${customerData.email} - user might not be registered yet`);
        }
      } else if (customerData.user_id) {
        console.log(`[transaction.completed] Customer ${customerId} already linked to user ${customerData.user_id} - checking for unlinked subscriptions`);

        // customer는 이미 linked되어 있지만 subscription이 아직 linked 안 되어있을 수 있음
        const { data: subscriptions } = await supabase
          .from("subscriptions")
          .select("id, paddle_subscription_id, status")
          .eq("paddle_customer_id", customerId)
          .is("user_id", null);

        if (subscriptions && subscriptions.length > 0) {
          console.log(`[transaction.completed] Found ${subscriptions.length} unlinked subscription(s) - linking now`);

          for (const sub of subscriptions) {
            await supabase
              .from("subscriptions")
              .update({ user_id: customerData.user_id, updated_at: new Date().toISOString() })
              .eq("id", sub.id);

            if (sub.status === 'active' && sub === subscriptions[0]) {
              await supabase
                .from("users")
                .update({ current_subscription_id: sub.id })
                .eq("id", customerData.user_id);
            }

            console.log(`[transaction.completed] Linked subscription ${sub.id} to existing user ${customerData.user_id}`);
          }
        }
      }
    } catch (error) {
      console.error("[transaction.completed] Error processing webhook:", error);
    }
  }

  /**
   * Paddle Price ID로부터 플랜 이름 결정
   * pricing-config.ts의 PADDLE_PRICE_TIERS를 단일 소스로 사용
   */
  private determinePlanFromPriceId(priceId: string | undefined): string {
    if (!priceId) return "Free";

    // PADDLE_PRICE_TIERS를 순회하며 매칭
    for (const tier of PADDLE_PRICE_TIERS) {
      if (tier.priceId.month === priceId || tier.priceId.year === priceId) {
        return tier.name;
      }
    }

    // 매칭 실패 시 기본값
    return "Free";
  }

  /**
   * Paddle 구독 상태를 SeukSeuk 상태로 매핑
   */
  private mapPaddleStatus(paddleStatus: string): string {
    switch (paddleStatus) {
      case "active":
        return "active";
      case "canceled":
      case "past_due":
        return "canceled";
      case "paused":
        return "canceled"; // SeukSeuk에 paused 상태가 없다면 canceled로 처리
      case "trialing":
        return "active"; // 트라이얼 기간도 active로 처리
      default:
        return "canceled";
    }
  }
}

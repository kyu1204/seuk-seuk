import {
  CustomerCreatedEvent,
  CustomerUpdatedEvent,
  EventEntity,
  EventName,
  SubscriptionCanceledEvent,
  SubscriptionCreatedEvent,
  SubscriptionUpdatedEvent,
  TransactionCompletedEvent,
} from "@paddle/paddle-node-sdk";
import { createServiceSupabase } from "@/lib/supabase/server";
import { PADDLE_PRICE_TIERS } from "./pricing-config";
import { getPaddleInstance } from "./get-paddle-instance";

// Custom data type for credit purchases
interface CreditPurchaseCustomData {
  type: "credit";
  quantity: string;
}

export class ProcessWebhook {
  async processEvent(eventData: EventEntity) {

    switch (eventData.eventType) {
      case EventName.SubscriptionCreated:
      case EventName.SubscriptionUpdated:
      case EventName.SubscriptionCanceled:
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
    }
  }

  private async updateSubscriptionData(
    eventData: SubscriptionCreatedEvent | SubscriptionUpdatedEvent | SubscriptionCanceledEvent
  ) {
    const supabase = createServiceSupabase();

    try {
      const eventType = eventData.eventType.includes("created")
        ? "created"
        : eventData.eventType.includes("canceled")
        ? "canceled"
        : "updated";


      // customer_id로 customers 테이블에서 user_id 조회 (없을 수도 있음 - customer.created가 먼저 와야 함)
      const { data: customerData } = await supabase
        .from("customers")
        .select("user_id")
        .eq("customer_id", eventData.data.customerId)
        .single();


      // IMPORTANT: customer가 없어도 계속 진행
      // customer.created 이벤트가 나중에 와서 customer를 생성하고 subscription을 연결할 것임
      // transaction.completed에서 최종 연결이 이루어짐

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

      // Log detailed subscription data for debugging

      // Calculate ends_at from scheduled_change or next_billed_at
      // Webhook payloads arrive snake_case; the SDK types only declare camelCase.
      const raw = eventData.data as typeof eventData.data & {
        scheduled_change?: { action?: string; effective_at?: string | null } | null;
        next_billed_at?: string | null;
      };
      let endsAt: string | null = null;
      let finalStatus = this.mapPaddleStatus(eventData.data.status);
      
      // Priority 1: If subscription has scheduled cancellation, use effective_at
      if (raw.scheduled_change?.action === 'cancel') {
        endsAt = raw.scheduled_change.effective_at || null;

        // Check if subscription has already expired
        if (endsAt && new Date(endsAt) < new Date()) {
          finalStatus = 'expired';
        }
      }
      // Priority 2: Use next_billed_at for active recurring subscriptions
      else if (raw.next_billed_at) {
        endsAt = raw.next_billed_at;
      }
      // Priority 3: Fallback to current billing period end date
      else if (eventData.data.currentBillingPeriod?.endsAt) {
        endsAt = eventData.data.currentBillingPeriod.endsAt;
      }

      // If still no ends_at and status is canceled, log warning
      if (!endsAt && (eventData.data.status === 'canceled' || finalStatus === 'canceled')) {
        console.warn(`[subscription] ⚠️ Canceled subscription has no ends_at date - Paddle data may be incomplete`);
      }

      let subscriptionId: string;

      // user_id가 있으면 기존 subscription 레코드를 업데이트, 없으면 새로 생성
      if (customerData?.user_id) {

        // 이 user의 기존 subscription 찾기 (plan_id 포함)
        const { data: existingUserSub } = await supabase
          .from("subscriptions")
          .select("id, plan_id")
          .eq("user_id", customerData.user_id)
          .single();

        if (existingUserSub) {
          // 기존 subscription 업데이트 (Free → Pro 등)

          // Check if this is a plan upgrade by comparing old and new plan_id
          const isUpgrade = existingUserSub.plan_id !== planData.id;
          
          if (isUpgrade) {
            // Fetch old plan details to verify it's an upgrade (not downgrade)
            const { data: oldPlan } = await supabase
              .from("subscription_plans")
              .select("name, monthly_document_limit, active_document_limit")
              .eq("id", existingUserSub.plan_id)
              .single();

            const { data: newPlan } = await supabase
              .from("subscription_plans")
              .select("name, monthly_document_limit, active_document_limit")
              .eq("id", planData.id)
              .single();


            // Reset monthly usage if upgrading to a higher tier (higher limits)
            if (oldPlan && newPlan && 
                (newPlan.monthly_document_limit > oldPlan.monthly_document_limit ||
                 newPlan.active_document_limit > oldPlan.active_document_limit)) {
              

              const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM format
              
              const { error: resetError } = await supabase
                .from("monthly_usage")
                .update({
                  documents_created: 0,
                  published_completed_count: 0
                })
                .eq("user_id", customerData.user_id)
                .eq("year_month", currentMonth);

              if (resetError) {
                console.error("[subscription] Failed to reset monthly usage:", resetError);
              } else {
              }
            }
          }

          const { data: updatedSub, error: updateError } = await supabase
            .from("subscriptions")
            .update({
              plan_id: planData.id,
              status: finalStatus,
              paddle_subscription_id: eventData.data.id,
              paddle_customer_id: eventData.data.customerId,
              paddle_price_id: priceId,
              payment_provider: "paddle",
              ends_at: endsAt,
              updated_at: new Date().toISOString(),
            })
            .eq("id", existingUserSub.id)
            .select("id")
            .single();

          if (updateError) {
            console.error("[subscription] Failed to update subscription:", updateError);
            throw updateError;
          }

          subscriptionId = updatedSub!.id;
        } else {
          // user는 있지만 subscription이 없는 경우 (정상적이지 않은 상황)

          const { data: newSub, error: insertError } = await supabase
            .from("subscriptions")
            .insert({
              user_id: customerData.user_id,
              plan_id: planData.id,
              status: finalStatus,
              paddle_subscription_id: eventData.data.id,
              paddle_customer_id: eventData.data.customerId,
              paddle_price_id: priceId,
              payment_provider: "paddle",
              starts_at: new Date().toISOString(),
              ends_at: endsAt,
            })
            .select("id")
            .single();

          if (insertError) {
            console.error("[subscription] Failed to create subscription:", insertError);
            throw insertError;
          }

          subscriptionId = newSub!.id;
        }
      } else {
        // user_id가 없으면 일단 subscription만 생성 (transaction.completed에서 연결됨)

        const { data: newSub, error: insertError } = await supabase
          .from("subscriptions")
          .insert({
            user_id: null,
            plan_id: planData.id,
            status: finalStatus,
            paddle_subscription_id: eventData.data.id,
            paddle_customer_id: eventData.data.customerId,
            paddle_price_id: priceId,
            payment_provider: "paddle",
            starts_at: new Date().toISOString(),
            ends_at: endsAt,
          })
          .select("id")
          .single();

        if (insertError) {
          console.error("[subscription] Failed to create subscription:", insertError);
          throw insertError;
        }

        subscriptionId = newSub!.id;
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

      } else {
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


      // user_id가 있으면, 이 customer의 subscription을 찾아서 user_id 연결 (보조적 역할)
      if (user?.id) {
        // paddle_customer_id로 정확하게 이 customer의 subscription 찾기
        const { data: subscriptions } = await supabase
          .from("subscriptions")
          .select("id, paddle_subscription_id, status")
          .eq("paddle_customer_id", eventData.data.id)
          .is("user_id", null);

        if (subscriptions && subscriptions.length > 0) {

          for (const sub of subscriptions) {
            // subscription의 user_id 업데이트
            const { error: subUpdateError } = await supabase
              .from("subscriptions")
              .update({
                user_id: user.id,
                updated_at: new Date().toISOString(),
              })
              .eq("id", sub.id);

            if (subUpdateError) {
              console.error(
                `[customer] Failed to link subscription ${sub.id}:`,
                subUpdateError
              );
              continue;
            }

            // users 테이블의 current_subscription_id 업데이트 (active인 경우만)
            if (sub.status === "active" && sub === subscriptions[0]) {
              await supabase
                .from("users")
                .update({ current_subscription_id: sub.id })
                .eq("id", user.id);
            }

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
  private async handleTransactionCompleted(
    eventData: TransactionCompletedEvent
  ) {
    const supabase = createServiceSupabase();

    try {
      // Check if this is a credit purchase transaction
      const customData = eventData.data.customData as CreditPurchaseCustomData | undefined;

      if (customData?.type === "credit") {
        await this.handleCreditPurchase(eventData, customData);
        return;
      }

      const customerId = eventData.data.customerId;

      if (!customerId) {
        return;
      }


      // 1. Paddle API로 customer 정보 가져오기 (실제 이메일 포함)
      const paddle = getPaddleInstance();
      let customerEmail: string | null = null;

      try {
        const paddleCustomer = await paddle.customers.get(customerId);
        customerEmail = paddleCustomer.email;
      } catch (apiError) {
        console.error(
          `[transaction.completed] Failed to fetch customer from Paddle API:`,
          apiError
        );
        // Paddle API 실패 시 fallback: DB에서 가져오기
        const { data: dbCustomer } = await supabase
          .from("customers")
          .select("email")
          .eq("customer_id", customerId)
          .single();

        if (dbCustomer?.email && !dbCustomer.email.includes("placeholder")) {
          customerEmail = dbCustomer.email;
        } else {
          return;
        }
      }

      if (!customerEmail) {
        return;
      }

      // 2. customers 테이블에서 customer 조회 또는 생성
      let { data: customerData, error: customerError } = await supabase
        .from("customers")
        .select("user_id")
        .eq("customer_id", customerId)
        .single();

      if (customerError || !customerData) {

        // customer 레코드 생성 (실제 이메일 사용)
        const { data: newCustomer, error: insertError } = await supabase
          .from("customers")
          .insert({
            customer_id: customerId,
            email: customerEmail,
            user_id: null,
          })
          .select("user_id")
          .single();

        if (insertError) {
          console.error(
            `[transaction.completed] Failed to create customer:`,
            insertError
          );
          return;
        }

        customerData = newCustomer;
      }

      // 3. user_id가 없으면 이메일로 user 찾아서 업데이트
      if (!customerData.user_id) {

        const {
          data: { users },
          error: listError,
        } = await supabase.auth.admin.listUsers();

        if (listError) {
          console.error(
            `[transaction.completed] Failed to list users:`,
            listError
          );
          return;
        }

        const user = users?.find((u) => u.email === customerEmail);

        if (user) {

          // 2a. customers 테이블에 user_id 업데이트
          const { error: customerUpdateError } = await supabase
            .from("customers")
            .update({ user_id: user.id })
            .eq("customer_id", customerId);

          if (customerUpdateError) {
            console.error(
              `[transaction.completed] Failed to update customer with user_id:`,
              customerUpdateError
            );
            return;
          }


          // 2b. 이 customer의 모든 unlinked subscriptions 찾아서 연결
          const { data: subscriptions, error: subsError } = await supabase
            .from("subscriptions")
            .select("id, paddle_subscription_id, status")
            .eq("paddle_customer_id", customerId)
            .is("user_id", null);

          if (subsError) {
            console.error(
              `[transaction.completed] Failed to fetch subscriptions:`,
              subsError
            );
            return;
          }

          if (subscriptions && subscriptions.length > 0) {

            for (const sub of subscriptions) {
              // subscription에 user_id 연결
              const { error: subUpdateError } = await supabase
                .from("subscriptions")
                .update({
                  user_id: user.id,
                  updated_at: new Date().toISOString(),
                })
                .eq("id", sub.id);

              if (subUpdateError) {
                console.error(
                  `[transaction.completed] Failed to link subscription ${sub.id}:`,
                  subUpdateError
                );
                continue;
              }

              // 가장 최근 active subscription만 users 테이블에 업데이트
              if (sub.status === "active" && sub === subscriptions[0]) {
                const { error: userUpdateError } = await supabase
                  .from("users")
                  .update({ current_subscription_id: sub.id })
                  .eq("id", user.id);

                if (userUpdateError) {
                  console.error(
                    `[transaction.completed] Failed to update user's current_subscription_id:`,
                    userUpdateError
                  );
                }
              }

            }


            // Check if this transaction includes a free trial and record usage
            const priceId = eventData.data.items[0]?.price?.id;
            if (priceId && this.isPriceWithTrial(priceId)) {
              await this.recordTrialUsage(customerId);
            }

            // Send payment notification
            await this.sendPaymentNotification(subscriptions[0].id, supabase);
          } else {
          }
        } else {
          console.warn(
            `[transaction.completed] No user found with email ${customerEmail} - user might not be registered yet`
          );
        }
      } else if (customerData.user_id) {

        // customer는 이미 linked되어 있지만 subscription이 아직 linked 안 되어있을 수 있음
        const { data: subscriptions } = await supabase
          .from("subscriptions")
          .select("id, paddle_subscription_id, status")
          .eq("paddle_customer_id", customerId)
          .is("user_id", null);

        if (subscriptions && subscriptions.length > 0) {

          for (const sub of subscriptions) {
            await supabase
              .from("subscriptions")
              .update({
                user_id: customerData.user_id,
                updated_at: new Date().toISOString(),
              })
              .eq("id", sub.id);

            if (sub.status === "active" && sub === subscriptions[0]) {
              await supabase
                .from("users")
                .update({ current_subscription_id: sub.id })
                .eq("id", customerData.user_id);
            }

          }

          // Send payment notification for the first active subscription
          if (subscriptions.length > 0) {
            await this.sendPaymentNotification(subscriptions[0].id, supabase);
          }
        } else {
        }

        // IMPORTANT: Check for free trial REGARDLESS of whether subscription was just linked or already linked
        // This handles the case where subscription.created came before transaction.completed
        const priceId = eventData.data.items[0]?.price?.id;
        if (priceId && this.isPriceWithTrial(priceId)) {
          await this.recordTrialUsage(customerId);
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
    if (!priceId) return "Basic";

    // PADDLE_PRICE_TIERS를 순회하며 매칭
    for (const tier of PADDLE_PRICE_TIERS) {
      if (
        tier.priceId.month === priceId ||
        tier.priceId.year === priceId ||
        tier.priceId.monthNoTrial === priceId ||
        tier.priceId.yearNoTrial === priceId
      ) {
        return tier.name;
      }
    }

    // 매칭 실패 시 기본값
    return "Basic";
  }

  /**
   * 주어진 priceId가 무료체험이 포함된 가격인지 확인
   * (무료체험 없는 버전이 존재하는 경우 = 무료체험 제공 플랜)
   */
  private isPriceWithTrial(priceId: string | undefined): boolean {
    if (!priceId) return false;

    for (const tier of PADDLE_PRICE_TIERS) {
      // trial 버전 priceId인지 확인 (noTrial이 아닌 원본)
      if (tier.priceId.month === priceId || tier.priceId.year === priceId) {
        // 이 tier가 noTrial 버전을 가지고 있다면 = trial 제공 플랜
        return !!(tier.priceId.monthNoTrial || tier.priceId.yearNoTrial);
      }
    }

    return false;
  }

  /**
   * customers 테이블에 무료체험 사용 이력 기록
   * 최초 1회만 기록 (first_trial_date가 이미 있으면 무시)
   */
  private async recordTrialUsage(customerId: string) {
    const supabase = createServiceSupabase();

    try {
      const { error } = await supabase
        .from("customers")
        .update({
          has_used_free_trial: true,
          first_trial_date: new Date().toISOString(),
        })
        .eq("customer_id", customerId)
        .is("first_trial_date", null); // 최초 1회만 기록

      if (error) {
        console.error(
          `[trial-tracking] Failed to record trial usage for customer ${customerId}:`,
          error
        );
      } else {
      }
    } catch (error) {
      console.error(
        `[trial-tracking] Error recording trial usage:`,
        error
      );
    }
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

  /**
   * Send payment notification to external endpoint
   */
  private async sendPaymentNotification(
    subscriptionId: string,
    supabase: ReturnType<typeof createServiceSupabase>
  ) {
    try {
      // Get subscription details with plan information
      const { data: subscription, error: subError } = await supabase
        .from("subscriptions")
        .select(`
          id,
          status,
          plan_id,
          subscription_plans (
            name
          )
        `)
        .eq("id", subscriptionId)
        .single();

      if (subError || !subscription) {
        console.error("[notification] Failed to fetch subscription:", subError);
        return;
      }

      const planName = (subscription.subscription_plans as any)?.name || "Unknown";
      
      const notificationEndpoint = process.env.NOTIFICATION_ENDPOINT;
      if (!notificationEndpoint) {
        return;
      }

      const notificationBody = `플랜: ${planName}\n상태: ${subscription.status}`;


      const response = await fetch(notificationEndpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: "슥슥 플랜 결제되었습니다",
          body: notificationBody,
        }),
      });

      if (!response.ok) {
        console.error(`[notification] Failed to send notification: ${response.status} ${response.statusText}`);
      } else {
      }
    } catch (notificationError) {
      console.error("[notification] Error sending payment notification:", notificationError);
    }
  }

  /**
   * Handle credit purchase from transaction.completed event
   * Adds credits to user's balance based on custom_data
   * Uses the same customer lookup logic as subscription purchases
   */
  private async handleCreditPurchase(
    eventData: TransactionCompletedEvent,
    customData: CreditPurchaseCustomData
  ) {
    const supabase = createServiceSupabase();

    try {
      const quantity = parseInt(customData.quantity, 10);
      const transactionId = eventData.data.id;
      const customerId = eventData.data.customerId;

      if (!customerId) {
        console.error("[credit-purchase] No customer_id in event");
        return;
      }

      if (isNaN(quantity) || quantity <= 0) {
        console.error("[credit-purchase] Invalid quantity:", customData.quantity);
        return;
      }


      // Check for duplicate transaction
      const { data: existingTransaction } = await supabase
        .from("credit_transactions")
        .select("id")
        .eq("paddle_transaction_id", transactionId)
        .single();

      if (existingTransaction) {
        return;
      }

      // 1. Find user_id from customer (same logic as subscription)
      let userId: string | null = null;

      // 1a. Try to get user_id from existing customer record
      const { data: customerData } = await supabase
        .from("customers")
        .select("user_id")
        .eq("customer_id", customerId)
        .single();

      if (customerData?.user_id) {
        userId = customerData.user_id;
      } else {
        // 1b. Customer doesn't exist or not linked - fetch from Paddle API and find user by email

        const paddle = getPaddleInstance();
        let customerEmail: string | null = null;

        try {
          const paddleCustomer = await paddle.customers.get(customerId);
          customerEmail = paddleCustomer.email;
        } catch (apiError) {
          console.error(`[credit-purchase] Failed to fetch customer from Paddle API:`, apiError);
          return;
        }

        if (!customerEmail) {
          console.error(`[credit-purchase] No email available for customer ${customerId}`);
          return;
        }

        // Find user by email
        const {
          data: { users },
          error: listError,
        } = await supabase.auth.admin.listUsers();

        if (listError) {
          console.error(`[credit-purchase] Failed to list users:`, listError);
          return;
        }

        const user = users?.find((u) => u.email === customerEmail);

        if (!user) {
          console.error(
            `[credit-purchase] No user found with email ${customerEmail}`
          );
          return;
        }

        userId = user.id;

        // Create or update customer record
        await supabase
          .from("customers")
          .upsert({
            customer_id: customerId,
            email: customerEmail,
            user_id: userId,
          });

      }

      if (!userId) {
        console.error("[credit-purchase] Could not determine user_id");
        return;
      }

      // 2. Record transaction
      const { error: transactionError } = await supabase
        .from("credit_transactions")
        .insert({
          user_id: userId,
          transaction_type: "purchase",
          create_credits: quantity,
          publish_credits: quantity,
          paddle_transaction_id: transactionId,
        });

      if (transactionError) {
        console.error("[credit-purchase] Failed to record transaction:", transactionError);
        throw transactionError;
      }

      // 3. Update balance (upsert)
      const { data: existing } = await supabase
        .from("credit_balance")
        .select("create_credits, publish_credits")
        .eq("user_id", userId)
        .single();

      const newCreateCredits = (existing?.create_credits || 0) + quantity;
      const newPublishCredits = (existing?.publish_credits || 0) + quantity;

      const { error: balanceError } = await supabase
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
        console.error("[credit-purchase] Failed to update balance:", balanceError);
        throw balanceError;
      }


      // 4. Send notification (optional)
      await this.sendCreditPurchaseNotification(quantity, userId);
    } catch (error) {
      console.error("[credit-purchase] Error processing credit purchase:", error);
      throw error;
    }
  }

  /**
   * Send notification for credit purchase
   */
  private async sendCreditPurchaseNotification(quantity: number, userId: string) {
    try {
      const notificationEndpoint = process.env.NOTIFICATION_ENDPOINT;
      if (!notificationEndpoint) {
        return;
      }

      const notificationBody = `수량: ${quantity}개\n사용자 ID: ${userId.substring(0, 8)}...`;


      const response = await fetch(notificationEndpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: "슥슥 크레딧 충전되었습니다",
          body: notificationBody,
        }),
      });

      if (!response.ok) {
        console.error(`[notification] Failed to send notification: ${response.status} ${response.statusText}`);
      } else {
      }
    } catch (notificationError) {
      console.error("[notification] Error sending credit notification:", notificationError);
    }
  }
}

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

export class ProcessWebhook {
  async processEvent(eventData: EventEntity) {
    console.log(`Processing Paddle webhook event: ${eventData.eventType}`);

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
        console.log(`Unhandled event type: ${eventData.eventType}`);
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

      console.log(
        `[subscription.${eventType}] Processing subscription ${eventData.data.id} for customer ${
          eventData.data.customerId
        }`
      );

      // customer_id로 customers 테이블에서 user_id 조회 (없을 수도 있음 - customer.created가 먼저 와야 함)
      const { data: customerData } = await supabase
        .from("customers")
        .select("user_id")
        .eq("customer_id", eventData.data.customerId)
        .single();

      console.log(
        `[subscription] Customer ${
          eventData.data.customerId
        } exists: ${!!customerData}, user_id: ${
          customerData?.user_id || "not linked yet"
        }`
      );

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
      console.log('[subscription] Paddle data:', JSON.stringify({
        status: eventData.data.status,
        scheduled_change: eventData.data.scheduled_change,
        next_billed_at: eventData.data.next_billed_at,
        current_billing_period: eventData.data.currentBillingPeriod,
      }, null, 2));

      // Calculate ends_at from scheduled_change or next_billed_at
      let endsAt: string | null = null;
      let finalStatus = this.mapPaddleStatus(eventData.data.status);
      
      // Priority 1: If subscription has scheduled cancellation, use effective_at
      if (eventData.data.scheduled_change?.action === 'cancel') {
        endsAt = eventData.data.scheduled_change.effective_at || null;
        console.log(`[subscription] Scheduled cancellation detected, ends_at: ${endsAt}`);

        // Check if subscription has already expired
        if (endsAt && new Date(endsAt) < new Date()) {
          finalStatus = 'expired';
          console.log(`[subscription] Subscription already expired, changing status to 'expired'`);
        }
      }
      // Priority 2: Use next_billed_at for active recurring subscriptions
      else if (eventData.data.next_billed_at) {
        endsAt = eventData.data.next_billed_at;
        console.log(`[subscription] Setting ends_at to next billing date: ${endsAt}`);
      }
      // Priority 3: Fallback to current billing period end date
      else if (eventData.data.currentBillingPeriod?.endsAt) {
        endsAt = eventData.data.currentBillingPeriod.endsAt;
        console.log(`[subscription] Using current billing period end date: ${endsAt}`);
      }

      // If still no ends_at and status is canceled, log warning
      if (!endsAt && (eventData.data.status === 'canceled' || finalStatus === 'canceled')) {
        console.warn(`[subscription] ⚠️ Canceled subscription has no ends_at date - Paddle data may be incomplete`);
      }

      let subscriptionId: string;

      // user_id가 있으면 기존 subscription 레코드를 업데이트, 없으면 새로 생성
      if (customerData?.user_id) {
        console.log(`[subscription] User ${customerData.user_id} exists, checking for existing subscription...`);

        // 이 user의 기존 subscription 찾기 (plan_id 포함)
        const { data: existingUserSub } = await supabase
          .from("subscriptions")
          .select("id, plan_id")
          .eq("user_id", customerData.user_id)
          .single();

        if (existingUserSub) {
          // 기존 subscription 업데이트 (Free → Pro 등)
          console.log(`[subscription] Updating existing subscription ${existingUserSub.id} to ${planName}`);

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

            console.log(`[subscription] Plan change detected: ${oldPlan?.name} → ${newPlan?.name}`);

            // Reset monthly usage if upgrading to a higher tier (higher limits)
            if (oldPlan && newPlan && 
                (newPlan.monthly_document_limit > oldPlan.monthly_document_limit ||
                 newPlan.active_document_limit > oldPlan.active_document_limit)) {
              
              console.log(`[subscription] Plan upgrade detected! Resetting monthly usage for user ${customerData.user_id}`);

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
                console.log(`[subscription] ✅ Successfully reset monthly usage for ${currentMonth}`);
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
          console.log(`[subscription] Updated subscription to ${planName}: ${subscriptionId}`);
        } else {
          // user는 있지만 subscription이 없는 경우 (정상적이지 않은 상황)
          console.log(`[subscription] User has no subscription, creating new one`);

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
          console.log(`[subscription] Created subscription: ${subscriptionId}`);
        }
      } else {
        // user_id가 없으면 일단 subscription만 생성 (transaction.completed에서 연결됨)
        console.log(`[subscription] No user linked yet, creating unlinked subscription`);

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
        console.log(`[subscription] Created unlinked subscription: ${subscriptionId}`);
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
          `Updated user ${customerData.user_id} subscription to ${planName} (${finalStatus})`
        );
      } else {
        console.log(
          `Created subscription ${subscriptionId} for ${planName} (${finalStatus}) - waiting for transaction.completed to link to user`
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
      console.log(
        `[customer.${
          eventData.eventType.includes("created") ? "created" : "updated"
        }] Processing customer ${eventData.data.id} with email ${
          eventData.data.email
        }`
      );

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

      console.log(
        `[customer] Upserted customer: ${eventData.data.id} with email ${
          eventData.data.email
        }, user: ${user?.id || "not found"}`
      );

      // user_id가 있으면, 이 customer의 subscription을 찾아서 user_id 연결 (보조적 역할)
      if (user?.id) {
        // paddle_customer_id로 정확하게 이 customer의 subscription 찾기
        const { data: subscriptions } = await supabase
          .from("subscriptions")
          .select("id, paddle_subscription_id, status")
          .eq("paddle_customer_id", eventData.data.id)
          .is("user_id", null);

        if (subscriptions && subscriptions.length > 0) {
          console.log(
            `[customer] Found ${subscriptions.length} unlinked subscription(s) for customer ${eventData.data.id} - linking to user ${user.id}`
          );

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

            console.log(
              `[customer] Linked subscription ${sub.id} (${sub.paddle_subscription_id}) to user ${user.id}`
            );
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
      const customerId = eventData.data.customerId;

      if (!customerId) {
        console.log("[transaction.completed] No customer_id in event");
        return;
      }

      console.log(
        `[transaction.completed] Processing for customer ${customerId}`
      );

      // 1. Paddle API로 customer 정보 가져오기 (실제 이메일 포함)
      const paddle = getPaddleInstance();
      let customerEmail: string | null = null;

      try {
        console.log(
          `[transaction.completed] Fetching customer info from Paddle API...`
        );
        const paddleCustomer = await paddle.customers.get(customerId);
        customerEmail = paddleCustomer.email;
        console.log(
          `[transaction.completed] Fetched customer email from Paddle: ${customerEmail}`
        );
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
          console.log(
            `[transaction.completed] Using email from database: ${customerEmail}`
          );
        } else {
          console.log(
            `[transaction.completed] No valid email found, waiting for customer.created event`
          );
          return;
        }
      }

      if (!customerEmail) {
        console.log(
          `[transaction.completed] No email available for customer ${customerId}`
        );
        return;
      }

      // 2. customers 테이블에서 customer 조회 또는 생성
      let { data: customerData, error: customerError } = await supabase
        .from("customers")
        .select("user_id")
        .eq("customer_id", customerId)
        .single();

      if (customerError || !customerData) {
        console.log(
          `[transaction.completed] Customer ${customerId} not in database, creating...`
        );

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
        console.log(
          `[transaction.completed] Created customer ${customerId} with email ${customerEmail}`
        );
      }

      // 3. user_id가 없으면 이메일로 user 찾아서 업데이트
      if (!customerData.user_id) {
        console.log(
          `[transaction.completed] Looking up user by email: ${customerEmail}`
        );

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
          console.log(
            `[transaction.completed] Found user ${user.id} for email ${customerEmail}`
          );

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

          console.log(
            `[transaction.completed] Updated customer ${customerId} with user_id ${user.id}`
          );

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
            console.log(
              `[transaction.completed] Found ${subscriptions.length} unlinked subscription(s) for customer ${customerId}`
            );

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

              console.log(
                `[transaction.completed] Successfully linked subscription ${sub.id} (${sub.paddle_subscription_id}) to user ${user.id}`
              );
            }

            console.log(
              `[transaction.completed] ✅ Successfully linked all subscriptions for customer ${customerId} to user ${user.id}`
            );

            // Check if this transaction includes a free trial and record usage
            const priceId = eventData.data.items[0]?.price?.id;
            if (priceId && this.isPriceWithTrial(priceId)) {
              console.log(
                `[transaction.completed] Free trial detected for priceId: ${priceId}`
              );
              await this.recordTrialUsage(customerId);
            }

            // Send payment notification
            await this.sendPaymentNotification(subscriptions[0].id, supabase);
          } else {
            console.log(
              `[transaction.completed] No unlinked subscriptions found for customer ${customerId}`
            );
          }
        } else {
          console.warn(
            `[transaction.completed] No user found with email ${customerEmail} - user might not be registered yet`
          );
        }
      } else if (customerData.user_id) {
        console.log(
          `[transaction.completed] Customer ${customerId} already linked to user ${customerData.user_id} - checking for unlinked subscriptions`
        );

        // customer는 이미 linked되어 있지만 subscription이 아직 linked 안 되어있을 수 있음
        const { data: subscriptions } = await supabase
          .from("subscriptions")
          .select("id, paddle_subscription_id, status")
          .eq("paddle_customer_id", customerId)
          .is("user_id", null);

        if (subscriptions && subscriptions.length > 0) {
          console.log(
            `[transaction.completed] Found ${subscriptions.length} unlinked subscription(s) - linking now`
          );

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

            console.log(
              `[transaction.completed] Linked subscription ${sub.id} to existing user ${customerData.user_id}`
            );
          }

          // Check if this transaction includes a free trial and record usage
          const priceId = eventData.data.items[0]?.price?.id;
          if (priceId && this.isPriceWithTrial(priceId)) {
            console.log(
              `[transaction.completed] Free trial detected for priceId: ${priceId}`
            );
            await this.recordTrialUsage(customerId);
          }

          // Send payment notification for the first active subscription
          if (subscriptions.length > 0) {
            await this.sendPaymentNotification(subscriptions[0].id, supabase);
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
        console.log(
          `[trial-tracking] ✅ Recorded trial usage for customer: ${customerId}`
        );
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
        console.log("[notification] NOTIFICATION_ENDPOINT not configured, skipping notification");
        return;
      }

      const notificationBody = `플랜: ${planName}\n상태: ${subscription.status}`;

      console.log(`[notification] Sending payment notification for plan: ${planName}`);

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
        console.log(`[notification] ✅ Successfully sent payment notification for ${planName}`);
      }
    } catch (notificationError) {
      console.error("[notification] Error sending payment notification:", notificationError);
    }
  }
}

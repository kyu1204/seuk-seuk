import {
  CustomerCreatedEvent,
  CustomerUpdatedEvent,
  EventEntity,
  EventName,
  SubscriptionCreatedEvent,
  SubscriptionUpdatedEvent,
} from "@paddle/paddle-node-sdk";
import { createServerSupabase } from "@/lib/supabase/server";
import { PADDLE_PRICE_TIERS } from "./pricing-config";

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
      default:
        console.log(`Unhandled event type: ${eventData.eventType}`);
    }
  }

  private async updateSubscriptionData(
    eventData: SubscriptionCreatedEvent | SubscriptionUpdatedEvent
  ) {
    const supabase = await createServerSupabase();

    try {
      // 1. customer_id로 customers 테이블에서 user_id 조회
      let { data: customerData, error: customerError } = await supabase
        .from("customers")
        .select("user_id")
        .eq("customer_id", eventData.data.customerId)
        .single();

      // customer가 없으면 임시로 생성 (이벤트 순서 문제 대응)
      if (customerError || !customerData) {
        console.log(`Customer ${eventData.data.customerId} not found, creating placeholder...`);

        // customer_id만으로 임시 레코드 생성 (email과 user_id는 나중에 customer.created 이벤트로 업데이트)
        const { data: newCustomer, error: insertError } = await supabase
          .from("customers")
          .insert({
            customer_id: eventData.data.customerId,
            email: `placeholder-${eventData.data.customerId}@temp.paddle.com`, // 임시 이메일
            user_id: null,
          })
          .select("user_id")
          .single();

        if (insertError) {
          // 이미 존재하는 경우 조회 재시도
          if (insertError.code === "23505") {
            console.log("Customer already exists, retrying fetch...");
            const { data: existingCustomer } = await supabase
              .from("customers")
              .select("user_id")
              .eq("customer_id", eventData.data.customerId)
              .single();
            customerData = existingCustomer;
          } else {
            console.error("Failed to create placeholder customer:", insertError);
            return;
          }
        } else {
          customerData = newCustomer;
          console.log(`Created placeholder customer ${eventData.data.customerId}`);
        }
      }

      if (!customerData?.user_id) {
        console.warn(`Customer ${eventData.data.customerId} has no user_id yet (will be updated by customer.created event)`);
        // user_id가 없어도 subscription은 생성하되, users 테이블 업데이트는 스킵
        // return; // 이 줄을 제거하여 계속 진행
      }

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
      if (customerData.user_id) {
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
          `Created subscription ${subscriptionId} for ${planName} (${subscriptionStatus}) - waiting for customer.created event to link to user`
        );
      }
    } catch (error) {
      console.error("Error processing subscription webhook:", error);
      throw error;
    }
  }

  private async updateCustomerData(
    eventData: CustomerCreatedEvent | CustomerUpdatedEvent
  ) {
    const supabase = await createServerSupabase();

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
        console.error("Failed to upsert customer:", error);
        throw error;
      }

      console.log(`Updated customer: ${eventData.data.id} with user: ${user?.id}`);

      // user_id가 있으면, 이 customer의 subscription을 찾아서 user_id 연결
      if (user?.id) {
        // 1. paddle_subscription_id가 있는 subscription 찾기
        const { data: subscriptions } = await supabase
          .from("subscriptions")
          .select("id")
          .is("user_id", null)
          .not("paddle_subscription_id", "is", null);

        if (subscriptions && subscriptions.length > 0) {
          for (const sub of subscriptions) {
            // 2. subscription의 user_id 업데이트
            await supabase
              .from("subscriptions")
              .update({ user_id: user.id, updated_at: new Date().toISOString() })
              .eq("id", sub.id);

            // 3. users 테이블의 current_subscription_id 업데이트
            await supabase
              .from("users")
              .update({ current_subscription_id: sub.id })
              .eq("id", user.id);

            console.log(`Linked subscription ${sub.id} to user ${user.id}`);
          }
        }
      }
    } catch (error) {
      console.error("Error processing customer webhook:", error);
      throw error;
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

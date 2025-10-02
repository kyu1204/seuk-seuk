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

      // customer가 없으면 먼저 생성 (이벤트 순서 문제 대응)
      if (customerError || !customerData) {
        console.log(`Customer ${eventData.data.customerId} not found, fetching from Paddle...`);

        // Paddle API에서 customer 정보 가져오기
        const { getPaddleInstance } = await import("./get-paddle-instance");
        const paddle = getPaddleInstance();

        try {
          const customer = await paddle.customers.get(eventData.data.customerId);

          // 이메일로 사용자 찾기
          const { data: { users }, error: userError } = await supabase.auth.admin.listUsers();
          const user = users?.find((u) => u.email === customer.email);

          // customers 테이블에 삽입
          const { data: newCustomer, error: insertError } = await supabase
            .from("customers")
            .insert({
              customer_id: customer.id,
              email: customer.email,
              user_id: user?.id ?? null,
            })
            .select("user_id")
            .single();

          if (insertError) {
            console.error("Failed to create customer:", insertError);
            return;
          }

          customerData = newCustomer;
          console.log(`Created customer ${customer.id} for user ${user?.id}`);
        } catch (paddleError) {
          console.error("Failed to fetch customer from Paddle:", paddleError);
          return;
        }
      }

      if (!customerData?.user_id) {
        console.error("Customer found but user_id is null");
        return;
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
        // 먼저 해당 유저의 기존 활성 구독 비활성화
        await supabase
          .from("subscriptions")
          .update({ status: "canceled", updated_at: new Date().toISOString() })
          .eq("user_id", customerData.user_id)
          .eq("status", "active");

        const { data: newSub, error: insertError } = await supabase
          .from("subscriptions")
          .insert({
            user_id: customerData.user_id,
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

      // 5. users.current_subscription_id 업데이트
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

      console.log(`Updated customer: ${eventData.data.id}`);
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

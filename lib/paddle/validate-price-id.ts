import { PADDLE_PRICE_TIERS } from "./pricing-config";
import { createServerSupabase } from "@/lib/supabase/server";

interface TierInfo {
  tier: (typeof PADDLE_PRICE_TIERS)[number];
  cycle: "month" | "year";
  hasTrial: boolean;
}

/**
 * 서버 측에서 priceId를 검증하고, 필요시 무료체험 없는 버전으로 교체합니다.
 *
 * @param requestedPriceId - 클라이언트가 요청한 Paddle Price ID
 * @param userEmail - 현재 사용자 이메일 (로그인 상태인 경우)
 * @returns 검증된 Price ID (무료체험 이력이 있으면 noTrial 버전으로 교체)
 */
export async function validateAndGetPriceId(
  requestedPriceId: string,
  userEmail?: string
): Promise<string> {
  // 1. 요청된 priceId가 어느 플랜/주기인지 확인
  const tierInfo = findTierByPriceId(requestedPriceId);

  if (!tierInfo) {
    // 유효하지 않은 priceId면 그대로 반환 (Paddle이 거부할 것)
    console.warn(`Unknown priceId requested: ${requestedPriceId}`);
    return requestedPriceId;
  }

  const { tier, cycle, hasTrial } = tierInfo;

  // 2. 무료체험이 없는 priceId면 그대로 반환
  if (!hasTrial) {
    return requestedPriceId;
  }

  // 3. 로그인하지 않은 사용자는 체험 허용
  if (!userEmail) {
    return requestedPriceId;
  }

  const supabase = await createServerSupabase();

  // 4. customers 테이블에서 무료체험 이력 확인
  const { data: customer } = await supabase
    .from("customers")
    .select("has_used_free_trial")
    .eq("email", userEmail)
    .single();

  // 5. customer 레코드가 없으면 첫 구매 → 무료체험 허용
  if (!customer) {
    console.log(`No customer record for ${userEmail}, allowing free trial`);
    return requestedPriceId;
  }

  // 6. 무료체험 사용 이력이 있으면 noTrial 버전으로 교체
  if (customer.has_used_free_trial) {
    const noTrialPriceId =
      cycle === "month" ? tier.priceId.monthNoTrial : tier.priceId.yearNoTrial;

    if (noTrialPriceId) {
      console.log(
        `Price validation: ${userEmail} requested ${requestedPriceId}, returned ${noTrialPriceId} (trial already used)`
      );
      return noTrialPriceId;
    } else {
      console.warn(
        `No noTrial priceId available for ${tier.name} ${cycle}, falling back to original`
      );
      return requestedPriceId;
    }
  }

  // 7. 이력 없으면 원래 priceId 반환 (무료체험 제공)
  console.log(`Price validation: ${userEmail} eligible for free trial`);
  return requestedPriceId;
}

/**
 * Paddle Price ID로부터 해당하는 플랜, 주기, 무료체험 여부를 찾습니다.
 */
function findTierByPriceId(priceId: string): TierInfo | null {
  for (const tier of PADDLE_PRICE_TIERS) {
    // 월간 플랜 (무료체험 포함)
    if (tier.priceId.month === priceId) {
      return {
        tier,
        cycle: "month",
        hasTrial: !!tier.priceId.monthNoTrial,
      };
    }

    // 연간 플랜 (무료체험 포함)
    if (tier.priceId.year === priceId) {
      return {
        tier,
        cycle: "year",
        hasTrial: !!tier.priceId.yearNoTrial,
      };
    }

    // 월간 플랜 (무료체험 없음)
    if (tier.priceId.monthNoTrial === priceId) {
      return {
        tier,
        cycle: "month",
        hasTrial: false,
      };
    }

    // 연간 플랜 (무료체험 없음)
    if (tier.priceId.yearNoTrial === priceId) {
      return {
        tier,
        cycle: "year",
        hasTrial: false,
      };
    }
  }

  return null;
}

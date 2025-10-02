export interface PaddlePriceTier {
  name: string;
  id: "free" | "pro" | "enterprise";
  priceId: {
    month: string;
    year: string;
  };
}

// Paddle Price IDs - 실제 Paddle Dashboard에서 생성한 가격 ID로 교체 필요
export const PADDLE_PRICE_TIERS: PaddlePriceTier[] = [
  {
    name: "Free",
    id: "free",
    priceId: {
      month: "pri_free_month", // Free plan은 가격 ID가 없지만 구조 통일을 위해 추가
      year: "pri_free_year",
    },
  },
  {
    name: "Pro",
    id: "pro",
    priceId: {
      month: "pri_01k6fxz394tm9v7sx6vbdq6esw", // 실제 Paddle Price ID로 교체
      year: "pri_01k6hfe2186s3mr286txzssxyn", // 실제 Paddle Price ID로 교체
    },
  },
  {
    name: "Enterprise",
    id: "enterprise",
    priceId: {
      month: "pri_enterprise_month", // 실제 Paddle Price ID로 교체
      year: "pri_enterprise_year", // 실제 Paddle Price ID로 교체
    },
  },
];

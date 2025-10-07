export interface PaddlePriceTier {
  name: string;
  id: "free" | "pro" | "starter";
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
    name: "Starter",
    id: "starter",
    priceId: {
      month: "pri_01k6t62f9p22z50pr5hy4mfk7j", // 실제 Paddle Price ID로 교체
      year: "pri_01k6yr8v1904d21fcnq80w7a8c", // 실제 Paddle Price ID로 교체
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
];

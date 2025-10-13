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
    name: "Basic",
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
      month: "pri_01k76kp29qese6bdsc4b8djhd2", // 실제 Paddle Price ID로 교체
      year: "pri_01k76kpkr2h39pdbzykm8dvxqe", // 실제 Paddle Price ID로 교체
    },
  },
  {
    name: "Pro",
    id: "pro",
    priceId: {
      month: "pri_01k76kga3rtj5ny7s59n500s89", // 실제 Paddle Price ID로 교체
      year: "pri_01k76kh19g45q021rq1k7ps878", // 실제 Paddle Price ID로 교체
    },
  },
];

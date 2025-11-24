export interface PaddlePriceTier {
  name: string;
  id: "free" | "pro" | "starter";
  priceId: {
    month: string;
    year: string;
    monthNoTrial?: string; // 무료체험 없는 월간 플랜 (선택적)
    yearNoTrial?: string; // 무료체험 없는 연간 플랜 (선택적)
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
      month: "pri_01k76kga3rtj5ny7s59n500s89", // 30일 무료체험 포함
      year: "pri_01k76kh19g45q021rq1k7ps878", // 30일 무료체험 포함
      monthNoTrial: "pri_01kadxgjts4q3gvk7txpapynj6", // 무료체험 없는 월간 플랜
      yearNoTrial: "pri_01kadxfdx5pj8f7st5cjx4dnkc", // 무료체험 없는 연간 플랜
    },
  },
];

// Credit Price ID - Paddle에서 생성 후 실제 Price ID로 교체
export const PADDLE_CREDIT_PRICE_ID = "pri_01xxxxxxxxxxxxxxxxxxxxx";

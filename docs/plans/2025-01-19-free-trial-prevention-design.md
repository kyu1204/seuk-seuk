# 무료 체험 중복 사용 방지 시스템 설계

**작성일:** 2025-01-19
**목적:** Pro 플랜 30일 무료 체험 중복 사용 방지
**범위:** Paddle Customer ID 단위 영구 추적

---

## 1. 문제 정의

### 현재 문제
- Pro 플랜에 Paddle catalog 레벨에서 30일 무료 체험이 설정되어 있음
- 사용자가 구독 취소 후 재결제 시 동일한 무료 체험을 다시 받을 수 있음
- Product ID가 `lib/paddle/pricing-config.ts`에 하드코딩되어 관리 중

### 해결 목표
1. **Paddle Customer ID 단위 추적** - 동일 결제 정보로는 한 번만 무료 체험
2. **서버 측 검증** - URL 조작 등 클라이언트 공격 차단
3. **영구 이력 저장** - 한 번 사용하면 평생 재사용 불가

---

## 2. 아키텍처 개요

### 데이터 플로우
```
사용자 Pro 플랜 선택
    ↓
[클라이언트] PricingPage에서 /checkout/[priceId] 이동
    ↓
[서버] page.tsx에서 customers.has_used_free_trial 확인
    ↓
true인 경우 → priceId를 noTrial 버전으로 교체
false인 경우 → 원래 priceId 유지 (trial 포함)
    ↓
[클라이언트] CheckoutContents가 검증된 priceId로 Paddle Checkout 열기
    ↓
[Paddle] 결제 처리 → transaction.completed webhook 발생
    ↓
[서버] Webhook에서 trial 포함 구독이면 has_used_free_trial = true 기록
```

### 보안 계층
1. **1차 방어:** 서버 측 priceId 검증 (checkout page.tsx)
2. **2차 방어:** Webhook에서 최종 이력 기록
3. **공격 차단:** URL 조작 시 서버가 자동으로 적절한 priceId로 교체

---

## 3. 데이터베이스 스키마

### customers 테이블 확장

```sql
-- Migration: add_free_trial_tracking_to_customers
ALTER TABLE customers
ADD COLUMN has_used_free_trial BOOLEAN DEFAULT false,
ADD COLUMN first_trial_date TIMESTAMP WITH TIME ZONE;

-- 인덱스 추가 (조회 성능 최적화)
CREATE INDEX idx_customers_has_used_free_trial
ON customers(customer_id, has_used_free_trial);
```

**필드 설명:**
- `has_used_free_trial` (boolean, default: false)
  - 해당 Paddle customer가 무료 체험을 사용한 적이 있는지 추적
  - transaction.completed webhook에서 trial 포함 구독 발견 시 true로 설정

- `first_trial_date` (timestamp, nullable)
  - 최초 무료 체험 시작 시각 기록
  - 분석 및 감사용
  - NULL 허용 (기존 데이터 호환성)

**설계 근거:**
- users 테이블이 아닌 customers 테이블 사용 → Paddle customer_id 단위 추적
- Webhook에서 customer_id로만 조회 가능하므로 빠른 접근

---

## 4. Pricing Config 구조

### lib/paddle/pricing-config.ts

```typescript
export interface PaddlePriceTier {
  name: string;
  id: string;
  priceId: {
    month: string;
    year: string;
    monthNoTrial?: string;  // 무료체험 없는 월간 플랜
    yearNoTrial?: string;   // 무료체험 없는 연간 플랜
  };
}

export const PADDLE_PRICE_TIERS: PaddlePriceTier[] = [
  {
    name: "Basic",
    id: "free",
    priceId: {
      month: "pri_free_month",
      year: "pri_free_year",
    },
  },
  {
    name: "Starter",
    id: "starter",
    priceId: {
      month: "pri_01k76kp29qese6bdsc4b8djhd2",
      year: "pri_01k76kpkr2h39pdbzykm8dvxqe",
    },
  },
  {
    name: "Pro",
    id: "pro",
    priceId: {
      month: "pri_01k76kga3rtj5ny7s59n500s89",        // 30일 무료체험 포함
      year: "pri_01k76kh19g45q021rq1k7ps878",         // 30일 무료체험 포함
      monthNoTrial: "pri_NEW_MONTHLY_NO_TRIAL",       // Paddle에서 새로 생성 필요
      yearNoTrial: "pri_NEW_YEARLY_NO_TRIAL",         // Paddle에서 새로 생성 필요
    },
  },
];
```

**설계 결정:**
- `monthNoTrial`, `yearNoTrial`을 optional로 설정
- Pro 플랜만 4개의 priceId 보유
- 기존 코드 호환성 유지

**Paddle 작업:**
1. Pro 플랜과 동일 가격의 새 Price 2개 생성 (무료체험 없음)
2. 생성된 pri_*** ID를 코드에 반영

---

## 5. 서버 측 검증 로직

### checkout/[priceId]/page.tsx

```typescript
import { validateAndGetPriceId } from "@/lib/paddle/validate-price-id";

export default async function CheckoutPage({
  params,
}: {
  params: Promise<{ priceId: string }>;
}) {
  const { priceId } = await params;
  const supabase = await createServerSupabase();
  const { data } = await supabase.auth.getUser();

  // 서버 측에서 무료체험 이력 확인 및 priceId 교체
  const validatedPriceId = await validateAndGetPriceId(
    priceId,
    data.user?.email
  );

  return (
    <div>
      <CheckoutHeader />
      <CheckoutContents
        userEmail={data.user?.email}
        validatedPriceId={validatedPriceId}
      />
    </div>
  );
}
```

### lib/paddle/validate-price-id.ts (신규)

```typescript
import { PADDLE_PRICE_TIERS } from "./pricing-config";
import { createServerSupabase } from "@/lib/supabase/server";

export async function validateAndGetPriceId(
  requestedPriceId: string,
  userEmail?: string
): Promise<string> {
  // 1. 요청된 priceId가 어느 플랜/주기인지 확인
  const tierInfo = findTierByPriceId(requestedPriceId);

  if (!tierInfo) {
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

  // 5. 무료체험 사용 이력이 있으면 noTrial 버전으로 교체
  if (customer?.has_used_free_trial) {
    const noTrialPriceId = cycle === "month"
      ? tier.priceId.monthNoTrial
      : tier.priceId.yearNoTrial;

    console.log(`Price validation: ${userEmail} requested ${requestedPriceId}, returned ${noTrialPriceId}`);
    return noTrialPriceId || requestedPriceId;
  }

  // 6. 이력 없으면 원래 priceId 반환
  return requestedPriceId;
}

function findTierByPriceId(priceId: string) {
  for (const tier of PADDLE_PRICE_TIERS) {
    if (tier.priceId.month === priceId) {
      return { tier, cycle: "month", hasTrial: !!tier.priceId.monthNoTrial };
    }
    if (tier.priceId.year === priceId) {
      return { tier, cycle: "year", hasTrial: !!tier.priceId.yearNoTrial };
    }
    if (tier.priceId.monthNoTrial === priceId) {
      return { tier, cycle: "month", hasTrial: false };
    }
    if (tier.priceId.yearNoTrial === priceId) {
      return { tier, cycle: "year", hasTrial: false };
    }
  }
  return null;
}
```

### CheckoutContents.tsx 수정

```typescript
interface Props {
  userEmail?: string;
  validatedPriceId: string;  // 새로 추가
}

export function CheckoutContents({ userEmail, validatedPriceId }: Props) {
  // useParams() 제거

  paddleInstance.Checkout.open({
    ...(userEmail && { customer: { email: userEmail } }),
    items: [{ priceId: validatedPriceId, quantity: 1 }],
  });
}
```

---

## 6. Webhook 이력 기록

### lib/paddle/process-webhook.ts 수정

```typescript
private async handleTransactionCompleted(eventData: TransactionCompletedEvent) {
  // 기존 로직...
  const customerId = eventData.data.customerId;
  const subscriptionId = eventData.data.subscriptionId;

  // 1. priceId로 trial 여부 판단
  if (subscriptionId) {
    const priceId = eventData.data.items[0]?.price?.id;
    const isTrialPrice = this.isPriceWithTrial(priceId);

    // 2. 무료체험이 있는 구독이면 customers 테이블에 기록
    if (isTrialPrice) {
      await this.recordTrialUsage(customerId);
    }
  }

  // 기존 로직 계속...
}

private isPriceWithTrial(priceId: string): boolean {
  for (const tier of PADDLE_PRICE_TIERS) {
    // trial 버전 priceId인지 확인
    if (tier.priceId.month === priceId || tier.priceId.year === priceId) {
      // 이 tier가 noTrial 버전을 가지고 있다면 = trial 제공 플랜
      return !!(tier.priceId.monthNoTrial || tier.priceId.yearNoTrial);
    }
  }
  return false;
}

private async recordTrialUsage(customerId: string) {
  const supabase = createServerSupabase();

  const { error } = await supabase
    .from("customers")
    .update({
      has_used_free_trial: true,
      first_trial_date: new Date().toISOString(),
    })
    .eq("customer_id", customerId)
    .is("first_trial_date", null);  // 최초 1회만 기록

  if (error) {
    console.error("Failed to record trial usage:", error);
  } else {
    console.log(`Trial usage recorded for customer: ${customerId}`);
  }
}
```

---

## 7. 클라이언트 UI

### app/(billing)/pricing/components/PricingPage.tsx

```typescript
const handleGetStarted = async (nameKey: string, billingCycle: string) => {
  const tier = PADDLE_PRICE_TIERS.find(
    (t) => t.name.toLowerCase() === nameKey || t.id === nameKey
  );

  if (tier) {
    // 항상 trial 포함 버전으로 이동 (서버가 알아서 검증)
    const priceId =
      billingCycle === "yearly" ? tier.priceId.year : tier.priceId.month;

    if (priceId) {
      router.push(`/checkout/${priceId}`);
      return;
    }
  }

  router.push("/pricing");
};
```

**설계 결정:**
- 클라이언트는 항상 trial 포함 priceId 사용
- 서버가 자동으로 검증 및 교체
- UI는 현재 그대로 유지 ("30 days free trial" 표시)

---

## 8. 테스트 시나리오

### 시나리오 1: 정상 플로우 - 최초 무료 체험
```
1. 새 사용자가 Pro 플랜 선택
2. /checkout/pri_WITH_TRIAL로 이동
3. 서버: has_used_free_trial = false 확인
4. 서버: pri_WITH_TRIAL 그대로 반환
5. Paddle: 30일 무료 체험 시작
6. Webhook: has_used_free_trial = true 기록
✅ 결과: 무료 체험 정상 제공
```

### 시나리오 2: 무료 체험 재시도 방지
```
1. 기존 사용자(has_used_free_trial = true)가 Pro 플랜 선택
2. /checkout/pri_WITH_TRIAL로 이동
3. 서버: has_used_free_trial = true 확인
4. 서버: pri_NO_TRIAL로 자동 교체
5. Paddle: 무료 체험 없이 즉시 결제
✅ 결과: 무료 체험 차단 성공
```

### 시나리오 3: URL 조작 공격 시도
```
1. 악의적 사용자가 /checkout/pri_WITH_TRIAL 직접 접근
2. 서버: has_used_free_trial = true 확인
3. 서버: pri_NO_TRIAL로 자동 교체
4. Paddle: 무료 체험 없이 결제
✅ 결과: 서버 검증으로 방어 성공
```

---

## 9. 엣지 케이스

### customer 레코드 없음
- validateAndGetPriceId에서 customer가 없으면 무료 체험 허용
- 첫 구매 시도로 간주

### 로그인하지 않은 사용자
- Paddle Checkout에서 이메일 입력
- 최초 결제이므로 무료 체험 허용

### 구독 취소 후 재구독
- has_used_free_trial = true 유지
- 재구독 시 무료 체험 제공 안 함 (의도한 대로)

### Paddle Customer ID 변경
- 새로운 결제 수단으로 새 customer_id 생성 시
- 새 customers 레코드 → has_used_free_trial = false
- 새 결제 수단으로 무료 체험 가능
- 참고: Paddle은 동일 카드/PayPal은 customer_id 재사용

### Webhook 지연 또는 실패
- 서버 검증이 1차 방어선이므로 대부분 차단
- 최악의 경우 무료 체험 2번 제공 가능성 (매우 드묾)

---

## 10. 보안 고려사항

### noTrial priceId 노출
- pricing-config.ts가 클라이언트 번들에 포함됨
- monthNoTrial/yearNoTrial이 개발자 도구에 노출
- **완화:** 서버 검증이 있으므로 실제 공격 불가능
- **결정:** 현재 구조 유지 (실용성 우선)

### 이중 방어 메커니즘
1. **서버 측 검증** (checkout page.tsx) - URL 조작 차단
2. **Webhook 검증** (transaction.completed) - 최종 이력 기록

---

## 11. 구현 순서

1. **DB Migration:** customers 테이블에 컬럼 추가
2. **Paddle Catalog:** 무료체험 없는 Pro 플랜 Price 2개 생성
3. **Pricing Config:** pricing-config.ts에 noTrial priceId 추가
4. **서버 검증:** validate-price-id.ts 신규 생성
5. **Checkout Page:** page.tsx에서 검증 로직 추가
6. **Checkout Contents:** props로 validatedPriceId 받도록 수정
7. **Webhook:** process-webhook.ts에 이력 기록 로직 추가
8. **테스트:** 시나리오별 검증
9. **기존 데이터:** 현재 체험 중인 사용자 수동 업데이트

---

## 12. 모니터링

### 로그
```typescript
// validate-price-id.ts
console.log(`Price validation: ${userEmail} requested ${requestedPriceId}, returned ${finalPriceId}`);

// process-webhook.ts
console.log(`Trial usage recorded for customer: ${customerId}`);
```

### 확인 사항
- 무료 체험 이력 기록 성공률
- priceId 교체 발생 빈도
- Webhook 처리 지연 시간

---

## 13. 향후 확장 가능성

### 플랜별 무료 체험 관리
- 현재: Pro 플랜만 대응
- 확장: Starter 등 다른 플랜에도 동일 패턴 적용 가능

### 기간 제한 무료 체험
- 현재: 영구적 제한
- 확장: first_trial_date 활용하여 1년 후 재제공 등 가능

### 관리자 수동 제어
- 현재: 자동 처리만
- 확장: Admin UI에서 has_used_free_trial 수동 초기화 가능

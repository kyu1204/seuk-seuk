# Credit System Design

**작성일**: 2025-11-24
**상태**: Design Approved
**담당**: Development Team

## 개요

월 문서 생성/발행 한도를 초과한 사용자가 구독 플랜 변경 없이 필요한 만큼만 추가 문서를 생성/발행할 수 있는 크레딧 충전 시스템을 설계합니다.

### 목표

1. 월 한도 초과 시 유연한 문서 생성/발행 옵션 제공
2. 구독 플랜 업그레이드가 더 합리적이도록 가격 설정
3. 크레딧은 영구 보관되며 월 리셋 없음
4. 월 한도 우선 사용 후 크레딧 차감

### 핵심 원칙

- **1 크레딧 = 문서 생성 1개 + 문서 발행 1개**
- **가격: $0.50 / 크레딧**
- **차감 우선순위: 월 한도(무료) → 크레딧(유료)**
- **영구 보관: 월이 바뀌어도 크레딧은 유지**

---

## 가격 전략

### 현재 구독 플랜

| 플랜 | 월 가격 | 문서 개수 | 문서당 단가 |
|------|---------|-----------|-------------|
| Basic (Free) | $0 | 3 | $0 |
| Starter | $5 | 15 | $0.33 |
| Pro | $10 | 100 | $0.10 |

### 크레딧 가격: $0.50 / 개

**합리성 분석:**

**무료 → Starter 전환 유도:**
```
무료 유저 (3개 기본):
- 8개 필요: 5 크레딧 ($2.5) → 합리적
- 10개 필요: 7 크레딧 ($3.5) → 합리적
- 15개 지속 필요: Starter ($5) → 명확히 유리 ✅
```

**Starter → Pro 전환 유도:**
```
Starter 유저 (15개 기본):
- 20개 필요: 5 크레딧 ($2.5) → 합리적
- 25개 필요: 10 크레딧 ($5) → Starter + $5 = $10 (Pro와 동일) ⚠️
- 30개+ 지속 필요: Pro ($10 = 100개) → 압도적 유리 ✅
```

**결론**: 크레딧은 "이번 달만 조금 더" 니즈에 최적화, 지속적 필요 시 플랜 업그레이드 유도

---

## 데이터베이스 설계

### 1. `credit_balance` 테이블 (현재 잔액)

```sql
CREATE TABLE credit_balance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  create_credits INTEGER NOT NULL DEFAULT 0,
  publish_credits INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- 인덱스
CREATE INDEX idx_credit_balance_user_id ON credit_balance(user_id);

-- RLS 정책
ALTER TABLE credit_balance ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own credit balance"
  ON credit_balance FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage credits"
  ON credit_balance FOR ALL
  USING (auth.role() = 'service_role');
```

**필드 설명:**
- `create_credits`: 문서 생성에 사용 가능한 크레딧
- `publish_credits`: 문서 발행에 사용 가능한 크레딧
- 두 값은 항상 동일하게 충전되지만, 별도로 차감됨

### 2. `credit_transactions` 테이블 (충전/사용 이력)

```sql
CREATE TABLE credit_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('purchase', 'use_create', 'use_publish')),
  create_credits INTEGER NOT NULL DEFAULT 0,
  publish_credits INTEGER NOT NULL DEFAULT 0,
  paddle_transaction_id TEXT,
  related_document_id UUID REFERENCES documents(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 인덱스
CREATE INDEX idx_credit_transactions_user_id ON credit_transactions(user_id);
CREATE INDEX idx_credit_transactions_created_at ON credit_transactions(created_at DESC);
CREATE INDEX idx_credit_transactions_paddle_id ON credit_transactions(paddle_transaction_id);

-- RLS 정책
ALTER TABLE credit_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own transactions"
  ON credit_transactions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can insert transactions"
  ON credit_transactions FOR INSERT
  WITH CHECK (auth.role() = 'service_role');
```

**필드 설명:**
- `transaction_type`:
  - `purchase`: 크레딧 충전
  - `use_create`: 문서 생성에 사용
  - `use_publish`: 문서 발행에 사용
- `create_credits` / `publish_credits`: 증감량 (충전 시 양수, 사용 시 음수)
- `paddle_transaction_id`: Paddle 결제 추적용
- `related_document_id`: 어떤 문서에서 사용했는지 추적

### 3. 동시성 처리를 위한 DB Function

```sql
CREATE OR REPLACE FUNCTION deduct_credit_atomic(
  p_user_id UUID,
  p_type TEXT,
  p_document_id UUID
) RETURNS BOOLEAN AS $$
DECLARE
  current_balance INTEGER;
BEGIN
  -- 잔액 확인 (FOR UPDATE로 락 획득)
  SELECT CASE
    WHEN p_type = 'create' THEN create_credits
    ELSE publish_credits
  END INTO current_balance
  FROM credit_balance
  WHERE user_id = p_user_id
  FOR UPDATE;

  IF current_balance < 1 THEN
    RAISE EXCEPTION 'Insufficient credits';
  END IF;

  -- 트랜잭션 기록
  INSERT INTO credit_transactions (
    user_id,
    transaction_type,
    create_credits,
    publish_credits,
    related_document_id
  ) VALUES (
    p_user_id,
    'use_' || p_type,
    CASE WHEN p_type = 'create' THEN -1 ELSE 0 END,
    CASE WHEN p_type = 'publish' THEN -1 ELSE 0 END,
    p_document_id
  );

  -- 잔액 차감
  UPDATE credit_balance
  SET
    create_credits = CASE WHEN p_type = 'create' THEN create_credits - 1 ELSE create_credits END,
    publish_credits = CASE WHEN p_type = 'publish' THEN publish_credits - 1 ELSE publish_credits END,
    updated_at = NOW()
  WHERE user_id = p_user_id;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;
```

---

## 비즈니스 로직

### 차감 우선순위

```
1순위: 월 한도 (무료)
2순위: 크레딧 (유료)

예시:
- 월 한도: 15개 중 13개 사용
- 크레딧: 5개 보유
- 총 사용 가능: 7개 (월 한도 2 + 크레딧 5)

문서 3개 생성 시:
→ 1~2번째: 월 한도 차감 (남은 월 한도 소진)
→ 3번째: 크레딧 차감 (크레딧 4개 남음)
```

### 문서 생성 플로우

```typescript
// 1. 사용 가능 여부 체크
async function checkCreateAvailability(userId: string) {
  const usage = await getMonthlyUsage(userId);
  const plan = await getSubscriptionPlan(userId);
  const credits = await getCreditBalance(userId);

  const monthlyRemaining = plan.monthly_document_limit - usage.documents_created;

  if (monthlyRemaining > 0) {
    return { canCreate: true, usingCredit: false };
  } else if (credits.create_credits > 0) {
    return { canCreate: true, usingCredit: true };
  } else {
    return { canCreate: false, reason: "월 한도 및 크레딧 모두 소진" };
  }
}

// 2. 문서 생성
const document = await createDocument(...);

// 3. 카운트 차감
if (usingCredit) {
  await deductCredit(userId, 'create', document.id);
} else {
  await incrementDocumentCreated(userId);
}
```

### 문서 발행 플로우

```typescript
// publication에 N개 문서 포함 시 N번 체크 필요
async function checkPublishAvailability(userId: string, documentCount: number) {
  const usage = await getMonthlyUsage(userId);
  const plan = await getSubscriptionPlan(userId);
  const credits = await getCreditBalance(userId);

  const monthlyRemaining = plan.active_document_limit - usage.published_completed_count;
  const totalAvailable = monthlyRemaining + credits.publish_credits;

  if (totalAvailable < documentCount) {
    return {
      canPublish: false,
      reason: `${documentCount}개 발행 불가 (사용 가능: ${totalAvailable}개)`
    };
  }

  return { canPublish: true };
}

// 발행 후 차감 (documentCount만큼 반복)
for (let i = 0; i < documentCount; i++) {
  const monthlyRemaining = plan.active_document_limit - currentPublishedCount;

  if (monthlyRemaining > 0) {
    // 월 한도는 DB 트리거가 자동 처리
    currentPublishedCount++;
  } else {
    await deductCredit(userId, 'publish', documentIds[i]);
  }
}
```

---

## Paddle 결제 연동

### Product 설정

```
Product Name: "문서 크레딧"
Product Type: Standard (One-time purchase)
Unit Price: $0.50
Quantity: Variable (1~100)
Custom Data: { "type": "credit", "quantity": "{quantity}" }
```

### Checkout 플로우

```
1. 사용자가 "크레딧 충전" 버튼 클릭
   ↓
2. 수량 입력 모달 표시 (1~100)
   ↓
3. /checkout/credit?quantity=5 로 이동
   ↓
4. Paddle Checkout SDK로 결제 진행
   ↓
5. 결제 완료 후 Paddle Webhook 수신
   ↓
6. Webhook Handler:
   - credit_transactions 에 purchase 기록
   - credit_balance 업데이트 (+quantity, +quantity)
   ↓
7. 사용자에게 완료 알림 및 대시보드 리다이렉트
```

### Webhook 처리

```typescript
async function handleCreditPurchaseWebhook(paddleData: PaddleWebhookData) {
  const { user_id, quantity, transaction_id } = paddleData.custom_data;

  // 1. 트랜잭션 기록
  await supabase.from('credit_transactions').insert({
    user_id,
    transaction_type: 'purchase',
    create_credits: quantity,
    publish_credits: quantity,
    paddle_transaction_id: transaction_id
  });

  // 2. 잔액 업데이트 (upsert)
  await supabase.from('credit_balance')
    .upsert({
      user_id,
      create_credits: supabase.sql`create_credits + ${quantity}`,
      publish_credits: supabase.sql`publish_credits + ${quantity}`
    }, { onConflict: 'user_id' });
}
```

---

## UI/UX 설계

### 1. Pricing 페이지 - 크레딧 섹션

기존 구독 플랜 카드 아래에 별도 섹션 추가:

```
┌─────────────────────────────────────┐
│    구독 플랜 (기존 섹션)              │
│  [Free] [Starter] [Professional]    │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│    추가 크레딧                        │
│  "월 한도 초과 시 필요한 만큼 구매"   │
│                                      │
│  ┌──────────────────────────────┐   │
│  │ 문서 크레딧          $0.50/개 │   │
│  │                              │   │
│  │ 수량: [  5  ] (1~100)        │   │
│  │                              │   │
│  │ 총 금액: $2.50               │   │
│  │ 받는 크레딧: 생성 5 + 발행 5  │   │
│  │                              │   │
│  │ [크레딧 충전하기]             │   │
│  └──────────────────────────────┘   │
└─────────────────────────────────────┘
```

### 2. 대시보드 - 사용량 현황

```typescript
// 월 한도 표시
월 문서 생성: 13 / 15 (+5개 보유)
월 문서 발행: 10 / 15 (+5개 보유)

// 월 한도 도달 시 알림
⚠️ 월 문서 생성 한도 도달 (15/15)
💰 추가 크레딧으로 계속 생성할 수 있습니다
[크레딧 충전하기 →]
```

### 3. 마이페이지 - 크레딧 잔액

```
┌────────────────────┐
│ 보유 크레딧         │
├────────────────────┤
│ 생성 가능   5개     │
│ 발행 가능   5개     │
│                    │
│ [크레딧 충전]       │
└────────────────────┘
```

---

## 보안 고려사항

### 1. RLS (Row Level Security)

- `credit_balance`: 본인 조회만 허용, service_role만 수정 가능
- `credit_transactions`: 본인 조회만 허용, service_role만 삽입 가능

### 2. 동시성 제어

- `deduct_credit_atomic` 함수에서 `FOR UPDATE` 락 사용
- 두 개의 요청이 동시에 마지막 1 크레딧을 사용하려 할 때 방지

### 3. Webhook 보안

- Paddle Signature 검증 필수
- 중복 처리 방지 (transaction_id 기반)
- 실패 시 재시도 로직 + 관리자 알림

### 4. 에러 처리

```typescript
try {
  const document = await createDocument(...);
  await deductCredit(userId, 'create', document.id);
} catch (error) {
  // 크레딧 차감 실패 시 문서 삭제 (롤백)
  await deleteDocument(document.id);
  throw new Error("크레딧 차감 실패");
}
```

---

## Server Actions

### 필요한 함수들

```typescript
// 크레딧 관리
- getCreditBalance(userId: string): Promise<CreditBalance>
- deductCredit(userId: string, type: 'create' | 'publish', documentId: string): Promise<void>
- purchaseCredit(quantity: number): Promise<{ checkoutUrl: string }>
- handleCreditPurchaseWebhook(paddleData: PaddleWebhookData): Promise<void>

// 한도 체크 (기존 함수 수정)
- canCreateDocument(): Promise<{ canCreate: boolean, usingCredit: boolean, reason?: string }>
- canCreatePublication(documentCount: number): Promise<{ canCreate: boolean, reason?: string }>

// 사용량 조회 (기존 함수 확장)
- getUsageLimits(): Promise<UsageLimits & { credits: CreditBalance }>
```

---

## 구현 순서 제안

1. **Phase 1: 데이터베이스 구조**
   - migration: credit_balance, credit_transactions 테이블 생성
   - deduct_credit_atomic 함수 생성
   - RLS 정책 적용

2. **Phase 2: Server Actions - 크레딧 조회/차감**
   - getCreditBalance 구현
   - deductCredit 구현
   - canCreateDocument/canCreatePublication 수정

3. **Phase 3: 문서 생성/발행 로직 수정**
   - uploadDocument에 크레딧 차감 로직 추가
   - createPublication에 크레딧 차감 로직 추가

4. **Phase 4: Paddle 결제 연동**
   - Paddle Product 생성 ($0.50, quantity variable)
   - Checkout 페이지 생성 (/checkout/credit)
   - Webhook 핸들러 구현

5. **Phase 5: UI 구현**
   - Pricing 페이지에 크레딧 섹션 추가
   - 대시보드 사용량 표시 수정
   - 마이페이지 크레딧 잔액 추가

6. **Phase 6: 테스트 및 배포**
   - 단위 테스트 (차감 로직, 동시성)
   - 통합 테스트 (Paddle webhook)
   - Staging 배포 → 검증 → Production 배포

---

## 향후 확장 가능성

### 1. 크레딧 만료 정책 (Optional)
- 현재는 영구 보관
- 필요 시 `expires_at` 필드 추가 가능

### 2. 크레딧 선물/양도 (Optional)
- 다른 유저에게 크레딧 전송 기능

### 3. 대량 구매 할인 (Optional)
- Paddle의 quantity discount 기능 활용
- 예: 50개 이상 구매 시 10% 할인

### 4. 크레딧 환불 정책 (Optional)
- 미사용 크레딧 환불 처리

---

## 참고 자료

- 기존 월 한도 시스템: `monthly_usage` 테이블, `subscription_plans` 테이블
- Paddle 결제 연동: `app/actions/subscription-actions.ts`
- 문서 생성 로직: `app/actions/document-actions.ts`
- 발행 로직: `app/actions/publication-actions.ts`

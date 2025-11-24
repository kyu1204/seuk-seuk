# Credit System Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 월 문서 생성/발행 한도를 초과한 사용자가 크레딧을 충전하여 추가 문서를 생성/발행할 수 있는 시스템 구현

**Architecture:**
- Database: credit_balance (잔액), credit_transactions (이력) 테이블 생성
- Business Logic: 월 한도 우선 사용 → 크레딧 차감 순서
- Payment: Paddle을 통한 크레딧 충전 ($0.50/개, 수량 1~100)

**Tech Stack:** Next.js 14, Supabase (PostgreSQL), Paddle, TypeScript

---

## Task 1: Database Migration - credit_balance 테이블 생성

**Files:**
- Create: Supabase migration via MCP

**Step 1: credit_balance 테이블 생성**

```sql
CREATE TABLE credit_balance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  create_credits INTEGER NOT NULL DEFAULT 0,
  publish_credits INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);
```

Execute via Supabase MCP:
```typescript
mcp__supabase__apply_migration({
  name: "create_credit_balance_table",
  query: "CREATE TABLE credit_balance ..."
})
```

**Step 2: 인덱스 생성**

```sql
CREATE INDEX idx_credit_balance_user_id ON credit_balance(user_id);
```

**Step 3: RLS 정책 적용**

```sql
ALTER TABLE credit_balance ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own credit balance"
  ON credit_balance FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage credits"
  ON credit_balance FOR ALL
  USING (auth.role() = 'service_role');
```

**Step 4: 테스트 - 테이블 생성 확인**

Execute:
```typescript
mcp__supabase__list_tables({ schemas: ['public'] })
```

Expected: credit_balance 테이블이 목록에 포함

**Step 5: Commit**

```bash
git add .
git commit -m "feat: add credit_balance table with RLS policies"
```

---

## Task 2: Database Migration - credit_transactions 테이블 생성

**Files:**
- Create: Supabase migration via MCP

**Step 1: credit_transactions 테이블 생성**

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
```

Execute via Supabase MCP.

**Step 2: 인덱스 생성**

```sql
CREATE INDEX idx_credit_transactions_user_id ON credit_transactions(user_id);
CREATE INDEX idx_credit_transactions_created_at ON credit_transactions(created_at DESC);
CREATE INDEX idx_credit_transactions_paddle_id ON credit_transactions(paddle_transaction_id) WHERE paddle_transaction_id IS NOT NULL;
```

**Step 3: RLS 정책 적용**

```sql
ALTER TABLE credit_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own transactions"
  ON credit_transactions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can insert transactions"
  ON credit_transactions FOR INSERT
  WITH CHECK (auth.role() = 'service_role');
```

**Step 4: 테스트 - 테이블 생성 확인**

Execute:
```typescript
mcp__supabase__list_tables({ schemas: ['public'] })
```

Expected: credit_transactions 테이블이 목록에 포함

**Step 5: Commit**

```bash
git add .
git commit -m "feat: add credit_transactions table with RLS policies"
```

---

## Task 3: Database Function - deduct_credit_atomic 생성

**Files:**
- Create: Supabase migration via MCP

**Step 1: deduct_credit_atomic 함수 생성**

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

  IF current_balance IS NULL OR current_balance < 1 THEN
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
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

Execute via Supabase MCP.

**Step 2: 테스트 - 함수 생성 확인**

Execute:
```typescript
mcp__supabase__execute_sql({
  query: `
    SELECT proname, prosrc
    FROM pg_proc
    WHERE proname = 'deduct_credit_atomic';
  `
})
```

Expected: deduct_credit_atomic 함수가 존재

**Step 3: Commit**

```bash
git add .
git commit -m "feat: add deduct_credit_atomic DB function for atomic credit deduction"
```

---

## Task 4: Server Actions - credit-actions.ts 생성

**Files:**
- Create: `app/actions/credit-actions.ts`

**Step 1: credit-actions.ts 파일 생성**

```typescript
"use server";

import { createServerSupabase } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/service-role";

export interface CreditBalance {
  create_credits: number;
  publish_credits: number;
}

/**
 * Get current user's credit balance
 */
export async function getCreditBalance(): Promise<{
  credits?: CreditBalance;
  error?: string;
}> {
  try {
    const supabase = await createServerSupabase();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return { error: "User not authenticated" };
    }

    const { data, error } = await supabase
      .from("credit_balance")
      .select("create_credits, publish_credits")
      .eq("user_id", user.id)
      .single();

    if (error) {
      // 레코드가 없는 경우 0으로 반환
      if (error.code === "PGRST116") {
        return {
          credits: {
            create_credits: 0,
            publish_credits: 0,
          },
        };
      }
      console.error("Get credit balance error:", error);
      return { error: "Failed to get credit balance" };
    }

    return {
      credits: {
        create_credits: data.create_credits,
        publish_credits: data.publish_credits,
      },
    };
  } catch (error) {
    console.error("Get credit balance error:", error);
    return { error: "An unexpected error occurred" };
  }
}

/**
 * Deduct credit atomically using DB function
 */
export async function deductCredit(
  type: "create" | "publish",
  documentId: string
): Promise<{ success?: boolean; error?: string }> {
  try {
    const supabase = await createServerSupabase();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return { error: "User not authenticated" };
    }

    const serviceSupabase = createServiceRoleClient();

    const { data, error } = await serviceSupabase.rpc("deduct_credit_atomic", {
      p_user_id: user.id,
      p_type: type,
      p_document_id: documentId,
    });

    if (error) {
      console.error("Deduct credit error:", error);
      if (error.message?.includes("Insufficient credits")) {
        return { error: "크레딧이 부족합니다" };
      }
      return { error: "Failed to deduct credit" };
    }

    return { success: true };
  } catch (error) {
    console.error("Deduct credit error:", error);
    return { error: "An unexpected error occurred" };
  }
}

/**
 * Add credits to user balance (called from webhook)
 */
export async function addCredits(
  userId: string,
  quantity: number,
  paddleTransactionId: string
): Promise<{ success?: boolean; error?: string }> {
  try {
    const serviceSupabase = createServiceRoleClient();

    // 1. 트랜잭션 기록
    const { error: transactionError } = await serviceSupabase
      .from("credit_transactions")
      .insert({
        user_id: userId,
        transaction_type: "purchase",
        create_credits: quantity,
        publish_credits: quantity,
        paddle_transaction_id: paddleTransactionId,
      });

    if (transactionError) {
      console.error("Credit transaction error:", transactionError);
      return { error: "Failed to record transaction" };
    }

    // 2. 잔액 업데이트 (upsert)
    const { data: existing } = await serviceSupabase
      .from("credit_balance")
      .select("create_credits, publish_credits")
      .eq("user_id", userId)
      .single();

    const newCreateCredits = (existing?.create_credits || 0) + quantity;
    const newPublishCredits = (existing?.publish_credits || 0) + quantity;

    const { error: balanceError } = await serviceSupabase
      .from("credit_balance")
      .upsert(
        {
          user_id: userId,
          create_credits: newCreateCredits,
          publish_credits: newPublishCredits,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id" }
      );

    if (balanceError) {
      console.error("Credit balance error:", balanceError);
      return { error: "Failed to update balance" };
    }

    return { success: true };
  } catch (error) {
    console.error("Add credits error:", error);
    return { error: "An unexpected error occurred" };
  }
}
```

**Step 2: lib/supabase/service-role.ts 생성 (service role client)**

```typescript
import { createClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";

export function createServiceRoleClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceRoleKey) {
    throw new Error("Missing Supabase service role credentials");
  }

  return createClient<Database>(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
```

**Step 3: 타입 정의 업데이트 - database.types.ts**

Supabase CLI로 타입 재생성:
```bash
npx supabase gen types typescript --project-id <project-id> > lib/supabase/database.types.ts
```

또는 MCP 사용:
```typescript
mcp__supabase__generate_typescript_types()
```

**Step 4: 테스트 - 수동 테스트**

브라우저에서:
1. 로그인
2. 개발자 도구 콘솔에서 getCreditBalance() 호출
3. 0/0 반환 확인

**Step 5: Commit**

```bash
git add app/actions/credit-actions.ts lib/supabase/service-role.ts lib/supabase/database.types.ts
git commit -m "feat: add credit actions for balance/deduction/addition"
```

---

## Task 5: subscription-actions.ts 수정 - 크레딧 포함 한도 체크

**Files:**
- Modify: `app/actions/subscription-actions.ts`

**Step 1: canCreateDocument 함수 수정**

기존 함수 찾기 (약 257번째 줄):
```typescript
export async function canCreateDocument(): Promise<{
  canCreate: boolean;
  reason?: string;
  error?: string;
}>
```

아래와 같이 수정:

```typescript
import { getCreditBalance } from "./credit-actions";

export async function canCreateDocument(): Promise<{
  canCreate: boolean;
  usingCredit?: boolean;
  reason?: string;
  error?: string;
}> {
  try {
    const supabase = await createServerSupabase();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return { canCreate: false, error: "User not authenticated" };
    }

    // Get current usage and plan limits
    const { limits, error: limitsError } = await getUsageLimits();
    if (limitsError || !limits) {
      return { canCreate: false, error: limitsError || "Failed to get limits" };
    }

    // Check monthly limit first
    if (limits.canCreateNew) {
      return { canCreate: true, usingCredit: false };
    }

    // If monthly limit reached, check credits
    const { credits, error: creditsError } = await getCreditBalance();
    if (creditsError) {
      return { canCreate: false, error: creditsError };
    }

    if (credits && credits.create_credits > 0) {
      return { canCreate: true, usingCredit: true };
    }

    return {
      canCreate: false,
      reason: "월 문서 생성 한도 및 크레딧 모두 소진",
    };
  } catch (error) {
    console.error("Can create document error:", error);
    return { canCreate: false, error: "An unexpected error occurred" };
  }
}
```

**Step 2: canCreatePublication 함수 수정**

기존 함수 찾기 및 수정:

```typescript
export async function canCreatePublication(
  documentCount: number
): Promise<{
  canCreate: boolean;
  reason?: string;
  error?: string;
}> {
  try {
    const supabase = await createServerSupabase();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return { canCreate: false, error: "User not authenticated" };
    }

    // Get current usage and plan limits
    const { limits, error: limitsError } = await getUsageLimits();
    if (limitsError || !limits) {
      return { canCreate: false, error: limitsError || "Failed to get limits" };
    }

    // Calculate total available (monthly + credits)
    const { credits, error: creditsError } = await getCreditBalance();
    if (creditsError) {
      return { canCreate: false, error: creditsError };
    }

    const monthlyRemaining =
      limits.activeDocumentLimit === -1
        ? Infinity
        : limits.activeDocumentLimit - limits.currentActiveDocuments;

    const totalAvailable =
      monthlyRemaining === Infinity
        ? Infinity
        : monthlyRemaining + (credits?.publish_credits || 0);

    if (totalAvailable >= documentCount) {
      return { canCreate: true };
    }

    return {
      canCreate: false,
      reason: `${documentCount}개 발행 불가 (사용 가능: ${totalAvailable}개)`,
    };
  } catch (error) {
    console.error("Can create publication error:", error);
    return { canCreate: false, error: "An unexpected error occurred" };
  }
}
```

**Step 3: 테스트 - 로직 확인**

수동 테스트:
1. 월 한도 도달한 계정 준비
2. 크레딧 0개 상태에서 canCreateDocument() 호출 → canCreate: false
3. 크레딧 1개 추가
4. canCreateDocument() 호출 → canCreate: true, usingCredit: true

**Step 4: Commit**

```bash
git add app/actions/subscription-actions.ts
git commit -m "feat: update subscription actions to check credits when monthly limit reached"
```

---

## Task 6: document-actions.ts 수정 - 크레딧 차감 로직 추가

**Files:**
- Modify: `app/actions/document-actions.ts`

**Step 1: uploadDocument 함수 수정**

기존 함수 찾기 (약 22번째 줄):

```typescript
export async function uploadDocument(formData: FormData) {
```

canCreateDocument 호출 부분 수정 (약 42~49번째 줄):

```typescript
// 기존:
const { canCreate, reason, error: limitError } = await canCreateDocument();

// 수정:
const { canCreate, usingCredit, reason, error: limitError } = await canCreateDocument();
```

incrementDocumentCreated 호출 부분 수정 (약 89~94번째 줄):

```typescript
// 기존:
const { success: usageUpdated, error: usageError } = await incrementDocumentCreated();
if (!usageUpdated || usageError) {
  console.error("Failed to update usage:", usageError);
  // Don't fail the entire operation, just log the error
}

// 수정:
import { deductCredit } from "./credit-actions";

if (usingCredit) {
  // 크레딧 차감
  const { success, error: creditError } = await deductCredit("create", document.id);
  if (!success || creditError) {
    console.error("Failed to deduct credit:", creditError);
    // Rollback: delete document
    await supabase.from("documents").delete().eq("id", document.id);
    await supabase.storage.from("documents").remove([filePath]);
    return { error: "크레딧 차감 실패" };
  }
} else {
  // 월 한도 차감
  const { success: usageUpdated, error: usageError } = await incrementDocumentCreated();
  if (!usageUpdated || usageError) {
    console.error("Failed to update usage:", usageError);
    // Don't fail the entire operation, just log the error
  }
}
```

**Step 2: 테스트 - 문서 생성 및 크레딧 차감**

수동 테스트:
1. 월 한도 도달 상태
2. 크레딧 5개 보유
3. 문서 생성
4. credit_balance에서 create_credits가 4개로 감소 확인
5. credit_transactions에 use_create 기록 확인

**Step 3: Commit**

```bash
git add app/actions/document-actions.ts
git commit -m "feat: add credit deduction logic to document upload"
```

---

## Task 7: publication-actions.ts 수정 - 발행 시 크레딧 차감

**Files:**
- Modify: `app/actions/publication-actions.ts`

**Step 1: createPublication 함수 수정**

기존 함수 찾기 (약 20번째 줄):

canCreatePublication 호출 부분 수정 (약 64~70번째 줄):

```typescript
// 기존:
const { canCreatePublication } = await import("./subscription-actions");
const { canCreate, reason, error: limitError } = await canCreatePublication(documentIds.length);

// 수정: 그대로 유지 (canCreatePublication은 이미 Task 5에서 수정됨)
```

문서 status 업데이트 후 크레딧 차감 로직 추가 (약 116번째 줄 이후):

```typescript
import { deductCredit } from "./credit-actions";
import { getUsageLimits } from "./subscription-actions";

// ... (기존 문서 status 업데이트 코드)

// Note: monthly_usage.published_completed_count is automatically updated by
// the database trigger (trigger_document_status_change) when document status changes

// ADDED: 크레딧 차감 로직
const { limits } = await getUsageLimits();
const monthlyRemaining = limits?.activeDocumentLimit === -1
  ? Infinity
  : (limits?.activeDocumentLimit || 0) - (limits?.currentActiveDocuments || 0);

let creditsToDeduct = 0;
if (monthlyRemaining < documentIds.length) {
  if (monthlyRemaining === Infinity) {
    creditsToDeduct = 0;
  } else {
    creditsToDeduct = documentIds.length - monthlyRemaining;
  }
}

// Deduct credits if needed
for (let i = 0; i < creditsToDeduct; i++) {
  const { success, error: creditError } = await deductCredit("publish", documentIds[i]);
  if (!success || creditError) {
    console.error("Failed to deduct publish credit:", creditError);
    // Don't rollback entire publication, just log error
  }
}

revalidatePath("/dashboard");
revalidatePath("/publish");
```

**Step 2: 테스트 - 발행 시 크레딧 차감**

수동 테스트:
1. 월 한도: 15/15 (도달)
2. 크레딧: 5개 보유
3. 문서 3개 발행
4. credit_balance에서 publish_credits가 2개로 감소 (5-3=2)
5. credit_transactions에 use_publish 기록 3개 확인

**Step 3: Commit**

```bash
git add app/actions/publication-actions.ts
git commit -m "feat: add credit deduction logic to publication creation"
```

---

## Task 8: Paddle 크레딧 Product 설정 및 Checkout 페이지

**Files:**
- Modify: `lib/paddle/pricing-config.ts`
- Create: `app/(billing)/checkout/credit/page.tsx`

**Step 1: pricing-config.ts에 크레딧 Product ID 추가**

```typescript
// 기존 PADDLE_PRICE_TIERS 아래에 추가
export const PADDLE_CREDIT_PRICE_ID = "pri_01xxxxxxxxxxxxxxxxxxxxx"; // Paddle에서 생성 후 입력
```

**Step 2: Checkout 페이지 생성**

```typescript
"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { initializePaddle, Paddle, Environments } from "@paddle/paddle-js";
import { PADDLE_CREDIT_PRICE_ID } from "@/lib/paddle/pricing-config";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default function CreditCheckoutPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const quantity = parseInt(searchParams.get("quantity") || "5");
  const [paddle, setPaddle] = useState<Paddle>();

  useEffect(() => {
    if (
      process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN &&
      process.env.NEXT_PUBLIC_PADDLE_ENV
    ) {
      initializePaddle({
        token: process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN,
        environment: process.env.NEXT_PUBLIC_PADDLE_ENV as Environments,
      }).then((paddleInstance) => {
        if (paddleInstance) {
          setPaddle(paddleInstance);
        }
      });
    }
  }, []);

  const handleCheckout = () => {
    if (!paddle) return;

    paddle.Checkout.open({
      items: [
        {
          priceId: PADDLE_CREDIT_PRICE_ID,
          quantity,
        },
      ],
      customData: {
        type: "credit",
        quantity: quantity.toString(),
      },
    });
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-md mx-auto">
        <Button
          variant="ghost"
          onClick={() => router.back()}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          돌아가기
        </Button>

        <div className="bg-card border rounded-lg p-6">
          <h1 className="text-2xl font-bold mb-4">크레딧 충전</h1>

          <div className="space-y-4 mb-6">
            <div className="flex justify-between">
              <span className="text-muted-foreground">수량</span>
              <span className="font-medium">{quantity} 크레딧</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">단가</span>
              <span className="font-medium">$0.50</span>
            </div>
            <div className="border-t pt-4 flex justify-between">
              <span className="font-bold">총 금액</span>
              <span className="font-bold text-lg">${(quantity * 0.5).toFixed(2)}</span>
            </div>
          </div>

          <div className="bg-muted p-3 rounded mb-6">
            <p className="text-sm text-muted-foreground">
              받게 될 크레딧: 문서 생성 {quantity}개 + 문서 발행 {quantity}개
            </p>
          </div>

          <Button
            className="w-full"
            onClick={handleCheckout}
            disabled={!paddle}
          >
            {paddle ? "결제하기" : "로딩 중..."}
          </Button>
        </div>
      </div>
    </div>
  );
}
```

**Step 3: 테스트 - Checkout 페이지 접근**

브라우저:
1. `/checkout/credit?quantity=5` 접근
2. 수량 5개, 총 금액 $2.50 표시 확인
3. (실제 결제는 Paddle sandbox에서 테스트)

**Step 4: Commit**

```bash
git add lib/paddle/pricing-config.ts app/(billing)/checkout/credit/page.tsx
git commit -m "feat: add credit checkout page with Paddle integration"
```

---

## Task 9: Paddle Webhook 핸들러 추가

**Files:**
- Modify: `app/api/webhooks/paddle/route.ts` (존재 시) 또는 Create

**Step 1: Webhook 핸들러 생성/수정**

```typescript
import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { addCredits } from "@/app/actions/credit-actions";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const headersList = headers();

    // Paddle Signature 검증 (필수)
    const signature = headersList.get("paddle-signature");
    if (!signature) {
      return NextResponse.json({ error: "Missing signature" }, { status: 401 });
    }

    // TODO: Paddle signature 검증 로직 추가
    // https://developer.paddle.com/webhooks/verify-webhooks

    const eventType = body.event_type;

    // 크레딧 구매 완료 이벤트
    if (eventType === "transaction.completed") {
      const customData = body.data.custom_data;

      if (customData?.type === "credit") {
        const userId = body.data.customer_id; // Paddle customer ID → user mapping 필요
        const quantity = parseInt(customData.quantity);
        const transactionId = body.data.id;

        // TODO: Paddle customer ID → Supabase user ID 매핑 로직
        // 현재는 custom_data에 user_id 포함 가정
        const supabaseUserId = customData.user_id;

        const { success, error } = await addCredits(
          supabaseUserId,
          quantity,
          transactionId
        );

        if (error) {
          console.error("Failed to add credits:", error);
          return NextResponse.json({ error }, { status: 500 });
        }

        return NextResponse.json({ success: true });
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });
  }
}
```

**Step 2: 테스트 - Webhook 수신 확인**

Paddle Sandbox에서 테스트 webhook 전송:
1. 로컬에서 ngrok 실행: `ngrok http 3000`
2. Paddle Dashboard에 webhook URL 등록
3. 테스트 이벤트 전송
4. 콘솔 로그 확인

**Step 3: Commit**

```bash
git add app/api/webhooks/paddle/route.ts
git commit -m "feat: add Paddle webhook handler for credit purchases"
```

---

## Task 10: Pricing 페이지에 크레딧 섹션 추가

**Files:**
- Modify: `app/(billing)/pricing/components/PricingPage.tsx`

**Step 1: useState 추가 (크레딧 수량)**

```typescript
// 기존 useState 아래에 추가 (약 34번째 줄)
const [creditQuantity, setCreditQuantity] = useState(5);
```

**Step 2: 크레딧 섹션 추가 (기존 플랜 카드 아래)**

약 453번째 줄 (`</div>` 이전) 아래에 추가:

```typescript
{/* Credit Section */}
<div className="mt-16 border-t pt-16">
  <div className="text-center mb-8">
    <h2 className="text-3xl font-bold mb-2">
      {t("pricing.credit.title", "추가 크레딧")}
    </h2>
    <p className="text-muted-foreground">
      {t("pricing.credit.description", "월 한도 초과 시 필요한 만큼만 구매하세요")}
    </p>
  </div>

  <Card className="max-w-md mx-auto">
    <CardContent className="p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-semibold">
            {t("pricing.credit.name", "문서 크레딧")}
          </h3>
          <p className="text-sm text-muted-foreground">
            {t("pricing.credit.unit", "1 크레딧 = 생성 1개 + 발행 1개")}
          </p>
        </div>
        <Badge>$0.50 / {t("pricing.credit.per", "개")}</Badge>
      </div>

      <div className="space-y-4">
        <div>
          <Label htmlFor="creditQuantity">
            {t("pricing.credit.quantity", "수량")} (1~100)
          </Label>
          <Input
            id="creditQuantity"
            type="number"
            min="1"
            max="100"
            value={creditQuantity}
            onChange={(e) => setCreditQuantity(Math.min(100, Math.max(1, parseInt(e.target.value) || 1)))}
            className="mt-2"
          />
        </div>

        <div className="bg-muted p-3 rounded space-y-1">
          <div className="flex justify-between text-sm">
            <span>{t("pricing.credit.total", "총 금액")}</span>
            <span className="font-bold">${(creditQuantity * 0.5).toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">
              {t("pricing.credit.receive", "받는 크레딧")}
            </span>
            <span>
              {t("pricing.credit.breakdown", "생성 {{count}}개 + 발행 {{count}}개", { count: creditQuantity })}
            </span>
          </div>
        </div>

        <Button
          className="w-full"
          onClick={() => router.push(`/checkout/credit?quantity=${creditQuantity}`)}
        >
          {t("pricing.credit.purchase", "크레딧 충전하기")}
        </Button>
      </div>
    </CardContent>
  </Card>
</div>
```

**Step 3: import 추가**

파일 상단에 추가:

```typescript
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
```

**Step 4: 테스트 - Pricing 페이지 확인**

브라우저:
1. `/pricing` 접근
2. 크레딧 섹션 표시 확인
3. 수량 변경 시 총 금액 업데이트 확인
4. "크레딧 충전하기" 버튼 클릭 → `/checkout/credit?quantity=5` 이동 확인

**Step 5: Commit**

```bash
git add app/(billing)/pricing/components/PricingPage.tsx
git commit -m "feat: add credit purchase section to pricing page"
```

---

## Task 11: 대시보드에 크레딧 표시 및 충전 유도

**Files:**
- Modify: `app/(dashboard)/dashboard/page.tsx` 또는 관련 컴포넌트

**Step 1: getCreditBalance 호출 추가**

대시보드 데이터 fetching 부분에 추가:

```typescript
import { getCreditBalance } from "@/app/actions/credit-actions";

// 기존 데이터 fetch와 함께
const [credits, setCredits] = useState({ create_credits: 0, publish_credits: 0 });

useEffect(() => {
  async function fetchData() {
    // 기존 fetch 로직...

    // 크레딧 조회
    const { credits: creditData } = await getCreditBalance();
    if (creditData) {
      setCredits(creditData);
    }
  }
  fetchData();
}, []);
```

**Step 2: 사용량 표시 수정**

```typescript
{/* 문서 생성 */}
<div className="flex justify-between mb-2">
  <span>문서 생성</span>
  <span className="font-medium">
    {usage.documents_created} / {limits.monthlyLimit}
    {credits.create_credits > 0 && (
      <span className="text-primary ml-1">
        (+{credits.create_credits}개 보유)
      </span>
    )}
  </span>
</div>
<Progress value={(usage.documents_created / limits.monthlyLimit) * 100} />

{/* 한도 도달 시 알림 */}
{usage.documents_created >= limits.monthlyLimit && credits.create_credits === 0 && (
  <Alert className="mt-2">
    <AlertCircle className="h-4 w-4" />
    <AlertDescription>
      월 문서 생성 한도 도달
      <Button
        variant="link"
        size="sm"
        className="ml-2"
        onClick={() => router.push("/pricing#credit")}
      >
        <Coins className="mr-1 h-3 w-3" />
        크레딧 충전하기 →
      </Button>
    </AlertDescription>
  </Alert>
)}
```

**Step 3: import 추가**

```typescript
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Coins } from "lucide-react";
```

**Step 4: 테스트 - 대시보드 표시 확인**

브라우저:
1. 대시보드 접근
2. 크레딧 보유 시 "+5개 보유" 표시 확인
3. 월 한도 도달 시 충전 유도 알림 표시 확인

**Step 5: Commit**

```bash
git add app/(dashboard)/dashboard/page.tsx
git commit -m "feat: show credit balance and prompt for recharge on dashboard"
```

---

## Task 12: 마이페이지에 크레딧 잔액 표시

**Files:**
- Modify: 마이페이지 관련 컴포넌트

**Step 1: 크레딧 잔액 카드 추가**

```typescript
import { getCreditBalance } from "@/app/actions/credit-actions";

// ... (기존 코드)

<Card>
  <CardHeader>
    <CardTitle className="text-sm">보유 크레딧</CardTitle>
  </CardHeader>
  <CardContent>
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <span className="text-muted-foreground">생성 가능</span>
        <span className="text-2xl font-bold">{credits.create_credits}개</span>
      </div>
      <div className="flex justify-between items-center">
        <span className="text-muted-foreground">발행 가능</span>
        <span className="text-2xl font-bold">{credits.publish_credits}개</span>
      </div>
    </div>
    <Button
      variant="outline"
      className="w-full mt-4"
      onClick={() => router.push("/pricing#credit")}
    >
      <Coins className="mr-2 h-4 w-4" />
      크레딧 충전
    </Button>
  </CardContent>
</Card>
```

**Step 2: import 추가**

```typescript
import { Coins } from "lucide-react";
```

**Step 3: 테스트 - 마이페이지 표시 확인**

브라우저:
1. 마이페이지 접근
2. 크레딧 잔액 카드 표시 확인
3. 충전 버튼 클릭 → pricing 페이지 이동 확인

**Step 4: Commit**

```bash
git add <mypage-component-path>
git commit -m "feat: display credit balance on my page"
```

---

## Task 13: 국제화(i18n) - 크레딧 관련 번역 추가

**Files:**
- Modify: `contexts/language-context.tsx` 또는 번역 파일

**Step 1: 한국어 번역 추가**

```typescript
pricing: {
  credit: {
    title: "추가 크레딧",
    description: "월 한도 초과 시 필요한 만큼만 구매하세요",
    name: "문서 크레딧",
    unit: "1 크레딧 = 생성 1개 + 발행 1개",
    per: "개",
    quantity: "수량",
    total: "총 금액",
    receive: "받는 크레딧",
    breakdown: "생성 {{count}}개 + 발행 {{count}}개",
    purchase: "크레딧 충전하기",
  },
},
dashboard: {
  creditBalance: "+{{count}}개 보유",
  monthlyLimitReached: "월 문서 생성 한도 도달",
  rechargePrompt: "크레딧 충전하기 →",
},
mypage: {
  creditTitle: "보유 크레딧",
  createAvailable: "생성 가능",
  publishAvailable: "발행 가능",
  rechargeButton: "크레딧 충전",
},
```

**Step 2: 영어 번역 추가**

```typescript
pricing: {
  credit: {
    title: "Additional Credits",
    description: "Buy only what you need when you exceed monthly limits",
    name: "Document Credits",
    unit: "1 credit = 1 create + 1 publish",
    per: "each",
    quantity: "Quantity",
    total: "Total",
    receive: "Credits to receive",
    breakdown: "Create {{count}} + Publish {{count}}",
    purchase: "Purchase Credits",
  },
},
dashboard: {
  creditBalance: "+{{count}} available",
  monthlyLimitReached: "Monthly document creation limit reached",
  rechargePrompt: "Recharge credits →",
},
mypage: {
  creditTitle: "Available Credits",
  createAvailable: "Create Available",
  publishAvailable: "Publish Available",
  rechargeButton: "Recharge Credits",
},
```

**Step 3: 테스트 - 언어 전환**

브라우저:
1. 한국어로 모든 페이지 확인
2. 영어로 전환 후 모든 페이지 확인
3. 번역 누락 확인

**Step 4: Commit**

```bash
git add contexts/language-context.tsx
git commit -m "feat: add i18n translations for credit system"
```

---

## Task 14: 환경 변수 설정 안내

**Files:**
- Modify: `.env.example` (선택)

**Step 1: .env.example 업데이트**

```bash
# Supabase Service Role Key (for credit operations)
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# Paddle Credit Product
PADDLE_CREDIT_PRICE_ID=pri_01xxxxxxxxxxxxxxxxxxxxx
```

**Step 2: 실제 .env.local 설정**

1. Supabase Dashboard → Settings → API → service_role key 복사
2. `.env.local`에 추가
3. Paddle Dashboard에서 크레딧 Product 생성 후 Price ID 복사
4. `lib/paddle/pricing-config.ts`의 PADDLE_CREDIT_PRICE_ID 업데이트

**Step 3: Commit**

```bash
git add .env.example
git commit -m "docs: add environment variables for credit system"
```

---

## Task 15: 통합 테스트 및 검증

**Files:**
- N/A (Manual Testing)

**Step 1: 엔드투엔드 플로우 테스트**

시나리오 1: 무료 유저 → 크레딧 충전 → 문서 생성
1. 무료 계정 (3개 한도)
2. 문서 3개 생성 → 월 한도 도달
3. 크레딧 5개 충전 ($2.50)
4. 문서 1개 생성 → 크레딧 4개 남음
5. credit_transactions 확인

시나리오 2: Starter 유저 → 발행 한도 도달 → 크레딧 사용
1. Starter 계정 (15개 한도)
2. 문서 15개 생성 및 발행
3. 크레딧 10개 충전 ($5)
4. 문서 5개 발행 → 크레딧 5개 남음
5. DB 확인

**Step 2: 동시성 테스트**

1. 크레딧 1개 남은 상태
2. 동시에 2개 문서 생성 시도
3. 1개만 성공, 1개는 "Insufficient credits" 에러

**Step 3: Webhook 테스트**

1. Paddle Sandbox에서 결제
2. Webhook 수신 확인
3. credit_balance 업데이트 확인
4. credit_transactions 기록 확인

**Step 4: UI/UX 테스트**

1. 모든 페이지에서 크레딧 표시 확인
2. 한국어/영어 전환 확인
3. 모바일 반응형 확인

**Step 5: 검증 완료 후 Commit**

```bash
git add .
git commit -m "test: verify end-to-end credit system functionality"
```

---

## 완료 체크리스트

- [ ] Task 1: credit_balance 테이블 생성
- [ ] Task 2: credit_transactions 테이블 생성
- [ ] Task 3: deduct_credit_atomic DB function 생성
- [ ] Task 4: credit-actions.ts 생성
- [ ] Task 5: subscription-actions.ts 크레딧 체크 추가
- [ ] Task 6: document-actions.ts 크레딧 차감 추가
- [ ] Task 7: publication-actions.ts 크레딧 차감 추가
- [ ] Task 8: 크레딧 Checkout 페이지 생성
- [ ] Task 9: Paddle Webhook 핸들러 추가
- [ ] Task 10: Pricing 페이지 크레딧 섹션 추가
- [ ] Task 11: 대시보드 크레딧 표시
- [ ] Task 12: 마이페이지 크레딧 표시
- [ ] Task 13: i18n 번역 추가
- [ ] Task 14: 환경 변수 설정
- [ ] Task 15: 통합 테스트 및 검증

---

## 참고 사항

1. **Paddle Product 생성**: Task 8 전에 Paddle Dashboard에서 크레딧 Product를 먼저 생성해야 합니다.
2. **Service Role Key**: 크레딧 차감은 RLS를 우회해야 하므로 service_role key 필수
3. **Webhook URL**: 프로덕션 배포 후 Paddle에 webhook URL 등록
4. **테스트 데이터**: 개발 중 Supabase에 테스트 크레딧 수동 삽입 가능

```sql
-- 테스트 크레딧 추가
INSERT INTO credit_balance (user_id, create_credits, publish_credits)
VALUES ('your-user-id', 10, 10)
ON CONFLICT (user_id) DO UPDATE
SET create_credits = 10, publish_credits = 10;
```

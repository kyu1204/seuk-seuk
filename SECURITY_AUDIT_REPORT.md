# 🔒 SeukSeuk 보안 전수조사 종합 보고서

## 📊 요약

**조사 일자**: 2025-09-30
**조사 범위**: 인증/인가, 입력 검증, RLS 정책, 파일 업로드, XSS, 민감 정보 노출
**총 발견 취약점**: **16개**
**보안 등급**: **F (매우 위험)** - 즉각 조치 필요

### 심각도별 분류
- 🚨 **CRITICAL**: 4개 (즉시 조치)
- 🔴 **HIGH**: 2개 (24시간 내)
- 🟡 **MEDIUM**: 7개 (1주일 내)
- 🟢 **LOW**: 3개 (개선 권장)

---

## 🚨 CRITICAL - 즉각 조치 필요

### #13-14: RLS 정책 완전 공개 (최고 심각도)
**위치**: Supabase documents, signatures 테이블
**영향**: 인증되지 않은 사용자도 모든 데이터 CRUD 가능
**공격 시나리오**:
- 모든 사용자의 문서 목록 조회
- 타인의 문서 삭제/수정
- 타인의 서명 데이터 조회/위조
- 패스워드 해시 접근

**즉시 수정 방법**:
```sql
-- documents 테이블의 위험한 정책 삭제
DROP POLICY "Allow public delete" ON documents;
DROP POLICY "Allow public insert" ON documents;
DROP POLICY "Allow public read access" ON documents;
DROP POLICY "Allow public update" ON documents;

-- signatures 테이블의 위험한 정책 삭제
DROP POLICY "Allow public insert" ON signatures;
DROP POLICY "Allow public read access" ON signatures;
DROP POLICY "Allow public update" ON signatures;
```

**올바른 정책** (이미 존재하는 "Users can..." 정책만 유지):
- ✅ "Users can read their own documents"
- ✅ "Users can insert their own documents"
- ✅ "Users can update their own documents"
- ✅ "Users can delete their own documents"

---

### #4: 파일 타입 검증 부재
**위치**: `app/actions/document-actions.ts:29-35`
**영향**: 악성 파일 업로드 → XSS, 원격 코드 실행

**수정 코드**:
```typescript
// uploadDocument 함수 시작 부분에 추가
export async function uploadDocument(formData: FormData) {
  try {
    const supabase = await createServerSupabase();
    const file = formData.get("file") as File;
    const filename = formData.get("filename") as string;

    if (!file || !filename) {
      return { error: "File and filename are required" };
    }

    // 🔒 파일 타입 검증 추가
    const allowedTypes = [
      'application/pdf',
      'image/jpeg',
      'image/png',
      'image/webp'
    ];

    if (!allowedTypes.includes(file.type)) {
      return { error: "Invalid file type. Only PDF and images allowed." };
    }

    // 🔒 파일 크기 제한 (10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return { error: "File too large. Maximum size is 10MB." };
    }

    // 🔒 파일 확장자 검증
    const allowedExtensions = ['pdf', 'jpg', 'jpeg', 'png', 'webp'];
    const fileExtension = file.name.split(".").pop()?.toLowerCase() || "";
    if (!allowedExtensions.includes(fileExtension)) {
      return { error: "Invalid file extension." };
    }

    // 기존 코드 계속...
```

---

### #5: saveSignature 권한 검증 부재
**위치**: `app/actions/document-actions.ts:195-231`
**영향**: documentId만 알면 누구나 서명 가능

**수정 코드**:
```typescript
export async function saveSignature(
  documentId: string,
  areaIndex: number,
  signatureData: string
) {
  try {
    const supabase = await createServerSupabase();

    // 🔒 서명 권한 검증 추가
    const { data: signature, error: sigError } = await supabase
      .from("signatures")
      .select("id, document_id, documents!inner(short_url, status, expires_at)")
      .eq("document_id", documentId)
      .eq("area_index", areaIndex)
      .single();

    if (sigError || !signature) {
      return { error: "Signature area not found" };
    }

    const document = signature.documents as any;

    // 문서 상태 검증
    if (document.status === "completed") {
      return { error: "Document already completed" };
    }

    // 만료 확인
    if (document.expires_at && new Date(document.expires_at) < new Date()) {
      return { error: "Document expired" };
    }

    // 기존 update 로직 계속...
```

---

## 🔴 HIGH - 24시간 내 조치

### #1: Rate Limiting 부재
**위치**: `lib/supabase/middleware.ts`
**영향**: Brute force 공격, credential stuffing

**수정 방법** (Upstash Redis 사용):
```typescript
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, "10 s"),
  analytics: true,
});

export async function updateSession(request: NextRequest) {
  // Rate limiting 추가
  const identifier = request.ip ?? "anonymous";
  const { success } = await ratelimit.limit(identifier);

  if (!success) {
    return new NextResponse("Too Many Requests", {
      status: 429,
      headers: { "Retry-After": "10" }
    });
  }

  // 기존 코드 계속...
}
```

---

### #6: 파일 크기 제한 부재
**위치**: `app/actions/document-actions.ts`
**영향**: DoS 공격, 스토리지 남용

**수정**: 위의 #4 수정 코드에 포함됨

---

## 🟡 MEDIUM - 1주일 내 조치

### #2: 명시적 CSRF 보호 부재
**참고**: Next.js 14 Server Actions는 내부적으로 origin 검증 있음
**권장**: 중요 작업(삭제, 결제)에 추가 토큰 검증

```typescript
// 추가 CSRF 토큰 검증 (선택적)
import { cookies } from "next/headers";

export async function deleteDocument(documentId: string, csrfToken: string) {
  const cookieStore = cookies();
  const storedToken = cookieStore.get("csrf-token")?.value;

  if (!storedToken || storedToken !== csrfToken) {
    return { error: "Invalid CSRF token" };
  }

  // 기존 로직...
}
```

---

### #7: shortUrl 충돌 가능성
**위치**: `app/actions/document-actions.ts:19-21`
**영향**: URL 중복으로 문서 접근 오류

**수정 코드**:
```typescript
import { nanoid } from 'nanoid';

function generateShortUrl(): string {
  return nanoid(10); // 충돌 확률 극히 낮음
}

// 또는 중복 체크 루프
async function generateShortUrl(supabase: any): Promise<string> {
  let attempts = 0;
  while (attempts < 5) {
    const url = Math.random().toString(36).substring(2, 15);
    const { data } = await supabase
      .from("documents")
      .select("id")
      .eq("short_url", url)
      .single();

    if (!data) return url;
    attempts++;
  }
  throw new Error("Failed to generate unique URL");
}
```

---

### #8: 패스워드 정책 부재
**위치**: `app/actions/document-actions.ts:414-418`

**수정 코드**:
```typescript
export async function publishDocument(
  documentId: string,
  password: string,
  expiresAt: string | null
) {
  // 🔒 패스워드 정책 검증
  const trimmedPassword = password.trim();
  if (trimmedPassword) {
    if (trimmedPassword.length < 8) {
      return { error: "Password must be at least 8 characters" };
    }
    // 선택적: 복잡도 요구사항
    const hasUpperCase = /[A-Z]/.test(trimmedPassword);
    const hasLowerCase = /[a-z]/.test(trimmedPassword);
    const hasNumber = /[0-9]/.test(trimmedPassword);

    if (!hasUpperCase || !hasLowerCase || !hasNumber) {
      return { error: "Password must contain uppercase, lowercase, and number" };
    }
  }

  const passwordHash = trimmedPassword
    ? await bcrypt.hash(trimmedPassword, 12)
    : null;

  // 기존 로직 계속...
}
```

---

### #9: 패스워드 brute force 방어 부재
**위치**: `app/actions/document-actions.ts:499-527`

**수정 방법**: Rate limiting + 실패 횟수 추적
```typescript
// Redis나 DB에 실패 횟수 저장
export async function verifyDocumentPassword(
  shortUrl: string,
  password: string
) {
  const supabase = await createServerSupabase();

  // 🔒 Rate limiting (Redis 사용)
  const failureKey = `pwd_fail:${shortUrl}`;
  const failures = await redis.get(failureKey) || 0;

  if (failures >= 3) {
    const ttl = await redis.ttl(failureKey);
    return {
      error: `Too many attempts. Try again in ${ttl} seconds.`,
      isValid: false
    };
  }

  const { data: document, error: docError } = await supabase
    .from("documents")
    .select("password")
    .eq("short_url", shortUrl)
    .single();

  if (docError || !document) {
    return { error: "Document not found" };
  }

  const isValid = document.password
    ? await bcrypt.compare(password, document.password)
    : false;

  if (!isValid) {
    // 실패 횟수 증가
    await redis.setex(failureKey, 300, failures + 1); // 5분 TTL
  } else {
    // 성공 시 카운터 초기화
    await redis.del(failureKey);
  }

  return { success: true, isValid };
}
```

---

### #3: 세션 타임아웃 정책 미설정
**권장**: Supabase Auth 설정에서 세션 타임아웃 명시

```typescript
// lib/supabase/server.ts에서
export async function createServerSupabase() {
  const cookieStore = cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      auth: {
        // 🔒 세션 타임아웃 설정 추가
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
      },
      cookies: {
        // 기존 코드...
      },
    }
  );
}
```

Supabase Dashboard에서 설정:
- Authentication → Settings → Session timeout: 3600 (1시간)

---

### #12: Service Role 키 남용 위험
**위치**: `lib/supabase/server.ts:33-44`
**현재 상태**: presigned URL 생성에만 사용 (적절)
**권장**: 사용 로깅 추가

```typescript
export function createServiceSupabase() {
  console.log(`[AUDIT] Service role client created at ${new Date().toISOString()}`);

  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  );
}
```

---

### #15: Storage RLS 정책 미확인
**권장**: Supabase Dashboard에서 Storage 버킷의 RLS 정책 확인 및 설정

```sql
-- documents 버킷 RLS 정책 예시
CREATE POLICY "Users can upload their own documents"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'documents' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can read their own documents"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'documents' AND
  (storage.foldername(name))[1] = auth.uid()::text
);
```

---

## 🟢 LOW - 개선 권장

### #10: 파일명 sanitization 부재
**위치**: `app/actions/document-actions.ts:30`
**참고**: 실제 저장은 UUID 사용하여 안전

**선택적 개선**:
```typescript
const sanitizedFilename = filename
  .replace(/[^\w\s.-]/gi, '') // 특수문자 제거
  .substring(0, 255); // 길이 제한
```

---

### #11: 상세 에러 로그 노출
**권장**: 프로덕션에서 console.error를 Sentry로 전환

```typescript
// 개발 환경에서만 console.error
if (process.env.NODE_ENV === 'development') {
  console.error("Upload error:", uploadError);
}

// 프로덕션에서는 Sentry
if (process.env.NODE_ENV === 'production') {
  Sentry.captureException(uploadError);
}
```

---

### #16: 파일명 XSS 가능성
**위치**: `components/document-upload.tsx:44`
**참고**: React는 자동 이스케이프하지만 명시적 sanitization 권장

**선택적 개선**:
```typescript
import DOMPurify from 'isomorphic-dompurify';

const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0];
  if (file) {
    const sanitizedName = DOMPurify.sanitize(file.name);
    setFileName(sanitizedName);
    // ...
  }
};
```

---

## 📝 즉시 실행 체크리스트

### 🚨 **최우선 (지금 즉시)**:
```bash
# 1. Supabase Dashboard에서 RLS 정책 삭제
# documents 테이블:
DROP POLICY "Allow public delete" ON documents;
DROP POLICY "Allow public insert" ON documents;
DROP POLICY "Allow public read access" ON documents;
DROP POLICY "Allow public update" ON documents;

# signatures 테이블:
DROP POLICY "Allow public insert" ON signatures;
DROP POLICY "Allow public read access" ON signatures;
DROP POLICY "Allow public update" ON signatures;
```

### 🔴 **24시간 내**:
- [ ] 파일 타입 검증 추가 (document-actions.ts)
- [ ] saveSignature 권한 검증 추가
- [ ] Rate limiting 구현 (Upstash Redis)
- [ ] 파일 크기 제한 추가

### 🟡 **1주일 내**:
- [ ] 패스워드 정책 구현
- [ ] 패스워드 brute force 방어
- [ ] shortUrl 중복 체크
- [ ] Storage RLS 정책 설정
- [ ] 세션 타임아웃 설정

---

## 🎯 보안 개선 후 예상 등급

현재: **F (매우 위험)**
→ CRITICAL 수정 후: **C (보통)**
→ 전체 수정 후: **A (우수)**

---

## 📋 전체 취약점 목록

| ID | 심각도 | 취약점 | 위치 | 상태 |
|----|--------|--------|------|------|
| #13-14 | 🚨 CRITICAL | RLS 정책 완전 공개 | Supabase documents, signatures | 미조치 |
| #4 | 🚨 CRITICAL | 파일 타입 검증 부재 | document-actions.ts:29-35 | 미조치 |
| #5 | 🚨 CRITICAL | saveSignature 권한 검증 부재 | document-actions.ts:195-231 | 미조치 |
| #1 | 🔴 HIGH | Rate Limiting 부재 | middleware.ts | 미조치 |
| #6 | 🔴 HIGH | 파일 크기 제한 부재 | document-actions.ts | 미조치 |
| #2 | 🟡 MEDIUM | 명시적 CSRF 보호 부재 | Server Actions | 미조치 |
| #7 | 🟡 MEDIUM | shortUrl 충돌 가능성 | document-actions.ts:19-21 | 미조치 |
| #8 | 🟡 MEDIUM | 패스워드 정책 부재 | document-actions.ts:414-418 | 미조치 |
| #9 | 🟡 MEDIUM | 패스워드 brute force 방어 부재 | document-actions.ts:499-527 | 미조치 |
| #3 | 🟡 MEDIUM | 세션 타임아웃 정책 미설정 | Supabase Auth | 미조치 |
| #12 | 🟡 MEDIUM | Service Role 키 남용 위험 | server.ts:33-44 | 미조치 |
| #15 | 🟡 MEDIUM | Storage RLS 정책 미확인 | Supabase Storage | 미조치 |
| #10 | 🟢 LOW | 파일명 sanitization 부재 | document-actions.ts:30 | 미조치 |
| #11 | 🟢 LOW | 상세 에러 로그 노출 | 전체 | 미조치 |
| #16 | 🟢 LOW | 파일명 XSS 가능성 | document-upload.tsx:44 | 미조치 |

---

**보고서 작성일**: 2025-09-30
**분석 도구**: Sequential Thinking + Manual Code Review
**검토 범위**: 전체 애플리케이션 (인증, API, DB, Storage, Client)
**담당자**: Claude Code Security Analysis Agent
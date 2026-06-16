# 템플릿 기능 작업 계획 (Pro / Enterprise 플랜 전용)

> 작성일: 2026-06-14
> 상태: 계획 확정 대기 → 구현 예정
> 게이팅: Pro / Enterprise 플랜 전용 신기능

## 1. 배경 & 목표

### 문제
현재 문서 생명주기는 **업로드 → 서명영역 설정 → 발행 → 서명 → 완료**의 단방향 사이클이며,
한 번 발행·서명된 문서는 동일한 레이아웃이라도 **재사용·재발행이 불가능**하다.

### 목표
동일한 원본 문서 + 서명영역 레이아웃을 **템플릿**으로 저장해두고,
발행만 반복적으로 찍어낼 수 있는 기능을 추가한다. (Pro 플랜 이상 전용)

---

## 2. 현재 구조 분석 (리서치 결과)

### 데이터 모델
```text
publications (1) ──< documents (N) ──< signatures (N)
   발행 단위           문서 인스턴스        서명영역 + 서명데이터
```

| 테이블 | 핵심 컬럼 | 비고 |
|--------|-----------|------|
| `documents` | `file_url`(원본 storage 경로), `status`(draft→published→completed), `publication_id`, `signed_pdf_url`, `page_count`, `file_type` | 원본·레이아웃·결과·상태가 한 레코드에 결합 |
| `signatures` | `x/y/width/height`, `page_number`, `area_type`, `area_index`, `signature_data`(실제 서명), `status` | 레이아웃 좌표와 서명 데이터가 동일 레코드 |
| `publications` | `short_url`, `password`(bcrypt), `expires_at`, `status` | 외부 공유 단위 |

### 생명주기 흐름 & 관련 코드
```text
uploadDocument          → status=draft              (document-actions.ts:23)
createSignatureAreas    → signatures insert         (document-actions.ts:363)
createPublication       → status=draft→published    (publication-actions.ts:22)
                          publication_id 연결
saveSignature           → signature_data 채움        (document-actions.ts:235)
markDocumentCompleted   → status=completed           (document-actions.ts:291)
generateSignedPdf       → signed_pdf_url 채움         (document-actions.ts:481)
checkAndCompletePublication → publication completed  (publication-actions.ts:400)
```

### 재사용 불가능한 근본 원인
`document` 레코드가 **"템플릿"이자 "인스턴스"** 역할을 동시에 수행:
1. **발행 = 원본을 직접 변이** — `createPublication`이 기존 draft 문서를 `published`로 바꾸고 `publication_id`를 박음 (`publication-actions.ts:105-111`).
2. **서명 = 같은 레코드 변이** — `saveSignature`가 레이아웃을 담은 `signatures` 행에 `signature_data`를 덮어씀.
3. **완료 = 비가역** — `published` 문서는 삭제·재발행 불가 (`document-actions.ts:1329`).

### 기존 플랜 게이팅 패턴 (재사용)
`canUploadPdf()` (`subscription-actions.ts:747`)가 레퍼런스:
```ts
const planName = subscription?.plan?.name?.toLowerCase() ?? '';
const allowedPlans = ['pro', 'enterprise'];
if (allowedPlans.includes(planName)) return { canUpload: true };
```

---

## 3. 설계 방향

핵심: **불변(immutable) 템플릿** 개념을 추가하고, 발행 시 템플릿에서
새 `document` + `signatures` 인스턴스를 **복제(clone)**한다.
→ 발행 이후 흐름(`createPublication` → 서명 → 완료)은 **기존 코드 100% 재사용**.

### 신규 테이블
```sql
-- 불변 원본 템플릿
document_templates (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id),
  name          text not null,
  file_url      text not null,        -- 템플릿 전용 storage 경로
  file_type     text not null default 'image',
  page_count    int  not null default 1,
  is_deleted    boolean not null default false,
  deleted_at    timestamptz,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz default now()
)

-- 레이아웃 좌표만 (서명 데이터 없음)
template_signature_areas (
  id            uuid primary key default gen_random_uuid(),
  template_id   uuid not null references document_templates(id) on delete cascade,
  area_index    int  not null,
  x             numeric, y numeric, width numeric, height numeric,
  page_number   int  not null default 0,
  area_type     text not null default 'signature',
  created_at    timestamptz not null default now()
)
```
- RLS 정책: `user_id = auth.uid()` 기반 (기존 documents 정책 미러링)

### Storage 정책
- 템플릿 파일은 **별도 경로로 복사** (원본 document와 공유 금지).
- 이유: `deleteDocument`가 draft 삭제 시 `file_url` storage 파일을 직접 remove하므로 (`document-actions.ts:1382-1387`), 공유 시 복제본 삭제가 템플릿 원본을 파괴함.
- 제안 경로: `documents` 버킷 내 `{user_id}/templates/{uuid}.{ext}` 또는 별도 버킷.

---

## 4. 확정된 의사결정

| 항목 | 결정 |
|------|------|
| **과금·소모 정책** | 일반 발행과 **동일**. 템플릿 복제도 document 생성으로 간주하여 기존 `incrementDocumentCreated` / 크레딧 차감 / `canCreatePublication` 로직을 그대로 적용. |
| **템플릿 생성 진입** | **새 업로드로 만들기**. 전용 업로드 플로우에서 파일 + 서명영역을 새로 설정해 템플릿 생성. (기존 문서 → 템플릿 전환은 후순위/미포함) |
| **게이팅** | Pro / Enterprise 전용. `canUploadPdf` 패턴 복제. |

---

## 5. 작업 계획 (Phase별)

### Phase 1 — DB 스키마
- [ ] 마이그레이션: `document_templates`, `template_signature_areas` 테이블 + RLS 정책 생성
- [ ] `lib/supabase/database.types.ts`에 타입 추가
  - `document_templates`, `template_signature_areas` Row/Insert/Update
  - 컨비니언스 별칭: `DocumentTemplate`, `TemplateSignatureArea`, `TemplateWithAreas`

### Phase 2 — 백엔드 액션 (`app/actions/template-actions.ts` 신규)
- [ ] `canUseTemplate()` — `canUploadPdf` 패턴 복제, pro/enterprise 게이팅
- [ ] `createTemplate(formData)` — 새 업로드 방식
  - 파일을 템플릿 전용 storage 경로에 업로드
  - `document_templates` insert
  - `template_signature_areas` 일괄 insert (좌표만)
  - 진입부 `canUseTemplate()` 게이팅
- [ ] `getUserTemplates()` / `getTemplateById(id)` — 목록·상세 조회
- [ ] `deleteTemplate(id)` — soft delete (`is_deleted`), storage 파일 정리
- [ ] `publishFromTemplate(templateId, { name, password, expiresAt })` — **핵심**
  1. 게이팅 + 소유권 검증
  2. 템플릿 storage 파일을 새 document 경로로 **복사**
  3. 새 `documents` insert (status=draft) → 기존 `incrementDocumentCreated`/크레딧 로직 재사용
  4. `template_signature_areas` → 새 `signatures` insert (status=pending, signature_data=null)
  5. 기존 `createPublication([newDocId], ...)` 호출하여 발행 완료

### Phase 3 — 프론트엔드
- [ ] 템플릿 목록 페이지 `app/(document)/templates/` 신규
  - Pro 미만 사용자: 업셀(upsell) UI 노출 + `/pricing` 유도
- [ ] 템플릿 생성 UI — 기존 `components/document-upload.tsx` + `components/area-selector.tsx` 재사용
- [ ] "템플릿으로 발행" 액션 → 발행 폼 (`components/publish/publish-form.tsx` 재활용)
- [ ] 대시보드 / `site-header.tsx` 내비게이션에 템플릿 진입점 추가
- [ ] i18n: `contexts/language-context.tsx` ko/en 키 추가

### Phase 4 — 게이팅 & 검증
- [ ] 모든 템플릿 서버 액션 진입부에 `canUseTemplate()` 체크 (UI 우회 방지)
- [ ] `subscription_plans.features` Json에 템플릿 기능 표기 (pricing 노출용)
- [ ] 빌드/린트: `pnpm build`, `pnpm lint`

---

## 6. 리스크 & 체크포인트

| 항목 | 내용 |
|------|------|
| Storage 파일 공유 금지 | 템플릿↔복제본 파일 경로 분리 필수 (삭제 시 원본 파괴 방지) |
| 복제 시 크레딧/카운트 | 기존 발행과 동일 정책 → `uploadDocument`/`createPublication`의 차감 로직 재사용으로 일관성 확보 |
| 비가역 발행과의 정합성 | 템플릿은 불변, 복제본만 소비됨 → 발행 반복 가능 |
| PDF 템플릿 | 원본이 PDF인 경우 `file_type`/`page_count` 보존, `generateSignedPdfFromPdf` 경로와 호환 확인 필요 |
| RLS | 신규 2개 테이블 정책을 documents 수준으로 엄격히 적용 |

---

## 7. 재사용 가능한 기존 자산

| 기존 코드 | 재사용 방식 |
|-----------|-------------|
| `canUploadPdf` (`subscription-actions.ts:747`) | `canUseTemplate` 패턴 복제 |
| `createPublication` (`publication-actions.ts:22`) | 복제본 발행에 그대로 호출 |
| `createSignatureAreas` 로직 | 좌표 일괄 insert 패턴 재사용 |
| `uploadDocument` storage 업로드 | 템플릿 파일 업로드에 패턴 재사용 |
| `document-upload.tsx`, `area-selector.tsx` | 템플릿 생성 UI |
| `publish-form.tsx` | 템플릿 발행 폼 |

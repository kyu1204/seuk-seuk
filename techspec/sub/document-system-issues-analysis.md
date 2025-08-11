# 전자 문서 서명 제품 문제점 분석 및 해결방안 기술스펙

## 개요

전자 문서 서명 제품에서 발견된 5개의 핵심 문제점에 대한 종합적인 분석과 해결방안을 제시합니다.

## 문제점 분석

### 1. 문서 상세화면 부재 (404 NotFound)

**현재 상황**:
- `DocumentCard` 컴포넌트의 "보기" 버튼 클릭 시 404 페이지 노출
- `DashboardPage.tsx`에서 `view` 액션이 `/s/${document.id}`로 리다이렉트
- 해당 경로는 서명 페이지(`/sign/[id]`)로만 동작하여 실제 문서 상세보기 기능 부재

**근본 원인**:
- 문서 소유자용 상세보기 페이지가 존재하지 않음
- 서명 페이지와 문서 상세보기 페이지의 혼재

### 2. 편집 기능 미완성

**현재 상황**:
- "편집" 버튼 클릭 시 단순히 문서 업로드 탭으로 전환
- 편집할 문서의 컨텍스트가 `DocumentUpload` 컴포넌트에 전달되지 않음
- 새 문서 생성과 기존 문서 편집의 구분이 없음

**근본 원인**:
- 편집 모드와 신규 생성 모드 분리 부재
- 문서 ID 기반 편집 컨텍스트 전달 메커니즘 부재

### 3. 문서 업로드 화면 상태 관리 문제

**현재 상황**:
- localStorage 기반 자동 문서 로딩 (`currentDocumentId`)
- "새 문서 만들기" 클릭 시에도 마지막 문서가 자동 로딩됨
- 편집 모드와 신규 생성 모드의 상태 혼재

**근본 원인**:
- localStorage 기반 전역 상태 관리의 부적절한 사용
- 컴포넌트 마운트 시 자동 로딩 로직의 무조건적 실행

### 4. 서명 완료된 문서 조회 화면 부재

**현재 상황**:
- 서명 완료된 문서에 대한 전용 조회 화면 없음
- 문서 소유자가 서명 진행 상황 및 완료 결과를 확인할 방법 부재

**근본 원인**:
- 문서 생명주기별 UI 분리 부재
- 서명 진행 상황 모니터링 인터페이스 부재

### 5. 서명영역 위치 불일치

**현재 상황**:
- `AreaSelector`에서 설정한 서명영역과 실제 서명 페이지에서 표시되는 영역 위치 불일치
- 좌표 계산 방식의 차이로 인한 시각적 오차

**근본 원인**:
- 스크롤 위치, 이미지 스케일링, 컨테이너 크기 등 좌표 계산 요소들의 불일치
- 서명영역 설정 시점과 표시 시점의 DOM 환경 차이

## 해결방안 및 구현 계획

### Phase 1: 문서 상세보기 페이지 구현

**목표**: 문서 소유자용 상세보기 인터페이스 구현

**구현 사항**:
1. `/app/document/[id]/page.tsx` 생성
2. 문서 메타데이터, 서명 진행상황, 서명 완료 결과 표시
3. 편집, 공유, 삭제 액션 제공
4. 라우팅 수정: `view` 액션을 `/document/${document.id}`로 변경

**기술적 요구사항**:
- SSR 기반 문서 데이터 로딩
- 실시간 서명 진행상황 업데이트
- 반응형 레이아웃 지원

### Phase 2: 편집 모드 분리 및 개선

**목표**: 신규 생성과 편집의 명확한 분리

**구현 사항**:
1. `DocumentUpload` 컴포넌트에 `editDocumentId` prop 추가
2. 편집 모드 진입 시 문서 ID 전달 메커니즘 구현
3. URL 기반 편집 모드 구분 (`/dashboard?mode=edit&documentId=xxx`)
4. 편집 모드에서 기존 문서 데이터 로딩 및 수정 가능 상태 표시

**상태 관리 개선**:
- localStorage 의존성 제거
- URL 파라미터 기반 상태 관리
- 편집/신규 모드별 초기화 로직 분리

### Phase 3: 서명영역 좌표 시스템 통일

**목표**: 서명영역 설정과 표시의 좌표 정확성 보장

**구현 사항**:
1. 좌표 계산 유틸리티 함수 통일 (`lib/coordinate-utils.ts`)
2. 이미지 크기 정규화 및 반응형 스케일링 로직
3. 서명영역 설정 시 실제 이미지 크기 기준 좌표 저장
4. 서명 페이지에서 동일한 스케일링 로직 적용

**좌표 시스템 설계**:
- 원본 이미지 크기 기준 절대 좌표 저장
- 표시 시점에서 현재 컨테이너 크기에 맞는 상대 좌표 변환
- 스크롤 위치와 무관한 좌표 시스템

### Phase 4: 문서 생명주기 관리 개선

**목표**: 문서 상태별 적절한 UI 제공

**구현 사항**:
1. 문서 상태별 라우팅 분리
   - 작성 중: `/dashboard` (upload tab)
   - 서명 대기: `/document/[id]` (상세보기)
   - 서명 진행중: `/document/[id]` (진행상황)
   - 서명 완료: `/document/[id]` (완료 결과)
2. 각 상태별 전용 컴포넌트 및 액션 제공
3. 상태 전환 플로우 개선

## 기술 스택 및 아키텍처

### 새로 추가될 파일 구조
```
app/
├── document/
│   └── [id]/
│       ├── page.tsx          # 문서 상세보기 페이지
│       └── loading.tsx       # 로딩 컴포넌트
├── dashboard/
│   └── components/
│       ├── DocumentDetailView.tsx    # 상세보기 컴포넌트
│       └── EditDocumentModal.tsx     # 편집 모달
components/
├── document/
│   ├── DocumentViewer.tsx            # 문서 뷰어 컴포넌트
│   ├── SignatureProgress.tsx         # 서명 진행상황
│   └── DocumentActions.tsx           # 문서 액션 버튼들
lib/
├── coordinate-utils.ts              # 좌표 계산 유틸리티
├── document-state.ts               # 문서 상태 관리
└── navigation-utils.ts             # 네비게이션 헬퍼
```

### 데이터베이스 스키마 업데이트
```sql
-- 문서 상태 추가 (기존 status 필드 확장)
ALTER TYPE document_status ADD VALUE 'editing';
ALTER TYPE document_status ADD VALUE 'reviewing';

-- 서명영역 메타데이터 추가
ALTER TABLE signature_areas 
ADD COLUMN original_image_width INTEGER,
ADD COLUMN original_image_height INTEGER,
ADD COLUMN created_at TIMESTAMP DEFAULT NOW();
```

### 상태 관리 아키텍처
```typescript
// 문서 편집 컨텍스트
interface DocumentEditContext {
  mode: 'create' | 'edit'
  documentId?: string
  initialData?: DocumentWithAreas
}

// 좌표 시스템 인터페이스
interface CoordinateSystem {
  originalImageSize: { width: number; height: number }
  currentDisplaySize: { width: number; height: number }
  containerOffset: { x: number; y: number }
}
```

## 우선순위 및 구현 일정

### Week 1: Phase 1 (문서 상세보기)
- [ ] `/app/document/[id]/page.tsx` 구현
- [ ] `DocumentDetailView` 컴포넌트 구현
- [ ] 라우팅 수정 및 테스트

### Week 2: Phase 2 (편집 모드 분리)
- [ ] `DocumentUpload` 컴포넌트 리팩토링
- [ ] 편집 모드 URL 파라미터 처리
- [ ] localStorage 의존성 제거

### Week 3: Phase 3 (좌표 시스템 통일)
- [ ] 좌표 계산 유틸리티 구현
- [ ] `AreaSelector` 좌표 로직 개선
- [ ] 서명 페이지 좌표 표시 로직 수정

### Week 4: Phase 4 (통합 테스트 및 최적화)
- [ ] 전체 플로우 통합 테스트
- [ ] 사용자 경험 최적화
- [ ] 성능 최적화 및 버그 수정

## 성공 기준 (Definition of Done)

1. **문서 상세화면**: 404 오류 없이 문서 정보와 서명 진행상황 표시
2. **편집 기능**: 기존 문서 편집 시 올바른 데이터 로딩 및 수정 가능
3. **상태 분리**: 새 문서 생성 시 깨끗한 상태로 시작
4. **서명영역 정확성**: 설정한 서명영역과 실제 표시 위치 100% 일치
5. **완료된 문서 조회**: 서명 완료된 문서의 최종 결과물 조회 가능

## 위험 요소 및 대응방안

### 위험: 기존 사용자 데이터 호환성
**대응**: 마이그레이션 스크립트 작성 및 점진적 배포

### 위험: 좌표 시스템 변경으로 인한 기존 서명영역 오류
**대응**: 기존 데이터 검증 및 재계산 로직 구현

### 위험: 복잡한 상태 관리로 인한 버그 증가
**대응**: 단위 테스트 강화 및 E2E 테스트 구축
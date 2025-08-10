# Phase 5-1: 신규 대시보드 페이지 개발

## 🎯 개발 목표

기존 대시보드의 문서 업로드 단일 기능에서 벗어나, 사용자가 업로드한 문서들을 체계적으로 관리할 수 있는 통합 문서 관리 인터페이스 구현

## 📋 현황 분석

### 기존 대시보드 문제점
- ❌ 업로드된 문서 목록 조회 불가
- ❌ 서명 완료된 문서 별도 관리 부재  
- ❌ 문서 삭제 기능 없음
- ❌ 문서 상태별 필터링 불가
- ❌ 서명 진행률 시각화 부재

### 기존 구조
```text
/dashboard/
├── page.tsx          # 인증 + DashboardPage 렌더링
├── DashboardPage.tsx  # DocumentUpload 컴포넌트만 표시
├── layout.tsx         # 레이아웃
└── queries.ts         # 데이터베이스 쿼리 (미사용)
```

### 데이터베이스 스키마
- `documents`: 문서 기본정보 (status: draft|published|completed|expired)
- `signatures`: 서명 데이터 
- `signature_areas`: 서명 영역
- `document_shares`: 공유 링크

## 🎨 디자인 시스템 준수

### UI 컴포넌트 스타일
- **기본 컨테이너**: `container mx-auto px-4 py-8`
- **최대폭**: `max-w-6xl mx-auto`
- **카드**: Radix UI Card 컴포넌트
- **아이콘**: Lucide React
- **테마**: 다크/라이트 지원
- **국제화**: `useLanguage` 훅 활용

### 컬러 시스템
- Primary: 기존 브랜드 컬러 유지
- Muted: `text-muted-foreground`
- Background: `bg-background`
- Card: `bg-card`

## 🏗️ 신규 대시보드 설계

### 1. 페이지 구조 개편

```text
/dashboard/
├── page.tsx                    # 기존 유지
├── layout.tsx                  # 기존 유지  
├── queries.ts                  # 확장: 문서 목록 쿼리 추가
├── DashboardPage.tsx           # 🔄 전면 개편
├── components/
│   ├── DocumentList.tsx        # 🆕 문서 목록 컴포넌트
│   ├── DocumentCard.tsx        # 🆕 문서 카드 컴포넌트  
│   ├── DocumentFilters.tsx     # 🆕 필터링 컴포넌트
│   ├── DocumentStats.tsx       # 🆕 통계 컴포넌트
│   └── EmptyState.tsx         # 🆕 빈 상태 컴포넌트
└── types/
    └── dashboard.ts            # 🆕 타입 정의
```

### 2. 주요 기능

#### 2.1 문서 목록 조회
- **데이터 소스**: Supabase documents 테이블
- **관계**: signatures, signature_areas 조인으로 진행률 계산
- **필터링**: 상태별 (전체/초안/게시됨/완료됨/만료됨)
- **정렬**: 생성일/수정일/제목/상태

#### 2.2 문서 카드 정보
```typescript
interface DocumentCardProps {
  document: DocumentWithStats;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onShare: (id: string) => void;
  onView: (id: string) => void;
}
```

**표시 정보:**
- 문서 썸네일 (첫 페이지 또는 기본 아이콘)
- 문서 제목 및 파일명
- 생성/수정 날짜
- 상태 배지 (draft/published/completed/expired)
- 서명 진행률 (완료/전체)
- 액션 버튼 (편집/삭제/공유/보기)

#### 2.3 탭 네비게이션
- **전체**: 모든 문서
- **초안**: status = 'draft' 
- **진행중**: status = 'published'
- **완료**: status = 'completed'
- **만료**: status = 'expired'

#### 2.4 문서 관리 기능
- **편집**: 기존 DocumentUpload로 이동
- **삭제**: 확인 다이얼로그 후 삭제 (Storage 파일도 함께)
- **공유**: 공유 링크 생성/관리
- **보기**: 서명 페이지로 이동

### 3. 컴포넌트 상세 설계

#### 3.1 DocumentList.tsx
```tsx
interface DocumentListProps {
  documents: DocumentWithStats[];
  loading: boolean;
  filter: DocumentFilter;
  onFilterChange: (filter: DocumentFilter) => void;
  onDocumentAction: (action: DocumentAction, id: string) => void;
}
```

#### 3.2 DocumentCard.tsx
```tsx
interface DocumentWithStats extends Document {
  signatureStats: {
    total: number;
    completed: number;
    pending: number;
    progress: number; // 0-100
  };
  shareInfo?: {
    hasActiveShare: boolean;
    shareCount: number;
    lastAccessed?: Date;
  };
}
```

#### 3.3 DocumentFilters.tsx
```tsx
interface DocumentFiltersProps {
  currentFilter: DocumentFilter;
  counts: Record<DocumentStatus | 'all', number>;
  onFilterChange: (filter: DocumentFilter) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
}
```

## 🛠️ 구현 계획

### Phase 5-1-A: 기반 구조 구축
1. **타입 정의 및 쿼리 확장**
   - DocumentWithStats 타입 정의
   - queries.ts에 문서 목록 조회 함수 추가
   - 서명 진행률 계산 쿼리 최적화

2. **기본 컴포넌트 생성**
   - DocumentList 컴포넌트 (기본 목록 렌더링)
   - DocumentCard 컴포넌트 (카드 UI)
   - EmptyState 컴포넌트

### Phase 5-1-B: 핵심 기능 구현
1. **필터링 시스템**
   - DocumentFilters 컴포넌트
   - 탭 네비게이션 구현
   - 검색 기능 추가

2. **문서 관리 기능**
   - 삭제 기능 (확인 다이얼로그)
   - 편집 기능 (기존 업로드 페이지 연동)
   - 공유 기능 (기존 공유 시스템 활용)

### Phase 5-1-C: UI 개선 및 최적화
1. **시각적 개선**
   - 서명 진행률 시각화 (Progress 컴포넌트)
   - 상태 배지 디자인
   - 반응형 그리드 레이아웃

2. **사용자 경험**
   - 로딩 상태 처리
   - 에러 상태 처리  
   - 실시간 업데이트 (옵션)

### Phase 5-1-D: 통합 및 테스트
1. **DashboardPage 개편**
   - 기존 DocumentUpload + 신규 DocumentList 통합
   - 네비게이션 개선
   - 상태 관리 통합

2. **다국어 지원**
   - language-context에 새 번역키 추가
   - 모든 텍스트 국제화

## 📊 성공 지표

### 사용자 경험
- ✅ 문서 목록 조회 가능
- ✅ 상태별 필터링 가능
- ✅ 서명 진행률 확인 가능  
- ✅ 문서 삭제/편집/공유 가능
- ✅ 반응형 디자인 지원

### 기술적 요구사항
- ✅ 기존 디자인 시스템 준수
- ✅ 타입스크립트 타입 안정성
- ✅ 다국어 지원 완료
- ✅ 성능 최적화 (가상화 등)
- ✅ 접근성 준수 (WCAG 2.1 AA)

## 🚀 다음 단계

1. **Phase 5-1 완료 후**: 서명 제출 플로우 추가 (Phase 5-2)
2. **Phase 6**: 대시보드 고급 기능 (통계, 알림, 내보내기)
3. **Phase 7**: 모바일 앱 대응

## 📝 개발 노트

- 기존 DocumentUpload 컴포넌트는 유지하되, 새 문서 작성 모드로 전환
- 문서 편집 시 기존 서명 영역 데이터 보존
- Storage 파일 삭제 시 RLS 정책 고려 (Service Role 사용)
- 실시간 업데이트는 선택적 구현 (Supabase Realtime)
# 문서 대시보드 페이지 구현 계획서

## 📋 프로젝트 개요
**목표**: 로그인한 사용자의 문서를 카드 형태로 보여주는 대시보드 페이지 구현
**핵심 기능**: 문서명, 상태 표시, SSR + 무한스크롤 하이브리드 접근
**예상 소요시간**: 5-6시간

---

## 🏗️ 기술 아키텍처

### 데이터베이스 구조 (확인완료)
```sql
-- documents 테이블 (기존 존재)
- id: uuid (PK)
- user_id: uuid (FK → auth.users.id) ✅ 존재 확인됨
- filename: text
- status: 'draft' | 'published' | 'completed'
- created_at: timestamptz
```

### 하이브리드 렌더링 전략
- **SSR (첫 페이지)**: 서버에서 초기 문서 목록 로드
- **CSR (2페이지+)**: 무한 스크롤로 추가 문서 로드
- **로딩 처리**: Next.js loading.tsx + 커스텀 스켈레톤

---

## 📝 Phase별 구현 계획

### Phase 0: 작업 계획 문서화 📋
- [x] `plan` 폴더 생성
- [x] 상세 작업 계획서 마크다운 문서 작성 (`plan/dashboard-implementation.md`)
- [x] 각 페이즈별 체크박스 포함한 진행상황 추적 문서

### Phase 1: 서버 액션 개발 🔧
- [ ] `getUserDocuments` 서버 액션 생성 - 페이지네이션 지원 (offset 기반)
  ```typescript
  // 함수 시그니처 예시
  getUserDocuments(userId: string, page?: number, limit?: number)
  ```
- [ ] `getUserDocumentsClient` 클라이언트용 액션 생성 - 무한 스크롤용
- [ ] `uploadDocument` 액션 수정 - 사용자 ID 자동 할당 로직 추가
- [ ] 문서 상태별 필터링 기능 (draft, published, completed)
- [ ] 페이지네이션 파라미터 처리 (page, limit, offset)

### Phase 2: UI 컴포넌트 개발 🎨
- [ ] `DocumentCard` 컴포넌트 생성
  - 문서명 표시
  - 상태 배지 (draft/published/completed)
  - 생성일 표시
  - 클릭 시 문서 상세 페이지 이동
- [ ] `DocumentCardSkeleton` 컴포넌트 생성
  - 로딩 중 스켈레톤 UI
  - 카드와 동일한 레이아웃
- [ ] `DocumentDashboard` 컴포넌트 생성
  - 반응형 그리드 레이아웃
  - 헤더 영역 (제목 + 업로드 버튼)
- [ ] `InfiniteScrollDocuments` 클라이언트 컴포넌트
  - Intersection Observer 활용
  - 추가 로딩 상태 관리
- [ ] 업로드 페이지로 이동하는 네비게이션 버튼
- [ ] 빈 상태 UI (문서가 없을 때)

### Phase 3: 하이브리드 대시보드 페이지 구현 📄
- [ ] 새로운 `/dashboard` 라우트 생성
  ```
  app/
  ├── dashboard/
  │   ├── page.tsx (Server Component)
  │   ├── loading.tsx (Next.js 로딩)
  │   └── components/
  │       └── DashboardClient.tsx
  ```
- [ ] 첫 페이지 SSR 처리 - 서버에서 초기 문서 목록 로드
- [ ] 2페이지부터 CSR 무한 스크롤 구현
- [ ] 기존 `/upload` 페이지는 분리된 상태 유지
- [ ] 반응형 그리드 레이아웃 적용 (1-2-3-4 컬럼)

### Phase 4: 무한 스크롤 및 페이지네이션 로직 🔄
- [ ] Intersection Observer API 활용한 무한 스크롤
  ```typescript
  // 예상 구현
  const { ref, inView } = useInView({
    threshold: 0,
    triggerOnce: false,
  });
  ```
- [ ] 로딩 상태 관리
  - `isLoadingInitial`: 첫 로드 (SSR)
  - `isLoadingMore`: 추가 로드 (CSR)
- [ ] 스켈레톤 UI 표시 로직
- [ ] 에러 처리 및 재시도 로직
- [ ] 캐싱 전략 구현 (중복 요청 방지)

### Phase 5: 다국어 지원 확장 🌐
- [ ] 대시보드 관련 번역 키 추가
  ```json
  // 예상 키 목록
  {
    "dashboard.title": "내 문서",
    "dashboard.upload": "문서 업로드",
    "dashboard.empty": "업로드된 문서가 없습니다",
    "status.draft": "초안",
    "status.published": "게시됨",
    "status.completed": "완료됨"
  }
  ```
- [ ] 문서 상태 번역 처리
- [ ] 네비게이션 버튼 텍스트 다국어 지원
- [ ] 로딩 및 에러 메시지 다국어 지원

### Phase 6: 네비게이션 개선 🧭
- [ ] 아바타 드롭다운 메뉴에 대시보드 링크 추가
  - 헤더의 사용자 프로필 드롭다운 찾기
  - "대시보드" 메뉴 아이템 추가
- [ ] 로그인 후 기본 랜딩 페이지를 대시보드로 변경
  - 로그인 액션 수정
  - 성공 시 `/dashboard`로 리다이렉트
- [ ] 로그인 성공 시 리다이렉트 처리

### Phase 7: 테스트 및 최적화 ✅
- [ ] **기능 테스트**
  - SSR 첫 페이지 로딩 확인
  - 무한 스크롤 동작 확인
  - 문서 카드 클릭 → 상세 페이지 이동
  - 업로드 버튼 → 업로드 페이지 이동
- [ ] **반응형 테스트**
  - 모바일 (1컬럼)
  - 태블릿 (2컬럼)
  - 데스크톱 (3-4컬럼)
- [ ] **인증 플로우 테스트**
  - 로그인 → 대시보드 이동
  - 비로그인 → 로그인 페이지 리다이렉트
- [ ] **성능 최적화**
  - 메모이제이션 (`useMemo`, `useCallback`)
  - 가상화 (필요시)
  - 이미지 최적화

---

## 🎯 주요 구현 포인트

### 1. 하이브리드 렌더링 전략
```typescript
// app/dashboard/page.tsx (Server Component)
export default async function DashboardPage() {
  const initialDocuments = await getUserDocuments(userId, 1, 12);

  return (
    <div>
      <DashboardHeader />
      <InfiniteScrollDocuments
        initialDocuments={initialDocuments}
        userId={userId}
      />
    </div>
  );
}
```

### 2. 무한 스크롤 구현
```typescript
// components/InfiniteScrollDocuments.tsx
const InfiniteScrollDocuments = ({ initialDocuments, userId }) => {
  const [documents, setDocuments] = useState(initialDocuments);
  const [page, setPage] = useState(2); // 2페이지부터 CSR
  const [isLoading, setIsLoading] = useState(false);

  // Intersection Observer 로직
  const { ref, inView } = useInView();

  useEffect(() => {
    if (inView && !isLoading) {
      loadMoreDocuments();
    }
  }, [inView]);
}
```

### 3. 상태 관리 구조
```typescript
interface Document {
  id: string;
  filename: string;
  status: 'draft' | 'published' | 'completed';
  created_at: string;
  user_id: string;
}

interface DashboardState {
  documents: Document[];
  isLoadingMore: boolean;
  hasMore: boolean;
  page: number;
  error: string | null;
}
```

---

## 🚀 예상 성과

### 사용자 경험 개선
- **빠른 초기 로딩**: SSR로 첫 페이지 즉시 표시
- **매끄러운 추가 로딩**: 무한 스크롤 + 스켈레톤 UI
- **직관적인 UI**: 카드 형태 + 상태 배지

### 기술적 성과
- **SEO 최적화**: SSR로 검색 엔진 친화적
- **성능 최적화**: 필요한 만큼만 데이터 로드
- **확장성**: 페이지네이션으로 대량 데이터 처리 가능

### 운영 효율성
- **사용자 참여도 증가**: 문서 관리 편의성 향상
- **서버 부하 분산**: 하이브리드 렌더링으로 부하 조절

---

## 📅 일정 계획
- **Phase 0-2**: 2시간 (기반 구축)
- **Phase 3-4**: 2시간 (핵심 기능)
- **Phase 5-6**: 1시간 (UX 개선)
- **Phase 7**: 1시간 (테스트 & 최적화)
- **총 예상 시간**: 6시간

---

## ⚠️ 주의사항
1. **인증 확인**: 모든 문서 조회 시 user_id 검증 필수
2. **RLS 정책**: Supabase Row Level Security 적용 확인
3. **무한 스크롤**: 메모리 누수 방지를 위한 적절한 cleanup
4. **에러 처리**: 네트워크 오류, 권한 오류 등 예외 상황 대응
5. **접근성**: 키보드 네비게이션, 스크린 리더 지원

---

*작성일: 2024년*
*업데이트: Phase별 진행 상황에 따라 지속 업데이트*
# Phase 5-2: 서명자 경험 최적화 (Signer Experience Optimization)

## 개요
서명자 전용 워크플로우를 개선하여 더 직관적이고 사용자 친화적인 서명 경험을 제공합니다. 서명자는 대시보드에 접근할 필요 없이, 공유된 링크를 통해서만 문서에 접근하여 서명을 완료하고 제출할 수 있습니다.

## 유저 역할 구분
- **생성자 (Creator)**: 문서 생성, 관리, 공유 링크 생성 → 대시보드 접근
- **서명자 (Signer)**: 공유 링크로 접근하여 서명 및 제출만 수행 → 대시보드 접근 불필요

## 서명 워크플로우 변경사항

### 기존 워크플로우 문제점
❌ **현재 구조의 문제**:
- 최종 문서 다운로드 기능이 서명자에게 불필요
- 서명 완료 후 명확한 "제출" 과정 부재
- 제출된 문서에 서명자가 재접근 가능한 보안 문제

### 새로운 워크플로우 설계
✅ **개선된 플로우**:
1. 서명자가 공유 링크로 문서 접근
2. 모든 서명 영역에 서명 완료
3. **"제출하기" 버튼**으로 문서 최종 제출
4. 문서 상태가 'submitted'로 변경
5. 서명자는 제출된 문서에 재접근 불가
6. 생성자만 대시보드에서 제출된 문서 확인 가능

## Phase 5-2 개발 목표

### 5-2-A: 서명자 온보딩 개선
**목표**: 첫 방문자도 쉽게 이해할 수 있는 서명 프로세스 안내

**구현 사항**:
- 서명 프로세스 소개 오버레이 (단일 서명자 기준)
- 단계별 진행 표시: "서명하기 → 검토하기 → 제출하기"
- 서명 영역 하이라이트 애니메이션
- 제출 전 최종 확인 단계 추가

**파일 수정**:
- `/app/sign/[id]/page.tsx` - 온보딩 컴포넌트 추가
- `/components/signer-onboarding.tsx` - 신규 생성
- 언어 컨텍스트 - 온보딩 관련 번역 추가

### 5-2-B: 제출 시스템 구현
**목표**: 다운로드 대신 제출 기능으로 변경

**구현 사항**:
- "최종 문서 다운로드" → "제출하기" 버튼 변경
- 제출 전 서명 검토 단계 추가
- 제출 확인 모달 (되돌릴 수 없음 경고)
- 문서 상태를 'submitted'로 변경하는 서버 액션
- 제출된 문서 재접근 차단 로직

**파일 수정**:
- `/app/sign/[id]/page.tsx` - 제출 기능으로 변경
- `/app/actions/signing.ts` - submitDocument 액션 추가
- `/components/submit-confirmation-modal.tsx` - 신규 생성

### 5-2-C: 서명자 정보 입력 UX 개선
**목표**: 더 자연스러운 정보 입력 플로우

**구현 사항**:
- 서명 모달 내에서 정보 입력 (서명과 동시에)
- 선택적 정보 입력 (이름만 필수, 이메일 선택)
- 이전 서명 정보 기억 (브라우저 저장)
- 입력 검증 및 실시간 피드백

**파일 수정**:
- `/components/signature-modal.tsx` - 정보 입력 폼 통합
- `/app/sign/[id]/page.tsx` - 정보 입력 플로우 수정
- Local storage 활용한 정보 기억 기능

### 5-2-D: 모바일 서명 경험 최적화
**목표**: 모바일 디바이스에서 최적화된 서명 경험

**구현 사항**:
- 터치 최적화 서명 패드
- 확대/축소 제스처 지원
- 세로/가로 모드 대응
- 큰 터치 영역 및 접근성 개선
- 모바일 키보드 대응 레이아웃

**파일 수정**:
- `/components/signature-modal.tsx` - 모바일 터치 최적화
- `/app/sign/[id]/page.tsx` - 반응형 레이아웃 개선
- CSS 미디어 쿼리 및 터치 이벤트 핸들링

## 데이터베이스 스키마 변경

### 문서 상태 추가
```sql
-- documents 테이블의 status enum에 'submitted' 추가
ALTER TYPE document_status ADD VALUE 'submitted';
```

### 제출 관련 필드 추가 (선택사항)
```sql
-- documents 테이블에 제출 정보 추가
ALTER TABLE documents 
ADD COLUMN submitted_at TIMESTAMPTZ,
ADD COLUMN submitted_by_name TEXT,
ADD COLUMN submitted_by_email TEXT;
```

## 보안 강화

### 제출된 문서 접근 제한
- 문서 상태가 'submitted'인 경우 서명자 접근 차단
- 서명 페이지에서 submitted 상태 확인 후 접근 거부 메시지 표시
- 생성자는 대시보드에서만 제출된 문서 확인 가능

### 접근 제어 로직
```typescript
// /app/actions/signing.ts에서 구현
if (document.status === 'submitted') {
  return { 
    success: false, 
    error: "이 문서는 이미 제출되어 접근할 수 없습니다.",
    isSubmitted: true 
  }
}
```

## 기술적 고려사항

### 기존 아키텍처 유지
- 현재 `/sign/[id]` 라우트 구조 유지
- 기존 서명 액션 및 서버 함수 재사용
- 최소한의 데이터베이스 스키마 변경

### 새로운 서버 액션
```typescript
// 제출 관련 새 액션들
submitDocument(documentId: string, signerInfo: SignerInfo)
checkDocumentSubmissionStatus(documentId: string)
```

## 예상 개발 시간
- **5-2-A**: 온보딩 개선 (1일)
- **5-2-B**: 제출 시스템 구현 (2-3일)
- **5-2-C**: 정보 입력 UX (1-2일)  
- **5-2-D**: 모바일 최적화 (2-3일)

**전체 예상 시간**: 6-9일 (테스트 및 버그 수정 포함)

## 성공 지표
- 서명 완료 및 제출률 증가
- 서명 소요 시간 단축
- 모바일에서의 서명 성공률 개선
- 제출된 문서의 보안 강화 (재접근 차단률 100%)

## 다음 단계
Phase 5-2 완료 후:
- **Phase 5-3**: 생성자 대시보드에서 제출된 문서 관리 개선
- **Phase 5-4**: 서명자-생성자 간 커뮤니케이션 개선 (알림, 리마인더)
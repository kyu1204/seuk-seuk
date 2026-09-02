# WORKPLAN — 슥슥 전체 페이지 UI/UX 리뉴얼

## Goal (verifiable gates)
- G1 `npx tsc --noEmit` 통과, `npx vitest run` 전부 통과 (모든 태스크 공통)
- G2 `grep -rn "gradient-text\|bg-dot-pattern\|bg-grid-pattern\|card-angled" app components` 결과 0건
- G3 `grep -rn "alert(" app components --include=*.tsx` 결과 0건
- G4 locales/ko.ts 와 en.ts 의 키 집합 동일 (locales/ko.test.ts 가 검증)
- G5 대시보드·발행·서명자·요금제·계정 화면이 docs/design/renewal-spec.md 의 구조·카피를 따름 (각 work order 의 grep 수용 기준)

## Common rules (모든 태스크)
- 디자인 결정은 docs/design/renewal-spec.md 와 각 work order 에만 따른다. 스펙에 없는 UI 추가 금지.
- TDD 가드: `.ts/.tsx` 소스를 고치기 전에 같은 basename 의 `.test.ts(x)` 를 먼저 작성·수정한다. 예: `components/dashboard/document-card.tsx` → `components/dashboard/document-card.test.tsx`. locales/ko.ts → locales/ko.test.ts, locales/en.ts → locales/en.test.ts.
- testing-library 없음, vitest 환경은 node. 컴포넌트 렌더 테스트 금지. 테스트는 (a) 파일이 export 하는 순수 함수 검증, 또는 (b) `fs.readFileSync` 로 소스 문자열 회귀 검증(금지 클래스·문구 부재, 필수 문구·키 존재) 중 하나로 쓴다. 컴포넌트 파일을 import 하지 않는다.
- 카피는 항상 locales/ko.ts · en.ts 의 t() 키로. 컴포넌트에 한글·영문 하드코딩 금지. 인라인 폴백 `t("key","한글")` 금지.
- 색은 Tailwind 토큰(bg-primary, text-muted-foreground, bg-destructive/10, bg-muted, border 등)만. `bg-white`, `text-gray-*`, `bg-red-50`, `bg-green-*`, `text-white` 금지. 완료 상태는 `text-seal bg-seal-soft`, 만료는 `text-amber bg-amber-soft` (R01 에서 정의).
- 태스크 하나 = 커밋 하나. 체크박스와 진행 로그를 같은 커밋에 갱신.

## Tasks

### Phase 0 — 토큰·전역
- [ ] R01 전역 토큰 교체(잉크 네이비·도장 주홍·앰버), enableSystem, 클리셰 CSS·클래스 제거, locale 패리티 테스트 — docs/work-orders/R01.md
- [ ] R02 공통 StatusBadge 컴포넌트와 상태 라벨 표준(초안/발행됨/완료/만료) — docs/work-orders/R02.md
- [ ] R03 사이트 헤더 리뉴얼(앱 내비, aria-label, 스크롤 효과 정리) — docs/work-orders/R03.md

### Phase 1 — 인증
- [ ] R11 로그인·회원가입·비밀번호 재설정·가입 완료 화면 리뉴얼과 카피 — docs/work-orders/R11.md

### Phase 2 — 대시보드
- [ ] R21 대시보드 헤더·사용량 요약·탭 URL 동기화·카피 — docs/work-orders/R21.md
- [ ] R22 문서/발행/템플릿 카드 통일(DocumentTile), 체크박스·접근성, 상태 필터 — docs/work-orders/R22.md
- [ ] R23 에러·빈 상태·삭제 안전장치(템플릿 삭제 확인, 일괄 삭제 모달, alert 제거, id 매칭) — docs/work-orders/R23.md

### Phase 3 — 문서 편집·발행
- [ ] R31 업로드/서명 칸 지정 화면 리뉴얼과 "저장하고 발행하기" 연결 — docs/work-orders/R31.md
- [ ] R32 발행 화면 리뉴얼(문서 선택 카드, 비밀번호 선택, 유효기간 기본 14일, 카피) — docs/work-orders/R32.md

### Phase 4 — 서명자 화면
- [ ] R41 서명자 게이트·문서 목록: 보낸 사람 표시, 문서 수·마감, 비밀번호 UX·카피 — docs/work-orders/R41.md
- [ ] R42 서명 화면: sticky 진행 바, 다음 칸 이동, 페이지별 잔여, 스크롤 잠김 해제, 제출 확인, 에러 배너 — docs/work-orders/R42.md
- [ ] R43 서명 완료 화면 통합·고아 라우트 삭제·카피 — docs/work-orders/R43.md
- [ ] R44 서명 패드 품질(DPR 보정, 곡선 스무딩, 되돌리기, 닫기 확인) — docs/work-orders/R44.md

### Phase 5 — 요금제·계정
- [ ] R51 요금제 페이지 리뉴얼(카드, 토글 접근성, alert 제거, 개발 메모 제거, 추가문서 용어) — docs/work-orders/R51.md
- [ ] R52 계정(마이페이지)·결제 화면 구조 정리와 카피 — docs/work-orders/R52.md

### Phase 6 — 카피 전수
- [ ] R61 에러 문구 규칙·용어 표준 적용, 하드코딩 한글 UI i18n 화 — docs/work-orders/R61.md

## Decisions log
- 2026-09-02 홈은 아키텍트가 직접 리뉴얼 완료(커밋 포함). 루프는 홈을 건드리지 않는다.
- 2026-09-02 앱 내부 용어는 "발행" 유지, 상태 배지는 초안/발행됨/완료/만료 로 고정. 홈·서명자 화면만 "보내기/링크" 어휘.
- 2026-09-02 가격은 기존 데이터(달러) 유지. 요금제 숫자·문구 변경 없음.
- 2026-09-02 발행 폼 비밀번호는 선택, 유효기간 기본값 14일.
- 2026-09-02 서버 액션 errorCode 전환(R62)은 이번 루프 범위 밖. 별도 계획.

## Progress log
- 2026-09-02 계획 수립. 루프 시작 대기.

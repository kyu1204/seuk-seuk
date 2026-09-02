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
- 서브에이전트(Agent 도구)에 구현을 위임하지 않는다. 루프 턴은 10분 뒤 백그라운드 작업을 강제 종료하므로, 항상 본 세션에서 직접 구현하고 커밋한다. 워크트리에 커밋되지 않은 변경이 있으면 그것이 진행 중인 태스크의 산출물이니 이어서 완성한다.
- 태스크 하나 = 커밋 하나. 체크박스와 진행 로그를 같은 커밋에 갱신.

## Tasks

### Phase 0 — 토큰·전역
- [x] R01 전역 토큰 교체(잉크 네이비·도장 주홍·앰버), enableSystem, 클리셰 CSS·클래스 제거, locale 패리티 테스트 — docs/work-orders/R01.md
- [x] R02 공통 StatusBadge 컴포넌트와 상태 라벨 표준(초안/발행됨/완료/만료) — docs/work-orders/R02.md
- [x] R03 사이트 헤더 리뉴얼(앱 내비, aria-label, 스크롤 효과 정리) — docs/work-orders/R03.md

### Phase 1 — 인증
- [x] R11 로그인·회원가입·비밀번호 재설정·가입 완료 화면 리뉴얼과 카피 — docs/work-orders/R11.md

### Phase 2 — 대시보드
- [x] R21 대시보드 헤더·사용량 요약·탭 URL 동기화·카피 — docs/work-orders/R21.md
- [x] R22 문서/발행/템플릿 카드 통일(DocumentTile), 체크박스·접근성, 상태 필터 — docs/work-orders/R22.md
- [x] R23 에러·빈 상태·삭제 안전장치(템플릿 삭제 확인, 일괄 삭제 모달, alert 제거, id 매칭) — docs/work-orders/R23.md

### Phase 3 — 문서 편집·발행
- [x] R31 업로드/서명 칸 지정 화면 리뉴얼과 "저장하고 발행하기" 연결 — docs/work-orders/R31.md
- [x] R32 발행 화면 리뉴얼(문서 선택 카드, 비밀번호 선택, 유효기간 기본 14일, 카피) — docs/work-orders/R32.md

### Phase 4 — 서명자 화면
- [x] R41 서명자 게이트·문서 목록: 보낸 사람 표시, 문서 수·마감, 비밀번호 UX·카피 — docs/work-orders/R41.md
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
- 2026-09-02 R01 완료: globals.css 토큰을 잉크 네이비/도장 주홍/앰버로 교체, .bg-dot-pattern/.bg-grid-pattern/.gradient-text 삭제, tailwind.config.ts에 seal/amber 색 추가, layout.tsx enableSystem 활성화(defaultTheme="system"), 4개 화면(로그인/회원가입/가입완료/서명완료)에서 클리셰 클래스 제거, locale 패리티 테스트(ko.test.ts/en.test.ts) 추가. vitest 37개·tsc 통과.
- 2026-09-02 R02 완료: components/ui/status-badge-utils.ts(statusBadgeClass/statusLabelKey 순수 함수) + status-badge.tsx(StatusBadge, completed 시 Check 아이콘) 신규. document-card.tsx/publication-card.tsx/publication-detail-content.tsx(2곳) 의 ad-hoc getStatusBadge/getStatusColor·Badge variant 를 StatusBadge 로 교체. ko.ts/en.ts 상태 라벨 값(status.published/expired, dashboard.filter.published, dashboard.tabs.publications, publicationDetail.status.expired) 을 스펙 문구로 통일. vitest 55개·tsc 통과.
- 2026-09-02 R03 완료: site-header.tsx 를 sticky top-0 z-50 h-16 border-b bg-background/95 backdrop-blur 로 고정(스크롤 효과·bg-transparent 분기 삭제, showScrollEffect prop 은 무시하고 유지), 로그인 시 문서/요금제/결제 내비(usePathname prefix 매칭 강조) 추가, 로고·nav 에 aria-label 부여. theme-toggle.tsx/language-selector.tsx 를 아이콘 전용 36px(w-9) 버튼 + aria-label 로 교체. locale에 header.nav.documents/pricing/bills, header.themeToggle, header.languageSelect 추가(ko/en). vitest 65개·tsc 통과.
- 2026-09-02 R21 완료: dashboard-header.tsx 를 단일 h1/설명 + `발행하기`(outline, Link2)/`문서 올리기`(default, Upload) 2버튼으로 단순화, 기존 드롭다운(문서 업로드/템플릿 만들기)·`dashboard.upload.template*` 사용 제거. usage-widget.tsx 를 Collapsible 카드에서 `rounded-xl border bg-card px-5 py-3.5 flex ... md:items-center` 1줄 요약 바로 재작성(이번 달 보낸 문서/진행 중인 문서 항목 2개 + 6px 진행 바 bg-muted/bg-primary, 80%↑ bg-amber, 100% bg-seal+`usage.limit.reachedHint`, 오른쪽 `usage.managePlan` → /pricing). dashboard-content.tsx 에 `useSearchParams`/`useRouter` 도입, `resolveTab`(신규 dashboard-tabs.ts) 로 초기 탭 결정, 탭 변경 시 `router.replace(/dashboard?tab=..., { scroll:false })`, searchParams 변경을 반영하는 useEffect 추가, 문서 탭 라벨 옆 `(전체 개수)` 표시. templates-list.tsx 의 발행 성공 이동을 `/dashboard?tab=publications` 로 변경. ko.ts/en.ts 에 dashboard.header.description/dashboard.publish/dashboard.upload.document 값 교체, usage.summary.sent/usage.summary.active/usage.managePlan/usage.limit.reachedHint 추가. vitest 114개·tsc 통과.
- 2026-09-02 R11 완료: app/(auth)/components/auth-shell.tsx 신규(min-h-screen md:grid md:grid-cols-2, 좌측 bg-primary 브랜드 패널 + 완료 상태 미니 카드, 우측 폼 슬롯, 모바일 전용 로고). LoginPage/RegisterPage/ForgotPasswordPage/register/success/page.tsx 를 AuthShell 로 재구성: 로그인엔 카카오·구글(44px, h-11) + or-이메일 구분선 + 비밀번호 옆 재설정 링크(44px 터치 타깃) + 보기 토글(aria-label) + state.error 폼 레벨 배너, 회원가입엔 약관 문구를 register.agreeText 로 통합(& 구분자 제거)하고 비밀번호 힌트·미동의 시 agreeRequired 문구·제출 버튼 항상 활성화, 비밀번호 찾기는 재전송이 실제 forgotPassword 서버 액션을 다시 호출하고 30초 쿨다운(resendIn) 을 두도록, 가입완료는 checkEmail/emailSent 카피로 교체(구 register.success.title 미사용). google-login-button.tsx/kakao-login-button.tsx 도 h-11 + login.google 로케일 키로 정리. ko.ts/en.ts 에 auth.panel.*, login.orEmail/togglePassword/google, register.agreeText/termsOfService/passwordHint/agreeRequired, forgotPassword.title/resendIn/checkInbox, register.success.checkEmail/emailSent 추가·값 수정, ko.test.ts/en.test.ts 에 R11 assertion 추가. vitest 90개·tsc 통과, AuthShell 4개 페이지 각 1건 이상·`" & "` 구분자 0건 확인.
- 2026-09-02 R22 완료: components/dashboard/document-tile.tsx 신규(role="button"/aria-pressed 선택형 카드, Checkbox aria-label, h-36, hover:border-primary/30, status 는 옵셔널이라 배지 없는 카드도 지원, disabledReason 텍스트, actions 슬롯). document-card.tsx/publication-card.tsx/templates-list.tsx 를 DocumentTile 사용으로 교체(수기 svg 체크박스·border-gray-300·role="link" 제거), publication-card 는 복사/열기/삭제 액션 버튼(aria-label)로 정리하고 복사 성공을 toast 로만 알림. status-filter.tsx 를 칩 버튼(bg-primary/10 선택·border 비선택, h-[30px], 자체 mb-6 제거)으로 재작성. bulk-delete-header.tsx 는 sticky top-16 + X 버튼 aria-label. dashboard-skeleton.tsx 는 DocumentCardsSkeletonGrid 재사용. document/publication/template 그리드 3곳 + 스켈레톤을 `grid gap-5 sm:grid-cols-2 lg:grid-cols-4` 로 통일. document-actions.ts 의 getUserDocumentsClient select 에 page_count 추가. 스코프 단순화: dashboard.card.signatures(서명 완료/전체) 는 목록 쿼리에 서명 집계 조인이 없어 실제로 연결하지 않았고, document-card/templates 의 metaRight 는 모두 page_count 기반 dashboard.card.areas/templates.card.areas 로 표시(로케일 키 자체는 스펙대로 추가). ko.ts/en.ts 에 dashboard.card.*, templates.card.areas, publications.card.copyLink/copied/open/documentCount, bulkDelete.cannotDelete, selectionMode.enter/exit 값 교체. vitest 140개·tsc 통과, role="link"·border-gray-300·scale-[1.02] 0건 확인.
- 2026-09-02 R23 완료: templates-list.tsx 카드 삭제를 AlertDialog 확인(templates.delete.confirmTitle/confirmDescription/confirm text-destructive, common.cancel) + 성공/실패 토스트(templates.delete.success/error, templates.publish.success)로 교체. bulk-delete-modal.tsx 에 items prop(id/name/status) 추가, 상위 3개 이름 목록(ul list-disc)+andMore, 초안/완료 경고, count 반영 확인 버튼(bulkDelete.confirmDelete). dashboard-content.tsx/publications-list.tsx 일괄 삭제 실패 매칭을 id 기준 failedIds:Set<string> 로 전환, 진행 표시(bulkDelete.progress)를 모달 버튼 라벨에 반영. dashboard-content.tsx/publications-list.tsx/templates-list.tsx 의 `Error: {error}` 를 각각 error.load 키 + common.retry 버튼(재조회)으로 교체. publication-card.tsx 의 alert() 2곳을 toast.error(dashboard.publications.delete.error) 로 교체(영어 하드코딩 제거). delete-document-modal.tsx 전체 한글 하드코딩을 documentDetail.delete.*/common.* 키로 치환. 스코프 외 발견된 alert() 2곳(publication-detail-content.tsx, PricingPage.tsx)도 전역 grep 수용 기준(0건) 충족을 위해 toast.error 로 함께 정리. 빈 상태 카피(dashboard/publications/templates .empty.*) 스펙 문구로 교체. common.cancel/retry/delete/deleting 추가. ko.ts/en.ts 키 패리티 유지. vitest 165개·tsc 통과, alert(/Error: { 소스 0건, delete-document-modal.tsx 한글 0건 확인.
- 2026-09-03 R32 완료: page.tsx 를 async 서버 컴포넌트로 유지하되 하드코딩 h1 을 제거하고 searchParams.doc 을 preselectedDocumentId 로 PublishPageContent 에 전달, 신규 서버 액션 getDocumentSignatureCounts(documentIds)(document-actions.ts, signatures 테이블 group count) 로 서명 칸 수를 조회해 함께 넘김. PublishPageContent.tsx 에 뒤로가기(common.back, router.back)+h1 publish.title+설명 publish.description 헤더를 추가하고 문서 목록 에러/빈 상태/PublishForm 분기를 그대로 유지(에러는 error prop 로 client 에서 렌더). publish-form.tsx 전면 재작성: `grid lg:grid-cols-[1fr_360px]` 2칼럼(좌측 문서 목록 카드 - 카드형 행 border-primary/bg-primary/5 선택 표시, 서명 칸 0개 문서는 Checkbox disabled+opacity-60+publish.documents.noAreas, 있으면 publish.documents.meta(pages·signatures); 우측 이름/비밀번호(선택, 빈 값 허용은 서버 액션이 이미 지원)/만료일(기본 오늘+14일, Popover Calendar)/제출), 필드별 에러(이름 focus, 문서 선택 목록 위) 로 분리, text-gray-500 → text-muted-foreground, 성공 시 toast.success(publish.success) 후 기존 라우팅 유지. ko.ts/en.ts 에 publish.description/nameHint/passwordHint/password.optional/documents.*/success 추가, submit/submitting/expirationHint/namePlaceholder/errorPublishing 값 스펙대로 교체. ko.test.ts/en.test.ts 에 R32 값 검증 추가, document-actions.test.ts 에 getDocumentSignatureCounts export 검증 추가, 3개 신규 테스트 파일(page.test.tsx/PublishPageContent.test.tsx/publish-form.test.tsx, fs.readFileSync 소스 검증). vitest 195개·tsc 통과, `grep -c "[가-힣]" page.tsx` 0 확인.
- 2026-09-03 R41 완료: lib/publications/sender-name.ts 신규(deriveSenderName: full_name→name→이메일 로컬파트→"" 순, +sender-name.test.ts). publication-actions.ts 의 getPublicationByShortUrl 이 createServiceSupabase().auth.admin.getUserById 로 발행자 조회 후 deriveSenderName 적용(실패 시 "" fallback, catch 로 흡수), senderName/name/documentCount/expiresAt 을 requiresPassword 여부와 무관하게 항상 함께 반환. page.tsx 는 senderName 을 SignPageContainer 로 전달하고 메타데이터의 "외 N건" 하드코딩을 locale 객체 직접 import(ko/en) 로 조회하는 sign.meta.andMore 로 교체. 신규 SignHeader.tsx(로고+LanguageSelector, h-14 px-5 border-b bg-background) 를 not-found.tsx/SignPageContainer.tsx(completed 뷰)/SignDocumentList.tsx(비밀번호 게이트·목록·만료·완료 4개 상태)/SignSingleDocument.tsx(3곳) 에서 공통 사용. SignDocumentList.tsx 를 게이트(sign.gate.sentBy/sentByUnknown+h1+sign.gate.summary·summaryNoExpiry, M월 D일/MMM D 포맷)+비밀번호 카드(48px 입력+보기 토글 aria-label=login.togglePassword+sign.password.help+trustNote+약관/개인정보 링크)+문서 목록(행 카드 rounded-xl border bg-card, StatusBadge 완료 또는 sign.documentList.pending, signaturesCompleted, sign/view 버튼)으로 재작성. not-found.tsx 버튼을 variant="outline" 으로. ko.ts/en.ts 에 sign.gate.*, sign.password.title/description/help/incorrect/error/trustNote, sign.documentList.description/pending/signaturesCompleted/sign/view, sign.meta.andMore, sign.expired.message, sign.notFoundDesc 추가. 신규 테스트 6개(SignHeader/SignPageContainer/SignDocumentList/SignSingleDocument/not-found/page, fs.readFileSync 소스 검증) + publication-actions.test.ts. page.test.tsx 의 `senderName={senderName}` 기대값을 실제 소스의 `senderName={senderName || ""}` 로 수정. vitest 243개·tsc 통과, `text-gray-|bg-green-50|bg-red-50|bg-white` app/(sign) 소스 0건(테스트 파일 매칭 제외), SignHeader 참조 4파일 이상 확인.
- 2026-09-03 R31 완료: UploadPage.tsx 헤더를 upload.page.title/description 로 교체(text-3xl→text-2xl). document-upload.tsx 편집 뷰 상단에 새 툴바(뒤로가기 ghost aria-label=common.back → showClearAllModal 확인 후 초기화, 파일명 text-xl font-bold, upload.meta 요약, [저장하기 outline]/[저장하고 발행하기 default]) 추가, 기존 지우기/전체삭제/추가 버튼은 보조 줄로 이동. 본문을 `grid lg:grid-cols-[260px_minmax(0,1fr)] gap-5` 로 재구성: 좌측 칸 추가 카드(upload.signature/upload.textArea 버튼 + upload.areaHint) + 지정한 칸 목록 카드(각 행 삭제 아이콘 버튼 aria-label=common.delete, order-2 on mobile), 우측 PDF 페이지 네비(aria-label 부여)·줌 툴바(bg-muted, 기존 플로팅 bg-white/90 오버레이 제거)·캔버스(bg-muted). handleSaveDocument 를 (publishAfter, bypassAreaCheck) 파라미터로 확장: 전체 서명 칸이 0개면 새 upload.noAreas 다이얼로그(칸 지정하기/그대로 저장)로 확인 후 저장, 부분 누락은 기존 검증 모달 유지. 저장하고 발행하기 성공 시 `/publish?doc=${id}` 로 이동, 일반 저장은 toast.success(upload.saved) 후 기존 라우팅. 언어 판별 문자열 비교(`t("upload.clear") === "지우기"`) 제거하고 common.cancel 사용. 하드코딩 색 bg-white/90·bg-red-50·bg-gray-100 을 bg-destructive/10 text-destructive·bg-muted 로 교체, 캐러셀 점 표시 bg-green-400(금지 패턴) 을 bg-primary/60 으로 교체. PDF 캡처 실패 한글 하드코딩을 upload.error.capture 로 교체. area-selector.tsx 는 모바일 max-h-[50vh] 캡을 제거해 max-h-[70vh] 로 통일. 드래그 컨테이너 touchAction 을 isDragging 기준 'none'/'pan-y' 로 전환. 드롭존 타이틀/설명을 upload.dropzone.title/upload.dragDrop(값 변경) 로 교체. ko.ts/en.ts 에 upload.page.*, upload.dropzone.title, upload.meta, upload.areaHint, upload.areaList, upload.saveAndPublish, upload.saved, upload.noAreas.*, upload.error.capture, common.back 추가(값 교체 포함), ko.test.ts 에 R31 값 검증 블록 추가. 새 테스트 파일 3개(UploadPage.test.tsx/document-upload.test.tsx/area-selector.test.tsx, fs.readFileSync 소스 검증) 작성. vitest 186개·tsc 통과, `=== "지우기"` 0건·`publish?doc=` 1건·전역 gradient-text 등/alert( 0건(실제 소스, 테스트 파일 언급 제외) 확인.

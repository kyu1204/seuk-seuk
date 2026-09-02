# 슥슥 리뉴얼 스펙 (루프용 단일 기준)

시안: 아티팩트 "슥슥 리뉴얼 시안" (아키텍트 보관). 이 문서가 코드 기준이다.

## 토큰 (app/globals.css)
라이트:
- --primary: 213 52% 25% (#1E3A5F 잉크 네이비) / --primary-foreground: 0 0% 100%
- --ring: 213 52% 25%
- --seal: 9 66% 48% (#C8412B 도장 주홍) / --seal-soft: 14 77% 94%
- --amber: 39 79% 34% (#9A6B12) / --amber-soft: 41 65% 90%
- --background: 216 27% 97% (#F7F8FA) / --card: 0 0% 100%
- --foreground: 222 51% 16% (#14213D)
- --muted: 216 24% 95% / --muted-foreground: 215 12% 44%
- --border: 214 22% 91% / --input: 214 18% 83%
- --radius: 0.5rem 유지
다크:
- --primary: 213 55% 75% / --primary-foreground: 222 51% 10%
- --seal: 12 80% 68% / --seal-soft: 12 35% 17%
- --amber: 41 70% 62% / --amber-soft: 41 40% 16%
- 나머지는 기존 다크 값 유지.
Tailwind: colors 에 seal {DEFAULT, soft}, amber {DEFAULT, soft} 추가.

## 타이포
- 서체: Pretendard Variable (layout.tsx 에 이미 적용). 페이지 h1 = `text-2xl md:text-[28px] font-bold tracking-tight`, 섹션 h2 = `text-lg font-semibold`, 보조 = `text-sm text-muted-foreground`, 힌트 = `text-xs text-muted-foreground`.
- 페이지 헤더 패턴: 왼쪽 h1 + 한 줄 설명(text-muted-foreground), 오른쪽 주요 액션 버튼 1~2개. `flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4`.

## 상태 배지 (components/ui/status-badge.tsx)
- draft → "초안" `bg-muted text-muted-foreground`
- published / active → "발행됨" `bg-primary/10 text-primary`
- completed → "완료" `bg-seal-soft text-seal` + Check 아이콘 12px
- expired → "만료" `bg-amber-soft text-amber`
- 모양: `inline-flex items-center gap-1 h-6 px-2.5 rounded-full text-xs font-medium`

## 카드 (DocumentTile)
- 컨테이너 `rounded-xl border bg-card overflow-hidden`, hover `hover:border-primary/30 transition-colors` (scale 금지)
- 썸네일 영역 높이 `h-36` `bg-muted`, 좌상단 StatusBadge
- 본문 `p-4`: 제목 `font-semibold truncate`, 아래 줄 `text-xs text-muted-foreground flex justify-between` (날짜 · 서명 n/m 또는 문서 n개)
- 선택 모드: 좌상단 `components/ui/checkbox` 사용, 카드 전체 `role="button"` + `aria-pressed` + tabIndex=0 + Enter/Space 처리

## 버튼
- 기본 40px. 페이지 주요 CTA 는 `size="lg"`(48px). 아이콘 전용 버튼은 반드시 aria-label.
- 파괴적 액션: `variant="outline"` + `text-destructive border-destructive/40`.

## 카피 원칙
- 에러: "무엇을 못 했는지 + 다음 행동". 예 "문서를 삭제하지 못했습니다. 다시 시도해 주세요." "~중 오류가 발생했습니다" 금지.
- 빈 상태: 제목(초대) + 한 줄 설명 + 버튼. 예 "서명받을 문서를 올려보세요 / 문서를 올리고 서명 위치만 찍으면, 링크 하나로 서명을 받을 수 있어요. / [문서 올리기]"
- 어미: 행동 유도 "~하세요", 부탁 "~해 주세요"(띄어쓰기), 상태 서술 "~합니다".
- 용어: 삭제(제거 금지), 추가문서(크레딧 금지, 붙여쓰기), 개인정보처리방침(붙여쓰기), "불러오는 중…", "저장 중…", 템플릿(양식 금지).

## 화면별 요약 (자세한 것은 각 work order)
- 로그인/가입: 좌측 네이비 패널(bg-primary, 브랜드 문장 + 미니 문서 카드), 우측 폼 380px. 모바일은 패널 숨기고 상단에 로고.
- 대시보드: 헤더(내 문서 / 문서를 올리고 서명을 받아보세요. / [발행하기][문서 올리기]) → 사용량 요약 바 1줄(이번 달 보낸 문서 n/m, 진행 중 문서 n/m, 플랜 관리 링크) → 탭(문서 n · 발행됨 n · 템플릿 n, URL ?tab=) → 상태 필터 칩 → 카드 그리드 4열(lg)/2열(sm)/1열.
- 업로드(서명 칸 지정): 상단 뒤로가기 + 문서명 + 메타(쪽수·칸 수) + [저장하기][저장하고 발행하기]. 좌측 260px 패널(칸 추가: 서명 칸/텍스트 칸, 지정한 칸 목록), 우측 문서 캔버스(페이지 이동, 줌 표시).
- 발행: 좌측 보낼 문서 선택 목록(카드형 체크, 칸 없는 문서는 안내 텍스트), 우측 카드(발행 이름, 비밀번호(선택), 유효기간(기본 14일), [링크 만들기]).
- 서명자 게이트: "{보낸 사람}님이 보낸 서명 요청" → 발행 이름 h1 → "문서 n개 · 서명 칸 m곳 · M월 D일까지" → 카드(자물쇠, 비밀번호를 입력해 주세요, 설명, 입력(보기 토글), [문서 열기], 비밀번호를 모르시나요? 보낸 사람에게 문의하세요.) → 하단 "이 링크는 슥슥을 통해 전송되었습니다 · 이용약관 · 개인정보처리방침".
- 서명 화면(모바일 우선): sticky 상단(뒤로, 문서명, "n/m쪽 · 서명 a/b", [한 번에 서명]) + 4px 진행 바 → 안내 줄("파란 칸을 눌러 서명하세요" / [다음 칸으로]) → 문서 → 페이지 칩(1쪽 · 1 남음) → sticky 하단 제출 버튼(비활성 시 라벨 "서명 n곳을 더 채우면 제출할 수 있어요", 활성 시 "문서 제출하기") + "제출하면 서명을 수정할 수 없습니다."
- 서명 완료: 주홍 체크 → "서명이 끝났습니다" → 설명 → 다운로드 카드 → 남은 문서 카드(있을 때) → "보낸 사람에게도 완료 알림이 갔습니다."(이메일 발송 대상일 때만)
- 요금제: 헤더(요금제 / 현재 플랜·사용량·다음 결제) + 월간/연간 토글(radiogroup) → 카드 3열(현재 플랜 배지) → 추가문서 카드.
- 계정: 프로필 카드(이름, 이메일, 가입일, [변경 사항 저장]) → 플랜과 사용량 카드 → 계정 삭제 카드(제목 "계정 삭제", 경고 붉은 테두리).

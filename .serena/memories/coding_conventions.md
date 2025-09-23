# 코딩 컨벤션 및 스타일 가이드

## TypeScript 사용
- 모든 파일에서 TypeScript 사용
- 엄격한 타입 검사 적용

## React 컴포넌트 패턴
- 함수형 컴포넌트 사용
- `"use client"` 지시어로 클라이언트 컴포넌트 구분
- React Hooks 사용 (useState, useEffect 등)

## 파일 명명 규칙
- 컴포넌트: PascalCase (HomePage.tsx, DocumentUpload.tsx)
- 페이지: page.tsx (Next.js App Router 규칙)
- 유틸리티: kebab-case (auth-actions.ts, language-context.tsx)

## Import 순서
1. React 및 Next.js 관련
2. 외부 라이브러리
3. 내부 컴포넌트 및 컨텍스트
4. 유틸리티 및 타입

## 스타일링 규칙
- Tailwind CSS 클래스 사용
- cn() 유틸리티로 조건부 스타일링
- Radix UI 컴포넌트 기반

## 상태 관리
- React Context 사용 (AuthContext, LanguageContext)
- 로컬 상태는 useState Hook 사용

## 에러 핸들링
- try-catch 블록 사용
- toast 알림으로 사용자 피드백 제공
# 코드베이스 구조

## 폴더 구조
```
/app                    # Next.js App Router
├── /document/[id]      # 문서 상세 페이지
├── /sign/[id]          # 서명 페이지
├── /sign/[id]/completed # 서명 완료 페이지
├── /register           # 회원가입
├── /login              # 로그인
├── /upload             # 문서 업로드/대시보드
├── /actions            # Server Actions
├── HomePage.tsx        # 홈페이지 컴포넌트
└── layout.tsx          # 루트 레이아웃

/components             # 재사용 컴포넌트
├── /ui                 # Radix UI 기반 컴포넌트들
├── document-upload.tsx
├── language-selector.tsx
├── theme-toggle.tsx
└── signature-modal.tsx

/contexts               # React Context
├── language-context   # 다국어 지원
└── auth-context       # 인증 관리

/hooks                  # Custom Hooks
/lib                    # 유틸리티 함수
/public                 # 정적 파일
/styles                 # 스타일 파일
```

## 주요 페이지
- `/` - 홈페이지 (랜딩)
- `/login` - 로그인
- `/register` - 회원가입  
- `/upload` - 문서 업로드/대시보드
- `/document/[id]` - 문서 상세
- `/sign/[id]` - 서명 페이지
- `/sign/[id]/completed` - 서명 완료
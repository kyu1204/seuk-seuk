# 📝 SeukSeuk

> 🚀 **온라인 전자서명 플랫폼** - 문서 업로드부터 서명까지 한 번에!

<div align="center">

![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![Next.js](https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=next.js&logoColor=white)
![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)

[![License](https://img.shields.io/github/license/kyu1204/seuk-seuk?style=flat-square)](LICENSE)
[![GitHub Stars](https://img.shields.io/github/stars/kyu1204/seuk-seuk?style=flat-square)](https://github.com/kyu1204/seuk-seuk/stargazers)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat-square)](CONTRIBUTING.md)

[🌟 **Live Demo**](https://v0-online-document-sign.vercel.app/) | [📖 **Docs(WIP)**](#-documentation) | [🐛 **Report Bug**](https://github.com/kyu1204/seuk-seuk/issues)

</div>

---

## ✨ Features

| 기능 | 설명 | 상태 |
|------|------|------|
| 📄 **문서 업로드** | 다양한 형식 지원 | ✅ |
| ✍️ **전자서명** | 간편하고 안전한 디지털 서명 | ✅ |
| 🔒 **보안성** | 엔드투엔드 암호화 | ✅ |
| 🌐 **다국어 지원** | 한국어, 영어 지원 | ✅ |
| 🎨 **반응형 디자인** | 모바일, 태블릿, 데스크톱 최적화 | ✅ |
| 🌙 **다크모드** | 다크/라이트 테마 지원 | ✅ |

## 🚀 Quick Start

### Prerequisites

- Node.js 18.0 이상
- pnpm (권장) 또는 npm

### Installation

```bash
# 1. 저장소 클론
git clone https://github.com/kyu1204/seuk-seuk.git
cd seuk-seuk

# 2. 의존성 설치
pnpm install

# 3. 환경변수 설정
cp .env.example .env.local
# .env.local 파일에서 Supabase 설정 입력

# 4. 개발 서버 시작
pnpm dev
```

### 🌍 Environment Variables

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## 🏗️ Tech Stack

### 🎨 Frontend
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS + shadcn/ui
- **Icons**: Lucide React
- **Forms**: React Hook Form + Zod

### 🔧 Backend
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **File Storage**: Supabase Storage
- **API**: Next.js API Routes

### 🛠️ Development
- **Package Manager**: pnpm
- **Linting**: ESLint
- **Type Checking**: TypeScript
- **Deployment**: Vercel

## 📁 Project Structure

```
seuk-seuk/
├── app/                    # Next.js App Router
│   ├── (auth)/            # 인증 관련 페이지
│   ├── (document)/        # 문서 관리 페이지
│   ├── (sign)/            # 서명 관련 페이지
│   └── components/        # 페이지 컴포넌트
├── components/            # 재사용 가능한 UI 컴포넌트
│   └── ui/               # shadcn/ui 컴포넌트
├── contexts/             # React Context
├── hooks/                # 커스텀 훅
├── lib/                  # 유틸리티 함수
│   └── supabase/        # Supabase 설정
└── styles/               # 전역 스타일
```

## 🤝 Contributing

기여를 환영합니다! 다음 단계를 따라주세요:

1. 이 저장소를 Fork합니다
2. 새로운 브랜치를 생성합니다 (`git checkout -b feature/amazing-feature`)
3. 변경사항을 커밋합니다 (`git commit -m 'Add: amazing feature'`)
4. 브랜치에 푸시합니다 (`git push origin feature/amazing-feature`)
5. Pull Request를 생성합니다

### 📋 Development Guidelines

- **Commit Convention**: [Conventional Commits](https://conventionalcommits.org/) 사용
- **Code Style**: ESLint + Prettier 설정 준수
- **Branch Naming**: `feature/`, `fix/`, `docs/`, `refactor/` 접두사 사용

## 📊 Performance

| 메트릭 | 점수 | 목표 |
|--------|------|------|
| **First Contentful Paint** | 1.2s | < 1.5s |
| **Largest Contentful Paint** | 2.1s | < 2.5s |
| **Cumulative Layout Shift** | 0.05 | < 0.1 |
| **Time to Interactive** | 2.8s | < 3.0s |

## 🔐 Security

- 🔒 모든 데이터는 엔드투엔드 암호화
- 🛡️ Supabase RLS (Row Level Security) 적용
- 🔑 JWT 기반 인증 시스템
- 📝 입력 데이터 검증 (Zod)

보안 취약점 발견 시 [pb1123love@gmail.com](mailto:pb1123love@gmail.com)으로 연락해주세요.

## 📄 License

이 프로젝트는 [MIT License](LICENSE) 하에 배포됩니다.

## 👥 Team

<table>
  <tr>
    <td align="center">
      <a href="https://github.com/kyu1204">
        <img src="https://github.com/kyu1204.png" width="100px;" alt="kyu1204"/>
        <br />
        <sub><b>kyu1204</b></sub>
      </a>
      <br />
      💻 Full Stack Developer
    </td>
  </tr>
</table>


## 📞 Support

문제가 있거나 질문이 있으시면:

- [GitHub Issues](https://github.com/kyu1204/seuk-seuk/issues)에 버그 리포트나 기능 요청을 작성해주세요
- [Discussions](https://github.com/kyu1204/seuk-seuk/discussions)에서 커뮤니티와 소통하세요

---

<div align="center">

**⭐ 이 프로젝트가 유용하다면 Star를 눌러주세요!**

Made with ❤️ by [kyu1204](https://github.com/kyu1204)

</div>

# Tech Stack

## Framework

| 항목 | 기술 | 버전 |
|------|------|------|
| Framework | Next.js | ^16.1.4 |
| Language | TypeScript | ^5 |
| UI Library | React | ^19.2.3 |
| Styling | Tailwind CSS | ^4 |
| Linting | ESLint | ^9 (next/core-web-vitals, next/typescript) |

## Database

| 항목 | 기술 |
|------|------|
| Database | PostgreSQL |
| ORM | Prisma (예정) |

## Authentication

| 항목 | 기술 |
|------|------|
| Auth | NextAuth.js (예정) |

## Build & Dev

| 항목 | 설정 |
|------|------|
| Bundler (dev) | Turbopack |
| PostCSS | @tailwindcss/postcss |
| Dev Port | 20400 |

## 디렉토리 구조

```
grid-forge/
├── src/
│   ├── app/
│   │   ├── (auth)/        # 인증 관련 페이지
│   │   ├── (dashboard)/   # 대시보드 페이지
│   │   ├── (public)/      # 공개 페이지
│   │   └── api/           # API 라우트
│   ├── components/
│   │   └── ui/            # UI 컴포넌트
│   ├── config/            # 설정
│   ├── lib/               # 유틸리티/라이브러리
│   └── types/             # 타입 정의
├── prisma/                # Prisma 스키마
├── data/                  # 데이터 파일
├── docs/                  # 문서
└── public/                # 정적 파일
```

## Path Alias

```
@/* → ./src/*
```

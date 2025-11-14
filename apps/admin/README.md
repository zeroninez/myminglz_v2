# Admin App

MyMinglz 관리자 앱입니다.

## 개발 서버 실행

```bash
# admin 앱만 실행 (포트 3001)
cd apps/admin
npm run dev

# 또는 루트에서 전체 실행
cd ../../
pnpm dev
```

## 접속

- 개발 서버: http://localhost:3001
- 로그인: http://localhost:3001/login
- 대시보드: http://localhost:3001/dashboard

## 구조

```
apps/admin/
├── src/
│   └── app/
│       ├── login/          # 로그인 페이지
│       ├── dashboard/      # 대시보드
│       ├── layout.tsx      # 루트 레이아웃
│       ├── page.tsx        # 루트 페이지 (로그인으로 리다이렉트)
│       └── globals.css     # 전역 스타일
├── package.json
├── next.config.js
└── tsconfig.json
```

## 특징

- ✅ 사용자 앱(web)과 완전히 분리
- ✅ 독립적인 번들 (admin 코드가 사용자 앱에 포함되지 않음)
- ✅ 별도 포트 (3001)에서 실행
- ✅ 무거운 라이브러리 자유롭게 추가 가능


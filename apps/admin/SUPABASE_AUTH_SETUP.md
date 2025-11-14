# Supabase Auth 설정 가이드 🔐

## ✅ 완료된 작업

### 1. API 라우트 생성
- ✅ `/api/signup` - 회원가입
- ✅ `/api/login` - 로그인
- ✅ `/api/logout` - 로그아웃
- ✅ `/api/session` - 세션 확인

### 2. 페이지 구현
- ✅ `/signup` - 이메일 인증 + 회원가입
- ✅ `/login` - 로그인
- ✅ `/dashboard` - 관리자 대시보드 (세션 보호)

### 3. 인증 흐름
```
회원가입: 이메일 인증 → 코드 확인 → 계정 생성 (Supabase Auth)
로그인: 이메일/비밀번호 → Supabase Auth → 쿠키 저장
세션: httpOnly 쿠키 (access + refresh token)
```

---

## 🚀 Supabase 설정 (필수)

### 1. Supabase 대시보드에서 Auth 설정

#### **이메일 확인 비활성화 (개발용)**
```
Dashboard → Authentication → Settings → Email Auth
→ "Confirm email" 끄기 (OFF)
```
> 💡 개발 중에는 이메일 확인 없이 바로 가입 가능

#### **프로덕션 환경 (실서비스)**
```
Dashboard → Authentication → Email Templates
→ 이메일 템플릿 커스터마이징 (선택)
```

---

### 2. Row Level Security (RLS) 확인

Supabase는 기본적으로 `auth.users` 테이블을 자동 관리합니다.
추가 RLS 설정은 필요 없습니다! ✨

---

### 3. 환경 변수 확인

`.env.local`에 다음 값들이 있는지 확인:
```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJ...
```

---

## 🧪 테스트 방법

### 1️⃣ 회원가입 테스트
```
1. http://localhost:3001/signup 접속
2. 이메일 입력 → 인증 코드 받기
3. 코드 입력 → 계정 정보 입력
4. 회원가입 완료
```

**콘솔 로그:**
```
📧 이메일 발송 시도: test@email.com
✅ 이메일 발송 성공
🔍 인증 시도
✅ 인증 성공
📝 회원가입 시도: test@email.com
✅ 회원가입 성공: user-id-here
```

### 2️⃣ 로그인 테스트
```
1. http://localhost:3001/login 접속
2. 가입한 이메일/비밀번호 입력
3. 로그인 → 대시보드로 자동 이동
```

**콘솔 로그:**
```
🔑 로그인 시도: test@email.com
✅ 로그인 성공: user-id-here
```

### 3️⃣ 세션 보호 테스트
```
1. 로그아웃하기
2. 직접 http://localhost:3001/dashboard 접속
3. 자동으로 /login으로 리다이렉트 ✅
```

---

## 🔧 주요 기능

### ✅ 비밀번호 자동 해싱
- Supabase가 자동으로 bcrypt 해싱
- 직접 구현 불필요

### ✅ 세션 관리
- httpOnly 쿠키 (XSS 공격 방어)
- 7일 유효 (자동 갱신)
- refresh token 지원

### ✅ 보안 기능
- CSRF 보호 (SameSite 쿠키)
- 자동 토큰 갱신
- 프로덕션 환경 secure 쿠키

---

## 📊 Supabase 대시보드에서 확인

### 회원 목록 보기
```
Dashboard → Authentication → Users
→ 가입된 모든 사용자 목록 확인
```

### 로그 확인
```
Dashboard → Logs
→ 실시간 인증 로그 확인
```

---

## 🎯 다음 단계 (선택)

### 1. 비밀번호 재설정 (추후)
```typescript
// /api/forgot-password
const { error } = await supabase.auth.resetPasswordForEmail(email);
```

### 2. 이메일 변경 (추후)
```typescript
// /api/change-email
const { error } = await supabase.auth.updateUser({ email: newEmail });
```

### 3. 소셜 로그인 (추후)
```
Dashboard → Authentication → Providers
→ Google, GitHub 등 활성화
```

---

## ⚠️ 주의사항

### 1. 쿠키 이름 충돌 방지
현재 쿠키 이름: `sb-access-token`, `sb-refresh-token`

### 2. 프로덕션 배포 시
- `.env.local` → 환경 변수로 설정
- `secure: true` 쿠키 자동 적용됨
- HTTPS 필수

### 3. Supabase URL은 공개 가능
- `NEXT_PUBLIC_SUPABASE_URL` - 클라이언트에서 사용 가능
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - 클라이언트에서 사용 가능
- RLS가 보안을 담당하므로 안전함

---

## 🎉 완료!

이제 완전히 작동하는 관리자 인증 시스템이 완성되었습니다!

**테스트 순서:**
1. 서버 재시작 (이미 실행 중)
2. `/signup`에서 회원가입
3. `/login`에서 로그인
4. `/dashboard` 확인
5. 로그아웃 테스트

**문제 발생 시:**
- 콘솔 로그 확인
- Supabase Dashboard → Logs 확인
- 브라우저 개발자 도구 → Network 탭 확인


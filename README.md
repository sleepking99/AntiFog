# 📅 9인의 모임 날짜 조율기 (AntiFogWeb)

카카오톡 등 단체 메신저(9명)에 링크 하나만 공유하면 별도의 회원가입이나 앱 설치 없이 접속하여, 각자의 불가능한 일정을 체크하고 모두가 모일 수 있는 최적의 날짜(Best Days)를 실시간으로 조율하는 웹 애플리케이션입니다.

---

## 🌟 주요 특징
- **No App, No Signup**: 링크를 누르고 본인 이름만 누르면 즉시 일정 입력 가능
- **고유 9색 팔레트**: 9명 각자에게 명확한 고유 컬러를 부여하여 달력 날짜 셀마다 누가 안 되는지 색상 도트로 직관적 시각화
- **불가(Impossible) 날짜 토글**: '❌ 불가 날짜 선택 모드'로 탭 한 번에 불가능한 날짜 등록/해제
- **황금 날짜 (Best Days) 자동 계산**: 9명 전원 가능한 날은 골드 하이라이트(👑) 및 상단 배너로 즉시 추천
- **실시간(Realtime) 동기화**: Supabase Realtime WebSocket을 통해 한 명이 날짜를 바꾸면 다른 8명의 화면에 0.1초 만에 반영
- **모바일 완벽 최적화**: 스마트폰 브라우저 환경에 최적화된 터치 UI/UX

---

## 🛠 기술 스택
- **프론트엔드**: React, TypeScript, Vite, Tailwind CSS, Lucide React, Canvas-Confetti
- **백엔드 & 데이터베이스**: Supabase (PostgreSQL + Realtime WebSocket) - 무료 티어로 평생 충분
- **호스팅 및 배포**: Vercel (무료 HTTPS, GitHub 자동 연동 배포)

---

## 🚀 1. Supabase 데이터베이스 세팅 (1분 소요)
1. [supabase.com](https://supabase.com)에 로그인 후 **새 프로젝트(New Project)**를 무료로 생성합니다.
2. 좌측 메뉴에서 **SQL Editor**로 이동합니다.
3. 이 저장소의 `supabase/schema.sql` 파일 내용을 전체 복사하여 붙여넣고 **Run** 버튼을 누릅니다.
   - 9명 멤버 테이블(`members`) 및 불참 날짜 테이블(`unavailable_dates`)이 생성되고 기본 데이터가 등록됩니다.
   - 실시간(Realtime) 동기화 권한이 자동으로 활성화됩니다.
4. 좌측 메뉴 **Project Settings** -> **API**로 이동하여:
   - `Project URL`
   - `Project API Keys` (anon / public)
   를 확인합니다.

---

## 💻 2. 로컬 개발 환경 실행
```bash
# 의존성 패키지 설치
npm install

# 환경변수 파일 생성
cp .env.example .env

# .env 파일에 Supabase 정보 입력
# VITE_SUPABASE_URL=https://xxxxxxxx.supabase.co
# VITE_SUPABASE_ANON_KEY=eyJh......

# 로컬 개발 서버 시작
npm run dev
```

> **참고**: `.env`에 Supabase 키를 입력하지 않아도 로컬 스토리지 기반의 **데모 모드**로 즉시 작동을 테스트해볼 수 있습니다.

---

## 📦 3. GitHub 연동 및 Vercel 무료 배포 방법

### Step 1: GitHub에 코드 올리기
```bash
git init
git add .
git commit -m "feat: 9인 모임 날짜 조율 웹 초기 셋업"
git branch -M main
git remote add origin https://github.com/사용자아이디/레포지토리이름.git
git push -u origin main
```

### Step 2: Vercel 배포 (클릭 3번)
1. [vercel.com](https://vercel.com)에 접속하여 GitHub 계정으로 로그인합니다.
2. **Add New...** -> **Project**를 누르고 방금 올린 GitHub 저장소를 선택합니다.
3. **Environment Variables** 항목에 Supabase 정보를 추가합니다:
   - `VITE_SUPABASE_URL`: Supabase Project URL
   - `VITE_SUPABASE_ANON_KEY`: Supabase anon key
4. **Deploy** 버튼을 누르면 약 30초 후 영구 무료 HTTPS 도메인(`*.vercel.app`)이 발급됩니다.
5. 발급된 링크를 9명 단체 톡방에 공유하면 끝!

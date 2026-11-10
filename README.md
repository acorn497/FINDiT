# FINDiT

교내 분실물 등록·매칭 웹 서비스 **FINDiT(파인딧)**.

잃어버린 사람이 올리는 **분실 신고**와 주운 사람이 올리는 **습득 등록**을 한곳에 모으고,
종류·장소·날짜·색상·특징으로 비교해 볼 만한 것을 **후보**로 보여 준다.
자동 판정은 하지 않는다 — 프로그램은 후보를 좁혀 주는 역할까지만 맡고, 최종 판단과 전달은 사람이 한다.

```
[잃어버린 사람]  로그인 → 분실 신고 작성(3단계) → 매칭 후보 확인 → 수령 신청 → 전달 완료
[주운 사람]      로그인 → 습득물 등록(사진 + 4항목) → 보관 장소에 맡김
[담당 교사]      관리자 화면에서 수령 신청 승인·거절, 보관 물품·만료 관리
```

## 한 줄 실행

```bash
docker compose up --build -d      # db · api · web — 마이그레이션·시드 자동 실행
# → http://localhost:8080
```

- `.env` 없이 기본값으로 뜬다. 바꾸려면 `cp .env.example .env`.
- DB 는 `db-data`, 사진은 `uploads` 볼륨에 남는다 (`docker compose down && docker compose up -d` 후에도 유지).

### 시드 계정 (비밀번호 모두 `findit1234`)

| 이메일 | 역할 | 시드 데이터 |
| --- | --- | --- |
| s2217@gbsw.hs.kr | 학생 | 기본 데모 계정 — 분실 신고 2건, 무선 이어폰 수령 신청 1건 |
| s2103@gbsw.hs.kr | 학생 | 습득물 등록자 — 습득물 24건 |
| teacher@gbsw.hs.kr | 교사 | 관리자 화면 |

## 테스트

```bash
./scripts/test-all.sh            # FE 단위 · BE 단위+e2e · Playwright E2E — 필요한 것은 Docker 뿐
./scripts/verify-history.sh      # 커밋 히스토리(작성자·날짜·태그) 검증
```

`test-all.sh` 는 개발용 스택(8080)과 섞이지 않게 별도 compose 프로젝트(`findit-test`)를 띄우고 끝나면 볼륨까지 지운다.
커버리지 하한(FE statements 70%, BE 80%)에 못 미치거나 `.only`/`.skip`/`todo` 가 남아 있으면 실패한다.

개발 중에는 워크스페이스별로 돌릴 수 있다.

```bash
npm ci
npm run test --workspace @findit/web          # Vitest
npm run test --workspace @findit/api          # Jest (e2e 는 PostgreSQL 필요: DATABASE_URL)
npx playwright test -c apps/web/e2e/playwright.config.ts   # BASE_URL 기본 http://localhost:8080
```

## 구조

```
packages/shared   상태·카테고리 enum, API 응답 타입, 한글 라벨 (web·api 공용)
apps/api          NestJS 11 · TypeORM(마이그레이션) · PostgreSQL 16 · HttpOnly 쿠키 세션
apps/web          React 19 · Vite 7 · Tailwind v4 · React Router 7 (상태·폼·데이터 라이브러리 없이 직접 구현)
apps/web/e2e      Playwright (모바일 390×844 / 데스크톱 1280×800)
scripts/          commit-at.sh · verify-history.sh · test-all.sh
```

- web 컨테이너의 nginx 가 정적 파일을 서빙하고 `/api` 와 `/socket.io`(WebSocket 업그레이드 포함)를 api 로 넘긴다.
- 알림은 Socket.IO 로 실시간 전달된다. 소켓이 연결되지 않는 환경에서도 화면은 조회만으로 동작한다.
- 색상은 `apps/web/src/styles/tokens.css` 한곳에서만 정의하고 화면에서는 `bg-st-keep` 같은 이름으로만 쓴다.
- 명세가 모호해 스스로 정한 것은 [DECISIONS.md](DECISIONS.md) 에 있다.

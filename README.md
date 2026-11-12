# FINDiT

교내 분실물 등록·매칭 웹 서비스 **FINDiT(파인딧)**.

잃어버린 사람이 올리는 **분실 신고**와 주운 사람이 올리는 **습득 등록**을 한곳에 모으고,
종류·장소·날짜·색상·특징으로 비교해 볼 만한 것을 **후보**로 보여 준다.
자동 판정은 하지 않는다 — 프로그램은 후보를 좁혀 주는 역할까지만 맡고, 수령 신청을 담당 교사가 승인해야 물건이 전달된다.

```
[잃어버린 사람]  로그인 → 분실 신고 작성(3단계) → 매칭 후보 확인 → 수령 신청 → 전달 완료
[주운 사람]      로그인 → 습득물 등록(사진 + 4항목) → 보관 장소에 맡김
[담당 교사]      관리자 화면에서 수령 신청 승인·거절, 보관 물품·만료 관리
```

## 한 줄 실행

```bash
docker compose up --build -d      # db · api · web — 마이그레이션·시드 자동 실행
```

→ <http://localhost:8080>

- 필요한 것은 Docker(Compose v2) 뿐이다. `.env` 없이 기본값으로 뜬다 — 바꾸려면 `cp .env.example .env`.
- DB 는 `db-data`, 사진은 `uploads` 볼륨에 남는다. `docker compose down && docker compose up -d` 뒤에도 데이터가 유지된다.
- 빌드가 끝난 뒤에는 외부 네트워크 없이 동작한다 (폰트·아이콘·이미지 모두 번들/볼륨 안).
- 사내 프록시처럼 TLS 를 가로채는 망에서 빌드한다면 Dockerfile 의 선택 시크릿 `extra_ca` 로 CA 를 넘길 수 있다 (`docker build --secret id=extra_ca,src=<ca.pem> …`).

### 시드 계정 (비밀번호 모두 `findit1234`)

| 이메일 | 역할 | 시드 데이터 |
| --- | --- | --- |
| `s2217@gbsw.hs.kr` | 학생 | 기본 데모 계정 — 분실 신고 2건, 무선 이어폰 수령 신청 1건, 알림 3건(읽지 않음 2) |
| `s2103@gbsw.hs.kr` | 학생 | 습득물 등록자 — 습득물 24건 |
| `teacher@gbsw.hs.kr` | 교사 | ⑩ 관리자 화면 (승인 대기 1건) |

## 화면 (10개)

`./scripts/capture-screens.sh` 로 Playwright 가 자동 생성한다 (390×844, [docs/screens](docs/screens)).

| # | 화면 | 내용 |
| --- | --- | --- |
| ① | [로그인](docs/screens/01-login.png) | 한 화면 안에서 계정 확인 → 비밀번호 → 재설정 3단계, blur 이후 오류 표시, 재발송 60초 타이머 |
| ② | [분실 신고 작성](docs/screens/02-lost-report.png) | 3단계(종류 / 장소·날짜·시간대 / 색상·특징), notFuture 규칙, 하단 고정 [이전][다음] |
| ③ | [습득물 등록](docs/screens/03-found-new.png) | 단일 화면, 사진 3장(캔버스 축소 + XHR 진행률 + 사진별 재시도) |
| ④ | [습득물 목록](docs/screens/04-found-list.png) | 검색 300ms 디바운스, 종류 칩, 2열 카드(넓은 화면 4열), 커서 [더 보기] |
| ⑤ | [습득물 상세](docs/screens/05-found-detail.png) | 히어로 사진, 정보 목록, 수령 신청·취소, 전달 완료/기간 만료 안내 |
| ⑥ | [매칭 후보](docs/screens/06-matches.png) | 내 신고 고정 + 후보 하나씩, 좌우 비교(일치 행 강조), 유사도 막대, [이 후보 아님] |
| ⑦ | [내 신고 관리](docs/screens/07-my-reports.png) | 분실 신고·습득 등록 통합 목록, 상태 칩, 새 후보 배지, 수정·삭제·찾음 처리 |
| ⑧ | [알림](docs/screens/08-notifications.png) | 시간순 목록, 읽지 않음 표시, Socket.IO 실시간 수신 + 탭 배지 |
| ⑨ | [홈 요약](docs/screens/09-home.png) | 내 신고 상태 → 새 매칭 후보 → 최근 습득물, (교사) 승인 대기 카드 |
| ⑩ | [관리자](docs/screens/10-admin.png) | 교사 전용 — 승인 대기(자동 거절 안내) / 보관 중(30일 경과 일괄 만료) / 요약(숫자·막대) |

## 테스트

```bash
./scripts/test-all.sh            # FE 단위 · BE 단위+e2e · Playwright E2E — 필요한 것은 Docker 뿐
./scripts/verify-history.sh      # 커밋 히스토리(작성자·날짜·태그) 검증
```

`test-all.sh` 는 개발용 스택(8080)과 섞이지 않게 별도 compose 프로젝트(`findit-test`)를 띄워 테스트 컨테이너(`e2e` 프로파일)에서 돌리고, 끝나면 볼륨까지 지운다.
다음 중 하나라도 어긋나면 실패로 끝난다.

| 묶음 | 도구 | 하한 |
| --- | --- | --- |
| FE 단위·컴포넌트 | Vitest + Testing Library | statements ≥ 70% |
| BE 단위 + e2e (실제 PostgreSQL) | Jest + supertest | statements ≥ 80% |
| E2E (실제 컨테이너) | Playwright — 모바일 390×844 · 데스크톱 1280×800 | 실패 0 · skip 0 |
| 테스트 표식 | `.only` / `.skip` / `todo` 검사 | 0 |

개발 중에는 워크스페이스별로 돌릴 수 있다.

```bash
npm ci
npm run test --workspace @findit/web          # Vitest
npm run test --workspace @findit/api          # Jest (e2e 는 PostgreSQL 필요: DATABASE_URL)
npx playwright test -c apps/web/e2e/playwright.config.ts   # BASE_URL 기본 http://localhost:8080
```

## 아키텍처

```
브라우저 ──▶ web (nginx)  ─ 정적 파일 (React 19 · Vite 7 · Tailwind v4 · React Router 7)
                │  /api/*, /socket.io/* (WebSocket 업그레이드)
                ▼
             api (NestJS 11) ── TypeORM(마이그레이션) ──▶ db (PostgreSQL 16)
                │  HttpOnly 쿠키 세션 · 역할 가드(STUDENT/TEACHER) · Socket.IO
                └─ /app/uploads 볼륨 (사진 정적 서빙)
```

```
packages/shared   상태·카테고리 enum, API 응답 타입, 한글 라벨 (web·api 공용)
apps/api          auth · users · lost-reports · found-items · claims · matches · uploads
                  notifications · realtime · admin · common(가드·커서·이벤트) · database(마이그레이션·시드)
apps/web          features/* (화면) · shared/form(useField) · shared/toast · shared/layout · styles/tokens.css
apps/web/e2e      Playwright 시나리오 + 화면 캡처
scripts/          commit-at.sh · verify-history.sh · test-all.sh · capture-screens.sh
```

- **매칭 점수** — `0.4 × 장소 + 0.3 × 날짜 + 0.3 × (색상 일치 + 특징 낱말 자카드 × 0.5)`. 같은 종류·보관 중·제외 기록 없음·0.35 이상만 상위 5개를 후보로 둔다 (`apps/api/src/matches/score.ts`).
- **커서 페이지네이션** — `created_at DESC, id DESC`, 커서는 `base64("<created_at ISO>|<id>")`. 새 등록이 끼어들어도 중복·누락이 없다.
- **라이브러리 없이 직접 만든 것** — 상태 관리(Context), 폼 검사(`useField`), 데이터 조회(훅), 토스트, 통계 막대. 허용한 것은 lucide-react(아이콘), Tailwind, socket.io-client 뿐이다.
- **색상** — `apps/web/src/styles/tokens.css` 한곳에서만 16진수 값을 정의하고 화면에서는 `bg-st-keep` 같은 이름으로만 쓴다.
- 명세가 모호해 스스로 정한 것은 [DECISIONS.md](DECISIONS.md), 단계별 진행 기록은 [REPLAY-REPORT.md](REPLAY-REPORT.md) 에 있다.

# 테스트 실행 컨테이너 — FE 단위 / BE 단위·e2e / Playwright E2E 를 한곳에서 돌린다.
FROM mcr.microsoft.com/playwright:v1.63.0-noble
ENV CI=true npm_config_update_notifier=false
WORKDIR /repo
COPY package.json package-lock.json .npmrc ./
COPY apps/api/package.json apps/api/
COPY apps/web/package.json apps/web/
COPY packages/shared/package.json packages/shared/
# 사내 프록시처럼 TLS 를 가로채는 망에서 빌드할 때만 CA 인증서(PEM) 내용을 넘긴다. 평소에는 비워 둔다.
#   docker build --build-arg EXTRA_CA_PEM="$(cat ca.pem)" ...   /   EXTRA_CA_PEM="$(cat ca.pem)" docker compose build
# (BuildKit 전용 문법을 쓰지 않아 Docker API·구형 빌더로도 빌드된다)
ARG EXTRA_CA_PEM=""
RUN if [ -n "$EXTRA_CA_PEM" ]; then printf '%s\n' "$EXTRA_CA_PEM" > /tmp/extra-ca.pem; export NODE_EXTRA_CA_CERTS=/tmp/extra-ca.pem; fi; \
    npm ci --no-audit --no-fund \
 && rm -f /tmp/extra-ca.pem
COPY . .
CMD ["bash", "scripts/run-suites.sh"]

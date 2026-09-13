# syntax=docker/dockerfile:1
# 테스트 실행 컨테이너 — FE 단위 / BE 단위·e2e / Playwright E2E 를 한곳에서 돌린다.
FROM mcr.microsoft.com/playwright:v1.63.0-noble
ENV CI=true npm_config_update_notifier=false
WORKDIR /repo
COPY package.json package-lock.json .npmrc ./
COPY apps/api/package.json apps/api/
COPY apps/web/package.json apps/web/
RUN --mount=type=secret,id=extra_ca,required=false \
    if [ -f /run/secrets/extra_ca ]; then export NODE_EXTRA_CA_CERTS=/run/secrets/extra_ca; fi; \
    npm ci --no-audit --no-fund
COPY . .
CMD ["bash", "scripts/run-suites.sh"]

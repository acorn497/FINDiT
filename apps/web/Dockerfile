# syntax=docker/dockerfile:1
# ── 빌드 ───────────────────────────────────────────────
FROM node:22-alpine AS build
WORKDIR /repo
COPY package.json package-lock.json .npmrc ./
COPY apps/api/package.json apps/api/
COPY apps/web/package.json apps/web/
COPY packages/shared/package.json packages/shared/
# 사내 프록시처럼 TLS 를 가로채는 환경이면 빌드 시크릿(extra_ca)으로 CA 를 넘길 수 있다. 없으면 무시된다.
RUN --mount=type=secret,id=extra_ca,required=false \
    if [ -f /run/secrets/extra_ca ]; then export NODE_EXTRA_CA_CERTS=/run/secrets/extra_ca; fi; \
    npm ci --workspace @findit/web --workspace @findit/shared --include-workspace-root --no-audit --no-fund
COPY packages/shared packages/shared
COPY apps/web apps/web
RUN npm run build --workspace @findit/web

# ── 정적 서빙 + /api 프록시 ─────────────────────────────
FROM nginx:1.27-alpine
COPY apps/web/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /repo/apps/web/dist /usr/share/nginx/html
EXPOSE 80
HEALTHCHECK --interval=5s --timeout=3s --retries=30 CMD wget -qO- http://127.0.0.1/ >/dev/null || exit 1

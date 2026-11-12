# ── 빌드 ───────────────────────────────────────────────
FROM node:22-alpine AS build
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
    npm ci --workspace @findit/web --workspace @findit/shared --include-workspace-root --no-audit --no-fund \
 && rm -f /tmp/extra-ca.pem
COPY packages/shared packages/shared
COPY apps/web apps/web
RUN npm run build --workspace @findit/web

# ── 정적 서빙 + /api 프록시 ─────────────────────────────
FROM nginx:1.27-alpine
COPY apps/web/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /repo/apps/web/dist /usr/share/nginx/html
EXPOSE 80
HEALTHCHECK --interval=5s --timeout=3s --retries=30 CMD wget -qO- http://127.0.0.1/ >/dev/null || exit 1

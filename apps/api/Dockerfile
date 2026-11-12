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
    npm ci --workspace @findit/api --workspace @findit/shared --include-workspace-root --no-audit --no-fund \
 && rm -f /tmp/extra-ca.pem
COPY packages/shared packages/shared
COPY apps/api apps/api
RUN npm run build --workspace @findit/shared \
 && npm run build --workspace @findit/api \
 && npm prune --omit=dev --workspace @findit/api --workspace @findit/shared --include-workspace-root

# ── 실행 ───────────────────────────────────────────────
FROM node:22-alpine
ENV NODE_ENV=production
WORKDIR /app
COPY --from=build /repo/node_modules ./node_modules
COPY --from=build /repo/packages/shared/package.json ./packages/shared/package.json
COPY --from=build /repo/packages/shared/dist ./packages/shared/dist
COPY --from=build /repo/apps/api/package.json ./apps/api/package.json
COPY --from=build /repo/apps/api/dist ./apps/api/dist
# 업로드 볼륨 — 처음 만들어질 때 이 폴더의 소유자(node)를 물려받는다
RUN mkdir -p /app/uploads && chown node:node /app/uploads
USER node
WORKDIR /app/apps/api
ENV UPLOAD_DIR=/app/uploads PORT=3000
EXPOSE 3000
HEALTHCHECK --interval=5s --timeout=3s --retries=30 CMD wget -qO- http://127.0.0.1:3000/api/health || exit 1
CMD ["node", "dist/main.js"]

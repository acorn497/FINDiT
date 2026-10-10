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
    npm ci --workspace @findit/api --workspace @findit/shared --include-workspace-root --no-audit --no-fund
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

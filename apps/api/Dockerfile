# syntax=docker/dockerfile:1
# ── 빌드 ───────────────────────────────────────────────
FROM node:22-alpine AS build
WORKDIR /repo
COPY package.json package-lock.json .npmrc ./
COPY apps/api/package.json apps/api/
COPY apps/web/package.json apps/web/
# 사내 프록시처럼 TLS 를 가로채는 환경이면 빌드 시크릿(extra_ca)으로 CA 를 넘길 수 있다. 없으면 무시된다.
RUN --mount=type=secret,id=extra_ca,required=false \
    if [ -f /run/secrets/extra_ca ]; then export NODE_EXTRA_CA_CERTS=/run/secrets/extra_ca; fi; \
    npm ci --workspace @findit/api --include-workspace-root --no-audit --no-fund
COPY apps/api apps/api
RUN npm run build --workspace @findit/api \
 && npm prune --omit=dev --workspace @findit/api --include-workspace-root

# ── 실행 ───────────────────────────────────────────────
FROM node:22-alpine
ENV NODE_ENV=production
WORKDIR /app
COPY --from=build /repo/node_modules ./node_modules
COPY --from=build /repo/apps/api/package.json ./apps/api/package.json
COPY --from=build /repo/apps/api/dist ./apps/api/dist
WORKDIR /app/apps/api
EXPOSE 3000
CMD ["node", "dist/main.js"]

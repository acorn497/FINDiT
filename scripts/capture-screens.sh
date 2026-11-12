#!/usr/bin/env bash
# 화면 캡처 10개 생성 → docs/screens/*.png (390×844, 2배율)
#   사용법: ./scripts/capture-screens.sh [--no-build]
# 시드가 갓 들어간 별도 compose 프로젝트(findit-screens)를 띄워 찍고, 끝나면 볼륨까지 지운다.
set -euo pipefail
cd "$(dirname "$0")/.."

export COMPOSE_PROJECT_NAME=findit-screens
export WEB_PORT="${SCREENS_WEB_PORT:-18081}"
BUILD=1
[ "${1:-}" = "--no-build" ] && BUILD=0

compose() { docker compose --profile e2e "$@"; }
cleanup() { compose down -v --remove-orphans >/dev/null 2>&1 || true; }
trap cleanup EXIT
cleanup

[ "$BUILD" -eq 1 ] && compose build
compose up -d --wait db api web
mkdir -p docs/screens
compose run --rm -v "$PWD/docs/screens:/screens" -e SCREENS_DIR=/screens e2e \
  npx playwright test -c apps/web/e2e/playwright.screens.config.ts
ls -1 docs/screens

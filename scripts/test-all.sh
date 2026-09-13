#!/usr/bin/env bash
# 전체 테스트 단일 진입점 (DoD-3)
#   사용법: ./scripts/test-all.sh [--no-build]
#   --no-build : 이미 빌드한 이미지(findit-api / findit-web / findit-e2e)를 그대로 쓴다.
#
# 개발용 스택(포트 8080)과 섞이지 않도록 별도 compose 프로젝트(findit-test)와 볼륨으로 띄운 뒤,
# 끝나면 볼륨까지 지운다. 필요한 것은 Docker 뿐이다.
set -euo pipefail
cd "$(dirname "$0")/.."

export COMPOSE_PROJECT_NAME=findit-test
export WEB_PORT="${TEST_WEB_PORT:-18080}"
BUILD=1
[ "${1:-}" = "--no-build" ] && BUILD=0

compose() { docker compose --profile e2e "$@"; }
cleanup() { compose down -v --remove-orphans >/dev/null 2>&1 || true; }
trap cleanup EXIT
cleanup

if [ "$BUILD" -eq 1 ]; then
  echo "▶ 이미지 빌드"
  compose build
fi

echo "▶ db · api · web 기동 (healthy 까지 대기)"
compose up -d --wait db api web

echo "▶ 테스트 실행"
compose run --rm e2e

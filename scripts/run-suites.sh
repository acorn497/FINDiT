#!/usr/bin/env bash
# 테스트 컨테이너 안에서 실행된다 (scripts/test-all.sh 가 부른다).
# 각 묶음을 끝까지 돌리고, 하나라도 실패하면 exit 1.
set -uo pipefail
cd "$(dirname "$0")/.."

declare -a NAMES=() RESULTS=()
run() {
  local name="$1"; shift
  echo
  echo "━━━━━━━━ ▶ $name ━━━━━━━━"
  "$@"
  local code=$?
  NAMES+=("$name"); RESULTS+=("$code")
}

# .only / .skip / todo 가 남아 있으면 실패로 본다.
guard() {
  local hits
  hits=$(grep -rnE '\b(it|test|describe)\.(only|skip|todo)\b|\bx(it|describe)\(|\b(it|test)\.todo\(' \
    apps/web/src apps/api/src apps/api/test $( [ -d apps/web/e2e ] && echo apps/web/e2e ) \
    --include='*.ts' --include='*.tsx' 2>/dev/null || true)
  if [ -n "$hits" ]; then echo "$hits"; return 1; fi
  echo "skip·only·todo 없음"
}

run "테스트 표식 검사" guard
run "FE 단위 (Vitest, statements ≥70%)" npm run test:cov --workspace @findit/web
run "BE 단위 + e2e (Jest, statements ≥80%)" npm run test:cov --workspace @findit/api

echo
echo "━━━━━━━━ 결과 ━━━━━━━━"
fail=0
for i in "${!NAMES[@]}"; do
  if [ "${RESULTS[$i]}" -eq 0 ]; then echo "  ✓ ${NAMES[$i]}"; else echo "  ✗ ${NAMES[$i]}"; fail=1; fi
done
exit $fail

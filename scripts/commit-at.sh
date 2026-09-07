#!/usr/bin/env bash
# 백데이트 커밋 헬퍼 (P1~P7 전용)
#   사용법: scripts/commit-at.sh "<ISO날짜>" "<메시지>" ["<본문>"]
#   예)     scripts/commit-at.sh "2026-09-08T20:14:00+09:00" "feat(web): 디자인 토큰 파일 추가"
# author date와 committer date를 함께 지정하고, 날짜로 단계를 판정해 `Phase: Pn` 트레일러를 붙인다.
set -euo pipefail

if [ $# -lt 2 ]; then
  echo "사용법: $0 \"<ISO날짜>\" \"<메시지>\" [\"<본문>\"]" >&2
  exit 2
fi

D="$1"
MSG="$2"
BODY="${3:-}"

if ! [[ "$D" =~ ^2026-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}\+09:00$ ]]; then
  echo "날짜 형식 오류: $D (예: 2026-09-08T20:14:00+09:00)" >&2
  exit 2
fi

DAY="${D:0:10}"
phase_of() {
  local d="$1"
  if   [[ "$d" > "2026-09-06" && "$d" < "2026-09-14" ]]; then echo P1
  elif [[ "$d" > "2026-09-13" && "$d" < "2026-09-21" ]]; then echo P2
  elif [[ "$d" > "2026-09-20" && "$d" < "2026-09-28" ]]; then echo P3
  elif [[ "$d" > "2026-10-04" && "$d" < "2026-10-12" ]]; then echo P4
  elif [[ "$d" > "2026-10-11" && "$d" < "2026-10-19" ]]; then echo P5
  elif [[ "$d" > "2026-10-18" && "$d" < "2026-11-02" ]]; then echo P6
  elif [[ "$d" > "2026-11-01" && "$d" < "2026-11-09" ]]; then echo P7
  else echo ""; fi
}
PHASE="$(phase_of "$DAY")"
if [ -z "$PHASE" ]; then
  echo "백데이트 구간(P1~P7) 밖의 날짜입니다: $DAY" >&2
  exit 2
fi

args=(-m "$MSG")
[ -n "$BODY" ] && args+=(-m "$BODY")
args+=(-m "Phase: $PHASE")

export TZ=Asia/Seoul
GIT_AUTHOR_NAME="acorn497" GIT_AUTHOR_EMAIL="acorn497@naver.com" \
GIT_COMMITTER_NAME="acorn497" GIT_COMMITTER_EMAIL="acorn497@naver.com" \
GIT_AUTHOR_DATE="$D" GIT_COMMITTER_DATE="$D" \
  git commit "${args[@]}"

#!/usr/bin/env bash
# 커밋 히스토리 검증 (DoD-4, DoD-5)
#   사용법: scripts/verify-history.sh [--upto Pn]
#   --upto Pn : Pn 단계까지만 검사한다 (중간 점검용, 기본 P11)
#
# 검사 항목
#   - 모든 커밋의 작성자·커미터가 acorn497 <acorn497@naver.com>
#   - 모든 커밋의 author date == committer date
#   - P1~P7 커밋이 단계별 구간 안 (평일 18:00~23:40, 주말 13:00~23:40, 하루 4개 이하, 같은 날 12분 간격, 단계당 4일 이상)
#   - 10-01 ~ 10-04 구간에 커밋 없음
#   - P8 이후 커밋은 2026-11-08 이후
#   - 커밋 날짜 단조 증가, 단계 순서 역행 없음
#   - 단계별 커밋 수가 범위 안
#   - 태그 v0.1.0(10-11) v0.2.0(10-18) v0.5.0(11-08) 날짜, v0.9.0 v1.0.0 존재
#   - 커밋 메시지에 AI 생성 표시 없음
# 실패 시 exit 1, 어긋난 커밋 해시와 날짜를 출력한다.
set -uo pipefail

cd "$(git rev-parse --show-toplevel)" || exit 1

UPTO="P11"
if [ "${1:-}" = "--upto" ]; then
  UPTO="${2:?--upto 뒤에 단계(P1~P11)를 적어 주세요}"
fi

export TZ=Asia/Seoul
NAME="acorn497"
EMAIL="acorn497@naver.com"
RS=$(printf '\036')
US=$(printf '\037')

git log --reverse --topo-order \
  --date=format-local:'%Y-%m-%d %H:%M %u' \
  --format="%H${US}%an${US}%ae${US}%cn${US}%ce${US}%at${US}%ct${US}%ad${US}%B${RS}" HEAD |
awk -v RS="$RS" -v FS="$US" -v UPTO="$UPTO" -v NAME="$NAME" -v EMAIL="$EMAIL" '
function fail(h, d, msg) { printf "  ✗ %s  %s  %s\n", substr(h, 1, 10), d, msg; fails++ }
BEGIN {
  n = split("P1 P2 P3 P4 P5 P6 P7 P8 P9 P10 P11", ph, " ")
  for (i = 1; i <= n; i++) idx[ph[i]] = i
  split("2026-09-07 2026-09-14 2026-09-21 2026-10-05 2026-10-12 2026-10-19 2026-11-02", st, " ")
  split("2026-09-13 2026-09-20 2026-09-27 2026-10-11 2026-10-18 2026-11-01 2026-11-08", en, " ")
  split("8 10 10 9 12 11 9 12 9 8 6", mn, " ")
  split("12 14 14 13 16 15 13 16 13 12 10", mx, " ")
  upidx = idx[UPTO]
  if (upidx == "") { print "알 수 없는 단계: " UPTO; exit 2 }
  fails = 0; prevct = 0; previdx = 0; prevday = ""; total = 0
}
{
  sub(/^\n+/, "", $1)
  if ($1 == "") next
  h = $1; an = $2; ae = $3; cn = $4; ce = $5; at = $6 + 0; ct = $7 + 0; ad = $8; body = $9
  total++
  day = substr(ad, 1, 10); hm = substr(ad, 12, 5); wd = substr(ad, 18, 1) + 0

  if (an != NAME || ae != EMAIL) fail(h, ad, "작성자 " an " <" ae ">")
  if (cn != NAME || ce != EMAIL) fail(h, ad, "커미터 " cn " <" ce ">")
  if (at != ct) fail(h, ad, "author date != committer date")
  if (ct < prevct) fail(h, ad, "시간 역행")
  if (tolower(body) ~ /co-authored-by|generated with/) fail(h, ad, "AI 생성 표시 포함")

  p = ""
  if (match(body, /Phase: P[0-9]+/)) p = substr(body, RSTART + 7, RLENGTH - 7)
  if (p == "" || idx[p] == "") { fail(h, ad, "Phase 트레일러 없음"); prevct = ct; next }
  i = idx[p]
  if (i < previdx) fail(h, ad, "단계 순서 역행 (" p ")")
  previdx = i
  cnt[p]++

  if (day >= "2026-10-01" && day <= "2026-10-04") fail(h, ad, "10-01~10-04 공백 구간에 커밋")

  if (i <= 7) {
    if (day < st[i] || day > en[i]) fail(h, ad, p " 구간(" st[i] "~" en[i] ") 밖")
    if (wd >= 6) { lo = "13:00" } else { lo = "18:00" }
    if (hm < lo || hm > "23:40") fail(h, ad, "허용 시간대 밖 (" lo "~23:40)")
    perday[day]++
    if (perday[day] > 4) fail(h, ad, "하루 커밋 4개 초과")
    if (day == prevday && ct - prevdayct < 720) fail(h, ad, "같은 날 커밋 간격 12분 미만")
    if (!((p, day) in seen)) { seen[p, day] = 1; days[p]++ }
    prevday = day; prevdayct = ct
  } else {
    if (day <= "2026-11-08") fail(h, ad, p " 커밋이 2026-11-08 이후가 아님")
  }
  prevct = ct
}
END {
  printf "\n  단계별 커밋 수 (검사 범위: P1~%s)\n", UPTO
  for (i = 1; i <= upidx; i++) {
    p = ph[i]; c = cnt[p] + 0
    extra = ""
    if (i <= 7) extra = sprintf("  (%d일)", days[p] + 0)
    status = "ok"
    if (c < mn[i] || c > mx[i]) { status = "범위 밖"; fails++ }
    if (i <= 7 && days[p] + 0 < 4) { status = status " · 4일 미만"; fails++ }
    printf "    %-4s %3d개  [%d~%d]%s  %s\n", p, c, mn[i], mx[i], extra, status
  }
  for (i = upidx + 1; i <= 11; i++) if (cnt[ph[i]] + 0 > 0) { printf "    %s 커밋 %d개가 검사 범위 밖에 있음\n", ph[i], cnt[ph[i]]; fails++ }
  printf "  총 커밋 %d개\n", total
  exit (fails > 0 ? 1 : 0)
}'
RESULT=$?

# ── 태그 검사 ──────────────────────────────────────────────
phase_idx() { echo "${1#P}"; }
UPIDX=$(phase_idx "$UPTO")
TAG_FAIL=0
check_tag() {
  local tag="$1" phase="$2" want_day="$3"
  [ "$(phase_idx "$phase")" -le "$UPIDX" ] || return 0
  if [ "$(git cat-file -t "$tag" 2>/dev/null)" != "tag" ]; then
    echo "  ✗ 태그 $tag 없음 (annotated tag 필요)"; TAG_FAIL=1; return
  fi
  local tday target tphase bad=0
  tday=$(git for-each-ref "refs/tags/$tag" --format='%(taggerdate:format-local:%Y-%m-%d %H:%M)')
  target=$(git rev-list -n 1 "$tag")
  tphase=$(git log -1 --format=%B "$target" | sed -n 's/^Phase: \(P[0-9]*\)$/\1/p' | tail -1)
  if [ -n "$want_day" ]; then
    if [ "${tday:0:10}" != "$want_day" ]; then echo "  ✗ 태그 $tag 날짜 $tday (기대 $want_day)"; bad=1; fi
  else
    if [[ ! "${tday:0:10}" > "2026-11-08" ]]; then echo "  ✗ 태그 $tag 날짜 $tday (실행일이어야 함)"; bad=1; fi
  fi
  if [ "$tphase" != "$phase" ]; then echo "  ✗ 태그 $tag 가 $phase 커밋이 아닌 ${tphase:-?} 커밋을 가리킴"; bad=1; fi
  if [ $bad -ne 0 ]; then TAG_FAIL=1; return; fi
  echo "    $tag  $tday  → $(git log -1 --format=%h "$target") ($tphase)"
}
echo "  태그"
check_tag v0.1.0 P4 2026-10-11
check_tag v0.2.0 P5 2026-10-18
check_tag v0.5.0 P7 2026-11-08
check_tag v0.9.0 P9 ""
check_tag v1.0.0 P11 ""

if [ $RESULT -ne 0 ] || [ $TAG_FAIL -ne 0 ]; then
  echo "verify-history: 실패"
  exit 1
fi
echo "verify-history: 통과"

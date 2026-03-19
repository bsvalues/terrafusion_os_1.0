#!/usr/bin/env bash
# Wave 5: Type debt ceiling gate
set -euo pipefail

SRC="$(dirname "$0")/../apps/os-shell/src"
ANY_CEILING=450
TS_EXPECT_CEILING=17

any_count=$(grep -rn ': any' "$SRC" --include='*.ts' --include='*.tsx' | grep -v '__tests__' | grep -v '\.test\.' | grep -v 'node_modules' | wc -l)
any_count=$(echo "$any_count" | tr -d ' ')
ts_expect_count=$(grep -rn '@ts-expect-error' "$SRC" --include='*.ts' --include='*.tsx' | grep -v 'node_modules' | wc -l)
ts_expect_count=$(echo "$ts_expect_count" | tr -d ' ')

echo "Type debt report:"
echo "  any types (production): $any_count / $ANY_CEILING ceiling"
echo "  @ts-expect-error:       $ts_expect_count / $TS_EXPECT_CEILING ceiling"

exit_code=0
if [ "$any_count" -gt "$ANY_CEILING" ]; then
  echo "FAIL: any count ($any_count) exceeds ceiling ($ANY_CEILING)"
  exit_code=1
fi
if [ "$ts_expect_count" -gt "$TS_EXPECT_CEILING" ]; then
  echo "FAIL: @ts-expect-error count ($ts_expect_count) exceeds ceiling ($TS_EXPECT_CEILING)"
  exit_code=1
fi
[ "$exit_code" -eq 0 ] && echo "PASS: type debt within limits"
exit $exit_code

#!/usr/bin/env bash
# .claude/skills/regression-guard/run.sh
# Post-patch regression proof wall.
# Usage: bash .claude/skills/regression-guard/run.sh [scope-description]
set -euo pipefail

SCOPE="${1:-unspecified}"
ROOT="$(pwd)"
FRONTEND="${ROOT}/frontend"
VITEST="pnpm --dir ${FRONTEND} exec vitest run"
TESTS_DIR="${FRONTEND}/apps/os-shell/src/__tests__"

echo "== REGRESSION_GUARD: scope=${SCOPE} =="
echo ""

# ── changed files ─────────────────────────────────────────────────────────────
echo "-- CHANGED FILES (HEAD vs HEAD~1) --"
CHANGED=$(git diff --name-only HEAD~1 2>/dev/null || git diff --name-only HEAD 2>/dev/null || true)
if [[ -z "${CHANGED}" ]]; then
  CHANGED=$(git status --short | awk '{print $2}')
fi
echo "${CHANGED}"
echo ""

# ── type-check ────────────────────────────────────────────────────────────────
echo "-- TYPE-CHECK --"
if pnpm --dir "${FRONTEND}" exec tsc --noEmit --project "${FRONTEND}/tsconfig.json" 2>&1; then
  echo "TYPE-CHECK: PASS"
else
  echo "TYPE-CHECK: FAIL (see errors above)"
fi
echo ""

# ── find affected tests ───────────────────────────────────────────────────────
echo "-- AFFECTED TESTS --"
AFFECTED_TEST_FILES=()
while IFS= read -r src_file; do
  [[ -z "${src_file}" ]] && continue
  [[ "${src_file}" == *"__tests__"* ]] && continue
  [[ "${src_file}" == *".test."* ]] && continue
  BASENAME=$(basename "${src_file}" | sed 's/\.[^.]*$//')
  mapfile -t MATCHES < <(
    find "${TESTS_DIR}" \
      -name "*${BASENAME}*" \
      \( -name "*.test.ts" -o -name "*.test.tsx" \) \
      2>/dev/null | sort
  )
  AFFECTED_TEST_FILES+=("${MATCHES[@]}")
done <<< "${CHANGED}"

# Deduplicate
mapfile -t AFFECTED_TEST_FILES < <(printf '%s\n' "${AFFECTED_TEST_FILES[@]}" | sort -u)

if [[ ${#AFFECTED_TEST_FILES[@]} -gt 0 ]]; then
  printf '  %s\n' "${AFFECTED_TEST_FILES[@]}"
  echo ""
  cd "${FRONTEND}"
  REL_FILES=()
  for f in "${AFFECTED_TEST_FILES[@]}"; do
    REL_FILES+=("${f#${FRONTEND}/}")
  done
  ${VITEST} "${REL_FILES[@]}" || true
  cd "${ROOT}"
else
  echo "  (no test files match changed source files)"
fi
echo ""

# ── architectural smoke suites ────────────────────────────────────────────────
echo "-- SMOKE SUITES --"
SMOKE_FILES=(
  "apps/os-shell/src/__tests__/shell/forgeSuiteSourceHonesty.contract.test.tsx"
  "apps/os-shell/src/__tests__/dashboard/managementDashboard.contract.test.tsx"
  "apps/os-shell/src/__tests__/pilot/EvidenceRail-lane-i.test.tsx"
)

cd "${FRONTEND}"
SMOKE_ARGS=()
for f in "${SMOKE_FILES[@]}"; do
  [[ -f "${f}" ]] && SMOKE_ARGS+=("${f}")
done

if [[ ${#SMOKE_ARGS[@]} -gt 0 ]]; then
  ${VITEST} "${SMOKE_ARGS[@]}" || true
else
  echo "  (smoke suite files not found — verify paths)"
fi
cd "${ROOT}"

echo ""
echo "== END REGRESSION_GUARD =="

#!/usr/bin/env bash
# .claude/skills/test-target/run.sh
# Finds and runs the narrowest relevant vitest test set for a given target.
# Usage: bash .claude/skills/test-target/run.sh [file-path|feature-name|blank]
set -euo pipefail

TARGET="${1:-}"
FRONTEND="$(pwd)/frontend"
TESTS_DIR="${FRONTEND}/apps/os-shell/src/__tests__"
VITEST="pnpm --dir ${FRONTEND} exec vitest run"

# ── resolve source target ─────────────────────────────────────────────────────
if [[ -z "${TARGET}" ]]; then
  echo "== TEST_TARGET: no argument — scanning git diff HEAD~1 =="
  # shellcheck disable=SC2207
  CHANGED=($(git diff --name-only HEAD~1 2>/dev/null | grep -E '\.(tsx?|jsx?)$' | grep -v '__tests__' || true))
  if [[ ${#CHANGED[@]} -eq 0 ]]; then
    echo "No changed source files found. Run with a specific file or feature name."
    exit 1
  fi
  echo "Changed source files: ${CHANGED[*]}"
  TARGET="${CHANGED[0]}"
fi

# ── derive basename for search ────────────────────────────────────────────────
BASENAME=$(basename "${TARGET}" | sed 's/\.[^.]*$//')
echo "== TEST_TARGET: searching for tests matching '${BASENAME}' =="

# ── if target is already a test file, run it directly ─────────────────────────
if [[ "${TARGET}" == *".test."* ]] || [[ "${TARGET}" == *".spec."* ]]; then
  TEST_FILES=("${TARGET}")
else
  # ── search __tests__ tree by basename ─────────────────────────────────────
  mapfile -t TEST_FILES < <(
    find "${TESTS_DIR}" \
      -name "*${BASENAME}*" \
      \( -name "*.test.ts" -o -name "*.test.tsx" \) \
      2>/dev/null | sort
  )

  # ── fallback: grep test files for mentions of the basename ────────────────
  if [[ ${#TEST_FILES[@]} -eq 0 ]]; then
    echo "(no filename match — falling back to grep for '${BASENAME}')"
    mapfile -t TEST_FILES < <(
      grep -rl "${BASENAME}" "${TESTS_DIR}" \
        --include="*.test.ts" --include="*.test.tsx" \
        2>/dev/null | sort | head -10
    )
  fi
fi

# ── nothing found ─────────────────────────────────────────────────────────────
if [[ ${#TEST_FILES[@]} -eq 0 ]]; then
  echo "ERROR: No test files found for target '${TARGET}' (basename: '${BASENAME}')."
  echo "Searched: ${TESTS_DIR}"
  echo "Try: /test-target <explicit-test-file-path>"
  exit 1
fi

# ── report discovered tests ───────────────────────────────────────────────────
echo ""
echo "== TEST_FILES =="
printf '  %s\n' "${TEST_FILES[@]}"
echo ""

# ── build vitest command ──────────────────────────────────────────────────────
CMD=(${VITEST})
for f in "${TEST_FILES[@]}"; do
  # Make path relative to frontend dir for vitest
  REL="${f#${FRONTEND}/}"
  CMD+=("${REL}")
done

echo "== COMMAND =="
echo "${CMD[*]}"
echo ""

# ── run ───────────────────────────────────────────────────────────────────────
cd "${FRONTEND}"
"${CMD[@]}"

#!/usr/bin/env bash
# .claude/skills/design-token-police/check.sh
# Scans changed (or explicit target) .tsx files for raw design token violations.
# Usage: bash .claude/skills/design-token-police/check.sh [file|dir|blank]
#   blank → diff-only: git diff HEAD changed .tsx files
set -euo pipefail

TARGET="${1:-}"
FRONTEND="$(pwd)/frontend/apps/os-shell/src"
RULES="$(pwd)/.claude/skills/design-token-police/banned-classes.txt"
TOTAL_HITS=0

# ── resolve files ─────────────────────────────────────────────────────────────
resolve_files() {
  if [[ -n "${TARGET}" && -f "${TARGET}" ]]; then
    echo "${TARGET}"
  elif [[ -n "${TARGET}" && -d "${TARGET}" ]]; then
    find "${TARGET}" -name "*.tsx" 2>/dev/null
  elif [[ -n "${TARGET}" ]]; then
    find "${FRONTEND}" -path "*${TARGET}*" -name "*.tsx" 2>/dev/null
  else
    # diff-only mode
    git diff --name-only HEAD 2>/dev/null \
      | grep '\.tsx$' \
      | grep -v '__tests__\|\.spec\.' \
      || true
  fi
}

mapfile -t FILES < <(resolve_files | sort -u)

if [[ ${#FILES[@]} -eq 0 ]]; then
  echo "== DESIGN_TOKEN_POLICE: no files to scan =="
  echo "Specify a file/dir or ensure 'git diff HEAD' shows changed .tsx files."
  exit 0
fi

echo "== DESIGN_TOKEN_POLICE: ${#FILES[@]} file(s) =="
printf '  %s\n' "${FILES[@]}"
echo ""

# ── load rules ────────────────────────────────────────────────────────────────
declare -a PATTERNS REPLACEMENTS REASONS

while IFS='|' read -r pattern replacement reason || [[ -n "${pattern}" ]]; do
  # Skip blank lines and comments
  [[ "${pattern}" =~ ^[[:space:]]*# ]] && continue
  [[ -z "${pattern}" ]] && continue
  PATTERNS+=("${pattern}")
  REPLACEMENTS+=("${replacement}")
  REASONS+=("${reason}")
done < "${RULES}"

echo "Loaded ${#PATTERNS[@]} rules from banned-classes.txt"
echo ""

# ── scan ──────────────────────────────────────────────────────────────────────
for i in "${!PATTERNS[@]}"; do
  pattern="${PATTERNS[$i]}"
  replacement="${REPLACEMENTS[$i]}"
  reason="${REASONS[$i]}"

  for file in "${FILES[@]}"; do
    [[ -f "${file}" ]] || continue

    # Only match inside className strings (lines containing className)
    matches=$(grep -nE "${pattern}" "${file}" 2>/dev/null \
      | grep -E 'className|class=' \
      || true)

    if [[ -n "${matches}" ]]; then
      echo "  [TOKEN_VIOLATION] ${file}"
      echo "  PATTERN:     ${pattern}"
      echo "  REPLACE WITH: ${replacement}"
      echo "  REASON:      ${reason}"
      echo "${matches}" | while IFS= read -r line; do
        echo "    ${line}"
      done
      echo ""
      TOTAL_HITS=$((TOTAL_HITS + 1))
    fi
  done
done

# ── summary ───────────────────────────────────────────────────────────────────
echo "== SUMMARY =="
echo "Files scanned:    ${#FILES[@]}"
echo "Violation hits:   ${TOTAL_HITS}"
echo "TDC baseline:     779 violations (do not exceed)"
echo ""

if [[ "${TOTAL_HITS}" -eq 0 ]]; then
  echo "CLEAN — no raw token violations in scanned files."
else
  echo "ACTION REQUIRED — replace banned classes with canonical tokens."
  echo "Reference: .claude/skills/design-token-police/banned-classes.txt"
fi

#!/usr/bin/env bash
# .claude/skills/ui-honesty-pass/check.sh
# Scans UI component files for honesty violations.
# Usage: bash .claude/skills/ui-honesty-pass/check.sh [file|dir|blank]
set -euo pipefail

TARGET="${1:-}"
FRONTEND="$(pwd)/frontend/apps/os-shell/src"

# ── resolve files to scan ─────────────────────────────────────────────────────
resolve_files() {
  if [[ -n "${TARGET}" && ( -f "${TARGET}" || -d "${TARGET}" ) ]]; then
    find "${TARGET}" -name "*.tsx" 2>/dev/null
  elif [[ -n "${TARGET}" ]]; then
    # treat as partial path glob
    find "${FRONTEND}" -path "*${TARGET}*" -name "*.tsx" 2>/dev/null
  else
    # blank → changed files in pages/ and components/
    git diff --name-only HEAD 2>/dev/null \
      | grep -E '\.(tsx)$' \
      | grep -E '(pages|components)/' \
      | grep -v '__tests__' \
      || true
  fi
}

mapfile -t FILES < <(resolve_files | sort -u)

if [[ ${#FILES[@]} -eq 0 ]]; then
  echo "No .tsx files resolved for target '${TARGET}'."
  echo "Specify a file, directory, or leave blank to scan git diff."
  exit 0
fi

echo "== UI_HONESTY_PASS: scanning ${#FILES[@]} file(s) =="
printf '  %s\n' "${FILES[@]}"
echo ""

VIOLATION_COUNT=0

# ── pattern definitions ───────────────────────────────────────────────────────

# DIRECT_ACTION: buttons/labels claiming the system does the thing
DIRECT_ACTION_PATTERN='(Generate|Create|Send|Approve|Submit|Deploy|Execute|Publish|Delete)\s+(a |an |the |your |this )?[A-Z]'

# FLUFF_VERB: marketing/aspirational verbs in JSX string literals or attributes
FLUFF_PATTERN='(manages|orchestrates|intelligently|automatically|analyzes|processes|optimizes|revolutionizes|empowers|seamlessly|quantum|real-time monitoring|complete audit trail|comprehensive)'

# ASPIRATIONAL_CLAIM: present-tense omnipotent claims
ASPIRATIONAL_PATTERN='(View all|Complete |Full |All appeals|All documents|All transactions|All records|Comprehensive|Unified view)'

# MISSING_DISCLOSURE: tool invocation result rendered without disclosure text
DISCLOSURE_MISSING_PATTERN='(result\?|invocationResult|toolResult|response\?\.data)'

# BUTTON_LABEL_MISMATCH: finality words on write_low or draft handlers
BUTTON_MISMATCH_PATTERN="(Submit|Save|Approve|Finalize|Confirm).{0,60}(draft|request|pending)"

scan_pattern() {
  local label="$1"
  local pattern="$2"
  local file="$3"

  local matches
  matches=$(grep -nEi "${pattern}" "${file}" 2>/dev/null || true)

  if [[ -n "${matches}" ]]; then
    echo "--- ${label} violations in ${file} ---"
    echo "${matches}" | while IFS= read -r line; do
      echo "  ${line}"
      VIOLATION_COUNT=$((VIOLATION_COUNT + 1))
    done
    echo ""
  fi
}

# ── scan each file ────────────────────────────────────────────────────────────
for f in "${FILES[@]}"; do
  [[ -f "${f}" ]] || continue

  # Filter to JSX/TSX content lines (skip import/comment blocks for some patterns)
  scan_pattern "FLUFF_VERB"     "${FLUFF_PATTERN}"       "${f}"
  scan_pattern "ASPIRATIONAL"   "${ASPIRATIONAL_PATTERN}" "${f}"
done

echo "== SUMMARY =="
echo "Files scanned: ${#FILES[@]}"
echo "Pattern hits:  ${VIOLATION_COUNT}"
echo ""
echo "Note: DIRECT_ACTION and BUTTON_LABEL_MISMATCH require model interpretation"
echo "of handler context — review flagged files manually or ask Claude to evaluate."
echo ""
echo "Pass each flagged file to Claude with:"
echo "  Read the file, check every flagged line, classify violation type,"
echo "  suggest minimal honest rewrite."

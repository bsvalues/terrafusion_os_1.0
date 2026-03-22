#!/usr/bin/env bash
# .claude/skills/reserved-boundary-check/check.sh
# Scans for reserved architectural boundary violations in TerraFusion OS.
# Source of truth: frontend/apps/os-shell/src/config/suiteRegistry.ts
#   SuiteId     = forge | atlas | dais | dossier | gpt
#   OsFeatureId = pilot | trace | canon
#
# Usage: bash .claude/skills/reserved-boundary-check/check.sh [file|dir|blank]
#   blank → scan git diff --name-only HEAD (changed files only)
set -euo pipefail

TARGET="${1:-}"
FRONTEND="$(pwd)/frontend/apps/os-shell/src"
TOTAL_HITS=0

# ── resolve files ─────────────────────────────────────────────────────────────
resolve_files() {
  if [[ -n "${TARGET}" && -f "${TARGET}" ]]; then
    echo "${TARGET}"
  elif [[ -n "${TARGET}" && -d "${TARGET}" ]]; then
    find "${TARGET}" \( -name "*.ts" -o -name "*.tsx" -o -name "*.md" \) 2>/dev/null
  elif [[ -n "${TARGET}" ]]; then
    find "${FRONTEND}" -path "*${TARGET}*" \( -name "*.ts" -o -name "*.tsx" \) 2>/dev/null
  else
    # diff-only mode
    git diff --name-only HEAD 2>/dev/null \
      | grep -E '\.(ts|tsx|md)$' \
      | grep -v '__tests__\|\.spec\.' \
      || true
  fi
}

mapfile -t FILES < <(resolve_files | sort -u)

if [[ ${#FILES[@]} -eq 0 ]]; then
  echo "== RESERVED_BOUNDARY_CHECK: no files to scan =="
  echo "Specify a file/dir, or ensure 'git diff HEAD' shows changed .ts/.tsx files."
  exit 0
fi

echo "== RESERVED_BOUNDARY_CHECK: ${#FILES[@]} file(s) =="
printf '  %s\n' "${FILES[@]}"
echo ""

# ── scanner ───────────────────────────────────────────────────────────────────
# Args: label reason fix pattern [pattern2 ...]
scan_rule() {
  local label="$1"; local reason="$2"; local fix="$3"
  shift 3
  local hits=0

  for file in "${FILES[@]}"; do
    [[ -f "${file}" ]] || continue
    local matches
    matches=$(grep -nEi "$@" "${file}" 2>/dev/null || true)
    if [[ -n "${matches}" ]]; then
      echo "  [${label}] ${file}"
      echo "  REASON: ${reason}"
      echo "  FIX:    ${fix}"
      echo "${matches}" | while IFS= read -r line; do
        echo "    ${line}"
      done
      echo ""
      hits=$((hits + 1))
      TOTAL_HITS=$((TOTAL_HITS + 1))
    fi
  done
}

# ── Rule 1: TerraPilot treated as a Suite ────────────────────────────────────
scan_rule \
  "PILOT_AS_SUITE" \
  "TerraPilot (pilot) is an OsFeatureId, not a SuiteId. SuiteId = forge|atlas|dais|dossier|gpt." \
  "Remove 'suite' modifier. Use 'TerraPilot', 'Pilot OS feature', or 'PropertyPilot tab'." \
  "(terra)?pilot[[:space:]]+suite|suite[[:space:]]+(called[[:space:]]+)?pilot|the[[:space:]]+pilot[[:space:]]+suite|[Pp]ilot[[:space:]]+[Ss]uite|TerraPilot[[:space:]]+[Ss]uite"

# ── Rule 2: TerraCanon treated as a Suite ────────────────────────────────────
scan_rule \
  "CANON_AS_SUITE" \
  "TerraCanon (canon) is an OsFeatureId (protocol layer), not a SuiteId." \
  "Remove 'suite' modifier. Use 'TerraCanon', 'the Canon protocol', or 'CanonHome'." \
  "(terra)?canon[[:space:]]+suite|suite[[:space:]]+(called[[:space:]]+)?canon|the[[:space:]]+canon[[:space:]]+suite|[Cc]anon[[:space:]]+[Ss]uite"

# ── Rule 3: TerraTrace treated as a Suite ────────────────────────────────────
scan_rule \
  "TRACE_AS_SUITE" \
  "TerraTrace (trace) is an OsFeatureId (observability layer), not a SuiteId." \
  "Remove 'suite' modifier. Use 'TerraTrace', 'the Trace OS feature', or 'TraceHome'." \
  "(terra)?trace[[:space:]]+suite|suite[[:space:]]+(called[[:space:]]+)?trace|the[[:space:]]+trace[[:space:]]+suite|[Tt]race[[:space:]]+[Ss]uite"

# ── Rule 4: Canon/Pilot swap in API context ───────────────────────────────────
scan_rule \
  "CANON_PILOT_SWAP" \
  "Canon and Pilot are distinct OS features. Canon=integrity/protocol, Pilot=tool invocation." \
  "Keep canon operations in TerraCanon context (canonApi/CanonHome). Keep tool invocations in TerraPilot context (pilotApi)." \
  "listPilotTools.*canon|canon.*listPilotTools|pilotApi.*canon[[:space:]]|[[:space:]]canon.*pilotApi|invokeTool.*canon[[:space:]]+(op|action|command)|canon[[:space:]]+(op|action|command).*invokeTool"

# ── Rule 5: OS Features polluting SuiteId type or suite nav lists ─────────────
scan_rule \
  "OS_FEATURE_IN_SUITE_LIST" \
  "pilot/trace/canon are OsFeatureIds and must not appear as peers in SuiteId lists or suite navigation arrays." \
  "Remove pilot/trace/canon from suite ID lists. Route OS features via their own navigation (PilotHome, CanonHome, TraceHome)." \
  "'?\"?(pilot|trace|canon)'?\"?[[:space:]]*,[[:space:]]*(forge|atlas|dais|dossier|gpt)|(forge|atlas|dais|dossier|gpt)[[:space:]]*,[[:space:]]*'?\"?(pilot|trace|canon)|SuiteId.*[|'][[:space:]]*(pilot|trace|canon)[[:space:]]*[|'//]|[|'][[:space:]]*(pilot|trace|canon)[[:space:]]*[|'].*SuiteId"

# ── Rule 6: Shell/Workbench layer conflation ──────────────────────────────────
scan_rule \
  "SHELL_WORKBENCH_CONFLATION" \
  "OS shell chrome (Desktop/Taskbar/TopBar/CommandPalette) is a different layer from the workbench (PropertyWorkbench + tabs)." \
  "Use 'OS shell' or 'shell chrome' for the persistent chrome. Use 'workbench' only for the PropertyWorkbench parcel surface." \
  "workbench[[:space:]]+(shell[[:space:]]+(chrome|layer|frame|wrapper)|is[[:space:]]+the[[:space:]]+shell)|shell[[:space:]]+(chrome|layer)[[:space:]]+(is[[:space:]]+(the[[:space:]])?workbench|called[[:space:]]+workbench)"

# ── Rule 7: Reserved suite labels with fluff predicates ──────────────────────
scan_rule \
  "SUITE_FLUFF_PREDICATE" \
  "Suite descriptions claiming 'manages/orchestrates/handles' overstate what a suite does. Suites render views and invoke tools." \
  "Rewrite as 'The [Suite] tab shows...' or 'The [Suite] surface returns...'." \
  "(forge|atlas|dais|dossier|gpt)[[:space:]]+suite[[:space:]]+(manages|orchestrates|handles|controls|owns|powers|drives|governs)[[:space:]]+(all|the|your)"

# ── summary ───────────────────────────────────────────────────────────────────
echo "== SUMMARY =="
echo "Files scanned: ${#FILES[@]}"
echo "Rule hits:     ${TOTAL_HITS}"
echo ""

if [[ "${TOTAL_HITS}" -eq 0 ]]; then
  echo "CLEAN — no reserved boundary violations found."
else
  echo "ACTION REQUIRED — review violations above."
  echo "Read rules.txt for full rationale: .claude/skills/reserved-boundary-check/rules.txt"
fi

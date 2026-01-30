#!/usr/bin/env bash
# ════════════════════════════════════════════════════════════════════════════
# TerraFusion Governance Check
# ════════════════════════════════════════════════════════════════════════════
# Single source of truth for governance enforcement.
# Used by: pre-commit hook, SEAL workflow, manual CI runs
#
# Exit codes:
#   0 = All checks passed
#   1 = Governance violation (blocks merge)
# ════════════════════════════════════════════════════════════════════════════

set -euo pipefail

# ─────────────────────────────────────────────────────────────────────────────
# Configuration
# ─────────────────────────────────────────────────────────────────────────────

# Forbidden path patterns (from AGENTS.md)
FORBIDDEN_PATHS=(
  "**/ARCHIVE/**"
  "specialized/**"
  "applications/**"
)

# Legacy frontend (97+ lint errors, do not touch)
LEGACY_FRONTEND="frontend/"

# Port patterns that indicate hardcoding
PORT_PATTERNS=(
  'localhost:3000'
  'localhost:3001'
  'localhost:3002'
  'localhost:3003'
  'localhost:3004'
  'localhost:5000'
  'localhost:5001'
  'localhost:5002'
  'localhost:5173'
  'port\s*=\s*3\d{3}'
  'port\s*=\s*5\d{3}'
  ':3000[^0-9]'
  ':5000[^0-9]'
)

# Allowed exceptions for port patterns (config files, docs, comments)
PORT_EXCEPTIONS=(
  "*.md"
  "*.yml"
  "*.yaml"
  "*.json"
  ".github/**"
  "docs/**"
  "config/**"
)

# ─────────────────────────────────────────────────────────────────────────────
# Helpers
# ─────────────────────────────────────────────────────────────────────────────

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
NC='\033[0m' # No Color

log_pass() { echo -e "${GREEN}✅ $1${NC}"; }
log_warn() { echo -e "${YELLOW}⚠️  $1${NC}"; }
log_fail() { echo -e "${RED}❌ $1${NC}"; }
log_info() { echo -e "   $1"; }

# Get changed files (works in both local and CI contexts)
get_changed_files() {
  if [ -n "${CI:-}" ]; then
    # CI: Use git diff with base ref
    if [ -n "${GITHUB_BASE_REF:-}" ]; then
      git diff --name-only "origin/${GITHUB_BASE_REF}...HEAD" 2>/dev/null || git diff --name-only HEAD~1
    elif [ -n "${GITHUB_EVENT_BEFORE:-}" ] && [ "${GITHUB_EVENT_BEFORE}" != "0000000000000000000000000000000000000000" ]; then
      git diff --name-only "${GITHUB_EVENT_BEFORE}...HEAD" 2>/dev/null || git diff --name-only HEAD~1
    else
      git diff --name-only HEAD~1 2>/dev/null || git ls-files
    fi
  else
    # Local: Use staged files
    git diff --cached --name-only 2>/dev/null || git diff --name-only HEAD
  fi
}

# Check if file matches any pattern in array
matches_pattern() {
  local file="$1"
  shift
  local patterns=("$@")
  
  for pattern in "${patterns[@]}"; do
    # Convert glob to regex
    local regex="${pattern//\*\*/.*}"
    regex="${regex//\*/[^/]*}"
    if [[ "$file" =~ $regex ]]; then
      return 0
    fi
  done
  return 1
}

# ─────────────────────────────────────────────────────────────────────────────
# Check: Forbidden Paths
# ─────────────────────────────────────────────────────────────────────────────

check_forbidden_paths() {
  local violations=()
  local files
  files=$(get_changed_files)
  
  while IFS= read -r file; do
    [ -z "$file" ] && continue
    
    for pattern in "${FORBIDDEN_PATHS[@]}"; do
      # Convert glob to simple check
      case "$pattern" in
        "**/ARCHIVE/**")
          if [[ "$file" == *"/ARCHIVE/"* ]] || [[ "$file" == "ARCHIVE/"* ]]; then
            violations+=("$file (matches $pattern)")
          fi
          ;;
        "specialized/**")
          if [[ "$file" == specialized/* ]]; then
            violations+=("$file (matches $pattern)")
          fi
          ;;
        "applications/**")
          if [[ "$file" == applications/* ]]; then
            violations+=("$file (matches $pattern)")
          fi
          ;;
      esac
    done
  done <<< "$files"
  
  if [ ${#violations[@]} -gt 0 ]; then
    log_fail "Forbidden paths modified (AGENTS.md violation)"
    for v in "${violations[@]}"; do
      log_info "  - $v"
    done
    return 1
  fi
  
  log_pass "No forbidden paths modified"
  return 0
}

# ─────────────────────────────────────────────────────────────────────────────
# Check: Legacy Frontend
# ─────────────────────────────────────────────────────────────────────────────

check_legacy_frontend() {
  local violations=()
  local files
  files=$(get_changed_files)
  
  while IFS= read -r file; do
    [ -z "$file" ] && continue
    
    # Check if file is in legacy frontend (but not frontend-v2)
    if [[ "$file" == frontend/* ]] && [[ "$file" != frontend-v2/* ]]; then
      violations+=("$file")
    fi
  done <<< "$files"
  
  if [ ${#violations[@]} -gt 0 ]; then
    log_fail "Legacy frontend modified (97+ lint errors - use frontend-v2/ instead)"
    for v in "${violations[@]}"; do
      log_info "  - $v"
    done
    return 1
  fi
  
  log_pass "Legacy frontend not touched"
  return 0
}

# ─────────────────────────────────────────────────────────────────────────────
# Check: Hardcoded Ports
# ─────────────────────────────────────────────────────────────────────────────

check_hardcoded_ports() {
  local violations=()
  local files
  files=$(get_changed_files)
  
  while IFS= read -r file; do
    [ -z "$file" ] && continue
    
    # Skip if file matches exception patterns
    if matches_pattern "$file" "${PORT_EXCEPTIONS[@]}"; then
      continue
    fi
    
    # Skip if file doesn't exist (deleted)
    [ ! -f "$file" ] && continue
    
    # Skip binary files
    if file "$file" 2>/dev/null | grep -q 'binary'; then
      continue
    fi
    
    # Check for port patterns
    for pattern in "${PORT_PATTERNS[@]}"; do
      if grep -qE "$pattern" "$file" 2>/dev/null; then
        local matches
        matches=$(grep -nE "$pattern" "$file" 2>/dev/null | head -3)
        violations+=("$file: $matches")
        break
      fi
    done
  done <<< "$files"
  
  if [ ${#violations[@]} -gt 0 ]; then
    log_fail "Hardcoded ports detected (use environment variables)"
    for v in "${violations[@]}"; do
      log_info "  - $v"
    done
    log_info ""
    log_info "  Fix: Use \${TF_*_PORT:-default} pattern"
    log_info "  Example: localhost:\${TF_API_PORT:-5046}"
    return 1
  fi
  
  log_pass "No hardcoded ports detected"
  return 0
}

# ─────────────────────────────────────────────────────────────────────────────
# Main
# ─────────────────────────────────────────────────────────────────────────────

main() {
  echo ""
  echo "🔒 TerraFusion Governance Check"
  echo "════════════════════════════════"
  echo ""
  
  local exit_code=0
  
  # Run all checks
  check_forbidden_paths || exit_code=1
  check_legacy_frontend || exit_code=1
  # Port check is informational for now (too many existing violations)
  # TODO: Enable blocking after cleanup sprint
  check_hardcoded_ports || log_warn "Port violations detected (informational only)"
  
  echo ""
  
  if [ $exit_code -eq 0 ]; then
    log_pass "All governance checks passed"
    echo ""
  else
    log_fail "Governance violations detected - merge blocked"
    echo ""
    echo "📚 See: .github/AGENT_ENTRYPOINT.md for rules"
    echo "📚 See: AGENTS.md for full governance policy"
    echo ""
  fi
  
  return $exit_code
}

# Run if executed directly (not sourced)
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
  main "$@"
fi

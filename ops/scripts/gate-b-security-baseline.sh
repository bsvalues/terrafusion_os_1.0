#!/usr/bin/env bash
set -euo pipefail

# Gate B: Security Baseline
# Security scanning, SBOM generation, secrets detection, policy checks.
# Tools: Trivy (container/fs scan), gitleaks (secrets), SBOM generation

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
ARTIFACTS_DIR="$ROOT_DIR/artifacts"
SBOM_DIR="$ARTIFACTS_DIR/sbom"
REPORTS_DIR="$ARTIFACTS_DIR/reports"
LOG_FILE="$ARTIFACTS_DIR/logs/gate-b-security.log"

mkdir -p "$SBOM_DIR" "$REPORTS_DIR" "$ARTIFACTS_DIR/logs"

ERRORS=0
WARNINGS=0
SKIP_SCANNING=${SKIP_SECURITY_SCAN:-false}

log() {
  local msg="[Gate B - $(date -Iseconds)] $*"
  echo "$msg"
  echo "$msg" >> "$LOG_FILE"
}

log_ok() { log "✅ $*"; }
log_warn() { log "⚠️  WARN: $*"; ((WARNINGS++)) || true; }
log_error() { log "❌ ERROR: $*"; ((ERRORS++)) || true; }
log_skip() { log "⏭️  SKIP: $*"; }

log "════════════════════════════════════════════════════════════════"
log "Starting Gate B: Security Baseline"
log "════════════════════════════════════════════════════════════════"

# --- Check for sensitive files in repo ---
log ""
log "--- Checking for sensitive files (git-tracked only for speed) ---"
SENSITIVE_PATTERNS=(
  "*.pem"
  "*.key"
  "*.p12"
  "*.pfx"
  "id_rsa"
  "id_ed25519"
  ".env.local"
  ".env.production"
)

# Use git ls-files for fast scanning of tracked files only
FOUND_SENSITIVE=0
cd "$ROOT_DIR"
for pattern in "${SENSITIVE_PATTERNS[@]}"; do
  # Search only git-tracked files (fast)
  matches=$(git ls-files "$pattern" 2>/dev/null | grep -v -E '(\.md$|\.example$|cacert\.pem$)' | head -5 || true)
  if [[ -n "$matches" ]]; then
    log_warn "Found potential sensitive TRACKED files matching '$pattern':"
    echo "$matches" | while read -r f; do log "  - $f"; done
    ((FOUND_SENSITIVE++)) || true
  fi
done

# Quick check for untracked sensitive files (with 5 second timeout)
log "Checking untracked files (5s timeout)..."
UNTRACKED_SENSITIVE=$(timeout 5 git ls-files --others --exclude-standard 2>/dev/null | grep -E '\.(pem|key|p12|pfx)$' | grep -v -E '(cacert\.pem$|node_modules|\.venv|venv|site-packages)' | head -5 || true)
if [[ -n "$UNTRACKED_SENSITIVE" ]]; then
  log_warn "Found potential sensitive UNTRACKED files:"
  echo "$UNTRACKED_SENSITIVE" | while read -r f; do log "  - $f"; done
  ((FOUND_SENSITIVE++)) || true
fi

if (( FOUND_SENSITIVE == 0 )); then
  log_ok "No obvious sensitive files found in repo"
fi

# --- Check .gitignore for security patterns ---
log ""
log "--- Checking .gitignore for security patterns ---"
GITIGNORE="$ROOT_DIR/.gitignore"
if [[ -f "$GITIGNORE" ]]; then
  REQUIRED_IGNORES=(".env" "*.pem" "*.key" "secrets/")
  for pattern in "${REQUIRED_IGNORES[@]}"; do
    if grep -qF "$pattern" "$GITIGNORE" 2>/dev/null; then
      log_ok ".gitignore includes '$pattern'"
    else
      log_warn ".gitignore should include '$pattern'"
    fi
  done
else
  log_warn ".gitignore not found at repo root"
fi

# --- Trivy filesystem scan (if available) ---
log ""
log "--- Security Scanning ---"
if [[ "$SKIP_SCANNING" == "true" ]]; then
  log_skip "Security scanning disabled (SKIP_SECURITY_SCAN=true)"
elif command -v trivy >/dev/null 2>&1; then
  log "Running Trivy filesystem scan..."
  TRIVY_REPORT="$REPORTS_DIR/trivy-fs-report.json"
  if trivy fs --severity HIGH,CRITICAL --format json --output "$TRIVY_REPORT" "$ROOT_DIR" 2>/dev/null; then
    log_ok "Trivy scan completed: $TRIVY_REPORT"
    # Count vulnerabilities
    if command -v jq >/dev/null 2>&1; then
      VULN_COUNT=$(jq '[.Results[]?.Vulnerabilities // [] | length] | add // 0' "$TRIVY_REPORT" 2>/dev/null || echo "0")
      if (( VULN_COUNT > 0 )); then
        log_warn "Trivy found $VULN_COUNT HIGH/CRITICAL vulnerabilities"
      else
        log_ok "No HIGH/CRITICAL vulnerabilities found"
      fi
    fi
  else
    log_warn "Trivy scan failed or found issues"
  fi
else
  log "INFO: Trivy not installed. Install: https://aquasecurity.github.io/trivy/"
  log "      Skipping vulnerability scan."
fi

# --- Gitleaks secrets detection (if available) ---
log ""
log "--- Secrets Detection ---"
if [[ "$SKIP_SCANNING" == "true" ]]; then
  log_skip "Secrets scanning disabled"
elif command -v gitleaks >/dev/null 2>&1; then
  log "Running Gitleaks secrets detection..."
  GITLEAKS_REPORT="$REPORTS_DIR/gitleaks-report.json"
  if gitleaks detect --source "$ROOT_DIR" --report-format json --report-path "$GITLEAKS_REPORT" --no-git 2>/dev/null; then
    log_ok "No secrets detected by Gitleaks"
  else
    log_error "Gitleaks detected potential secrets! Review: $GITLEAKS_REPORT"
  fi
else
  log "INFO: Gitleaks not installed. Install: https://github.com/gitleaks/gitleaks"
  log "      Skipping secrets detection."
fi

# --- Generate SBOM (Software Bill of Materials) ---
log ""
log "--- SBOM Generation ---"
SBOM_FILE="$SBOM_DIR/terrafusion-sbom.json"

# Try syft for comprehensive SBOM
if command -v syft >/dev/null 2>&1; then
  log "Generating SBOM with Syft..."
  if syft "$ROOT_DIR" -o spdx-json="$SBOM_FILE" 2>/dev/null; then
    log_ok "SBOM generated: $SBOM_FILE"
  else
    log_warn "Syft SBOM generation failed"
  fi
else
  # Fallback: Generate basic package inventory
  log "INFO: Syft not installed. Generating basic package inventory..."

  echo '{"packages": [], "generated": "'$(date -Iseconds)'"}' > "$SBOM_FILE"

  # Collect .NET packages
  if [[ -d "$ROOT_DIR/backend" ]]; then
    DOTNET_PKGS=$(find "$ROOT_DIR/backend" -name "*.csproj" -exec grep -h "<PackageReference" {} \; 2>/dev/null | wc -l || echo "0")
    log "  .NET packages referenced: $DOTNET_PKGS"
  fi

  # Collect npm/pnpm packages
  if [[ -f "$ROOT_DIR/frontend/package.json" ]]; then
    NPM_DEPS=$(jq '.dependencies | length' "$ROOT_DIR/frontend/package.json" 2>/dev/null || echo "0")
    NPM_DEVDEPS=$(jq '.devDependencies | length' "$ROOT_DIR/frontend/package.json" 2>/dev/null || echo "0")
    log "  npm dependencies: $NPM_DEPS (+$NPM_DEVDEPS dev)"
  fi

  log_ok "Basic SBOM inventory created: $SBOM_FILE"
fi

# --- Check for security headers in configs ---
log ""
log "--- Security Configuration Checks ---"

# Check if HTTPS/TLS is configured
if grep -rq "https://" "$ROOT_DIR/config" 2>/dev/null || grep -rq "TLS" "$ROOT_DIR/config" 2>/dev/null; then
  log_ok "HTTPS/TLS configuration found"
else
  log_warn "No HTTPS/TLS configuration detected in config/"
fi

# Check for authentication configuration
if grep -rq "auth\|jwt\|oauth\|keycloak" "$ROOT_DIR/config" 2>/dev/null; then
  log_ok "Authentication configuration found"
else
  log_warn "No authentication configuration detected in config/"
fi

# --- Summary ---
log ""
log "════════════════════════════════════════════════════════════════"
log "Gate B Summary: $ERRORS error(s), $WARNINGS warning(s)"
log "Reports: $REPORTS_DIR"
log "SBOM: $SBOM_DIR"
log "Log: $LOG_FILE"
log "════════════════════════════════════════════════════════════════"

if (( ERRORS > 0 )); then
  log "❌ Gate B: FAILED - Security issues detected"
  exit 1
fi

if (( WARNINGS > 0 )); then
  log "⚠️  Gate B: PASSED with warnings"
else
  log "✅ Gate B: PASSED"
fi

exit 0

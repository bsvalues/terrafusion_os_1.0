#!/usr/bin/env bash
# ═══════════════════════════════════════════════════════════════════════════════
# ops/benton-parity/lib/build-probe.sh — Build attempts under deny-all
# ═══════════════════════════════════════════════════════════════════════════════
# Attempts dotnet restore/build and pnpm install/build.
# Every failure is captured as a supply-chain requirement.
# ═══════════════════════════════════════════════════════════════════════════════

set -Eeuo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=common.sh
source "$SCRIPT_DIR/common.sh"

SC_REQ_FILE="${EVIDENCE_DIR}/supply-chain-requirements.json"
BUILD_LOG_DIR="${EVIDENCE_DIR}/build-logs"

# ── dotnet probe ───────────────────────────────────────────────────────────────
probe_dotnet_restore() {
  log_info "Probing: dotnet restore"
  mkdir -p "$BUILD_LOG_DIR"

  if ! command -v dotnet &>/dev/null; then
    log_fail "BUILD dotnet not found on PATH"
    append_requirement "$SC_REQ_FILE" "toolchain" "dotnet-sdk" \
      "dotnet SDK 8.0.x required on runner" "build-probe: command -v dotnet"
    return 0
  fi

  local log_file="${BUILD_LOG_DIR}/dotnet-restore.log"
  local sln_file="${REPO_ROOT}/backend/TerraFusion.sln"

  if [ ! -f "$sln_file" ]; then
    log_fail "BUILD Solution file not found: backend/TerraFusion.sln"
    append_requirement "$SC_REQ_FILE" "build" "solution-file" \
      "backend/TerraFusion.sln must exist" "build-probe: test -f"
    return 0
  fi

  local exit_code=0
  dotnet restore "$sln_file" --verbosity detailed 2>&1 | tee "$log_file" || exit_code=$?

  if [ $exit_code -ne 0 ]; then
    log_fail "BUILD dotnet restore failed (exit $exit_code)"

    # Parse NuGet failures from the log
    # Look for: "Unable to load the service index for source"
    local failed_sources
    failed_sources=$(grep -oP "Unable to load the service index for source '?\K[^'\"]+'" "$log_file" 2>/dev/null | sort -u || true)
    if [ -n "$failed_sources" ]; then
      while IFS= read -r source; do
        append_requirement "$SC_REQ_FILE" "nuget-source" "$source" \
          "NuGet source unreachable — mirror or cache required" \
          "dotnet restore: $source"
      done <<< "$failed_sources"
    fi

    # Look for individual package restore failures
    local failed_pkgs
    failed_pkgs=$(grep -oP "error NU\d+.*?'?\K[A-Za-z0-9_.]+'" "$log_file" 2>/dev/null | sort -u || true)
    if [ -n "$failed_pkgs" ]; then
      while IFS= read -r pkg; do
        append_requirement "$SC_REQ_FILE" "nuget-package" "$pkg" \
          "NuGet package must be cached or mirrored" \
          "dotnet restore"
      done <<< "$failed_pkgs"
    fi
  else
    log_ok "BUILD dotnet restore succeeded"
  fi

  return 0
}

probe_dotnet_build() {
  log_info "Probing: dotnet build"
  mkdir -p "$BUILD_LOG_DIR"

  if ! command -v dotnet &>/dev/null; then
    return 0  # Already reported in restore
  fi

  local log_file="${BUILD_LOG_DIR}/dotnet-build.log"
  local sln_file="${REPO_ROOT}/backend/TerraFusion.sln"

  [ ! -f "$sln_file" ] && return 0

  local exit_code=0
  dotnet build "$sln_file" -c Release --no-restore 2>&1 | tee "$log_file" || exit_code=$?

  if [ $exit_code -ne 0 ]; then
    log_fail "BUILD dotnet build failed (exit $exit_code)"
    append_requirement "$SC_REQ_FILE" "build" "dotnet-build" \
      "dotnet build -c Release failed (see build-logs/dotnet-build.log)" \
      "dotnet build"
  else
    log_ok "BUILD dotnet build succeeded"
  fi

  return 0
}

# ── pnpm probe ─────────────────────────────────────────────────────────────────
probe_pnpm_install() {
  log_info "Probing: pnpm install"
  mkdir -p "$BUILD_LOG_DIR"

  if ! command -v pnpm &>/dev/null; then
    log_fail "BUILD pnpm not found on PATH"
    append_requirement "$SC_REQ_FILE" "toolchain" "pnpm" \
      "pnpm >=9.0.0 required on runner" "build-probe: command -v pnpm"
    return 0
  fi

  local log_file="${BUILD_LOG_DIR}/pnpm-install.log"

  if [ ! -f "${REPO_ROOT}/pnpm-lock.yaml" ]; then
    log_fail "BUILD pnpm-lock.yaml not found"
    append_requirement "$SC_REQ_FILE" "build" "pnpm-lock" \
      "pnpm-lock.yaml must exist for frozen lockfile install" \
      "build-probe: test -f"
    return 0
  fi

  local exit_code=0
  (cd "$REPO_ROOT" && pnpm install --frozen-lockfile 2>&1) | tee "$log_file" || exit_code=$?

  if [ $exit_code -ne 0 ]; then
    log_fail "BUILD pnpm install failed (exit $exit_code)"

    # Parse npm registry failures
    local failed_fetches
    failed_fetches=$(grep -oP '(ERR_PNPM_FETCH_\S+|GET https://\S+)' "$log_file" 2>/dev/null | sort -u || true)
    if [ -n "$failed_fetches" ]; then
      while IFS= read -r fetch; do
        append_requirement "$SC_REQ_FILE" "npm-fetch" "$fetch" \
          "npm registry fetch failed — mirror or offline cache required" \
          "pnpm install"
      done <<< "$failed_fetches"
    fi

    # Check for specific registry issues
    if grep -q "registry.npmjs.org" "$log_file" 2>/dev/null; then
      append_requirement "$SC_REQ_FILE" "npm-registry" "registry.npmjs.org" \
        "npm registry unreachable — offline mirror or Verdaccio instance required" \
        "pnpm install"
    fi
  else
    log_ok "BUILD pnpm install succeeded"
  fi

  return 0
}

probe_pnpm_build() {
  log_info "Probing: pnpm build (frontend)"
  mkdir -p "$BUILD_LOG_DIR"

  if ! command -v pnpm &>/dev/null; then
    return 0
  fi

  local log_file="${BUILD_LOG_DIR}/pnpm-build.log"

  # Check if frontend exists
  if [ ! -f "${REPO_ROOT}/frontend/package.json" ]; then
    log_warn "BUILD frontend/package.json not found — skipping frontend build probe"
    return 0
  fi

  local exit_code=0
  (cd "$REPO_ROOT" && pnpm -C frontend run build 2>&1) | tee "$log_file" || exit_code=$?

  if [ $exit_code -ne 0 ]; then
    log_fail "BUILD pnpm frontend build failed (exit $exit_code)"
    append_requirement "$SC_REQ_FILE" "build" "frontend-build" \
      "Frontend build failed (see build-logs/pnpm-build.log)" \
      "pnpm -C frontend run build"
  else
    log_ok "BUILD pnpm frontend build succeeded"
  fi

  return 0
}

# ── Node.js probe ──────────────────────────────────────────────────────────────
probe_node() {
  log_info "Probing: node/npm versions"

  if ! command -v node &>/dev/null; then
    log_fail "BUILD node not found on PATH"
    append_requirement "$SC_REQ_FILE" "toolchain" "node" \
      "Node.js 20.x required on runner" "build-probe: command -v node"
    return 0
  fi

  local node_ver
  node_ver=$(node --version 2>/dev/null || echo "unknown")
  if [[ "$node_ver" != v20.* ]]; then
    log_warn "BUILD node version $node_ver (expected v20.x)"
    append_requirement "$SC_REQ_FILE" "toolchain" "node-version" \
      "Node.js 20.x required (found: $node_ver)" \
      "node --version"
  else
    log_ok "BUILD node $node_ver"
  fi
}

probe_git() {
  log_info "Probing: git"

  if ! command -v git &>/dev/null; then
    log_fail "BUILD git not found on PATH"
    append_requirement "$SC_REQ_FILE" "toolchain" "git" \
      "git >=2.30.0 required on runner" "build-probe: command -v git"
    return 0
  fi

  local git_ver
  git_ver=$(git --version | awk '{print $3}' 2>/dev/null || echo "unknown")
  log_ok "BUILD git $git_ver"
}

# ── Main ───────────────────────────────────────────────────────────────────────
run_build_probe() {
  log_phase "BUILD / SUPPLY-CHAIN PROBE"
  ensure_evidence_dir
  echo '[]' > "$SC_REQ_FILE"

  # Toolchain checks first
  probe_node
  probe_git

  # dotnet: restore then build
  probe_dotnet_restore
  probe_dotnet_build

  # pnpm: install then build
  probe_pnpm_install
  probe_pnpm_build

  echo ""
  local req_count
  if command -v jq &>/dev/null && [ -f "$SC_REQ_FILE" ]; then
    req_count=$(jq 'length' "$SC_REQ_FILE" 2>/dev/null || echo "?")
  else
    req_count="(see ${SC_REQ_FILE})"
  fi
  log_info "Supply-chain probe complete: ${req_count} requirements discovered"
}

if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
  run_build_probe
fi

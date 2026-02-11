#!/usr/bin/env bash
# ═══════════════════════════════════════════════════════════════════════════════
# ops/benton-parity/lib/runtime-probe.sh — Runtime & health-check probing
# ═══════════════════════════════════════════════════════════════════════════════
# Attempts to start services and run health checks under deny-all constraints.
# Discovers internal port requirements and runtime dependencies.
# ═══════════════════════════════════════════════════════════════════════════════

set -Eeuo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=common.sh
source "$SCRIPT_DIR/common.sh"

PORTS_REQ_FILE="${EVIDENCE_DIR}/ports-requirements.json"
SECRETS_REQ_FILE="${EVIDENCE_DIR}/secrets-requirements.json"
RUNTIME_LOG_DIR="${EVIDENCE_DIR}/runtime-logs"

# ── Service definitions ────────────────────────────────────────────────────────
# Format: "name|project_path|port|health_endpoint"
SERVICES=(
  "TerraFusion API (Kernel)|backend/TerraFusion.API|5000|/health"
  "TerraFusion Gateway (Shell)|backend/TerraFusion.Gateway|3002|/health"
  "TerraFusion Consciousness|backend/TerraFusion.Consciousness|3004|/health"
)

# ── Environment variable probe ────────────────────────────────────────────────
# These are env vars the services expect. Missing ones become requirements.
EXPECTED_ENVVARS=(
  "ConnectionStrings__DefaultConnection|Database connection string"
  "JwtSettings__SecretKey|JWT signing key for authentication"
  "ASPNETCORE_ENVIRONMENT|Runtime environment (Development/Production)"
  "ASPNETCORE_URLS|Service listen URLs"
  "TF_API_PORT|API service port override"
  "TF_FRONTEND_PORT|Frontend service port override"
)

probe_environment() {
  log_info "Probing: required environment variables"
  ensure_evidence_dir
  echo '[]' > "$SECRETS_REQ_FILE"

  for entry in "${EXPECTED_ENVVARS[@]}"; do
    IFS='|' read -r varname description <<< "$entry"
    if [ -z "${!varname:-}" ]; then
      log_fail "ENV  ${varname} — not set (${description})"
      append_requirement "$SECRETS_REQ_FILE" "secret" "$varname" \
        "$description" "runtime-probe: env check"
    else
      log_ok "ENV  ${varname} — set"
    fi
  done
}

# ── Port availability probe ───────────────────────────────────────────────────
probe_port_available() {
  local port="$1" service_name="$2"

  if command -v ss &>/dev/null; then
    if ss -tlnp 2>/dev/null | grep -q ":${port} "; then
      log_warn "PORT ${port} already in use (needed by ${service_name})"
      append_requirement "$PORTS_REQ_FILE" "port-conflict" "$port" \
        "Port ${port} already in use — needed by ${service_name}" \
        "ss -tlnp"
      return 1
    fi
  elif command -v netstat &>/dev/null; then
    if netstat -tlnp 2>/dev/null | grep -q ":${port} "; then
      log_warn "PORT ${port} already in use (needed by ${service_name})"
      append_requirement "$PORTS_REQ_FILE" "port-conflict" "$port" \
        "Port ${port} already in use — needed by ${service_name}" \
        "netstat -tlnp"
      return 1
    fi
  fi
  return 0
}

# ── Service start probe ───────────────────────────────────────────────────────
probe_service_start() {
  local name="$1" project_path="$2" port="$3" health_endpoint="$4"

  log_info "Probing: ${name} (port ${port})"
  mkdir -p "$RUNTIME_LOG_DIR"

  local full_path="${REPO_ROOT}/${project_path}"
  local log_file="${RUNTIME_LOG_DIR}/$(echo "$name" | tr ' ()' '___').log"

  # Check project exists
  if [ ! -d "$full_path" ]; then
    log_fail "RUNTIME ${name} — project directory not found: ${project_path}"
    append_requirement "$PORTS_REQ_FILE" "service" "$name" \
      "Project directory ${project_path} must exist" \
      "test -d"
    return 0
  fi

  # Check port availability
  probe_port_available "$port" "$name" || true

  # Record the port requirement
  append_requirement "$PORTS_REQ_FILE" "internal-port" "$port" \
    "${name} listens on port ${port}" \
    "service definition"

  # Try to start the service in background and probe health
  if command -v dotnet &>/dev/null; then
    local pid=""
    local exit_code=0

    # Start service with timeout, capture PID
    ASPNETCORE_URLS="http://localhost:${port}" \
    ASPNETCORE_ENVIRONMENT="Development" \
      dotnet run --project "$full_path" --no-build 2>&1 &
    pid=$!

    # Wait up to 30 seconds for health endpoint
    local healthy=false
    for i in $(seq 1 30); do
      if ! kill -0 "$pid" 2>/dev/null; then
        log_fail "RUNTIME ${name} — process exited before healthy"
        wait "$pid" 2>/dev/null || exit_code=$?
        break
      fi

      if command -v curl &>/dev/null; then
        local http_code
        http_code=$(curl -sS -o /dev/null -w '%{http_code}' --connect-timeout 2 --max-time 3 \
          "http://localhost:${port}${health_endpoint}" 2>/dev/null || echo "000")
        if [ "$http_code" = "200" ]; then
          healthy=true
          break
        fi
      fi
      sleep 1
    done

    # Kill the service
    if kill -0 "$pid" 2>/dev/null; then
      kill "$pid" 2>/dev/null || true
      wait "$pid" 2>/dev/null || true
    fi

    if [ "$healthy" = true ]; then
      log_ok "RUNTIME ${name} — healthy on port ${port}"
    else
      log_fail "RUNTIME ${name} — did not become healthy within 30s"
      append_requirement "$PORTS_REQ_FILE" "runtime" "$name" \
        "Service did not pass health check on port ${port}${health_endpoint}" \
        "runtime-probe"
    fi
  else
    log_warn "RUNTIME ${name} — skipped (dotnet not available)"
  fi

  return 0
}

# ── Docker probe ───────────────────────────────────────────────────────────────
probe_docker() {
  log_info "Probing: Docker availability (informational)"

  if ! command -v docker &>/dev/null; then
    log_warn "DOCKER not installed (OK — PR gates are pure compute)"
    append_requirement "$PORTS_REQ_FILE" "informational" "docker" \
      "Docker not available — not required for PR gates, optional for container builds" \
      "command -v docker"
    return 0
  fi

  if ! docker info &>/dev/null 2>&1; then
    log_warn "DOCKER CLI present but daemon not responding"
    append_requirement "$PORTS_REQ_FILE" "informational" "docker-daemon" \
      "Docker daemon not responding — not required for PR gates" \
      "docker info"
    return 0
  fi

  log_ok "DOCKER available and responsive"
}

# ── Main ───────────────────────────────────────────────────────────────────────
run_runtime_probe() {
  log_phase "RUNTIME / HEALTH-CHECK PROBE"
  ensure_evidence_dir
  echo '[]' > "$PORTS_REQ_FILE"
  echo '[]' > "$SECRETS_REQ_FILE"

  # Environment first
  probe_environment

  # Docker (informational)
  probe_docker

  # Check port availability for all services
  log_info "Checking internal port requirements..."
  for service in "${SERVICES[@]}"; do
    IFS='|' read -r name project_path port health_endpoint <<< "$service"
    append_requirement "$PORTS_REQ_FILE" "internal-port" "$port" \
      "${name} requires port ${port} open internally" \
      "service definition"
    probe_port_available "$port" "$name" || true
  done

  # Only attempt service starts if dotnet is available AND build succeeded
  if command -v dotnet &>/dev/null; then
    local sln="${REPO_ROOT}/backend/TerraFusion.sln"
    if [ -f "$sln" ]; then
      # Check if build artifacts exist
      local api_dll="${REPO_ROOT}/backend/TerraFusion.API/bin/Release/net8.0/TerraFusion.API.dll"
      if [ -f "$api_dll" ]; then
        log_info "Build artifacts found — attempting service health probes..."
        for service in "${SERVICES[@]}"; do
          IFS='|' read -r name project_path port health_endpoint <<< "$service"
          probe_service_start "$name" "$project_path" "$port" "$health_endpoint"
        done
      else
        log_warn "RUNTIME — build artifacts not found (dotnet build may have failed)"
        log_warn "RUNTIME — skipping service start probes (fix build first)"
      fi
    fi
  fi

  echo ""
  log_info "Runtime probe complete"
}

if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
  run_runtime_probe
fi

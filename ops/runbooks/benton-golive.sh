#!/bin/bash
# ═══════════════════════════════════════════════════════════════════════════
# TerraFusion Benton County Go-Live Runbook
# ═══════════════════════════════════════════════════════════════════════════
# Usage: ./benton-golive.sh <base-url>
# Example: ./benton-golive.sh https://tf.benton.wa.gov
#
# This is the ONLY script County IT needs to know about.
# TerraFusion operators run this after deployment.
# ═══════════════════════════════════════════════════════════════════════════

set -euo pipefail

# ═══════════════════════════════════════════════════════════════════════════
# CONFIGURATION
# ═══════════════════════════════════════════════════════════════════════════

COUNTY="benton"
BASE_URL="${1:-}"
TIMESTAMP=$(date -u +"%Y%m%dT%H%M%SZ")
CERT_DIR="artifacts/cert/${TIMESTAMP}"
COMPOSE_FILE="compose/docker-compose.production-optimized.yml"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

# ═══════════════════════════════════════════════════════════════════════════
# FUNCTIONS
# ═══════════════════════════════════════════════════════════════════════════

print_header() {
    echo -e "${CYAN}"
    echo "═══════════════════════════════════════════════════════════════════════════"
    echo " TERRAFUSION BENTON COUNTY GO-LIVE"
    echo " Timestamp: ${TIMESTAMP}"
    echo " Target: ${BASE_URL:-'(not set)'}"
    echo "═══════════════════════════════════════════════════════════════════════════"
    echo -e "${NC}"
}

check_prerequisites() {
    echo -e "${YELLOW}[PREFLIGHT] Checking prerequisites...${NC}"
    
    # Check Python
    if ! command -v python &> /dev/null && ! command -v python3 &> /dev/null; then
        echo -e "${RED}[FAIL] Python not found${NC}"
        exit 1
    fi
    PYTHON_CMD=$(command -v python3 || command -v python)
    echo -e "${GREEN}[OK] Python: ${PYTHON_CMD}${NC}"
    
    # Check Docker
    if ! command -v docker &> /dev/null; then
        echo -e "${RED}[FAIL] Docker not found${NC}"
        exit 1
    fi
    echo -e "${GREEN}[OK] Docker: $(docker --version)${NC}"
    
    # Check docker-compose
    if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
        echo -e "${RED}[FAIL] Docker Compose not found${NC}"
        exit 1
    fi
    echo -e "${GREEN}[OK] Docker Compose available${NC}"
    
    # Check RuntimeCert tool
    if [[ ! -f "tools/runtime-cert/tf-runtime.py" ]]; then
        echo -e "${RED}[FAIL] RuntimeCert tool not found at tools/runtime-cert/tf-runtime.py${NC}"
        exit 1
    fi
    echo -e "${GREEN}[OK] RuntimeCert tool found${NC}"
    
    # Check compose file
    if [[ ! -f "${COMPOSE_FILE}" ]]; then
        echo -e "${RED}[FAIL] Compose file not found: ${COMPOSE_FILE}${NC}"
        exit 1
    fi
    echo -e "${GREEN}[OK] Compose file: ${COMPOSE_FILE}${NC}"
    
    echo ""
}

validate_base_url() {
    if [[ -z "${BASE_URL}" ]]; then
        echo -e "${RED}[ERROR] Base URL required${NC}"
        echo "Usage: $0 <base-url>"
        echo "Example: $0 https://tf.benton.wa.gov"
        exit 1
    fi
    
    if [[ ! "${BASE_URL}" =~ ^https?:// ]]; then
        echo -e "${RED}[ERROR] Base URL must start with http:// or https://${NC}"
        exit 1
    fi
    
    echo -e "${GREEN}[OK] Base URL: ${BASE_URL}${NC}"
}

# ═══════════════════════════════════════════════════════════════════════════
# STEP A: DEPLOY
# ═══════════════════════════════════════════════════════════════════════════

step_a_deploy() {
    echo ""
    echo -e "${CYAN}═══════════════════════════════════════════════════════════════════════════${NC}"
    echo -e "${CYAN} STEP A: DEPLOY${NC}"
    echo -e "${CYAN}═══════════════════════════════════════════════════════════════════════════${NC}"
    
    echo -e "${YELLOW}[DEPLOY] Starting TerraFusion stack...${NC}"
    
    # Pull latest images
    docker-compose -f "${COMPOSE_FILE}" pull
    
    # Start services
    docker-compose -f "${COMPOSE_FILE}" up -d
    
    # Wait for services to be healthy
    echo -e "${YELLOW}[DEPLOY] Waiting for services to become healthy (max 120s)...${NC}"
    
    local max_wait=120
    local waited=0
    local interval=5
    
    while [[ $waited -lt $max_wait ]]; do
        # Check if API is responding
        if curl -sf "${BASE_URL}/health/ready" > /dev/null 2>&1; then
            echo -e "${GREEN}[DEPLOY] Services are healthy!${NC}"
            return 0
        fi
        
        echo -e "${YELLOW}[DEPLOY] Waiting... (${waited}s/${max_wait}s)${NC}"
        sleep $interval
        waited=$((waited + interval))
    done
    
    echo -e "${RED}[DEPLOY] Services did not become healthy within ${max_wait}s${NC}"
    echo -e "${YELLOW}[DEPLOY] Checking container status...${NC}"
    docker-compose -f "${COMPOSE_FILE}" ps
    exit 1
}

# ═══════════════════════════════════════════════════════════════════════════
# STEP B: CERTIFY (STRICT)
# ═══════════════════════════════════════════════════════════════════════════

step_b_certify() {
    echo ""
    echo -e "${CYAN}═══════════════════════════════════════════════════════════════════════════${NC}"
    echo -e "${CYAN} STEP B: CERTIFY (STRICT MODE)${NC}"
    echo -e "${CYAN}═══════════════════════════════════════════════════════════════════════════${NC}"
    
    # Create cert directory
    mkdir -p "${CERT_DIR}"
    
    echo -e "${YELLOW}[CERT] Running RuntimeCert...${NC}"
    echo -e "${YELLOW}[CERT] County: ${COUNTY}${NC}"
    echo -e "${YELLOW}[CERT] Base URL: ${BASE_URL}${NC}"
    echo -e "${YELLOW}[CERT] Mode: --strict${NC}"
    
    # Run certification
    local cert_exit_code=0
    $PYTHON_CMD tools/runtime-cert/tf-runtime.py cert "${COUNTY}" \
        --strict \
        --base-url "${BASE_URL}" \
        --output-dir "${CERT_DIR}" || cert_exit_code=$?
    
    # Check result
    if [[ $cert_exit_code -eq 0 ]]; then
        echo -e "${GREEN}[CERT] ✅ CERTIFICATION PASSED${NC}"
    elif [[ $cert_exit_code -eq 1 ]]; then
        echo -e "${RED}[CERT] ❌ CERTIFICATION FAILED${NC}"
        echo -e "${RED}[CERT] Review: ${CERT_DIR}/cert.report.md${NC}"
        echo ""
        echo -e "${RED}═══════════════════════════════════════════════════════════════════════════${NC}"
        echo -e "${RED} GO-LIVE BLOCKED - DO NOT OPEN TRAFFIC${NC}"
        echo -e "${RED}═══════════════════════════════════════════════════════════════════════════${NC}"
        exit 1
    else
        echo -e "${RED}[CERT] ⚠️ CERTIFICATION ERROR (exit code: ${cert_exit_code})${NC}"
        exit 1
    fi
}

# ═══════════════════════════════════════════════════════════════════════════
# STEP C: ARCHIVE PROOF
# ═══════════════════════════════════════════════════════════════════════════

step_c_archive() {
    echo ""
    echo -e "${CYAN}═══════════════════════════════════════════════════════════════════════════${NC}"
    echo -e "${CYAN} STEP C: ARCHIVE PROOF${NC}"
    echo -e "${CYAN}═══════════════════════════════════════════════════════════════════════════${NC}"
    
    # List generated artifacts
    echo -e "${YELLOW}[ARCHIVE] Certification artifacts:${NC}"
    ls -la "${CERT_DIR}/" 2>/dev/null || echo "(no files)"
    
    # Create archive bundle
    local archive_name="terrafusion-cert-${COUNTY}-${TIMESTAMP}.tar.gz"
    tar -czf "${archive_name}" -C "artifacts/cert" "${TIMESTAMP}"
    
    echo -e "${GREEN}[ARCHIVE] Created: ${archive_name}${NC}"
    echo -e "${GREEN}[ARCHIVE] SHA256: $(sha256sum "${archive_name}" | cut -d' ' -f1)${NC}"
    
    # Show cert report summary
    if [[ -f "${CERT_DIR}/cert.report.md" ]]; then
        echo ""
        echo -e "${YELLOW}[ARCHIVE] Certification Report Summary:${NC}"
        head -30 "${CERT_DIR}/cert.report.md"
    fi
}

# ═══════════════════════════════════════════════════════════════════════════
# STEP D: OPEN TRAFFIC
# ═══════════════════════════════════════════════════════════════════════════

step_d_open_traffic() {
    echo ""
    echo -e "${CYAN}═══════════════════════════════════════════════════════════════════════════${NC}"
    echo -e "${CYAN} STEP D: OPEN TRAFFIC${NC}"
    echo -e "${CYAN}═══════════════════════════════════════════════════════════════════════════${NC}"
    
    echo -e "${GREEN}"
    echo "═══════════════════════════════════════════════════════════════════════════"
    echo " ✅ BENTON COUNTY GO-LIVE COMPLETE"
    echo "═══════════════════════════════════════════════════════════════════════════"
    echo ""
    echo " Deployment URL: ${BASE_URL}"
    echo " Certification:  ${CERT_DIR}/cert.report.md"
    echo " Archive:        terrafusion-cert-${COUNTY}-${TIMESTAMP}.tar.gz"
    echo ""
    echo " NEXT STEPS (Manual):"
    echo " 1. Enable ingress / reverse proxy route"
    echo " 2. Update DNS / alias"
    echo " 3. Notify stakeholders"
    echo ""
    echo " COUNTY IT HANDOFF:"
    echo " - Health check: ${BASE_URL}/health/ready"
    echo " - PACS proof:   ${BASE_URL}/ops/pacs/proof"
    echo " - SpecLock:     ${BASE_URL}/ops/speclock/proof"
    echo "═══════════════════════════════════════════════════════════════════════════"
    echo -e "${NC}"
}

# ═══════════════════════════════════════════════════════════════════════════
# MAIN
# ═══════════════════════════════════════════════════════════════════════════

main() {
    print_header
    validate_base_url
    check_prerequisites
    
    # Execute go-live sequence
    step_a_deploy
    step_b_certify
    step_c_archive
    step_d_open_traffic
}

main "$@"

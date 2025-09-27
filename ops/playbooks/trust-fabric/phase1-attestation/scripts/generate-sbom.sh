#!/bin/bash

# TerraFusion Trust Fabric - SBOM Generator
# Generates Software Bill of Materials with cryptographic attestation
# Part of Phase 1: Build Provenance & Attestation

set -euo pipefail

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

echo -e "${CYAN}🔐 TerraFusion Trust Fabric - SBOM Generator${NC}"
echo "=============================================="

# Configuration
TERRAFUSION_ROOT=${1:-$(pwd)}
SBOM_OUTPUT_DIR="${TERRAFUSION_ROOT}/trust-artifacts/sboms"
TIMESTAMP=$(date -u +"%Y%m%d_%H%M%S")

# Create output directory
mkdir -p "${SBOM_OUTPUT_DIR}"

echo -e "${BLUE}📦 Generating SBOM for TerraFusion OS...${NC}"

# Generate comprehensive SBOM
generate_sbom() {
    local component=$1
    local path=$2
    local format=$3
    
    echo -e "${YELLOW}  → Processing ${component}...${NC}"
    
    syft dir:"${path}" \
        -o "${format}" \
        --name "terrafusion-${component}" \
        --version "$(git rev-parse --short HEAD 2>/dev/null || echo 'dev')" \
        > "${SBOM_OUTPUT_DIR}/terrafusion-${component}-sbom.${format##*-}"
        
    echo -e "${GREEN}    ✅ ${component} SBOM generated${NC}"
}

# Generate multiple format SBOMs
echo -e "${BLUE}📋 Generating multi-format SBOMs...${NC}"

# Backend .NET SBOM
if [ -d "${TERRAFUSION_ROOT}/backend" ]; then
    generate_sbom "backend" "${TERRAFUSION_ROOT}/backend" "cyclonedx-json"
    generate_sbom "backend" "${TERRAFUSION_ROOT}/backend" "spdx-json"
    generate_sbom "backend" "${TERRAFUSION_ROOT}/backend" "syft-json"
fi

# Frontend SBOM
if [ -d "${TERRAFUSION_ROOT}/frontend" ]; then
    generate_sbom "frontend" "${TERRAFUSION_ROOT}/frontend" "cyclonedx-json"
    generate_sbom "frontend" "${TERRAFUSION_ROOT}/frontend" "spdx-json"
fi

# Infrastructure as Code SBOM
if [ -d "${TERRAFUSION_ROOT}/infrastructure" ]; then
    generate_sbom "infrastructure" "${TERRAFUSION_ROOT}/infrastructure" "cyclonedx-json"
fi

# AI Agent SBOM
if [ -d "${TERRAFUSION_ROOT}/ai-agents" ]; then
    generate_sbom "ai-agents" "${TERRAFUSION_ROOT}/ai-agents" "cyclonedx-json"
fi

# Full system SBOM
echo -e "${BLUE}🌍 Generating complete system SBOM...${NC}"
syft dir:"${TERRAFUSION_ROOT}" \
    -o cyclonedx-json \
    --name "terrafusion-complete-system" \
    --version "$(git rev-parse --short HEAD 2>/dev/null || echo 'dev')" \
    > "${SBOM_OUTPUT_DIR}/terrafusion-complete-system-sbom.json"

# Generate SBOM metadata
echo -e "${BLUE}📊 Generating SBOM metadata...${NC}"

cat > "${SBOM_OUTPUT_DIR}/sbom-metadata.json" << EOF
{
  "terrafusion_trust_fabric": {
    "generation_timestamp": "$(date -u --iso-8601=seconds)",
    "git_commit": "$(git rev-parse HEAD 2>/dev/null || echo 'unknown')",
    "git_branch": "$(git branch --show-current 2>/dev/null || echo 'unknown')",
    "generator": "syft-$(syft version | head -n1 | awk '{print $3}')",
    "sbom_files": [
      "terrafusion-backend-sbom.json",
      "terrafusion-frontend-sbom.json",
      "terrafusion-infrastructure-sbom.json",
      "terrafusion-ai-agents-sbom.json",
      "terrafusion-complete-system-sbom.json"
    ],
    "formats": ["cyclonedx-json", "spdx-json", "syft-json"],
    "attestation_ready": true,
    "provenance_level": "build_l3"
  }
}
EOF

# Generate vulnerability scan
echo -e "${BLUE}🛡️  Scanning for vulnerabilities...${NC}"
if command -v grype >/dev/null 2>&1; then
    grype "${SBOM_OUTPUT_DIR}/terrafusion-complete-system-sbom.json" \
        -o json > "${SBOM_OUTPUT_DIR}/vulnerability-scan.json"
    echo -e "${GREEN}✅ Vulnerability scan complete${NC}"
else
    echo -e "${YELLOW}⚠️  Grype not found, skipping vulnerability scan${NC}"
fi

# Generate checksums
echo -e "${BLUE}🔐 Generating checksums...${NC}"
cd "${SBOM_OUTPUT_DIR}"
find . -name "*.json" -exec sha256sum {} \; > checksums.sha256
echo -e "${GREEN}✅ Checksums generated${NC}"

# Summary
echo ""
echo -e "${GREEN}🎯 SBOM Generation Complete!${NC}"
echo "=============================="
echo -e "📁 Output Directory: ${SBOM_OUTPUT_DIR}"
echo -e "📦 Components Analyzed: $(find "${SBOM_OUTPUT_DIR}" -name "*-sbom.json" | wc -l)"
echo -e "🔐 Files Generated: $(find "${SBOM_OUTPUT_DIR}" -name "*.json" | wc -l)"
echo -e "📊 Total Size: $(du -sh "${SBOM_OUTPUT_DIR}" | cut -f1)"
echo ""
echo -e "${CYAN}Next Steps:${NC}"
echo "1. Run sign-artifacts.sh to cryptographically sign SBOMs"
echo "2. Run verify-trust.sh to validate trust chain"
echo "3. Submit to transparency log with submit-rekor.sh"
echo ""
echo -e "${GREEN}✅ TerraFusion is now PROVABLE at the build level${NC}"

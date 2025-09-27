#!/bin/bash

# TerraFusion Trust Fabric - Artifact Signer
# Cryptographically signs all TerraFusion components using Sigstore
# Part of Phase 1: Build Provenance & Attestation

set -euo pipefail

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

echo -e "${CYAN}🔐 TerraFusion Trust Fabric - Artifact Signer${NC}"
echo "=============================================="

# Configuration
TERRAFUSION_ROOT=${1:-$(pwd)}
TRUST_ARTIFACTS_DIR="${TERRAFUSION_ROOT}/trust-artifacts"
SIGNATURES_DIR="${TRUST_ARTIFACTS_DIR}/signatures"
SBOM_DIR="${TRUST_ARTIFACTS_DIR}/sboms"
TIMESTAMP=$(date -u +"%Y%m%d_%H%M%S")

# Create directories
mkdir -p "${SIGNATURES_DIR}" "${TRUST_ARTIFACTS_DIR}/certificates"

# Check dependencies
check_dependencies() {
    echo -e "${BLUE}🔍 Checking dependencies...${NC}"
    
    local deps=("cosign" "syft" "git")
    for dep in "${deps[@]}"; do
        if ! command -v "$dep" >/dev/null 2>&1; then
            echo -e "${RED}❌ Missing dependency: $dep${NC}"
            exit 1
        fi
        echo -e "${GREEN}  ✅ $dep${NC}"
    done
}

# Sign individual file
sign_file() {
    local file=$1
    local description=$2
    
    if [ ! -f "$file" ]; then
        echo -e "${YELLOW}⚠️  File not found: $file${NC}"
        return 0
    fi
    
    echo -e "${YELLOW}  🔏 Signing ${description}...${NC}"
    
    local base_name=$(basename "$file")
    local sig_file="${SIGNATURES_DIR}/${base_name}.sig"
    local cert_file="${TRUST_ARTIFACTS_DIR}/certificates/${base_name}.crt"
    
    # Sign with cosign (keyless signing)
    COSIGN_EXPERIMENTAL=1 cosign sign-blob \
        --yes \
        --output-signature "$sig_file" \
        --output-certificate "$cert_file" \
        "$file"
    
    echo -e "${GREEN}    ✅ Signed: $(basename "$file")${NC}"
    echo -e "      📝 Signature: $sig_file"
    echo -e "      🎫 Certificate: $cert_file"
}

# Sign SBOM with attestation
attest_sbom() {
    local sbom_file=$1
    local target_artifact=$2
    local description=$3
    
    if [ ! -f "$sbom_file" ] || [ ! -f "$target_artifact" ]; then
        echo -e "${YELLOW}⚠️  Missing files for attestation: $description${NC}"
        return 0
    fi
    
    echo -e "${YELLOW}  📋 Attesting SBOM for ${description}...${NC}"
    
    local attestation_file="${SIGNATURES_DIR}/$(basename "$target_artifact").sbom.attestation"
    
    COSIGN_EXPERIMENTAL=1 cosign attest-blob \
        --yes \
        --predicate "$sbom_file" \
        --type cyclonedx \
        --output-file "$attestation_file" \
        "$target_artifact"
    
    echo -e "${GREEN}    ✅ SBOM attested for: $(basename "$target_artifact")${NC}"
}

# Main signing process
main() {
    check_dependencies
    
    echo -e "${BLUE}📦 Starting TerraFusion artifact signing...${NC}"
    
    # Sign backend artifacts
    if [ -d "${TERRAFUSION_ROOT}/backend" ]; then
        echo -e "${BLUE}🔧 Signing Backend Artifacts...${NC}"
        
        # Find and sign .NET assemblies
        find "${TERRAFUSION_ROOT}/backend" -name "*.dll" -o -name "*.exe" | while read -r file; do
            sign_file "$file" "Backend Assembly: $(basename "$file")"
        done
        
        # Sign published outputs
        if [ -d "${TERRAFUSION_ROOT}/backend/bin/Release" ]; then
            find "${TERRAFUSION_ROOT}/backend/bin/Release" -name "TerraFusion*.dll" | while read -r file; do
                sign_file "$file" "Published Backend: $(basename "$file")"
                
                # Attest SBOM if exists
                local sbom_file="${SBOM_DIR}/terrafusion-backend-sbom.json"
                if [ -f "$sbom_file" ]; then
                    attest_sbom "$sbom_file" "$file" "Backend Assembly"
                fi
            done
        fi
    fi
    
    # Sign frontend artifacts
    if [ -d "${TERRAFUSION_ROOT}/frontend/dist" ]; then
        echo -e "${BLUE}🌐 Signing Frontend Artifacts...${NC}"
        
        # Create tarball of frontend dist
        local frontend_tarball="${TRUST_ARTIFACTS_DIR}/terrafusion-frontend.tar.gz"
        tar -czf "$frontend_tarball" -C "${TERRAFUSION_ROOT}/frontend" dist/
        
        sign_file "$frontend_tarball" "Frontend Distribution"
        
        # Attest SBOM
        local frontend_sbom="${SBOM_DIR}/terrafusion-frontend-sbom.json"
        if [ -f "$frontend_sbom" ]; then
            attest_sbom "$frontend_sbom" "$frontend_tarball" "Frontend Distribution"
        fi
    fi
    
    # Sign infrastructure code
    if [ -d "${TERRAFUSION_ROOT}/infrastructure" ]; then
        echo -e "${BLUE}🏗️  Signing Infrastructure Code...${NC}"
        
        local infra_tarball="${TRUST_ARTIFACTS_DIR}/terrafusion-infrastructure.tar.gz"
        tar -czf "$infra_tarball" -C "${TERRAFUSION_ROOT}" infrastructure/
        
        sign_file "$infra_tarball" "Infrastructure as Code"
    fi
    
    # Sign AI agent configurations
    if [ -d "${TERRAFUSION_ROOT}/ai-agents" ]; then
        echo -e "${BLUE}🤖 Signing AI Agent Configurations...${NC}"
        
        local agents_tarball="${TRUST_ARTIFACTS_DIR}/terrafusion-ai-agents.tar.gz"
        tar -czf "$agents_tarball" -C "${TERRAFUSION_ROOT}" ai-agents/
        
        sign_file "$agents_tarball" "AI Agent Configurations"
    fi
    
    # Sign SBOMs themselves
    echo -e "${BLUE}📋 Signing SBOM Files...${NC}"
    find "${SBOM_DIR}" -name "*.json" | while read -r sbom; do
        sign_file "$sbom" "SBOM: $(basename "$sbom")"
    done
    
    # Sign deployment scripts
    echo -e "${BLUE}🚀 Signing Deployment Scripts...${NC}"
    find "${TERRAFUSION_ROOT}" -name "*.sh" -o -name "*.ps1" -o -name "*.bat" | head -20 | while read -r script; do
        sign_file "$script" "Deployment Script: $(basename "$script")"
    done
    
    # Create signature manifest
    echo -e "${BLUE}📊 Creating signature manifest...${NC}"
    
    cat > "${SIGNATURES_DIR}/signature-manifest.json" << EOF
{
  "terrafusion_trust_fabric": {
    "signing_session": {
      "timestamp": "$(date -u --iso-8601=seconds)",
      "git_commit": "$(git rev-parse HEAD 2>/dev/null || echo 'unknown')",
      "signer": "TerraFusion Trust Fabric Automated Signer",
      "cosign_version": "$(cosign version --json 2>/dev/null | jq -r .gitVersion || echo 'unknown')"
    },
    "signed_artifacts": {
      "signatures": $(find "${SIGNATURES_DIR}" -name "*.sig" | wc -l),
      "certificates": $(find "${TRUST_ARTIFACTS_DIR}/certificates" -name "*.crt" | wc -l),
      "attestations": $(find "${SIGNATURES_DIR}" -name "*.attestation" | wc -l)
    },
    "verification": {
      "status": "ready",
      "transparency_log": "rekor.sigstore.dev",
      "verification_script": "verify-trust.sh"
    }
  }
}
EOF
    
    # Generate checksums for all signatures
    echo -e "${BLUE}🔐 Generating signature checksums...${NC}"
    cd "${SIGNATURES_DIR}"
    find . -type f \( -name "*.sig" -o -name "*.crt" -o -name "*.attestation" \) -exec sha256sum {} \; > signature-checksums.sha256
    
    # Summary
    echo ""
    echo -e "${GREEN}🎯 Signing Complete!${NC}"
    echo "==================="
    echo -e "📁 Signatures Directory: ${SIGNATURES_DIR}"
    echo -e "🔏 Signatures Created: $(find "${SIGNATURES_DIR}" -name "*.sig" | wc -l)"
    echo -e "🎫 Certificates Generated: $(find "${TRUST_ARTIFACTS_DIR}/certificates" -name "*.crt" | wc -l)"
    echo -e "📋 Attestations Created: $(find "${SIGNATURES_DIR}" -name "*.attestation" | wc -l)"
    echo -e "📊 Total Trust Artifacts: $(find "${TRUST_ARTIFACTS_DIR}" -type f | wc -l)"
    echo ""
    echo -e "${CYAN}Next Steps:${NC}"
    echo "1. Run verify-trust.sh to validate all signatures"
    echo "2. Run submit-rekor.sh to submit to transparency log"
    echo "3. Deploy with cryptographic verification enabled"
    echo ""
    echo -e "${GREEN}✅ TerraFusion is now CRYPTOGRAPHICALLY SIGNED${NC}"
}

main "$@"

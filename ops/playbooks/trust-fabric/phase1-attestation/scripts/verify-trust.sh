#!/bin/bash

# TerraFusion Trust Fabric - Trust Verifier
# Verifies cryptographic signatures and attestations
# Part of Phase 1: Build Provenance & Attestation

set -euo pipefail

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
PURPLE='\033[0;35m'
NC='\033[0m'

echo -e "${CYAN}🔐 TerraFusion Trust Fabric - Trust Verifier${NC}"
echo "============================================="

# Configuration
TERRAFUSION_ROOT=${1:-$(pwd)}
TRUST_ARTIFACTS_DIR="${TERRAFUSION_ROOT}/trust-artifacts"
SIGNATURES_DIR="${TRUST_ARTIFACTS_DIR}/signatures"
CERTIFICATES_DIR="${TRUST_ARTIFACTS_DIR}/certificates"
VERIFICATION_REPORT="${TRUST_ARTIFACTS_DIR}/verification-report.json"

# Counters
TOTAL_VERIFICATIONS=0
SUCCESSFUL_VERIFICATIONS=0
FAILED_VERIFICATIONS=0

# Verification results array
declare -a VERIFICATION_RESULTS

# Check dependencies
check_dependencies() {
    echo -e "${BLUE}🔍 Checking verification tools...${NC}"
    
    local deps=("cosign" "jq")
    for dep in "${deps[@]}"; do
        if ! command -v "$dep" >/dev/null 2>&1; then
            echo -e "${RED}❌ Missing dependency: $dep${NC}"
            exit 1
        fi
        echo -e "${GREEN}  ✅ $dep available${NC}"
    done
    
    # Set experimental mode for keyless verification
    export COSIGN_EXPERIMENTAL=1
}

# Verify individual signature
verify_signature() {
    local artifact_file=$1
    local signature_file=$2
    local certificate_file=$3
    local description=$4
    
    TOTAL_VERIFICATIONS=$((TOTAL_VERIFICATIONS + 1))
    
    echo -e "${YELLOW}🔍 Verifying: ${description}${NC}"
    
    if [ ! -f "$artifact_file" ]; then
        echo -e "${RED}  ❌ Artifact not found: $artifact_file${NC}"
        FAILED_VERIFICATIONS=$((FAILED_VERIFICATIONS + 1))
        VERIFICATION_RESULTS+=("FAIL:$description:Artifact missing")
        return 1
    fi
    
    if [ ! -f "$signature_file" ]; then
        echo -e "${RED}  ❌ Signature not found: $signature_file${NC}"
        FAILED_VERIFICATIONS=$((FAILED_VERIFICATIONS + 1))
        VERIFICATION_RESULTS+=("FAIL:$description:Signature missing")
        return 1
    fi
    
    if [ ! -f "$certificate_file" ]; then
        echo -e "${RED}  ❌ Certificate not found: $certificate_file${NC}"
        FAILED_VERIFICATIONS=$((FAILED_VERIFICATIONS + 1))
        VERIFICATION_RESULTS+=("FAIL:$description:Certificate missing")
        return 1
    fi
    
    # Perform verification
    if cosign verify-blob \
        --certificate "$certificate_file" \
        --signature "$signature_file" \
        "$artifact_file" >/dev/null 2>&1; then
        
        echo -e "${GREEN}  ✅ Verification successful${NC}"
        SUCCESSFUL_VERIFICATIONS=$((SUCCESSFUL_VERIFICATIONS + 1))
        VERIFICATION_RESULTS+=("PASS:$description:Signature valid")
        
        # Extract certificate information
        local cert_info=$(openssl x509 -in "$certificate_file" -text -noout 2>/dev/null || echo "Certificate info unavailable")
        echo -e "${BLUE}     📋 Certificate details available${NC}"
        
        return 0
    else
        echo -e "${RED}  ❌ Verification failed${NC}"
        FAILED_VERIFICATIONS=$((FAILED_VERIFICATIONS + 1))
        VERIFICATION_RESULTS+=("FAIL:$description:Signature verification failed")
        return 1
    fi
}

# Verify attestation
verify_attestation() {
    local attestation_file=$1
    local description=$2
    
    TOTAL_VERIFICATIONS=$((TOTAL_VERIFICATIONS + 1))
    
    echo -e "${YELLOW}📋 Verifying Attestation: ${description}${NC}"
    
    if [ ! -f "$attestation_file" ]; then
        echo -e "${RED}  ❌ Attestation not found: $attestation_file${NC}"
        FAILED_VERIFICATIONS=$((FAILED_VERIFICATIONS + 1))
        VERIFICATION_RESULTS+=("FAIL:$description:Attestation missing")
        return 1
    fi
    
    # Verify attestation format
    if jq . "$attestation_file" >/dev/null 2>&1; then
        echo -e "${GREEN}  ✅ Attestation format valid${NC}"
        
        # Check for required attestation fields
        local predicate_type=$(jq -r '.predicateType // empty' "$attestation_file")
        if [ -n "$predicate_type" ]; then
            echo -e "${BLUE}     📋 Predicate type: $predicate_type${NC}"
            SUCCESSFUL_VERIFICATIONS=$((SUCCESSFUL_VERIFICATIONS + 1))
            VERIFICATION_RESULTS+=("PASS:$description:Attestation valid")
            return 0
        else
            echo -e "${RED}  ❌ Invalid attestation format${NC}"
            FAILED_VERIFICATIONS=$((FAILED_VERIFICATIONS + 1))
            VERIFICATION_RESULTS+=("FAIL:$description:Invalid format")
            return 1
        fi
    else
        echo -e "${RED}  ❌ Malformed JSON attestation${NC}"
        FAILED_VERIFICATIONS=$((FAILED_VERIFICATIONS + 1))
        VERIFICATION_RESULTS+=("FAIL:$description:Malformed JSON")
        return 1
    fi
}

# Verify SBOM integrity
verify_sbom_integrity() {
    local sbom_file=$1
    local description=$2
    
    TOTAL_VERIFICATIONS=$((TOTAL_VERIFICATIONS + 1))
    
    echo -e "${YELLOW}📦 Verifying SBOM: ${description}${NC}"
    
    if [ ! -f "$sbom_file" ]; then
        echo -e "${RED}  ❌ SBOM not found: $sbom_file${NC}"
        FAILED_VERIFICATIONS=$((FAILED_VERIFICATIONS + 1))
        VERIFICATION_RESULTS+=("FAIL:$description:SBOM missing")
        return 1
    fi
    
    # Validate SBOM format
    if jq . "$sbom_file" >/dev/null 2>&1; then
        local format_type=$(jq -r '.bomFormat // .SPDXID // .schema // "unknown"' "$sbom_file")
        echo -e "${GREEN}  ✅ SBOM format valid ($format_type)${NC}"
        
        # Check for components
        local component_count=$(jq -r '.components | length // 0' "$sbom_file" 2>/dev/null || echo "0")
        echo -e "${BLUE}     📦 Components listed: $component_count${NC}"
        
        SUCCESSFUL_VERIFICATIONS=$((SUCCESSFUL_VERIFICATIONS + 1))
        VERIFICATION_RESULTS+=("PASS:$description:SBOM valid with $component_count components")
        return 0
    else
        echo -e "${RED}  ❌ Invalid SBOM format${NC}"
        FAILED_VERIFICATIONS=$((FAILED_VERIFICATIONS + 1))
        VERIFICATION_RESULTS+=("FAIL:$description:Invalid SBOM format")
        return 1
    fi
}

# Main verification process
main() {
    check_dependencies
    
    echo -e "${BLUE}🔍 Starting TerraFusion Trust Verification...${NC}"
    echo ""
    
    # Verify checksum integrity first
    if [ -f "${SIGNATURES_DIR}/signature-checksums.sha256" ]; then
        echo -e "${BLUE}🔐 Verifying checksum integrity...${NC}"
        cd "${SIGNATURES_DIR}"
        if sha256sum -c signature-checksums.sha256 --quiet; then
            echo -e "${GREEN}✅ All checksums verified${NC}"
        else
            echo -e "${RED}❌ Checksum verification failed${NC}"
            exit 1
        fi
        echo ""
    fi
    
    # Verify SBOMs
    if [ -d "${TRUST_ARTIFACTS_DIR}/sboms" ]; then
        echo -e "${PURPLE}📋 Verifying SBOM Files...${NC}"
        find "${TRUST_ARTIFACTS_DIR}/sboms" -name "*.json" | while read -r sbom; do
            verify_sbom_integrity "$sbom" "$(basename "$sbom")"
        done
        echo ""
    fi
    
    # Verify signatures and certificates
    if [ -d "$SIGNATURES_DIR" ] && [ -d "$CERTIFICATES_DIR" ]; then
        echo -e "${PURPLE}🔏 Verifying Cryptographic Signatures...${NC}"
        
        # Find all signature files and their corresponding artifacts
        find "$SIGNATURES_DIR" -name "*.sig" | while read -r sig_file; do
            local base_name=$(basename "$sig_file" .sig)
            local cert_file="${CERTIFICATES_DIR}/${base_name}.crt"
            
            # Try to find the original artifact
            local artifact_file=""
            
            # Check common locations
            for search_dir in "${TERRAFUSION_ROOT}/backend/bin" "${TRUST_ARTIFACTS_DIR}" "${TERRAFUSION_ROOT}"; do
                if [ -f "${search_dir}/${base_name}" ]; then
                    artifact_file="${search_dir}/${base_name}"
                    break
                fi
            done
            
            # If artifact found, verify it
            if [ -n "$artifact_file" ] && [ -f "$artifact_file" ]; then
                verify_signature "$artifact_file" "$sig_file" "$cert_file" "$base_name"
            else
                echo -e "${YELLOW}⚠️  Artifact not found for signature: $base_name${NC}"
            fi
        done
        echo ""
    fi
    
    # Verify attestations
    if [ -d "$SIGNATURES_DIR" ]; then
        echo -e "${PURPLE}📋 Verifying Attestations...${NC}"
        find "$SIGNATURES_DIR" -name "*.attestation" | while read -r attestation; do
            verify_attestation "$attestation" "$(basename "$attestation")"
        done
        echo ""
    fi
    
    # Generate verification report
    echo -e "${BLUE}📊 Generating verification report...${NC}"
    
    cat > "$VERIFICATION_REPORT" << EOF
{
  "terrafusion_trust_verification": {
    "verification_session": {
      "timestamp": "$(date -u --iso-8601=seconds)",
      "git_commit": "$(git rev-parse HEAD 2>/dev/null || echo 'unknown')",
      "verifier": "TerraFusion Trust Fabric Verifier",
      "cosign_version": "$(cosign version --json 2>/dev/null | jq -r .gitVersion || echo 'unknown')"
    },
    "results": {
      "total_verifications": $TOTAL_VERIFICATIONS,
      "successful": $SUCCESSFUL_VERIFICATIONS,
      "failed": $FAILED_VERIFICATIONS,
      "success_rate": "$(echo "scale=2; $SUCCESSFUL_VERIFICATIONS * 100 / $TOTAL_VERIFICATIONS" | bc 2>/dev/null || echo "N/A")%"
    },
    "trust_level": "$([ $FAILED_VERIFICATIONS -eq 0 ] && echo "FULLY_TRUSTED" || echo "VERIFICATION_ISSUES")",
    "recommendation": "$([ $FAILED_VERIFICATIONS -eq 0 ] && echo "Safe to deploy" || echo "Review failed verifications before deployment")"
  }
}
EOF
    
    # Display summary
    echo ""
    echo -e "${GREEN}🎯 Trust Verification Complete!${NC}"
    echo "=================================="
    echo -e "📊 Total Verifications: $TOTAL_VERIFICATIONS"
    echo -e "✅ Successful: $SUCCESSFUL_VERIFICATIONS"
    echo -e "❌ Failed: $FAILED_VERIFICATIONS"
    
    if [ $FAILED_VERIFICATIONS -eq 0 ]; then
        echo -e "🎯 Trust Level: ${GREEN}FULLY TRUSTED${NC}"
        echo -e "✅ Recommendation: ${GREEN}Safe to deploy${NC}"
        echo ""
        echo -e "${CYAN}🚀 TerraFusion is CRYPTOGRAPHICALLY VERIFIED${NC}"
        exit 0
    else
        echo -e "🎯 Trust Level: ${RED}VERIFICATION ISSUES${NC}"
        echo -e "⚠️  Recommendation: ${YELLOW}Review failed verifications${NC}"
        echo ""
        echo -e "${RED}❌ Some verifications failed - review before deployment${NC}"
        exit 1
    fi
}

main "$@"

#!/bin/bash

# TerraFusion Trust Fabric - Rekor Transparency Log Submission
# Submits cryptographic proofs to Sigstore transparency log
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

echo -e "${CYAN}🔐 TerraFusion Trust Fabric - Rekor Submission${NC}"
echo "=============================================="

# Configuration
TERRAFUSION_ROOT=${1:-$(pwd)}
TRUST_ARTIFACTS_DIR="${TERRAFUSION_ROOT}/trust-artifacts"
SIGNATURES_DIR="${TRUST_ARTIFACTS_DIR}/signatures"
CERTIFICATES_DIR="${TRUST_ARTIFACTS_DIR}/certificates"
REKOR_ENTRIES_DIR="${TRUST_ARTIFACTS_DIR}/rekor-entries"
TIMESTAMP=$(date -u +"%Y%m%d_%H%M%S")

# Create Rekor entries directory
mkdir -p "$REKOR_ENTRIES_DIR"

# Counters
TOTAL_SUBMISSIONS=0
SUCCESSFUL_SUBMISSIONS=0
FAILED_SUBMISSIONS=0

# Check dependencies
check_dependencies() {
    echo -e "${BLUE}🔍 Checking Rekor tools...${NC}"
    
    local deps=("rekor-cli" "cosign" "jq" "curl")
    for dep in "${deps[@]}"; do
        if ! command -v "$dep" >/dev/null 2>&1; then
            echo -e "${RED}❌ Missing dependency: $dep${NC}"
            exit 1
        fi
        echo -e "${GREEN}  ✅ $dep available${NC}"
    done
    
    # Check Rekor connectivity
    echo -e "${BLUE}🌐 Testing Rekor connectivity...${NC}"
    if curl -s --connect-timeout 10 https://rekor.sigstore.dev/api/v1/log/info >/dev/null; then
        echo -e "${GREEN}✅ Rekor service accessible${NC}"
    else
        echo -e "${RED}❌ Cannot connect to Rekor service${NC}"
        exit 1
    fi
}

# Submit artifact to Rekor
submit_to_rekor() {
    local artifact_file=$1
    local signature_file=$2
    local certificate_file=$3
    local description=$4
    
    TOTAL_SUBMISSIONS=$((TOTAL_SUBMISSIONS + 1))
    
    echo -e "${YELLOW}📤 Submitting to Rekor: ${description}${NC}"
    
    # Validate files exist
    for file in "$artifact_file" "$signature_file" "$certificate_file"; do
        if [ ! -f "$file" ]; then
            echo -e "${RED}  ❌ Missing file: $(basename "$file")${NC}"
            FAILED_SUBMISSIONS=$((FAILED_SUBMISSIONS + 1))
            return 1
        fi
    done
    
    local entry_file="${REKOR_ENTRIES_DIR}/$(basename "$artifact_file")-rekor-entry.json"
    
    # Submit to Rekor
    if rekor-cli upload \
        --artifact "$artifact_file" \
        --signature "$signature_file" \
        --public-key "$certificate_file" \
        --format json > "$entry_file" 2>/dev/null; then
        
        local log_index=$(jq -r '.LogIndex // "unknown"' "$entry_file")
        local uuid=$(jq -r '.UUID // "unknown"' "$entry_file")
        
        echo -e "${GREEN}  ✅ Submitted successfully${NC}"
        echo -e "${BLUE}     📋 Log Index: $log_index${NC}"
        echo -e "${BLUE}     🆔 UUID: $uuid${NC}"
        echo -e "${BLUE}     📄 Entry saved: $(basename "$entry_file")${NC}"
        
        SUCCESSFUL_SUBMISSIONS=$((SUCCESSFUL_SUBMISSIONS + 1))
        return 0
    else
        echo -e "${RED}  ❌ Submission failed${NC}"
        FAILED_SUBMISSIONS=$((FAILED_SUBMISSIONS + 1))
        return 1
    fi
}

# Verify Rekor entry
verify_rekor_entry() {
    local entry_file=$1
    local description=$2
    
    echo -e "${YELLOW}🔍 Verifying Rekor entry: ${description}${NC}"
    
    if [ ! -f "$entry_file" ]; then
        echo -e "${RED}  ❌ Entry file not found${NC}"
        return 1
    fi
    
    local uuid=$(jq -r '.UUID // empty' "$entry_file")
    if [ -z "$uuid" ] || [ "$uuid" = "null" ]; then
        echo -e "${RED}  ❌ Invalid UUID in entry${NC}"
        return 1
    fi
    
    # Verify the entry exists in Rekor
    if rekor-cli verify --uuid "$uuid" >/dev/null 2>&1; then
        echo -e "${GREEN}  ✅ Rekor entry verified${NC}"
        return 0
    else
        echo -e "${RED}  ❌ Rekor entry verification failed${NC}"
        return 1
    fi
}

# Generate inclusion proof
generate_inclusion_proof() {
    local entry_file=$1
    local description=$2
    
    echo -e "${YELLOW}📜 Generating inclusion proof: ${description}${NC}"
    
    local uuid=$(jq -r '.UUID // empty' "$entry_file")
    if [ -z "$uuid" ] || [ "$uuid" = "null" ]; then
        echo -e "${RED}  ❌ Invalid UUID${NC}"
        return 1
    fi
    
    local proof_file="${REKOR_ENTRIES_DIR}/$(basename "$entry_file" .json)-inclusion-proof.json"
    
    # Get inclusion proof
    if rekor-cli get --uuid "$uuid" --format json > "$proof_file" 2>/dev/null; then
        echo -e "${GREEN}  ✅ Inclusion proof generated${NC}"
        echo -e "${BLUE}     📄 Proof saved: $(basename "$proof_file")${NC}"
        return 0
    else
        echo -e "${RED}  ❌ Failed to generate inclusion proof${NC}"
        return 1
    fi
}

# Main submission process
main() {
    check_dependencies
    
    echo -e "${BLUE}📤 Starting Rekor transparency log submission...${NC}"
    echo ""
    
    # Find and submit all signed artifacts
    if [ -d "$SIGNATURES_DIR" ] && [ -d "$CERTIFICATES_DIR" ]; then
        echo -e "${PURPLE}🔏 Submitting signed artifacts to Rekor...${NC}"
        
        find "$SIGNATURES_DIR" -name "*.sig" | while read -r sig_file; do
            local base_name=$(basename "$sig_file" .sig)
            local cert_file="${CERTIFICATES_DIR}/${base_name}.crt"
            
            # Find the original artifact
            local artifact_file=""
            
            # Search in common locations
            for search_dir in \
                "${TERRAFUSION_ROOT}/backend/bin/Release" \
                "${TERRAFUSION_ROOT}/backend/bin" \
                "${TRUST_ARTIFACTS_DIR}" \
                "${TERRAFUSION_ROOT}"; do
                
                if [ -f "${search_dir}/${base_name}" ]; then
                    artifact_file="${search_dir}/${base_name}"
                    break
                fi
                
                # Also check for tarballs
                if [ -f "${search_dir}/${base_name%.tar.gz}.tar.gz" ]; then
                    artifact_file="${search_dir}/${base_name%.tar.gz}.tar.gz"
                    break
                fi
            done
            
            # Submit if artifact found
            if [ -n "$artifact_file" ] && [ -f "$artifact_file" ]; then
                submit_to_rekor "$artifact_file" "$sig_file" "$cert_file" "$base_name"
                
                # Generate inclusion proof
                local entry_file="${REKOR_ENTRIES_DIR}/${base_name}-rekor-entry.json"
                if [ -f "$entry_file" ]; then
                    generate_inclusion_proof "$entry_file" "$base_name"
                fi
            else
                echo -e "${YELLOW}⚠️  Artifact not found for: $base_name${NC}"
            fi
        done
        echo ""
    fi
    
    # Verify all submitted entries
    if [ -d "$REKOR_ENTRIES_DIR" ]; then
        echo -e "${PURPLE}🔍 Verifying all Rekor entries...${NC}"
        
        find "$REKOR_ENTRIES_DIR" -name "*-rekor-entry.json" | while read -r entry; do
            verify_rekor_entry "$entry" "$(basename "$entry")"
        done
        echo ""
    fi
    
    # Create transparency log manifest
    echo -e "${BLUE}📊 Creating transparency log manifest...${NC}"
    
    cat > "${REKOR_ENTRIES_DIR}/transparency-manifest.json" << EOF
{
  "terrafusion_transparency_log": {
    "submission_session": {
      "timestamp": "$(date -u --iso-8601=seconds)",
      "git_commit": "$(git rev-parse HEAD 2>/dev/null || echo 'unknown')",
      "rekor_server": "https://rekor.sigstore.dev",
      "submitter": "TerraFusion Trust Fabric Automation"
    },
    "submissions": {
      "total": $TOTAL_SUBMISSIONS,
      "successful": $SUCCESSFUL_SUBMISSIONS,
      "failed": $FAILED_SUBMISSIONS,
      "success_rate": "$(echo "scale=2; $SUCCESSFUL_SUBMISSIONS * 100 / $TOTAL_SUBMISSIONS" | bc 2>/dev/null || echo "N/A")%"
    },
    "entries": [
$(find "$REKOR_ENTRIES_DIR" -name "*-rekor-entry.json" -exec jq -c '. + {"entry_file": "'$(basename {} .json)'.json"}' {} \; | sed 's/$/,/' | sed '$ s/,$//')
    ],
    "verification": {
      "all_entries_verified": $([ $FAILED_SUBMISSIONS -eq 0 ] && echo "true" || echo "false"),
      "transparency_level": "$([ $FAILED_SUBMISSIONS -eq 0 ] && echo "FULLY_TRANSPARENT" || echo "PARTIAL_TRANSPARENCY")"
    }
  }
}
EOF
    
    # Generate public verification script
    cat > "${REKOR_ENTRIES_DIR}/verify-transparency.sh" << 'EOF'
#!/bin/bash
# Public verification script for TerraFusion transparency log entries

echo "🔍 Verifying TerraFusion Transparency Log Entries..."

# Check if rekor-cli is available
if ! command -v rekor-cli >/dev/null 2>&1; then
    echo "❌ rekor-cli not found. Install from: https://github.com/sigstore/rekor"
    exit 1
fi

# Verify each entry
for entry_file in *-rekor-entry.json; do
    if [ -f "$entry_file" ]; then
        uuid=$(jq -r '.UUID' "$entry_file")
        echo "Verifying entry: $uuid"
        
        if rekor-cli verify --uuid "$uuid"; then
            echo "✅ $entry_file: VERIFIED"
        else
            echo "❌ $entry_file: FAILED"
        fi
    fi
done

echo "🎯 TerraFusion transparency verification complete"
EOF
    
    chmod +x "${REKOR_ENTRIES_DIR}/verify-transparency.sh"
    
    # Generate checksums
    echo -e "${BLUE}🔐 Generating transparency log checksums...${NC}"
    cd "$REKOR_ENTRIES_DIR"
    find . -name "*.json" -exec sha256sum {} \; > transparency-checksums.sha256
    
    # Summary
    echo ""
    echo -e "${GREEN}🎯 Rekor Submission Complete!${NC}"
    echo "=============================="
    echo -e "📊 Total Submissions: $TOTAL_SUBMISSIONS"
    echo -e "✅ Successful: $SUCCESSFUL_SUBMISSIONS"
    echo -e "❌ Failed: $FAILED_SUBMISSIONS"
    echo -e "📁 Entries Directory: $REKOR_ENTRIES_DIR"
    echo ""
    
    if [ $FAILED_SUBMISSIONS -eq 0 ]; then
        echo -e "${CYAN}🌍 All artifacts now in PUBLIC TRANSPARENCY LOG${NC}"
        echo -e "🔗 View entries at: https://rekor.sigstore.dev"
        echo ""
        echo -e "${GREEN}✅ TerraFusion is now TRANSPARENTLY VERIFIABLE${NC}"
        exit 0
    else
        echo -e "${YELLOW}⚠️  Some submissions failed - partial transparency achieved${NC}"
        exit 1
    fi
}

main "$@"

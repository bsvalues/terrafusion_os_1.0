#!/bin/bash

# TerraFusion Trust Fabric - Phase 1 One-Command Executor
# Complete Build Provenance & Attestation in single command
# Part of Phase 1: Build Provenance & Attestation

set -euo pipefail

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
PURPLE='\033[0;35m'
BOLD='\033[1m'
NC='\033[0m'

# ASCII Art Banner
echo -e "${CYAN}"
cat << "EOF"
╔══════════════════════════════════════════════════════════════╗
║                    TERRAFUSION TRUST FABRIC                 ║
║                   Phase 1: Build Attestation                ║
║              🔐 CRYPTOGRAPHIC PROVABILITY 🔐                ║
╚══════════════════════════════════════════════════════════════╝
EOF
echo -e "${NC}"

# Configuration
TERRAFUSION_ROOT=${1:-$(pwd)}
SCRIPTS_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TRUST_ARTIFACTS_DIR="${TERRAFUSION_ROOT}/trust-artifacts"
LOG_FILE="${TRUST_ARTIFACTS_DIR}/phase1-execution.log"

# Execution tracking
START_TIME=$(date +%s)
PHASE_STEPS=0
COMPLETED_STEPS=0
FAILED_STEPS=0

# Create artifacts directory and log
mkdir -p "$TRUST_ARTIFACTS_DIR"
exec 1> >(tee -a "$LOG_FILE")
exec 2> >(tee -a "$LOG_FILE" >&2)

echo "🚀 TerraFusion Trust Fabric Phase 1 Execution Started"
echo "====================================================="
echo "📅 Start Time: $(date)"
echo "📁 TerraFusion Root: $TERRAFUSION_ROOT"
echo "📋 Scripts Directory: $SCRIPTS_DIR"
echo "📊 Log File: $LOG_FILE"
echo ""

# Progress tracking
update_progress() {
    local step_name=$1
    local status=$2  # "start", "complete", "fail"
    
    case $status in
        "start")
            PHASE_STEPS=$((PHASE_STEPS + 1))
            echo -e "${BLUE}[$PHASE_STEPS] 🔄 Starting: $step_name${NC}"
            ;;
        "complete")
            COMPLETED_STEPS=$((COMPLETED_STEPS + 1))
            echo -e "${GREEN}[$PHASE_STEPS] ✅ Completed: $step_name${NC}"
            ;;
        "fail")
            FAILED_STEPS=$((FAILED_STEPS + 1))
            echo -e "${RED}[$PHASE_STEPS] ❌ Failed: $step_name${NC}"
            ;;
    esac
}

# Execute script with error handling
execute_script() {
    local script_name=$1
    local description=$2
    local script_path="${SCRIPTS_DIR}/${script_name}"
    
    update_progress "$description" "start"
    
    if [ ! -f "$script_path" ]; then
        echo -e "${RED}Script not found: $script_path${NC}"
        update_progress "$description" "fail"
        return 1
    fi
    
    # Make script executable
    chmod +x "$script_path"
    
    # Execute with timeout and error handling
    if timeout 600 "$script_path" "$TERRAFUSION_ROOT"; then
        update_progress "$description" "complete"
        return 0
    else
        update_progress "$description" "fail"
        return 1
    fi
}

# Pre-flight checks
preflight_checks() {
    update_progress "Pre-flight Environment Checks" "start"
    
    # Check dependencies
    local deps=("cosign" "syft" "rekor-cli" "git" "jq" "curl")
    local missing_deps=()
    
    for dep in "${deps[@]}"; do
        if ! command -v "$dep" >/dev/null 2>&1; then
            missing_deps+=("$dep")
        fi
    done
    
    if [ ${#missing_deps[@]} -gt 0 ]; then
        echo -e "${RED}Missing dependencies: ${missing_deps[*]}${NC}"
        echo "Please install missing tools before proceeding."
        update_progress "Pre-flight Environment Checks" "fail"
        return 1
    fi
    
    # Check TerraFusion structure
    if [ ! -d "$TERRAFUSION_ROOT" ]; then
        echo -e "${RED}TerraFusion root directory not found: $TERRAFUSION_ROOT${NC}"
        update_progress "Pre-flight Environment Checks" "fail"
        return 1
    fi
    
    # Check write permissions
    if [ ! -w "$TERRAFUSION_ROOT" ]; then
        echo -e "${RED}No write permission to TerraFusion root: $TERRAFUSION_ROOT${NC}"
        update_progress "Pre-flight Environment Checks" "fail"
        return 1
    fi
    
    # Set experimental mode for Sigstore
    export COSIGN_EXPERIMENTAL=1
    export SIGSTORE_EXPERIMENTAL=1
    
    echo -e "${GREEN}All dependencies verified${NC}"
    echo -e "${GREEN}TerraFusion structure validated${NC}"
    echo -e "${GREEN}Permissions confirmed${NC}"
    
    update_progress "Pre-flight Environment Checks" "complete"
    return 0
}

# Main execution pipeline
main() {
    echo -e "${BOLD}${PURPLE}🎯 PHASE 1: BUILD PROVENANCE & ATTESTATION${NC}"
    echo "=============================================="
    echo ""
    
    # Step 1: Pre-flight checks
    if ! preflight_checks; then
        echo -e "${RED}❌ Pre-flight checks failed. Aborting.${NC}"
        exit 1
    fi
    echo ""
    
    # Step 2: Generate SBOMs
    if ! execute_script "generate-sbom.sh" "Software Bill of Materials Generation"; then
        echo -e "${YELLOW}⚠️  SBOM generation failed, but continuing...${NC}"
    fi
    echo ""
    
    # Step 3: Sign artifacts
    if ! execute_script "sign-artifacts.sh" "Cryptographic Artifact Signing"; then
        echo -e "${RED}❌ Artifact signing failed. This is critical.${NC}"
        exit 1
    fi
    echo ""
    
    # Step 4: Verify trust
    if ! execute_script "verify-trust.sh" "Trust Chain Verification"; then
        echo -e "${RED}❌ Trust verification failed. Cannot proceed.${NC}"
        exit 1
    fi
    echo ""
    
    # Step 5: Submit to transparency log
    if ! execute_script "submit-rekor.sh" "Transparency Log Submission"; then
        echo -e "${YELLOW}⚠️  Transparency log submission failed${NC}"
        echo -e "${YELLOW}    Artifacts are still cryptographically signed${NC}"
    fi
    echo ""
    
    # Generate final phase report
    generate_phase_report
    
    # Display completion summary
    display_completion_summary
}

# Generate comprehensive phase report
generate_phase_report() {
    update_progress "Phase 1 Final Report Generation" "start"
    
    local end_time=$(date +%s)
    local duration=$((end_time - START_TIME))
    
    cat > "${TRUST_ARTIFACTS_DIR}/phase1-completion-report.json" << EOF
{
  "terrafusion_trust_fabric_phase1": {
    "execution_summary": {
      "start_time": "$(date -d "@$START_TIME" --iso-8601=seconds)",
      "end_time": "$(date -d "@$end_time" --iso-8601=seconds)",
      "duration_seconds": $duration,
      "duration_human": "$(printf '%02d:%02d:%02d' $((duration/3600)) $(((duration%3600)/60)) $((duration%60)))"
    },
    "phase_results": {
      "total_steps": $PHASE_STEPS,
      "completed_steps": $COMPLETED_STEPS,
      "failed_steps": $FAILED_STEPS,
      "success_rate": "$(echo "scale=2; $COMPLETED_STEPS * 100 / $PHASE_STEPS" | bc 2>/dev/null || echo "N/A")%"
    },
    "artifacts_generated": {
      "sboms": $(find "${TRUST_ARTIFACTS_DIR}/sboms" -name "*.json" 2>/dev/null | wc -l || echo 0),
      "signatures": $(find "${TRUST_ARTIFACTS_DIR}/signatures" -name "*.sig" 2>/dev/null | wc -l || echo 0),
      "certificates": $(find "${TRUST_ARTIFACTS_DIR}/certificates" -name "*.crt" 2>/dev/null | wc -l || echo 0),
      "rekor_entries": $(find "${TRUST_ARTIFACTS_DIR}/rekor-entries" -name "*.json" 2>/dev/null | wc -l || echo 0)
    },
    "provenance_level": "$([ $FAILED_STEPS -eq 0 ] && echo "L3_BUILD_PROVENANCE" || echo "PARTIAL_PROVENANCE")",
    "cryptographic_status": "$([ $FAILED_STEPS -eq 0 ] && echo "FULLY_ATTESTED" || echo "PARTIALLY_ATTESTED")",
    "transparency_status": "$([ -d "${TRUST_ARTIFACTS_DIR}/rekor-entries" ] && echo "PUBLIC_LOG" || echo "LOCAL_ONLY")",
    "next_phase": "phase2-swarm-proofs",
    "verification_command": "./verify-trust.sh"
  }
}
EOF
    
    update_progress "Phase 1 Final Report Generation" "complete"
}

# Display completion summary
display_completion_summary() {
    local end_time=$(date +%s)
    local duration=$((end_time - START_TIME))
    
    echo ""
    echo -e "${BOLD}${GREEN}🎉 PHASE 1 EXECUTION COMPLETE!${NC}"
    echo "==============================="
    echo -e "⏱️  Execution Time: $(printf '%02d:%02d:%02d' $((duration/3600)) $(((duration%3600)/60)) $((duration%60)))"
    echo -e "📊 Steps Completed: $COMPLETED_STEPS/$PHASE_STEPS"
    echo -e "❌ Steps Failed: $FAILED_STEPS"
    echo ""
    
    # Artifacts summary
    echo -e "${BLUE}📦 Generated Artifacts:${NC}"
    echo -e "  📋 SBOMs: $(find "${TRUST_ARTIFACTS_DIR}/sboms" -name "*.json" 2>/dev/null | wc -l || echo 0)"
    echo -e "  🔏 Signatures: $(find "${TRUST_ARTIFACTS_DIR}/signatures" -name "*.sig" 2>/dev/null | wc -l || echo 0)"
    echo -e "  🎫 Certificates: $(find "${TRUST_ARTIFACTS_DIR}/certificates" -name "*.crt" 2>/dev/null | wc -l || echo 0)"
    echo -e "  📝 Rekor Entries: $(find "${TRUST_ARTIFACTS_DIR}/rekor-entries" -name "*.json" 2>/dev/null | wc -l || echo 0)"
    echo ""
    
    if [ $FAILED_STEPS -eq 0 ]; then
        echo -e "${GREEN}🎯 SUCCESS: TerraFusion is now CRYPTOGRAPHICALLY PROVABLE${NC}"
        echo -e "${CYAN}🔐 Build Provenance: LEVEL 3 (L3)${NC}"
        echo -e "${CYAN}🌍 Transparency: PUBLIC LOG${NC}"
        echo ""
        echo -e "${PURPLE}Next Steps:${NC}"
        echo -e "1. Execute Phase 2: ./phase2-swarm-proofs/execute-phase2.sh"
        echo -e "2. Verify anytime: ./verify-trust.sh"
        echo -e "3. Deploy with confidence: Trust Fabric enabled"
    else
        echo -e "${YELLOW}⚠️  PARTIAL SUCCESS: Some steps failed${NC}"
        echo -e "Review logs and re-run failed steps as needed"
    fi
    
    echo ""
    echo -e "${CYAN}📋 Full report: ${TRUST_ARTIFACTS_DIR}/phase1-completion-report.json${NC}"
    echo -e "${CYAN}📊 Execution log: $LOG_FILE${NC}"
    echo ""
    echo -e "${BOLD}${CYAN}✨ TerraFusion Trust Fabric Phase 1 Complete ✨${NC}"
}

# Trap for cleanup on exit
trap 'echo -e "\n${YELLOW}🛑 Execution interrupted${NC}"' INT TERM

# Execute main pipeline
main "$@"

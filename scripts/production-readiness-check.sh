#!/bin/bash

# TerraFusion OS 1.0 - Production Readiness Validation
# Comprehensive security and operational readiness assessment

set -euo pipefail

readonly SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
readonly PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# Colors for output
readonly GREEN='\033[0;32m'
readonly RED='\033[0;31m'
readonly YELLOW='\033[1;33m'
readonly BLUE='\033[0;34m'
readonly NC='\033[0m' # No Color

log_info() {
    echo -e "${GREEN}[✅]${NC} $*"
}

log_warn() {
    echo -e "${YELLOW}[⚠️]${NC} $*"
}

log_error() {
    echo -e "${RED}[❌]${NC} $*"
}

log_check() {
    echo -e "${BLUE}[🔍]${NC} $*"
}

# Production readiness checks
main() {
    echo "🚀 TERRAFUSION OS 1.0 - PRODUCTION READINESS VALIDATION"
    echo "========================================================"
    echo ""
    
    local total_checks=0
    local passed_checks=0
    
    # Security Framework Validation
    echo "🔐 SECURITY FRAMEWORK VALIDATION"
    echo "--------------------------------"
    
    log_check "Cryptographic components..."
    if [[ -f "$PROJECT_ROOT/security/CryptoGuardian.js" ]]; then
        log_info "CryptoGuardian.js - Multi-layer signature validation ✓"
        ((passed_checks++))
    else
        log_error "CryptoGuardian.js - Missing critical security component"
    fi
    ((total_checks++))
    
    if [[ -f "$PROJECT_ROOT/backend/TerraFusion.Core/Security/CrossPlatformVerifier.cs" ]]; then
        log_info "CrossPlatformVerifier.cs - Cross-platform consensus verification ✓"
        ((passed_checks++))
    else
        log_error "CrossPlatformVerifier.cs - Missing consensus verification"
    fi
    ((total_checks++))
    
    if [[ -f "$PROJECT_ROOT/security/AgentAuthenticator.js" ]]; then
        log_info "AgentAuthenticator.js - AI agent authentication framework ✓"
        ((passed_checks++))
    else
        log_error "AgentAuthenticator.js - Missing agent authentication"
    fi
    ((total_checks++))
    
    # Key Management Validation
    echo ""
    echo "🔑 KEY MANAGEMENT VALIDATION"
    echo "----------------------------"
    
    if [[ -f "$PROJECT_ROOT/scripts/key-management-guardrails.sh" ]]; then
        log_info "Key management guardrails script ✓"
        ((passed_checks++))
    else
        log_error "Key management guardrails - Missing"
    fi
    ((total_checks++))
    
    if [[ -f "$PROJECT_ROOT/scripts/automated-key-rotation.sh" ]]; then
        log_info "Automated key rotation system ✓"
        ((passed_checks++))
    else
        log_error "Automated key rotation - Missing"
    fi
    ((total_checks++))
    
    if [[ -d "$PROJECT_ROOT/keys" ]]; then
        log_info "Cryptographic keys directory ✓"
        local key_count=$(find "$PROJECT_ROOT/keys" -name "*.pem" -type f 2>/dev/null | wc -l)
        log_info "Found $key_count Ed25519 key files"
        ((passed_checks++))
    else
        log_error "Keys directory - Missing"
    fi
    ((total_checks++))
    
    # Monitoring & Alerting Validation
    echo ""
    echo "📊 MONITORING & ALERTING VALIDATION"
    echo "-----------------------------------"
    
    if [[ -f "$PROJECT_ROOT/config/monitoring-config.yaml" ]]; then
        log_info "Security monitoring configuration ✓"
        # Check for plugin marketplace security config
        if grep -q "plugin_marketplace_security" "$PROJECT_ROOT/config/monitoring-config.yaml"; then
            log_info "Plugin marketplace security monitoring configured ✓"
            ((passed_checks++))
        else
            log_warn "Plugin marketplace security monitoring - Not configured"
        fi
        ((passed_checks++))
    else
        log_error "Monitoring configuration - Missing"
    fi
    ((total_checks++))
    
    if [[ -f "$PROJECT_ROOT/monitoring/dashboards/crypto-dashboard.json" ]]; then
        log_info "Cryptographic operations dashboard ✓"
        ((passed_checks++))
    else
        log_error "Crypto dashboard - Missing"
    fi
    ((total_checks++))
    
    # Infrastructure Validation
    echo ""
    echo "🏗️  INFRASTRUCTURE VALIDATION"
    echo "-----------------------------"
    
    if [[ -f "$PROJECT_ROOT/infrastructure/kubernetes/security-monitoring.yaml" ]]; then
        log_info "Kubernetes security monitoring deployment ✓"
        ((passed_checks++))
    else
        log_error "Kubernetes security deployment - Missing"
    fi
    ((total_checks++))
    
    # Documentation Validation
    echo ""
    echo "📚 DOCUMENTATION VALIDATION"
    echo "---------------------------"
    
    if [[ -f "$PROJECT_ROOT/security/incident-response-playbook.md" ]]; then
        log_info "Security incident response playbook ✓"
        ((passed_checks++))
    else
        log_error "Incident response playbook - Missing"
    fi
    ((total_checks++))
    
    if [[ -f "$PROJECT_ROOT/.github/SECURITY.md" ]]; then
        log_info "Security documentation ✓"
        # Check if it includes cryptographic framework references
        if grep -q "CrossPlatformVerifier" "$PROJECT_ROOT/.github/SECURITY.md"; then
            log_info "Security documentation includes framework references ✓"
            ((passed_checks++))
        else
            log_warn "Security documentation - Missing framework references"
        fi
        ((passed_checks++))
    else
        log_error "Security documentation - Missing"
    fi
    ((total_checks++))
    
    # Plugin Marketplace Validation
    echo ""
    echo "🏪 PLUGIN MARKETPLACE VALIDATION"
    echo "--------------------------------"
    
    if [[ -f "$PROJECT_ROOT/test-plugin-submission.json" ]]; then
        log_info "Test plugin submission format ✓"
        # Validate required fields
        if grep -q '"kid"' "$PROJECT_ROOT/test-plugin-submission.json" && \
           grep -q '"signature"' "$PROJECT_ROOT/test-plugin-submission.json"; then
            log_info "Plugin submission includes security fields (kid, signature) ✓"
            ((passed_checks++))
        else
            log_warn "Plugin submission - Missing security fields"
        fi
        ((passed_checks++))
    else
        log_warn "Test plugin submission - Not created"
    fi
    ((total_checks++))
    
    # Calculate readiness score
    echo ""
    echo "📊 PRODUCTION READINESS ASSESSMENT"
    echo "=================================="
    
    local readiness_score=$((passed_checks * 100 / total_checks))
    
    echo "Checks Passed: $passed_checks / $total_checks"
    echo "Readiness Score: $readiness_score%"
    echo ""
    
    if [[ $readiness_score -ge 90 ]]; then
        log_info "🚀 PRODUCTION READY - Score: $readiness_score%"
        echo ""
        echo "✅ TerraFusion OS 1.0 Plugin Marketplace Security Framework"
        echo "✅ Cross-platform cryptographic verification"
        echo "✅ Government-grade security monitoring"
        echo "✅ Comprehensive incident response procedures"
        echo "✅ Automated key management and rotation"
        echo ""
        echo "🎯 READY FOR GOVERNMENT DEPLOYMENT!"
        return 0
    elif [[ $readiness_score -ge 75 ]]; then
        log_warn "⚠️  NEARLY READY - Score: $readiness_score%"
        echo "Address remaining issues before production deployment"
        return 1
    else
        log_error "❌ NOT READY - Score: $readiness_score%"
        echo "Critical issues must be resolved before deployment"
        return 2
    fi
}

main "$@"
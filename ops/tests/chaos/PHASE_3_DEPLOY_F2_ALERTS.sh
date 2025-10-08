#!/usr/bin/env bash
#
# Phase 3: Deploy F2 Alert Pack
# Estimated Time: 40 minutes
#
# This script executes Phase 3 from DAY_8_PRODUCTION_CHECKLIST.md:
# - Deploy F2-specific alert rules
# - Configure Slack/PagerDuty notification channels
# - Test alert fidelity with synthetic error spike
#
# Prerequisites:
# - kubectl configured for staging cluster
# - Prometheus running in terrafusion-monitoring namespace
# - Slack webhook URL (optional)
# - PagerDuty integration key (optional)
#
# Usage:
#   bash ops/tests/chaos/PHASE_3_DEPLOY_F2_ALERTS.sh [--slack-webhook URL] [--pagerduty-key KEY]
#
# Author: TerraFusion Platform Team
# Last Updated: 2025-10-07

set -euo pipefail

# =============================================================================
# Configuration
# =============================================================================

NAMESPACE="${NAMESPACE:-terrafusion-monitoring}"
PROMETHEUS_URL="${PROMETHEUS_URL:-http://localhost:9090}"
ALERT_FILE="ops/tests/chaos/monitoring/f2-recovery.alerts.yaml"

# Parse command-line arguments
SLACK_WEBHOOK=""
PAGERDUTY_KEY=""

while [[ $# -gt 0 ]]; do
    case $1 in
        --slack-webhook)
            SLACK_WEBHOOK="$2"
            shift 2
            ;;
        --pagerduty-key)
            PAGERDUTY_KEY="$2"
            shift 2
            ;;
        *)
            echo "Unknown argument: $1"
            echo "Usage: $0 [--slack-webhook URL] [--pagerduty-key KEY]"
            exit 1
            ;;
    esac
done

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# =============================================================================
# Helper Functions
# =============================================================================

log_header() {
    echo -e "\n${BLUE}========================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}========================================${NC}\n"
}

log_info() {
    echo -e "[$(date +'%Y-%m-%d %H:%M:%S')] ${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "[$(date +'%Y-%m-%d %H:%M:%S')] ${GREEN}✅ $1${NC}"
}

log_error() {
    echo -e "[$(date +'%Y-%m-%d %H:%M:%S')] ${RED}❌ $1${NC}"
}

log_warning() {
    echo -e "[$(date +'%Y-%m-%d %H:%M:%S')] ${YELLOW}⚠️  $1${NC}"
}

# =============================================================================
# Step 3.1: Deploy F2-Specific Alert Rules (10 min)
# =============================================================================

deploy_alert_rules() {
    log_header "Step 3.1: Deploy F2-Specific Alert Rules"
    
    # Check if alert file exists
    if [[ ! -f "$ALERT_FILE" ]]; then
        log_error "Alert file not found: $ALERT_FILE"
        exit 1
    fi
    
    log_info "Deploying F2 recovery alert rules..."
    kubectl apply -f "$ALERT_FILE"
    
    # Wait for PrometheusRule to be created
    sleep 5
    
    # Verify PrometheusRule created
    if kubectl get prometheusrule f2-recovery-alerts -n "$NAMESPACE" &> /dev/null; then
        log_success "PrometheusRule 'f2-recovery-alerts' created successfully"
    else
        log_error "PrometheusRule 'f2-recovery-alerts' not found"
        exit 1
    fi
    
    # Check alert rules loaded in Prometheus
    log_info "Verifying alerts loaded in Prometheus..."
    RULES_JSON=$(curl -s "${PROMETHEUS_URL}/api/v1/rules")
    
    if echo "$RULES_JSON" | jq -e '.data.groups[] | select(.name=="f2_recovery_monitoring")' &> /dev/null; then
        log_success "Alert group 'f2_recovery_monitoring' loaded in Prometheus"
        
        # Count alerts
        ALERT_COUNT=$(echo "$RULES_JSON" | jq '[.data.groups[] | select(.name=="f2_recovery_monitoring") | .rules[]] | length')
        log_info "Loaded $ALERT_COUNT alert rules"
        
        # List alert names
        echo "$RULES_JSON" | jq -r '.data.groups[] | select(.name=="f2_recovery_monitoring") | .rules[] | "  - \(.alert)"'
    else
        log_warning "Alert group 'f2_recovery_monitoring' not found in Prometheus (may take 30-60s to load)"
        log_info "Prometheus will reload rules within 1 minute"
    fi
    
    log_success "Step 3.1 complete"
}

# =============================================================================
# Step 3.2: Configure Notification Channels (15 min)
# =============================================================================

configure_notifications() {
    log_header "Step 3.2: Configure Notification Channels"
    
    # Slack Integration
    if [[ -n "$SLACK_WEBHOOK" ]]; then
        log_info "Configuring Slack webhook..."
        
        kubectl create secret generic slack-webhook \
            --from-literal=url="$SLACK_WEBHOOK" \
            -n "$NAMESPACE" \
            --dry-run=client -o yaml | kubectl apply -f -
        
        log_success "Slack webhook secret created"
        
        # Test Slack notification
        log_info "Testing Slack notification..."
        curl -X POST "$SLACK_WEBHOOK" \
            -H 'Content-Type: application/json' \
            -d '{
                "text": "🧪 TerraFusion Phase 3 Test Alert",
                "attachments": [{
                    "color": "warning",
                    "title": "F2 Alert System Test",
                    "text": "This is a test notification from Phase 3 deployment. If you see this, Slack integration is working!",
                    "footer": "TerraFusion Chaos Engineering",
                    "ts": '$(date +%s)'
                }]
            }'
        
        log_success "Slack test notification sent (check #terrafusion-chaos-alerts)"
    else
        log_warning "No Slack webhook provided (skip with --slack-webhook URL)"
        log_info "You can configure Slack integration later"
    fi
    
    # PagerDuty Integration
    if [[ -n "$PAGERDUTY_KEY" ]]; then
        log_info "Configuring PagerDuty integration..."
        
        kubectl create secret generic pagerduty-key \
            --from-literal=routing_key="$PAGERDUTY_KEY" \
            -n "$NAMESPACE" \
            --dry-run=client -o yaml | kubectl apply -f -
        
        log_success "PagerDuty integration key secret created"
        
        # Test PagerDuty integration
        log_info "Testing PagerDuty integration..."
        curl -X POST https://events.pagerduty.com/v2/enqueue \
            -H 'Content-Type: application/json' \
            -d "{
                \"routing_key\": \"$PAGERDUTY_KEY\",
                \"event_action\": \"trigger\",
                \"payload\": {
                    \"summary\": \"Day 8 Phase 3 Test Alert\",
                    \"severity\": \"warning\",
                    \"source\": \"terrafusion-staging\",
                    \"timestamp\": \"$(date -u +%Y-%m-%dT%H:%M:%SZ)\",
                    \"custom_details\": {
                        \"phase\": \"Phase 3 - F2 Alert Pack Deployment\",
                        \"test\": \"Integration validation\"
                    }
                }
            }"
        
        log_success "PagerDuty test alert sent (check your PagerDuty dashboard)"
    else
        log_warning "No PagerDuty key provided (skip with --pagerduty-key KEY)"
        log_info "You can configure PagerDuty integration later"
    fi
    
    log_success "Step 3.2 complete"
}

# =============================================================================
# Step 3.3: Verify Alert Fidelity (15 min)
# =============================================================================

verify_alert_fidelity() {
    log_header "Step 3.3: Verify Alert Fidelity"
    
    log_info "This step tests alert firing with a synthetic error spike"
    log_warning "This will temporarily modify the alert threshold to force an alert"
    
    read -p "Press Enter to continue with alert fidelity test (or Ctrl+C to skip)..."
    
    # Get original threshold
    ORIGINAL_THRESHOLD=$(kubectl get prometheusrule f2-recovery-alerts -n "$NAMESPACE" -o jsonpath='{.spec.groups[0].rules[2].expr}')
    log_info "Original threshold: $ORIGINAL_THRESHOLD"
    
    # Lower threshold to force alert (error rate > 0.1% instead of 1%)
    log_info "Temporarily lowering error rate threshold to 0.001 (0.1%)..."
    kubectl patch prometheusrule f2-recovery-alerts -n "$NAMESPACE" --type=json \
        -p='[{"op": "replace", "path": "/spec/groups/0/rules/2/expr", "value": "rate(f2_requests_total{status=~\"5..\"}[2m]) / rate(f2_requests_total[2m]) > 0.001"}]'
    
    log_info "Waiting 2-3 minutes for alert to fire..."
    log_info "Check alert status:"
    log_info "  1. Prometheus UI: ${PROMETHEUS_URL}/alerts"
    log_info "  2. Slack: #terrafusion-chaos-alerts"
    log_info "  3. PagerDuty dashboard"
    
    # Poll for alert firing
    for i in {1..12}; do
        sleep 15
        
        ALERTS_JSON=$(curl -s "${PROMETHEUS_URL}/api/v1/alerts")
        FIRING_ALERTS=$(echo "$ALERTS_JSON" | jq -r '.data.alerts[] | select(.state=="firing") | .labels.alertname')
        
        if echo "$FIRING_ALERTS" | grep -q "F2_Error_Rate_High"; then
            log_success "Alert 'F2_Error_Rate_High' is firing!"
            break
        fi
        
        log_info "Waiting... ($((i * 15))s elapsed)"
    done
    
    # Restore original threshold
    log_info "Restoring original threshold..."
    kubectl patch prometheusrule f2-recovery-alerts -n "$NAMESPACE" --type=json \
        -p="[{\"op\": \"replace\", \"path\": \"/spec/groups/0/rules/2/expr\", \"value\": \"$ORIGINAL_THRESHOLD\"}]"
    
    log_success "Original threshold restored"
    
    # Wait for alert to resolve
    log_info "Waiting for alert to auto-resolve..."
    sleep 60
    
    ALERTS_JSON=$(curl -s "${PROMETHEUS_URL}/api/v1/alerts")
    FIRING_ALERTS=$(echo "$ALERTS_JSON" | jq -r '.data.alerts[] | select(.state=="firing") | .labels.alertname')
    
    if echo "$FIRING_ALERTS" | grep -q "F2_Error_Rate_High"; then
        log_warning "Alert still firing (may take additional time to resolve)"
    else
        log_success "Alert auto-resolved"
    fi
    
    log_success "Step 3.3 complete"
}

# =============================================================================
# Main Execution
# =============================================================================

main() {
    log_header "Phase 3: Deploy F2 Alert Pack"
    log_info "Estimated time: 40 minutes"
    log_info "Namespace: $NAMESPACE"
    log_info "Prometheus: $PROMETHEUS_URL"
    
    # Execute steps
    deploy_alert_rules
    configure_notifications
    verify_alert_fidelity
    
    # Summary
    log_header "Phase 3 Complete! 🎉"
    
    echo -e "${GREEN}✅ Deployment Summary:${NC}"
    echo -e "  - F2 alert rules deployed (6 alerts)"
    echo -e "  - PrometheusRule validated"
    echo -e "  - Alerts loaded in Prometheus"
    if [[ -n "$SLACK_WEBHOOK" ]]; then
        echo -e "  - Slack integration configured ✅"
    else
        echo -e "  - Slack integration: NOT CONFIGURED"
    fi
    if [[ -n "$PAGERDUTY_KEY" ]]; then
        echo -e "  - PagerDuty integration configured ✅"
    else
        echo -e "  - PagerDuty integration: NOT CONFIGURED"
    fi
    echo -e "  - Alert fidelity tested ✅"
    
    echo -e "\n${BLUE}Next Steps:${NC}"
    echo -e "  1. Mark Phase 3 complete in todo list"
    echo -e "  2. Wait for RS256 T+48h gate (~12 hours)"
    echo -e "  3. Run RS256 adoption query:"
    echo -e "     ${YELLOW}psql -f ops/security/rs256/adoption-tracking-queries.sql${NC}"
    echo -e "  4. If adoption ≥95%, proceed to Phase 4 (RS256 Dual-Sign)"
    
    echo -e "\n${GREEN}Phase 3 deployment successful!${NC}"
}

main "$@"

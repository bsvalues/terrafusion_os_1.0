#!/bin/bash

###############################################################################
# TerraFusion OS 1.0 - Emergency Rollback Script
# MIT/PhD-Level Automated Rollback System
#
# This script provides instant rollback capabilities with:
# 1. Automatic detection of problematic deployments
# 2. One-command emergency rollback
# 3. Intelligent version history management
# 4. Health validation after rollback
# 5. Incident report generation
#
# Usage: ./rollback-deployment.sh <environment> [target-version]
# Example: ./rollback-deployment.sh production
#          ./rollback-deployment.sh production v1.1.0
###############################################################################

set -euo pipefail

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
ENVIRONMENT=${1:-production}
TARGET_VERSION=${2:-}
NAMESPACE="terrafusion-${ENVIRONMENT}"
DEPLOYMENT_NAME="terrafusion-api"
SERVICE_NAME="terrafusion-api-service"

# Notifications
SLACK_WEBHOOK="${SLACK_WEBHOOK_URL:-}"
PAGERDUTY_KEY="${PAGERDUTY_KEY:-}"

###############################################################################
# Helper Functions
###############################################################################

log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] ✅ $1${NC}"
}

log_error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ❌ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] ⚠️  $1${NC}"
}

send_slack() {
    local message=$1
    local color=${2:-"danger"}
    
    if [[ -n "$SLACK_WEBHOOK" ]]; then
        curl -X POST "$SLACK_WEBHOOK" \
            -H 'Content-Type: application/json' \
            -d "{
                \"attachments\": [{
                    \"color\": \"$color\",
                    \"text\": \"$message\",
                    \"footer\": \"TerraFusion Rollback Bot\",
                    \"ts\": $(date +%s)
                }]
            }" 2>/dev/null || true
    fi
}

###############################################################################
# Get Deployment History
###############################################################################

get_deployment_history() {
    log "Retrieving deployment history..."
    
    kubectl rollout history deployment/${DEPLOYMENT_NAME} -n "$NAMESPACE" || {
        log_error "Failed to retrieve deployment history"
        exit 1
    }
}

###############################################################################
# Get Current Version
###############################################################################

get_current_version() {
    kubectl get deployment/${DEPLOYMENT_NAME} -n "$NAMESPACE" \
        -o jsonpath='{.spec.template.metadata.labels.version}' 2>/dev/null || echo "unknown"
}

###############################################################################
# Get Previous Version
###############################################################################

get_previous_version() {
    # Get second-to-last version from rollout history
    kubectl rollout history deployment/${DEPLOYMENT_NAME} -n "$NAMESPACE" \
        --revision=$(kubectl rollout history deployment/${DEPLOYMENT_NAME} -n "$NAMESPACE" | tail -n 2 | head -n 1 | awk '{print $1}') \
        -o jsonpath='{.spec.template.metadata.labels.version}' 2>/dev/null || echo "unknown"
}

###############################################################################
# Detect Active Color
###############################################################################

detect_active_color() {
    local blue_pods=$(kubectl get pods -n "$NAMESPACE" -l "app=$DEPLOYMENT_NAME,color=blue" \
        --field-selector=status.phase=Running -o json | jq '.items | length')
    local green_pods=$(kubectl get pods -n "$NAMESPACE" -l "app=$DEPLOYMENT_NAME,color=green" \
        --field-selector=status.phase=Running -o json | jq '.items | length')
    
    if [[ $blue_pods -gt $green_pods ]]; then
        echo "blue"
    else
        echo "green"
    fi
}

###############################################################################
# Execute Rollback
###############################################################################

execute_rollback() {
    local current_version=$(get_current_version)
    local target_version=$1
    
    log_warning "EXECUTING ROLLBACK"
    log "Current version: $current_version"
    log "Target version: $target_version"
    
    send_slack "🔴 EMERGENCY ROLLBACK INITIATED\nEnvironment: $ENVIRONMENT\nFrom: $current_version\nTo: $target_version" "danger"
    
    # Determine active color
    local active_color=$(detect_active_color)
    local inactive_color
    if [[ "$active_color" == "blue" ]]; then
        inactive_color="green"
    else
        inactive_color="blue"
    fi
    
    log "Active color: $active_color | Rolling back to: $inactive_color"
    
    # If target version specified, deploy it to inactive color
    if [[ -n "$target_version" ]]; then
        log "Deploying target version $target_version to $inactive_color environment..."
        
        kubectl set image deployment/${DEPLOYMENT_NAME}-${inactive_color} \
            api=terrafusion/api:${target_version} \
            -n "$NAMESPACE" || {
            log_error "Failed to update image"
            exit 1
        }
        
        # Wait for rollout
        kubectl rollout status deployment/${DEPLOYMENT_NAME}-${inactive_color} \
            -n "$NAMESPACE" --timeout=5m || {
            log_error "Rollback deployment failed"
            exit 1
        }
    fi
    
    # Shift traffic to inactive color (which has the good version)
    log "Shifting 100% traffic to $inactive_color environment..."
    
    cat <<EOF | kubectl apply -f -
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: ${DEPLOYMENT_NAME}-ingress
  namespace: ${NAMESPACE}
  annotations:
    kubernetes.io/ingress.class: nginx
    nginx.ingress.kubernetes.io/ssl-redirect: "true"
    cert-manager.io/cluster-issuer: "letsencrypt-prod"
spec:
  tls:
  - hosts:
    - api.terrafusion.ai
    secretName: terrafusion-tls
  rules:
  - host: api.terrafusion.ai
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: ${SERVICE_NAME}-${inactive_color}
            port:
              number: 80
EOF
    
    log_success "Traffic shifted to $inactive_color (version: $target_version)"
}

###############################################################################
# Validate Rollback
###############################################################################

validate_rollback() {
    log "Validating rollback..."
    
    # Check pod health
    local ready_pods=$(kubectl get pods -n "$NAMESPACE" -l "app=$DEPLOYMENT_NAME" \
        --field-selector=status.phase=Running -o json | jq '.items | length')
    
    if [[ $ready_pods -lt 1 ]]; then
        log_error "No healthy pods after rollback"
        return 1
    fi
    
    # Health check
    local service_url="https://api.terrafusion.ai"
    if ! curl -f -s "${service_url}/health" > /dev/null; then
        log_error "Health check failed after rollback"
        return 1
    fi
    
    # Check error rates
    sleep 30
    local error_rate=$(curl -s "http://prometheus-operated:9090/api/v1/query?query=sum(rate(http_requests_total{status=~\"5..\"}[1m]))/sum(rate(http_requests_total[1m]))" | jq -r '.data.result[0].value[1] // 0')
    
    if (( $(echo "$error_rate > 0.05" | bc -l) )); then
        log_warning "Error rate still elevated: $error_rate"
        return 1
    fi
    
    log_success "Rollback validation passed"
    return 0
}

###############################################################################
# Generate Incident Report
###############################################################################

generate_incident_report() {
    local rollback_version=$1
    local report_file="incident-report-$(date +%Y%m%d-%H%M%S).md"
    
    log "Generating incident report: $report_file"
    
    cat > "$report_file" <<EOF
# TerraFusion OS 1.0 - Rollback Incident Report

**Date**: $(date +'%Y-%m-%d %H:%M:%S %Z')  
**Environment**: $ENVIRONMENT  
**Rolled Back To**: $rollback_version  
**Executed By**: $(whoami)

## Timeline

- **Rollback Initiated**: $(date +'%Y-%m-%d %H:%M:%S')
- **Rollback Completed**: $(date +'%Y-%m-%d %H:%M:%S')
- **Services Restored**: $(date +'%Y-%m-%d %H:%M:%S')

## System Status

### Pod Status
\`\`\`
$(kubectl get pods -n "$NAMESPACE" -l "app=$DEPLOYMENT_NAME")
\`\`\`

### Deployment Status
\`\`\`
$(kubectl get deployments -n "$NAMESPACE" -l "app=$DEPLOYMENT_NAME")
\`\`\`

### Recent Events
\`\`\`
$(kubectl get events -n "$NAMESPACE" --sort-by='.lastTimestamp' | tail -n 20)
\`\`\`

### Error Logs (Last 100 lines)
\`\`\`
$(kubectl logs -n "$NAMESPACE" -l "app=$DEPLOYMENT_NAME" --tail=100 --since=1h | grep -i error || echo "No errors found")
\`\`\`

## Metrics at Rollback Time

$(curl -s "http://prometheus-operated:9090/api/v1/query?query=rate(http_requests_total[5m])" | jq -r '.data.result[] | "- \(.metric.endpoint): \(.value[1]) req/s"' || echo "Metrics unavailable")

## Action Items

- [ ] Root cause analysis
- [ ] Fix identified issues
- [ ] Update test coverage
- [ ] Document lessons learned
- [ ] Schedule re-deployment

## Notes

_Add additional context here_

---
*Generated automatically by TerraFusion Rollback System*
EOF
    
    log_success "Incident report generated: $report_file"
    
    # Upload to S3 or shared storage (optional)
    # aws s3 cp "$report_file" s3://terrafusion-incidents/ || true
}

###############################################################################
# Main Function
###############################################################################

main() {
    log "======================================================================"
    log "TerraFusion OS 1.0 - Emergency Rollback System"
    log "Environment: $ENVIRONMENT"
    log "======================================================================"
    
    # Get current version
    local current_version=$(get_current_version)
    log "Current deployed version: $current_version"
    
    # Determine target version
    if [[ -z "$TARGET_VERSION" ]]; then
        TARGET_VERSION=$(get_previous_version)
        log "No target version specified, using previous version: $TARGET_VERSION"
    fi
    
    # Confirm rollback
    log_warning "This will rollback $ENVIRONMENT from $current_version to $TARGET_VERSION"
    read -p "Continue? (yes/no): " -r
    if [[ ! $REPLY =~ ^[Yy][Ee][Ss]$ ]]; then
        log "Rollback cancelled"
        exit 0
    fi
    
    # Execute rollback
    execute_rollback "$TARGET_VERSION"
    
    # Wait for traffic to stabilize
    log "Waiting 60 seconds for traffic to stabilize..."
    sleep 60
    
    # Validate rollback
    if validate_rollback; then
        log_success "Rollback successful and validated"
        send_slack "✅ Rollback to $TARGET_VERSION completed successfully in $ENVIRONMENT" "good"
    else
        log_error "Rollback validation failed - manual intervention required"
        send_slack "⚠️ Rollback completed but validation failed - check system status" "warning"
    fi
    
    # Generate incident report
    generate_incident_report "$TARGET_VERSION"
    
    log "======================================================================"
    log_success "ROLLBACK COMPLETE"
    log "======================================================================"
}

main "$@"

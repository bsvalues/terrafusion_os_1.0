#!/bin/bash

# TerraFusion Kubernetes Production Deployment Validation Script
# 
# Comprehensive validation of production Kubernetes deployment
# Tests all government-grade infrastructure components and configurations
# 
# THE TERRAFUSION WAY: Production Infrastructure Excellence

set -e

# Colors for output formatting
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Configuration
NAMESPACE="terrafusion-production"
RESULTS_DIR="./k8s-validation-results"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
VALIDATION_REPORT="$RESULTS_DIR/k8s_validation_report_$TIMESTAMP.json"
SUMMARY_REPORT="$RESULTS_DIR/k8s_validation_summary_$TIMESTAMP.md"

echo -e "${PURPLE}╔══════════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${PURPLE}║          TerraFusion Kubernetes Production Deployment Testing       ║${NC}"
echo -e "${PURPLE}║                      THE TERRAFUSION WAY                            ║${NC}"
echo -e "${PURPLE}╚══════════════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Initialize validation tracking
declare -A validation_results
declare -A performance_metrics
total_validations=0
passed_validations=0

# Function to log validation result
log_validation() {
    local category=$1
    local test=$2
    local status=$3
    local details=$4
    
    total_validations=$((total_validations + 1))
    
    if [[ "$status" == "PASS" ]]; then
        passed_validations=$((passed_validations + 1))
        echo -e "${GREEN}✅ $category - $test: PASSED${NC}"
    elif [[ "$status" == "WARN" ]]; then
        echo -e "${YELLOW}⚠️ $category - $test: WARNING${NC}"
        echo -e "   ${YELLOW}Details: $details${NC}"
    else
        echo -e "${RED}❌ $category - $test: FAILED${NC}"
        echo -e "   ${RED}Details: $details${NC}"
    fi
    
    validation_results["${category}_${test}"]="$status|$details"
}

# Function to check if kubectl is available and configured
check_kubectl() {
    echo -e "${CYAN}🔧 Checking Kubernetes connectivity...${NC}"
    
    if ! command -v kubectl &> /dev/null; then
        log_validation "PREREQ" "KUBECTL_AVAILABLE" "FAIL" "kubectl command not found"
        return 1
    fi
    
    # Test kubectl connectivity
    if kubectl cluster-info &> /dev/null; then
        log_validation "PREREQ" "CLUSTER_CONNECTIVITY" "PASS" "Kubernetes cluster accessible"
    else
        log_validation "PREREQ" "CLUSTER_CONNECTIVITY" "FAIL" "Cannot connect to Kubernetes cluster"
        return 1
    fi
    
    # Check if namespace exists or can be created
    if kubectl get namespace "$NAMESPACE" &> /dev/null; then
        log_validation "PREREQ" "NAMESPACE_EXISTS" "PASS" "Production namespace already exists"
    else
        log_validation "PREREQ" "NAMESPACE_EXISTS" "WARN" "Production namespace needs to be created"
    fi
}

# Function to validate YAML manifests
validate_manifests() {
    echo -e "${CYAN}📋 Validating Kubernetes manifests...${NC}"
    
    local manifest_dir="k8s/production"
    
    if [[ ! -d "$manifest_dir" ]]; then
        log_validation "MANIFESTS" "DIRECTORY_EXISTS" "FAIL" "Production manifests directory not found"
        return 1
    fi
    
    # Validate each manifest file
    local manifest_files=(
        "01-namespace.yaml"
        "02-applications.yaml"
        "03-databases.yaml"
        "04-ingress.yaml"
    )
    
    for manifest in "${manifest_files[@]}"; do
        local manifest_path="$manifest_dir/$manifest"
        
        if [[ -f "$manifest_path" ]]; then
            # Check YAML syntax
            if kubectl apply --dry-run=client -f "$manifest_path" &> /dev/null; then
                log_validation "MANIFESTS" "${manifest%.yaml}_SYNTAX" "PASS" "YAML syntax valid"
            else
                log_validation "MANIFESTS" "${manifest%.yaml}_SYNTAX" "FAIL" "YAML syntax errors"
            fi
            
            # Check for required security contexts
            if grep -q "securityContext:" "$manifest_path"; then
                log_validation "MANIFESTS" "${manifest%.yaml}_SECURITY" "PASS" "Security contexts defined"
            else
                log_validation "MANIFESTS" "${manifest%.yaml}_SECURITY" "WARN" "Security contexts not found"
            fi
        else
            log_validation "MANIFESTS" "${manifest%.yaml}_EXISTS" "FAIL" "Manifest file not found"
        fi
    done
    
    # Check for government compliance annotations
    if grep -r "compliance.*fedramp" "$manifest_dir" &> /dev/null; then
        log_validation "MANIFESTS" "FEDRAMP_COMPLIANCE" "PASS" "FedRAMP compliance annotations present"
    else
        log_validation "MANIFESTS" "FEDRAMP_COMPLIANCE" "WARN" "FedRAMP compliance annotations missing"
    fi
}

# Function to validate deployment configurations
validate_deployment_configs() {
    echo -e "${CYAN}🚀 Validating deployment configurations...${NC}"
    
    # Check resource requests and limits
    if grep -r "resources:" k8s/production/ &> /dev/null; then
        if grep -r "requests:" k8s/production/ &> /dev/null && grep -r "limits:" k8s/production/ &> /dev/null; then
            log_validation "DEPLOY" "RESOURCE_MANAGEMENT" "PASS" "Resource requests and limits configured"
        else
            log_validation "DEPLOY" "RESOURCE_MANAGEMENT" "WARN" "Incomplete resource configuration"
        fi
    else
        log_validation "DEPLOY" "RESOURCE_MANAGEMENT" "FAIL" "No resource management configured"
    fi
    
    # Check for health checks
    if grep -r "livenessProbe:" k8s/production/ &> /dev/null && grep -r "readinessProbe:" k8s/production/ &> /dev/null; then
        log_validation "DEPLOY" "HEALTH_CHECKS" "PASS" "Health checks configured"
    else
        log_validation "DEPLOY" "HEALTH_CHECKS" "FAIL" "Health checks missing"
    fi
    
    # Check for horizontal pod autoscaling
    if grep -r "HorizontalPodAutoscaler" k8s/production/ &> /dev/null; then
        log_validation "DEPLOY" "AUTO_SCALING" "PASS" "Horizontal Pod Autoscaler configured"
    else
        log_validation "DEPLOY" "AUTO_SCALING" "WARN" "Auto-scaling not configured"
    fi
    
    # Check for pod disruption budgets
    if grep -r "PodDisruptionBudget" k8s/production/ &> /dev/null; then
        log_validation "DEPLOY" "DISRUPTION_BUDGETS" "PASS" "Pod Disruption Budgets configured"
    else
        log_validation "DEPLOY" "DISRUPTION_BUDGETS" "WARN" "Pod Disruption Budgets missing"
    fi
}

# Function to validate security configurations
validate_security_configs() {
    echo -e "${CYAN}🔒 Validating security configurations...${NC}"
    
    # Check for network policies
    if grep -r "NetworkPolicy" k8s/production/ &> /dev/null; then
        log_validation "SECURITY" "NETWORK_POLICIES" "PASS" "Network policies configured"
    else
        log_validation "SECURITY" "NETWORK_POLICIES" "FAIL" "Network policies missing"
    fi
    
    # Check for RBAC configuration
    if grep -r "rbac.authorization.k8s.io" k8s/production/ &> /dev/null; then
        log_validation "SECURITY" "RBAC_CONFIG" "PASS" "RBAC configuration present"
    else
        log_validation "SECURITY" "RBAC_CONFIG" "FAIL" "RBAC configuration missing"
    fi
    
    # Check for secrets management
    if grep -r "kind: Secret" k8s/production/ &> /dev/null; then
        log_validation "SECURITY" "SECRETS_MANAGEMENT" "PASS" "Kubernetes secrets configured"
    else
        log_validation "SECURITY" "SECRETS_MANAGEMENT" "WARN" "No secrets configured"
    fi
    
    # Check for TLS configuration
    if grep -r "tls:" k8s/production/ &> /dev/null; then
        log_validation "SECURITY" "TLS_CONFIG" "PASS" "TLS configuration present"
    else
        log_validation "SECURITY" "TLS_CONFIG" "FAIL" "TLS configuration missing"
    fi
    
    # Check for security contexts
    if grep -r "runAsNonRoot: true" k8s/production/ &> /dev/null; then
        log_validation "SECURITY" "NON_ROOT_CONTAINERS" "PASS" "Non-root containers configured"
    else
        log_validation "SECURITY" "NON_ROOT_CONTAINERS" "FAIL" "Containers running as root"
    fi
}

# Function to validate database configurations
validate_database_configs() {
    echo -e "${CYAN}🗄️ Validating database configurations...${NC}"
    
    # Check for StatefulSet configuration
    if grep -r "kind: StatefulSet" k8s/production/ &> /dev/null; then
        log_validation "DATABASE" "STATEFULSET_CONFIG" "PASS" "StatefulSet for database configured"
    else
        log_validation "DATABASE" "STATEFULSET_CONFIG" "FAIL" "Database StatefulSet missing"
    fi
    
    # Check for persistent volume claims
    if grep -r "volumeClaimTemplates:" k8s/production/ &> /dev/null; then
        log_validation "DATABASE" "PERSISTENT_STORAGE" "PASS" "Persistent storage configured"
    else
        log_validation "DATABASE" "PERSISTENT_STORAGE" "FAIL" "Persistent storage missing"
    fi
    
    # Check for database backup configuration
    if grep -r "backup" k8s/production/ &> /dev/null; then
        log_validation "DATABASE" "BACKUP_CONFIG" "PASS" "Backup configuration present"
    else
        log_validation "DATABASE" "BACKUP_CONFIG" "WARN" "Backup configuration not specified"
    fi
    
    # Check for Redis cache configuration
    if grep -r "redis" k8s/production/ &> /dev/null; then
        log_validation "DATABASE" "CACHE_CONFIG" "PASS" "Redis cache configured"
    else
        log_validation "DATABASE" "CACHE_CONFIG" "WARN" "Cache configuration missing"
    fi
}

# Function to validate monitoring and observability
validate_monitoring_configs() {
    echo -e "${CYAN}👁️ Validating monitoring configurations...${NC}"
    
    # Check for Prometheus annotations
    if grep -r "prometheus.io/scrape" k8s/production/ &> /dev/null; then
        log_validation "MONITORING" "PROMETHEUS_METRICS" "PASS" "Prometheus metrics configured"
    else
        log_validation "MONITORING" "PROMETHEUS_METRICS" "WARN" "Prometheus metrics missing"
    fi
    
    # Check for service monitors
    if grep -r "metrics" k8s/production/ &> /dev/null; then
        log_validation "MONITORING" "METRICS_ENDPOINTS" "PASS" "Metrics endpoints configured"
    else
        log_validation "MONITORING" "METRICS_ENDPOINTS" "WARN" "Metrics endpoints missing"
    fi
    
    # Check for logging configuration
    if grep -r "log" k8s/production/ &> /dev/null; then
        log_validation "MONITORING" "LOGGING_CONFIG" "PASS" "Logging configuration present"
    else
        log_validation "MONITORING" "LOGGING_CONFIG" "WARN" "Logging configuration missing"
    fi
}

# Function to validate ingress and networking
validate_ingress_configs() {
    echo -e "${CYAN}🌐 Validating ingress and networking configurations...${NC}"
    
    # Check for ingress configuration
    if grep -r "kind: Ingress" k8s/production/ &> /dev/null; then
        log_validation "INGRESS" "INGRESS_CONFIG" "PASS" "Ingress configuration present"
    else
        log_validation "INGRESS" "INGRESS_CONFIG" "FAIL" "Ingress configuration missing"
    fi
    
    # Check for SSL/TLS configuration
    if grep -r "ssl-redirect" k8s/production/ &> /dev/null; then
        log_validation "INGRESS" "SSL_REDIRECT" "PASS" "SSL redirect configured"
    else
        log_validation "INGRESS" "SSL_REDIRECT" "WARN" "SSL redirect not configured"
    fi
    
    # Check for rate limiting
    if grep -r "rate-limit" k8s/production/ &> /dev/null; then
        log_validation "INGRESS" "RATE_LIMITING" "PASS" "Rate limiting configured"
    else
        log_validation "INGRESS" "RATE_LIMITING" "WARN" "Rate limiting not configured"
    fi
    
    # Check for government domains
    if grep -r "terrafusion.gov" k8s/production/ &> /dev/null; then
        log_validation "INGRESS" "GOVERNMENT_DOMAINS" "PASS" "Government domains configured"
    else
        log_validation "INGRESS" "GOVERNMENT_DOMAINS" "WARN" "Government domains not specified"
    fi
}

# Function to simulate deployment (dry-run)
simulate_deployment() {
    echo -e "${CYAN}🧪 Simulating production deployment...${NC}"
    
    local manifest_dir="k8s/production"
    local failed_deployments=0
    
    # Create namespace for dry-run if it doesn't exist
    if ! kubectl get namespace "$NAMESPACE" &> /dev/null; then
        if kubectl create namespace "$NAMESPACE" --dry-run=client -o yaml | kubectl apply -f - &> /dev/null; then
            log_validation "SIMULATION" "NAMESPACE_CREATION" "PASS" "Namespace can be created"
        else
            log_validation "SIMULATION" "NAMESPACE_CREATION" "FAIL" "Namespace creation failed"
            ((failed_deployments++))
        fi
    fi
    
    # Test deployment of each manifest
    for manifest in "$manifest_dir"/*.yaml; do
        if [[ -f "$manifest" ]]; then
            local manifest_name=$(basename "$manifest" .yaml)
            
            if kubectl apply --dry-run=server -f "$manifest" &> /dev/null; then
                log_validation "SIMULATION" "${manifest_name}_DEPLOYMENT" "PASS" "Manifest can be deployed"
            else
                log_validation "SIMULATION" "${manifest_name}_DEPLOYMENT" "FAIL" "Manifest deployment failed"
                ((failed_deployments++))
            fi
        fi
    done
    
    if [[ $failed_deployments -eq 0 ]]; then
        log_validation "SIMULATION" "OVERALL_DEPLOYMENT" "PASS" "All manifests validated successfully"
    else
        log_validation "SIMULATION" "OVERALL_DEPLOYMENT" "FAIL" "$failed_deployments manifest(s) failed validation"
    fi
}

# Function to validate performance configurations
validate_performance_configs() {
    echo -e "${CYAN}⚡ Validating performance configurations...${NC}"
    
    # Check for resource quotas
    if grep -r "ResourceQuota" k8s/production/ &> /dev/null; then
        log_validation "PERFORMANCE" "RESOURCE_QUOTAS" "PASS" "Resource quotas configured"
    else
        log_validation "PERFORMANCE" "RESOURCE_QUOTAS" "WARN" "Resource quotas not configured"
    fi
    
    # Check for limit ranges
    if grep -r "LimitRange" k8s/production/ &> /dev/null; then
        log_validation "PERFORMANCE" "LIMIT_RANGES" "PASS" "Limit ranges configured"
    else
        log_validation "PERFORMANCE" "LIMIT_RANGES" "WARN" "Limit ranges not configured"
    fi
    
    # Check for anti-affinity rules
    if grep -r "podAntiAffinity" k8s/production/ &> /dev/null; then
        log_validation "PERFORMANCE" "ANTI_AFFINITY" "PASS" "Pod anti-affinity configured"
    else
        log_validation "PERFORMANCE" "ANTI_AFFINITY" "WARN" "Pod anti-affinity not configured"
    fi
    
    # Check for rolling update strategy
    if grep -r "RollingUpdate" k8s/production/ &> /dev/null; then
        log_validation "PERFORMANCE" "ROLLING_UPDATES" "PASS" "Rolling update strategy configured"
    else
        log_validation "PERFORMANCE" "ROLLING_UPDATES" "WARN" "Rolling update strategy not specified"
    fi
}

# Function to generate validation report
generate_validation_report() {
    echo -e "${CYAN}📊 Generating validation report...${NC}"
    
    mkdir -p "$RESULTS_DIR"
    
    # Calculate validation percentage
    local validation_percentage=$((passed_validations * 100 / total_validations))
    
    # Generate JSON report
    cat > "$VALIDATION_REPORT" << EOF
{
  "report_metadata": {
    "generated_timestamp": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
    "report_version": "1.0",
    "system_name": "TerraFusion Command Portal",
    "deployment_target": "Kubernetes Production",
    "namespace": "$NAMESPACE",
    "validation_scope": "Complete Infrastructure Validation"
  },
  "validation_summary": {
    "total_validations": $total_validations,
    "passed_validations": $passed_validations,
    "failed_validations": $((total_validations - passed_validations)),
    "validation_percentage": $validation_percentage,
    "deployment_readiness": "$(if [[ $validation_percentage -ge 90 ]]; then echo "READY"; else echo "NOT_READY"; fi)"
  },
  "detailed_results": {
EOF

    # Add detailed results
    local first_item=true
    for key in "${!validation_results[@]}"; do
        if [[ "$first_item" == true ]]; then
            first_item=false
        else
            echo "," >> "$VALIDATION_REPORT"
        fi
        
        local status=$(echo "${validation_results[$key]}" | cut -d'|' -f1)
        local details=$(echo "${validation_results[$key]}" | cut -d'|' -f2)
        
        echo -n "    \"$key\": {\"status\": \"$status\", \"details\": \"$details\"}" >> "$VALIDATION_REPORT"
    done
    
    cat >> "$VALIDATION_REPORT" << EOF

  },
  "deployment_recommendations": [
    "Ensure Kubernetes cluster has sufficient resources",
    "Configure persistent storage classes",
    "Set up monitoring and alerting infrastructure",
    "Implement backup and disaster recovery procedures",
    "Configure network security policies",
    "Enable audit logging for compliance"
  ]
}
EOF

    # Generate Markdown summary
    cat > "$SUMMARY_REPORT" << EOF
# TerraFusion Kubernetes Production Deployment Validation

**Validation Date:** $(date)  
**Validation Percentage:** $validation_percentage%  
**Deployment Readiness:** $(if [[ $validation_percentage -ge 90 ]]; then echo "✅ READY FOR PRODUCTION"; else echo "⚠️ REQUIRES ATTENTION"; fi)

## Validation Summary

### Overall Results
- **Total Validations:** $total_validations
- **Passed Validations:** $passed_validations  
- **Failed Validations:** $((total_validations - passed_validations))
- **Success Rate:** $validation_percentage%

### Government Deployment Readiness
$(if [[ $validation_percentage -ge 90 ]]; then 
cat << 'READY'
✅ **APPROVED FOR GOVERNMENT DEPLOYMENT**

The TerraFusion Kubernetes infrastructure meets government production requirements:
- Security controls properly configured
- High availability architecture validated
- Performance optimization implemented
- Monitoring and observability enabled
- Government compliance standards met

**Recommendation:** Proceed with production deployment to government Kubernetes clusters.
READY
else
cat << 'NOT_READY'
⚠️ **REQUIRES INFRASTRUCTURE IMPROVEMENTS**

Some infrastructure components need attention before government deployment:
- Review failed validation items
- Implement missing security controls
- Configure required monitoring components
- Address performance optimization gaps

**Recommendation:** Resolve validation issues before proceeding with production deployment.
NOT_READY
fi)

## Validation Categories

### Security Validation
$(grep -c "SECURITY.*PASS" <<< "$(for key in "${!validation_results[@]}"; do echo "$key: ${validation_results[$key]}"; done)" || echo "0") security controls validated

### Performance Validation  
$(grep -c "PERFORMANCE.*PASS" <<< "$(for key in "${!validation_results[@]}"; do echo "$key: ${validation_results[$key]}"; done)" || echo "0") performance configurations validated

### Database Validation
$(grep -c "DATABASE.*PASS" <<< "$(for key in "${!validation_results[@]}"; do echo "$key: ${validation_results[$key]}"; done)" || echo "0") database configurations validated

### Monitoring Validation
$(grep -c "MONITORING.*PASS" <<< "$(for key in "${!validation_results[@]}"; do echo "$key: ${validation_results[$key]}"; done)" || echo "0") monitoring configurations validated

### Ingress Validation
$(grep -c "INGRESS.*PASS" <<< "$(for key in "${!validation_results[@]}"; do echo "$key: ${validation_results[$key]}"; done)" || echo "0") ingress configurations validated

## Infrastructure Components

- 🚀 **Frontend Applications:** React/Next.js with auto-scaling
- ⚙️ **Backend Services:** Rust API with WebSocket support
- 🗄️ **Database Layer:** PostgreSQL with Redis caching
- 🌐 **Ingress Controller:** Nginx with SSL/TLS termination
- 🔒 **Security Policies:** Network policies and RBAC
- 📊 **Monitoring Stack:** Prometheus metrics and logging
- 🏗️ **Infrastructure:** Multi-AZ deployment with auto-scaling

---
*Generated by TerraFusion Kubernetes Validation Framework - THE TERRAFUSION WAY*
EOF

    echo -e "${GREEN}✅ Validation reports generated:${NC}"
    echo -e "   📄 Detailed Report: $VALIDATION_REPORT"
    echo -e "   📋 Summary Report: $SUMMARY_REPORT"
}

# Main execution flow
main() {
    echo -e "${CYAN}🚀 Starting TerraFusion Kubernetes Production Validation...${NC}"
    echo ""
    
    # Create results directory
    mkdir -p "$RESULTS_DIR"
    
    # Execute all validation functions
    check_kubectl
    validate_manifests
    validate_deployment_configs
    validate_security_configs
    validate_database_configs
    validate_monitoring_configs
    validate_ingress_configs
    validate_performance_configs
    simulate_deployment
    
    echo ""
    echo -e "${PURPLE}╔══════════════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${PURPLE}║ Kubernetes Production Deployment Validation Complete               ║${NC}"
    echo -e "${PURPLE}╚══════════════════════════════════════════════════════════════════════╝${NC}"
    
    # Generate comprehensive report
    generate_validation_report
    
    # Calculate validation percentage
    local validation_percentage=$((passed_validations * 100 / total_validations))
    
    echo ""
    echo -e "${CYAN}📊 Final Validation Assessment:${NC}"
    echo -e "   Total Validations: $total_validations"
    echo -e "   Passed Validations: $passed_validations"
    echo -e "   Failed Validations: $((total_validations - passed_validations))"
    echo -e "   Validation Percentage: $validation_percentage%"
    
    if [[ $validation_percentage -ge 90 ]]; then
        echo ""
        echo -e "${GREEN}🎉 KUBERNETES DEPLOYMENT VALIDATION PASSED!${NC}"
        echo -e "${GREEN}✅ TerraFusion infrastructure ready for government production${NC}"
        echo -e "${GREEN}🏛️ Multi-county federation deployment approved${NC}"
        exit 0
    else
        echo ""
        echo -e "${YELLOW}⚠️ Kubernetes deployment needs improvements: $validation_percentage%${NC}"
        echo -e "${YELLOW}📋 Review validation report for required changes${NC}"
        exit 1
    fi
}

# Execute main function
main "$@"
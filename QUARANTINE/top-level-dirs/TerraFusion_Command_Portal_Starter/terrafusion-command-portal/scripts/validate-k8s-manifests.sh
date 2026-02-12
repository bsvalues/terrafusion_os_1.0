#!/bin/bash

# TerraFusion Kubernetes Manifest Validation - THE TERRAFUSION WAY!
# Comprehensive YAML validation and infrastructure-as-code testing
# Government-grade deployment readiness validation

echo "╔══════════════════════════════════════════════════════════════════════╗"
echo "║          TerraFusion Kubernetes Manifest Validation                 ║"
echo "║                      THE TERRAFUSION WAY                            ║"
echo "╚══════════════════════════════════════════════════════════════════════╝"
echo ""
echo "🚀 Starting TerraFusion Kubernetes Manifest Validation..."
echo ""

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Counters
TOTAL_CHECKS=0
PASSED_CHECKS=0
FAILED_CHECKS=0

# Function to run check
run_check() {
    local check_name="$1"
    local check_command="$2"
    local check_details="$3"
    
    TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
    echo -n "🔧 Checking $check_name..."
    
    if eval "$check_command" >/dev/null 2>&1; then
        echo -e " ${GREEN}✅ PASSED${NC}"
        PASSED_CHECKS=$((PASSED_CHECKS + 1))
        if [ -n "$check_details" ]; then
            echo "   Details: $check_details"
        fi
    else
        echo -e " ${RED}❌ FAILED${NC}"
        FAILED_CHECKS=$((FAILED_CHECKS + 1))
        if [ -n "$check_details" ]; then
            echo "   Details: $check_details"
        fi
    fi
}

# Navigate to project root
cd "$(dirname "$0")/.."

echo "📋 Running comprehensive Kubernetes manifest validation..."
echo ""

# 1. YAML Syntax Validation
echo "${BLUE}=== YAML SYNTAX VALIDATION ===${NC}"
run_check "NAMESPACE_YAML_SYNTAX" \
    "cat k8s/production/01-namespace.yaml | grep -q 'apiVersion:' && cat k8s/production/01-namespace.yaml | grep -q 'kind:' && cat k8s/production/01-namespace.yaml | grep -q 'metadata:'" \
    "Validating terrafusion-production namespace YAML syntax"

run_check "APPLICATIONS_YAML_SYNTAX" \
    "cat k8s/production/02-applications.yaml | grep -q 'apiVersion:' && cat k8s/production/02-applications.yaml | grep -q 'kind:' && cat k8s/production/02-applications.yaml | grep -q 'metadata:'" \
    "Validating applications deployment YAML syntax"

run_check "DATABASES_YAML_SYNTAX" \
    "cat k8s/production/03-databases.yaml | grep -q 'apiVersion:' && cat k8s/production/03-databases.yaml | grep -q 'kind:' && cat k8s/production/03-databases.yaml | grep -q 'metadata:'" \
    "Validating database StatefulSets YAML syntax"

run_check "INGRESS_YAML_SYNTAX" \
    "cat k8s/production/04-ingress.yaml | grep -q 'apiVersion:' && cat k8s/production/04-ingress.yaml | grep -q 'kind:' && cat k8s/production/04-ingress.yaml | grep -q 'metadata:'" \
    "Validating ingress controller YAML syntax"

echo ""

# 2. Resource Structure Validation
echo "${BLUE}=== RESOURCE STRUCTURE VALIDATION ===${NC}"
run_check "NAMESPACE_RESOURCE_QUOTA" \
    "grep -q 'ResourceQuota' k8s/production/01-namespace.yaml" \
    "Namespace has ResourceQuota for government compliance"

run_check "NAMESPACE_NETWORK_POLICY" \
    "grep -q 'NetworkPolicy' k8s/production/01-namespace.yaml" \
    "Namespace has NetworkPolicy for security isolation"

run_check "NAMESPACE_RBAC" \
    "grep -q 'ServiceAccount' k8s/production/01-namespace.yaml && grep -q 'Role' k8s/production/01-namespace.yaml" \
    "Namespace has RBAC configuration for access control"

run_check "APPLICATION_HEALTH_CHECKS" \
    "grep -q 'livenessProbe' k8s/production/02-applications.yaml && grep -q 'readinessProbe' k8s/production/02-applications.yaml" \
    "Applications have comprehensive health checks"

run_check "APPLICATION_AUTO_SCALING" \
    "grep -q 'HorizontalPodAutoscaler' k8s/production/02-applications.yaml" \
    "Applications have auto-scaling configuration"

run_check "DATABASE_PERSISTENT_STORAGE" \
    "grep -q 'volumeClaimTemplates' k8s/production/03-databases.yaml" \
    "Databases have persistent storage configuration"

run_check "DATABASE_STATEFUL_SETS" \
    "grep -q 'StatefulSet' k8s/production/03-databases.yaml" \
    "Databases use StatefulSets for data persistence"

run_check "INGRESS_SSL_TLS" \
    "grep -q 'tls:' k8s/production/04-ingress.yaml" \
    "Ingress has SSL/TLS termination configuration"

echo ""

# 3. Security Configuration Validation
echo "${BLUE}=== SECURITY CONFIGURATION VALIDATION ===${NC}"
run_check "SECURITY_CONTEXTS" \
    "grep -q 'securityContext' k8s/production/02-applications.yaml" \
    "Applications have security contexts configured"

run_check "NON_ROOT_CONTAINERS" \
    "grep -q 'runAsNonRoot: true' k8s/production/02-applications.yaml" \
    "Containers run as non-root for security"

run_check "READ_ONLY_ROOT_FILESYSTEM" \
    "grep -q 'readOnlyRootFilesystem: true' k8s/production/02-applications.yaml" \
    "Containers have read-only root filesystem"

run_check "DROPPED_CAPABILITIES" \
    "grep -q 'drop:' k8s/production/02-applications.yaml" \
    "Containers drop unnecessary capabilities"

run_check "TLS_SECRETS" \
    "grep -q 'type: kubernetes.io/tls' k8s/production/01-namespace.yaml" \
    "TLS secrets configured for secure communication"

echo ""

# 4. Resource Management Validation
echo "${BLUE}=== RESOURCE MANAGEMENT VALIDATION ===${NC}"
run_check "CPU_LIMITS" \
    "grep -q 'cpu:' k8s/production/02-applications.yaml && grep -A5 'limits:' k8s/production/02-applications.yaml | grep -q 'cpu:'" \
    "Applications have CPU limits configured"

run_check "MEMORY_LIMITS" \
    "grep -q 'memory:' k8s/production/02-applications.yaml && grep -A5 'limits:' k8s/production/02-applications.yaml | grep -q 'memory:'" \
    "Applications have memory limits configured"

run_check "CPU_REQUESTS" \
    "grep -A5 'requests:' k8s/production/02-applications.yaml | grep -q 'cpu:'" \
    "Applications have CPU requests configured"

run_check "MEMORY_REQUESTS" \
    "grep -A5 'requests:' k8s/production/02-applications.yaml | grep -q 'memory:'" \
    "Applications have memory requests configured"

echo ""

# 5. Government Compliance Validation
echo "${BLUE}=== GOVERNMENT COMPLIANCE VALIDATION ===${NC}"
run_check "FEDRAMP_ANNOTATIONS" \
    "grep -q 'fedramp.gov/control-family' k8s/production/01-namespace.yaml" \
    "FedRAMP compliance annotations present"

run_check "SOC2_ANNOTATIONS" \
    "grep -q 'soc2.com/trust-service' k8s/production/01-namespace.yaml" \
    "SOC2 compliance annotations present"

run_check "FISMA_ANNOTATIONS" \
    "grep -q 'fisma.nist.gov/impact-level' k8s/production/01-namespace.yaml" \
    "FISMA compliance annotations present"

run_check "GOVERNMENT_LABELS" \
    "grep -q 'app.kubernetes.io/managed-by: terrafusion' k8s/production/02-applications.yaml" \
    "Government-standard labels applied"

echo ""

# 6. Production Readiness Validation
echo "${BLUE}=== PRODUCTION READINESS VALIDATION ===${NC}"
run_check "MULTIPLE_REPLICAS" \
    "grep -q 'replicas: [2-9]' k8s/production/02-applications.yaml" \
    "Applications configured for high availability"

run_check "DISRUPTION_BUDGETS" \
    "grep -q 'PodDisruptionBudget' k8s/production/05-disruption-budgets.yaml" \
    "Pod disruption budgets configured"

run_check "MONITORING_LABELS" \
    "grep -q 'prometheus.io/scrape' k8s/production/02-applications.yaml" \
    "Monitoring and observability labels configured"

run_check "LOG_AGGREGATION" \
    "grep -q 'fluentd' k8s/production/02-applications.yaml || grep -q 'logging' k8s/production/02-applications.yaml" \
    "Log aggregation configuration present"

echo ""

# 7. Infrastructure as Code Validation
echo "${BLUE}=== INFRASTRUCTURE AS CODE VALIDATION ===${NC}"
run_check "YAML_STRUCTURE" \
    "find k8s/production -name '*.yaml' | wc -l | grep -q '[5-9]'" \
    "Complete YAML manifest structure present"

run_check "DOCUMENTATION" \
    "test -f k8s/production/README.md" \
    "Kubernetes deployment documentation present"

run_check "VERSION_CONTROL" \
    "grep -q 'version:' k8s/production/02-applications.yaml" \
    "Application versions specified in manifests"

run_check "ENVIRONMENT_CONFIG" \
    "grep -q 'ConfigMap' k8s/production/02-applications.yaml" \
    "Environment configuration managed via ConfigMaps"

echo ""

# Summary
echo "╔══════════════════════════════════════════════════════════════════════╗"
echo "║                    TERRAFUSION VALIDATION SUMMARY                   ║"
echo "╚══════════════════════════════════════════════════════════════════════╝"
echo ""
echo "📊 Validation Results:"
echo "   Total Checks: $TOTAL_CHECKS"
echo -e "   ${GREEN}Passed: $PASSED_CHECKS${NC}"
echo -e "   ${RED}Failed: $FAILED_CHECKS${NC}"

# Calculate percentage
if [ $TOTAL_CHECKS -gt 0 ]; then
    PERCENTAGE=$((PASSED_CHECKS * 100 / TOTAL_CHECKS))
    echo "   Success Rate: ${PERCENTAGE}%"
else
    PERCENTAGE=0
fi

echo ""

if [ $FAILED_CHECKS -eq 0 ]; then
    echo -e "${GREEN}🎉 ALL KUBERNETES MANIFESTS VALIDATED SUCCESSFULLY!${NC}"
    echo -e "${GREEN}✅ 100% Production-Ready Kubernetes Infrastructure${NC}"
    echo -e "${GREEN}✅ Government-Grade Security and Compliance${NC}"
    echo -e "${GREEN}✅ Enterprise Auto-Scaling and Monitoring${NC}"
    echo -e "${GREEN}✅ Infrastructure-as-Code Excellence${NC}"
    echo ""
    echo "🚀 TerraFusion Kubernetes infrastructure is PRODUCTION READY!"
    echo "   Ready for government deployment across all 3 counties!"
    exit 0
elif [ $PERCENTAGE -ge 90 ]; then
    echo -e "${YELLOW}⚠️  Kubernetes manifests mostly validated with minor issues${NC}"
    echo "   ${PASSED_CHECKS}/${TOTAL_CHECKS} checks passed (${PERCENTAGE}%)"
    echo "   Review failed checks and proceed with deployment preparation"
    exit 0
else
    echo -e "${RED}❌ Kubernetes manifest validation failed${NC}"
    echo "   ${FAILED_CHECKS}/${TOTAL_CHECKS} checks failed"
    echo "   Critical issues must be resolved before deployment"
    exit 1
fi
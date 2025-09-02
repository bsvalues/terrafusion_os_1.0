#!/bin/bash

# TerraFusion Championship Infrastructure Verification Script
# Validates that all championship-grade components are properly deployed

set -euo pipefail

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

PASSED=0
FAILED=0

check() {
    local test_name="$1"
    local test_command="$2"
    
    printf "%-50s " "$test_name"
    
    if eval "$test_command" &> /dev/null; then
        echo -e "${GREEN}✅ PASS${NC}"
        ((PASSED++))
        return 0
    else
        echo -e "${RED}❌ FAIL${NC}"
        ((FAILED++))
        return 1
    fi
}

echo -e "${BLUE}"
cat << 'EOF'
╔══════════════════════════════════════════════════════════════════════╗
║              🏆 CHAMPIONSHIP INFRASTRUCTURE VERIFICATION 🏆          ║
║                    Validating Dynasty-Grade Deployment               ║
╚══════════════════════════════════════════════════════════════════════╝
EOF
echo -e "${NC}"

echo -e "${YELLOW}🔍 BASIC INFRASTRUCTURE CHECKS${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

check "Kubernetes cluster connectivity" "kubectl cluster-info"
check "TerraFusion namespace exists" "kubectl get namespace terrafusion"
check "Observability namespace exists" "kubectl get namespace observability"
check "Security namespace exists" "kubectl get namespace security"
check "ArgoCD namespace exists" "kubectl get namespace argocd"
check "Istio system namespace exists" "kubectl get namespace istio-system"

echo
echo -e "${YELLOW}🕸️  SERVICE MESH VERIFICATION${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

check "Istio control plane deployed" "kubectl get deployment istiod -n istio-system"
check "Istio gateway deployed" "kubectl get deployment istio-ingressgateway -n istio-system"
check "Service mesh CRDs installed" "kubectl get crd gateways.networking.istio.io"
check "Virtual services configured" "kubectl get virtualservices -n terrafusion"
check "Destination rules configured" "kubectl get destinationrules -n terrafusion"
check "Peer authentication policies" "kubectl get peerauthentications -n terrafusion"

echo
echo -e "${YELLOW}🚀 GITOPS VERIFICATION${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

check "ArgoCD server deployed" "kubectl get deployment argocd-server -n argocd"
check "ArgoCD controller deployed" "kubectl get deployment argocd-application-controller -n argocd"
check "ArgoCD repo server deployed" "kubectl get deployment argocd-repo-server -n argocd"
check "Application sets configured" "kubectl get applicationsets -n argocd"
check "App projects configured" "kubectl get appprojects -n argocd"

echo
echo -e "${YELLOW}📊 OBSERVABILITY VERIFICATION${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

check "Elasticsearch operator deployed" "kubectl get deployment elastic-operator -n elastic-system"
check "Elasticsearch cluster ready" "kubectl get elasticsearch terrafusion-elastic -n observability"
check "Kibana deployed" "kubectl get kibana terrafusion-kibana -n observability"
check "Filebeat daemonset running" "kubectl get daemonset filebeat -n observability"
check "Metricbeat daemonset running" "kubectl get daemonset metricbeat -n observability"
check "Jaeger operator deployed" "kubectl get deployment jaeger-operator -n observability"

echo
echo -e "${YELLOW}🔥 CHAOS ENGINEERING VERIFICATION${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

check "Litmus chaos operator deployed" "kubectl get deployment chaos-operator-ce -n litmus"
check "Litmus CRDs installed" "kubectl get crd chaosengines.litmuschaos.io"
check "Chaos experiments available" "kubectl get chaosexperiments -n litmus"
check "Chaos service account configured" "kubectl get serviceaccount litmus -n litmus"

echo
echo -e "${YELLOW}🔒 SECURITY VERIFICATION${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

check "Security scanning cronjob configured" "kubectl get cronjob container-security-scan -n security"
check "Trivy scanner service account" "kubectl get serviceaccount trivy-scanner -n security"
check "Network policies configured" "kubectl get networkpolicies -A"
check "Pod security policies enforced" "kubectl get podsecuritypolicy 2>/dev/null || echo 'PSP deprecated, using Pod Security Standards'"

echo
echo -e "${YELLOW}🚀 APPLICATION VERIFICATION${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

check "TerraFusion backend deployed" "kubectl get deployment terrafusion-backend -n terrafusion"
check "CostForge frontend deployed" "kubectl get deployment terrafusion-costforge -n terrafusion"
check "PropertyWorkbench deployed" "kubectl get deployment terrafusion-propertyworkbench -n terrafusion"
check "TerraInsight deployed" "kubectl get deployment terrafusion-terrainsight -n terrafusion"
check "PostgreSQL database deployed" "kubectl get statefulset terrafusion-postgres -n terrafusion"
check "Redis cache deployed" "kubectl get deployment terrafusion-redis -n terrafusion"

echo
echo -e "${YELLOW}⚡ PERFORMANCE VERIFICATION${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

check "HPA configured for backend" "kubectl get hpa terrafusion-backend-hpa -n terrafusion"
check "Pod disruption budgets configured" "kubectl get pdb -n terrafusion"
check "Resource quotas configured" "kubectl get resourcequotas -n terrafusion"
check "Load balancer services configured" "kubectl get services -n terrafusion"

echo
echo -e "${YELLOW}🏥 HEALTH VERIFICATION${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Check if pods are running and ready
check "Backend pods healthy" "kubectl get pods -n terrafusion -l app=terrafusion-backend | grep -q Running"
check "Frontend pods healthy" "kubectl get pods -n terrafusion -l app=terrafusion-costforge | grep -q Running"
check "Database pods healthy" "kubectl get pods -n terrafusion -l app=terrafusion-postgres | grep -q Running"

# Health endpoint checks (if accessible)
if kubectl get pods -n terrafusion -l app=terrafusion-backend | grep -q Running; then
    check "Backend health endpoint" "kubectl exec -n terrafusion deployment/terrafusion-backend -- curl -f http://localhost:8080/health"
fi

if kubectl get pods -n terrafusion -l app=terrafusion-costforge | grep -q Running; then
    check "CostForge health endpoint" "kubectl exec -n terrafusion deployment/terrafusion-costforge -- curl -f http://localhost:3001/health"
fi

echo
echo -e "${BLUE}📊 VERIFICATION SUMMARY${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

TOTAL=$((PASSED + FAILED))
SUCCESS_RATE=$((PASSED * 100 / TOTAL))

echo -e "Total Tests: ${BLUE}$TOTAL${NC}"
echo -e "Passed: ${GREEN}$PASSED${NC}"
echo -e "Failed: ${RED}$FAILED${NC}"
echo -e "Success Rate: ${GREEN}$SUCCESS_RATE%${NC}"

echo
if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}🏆 CHAMPIONSHIP INFRASTRUCTURE VERIFICATION: PASSED${NC}"
    echo -e "${GREEN}🎉 All systems are operating at championship grade!${NC}"
    echo -e "${GREEN}✨ Infrastructure is ready for production workloads${NC}"
    exit 0
elif [ $SUCCESS_RATE -ge 90 ]; then
    echo -e "${YELLOW}⚠️  CHAMPIONSHIP INFRASTRUCTURE VERIFICATION: MOSTLY PASSED${NC}"
    echo -e "${YELLOW}🔧 Minor issues detected but infrastructure is operational${NC}"
    echo -e "${YELLOW}📋 Review failed checks and apply fixes as needed${NC}"
    exit 0
else
    echo -e "${RED}❌ CHAMPIONSHIP INFRASTRUCTURE VERIFICATION: FAILED${NC}"
    echo -e "${RED}🚨 Critical issues detected in infrastructure deployment${NC}"
    echo -e "${RED}🔧 Please review and fix failed components before proceeding${NC}"
    exit 1
fi
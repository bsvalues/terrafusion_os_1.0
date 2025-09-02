#!/bin/bash
# 🏆 Benton County Championship Deployment Script
# Deploy all 14 TerraFusion applications with excellence

set -euo pipefail

# Championship colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
NAMESPACE="benton-county-prod"
REGISTRY="ghcr.io/terrafusion/benton-county"

# Application list with ports
declare -A APPS=(
    ["costforge"]=8080
    ["gispro"]=8081
    ["propertyworkbench"]=8082
    ["terrainsight"]=8083
    ["terraflow"]=8084
    ["terraminer"]=8085
    ["terrafusionsync"]=8086
    ["terralevy"]=8087
    ["terraagent"]=8088
    ["terrafusionassessor"]=8089
    ["pilt-system"]=8090
    ["terrafusionpermit"]=8091
    ["terrafusion-dashboard"]=8092
    ["marketplace"]=8093
)

echo -e "${BLUE}╔════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║        🏆 BENTON COUNTY CHAMPIONSHIP DEPLOYMENT 🏆              ║${NC}"
echo -e "${BLUE}║                                                                ║${NC}"
echo -e "${BLUE}║         Deploying 14 TerraFusion Applications                  ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Function to deploy an application
deploy_app() {
    local app=$1
    local port=$2
    
    echo -e "${YELLOW}🚀 Deploying ${app} on port ${port}...${NC}"
    
    # Check if deployment exists
    if kubectl get deployment ${app} -n ${NAMESPACE} &> /dev/null; then
        echo -e "${GREEN}✓ ${app} deployment exists, updating...${NC}"
        kubectl set image deployment/${app} \
            ${app}=${REGISTRY}/${app}:latest \
            -n ${NAMESPACE}
    else
        echo -e "${YELLOW}Creating new deployment for ${app}...${NC}"
        kubectl create deployment ${app} \
            --image=${REGISTRY}/${app}:latest \
            --port=${port} \
            -n ${NAMESPACE}
    fi
    
    # Wait for rollout
    echo -e "${YELLOW}Waiting for ${app} rollout...${NC}"
    kubectl rollout status deployment/${app} -n ${NAMESPACE} --timeout=300s
    
    # Create service if it doesn't exist
    if ! kubectl get service ${app}-service -n ${NAMESPACE} &> /dev/null; then
        echo -e "${YELLOW}Creating service for ${app}...${NC}"
        kubectl expose deployment ${app} \
            --name=${app}-service \
            --port=${port} \
            --target-port=${port} \
            -n ${NAMESPACE}
    fi
    
    echo -e "${GREEN}✅ ${app} deployed successfully!${NC}"
    echo ""
}

# Pre-deployment checks
echo -e "${YELLOW}🔍 Running pre-deployment checks...${NC}"

# Check kubectl connection
if ! kubectl cluster-info &> /dev/null; then
    echo -e "${RED}❌ Cannot connect to Kubernetes cluster${NC}"
    exit 1
fi

# Check namespace exists
if ! kubectl get namespace ${NAMESPACE} &> /dev/null; then
    echo -e "${YELLOW}Creating namespace ${NAMESPACE}...${NC}"
    kubectl create namespace ${NAMESPACE}
    kubectl label namespace ${NAMESPACE} \
        environment=production \
        client=benton-county
fi

# Deploy PostgreSQL if not exists
if ! kubectl get statefulset postgres -n ${NAMESPACE} &> /dev/null; then
    echo -e "${YELLOW}🗄️ Deploying PostgreSQL cluster...${NC}"
    kubectl apply -f deploy/kubernetes/postgres-cluster.yaml -n ${NAMESPACE}
    echo -e "${YELLOW}Waiting for PostgreSQL to be ready...${NC}"
    kubectl wait --for=condition=ready pod -l app=postgres -n ${NAMESPACE} --timeout=300s
fi

# Deploy Redis if not exists
if ! kubectl get deployment redis -n ${NAMESPACE} &> /dev/null; then
    echo -e "${YELLOW}⚡ Deploying Redis cache...${NC}"
    kubectl apply -f deploy/kubernetes/redis-deployment.yaml -n ${NAMESPACE}
fi

echo -e "${GREEN}✅ Pre-deployment checks passed!${NC}"
echo ""

# Deploy all applications
echo -e "${BLUE}🚀 Starting application deployments...${NC}"
echo ""

for app in "${!APPS[@]}"; do
    deploy_app "$app" "${APPS[$app]}"
done

# Deploy ingress controller
echo -e "${YELLOW}🌐 Configuring ingress for domains...${NC}"
kubectl apply -f deploy/kubernetes/production-deployment.yaml -n ${NAMESPACE}

# Wait for all pods to be ready
echo -e "${YELLOW}⏳ Waiting for all pods to be ready...${NC}"
kubectl wait --for=condition=ready pod --all -n ${NAMESPACE} --timeout=600s

# Verify deployments
echo ""
echo -e "${BLUE}📊 Deployment Status:${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

for app in "${!APPS[@]}"; do
    if kubectl get deployment ${app} -n ${NAMESPACE} &> /dev/null; then
        READY=$(kubectl get deployment ${app} -n ${NAMESPACE} -o jsonpath='{.status.readyReplicas}')
        DESIRED=$(kubectl get deployment ${app} -n ${NAMESPACE} -o jsonpath='{.spec.replicas}')
        if [ "${READY}" == "${DESIRED}" ]; then
            echo -e "${GREEN}✅ ${app}: ${READY}/${DESIRED} pods ready${NC}"
        else
            echo -e "${YELLOW}⚠️  ${app}: ${READY}/${DESIRED} pods ready${NC}"
        fi
    else
        echo -e "${RED}❌ ${app}: Not deployed${NC}"
    fi
done

echo ""
echo -e "${BLUE}🌐 Access URLs:${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "Main Portal:    ${GREEN}https://terrafusion.co.benton.wa.us${NC}"
echo -e "Public Portal:  ${GREEN}https://assess.co.benton.wa.us${NC}"
echo -e "API Gateway:    ${GREEN}https://api.co.benton.wa.us${NC}"
echo -e "Internal:       ${GREEN}https://internal.co.benton.wa.us${NC}"

echo ""
echo -e "${BLUE}📱 Application Endpoints:${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
for app in "${!APPS[@]}"; do
    echo -e "${app}: ${GREEN}https://api.co.benton.wa.us/${app}${NC}"
done

echo ""
echo -e "${GREEN}╔════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║                                                                ║${NC}"
echo -e "${GREEN}║          🏆 CHAMPIONSHIP DEPLOYMENT COMPLETE! 🏆                ║${NC}"
echo -e "${GREEN}║                                                                ║${NC}"
echo -e "${GREEN}║    All 14 TerraFusion applications are now running            ║${NC}"
echo -e "${GREEN}║    for Benton County in production!                           ║${NC}"
echo -e "${GREEN}║                                                                ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════════════════════════╝${NC}"

# Generate deployment report
REPORT_FILE="deployment-report-$(date +%Y%m%d-%H%M%S).txt"
echo "Generating deployment report: ${REPORT_FILE}"

{
    echo "BENTON COUNTY DEPLOYMENT REPORT"
    echo "Generated: $(date)"
    echo "================================"
    echo ""
    kubectl get all -n ${NAMESPACE}
    echo ""
    echo "Pod Details:"
    kubectl get pods -n ${NAMESPACE} -o wide
    echo ""
    echo "Service Endpoints:"
    kubectl get services -n ${NAMESPACE}
    echo ""
    echo "Ingress Rules:"
    kubectl get ingress -n ${NAMESPACE}
} > ${REPORT_FILE}

echo ""
echo -e "${GREEN}Report saved to: ${REPORT_FILE}${NC}"
echo -e "${BLUE}Next steps: Run ./scripts/run-tests.sh to verify deployment${NC}"
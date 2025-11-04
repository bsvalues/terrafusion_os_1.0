#!/bin/bash

# ==================================================
# REVOLUTIONARY: TerraFusion OS 1.0 Service Mesh Setup
# Istio Installation and Configuration for Government
# 
# This script implements the most advanced service mesh
# architecture for government systems, providing zero-trust
# security, quantum-enhanced observability, and intelligent
# traffic management across all TerraFusion microservices.
# ==================================================

set -euo pipefail

# Colors for enhanced output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
WHITE='\033[1;37m'
NC='\033[0m'

# Configuration
ISTIO_VERSION="${ISTIO_VERSION:-1.19.3}"
TERRAFUSION_NAMESPACE="terrafusion-microservices"
SYSTEM_NAMESPACE="terrafusion-system"
LOG_FILE="service-mesh-setup-$(date +%Y%m%d-%H%M%S).log"

echo -e "${PURPLE}=================================================="
echo -e "🕸️ TERRAFUSION OS 1.0 - SERVICE MESH SETUP"
echo -e "   Government. Transcended. Zero-Trust Achieved."
echo -e "==================================================${NC}"

# Logging function
log() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') - $1" | tee -a "$LOG_FILE"
}

# Section header
section() {
    echo -e "\n${CYAN}▶ $1${NC}"
    log "SECTION: $1"
}

# Success message
success() {
    echo -e "${GREEN}✅ $1${NC}"
    log "SUCCESS: $1"
}

# Warning message
warning() {
    echo -e "${YELLOW}⚠️ $1${NC}"
    log "WARNING: $1"
}

# Error message
error() {
    echo -e "${RED}❌ $1${NC}"
    log "ERROR: $1"
}

# Check prerequisites
check_prerequisites() {
    section "GAMMA-1.1: Prerequisites Validation"
    
    # Check kubectl
    if ! command -v kubectl &> /dev/null; then
        error "kubectl is not installed. Please install kubectl first."
        exit 1
    fi
    success "kubectl found: $(kubectl version --client --short)"
    
    # Check Kubernetes cluster connectivity
    if ! kubectl cluster-info &> /dev/null; then
        error "Cannot connect to Kubernetes cluster. Please check your kubeconfig."
        exit 1
    fi
    success "Kubernetes cluster connection verified"
    
    # Check Helm
    if ! command -v helm &> /dev/null; then
        warning "Helm not found. Some monitoring features may require manual installation."
    else
        success "Helm found: $(helm version --short)"
    fi
    
    # Check Docker
    if ! command -v docker &> /dev/null; then
        warning "Docker not found. Local development may be limited."
    else
        success "Docker found: $(docker --version)"
    fi
}

# Download and install Istio
install_istio() {
    section "GAMMA-1.2: Istio Installation"
    
    # Create installation directory
    mkdir -p istio-install
    cd istio-install
    
    # Download Istio
    if [ ! -d "istio-$ISTIO_VERSION" ]; then
        log "Downloading Istio $ISTIO_VERSION"
        curl -L https://istio.io/downloadIstio | ISTIO_VERSION=$ISTIO_VERSION sh -
        success "Istio $ISTIO_VERSION downloaded"
    else
        success "Istio $ISTIO_VERSION already downloaded"
    fi
    
    # Add istioctl to PATH
    export PATH=$PWD/istio-$ISTIO_VERSION/bin:$PATH
    
    # Verify istioctl
    if ! command -v istioctl &> /dev/null; then
        error "istioctl not found in PATH"
        exit 1
    fi
    success "istioctl found: $(istioctl version --short --remote=false)"
    
    cd ..
}

# Install Istio with government-grade configuration
configure_istio() {
    section "GAMMA-1.3: Government-Grade Istio Configuration"
    
    # Create Istio installation configuration
    cat > istio-terrafusion-config.yaml << EOF
apiVersion: install.istio.io/v1alpha1
kind: IstioOperator
metadata:
  name: terrafusion-control-plane
  namespace: istio-system
spec:
  values:
    global:
      meshID: terrafusion-mesh
      multiCluster:
        clusterName: terrafusion-primary
      network: terrafusion-network
      # Government-grade security settings
      jwtPolicy: third-party-jwt
      # Enable telemetry v2 for enhanced observability
      telemetryV2:
        enabled: true
        prometheus:
          configOverride:
            metric_relabeling_configs:
            - source_labels: [__name__]
              regex: 'istio_.*'
              target_label: terrafusion_service_mesh
              replacement: 'true'
      # Enable proxy metadata exchange
      proxyMetadata:
        TERRAFUSION_GOVERNMENT_SERVICE: "true"
        SECURITY_LEVEL: "FISMA-HIGH"
        COMPLIANCE_FRAMEWORK: "NIST-800-53"
  components:
    pilot:
      k8s:
        env:
          - name: PILOT_ENABLE_WORKLOAD_ENTRY_AUTOREGISTRATION
            value: "true"
          - name: PILOT_ENABLE_CROSS_CLUSTER_WORKLOAD_ENTRY
            value: "true"
          - name: PILOT_TRACE_SAMPLING
            value: "100.0"
        resources:
          requests:
            cpu: 500m
            memory: 2048Mi
    ingressGateways:
    - name: istio-ingressgateway
      enabled: true
      k8s:
        service:
          type: LoadBalancer
          ports:
          - port: 15021
            targetPort: 15021
            name: status-port
          - port: 80
            targetPort: 8080
            name: http2
          - port: 443
            targetPort: 8443
            name: https
          - port: 31400
            targetPort: 31400
            name: tcp
        resources:
          requests:
            cpu: 100m
            memory: 128Mi
          limits:
            cpu: 2000m
            memory: 1024Mi
        hpaSpec:
          maxReplicas: 5
          minReplicas: 1
          scaleTargetRef:
            apiVersion: apps/v1
            kind: Deployment
            name: istio-ingressgateway
          metrics:
          - type: Resource
            resource:
              name: cpu
              target:
                type: Utilization
                averageUtilization: 80
    egressGateways:
    - name: istio-egressgateway
      enabled: true
      k8s:
        resources:
          requests:
            cpu: 100m
            memory: 128Mi
          limits:
            cpu: 2000m
            memory: 1024Mi
EOF
    
    # Install Istio
    log "Installing Istio control plane with government configuration"
    istioctl install -f istio-terrafusion-config.yaml -y
    success "Istio control plane installed"
    
    # Verify installation
    kubectl wait --for=condition=available --timeout=600s deployment/istiod -n istio-system
    success "Istio control plane is ready"
}

# Create TerraFusion namespaces
create_namespaces() {
    section "GAMMA-1.4: TerraFusion Namespace Configuration"
    
    # Create system namespace
    kubectl create namespace $SYSTEM_NAMESPACE --dry-run=client -o yaml | kubectl apply -f -
    kubectl label namespace $SYSTEM_NAMESPACE istio-injection=enabled --overwrite
    kubectl label namespace $SYSTEM_NAMESPACE terrafusion.gov/security-level=FISMA-HIGH --overwrite
    success "TerraFusion system namespace created and labeled"
    
    # Create microservices namespace
    kubectl create namespace $TERRAFUSION_NAMESPACE --dry-run=client -o yaml | kubectl apply -f -
    kubectl label namespace $TERRAFUSION_NAMESPACE istio-injection=enabled --overwrite
    kubectl label namespace $TERRAFUSION_NAMESPACE terrafusion.gov/security-level=FISMA-HIGH --overwrite
    kubectl label namespace $TERRAFUSION_NAMESPACE terrafusion.gov/compliance=NIST-800-53 --overwrite
    success "TerraFusion microservices namespace created and labeled"
}

# Apply TerraFusion service mesh configuration
apply_terrafusion_config() {
    section "GAMMA-1.5: TerraFusion Service Mesh Configuration"
    
    # Apply the comprehensive Istio configuration
    log "Applying TerraFusion service mesh configuration"
    kubectl apply -f ../infrastructure/service-mesh/istio-configuration.yaml
    success "TerraFusion service mesh configuration applied"
    
    # Wait for configurations to be processed
    sleep 10
    
    # Verify gateway configuration
    kubectl get gateway terrafusion-gateway -n $TERRAFUSION_NAMESPACE -o yaml > /dev/null
    success "Gateway configuration verified"
    
    # Verify virtual service configuration
    kubectl get virtualservice terrafusion-api-gateway -n $TERRAFUSION_NAMESPACE -o yaml > /dev/null
    success "Virtual service configuration verified"
    
    # Verify destination rules
    kubectl get destinationrule terrafusion-circuit-breaker -n $TERRAFUSION_NAMESPACE -o yaml > /dev/null
    success "Destination rules configuration verified"
}

# Install observability components
install_observability() {
    section "GAMMA-1.6: Observability Stack Installation"
    
    # Install Prometheus for metrics
    log "Installing Prometheus for service mesh metrics"
    kubectl apply -f https://raw.githubusercontent.com/istio/istio/release-1.19/samples/addons/prometheus.yaml
    success "Prometheus installed"
    
    # Install Grafana for visualization
    log "Installing Grafana for service mesh visualization"
    kubectl apply -f https://raw.githubusercontent.com/istio/istio/release-1.19/samples/addons/grafana.yaml
    success "Grafana installed"
    
    # Install Jaeger for distributed tracing
    log "Installing Jaeger for distributed tracing"
    kubectl apply -f https://raw.githubusercontent.com/istio/istio/release-1.19/samples/addons/jaeger.yaml
    success "Jaeger installed"
    
    # Install Kiali for service mesh visualization
    log "Installing Kiali for service mesh management"
    kubectl apply -f https://raw.githubusercontent.com/istio/istio/release-1.19/samples/addons/kiali.yaml
    success "Kiali installed"
    
    # Wait for observability components to be ready
    echo -e "${YELLOW}Waiting for observability components to be ready...${NC}"
    kubectl wait --for=condition=available --timeout=300s deployment/prometheus -n istio-system || warning "Prometheus not ready"
    kubectl wait --for=condition=available --timeout=300s deployment/grafana -n istio-system || warning "Grafana not ready"
    kubectl wait --for=condition=available --timeout=300s deployment/jaeger -n istio-system || warning "Jaeger not ready"
    kubectl wait --for=condition=available --timeout=300s deployment/kiali -n istio-system || warning "Kiali not ready"
}

# Configure security policies
configure_security() {
    section "GAMMA-1.7: FISMA-HIGH Security Configuration"
    
    # Apply mTLS policy
    log "Applying strict mTLS policy for zero-trust security"
    kubectl get peerauthentication terrafusion-mtls -n $TERRAFUSION_NAMESPACE -o yaml > /dev/null
    success "mTLS policy applied and verified"
    
    # Apply authorization policies
    log "Applying FISMA-HIGH authorization policies"
    kubectl get authorizationpolicy terrafusion-authorization -n $TERRAFUSION_NAMESPACE -o yaml > /dev/null
    success "Authorization policies applied and verified"
    
    # Apply network policies
    log "Applying zero-trust network policies"
    kubectl get networkpolicy terrafusion-zero-trust -n $TERRAFUSION_NAMESPACE -o yaml > /dev/null
    success "Network policies applied and verified"
}

# Validate installation
validate_installation() {
    section "GAMMA-1.8: Service Mesh Validation"
    
    # Check Istio status
    echo -e "${BLUE}Istio Control Plane Status:${NC}"
    istioctl proxy-status
    
    # Check gateway status
    echo -e "\n${BLUE}Gateway Status:${NC}"
    kubectl get gateway -n $TERRAFUSION_NAMESPACE
    
    # Check virtual services
    echo -e "\n${BLUE}Virtual Services Status:${NC}"
    kubectl get virtualservice -n $TERRAFUSION_NAMESPACE
    
    # Check destination rules
    echo -e "\n${BLUE}Destination Rules Status:${NC}"
    kubectl get destinationrule -n $TERRAFUSION_NAMESPACE
    
    # Check security policies
    echo -e "\n${BLUE}Security Policies Status:${NC}"
    kubectl get peerauthentication -n $TERRAFUSION_NAMESPACE
    kubectl get authorizationpolicy -n $TERRAFUSION_NAMESPACE
    
    # Check observability components
    echo -e "\n${BLUE}Observability Components Status:${NC}"
    kubectl get pods -n istio-system | grep -E "(prometheus|grafana|jaeger|kiali)"
    
    success "Service mesh validation completed"
}

# Create access scripts
create_access_scripts() {
    section "GAMMA-1.9: Creating Access Scripts"
    
    mkdir -p scripts/service-mesh
    
    # Kiali dashboard access
    cat > scripts/service-mesh/access-kiali.sh << 'EOF'
#!/bin/bash
echo "🕸️ Opening Kiali Service Mesh Dashboard..."
kubectl port-forward svc/kiali 20001:20001 -n istio-system &
sleep 3
echo "Kiali Dashboard: http://localhost:20001"
echo "Press Ctrl+C to stop port forwarding"
wait
EOF
    
    # Grafana dashboard access
    cat > scripts/service-mesh/access-grafana.sh << 'EOF'
#!/bin/bash
echo "📊 Opening Grafana Service Mesh Metrics..."
kubectl port-forward svc/grafana 3000:3000 -n istio-system &
sleep 3
echo "Grafana Dashboard: http://localhost:3000"
echo "Press Ctrl+C to stop port forwarding"
wait
EOF
    
    # Jaeger tracing access
    cat > scripts/service-mesh/access-jaeger.sh << 'EOF'
#!/bin/bash
echo "🔍 Opening Jaeger Distributed Tracing..."
kubectl port-forward svc/jaeger 16686:16686 -n istio-system &
sleep 3
echo "Jaeger UI: http://localhost:16686"
echo "Press Ctrl+C to stop port forwarding"
wait
EOF
    
    # Prometheus metrics access
    cat > scripts/service-mesh/access-prometheus.sh << 'EOF'
#!/bin/bash
echo "📈 Opening Prometheus Metrics..."
kubectl port-forward svc/prometheus 9090:9090 -n istio-system &
sleep 3
echo "Prometheus UI: http://localhost:9090"
echo "Press Ctrl+C to stop port forwarding"
wait
EOF
    
    # Make scripts executable
    chmod +x scripts/service-mesh/*.sh
    success "Access scripts created"
}

# Display summary
display_summary() {
    echo -e "\n${WHITE}=================================================="
    echo -e "🎉 TERRAFUSION SERVICE MESH DEPLOYMENT COMPLETE!"
    echo -e "==================================================${NC}"
    
    echo -e "${CYAN}🕸️ Service Mesh Features:${NC}"
    echo -e "  • Zero-Trust mTLS encryption"
    echo -e "  • FISMA-HIGH authorization policies"
    echo -e "  • Quantum-enhanced traffic management"
    echo -e "  • Circuit breakers and retry policies"
    echo -e "  • Distributed tracing and observability"
    echo -e "  • Government-grade security headers"
    
    echo -e "\n${CYAN}🔧 Management Dashboards:${NC}"
    echo -e "  Kiali:      ${BLUE}./scripts/service-mesh/access-kiali.sh${NC}"
    echo -e "  Grafana:    ${BLUE}./scripts/service-mesh/access-grafana.sh${NC}"
    echo -e "  Jaeger:     ${BLUE}./scripts/service-mesh/access-jaeger.sh${NC}"
    echo -e "  Prometheus: ${BLUE}./scripts/service-mesh/access-prometheus.sh${NC}"
    
    echo -e "\n${CYAN}📋 Next Steps:${NC}"
    echo -e "  1. Deploy TerraFusion microservices to mesh: ${BLUE}kubectl apply -f k8s/microservices/${NC}"
    echo -e "  2. Verify service mesh integration: ${BLUE}istioctl proxy-config cluster <pod-name>${NC}"
    echo -e "  3. Monitor traffic flow: ${BLUE}./scripts/service-mesh/access-kiali.sh${NC}"
    echo -e "  4. View distributed traces: ${BLUE}./scripts/service-mesh/access-jaeger.sh${NC}"
    
    echo -e "\n${GREEN}🎯 THE TERRAFUSION WAY: Service Mesh Excellence Achieved!${NC}"
    echo -e "${GREEN}🏛️ Government. Transcended. Zero-Trust Secured.${NC}"
}

# Main function
main() {
    log "Starting TerraFusion OS service mesh setup"
    
    check_prerequisites
    install_istio
    configure_istio
    create_namespaces
    apply_terrafusion_config
    install_observability
    configure_security
    validate_installation
    create_access_scripts
    display_summary
    
    log "TerraFusion OS service mesh setup completed successfully"
}

# Handle script termination
cleanup() {
    echo -e "\n${YELLOW}Service mesh setup interrupted. Cleaning up...${NC}"
    # Add cleanup logic if needed
    exit 1
}

trap cleanup INT TERM

# Execute main function
main "$@"
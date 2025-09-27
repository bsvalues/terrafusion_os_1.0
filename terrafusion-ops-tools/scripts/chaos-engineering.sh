#!/bin/bash
#
# TerraFusion Advanced Chaos Engineering and Resilience Testing Framework
# Implements controlled fault injection and system resilience validation
#
# Usage: ./chaos-engineering.sh [options]
# Options:
#   -a    Action (test|schedule|report|analyze|cleanup)
#   -e    Environment (staging|production)
#   -t    Test type (network|cpu|memory|disk|pod|service|database|all)
#   -s    Severity level (low|medium|high|critical)
#   -d    Duration in minutes (default: 5)
#   -c    Configuration file path
#   -r    Recovery validation enabled (true|false, default: true)
#   -n    Dry run mode (true|false, default: false)
#   -f    Force execution without safety checks (true|false, default: false)

set -euo pipefail

# Configuration
ACTION="test"
ENVIRONMENT="staging"
TEST_TYPE="network"
SEVERITY="medium"
DURATION=5
CONFIG_FILE=""
RECOVERY_VALIDATION=true
DRY_RUN=false
FORCE_EXECUTION=false

# Directories and Files
CHAOS_BASE_DIR="/opt/terrafusion/chaos-engineering"
TESTS_DIR="$CHAOS_BASE_DIR/tests"
REPORTS_DIR="$CHAOS_BASE_DIR/reports"
CONFIGS_DIR="$CHAOS_BASE_DIR/configs"
LOGS_DIR="/var/log/terrafusion/chaos"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
LOG_FILE="$LOGS_DIR/chaos_engineering_$TIMESTAMP.log"

# Kubernetes Configuration
K8S_NAMESPACE="terrafusion-${ENVIRONMENT}"
CHAOS_NAMESPACE="chaos-engineering"
LITMUS_NAMESPACE="litmus"

# Monitoring Configuration
PROMETHEUS_URL="${PROMETHEUS_URL:-http://prometheus:9090}"
GRAFANA_URL="${GRAFANA_URL:-http://grafana:${TF_FRONTEND_PORT:-3102}}"
SLACK_WEBHOOK="${SLACK_WEBHOOK:-}"

# Safety Thresholds
MAX_CPU_USAGE=85
MAX_MEMORY_USAGE=90
MIN_HEALTHY_PODS=1
MAX_ERROR_RATE=10.0

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m'

# Create directories
mkdir -p "$CHAOS_BASE_DIR"
mkdir -p "$TESTS_DIR"
mkdir -p "$REPORTS_DIR"
mkdir -p "$CONFIGS_DIR"
mkdir -p "$LOGS_DIR"

# Parse arguments
while getopts "a:e:t:s:d:c:r:n:f:" opt; do
    case $opt in
        a) ACTION="$OPTARG" ;;
        e) ENVIRONMENT="$OPTARG" ;;
        t) TEST_TYPE="$OPTARG" ;;
        s) SEVERITY="$OPTARG" ;;
        d) DURATION="$OPTARG" ;;
        c) CONFIG_FILE="$OPTARG" ;;
        r) RECOVERY_VALIDATION="$OPTARG" ;;
        n) DRY_RUN="$OPTARG" ;;
        f) FORCE_EXECUTION="$OPTARG" ;;
        *) echo "Usage: $0 [-a action] [-e env] [-t type] [-s severity] [-d duration] [-c config] [-r recovery] [-n dryrun] [-f force]"; exit 1 ;;
    esac
done

# Global state tracking
declare -A CHAOS_METRICS
declare -A TEST_RESULTS
declare -A SYSTEM_STATE_BEFORE
declare -A SYSTEM_STATE_AFTER
declare -A RECOVERY_METRICS

# Logging functions
log() {
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

log_error() {
    echo -e "${RED}[ERROR] $1${NC}" | tee -a "$LOG_FILE"
}

log_success() {
    echo -e "${GREEN}[SUCCESS] $1${NC}" | tee -a "$LOG_FILE"
}

log_warning() {
    echo -e "${YELLOW}[WARNING] $1${NC}" | tee -a "$LOG_FILE"
}

log_info() {
    echo -e "${BLUE}[INFO] $1${NC}" | tee -a "$LOG_FILE"
}

# Load chaos configuration
load_chaos_config() {
    if [ -n "$CONFIG_FILE" ] && [ -f "$CONFIG_FILE" ]; then
        log "Loading chaos configuration from $CONFIG_FILE"
        source "$CONFIG_FILE"
    else
        log "Using default chaos configuration"
        create_default_config
    fi
}

# Create default chaos configuration
create_default_config() {
    cat > "$CONFIGS_DIR/default_chaos_config.sh" << EOF
# TerraFusion Chaos Engineering Default Configuration

# Test Durations by Severity (minutes)
declare -A TEST_DURATIONS
TEST_DURATIONS[low]=2
TEST_DURATIONS[medium]=5
TEST_DURATIONS[high]=10
TEST_DURATIONS[critical]=15

# Fault Intensity by Severity
declare -A CPU_STRESS_INTENSITY
CPU_STRESS_INTENSITY[low]=25
CPU_STRESS_INTENSITY[medium]=50
CPU_STRESS_INTENSITY[high]=75
CPU_STRESS_INTENSITY[critical]=90

declare -A MEMORY_STRESS_INTENSITY
MEMORY_STRESS_INTENSITY[low]=512
MEMORY_STRESS_INTENSITY[medium]=1024
MEMORY_STRESS_INTENSITY[high]=2048
MEMORY_STRESS_INTENSITY[critical]=4096

declare -A NETWORK_LATENCY
NETWORK_LATENCY[low]=100
NETWORK_LATENCY[medium]=500
NETWORK_LATENCY[high]=1000
NETWORK_LATENCY[critical]=2000

declare -A NETWORK_LOSS
NETWORK_LOSS[low]=1
NETWORK_LOSS[medium]=5
NETWORK_LOSS[high]=10
NETWORK_LOSS[critical]=20

# Recovery Validation Timeouts (seconds)
RECOVERY_TIMEOUT=300
HEALTH_CHECK_INTERVAL=10

# Safety Settings
PRODUCTION_ENABLED=false
MAX_CONCURRENT_TESTS=3
BUSINESS_HOURS_ONLY=true
EOF

    source "$CONFIGS_DIR/default_chaos_config.sh"
}

# Check prerequisites and safety
check_prerequisites() {
    log "Checking chaos engineering prerequisites and safety conditions"
    
    local prerequisites_met=true
    
    # Check kubectl
    if ! command -v kubectl &> /dev/null; then
        log_error "kubectl is not available"
        prerequisites_met=false
    fi
    
    # Check cluster connectivity
    if ! kubectl cluster-info &>/dev/null; then
        log_error "Cannot connect to Kubernetes cluster"
        prerequisites_met=false
    fi
    
    # Production safety check
    if [ "$ENVIRONMENT" = "production" ] && [ "$PRODUCTION_ENABLED" != "true" ] && [ "$FORCE_EXECUTION" != "true" ]; then
        log_error "Production chaos testing is disabled. Use -f flag to force execution"
        prerequisites_met=false
    fi
    
    # Business hours check
    if [ "$BUSINESS_HOURS_ONLY" = "true" ] && [ "$FORCE_EXECUTION" != "true" ]; then
        local current_hour=$(date +%H)
        if [ "$current_hour" -ge 9 ] && [ "$current_hour" -le 17 ]; then
            log_warning "Business hours chaos testing detected. Consider running outside business hours"
        fi
    fi
    
    # Check system health before chaos
    if ! check_system_health; then
        log_error "System is not healthy. Aborting chaos test"
        prerequisites_met=false
    fi
    
    # Check for existing chaos tests
    local running_tests=$(kubectl get chaosengines -n "$CHAOS_NAMESPACE" --field-selector=status.engineStatus=Running 2>/dev/null | wc -l)
    if [ "$running_tests" -ge "$MAX_CONCURRENT_TESTS" ]; then
        log_error "Too many concurrent chaos tests running ($running_tests >= $MAX_CONCURRENT_TESTS)"
        prerequisites_met=false
    fi
    
    if [ "$prerequisites_met" = false ]; then
        log_error "Prerequisites check failed"
        exit 1
    fi
    
    log_success "Prerequisites and safety checks passed"
}

# Check system health
check_system_health() {
    log "Checking system health before chaos injection"
    
    # Check pod health
    local unhealthy_pods=$(kubectl get pods -n "$K8S_NAMESPACE" --field-selector=status.phase!=Running | tail -n +2 | wc -l)
    if [ "$unhealthy_pods" -gt 0 ]; then
        log_warning "Found $unhealthy_pods unhealthy pods"
        return 1
    fi
    
    # Check CPU usage
    if command -v prometheus-query &> /dev/null; then
        local cpu_usage=$(query_prometheus "avg(100 - (avg by (instance) (rate(node_cpu_seconds_total{mode=\"idle\"}[5m])) * 100))")
        if [ -n "$cpu_usage" ] && (( $(echo "$cpu_usage > $MAX_CPU_USAGE" | bc -l) )); then
            log_warning "High CPU usage detected: ${cpu_usage}%"
            return 1
        fi
    fi
    
    # Check memory usage
    local memory_usage=$(query_prometheus "avg((1 - (node_memory_MemAvailable_bytes / node_memory_MemTotal_bytes)) * 100)")
    if [ -n "$memory_usage" ] && (( $(echo "$memory_usage > $MAX_MEMORY_USAGE" | bc -l) )); then
        log_warning "High memory usage detected: ${memory_usage}%"
        return 1
    fi
    
    # Check error rates
    local error_rate=$(query_prometheus "sum(rate(http_requests_total{code=~\"5.*\"}[5m])) / sum(rate(http_requests_total[5m])) * 100")
    if [ -n "$error_rate" ] && (( $(echo "$error_rate > $MAX_ERROR_RATE" | bc -l) )); then
        log_warning "High error rate detected: ${error_rate}%"
        return 1
    fi
    
    log_success "System health check passed"
    return 0
}

# Capture system state before chaos
capture_system_state_before() {
    log "Capturing system state before chaos injection"
    
    # Capture pod count and status
    SYSTEM_STATE_BEFORE["pod_count"]=$(kubectl get pods -n "$K8S_NAMESPACE" --field-selector=status.phase=Running | tail -n +2 | wc -l)
    SYSTEM_STATE_BEFORE["service_count"]=$(kubectl get services -n "$K8S_NAMESPACE" | tail -n +2 | wc -l)
    
    # Capture performance metrics
    SYSTEM_STATE_BEFORE["response_time"]=$(query_prometheus "histogram_quantile(0.95, sum(rate(http_request_duration_seconds_bucket[5m])) by (le))")
    SYSTEM_STATE_BEFORE["throughput"]=$(query_prometheus "sum(rate(http_requests_total[5m]))")
    SYSTEM_STATE_BEFORE["error_rate"]=$(query_prometheus "sum(rate(http_requests_total{code=~\"5.*\"}[5m])) / sum(rate(http_requests_total[5m])) * 100")
    SYSTEM_STATE_BEFORE["cpu_usage"]=$(query_prometheus "avg(100 - (avg by (instance) (rate(node_cpu_seconds_total{mode=\"idle\"}[5m])) * 100))")
    SYSTEM_STATE_BEFORE["memory_usage"]=$(query_prometheus "avg((1 - (node_memory_MemAvailable_bytes / node_memory_MemTotal_bytes)) * 100)")
    
    log_info "System state captured:"
    for key in "${!SYSTEM_STATE_BEFORE[@]}"; do
        log_info "  $key: ${SYSTEM_STATE_BEFORE[$key]}"
    done
}

# Setup chaos engineering infrastructure
setup_chaos_infrastructure() {
    log "Setting up chaos engineering infrastructure"
    
    # Create chaos engineering namespace
    kubectl create namespace "$CHAOS_NAMESPACE" --dry-run=client -o yaml | kubectl apply -f -
    
    # Install Chaos Mesh if not present
    if ! kubectl get crd chaosexperiments.chaos-mesh.org &>/dev/null; then
        log_info "Installing Chaos Mesh..."
        curl -sSL https://mirrors.chaos-mesh.org/v2.4.3/install.sh | bash -s -- --local kind
    fi
    
    # Create chaos RBAC
    cat > "/tmp/chaos_rbac.yaml" << EOF
apiVersion: v1
kind: ServiceAccount
metadata:
  namespace: $CHAOS_NAMESPACE
  name: chaos-controller-manager
---
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRole
metadata:
  name: chaos-controller-manager-cluster-level
rules:
- apiGroups: [""]
  resources: ["pods", "services", "endpoints", "persistentvolumeclaims", "events", "configmaps", "secrets", "nodes"]
  verbs: ["get", "list", "watch", "create", "update", "patch", "delete"]
- apiGroups: ["apps"]
  resources: ["deployments", "daemonsets", "replicasets", "statefulsets"]
  verbs: ["get", "list", "watch", "create", "update", "patch", "delete"]
- apiGroups: ["chaos-mesh.org"]
  resources: ["*"]
  verbs: ["get", "list", "watch", "create", "update", "patch", "delete"]
---
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRoleBinding
metadata:
  name: chaos-controller-manager-cluster-level
roleRef:
  apiGroup: rbac.authorization.k8s.io
  kind: ClusterRole
  name: chaos-controller-manager-cluster-level
subjects:
- kind: ServiceAccount
  name: chaos-controller-manager
  namespace: $CHAOS_NAMESPACE
EOF

    kubectl apply -f "/tmp/chaos_rbac.yaml"
    rm -f "/tmp/chaos_rbac.yaml"
    
    log_success "Chaos engineering infrastructure setup completed"
}

# Execute chaos test
execute_chaos_test() {
    log "Executing chaos test: $TEST_TYPE with severity: $SEVERITY"
    
    # Capture pre-chaos state
    capture_system_state_before
    
    case $TEST_TYPE in
        network)
            execute_network_chaos
            ;;
        cpu)
            execute_cpu_chaos
            ;;
        memory)
            execute_memory_chaos
            ;;
        disk)
            execute_disk_chaos
            ;;
        pod)
            execute_pod_chaos
            ;;
        service)
            execute_service_chaos
            ;;
        database)
            execute_database_chaos
            ;;
        all)
            execute_comprehensive_chaos
            ;;
        *)
            log_error "Unknown test type: $TEST_TYPE"
            exit 1
            ;;
    esac
    
    # Wait for chaos duration
    log_info "Chaos test running for $DURATION minutes..."
    if [ "$DRY_RUN" != "true" ]; then
        sleep $((DURATION * 60))
    else
        log_info "DRY RUN: Would wait for $DURATION minutes"
    fi
    
    # Cleanup chaos
    cleanup_chaos_test
    
    # Validate recovery if enabled
    if [ "$RECOVERY_VALIDATION" = "true" ]; then
        validate_system_recovery
    fi
    
    # Capture post-chaos state
    capture_system_state_after
    
    # Analyze results
    analyze_chaos_results
}

# Execute network chaos
execute_network_chaos() {
    log "Executing network chaos with severity: $SEVERITY"
    
    local latency="${NETWORK_LATENCY[$SEVERITY]:-500}"
    local loss="${NETWORK_LOSS[$SEVERITY]:-5}"
    
    cat > "/tmp/network_chaos.yaml" << EOF
apiVersion: chaos-mesh.org/v1alpha1
kind: NetworkChaos
metadata:
  name: network-chaos-$TIMESTAMP
  namespace: $CHAOS_NAMESPACE
spec:
  action: delay
  mode: one
  selector:
    namespaces:
      - $K8S_NAMESPACE
    labelSelectors:
      app: terrafusion
  delay:
    latency: "${latency}ms"
    correlation: "25"
    jitter: "10ms"
  loss:
    loss: "${loss}"
    correlation: "25"
  duration: "${DURATION}m"
EOF

    if [ "$DRY_RUN" = "true" ]; then
        log_info "DRY RUN: Would apply network chaos:"
        cat "/tmp/network_chaos.yaml"
    else
        kubectl apply -f "/tmp/network_chaos.yaml"
        log_success "Network chaos applied - Latency: ${latency}ms, Loss: ${loss}%"
    fi
    
    rm -f "/tmp/network_chaos.yaml"
}

# Execute CPU chaos
execute_cpu_chaos() {
    log "Executing CPU stress chaos with severity: $SEVERITY"
    
    local cpu_load="${CPU_STRESS_INTENSITY[$SEVERITY]:-50}"
    
    cat > "/tmp/cpu_chaos.yaml" << EOF
apiVersion: chaos-mesh.org/v1alpha1
kind: StressChaos
metadata:
  name: cpu-chaos-$TIMESTAMP
  namespace: $CHAOS_NAMESPACE
spec:
  mode: one
  selector:
    namespaces:
      - $K8S_NAMESPACE
    labelSelectors:
      app: terrafusion
  stressors:
    cpu:
      workers: 1
      load: $cpu_load
  duration: "${DURATION}m"
EOF

    if [ "$DRY_RUN" = "true" ]; then
        log_info "DRY RUN: Would apply CPU chaos:"
        cat "/tmp/cpu_chaos.yaml"
    else
        kubectl apply -f "/tmp/cpu_chaos.yaml"
        log_success "CPU stress chaos applied - Load: ${cpu_load}%"
    fi
    
    rm -f "/tmp/cpu_chaos.yaml"
}

# Execute memory chaos
execute_memory_chaos() {
    log "Executing memory stress chaos with severity: $SEVERITY"
    
    local memory_size="${MEMORY_STRESS_INTENSITY[$SEVERITY]:-1024}"
    
    cat > "/tmp/memory_chaos.yaml" << EOF
apiVersion: chaos-mesh.org/v1alpha1
kind: StressChaos
metadata:
  name: memory-chaos-$TIMESTAMP
  namespace: $CHAOS_NAMESPACE
spec:
  mode: one
  selector:
    namespaces:
      - $K8S_NAMESPACE
    labelSelectors:
      app: terrafusion
  stressors:
    memory:
      workers: 1
      size: "${memory_size}MB"
  duration: "${DURATION}m"
EOF

    if [ "$DRY_RUN" = "true" ]; then
        log_info "DRY RUN: Would apply memory chaos:"
        cat "/tmp/memory_chaos.yaml"
    else
        kubectl apply -f "/tmp/memory_chaos.yaml"
        log_success "Memory stress chaos applied - Size: ${memory_size}MB"
    fi
    
    rm -f "/tmp/memory_chaos.yaml"
}

# Execute disk chaos
execute_disk_chaos() {
    log "Executing disk I/O chaos with severity: $SEVERITY"
    
    local io_workers=2
    case $SEVERITY in
        high|critical) io_workers=4 ;;
    esac
    
    cat > "/tmp/disk_chaos.yaml" << EOF
apiVersion: chaos-mesh.org/v1alpha1
kind: IOChaos
metadata:
  name: disk-chaos-$TIMESTAMP
  namespace: $CHAOS_NAMESPACE
spec:
  action: latency
  mode: one
  selector:
    namespaces:
      - $K8S_NAMESPACE
    labelSelectors:
      app: terrafusion
  volumePath: /tmp
  path: "/tmp/**"
  delay: "100ms"
  percent: 50
  duration: "${DURATION}m"
EOF

    if [ "$DRY_RUN" = "true" ]; then
        log_info "DRY RUN: Would apply disk I/O chaos:"
        cat "/tmp/disk_chaos.yaml"
    else
        kubectl apply -f "/tmp/disk_chaos.yaml"
        log_success "Disk I/O chaos applied"
    fi
    
    rm -f "/tmp/disk_chaos.yaml"
}

# Execute pod chaos
execute_pod_chaos() {
    log "Executing pod failure chaos with severity: $SEVERITY"
    
    local action="pod-kill"
    case $SEVERITY in
        low) action="pod-kill" ;;
        medium) action="pod-failure" ;;
        high|critical) action="container-kill" ;;
    esac
    
    cat > "/tmp/pod_chaos.yaml" << EOF
apiVersion: chaos-mesh.org/v1alpha1
kind: PodChaos
metadata:
  name: pod-chaos-$TIMESTAMP
  namespace: $CHAOS_NAMESPACE
spec:
  action: $action
  mode: fixed-percent
  value: "25"
  selector:
    namespaces:
      - $K8S_NAMESPACE
    labelSelectors:
      app: terrafusion
  duration: "${DURATION}m"
EOF

    if [ "$DRY_RUN" = "true" ]; then
        log_info "DRY RUN: Would apply pod chaos:"
        cat "/tmp/pod_chaos.yaml"
    else
        kubectl apply -f "/tmp/pod_chaos.yaml"
        log_success "Pod chaos applied - Action: $action"
    fi
    
    rm -f "/tmp/pod_chaos.yaml"
}

# Execute service chaos
execute_service_chaos() {
    log "Executing service chaos with severity: $SEVERITY"
    
    # Temporarily disable service endpoints
    local service_name="terrafusion-service"
    
    if [ "$DRY_RUN" = "true" ]; then
        log_info "DRY RUN: Would temporarily disrupt service: $service_name"
    else
        # Scale down service replicas temporarily
        local current_replicas=$(kubectl get deployment terrafusion-app -n "$K8S_NAMESPACE" -o jsonpath='{.spec.replicas}')
        local target_replicas=$((current_replicas / 2))
        
        kubectl scale deployment terrafusion-app -n "$K8S_NAMESPACE" --replicas="$target_replicas"
        log_success "Service chaos applied - Scaled down to $target_replicas replicas"
        
        # Store original replica count for recovery
        echo "$current_replicas" > "/tmp/original_replicas_$TIMESTAMP"
    fi
}

# Execute database chaos
execute_database_chaos() {
    log "Executing database chaos with severity: $SEVERITY"
    
    case $SEVERITY in
        low)
            # Introduce slight connection delays
            log_info "Applying low-severity database chaos (connection delays)"
            ;;
        medium)
            # Simulate connection pool exhaustion
            log_info "Applying medium-severity database chaos (connection pool stress)"
            ;;
        high|critical)
            # Simulate database unavailability
            log_warning "High-severity database chaos not implemented for safety"
            return
            ;;
    esac
    
    # Create database chaos using network policies
    cat > "/tmp/database_chaos.yaml" << EOF
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: database-chaos-$TIMESTAMP
  namespace: $K8S_NAMESPACE
spec:
  podSelector:
    matchLabels:
      app: terrafusion
  policyTypes:
  - Egress
  egress:
  - to:
    - namespaceSelector:
        matchLabels:
          name: database
    ports:
    - protocol: TCP
      port: 5432
    # Add artificial delay through iptables rules (simulated)
EOF

    if [ "$DRY_RUN" = "true" ]; then
        log_info "DRY RUN: Would apply database chaos"
    else
        kubectl apply -f "/tmp/database_chaos.yaml"
        log_success "Database chaos applied"
    fi
    
    rm -f "/tmp/database_chaos.yaml"
}

# Execute comprehensive chaos
execute_comprehensive_chaos() {
    log "Executing comprehensive chaos test with multiple fault types"
    
    # Execute multiple chaos types with reduced intensity
    local original_duration=$DURATION
    DURATION=$((DURATION / 3))
    
    execute_network_chaos
    sleep 30
    execute_cpu_chaos
    sleep 30
    execute_memory_chaos
    
    DURATION=$original_duration
    log_success "Comprehensive chaos test applied"
}

# Cleanup chaos test
cleanup_chaos_test() {
    log "Cleaning up chaos test resources"
    
    # Remove chaos resources
    kubectl delete networkchaos "network-chaos-$TIMESTAMP" -n "$CHAOS_NAMESPACE" 2>/dev/null || true
    kubectl delete stresschaos "cpu-chaos-$TIMESTAMP" -n "$CHAOS_NAMESPACE" 2>/dev/null || true
    kubectl delete stresschaos "memory-chaos-$TIMESTAMP" -n "$CHAOS_NAMESPACE" 2>/dev/null || true
    kubectl delete iochaos "disk-chaos-$TIMESTAMP" -n "$CHAOS_NAMESPACE" 2>/dev/null || true
    kubectl delete podchaos "pod-chaos-$TIMESTAMP" -n "$CHAOS_NAMESPACE" 2>/dev/null || true
    kubectl delete networkpolicy "database-chaos-$TIMESTAMP" -n "$K8S_NAMESPACE" 2>/dev/null || true
    
    # Restore service replicas if needed
    if [ -f "/tmp/original_replicas_$TIMESTAMP" ]; then
        local original_replicas=$(cat "/tmp/original_replicas_$TIMESTAMP")
        kubectl scale deployment terrafusion-app -n "$K8S_NAMESPACE" --replicas="$original_replicas"
        rm -f "/tmp/original_replicas_$TIMESTAMP"
        log_info "Service replicas restored to $original_replicas"
    fi
    
    log_success "Chaos test cleanup completed"
}

# Validate system recovery
validate_system_recovery() {
    log "Validating system recovery after chaos injection"
    
    local recovery_start_time=$(date +%s)
    local recovery_timeout=$((recovery_start_time + RECOVERY_TIMEOUT))
    local recovery_successful=false
    
    while [ $(date +%s) -lt $recovery_timeout ]; do
        log_info "Checking system recovery status..."
        
        # Check pod health
        local running_pods=$(kubectl get pods -n "$K8S_NAMESPACE" --field-selector=status.phase=Running | tail -n +2 | wc -l)
        local expected_pods="${SYSTEM_STATE_BEFORE[pod_count]}"
        
        if [ "$running_pods" -ge "$expected_pods" ]; then
            # Check response time recovery
            local current_response_time=$(query_prometheus "histogram_quantile(0.95, sum(rate(http_request_duration_seconds_bucket[5m])) by (le))")
            local baseline_response_time="${SYSTEM_STATE_BEFORE[response_time]}"
            
            if [ -n "$current_response_time" ] && [ -n "$baseline_response_time" ]; then
                local response_time_increase=$(echo "$current_response_time / $baseline_response_time" | bc -l)
                if (( $(echo "$response_time_increase < 1.5" | bc -l) )); then
                    recovery_successful=true
                    break
                fi
            else
                recovery_successful=true
                break
            fi
        fi
        
        sleep "$HEALTH_CHECK_INTERVAL"
    done
    
    local recovery_duration=$(($(date +%s) - recovery_start_time))
    RECOVERY_METRICS["duration"]=$recovery_duration
    RECOVERY_METRICS["successful"]=$recovery_successful
    
    if [ "$recovery_successful" = true ]; then
        log_success "System recovery validated in ${recovery_duration}s"
        TEST_RESULTS["recovery"]="success"
    else
        log_error "System failed to recover within ${RECOVERY_TIMEOUT}s"
        TEST_RESULTS["recovery"]="failure"
        
        # Send alert
        send_recovery_alert
    fi
}

# Capture system state after chaos
capture_system_state_after() {
    log "Capturing system state after chaos injection"
    
    # Wait a bit for metrics to stabilize
    sleep 30
    
    SYSTEM_STATE_AFTER["pod_count"]=$(kubectl get pods -n "$K8S_NAMESPACE" --field-selector=status.phase=Running | tail -n +2 | wc -l)
    SYSTEM_STATE_AFTER["service_count"]=$(kubectl get services -n "$K8S_NAMESPACE" | tail -n +2 | wc -l)
    SYSTEM_STATE_AFTER["response_time"]=$(query_prometheus "histogram_quantile(0.95, sum(rate(http_request_duration_seconds_bucket[5m])) by (le))")
    SYSTEM_STATE_AFTER["throughput"]=$(query_prometheus "sum(rate(http_requests_total[5m]))")
    SYSTEM_STATE_AFTER["error_rate"]=$(query_prometheus "sum(rate(http_requests_total{code=~\"5.*\"}[5m])) / sum(rate(http_requests_total[5m])) * 100")
    SYSTEM_STATE_AFTER["cpu_usage"]=$(query_prometheus "avg(100 - (avg by (instance) (rate(node_cpu_seconds_total{mode=\"idle\"}[5m])) * 100))")
    SYSTEM_STATE_AFTER["memory_usage"]=$(query_prometheus "avg((1 - (node_memory_MemAvailable_bytes / node_memory_MemTotal_bytes)) * 100)")
    
    log_info "Post-chaos system state captured"
}

# Analyze chaos results
analyze_chaos_results() {
    log "Analyzing chaos test results"
    
    # Calculate impact metrics
    local response_time_impact="N/A"
    local throughput_impact="N/A"
    local error_rate_impact="N/A"
    
    if [ -n "${SYSTEM_STATE_BEFORE[response_time]}" ] && [ -n "${SYSTEM_STATE_AFTER[response_time]}" ]; then
        response_time_impact=$(echo "scale=2; (${SYSTEM_STATE_AFTER[response_time]} - ${SYSTEM_STATE_BEFORE[response_time]}) / ${SYSTEM_STATE_BEFORE[response_time]} * 100" | bc -l)
    fi
    
    if [ -n "${SYSTEM_STATE_BEFORE[throughput]}" ] && [ -n "${SYSTEM_STATE_AFTER[throughput]}" ]; then
        throughput_impact=$(echo "scale=2; (${SYSTEM_STATE_AFTER[throughput]} - ${SYSTEM_STATE_BEFORE[throughput]}) / ${SYSTEM_STATE_BEFORE[throughput]} * 100" | bc -l)
    fi
    
    if [ -n "${SYSTEM_STATE_BEFORE[error_rate]}" ] && [ -n "${SYSTEM_STATE_AFTER[error_rate]}" ]; then
        error_rate_impact=$(echo "scale=2; ${SYSTEM_STATE_AFTER[error_rate]} - ${SYSTEM_STATE_BEFORE[error_rate]}" | bc -l)
    fi
    
    # Store results
    TEST_RESULTS["test_type"]="$TEST_TYPE"
    TEST_RESULTS["severity"]="$SEVERITY"
    TEST_RESULTS["duration"]="$DURATION"
    TEST_RESULTS["response_time_impact"]="$response_time_impact"
    TEST_RESULTS["throughput_impact"]="$throughput_impact"
    TEST_RESULTS["error_rate_impact"]="$error_rate_impact"
    TEST_RESULTS["recovery_duration"]="${RECOVERY_METRICS[duration]:-N/A}"
    TEST_RESULTS["overall_status"]="completed"
    
    # Determine test success
    local test_successful=true
    
    # Check if system recovered
    if [ "${RECOVERY_METRICS[successful]:-false}" != "true" ]; then
        test_successful=false
    fi
    
    # Check if impact was within acceptable bounds
    if [ -n "$response_time_impact" ] && [ "$response_time_impact" != "N/A" ]; then
        if (( $(echo "$response_time_impact > 200" | bc -l) )); then
            log_warning "Response time impact exceeded acceptable threshold: ${response_time_impact}%"
            test_successful=false
        fi
    fi
    
    TEST_RESULTS["success"]=$test_successful
    
    if [ "$test_successful" = true ]; then
        log_success "Chaos test completed successfully"
    else
        log_warning "Chaos test revealed resilience issues"
    fi
    
    # Log analysis summary
    log_info "Chaos Test Analysis Summary:"
    log_info "  Response Time Impact: ${response_time_impact}%"
    log_info "  Throughput Impact: ${throughput_impact}%"
    log_info "  Error Rate Impact: ${error_rate_impact}%"
    log_info "  Recovery Duration: ${RECOVERY_METRICS[duration]:-N/A}s"
    log_info "  Test Success: $test_successful"
}

# Query Prometheus for metrics
query_prometheus() {
    local query=$1
    local endpoint="$PROMETHEUS_URL/api/v1/query"
    
    local result=$(curl -s --max-time 10 -G "$endpoint" --data-urlencode "query=$query" | jq -r '.data.result[0].value[1]' 2>/dev/null)
    
    if [ "$result" != "null" ] && [ -n "$result" ]; then
        echo "$result"
    fi
}

# Send recovery alert
send_recovery_alert() {
    if [ -n "$SLACK_WEBHOOK" ]; then
        local message="{
            \"text\": \"🚨 Chaos Engineering Alert\",
            \"attachments\": [{
                \"color\": \"danger\",
                \"fields\": [
                    {\"title\": \"Test Type\", \"value\": \"$TEST_TYPE\", \"short\": true},
                    {\"title\": \"Severity\", \"value\": \"$SEVERITY\", \"short\": true},
                    {\"title\": \"Environment\", \"value\": \"$ENVIRONMENT\", \"short\": true},
                    {\"title\": \"Status\", \"value\": \"Recovery Failed\", \"short\": true},
                    {\"title\": \"Duration\", \"value\": \"$DURATION minutes\", \"short\": true},
                    {\"title\": \"Recovery Time\", \"value\": \">${RECOVERY_TIMEOUT}s\", \"short\": true}
                ]
            }]
        }"
        
        curl -X POST -H 'Content-type: application/json' --data "$message" "$SLACK_WEBHOOK" &>/dev/null || true
    fi
}

# Generate chaos report
generate_chaos_report() {
    local report_file="$REPORTS_DIR/chaos_report_${ENVIRONMENT}_${TEST_TYPE}_$TIMESTAMP.html"
    
    log "Generating chaos engineering report: $report_file"
    
    cat > "$report_file" << EOF
<!DOCTYPE html>
<html>
<head>
    <title>TerraFusion Chaos Engineering Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { background-color: #f0f0f0; padding: 20px; border-radius: 5px; margin-bottom: 20px; }
        .section { margin: 20px 0; }
        .success { color: green; font-weight: bold; }
        .warning { color: orange; font-weight: bold; }
        .error { color: red; font-weight: bold; }
        table { border-collapse: collapse; width: 100%; margin: 10px 0; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f2f2f2; }
        .metric-card { display: inline-block; margin: 10px; padding: 15px; border: 1px solid #ddd; border-radius: 5px; min-width: 200px; text-align: center; }
        .passed { background-color: #e8f5e8; }
        .failed { background-color: #ffebee; }
        .impact-positive { color: red; }
        .impact-negative { color: green; }
        .impact-neutral { color: orange; }
    </style>
</head>
<body>
    <div class="header">
        <h1>🔥 TerraFusion Chaos Engineering Report</h1>
        <p><strong>Test Type:</strong> $TEST_TYPE</p>
        <p><strong>Environment:</strong> $ENVIRONMENT</p>
        <p><strong>Severity:</strong> $SEVERITY</p>
        <p><strong>Duration:</strong> $DURATION minutes</p>
        <p><strong>Status:</strong> <span class="${TEST_RESULTS[success]:-false}">${TEST_RESULTS[overall_status]:-unknown}</span></p>
        <p><strong>Generated:</strong> $(date)</p>
    </div>
    
    <div class="section">
        <h2>Test Summary</h2>
        <div class="metric-card $([ "${TEST_RESULTS[success]:-false}" = "true" ] && echo "passed" || echo "failed")">
            <h3>Overall Result</h3>
            <p>$([ "${TEST_RESULTS[success]:-false}" = "true" ] && echo "✅ PASSED" || echo "❌ FAILED")</p>
        </div>
        <div class="metric-card">
            <h3>Recovery Time</h3>
            <p>${RECOVERY_METRICS[duration]:-N/A}s</p>
        </div>
        <div class="metric-card">
            <h3>Test Duration</h3>
            <p>$DURATION minutes</p>
        </div>
    </div>
    
    <div class="section">
        <h2>System Impact Analysis</h2>
        <table>
            <tr><th>Metric</th><th>Before</th><th>After</th><th>Impact</th></tr>
            <tr>
                <td>Response Time (95th percentile)</td>
                <td>${SYSTEM_STATE_BEFORE[response_time]:-N/A}s</td>
                <td>${SYSTEM_STATE_AFTER[response_time]:-N/A}s</td>
                <td class="impact-positive">${TEST_RESULTS[response_time_impact]:-N/A}%</td>
            </tr>
            <tr>
                <td>Throughput (req/s)</td>
                <td>${SYSTEM_STATE_BEFORE[throughput]:-N/A}</td>
                <td>${SYSTEM_STATE_AFTER[throughput]:-N/A}</td>
                <td class="impact-negative">${TEST_RESULTS[throughput_impact]:-N/A}%</td>
            </tr>
            <tr>
                <td>Error Rate (%)</td>
                <td>${SYSTEM_STATE_BEFORE[error_rate]:-N/A}%</td>
                <td>${SYSTEM_STATE_AFTER[error_rate]:-N/A}%</td>
                <td class="impact-positive">${TEST_RESULTS[error_rate_impact]:-N/A}%</td>
            </tr>
            <tr>
                <td>CPU Usage (%)</td>
                <td>${SYSTEM_STATE_BEFORE[cpu_usage]:-N/A}%</td>
                <td>${SYSTEM_STATE_AFTER[cpu_usage]:-N/A}%</td>
                <td>-</td>
            </tr>
            <tr>
                <td>Memory Usage (%)</td>
                <td>${SYSTEM_STATE_BEFORE[memory_usage]:-N/A}%</td>
                <td>${SYSTEM_STATE_AFTER[memory_usage]:-N/A}%</td>
                <td>-</td>
            </tr>
        </table>
    </div>
    
    <div class="section">
        <h2>Recovery Analysis</h2>
        <table>
            <tr><th>Recovery Metric</th><th>Value</th><th>Status</th></tr>
            <tr>
                <td>Recovery Successful</td>
                <td>${RECOVERY_METRICS[successful]:-false}</td>
                <td class="$([ "${RECOVERY_METRICS[successful]:-false}" = "true" ] && echo "success" || echo "error")">$([ "${RECOVERY_METRICS[successful]:-false}" = "true" ] && echo "✅ Yes" || echo "❌ No")</td>
            </tr>
            <tr>
                <td>Recovery Duration</td>
                <td>${RECOVERY_METRICS[duration]:-N/A}s</td>
                <td>$([ "${RECOVERY_METRICS[duration]:-999}" -lt 60 ] && echo "success" || echo "warning")">$([ "${RECOVERY_METRICS[duration]:-999}" -lt 60 ] && echo "Fast" || echo "Slow")</td>
            </tr>
            <tr>
                <td>Pods Recovered</td>
                <td>${SYSTEM_STATE_AFTER[pod_count]:-0} / ${SYSTEM_STATE_BEFORE[pod_count]:-0}</td>
                <td class="$([ "${SYSTEM_STATE_AFTER[pod_count]:-0}" -ge "${SYSTEM_STATE_BEFORE[pod_count]:-0}" ] && echo "success" || echo "warning")">$([ "${SYSTEM_STATE_AFTER[pod_count]:-0}" -ge "${SYSTEM_STATE_BEFORE[pod_count]:-0}" ] && echo "Complete" || echo "Partial")</td>
            </tr>
        </table>
    </div>
    
    <div class="section">
        <h2>Recommendations</h2>
        <ul>
EOF

    # Add recommendations based on results
    if [ "${TEST_RESULTS[success]:-false}" = "true" ]; then
        cat >> "$report_file" << EOF
            <li class="success">✅ System demonstrated good resilience to $TEST_TYPE chaos</li>
            <li class="success">✅ Recovery time was acceptable (${RECOVERY_METRICS[duration]:-N/A}s)</li>
            <li>Consider increasing chaos severity to test limits</li>
            <li>Schedule regular chaos testing to maintain resilience</li>
EOF
    else
        cat >> "$report_file" << EOF
            <li class="error">❌ System showed poor resilience to $TEST_TYPE chaos</li>
            <li class="warning">⚠️ Recovery time exceeded acceptable thresholds</li>
            <li>Implement circuit breakers and retry mechanisms</li>
            <li>Review resource limits and scaling policies</li>
            <li>Consider implementing bulkhead patterns</li>
            <li>Improve monitoring and alerting for faster incident response</li>
EOF
    fi

    cat >> "$report_file" << EOF
        </ul>
    </div>
    
    <div class="section">
        <h2>Next Steps</h2>
        <ol>
            <li>Review and address any resilience gaps identified</li>
            <li>Update runbooks based on chaos test findings</li>
            <li>Schedule follow-up chaos tests with different scenarios</li>
            <li>Share results with development and operations teams</li>
            <li>Update system architecture to improve resilience</li>
        </ol>
    </div>
    
    <p><small>Report generated by TerraFusion Chaos Engineering System on $(date)</small></p>
</body>
</html>
EOF

    log_success "Chaos engineering report generated: $report_file"
}

# Schedule chaos tests
schedule_chaos_tests() {
    log "Scheduling automated chaos tests"
    
    # Create chaos test schedule
    cat > "$CONFIGS_DIR/chaos_schedule.yaml" << EOF
# TerraFusion Chaos Engineering Schedule
# Automated chaos tests for continuous resilience validation

apiVersion: batch/v1
kind: CronJob
metadata:
  name: chaos-test-weekly
  namespace: $CHAOS_NAMESPACE
spec:
  schedule: "0 2 * * 1"  # Every Monday at 2 AM
  jobTemplate:
    spec:
      template:
        spec:
          containers:
          - name: chaos-test
            image: chaos-engineering:latest
            command:
            - /bin/bash
            - -c
            - |
              /opt/terrafusion/scripts/chaos-engineering.sh \\
                -a test \\
                -e staging \\
                -t network \\
                -s medium \\
                -d 5
          restartPolicy: OnFailure
---
apiVersion: batch/v1
kind: CronJob
metadata:
  name: chaos-test-monthly
  namespace: $CHAOS_NAMESPACE
spec:
  schedule: "0 3 1 * *"  # First day of month at 3 AM
  jobTemplate:
    spec:
      template:
        spec:
          containers:
          - name: chaos-test
            image: chaos-engineering:latest
            command:
            - /bin/bash
            - -c
            - |
              /opt/terrafusion/scripts/chaos-engineering.sh \\
                -a test \\
                -e production \\
                -t all \\
                -s low \\
                -d 3
          restartPolicy: OnFailure
EOF

    kubectl apply -f "$CONFIGS_DIR/chaos_schedule.yaml"
    log_success "Chaos test schedule created"
}

# Main execution
main() {
    log "========================================="
    log "TerraFusion Chaos Engineering System"
    log "Action: $ACTION"
    log "Environment: $ENVIRONMENT"
    log "Test Type: $TEST_TYPE"
    log "Severity: $SEVERITY"
    log "Duration: $DURATION minutes"
    log "========================================="
    
    # Load configuration
    load_chaos_config
    
    case $ACTION in
        test)
            check_prerequisites
            setup_chaos_infrastructure
            execute_chaos_test
            generate_chaos_report
            ;;
        schedule)
            setup_chaos_infrastructure
            schedule_chaos_tests
            ;;
        report)
            generate_chaos_report
            ;;
        analyze)
            analyze_chaos_results
            ;;
        cleanup)
            cleanup_chaos_test
            ;;
        *)
            log_error "Invalid action: $ACTION"
            echo "Valid actions: test, schedule, report, analyze, cleanup"
            exit 1
            ;;
    esac
    
    log ""
    log "========================================="
    log "Chaos Engineering Operation Complete"
    log "Action: $ACTION"
    log "Test Type: $TEST_TYPE"
    log "Environment: $ENVIRONMENT"
    log "Log file: $LOG_FILE"
    log "========================================="
}

# Handle interrupts
trap 'log_error "Chaos engineering interrupted!"; cleanup_chaos_test; exit 1' INT TERM

# Run main function
main "$@"
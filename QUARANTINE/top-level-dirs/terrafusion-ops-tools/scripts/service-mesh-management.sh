#!/bin/bash

# TerraFusion Service Mesh Management and Observability Tools
# Enterprise-grade service mesh with Istio/Linkerd integration

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "${SCRIPT_DIR}/common-functions.sh"

# Configuration
MESH_DB="${MESH_DB:-terrafusion_mesh}"
MESH_USER="${DB_USER:-tfmesh}"
MESH_PASS="${DB_PASS:-$(generate_password)}"
MESH_TYPE="${MESH_TYPE:-istio}" # istio or linkerd
KIALI_URL="${KIALI_URL:-http://localhost:20001}"
GRAFANA_URL="${GRAFANA_URL:-http://localhost:3000}"
JAEGER_URL="${JAEGER_URL:-http://localhost:16686}"

# Initialize database
init_mesh_database() {
    log_info "Initializing service mesh database..."
    
    psql -U postgres -c "CREATE DATABASE ${MESH_DB};" 2>/dev/null || true
    psql -U postgres -c "CREATE USER ${MESH_USER} WITH PASSWORD '${MESH_PASS}';" 2>/dev/null || true
    psql -U postgres -c "GRANT ALL PRIVILEGES ON DATABASE ${MESH_DB} TO ${MESH_USER};"
    
    psql -U ${MESH_USER} -d ${MESH_DB} <<EOF
-- Service registry
CREATE TABLE IF NOT EXISTS mesh_services (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) UNIQUE NOT NULL,
    namespace VARCHAR(255) DEFAULT 'default',
    version VARCHAR(50),
    protocol VARCHAR(50) DEFAULT 'http',
    ports JSONB DEFAULT '[]',
    labels JSONB DEFAULT '{}',
    annotations JSONB DEFAULT '{}',
    mesh_enabled BOOLEAN DEFAULT false,
    sidecar_injected BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Service endpoints
CREATE TABLE IF NOT EXISTS service_endpoints (
    id SERIAL PRIMARY KEY,
    service_id INTEGER REFERENCES mesh_services(id),
    pod_name VARCHAR(255),
    pod_ip VARCHAR(45),
    node_name VARCHAR(255),
    status VARCHAR(50),
    ready BOOLEAN DEFAULT false,
    labels JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Traffic policies
CREATE TABLE IF NOT EXISTS traffic_policies (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) UNIQUE NOT NULL,
    policy_type VARCHAR(50), -- circuit_breaker, retry, timeout, rate_limit
    source_service_id INTEGER REFERENCES mesh_services(id),
    destination_service_id INTEGER REFERENCES mesh_services(id),
    config JSONB NOT NULL,
    enabled BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Virtual services
CREATE TABLE IF NOT EXISTS virtual_services (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) UNIQUE NOT NULL,
    namespace VARCHAR(255) DEFAULT 'default',
    hosts JSONB DEFAULT '[]',
    gateways JSONB DEFAULT '[]',
    http_routes JSONB DEFAULT '[]',
    tcp_routes JSONB DEFAULT '[]',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Destination rules
CREATE TABLE IF NOT EXISTS destination_rules (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) UNIQUE NOT NULL,
    namespace VARCHAR(255) DEFAULT 'default',
    host VARCHAR(255) NOT NULL,
    traffic_policy JSONB DEFAULT '{}',
    subsets JSONB DEFAULT '[]',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Service mesh metrics
CREATE TABLE IF NOT EXISTS mesh_metrics (
    id SERIAL PRIMARY KEY,
    source_service_id INTEGER REFERENCES mesh_services(id),
    destination_service_id INTEGER REFERENCES mesh_services(id),
    timestamp TIMESTAMP NOT NULL,
    request_count BIGINT DEFAULT 0,
    error_count BIGINT DEFAULT 0,
    p50_latency_ms DECIMAL(10,2),
    p95_latency_ms DECIMAL(10,2),
    p99_latency_ms DECIMAL(10,2),
    request_bytes BIGINT DEFAULT 0,
    response_bytes BIGINT DEFAULT 0,
    tcp_connections INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Security policies
CREATE TABLE IF NOT EXISTS security_policies (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) UNIQUE NOT NULL,
    policy_type VARCHAR(50), -- authorization, authentication, mtls
    namespace VARCHAR(255) DEFAULT 'default',
    selector JSONB DEFAULT '{}',
    rules JSONB DEFAULT '[]',
    enabled BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Service mesh health
CREATE TABLE IF NOT EXISTS mesh_health (
    id SERIAL PRIMARY KEY,
    component_name VARCHAR(255),
    component_type VARCHAR(50), -- control_plane, data_plane, gateway
    namespace VARCHAR(255),
    status VARCHAR(50),
    health_score DECIMAL(3,2),
    error_rate DECIMAL(5,2),
    resource_usage JSONB DEFAULT '{}',
    last_check TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Traffic splits (for canary/blue-green)
CREATE TABLE IF NOT EXISTS traffic_splits (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) UNIQUE NOT NULL,
    namespace VARCHAR(255) DEFAULT 'default',
    service_name VARCHAR(255) NOT NULL,
    backends JSONB DEFAULT '[]', -- [{service: "v1", weight: 80}, {service: "v2", weight: 20}]
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Service dependencies
CREATE TABLE IF NOT EXISTS mesh_dependencies (
    id SERIAL PRIMARY KEY,
    source_service_id INTEGER REFERENCES mesh_services(id),
    target_service_id INTEGER REFERENCES mesh_services(id),
    dependency_type VARCHAR(50), -- sync, async, database, cache
    protocol VARCHAR(50),
    discovered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_seen TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(source_service_id, target_service_id, dependency_type)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_service_endpoints_service ON service_endpoints(service_id);
CREATE INDEX IF NOT EXISTS idx_traffic_policies_services ON traffic_policies(source_service_id, destination_service_id);
CREATE INDEX IF NOT EXISTS idx_mesh_metrics_time ON mesh_metrics(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_mesh_metrics_services ON mesh_metrics(source_service_id, destination_service_id);
CREATE INDEX IF NOT EXISTS idx_mesh_health_component ON mesh_health(component_name, last_check);
CREATE INDEX IF NOT EXISTS idx_mesh_dependencies_source ON mesh_dependencies(source_service_id);
EOF
    
    log_success "Service mesh database initialized"
}

# Install service mesh
install_service_mesh() {
    local mesh_type=$1
    
    log_info "Installing ${mesh_type} service mesh..."
    
    case $mesh_type in
        "istio")
            # Download and install Istio
            curl -L https://istio.io/downloadIstio | sh -
            cd istio-*
            export PATH=$PWD/bin:$PATH
            
            # Install Istio with demo profile
            istioctl install --set values.pilot.env.PILOT_ENABLE_ANALYSIS=true -y
            
            # Enable namespace injection
            kubectl label namespace default istio-injection=enabled --overwrite
            
            # Install addons
            kubectl apply -f samples/addons/prometheus.yaml
            kubectl apply -f samples/addons/grafana.yaml
            kubectl apply -f samples/addons/jaeger.yaml
            kubectl apply -f samples/addons/kiali.yaml
            
            # Wait for components
            kubectl -n istio-system rollout status deployment/istiod
            kubectl -n istio-system rollout status deployment/istio-ingressgateway
            ;;
            
        "linkerd")
            # Install Linkerd CLI
            curl -sL https://run.linkerd.io/install | sh
            export PATH=$PATH:$HOME/.linkerd2/bin
            
            # Install Linkerd control plane
            linkerd install | kubectl apply -f -
            
            # Install viz extension
            linkerd viz install | kubectl apply -f -
            
            # Enable namespace injection
            kubectl annotate namespace default linkerd.io/inject=enabled --overwrite
            
            # Wait for components
            linkerd check
            ;;
    esac
    
    log_success "${mesh_type} service mesh installed"
}

# Deploy mesh configuration
deploy_mesh_config() {
    log_info "Deploying service mesh configuration..."
    
    # Create traffic management policies
    cat > mesh-traffic-policies.yaml <<EOF
apiVersion: networking.istio.io/v1beta1
kind: DestinationRule
metadata:
  name: circuit-breaker-default
  namespace: default
spec:
  host: "*"
  trafficPolicy:
    connectionPool:
      tcp:
        maxConnections: 100
      http:
        http1MaxPendingRequests: 50
        http2MaxRequests: 100
        maxRequestsPerConnection: 1
    outlierDetection:
      consecutiveErrors: 5
      interval: 30s
      baseEjectionTime: 30s
      maxEjectionPercent: 50
      minHealthPercent: 30
---
apiVersion: networking.istio.io/v1beta1
kind: VirtualService
metadata:
  name: retry-policy-default
  namespace: default
spec:
  hosts:
  - "*"
  http:
  - retries:
      attempts: 3
      perTryTimeout: 5s
      retryOn: gateway-error,connect-failure,refused-stream
    timeout: 30s
---
apiVersion: networking.istio.io/v1beta1
kind: ServiceEntry
metadata:
  name: external-services
  namespace: default
spec:
  hosts:
  - "*.amazonaws.com"
  - "*.googleapis.com"
  ports:
  - number: 443
    name: https
    protocol: HTTPS
  location: MESH_EXTERNAL
  resolution: DNS
EOF
    
    # Create security policies
    cat > mesh-security-policies.yaml <<EOF
apiVersion: security.istio.io/v1beta1
kind: PeerAuthentication
metadata:
  name: default-mtls
  namespace: default
spec:
  mtls:
    mode: STRICT
---
apiVersion: security.istio.io/v1beta1
kind: AuthorizationPolicy
metadata:
  name: allow-internal
  namespace: default
spec:
  action: ALLOW
  rules:
  - from:
    - source:
        namespaces: ["default", "istio-system"]
  - to:
    - operation:
        methods: ["GET", "POST", "PUT", "DELETE", "PATCH"]
---
apiVersion: networking.istio.io/v1beta1
kind: Gateway
metadata:
  name: terrafusion-gateway
  namespace: default
spec:
  selector:
    istio: ingressgateway
  servers:
  - port:
      number: 80
      name: http
      protocol: HTTP
    hosts:
    - "*"
    tls:
      httpsRedirect: true
  - port:
      number: 443
      name: https
      protocol: HTTPS
    tls:
      mode: SIMPLE
      credentialName: terrafusion-tls
    hosts:
    - "*"
EOF
    
    kubectl apply -f mesh-traffic-policies.yaml
    kubectl apply -f mesh-security-policies.yaml
    
    log_success "Service mesh configuration deployed"
}

# Monitor service mesh
monitor_mesh() {
    log_info "Setting up service mesh monitoring..."
    
    # Create custom Grafana dashboards
    cat > mesh-dashboard.json <<'EOF'
{
  "dashboard": {
    "title": "TerraFusion Service Mesh",
    "panels": [
      {
        "title": "Request Rate",
        "targets": [
          {
            "expr": "sum(rate(istio_request_total[5m])) by (destination_service_name)"
          }
        ]
      },
      {
        "title": "Error Rate",
        "targets": [
          {
            "expr": "sum(rate(istio_request_total{response_code!~\"2..\"}[5m])) by (destination_service_name)"
          }
        ]
      },
      {
        "title": "P95 Latency",
        "targets": [
          {
            "expr": "histogram_quantile(0.95, sum(rate(istio_request_duration_milliseconds_bucket[5m])) by (destination_service_name, le))"
          }
        ]
      },
      {
        "title": "Circuit Breaker Status",
        "targets": [
          {
            "expr": "sum(envoy_cluster_circuit_breakers_default_cx_open) by (cluster_name)"
          }
        ]
      }
    ]
  }
}
EOF
    
    # Configure Prometheus scraping
    cat > prometheus-mesh-config.yaml <<EOF
apiVersion: v1
kind: ConfigMap
metadata:
  name: prometheus-mesh-config
  namespace: istio-system
data:
  prometheus.yml: |
    global:
      scrape_interval: 15s
    scrape_configs:
    - job_name: 'istio-mesh'
      kubernetes_sd_configs:
      - role: endpoints
        namespaces:
          names:
          - default
          - istio-system
      relabel_configs:
      - source_labels: [__meta_kubernetes_service_name, __meta_kubernetes_endpoint_port_name]
        action: keep
        regex: '.*-metrics;.*'
    - job_name: 'envoy-stats'
      metrics_path: /stats/prometheus
      kubernetes_sd_configs:
      - role: pod
      relabel_configs:
      - source_labels: [__meta_kubernetes_pod_container_port_name]
        action: keep
        regex: '.*-envoy-prom'
EOF
    
    kubectl apply -f prometheus-mesh-config.yaml
    
    # Store mesh metrics
    python3 <<EOF
import requests
import psycopg2
from datetime import datetime
import json

conn = psycopg2.connect(
    dbname="${MESH_DB}",
    user="${MESH_USER}",
    password="${MESH_PASS}",
    host="localhost"
)
cur = conn.cursor()

# Query Prometheus for mesh metrics
prom_query = """
sum by (source_workload, destination_service_name) (
  rate(istio_request_total[5m])
)
"""

response = requests.get(
    "${PROMETHEUS_URL}/api/v1/query",
    params={'query': prom_query}
)

if response.status_code == 200:
    data = response.json()['data']['result']
    
    for metric in data:
        source = metric['metric'].get('source_workload', 'unknown')
        destination = metric['metric'].get('destination_service_name', 'unknown')
        request_rate = float(metric['value'][1])
        
        # Get service IDs
        cur.execute(
            "SELECT id FROM mesh_services WHERE name = %s",
            (source,)
        )
        source_id = cur.fetchone()
        
        cur.execute(
            "SELECT id FROM mesh_services WHERE name = %s",
            (destination,)
        )
        dest_id = cur.fetchone()
        
        if source_id and dest_id:
            cur.execute("""
                INSERT INTO mesh_metrics (
                    source_service_id, destination_service_id,
                    timestamp, request_count
                ) VALUES (%s, %s, %s, %s)
            """, (source_id[0], dest_id[0], datetime.now(), int(request_rate * 300)))

conn.commit()
cur.close()
conn.close()
EOF
    
    log_success "Service mesh monitoring configured"
}

# Apply traffic management
apply_traffic_management() {
    local service=$1
    local policy_type=$2
    local config=$3
    
    log_info "Applying ${policy_type} policy to ${service}..."
    
    case $policy_type in
        "canary")
            # Parse canary config (e.g., "v1:80,v2:20")
            IFS=',' read -ra WEIGHTS <<< "$config"
            
            cat > canary-virtualservice.yaml <<EOF
apiVersion: networking.istio.io/v1beta1
kind: VirtualService
metadata:
  name: ${service}-canary
  namespace: default
spec:
  hosts:
  - ${service}
  http:
  - match:
    - headers:
        canary:
          exact: "true"
    route:
    - destination:
        host: ${service}
        subset: v2
  - route:
EOF
            
            for weight in "${WEIGHTS[@]}"; do
                IFS=':' read -ra VERSION_WEIGHT <<< "$weight"
                cat >> canary-virtualservice.yaml <<EOF
    - destination:
        host: ${service}
        subset: ${VERSION_WEIGHT[0]}
      weight: ${VERSION_WEIGHT[1]}
EOF
            done
            
            kubectl apply -f canary-virtualservice.yaml
            ;;
            
        "circuit-breaker")
            cat > circuit-breaker.yaml <<EOF
apiVersion: networking.istio.io/v1beta1
kind: DestinationRule
metadata:
  name: ${service}-circuit-breaker
  namespace: default
spec:
  host: ${service}
  trafficPolicy:
    connectionPool:
      tcp:
        maxConnections: ${config}
      http:
        http1MaxPendingRequests: 10
        http2MaxRequests: ${config}
    outlierDetection:
      consecutiveErrors: 5
      interval: 30s
      baseEjectionTime: 30s
EOF
            kubectl apply -f circuit-breaker.yaml
            ;;
            
        "rate-limit")
            cat > rate-limit.yaml <<EOF
apiVersion: networking.istio.io/v1beta1
kind: EnvoyFilter
metadata:
  name: ${service}-rate-limit
  namespace: default
spec:
  workloadSelector:
    labels:
      app: ${service}
  configPatches:
  - applyTo: HTTP_FILTER
    match:
      context: SIDECAR_INBOUND
      listener:
        filterChain:
          filter:
            name: "envoy.filters.network.http_connection_manager"
    patch:
      operation: INSERT_BEFORE
      value:
        name: envoy.filters.http.local_ratelimit
        typed_config:
          "@type": type.googleapis.com/udpa.type.v1.TypedStruct
          type_url: type.googleapis.com/envoy.extensions.filters.http.local_ratelimit.v3.LocalRateLimit
          value:
            stat_prefix: http_local_rate_limiter
            token_bucket:
              max_tokens: ${config}
              tokens_per_fill: ${config}
              fill_interval: 60s
            filter_enabled:
              runtime_key: local_rate_limit_enabled
              default_value:
                numerator: 100
                denominator: HUNDRED
            filter_enforced:
              runtime_key: local_rate_limit_enforced
              default_value:
                numerator: 100
                denominator: HUNDRED
EOF
            kubectl apply -f rate-limit.yaml
            ;;
    esac
    
    # Store policy in database
    psql -U ${MESH_USER} -d ${MESH_DB} <<EOF
INSERT INTO traffic_policies (name, policy_type, config, enabled)
VALUES ('${service}-${policy_type}', '${policy_type}', '${config}'::jsonb, true)
ON CONFLICT (name) DO UPDATE SET
    config = EXCLUDED.config,
    updated_at = CURRENT_TIMESTAMP;
EOF
    
    log_success "Traffic policy applied to ${service}"
}

# Analyze service dependencies
analyze_dependencies() {
    log_info "Analyzing service mesh dependencies..."
    
    # Query for service dependencies from traces
    python3 <<EOF
import requests
import psycopg2
import json
from datetime import datetime, timedelta

conn = psycopg2.connect(
    dbname="${MESH_DB}",
    user="${MESH_USER}",
    password="${MESH_PASS}",
    host="localhost"
)
cur = conn.cursor()

# Query Jaeger for service dependencies
response = requests.get(
    "${JAEGER_URL}/api/dependencies",
    params={
        'endTs': int(datetime.now().timestamp() * 1000),
        'lookback': '1h'
    }
)

if response.status_code == 200:
    dependencies = response.json()
    
    for dep in dependencies:
        parent = dep['parent']
        child = dep['child']
        call_count = dep['callCount']
        
        # Get or create services
        for service_name in [parent, child]:
            cur.execute("""
                INSERT INTO mesh_services (name, namespace)
                VALUES (%s, 'default')
                ON CONFLICT (name) DO NOTHING
            """, (service_name,))
        
        # Get service IDs
        cur.execute("SELECT id FROM mesh_services WHERE name = %s", (parent,))
        parent_id = cur.fetchone()[0]
        
        cur.execute("SELECT id FROM mesh_services WHERE name = %s", (child,))
        child_id = cur.fetchone()[0]
        
        # Store dependency
        cur.execute("""
            INSERT INTO mesh_dependencies (
                source_service_id, target_service_id,
                dependency_type, protocol, last_seen
            ) VALUES (%s, %s, %s, %s, %s)
            ON CONFLICT (source_service_id, target_service_id, dependency_type)
            DO UPDATE SET last_seen = EXCLUDED.last_seen
        """, (parent_id, child_id, 'sync', 'http', datetime.now()))

# Generate dependency graph
cur.execute("""
    SELECT 
        s1.name as source,
        s2.name as target,
        md.dependency_type,
        md.protocol
    FROM mesh_dependencies md
    JOIN mesh_services s1 ON md.source_service_id = s1.id
    JOIN mesh_services s2 ON md.target_service_id = s2.id
    WHERE md.last_seen > NOW() - INTERVAL '1 day'
""")

dependencies = cur.fetchall()

# Create DOT graph
dot_content = "digraph ServiceMesh {\n"
dot_content += '  rankdir=LR;\n'
dot_content += '  node [shape=box, style=rounded];\n'

for source, target, dep_type, protocol in dependencies:
    color = "blue" if dep_type == "sync" else "green"
    dot_content += f'  "{source}" -> "{target}" [label="{protocol}", color="{color}"];\n'

dot_content += "}"

with open("service-dependencies.dot", "w") as f:
    f.write(dot_content)

# Convert to SVG
import subprocess
subprocess.run(["dot", "-Tsvg", "service-dependencies.dot", "-o", "service-dependencies.svg"])

conn.commit()
cur.close()
conn.close()

print("Service dependency analysis complete")
EOF
    
    log_success "Service dependency analysis complete"
}

# Health check mesh components
check_mesh_health() {
    log_info "Checking service mesh health..."
    
    if [ "$MESH_TYPE" == "istio" ]; then
        # Check Istio components
        istioctl proxy-status
        
        # Check control plane
        kubectl -n istio-system get pods
        
        # Run Istio analysis
        istioctl analyze --all-namespaces
        
        # Store health status
        python3 <<EOF
import subprocess
import json
import psycopg2
from datetime import datetime

conn = psycopg2.connect(
    dbname="${MESH_DB}",
    user="${MESH_USER}",
    password="${MESH_PASS}",
    host="localhost"
)
cur = conn.cursor()

# Get Istio component status
result = subprocess.run(
    ["kubectl", "-n", "istio-system", "get", "pods", "-o", "json"],
    capture_output=True, text=True
)

if result.returncode == 0:
    pods = json.loads(result.stdout)['items']
    
    for pod in pods:
        name = pod['metadata']['name']
        status = pod['status']['phase']
        ready = all(c['ready'] for c in pod['status'].get('containerStatuses', []))
        
        # Calculate health score
        health_score = 1.0 if status == 'Running' and ready else 0.5
        
        # Get resource usage
        resource_usage = {
            'cpu_request': pod['spec']['containers'][0]['resources'].get('requests', {}).get('cpu', 'unknown'),
            'memory_request': pod['spec']['containers'][0]['resources'].get('requests', {}).get('memory', 'unknown')
        }
        
        cur.execute("""
            INSERT INTO mesh_health (
                component_name, component_type, namespace,
                status, health_score, resource_usage, last_check
            ) VALUES (%s, %s, %s, %s, %s, %s, %s)
        """, (
            name, 'control_plane', 'istio-system',
            status, health_score, json.dumps(resource_usage), datetime.now()
        ))

conn.commit()
cur.close()
conn.close()
EOF
        
    elif [ "$MESH_TYPE" == "linkerd" ]; then
        # Check Linkerd components
        linkerd check
        
        # Get metrics
        linkerd viz stat deploy -n default
    fi
    
    log_success "Service mesh health check complete"
}

# Generate mesh report
generate_mesh_report() {
    local output_file=${1:-"mesh-report.html"}
    
    log_info "Generating service mesh report..."
    
    psql -U ${MESH_USER} -d ${MESH_DB} -t <<EOF > mesh-stats.txt
-- Service mesh statistics
SELECT 
    'Total Services' as metric,
    COUNT(*) as value
FROM mesh_services
WHERE mesh_enabled = true
UNION ALL
SELECT 
    'Active Endpoints',
    COUNT(*)
FROM service_endpoints
WHERE ready = true
UNION ALL
SELECT 
    'Traffic Policies',
    COUNT(*)
FROM traffic_policies
WHERE enabled = true
UNION ALL
SELECT 
    'Total Requests (24h)',
    SUM(request_count)
FROM mesh_metrics
WHERE timestamp > NOW() - INTERVAL '24 hours';

-- Top services by traffic
SELECT 
    s.name,
    SUM(m.request_count) as total_requests,
    AVG(m.p95_latency_ms) as avg_p95_latency,
    (SUM(m.error_count)::FLOAT / NULLIF(SUM(m.request_count), 0) * 100) as error_rate
FROM mesh_metrics m
JOIN mesh_services s ON m.destination_service_id = s.id
WHERE m.timestamp > NOW() - INTERVAL '1 hour'
GROUP BY s.name
ORDER BY total_requests DESC
LIMIT 10;
EOF
    
    # Generate HTML report
    cat > ${output_file} <<EOF
<!DOCTYPE html>
<html>
<head>
    <title>TerraFusion Service Mesh Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { background: #2c3e50; color: white; padding: 20px; border-radius: 5px; }
        .metric-card { 
            display: inline-block; 
            background: #f8f9fa; 
            padding: 20px; 
            margin: 10px;
            border-radius: 5px;
            border: 1px solid #dee2e6;
            min-width: 200px;
        }
        .metric-value { font-size: 36px; font-weight: bold; color: #007bff; }
        .metric-label { color: #6c757d; margin-top: 5px; }
        table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        th, td { padding: 12px; text-align: left; border-bottom: 1px solid #dee2e6; }
        th { background: #f8f9fa; font-weight: bold; }
        .status-healthy { color: #28a745; }
        .status-warning { color: #ffc107; }
        .status-error { color: #dc3545; }
        .dependency-graph { margin: 20px 0; text-align: center; }
    </style>
</head>
<body>
    <div class="header">
        <h1>TerraFusion Service Mesh Report</h1>
        <p>Generated: $(date)</p>
        <p>Mesh Type: ${MESH_TYPE}</p>
    </div>
    
    <h2>Key Metrics</h2>
    <div class="metrics">
        $(awk 'NF {print "<div class=\"metric-card\"><div class=\"metric-value\">" $NF "</div><div class=\"metric-label\">" substr($0, 1, length($0)-length($NF)-1) "</div></div>"}' mesh-stats.txt | head -4)
    </div>
    
    <h2>Service Performance</h2>
    <table>
        <tr>
            <th>Service</th>
            <th>Total Requests</th>
            <th>P95 Latency (ms)</th>
            <th>Error Rate (%)</th>
        </tr>
        $(tail -n +6 mesh-stats.txt | awk '{
            error_class = ($4 > 5) ? "status-error" : ($4 > 1) ? "status-warning" : "status-healthy";
            print "<tr><td>" $1 "</td><td>" $2 "</td><td>" $3 "</td><td class=\"" error_class "\">" $4 "</td></tr>"
        }')
    </table>
    
    <h2>Service Dependencies</h2>
    <div class="dependency-graph">
        <img src="service-dependencies.svg" alt="Service Dependency Graph" style="max-width: 100%;">
    </div>
    
    <h2>Mesh Health Status</h2>
    <table>
        <tr>
            <th>Component</th>
            <th>Type</th>
            <th>Status</th>
            <th>Health Score</th>
        </tr>
$(psql -U ${MESH_USER} -d ${MESH_DB} -t -A -F'</td><td>' <<SQL
SELECT 
    component_name,
    component_type,
    status,
    health_score
FROM mesh_health
WHERE last_check > NOW() - INTERVAL '5 minutes'
ORDER BY component_type, component_name;
SQL
| sed 's/^/<tr><td>/; s/$/<\/td><\/tr>/')
    </table>
    
    <h2>Active Traffic Policies</h2>
    <table>
        <tr>
            <th>Policy Name</th>
            <th>Type</th>
            <th>Configuration</th>
            <th>Updated</th>
        </tr>
$(psql -U ${MESH_USER} -d ${MESH_DB} -t -A -F'</td><td>' <<SQL
SELECT 
    name,
    policy_type,
    config::text,
    to_char(updated_at, 'YYYY-MM-DD HH24:MI:SS')
FROM traffic_policies
WHERE enabled = true
ORDER BY updated_at DESC
LIMIT 20;
SQL
| sed 's/^/<tr><td>/; s/$/<\/td><\/tr>/')
    </table>
    
    <h2>Quick Links</h2>
    <ul>
        <li><a href="${KIALI_URL}">Kiali Dashboard</a></li>
        <li><a href="${GRAFANA_URL}">Grafana Dashboards</a></li>
        <li><a href="${JAEGER_URL}">Jaeger Tracing</a></li>
    </ul>
</body>
</html>
EOF
    
    rm -f mesh-stats.txt
    log_success "Service mesh report generated: ${output_file}"
}

# Main execution
case ${1:-} in
    "init")
        init_mesh_database
        install_service_mesh "${MESH_TYPE}"
        deploy_mesh_config
        ;;
        
    "monitor")
        monitor_mesh
        ;;
        
    "traffic")
        apply_traffic_management "$2" "$3" "$4"
        ;;
        
    "analyze")
        analyze_dependencies
        ;;
        
    "health")
        check_mesh_health
        ;;
        
    "report")
        generate_mesh_report "${2:-mesh-report.html}"
        ;;
        
    *)
        echo "Usage: $0 {init|monitor|traffic|analyze|health|report} [args...]"
        echo ""
        echo "Commands:"
        echo "  init                         - Initialize service mesh"
        echo "  monitor                      - Setup mesh monitoring"
        echo "  traffic <svc> <type> <cfg>   - Apply traffic policy"
        echo "  analyze                      - Analyze service dependencies"
        echo "  health                       - Check mesh health"
        echo "  report [file]                - Generate mesh report"
        echo ""
        echo "Traffic policy examples:"
        echo "  $0 traffic api-service canary 'v1:80,v2:20'"
        echo "  $0 traffic api-service circuit-breaker 100"
        echo "  $0 traffic api-service rate-limit 1000"
        exit 1
        ;;
esac
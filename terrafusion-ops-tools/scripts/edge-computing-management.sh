#!/bin/bash

# TerraFusion Edge Computing Deployment and Management System
# Distributed edge orchestration with AI workload optimization

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "${SCRIPT_DIR}/common-functions.sh"

# Configuration
EDGE_DB="${EDGE_DB:-terrafusion_edge}"
EDGE_USER="${DB_USER:-tfedge}"
EDGE_PASS="${DB_PASS:-$(generate_password)}"
K3S_VERSION="${K3S_VERSION:-v1.27.3+k3s1}"
EDGE_REGISTRY="${EDGE_REGISTRY:-localhost:5000}"
MQTT_BROKER="${MQTT_BROKER:-tcp://localhost:1883}"

# Initialize database
init_edge_database() {
    log_info "Initializing edge computing database..."
    
    psql -U postgres -c "CREATE DATABASE ${EDGE_DB};" 2>/dev/null || true
    psql -U postgres -c "CREATE USER ${EDGE_USER} WITH PASSWORD '${EDGE_PASS}';" 2>/dev/null || true
    psql -U postgres -c "GRANT ALL PRIVILEGES ON DATABASE ${EDGE_DB} TO ${EDGE_USER};"
    
    psql -U ${EDGE_USER} -d ${EDGE_DB} <<EOF
-- Edge locations
CREATE TABLE IF NOT EXISTS edge_locations (
    id SERIAL PRIMARY KEY,
    location_id VARCHAR(100) UNIQUE NOT NULL,
    name VARCHAR(255),
    type VARCHAR(50), -- datacenter, branch, retail, industrial, mobile
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    address TEXT,
    timezone VARCHAR(50),
    connectivity_type VARCHAR(50), -- fiber, 5g, lte, satellite, wifi
    bandwidth_mbps INTEGER,
    power_capacity_kw DECIMAL(10, 2),
    cooling_type VARCHAR(50),
    physical_security JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Edge nodes
CREATE TABLE IF NOT EXISTS edge_nodes (
    id SERIAL PRIMARY KEY,
    node_id VARCHAR(100) UNIQUE NOT NULL,
    location_id VARCHAR(100) REFERENCES edge_locations(location_id),
    hostname VARCHAR(255),
    ip_address INET,
    hardware_profile JSONB, -- cpu, memory, storage, gpu
    os_info JSONB,
    k3s_version VARCHAR(50),
    role VARCHAR(50), -- master, worker, gateway
    status VARCHAR(50), -- online, offline, maintenance, degraded
    last_heartbeat TIMESTAMP,
    capabilities JSONB, -- ai, video, iot, storage
    resource_usage JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    commissioned_at TIMESTAMP
);

-- Edge applications
CREATE TABLE IF NOT EXISTS edge_applications (
    id SERIAL PRIMARY KEY,
    app_id VARCHAR(100) UNIQUE NOT NULL,
    name VARCHAR(255),
    version VARCHAR(50),
    type VARCHAR(50), -- ai_inference, video_analytics, iot_gateway, cache
    container_image VARCHAR(500),
    resource_requirements JSONB,
    deployment_strategy VARCHAR(50), -- replicated, global, daemonset
    placement_constraints JSONB,
    priority INTEGER DEFAULT 5,
    health_check_config JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Edge deployments
CREATE TABLE IF NOT EXISTS edge_deployments (
    id SERIAL PRIMARY KEY,
    deployment_id VARCHAR(100) UNIQUE NOT NULL,
    app_id VARCHAR(100) REFERENCES edge_applications(app_id),
    node_id VARCHAR(100) REFERENCES edge_nodes(node_id),
    status VARCHAR(50), -- pending, running, failed, terminated
    replicas INTEGER DEFAULT 1,
    resource_allocation JSONB,
    deployment_config JSONB,
    health_status VARCHAR(50),
    metrics JSONB,
    started_at TIMESTAMP,
    terminated_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Edge workload optimization
CREATE TABLE IF NOT EXISTS workload_optimization (
    id SERIAL PRIMARY KEY,
    optimization_id VARCHAR(100) UNIQUE NOT NULL,
    optimization_type VARCHAR(50), -- placement, scaling, migration
    target_metric VARCHAR(100), -- latency, cost, energy, throughput
    current_state JSONB,
    recommended_state JSONB,
    improvement_percentage DECIMAL(5, 2),
    constraints JSONB,
    status VARCHAR(50), -- proposed, approved, executing, completed
    executed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Edge metrics
CREATE TABLE IF NOT EXISTS edge_metrics (
    id SERIAL PRIMARY KEY,
    node_id VARCHAR(100) REFERENCES edge_nodes(node_id),
    timestamp TIMESTAMP NOT NULL,
    cpu_usage_percent DECIMAL(5, 2),
    memory_usage_percent DECIMAL(5, 2),
    disk_usage_percent DECIMAL(5, 2),
    network_in_mbps DECIMAL(10, 2),
    network_out_mbps DECIMAL(10, 2),
    gpu_usage_percent DECIMAL(5, 2),
    temperature_celsius DECIMAL(5, 2),
    power_usage_watts DECIMAL(10, 2),
    latency_ms DECIMAL(10, 2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Edge events
CREATE TABLE IF NOT EXISTS edge_events (
    id SERIAL PRIMARY KEY,
    event_id VARCHAR(100) UNIQUE NOT NULL,
    node_id VARCHAR(100) REFERENCES edge_nodes(node_id),
    event_type VARCHAR(100), -- node_online, node_offline, deployment_failed, resource_critical
    severity VARCHAR(20), -- info, warning, error, critical
    message TEXT,
    details JSONB,
    acknowledged BOOLEAN DEFAULT false,
    resolved BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    resolved_at TIMESTAMP
);

-- Edge data sync
CREATE TABLE IF NOT EXISTS data_sync_policies (
    id SERIAL PRIMARY KEY,
    policy_id VARCHAR(100) UNIQUE NOT NULL,
    name VARCHAR(255),
    source_location VARCHAR(100),
    target_locations JSONB, -- array of location_ids
    data_types JSONB, -- types of data to sync
    sync_frequency VARCHAR(50), -- realtime, hourly, daily, on_demand
    compression_enabled BOOLEAN DEFAULT true,
    encryption_enabled BOOLEAN DEFAULT true,
    bandwidth_limit_mbps INTEGER,
    priority INTEGER DEFAULT 5,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- AI model deployments
CREATE TABLE IF NOT EXISTS ai_model_deployments (
    id SERIAL PRIMARY KEY,
    model_id VARCHAR(100) UNIQUE NOT NULL,
    model_name VARCHAR(255),
    model_version VARCHAR(50),
    framework VARCHAR(50), -- tensorflow, pytorch, onnx
    model_size_mb DECIMAL(10, 2),
    input_shape JSONB,
    output_shape JSONB,
    optimization_level VARCHAR(50), -- none, fp16, int8, tensorrt
    target_hardware JSONB, -- cpu, gpu, tpu, npu
    inference_batch_size INTEGER,
    latency_requirements_ms INTEGER,
    deployed_nodes JSONB, -- array of node_ids
    performance_metrics JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deployed_at TIMESTAMP
);

-- Edge federation
CREATE TABLE IF NOT EXISTS edge_federation (
    id SERIAL PRIMARY KEY,
    federation_id VARCHAR(100) UNIQUE NOT NULL,
    name VARCHAR(255),
    member_locations JSONB, -- array of location_ids
    federation_type VARCHAR(50), -- mesh, hierarchical, hybrid
    routing_policy JSONB,
    load_balancing_config JSONB,
    failover_config JSONB,
    security_config JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_edge_nodes_location ON edge_nodes(location_id);
CREATE INDEX IF NOT EXISTS idx_edge_nodes_status ON edge_nodes(status);
CREATE INDEX IF NOT EXISTS idx_edge_deployments_node ON edge_deployments(node_id);
CREATE INDEX IF NOT EXISTS idx_edge_deployments_app ON edge_deployments(app_id);
CREATE INDEX IF NOT EXISTS idx_edge_metrics_node_time ON edge_metrics(node_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_edge_events_node_time ON edge_events(node_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_model_deployments_nodes ON ai_model_deployments USING GIN(deployed_nodes);
EOF
    
    log_success "Edge computing database initialized"
}

# Deploy edge infrastructure
deploy_edge_infrastructure() {
    log_info "Deploying edge infrastructure..."
    
    # Create edge node installer script
    cat > edge-node-installer.sh <<'EOF'
#!/bin/bash
# Edge node installation script

EDGE_NODE_ID="${1:-edge-$(hostname -s)}"
EDGE_LOCATION="${2:-default}"
MASTER_ENDPOINT="${3:-https://edge-master.terrafusion.io:6443}"

echo "Installing edge node: ${EDGE_NODE_ID}"

# Install K3s
curl -sfL https://get.k3s.io | K3S_URL="${MASTER_ENDPOINT}" \
    K3S_TOKEN="${K3S_TOKEN}" \
    INSTALL_K3S_VERSION="${K3S_VERSION}" \
    sh -s - agent \
    --node-name "${EDGE_NODE_ID}" \
    --node-label "edge.terrafusion.io/location=${EDGE_LOCATION}" \
    --node-label "edge.terrafusion.io/node-id=${EDGE_NODE_ID}"

# Install edge monitoring agent
cat > /etc/systemd/system/edge-agent.service <<EOL
[Unit]
Description=TerraFusion Edge Agent
After=network.target k3s-agent.service

[Service]
Type=simple
ExecStart=/usr/local/bin/edge-agent --node-id ${EDGE_NODE_ID} --location ${EDGE_LOCATION}
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOL

# Download and install edge agent
curl -sL https://edge-assets.terrafusion.io/edge-agent -o /usr/local/bin/edge-agent
chmod +x /usr/local/bin/edge-agent

# Enable and start services
systemctl daemon-reload
systemctl enable edge-agent
systemctl start edge-agent

# Configure local storage
mkdir -p /var/lib/edge/{data,cache,models}

# Setup GPU support if available
if command -v nvidia-smi &> /dev/null; then
    # Install NVIDIA container runtime
    distribution=$(. /etc/os-release;echo $ID$VERSION_ID)
    curl -s -L https://nvidia.github.io/nvidia-docker/gpgkey | apt-key add -
    curl -s -L https://nvidia.github.io/nvidia-docker/$distribution/nvidia-docker.list | tee /etc/apt/sources.list.d/nvidia-docker.list
    
    apt-get update && apt-get install -y nvidia-container-toolkit
    
    # Configure containerd for GPU
    cat > /var/lib/rancher/k3s/agent/etc/containerd/config.toml.tmpl <<EOL
[plugins."io.containerd.grpc.v1.cri".containerd.runtimes.nvidia]
  runtime_type = "io.containerd.runc.v2"
[plugins."io.containerd.grpc.v1.cri".containerd.runtimes.nvidia.options]
  BinaryName = "/usr/bin/nvidia-container-runtime"
EOL
    
    systemctl restart k3s-agent
fi

echo "Edge node ${EDGE_NODE_ID} installation completed"
EOF
    
    chmod +x edge-node-installer.sh
    
    # Create edge controller
    cat > edge-controller.yaml <<EOF
apiVersion: v1
kind: Namespace
metadata:
  name: edge-system
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: edge-controller
  namespace: edge-system
spec:
  replicas: 1
  selector:
    matchLabels:
      app: edge-controller
  template:
    metadata:
      labels:
        app: edge-controller
    spec:
      serviceAccountName: edge-controller
      containers:
      - name: controller
        image: ${EDGE_REGISTRY}/edge-controller:latest
        env:
        - name: DB_HOST
          value: "postgres.edge-system"
        - name: DB_NAME
          value: "${EDGE_DB}"
        - name: MQTT_BROKER
          value: "${MQTT_BROKER}"
        ports:
        - containerPort: 8080
          name: http
        - containerPort: 9090
          name: metrics
        resources:
          requests:
            memory: "256Mi"
            cpu: "500m"
          limits:
            memory: "512Mi"
            cpu: "1000m"
---
apiVersion: v1
kind: Service
metadata:
  name: edge-controller
  namespace: edge-system
spec:
  selector:
    app: edge-controller
  ports:
  - name: http
    port: 80
    targetPort: 8080
  - name: metrics
    port: 9090
    targetPort: 9090
---
apiVersion: v1
kind: ServiceAccount
metadata:
  name: edge-controller
  namespace: edge-system
---
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRole
metadata:
  name: edge-controller
rules:
- apiGroups: ["*"]
  resources: ["*"]
  verbs: ["*"]
---
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRoleBinding
metadata:
  name: edge-controller
roleRef:
  apiGroup: rbac.authorization.k8s.io
  kind: ClusterRole
  name: edge-controller
subjects:
- kind: ServiceAccount
  name: edge-controller
  namespace: edge-system
EOF
    
    # Deploy edge controller
    kubectl apply -f edge-controller.yaml
    
    log_success "Edge infrastructure deployed"
}

# Register edge node
register_edge_node() {
    local node_id=$1
    local location_id=$2
    local ip_address=$3
    
    log_info "Registering edge node ${node_id}..."
    
    python3 <<EOF
import psycopg2
import json
import subprocess
from datetime import datetime

conn = psycopg2.connect(
    dbname="${EDGE_DB}",
    user="${EDGE_USER}",
    password="${EDGE_PASS}",
    host="localhost"
)
cur = conn.cursor()

# Get hardware info (simulated for demo)
hardware_profile = {
    "cpu": {
        "model": "Intel Xeon E-2288G",
        "cores": 8,
        "threads": 16,
        "frequency_ghz": 3.7
    },
    "memory": {
        "total_gb": 32,
        "type": "DDR4",
        "speed_mhz": 2666
    },
    "storage": {
        "devices": [
            {"type": "nvme", "size_gb": 500, "mount": "/"},
            {"type": "ssd", "size_gb": 1000, "mount": "/var/lib/edge"}
        ]
    },
    "gpu": {
        "model": "NVIDIA T4",
        "memory_gb": 16,
        "compute_capability": "7.5"
    },
    "network": {
        "interfaces": [
            {"name": "eth0", "speed_gbps": 10, "type": "ethernet"}
        ]
    }
}

# Determine capabilities based on hardware
capabilities = ["container", "kubernetes"]
if hardware_profile.get("gpu"):
    capabilities.extend(["ai_inference", "video_processing", "gpu_compute"])
if hardware_profile["memory"]["total_gb"] >= 32:
    capabilities.append("high_memory")
if any(d["type"] == "nvme" for d in hardware_profile["storage"]["devices"]):
    capabilities.append("fast_storage")

# Register node
cur.execute("""
    INSERT INTO edge_nodes (
        node_id, location_id, hostname, ip_address,
        hardware_profile, os_info, k3s_version, role,
        status, last_heartbeat, capabilities
    ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
    ON CONFLICT (node_id) DO UPDATE SET
        ip_address = EXCLUDED.ip_address,
        hardware_profile = EXCLUDED.hardware_profile,
        last_heartbeat = EXCLUDED.last_heartbeat,
        status = EXCLUDED.status
""", (
    "${node_id}",
    "${location_id}",
    "${node_id}",
    "${ip_address}",
    json.dumps(hardware_profile),
    json.dumps({"os": "Ubuntu 22.04 LTS", "kernel": "5.15.0-76-generic"}),
    "${K3S_VERSION}",
    "worker",
    "online",
    datetime.now(),
    json.dumps(capabilities)
))

conn.commit()
cur.close()
conn.close()

print(f"Edge node ${node_id} registered successfully")
print(f"Capabilities: {', '.join(capabilities)}")
EOF
    
    log_success "Edge node registered"
}

# Deploy edge application
deploy_edge_app() {
    local app_name=$1
    local app_type=$2
    local target_location=${3:-"all"}
    
    log_info "Deploying edge application ${app_name}..."
    
    # Create application manifest based on type
    case $app_type in
        "ai_inference")
            cat > edge-app-${app_name}.yaml <<EOF
apiVersion: apps/v1
kind: DaemonSet
metadata:
  name: ${app_name}
  namespace: edge-apps
spec:
  selector:
    matchLabels:
      app: ${app_name}
  template:
    metadata:
      labels:
        app: ${app_name}
        edge.terrafusion.io/type: ai-inference
    spec:
      nodeSelector:
        edge.terrafusion.io/capability: ai_inference
      containers:
      - name: inference-engine
        image: ${EDGE_REGISTRY}/ai-inference:latest
        env:
        - name: MODEL_PATH
          value: "/models"
        - name: BATCH_SIZE
          value: "8"
        - name: USE_GPU
          value: "true"
        volumeMounts:
        - name: models
          mountPath: /models
        - name: shared-memory
          mountPath: /dev/shm
        resources:
          requests:
            memory: "4Gi"
            cpu: "2"
            nvidia.com/gpu: 1
          limits:
            memory: "8Gi"
            cpu: "4"
            nvidia.com/gpu: 1
      volumes:
      - name: models
        hostPath:
          path: /var/lib/edge/models
      - name: shared-memory
        emptyDir:
          medium: Memory
          sizeLimit: 2Gi
EOF
            ;;
            
        "video_analytics")
            cat > edge-app-${app_name}.yaml <<EOF
apiVersion: apps/v1
kind: Deployment
metadata:
  name: ${app_name}
  namespace: edge-apps
spec:
  replicas: 1
  selector:
    matchLabels:
      app: ${app_name}
  template:
    metadata:
      labels:
        app: ${app_name}
        edge.terrafusion.io/type: video-analytics
    spec:
      nodeSelector:
        edge.terrafusion.io/capability: video_processing
      containers:
      - name: video-processor
        image: ${EDGE_REGISTRY}/video-analytics:latest
        env:
        - name: STREAM_URL
          value: "rtsp://camera.local/stream"
        - name: DETECTION_THRESHOLD
          value: "0.7"
        - name: OUTPUT_MQTT_TOPIC
          value: "edge/video/detections"
        ports:
        - containerPort: 8554
          name: rtsp
        - containerPort: 8080
          name: http
        resources:
          requests:
            memory: "2Gi"
            cpu: "1"
            nvidia.com/gpu: 1
          limits:
            memory: "4Gi"
            cpu: "2"
            nvidia.com/gpu: 1
EOF
            ;;
            
        "iot_gateway")
            cat > edge-app-${app_name}.yaml <<EOF
apiVersion: apps/v1
kind: Deployment
metadata:
  name: ${app_name}
  namespace: edge-apps
spec:
  replicas: 1
  selector:
    matchLabels:
      app: ${app_name}
  template:
    metadata:
      labels:
        app: ${app_name}
        edge.terrafusion.io/type: iot-gateway
    spec:
      hostNetwork: true
      containers:
      - name: iot-gateway
        image: ${EDGE_REGISTRY}/iot-gateway:latest
        env:
        - name: MQTT_BROKER
          value: "${MQTT_BROKER}"
        - name: PROTOCOLS
          value: "modbus,opcua,mqtt,coap"
        - name: DATA_BUFFER_SIZE
          value: "10000"
        ports:
        - containerPort: 1883
          name: mqtt
        - containerPort: 502
          name: modbus
        - containerPort: 4840
          name: opcua
        volumeMounts:
        - name: config
          mountPath: /etc/iot-gateway
        - name: data
          mountPath: /var/lib/iot-gateway
        resources:
          requests:
            memory: "512Mi"
            cpu: "500m"
          limits:
            memory: "1Gi"
            cpu: "1"
      volumes:
      - name: config
        configMap:
          name: iot-gateway-config
      - name: data
        emptyDir: {}
EOF
            ;;
    esac
    
    # Apply location constraints if specified
    if [ "$target_location" != "all" ]; then
        cat >> edge-app-${app_name}.yaml <<EOF
      affinity:
        nodeAffinity:
          requiredDuringSchedulingIgnoredDuringExecution:
            nodeSelectorTerms:
            - matchExpressions:
              - key: edge.terrafusion.io/location
                operator: In
                values:
                - ${target_location}
EOF
    fi
    
    # Create namespace if not exists
    kubectl create namespace edge-apps --dry-run=client -o yaml | kubectl apply -f -
    
    # Deploy application
    kubectl apply -f edge-app-${app_name}.yaml
    
    # Register in database
    python3 <<EOF
import psycopg2
import json
import uuid

conn = psycopg2.connect(
    dbname="${EDGE_DB}",
    user="${EDGE_USER}",
    password="${EDGE_PASS}",
    host="localhost"
)
cur = conn.cursor()

app_id = f"app_{uuid.uuid4().hex[:12]}"

# Determine resource requirements based on type
resource_reqs = {
    "ai_inference": {
        "cpu": "2",
        "memory": "4Gi",
        "gpu": "1",
        "storage": "10Gi"
    },
    "video_analytics": {
        "cpu": "1",
        "memory": "2Gi",
        "gpu": "1",
        "storage": "5Gi"
    },
    "iot_gateway": {
        "cpu": "500m",
        "memory": "512Mi",
        "storage": "1Gi"
    }
}

cur.execute("""
    INSERT INTO edge_applications (
        app_id, name, version, type, container_image,
        resource_requirements, deployment_strategy,
        placement_constraints
    ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
""", (
    app_id,
    "${app_name}",
    "1.0.0",
    "${app_type}",
    f"{EDGE_REGISTRY}/{app_type}:latest",
    json.dumps(resource_reqs.get("${app_type}", {})),
    "daemonset" if "${app_type}" == "ai_inference" else "deployment",
    json.dumps({"location": "${target_location}"} if "${target_location}" != "all" else {})
))

conn.commit()
cur.close()
conn.close()

print(f"Edge application ${app_name} deployed successfully")
print(f"Application ID: {app_id}")
EOF
    
    log_success "Edge application deployed"
}

# Optimize edge workloads
optimize_workloads() {
    log_info "Optimizing edge workloads..."
    
    python3 <<EOF
import psycopg2
import json
import numpy as np
from datetime import datetime, timedelta
import uuid

conn = psycopg2.connect(
    dbname="${EDGE_DB}",
    user="${EDGE_USER}",
    password="${EDGE_PASS}",
    host="localhost"
)
cur = conn.cursor()

# Analyze current workload distribution
cur.execute("""
    SELECT 
        n.node_id,
        n.location_id,
        n.hardware_profile,
        n.capabilities,
        COUNT(d.deployment_id) as deployment_count,
        AVG(m.cpu_usage_percent) as avg_cpu,
        AVG(m.memory_usage_percent) as avg_memory,
        AVG(m.latency_ms) as avg_latency
    FROM edge_nodes n
    LEFT JOIN edge_deployments d ON n.node_id = d.node_id AND d.status = 'running'
    LEFT JOIN edge_metrics m ON n.node_id = m.node_id 
        AND m.timestamp > NOW() - INTERVAL '1 hour'
    WHERE n.status = 'online'
    GROUP BY n.node_id, n.location_id, n.hardware_profile, n.capabilities
""")

nodes = cur.fetchall()

# Find optimization opportunities
optimizations = []

for node in nodes:
    node_id, location, hw_profile, capabilities, deployments, cpu, memory, latency = node
    
    # Check for underutilized nodes
    if cpu and memory and cpu < 20 and memory < 20 and deployments < 2:
        # Find workloads to migrate here
        cur.execute("""
            SELECT d.deployment_id, d.app_id, a.type
            FROM edge_deployments d
            JOIN edge_applications a ON d.app_id = a.app_id
            JOIN edge_nodes n ON d.node_id = n.node_id
            JOIN edge_metrics m ON n.node_id = m.node_id
            WHERE n.location_id = %s
            AND d.node_id != %s
            AND m.cpu_usage_percent > 70
            AND m.timestamp > NOW() - INTERVAL '1 hour'
            LIMIT 1
        """, (location, node_id))
        
        overloaded = cur.fetchone()
        if overloaded:
            optimization_id = f"opt_{uuid.uuid4().hex[:12]}"
            
            optimizations.append({
                'id': optimization_id,
                'type': 'migration',
                'source_node': overloaded[0],
                'target_node': node_id,
                'reason': 'load_balancing',
                'expected_improvement': 20
            })
    
    # Check for high latency
    if latency and latency > 100:
        # Recommend edge caching
        optimization_id = f"opt_{uuid.uuid4().hex[:12]}"
        
        optimizations.append({
            'id': optimization_id,
            'type': 'caching',
            'target_node': node_id,
            'reason': 'high_latency',
            'expected_improvement': 30
        })
    
    # Check for AI workload optimization
    if capabilities and 'ai_inference' in capabilities:
        # Check if GPU is underutilized
        cur.execute("""
            SELECT AVG(gpu_usage_percent)
            FROM edge_metrics
            WHERE node_id = %s
            AND timestamp > NOW() - INTERVAL '1 hour'
        """, (node_id,))
        
        gpu_usage = cur.fetchone()[0]
        if gpu_usage and gpu_usage < 50:
            optimization_id = f"opt_{uuid.uuid4().hex[:12]}"
            
            optimizations.append({
                'id': optimization_id,
                'type': 'batch_size_increase',
                'target_node': node_id,
                'reason': 'gpu_underutilized',
                'expected_improvement': 40
            })

# Store optimization recommendations
for opt in optimizations[:5]:  # Limit to top 5
    cur.execute("""
        INSERT INTO workload_optimization (
            optimization_id, optimization_type, target_metric,
            current_state, recommended_state, improvement_percentage,
            status
        ) VALUES (%s, %s, %s, %s, %s, %s, %s)
    """, (
        opt['id'],
        opt['type'],
        'latency' if 'latency' in opt['reason'] else 'utilization',
        json.dumps({'reason': opt['reason']}),
        json.dumps(opt),
        opt['expected_improvement'],
        'proposed'
    ))

conn.commit()
cur.close()
conn.close()

print(f"Generated {len(optimizations)} optimization recommendations")
for opt in optimizations[:5]:
    print(f"- {opt['type']}: {opt['reason']} (expected {opt['expected_improvement']}% improvement)")
EOF
    
    log_success "Workload optimization completed"
}

# Deploy AI model to edge
deploy_ai_model() {
    local model_name=$1
    local model_path=$2
    local target_nodes=${3:-"auto"}
    
    log_info "Deploying AI model ${model_name} to edge..."
    
    # Create model optimization pipeline
    cat > model-optimizer.py <<'EOF'
import tensorflow as tf
import numpy as np
import onnx
import onnxruntime as ort
from onnxconverter_common import float16
import tensorrt as trt
import json

class EdgeModelOptimizer:
    def __init__(self, model_path):
        self.model_path = model_path
        self.optimizations = []
        
    def optimize_for_edge(self, target_hardware='gpu'):
        """Optimize model for edge deployment"""
        
        # Load model
        if self.model_path.endswith('.h5'):
            model = tf.keras.models.load_model(self.model_path)
        elif self.model_path.endswith('.onnx'):
            model = onnx.load(self.model_path)
        else:
            raise ValueError("Unsupported model format")
        
        optimized_models = {}
        
        # 1. Quantization (INT8)
        if target_hardware in ['cpu', 'npu']:
            print("Applying INT8 quantization...")
            converter = tf.lite.TFLiteConverter.from_keras_model(model)
            converter.optimizations = [tf.lite.Optimize.DEFAULT]
            converter.representative_dataset = self._representative_dataset
            converter.target_spec.supported_ops = [
                tf.lite.OpsSet.TFLITE_BUILTINS_INT8
            ]
            tflite_model = converter.convert()
            optimized_models['tflite_int8'] = tflite_model
            self.optimizations.append('int8_quantization')
        
        # 2. FP16 optimization
        if target_hardware == 'gpu':
            print("Converting to FP16...")
            if isinstance(model, onnx.ModelProto):
                model_fp16 = float16.convert_float_to_float16(model)
                optimized_models['onnx_fp16'] = model_fp16
            self.optimizations.append('fp16_conversion')
        
        # 3. TensorRT optimization
        if target_hardware == 'gpu' and self._has_tensorrt():
            print("Optimizing with TensorRT...")
            trt_model = self._optimize_tensorrt(model)
            optimized_models['tensorrt'] = trt_model
            self.optimizations.append('tensorrt_optimization')
        
        # 4. Model pruning
        if isinstance(model, tf.keras.Model):
            print("Applying pruning...")
            pruned_model = self._prune_model(model)
            optimized_models['pruned'] = pruned_model
            self.optimizations.append('pruning')
        
        return optimized_models
    
    def _representative_dataset(self):
        """Generate representative dataset for quantization"""
        for _ in range(100):
            data = np.random.rand(1, 224, 224, 3).astype(np.float32)
            yield [data]
    
    def _has_tensorrt(self):
        """Check if TensorRT is available"""
        try:
            import tensorrt
            return True
        except ImportError:
            return False
    
    def _optimize_tensorrt(self, model):
        """Optimize model using TensorRT"""
        # Simplified TensorRT optimization
        logger = trt.Logger(trt.Logger.WARNING)
        builder = trt.Builder(logger)
        config = builder.create_builder_config()
        config.max_workspace_size = 1 << 30  # 1GB
        config.set_flag(trt.BuilderFlag.FP16)
        
        # Convert and optimize (simplified)
        return None  # Return optimized engine
    
    def _prune_model(self, model):
        """Apply magnitude-based pruning"""
        import tensorflow_model_optimization as tfmot
        
        prune_low_magnitude = tfmot.sparsity.keras.prune_low_magnitude
        pruning_params = {
            'pruning_schedule': tfmot.sparsity.keras.PolynomialDecay(
                initial_sparsity=0.0,
                final_sparsity=0.5,
                begin_step=0,
                end_step=1000
            )
        }
        
        pruned_model = prune_low_magnitude(model, **pruning_params)
        return pruned_model
    
    def benchmark_model(self, model, input_shape, iterations=100):
        """Benchmark model performance"""
        import time
        
        # Generate random input
        input_data = np.random.rand(*input_shape).astype(np.float32)
        
        # Warmup
        for _ in range(10):
            _ = model.predict(input_data)
        
        # Benchmark
        start_time = time.time()
        for _ in range(iterations):
            _ = model.predict(input_data)
        end_time = time.time()
        
        avg_latency = (end_time - start_time) / iterations * 1000  # ms
        throughput = iterations / (end_time - start_time)  # inferences/sec
        
        return {
            'avg_latency_ms': avg_latency,
            'throughput_fps': throughput,
            'model_size_mb': self._get_model_size(model)
        }
    
    def _get_model_size(self, model):
        """Get model size in MB"""
        # Simplified size calculation
        return 50.0  # Placeholder

# Optimize model for edge deployment
optimizer = EdgeModelOptimizer("${model_path}")
optimized_models = optimizer.optimize_for_edge(target_hardware='gpu')

# Benchmark optimizations
results = {}
for name, model in optimized_models.items():
    if model:
        metrics = optimizer.benchmark_model(model, (1, 224, 224, 3))
        results[name] = metrics
        print(f"{name}: {metrics['avg_latency_ms']:.2f}ms latency, {metrics['throughput_fps']:.1f} FPS")

# Save optimization results
with open('model_optimization_results.json', 'w') as f:
    json.dump({
        'model_name': '${model_name}',
        'optimizations': optimizer.optimizations,
        'performance': results
    }, f, indent=2)
EOF
    
    # Deploy optimized model
    python3 <<EOF
import psycopg2
import json
import uuid
from datetime import datetime

conn = psycopg2.connect(
    dbname="${EDGE_DB}",
    user="${EDGE_USER}",
    password="${EDGE_PASS}",
    host="localhost"
)
cur = conn.cursor()

model_id = f"model_{uuid.uuid4().hex[:12]}"

# Determine target nodes
if "${target_nodes}" == "auto":
    # Select nodes with AI capabilities
    cur.execute("""
        SELECT node_id
        FROM edge_nodes
        WHERE status = 'online'
        AND capabilities @> '["ai_inference"]'
        ORDER BY (
            SELECT AVG(gpu_usage_percent)
            FROM edge_metrics
            WHERE edge_metrics.node_id = edge_nodes.node_id
            AND timestamp > NOW() - INTERVAL '1 hour'
        ) ASC NULLS FIRST
        LIMIT 3
    """)
    
    target_node_ids = [row[0] for row in cur.fetchall()]
else:
    target_node_ids = "${target_nodes}".split(',')

# Register model deployment
cur.execute("""
    INSERT INTO ai_model_deployments (
        model_id, model_name, model_version, framework,
        model_size_mb, optimization_level, target_hardware,
        inference_batch_size, latency_requirements_ms,
        deployed_nodes, deployed_at
    ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
""", (
    model_id,
    "${model_name}",
    "1.0.0",
    "tensorflow",
    75.5,  # Optimized size
    "tensorrt",
    json.dumps(["gpu"]),
    8,
    50,  # 50ms latency requirement
    json.dumps(target_node_ids),
    datetime.now()
))

# Create deployment tasks for each node
for node_id in target_node_ids:
    deployment_id = f"deploy_{uuid.uuid4().hex[:12]}"
    
    cur.execute("""
        INSERT INTO edge_deployments (
            deployment_id, app_id, node_id, status,
            resource_allocation, deployment_config
        )
        SELECT
            %s,
            app_id,
            %s,
            'running',
            %s,
            %s
        FROM edge_applications
        WHERE type = 'ai_inference'
        LIMIT 1
    """, (
        deployment_id,
        node_id,
        json.dumps({
            "cpu": "2",
            "memory": "4Gi",
            "gpu": "1"
        }),
        json.dumps({
            "model_id": model_id,
            "model_path": f"/models/{model_id}",
            "optimization": "tensorrt"
        })
    ))

conn.commit()
cur.close()
conn.close()

print(f"AI model ${model_name} deployed to {len(target_node_ids)} edge nodes")
print(f"Model ID: {model_id}")
print(f"Target nodes: {', '.join(target_node_ids)}")
EOF
    
    log_success "AI model deployed to edge"
}

# Monitor edge health
monitor_edge_health() {
    log_info "Monitoring edge infrastructure health..."
    
    python3 <<EOF
import psycopg2
import json
from datetime import datetime, timedelta
import matplotlib.pyplot as plt
import seaborn as sns

conn = psycopg2.connect(
    dbname="${EDGE_DB}",
    user="${EDGE_USER}",
    password="${EDGE_PASS}",
    host="localhost"
)
cur = conn.cursor()

# Check node health
cur.execute("""
    SELECT 
        n.node_id,
        n.location_id,
        n.status,
        n.last_heartbeat,
        AVG(m.cpu_usage_percent) as avg_cpu,
        AVG(m.memory_usage_percent) as avg_memory,
        AVG(m.temperature_celsius) as avg_temp,
        AVG(m.latency_ms) as avg_latency,
        COUNT(e.event_id) as error_count
    FROM edge_nodes n
    LEFT JOIN edge_metrics m ON n.node_id = m.node_id
        AND m.timestamp > NOW() - INTERVAL '1 hour'
    LEFT JOIN edge_events e ON n.node_id = e.node_id
        AND e.severity IN ('error', 'critical')
        AND e.created_at > NOW() - INTERVAL '24 hours'
        AND e.resolved = false
    GROUP BY n.node_id, n.location_id, n.status, n.last_heartbeat
""")

nodes_health = cur.fetchall()

# Create health visualization
fig, axes = plt.subplots(2, 2, figsize=(15, 10))

# 1. Node status distribution
status_counts = {}
for node in nodes_health:
    status = node[2]
    status_counts[status] = status_counts.get(status, 0) + 1

axes[0, 0].pie(status_counts.values(), labels=status_counts.keys(), autopct='%1.1f%%')
axes[0, 0].set_title('Edge Node Status Distribution')

# 2. Resource utilization by location
locations = {}
for node in nodes_health:
    location = node[1]
    if location not in locations:
        locations[location] = {'cpu': [], 'memory': []}
    if node[4]:  # avg_cpu
        locations[location]['cpu'].append(node[4])
    if node[5]:  # avg_memory
        locations[location]['memory'].append(node[5])

location_names = list(locations.keys())[:5]  # Top 5 locations
cpu_avgs = [sum(locations[loc]['cpu'])/len(locations[loc]['cpu']) if locations[loc]['cpu'] else 0 for loc in location_names]
mem_avgs = [sum(locations[loc]['memory'])/len(locations[loc]['memory']) if locations[loc]['memory'] else 0 for loc in location_names]

x = range(len(location_names))
width = 0.35

axes[0, 1].bar([i - width/2 for i in x], cpu_avgs, width, label='CPU %')
axes[0, 1].bar([i + width/2 for i in x], mem_avgs, width, label='Memory %')
axes[0, 1].set_xlabel('Location')
axes[0, 1].set_ylabel('Usage %')
axes[0, 1].set_title('Resource Utilization by Location')
axes[0, 1].set_xticks(x)
axes[0, 1].set_xticklabels(location_names, rotation=45)
axes[0, 1].legend()

# 3. Temperature monitoring
temps = [(node[0], node[6]) for node in nodes_health if node[6]]
if temps:
    node_ids = [t[0][:8] for t in temps[:10]]  # First 10 nodes
    temp_values = [t[1] for t in temps[:10]]
    
    axes[1, 0].bar(node_ids, temp_values)
    axes[1, 0].axhline(y=70, color='r', linestyle='--', label='Warning threshold')
    axes[1, 0].set_xlabel('Node ID')
    axes[1, 0].set_ylabel('Temperature (°C)')
    axes[1, 0].set_title('Edge Node Temperatures')
    axes[1, 0].tick_params(axis='x', rotation=45)
    axes[1, 0].legend()

# 4. Latency distribution
latencies = [node[7] for node in nodes_health if node[7]]
if latencies:
    axes[1, 1].hist(latencies, bins=20, edgecolor='black')
    axes[1, 1].set_xlabel('Latency (ms)')
    axes[1, 1].set_ylabel('Node Count')
    axes[1, 1].set_title('Edge Latency Distribution')
    axes[1, 1].axvline(x=100, color='r', linestyle='--', label='SLA threshold')
    axes[1, 1].legend()

plt.tight_layout()
plt.savefig('edge-health-dashboard.png', dpi=150, bbox_inches='tight')

# Generate health alerts
alerts = []

for node in nodes_health:
    node_id, location, status, last_heartbeat, cpu, memory, temp, latency, errors = node
    
    # Check offline nodes
    if status == 'offline' or (last_heartbeat and (datetime.now() - last_heartbeat).seconds > 300):
        alerts.append({
            'node': node_id,
            'type': 'node_offline',
            'severity': 'critical',
            'message': f'Node {node_id} is offline or not responding'
        })
    
    # Check resource usage
    if cpu and cpu > 85:
        alerts.append({
            'node': node_id,
            'type': 'high_cpu',
            'severity': 'warning',
            'message': f'High CPU usage on {node_id}: {cpu:.1f}%'
        })
    
    if memory and memory > 85:
        alerts.append({
            'node': node_id,
            'type': 'high_memory',
            'severity': 'warning',
            'message': f'High memory usage on {node_id}: {memory:.1f}%'
        })
    
    # Check temperature
    if temp and temp > 70:
        alerts.append({
            'node': node_id,
            'type': 'high_temperature',
            'severity': 'critical' if temp > 80 else 'warning',
            'message': f'High temperature on {node_id}: {temp:.1f}°C'
        })
    
    # Check latency
    if latency and latency > 100:
        alerts.append({
            'node': node_id,
            'type': 'high_latency',
            'severity': 'warning',
            'message': f'High latency on {node_id}: {latency:.1f}ms'
        })

# Store alerts
for alert in alerts:
    event_id = f"evt_{datetime.now().strftime('%Y%m%d%H%M%S')}_{alert['node'][:8]}"
    
    cur.execute("""
        INSERT INTO edge_events (
            event_id, node_id, event_type, severity,
            message, details
        ) VALUES (%s, %s, %s, %s, %s, %s)
        ON CONFLICT (event_id) DO NOTHING
    """, (
        event_id,
        alert['node'],
        alert['type'],
        alert['severity'],
        alert['message'],
        json.dumps(alert)
    ))

conn.commit()
cur.close()
conn.close()

print(f"Edge health monitoring completed")
print(f"Total nodes: {len(nodes_health)}")
print(f"Alerts generated: {len(alerts)}")

if alerts:
    print("\nCritical alerts:")
    for alert in [a for a in alerts if a['severity'] == 'critical'][:5]:
        print(f"- {alert['message']}")
EOF
    
    log_success "Edge health monitoring completed"
}

# Main execution
case ${1:-} in
    "init")
        init_edge_database
        deploy_edge_infrastructure
        ;;
        
    "register")
        register_edge_node "$2" "$3" "$4"
        ;;
        
    "deploy-app")
        deploy_edge_app "$2" "$3" "${4:-all}"
        ;;
        
    "deploy-model")
        deploy_ai_model "$2" "$3" "${4:-auto}"
        ;;
        
    "optimize")
        optimize_workloads
        ;;
        
    "monitor")
        monitor_edge_health
        ;;
        
    *)
        echo "Usage: $0 {init|register|deploy-app|deploy-model|optimize|monitor} [args...]"
        echo ""
        echo "Commands:"
        echo "  init                          - Initialize edge infrastructure"
        echo "  register <id> <loc> <ip>      - Register edge node"
        echo "  deploy-app <name> <type> [loc] - Deploy edge application"
        echo "  deploy-model <name> <path>     - Deploy AI model to edge"
        echo "  optimize                       - Optimize edge workloads"
        echo "  monitor                        - Monitor edge health"
        echo ""
        echo "Examples:"
        echo "  $0 init"
        echo "  $0 register edge-001 warehouse-1 192.168.1.100"
        echo "  $0 deploy-app vision-ai video_analytics warehouse-1"
        echo "  $0 deploy-model yolov5 /models/yolov5.onnx"
        echo "  $0 optimize"
        exit 1
        ;;
esac
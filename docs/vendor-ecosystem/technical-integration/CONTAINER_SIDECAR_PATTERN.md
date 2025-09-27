# Container Sidecar Pattern

**Zero-Code Integration: Transform Legacy Applications into Platform-Native Services**

---

## 🎯 Executive Summary

The Container Sidecar Pattern is the primary integration methodology for TerraFusion cOS, enabling vendors to achieve platform integration without modifying existing application code. This pattern injects platform capabilities directly into the vendor's runtime environment, providing immediate access to identity, security, monitoring, and data services.

**Key Benefit:** Vendor applications become platform-native with zero code changes, gaining full platform benefits while preserving existing investments.

---

## 🏗️ Sidecar Architecture Deep Dive

### Conceptual Architecture

```
┌─────────────────────────────────────────────────┐
│ Kubernetes Pod (Vendor Application)            │
│                                                 │
│ ┌─────────────────┐    ┌──────────────────────┐ │
│ │     Vendor      │    │   TerraFusion        │ │
│ │   Application   │    │     Sidecar         │ │
│ │                 │    │                      │ │
│ │ ┌─────────────┐ │    │ ┌──────────────────┐ │ │
│ │ │     API     │ │    │ │   Auth Proxy     │ │ │
│ │ │   Server    │ │    │ │                  │ │ │
│ │ └─────────────┘ │    │ └──────────────────┘ │ │
│ │                 │◄──►│                      │ │
│ │ ┌─────────────┐ │    │ ┌──────────────────┐ │ │
│ │ │  Business   │ │    │ │   Telemetry      │ │ │
│ │ │   Logic     │ │    │ │   Collection     │ │ │
│ │ └─────────────┘ │    │ └──────────────────┘ │ │
│ │                 │    │                      │ │
│ │ ┌─────────────┐ │    │ ┌──────────────────┐ │ │
│ │ │  Database   │ │    │ │   Security       │ │ │
│ │ │  Access     │ │    │ │   Enforcement    │ │ │
│ │ └─────────────┘ │    │ └──────────────────┘ │ │
│ └─────────────────┘    └──────────────────────┘ │
└─────────────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────┐
│        TerraFusion Platform Services            │
│                                                 │
│ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ │
│ │   Identity  │ │   Security  │ │    Data     │ │
│ │  & Policy   │ │    Mesh     │ │   Plane     │ │
│ │   Fabric    │ │             │ │             │ │
│ └─────────────┘ └─────────────┘ └─────────────┘ │
└─────────────────────────────────────────────────┘
```

### Sidecar Component Architecture

**Core Components:**

```
┌────────────────────────────────────────────────┐
│ TerraFusion Sidecar Container                  │
│                                                │
│ ┌──────────────────────────────────────────────┤
│ │            Proxy Layer                      │
│ │                                             │
│ │ ┌─────────────┐ ┌─────────────┐ ┌─────────┐ │
│ │ │   HTTP      │ │   gRPC      │ │  Other  │ │
│ │ │   Proxy     │ │   Proxy     │ │ Protocols│ │
│ │ └─────────────┘ └─────────────┘ └─────────┘ │
│ └──────────────────────────────────────────────┤
│ │         Authentication Layer                │
│ │                                             │
│ │ ┌─────────────┐ ┌─────────────┐ ┌─────────┐ │
│ │ │   Token     │ │   Session   │ │   MFA   │ │
│ │ │ Validation  │ │ Management  │ │ Support │ │
│ │ └─────────────┘ └─────────────┘ └─────────┘ │
│ └──────────────────────────────────────────────┤
│ │         Authorization Layer                 │
│ │                                             │
│ │ ┌─────────────┐ ┌─────────────┐ ┌─────────┐ │
│ │ │    RBAC     │ │    ABAC     │ │  Policy │ │
│ │ │ Enforcement │ │ Enforcement │ │  Engine │ │
│ │ └─────────────┘ └─────────────┘ └─────────┘ │
│ └──────────────────────────────────────────────┤
│ │           Telemetry Layer                   │
│ │                                             │
│ │ ┌─────────────┐ ┌─────────────┐ ┌─────────┐ │
│ │ │   Metrics   │ │   Logging   │ │ Tracing │ │
│ │ │ Collection  │ │ Collection  │ │Collection│ │
│ │ └─────────────┘ └─────────────┘ └─────────┘ │
│ └──────────────────────────────────────────────┤
│ │            Security Layer                   │
│ │                                             │
│ │ ┌─────────────┐ ┌─────────────┐ ┌─────────┐ │
│ │ │    mTLS     │ │ Certificate │ │ Network │ │
│ │ │ Management  │ │ Management  │ │ Policies│ │
│ │ └─────────────┘ └─────────────┘ └─────────┘ │
│ └──────────────────────────────────────────────┤
└────────────────────────────────────────────────┘
```

---

## 🔧 Implementation Guide

### Deployment Configuration

**Kubernetes Deployment with Sidecar Injection**

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: vendor-application
  namespace: vendor-modules
  labels:
    app: vendor-application
    version: v1.0.0
    vendor: acme-corp
spec:
  replicas: 3
  selector:
    matchLabels:
      app: vendor-application
  template:
    metadata:
      labels:
        app: vendor-application
        version: v1.0.0
      annotations:
        sidecar.terrafusion.gov/inject: "true"
        sidecar.terrafusion.gov/config: "default"
        prometheus.io/scrape: "true"
        prometheus.io/port: "9090"
    spec:
      containers:
      # Vendor Application Container (Unchanged)
      - name: application
        image: vendor/acme-gis:v1.0.0
        ports:
        - containerPort: 8080
          name: http
        env:
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: vendor-db-secret
              key: url
        - name: LOG_LEVEL
          value: "INFO"
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"

      # TerraFusion Sidecar Container (Auto-injected)
      - name: terrafusion-sidecar
        image: terrafusion/sidecar:v1.8.0
        ports:
        - containerPort: 9090  # Metrics
        - containerPort: 8000  # Health checks
        env:
        # Sidecar Configuration
        - name: TARGET_SERVICE
          value: "http://localhost:8080"
        - name: PLATFORM_AUTH_ENDPOINT
          value: "https://auth.terrafusion.local"
        - name: TELEMETRY_ENDPOINT
          value: "https://telemetry.terrafusion.local"
        - name: POLICY_ENDPOINT
          value: "https://policy.terrafusion.local"

        # Service Identity
        - name: SERVICE_NAME
          value: "acme-gis"
        - name: SERVICE_VERSION
          value: "v1.0.0"
        - name: VENDOR_ID
          value: "acme-corp"

        # Security Configuration
        - name: MTLS_ENABLED
          value: "true"
        - name: CERT_PATH
          value: "/etc/certs"

        volumeMounts:
        - name: certs
          mountPath: "/etc/certs"
          readOnly: true
        - name: config
          mountPath: "/etc/config"
          readOnly: true

        resources:
          requests:
            memory: "128Mi"
            cpu: "100m"
          limits:
            memory: "256Mi"
            cpu: "200m"

      volumes:
      - name: certs
        secret:
          secretName: terrafusion-certs
      - name: config
        configMap:
          name: sidecar-config
```

### Automatic Sidecar Injection

**Namespace Configuration**
```yaml
apiVersion: v1
kind: Namespace
metadata:
  name: vendor-modules
  labels:
    terrafusion.gov/sidecar-injection: enabled
    terrafusion.gov/policy-tier: standard
```

**Admission Controller Configuration**
```yaml
apiVersion: admissionregistration.k8s.io/v1
kind: MutatingAdmissionWebhook
metadata:
  name: sidecar-injector.terrafusion.gov
webhooks:
- name: sidecar-injector
  clientConfig:
    service:
      name: terrafusion-sidecar-injector
      namespace: terrafusion-system
      path: "/inject"
  rules:
  - operations: ["CREATE", "UPDATE"]
    apiGroups: ["apps"]
    apiVersions: ["v1"]
    resources: ["deployments"]
  admissionReviewVersions: ["v1", "v1beta1"]
```

---

## 🔐 Security Implementation

### Authentication Proxy

**JWT Token Validation**
```javascript
// Sidecar automatically validates platform tokens
const authenticateRequest = async (req) => {
  const token = req.headers.authorization?.replace('Bearer ', '');

  if (!token) {
    throw new AuthenticationError('No token provided');
  }

  const decoded = await jwt.verify(token, platformPublicKey);

  // Inject user context into request headers
  req.headers['x-terrafusion-user'] = decoded.sub;
  req.headers['x-terrafusion-roles'] = decoded.roles.join(',');
  req.headers['x-terrafusion-dept'] = decoded.department;

  return decoded;
};
```

**Session Management**
```python
# Sidecar handles session lifecycle
class SessionManager:
    def __init__(self):
        self.redis_client = redis.Redis(
            host='session-store.terrafusion.local',
            port=6379,
            ssl=True
        )

    def validate_session(self, session_id):
        session_data = self.redis_client.get(f"session:{session_id}")
        if not session_data:
            raise InvalidSessionError("Session expired or invalid")

        return json.loads(session_data)

    def extend_session(self, session_id, ttl=3600):
        self.redis_client.expire(f"session:{session_id}", ttl)
```

### Authorization Enforcement

**RBAC Policy Evaluation**
```go
package authorization

import (
    "context"
    "fmt"
    "github.com/casbin/casbin/v2"
)

type PolicyEnforcer struct {
    enforcer *casbin.Enforcer
}

func (pe *PolicyEnforcer) CheckPermission(user, resource, action string) (bool, error) {
    // Check RBAC permissions
    allowed, err := pe.enforcer.Enforce(user, resource, action)
    if err != nil {
        return false, fmt.Errorf("authorization check failed: %w", err)
    }

    return allowed, nil
}

// Example policy rules loaded from platform
// p, gis-admin, /api/gis/*, read
// p, gis-admin, /api/gis/*, write
// p, gis-user, /api/gis/read/*, read
// g, john.doe@county.gov, gis-admin
```

### mTLS Certificate Management

**Automatic Certificate Provisioning**
```yaml
apiVersion: cert-manager.io/v1
kind: Certificate
metadata:
  name: vendor-app-cert
spec:
  secretName: vendor-app-tls
  issuerRef:
    name: terrafusion-ca-issuer
    kind: ClusterIssuer
  commonName: vendor-app.vendor-modules.svc.cluster.local
  dnsNames:
  - vendor-app
  - vendor-app.vendor-modules
  - vendor-app.vendor-modules.svc.cluster.local
```

---

## 📊 Telemetry and Monitoring

### Metrics Collection

**Automatic Metric Generation**
```prometheus
# HTTP Request Metrics
http_requests_total{method="GET",status="200",service="acme-gis"} 1250
http_request_duration_seconds{method="GET",service="acme-gis",quantile="0.95"} 0.45
http_request_size_bytes{method="POST",service="acme-gis",quantile="0.50"} 2048

# Business Metrics
vendor_active_users_total{service="acme-gis",department="assessor"} 15
vendor_database_connections{service="acme-gis",pool="main"} 8
vendor_cache_hit_ratio{service="acme-gis",cache="property"} 0.85

# Platform Integration Metrics
platform_auth_requests_total{service="acme-gis"} 3420
platform_policy_evaluations_total{service="acme-gis",result="allowed"} 3200
platform_cert_rotation_timestamp{service="acme-gis"} 1642694400
```

**Custom Metrics Integration**
```python
from prometheus_client import Counter, Histogram, Gauge

# Business-specific metrics that sidecar can expose
property_searches = Counter(
    'vendor_property_searches_total',
    'Total property searches performed',
    ['department', 'search_type']
)

search_duration = Histogram(
    'vendor_search_duration_seconds',
    'Property search duration',
    ['search_type']
)

active_sessions = Gauge(
    'vendor_active_sessions',
    'Number of active user sessions',
    ['department']
)
```

### Distributed Tracing

**Automatic Trace Propagation**
```yaml
# OpenTelemetry configuration in sidecar
apiVersion: v1
kind: ConfigMap
metadata:
  name: otel-config
data:
  otel-config.yaml: |
    receivers:
      otlp:
        protocols:
          grpc:
            endpoint: 0.0.0.0:4317
          http:
            endpoint: 0.0.0.0:4318

    processors:
      batch:
        timeout: 1s
        send_batch_size: 1024

      attributes:
        actions:
          - key: service.name
            value: "acme-gis"
            action: upsert
          - key: vendor.id
            value: "acme-corp"
            action: upsert

    exporters:
      jaeger:
        endpoint: jaeger.terrafusion.local:14250
        tls:
          insecure: false

    service:
      pipelines:
        traces:
          receivers: [otlp]
          processors: [batch, attributes]
          exporters: [jaeger]
```

### Structured Logging

**Log Format Standardization**
```json
{
  "timestamp": "2024-01-15T14:30:00.123Z",
  "level": "INFO",
  "service": "acme-gis",
  "vendor": "acme-corp",
  "version": "v1.0.0",
  "trace_id": "4bf92f3577b34da6a3ce929d0e0e4736",
  "span_id": "00f067aa0ba902b7",
  "user": "john.doe@county.gov",
  "department": "assessor",
  "action": "property-search",
  "resource": "/api/properties/search",
  "method": "POST",
  "status_code": 200,
  "duration_ms": 245,
  "message": "Property search completed successfully",
  "metadata": {
    "search_criteria": {
      "type": "parcel_id",
      "value": "123-456-789"
    },
    "results_count": 1
  }
}
```

---

## 🔧 Advanced Configuration Options

### Sidecar Configuration

**ConfigMap for Sidecar Behavior**
```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: sidecar-config
  namespace: vendor-modules
data:
  config.yaml: |
    # Proxy Configuration
    proxy:
      listen_port: 8000
      target_host: "localhost"
      target_port: 8080
      timeout: 30s
      buffer_size: 8192

    # Authentication Configuration
    auth:
      enabled: true
      required_headers: ["authorization"]
      token_validation: "jwt"
      session_timeout: 3600
      mfa_required: false

    # Authorization Configuration
    authz:
      policy_engine: "casbin"
      policy_refresh_interval: "5m"
      default_action: "deny"
      cache_ttl: "60s"

    # Telemetry Configuration
    telemetry:
      metrics:
        enabled: true
        port: 9090
        path: "/metrics"
      logging:
        level: "INFO"
        format: "json"
        output: "stdout"
      tracing:
        enabled: true
        sample_rate: 0.1
        jaeger_endpoint: "jaeger.terrafusion.local:14268"

    # Security Configuration
    security:
      mtls:
        enabled: true
        cert_path: "/etc/certs/tls.crt"
        key_path: "/etc/certs/tls.key"
        ca_path: "/etc/certs/ca.crt"
      network_policies:
        enforce: true
        allow_ingress: ["terrafusion-system"]
        allow_egress: ["vendor-database"]
```

### Health Check Configuration

**Comprehensive Health Monitoring**
```yaml
# Health check endpoints provided by sidecar
livenessProbe:
  httpGet:
    path: /health/live
    port: 8000
  initialDelaySeconds: 30
  periodSeconds: 10
  timeoutSeconds: 5
  failureThreshold: 3

readinessProbe:
  httpGet:
    path: /health/ready
    port: 8000
  initialDelaySeconds: 5
  periodSeconds: 5
  timeoutSeconds: 3
  failureThreshold: 3

# Custom health check configuration
startupProbe:
  httpGet:
    path: /health/startup
    port: 8000
  initialDelaySeconds: 10
  periodSeconds: 10
  timeoutSeconds: 5
  failureThreshold: 30
```

### Performance Tuning

**Resource Allocation Guidelines**
```yaml
# Recommended resource allocation
resources:
  requests:
    memory: "128Mi"  # Base memory for sidecar
    cpu: "100m"      # Base CPU for sidecar
  limits:
    memory: "256Mi"  # Maximum memory (2x request)
    cpu: "200m"      # Maximum CPU (2x request)

# For high-traffic applications
# resources:
#   requests:
#     memory: "256Mi"
#     cpu: "200m"
#   limits:
#     memory: "512Mi"
#     cpu: "500m"
```

---

## 🚀 Implementation Best Practices

### Development Workflow

**Local Development with Sidecar**
```bash
# Docker Compose for local development
version: '3.8'
services:
  vendor-app:
    build: .
    ports:
      - "8080:8080"
    environment:
      - DATABASE_URL=postgresql://localhost:5432/vendor_db

  terrafusion-sidecar:
    image: terrafusion/sidecar:latest
    ports:
      - "8000:8000"  # Proxy port
      - "9090:9090"  # Metrics port
    environment:
      - TARGET_SERVICE=http://vendor-app:8080
      - PLATFORM_AUTH_ENDPOINT=https://auth.dev.terrafusion.local
      - LOG_LEVEL=DEBUG
    depends_on:
      - vendor-app

  # Mock platform services for development
  mock-auth:
    image: terrafusion/mock-services:latest
    ports:
      - "9001:8080"
    command: ["auth-service"]
```

### Testing Strategies

**Integration Testing**
```python
import pytest
import requests
from testcontainers import DockerCompose

class TestSidecarIntegration:
    @classmethod
    def setup_class(cls):
        cls.compose = DockerCompose(".", compose_file_name="docker-compose.test.yml")
        cls.compose.start()

    def test_authentication_proxy(self):
        # Test request without token
        response = requests.get("http://localhost:8000/api/properties")
        assert response.status_code == 401

        # Test request with valid token
        headers = {"Authorization": f"Bearer {self.get_valid_token()}"}
        response = requests.get("http://localhost:8000/api/properties", headers=headers)
        assert response.status_code == 200

    def test_metrics_collection(self):
        # Make some requests
        headers = {"Authorization": f"Bearer {self.get_valid_token()}"}
        for _ in range(10):
            requests.get("http://localhost:8000/api/properties", headers=headers)

        # Check metrics endpoint
        metrics = requests.get("http://localhost:9090/metrics")
        assert "http_requests_total" in metrics.text
        assert "vendor_property_searches_total" in metrics.text

    @classmethod
    def teardown_class(cls):
        cls.compose.stop()
```

### Troubleshooting Guide

**Common Issues and Solutions**

**Issue: Authentication Failures**
```bash
# Check sidecar logs
kubectl logs -f deployment/vendor-application -c terrafusion-sidecar

# Validate platform connectivity
kubectl exec -it deployment/vendor-application -c terrafusion-sidecar -- \
  curl -k https://auth.terrafusion.local/health

# Check certificate validity
kubectl exec -it deployment/vendor-application -c terrafusion-sidecar -- \
  openssl x509 -in /etc/certs/tls.crt -text -noout
```

**Issue: High Latency**
```bash
# Check proxy metrics
curl http://localhost:9090/metrics | grep http_request_duration

# Enable debug logging
kubectl set env deployment/vendor-application -c terrafusion-sidecar LOG_LEVEL=DEBUG

# Analyze network policies
kubectl describe networkpolicy -n vendor-modules
```

---

## 📞 Support and Resources

### Technical Support

**Sidecar Configuration Support**
- Architecture review and optimization
- Custom configuration development
- Performance tuning and troubleshooting

**Integration Validation**
- End-to-end integration testing
- Security compliance validation
- Monitoring and alerting setup

**Ongoing Support**
- Platform updates and compatibility
- Security patches and upgrades
- Performance monitoring and optimization

---

**Contact:**
- **Sidecar Support:** sidecar@terrafusion.gov
- **Technical Issues:** support@terrafusion.gov
- **Best Practices:** architecture@terrafusion.gov

---

*Achieve platform integration with zero code changes. The sidecar pattern makes it possible.*
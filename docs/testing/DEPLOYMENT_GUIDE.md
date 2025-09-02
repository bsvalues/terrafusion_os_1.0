# Testing Infrastructure Deployment Guide

**Terrafusion OS 1.0 - PHASE 6 Testing Environment Setup**

## Overview

This guide provides step-by-step instructions for deploying the comprehensive testing infrastructure required for PHASE 6 Week 10 validation.

## Prerequisites

### System Requirements

- **Operating System**: Linux (Ubuntu 20.04+ recommended) or Windows Server 2019+
- **CPU**: 16+ cores (32+ recommended for load testing)
- **Memory**: 32GB RAM minimum (64GB+ recommended)
- **Storage**: 500GB SSD minimum (1TB+ recommended)
- **Network**: 10Gbps network interface for load testing

### Software Dependencies

- **Docker**: 24.0+ with Docker Compose
- **Kubernetes**: 1.28+ (for scalability testing)
- **Node.js**: 18.x LTS
- **PostgreSQL**: 15.x (for test data)
- **Redis**: 7.x (for caching tests)
- **Nginx**: 1.24+ (for load balancing)

## Infrastructure Setup

### 1. Docker Environment

Create the testing environment using Docker Compose:

```yaml
# docker-compose.testing.yml
version: '3.8'

services:
  terrafusion-api:
    build: 
      context: .
      dockerfile: docker/Dockerfile.api
    ports:
      - "5000:5000"
    environment:
      - ASPNETCORE_ENVIRONMENT=Testing
      - DATABASE_URL=postgresql://test_user:test_pass@postgres:5432/terrafusion_test
      - REDIS_URL=redis://redis:6379
    depends_on:
      - postgres
      - redis
    networks:
      - testing-network

  postgres:
    image: postgres:15
    environment:
      - POSTGRES_DB=terrafusion_test
      - POSTGRES_USER=test_user
      - POSTGRES_PASSWORD=test_pass
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./database/test-schema.sql:/docker-entrypoint-initdb.d/01-schema.sql
    networks:
      - testing-network

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    command: redis-server --maxmemory 2gb --maxmemory-policy allkeys-lru
    networks:
      - testing-network

  nginx:
    image: nginx:1.24
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/testing.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
    depends_on:
      - terrafusion-api
    networks:
      - testing-network

volumes:
  postgres_data:

networks:
  testing-network:
    driver: bridge
```

### 2. Kubernetes Testing Cluster

Deploy Kubernetes resources for scalability testing:

```yaml
# k8s/testing-namespace.yaml
apiVersion: v1
kind: Namespace
metadata:
  name: terrafusion-testing
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: terrafusion-api
  namespace: terrafusion-testing
spec:
  replicas: 3
  selector:
    matchLabels:
      app: terrafusion-api
  template:
    metadata:
      labels:
        app: terrafusion-api
    spec:
      containers:
      - name: api
        image: terrafusion/api:testing
        ports:
        - containerPort: 5000
        env:
        - name: ASPNETCORE_ENVIRONMENT
          value: "Testing"
        resources:
          requests:
            memory: "2Gi"
            cpu: "1000m"
          limits:
            memory: "4Gi"
            cpu: "2000m"
---
apiVersion: v1
kind: Service
metadata:
  name: terrafusion-api-service
  namespace: terrafusion-testing
spec:
  selector:
    app: terrafusion-api
  ports:
  - port: 80
    targetPort: 5000
  type: LoadBalancer
---
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: terrafusion-api-hpa
  namespace: terrafusion-testing
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: terrafusion-api
  minReplicas: 3
  maxReplicas: 50
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
  - type: Resource
    resource:
      name: memory
      target:
        type: Utilization
        averageUtilization: 80
```

## Environment Configuration

### 1. Environment Variables

Create `.env.testing` file:

```bash
# API Configuration
TEST_API_URL=http://localhost:5000
TEST_WS_URL=ws://localhost:5000/hubs/system
API_VERSION=v1

# Database Configuration
DATABASE_URL=postgresql://test_user:test_pass@localhost:5432/terrafusion_test
REDIS_URL=redis://localhost:6379

# Kubernetes Configuration
KUBERNETES_API_URL=https://k8s-testing.terrafusion.local
KUBERNETES_TOKEN=eyJhbGciOiJSUzI1NiIsImtpZCI6...
KUBERNETES_NAMESPACE=terrafusion-testing

# Security Testing
SECURITY_TEST_USER=security-tester
SECURITY_TEST_PASS=SecureTest123!
SECURITY_SCAN_ENABLED=true

# Performance Testing
MAX_CONCURRENT_USERS=25000
LOAD_TEST_DURATION=300000
PERFORMANCE_BASELINE_ENABLED=true

# Reporting
GENERATE_REPORTS=true
OUTPUT_DIR=./test-results
REPORT_FORMAT=markdown,json,html

# Feature Flags
PARALLEL_EXECUTION=true
SKIP_SECTIONS=
DEBUG_MODE=false
VERBOSE_LOGGING=true
```

### 2. Test Data Setup

Initialize test databases with sample data:

```sql
-- database/test-schema.sql
CREATE SCHEMA IF NOT EXISTS testing;

-- Jurisdiction test data
INSERT INTO jurisdictions (id, name, population, properties, region) VALUES
('benton', 'Benton County', 95000, 45000, 'west'),
('clark', 'Clark County', 500000, 200000, 'west'),
('king', 'King County', 2200000, 900000, 'west'),
('miami', 'Miami-Dade County', 2700000, 1100000, 'east'),
('cook', 'Cook County', 5200000, 2000000, 'central');

-- Sample property data for testing
INSERT INTO properties (parcel_id, jurisdiction_id, assessed_value, property_type) 
SELECT 
  'TEST-' || jurisdiction_id || '-' || LPAD(generate_series::text, 6, '0'),
  jurisdiction_id,
  (random() * 1000000 + 100000)::integer,
  CASE (random() * 3)::integer 
    WHEN 0 THEN 'residential'
    WHEN 1 THEN 'commercial'
    ELSE 'industrial'
  END
FROM jurisdictions, generate_series(1, 1000);
```

## Deployment Steps

### 1. Initial Setup

```bash
# Clone repository
git clone https://github.com/terrafusion/terrafusion-os-1.0.git
cd terrafusion-os-1.0

# Install dependencies
npm install

# Build Docker images
docker-compose -f docker-compose.testing.yml build

# Start infrastructure
docker-compose -f docker-compose.testing.yml up -d
```

### 2. Database Initialization

```bash
# Wait for PostgreSQL to be ready
docker-compose -f docker-compose.testing.yml exec postgres pg_isready

# Run database migrations
npm run db:migrate:testing

# Seed test data
npm run db:seed:testing
```

### 3. Kubernetes Deployment (Optional)

```bash
# Create namespace and deploy resources
kubectl apply -f k8s/testing-namespace.yaml

# Verify deployment
kubectl get pods -n terrafusion-testing
kubectl get services -n terrafusion-testing

# Check HPA status
kubectl get hpa -n terrafusion-testing
```

### 4. SSL Certificate Setup

```bash
# Generate self-signed certificates for testing
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout ssl/testing.key \
  -out ssl/testing.crt \
  -subj "/C=US/ST=WA/L=Seattle/O=Terrafusion/CN=testing.terrafusion.local"

# Update hosts file for local testing
echo "127.0.0.1 testing.terrafusion.local" >> /etc/hosts
```

## Verification

### 1. Health Check

```bash
# Verify API health
curl -f http://localhost:5000/api/health/comprehensive

# Check WebSocket connectivity
wscat -c ws://localhost:5000/hubs/system
```

### 2. Database Connectivity

```bash
# Test database connection
docker-compose -f docker-compose.testing.yml exec postgres \
  psql -U test_user -d terrafusion_test -c "SELECT COUNT(*) FROM jurisdictions;"
```

### 3. Redis Connectivity

```bash
# Test Redis connection
docker-compose -f docker-compose.testing.yml exec redis \
  redis-cli ping
```

## Load Balancer Configuration

### Nginx Configuration

```nginx
# nginx/testing.conf
events {
    worker_connections 1024;
}

http {
    upstream terrafusion_api {
        least_conn;
        server terrafusion-api:5000 max_fails=3 fail_timeout=30s;
    }

    server {
        listen 80;
        server_name testing.terrafusion.local;
        return 301 https://$server_name$request_uri;
    }

    server {
        listen 443 ssl http2;
        server_name testing.terrafusion.local;

        ssl_certificate /etc/nginx/ssl/testing.crt;
        ssl_certificate_key /etc/nginx/ssl/testing.key;
        ssl_protocols TLSv1.2 TLSv1.3;
        ssl_ciphers ECDHE-RSA-AES128-GCM-SHA256:ECDHE-RSA-AES256-GCM-SHA384;

        # API proxy
        location /api/ {
            proxy_pass http://terrafusion_api;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            
            # WebSocket support
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection "upgrade";
            
            # Timeouts for load testing
            proxy_connect_timeout 60s;
            proxy_send_timeout 60s;
            proxy_read_timeout 60s;
        }

        # Health check endpoint
        location /health {
            access_log off;
            return 200 "healthy\n";
            add_header Content-Type text/plain;
        }
    }
}
```

## Monitoring Setup

### 1. Prometheus Configuration

```yaml
# monitoring/prometheus.yml
global:
  scrape_interval: 15s

scrape_configs:
  - job_name: 'terrafusion-api'
    static_configs:
      - targets: ['terrafusion-api:5000']
    metrics_path: '/api/metrics'
    scrape_interval: 5s

  - job_name: 'postgres'
    static_configs:
      - targets: ['postgres:5432']

  - job_name: 'redis'
    static_configs:
      - targets: ['redis:6379']
```

### 2. Grafana Dashboard

```json
{
  "dashboard": {
    "title": "Terrafusion Testing Metrics",
    "panels": [
      {
        "title": "API Response Time",
        "type": "graph",
        "targets": [
          {
            "expr": "histogram_quantile(0.95, http_request_duration_seconds_bucket)",
            "legendFormat": "95th percentile"
          }
        ]
      },
      {
        "title": "Concurrent Users",
        "type": "stat",
        "targets": [
          {
            "expr": "active_users_total",
            "legendFormat": "Active Users"
          }
        ]
      }
    ]
  }
}
```

## Troubleshooting

### Common Issues

#### Port Conflicts
```bash
# Check port usage
netstat -tulpn | grep :5000

# Kill conflicting processes
sudo fuser -k 5000/tcp
```

#### Memory Issues
```bash
# Increase Docker memory limit
# Edit ~/.docker/daemon.json
{
  "default-runtime": "runc",
  "runtimes": {
    "runc": {
      "path": "runc"
    }
  },
  "default-ulimits": {
    "memlock": {
      "hard": -1,
      "soft": -1
    }
  }
}
```

#### Database Connection Issues
```bash
# Check PostgreSQL logs
docker-compose -f docker-compose.testing.yml logs postgres

# Reset database
docker-compose -f docker-compose.testing.yml down -v
docker-compose -f docker-compose.testing.yml up -d postgres
```

### Log Analysis

```bash
# View API logs
docker-compose -f docker-compose.testing.yml logs -f terrafusion-api

# View all service logs
docker-compose -f docker-compose.testing.yml logs -f

# Export logs for analysis
docker-compose -f docker-compose.testing.yml logs --no-color > testing-logs.txt
```

## Cleanup

### 1. Stop Services

```bash
# Stop Docker Compose services
docker-compose -f docker-compose.testing.yml down

# Remove volumes (destructive)
docker-compose -f docker-compose.testing.yml down -v

# Remove images
docker rmi $(docker images -q terrafusion/*)
```

### 2. Kubernetes Cleanup

```bash
# Delete Kubernetes resources
kubectl delete namespace terrafusion-testing

# Clean up persistent volumes
kubectl delete pv --all
```

## Security Considerations

### 1. Network Security

- Use private networks for internal communication
- Implement firewall rules to restrict access
- Enable TLS for all external communications
- Use VPN for remote access to testing environment

### 2. Data Security

- Use encrypted storage for test databases
- Implement data retention policies
- Ensure no production data in testing environment
- Regular security scans of testing infrastructure

### 3. Access Control

- Implement RBAC for Kubernetes cluster
- Use service accounts with minimal permissions
- Enable audit logging for all administrative actions
- Regular access reviews and cleanup

---

**Document Version**: 1.0  
**Last Updated**: August 18, 2025  
**Maintained By**: Terrafusion OS DevOps Team  
**Classification**: Government Use - Controlled Unclassified Information (CUI)

# 🚀 TerraFusion Production Deployment Guide
*Complete deployment package for production-grade government AI platform*

## 📦 What's Included

This deployment package provides everything needed for production TerraFusion deployment:

### 🏗️ Container & Orchestration
- `Dockerfile.production.enhanced` - Multi-stage production Docker build
- `compose.production.yml` - Complete Docker Compose stack (API + PostgreSQL + Redis + monitoring)
- `k8s/production/` - Production Kubernetes manifests with HPA, PDB, security policies

### 🏥 Health & Observability
- `/healthz` - Liveness probe (process alive, never checks external deps)
- `/ready` - Readiness probe (all dependencies healthy)
- `/api/version` - Deployment traceability (version, git SHA, build info)
- `/metrics` - Prometheus metrics endpoint
- `monitoring/prometheus.yml` - Comprehensive metrics collection

### 🔒 Security & Compliance
- Non-root container execution (UID 1001)
- Read-only root filesystem where possible
- Network policies for micro-segmentation
- Security headers and CORS configuration
- Secrets management for credentials

### 🛠️ Operational Tooling
- `scripts/smoke.ps1` - Production readiness validation
- `COPILOT_RUNBOOK.md` - Complete operational guide
- Graceful shutdown with 20-second timeout
- Automated health monitoring and alerting

---

## 🎯 Quick Start Options

### Option 1: Docker Compose (Simplest)
```bash
# 1. Clone and setup
git clone <repo>
cd backend

# 2. Configure environment
cat > .env << EOF
POSTGRES_PASSWORD=your_secure_password_here
REDIS_PASSWORD=your_redis_password_here
GIT_SHA=${GIT_SHA:-$(git rev-parse HEAD)}
BUILD_NUMBER=${BUILD_NUMBER:-local}
EOF

# 3. Start production stack
docker compose -f compose.production.yml up -d

# 4. Validate deployment
./scripts/smoke.ps1 http://localhost:5000
```

### Option 2: Kubernetes (Production)
```bash
# 1. Create namespace
kubectl create namespace terrafusion

# 2. Configure secrets (edit first!)
kubectl apply -f k8s/production/database.yaml

# 3. Deploy complete stack
kubectl apply -f k8s/production/

# 4. Monitor rollout
kubectl rollout status deployment/terrafusion-api -n terrafusion

# 5. Validate health
kubectl port-forward service/terrafusion-api-service 5000:80 -n terrafusion
./scripts/smoke.ps1 http://localhost:5000
```

### Option 3: Development Setup
```bash
# 1. Start local database
docker compose -f compose.dev.yml up -d

# 2. Run API locally
cd TerraFusion.API
dotnet run --urls "http://localhost:5000"

# 3. Validate
./scripts/smoke.ps1 http://localhost:5000
```

---

## 📋 Pre-Deployment Checklist

### Infrastructure Requirements
- [ ] **Container Registry**: Access to push/pull images (ghcr.io, ECR, etc.)
- [ ] **Database**: PostgreSQL 15+ with connection pooling
- [ ] **Cache**: Redis 7+ for session/application caching
- [ ] **Storage**: Persistent volumes for database (10GB+ recommended)
- [ ] **Networking**: Load balancer with SSL termination capability

### Security Configuration
- [ ] **Secrets**: Database passwords, Redis auth, TLS certificates
- [ ] **CORS**: Restrict to authorized frontend domains only
- [ ] **Rate Limiting**: Configure per requirements (100 RPS default)
- [ ] **Network Policies**: Micro-segmentation for zero-trust networking
- [ ] **Image Scanning**: Container vulnerability scanning enabled

### Monitoring & Observability
- [ ] **Prometheus**: Metrics collection configured
- [ ] **Alerting**: Health check failure alerts (5+ minute threshold)
- [ ] **Logging**: Centralized log aggregation (ELK, Fluentd, etc.)
- [ ] **Dashboards**: Grafana or similar for operational visibility
- [ ] **Distributed Tracing**: Application performance monitoring

---

## 🔧 Configuration Reference

### Environment Variables

#### Required (Production)
```bash
# Database connectivity
POSTGRES_PASSWORD=your_secure_password
CONNECTION_STRINGS__DEFAULTCONNECTION="Server=postgres;Port=5432;Database=terrafusion_prod;User Id=terrafusion_prod;Password=${POSTGRES_PASSWORD};"

# Cache configuration
REDIS_PASSWORD=your_redis_password
CONNECTION_STRINGS__REDIS="redis:6379"

# Deployment traceability
GIT_SHA=commit_hash_from_ci_cd
BUILD_NUMBER=ci_build_number
IMAGE_TAG=v1.0.0
```

#### Optional (Tuning)
```bash
# Feature flags
FEATURES__DATABASEREQUIRED=true
TF_ELITE_MODE=true

# Performance tuning
DOTNET_SHUTDOWNTIMEOUTSECONDS=20
ASPNETCORE_SHUTDOWNTIMEOUTSECONDS=20

# Resilience settings
EF_RETRIES=5
EF_TIMEOUT=15
```

### Health Check Configuration
```yaml
# Kubernetes probes
livenessProbe:
  httpGet: { path: /healthz, port: 5000 }
  initialDelaySeconds: 10
  periodSeconds: 15

readinessProbe:
  httpGet: { path: /ready, port: 5000 }
  initialDelaySeconds: 15
  periodSeconds: 10
```

### Resource Requirements
```yaml
# Minimum resources
resources:
  requests:
    cpu: 200m      # 0.2 CPU cores
    memory: 256Mi  # 256 MB RAM
  limits:
    cpu: 1         # 1 CPU core max
    memory: 512Mi  # 512 MB RAM max
```

---

## 📊 Production Validation

### Deployment Health Validation
```bash
# Container startup validation
docker run -d --name tf-test -p 5000:5000 terrafusion-api:latest
sleep 30
curl -f http://localhost:5000/healthz || echo "FAIL: Liveness check"
curl http://localhost:5000/ready | jq .status | grep -E "(Healthy|Degraded)" || echo "FAIL: Readiness"
docker stop tf-test && docker rm tf-test
```

### Performance Baseline
```bash
# Load testing (adjust concurrent users based on requirements)
ab -n 1000 -c 10 http://localhost:5000/healthz
# Expected: >95% success rate, <50ms average response time

# Memory usage under load
docker stats terrafusion-api --no-stream
# Expected: <512MB peak usage, stable after warmup
```

### Compliance Validation
```bash
# Security headers check
curl -I http://localhost:5000/api/version | grep -E "(X-Frame-Options|X-Content-Type|Strict-Transport)"

# Non-root execution
docker inspect terrafusion-api | jq '.[0].Config.User'
# Expected: "1001:1001"

# Read-only filesystem (where possible)
docker inspect terrafusion-api | jq '.[0].HostConfig.ReadonlyRootfs'
```

---

## 🚨 Troubleshooting Guide

### Common Issues

#### Issue: Health checks failing
```bash
# Diagnosis
curl -v http://localhost:5000/healthz
kubectl describe pod <pod-name> -n terrafusion

# Common causes:
# - Port binding conflicts
# - Resource constraints (CPU/memory limits)
# - Application startup errors
```

#### Issue: Database connectivity
```bash
# Test database connection
docker exec terrafusion-postgres psql -U terrafusion_prod -d terrafusion_prod -c "SELECT 1;"
kubectl exec deployment/terrafusion-postgres -n terrafusion -- psql -U terrafusion_prod -d terrafusion_prod -c "SELECT 1;"

# Check connection string format
echo $CONNECTION_STRINGS__DEFAULTCONNECTION
```

#### Issue: Performance degradation
```bash
# Check resource usage
kubectl top pods -n terrafusion
docker stats

# Review metrics
curl http://localhost:5000/metrics | grep -E "(request_duration|cpu_seconds|collection_count)"

# Scale horizontally if needed
kubectl scale deployment terrafusion-api --replicas=4 -n terrafusion
```

### Logs Analysis
```bash
# Application logs
kubectl logs -f deployment/terrafusion-api -n terrafusion
docker logs -f terrafusion-api-prod

# Filter for errors
kubectl logs deployment/terrafusion-api -n terrafusion | grep -E "ERROR|WARN|FATAL"

# Health check specific logs
docker logs terrafusion-api-prod 2>&1 | grep -E "(healthz|ready|metrics)"
```

---

## 📈 Scaling & Performance

### Horizontal Pod Autoscaling (HPA)
The deployment includes HPA configuration:
- **Min Replicas**: 2 (high availability)
- **Max Replicas**: 8 (prevent resource exhaustion)
- **CPU Threshold**: 70% average utilization
- **Memory Threshold**: 80% average utilization

### Vertical Scaling Guidelines
```bash
# Monitor resource usage trends
kubectl top pods -n terrafusion --sort-by=cpu
kubectl top pods -n terrafusion --sort-by=memory

# Adjust resource requests/limits based on observed usage
# Rule of thumb: requests = 80% of average usage, limits = 2x requests
```

### Database Scaling
```bash
# Read replicas for PostgreSQL (if using managed service)
# Connection pooling (PgBouncer recommended for high load)
# Partitioning for large tables (properties, audit_logs)
```

---

## 🔄 CI/CD Integration

### GitHub Actions Example
```yaml
name: Deploy TerraFusion API
on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v3

    - name: Build & Test
      run: |
        dotnet build TerraFusion.sln
        dotnet test

    - name: Build Container
      run: |
        docker build -f Dockerfile.production.enhanced \
          --build-arg GIT_SHA=${{ github.sha }} \
          --build-arg BUILD_NUMBER=${{ github.run_number }} \
          -t ghcr.io/org/terrafusion-api:${{ github.sha }} .

    - name: Container Smoke Test
      run: |
        docker run -d --name test -p 5000:5000 ghcr.io/org/terrafusion-api:${{ github.sha }}
        sleep 30
        ./scripts/smoke.ps1 http://localhost:5000
        docker stop test

    - name: Deploy to Production
      run: |
        # Update Kubernetes deployment with new image
        kubectl set image deployment/terrafusion-api api=ghcr.io/org/terrafusion-api:${{ github.sha }} -n terrafusion
        kubectl rollout status deployment/terrafusion-api -n terrafusion
```

### Deployment Gates
1. **Build Success**: Clean build with no warnings
2. **Test Success**: All unit and integration tests pass
3. **Container Smoke**: Health endpoints respond within 30s
4. **Security Scan**: No critical vulnerabilities in container
5. **Canary Validation**: 5% traffic validation before full rollout

---

## 📞 Support & Maintenance

### Regular Maintenance Tasks
- **Weekly**: Review resource usage and scaling metrics
- **Monthly**: Update base images and security patches
- **Quarterly**: Capacity planning and performance review
- **Annually**: Disaster recovery testing and documentation updates

### Monitoring Alerting Thresholds
- **P0 Critical**: `/healthz` failing for 5+ minutes
- **P1 High**: `/ready` failing, error rate >5%, P95 latency >100ms
- **P2 Medium**: Resource usage >80%, scaling events, warning logs
- **P3 Low**: Info logs, successful deployments, routine operations

### Emergency Procedures
1. **Immediate**: Check health endpoints and error rates
2. **Assess**: Review recent deployments and infrastructure changes
3. **Mitigate**: Scale horizontally or rollback if needed
4. **Investigate**: Deep dive into logs and metrics for root cause
5. **Document**: Update runbooks and preventive measures

---

*For detailed operational procedures, see [COPILOT_RUNBOOK.md](COPILOT_RUNBOOK.md)*

**Last Updated**: November 2025
**Maintainer**: TerraFusion Development Team
**Support**: Create issue in repository or contact platform team

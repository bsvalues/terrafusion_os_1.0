# 🚀 TerraFusion Co-Pilot Operational Runbook
*Production-grade deployment and operational guide for AI-powered government services*

## 📋 Quick Reference Card

### Health Endpoints
```bash
# Liveness (process alive) - NEVER fails if process is up
curl -f http://localhost:5000/healthz

# Readiness (dependencies healthy) - 503 until DB connects
curl http://localhost:5000/ready

# Version & deployment info
curl http://localhost:5000/api/version

# Prometheus metrics (human-readable)
curl http://localhost:5000/metrics
```

### Expected Responses
- `/healthz` → 200 within 3-10s of container start
- `/ready` → 503 until DB connects & migrations applied; then 200
- `/metrics` → Text format for Prometheus scraping every 15s
- Alert on 5+ minute readiness failures

---

## 🏗️ Development Workflow

### Local Development Start
```bash
# 1. Start development database
cd c:\Users\bsval\terrafusion_os_1.0\backend
docker compose -f compose.dev.yml up -d

# 2. Apply migrations (SQLite fallback available)
dotnet ef database update --project TerraFusion.Data --startup-project TerraFusion.API

# 3. Start API
cd TerraFusion.API
dotnet run --urls "http://0.0.0.0:5000"

# 4. Validate endpoints
cd c:\Users\bsval\terrafusion_os_1.0
.\scripts\smoke.ps1 "http://localhost:5000"
```

### Production Start (Docker)
```bash
# 1. Set environment variables
export POSTGRES_PASSWORD=your_secure_password
export REDIS_PASSWORD=your_redis_password
export GIT_SHA=commit_hash_from_ci
export BUILD_NUMBER=ci_build_number

# 2. Start production stack
docker compose -f compose.production.yml up -d

# 3. Monitor startup
docker compose -f compose.production.yml logs -f api

# 4. Validate health
curl -f http://localhost:5000/healthz
curl http://localhost:5000/ready
```

### Kubernetes Deployment
```bash
# 1. Create namespace
kubectl create namespace terrafusion

# 2. Apply secrets (edit values first!)
kubectl apply -f k8s/production/database.yaml

# 3. Deploy database
kubectl apply -f k8s/production/database.yaml

# 4. Deploy API
kubectl apply -f k8s/production/deployment.yaml

# 5. Deploy ingress
kubectl apply -f k8s/production/ingress.yaml

# 6. Verify deployment
kubectl get pods -n terrafusion
kubectl logs -f deployment/terrafusion-api -n terrafusion
```

---

## 🔍 Container Image Smoke Test (CI/CD)

### Automated CI Validation
```bash
# Build with metadata
docker build -f Dockerfile.production.enhanced \
  --build-arg GIT_SHA=$GIT_SHA \
  --build-arg BUILD_NUMBER=$BUILD_NUMBER \
  -t ghcr.io/yourorg/terrafusion-api:$GIT_SHA .

# Start container
docker run -d --name tf-api-test \
  -p 5000:5000 \
  -e GIT_SHA=$GIT_SHA \
  -e BUILD_NUMBER=$BUILD_NUMBER \
  ghcr.io/yourorg/terrafusion-api:$GIT_SHA

# Wait for startup
sleep 30

# Validate health endpoints
./scripts/smoke.ps1 http://localhost:5000

# Cleanup
docker stop tf-api-test
docker rm tf-api-test
```

### Image Labels & Metadata
```bash
# Check image metadata
docker inspect ghcr.io/yourorg/terrafusion-api:$GIT_SHA | jq '.[0].Config.Labels'

# Expected labels:
# - org.opencontainers.image.revision=$GIT_SHA
# - org.opencontainers.image.version=$SEMVER
# - org.opencontainers.image.title="TerraFusion API"
```

---

## 📊 Monitoring & Observability

### Prometheus Scraping
```yaml
# prometheus.yml
scrape_configs:
  - job_name: terrafusion-api
    static_configs:
      - targets: ["terrafusion-api:5000"]
    metrics_path: "/metrics"
    scrape_interval: 15s
```

### Key Metrics to Monitor
- `http_requests_total` - Request count by method/status
- `http_request_duration_seconds` - Response time histograms
- `dotnet_collection_count_total` - Garbage collection pressure
- `process_cpu_seconds_total` - CPU utilization
- `terrafusion_ai_agents_active` - Active AI agent count
- `terrafusion_compliance_score` - Government compliance metrics

### Health Check Monitoring
```bash
# Kubernetes liveness probe
livenessProbe:
  httpGet: { path: /healthz, port: 5000 }
  initialDelaySeconds: 10
  periodSeconds: 15

# Kubernetes readiness probe
readinessProbe:
  httpGet: { path: /ready, port: 5000 }
  initialDelaySeconds: 15
  periodSeconds: 10
```

---

## 🔒 Security Configuration

### Production Security Checklist
- [ ] HTTPS/TLS termination at ingress
- [ ] Rate limiting configured (100 RPS default)
- [ ] CORS restricted to allowed origins
- [ ] Security headers enabled (HSTS, X-Frame-Options, etc.)
- [ ] Health endpoints NOT publicly exposed
- [ ] Database credentials in Kubernetes secrets
- [ ] Non-root container user (UID 1001)
- [ ] Read-only root filesystem where possible

### CORS Configuration
```bash
# Environment variables for production
CORS_ALLOWED_ORIGINS=https://yourfrontend.com,https://admin.yourdomain.com
```

### Network Policies
```bash
# Apply network restrictions
kubectl apply -f k8s/production/ingress.yaml

# Verify policy
kubectl describe networkpolicy terrafusion-api-netpol -n terrafusion
```

---

## 🏥 Troubleshooting Guide

### Common Issues & Solutions

#### 1. API Won't Start
```bash
# Check logs
docker logs terrafusion-api-prod

# Common causes:
# - Database connection string invalid
# - Required environment variables missing
# - Port conflicts (check with netstat -ano | findstr :5000)
```

#### 2. Health Checks Failing
```bash
# Test individual endpoints
curl -v http://localhost:5000/healthz  # Should always return 200 if process alive
curl -v http://localhost:5000/ready    # Returns 503 until DB connects

# Check database connectivity
docker exec terrafusion-postgres-prod psql -U terrafusion_prod -d terrafusion_prod -c "SELECT 1;"
```

#### 3. Database Migration Issues
```bash
# Manual migration
dotnet ef database update --project TerraFusion.Data --startup-project TerraFusion.API

# Check migration history
dotnet ef migrations list --project TerraFusion.Data --startup-project TerraFusion.API

# Reset database (DANGER - deletes data)
docker compose -f compose.production.yml down -v
```

#### 4. Performance Issues
```bash
# Check metrics
curl http://localhost:5000/metrics | grep -E "(http_request_duration|process_cpu|dotnet_collection)"

# Monitor resource usage
docker stats terrafusion-api-prod

# Kubernetes resource usage
kubectl top pods -n terrafusion
```

### Log Analysis
```bash
# Structured log queries
docker logs terrafusion-api-prod 2>&1 | grep "ERROR\|WARN\|FATAL"

# Health check failures
kubectl logs -f deployment/terrafusion-api -n terrafusion | grep -E "(healthz|ready)"

# AI agent activity
docker logs terrafusion-api-prod 2>&1 | grep "AI_AGENT\|SWARM\|CONSCIOUSNESS"
```

---

## 🚦 Operational Expectations

### Startup Sequence
1. **0-10s**: Container starts, ASP.NET Core initializes
2. **10-15s**: Health endpoints become available (`/healthz` → 200)
3. **15-30s**: Database connects, migrations applied (`/ready` → 200)
4. **30-60s**: AI services initialize, full operational capacity

### Normal Operations
- **CPU**: 10-30% under normal load (200-500 requests/minute)
- **Memory**: 256-512MB working set
- **Response Time**: <10ms P95 for health endpoints, <50ms P95 for API endpoints
- **Availability**: 99.9% uptime target (4.3 minutes/month downtime budget)

### Scaling Triggers
- **Scale Up**: CPU >70% for 5+ minutes OR memory >80% for 2+ minutes
- **Scale Down**: CPU <30% AND memory <50% for 10+ minutes
- **Max Replicas**: 8 (prevents resource exhaustion)
- **Min Replicas**: 2 (high availability requirement)

---

## 🎯 Co-Pilot Agent Integration

### API Compatibility
The TerraFusion API is designed for seamless Co-Pilot agent integration:

- **Structured Responses**: All endpoints return consistent JSON with proper HTTP status codes
- **Health Observability**: Separate liveness/readiness for automated monitoring
- **Graceful Degradation**: Services operate in reduced mode when dependencies unavailable
- **Operational Metrics**: Prometheus endpoints for performance monitoring
- **Self-Healing**: Automatic reconnection and retry logic for external dependencies

### Recommended Co-Pilot Monitoring
```bash
# Monitor health every 30s
while true; do
  curl -s http://localhost:5000/healthz | jq '.status'
  sleep 30
done

# Track deployment versions
curl -s http://localhost:5000/api/version | jq '.commit, .build, .uptime'

# Performance alerting threshold
curl -s http://localhost:5000/metrics | grep 'http_request_duration_seconds{quantile="0.95"}' | awk '{if($2 > 0.1) print "ALERT: P95 latency high: " $2 "s"}'
```

---

## 📞 Escalation & Support

### Alert Severities
- **P0 Critical**: API completely down, health checks failing for 5+ minutes
- **P1 High**: Readiness failing, database connectivity issues, error rate >5%
- **P2 Medium**: Performance degraded (P95 >100ms), memory usage >80%
- **P3 Low**: Warning logs, non-critical service degradation

### On-Call Procedures
1. **Immediate**: Check `/healthz` and `/ready` endpoints
2. **Assess**: Review logs and metrics for root cause
3. **Mitigate**: Scale horizontally if performance issue
4. **Escalate**: Contact platform team if infrastructure issue
5. **Document**: Update runbook with lessons learned

---

## 🔄 Deployment Pipeline

### CI/CD Gates
1. **Build**: `dotnet build` (fail on warnings-as-errors for critical projects)
2. **Test**: `dotnet test` (unit + integration tests)
3. **Container Smoke**: Build image → start → validate `/healthz` within 30s → validate `/ready` with test DB
4. **Security Scan**: Container image vulnerability scanning
5. **Deploy**: Rolling update with zero downtime

### Environment Promotion
- **Development**: Auto-deploy on main branch merge
- **Staging**: Manual promotion with smoke tests
- **Production**: Approval-gated deployment with canary rollout

---

*This runbook is maintained by the TerraFusion development team. Last updated: November 2025*

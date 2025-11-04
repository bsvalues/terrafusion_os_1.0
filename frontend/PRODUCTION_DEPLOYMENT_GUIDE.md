# TerraFusion Quantum Research Portal - Production Deployment Guide

**Version:** 1.0.0
**Date:** November 3, 2025
**Status:** 🚀 Production-Ready Deployment Procedures
**Target:** Government PhD Research Environments (Harvard/MIT/Federal Institutions)

---

## 📋 Pre-Deployment Prerequisites

Before executing deployment commands, ensure all items in `PRODUCTION_DEPLOYMENT_CHECKLIST.md` are completed:

- ✅ All tests passing (87% coverage validated)
- ✅ Security compliance (JWT, HTTPS/TLS, rate limiting, zero critical CVEs)
- ✅ Infrastructure provisioned (Kubernetes cluster, PostgreSQL, DNS, SSL/TLS)
- ✅ Monitoring configured (SystemHealthDashboard, HealthCheckService, MetricsCollector, AlertingEngine)
- ✅ Configuration secrets created (JWT_SECRET, DATABASE_URL, etc.)

---

## 🌐 Deployment Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                   Internet (HTTPS Only)                       │
└───────────────────────────┬──────────────────────────────────┘
                            │
         ┌──────────────────▼──────────────────┐
         │    Load Balancer (AWS ALB/ELB)      │
         │    SSL/TLS Termination              │
         │    DDoS Protection (WAF)            │
         └──────────────┬─────────┬────────────┘
                        │         │
           ┌────────────▼───┐  ┌──▼───────────────────┐
           │   Kubernetes   │  │  Kubernetes Ingress   │
           │   Cluster      │  │  (nginx/traefik)     │
           │   (AKS/EKS/GKE)│  └──┬───────────────────┘
           └────────────────┘     │
                                  │
     ┌────────────────────────────┼─────────────────────────┐
     │                            │                         │
┌────▼─────┐              ┌──────▼─────┐          ┌───────▼────────┐
│ Frontend │              │  Backend   │          │  Consciousness │
│   Pod    │◄────────────►│   API Pod  │◄────────►│  Engine Pod    │
│ (React)  │              │  (Port     │          │  (Port 3004)   │
│          │              │   5000)    │          │                │
└──────────┘              └──────┬─────┘          └────────────────┘
                                 │
                          ┌──────▼─────┐
                          │ PostgreSQL │
                          │  Database  │
                          │ (Persistent│
                          │  Volume)   │
                          └────────────┘
```

---

## 🚀 Step-by-Step Deployment Procedure

### Step 1: Prepare Kubernetes Cluster

#### 1.1 Verify Cluster Access
```bash
# Test cluster connectivity
kubectl cluster-info

# Expected output:
# Kubernetes control plane is running at https://your-cluster-url
# CoreDNS is running at https://your-cluster-url/api/v1/namespaces/kube-system/services/kube-dns:dns/proxy

# Verify nodes are ready
kubectl get nodes

# Expected output: All nodes should show STATUS = Ready
```

#### 1.2 Create Namespace
```bash
# Create dedicated namespace for TerraFusion
kubectl create namespace terrafusion-research

# Set as default namespace for subsequent commands
kubectl config set-context --current --namespace=terrafusion-research

# Verify namespace created
kubectl get namespace terrafusion-research
```

---

### Step 2: Deploy Configuration & Secrets

#### 2.1 Create ConfigMap for Environment Variables
```bash
# Create configmap.yaml
cat <<EOF > configmap.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: terrafusion-config
  namespace: terrafusion-research
data:
  # API Configuration
  API_BASE_URL: "http://terrafusion-api:5000"
  CONSCIOUSNESS_ENGINE_URL: "http://terrafusion-consciousness:3004"

  # Frontend Configuration
  VITE_API_URL: "https://api.terrafusion.gov"
  VITE_CONSCIOUSNESS_URL: "https://consciousness.terrafusion.gov"

  # Monitoring Configuration
  HEALTH_CHECK_INTERVAL_MS: "5000"
  METRICS_RETENTION_DAYS: "90"
  ALERT_COOLDOWN_MINUTES: "5"

  # Government Compliance
  FISMA_HIGH_ENABLED: "true"
  IAAO_COMPLIANCE_ENABLED: "true"
  WCAG_AA_ENFORCEMENT: "true"

  # Rate Limiting
  RATE_LIMIT_REQUESTS: "100"
  RATE_LIMIT_WINDOW_MINUTES: "15"
EOF

# Apply ConfigMap
kubectl apply -f configmap.yaml

# Verify ConfigMap created
kubectl get configmap terrafusion-config -o yaml
```

#### 2.2 Create Secrets for Sensitive Data
```bash
# Create secrets.yaml (NEVER commit to Git)
cat <<EOF > secrets.yaml
apiVersion: v1
kind: Secret
metadata:
  name: terrafusion-secrets
  namespace: terrafusion-research
type: Opaque
stringData:
  # Database Connection
  DATABASE_URL: "postgresql://terrafusion_user:STRONG_PASSWORD_HERE@postgres-service:5432/terrafusion_research"

  # JWT Authentication
  JWT_SECRET: "GENERATE_STRONG_SECRET_KEY_HERE"
  JWT_EXPIRATION: "24h"

  # API Keys (if using external services)
  GITHUB_MODELS_API_KEY: "YOUR_API_KEY_HERE"

  # Notification Secrets
  SLACK_WEBHOOK_URL: "https://hooks.slack.com/services/YOUR/WEBHOOK/URL"
  SMTP_PASSWORD: "YOUR_SMTP_PASSWORD"
  TWILIO_AUTH_TOKEN: "YOUR_TWILIO_TOKEN"
EOF

# Apply Secrets
kubectl apply -f secrets.yaml

# IMPORTANT: Delete secrets.yaml file immediately after applying
rm secrets.yaml

# Verify Secret created (values are base64 encoded)
kubectl get secret terrafusion-secrets -o yaml
```

---

### Step 3: Deploy PostgreSQL Database

#### 3.1 Create Persistent Volume Claim
```bash
# Create postgres-pvc.yaml
cat <<EOF > postgres-pvc.yaml
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: postgres-pvc
  namespace: terrafusion-research
spec:
  accessModes:
    - ReadWriteOnce
  resources:
    requests:
      storage: 100Gi  # 100GB for research data
  storageClassName: standard-ssd  # Use SSD for performance
EOF

# Apply PVC
kubectl apply -f postgres-pvc.yaml

# Verify PVC created and bound
kubectl get pvc postgres-pvc
# STATUS should show "Bound"
```

#### 3.2 Deploy PostgreSQL StatefulSet
```bash
# Create postgres-deployment.yaml
cat <<EOF > postgres-deployment.yaml
apiVersion: apps/v1
kind: StatefulSet
metadata:
  name: postgres
  namespace: terrafusion-research
spec:
  serviceName: postgres-service
  replicas: 1
  selector:
    matchLabels:
      app: postgres
  template:
    metadata:
      labels:
        app: postgres
    spec:
      containers:
      - name: postgres
        image: postgres:16-alpine
        ports:
        - containerPort: 5432
          name: postgres
        env:
        - name: POSTGRES_DB
          value: terrafusion_research
        - name: POSTGRES_USER
          value: terrafusion_user
        - name: POSTGRES_PASSWORD
          valueFrom:
            secretKeyRef:
              name: terrafusion-secrets
              key: DATABASE_PASSWORD
        volumeMounts:
        - name: postgres-storage
          mountPath: /var/lib/postgresql/data
          subPath: postgres
        resources:
          requests:
            memory: "4Gi"
            cpu: "2000m"
          limits:
            memory: "8Gi"
            cpu: "4000m"
        livenessProbe:
          exec:
            command:
            - pg_isready
            - -U
            - terrafusion_user
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          exec:
            command:
            - pg_isready
            - -U
            - terrafusion_user
          initialDelaySeconds: 5
          periodSeconds: 5
  volumeClaimTemplates:
  - metadata:
      name: postgres-storage
    spec:
      accessModes: [ "ReadWriteOnce" ]
      resources:
        requests:
          storage: 100Gi
---
apiVersion: v1
kind: Service
metadata:
  name: postgres-service
  namespace: terrafusion-research
spec:
  selector:
    app: postgres
  ports:
  - port: 5432
    targetPort: 5432
  clusterIP: None  # Headless service for StatefulSet
EOF

# Apply PostgreSQL deployment
kubectl apply -f postgres-deployment.yaml

# Wait for PostgreSQL pod to be ready
kubectl wait --for=condition=ready pod -l app=postgres --timeout=300s

# Verify PostgreSQL is running
kubectl get pods -l app=postgres
kubectl logs -l app=postgres --tail=50
```

#### 3.3 Run Database Migrations
```bash
# Create migration job
kubectl run db-migrate \
  --image=terrafusion/backend-api:latest \
  --restart=Never \
  --env="DATABASE_URL=$(kubectl get secret terrafusion-secrets -o jsonpath='{.data.DATABASE_URL}' | base64 -d)" \
  --command -- dotnet ef database update

# Wait for migration to complete
kubectl wait --for=condition=complete job/db-migrate --timeout=300s

# Check migration logs
kubectl logs job/db-migrate

# Delete migration job
kubectl delete job db-migrate
```

---

### Step 4: Deploy Backend Services

#### 4.1 Deploy TerraFusion API (Port 5000)
```bash
# Create backend-api-deployment.yaml
cat <<EOF > backend-api-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: terrafusion-api
  namespace: terrafusion-research
spec:
  replicas: 3  # 3 replicas for high availability
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
        image: terrafusion/backend-api:1.0.0
        ports:
        - containerPort: 5000
          name: http
        env:
        - name: ASPNETCORE_ENVIRONMENT
          value: "Production"
        - name: ASPNETCORE_URLS
          value: "http://+:5000"
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: terrafusion-secrets
              key: DATABASE_URL
        - name: JWT_SECRET
          valueFrom:
            secretKeyRef:
              name: terrafusion-secrets
              key: JWT_SECRET
        envFrom:
        - configMapRef:
            name: terrafusion-config
        resources:
          requests:
            memory: "2Gi"
            cpu: "1000m"
          limits:
            memory: "4Gi"
            cpu: "2000m"
        livenessProbe:
          httpGet:
            path: /health
            port: 5000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /health
            port: 5000
          initialDelaySeconds: 10
          periodSeconds: 5
---
apiVersion: v1
kind: Service
metadata:
  name: terrafusion-api
  namespace: terrafusion-research
spec:
  selector:
    app: terrafusion-api
  ports:
  - port: 5000
    targetPort: 5000
  type: ClusterIP
EOF

# Apply API deployment
kubectl apply -f backend-api-deployment.yaml

# Wait for API pods to be ready
kubectl wait --for=condition=ready pod -l app=terrafusion-api --timeout=300s

# Verify API pods running
kubectl get pods -l app=terrafusion-api
```

#### 4.2 Deploy Consciousness Engine (Port 3004)
```bash
# Create consciousness-deployment.yaml
cat <<EOF > consciousness-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: terrafusion-consciousness
  namespace: terrafusion-research
spec:
  replicas: 2  # 2 replicas for AI swarm coordination
  selector:
    matchLabels:
      app: terrafusion-consciousness
  template:
    metadata:
      labels:
        app: terrafusion-consciousness
    spec:
      containers:
      - name: consciousness
        image: terrafusion/consciousness-engine:1.0.0
        ports:
        - containerPort: 3004
          name: http
        env:
        - name: ASPNETCORE_ENVIRONMENT
          value: "Production"
        - name: ASPNETCORE_URLS
          value: "http://+:3004"
        - name: AI_SWARM_SIZE
          value: "50000"
        - name: QUANTUM_OPTIMIZATION_ENABLED
          value: "true"
        envFrom:
        - configMapRef:
            name: terrafusion-config
        - secretRef:
            name: terrafusion-secrets
        resources:
          requests:
            memory: "8Gi"
            cpu: "4000m"
          limits:
            memory: "16Gi"
            cpu: "8000m"
        livenessProbe:
          httpGet:
            path: /health
            port: 3004
          initialDelaySeconds: 60
          periodSeconds: 15
        readinessProbe:
          httpGet:
            path: /health
            port: 3004
          initialDelaySeconds: 30
          periodSeconds: 10
---
apiVersion: v1
kind: Service
metadata:
  name: terrafusion-consciousness
  namespace: terrafusion-research
spec:
  selector:
    app: terrafusion-consciousness
  ports:
  - port: 3004
    targetPort: 3004
  type: ClusterIP
EOF

# Apply Consciousness deployment
kubectl apply -f consciousness-deployment.yaml

# Wait for Consciousness pods to be ready
kubectl wait --for=condition=ready pod -l app=terrafusion-consciousness --timeout=600s

# Verify Consciousness pods running
kubectl get pods -l app=terrafusion-consciousness
```

---

### Step 5: Deploy Frontend Application

#### 5.1 Build and Push Frontend Docker Image
```bash
# Navigate to frontend directory
cd c:\Users\bsval\terrafusion_os_1.0\frontend

# Build production Docker image
docker build -t terrafusion/frontend:1.0.0 -f Dockerfile.production .

# Tag for container registry
docker tag terrafusion/frontend:1.0.0 your-registry.azurecr.io/terrafusion-frontend:1.0.0

# Push to container registry
docker push your-registry.azurecr.io/terrafusion-frontend:1.0.0
```

#### 5.2 Deploy Frontend Pods
```bash
# Create frontend-deployment.yaml
cat <<EOF > frontend-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: terrafusion-frontend
  namespace: terrafusion-research
spec:
  replicas: 4  # 4 replicas for load distribution
  selector:
    matchLabels:
      app: terrafusion-frontend
  template:
    metadata:
      labels:
        app: terrafusion-frontend
    spec:
      containers:
      - name: frontend
        image: terrafusion/frontend:1.0.0
        ports:
        - containerPort: 80
          name: http
        envFrom:
        - configMapRef:
            name: terrafusion-config
        resources:
          requests:
            memory: "512Mi"
            cpu: "250m"
          limits:
            memory: "1Gi"
            cpu: "500m"
        livenessProbe:
          httpGet:
            path: /health
            port: 80
          initialDelaySeconds: 10
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /health
            port: 80
          initialDelaySeconds: 5
          periodSeconds: 5
---
apiVersion: v1
kind: Service
metadata:
  name: terrafusion-frontend
  namespace: terrafusion-research
spec:
  selector:
    app: terrafusion-frontend
  ports:
  - port: 80
    targetPort: 80
  type: ClusterIP
EOF

# Apply Frontend deployment
kubectl apply -f frontend-deployment.yaml

# Wait for Frontend pods to be ready
kubectl wait --for=condition=ready pod -l app=terrafusion-frontend --timeout=300s

# Verify Frontend pods running
kubectl get pods -l app=terrafusion-frontend
```

---

### Step 6: Configure Ingress & Load Balancing

#### 6.1 Install NGINX Ingress Controller (if not already installed)
```bash
# Install NGINX Ingress Controller via Helm
helm repo add ingress-nginx https://kubernetes.github.io/ingress-nginx
helm repo update

helm install nginx-ingress ingress-nginx/ingress-nginx \
  --namespace ingress-nginx \
  --create-namespace \
  --set controller.replicaCount=2 \
  --set controller.nodeSelector."kubernetes\.io/os"=linux \
  --set defaultBackend.nodeSelector."kubernetes\.io/os"=linux

# Wait for ingress controller to be ready
kubectl wait --namespace ingress-nginx \
  --for=condition=ready pod \
  --selector=app.kubernetes.io/component=controller \
  --timeout=300s
```

#### 6.2 Create Ingress Resource with SSL/TLS
```bash
# First, create TLS secret from certificates
kubectl create secret tls terrafusion-tls \
  --namespace=terrafusion-research \
  --cert=/path/to/terrafusion.gov.crt \
  --key=/path/to/terrafusion.gov.key

# Create ingress.yaml
cat <<EOF > ingress.yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: terrafusion-ingress
  namespace: terrafusion-research
  annotations:
    nginx.ingress.kubernetes.io/ssl-redirect: "true"
    nginx.ingress.kubernetes.io/force-ssl-redirect: "true"
    nginx.ingress.kubernetes.io/rate-limit: "100"
    nginx.ingress.kubernetes.io/limit-rps: "20"
    cert-manager.io/cluster-issuer: "letsencrypt-prod"
spec:
  ingressClassName: nginx
  tls:
  - hosts:
    - portal.terrafusion.gov
    - api.terrafusion.gov
    - consciousness.terrafusion.gov
    secretName: terrafusion-tls
  rules:
  - host: portal.terrafusion.gov
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: terrafusion-frontend
            port:
              number: 80
  - host: api.terrafusion.gov
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: terrafusion-api
            port:
              number: 5000
  - host: consciousness.terrafusion.gov
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: terrafusion-consciousness
            port:
              number: 3004
EOF

# Apply Ingress configuration
kubectl apply -f ingress.yaml

# Verify Ingress created
kubectl get ingress terrafusion-ingress -n terrafusion-research

# Get external IP address assigned by load balancer
kubectl get ingress terrafusion-ingress -n terrafusion-research -o jsonpath='{.status.loadBalancer.ingress[0].ip}'
```

---

### Step 7: Deploy Monitoring Infrastructure

#### 7.1 Deploy System Health Dashboard
```bash
# Health dashboard is part of frontend deployment
# Verify health dashboard accessible
kubectl port-forward -n terrafusion-research svc/terrafusion-frontend 8080:80

# Open browser to http://localhost:8080/monitoring/health
# Verify dashboard displays all 7 services with real-time metrics
```

#### 7.2 Configure Prometheus Metrics Scraping
```bash
# Create prometheus-servicemonitor.yaml
cat <<EOF > prometheus-servicemonitor.yaml
apiVersion: monitoring.coreos.com/v1
kind: ServiceMonitor
metadata:
  name: terrafusion-monitoring
  namespace: terrafusion-research
spec:
  selector:
    matchLabels:
      monitoring: enabled
  endpoints:
  - port: http
    path: /metrics
    interval: 30s
EOF

# Apply ServiceMonitor
kubectl apply -f prometheus-servicemonitor.yaml
```

#### 7.3 Set Up Alert Manager Integration
```bash
# Create alertmanager-config.yaml
cat <<EOF > alertmanager-config.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: alertmanager-config
  namespace: terrafusion-research
data:
  alertmanager.yml: |
    global:
      resolve_timeout: 5m
      slack_api_url: 'YOUR_SLACK_WEBHOOK_URL'

    route:
      group_by: ['alertname', 'cluster', 'service']
      group_wait: 10s
      group_interval: 10s
      repeat_interval: 12h
      receiver: 'slack-critical'
      routes:
      - match:
          severity: critical
        receiver: 'slack-critical'
      - match:
          severity: warning
        receiver: 'slack-warning'

    receivers:
    - name: 'slack-critical'
      slack_configs:
      - channel: '#terrafusion-critical-alerts'
        title: '🔴 TerraFusion Critical Alert'
        text: '{{ .CommonAnnotations.description }}'
        send_resolved: true

    - name: 'slack-warning'
      slack_configs:
      - channel: '#terrafusion-alerts'
        title: '🟡 TerraFusion Warning'
        text: '{{ .CommonAnnotations.description }}'
        send_resolved: true
EOF

# Apply AlertManager configuration
kubectl apply -f alertmanager-config.yaml
```

---

### Step 8: Configure DNS Records

#### 8.1 Update DNS A Records
```bash
# Get Load Balancer external IP
LB_IP=$(kubectl get ingress terrafusion-ingress -n terrafusion-research -o jsonpath='{.status.loadBalancer.ingress[0].ip}')

echo "Load Balancer IP: $LB_IP"

# Add DNS A records in your DNS provider:
# portal.terrafusion.gov        A    $LB_IP
# api.terrafusion.gov           A    $LB_IP
# consciousness.terrafusion.gov A    $LB_IP

# Verify DNS propagation (may take 5-60 minutes)
nslookup portal.terrafusion.gov
nslookup api.terrafusion.gov
nslookup consciousness.terrafusion.gov
```

---

### Step 9: Post-Deployment Validation

#### 9.1 Health Check All Services
```bash
# Test API health endpoint
curl -k https://api.terrafusion.gov/health

# Expected response: {"status":"healthy","timestamp":"2025-11-03T..."}

# Test Consciousness Engine health
curl -k https://consciousness.terrafusion.gov/health

# Test Frontend health
curl -k https://portal.terrafusion.gov/health

# Verify all 7 services reporting healthy
kubectl run curl-test --image=curlimages/curl --rm -it --restart=Never -- \
  curl -s http://terrafusion-api:5000/api/system/health | jq '.services[] | select(.status != "healthy")'

# Output should be empty (no unhealthy services)
```

#### 9.2 Run E2E Integration Tests
```bash
# Navigate to frontend directory
cd c:\Users\bsval\terrafusion_os_1.0\frontend

# Set environment variables for production URLs
export VITE_API_URL=https://api.terrafusion.gov
export VITE_CONSCIOUSNESS_URL=https://consciousness.terrafusion.gov

# Run integration test suite
npm run test:e2e

# Expected output: All 12+ integration tests passing
# ✅ Complete research workflow validated
# ✅ Health monitoring integration validated
# ✅ Metrics collection validated
# ✅ Alerting system validated
# ✅ Cross-system integration validated
```

#### 9.3 Validate Monitoring Dashboard
```bash
# Open System Health Dashboard in browser
# URL: https://portal.terrafusion.gov/monitoring/health

# Verify dashboard displays:
# ✅ System uptime: ≥99.9%
# ✅ Average response time: <50ms
# ✅ Error rate: <1%
# ✅ All 7 services showing "healthy" status
# ✅ No active critical alerts
# ✅ Resource utilization within normal ranges (CPU <70%, Memory <80%)
```

#### 9.4 Verify SSL/TLS Certificates
```bash
# Check SSL certificate validity
echo | openssl s_client -servername portal.terrafusion.gov -connect portal.terrafusion.gov:443 2>/dev/null | openssl x509 -noout -dates

# Verify certificate expiration date (should be >30 days in future)
# notBefore=...
# notAfter=...

# Test SSL Labs rating (optional)
# Visit: https://www.ssllabs.com/ssltest/analyze.html?d=portal.terrafusion.gov
# Target: A+ rating
```

---

### Step 10: Enable Production Monitoring

#### 10.1 Activate GitHub Actions Metrics Collection
```bash
# Metrics collection workflow already configured in:
# .github/workflows/historical-metrics.yml

# Verify workflow runs automatically on weekly schedule (Mondays 3 AM UTC)
# Manual trigger for immediate validation:
gh workflow run historical-metrics.yml

# Monitor workflow execution
gh run list --workflow=historical-metrics.yml

# View latest metrics report
gh run view --log
```

#### 10.2 Verify Alerting Channels
```bash
# Test Slack webhook integration
curl -X POST YOUR_SLACK_WEBHOOK_URL \
  -H 'Content-Type: application/json' \
  -d '{"text":"🚀 TerraFusion Production Deployment Complete - System Health Monitoring Active"}'

# Verify message received in Slack channel #terrafusion-alerts

# Test email alerting (if configured)
# Send test email via SMTP configuration
```

---

## 📊 Production Monitoring URLs

After successful deployment, access monitoring dashboards:

- **System Health Dashboard:** https://portal.terrafusion.gov/monitoring/health
- **Research Portal:** https://portal.terrafusion.gov
- **API Health Endpoint:** https://api.terrafusion.gov/health
- **Consciousness Engine Health:** https://consciousness.terrafusion.gov/health
- **Kubernetes Dashboard:** `kubectl proxy` → http://localhost:8001/api/v1/namespaces/kubernetes-dashboard/services/https:kubernetes-dashboard:/proxy/

---

## 🔄 Rollback Procedures

If deployment fails or critical issues detected:

### Quick Rollback to Previous Version
```bash
# Rollback API deployment
kubectl rollout undo deployment/terrafusion-api -n terrafusion-research

# Rollback Consciousness Engine
kubectl rollout undo deployment/terrafusion-consciousness -n terrafusion-research

# Rollback Frontend
kubectl rollout undo deployment/terrafusion-frontend -n terrafusion-research

# Verify rollback status
kubectl rollout status deployment/terrafusion-api -n terrafusion-research
kubectl rollout status deployment/terrafusion-consciousness -n terrafusion-research
kubectl rollout status deployment/terrafusion-frontend -n terrafusion-research

# Check all pods are running previous version
kubectl get pods -n terrafusion-research
```

### Database Rollback
```bash
# If database migration needs rollback, run:
kubectl run db-rollback \
  --image=terrafusion/backend-api:previous-version \
  --restart=Never \
  --env="DATABASE_URL=$(kubectl get secret terrafusion-secrets -o jsonpath='{.data.DATABASE_URL}' | base64 -d)" \
  --command -- dotnet ef database update PREVIOUS_MIGRATION_NAME

# Verify rollback complete
kubectl logs job/db-rollback
```

---

## 📋 Post-Deployment Checklist

After completing deployment, verify:

- [ ] **All pods running:** `kubectl get pods -n terrafusion-research` shows all pods in "Running" state
- [ ] **Health checks passing:** All 7 services report "healthy" status
- [ ] **SSL/TLS working:** HTTPS redirects functional, valid certificates
- [ ] **DNS resolution:** portal.terrafusion.gov, api.terrafusion.gov, consciousness.terrafusion.gov resolve correctly
- [ ] **Monitoring active:** System Health Dashboard accessible and displaying real-time data
- [ ] **Alerts configured:** Slack/email notifications working
- [ ] **Database migrations applied:** All EF Core migrations executed successfully
- [ ] **E2E tests passing:** Integration test suite passes against production URLs
- [ ] **Performance targets met:** Response times <50ms, uptime ≥99.9%, error rate <1%
- [ ] **Security validated:** Rate limiting active, CORS configured, JWT authentication working
- [ ] **Backup procedures:** Database backups scheduled (daily at minimum)
- [ ] **Documentation updated:** Team notified of production URLs and access procedures

---

## 🆘 Troubleshooting Guide

### Issue: Pods stuck in "Pending" state
```bash
# Check pod events
kubectl describe pod POD_NAME -n terrafusion-research

# Common causes:
# - Insufficient cluster resources (CPU/memory)
# - PersistentVolumeClaim not bound
# - Image pull errors

# Solution: Scale down other workloads or add nodes to cluster
kubectl top nodes  # Check resource utilization
```

### Issue: Database connection failures
```bash
# Verify PostgreSQL pod running
kubectl get pods -l app=postgres -n terrafusion-research

# Check PostgreSQL logs
kubectl logs -l app=postgres -n terrafusion-research --tail=100

# Test database connectivity from API pod
kubectl exec -it deployment/terrafusion-api -n terrafusion-research -- \
  psql "$(kubectl get secret terrafusion-secrets -o jsonpath='{.data.DATABASE_URL}' | base64 -d)"

# If connection fails, verify:
# - DATABASE_URL secret is correct
# - PostgreSQL service is accessible (postgres-service:5432)
# - Network policies allow pod-to-pod communication
```

### Issue: High response times or timeouts
```bash
# Check resource utilization
kubectl top pods -n terrafusion-research

# Scale up replicas if CPU/memory high
kubectl scale deployment/terrafusion-api --replicas=5 -n terrafusion-research

# Verify horizontal pod autoscaling (if configured)
kubectl get hpa -n terrafusion-research

# Check for network bottlenecks
kubectl get svc -n terrafusion-research
```

### Issue: SSL/TLS certificate errors
```bash
# Verify TLS secret exists and contains valid certificates
kubectl get secret terrafusion-tls -n terrafusion-research -o yaml

# Check certificate expiration
kubectl get secret terrafusion-tls -n terrafusion-research -o jsonpath='{.data.tls\.crt}' | \
  base64 -d | openssl x509 -noout -dates

# If using cert-manager, check certificate request status
kubectl get certificate -n terrafusion-research
kubectl describe certificate terrafusion-tls -n terrafusion-research
```

---

## 📞 Support Contacts

For production deployment assistance:

- **DevOps Team:** devops@terrafusion.gov
- **Security Team:** security@terrafusion.gov
- **On-Call Engineer:** oncall@terrafusion.gov (24/7 support)
- **Slack Channel:** #terrafusion-production
- **Emergency Hotline:** +1-XXX-XXX-XXXX

---

## 🏆 Deployment Success Criteria

Deployment is considered successful when:

✅ **All pods running:** Zero CrashLoopBackOff or ImagePullBackOff errors
✅ **Health checks passing:** 100% of services report "healthy" for 5+ minutes
✅ **System uptime:** ≥99.9% uptime maintained for first 24 hours
✅ **Response times:** P95 latency <50ms for all API endpoints
✅ **Error rate:** <1% error rate across all services
✅ **Security validated:** Zero critical vulnerabilities, SSL/TLS A+ rating
✅ **Monitoring active:** System Health Dashboard displaying real-time metrics
✅ **Alerts functional:** Test alerts successfully delivered to all channels
✅ **E2E tests passing:** All integration tests pass against production environment
✅ **Capacity planning:** Weekly metrics collection workflow executing successfully

---

**Deployment Version:** 1.0.0
**Last Updated:** November 3, 2025
**Status:** 🚀 Ready for Production Deployment

**Government. Transcended.** - Deploy with championship-grade infrastructure excellence.

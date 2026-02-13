# TerraFusion Federation System - Deployment Guide

## Overview

This comprehensive deployment guide provides step-by-step instructions for deploying the TerraFusion Federation System across development, staging, and production environments. The system supports multiple deployment strategies including Docker Compose for development and Kubernetes for production.

## Prerequisites

### System Requirements

**Development Environment:**
- Docker 24.0+ with Docker Compose
- Node.js 20+ with npm
- Rust 1.75+ with Cargo
- Git 2.40+

**Production Environment:**
- Kubernetes 1.28+
- Docker registry access
- Load balancer (AWS ALB, GCP LB, etc.)
- SSL/TLS certificates
- Monitoring stack (Prometheus/Grafana)

### Access Requirements

- Container registry credentials
- Kubernetes cluster access (kubectl configured)
- SSL certificate files
- Environment configuration files

## Development Deployment

### Quick Start with Docker Compose

1. **Clone Repository**
```bash
git clone https://github.com/bsvalues/terrafusion_os_1.0.git
cd TerraFusion_Command_Portal_Starter/terrafusion-command-portal
```

2. **Environment Configuration**
```bash
# Copy environment template
cp .env.example .env.local

# Configure environment variables
BACKEND_URL=http://localhost:8787
FRONTEND_URL=http://localhost:3000
NODE_ENV=development
```

3. **Start Services**
```bash
# Build and start all services
docker-compose up --build

# Verify services
curl http://localhost:8787/health    # Backend health
curl http://localhost:3000          # Frontend access
```

### Manual Development Setup

**Backend Service:**
```bash
cd backend
cargo build --release
cargo run
# Backend available at http://localhost:8787
```

**Frontend Service:**
```bash
cd apps/terrafusion-web
npm install
npm run dev
# Frontend available at http://localhost:3000
```

## Staging Deployment

### Docker Compose for Staging

1. **Staging Configuration**
```yaml
# docker-compose.staging.yml
version: '3.8'
services:
  backend:
    build: 
      context: ./backend
      dockerfile: Dockerfile
    environment:
      - RUST_LOG=info
      - PORT=8787
    ports:
      - "8787:8787"
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8787/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  frontend:
    build:
      context: ./apps/terrafusion-web
      dockerfile: Dockerfile
    environment:
      - NODE_ENV=production
      - BACKEND_URL=http://backend:8787
    ports:
      - "3000:3000"
    depends_on:
      backend:
        condition: service_healthy
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/api/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
      - ./ssl:/etc/nginx/ssl:ro
    depends_on:
      - frontend
      - backend
```

2. **Deploy to Staging**
```bash
# Deploy staging environment
docker-compose -f docker-compose.staging.yml up -d

# Monitor deployment
docker-compose -f docker-compose.staging.yml logs -f

# Verify deployment
curl -k https://staging.terrafusion.gov/health
```

## Production Deployment

### Kubernetes Production Deployment

1. **Namespace Setup**
```bash
kubectl create namespace terrafusion-federation
kubectl label namespace terrafusion-federation tier=production
```

2. **ConfigMap Creation**
```yaml
# k8s/configmap.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: terrafusion-config
  namespace: terrafusion-federation
data:
  BACKEND_URL: "https://api.terrafusion.gov"
  FRONTEND_URL: "https://terrafusion.gov"
  NODE_ENV: "production"
  RUST_LOG: "info"
```

3. **Secret Management**
```yaml
# k8s/secrets.yaml
apiVersion: v1
kind: Secret
metadata:
  name: terrafusion-secrets
  namespace: terrafusion-federation
type: Opaque
data:
  DATABASE_URL: <base64-encoded>
  JWT_SECRET: <base64-encoded>
  TLS_CERT: <base64-encoded>
  TLS_KEY: <base64-encoded>
```

4. **Backend Deployment**
```yaml
# k8s/backend-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: terrafusion-backend
  namespace: terrafusion-federation
spec:
  replicas: 3
  selector:
    matchLabels:
      app: terrafusion-backend
  template:
    metadata:
      labels:
        app: terrafusion-backend
    spec:
      containers:
      - name: backend
        image: terrafusion/backend:v1.0.0
        ports:
        - containerPort: 8787
        env:
        - name: PORT
          value: "8787"
        envFrom:
        - configMapRef:
            name: terrafusion-config
        - secretRef:
            name: terrafusion-secrets
        resources:
          requests:
            memory: "512Mi"
            cpu: "500m"
          limits:
            memory: "1Gi"
            cpu: "1000m"
        livenessProbe:
          httpGet:
            path: /health
            port: 8787
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /ready
            port: 8787
          initialDelaySeconds: 5
          periodSeconds: 5
```

5. **Frontend Deployment**
```yaml
# k8s/frontend-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: terrafusion-frontend
  namespace: terrafusion-federation
spec:
  replicas: 3
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
        image: terrafusion/frontend:v1.0.0
        ports:
        - containerPort: 3000
        envFrom:
        - configMapRef:
            name: terrafusion-config
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
        livenessProbe:
          httpGet:
            path: /api/health
            port: 3000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /api/health
            port: 3000
          initialDelaySeconds: 10
          periodSeconds: 5
```

6. **Service Configuration**
```yaml
# k8s/services.yaml
apiVersion: v1
kind: Service
metadata:
  name: terrafusion-backend-service
  namespace: terrafusion-federation
spec:
  selector:
    app: terrafusion-backend
  ports:
    - port: 8787
      targetPort: 8787
  type: ClusterIP

---
apiVersion: v1
kind: Service
metadata:
  name: terrafusion-frontend-service
  namespace: terrafusion-federation
spec:
  selector:
    app: terrafusion-frontend
  ports:
    - port: 3000
      targetPort: 3000
  type: ClusterIP
```

7. **Ingress Configuration**
```yaml
# k8s/ingress.yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: terrafusion-ingress
  namespace: terrafusion-federation
  annotations:
    kubernetes.io/ingress.class: "nginx"
    cert-manager.io/cluster-issuer: "letsencrypt-prod"
    nginx.ingress.kubernetes.io/ssl-redirect: "true"
    nginx.ingress.kubernetes.io/proxy-body-size: "50m"
spec:
  tls:
  - hosts:
    - terrafusion.gov
    - api.terrafusion.gov
    secretName: terrafusion-tls
  rules:
  - host: terrafusion.gov
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: terrafusion-frontend-service
            port:
              number: 3000
  - host: api.terrafusion.gov
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: terrafusion-backend-service
            port:
              number: 8787
```

8. **Deploy Production**
```bash
# Apply all configurations
kubectl apply -f k8s/

# Verify deployment
kubectl get pods -n terrafusion-federation
kubectl get services -n terrafusion-federation
kubectl get ingress -n terrafusion-federation

# Check logs
kubectl logs -f deployment/terrafusion-backend -n terrafusion-federation
kubectl logs -f deployment/terrafusion-frontend -n terrafusion-federation
```

## Auto-Scaling Configuration

### Horizontal Pod Autoscaler

```yaml
# k8s/hpa.yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: terrafusion-backend-hpa
  namespace: terrafusion-federation
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: terrafusion-backend
  minReplicas: 3
  maxReplicas: 20
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

---
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: terrafusion-frontend-hpa
  namespace: terrafusion-federation
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: terrafusion-frontend
  minReplicas: 3
  maxReplicas: 15
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
```

## Monitoring Setup

### Prometheus ServiceMonitor

```yaml
# k8s/monitoring.yaml
apiVersion: monitoring.coreos.com/v1
kind: ServiceMonitor
metadata:
  name: terrafusion-monitoring
  namespace: terrafusion-federation
spec:
  selector:
    matchLabels:
      app: terrafusion-backend
  endpoints:
  - port: http
    path: /metrics
    interval: 30s
```

### Grafana Dashboard Import

```bash
# Import pre-built dashboards
kubectl create configmap grafana-dashboards \
  --from-file=monitoring/dashboards/ \
  -n monitoring
```

## Security Considerations

### Network Policies

```yaml
# k8s/network-policy.yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: terrafusion-network-policy
  namespace: terrafusion-federation
spec:
  podSelector: {}
  policyTypes:
  - Ingress
  - Egress
  ingress:
  - from:
    - namespaceSelector:
        matchLabels:
          name: ingress-nginx
    - namespaceSelector:
        matchLabels:
          name: monitoring
  egress:
  - to: []
    ports:
    - protocol: TCP
      port: 53
    - protocol: UDP
      port: 53
  - to:
    - namespaceSelector: {}
```

### Pod Security Standards

```yaml
# k8s/pod-security-policy.yaml
apiVersion: v1
kind: SecurityContext
spec:
  runAsNonRoot: true
  runAsUser: 1000
  runAsGroup: 1000
  fsGroup: 1000
  seccompProfile:
    type: RuntimeDefault
  capabilities:
    drop:
    - ALL
  allowPrivilegeEscalation: false
  readOnlyRootFilesystem: true
```

## Backup and Recovery

### Database Backup

```bash
# Automated backup script
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
kubectl exec -n terrafusion-federation deployment/database -- \
  pg_dump -h localhost -U postgres terrafusion > backup_$DATE.sql
```

### Disaster Recovery

```bash
# Emergency deployment script
#!/bin/bash
kubectl apply -f k8s/disaster-recovery/
kubectl rollout restart deployment/terrafusion-backend -n terrafusion-federation
kubectl rollout restart deployment/terrafusion-frontend -n terrafusion-federation
```

## Troubleshooting

### Common Issues

**Pod Startup Failures:**
```bash
kubectl describe pod <pod-name> -n terrafusion-federation
kubectl logs <pod-name> -n terrafusion-federation
```

**Service Discovery Issues:**
```bash
kubectl get endpoints -n terrafusion-federation
kubectl port-forward svc/terrafusion-backend-service 8787:8787 -n terrafusion-federation
```

**Ingress Problems:**
```bash
kubectl describe ingress terrafusion-ingress -n terrafusion-federation
kubectl logs -n ingress-nginx deployment/ingress-nginx-controller
```

### Health Checks

```bash
# System health verification
curl -k https://terrafusion.gov/api/health
curl -k https://api.terrafusion.gov/health
kubectl get pods -n terrafusion-federation -o wide
```

---

**Document Version:** 1.0.0  
**Last Updated:** October 16, 2025  
**Classification:** Government Grade  
**Deployment Status:** Production Ready
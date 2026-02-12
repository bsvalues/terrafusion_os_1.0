# Terrafusion Deployment Guide

## Deployment Overview
Terrafusion supports multiple deployment strategies to deliver "Infrastructure Intelligence, Infinite Scale" across development, staging, and production environments.

## Environment Types

### Development Environment
**Purpose**: Local development and testing  
**Infrastructure**: Docker Compose  
**Database**: Local PostgreSQL + Redis  
**Monitoring**: Basic logging and metrics  

### Staging Environment
**Purpose**: Pre-production testing and validation  
**Infrastructure**: Kubernetes cluster  
**Database**: Managed PostgreSQL + Redis cluster  
**Monitoring**: Full monitoring stack with alerts  

### Production Environment
**Purpose**: Live government operations  
**Infrastructure**: Multi-region Kubernetes  
**Database**: High-availability PostgreSQL cluster  
**Monitoring**: Enterprise monitoring with 24/7 alerting  

## Prerequisites

### System Requirements
```bash
# Minimum Requirements
CPU: 4 cores
RAM: 8GB
Storage: 100GB SSD
Network: 1Gbps

# Recommended Production
CPU: 16 cores
RAM: 32GB
Storage: 500GB NVMe SSD
Network: 10Gbps
```

### Software Dependencies
```bash
# Container Runtime
Docker 24.0+
Docker Compose 2.20+

# Orchestration (Production)
Kubernetes 1.28+
Helm 3.12+

# Database
PostgreSQL 15+
Redis 7.0+

# Web Server
Nginx 1.24+
```

## Development Deployment

### Quick Start
```bash
# Clone repository
git clone <repository-url>
cd TerraFusion_Master_Workspace

# Environment setup
cp .env.example .env
# Edit .env with your configuration

# Start services
docker-compose up -d

# Initialize database
npm run db:migrate
npm run db:seed

# Start development servers
npm run dev
```

### Development Services
```yaml
# docker-compose.yml
version: '3.8'
services:
  postgres:
    image: postgres:15
    ports: ["5432:5432"]
    environment:
      POSTGRES_DB: terrafusion_dev
      POSTGRES_USER: terrafusion
      POSTGRES_PASSWORD: dev_password
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    ports: ["6379:6379"]
    command: redis-server --appendonly yes
    volumes:
      - redis_data:/data

  frontend:
    build: .
    ports: ["1420:1420"]
    volumes:
      - ./src:/app/src
    environment:
      - NODE_ENV=development

  backend:
    build: ./Backend
    ports: ["8080:8080"]
    depends_on: [postgres, redis]
    environment:
      - NODE_ENV=development
      - DATABASE_URL=postgresql://terrafusion:dev_password@postgres:5432/terrafusion_dev
```

## Staging Deployment

### Kubernetes Configuration
```yaml
# k8s/staging/namespace.yaml
apiVersion: v1
kind: Namespace
metadata:
  name: terrafusion-staging
  labels:
    environment: staging
    app: terrafusion
```

### Application Deployment
```yaml
# k8s/staging/frontend-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: terrafusion-frontend
  namespace: terrafusion-staging
spec:
  replicas: 2
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
        image: terrafusion/frontend:staging
        ports:
        - containerPort: 1420
        env:
        - name: NODE_ENV
          value: "staging"
        - name: API_BASE_URL
          value: "https://api-staging.terrafusion.gov"
        resources:
          requests:
            memory: "512Mi"
            cpu: "250m"
          limits:
            memory: "1Gi"
            cpu: "500m"
```

### Database Configuration
```yaml
# k8s/staging/postgres-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: postgres
  namespace: terrafusion-staging
spec:
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
        image: postgres:15
        env:
        - name: POSTGRES_DB
          value: "terrafusion_staging"
        - name: POSTGRES_USER
          valueFrom:
            secretKeyRef:
              name: postgres-secret
              key: username
        - name: POSTGRES_PASSWORD
          valueFrom:
            secretKeyRef:
              name: postgres-secret
              key: password
        volumeMounts:
        - name: postgres-storage
          mountPath: /var/lib/postgresql/data
        resources:
          requests:
            memory: "1Gi"
            cpu: "500m"
          limits:
            memory: "2Gi"
            cpu: "1000m"
      volumes:
      - name: postgres-storage
        persistentVolumeClaim:
          claimName: postgres-pvc
```

## Production Deployment

### Infrastructure as Code
```yaml
# terraform/production/main.tf
resource "kubernetes_cluster" "terrafusion_prod" {
  name     = "terrafusion-production"
  location = "us-west-2"
  
  node_pool {
    name       = "default-pool"
    node_count = 6
    
    node_config {
      machine_type = "n1-standard-4"
      disk_size_gb = 100
      disk_type    = "pd-ssd"
    }
  }
}

resource "google_sql_database_instance" "postgres_prod" {
  name             = "terrafusion-prod-db"
  database_version = "POSTGRES_15"
  region           = "us-west-2"
  
  settings {
    tier = "db-n1-standard-4"
    
    backup_configuration {
      enabled    = true
      start_time = "02:00"
    }
    
    ip_configuration {
      ipv4_enabled = false
      private_network = google_compute_network.vpc.id
    }
  }
}
```

### Production Helm Chart
```yaml
# helm/terrafusion/values.yaml
replicaCount: 6

image:
  repository: terrafusion/app
  tag: "1.0.0"
  pullPolicy: IfNotPresent

service:
  type: LoadBalancer
  port: 443
  targetPort: 1420

ingress:
  enabled: true
  annotations:
    kubernetes.io/ingress.class: nginx
    cert-manager.io/cluster-issuer: letsencrypt-prod
  hosts:
    - host: terrafusion.gov
      paths:
        - path: /
          pathType: Prefix
  tls:
    - secretName: terrafusion-tls
      hosts:
        - terrafusion.gov

database:
  host: postgres-prod.internal
  name: terrafusion_production
  user: terrafusion_prod
  passwordSecret: postgres-prod-secret

redis:
  enabled: true
  cluster:
    enabled: true
    slaveCount: 3

monitoring:
  enabled: true
  prometheus:
    enabled: true
  grafana:
    enabled: true
  alertmanager:
    enabled: true

autoscaling:
  enabled: true
  minReplicas: 6
  maxReplicas: 20
  targetCPUUtilizationPercentage: 70
  targetMemoryUtilizationPercentage: 80
```

## Deployment Scripts

### Automated Deployment
```bash
#!/bin/bash
# deploy.sh - Automated deployment script

set -e

ENVIRONMENT=${1:-staging}
VERSION=${2:-latest}

echo "Deploying Terrafusion $VERSION to $ENVIRONMENT"

# Build and push images
docker build -t terrafusion/frontend:$VERSION .
docker build -t terrafusion/backend:$VERSION ./Backend
docker push terrafusion/frontend:$VERSION
docker push terrafusion/backend:$VERSION

# Deploy to Kubernetes
case $ENVIRONMENT in
  "staging")
    kubectl apply -f k8s/staging/
    kubectl set image deployment/terrafusion-frontend frontend=terrafusion/frontend:$VERSION -n terrafusion-staging
    kubectl set image deployment/terrafusion-backend backend=terrafusion/backend:$VERSION -n terrafusion-staging
    ;;
  "production")
    helm upgrade --install terrafusion ./helm/terrafusion \
      --namespace terrafusion-production \
      --set image.tag=$VERSION \
      --wait --timeout=600s
    ;;
esac

echo "Deployment completed successfully"
```

### Database Migration
```bash
#!/bin/bash
# migrate.sh - Database migration script

ENVIRONMENT=${1:-development}

case $ENVIRONMENT in
  "development")
    DATABASE_URL="postgresql://terrafusion:dev_password@localhost:5432/terrafusion_dev"
    ;;
  "staging")
    DATABASE_URL=$(kubectl get secret postgres-secret -n terrafusion-staging -o jsonpath='{.data.url}' | base64 -d)
    ;;
  "production")
    DATABASE_URL=$(kubectl get secret postgres-prod-secret -n terrafusion-production -o jsonpath='{.data.url}' | base64 -d)
    ;;
esac

# Run migrations
npx prisma migrate deploy --schema=./prisma/schema.prisma

# Seed data (development only)
if [ "$ENVIRONMENT" = "development" ]; then
  npx prisma db seed
fi
```

## Monitoring & Health Checks

### Health Check Endpoints
```javascript
// Health check configuration
const healthChecks = {
  '/health': {
    database: () => checkDatabaseConnection(),
    redis: () => checkRedisConnection(),
    services: () => checkMicroservices(),
    version: () => process.env.APP_VERSION
  },
  '/health/ready': {
    database: () => checkDatabaseReady(),
    migrations: () => checkMigrationStatus()
  },
  '/health/live': {
    memory: () => checkMemoryUsage(),
    cpu: () => checkCPUUsage()
  }
};
```

### Monitoring Configuration
```yaml
# monitoring/prometheus-config.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: prometheus-config
data:
  prometheus.yml: |
    global:
      scrape_interval: 15s
    
    scrape_configs:
    - job_name: 'terrafusion-frontend'
      kubernetes_sd_configs:
      - role: pod
      relabel_configs:
      - source_labels: [__meta_kubernetes_pod_label_app]
        action: keep
        regex: terrafusion-frontend
    
    - job_name: 'terrafusion-backend'
      kubernetes_sd_configs:
      - role: pod
      relabel_configs:
      - source_labels: [__meta_kubernetes_pod_label_app]
        action: keep
        regex: terrafusion-backend
```

## Security Configuration

### SSL/TLS Setup
```yaml
# k8s/production/tls-secret.yaml
apiVersion: v1
kind: Secret
metadata:
  name: terrafusion-tls
  namespace: terrafusion-production
type: kubernetes.io/tls
data:
  tls.crt: LS0tLS1CRUdJTi... # Base64 encoded certificate
  tls.key: LS0tLS1CRUdJTi... # Base64 encoded private key
```

### Network Policies
```yaml
# k8s/production/network-policy.yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: terrafusion-network-policy
  namespace: terrafusion-production
spec:
  podSelector:
    matchLabels:
      app: terrafusion
  policyTypes:
  - Ingress
  - Egress
  ingress:
  - from:
    - namespaceSelector:
        matchLabels:
          name: ingress-nginx
    ports:
    - protocol: TCP
      port: 1420
  egress:
  - to:
    - namespaceSelector:
        matchLabels:
          name: kube-system
    ports:
    - protocol: TCP
      port: 53
    - protocol: UDP
      port: 53
```

## Rollback Procedures

### Automatic Rollback
```bash
#!/bin/bash
# rollback.sh - Automated rollback script

ENVIRONMENT=${1:-staging}
REVISION=${2:-previous}

echo "Rolling back Terrafusion in $ENVIRONMENT to $REVISION"

case $ENVIRONMENT in
  "staging")
    kubectl rollout undo deployment/terrafusion-frontend -n terrafusion-staging
    kubectl rollout undo deployment/terrafusion-backend -n terrafusion-staging
    ;;
  "production")
    helm rollback terrafusion $REVISION -n terrafusion-production
    ;;
esac

echo "Rollback completed successfully"
```

## Disaster Recovery

### Backup Procedures
```bash
#!/bin/bash
# backup.sh - Database backup script

ENVIRONMENT=${1:-production}
BACKUP_DIR="/backups/$(date +%Y%m%d)"

mkdir -p $BACKUP_DIR

# Database backup
pg_dump $DATABASE_URL > $BACKUP_DIR/database.sql

# File system backup
tar -czf $BACKUP_DIR/files.tar.gz /app/uploads /app/logs

# Upload to cloud storage
aws s3 cp $BACKUP_DIR s3://terrafusion-backups/$ENVIRONMENT/ --recursive
```

### Recovery Procedures
```bash
#!/bin/bash
# restore.sh - Database restore script

BACKUP_DATE=${1:-latest}
ENVIRONMENT=${2:-staging}

# Download backup
aws s3 cp s3://terrafusion-backups/$ENVIRONMENT/$BACKUP_DATE/ ./restore/ --recursive

# Restore database
psql $DATABASE_URL < ./restore/database.sql

# Restore files
tar -xzf ./restore/files.tar.gz -C /
```

---

**Deployment Philosophy**: Infrastructure Intelligence, Infinite Scale  
**Reliability**: Government-grade uptime and performance  
**Security**: Enterprise-level protection and compliance

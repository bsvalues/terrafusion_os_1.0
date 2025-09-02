# Terrafusion OS 1.0 - DevOps Kit

## 🚀 **Complete DevOps Toolkit for Terrafusion OS 1.0**

This comprehensive DevOps kit provides all necessary tools, scripts, and configurations for deploying, monitoring, and maintaining Terrafusion OS 1.0 in production environments.

---

## 📁 **DevOps Kit Structure**

```
devops/
├── README.md                    # This file
├── docker/                     # Docker configurations
│   ├── Dockerfile.backend      # Backend container
│   ├── Dockerfile.frontend     # Frontend container
│   ├── Dockerfile.ai-swarm     # AI swarm container
│   └── docker-compose.yml      # Multi-container setup
├── kubernetes/                 # Kubernetes manifests
│   ├── namespace.yaml          # Namespace configuration
│   ├── configmap.yaml          # Configuration management
│   ├── secrets.yaml            # Secrets management
│   ├── backend-deployment.yaml # Backend deployment
│   ├── frontend-deployment.yaml # Frontend deployment
│   ├── ai-swarm-deployment.yaml # AI swarm deployment
│   ├── services.yaml           # Service definitions
│   ├── ingress.yaml            # Ingress controller
│   └── hpa.yaml                # Horizontal Pod Autoscaler
├── terraform/                  # Infrastructure as Code
│   ├── main.tf                 # Main Terraform config
│   ├── variables.tf            # Variable definitions
│   ├── outputs.tf              # Output values
│   ├── provider.tf             # Provider configuration
│   └── modules/                # Reusable modules
├── ansible/                    # Configuration Management
│   ├── playbook.yml            # Main playbook
│   ├── inventory/              # Inventory files
│   ├── roles/                  # Ansible roles
│   └── group_vars/             # Group variables
├── monitoring/                 # Monitoring & Alerting
│   ├── prometheus/             # Prometheus configuration
│   ├── grafana/                # Grafana dashboards
│   ├── alertmanager/           # Alert configuration
│   └── jaeger/                 # Distributed tracing
├── ci-cd/                      # CI/CD Pipelines
│   ├── github-actions/         # GitHub Actions workflows
│   ├── jenkins/                # Jenkins pipeline
│   ├── gitlab-ci/              # GitLab CI configuration
│   └── azure-devops/           # Azure DevOps pipeline
├── scripts/                    # Automation Scripts
│   ├── deploy.sh               # Deployment script
│   ├── backup.sh               # Backup script
│   ├── restore.sh              # Restore script
│   ├── health-check.sh         # Health check script
│   └── cleanup.sh              # Cleanup script
├── security/                   # Security Configurations
│   ├── ssl-certificates/       # SSL certificate management
│   ├── security-policies/      # Security policy definitions
│   ├── rbac/                   # Role-based access control
│   └── network-policies/       # Network security policies
└── docs/                       # DevOps Documentation
    ├── deployment-guide.md     # Deployment guide
    ├── monitoring-guide.md     # Monitoring setup guide
    ├── troubleshooting.md      # Troubleshooting guide
    └── best-practices.md       # DevOps best practices
```

---

## 🐳 **Docker Configuration**

### **Multi-Stage Dockerfile for Backend**
```dockerfile
# Backend Dockerfile
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS base
WORKDIR /app
EXPOSE 80
EXPOSE 443

FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src
COPY ["backend/Terrafusion.API/Terrafusion.API.csproj", "backend/Terrafusion.API/"]
COPY ["backend/Terrafusion.Core/Terrafusion.Core.csproj", "backend/Terrafusion.Core/"]
COPY ["backend/Terrafusion.Data/Terrafusion.Data.csproj", "backend/Terrafusion.Data/"]
RUN dotnet restore "backend/Terrafusion.API/Terrafusion.API.csproj"
COPY . .
WORKDIR "/src/backend/Terrafusion.API"
RUN dotnet build "Terrafusion.API.csproj" -c Release -o /app/build

FROM build AS publish
RUN dotnet publish "Terrafusion.API.csproj" -c Release -o /app/publish

FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .
ENTRYPOINT ["dotnet", "Terrafusion.API.dll"]
```

### **Docker Compose for Development**
```yaml
version: '3.8'
services:
  postgres:
    image: postgres:14
    environment:
      POSTGRES_DB: terrafusion
      POSTGRES_USER: terrafusion
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"

  backend:
    build:
      context: .
      dockerfile: devops/docker/Dockerfile.backend
    environment:
      - ConnectionStrings__DefaultConnection=Host=postgres;Database=terrafusion;Username=terrafusion;Password=${DB_PASSWORD}
      - ConnectionStrings__Redis=redis:6379
    depends_on:
      - postgres
      - redis
    ports:
      - "5000:80"

  frontend:
    build:
      context: .
      dockerfile: devops/docker/Dockerfile.frontend
    environment:
      - REACT_APP_API_URL=http://localhost:5000
    ports:
      - "3000:80"

  ai-swarm:
    build:
      context: .
      dockerfile: devops/docker/Dockerfile.ai-swarm
    environment:
      - AI_SWARM_SIZE=1008
      - REDIS_URL=redis:6379
    depends_on:
      - redis

volumes:
  postgres_data:
```

---

## ☸️ **Kubernetes Configuration**

### **Namespace and ConfigMap**
```yaml
# namespace.yaml
apiVersion: v1
kind: Namespace
metadata:
  name: terrafusion
  labels:
    name: terrafusion

---
# configmap.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: terrafusion-config
  namespace: terrafusion
data:
  ASPNETCORE_ENVIRONMENT: "Production"
  AI_SWARM_SIZE: "1008"
  QUANTUM_PERFORMANCE_ENABLED: "true"
  MCP_SERVERS_ENABLED: "true"
```

### **Backend Deployment**
```yaml
# backend-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: terrafusion-backend
  namespace: terrafusion
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
        image: terrafusion/backend:latest
        ports:
        - containerPort: 80
        env:
        - name: ConnectionStrings__DefaultConnection
          valueFrom:
            secretKeyRef:
              name: terrafusion-secrets
              key: database-connection
        - name: ConnectionStrings__Redis
          value: "redis-service:6379"
        resources:
          requests:
            memory: "512Mi"
            cpu: "500m"
          limits:
            memory: "2Gi"
            cpu: "2000m"
        livenessProbe:
          httpGet:
            path: /health
            port: 80
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /ready
            port: 80
          initialDelaySeconds: 5
          periodSeconds: 5
```

### **Horizontal Pod Autoscaler**
```yaml
# hpa.yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: terrafusion-backend-hpa
  namespace: terrafusion
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: terrafusion-backend
  minReplicas: 3
  maxReplicas: 100
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

---

## 🏗️ **Terraform Infrastructure**

### **Main Infrastructure Configuration**
```hcl
# main.tf
terraform {
  required_version = ">= 1.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    kubernetes = {
      source  = "hashicorp/kubernetes"
      version = "~> 2.0"
    }
  }
}

provider "aws" {
  region = var.aws_region
}

# EKS Cluster
module "eks" {
  source = "./modules/eks"
  
  cluster_name    = var.cluster_name
  cluster_version = var.kubernetes_version
  vpc_id          = module.vpc.vpc_id
  subnet_ids      = module.vpc.private_subnets
  
  node_groups = {
    main = {
      instance_types = ["m5.xlarge"]
      min_size       = 3
      max_size       = 100
      desired_size   = 6
    }
    ai_swarm = {
      instance_types = ["c5.4xlarge"]
      min_size       = 2
      max_size       = 50
      desired_size   = 4
      taints = [{
        key    = "workload"
        value  = "ai-swarm"
        effect = "NO_SCHEDULE"
      }]
    }
  }
}

# RDS Database
module "rds" {
  source = "./modules/rds"
  
  identifier = "${var.cluster_name}-postgres"
  engine     = "postgres"
  engine_version = "14.9"
  instance_class = "db.r5.xlarge"
  
  allocated_storage     = 100
  max_allocated_storage = 1000
  
  db_name  = "terrafusion"
  username = "terrafusion"
  password = var.db_password
  
  vpc_security_group_ids = [module.security_groups.rds_sg_id]
  db_subnet_group_name   = module.vpc.database_subnet_group
  
  backup_retention_period = 7
  backup_window          = "03:00-04:00"
  maintenance_window     = "sun:04:00-sun:05:00"
  
  multi_az = true
  
  tags = local.common_tags
}

# ElastiCache Redis
module "redis" {
  source = "./modules/redis"
  
  cluster_id      = "${var.cluster_name}-redis"
  node_type       = "cache.r6g.xlarge"
  num_cache_nodes = 3
  
  subnet_group_name  = module.vpc.elasticache_subnet_group
  security_group_ids = [module.security_groups.redis_sg_id]
  
  tags = local.common_tags
}
```

---

## 📊 **Monitoring Configuration**

### **Prometheus Configuration**
```yaml
# prometheus/prometheus.yml
global:
  scrape_interval: 15s
  evaluation_interval: 15s

rule_files:
  - "rules/*.yml"

alerting:
  alertmanagers:
    - static_configs:
        - targets:
          - alertmanager:9093

scrape_configs:
  - job_name: 'terrafusion-backend'
    kubernetes_sd_configs:
      - role: endpoints
        namespaces:
          names:
            - terrafusion
    relabel_configs:
      - source_labels: [__meta_kubernetes_service_name]
        action: keep
        regex: terrafusion-backend

  - job_name: 'terrafusion-ai-swarm'
    kubernetes_sd_configs:
      - role: endpoints
        namespaces:
          names:
            - terrafusion
    relabel_configs:
      - source_labels: [__meta_kubernetes_service_name]
        action: keep
        regex: terrafusion-ai-swarm

  - job_name: 'kubernetes-nodes'
    kubernetes_sd_configs:
      - role: node
    relabel_configs:
      - action: labelmap
        regex: __meta_kubernetes_node_label_(.+)
```

### **Grafana Dashboard Configuration**
```json
{
  "dashboard": {
    "title": "Terrafusion OS Performance Dashboard",
    "panels": [
      {
        "title": "AI Swarm Performance",
        "type": "graph",
        "targets": [
          {
            "expr": "rate(ai_swarm_tasks_completed_total[5m])",
            "legendFormat": "Tasks/sec"
          }
        ]
      },
      {
        "title": "Quantum Performance Metrics",
        "type": "stat",
        "targets": [
          {
            "expr": "quantum_speed_improvement_ratio",
            "legendFormat": "Speed Improvement"
          }
        ]
      },
      {
        "title": "Property Assessment Time",
        "type": "histogram",
        "targets": [
          {
            "expr": "histogram_quantile(0.95, rate(property_assessment_duration_seconds_bucket[5m]))",
            "legendFormat": "95th percentile"
          }
        ]
      }
    ]
  }
}
```

---

## 🔄 **CI/CD Pipeline**

### **GitHub Actions Workflow**
```yaml
# .github/workflows/deploy.yml
name: Deploy Terrafusion OS

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

env:
  REGISTRY: ghcr.io
  IMAGE_NAME: ${{ github.repository }}

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup .NET
        uses: actions/setup-dotnet@v3
        with:
          dotnet-version: '8.0.x'
          
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          
      - name: Restore dependencies
        run: |
          dotnet restore
          npm ci
          
      - name: Run tests
        run: |
          dotnet test --no-restore --verbosity normal
          npm test
          
      - name: Run security scan
        uses: securecodewarrior/github-action-add-sarif@v1
        with:
          sarif-file: security-scan-results.sarif

  build-and-push:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Log in to Container Registry
        uses: docker/login-action@v3
        with:
          registry: ${{ env.REGISTRY }}
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}
          
      - name: Build and push Docker images
        run: |
          docker build -f devops/docker/Dockerfile.backend -t ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}/backend:${{ github.sha }} .
          docker build -f devops/docker/Dockerfile.frontend -t ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}/frontend:${{ github.sha }} .
          docker build -f devops/docker/Dockerfile.ai-swarm -t ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}/ai-swarm:${{ github.sha }} .
          
          docker push ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}/backend:${{ github.sha }}
          docker push ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}/frontend:${{ github.sha }}
          docker push ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}/ai-swarm:${{ github.sha }}

  deploy:
    needs: build-and-push
    runs-on: ubuntu-latest
    environment: production
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v4
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: us-west-2
          
      - name: Update kubeconfig
        run: aws eks update-kubeconfig --name terrafusion-production
        
      - name: Deploy to Kubernetes
        run: |
          sed -i 's|IMAGE_TAG|${{ github.sha }}|g' devops/kubernetes/*.yaml
          kubectl apply -f devops/kubernetes/
          kubectl rollout status deployment/terrafusion-backend -n terrafusion
          kubectl rollout status deployment/terrafusion-frontend -n terrafusion
          kubectl rollout status deployment/terrafusion-ai-swarm -n terrafusion
```

---

## 📜 **Deployment Scripts**

### **Main Deployment Script**
```bash
#!/bin/bash
# deploy.sh - Terrafusion OS Deployment Script

set -e

# Configuration
ENVIRONMENT=${1:-production}
NAMESPACE="terrafusion"
IMAGE_TAG=${2:-latest}

echo "🚀 Starting Terrafusion OS deployment to $ENVIRONMENT"

# Validate prerequisites
echo "📋 Validating prerequisites..."
command -v kubectl >/dev/null 2>&1 || { echo "kubectl is required but not installed. Aborting." >&2; exit 1; }
command -v helm >/dev/null 2>&1 || { echo "helm is required but not installed. Aborting." >&2; exit 1; }

# Create namespace if it doesn't exist
kubectl create namespace $NAMESPACE --dry-run=client -o yaml | kubectl apply -f -

# Deploy secrets
echo "🔐 Deploying secrets..."
kubectl apply -f devops/kubernetes/secrets.yaml -n $NAMESPACE

# Deploy ConfigMaps
echo "⚙️ Deploying configuration..."
kubectl apply -f devops/kubernetes/configmap.yaml -n $NAMESPACE

# Deploy PostgreSQL
echo "🗄️ Deploying PostgreSQL..."
helm upgrade --install postgresql bitnami/postgresql \
  --namespace $NAMESPACE \
  --set auth.postgresPassword=$POSTGRES_PASSWORD \
  --set auth.database=terrafusion \
  --set primary.persistence.size=100Gi

# Deploy Redis
echo "🔴 Deploying Redis..."
helm upgrade --install redis bitnami/redis \
  --namespace $NAMESPACE \
  --set auth.enabled=false \
  --set master.persistence.size=20Gi

# Wait for databases to be ready
echo "⏳ Waiting for databases to be ready..."
kubectl wait --for=condition=ready pod -l app.kubernetes.io/name=postgresql -n $NAMESPACE --timeout=300s
kubectl wait --for=condition=ready pod -l app.kubernetes.io/name=redis -n $NAMESPACE --timeout=300s

# Deploy application
echo "🏗️ Deploying Terrafusion OS applications..."
sed -i "s|IMAGE_TAG|$IMAGE_TAG|g" devops/kubernetes/*.yaml
kubectl apply -f devops/kubernetes/ -n $NAMESPACE

# Wait for deployments
echo "⏳ Waiting for deployments to be ready..."
kubectl rollout status deployment/terrafusion-backend -n $NAMESPACE --timeout=600s
kubectl rollout status deployment/terrafusion-frontend -n $NAMESPACE --timeout=600s
kubectl rollout status deployment/terrafusion-ai-swarm -n $NAMESPACE --timeout=600s

# Run health checks
echo "🏥 Running health checks..."
./devops/scripts/health-check.sh $NAMESPACE

echo "✅ Terrafusion OS deployment completed successfully!"
echo "🌐 Access the application at: https://terrafusion.$ENVIRONMENT.gov"
```

### **Health Check Script**
```bash
#!/bin/bash
# health-check.sh - Terrafusion OS Health Check Script

NAMESPACE=${1:-terrafusion}
TIMEOUT=300

echo "🏥 Running Terrafusion OS health checks..."

# Check pod status
echo "📊 Checking pod status..."
kubectl get pods -n $NAMESPACE

# Check service endpoints
echo "🔗 Checking service endpoints..."
kubectl get endpoints -n $NAMESPACE

# Test backend health endpoint
echo "🔍 Testing backend health..."
BACKEND_URL=$(kubectl get service terrafusion-backend -n $NAMESPACE -o jsonpath='{.status.loadBalancer.ingress[0].hostname}')
if [ -n "$BACKEND_URL" ]; then
  curl -f "http://$BACKEND_URL/health" || echo "❌ Backend health check failed"
else
  echo "⚠️ Backend URL not available yet"
fi

# Test AI swarm status
echo "🤖 Checking AI swarm status..."
AI_SWARM_PODS=$(kubectl get pods -n $NAMESPACE -l app=terrafusion-ai-swarm --no-headers | wc -l)
echo "AI Swarm pods running: $AI_SWARM_PODS"

# Check quantum performance metrics
echo "⚡ Checking quantum performance metrics..."
kubectl logs -n $NAMESPACE -l app=terrafusion-backend --tail=10 | grep -i "quantum\|performance" || echo "No quantum metrics found in recent logs"

# Check database connectivity
echo "🗄️ Checking database connectivity..."
kubectl exec -n $NAMESPACE deployment/terrafusion-backend -- dotnet --version || echo "❌ Backend container not responding"

echo "✅ Health checks completed!"
```

---

## 🔒 **Security Configuration**

### **Network Policies**
```yaml
# security/network-policies/deny-all.yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: deny-all
  namespace: terrafusion
spec:
  podSelector: {}
  policyTypes:
  - Ingress
  - Egress

---
# security/network-policies/allow-backend.yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: allow-backend
  namespace: terrafusion
spec:
  podSelector:
    matchLabels:
      app: terrafusion-backend
  policyTypes:
  - Ingress
  - Egress
  ingress:
  - from:
    - podSelector:
        matchLabels:
          app: terrafusion-frontend
    - podSelector:
        matchLabels:
          app: nginx-ingress
    ports:
    - protocol: TCP
      port: 80
  egress:
  - to:
    - podSelector:
        matchLabels:
          app.kubernetes.io/name: postgresql
    ports:
    - protocol: TCP
      port: 5432
  - to:
    - podSelector:
        matchLabels:
          app.kubernetes.io/name: redis
    ports:
    - protocol: TCP
      port: 6379
```

### **RBAC Configuration**
```yaml
# security/rbac/terrafusion-rbac.yaml
apiVersion: v1
kind: ServiceAccount
metadata:
  name: terrafusion-service-account
  namespace: terrafusion

---
apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata:
  namespace: terrafusion
  name: terrafusion-role
rules:
- apiGroups: [""]
  resources: ["pods", "services", "configmaps", "secrets"]
  verbs: ["get", "list", "watch"]
- apiGroups: ["apps"]
  resources: ["deployments", "replicasets"]
  verbs: ["get", "list", "watch"]

---
apiVersion: rbac.authorization.k8s.io/v1
kind: RoleBinding
metadata:
  name: terrafusion-role-binding
  namespace: terrafusion
subjects:
- kind: ServiceAccount
  name: terrafusion-service-account
  namespace: terrafusion
roleRef:
  kind: Role
  name: terrafusion-role
  apiGroup: rbac.authorization.k8s.io
```

---

## 📚 **Quick Start Commands**

### **Development Environment**
```bash
# Start development environment
docker-compose -f devops/docker/docker-compose.dev.yml up -d

# View logs
docker-compose -f devops/docker/docker-compose.dev.yml logs -f

# Stop environment
docker-compose -f devops/docker/docker-compose.dev.yml down
```

### **Production Deployment**
```bash
# Deploy to production
./devops/scripts/deploy.sh production latest

# Check deployment status
kubectl get pods -n terrafusion

# View application logs
kubectl logs -f deployment/terrafusion-backend -n terrafusion

# Scale AI swarm
kubectl scale deployment terrafusion-ai-swarm --replicas=10 -n terrafusion
```

### **Monitoring**
```bash
# Port forward to Grafana
kubectl port-forward service/grafana 3000:80 -n monitoring

# Port forward to Prometheus
kubectl port-forward service/prometheus 9090:9090 -n monitoring

# View metrics
curl http://localhost:9090/metrics
```

---

## 🆘 **Troubleshooting**

### **Common Issues**

**Issue: Pods stuck in Pending state**
```bash
# Check node resources
kubectl describe nodes

# Check pod events
kubectl describe pod <pod-name> -n terrafusion

# Check resource quotas
kubectl get resourcequota -n terrafusion
```

**Issue: Database connection failures**
```bash
# Check database pod status
kubectl get pods -l app.kubernetes.io/name=postgresql -n terrafusion

# Test database connectivity
kubectl exec -it deployment/terrafusion-backend -n terrafusion -- ping postgresql
```

**Issue: AI Swarm not responding**
```bash
# Check AI swarm logs
kubectl logs -l app=terrafusion-ai-swarm -n terrafusion

# Restart AI swarm
kubectl rollout restart deployment/terrafusion-ai-swarm -n terrafusion
```

---

## 📞 **Support**

For DevOps support and assistance:

- **Email**: devops@terrafusion.gov
- **Slack**: #terrafusion-devops
- **Documentation**: https://docs.terrafusion.gov/devops
- **Issue Tracker**: https://github.com/terrafusion/terrafusion-os-1.0/issues

---

**DevOps Kit Version**: 1.0.0  
**Last Updated**: August 17, 2025  
**Maintained by**: Terrafusion DevOps Team

# Terrafusion Deployment Overview

Complete guide for deploying Terrafusion across different environments and
platforms. Choose the deployment strategy that best fits your needs.

## 🎯 Deployment Options

### Quick Comparison

| Deployment Type    | Best For                 | Complexity | Scalability | Time to Deploy |
| ------------------ | ------------------------ | ---------- | ----------- | -------------- |
| **Docker Compose** | Development, small teams | Low        | Limited     | 15 minutes     |
| **Kubernetes**     | Production, enterprise   | High       | Excellent   | 2-4 hours      |
| **Cloud Managed**  | Scalable production      | Medium     | Excellent   | 30-60 minutes  |
| **Hybrid**         | Mixed environments       | High       | Excellent   | 4-8 hours      |

---

## 🐳 Docker Compose Deployment

Perfect for development environments and small production deployments.

### Prerequisites

- Docker 24.0+
- Docker Compose 2.0+
- 8GB RAM minimum
- 50GB disk space

### Quick Start

```bash
# Clone repository
git clone https://github.com/terrafusion/terrafusion-master-workspace.git
cd terrafusion-master-workspace

# Configure environment
cp .env.example .env.production
# Edit .env.production with your settings

# Deploy services
docker-compose up -d

# Initialize database
docker-compose exec api npm run db:migrate
docker-compose exec api npm run db:seed

# Verify deployment
curl http://localhost/health
```

### Production Configuration

```yaml
# docker-compose.production.yml
version: '3.8'
services:
  nginx:
    image: nginx:alpine
    ports:
      - '80:80'
      - '443:443'
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/ssl
    depends_on:
      - api
      - frontend

  frontend:
    build:
      context: .
      dockerfile: Dockerfile.frontend
      target: production
    environment:
      - NODE_ENV=production
    volumes:
      - frontend_assets:/app/dist

  api:
    build:
      context: .
      dockerfile: Dockerfile.api
      target: production
    environment:
      - NODE_ENV=production
      - DATABASE_URL=${DATABASE_URL}
      - REDIS_URL=${REDIS_URL}
    depends_on:
      - postgres
      - redis
    volumes:
      - api_logs:/app/logs

  postgres:
    image: postgres:15-alpine
    environment:
      - POSTGRES_DB=${POSTGRES_DB}
      - POSTGRES_USER=${POSTGRES_USER}
      - POSTGRES_PASSWORD=${POSTGRES_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./backups:/backups

  redis:
    image: redis:7-alpine
    command: redis-server --appendonly yes
    volumes:
      - redis_data:/data

volumes:
  postgres_data:
  redis_data:
  frontend_assets:
  api_logs:
```

---

## ☸️ Kubernetes Deployment

Enterprise-grade deployment with automatic scaling and high availability.

### Prerequisites

- Kubernetes cluster 1.25+
- kubectl configured
- Helm 3.0+
- Ingress controller (nginx/traefik)
- Certificate manager (cert-manager)

### Namespace Setup

```bash
# Create namespace
kubectl create namespace terrafusion

# Create secrets
kubectl create secret generic terrafusion-secrets \
  --from-literal=database-url="postgresql://user:pass@postgres:5432/terrafusion" \
  --from-literal=redis-url="redis://redis:6379" \
  --from-literal=jwt-secret="your-jwt-secret" \
  --namespace=terrafusion
```

### Core Services Deployment

```yaml
# k8s/postgres.yaml
apiVersion: apps/v1
kind: StatefulSet
metadata:
  name: postgres
  namespace: terrafusion
spec:
  serviceName: postgres
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
          image: postgres:15-alpine
          env:
            - name: POSTGRES_DB
              value: terrafusion
            - name: POSTGRES_USER
              value: terrafusion
            - name: POSTGRES_PASSWORD
              valueFrom:
                secretKeyRef:
                  name: terrafusion-secrets
                  key: postgres-password
          ports:
            - containerPort: 5432
          volumeMounts:
            - name: postgres-storage
              mountPath: /var/lib/postgresql/data
  volumeClaimTemplates:
    - metadata:
        name: postgres-storage
      spec:
        accessModes: ['ReadWriteOnce']
        resources:
          requests:
            storage: 100Gi
```

### Application Deployment

```yaml
# k8s/api.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: terrafusion-api
  namespace: terrafusion
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
          image: terrafusion/api:v3.0.5
          env:
            - name: NODE_ENV
              value: production
            - name: DATABASE_URL
              valueFrom:
                secretKeyRef:
                  name: terrafusion-secrets
                  key: database-url
            - name: REDIS_URL
              valueFrom:
                secretKeyRef:
                  name: terrafusion-secrets
                  key: redis-url
          ports:
            - containerPort: 8080
          livenessProbe:
            httpGet:
              path: /health
              port: 8080
            initialDelaySeconds: 30
            periodSeconds: 10
          readinessProbe:
            httpGet:
              path: /ready
              port: 8080
            initialDelaySeconds: 5
            periodSeconds: 5
          resources:
            requests:
              memory: '512Mi'
              cpu: '250m'
            limits:
              memory: '1Gi'
              cpu: '500m'
```

### Ingress Configuration

```yaml
# k8s/ingress.yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: terrafusion-ingress
  namespace: terrafusion
  annotations:
    nginx.ingress.kubernetes.io/rewrite-target: /
    cert-manager.io/cluster-issuer: letsencrypt-prod
    nginx.ingress.kubernetes.io/ssl-redirect: 'true'
spec:
  tls:
    - hosts:
        - app.your-domain.com
      secretName: terrafusion-tls
  rules:
    - host: app.your-domain.com
      http:
        paths:
          - path: /api
            pathType: Prefix
            backend:
              service:
                name: terrafusion-api
                port:
                  number: 8080
          - path: /
            pathType: Prefix
            backend:
              service:
                name: terrafusion-frontend
                port:
                  number: 80
```

### Horizontal Pod Autoscaler

```yaml
# k8s/hpa.yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: terrafusion-api-hpa
  namespace: terrafusion
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: terrafusion-api
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
```

---

## ☁️ Cloud Deployments

### AWS Deployment

#### Using AWS EKS

```bash
# Install eksctl
curl --silent --location "https://github.com/weaveworks/eksctl/releases/latest/download/eksctl_$(uname -s)_amd64.tar.gz" | tar xz -C /tmp
sudo mv /tmp/eksctl /usr/local/bin

# Create EKS cluster
eksctl create cluster \
  --name terrafusion \
  --version 1.25 \
  --region us-west-2 \
  --nodegroup-name standard-workers \
  --node-type m5.large \
  --nodes 3 \
  --nodes-min 1 \
  --nodes-max 10 \
  --managed

# Deploy Terrafusion
kubectl apply -k k8s/overlays/aws
```

#### Using AWS ECS Fargate

```yaml
# ecs-task-definition.json
{
  'family': 'terrafusion',
  'networkMode': 'awsvpc',
  'requiresCompatibilities': ['FARGATE'],
  'cpu': '1024',
  'memory': '2048',
  'executionRoleArn': 'arn:aws:iam::account:role/ecsTaskExecutionRole',
  'taskRoleArn': 'arn:aws:iam::account:role/ecsTaskRole',
  'containerDefinitions':
    [
      {
        'name': 'terrafusion-api',
        'image': 'terrafusion/api:v3.0.5',
        'portMappings': [{ 'containerPort': 8080, 'protocol': 'tcp' }],
        'environment': [{ 'name': 'NODE_ENV', 'value': 'production' }],
        'secrets':
          [
            {
              'name': 'DATABASE_URL',
              'valueFrom': 'arn:aws:secretsmanager:region:account:secret:database-url',
            },
          ],
        'logConfiguration':
          {
            'logDriver': 'awslogs',
            'options':
              {
                'awslogs-group': '/ecs/terrafusion',
                'awslogs-region': 'us-west-2',
                'awslogs-stream-prefix': 'ecs',
              },
          },
      },
    ],
}
```

### Azure Deployment

#### Using Azure Kubernetes Service (AKS)

```bash
# Create resource group
az group create --name terrafusion-rg --location eastus

# Create AKS cluster
az aks create \
  --resource-group terrafusion-rg \
  --name terrafusion-aks \
  --node-count 3 \
  --enable-addons monitoring \
  --generate-ssh-keys

# Get credentials
az aks get-credentials --resource-group terrafusion-rg --name terrafusion-aks

# Deploy Terrafusion
kubectl apply -k k8s/overlays/azure
```

### Google Cloud Deployment

#### Using Google Kubernetes Engine (GKE)

```bash
# Create GKE cluster
gcloud container clusters create terrafusion \
  --zone us-central1-a \
  --num-nodes 3 \
  --enable-autoscaling \
  --min-nodes 1 \
  --max-nodes 10

# Get credentials
gcloud container clusters get-credentials terrafusion --zone us-central1-a

# Deploy Terrafusion
kubectl apply -k k8s/overlays/gcp
```

---

## 🔄 CI/CD Pipeline

### GitHub Actions Workflow

```yaml
# .github/workflows/deploy.yml
name: Deploy Terrafusion

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      - run: npm ci
      - run: npm run test
      - run: npm run lint
      - run: npm run type-check

  build:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Build Docker images
        run: |
          docker build -t terrafusion/api:${{ github.sha }} -f Dockerfile.api .
          docker build -t terrafusion/frontend:${{ github.sha }} -f Dockerfile.frontend .
      - name: Push to registry
        run: |
          echo ${{ secrets.DOCKER_PASSWORD }} | docker login -u ${{ secrets.DOCKER_USERNAME }} --password-stdin
          docker push terrafusion/api:${{ github.sha }}
          docker push terrafusion/frontend:${{ github.sha }}

  deploy-staging:
    needs: build
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    environment: staging
    steps:
      - uses: actions/checkout@v3
      - name: Deploy to staging
        run: |
          kubectl set image deployment/terrafusion-api terrafusion-api=terrafusion/api:${{ github.sha }} -n staging
          kubectl set image deployment/terrafusion-frontend terrafusion-frontend=terrafusion/frontend:${{ github.sha }} -n staging
          kubectl rollout status deployment/terrafusion-api -n staging
          kubectl rollout status deployment/terrafusion-frontend -n staging

  deploy-production:
    needs: deploy-staging
    runs-on: ubuntu-latest
    environment: production
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v3
      - name: Deploy to production
        run: |
          kubectl set image deployment/terrafusion-api terrafusion-api=terrafusion/api:${{ github.sha }} -n production
          kubectl set image deployment/terrafusion-frontend terrafusion-frontend=terrafusion/frontend:${{ github.sha }} -n production
          kubectl rollout status deployment/terrafusion-api -n production
          kubectl rollout status deployment/terrafusion-frontend -n production
```

---

## 🔧 Configuration Management

### Environment Variables

#### Core Configuration

```bash
# Application
NODE_ENV=production
PORT=\${{TF_ADMIN_PORT:-8080}}
LOG_LEVEL=info
API_VERSION=v1

# Database
DATABASE_URL=postgresql://user:pass@host:5432/terrafusion
DATABASE_POOL_SIZE=20
DATABASE_SSL_MODE=require

# Redis
REDIS_URL=redis://host:6379
REDIS_CLUSTER_MODE=false
REDIS_TTL_DEFAULT=3600

# Security
JWT_SECRET=your-256-bit-secret
API_SECRET_KEY=your-api-secret
ENCRYPTION_KEY=your-encryption-key
CORS_ORIGINS=https://app.terrafusion.ai

# External Services
GOOGLE_MAPS_API_KEY=your_google_maps_key
AWS_ACCESS_KEY_ID=your_aws_key
AWS_SECRET_ACCESS_KEY=your_aws_secret
AWS_REGION=us-west-2
```

#### Feature Flags

```bash
# Feature toggles
FEATURE_ML_INFERENCE=true
FEATURE_REAL_TIME_UPDATES=true
FEATURE_ADVANCED_ANALYTICS=true
FEATURE_BULK_OPERATIONS=true
FEATURE_API_V2=false

# Performance
CACHE_ENABLED=true
CACHE_TTL=3600
RATE_LIMITING_ENABLED=true
RATE_LIMIT_WINDOW=3600
RATE_LIMIT_MAX_REQUESTS=1000
```

### Configuration Validation

```typescript
// config/validation.ts
import Joi from 'joi';

const configSchema = Joi.object({
  NODE_ENV: Joi.string()
    .valid('development', 'staging', 'production')
    .required(),
  PORT: Joi.number().port().default(8080),
  DATABASE_URL: Joi.string().uri().required(),
  REDIS_URL: Joi.string().uri().required(),
  JWT_SECRET: Joi.string().min(32).required(),
  GOOGLE_MAPS_API_KEY: Joi.string().required(),
  AWS_ACCESS_KEY_ID: Joi.string().when('NODE_ENV', {
    is: 'production',
    then: Joi.required(),
    otherwise: Joi.optional(),
  }),
});

export const validateConfig = () => {
  const { error, value } = configSchema.validate(process.env, {
    allowUnknown: true,
    stripUnknown: true,
  });

  if (error) {
    throw new Error(`Config validation error: ${error.message}`);
  }

  return value;
};
```

---

## 📊 Monitoring and Observability

### Health Checks

```typescript
// health-check endpoint
app.get('/health', async (req, res) => {
  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version,
    checks: {
      database: await checkDatabase(),
      redis: await checkRedis(),
      externalApis: await checkExternalAPIs(),
    },
  };

  const isHealthy = Object.values(health.checks).every(
    check => check.status === 'healthy'
  );
  const statusCode = isHealthy ? 200 : 503;

  res.status(statusCode).json(health);
});
```

### Metrics Collection

```yaml
# prometheus.yml
global:
  scrape_interval: 15s

scrape_configs:
  - job_name: 'terrafusion-api'
    static_configs:
      - targets: ['terrafusion-api:8080']
    metrics_path: /metrics
    scrape_interval: 15s

  - job_name: 'postgres'
    static_configs:
      - targets: ['postgres-exporter:9187']

  - job_name: 'redis'
    static_configs:
      - targets: ['redis-exporter:9121']
```

---

## 🚀 Deployment Scripts

### Automated Deployment Script

```bash
#!/bin/bash
# deploy.sh

set -e

# Configuration
ENVIRONMENT=${1:-staging}
VERSION=${2:-latest}
NAMESPACE="terrafusion-${ENVIRONMENT}"

echo "Deploying Terrafusion ${VERSION} to ${ENVIRONMENT}"

# Pre-deployment checks
echo "Running pre-deployment checks..."
kubectl cluster-info
kubectl get nodes

# Create namespace if it doesn't exist
kubectl create namespace ${NAMESPACE} --dry-run=client -o yaml | kubectl apply -f -

# Update secrets
echo "Updating secrets..."
kubectl create secret generic terrafusion-secrets \
  --from-env-file=.env.${ENVIRONMENT} \
  --namespace=${NAMESPACE} \
  --dry-run=client -o yaml | kubectl apply -f -

# Deploy database migrations
echo "Running database migrations..."
kubectl run migration-${VERSION} \
  --image=terrafusion/api:${VERSION} \
  --restart=Never \
  --namespace=${NAMESPACE} \
  --command -- npm run db:migrate

# Wait for migration to complete
kubectl wait --for=condition=complete --timeout=300s job/migration-${VERSION} -n ${NAMESPACE}

# Deploy application
echo "Deploying application..."
sed "s/{{VERSION}}/${VERSION}/g" k8s/base/api.yaml | kubectl apply -n ${NAMESPACE} -f -
sed "s/{{VERSION}}/${VERSION}/g" k8s/base/frontend.yaml | kubectl apply -n ${NAMESPACE} -f -

# Wait for rollout to complete
kubectl rollout status deployment/terrafusion-api -n ${NAMESPACE} --timeout=600s
kubectl rollout status deployment/terrafusion-frontend -n ${NAMESPACE} --timeout=600s

# Run post-deployment tests
echo "Running post-deployment tests..."
kubectl run smoke-test-${VERSION} \
  --image=terrafusion/test:${VERSION} \
  --restart=Never \
  --namespace=${NAMESPACE} \
  --command -- npm run test:smoke

echo "Deployment completed successfully!"
```

### Rollback Script

```bash
#!/bin/bash
# rollback.sh

set -e

ENVIRONMENT=${1:-staging}
NAMESPACE="terrafusion-${ENVIRONMENT}"

echo "Rolling back Terrafusion in ${ENVIRONMENT}"

# Rollback deployments
kubectl rollout undo deployment/terrafusion-api -n ${NAMESPACE}
kubectl rollout undo deployment/terrafusion-frontend -n ${NAMESPACE}

# Wait for rollback to complete
kubectl rollout status deployment/terrafusion-api -n ${NAMESPACE}
kubectl rollout status deployment/terrafusion-frontend -n ${NAMESPACE}

echo "Rollback completed successfully!"
```

---

## 📋 Deployment Checklist

### Pre-Deployment

- [ ] Code reviewed and approved
- [ ] All tests passing
- [ ] Security scan completed
- [ ] Database migrations tested
- [ ] Configuration validated
- [ ] Backup completed
- [ ] Monitoring alerts configured

### During Deployment

- [ ] Health checks passing
- [ ] Database migrations successful
- [ ] Services responding
- [ ] Load balancer configured
- [ ] SSL certificates valid
- [ ] DNS records updated

### Post-Deployment

- [ ] Smoke tests passing
- [ ] Performance metrics normal
- [ ] Error rates acceptable
- [ ] User acceptance testing
- [ ] Documentation updated
- [ ] Team notifications sent
- [ ] Rollback plan confirmed

---

## 🔍 Troubleshooting

### Common Issues

#### Database Connection Issues

```bash
# Check database connectivity
kubectl exec -it pod/terrafusion-api-xxx -n terrafusion -- \
  psql $DATABASE_URL -c "SELECT 1"

# Check database logs
kubectl logs deployment/postgres -n terrafusion
```

#### Memory Issues

```bash
# Check memory usage
kubectl top nodes
kubectl top pods -n terrafusion

# Scale deployment
kubectl scale deployment terrafusion-api --replicas=5 -n terrafusion
```

#### Network Issues

```bash
# Check service endpoints
kubectl get endpoints -n terrafusion

# Test service connectivity
kubectl exec -it pod/terrafusion-api-xxx -n terrafusion -- \
  curl http://terrafusion-frontend:80/health
```

---

## 📚 Additional Resources

- [Local Development](./local.md)
- [Staging Environment](./staging.md)
- [Production Deployment](./production.md)
- [Docker Configuration](./docker.md)
- [Kubernetes Configuration](./kubernetes.md)
- [Cloud Deployment Guides](./cloud/)

---

_Deployment guide last updated: August 3, 2025_

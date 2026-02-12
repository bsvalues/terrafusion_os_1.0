# Kubernetes Deployment Guide

This guide walks through the process of deploying TerraFusionPro to a Kubernetes cluster.

## Prerequisites

- Kubernetes cluster (v1.22+)
- kubectl CLI configured for your cluster
- Docker registry access
- Helm (optional, for certain deployments)
- PostgreSQL database (can be deployed as part of the platform or external)

## Preparation Steps

### 1. Build and Push Docker Images

For each service, build and push the Docker image to your registry:

```bash
# Set environment variables
REGISTRY=your-registry.com
VERSION=1.0.0

# Web Client
docker build -t $REGISTRY/terrafusionpro/web-client:$VERSION -f packages/web-client/Dockerfile .
docker push $REGISTRY/terrafusionpro/web-client:$VERSION

# API Gateway
docker build -t $REGISTRY/terrafusionpro/api-gateway:$VERSION -f packages/api/Dockerfile .
docker push $REGISTRY/terrafusionpro/api-gateway:$VERSION

# Property Service
docker build -t $REGISTRY/terrafusionpro/property-service:$VERSION -f services/property-service/Dockerfile .
docker push $REGISTRY/terrafusionpro/property-service:$VERSION

# User Service
docker build -t $REGISTRY/terrafusionpro/user-service:$VERSION -f services/user-service/Dockerfile .
docker push $REGISTRY/terrafusionpro/user-service:$VERSION

# Form Service
docker build -t $REGISTRY/terrafusionpro/form-service:$VERSION -f services/form-service/Dockerfile .
docker push $REGISTRY/terrafusionpro/form-service:$VERSION

# Analysis Service
docker build -t $REGISTRY/terrafusionpro/analysis-service:$VERSION -f services/analysis-service/Dockerfile .
docker push $REGISTRY/terrafusionpro/analysis-service:$VERSION

# Report Service
docker build -t $REGISTRY/terrafusionpro/report-service:$VERSION -f services/report-service/Dockerfile .
docker push $REGISTRY/terrafusionpro/report-service:$VERSION
```

### 2. Update Image References in Kubernetes Manifests

Edit the deployment YAML files in `infrastructure/kubernetes/base/` to use your registry and version:

```bash
# Example for API Gateway
sed -i 's|image: terrafusionpro/api-gateway:latest|image: '$REGISTRY'/terrafusionpro/api-gateway:'$VERSION'|g' infrastructure/kubernetes/base/api-gateway.yaml

# Repeat for other services
```

### 3. Create Secrets

Create the necessary secrets for the platform:

```bash
# Create a secure JWT secret
JWT_SECRET=$(openssl rand -base64 32)

# Create a secure database password
DB_PASSWORD=$(openssl rand -base64 16)

# Encode secrets for Kubernetes
JWT_SECRET_ENCODED=$(echo -n "$JWT_SECRET" | base64)
DB_PASSWORD_ENCODED=$(echo -n "$DB_PASSWORD" | base64)

# Create a temporary secrets file
cat <<EOF > /tmp/terrafusionpro-secrets.yaml
apiVersion: v1
kind: Secret
metadata:
  name: terrafusionpro-secrets
  namespace: terrafusionpro
type: Opaque
data:
  jwt-secret: $JWT_SECRET_ENCODED
  postgres-password: $DB_PASSWORD_ENCODED
  database-url: $(echo -n "postgres://terrafusionpro:$DB_PASSWORD@postgres-service.terrafusionpro:5432/terrafusionpro" | base64)
EOF

# Apply the secrets
kubectl apply -f /tmp/terrafusionpro-secrets.yaml

# Remove the temporary file
rm /tmp/terrafusionpro-secrets.yaml
```

## Deployment

### 1. Create Namespace and Deploy Resources

```bash
# Create namespace
kubectl apply -f infrastructure/kubernetes/base/namespace.yaml

# Deploy Database
kubectl apply -f infrastructure/kubernetes/base/database.yaml

# Wait for database to be ready
kubectl rollout status statefulset/postgres -n terrafusionpro

# Deploy Services
kubectl apply -f infrastructure/kubernetes/base/user-service.yaml
kubectl apply -f infrastructure/kubernetes/base/property-service.yaml
kubectl apply -f infrastructure/kubernetes/base/form-service.yaml
kubectl apply -f infrastructure/kubernetes/base/analysis-service.yaml
kubectl apply -f infrastructure/kubernetes/base/report-service.yaml

# Deploy API Gateway and Web Client
kubectl apply -f infrastructure/kubernetes/base/api-gateway.yaml
kubectl apply -f infrastructure/kubernetes/base/web-client.yaml

# Deploy Ingress
kubectl apply -f infrastructure/kubernetes/base/ingress.yaml
```

Alternatively, use kustomize to deploy all resources at once:

```bash
kubectl apply -k infrastructure/kubernetes/base/
```

### 2. Initialize Database

Once the database is running, you need to initialize the schema:

```bash
# Find a running pod that has access to the database
POD_NAME=$(kubectl get pods -n terrafusionpro -l app=user-service -o jsonpath="{.items[0].metadata.name}")

# Copy the migration script to the pod
kubectl cp packages/shared/scripts/db-push.js terrafusionpro/$POD_NAME:/tmp/db-push.js

# Run the migration
kubectl exec -n terrafusionpro $POD_NAME -- node /tmp/db-push.js
```

### 3. Verify Deployment

Check that all services are running:

```bash
kubectl get pods -n terrafusionpro
```

Verify the ingress configuration:

```bash
kubectl get ingress -n terrafusionpro
```

## Multi-Environment Setup

For multiple environments (dev, staging, prod), use Kustomize overlays:

### 1. Create Overlay Structure

```bash
mkdir -p infrastructure/kubernetes/overlays/{dev,staging,prod}
```

### 2. Create Base Kustomization

Create `infrastructure/kubernetes/overlays/dev/kustomization.yaml`:

```yaml
apiVersion: kustomize.config.k8s.io/v1beta1
kind: Kustomization
bases:
  - ../../base
nameSuffix: -dev
namespace: terrafusionpro-dev
patchesStrategicMerge:
  - database-patch.yaml
  - ingress-patch.yaml
```

### 3. Create Environment-Specific Patches

Create `infrastructure/kubernetes/overlays/dev/database-patch.yaml`:

```yaml
apiVersion: apps/v1
kind: StatefulSet
metadata:
  name: postgres
spec:
  template:
    spec:
      containers:
      - name: postgres
        resources:
          limits:
            cpu: 500m
            memory: 512Mi
          requests:
            cpu: 250m
            memory: 256Mi
```

Create `infrastructure/kubernetes/overlays/dev/ingress-patch.yaml`:

```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: terrafusionpro-ingress
spec:
  tls:
  - hosts:
    - dev.app.terrafusionpro.com
    - dev.api.terrafusionpro.com
    secretName: terrafusionpro-tls-dev
  rules:
  - host: dev.app.terrafusionpro.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: web-client-dev
            port:
              number: 80
  - host: dev.api.terrafusionpro.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: api-gateway-dev
            port:
              number: 80
```

### 4. Deploy Environment-Specific Configuration

```bash
# Deploy dev environment
kubectl apply -k infrastructure/kubernetes/overlays/dev/

# Deploy staging environment
kubectl apply -k infrastructure/kubernetes/overlays/staging/

# Deploy production environment
kubectl apply -k infrastructure/kubernetes/overlays/prod/
```

## Scaling Considerations

### Horizontal Pod Autoscaling

To automatically scale services based on load:

```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: api-gateway
  namespace: terrafusionpro
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: api-gateway
  minReplicas: 2
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
```

Apply this configuration:

```bash
kubectl apply -f infrastructure/kubernetes/hpa.yaml
```

## Monitoring and Logging

### Prometheus and Grafana

Install Prometheus and Grafana for monitoring:

```bash
# Using Helm
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm repo update
helm install prometheus prometheus-community/kube-prometheus-stack \
  --namespace monitoring \
  --create-namespace
```

### ELK Stack for Logging

Install ELK stack for centralized logging:

```bash
# Using Helm
helm repo add elastic https://helm.elastic.co
helm repo update
helm install elasticsearch elastic/elasticsearch \
  --namespace logging \
  --create-namespace
helm install kibana elastic/kibana \
  --namespace logging
helm install filebeat elastic/filebeat \
  --namespace logging
```

## Backup and Disaster Recovery

### Database Backups

Schedule regular PostgreSQL backups:

```yaml
apiVersion: batch/v1
kind: CronJob
metadata:
  name: postgres-backup
  namespace: terrafusionpro
spec:
  schedule: "0 1 * * *"  # Daily at 1 AM
  jobTemplate:
    spec:
      template:
        spec:
          containers:
          - name: postgres-backup
            image: postgres:14-alpine
            command:
            - /bin/sh
            - -c
            - |
              pg_dump -h postgres-service -U terrafusionpro -d terrafusionpro -f /backup/terrafusionpro-$(date +%Y%m%d).sql
            env:
            - name: PGPASSWORD
              valueFrom:
                secretKeyRef:
                  name: terrafusionpro-secrets
                  key: postgres-password
            volumeMounts:
            - name: backup-volume
              mountPath: /backup
          restartPolicy: OnFailure
          volumes:
          - name: backup-volume
            persistentVolumeClaim:
              claimName: postgres-backup-pvc
```

Apply this configuration:

```bash
kubectl apply -f infrastructure/kubernetes/backup.yaml
```

## Troubleshooting

### Check Service Logs

```bash
# View logs for a specific service
kubectl logs -f -l app=api-gateway -n terrafusionpro

# View logs for a specific pod
kubectl logs -f pod-name -n terrafusionpro
```

### Check Service Health

```bash
# Port-forward to a service for direct testing
kubectl port-forward svc/api-gateway 5002:80 -n terrafusionpro

# In another terminal
curl http://localhost:5002/api/health
```

### Database Troubleshooting

```bash
# Connect to the database
kubectl exec -it postgres-0 -n terrafusionpro -- psql -U terrafusionpro
```

## Cleaning Up

To remove the entire deployment:

```bash
# Using kustomize
kubectl delete -k infrastructure/kubernetes/base/

# Or delete individual components
kubectl delete -f infrastructure/kubernetes/base/ingress.yaml
kubectl delete -f infrastructure/kubernetes/base/web-client.yaml
kubectl delete -f infrastructure/kubernetes/base/api-gateway.yaml
kubectl delete -f infrastructure/kubernetes/base/report-service.yaml
kubectl delete -f infrastructure/kubernetes/base/analysis-service.yaml
kubectl delete -f infrastructure/kubernetes/base/form-service.yaml
kubectl delete -f infrastructure/kubernetes/base/property-service.yaml
kubectl delete -f infrastructure/kubernetes/base/user-service.yaml
kubectl delete -f infrastructure/kubernetes/base/database.yaml
kubectl delete -f infrastructure/kubernetes/base/namespace.yaml
```
#!/bin/bash
set -euo pipefail

# TerraFusion Enhanced Production Deployment Script
# Integrates Kubernetes auto-scaling, monitoring, and production optimizations

# Color codes for output
readonly RED='\033[0;31m'
readonly GREEN='\033[0;32m'
readonly YELLOW='\033[1;33m'
readonly BLUE='\033[0;34m'
readonly NC='\033[0m' # No Color

# Configuration
readonly NAMESPACE="terrafusion"
readonly APP_NAME="terrafusion-app"
readonly VERSION="2.0.0"
readonly DOMAIN="terrafusion.gov"

# Logging function
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

error() {
    echo -e "${RED}[ERROR] $1${NC}" >&2
}

warning() {
    echo -e "${YELLOW}[WARNING] $1${NC}"
}

info() {
    echo -e "${BLUE}[INFO] $1${NC}"
}

# Check prerequisites
check_prerequisites() {
    log "Checking deployment prerequisites..."
    
    # Check if kubectl is installed
    if ! command -v kubectl &> /dev/null; then
        error "kubectl is not installed. Please install kubectl first."
        exit 1
    fi
    
    # Check if Docker is installed
    if ! command -v docker &> /dev/null; then
        error "Docker is not installed. Please install Docker first."
        exit 1
    fi
    
    # Check kubectl cluster connection
    if ! kubectl cluster-info &> /dev/null; then
        error "Cannot connect to Kubernetes cluster. Please check your kubeconfig."
        exit 1
    fi
    
    # Check if Node.js is installed
    if ! command -v node &> /dev/null; then
        error "Node.js is not installed. Please install Node.js first."
        exit 1
    fi
    
    log "All prerequisites met"
}

# Build application Docker image
build_application() {
    log "Building TerraFusion application Docker image..."
    
    # Create optimized Dockerfile for production
    cat > Dockerfile.production << 'EOF'
# Multi-stage build for optimized production image
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY client/package*.json ./client/
COPY server/package*.json ./server/

# Install dependencies
RUN npm ci --only=production && \
    cd client && npm ci --only=production && \
    cd ../server && npm ci --only=production

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Production image
FROM node:18-alpine AS production

WORKDIR /app

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S terrafusion -u 1001

# Copy built application
COPY --from=builder --chown=terrafusion:nodejs /app/dist ./dist
COPY --from=builder --chown=terrafusion:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=terrafusion:nodejs /app/package.json ./

# Set environment variables
ENV NODE_ENV=production
ENV PORT=5000

# Switch to non-root user
USER terrafusion

# Expose port
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD node -e "require('http').get('http://localhost:5000/api/system/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"

# Start application
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/server/index.js"]
EOF

    # Build Docker image
    docker build -f Dockerfile.production -t ${APP_NAME}:${VERSION} .
    
    # Tag for registry
    docker tag ${APP_NAME}:${VERSION} ${APP_NAME}:latest
    
    log "Docker image built successfully"
}

# Deploy to Kubernetes
deploy_to_kubernetes() {
    log "Deploying TerraFusion to Kubernetes..."
    
    # Create namespace if it doesn't exist
    kubectl create namespace ${NAMESPACE} --dry-run=client -o yaml | kubectl apply -f -
    
    # Apply enhanced Kubernetes configuration
    kubectl apply -f deployment/enhanced-k8s-deployment.yaml
    
    # Wait for deployment to be ready
    log "Waiting for deployment to be ready..."
    kubectl rollout status deployment/${APP_NAME} -n ${NAMESPACE} --timeout=300s
    
    # Wait for PostgreSQL to be ready
    kubectl rollout status deployment/postgres -n ${NAMESPACE} --timeout=300s
    
    # Wait for Redis to be ready
    kubectl rollout status deployment/redis -n ${NAMESPACE} --timeout=300s
    
    log "Kubernetes deployment completed successfully"
}

# Configure monitoring and observability
setup_monitoring() {
    log "Setting up monitoring and observability..."
    
    # Create monitoring configuration
    cat > monitoring-config.yaml << 'EOF'
apiVersion: v1
kind: ConfigMap
metadata:
  name: prometheus-config
  namespace: terrafusion
data:
  prometheus.yml: |
    global:
      scrape_interval: 15s
      evaluation_interval: 15s
    
    rule_files:
      - "terrafusion_rules.yml"
    
    scrape_configs:
      - job_name: 'terrafusion-app'
        static_configs:
          - targets: ['terrafusion-service:80']
        metrics_path: '/metrics'
        scrape_interval: 30s
        
      - job_name: 'postgres'
        static_configs:
          - targets: ['postgres-service:5432']
        scrape_interval: 60s
        
      - job_name: 'redis'
        static_configs:
          - targets: ['redis-service:6379']
        scrape_interval: 60s
---
apiVersion: v1
kind: ConfigMap
metadata:
  name: grafana-dashboards
  namespace: terrafusion
data:
  terrafusion-dashboard.json: |
    {
      "dashboard": {
        "title": "TerraFusion Platform Metrics",
        "panels": [
          {
            "title": "Request Rate",
            "type": "graph",
            "targets": [
              {
                "expr": "rate(http_requests_total[5m])",
                "legendFormat": "{{method}} {{status}}"
              }
            ]
          },
          {
            "title": "Response Time",
            "type": "graph",
            "targets": [
              {
                "expr": "histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))",
                "legendFormat": "95th percentile"
              }
            ]
          },
          {
            "title": "AI Agent Performance",
            "type": "graph",
            "targets": [
              {
                "expr": "agent_accuracy_percentage",
                "legendFormat": "{{agent_type}}"
              }
            ]
          }
        ]
      }
    }
EOF

    kubectl apply -f monitoring-config.yaml
    
    log "Monitoring configuration applied"
}

# Configure SSL/TLS certificates
setup_ssl() {
    log "Setting up SSL/TLS certificates..."
    
    # Create cert-manager cluster issuer
    cat > ssl-config.yaml << 'EOF'
apiVersion: cert-manager.io/v1
kind: ClusterIssuer
metadata:
  name: letsencrypt-prod
spec:
  acme:
    server: https://acme-v02.api.letsencrypt.org/directory
    email: admin@terrafusion.gov
    privateKeySecretRef:
      name: letsencrypt-prod
    solvers:
    - http01:
        ingress:
          class: nginx
EOF

    kubectl apply -f ssl-config.yaml
    
    log "SSL/TLS configuration applied"
}

# Run database migrations
run_migrations() {
    log "Running database migrations..."
    
    # Wait for PostgreSQL to be ready
    kubectl wait --for=condition=ready pod -l app=postgres -n ${NAMESPACE} --timeout=300s
    
    # Run migrations using a job
    cat > migration-job.yaml << 'EOF'
apiVersion: batch/v1
kind: Job
metadata:
  name: terrafusion-migration
  namespace: terrafusion
spec:
  template:
    spec:
      containers:
      - name: migration
        image: terrafusion/app:2.0.0
        command: ["npm", "run", "db:push"]
        env:
        - name: DATABASE_URL
          valueFrom:
            configMapKeyRef:
              name: terrafusion-config
              key: DATABASE_URL
        - name: POSTGRES_PASSWORD
          valueFrom:
            secretKeyRef:
              name: terrafusion-secrets
              key: postgres-password
      restartPolicy: Never
  backoffLimit: 3
EOF

    kubectl apply -f migration-job.yaml
    kubectl wait --for=condition=complete job/terrafusion-migration -n ${NAMESPACE} --timeout=300s
    
    log "Database migrations completed"
}

# Verify deployment health
verify_deployment() {
    log "Verifying deployment health..."
    
    # Check pod status
    kubectl get pods -n ${NAMESPACE}
    
    # Check service status
    kubectl get services -n ${NAMESPACE}
    
    # Check ingress status
    kubectl get ingress -n ${NAMESPACE}
    
    # Test application health endpoint
    local service_ip
    service_ip=$(kubectl get service terrafusion-service -n ${NAMESPACE} -o jsonpath='{.spec.clusterIP}')
    
    if kubectl run test-pod --image=curlimages/curl --rm -i --restart=Never -- \
        curl -f "http://${service_ip}/api/system/health" &> /dev/null; then
        log "Health check passed"
    else
        error "Health check failed"
        return 1
    fi
    
    # Check HPA status
    kubectl get hpa -n ${NAMESPACE}
    
    log "Deployment verification completed successfully"
}

# Performance optimization
optimize_performance() {
    log "Applying performance optimizations..."
    
    # Update application with performance configurations
    kubectl patch deployment ${APP_NAME} -n ${NAMESPACE} -p '{
        "spec": {
            "template": {
                "spec": {
                    "containers": [{
                        "name": "terrafusion-app",
                        "env": [
                            {"name": "NODE_OPTIONS", "value": "--max-old-space-size=1536"},
                            {"name": "UV_THREADPOOL_SIZE", "value": "16"},
                            {"name": "ENABLE_PERFORMANCE_MONITORING", "value": "true"}
                        ]
                    }]
                }
            }
        }
    }'
    
    log "Performance optimizations applied"
}

# Setup backup strategy
setup_backup() {
    log "Setting up backup strategy..."
    
    # Create backup CronJob
    cat > backup-cronjob.yaml << 'EOF'
apiVersion: batch/v1
kind: CronJob
metadata:
  name: postgres-backup
  namespace: terrafusion
spec:
  schedule: "0 2 * * *"  # Daily at 2 AM
  jobTemplate:
    spec:
      template:
        spec:
          containers:
          - name: postgres-backup
            image: postgres:15-alpine
            command:
            - /bin/bash
            - -c
            - |
              PGPASSWORD=$POSTGRES_PASSWORD pg_dump -h postgres-service -U terrafusion terrafusion > /backup/terrafusion-$(date +%Y%m%d_%H%M%S).sql
              # Keep only last 7 days of backups
              find /backup -name "terrafusion-*.sql" -mtime +7 -delete
            env:
            - name: POSTGRES_PASSWORD
              valueFrom:
                secretKeyRef:
                  name: terrafusion-secrets
                  key: postgres-password
            volumeMounts:
            - name: backup-storage
              mountPath: /backup
          volumes:
          - name: backup-storage
            persistentVolumeClaim:
              claimName: backup-pvc
          restartPolicy: OnFailure
---
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: backup-pvc
  namespace: terrafusion
spec:
  accessModes:
    - ReadWriteOnce
  resources:
    requests:
      storage: 50Gi
EOF

    kubectl apply -f backup-cronjob.yaml
    
    log "Backup strategy configured"
}

# Main deployment function
main() {
    log "Starting TerraFusion enhanced production deployment..."
    
    check_prerequisites
    build_application
    deploy_to_kubernetes
    setup_monitoring
    setup_ssl
    run_migrations
    optimize_performance
    setup_backup
    verify_deployment
    
    log "=========================================="
    log "TerraFusion deployment completed successfully!"
    log "=========================================="
    
    info "Application URL: https://${DOMAIN}"
    info "API URL: https://api.${DOMAIN}"
    info "Namespace: ${NAMESPACE}"
    info "Version: ${VERSION}"
    
    # Display useful commands
    echo
    info "Useful commands:"
    echo "  kubectl get pods -n ${NAMESPACE}"
    echo "  kubectl logs -f deployment/${APP_NAME} -n ${NAMESPACE}"
    echo "  kubectl port-forward service/terrafusion-service 8080:80 -n ${NAMESPACE}"
    echo "  kubectl get hpa -n ${NAMESPACE}"
    echo
}

# Run deployment if script is executed directly
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi
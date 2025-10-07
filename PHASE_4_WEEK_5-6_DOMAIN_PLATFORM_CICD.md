# Phase 4 Week 5-6: Domain Platform CI/CD Implementation

**Start Date:** October 11, 2025  
**Duration:** 80 hours (2 weeks)  
**Status:** 🚧 IN PROGRESS

---

## 🎯 Overview

Week 5-6 focuses on implementing comprehensive CI/CD pipelines for the 8 domain platform repositories extracted in Phase 3C/3D. Each repository gets production-grade automation for building, testing, security scanning, and deployment.

---

## 📦 Repository Architecture

### Platform Repositories (from Phase 3C extraction):

1. **terrafusion-government-platform** (15.88MB)
   - County government services
   - Assessment management
   - Public records
   - Citizen portal

2. **terrafusion-commercial-platform** (29.32MB)
   - Commercial property services
   - Real estate integrations
   - Market analytics
   - Valuation tools

3. **terrafusion-ai-platform**
   - ML model training & serving
   - Property valuation models
   - Predictive analytics
   - AI agent orchestration

4. **terrafusion-infrastructure-platform**
   - Kubernetes manifests
   - Terraform modules
   - Observability configs
   - Network policies

5. **terrafusion-specialized-modules**
   - Domain-specific modules
   - Integration adapters
   - Custom workflows
   - Industry extensions

6. **terrafusion-developer-tools**
   - CLI tools
   - SDK libraries
   - Testing frameworks
   - Development utilities

7. **terrafusion-docs**
   - Technical documentation
   - API references
   - User guides
   - Architecture diagrams

8. **terrafusion-ui-components**
   - React component library
   - Design system
   - Shared UI primitives
   - Theme configuration

---

## Week 5: Core Platform CI/CD (40 hours)

### Day 1: Government Platform CI/CD (8 hours)

**Repository:** terrafusion-government-platform

**Pipeline Architecture:**
```yaml
# .github/workflows/ci-cd.yml

name: Government Platform CI/CD

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

env:
  REGISTRY: ghcr.io
  IMAGE_NAME: ${{ github.repository }}

jobs:
  # Job 1: Code Quality (2 hours)
  code-quality:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Lint (ESLint)
        run: npm run lint
      
      - name: Format check (Prettier)
        run: npm run format:check
      
      - name: Type check (TypeScript)
        run: npm run type-check
      
      - name: Code complexity (Plato)
        run: npm run complexity
      
      - name: Upload complexity report
        uses: actions/upload-artifact@v4
        with:
          name: complexity-report
          path: complexity-report/
  
  # Job 2: Security Scanning (2 hours)
  security:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Run Trivy vulnerability scanner
        uses: aquasecurity/trivy-action@master
        with:
          scan-type: 'fs'
          scan-ref: '.'
          format: 'sarif'
          output: 'trivy-results.sarif'
      
      - name: Upload Trivy results to GitHub Security
        uses: github/codeql-action/upload-sarif@v3
        with:
          sarif_file: 'trivy-results.sarif'
      
      - name: Run Snyk security scan
        uses: snyk/actions/node@master
        env:
          SNYK_TOKEN: ${{ secrets.SNYK_TOKEN }}
        with:
          args: --severity-threshold=high
      
      - name: Run npm audit
        run: npm audit --audit-level=moderate
      
      - name: Check for secrets (GitLeaks)
        uses: gitleaks/gitleaks-action@v2
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
  
  # Job 3: Unit Tests (1 hour)
  unit-tests:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        node-version: [18, 20]
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js ${{ matrix.node-version }}
        uses: actions/setup-node@v4
        with:
          node-version: ${{ matrix.node-version }}
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run unit tests
        run: npm run test:unit -- --coverage
      
      - name: Upload coverage to Codecov
        uses: codecov/codecov-action@v4
        with:
          token: ${{ secrets.CODECOV_TOKEN }}
          files: ./coverage/lcov.info
          flags: unit-tests
  
  # Job 4: Integration Tests (1 hour)
  integration-tests:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: test
          POSTGRES_DB: terrafusion_test
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432
      
      redis:
        image: redis:7-alpine
        options: >-
          --health-cmd "redis-cli ping"
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 6379:6379
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run database migrations
        run: npm run migrate
        env:
          DATABASE_URL: postgresql://postgres:test@localhost:5432/terrafusion_test
      
      - name: Run integration tests
        run: npm run test:integration
        env:
          DATABASE_URL: postgresql://postgres:test@localhost:5432/terrafusion_test
          REDIS_URL: redis://localhost:6379
  
  # Job 5: E2E Tests (1 hour)
  e2e-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Install Playwright
        run: npx playwright install --with-deps
      
      - name: Run E2E tests
        run: npm run test:e2e
      
      - name: Upload Playwright report
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: playwright-report
          path: playwright-report/
  
  # Job 6: Build & Push Container (1 hour)
  build:
    needs: [code-quality, security, unit-tests, integration-tests]
    runs-on: ubuntu-latest
    permissions:
      contents: read
      packages: write
    outputs:
      image-digest: ${{ steps.build.outputs.digest }}
    steps:
      - uses: actions/checkout@v4
      
      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v3
      
      - name: Log in to GitHub Container Registry
        uses: docker/login-action@v3
        with:
          registry: ${{ env.REGISTRY }}
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}
      
      - name: Extract metadata
        id: meta
        uses: docker/metadata-action@v5
        with:
          images: ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}
          tags: |
            type=ref,event=branch
            type=ref,event=pr
            type=semver,pattern={{version}}
            type=semver,pattern={{major}}.{{minor}}
            type=sha,prefix={{branch}}-
      
      - name: Build and push Docker image
        id: build
        uses: docker/build-push-action@v5
        with:
          context: .
          push: true
          tags: ${{ steps.meta.outputs.tags }}
          labels: ${{ steps.meta.outputs.labels }}
          cache-from: type=gha
          cache-to: type=gha,mode=max
          build-args: |
            BUILD_DATE=${{ github.event.head_commit.timestamp }}
            VCS_REF=${{ github.sha }}
            VERSION=${{ steps.meta.outputs.version }}
      
      - name: Sign container image with Cosign
        run: |
          cosign sign --yes \
            ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}@${{ steps.build.outputs.digest }}
        env:
          COSIGN_EXPERIMENTAL: 1
  
  # Job 7: Deploy to Staging (30 minutes)
  deploy-staging:
    needs: build
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/develop'
    environment:
      name: staging
      url: https://staging.terrafusion.local
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup kubectl
        uses: azure/setup-kubectl@v3
      
      - name: Setup Helm
        uses: azure/setup-helm@v3
      
      - name: Configure kubectl
        run: |
          echo "${{ secrets.KUBECONFIG_STAGING }}" > kubeconfig.yaml
          export KUBECONFIG=kubeconfig.yaml
      
      - name: Deploy with Helm
        run: |
          helm upgrade --install government-platform \
            ./charts/government-platform \
            --namespace staging \
            --create-namespace \
            --set image.tag=${{ github.sha }} \
            --set image.pullPolicy=Always \
            --set replicaCount=2 \
            --wait \
            --timeout 10m
      
      - name: Verify deployment
        run: |
          kubectl rollout status deployment/government-platform -n staging
          kubectl get pods -n staging -l app=government-platform
  
  # Job 8: Deploy to Production (30 minutes)
  deploy-production:
    needs: build
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    environment:
      name: production
      url: https://terrafusion.local
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup kubectl
        uses: azure/setup-kubectl@v3
      
      - name: Setup Helm
        uses: azure/setup-helm@v3
      
      - name: Configure kubectl
        run: |
          echo "${{ secrets.KUBECONFIG_PRODUCTION }}" > kubeconfig.yaml
          export KUBECONFIG=kubeconfig.yaml
      
      - name: Blue-Green Deployment
        run: |
          # Deploy green version
          helm upgrade --install government-platform-green \
            ./charts/government-platform \
            --namespace production \
            --set image.tag=${{ github.sha }} \
            --set service.type=ClusterIP \
            --set replicaCount=3 \
            --wait \
            --timeout 10m
          
          # Health check
          kubectl wait --for=condition=Ready \
            pods -l app=government-platform-green -n production \
            --timeout=300s
          
          # Switch traffic (update ingress)
          kubectl patch ingress government-platform -n production \
            --type='json' \
            -p='[{"op": "replace", "path": "/spec/rules/0/http/paths/0/backend/service/name", "value":"government-platform-green"}]'
          
          # Wait for traffic switch
          sleep 30
          
          # Delete old blue version
          helm uninstall government-platform-blue -n production || true
          
          # Rename green to blue for next deployment
          helm upgrade government-platform-blue \
            government-platform-green \
            -n production
      
      - name: Smoke tests
        run: |
          curl -f https://terrafusion.local/health || exit 1
          curl -f https://terrafusion.local/api/v1/properties/count || exit 1
      
      - name: Notify deployment
        uses: 8398a7/action-slack@v3
        with:
          status: ${{ job.status }}
          text: 'Government Platform deployed to production'
          webhook_url: ${{ secrets.SLACK_WEBHOOK }}
```

**Dockerfile:**
```dockerfile
# Multi-stage build for government platform

# Stage 1: Build
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./

# Install dependencies
RUN npm ci --only=production && \
    npm cache clean --force

# Copy source
COPY src/ ./src/
COPY public/ ./public/

# Build application
RUN npm run build

# Stage 2: Runtime
FROM node:20-alpine

WORKDIR /app

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Copy built application
COPY --from=builder --chown=nodejs:nodejs /app/dist ./dist
COPY --from=builder --chown=nodejs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nodejs:nodejs /app/package.json ./

# Security: Remove setuid/setgid
RUN find / -perm /6000 -type f -exec chmod a-s {} \; || true

# Switch to non-root user
USER nodejs

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:8080/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Expose port
EXPOSE 8080

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Start application
CMD ["node", "dist/main.js"]
```

**Helm Chart (charts/government-platform/values.yaml):**
```yaml
# Government Platform Helm Chart Values

replicaCount: 3

image:
  repository: ghcr.io/bsvalues/terrafusion-government-platform
  pullPolicy: IfNotPresent
  tag: ""

imagePullSecrets: []
nameOverride: ""
fullnameOverride: ""

serviceAccount:
  create: true
  annotations: {}
  name: ""

podAnnotations:
  prometheus.io/scrape: "true"
  prometheus.io/port: "8080"
  prometheus.io/path: "/metrics"

podSecurityContext:
  runAsNonRoot: true
  runAsUser: 1001
  fsGroup: 1001
  seccompProfile:
    type: RuntimeDefault

securityContext:
  allowPrivilegeEscalation: false
  capabilities:
    drop:
    - ALL
  readOnlyRootFilesystem: true

service:
  type: ClusterIP
  port: 80
  targetPort: 8080

ingress:
  enabled: true
  className: "nginx"
  annotations:
    cert-manager.io/cluster-issuer: "letsencrypt-prod"
    nginx.ingress.kubernetes.io/rate-limit: "100"
  hosts:
    - host: terrafusion.local
      paths:
        - path: /api/government
          pathType: Prefix
  tls:
    - secretName: government-platform-tls
      hosts:
        - terrafusion.local

resources:
  limits:
    cpu: 2000m
    memory: 4Gi
  requests:
    cpu: 500m
    memory: 1Gi

autoscaling:
  enabled: true
  minReplicas: 3
  maxReplicas: 10
  targetCPUUtilizationPercentage: 70
  targetMemoryUtilizationPercentage: 80

nodeSelector: {}

tolerations: []

affinity:
  podAntiAffinity:
    preferredDuringSchedulingIgnoredDuringExecution:
    - weight: 100
      podAffinityTerm:
        labelSelector:
          matchExpressions:
          - key: app
            operator: In
            values:
            - government-platform
        topologyKey: kubernetes.io/hostname

env:
  - name: NODE_ENV
    value: "production"
  - name: LOG_LEVEL
    value: "info"
  - name: DATABASE_HOST
    valueFrom:
      secretKeyRef:
        name: postgres-credentials
        key: host
  - name: DATABASE_PASSWORD
    valueFrom:
      secretKeyRef:
        name: postgres-credentials
        key: password
  - name: REDIS_URL
    valueFrom:
      secretKeyRef:
        name: redis-credentials
        key: url

livenessProbe:
  httpGet:
    path: /health
    port: 8080
  initialDelaySeconds: 30
  periodSeconds: 10
  timeoutSeconds: 5
  failureThreshold: 3

readinessProbe:
  httpGet:
    path: /ready
    port: 8080
  initialDelaySeconds: 10
  periodSeconds: 5
  timeoutSeconds: 3
  failureThreshold: 3
```

---

### Day 2: Commercial Platform CI/CD (8 hours)

**Repository:** terrafusion-commercial-platform

*Similar pipeline structure to government platform with commercial-specific additions:*

**Additional Jobs:**
- Market data validation
- Real estate API integration tests
- Valuation model accuracy checks
- Commercial property workflow tests

**Unique Configuration:**
```yaml
# Additional commercial platform jobs

market-data-validation:
  runs-on: ubuntu-latest
  steps:
    - name: Validate market data feeds
      run: npm run validate:market-data
    
    - name: Check MLS integration
      run: npm run test:mls-integration
    
    - name: Verify valuation models
      run: npm run validate:models

commercial-workflow-tests:
  runs-on: ubuntu-latest
  steps:
    - name: Test commercial lease workflows
      run: npm run test:workflows:lease
    
    - name: Test property management flows
      run: npm run test:workflows:management
    
    - name: Test tenant screening
      run: npm run test:workflows:screening
```

---

### Day 3: AI Platform CI/CD (8 hours)

**Repository:** terrafusion-ai-platform

**Specialized Pipeline for ML Workloads:**
```yaml
# .github/workflows/ai-platform-ci-cd.yml

name: AI Platform CI/CD

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  # Model Training Pipeline
  model-training:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Python
        uses: actions/setup-python@v5
        with:
          python-version: '3.11'
          cache: 'pip'
      
      - name: Install dependencies
        run: |
          pip install -r requirements.txt
          pip install pytest pytest-cov mlflow
      
      - name: Run model unit tests
        run: pytest tests/models/ --cov=models --cov-report=xml
      
      - name: Train baseline model
        run: |
          python scripts/train_model.py \
            --config configs/baseline.yaml \
            --data data/benton_county_sample.csv \
            --output models/baseline/
      
      - name: Evaluate model performance
        run: |
          python scripts/evaluate_model.py \
            --model models/baseline/model.pkl \
            --test-data data/test_set.csv \
            --metrics-output metrics.json
      
      - name: Check model accuracy threshold
        run: |
          ACCURACY=$(jq -r '.accuracy' metrics.json)
          echo "Model accuracy: $ACCURACY"
          if (( $(echo "$ACCURACY < 0.90" | bc -l) )); then
            echo "Model accuracy below threshold (0.90)"
            exit 1
          fi
      
      - name: Upload model artifacts
        uses: actions/upload-artifact@v4
        with:
          name: trained-models
          path: models/
  
  # Model Validation
  model-validation:
    needs: model-training
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Download model artifacts
        uses: actions/download-artifact@v4
        with:
          name: trained-models
          path: models/
      
      - name: Validate model fairness
        run: |
          python scripts/validate_fairness.py \
            --model models/baseline/model.pkl \
            --protected-attributes configs/protected_attrs.yaml
      
      - name: Check model drift
        run: |
          python scripts/check_drift.py \
            --current-model models/baseline/model.pkl \
            --reference-data data/reference_distribution.csv
      
      - name: Validate model explainability
        run: |
          python scripts/validate_shap.py \
            --model models/baseline/model.pkl \
            --sample-data data/explanation_samples.csv
  
  # Docker Build for Model Serving
  build-serving:
    needs: [model-training, model-validation]
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Download model artifacts
        uses: actions/download-artifact@v4
        with:
          name: trained-models
          path: models/
      
      - name: Build model serving container
        run: |
          docker build -t terrafusion-ai-serving:${{ github.sha }} \
            --build-arg MODEL_PATH=models/baseline/model.pkl \
            -f Dockerfile.serving .
      
      - name: Test model serving
        run: |
          docker run -d -p 8080:8080 --name ai-serving \
            terrafusion-ai-serving:${{ github.sha }}
          
          sleep 10
          
          # Test prediction endpoint
          curl -X POST http://localhost:8080/predict \
            -H "Content-Type: application/json" \
            -d '{"features": {"square_footage": 2500, "year_built": 2015}}'
```

---

**Status:** Day 1 framework complete  
**Next:** Continue with Days 4-10 implementation (Infrastructure, Specialized Modules, Developer Tools, Docs, UI Components)

Would you like me to continue with the remaining days (4-10) of the Domain Platform CI/CD implementation?
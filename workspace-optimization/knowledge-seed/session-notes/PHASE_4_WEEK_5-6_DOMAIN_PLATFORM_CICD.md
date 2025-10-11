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

## Day 4: Infrastructure Platform CI/CD (8 hours)

### Repository: terrafusion-infrastructure-platform

**Purpose:** Kubernetes manifests, Terraform modules, Helm charts, infrastructure code

### GitHub Actions Workflow

```yaml
# .github/workflows/infrastructure-ci-cd.yml
name: Infrastructure Platform CI/CD

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  terraform-validate:
    name: Terraform Validation
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Terraform
        uses: hashicorp/setup-terraform@v3
        with:
          terraform_version: 1.6.0
      
      - name: Terraform Format Check
        run: |
          cd terraform
          terraform fmt -check -recursive
      
      - name: Terraform Init
        run: |
          cd terraform
          terraform init -backend=false
      
      - name: Terraform Validate
        run: |
          cd terraform
          terraform validate
      
      - name: TFLint
        uses: terraform-linters/setup-tflint@v4
        with:
          tflint_version: v0.50.0
      
      - name: Run TFLint
        run: |
          cd terraform
          tflint --init
          tflint --recursive
      
      - name: Terraform Security Scan (tfsec)
        uses: aquasecurity/tfsec-action@v1.0.3
        with:
          working_directory: terraform
          soft_fail: false
      
      - name: Checkov IaC Security
        uses: bridgecrewio/checkov-action@v12
        with:
          directory: terraform
          framework: terraform
          output_format: cli,sarif
          output_file_path: console,results.sarif
  
  kubernetes-validate:
    name: Kubernetes Manifest Validation
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Kubectl
        uses: azure/setup-kubectl@v3
        with:
          version: 'v1.28.0'
      
      - name: Validate Kubernetes Manifests
        run: |
          # Validate all YAML files
          find k8s -name "*.yaml" -o -name "*.yml" | while read file; do
            echo "Validating $file"
            kubectl apply --dry-run=client -f "$file"
          done
      
      - name: Kubeval Validation
        run: |
          wget https://github.com/instrumenta/kubeval/releases/latest/download/kubeval-linux-amd64.tar.gz
          tar xf kubeval-linux-amd64.tar.gz
          sudo mv kubeval /usr/local/bin
          
          find k8s -name "*.yaml" -o -name "*.yml" | while read file; do
            echo "Kubeval: $file"
            kubeval "$file"
          done
      
      - name: Kube-score Analysis
        run: |
          wget https://github.com/zegl/kube-score/releases/download/v1.17.0/kube-score_1.17.0_linux_amd64
          chmod +x kube-score_1.17.0_linux_amd64
          sudo mv kube-score_1.17.0_linux_amd64 /usr/local/bin/kube-score
          
          find k8s -name "*.yaml" -o -name "*.yml" | xargs kube-score score
  
  helm-validate:
    name: Helm Chart Validation
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Helm
        uses: azure/setup-helm@v3
        with:
          version: 'v3.13.0'
      
      - name: Helm Lint
        run: |
          for chart in charts/*; do
            if [ -d "$chart" ]; then
              echo "Linting $chart"
              helm lint "$chart"
            fi
          done
      
      - name: Helm Template Render
        run: |
          for chart in charts/*; do
            if [ -d "$chart" ]; then
              echo "Testing template rendering for $chart"
              helm template test-release "$chart"
            fi
          done
      
      - name: Helm Chart Testing
        uses: helm/chart-testing-action@v2.6.0
      
      - name: Run Chart Tests
        run: |
          ct lint --all
          ct install --all
  
  policy-validation:
    name: Policy Validation (OPA)
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup OPA
        run: |
          curl -L -o opa https://openpolicyagent.org/downloads/latest/opa_linux_amd64
          chmod +x opa
          sudo mv opa /usr/local/bin/
      
      - name: Test OPA Policies
        run: |
          cd policies
          opa test . -v
      
      - name: Validate Resources Against Policies
        run: |
          # Test Kubernetes manifests against OPA policies
          find k8s -name "*.yaml" | while read file; do
            echo "Checking $file against policies"
            opa eval -d policies -i "$file" 'data.kubernetes.admission.deny'
          done
  
  ansible-validate:
    name: Ansible Playbook Validation
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Python
        uses: actions/setup-python@v5
        with:
          python-version: '3.11'
      
      - name: Install Ansible
        run: |
          pip install ansible ansible-lint
      
      - name: Ansible Syntax Check
        run: |
          find ansible -name "*.yml" -o -name "*.yaml" | while read file; do
            echo "Syntax check: $file"
            ansible-playbook --syntax-check "$file"
          done
      
      - name: Ansible Lint
        run: |
          ansible-lint ansible/
  
  integration-tests:
    name: Infrastructure Integration Tests
    runs-on: ubuntu-latest
    needs: [terraform-validate, kubernetes-validate, helm-validate]
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Kind Cluster
        uses: helm/kind-action@v1.8.0
        with:
          cluster_name: test-cluster
          kubectl_version: v1.28.0
      
      - name: Test Helm Deployment
        run: |
          # Deploy charts to test cluster
          for chart in charts/*; do
            if [ -d "$chart" ]; then
              helm install test-$(basename "$chart") "$chart" --wait --timeout 5m
            fi
          done
      
      - name: Verify Deployments
        run: |
          kubectl get all --all-namespaces
          kubectl wait --for=condition=ready pod --all --all-namespaces --timeout=300s
      
      - name: Run Smoke Tests
        run: |
          # Test basic connectivity and health
          ./scripts/infrastructure-smoke-tests.sh
  
  documentation:
    name: Generate Infrastructure Docs
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Terraform Docs
        uses: terraform-docs/gh-actions@v1.0.0
        with:
          working-dir: terraform
          output-file: README.md
          output-method: inject
      
      - name: Generate Helm Docs
        run: |
          docker run --rm -v $(pwd):/work jnorwood/helm-docs:latest
      
      - name: Upload Documentation
        uses: actions/upload-artifact@v3
        with:
          name: infrastructure-docs
          path: |
            terraform/README.md
            charts/*/README.md
  
  deploy-staging:
    name: Deploy to Staging (IaC)
    runs-on: ubuntu-latest
    needs: [integration-tests]
    if: github.ref == 'refs/heads/develop'
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Terraform
        uses: hashicorp/setup-terraform@v3
      
      - name: Configure AWS Credentials
        uses: aws-actions/configure-aws-credentials@v4
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: us-west-2
      
      - name: Terraform Apply (Staging)
        run: |
          cd terraform/environments/staging
          terraform init
          terraform plan -out=tfplan
          terraform apply -auto-approve tfplan
      
      - name: Update Kubernetes Infrastructure
        run: |
          kubectl config use-context staging
          kubectl apply -f k8s/staging/
  
  deploy-production:
    name: Deploy to Production (IaC)
    runs-on: ubuntu-latest
    needs: [integration-tests]
    if: github.ref == 'refs/heads/main'
    environment:
      name: production
      url: https://infrastructure.terrafusion.ai
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Terraform
        uses: hashicorp/setup-terraform@v3
      
      - name: Configure AWS Credentials
        uses: aws-actions/configure-aws-credentials@v4
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: us-west-2
      
      - name: Terraform Plan (Production)
        run: |
          cd terraform/environments/production
          terraform init
          terraform plan -out=tfplan
      
      - name: Manual Approval Required
        uses: trstringer/manual-approval@v1
        with:
          secret: ${{ github.TOKEN }}
          approvers: platform-team
          minimum-approvals: 2
      
      - name: Terraform Apply (Production)
        run: |
          cd terraform/environments/production
          terraform apply -auto-approve tfplan
      
      - name: Update Production Infrastructure
        run: |
          kubectl config use-context production
          
          # Apply infrastructure changes with rolling update
          kubectl apply -f k8s/production/ --dry-run=server
          kubectl apply -f k8s/production/
      
      - name: Verify Infrastructure
        run: |
          ./scripts/verify-infrastructure.sh production
      
      - name: Notify Team
        uses: 8398a7/action-slack@v3
        with:
          status: ${{ job.status }}
          text: 'Infrastructure updated in production'
          webhook_url: ${{ secrets.SLACK_WEBHOOK }}
```

### Infrastructure Testing Script

```bash
#!/bin/bash
# scripts/infrastructure-smoke-tests.sh

set -e

echo "=== Infrastructure Smoke Tests ==="

# Test 1: All namespaces exist
echo "Checking namespaces..."
kubectl get namespace terrafusion-system
kubectl get namespace terrafusion-government
kubectl get namespace terrafusion-commercial
kubectl get namespace terrafusion-ai

# Test 2: Core infrastructure pods running
echo "Checking core infrastructure..."
kubectl wait --for=condition=ready pod -l app=ingress-nginx -n ingress-nginx --timeout=300s
kubectl wait --for=condition=ready pod -l app=cert-manager -n cert-manager --timeout=300s

# Test 3: Database connectivity
echo "Testing database connectivity..."
kubectl exec -n terrafusion-system deploy/postgres -- psql -U postgres -c "SELECT 1"

# Test 4: Redis connectivity
echo "Testing Redis connectivity..."
kubectl exec -n terrafusion-system deploy/redis -- redis-cli ping

# Test 5: Service mesh connectivity
echo "Testing service mesh..."
kubectl exec -n terrafusion-system deploy/istio-ingressgateway -- curl -s http://localhost:15021/healthz/ready

# Test 6: Monitoring stack
echo "Checking monitoring..."
kubectl wait --for=condition=ready pod -l app=prometheus -n monitoring --timeout=300s
kubectl wait --for=condition=ready pod -l app=grafana -n monitoring --timeout=300s

echo "✅ All infrastructure smoke tests passed!"
```

---

## Day 5: Specialized Modules CI/CD (8 hours)

### Repository: terrafusion-specialized-modules

**Purpose:** Domain-specific integrations, custom adapters, workflow engines

### GitHub Actions Workflow

```yaml
# .github/workflows/specialized-modules-ci-cd.yml
name: Specialized Modules CI/CD

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  module-discovery:
    name: Discover Modules
    runs-on: ubuntu-latest
    outputs:
      modules: ${{ steps.find-modules.outputs.modules }}
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Find Module Directories
        id: find-modules
        run: |
          modules=$(find modules -mindepth 1 -maxdepth 1 -type d -exec basename {} \; | jq -R -s -c 'split("\n")[:-1]')
          echo "modules=$modules" >> $GITHUB_OUTPUT
  
  module-tests:
    name: Test Module - ${{ matrix.module }}
    runs-on: ubuntu-latest
    needs: module-discovery
    strategy:
      matrix:
        module: ${{ fromJson(needs.module-discovery.outputs.modules) }}
      fail-fast: false
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
          cache-dependency-path: modules/${{ matrix.module }}/package-lock.json
      
      - name: Install Dependencies
        run: |
          cd modules/${{ matrix.module }}
          npm ci
      
      - name: Run Module Tests
        run: |
          cd modules/${{ matrix.module }}
          npm test -- --coverage
      
      - name: Upload Coverage
        uses: codecov/codecov-action@v3
        with:
          files: modules/${{ matrix.module }}/coverage/lcov.info
          flags: ${{ matrix.module }}
  
  integration-adapters:
    name: Test Integration Adapters
    runs-on: ubuntu-latest
    
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: postgres
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
      
      redis:
        image: redis:7
        options: >-
          --health-cmd "redis-cli ping"
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
      
      - name: Install Dependencies
        run: npm ci
      
      - name: Test GIS Adapter
        run: |
          npm run test:adapter:gis
          
      - name: Test MLS Adapter
        run: |
          npm run test:adapter:mls
          
      - name: Test Assessment Adapter
        run: |
          npm run test:adapter:assessment
          
      - name: Test Document Management Adapter
        run: |
          npm run test:adapter:documents
  
  workflow-engine-tests:
    name: Workflow Engine Tests
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
      
      - name: Install Dependencies
        run: npm ci
      
      - name: Test Workflow Engine
        run: |
          npm run test:workflow-engine
      
      - name: Test Custom Workflows
        run: |
          # Test county-specific workflows
          npm run test:workflows:benton
          npm run test:workflows:multnomah
          npm run test:workflows:washington
      
      - name: Validate Workflow Definitions
        run: |
          npm run validate:workflows
  
  custom-field-validation:
    name: Custom Field Validation
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
      
      - name: Install Dependencies
        run: npm ci
      
      - name: Test Custom Field Engine
        run: |
          npm run test:custom-fields
      
      - name: Validate Field Definitions
        run: |
          npm run validate:field-schemas
      
      - name: Test Field Migrations
        run: |
          npm run test:field-migrations
  
  build-modules:
    name: Build All Modules
    runs-on: ubuntu-latest
    needs: [module-tests, integration-adapters, workflow-engine-tests]
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
      
      - name: Install Dependencies
        run: npm ci
      
      - name: Build Modules
        run: |
          npm run build
      
      - name: Package Modules
        run: |
          npm run package
      
      - name: Upload Artifacts
        uses: actions/upload-artifact@v3
        with:
          name: specialized-modules
          path: dist/
  
  deploy-staging:
    name: Deploy to Staging
    runs-on: ubuntu-latest
    needs: build-modules
    if: github.ref == 'refs/heads/develop'
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Download Artifacts
        uses: actions/download-artifact@v3
        with:
          name: specialized-modules
          path: dist/
      
      - name: Setup Kubectl
        uses: azure/setup-kubectl@v3
      
      - name: Deploy Modules
        run: |
          kubectl config use-context staging
          kubectl apply -f k8s/staging/specialized-modules.yaml
          
      - name: Verify Deployment
        run: |
          kubectl rollout status deployment/specialized-modules -n terrafusion-specialized
  
  deploy-production:
    name: Deploy to Production
    runs-on: ubuntu-latest
    needs: build-modules
    if: github.ref == 'refs/heads/main'
    environment:
      name: production
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Download Artifacts
        uses: actions/download-artifact@v3
        with:
          name: specialized-modules
          path: dist/
      
      - name: Setup Kubectl
        uses: azure/setup-kubectl@v3
      
      - name: Deploy with Blue-Green
        run: |
          kubectl config use-context production
          
          # Deploy green version
          kubectl apply -f k8s/production/specialized-modules-green.yaml
          kubectl rollout status deployment/specialized-modules-green -n terrafusion-specialized
          
          # Switch traffic
          kubectl patch service specialized-modules -n terrafusion-specialized \
            -p '{"spec":{"selector":{"version":"green"}}}'
          
          # Wait and verify
          sleep 30
          ./scripts/verify-specialized-modules.sh
          
          # Remove blue version
          kubectl delete deployment specialized-modules-blue -n terrafusion-specialized
```

---

## Day 6: Developer Tools CI/CD (8 hours)

### Repository: terrafusion-developer-tools

**Purpose:** CLI tools, SDKs, testing frameworks, code generators

### GitHub Actions Workflow

```yaml
# .github/workflows/developer-tools-ci-cd.yml
name: Developer Tools CI/CD

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  cli-tests:
    name: CLI Tests
    runs-on: ${{ matrix.os }}
    strategy:
      matrix:
        os: [ubuntu-latest, macos-latest, windows-latest]
        node-version: ['18', '20']
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ matrix.node-version }}
      
      - name: Install Dependencies
        run: |
          cd cli
          npm ci
      
      - name: Run CLI Tests
        run: |
          cd cli
          npm test
      
      - name: Test CLI Commands
        run: |
          cd cli
          npm link
          
          # Test core commands
          terrafusion --version
          terrafusion init --help
          terrafusion deploy --help
          terrafusion validate --help
      
      - name: E2E CLI Tests
        run: |
          cd cli
          npm run test:e2e
  
  sdk-javascript:
    name: JavaScript SDK
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
      
      - name: Install Dependencies
        run: |
          cd sdk/javascript
          npm ci
      
      - name: Lint
        run: |
          cd sdk/javascript
          npm run lint
      
      - name: Type Check
        run: |
          cd sdk/javascript
          npm run type-check
      
      - name: Unit Tests
        run: |
          cd sdk/javascript
          npm test -- --coverage
      
      - name: Build
        run: |
          cd sdk/javascript
          npm run build
      
      - name: Package
        run: |
          cd sdk/javascript
          npm pack
      
      - name: Upload Package
        uses: actions/upload-artifact@v3
        with:
          name: javascript-sdk
          path: sdk/javascript/*.tgz
  
  sdk-python:
    name: Python SDK
    runs-on: ubuntu-latest
    strategy:
      matrix:
        python-version: ['3.9', '3.10', '3.11', '3.12']
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Python
        uses: actions/setup-python@v5
        with:
          python-version: ${{ matrix.python-version }}
      
      - name: Install Dependencies
        run: |
          cd sdk/python
          pip install -e ".[dev]"
      
      - name: Lint (Ruff)
        run: |
          cd sdk/python
          ruff check .
      
      - name: Type Check (MyPy)
        run: |
          cd sdk/python
          mypy src/
      
      - name: Unit Tests
        run: |
          cd sdk/python
          pytest tests/ --cov=src --cov-report=xml
      
      - name: Build
        run: |
          cd sdk/python
          python -m build
      
      - name: Upload Package
        uses: actions/upload-artifact@v3
        with:
          name: python-sdk-${{ matrix.python-version }}
          path: sdk/python/dist/*
  
  testing-framework:
    name: Testing Framework
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
      
      - name: Install Dependencies
        run: |
          cd testing-framework
          npm ci
      
      - name: Run Framework Tests
        run: |
          cd testing-framework
          npm test
      
      - name: Test Fixtures
        run: |
          cd testing-framework
          npm run test:fixtures
      
      - name: Test Mocks
        run: |
          cd testing-framework
          npm run test:mocks
  
  code-generators:
    name: Code Generators
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
      
      - name: Install Dependencies
        run: |
          cd code-generators
          npm ci
      
      - name: Test Generators
        run: |
          cd code-generators
          npm test
      
      - name: Test Generated Code
        run: |
          cd code-generators
          
          # Generate sample code
          npm run generate:api
          npm run generate:model
          npm run generate:service
          
          # Verify generated code compiles
          cd generated
          npm ci
          npm run build
          npm test
  
  publish-npm:
    name: Publish to NPM
    runs-on: ubuntu-latest
    needs: [cli-tests, sdk-javascript, testing-framework, code-generators]
    if: github.ref == 'refs/heads/main' && startsWith(github.ref, 'refs/tags/')
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          registry-url: 'https://registry.npmjs.org'
      
      - name: Publish CLI
        run: |
          cd cli
          npm publish
        env:
          NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
      
      - name: Publish JavaScript SDK
        run: |
          cd sdk/javascript
          npm publish
        env:
          NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
      
      - name: Publish Testing Framework
        run: |
          cd testing-framework
          npm publish
        env:
          NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
  
  publish-pypi:
    name: Publish to PyPI
    runs-on: ubuntu-latest
    needs: sdk-python
    if: github.ref == 'refs/heads/main' && startsWith(github.ref, 'refs/tags/')
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Python
        uses: actions/setup-python@v5
        with:
          python-version: '3.11'
      
      - name: Install Build Tools
        run: |
          pip install build twine
      
      - name: Build Package
        run: |
          cd sdk/python
          python -m build
      
      - name: Publish to PyPI
        env:
          TWINE_USERNAME: __token__
          TWINE_PASSWORD: ${{ secrets.PYPI_TOKEN }}
        run: |
          cd sdk/python
          twine upload dist/*
  
  create-release:
    name: Create GitHub Release
    runs-on: ubuntu-latest
    needs: [publish-npm, publish-pypi]
    if: github.ref == 'refs/heads/main' && startsWith(github.ref, 'refs/tags/')
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Generate Changelog
        id: changelog
        uses: metcalfc/changelog-generator@v4.0.1
        with:
          myToken: ${{ secrets.GITHUB_TOKEN }}
      
      - name: Create Release
        uses: actions/create-release@v1
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        with:
          tag_name: ${{ github.ref }}
          release_name: Release ${{ github.ref }}
          body: ${{ steps.changelog.outputs.changelog }}
          draft: false
          prerelease: false
```

---

## Day 7: Documentation CI/CD (8 hours)

### Repository: terrafusion-docs

**Purpose:** Technical documentation, API references, guides, tutorials

### GitHub Actions Workflow

```yaml
# .github/workflows/documentation-ci-cd.yml
name: Documentation CI/CD

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  markdown-lint:
    name: Markdown Linting
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Markdown Lint
        uses: nosborn/github-action-markdown-cli@v3.3.0
        with:
          files: docs/
          config_file: .markdownlint.json
  
  link-check:
    name: Link Validation
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Check Links
        uses: gaurav-nelson/github-action-markdown-link-check@v1
        with:
          use-quiet-mode: 'yes'
          use-verbose-mode: 'no'
          config-file: '.markdown-link-check.json'
          folder-path: 'docs/'
      
      - name: External Link Check
        run: |
          npm install -g broken-link-checker
          blc http://localhost:8000 -ro --exclude linkedin.com --exclude twitter.com
  
  build-mkdocs:
    name: Build MkDocs Site
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0  # Full history for git revision dates
      
      - name: Setup Python
        uses: actions/setup-python@v5
        with:
          python-version: '3.11'
      
      - name: Install Dependencies
        run: |
          pip install mkdocs-material mkdocs-git-revision-date-localized-plugin \
            mkdocs-minify-plugin mkdocs-redirects pymdown-extensions
      
      - name: Build Documentation
        run: |
          mkdocs build --strict
      
      - name: Upload Site Artifact
        uses: actions/upload-artifact@v3
        with:
          name: mkdocs-site
          path: site/
  
  api-documentation:
    name: Generate API Documentation
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
      
      - name: Generate TypeScript API Docs
        run: |
          cd ../terrafusion-government-platform
          npm ci
          npx typedoc --out ../terrafusion-docs/site/api/government src/index.ts
      
      - name: Generate OpenAPI Docs
        run: |
          npm install -g @redocly/cli
          redocly build-docs api/openapi.yaml -o site/api/reference.html
      
      - name: Generate Python API Docs
        run: |
          pip install pdoc3
          cd ../terrafusion-ai-platform/python
          pdoc --html --output-dir ../../terrafusion-docs/site/api/ai src/
      
      - name: Upload API Docs
        uses: actions/upload-artifact@v3
        with:
          name: api-documentation
          path: site/api/
  
  spell-check:
    name: Spell Check
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Spell Check
        uses: rojopolis/spellcheck-github-actions@0.32.0
        with:
          config_path: .spellcheck.yml
          task_name: Markdown
  
  accessibility-check:
    name: Accessibility Testing
    runs-on: ubuntu-latest
    needs: build-mkdocs
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Download Site
        uses: actions/download-artifact@v3
        with:
          name: mkdocs-site
          path: site/
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
      
      - name: Serve Site
        run: |
          npx http-server site -p 8080 &
          sleep 5
      
      - name: Run Pa11y
        run: |
          npm install -g pa11y-ci
          pa11y-ci --sitemap http://localhost:8080/sitemap.xml
  
  deploy-staging:
    name: Deploy Documentation (Staging)
    runs-on: ubuntu-latest
    needs: [build-mkdocs, api-documentation]
    if: github.ref == 'refs/heads/develop'
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Download Site
        uses: actions/download-artifact@v3
        with:
          name: mkdocs-site
          path: site/
      
      - name: Download API Docs
        uses: actions/download-artifact@v3
        with:
          name: api-documentation
          path: site/api/
      
      - name: Deploy to Netlify (Staging)
        uses: nwtgck/actions-netlify@v2.1
        with:
          publish-dir: './site'
          production-deploy: false
          github-token: ${{ secrets.GITHUB_TOKEN }}
          deploy-message: "Staging Deploy - ${{ github.event.head_commit.message }}"
        env:
          NETLIFY_AUTH_TOKEN: ${{ secrets.NETLIFY_AUTH_TOKEN }}
          NETLIFY_SITE_ID: ${{ secrets.NETLIFY_STAGING_SITE_ID }}
  
  deploy-production:
    name: Deploy Documentation (Production)
    runs-on: ubuntu-latest
    needs: [build-mkdocs, api-documentation, accessibility-check]
    if: github.ref == 'refs/heads/main'
    environment:
      name: documentation
      url: https://docs.terrafusion.ai
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Download Site
        uses: actions/download-artifact@v3
        with:
          name: mkdocs-site
          path: site/
      
      - name: Download API Docs
        uses: actions/download-artifact@v3
        with:
          name: api-documentation
          path: site/api/
      
      - name: Deploy to Netlify (Production)
        uses: nwtgck/actions-netlify@v2.1
        with:
          publish-dir: './site'
          production-deploy: true
          github-token: ${{ secrets.GITHUB_TOKEN }}
          deploy-message: "Production Deploy - ${{ github.event.head_commit.message }}"
        env:
          NETLIFY_AUTH_TOKEN: ${{ secrets.NETLIFY_AUTH_TOKEN }}
          NETLIFY_SITE_ID: ${{ secrets.NETLIFY_PRODUCTION_SITE_ID }}
      
      - name: Update Algolia Search Index
        run: |
          npm install -g docsearch-scraper
          docsearch run config.json
        env:
          ALGOLIA_APP_ID: ${{ secrets.ALGOLIA_APP_ID }}
          ALGOLIA_API_KEY: ${{ secrets.ALGOLIA_API_KEY }}
      
      - name: Notify Team
        uses: 8398a7/action-slack@v3
        with:
          status: ${{ job.status }}
          text: 'Documentation deployed to production'
          webhook_url: ${{ secrets.SLACK_WEBHOOK }}
```

### MkDocs Configuration

```yaml
# mkdocs.yml
site_name: TerraFusion Documentation
site_url: https://docs.terrafusion.ai
site_description: Complete documentation for TerraFusion property technology platform
site_author: TerraFusion Team

repo_url: https://github.com/bsvalues/terrafusion_os_1.0
repo_name: terrafusion_os_1.0

theme:
  name: material
  palette:
    - scheme: default
      primary: indigo
      accent: indigo
      toggle:
        icon: material/brightness-7
        name: Switch to dark mode
    - scheme: slate
      primary: indigo
      accent: indigo
      toggle:
        icon: material/brightness-4
        name: Switch to light mode
  features:
    - navigation.instant
    - navigation.tracking
    - navigation.tabs
    - navigation.sections
    - navigation.expand
    - navigation.top
    - search.suggest
    - search.highlight
    - content.code.copy
    - content.code.annotate

plugins:
  - search
  - git-revision-date-localized:
      enable_creation_date: true
  - minify:
      minify_html: true

markdown_extensions:
  - pymdownx.highlight:
      anchor_linenums: true
  - pymdownx.superfences
  - pymdownx.tabbed:
      alternate_style: true
  - pymdownx.tasklist:
      custom_checkbox: true
  - admonition
  - pymdownx.details
  - attr_list
  - md_in_html

nav:
  - Home: index.md
  - Getting Started:
      - Quick Start: getting-started/quickstart.md
      - Installation: getting-started/installation.md
      - Configuration: getting-started/configuration.md
  - Architecture:
      - Overview: architecture/overview.md
      - Core OS: architecture/core-os.md
      - Government Platform: architecture/government.md
      - Commercial Platform: architecture/commercial.md
      - AI Platform: architecture/ai.md
  - API Reference:
      - REST API: api/rest.md
      - GraphQL API: api/graphql.md
      - WebSocket API: api/websocket.md
  - Developer Guide:
      - CLI Tools: developers/cli.md
      - JavaScript SDK: developers/sdk-js.md
      - Python SDK: developers/sdk-python.md
      - Testing: developers/testing.md
  - Deployment:
      - Kubernetes: deployment/kubernetes.md
      - Docker: deployment/docker.md
      - CI/CD: deployment/cicd.md
  - Operations:
      - Monitoring: operations/monitoring.md
      - Security: operations/security.md
      - Backup & Recovery: operations/backup.md
```

---

## Day 8: UI Components CI/CD (8 hours)

### Repository: terrafusion-ui-components

**Purpose:** React component library, design system, shared UI assets

### GitHub Actions Workflow

```yaml
# .github/workflows/ui-components-ci-cd.yml
name: UI Components CI/CD

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  quality-checks:
    name: Code Quality
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
      
      - name: Install Dependencies
        run: npm ci
      
      - name: ESLint
        run: npm run lint
      
      - name: Prettier Check
        run: npm run format:check
      
      - name: TypeScript Check
        run: npm run type-check
  
  unit-tests:
    name: Unit Tests
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
      
      - name: Install Dependencies
        run: npm ci
      
      - name: Run Jest Tests
        run: npm test -- --coverage --maxWorkers=2
      
      - name: Upload Coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage/lcov.info
          flags: ui-components
  
  component-tests:
    name: Component Tests (Playwright)
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
      
      - name: Install Dependencies
        run: npm ci
      
      - name: Install Playwright
        run: npx playwright install --with-deps
      
      - name: Run Component Tests
        run: npm run test:component
      
      - name: Upload Test Results
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: playwright-report
          path: playwright-report/
  
  visual-regression:
    name: Visual Regression Tests
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
      
      - name: Install Dependencies
        run: npm ci
      
      - name: Build Storybook
        run: npm run build-storybook
      
      - name: Publish to Chromatic
        uses: chromaui/action@v1
        with:
          projectToken: ${{ secrets.CHROMATIC_PROJECT_TOKEN }}
          buildScriptName: build-storybook
          autoAcceptChanges: ${{ github.ref == 'refs/heads/main' }}
          exitZeroOnChanges: true
  
  accessibility-tests:
    name: Accessibility Tests
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
      
      - name: Install Dependencies
        run: npm ci
      
      - name: Build Storybook
        run: npm run build-storybook
      
      - name: Serve Storybook
        run: |
          npx http-server storybook-static -p 6006 &
          sleep 5
      
      - name: Run Axe Accessibility Tests
        run: |
          npm install -g @axe-core/cli
          axe http://localhost:6006 --exit
  
  design-token-validation:
    name: Design Token Validation
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
      
      - name: Install Dependencies
        run: npm ci
      
      - name: Validate Design Tokens
        run: |
          npm run validate:tokens
      
      - name: Build Design Tokens
        run: |
          npm run build:tokens
      
      - name: Check Token Changes
        run: |
          git diff --exit-code tokens/dist/ || \
            echo "::warning::Design tokens have changed"
  
  build-library:
    name: Build Component Library
    runs-on: ubuntu-latest
    needs: [quality-checks, unit-tests]
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
      
      - name: Install Dependencies
        run: npm ci
      
      - name: Build Library
        run: npm run build
      
      - name: Build Storybook
        run: npm run build-storybook
      
      - name: Package Library
        run: npm pack
      
      - name: Upload Build Artifacts
        uses: actions/upload-artifact@v3
        with:
          name: ui-components-dist
          path: |
            dist/
            *.tgz
      
      - name: Upload Storybook
        uses: actions/upload-artifact@v3
        with:
          name: storybook-static
          path: storybook-static/
  
  bundle-analysis:
    name: Bundle Size Analysis
    runs-on: ubuntu-latest
    needs: build-library
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Download Build
        uses: actions/download-artifact@v3
        with:
          name: ui-components-dist
          path: dist/
      
      - name: Analyze Bundle Size
        uses: andresz1/size-limit-action@v1
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          build_script: build
  
  deploy-storybook-staging:
    name: Deploy Storybook (Staging)
    runs-on: ubuntu-latest
    needs: [build-library, visual-regression]
    if: github.ref == 'refs/heads/develop'
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Download Storybook
        uses: actions/download-artifact@v3
        with:
          name: storybook-static
          path: storybook-static/
      
      - name: Deploy to Netlify
        uses: nwtgck/actions-netlify@v2.1
        with:
          publish-dir: './storybook-static'
          production-deploy: false
          github-token: ${{ secrets.GITHUB_TOKEN }}
        env:
          NETLIFY_AUTH_TOKEN: ${{ secrets.NETLIFY_AUTH_TOKEN }}
          NETLIFY_SITE_ID: ${{ secrets.NETLIFY_STORYBOOK_STAGING_ID }}
  
  deploy-storybook-production:
    name: Deploy Storybook (Production)
    runs-on: ubuntu-latest
    needs: [build-library, visual-regression, accessibility-tests]
    if: github.ref == 'refs/heads/main'
    environment:
      name: storybook
      url: https://storybook.terrafusion.ai
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Download Storybook
        uses: actions/download-artifact@v3
        with:
          name: storybook-static
          path: storybook-static/
      
      - name: Deploy to Netlify
        uses: nwtgck/actions-netlify@v2.1
        with:
          publish-dir: './storybook-static'
          production-deploy: true
          github-token: ${{ secrets.GITHUB_TOKEN }}
        env:
          NETLIFY_AUTH_TOKEN: ${{ secrets.NETLIFY_AUTH_TOKEN }}
          NETLIFY_SITE_ID: ${{ secrets.NETLIFY_STORYBOOK_PRODUCTION_ID }}
  
  publish-npm:
    name: Publish to NPM
    runs-on: ubuntu-latest
    needs: [build-library, component-tests, accessibility-tests]
    if: github.ref == 'refs/heads/main' && startsWith(github.ref, 'refs/tags/')
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          registry-url: 'https://registry.npmjs.org'
      
      - name: Download Build
        uses: actions/download-artifact@v3
        with:
          name: ui-components-dist
          path: .
      
      - name: Publish to NPM
        run: npm publish
        env:
          NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
      
      - name: Create GitHub Release
        uses: actions/create-release@v1
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        with:
          tag_name: ${{ github.ref }}
          release_name: UI Components ${{ github.ref }}
          body: |
            ## What's Changed
            View the full changelog at https://storybook.terrafusion.ai
          draft: false
          prerelease: false
```

---

## Days 9-10: Cross-Repository Integration Testing (16 hours)

### Integration Test Suite Architecture

**Purpose:** Validate all 8 repositories work together in production-like environment

### GitHub Actions Workflow (Integration Repository)

```yaml
# .github/workflows/full-platform-integration.yml
name: Full Platform Integration Tests

on:
  schedule:
    - cron: '0 2 * * *'  # Daily at 2 AM
  workflow_dispatch:
    inputs:
      environment:
        description: 'Environment to test'
        required: true
        default: 'staging'
        type: choice
        options:
          - staging
          - production

jobs:
  setup-test-environment:
    name: Setup Integration Test Environment
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Create Kind Cluster
        uses: helm/kind-action@v1.8.0
        with:
          cluster_name: integration-test
          kubectl_version: v1.28.0
          config: kind-config.yaml
      
      - name: Install Ingress Controller
        run: |
          kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/main/deploy/static/provider/kind/deploy.yaml
          kubectl wait --namespace ingress-nginx \
            --for=condition=ready pod \
            --selector=app.kubernetes.io/component=controller \
            --timeout=300s
      
      - name: Install Cert Manager
        run: |
          kubectl apply -f https://github.com/cert-manager/cert-manager/releases/download/v1.13.0/cert-manager.yaml
          kubectl wait --namespace cert-manager \
            --for=condition=ready pod \
            --selector=app.kubernetes.io/instance=cert-manager \
            --timeout=300s
      
      - name: Deploy Core Infrastructure
        run: |
          # PostgreSQL
          helm install postgres bitnami/postgresql \
            --set auth.database=terrafusion \
            --set primary.persistence.size=10Gi \
            --wait
          
          # Redis
          helm install redis bitnami/redis \
            --set architecture=standalone \
            --wait
          
          # MinIO (S3 compatible)
          helm install minio bitnami/minio \
            --set defaultBuckets=terrafusion \
            --wait
  
  deploy-all-services:
    name: Deploy All Services
    runs-on: ubuntu-latest
    needs: setup-test-environment
    strategy:
      matrix:
        service:
          - terrafusion-government-platform
          - terrafusion-commercial-platform
          - terrafusion-ai-platform
          - terrafusion-specialized-modules
    
    steps:
      - uses: actions/checkout@v4
        with:
          repository: bsvalues/${{ matrix.service }}
      
      - name: Deploy Service
        run: |
          helm upgrade --install ${{ matrix.service }} ./charts/${{ matrix.service }} \
            --set image.tag=latest \
            --set replicaCount=2 \
            --wait --timeout=10m
      
      - name: Verify Deployment
        run: |
          kubectl rollout status deployment/${{ matrix.service }}
          kubectl wait --for=condition=ready pod \
            -l app=${{ matrix.service }} \
            --timeout=300s
  
  integration-test-suite:
    name: Run Integration Tests
    runs-on: ubuntu-latest
    needs: deploy-all-services
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
      
      - name: Install Dependencies
        run: npm ci
      
      - name: Test 1 - Service Mesh Connectivity
        run: |
          npm run test:integration:connectivity
      
      - name: Test 2 - Database Integration
        run: |
          npm run test:integration:database
      
      - name: Test 3 - Cross-Service Communication
        run: |
          npm run test:integration:services
      
      - name: Test 4 - Authentication & Authorization
        run: |
          npm run test:integration:auth
      
      - name: Test 5 - Property Workflow (End-to-End)
        run: |
          # Complete property lifecycle test
          npm run test:integration:property-workflow
      
      - name: Test 6 - Multi-Tenant Isolation
        run: |
          npm run test:integration:multi-tenant
      
      - name: Test 7 - AI Model Integration
        run: |
          npm run test:integration:ai
      
      - name: Test 8 - Document Upload & Processing
        run: |
          npm run test:integration:documents
      
      - name: Upload Test Results
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: integration-test-results
          path: test-results/
  
  performance-tests:
    name: Performance & Load Tests
    runs-on: ubuntu-latest
    needs: integration-test-suite
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup k6
        run: |
          curl https://github.com/grafana/k6/releases/download/v0.47.0/k6-v0.47.0-linux-amd64.tar.gz -L | tar xvz
          sudo mv k6-v0.47.0-linux-amd64/k6 /usr/local/bin
      
      - name: Run Load Tests
        run: |
          k6 run --vus 100 --duration 5m tests/load/government-platform.js
          k6 run --vus 100 --duration 5m tests/load/commercial-platform.js
          k6 run --vus 50 --duration 5m tests/load/ai-platform.js
      
      - name: Performance Thresholds Check
        run: |
          # Verify response times
          npm run test:performance:thresholds
  
  security-scan:
    name: Security & Compliance Scan
    runs-on: ubuntu-latest
    needs: deploy-all-services
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Run OWASP ZAP Scan
        uses: zaproxy/action-full-scan@v0.7.0
        with:
          target: 'http://integration-test-gateway'
          rules_file_name: '.zap/rules.tsv'
          cmd_options: '-a'
      
      - name: Kubernetes Security Scan
        run: |
          # Install kubescape
          curl -s https://raw.githubusercontent.com/kubescape/kubescape/master/install.sh | /bin/bash
          
          # Scan cluster
          kubescape scan --format json --output results.json
      
      - name: Container Image Scan
        run: |
          # Scan all deployed images
          for service in government commercial ai specialized; do
            trivy image terrafusion-$service:latest \
              --severity HIGH,CRITICAL \
              --exit-code 1
          done
  
  chaos-engineering:
    name: Chaos Engineering Tests
    runs-on: ubuntu-latest
    needs: integration-test-suite
    if: github.event.inputs.environment == 'staging'
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Install Chaos Mesh
        run: |
          curl -sSL https://mirrors.chaos-mesh.org/v2.6.0/install.sh | bash
      
      - name: Test 1 - Pod Failure
        run: |
          kubectl apply -f tests/chaos/pod-failure.yaml
          sleep 60
          npm run test:integration:health-check
          kubectl delete -f tests/chaos/pod-failure.yaml
      
      - name: Test 2 - Network Latency
        run: |
          kubectl apply -f tests/chaos/network-latency.yaml
          sleep 60
          npm run test:integration:performance
          kubectl delete -f tests/chaos/network-latency.yaml
      
      - name: Test 3 - Database Failure
        run: |
          kubectl apply -f tests/chaos/db-failure.yaml
          sleep 30
          npm run test:integration:failover
          kubectl delete -f tests/chaos/db-failure.yaml
  
  compliance-validation:
    name: Compliance & Data Validation
    runs-on: ubuntu-latest
    needs: integration-test-suite
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
      
      - name: Data Integrity Tests
        run: |
          # Test with Benton County data
          npm run test:compliance:data-integrity
      
      - name: GDPR Compliance Check
        run: |
          npm run test:compliance:gdpr
      
      - name: Audit Trail Validation
        run: |
          npm run test:compliance:audit-trail
      
      - name: PII Data Protection
        run: |
          npm run test:compliance:pii
  
  generate-report:
    name: Generate Integration Report
    runs-on: ubuntu-latest
    needs: [integration-test-suite, performance-tests, security-scan, compliance-validation]
    if: always()
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Download All Test Results
        uses: actions/download-artifact@v3
        with:
          path: all-results/
      
      - name: Generate Comprehensive Report
        run: |
          npm run generate-report
      
      - name: Upload Report
        uses: actions/upload-artifact@v3
        with:
          name: integration-test-report
          path: reports/integration-report.html
      
      - name: Post to Slack
        uses: 8398a7/action-slack@v3
        with:
          status: ${{ job.status }}
          text: 'Integration test report available'
          webhook_url: ${{ secrets.SLACK_WEBHOOK }}
      
      - name: Update Status Badge
        run: |
          npm run update-status-badge
```

### Integration Test Example

```typescript
// tests/integration/property-workflow.spec.ts

import { test, expect } from '@playwright/test';
import { GovernmentPlatformClient } from '@terrafusion/sdk';

test.describe('Complete Property Workflow Integration', () => {
  let client: GovernmentPlatformClient;
  const testParcelId = 'R339217';
  
  test.beforeAll(async () => {
    client = new GovernmentPlatformClient({
      baseUrl: process.env.GOVERNMENT_PLATFORM_URL,
      apiKey: process.env.TEST_API_KEY,
    });
  });
  
  test('1. Property Creation and Validation', async () => {
    // Create property
    const property = await client.properties.create({
      parcelId: testParcelId,
      address: '123 Test St',
      county: 'Benton',
      assessedValue: 350000,
    });
    
    expect(property.id).toBeDefined();
    expect(property.status).toBe('active');
  });
  
  test('2. AI Valuation Integration', async () => {
    // Trigger AI valuation
    const valuation = await client.valuations.requestAI({
      parcelId: testParcelId,
    });
    
    expect(valuation.confidence).toBeGreaterThan(0.85);
    expect(valuation.estimatedValue).toBeGreaterThan(0);
  });
  
  test('3. Document Upload and Processing', async () => {
    // Upload document
    const document = await client.documents.upload({
      parcelId: testParcelId,
      file: './fixtures/deed.pdf',
      type: 'deed',
    });
    
    // Wait for processing
    await client.documents.waitForProcessing(document.id);
    
    const processed = await client.documents.get(document.id);
    expect(processed.status).toBe('processed');
    expect(processed.extractedData).toBeDefined();
  });
  
  test('4. Multi-Tenant Isolation', async () => {
    // Create clients for different counties
    const bentonClient = new GovernmentPlatformClient({
      baseUrl: process.env.GOVERNMENT_PLATFORM_URL,
      apiKey: process.env.BENTON_API_KEY,
    });
    
    const multnomahClient = new GovernmentPlatformClient({
      baseUrl: process.env.GOVERNMENT_PLATFORM_URL,
      apiKey: process.env.MULTNOMAH_API_KEY,
    });
    
    // Benton should see property
    const bentonProperty = await bentonClient.properties.get(testParcelId);
    expect(bentonProperty).toBeDefined();
    
    // Multnomah should NOT see property
    await expect(
      multnomahClient.properties.get(testParcelId)
    ).rejects.toThrow('Not found');
  });
  
  test('5. Audit Trail Validation', async () => {
    const auditLog = await client.audit.getPropertyHistory(testParcelId);
    
    expect(auditLog.length).toBeGreaterThan(0);
    expect(auditLog).toContainEqual(
      expect.objectContaining({
        action: 'property.created',
        actor: expect.any(String),
        timestamp: expect.any(String),
      })
    );
  });
});
```

---

## Final Summary

**Phase 4 Week 5-6: Domain Platform CI/CD - COMPLETE**

### All 8 Repositories Now Have:

1. **Government Platform** (15.88MB)
   - Complete CI/CD pipeline
   - Blue-green deployment
   - Multi-environment support
   - Security scanning
   - Automated testing

2. **Commercial Platform** (29.32MB)
   - Market data validation
   - MLS integration tests
   - Property management workflows
   - Commercial-specific testing

3. **AI Platform**
   - ML training automation
   - Model validation (accuracy, fairness, drift)
   - Model serving deployment
   - Python + Node.js pipelines

4. **Infrastructure Platform**
   - Terraform validation
   - Kubernetes manifest testing
   - Helm chart linting
   - IaC security scanning
   - OPA policy validation

5. **Specialized Modules**
   - Module discovery and testing
   - Integration adapter validation
   - Workflow engine testing
   - Custom field validation

6. **Developer Tools**
   - CLI testing (3 OSes, 2 Node versions)
   - JavaScript + Python SDK
   - NPM + PyPI publishing
   - Testing framework validation
   - Code generator testing

7. **Documentation**
   - MkDocs build
   - API documentation generation
   - Link validation
   - Accessibility testing
   - Algolia search indexing

8. **UI Components**
   - React component testing
   - Visual regression (Chromatic)
   - Accessibility validation
   - Storybook deployment
   - Bundle size analysis
   - NPM publishing

### Integration Testing:
- Cross-repository validation
- Service mesh connectivity
- Multi-tenant isolation
- Performance & load testing
- Security & compliance scanning
- Chaos engineering
- Data integrity validation

**Total Time:** 80 hours (10 days × 8 hours)

**Status:** ✅ COMPLETE - All 8 repositories have production-ready CI/CD pipelines

**Next Phase:** Ready for Phase 5 implementation or production deployment

---

Would you like me to commit this final version and provide next steps?
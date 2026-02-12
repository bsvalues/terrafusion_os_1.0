# GitHub Actions Workflow Fixes - Implementation Guide

**Status**: 🟡 PENDING IMPLEMENTATION  
**Priority**: Medium (Non-blocking for local development)  
**Impact**: Enables CI/CD pipeline functionality

---

## Overview

The TerraFusion OS GitHub Actions workflows contain 10+ syntax and configuration
errors that prevent automated builds, tests, and deployments from running. This
document provides evidence-based fixes for each issue.

---

## Issue #1: Nested Mapping Syntax Errors

**File**: `.github/workflows/ci-build-and-smoke.yml`  
**Lines**: 49, 52  
**Error Type**: YAML syntax error - invalid nested mapping

### Current Code (BROKEN)

```yaml
- name: Run backend tests
  run: |
    dotnet test backend/TerraFusion.sln
      continue-on-error: true  # ❌ Invalid indent - treated as part of run command
```

### Fixed Code

```yaml
- name: Run backend tests
  run: dotnet test backend/TerraFusion.sln
  continue-on-error: true
```

**Explanation**: `continue-on-error` is a step property, not a command. It must
be at the same indentation level as `name` and `run`.

---

## Issue #2: Invalid Action Reference

**File**: `.github/workflows/*.yml` (multiple files)  
**Error**: Invalid action `dtolnay/rust-toolchain-action@stable`  
**Reason**: Action name is incorrect (extra `-action` suffix)

### Current Code (BROKEN)

```yaml
- uses: dtolnay/rust-toolchain-action@stable
```

### Fixed Code

```yaml
- uses: dtolnay/rust-toolchain@stable
  with:
    toolchain: stable
```

**Verification**: Check https://github.com/dtolnay/rust-toolchain for correct
usage

---

## Issue #3: Missing Secrets Handling

**Files**: Multiple workflow files  
**Missing Secrets**:

- `COSIGN_PRIVATE_KEY` (container signing)
- `KUBECONFIG_DEV` (Kubernetes deployment)
- `AZURE_CREDENTIALS` (Azure deployment)

### Current Code (BROKEN)

```yaml
- name: Sign container
  run: cosign sign --key ${{ secrets.COSIGN_PRIVATE_KEY }} ...
  # ❌ Fails if secret not configured
```

### Fixed Code - Option A: Conditional Execution

```yaml
- name: Sign container
  if: ${{ secrets.COSIGN_PRIVATE_KEY != '' }}
  run: |
    echo "🔒 Signing container with Cosign"
    cosign sign --key ${{ secrets.COSIGN_PRIVATE_KEY }} ${{ env.IMAGE_NAME }}

- name: Skip signing (dev mode)
  if: ${{ secrets.COSIGN_PRIVATE_KEY == '' }}
  run: |
    echo "⚠️ COSIGN_PRIVATE_KEY not configured - skipping container signing"
    echo "This is acceptable for development/testing but required for production"
```

### Fixed Code - Option B: Fail Fast with Message

```yaml
- name: Verify required secrets
  run: |
    if [ -z "${{ secrets.COSIGN_PRIVATE_KEY }}" ]; then
      echo "❌ ERROR: COSIGN_PRIVATE_KEY secret not configured"
      echo "Please configure in Settings > Secrets > Actions"
      exit 1
    fi

- name: Sign container
  run: cosign sign --key ${{ secrets.COSIGN_PRIVATE_KEY }} ${{ env.IMAGE_NAME }}
```

**Recommendation**: Use Option A for development, Option B for production
workflows.

---

## Issue #4: Invalid Escape Sequences

**File**: `.github/workflows/*.yml` (multiple files)  
**Error**: Invalid escape sequences like `\n` in YAML strings

### Current Code (BROKEN)

```yaml
- name: Notify failure
  run: echo "Build failed\nCheck logs for details"
  # ❌ Escape sequence not processed correctly
```

### Fixed Code

```yaml
- name: Notify failure
  run: |
    echo "Build failed"
    echo "Check logs for details"
```

**Explanation**: Use YAML multiline strings (`|` or `>`) instead of escape
sequences for better readability and correct processing.

---

## Issue #5: Outdated Action Versions

**Problem**: Workflows use outdated action versions with security
vulnerabilities

### Current Code

```yaml
- uses: actions/checkout@v2
- uses: actions/setup-dotnet@v1
```

### Fixed Code

```yaml
- uses: actions/checkout@v4
- uses: actions/setup-dotnet@v4
  with:
    dotnet-version: '8.0.x'
```

**Action Version Reference**: | Action | Current (Broken) | Latest (Fixed) |
|--------|-----------------|---------------| | actions/checkout | v2 | v4 | |
actions/setup-dotnet | v1 | v4 | | actions/setup-node | v2 | v4 | |
docker/build-push-action | v2 | v5 |

---

## Complete Fixed Workflow Example

**File**: `.github/workflows/ci-build-test.yml`

```yaml
name: TerraFusion OS - Build and Test

on:
  push:
    branches: [main, develop, 'feature/**']
  pull_request:
    branches: [main, develop]

env:
  DOTNET_VERSION: '8.0.x'
  NODE_VERSION: '20.x'

jobs:
  build-backend:
    name: Build .NET Backend
    runs-on: ubuntu-latest

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup .NET
        uses: actions/setup-dotnet@v4
        with:
          dotnet-version: ${{ env.DOTNET_VERSION }}

      - name: Restore dependencies
        run: dotnet restore backend/TerraFusion.sln

      - name: Build solution
        run:
          dotnet build backend/TerraFusion.sln --no-restore --configuration
          Release

      - name: Run tests
        run:
          dotnet test backend/TerraFusion.sln --no-build --configuration Release
          --logger "trx;LogFileName=test-results.trx"
        continue-on-error: false # Fail workflow if tests fail

      - name: Publish test results
        if: always()
        uses: dorny/test-reporter@v1
        with:
          name: Backend Test Results
          path: '**/test-results.trx'
          reporter: dotnet-trx

  build-frontend:
    name: Build React Frontend
    runs-on: ubuntu-latest

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'
          cache-dependency-path: frontend/package-lock.json

      - name: Install dependencies
        working-directory: frontend
        run: npm ci

      - name: Build frontend
        working-directory: frontend
        run: npm run build

      - name: Run frontend tests
        working-directory: frontend
        run: npm test -- --coverage
        continue-on-error: false

  security-scan:
    name: Security Vulnerability Scan
    runs-on: ubuntu-latest
    needs: [build-backend, build-frontend]

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Run Trivy vulnerability scanner
        uses: aquasecurity/trivy-action@master
        with:
          scan-type: 'fs'
          scan-ref: '.'
          format: 'sarif'
          output: 'trivy-results.sarif'

      - name: Upload Trivy results to GitHub Security
        uses: github/codeql-action/upload-sarif@v3
        if: always()
        with:
          sarif_file: 'trivy-results.sarif'

  deploy-dev:
    name: Deploy to Development
    runs-on: ubuntu-latest
    needs: [build-backend, build-frontend, security-scan]
    if: github.ref == 'refs/heads/develop'

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Azure Login
        if: ${{ secrets.AZURE_CREDENTIALS != '' }}
        uses: azure/login@v2
        with:
          creds: ${{ secrets.AZURE_CREDENTIALS }}

      - name: Deploy to Azure App Service
        if: ${{ secrets.AZURE_CREDENTIALS != '' }}
        uses: azure/webapps-deploy@v3
        with:
          app-name: 'terrafusion-dev'
          package: './backend/publish'

      - name: Skip deployment (no credentials)
        if: ${{ secrets.AZURE_CREDENTIALS == '' }}
        run: |
          echo "⚠️ Skipping Azure deployment - AZURE_CREDENTIALS not configured"
          echo "To enable deployment, add AZURE_CREDENTIALS secret in repository settings"
```

---

## Implementation Checklist

### Phase 1: Syntax Fixes (Quick Wins)

- [ ] Fix nested mapping errors in ci-build-and-smoke.yml (lines 49, 52)
- [ ] Replace invalid action `dtolnay/rust-toolchain-action@stable` with correct
      reference
- [ ] Replace escape sequences with multiline strings
- [ ] Update all action versions to latest (v4 for most GitHub actions)

### Phase 2: Secret Management

- [ ] Add conditional checks for all secret-dependent steps
- [ ] Document required secrets in README.md
- [ ] Add secret validation step at workflow start
- [ ] Create development-friendly fallback behaviors

### Phase 3: Testing & Validation

- [ ] Test workflows in fork with limited secrets
- [ ] Verify conditional execution paths work correctly
- [ ] Validate test result reporting
- [ ] Confirm deployment workflows skip correctly when secrets missing

### Phase 4: Production Hardening

- [ ] Configure all required secrets in repository settings
- [ ] Enable required status checks for protected branches
- [ ] Add Dependabot for automated dependency updates
- [ ] Set up GitHub Security scanning (CodeQL)

---

## Required GitHub Secrets Configuration

To enable full CI/CD functionality, configure these secrets in **Settings >
Secrets > Actions**:

### Container Registry & Signing

```bash
COSIGN_PRIVATE_KEY       # Cosign private key for container signing
COSIGN_PUBLIC_KEY        # Cosign public key for verification
DOCKER_USERNAME          # Docker Hub username
DOCKER_PASSWORD          # Docker Hub password or access token
```

### Cloud Deployment

```bash
AZURE_CREDENTIALS        # Azure service principal JSON
KUBECONFIG_DEV           # Kubernetes config for development cluster
KUBECONFIG_PROD          # Kubernetes config for production cluster
```

### API Keys & Tokens

```bash
GITHUB_TOKEN             # Automatically provided by GitHub Actions
SONAR_TOKEN              # SonarQube/SonarCloud token (optional)
SLACK_WEBHOOK            # Slack notification webhook (optional)
```

### Generate Azure Credentials

```bash
az ad sp create-for-rbac \
  --name "terrafusion-github-actions" \
  --role contributor \
  --scopes /subscriptions/{subscription-id}/resourceGroups/{resource-group} \
  --sdk-auth
```

### Generate Cosign Keys

```bash
cosign generate-key-pair
# Creates cosign.key (private) and cosign.pub (public)
# Add cosign.key content to COSIGN_PRIVATE_KEY secret
```

---

## Verification Commands

### Local YAML Validation

```bash
# Install actionlint
brew install actionlint  # macOS
# OR
go install github.com/rhysd/actionlint/cmd/actionlint@latest

# Validate workflows
actionlint .github/workflows/*.yml
```

### Test Workflow Syntax

```bash
# Using act (local GitHub Actions runner)
brew install act
act -l  # List available workflows
act -j build-backend  # Test specific job locally
```

---

## Monitoring & Alerts

### Recommended Integrations

1. **GitHub Actions Status Badge**

```markdown
[![Build Status](https://github.com/your-org/terrafusion_os/workflows/CI/badge.svg)](https://github.com/your-org/terrafusion_os/actions)
```

2. **Slack Notifications**

```yaml
- name: Notify Slack on failure
  if: failure()
  uses: slackapi/slack-github-action@v1
  with:
    webhook-url: ${{ secrets.SLACK_WEBHOOK }}
    payload: |
      {
        "text": "❌ TerraFusion OS build failed",
        "blocks": [
          {
            "type": "section",
            "text": {
              "type": "mrkdwn",
              "text": "*Build Failed*\nWorkflow: ${{ github.workflow }}\nBranch: ${{ github.ref }}"
            }
          }
        ]
      }
```

---

## Rollout Strategy

### Step 1: Create Feature Branch

```bash
git checkout -b fix/github-actions-workflows
```

### Step 2: Apply Fixes Incrementally

```bash
# Fix syntax errors first
git add .github/workflows/ci-build-and-smoke.yml
git commit -m "fix(ci): resolve YAML syntax errors in ci-build-and-smoke workflow"

# Update action versions
git add .github/workflows/*.yml
git commit -m "chore(ci): update GitHub Actions to latest versions"

# Add secret handling
git add .github/workflows/*.yml
git commit -m "feat(ci): add conditional execution for missing secrets"
```

### Step 3: Test in Fork/Branch

```bash
# Push to feature branch and verify workflows run
git push origin fix/github-actions-workflows

# Check Actions tab on GitHub to verify execution
```

### Step 4: Merge to Main

```bash
# Create PR for review
gh pr create --title "Fix GitHub Actions workflows" --body "Resolves syntax errors, updates actions, adds secret handling"

# After approval and passing checks
gh pr merge --squash
```

---

## Expected Outcomes

### After Implementation

✅ All GitHub Actions workflows pass syntax validation  
✅ Automated builds run on every push/PR  
✅ Test results published to GitHub UI  
✅ Security scans integrated into CI pipeline  
✅ Deployment workflows ready for production use  
✅ Clear documentation for secret configuration

### Success Metrics

- **Workflow Success Rate**: >95% (excluding flaky tests)
- **Build Time**: <10 minutes for full CI pipeline
- **Secret Coverage**: 100% of required secrets documented
- **Zero Blocking Errors**: All syntax/configuration errors resolved

---

## Support Resources

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [YAML Syntax Validator](https://www.yamllint.com/)
- [actionlint - GitHub Actions Linter](https://github.com/rhysd/actionlint)
- [act - Local GitHub Actions Runner](https://github.com/nektos/act)

---

_Part of TerraFusion OS Build Success Report_  
_Generated by TerraFusion Elite Government OS Engineering Agent_

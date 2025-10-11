# 🔧 Phase 4A Implementation Guide: Core Repository CI/CD

**Repository:** terrafusion-core  
**Type:** Foundation library (npm + PyPI package)  
**Status:** 🔄 **IN PROGRESS**

---

## 📋 Implementation Checklist

### Step 1: Create GitHub Actions Workflow Directory
```powershell
# Clone the repository
cd C:\Temp
git clone https://github.com/bsvalues/terrafusion-core.git
cd terrafusion-core

# Create GitHub Actions directory
New-Item -ItemType Directory -Path .github\workflows -Force
```

### Step 2: Create CI/CD Workflow File

Create `.github/workflows/ci.yml` with the following content:

---

## 📄 Workflow File: `.github/workflows/ci.yml`

```yaml
name: CI/CD Pipeline

on:
  push:
    branches: [main, develop]
    tags:
      - 'v*'
  pull_request:
    branches: [main, develop]
  workflow_dispatch:

env:
  NODE_VERSION: '18'
  PYTHON_VERSION: '3.11'

jobs:
  # ============================================
  # JOB 1: Lint and Type Check
  # ============================================
  lint:
    name: Lint & Type Check
    runs-on: ubuntu-latest
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run ESLint
        run: npm run lint
      
      - name: Run Prettier check
        run: npm run format:check
      
      - name: TypeScript type check
        run: npm run type-check

  # ============================================
  # JOB 2: Unit Tests (Node.js/TypeScript)
  # ============================================
  test-node:
    name: Test (Node.js)
    runs-on: ubuntu-latest
    
    strategy:
      matrix:
        node-version: [18, 20]
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
      
      - name: Setup Node.js ${{ matrix.node-version }}
        uses: actions/setup-node@v4
        with:
          node-version: ${{ matrix.node-version }}
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run tests with coverage
        run: npm run test:coverage
      
      - name: Upload coverage to Codecov
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage/coverage-final.json
          flags: nodejs-${{ matrix.node-version }}
      
      - name: Check coverage threshold (80%)
        run: |
          COVERAGE=$(jq '.total.lines.pct' coverage/coverage-summary.json)
          echo "Coverage: $COVERAGE%"
          if (( $(echo "$COVERAGE < 80" | bc -l) )); then
            echo "❌ Coverage $COVERAGE% is below 80% threshold"
            exit 1
          fi
          echo "✅ Coverage $COVERAGE% meets 80% threshold"

  # ============================================
  # JOB 3: Unit Tests (Python)
  # ============================================
  test-python:
    name: Test (Python)
    runs-on: ubuntu-latest
    
    strategy:
      matrix:
        python-version: ['3.10', '3.11', '3.12']
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
      
      - name: Setup Python ${{ matrix.python-version }}
        uses: actions/setup-python@v5
        with:
          python-version: ${{ matrix.python-version }}
          cache: 'pip'
      
      - name: Install dependencies
        run: |
          pip install -e .
          pip install pytest pytest-cov pylint black
      
      - name: Run pylint
        run: pylint src/ --fail-under=8.0
      
      - name: Run black check
        run: black --check src/
      
      - name: Run pytest with coverage
        run: pytest --cov=src --cov-report=xml --cov-report=term
      
      - name: Upload coverage to Codecov
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage.xml
          flags: python-${{ matrix.python-version }}

  # ============================================
  # JOB 4: Security Scan
  # ============================================
  security:
    name: Security Scan
    runs-on: ubuntu-latest
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run npm audit
        run: npm audit --audit-level=moderate
        continue-on-error: true
      
      - name: Run Snyk security scan
        uses: snyk/actions/node@master
        continue-on-error: true
        env:
          SNYK_TOKEN: ${{ secrets.SNYK_TOKEN }}
      
      - name: Setup Python
        uses: actions/setup-python@v5
        with:
          python-version: ${{ env.PYTHON_VERSION }}
      
      - name: Run pip audit
        run: |
          pip install pip-audit
          pip-audit
        continue-on-error: true

  # ============================================
  # JOB 5: Build
  # ============================================
  build:
    name: Build
    needs: [lint, test-node, test-python, security]
    runs-on: ubuntu-latest
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Build TypeScript
        run: npm run build
      
      - name: Verify build output
        run: |
          if [ ! -d "dist" ]; then
            echo "❌ Build failed: dist/ directory not found"
            exit 1
          fi
          echo "✅ Build successful: dist/ directory exists"
          ls -la dist/
      
      - name: Upload build artifacts
        uses: actions/upload-artifact@v3
        with:
          name: dist-${{ github.sha }}
          path: dist/
          retention-days: 7

  # ============================================
  # JOB 6: Publish to npm (on version tag)
  # ============================================
  publish-npm:
    name: Publish to npm
    needs: [build]
    if: startsWith(github.ref, 'refs/tags/v')
    runs-on: ubuntu-latest
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          registry-url: 'https://registry.npmjs.org'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Build
        run: npm run build
      
      - name: Extract version from tag
        id: get_version
        run: echo "VERSION=${GITHUB_REF#refs/tags/v}" >> $GITHUB_OUTPUT
      
      - name: Verify package.json version matches tag
        run: |
          PKG_VERSION=$(node -p "require('./package.json').version")
          TAG_VERSION=${{ steps.get_version.outputs.VERSION }}
          if [ "$PKG_VERSION" != "$TAG_VERSION" ]; then
            echo "❌ Version mismatch: package.json=$PKG_VERSION, tag=$TAG_VERSION"
            exit 1
          fi
          echo "✅ Version match: $PKG_VERSION"
      
      - name: Publish to npm
        run: npm publish --access public
        env:
          NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
      
      - name: Create GitHub Release
        uses: softprops/action-gh-release@v1
        with:
          generate_release_notes: true

  # ============================================
  # JOB 7: Publish to PyPI (on version tag)
  # ============================================
  publish-pypi:
    name: Publish to PyPI
    needs: [build]
    if: startsWith(github.ref, 'refs/tags/v')
    runs-on: ubuntu-latest
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
      
      - name: Setup Python
        uses: actions/setup-python@v5
        with:
          python-version: ${{ env.PYTHON_VERSION }}
      
      - name: Install build tools
        run: |
          pip install build twine
      
      - name: Build distribution
        run: python -m build
      
      - name: Check distribution
        run: twine check dist/*
      
      - name: Publish to PyPI
        uses: pypa/gh-action-pypi-publish@release/v1
        with:
          password: ${{ secrets.PYPI_TOKEN }}

  # ============================================
  # JOB 8: Notify Slack
  # ============================================
  notify:
    name: Notify Slack
    needs: [build]
    if: always()
    runs-on: ubuntu-latest
    
    steps:
      - name: Send Slack notification
        uses: slackapi/slack-github-action@v1
        with:
          payload: |
            {
              "text": "CI/CD Pipeline: ${{ needs.build.result }}",
              "blocks": [
                {
                  "type": "section",
                  "text": {
                    "type": "mrkdwn",
                    "text": "*TerraFusion Core CI/CD*\nStatus: ${{ needs.build.result }}\nBranch: ${{ github.ref_name }}\nCommit: ${{ github.sha }}\nActor: ${{ github.actor }}"
                  }
                }
              ]
            }
        env:
          SLACK_WEBHOOK_URL: ${{ secrets.SLACK_WEBHOOK_URL }}
```

---

## 📄 Dependabot Configuration: `.github/dependabot.yml`

```yaml
version: 2
updates:
  # npm dependencies
  - package-ecosystem: "npm"
    directory: "/"
    schedule:
      interval: "weekly"
      day: "monday"
      time: "09:00"
    open-pull-requests-limit: 5
    reviewers:
      - "terrafusion-platform-team"
    labels:
      - "dependencies"
      - "automated"
    commit-message:
      prefix: "chore(deps):"
    versioning-strategy: increase

  # Python dependencies
  - package-ecosystem: "pip"
    directory: "/"
    schedule:
      interval: "weekly"
      day: "monday"
      time: "09:00"
    open-pull-requests-limit: 5
    reviewers:
      - "terrafusion-platform-team"
    labels:
      - "dependencies"
      - "automated"
    commit-message:
      prefix: "chore(deps):"

  # GitHub Actions
  - package-ecosystem: "github-actions"
    directory: "/"
    schedule:
      interval: "monthly"
    reviewers:
      - "terrafusion-platform-team"
    labels:
      - "dependencies"
      - "ci-cd"
```

---

## 📄 CodeQL Security Analysis: `.github/workflows/codeql.yml`

```yaml
name: CodeQL Security Analysis

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]
  schedule:
    - cron: '0 6 * * 1'  # Every Monday at 6am UTC

jobs:
  analyze:
    name: Analyze
    runs-on: ubuntu-latest
    permissions:
      actions: read
      contents: read
      security-events: write

    strategy:
      fail-fast: false
      matrix:
        language: ['javascript', 'python']

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Initialize CodeQL
        uses: github/codeql-action/init@v2
        with:
          languages: ${{ matrix.language }}

      - name: Autobuild
        uses: github/codeql-action/autobuild@v2

      - name: Perform CodeQL Analysis
        uses: github/codeql-action/analyze@v2
```

---

## 🔐 Required GitHub Secrets Setup

### Navigate to Repository Settings

1. Go to: `https://github.com/bsvalues/terrafusion-core/settings/secrets/actions`
2. Click "New repository secret"
3. Add the following secrets:

### Secret 1: NPM_TOKEN

```
Name: NPM_TOKEN
Value: [Your npm authentication token]
```

**How to get npm token:**
```bash
# Login to npm
npm login

# Generate token
npm token create --read-only=false
```

### Secret 2: PYPI_TOKEN

```
Name: PYPI_TOKEN
Value: [Your PyPI API token]
```

**How to get PyPI token:**
1. Go to https://pypi.org/manage/account/token/
2. Click "Add API token"
3. Name: "terrafusion-core-ci"
4. Scope: "Project: terrafusion-core"
5. Copy the token (starts with `pypi-`)

### Secret 3: SLACK_WEBHOOK_URL

```
Name: SLACK_WEBHOOK_URL
Value: [Your Slack incoming webhook URL]
```

**How to get Slack webhook:**
1. Go to https://api.slack.com/apps
2. Create app or select existing
3. Enable "Incoming Webhooks"
4. Click "Add New Webhook to Workspace"
5. Select channel: `#terrafusion-ci-cd`
6. Copy webhook URL

### Secret 4: SNYK_TOKEN (Optional)

```
Name: SNYK_TOKEN
Value: [Your Snyk API token]
```

**How to get Snyk token:**
1. Sign up at https://snyk.io
2. Go to Account Settings → API Token
3. Copy token

---

## 🛡️ Branch Protection Rules

### Navigate to Branch Settings

1. Go to: `https://github.com/bsvalues/terrafusion-core/settings/branches`
2. Click "Add rule" for `main` branch

### Protection Rules to Enable

```yaml
Branch name pattern: main

✅ Require a pull request before merging
   ✅ Require approvals: 1
   ✅ Dismiss stale pull request approvals when new commits are pushed
   ✅ Require review from Code Owners

✅ Require status checks to pass before merging
   ✅ Require branches to be up to date before merging
   Required status checks:
      - Lint & Type Check
      - Test (Node.js)
      - Test (Python)
      - Security Scan
      - Build

✅ Require conversation resolution before merging

✅ Require signed commits

✅ Include administrators

✅ Restrict who can push to matching branches
   Teams: terrafusion-platform-team
```

---

## 📝 Package.json Scripts (Required)

Ensure `package.json` has these scripts:

```json
{
  "scripts": {
    "build": "tsc",
    "test": "vitest run",
    "test:coverage": "vitest run --coverage",
    "test:watch": "vitest",
    "lint": "eslint src/**/*.ts",
    "lint:fix": "eslint src/**/*.ts --fix",
    "format": "prettier --write \"src/**/*.{ts,js,json,md}\"",
    "format:check": "prettier --check \"src/**/*.{ts,js,json,md}\"",
    "type-check": "tsc --noEmit"
  }
}
```

---

## 🧪 Testing the Workflow

### Test 1: Push to Develop Branch

```bash
cd C:\Temp\terrafusion-core

# Create test branch
git checkout -b test-ci-cd

# Add workflow files
git add .github/

# Commit
git commit -m "chore: Add CI/CD workflows"

# Push
git push -u origin test-ci-cd
```

**Expected:** Workflow runs on push, all jobs execute

### Test 2: Create Pull Request

1. Go to GitHub and create PR from `test-ci-cd` → `main`
2. Watch status checks run
3. Verify all checks pass

**Expected:** PR shows all required status checks passing

### Test 3: Release Publishing

```bash
# Update version in package.json
npm version patch  # Or minor, major

# Push tag
git push --tags
```

**Expected:** Workflow publishes to npm and PyPI

---

## 📊 Monitoring & Validation

### View Workflow Runs

- URL: `https://github.com/bsvalues/terrafusion-core/actions`
- Monitor: Build times, success rates, failures

### Codecov Dashboard

- URL: `https://app.codecov.io/gh/bsvalues/terrafusion-core`
- Monitor: Test coverage trends

### Slack Notifications

- Channel: `#terrafusion-ci-cd`
- Watch for: Build notifications

---

## ✅ Success Criteria

- [ ] CI/CD workflow created and committed
- [ ] All required secrets configured
- [ ] Branch protection rules enabled
- [ ] Dependabot configured
- [ ] CodeQL security analysis running
- [ ] Test push triggers workflow successfully
- [ ] All quality gates pass (lint, test, security, build)
- [ ] Build time <5 minutes
- [ ] Coverage >80%
- [ ] Slack notifications working
- [ ] Test release publishes successfully

---

## 🚀 Next Steps

After terrafusion-core is complete:
1. Apply same workflow to terrafusion-shared
2. Adjust for each repository's specific needs
3. Test end-to-end publishing flow
4. Document any issues/learnings
5. Move to Phase 4B (Domain Platforms)

---

**Status:** 🔄 IN PROGRESS  
**Estimated Time:** 2-4 hours  
**Next:** Configure secrets and test workflow

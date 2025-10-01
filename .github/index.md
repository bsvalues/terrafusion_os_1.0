# .github Directory Index

## Directory Overview

**Location**: `/.github/`  
**Purpose**: GitHub repository configuration, CI/CD automation, and community
guidelines  
**Classification**: Repository Management and DevOps Automation  
**Security Level**: Government-Grade CI/CD Pipeline

## Architecture Summary

### Primary Components

```
.github/
├── workflows/                          # GitHub Actions CI/CD pipelines
│   ├── ci-cd.yml                      # Main CI/CD pipeline
│   ├── backend-tests.yml              # Backend testing automation
│   ├── benton-demo.yml                # Benton County demonstration
│   ├── branch-protection.yml          # Branch protection automation
│   ├── deployment.yml                 # Production deployment
│   └── security-scan.yml              # Security scanning automation
├── ISSUE_TEMPLATE/                     # Issue template configuration
│   ├── bug_report.yml                 # Bug report template
│   ├── feature_request.yml            # Feature request template
│   ├── security_report.yml            # Security vulnerability template
│   └── config.yml                     # Issue template configuration
├── codeql/                            # CodeQL security analysis
│   └── codeql-config.yml              # CodeQL configuration
├── CODEOWNERS                         # Code ownership definitions
├── SECURITY.md                        # Security policy and reporting
├── pull_request_template.md           # PR template
└── REPOSITORY_SETUP.md                # Repository setup documentation
```

### Key Capabilities

- **Government CI/CD**: FISMA-compliant automated testing and deployment
- **Security Automation**: CodeQL scanning, vulnerability detection, compliance
  validation
- **Multi-Environment Deployment**: Development, staging, production pipelines
- **Quality Gates**: Automated testing, code quality, security scanning
- **Community Management**: Issue templates, PR workflows, code ownership

## CI/CD Pipeline Architecture

### Main CI/CD Workflow (`workflows/ci-cd.yml`)

```yaml
name: TerraFusion CI/CD
on:
  push:
    branches: [main, develop]
    tags: ['v*']
  pull_request:
    branches: [main, develop]
  workflow_dispatch:

env:
  DOCKER_REGISTRY: ghcr.io
  DOCKER_IMAGE_PREFIX: ${{ github.repository_owner }}/terrafusion
```

### Multi-Job Pipeline Structure

```yaml
jobs:
  backend-test: # .NET backend testing
    runs-on: ubuntu-latest
    steps:
      - Setup .NET 8.0
      - Restore dependencies
      - Build backend (Release configuration)
      - Run test suite with coverage
      - Upload test results and coverage

  frontend-test: # React frontend testing
    runs-on: ubuntu-latest
    steps:
      - Setup Node.js 18
      - Install dependencies
      - Run ESLint and Prettier
      - Execute Jest test suite
      - Run Playwright E2E tests
      - Upload test artifacts

  security-scan: # Security and compliance
    runs-on: ubuntu-latest
    steps:
      - CodeQL security analysis
      - Dependency vulnerability scan
      - Government compliance validation
      - Security artifact upload

  build-containers: # Container building
    runs-on: ubuntu-latest
    needs: [backend-test, frontend-test, security-scan]
    steps:
      - Build multi-stage Docker containers
      - Security scan container images
      - Push to GitHub Container Registry
      - Generate deployment manifests

  deploy-staging: # Staging deployment
    runs-on: ubuntu-latest
    needs: build-containers
    if: github.ref == 'refs/heads/develop'
    steps:
      - Deploy to staging environment
      - Run integration tests
      - Performance benchmarking
      - Government compliance validation

  deploy-production: # Production deployment
    runs-on: ubuntu-latest
    needs: build-containers
    if: startsWith(github.ref, 'refs/tags/v')
    environment: production
    steps:
      - Deploy to production environment
      - Government approval workflow
      - Production smoke tests
      - Monitoring and alerting setup
```

## Security and Compliance Framework

### Security Policy (`SECURITY.md`)

```markdown
# Government-Grade Security Standards

- FISMA (Federal Information Security Management Act)
- NIST Cybersecurity Framework
- SOC 2 Type II compliance
- FedRAMP (Federal Risk and Authorization Management Program)
- GDPR (General Data Protection Regulation)

# Security Features

- Zero-Trust Architecture implementation
- AES-256 encryption for data at rest and in transit
- JWT authentication with secure token management
- Role-based access control (RBAC)
- Comprehensive audit logging
```

### CodeQL Security Analysis (`codeql/codeql-config.yml`)

```yaml
name: 'TerraFusion Security Analysis'
disable-default-queries: false
queries:
  - name: security-and-quality
    uses: security-and-quality
  - name: government-compliance
    uses: ./.github/queries/government-security.ql

paths-ignore:
  - node_modules
  - '**/test/**'
  - '**/coverage/**'

paths:
  - backend/**/*.cs
  - frontend/src/**/*.ts
  - frontend/src/**/*.tsx
```

### Issue Template Configuration

#### Bug Report Template (`ISSUE_TEMPLATE/bug_report.yml`)

```yaml
name: 🐛 Bug Report
description: Report a bug in TerraFusion OS
title: '[BUG]: '
labels: ['bug', 'triage-needed']
assignees: ['security-team']

body:
  - type: markdown
    attributes:
      value: |
        ## 🔒 Security Notice
        **DO NOT** report security vulnerabilities here. 
        Email: security@bsvalues.com for security issues.

  - type: textarea
    id: description
    attributes:
      label: Bug Description
      description: Detailed description of the bug
      placeholder: Describe what happened vs. what you expected
    validations:
      required: true

  - type: dropdown
    id: severity
    attributes:
      label: Severity Level
      options:
        - Critical (System Down)
        - High (Major Feature Broken)
        - Medium (Minor Feature Issue)
        - Low (Cosmetic Issue)
    validations:
      required: true
```

#### Feature Request Template (`ISSUE_TEMPLATE/feature_request.yml`)

```yaml
name: 🚀 Feature Request
description: Suggest a new feature for TerraFusion OS
title: '[FEATURE]: '
labels: ['enhancement', 'feature-request']

body:
  - type: textarea
    id: problem
    attributes:
      label: Problem Statement
      description: What problem does this feature solve?
      placeholder: As a government user, I need...
    validations:
      required: true

  - type: textarea
    id: solution
    attributes:
      label: Proposed Solution
      description: Describe your proposed solution
      placeholder: I propose we implement...
    validations:
      required: true

  - type: dropdown
    id: government-impact
    attributes:
      label: Government Impact
      options:
        - High (Critical for government operations)
        - Medium (Improves government efficiency)
        - Low (Nice to have enhancement)
    validations:
      required: true
```

#### Security Report Template (`ISSUE_TEMPLATE/security_report.yml`)

```yaml
name: 🔒 Security Vulnerability
description: Report a security vulnerability (PRIVATE ISSUES ONLY)
title: '[SECURITY]: '
labels: ['security', 'critical']
assignees: ['security-team', 'cto']

body:
  - type: markdown
    attributes:
      value: |
        ## ⚠️ CRITICAL SECURITY NOTICE
        This template is for **NON-SENSITIVE** security discussions only.

        For actual vulnerabilities, email: **security@bsvalues.com**

  - type: textarea
    id: security-concern
    attributes:
      label: Security Concern
      description: Describe the security-related concern (non-sensitive)
      placeholder: I have a question about security best practices...
    validations:
      required: true
```

## Code Ownership and Review Process

### Code Owners Configuration (`CODEOWNERS`)

```text
# Global owners
* @cto @lead-architect

# Backend code ownership
backend/ @backend-team @security-team
backend/TerraFusion.Security/ @security-team @cto

# Frontend code ownership
frontend/ @frontend-team @ux-team
frontend/src/components/security/ @security-team

# AI and government modules
ai-models/ @ai-team @government-liaison
modules/ @module-team @government-liaison

# Infrastructure and deployment
.github/ @devops-team @security-team
docker-compose*.yml @devops-team @security-team
kubernetes/ @devops-team @platform-team

# Security and compliance
SECURITY.md @security-team @cto
.github/workflows/security-*.yml @security-team @devops-team

# Government compliance
docs/compliance/ @compliance-team @legal-team
government/ @government-liaison @compliance-team
```

## Specialized Workflows

### Benton County Demo Workflow (`workflows/benton-demo.yml`)

```yaml
name: Benton County Demo
on:
  schedule:
    - cron: '0 8 * * MON-FRI' # Daily at 8 AM PST
  workflow_dispatch:
    inputs:
      demo-type:
        description: 'Demo Type'
        required: true
        default: 'full'
        type: choice
        options:
          - full
          - ai-swarm
          - harris-pacs
          - revenue-optimization

jobs:
  deploy-demo:
    runs-on: ubuntu-latest
    environment: benton-demo

    steps:
      - name: Setup Benton County Environment
        run: |
          ./ops/benton-demo.sh --mode=${{ github.event.inputs.demo-type }}

      - name: Validate Harris PACS Integration
        run: |
          ./scripts/test-harris-pacs-integration.sh

      - name: Deploy 1,008 AI Agents
        run: |
          ./scripts/activate-ai-swarm-full-implementation.sh

      - name: Run Government Compliance Tests
        run: |
          npm run test:compliance
          dotnet test --filter="Category=Government"

      - name: Generate Demo Report
        run: |
          ./scripts/generate-demo-report.sh
        env:
          DEMO_TYPE: ${{ github.event.inputs.demo-type }}
```

### Security Scanning Workflow (`workflows/security-scan.yml`)

```yaml
name: Security Scanning
on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]
  schedule:
    - cron: '0 2 * * *' # Daily at 2 AM

jobs:
  codeql-analysis:
    runs-on: ubuntu-latest
    permissions:
      actions: read
      contents: read
      security-events: write

    steps:
      - name: Initialize CodeQL
        uses: github/codeql-action/init@v2
        with:
          languages: csharp, javascript
          config-file: ./.github/codeql/codeql-config.yml

      - name: Build for Analysis
        run: |
          dotnet build backend/TerraFusion.sln
          npm run build

      - name: Perform CodeQL Analysis
        uses: github/codeql-action/analyze@v2

  dependency-scan:
    runs-on: ubuntu-latest

    steps:
      - name: .NET Dependency Scan
        run: |
          dotnet restore backend/TerraFusion.sln
          dotnet list package --vulnerable --include-transitive

      - name: Node.js Dependency Scan
        run: |
          npm install
          npm audit --audit-level high

      - name: Government Compliance Scan
        run: |
          ./scripts/compliance-scan.sh --framework=FISMA
```

## Branch Protection and Quality Gates

### Branch Protection Workflow (`workflows/branch-protection.yml`)

```yaml
name: Branch Protection
on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  enforce-quality-gates:
    runs-on: ubuntu-latest

    steps:
      - name: Code Quality Gate
        run: |
          npm run lint -- --max-warnings 0
          dotnet format --verify-no-changes

      - name: Test Coverage Gate
        run: |
          npm run test:coverage -- --coverageThreshold 80
          dotnet test --collect:"XPlat Code Coverage" /p:Threshold=80

      - name: Security Gate
        run: |
          npm audit --audit-level high
          dotnet list package --vulnerable

      - name: Government Compliance Gate
        run: |
          ./scripts/validate-government-compliance.sh
          ./scripts/validate-accessibility.sh
```

## Deployment Automation

### Production Deployment Workflow (`workflows/deployment.yml`)

```yaml
name: Production Deployment
on:
  release:
    types: [published]
  workflow_dispatch:
    inputs:
      environment:
        description: 'Deployment Environment'
        required: true
        default: 'production'
        type: choice
        options:
          - staging
          - production
          - government-cloud

jobs:
  deploy:
    runs-on: ubuntu-latest
    environment: ${{ github.event.inputs.environment || 'production' }}

    steps:
      - name: Government Approval Check
        run: |
          ./scripts/validate-government-approval.sh

      - name: Security Validation
        run: |
          ./scripts/pre-deployment-security-scan.sh

      - name: Deploy to Environment
        run: |
          ./deployment/deploy.sh --env=${{ github.event.inputs.environment }}

      - name: Post-Deployment Validation
        run: |
          ./scripts/post-deployment-tests.sh
          ./scripts/validate-government-compliance.sh

      - name: Monitoring Setup
        run: |
          ./monitoring/setup-production-monitoring.sh
```

## Performance and Resource Management

### CI/CD Performance Optimization

- **Parallel Job Execution**: Multiple jobs run concurrently for faster feedback
- **Docker Layer Caching**: Optimized container builds with layer caching
- **Dependency Caching**: NPM and NuGet package caching for faster builds
- **Test Parallelization**: Parallel test execution for faster feedback loops
- **Artifact Management**: Efficient artifact upload and download

### Resource Management

```yaml
# Resource limits and optimization
defaults:
  run:
    shell: bash

env:
  NODE_OPTIONS: '--max_old_space_size=4096'
  DOTNET_CLI_TELEMETRY_OPTOUT: 1
  DOTNET_NOLOGO: 1

jobs:
  build:
    runs-on: ubuntu-latest
    timeout-minutes: 30

    strategy:
      matrix:
        node-version: [18]
        dotnet-version: ['8.0.x']
      fail-fast: false
```

---

## Quick Reference

### Essential Workflows

- **CI/CD Pipeline**: Complete automated testing and deployment
- **Security Scanning**: CodeQL, dependency scanning, compliance validation
- **Benton Demo**: Automated demonstration environment deployment
- **Branch Protection**: Quality gates and compliance enforcement
- **Production Deployment**: Government-approved production deployments

### Key Templates

- **Bug Reports**: Structured bug reporting with severity classification
- **Feature Requests**: Government-focused feature request process
- **Security Reports**: Secure vulnerability reporting workflow
- **Pull Requests**: Comprehensive PR review and approval process

### Integration Points

- **GitHub Container Registry**: Container image storage and distribution
- **GitHub Environments**: Environment-specific deployment controls
- **GitHub Secrets**: Secure credential management
- **GitHub Pages**: Documentation and demo hosting

---

**Last Updated**: August 27, 2025  
**Version**: TerraFusion OS 1.0 GitHub Configuration  
**Authority**: TerraFusion DevOps and Security Division

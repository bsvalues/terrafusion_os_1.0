# .github - Repository Management and CI/CD Automation

**Status**: Production CI/CD Pipeline ✅  
**Purpose**: GitHub repository automation, security, and government compliance  
**Integration**: CI/CD workflows, security scanning, quality gates  
**Compliance**: Government-grade security and deployment standards

## Overview

The `.github` directory contains comprehensive repository management
configuration including government-grade CI/CD pipelines, security automation,
community guidelines, and compliance workflows specifically designed for
TerraFusion OS government AI operations.

## Quick Start

### CI/CD Pipeline Access

```bash
# View workflow status
gh workflow list

# Run manual deployment
gh workflow run "TerraFusion CI/CD" --ref main

# Check security scanning results
gh api repos/:owner/:repo/code-scanning/alerts
```

### Essential Repository Commands

```bash
# Create issues from templates
gh issue create --template bug_report.yml
gh issue create --template feature_request.yml

# View code ownership
cat .github/CODEOWNERS

# Check security policy
cat .github/SECURITY.md
```

## CI/CD Pipeline Architecture

### Main Workflow (`workflows/ci-cd.yml`)

Complete automated pipeline with government compliance:

```yaml
# Trigger Configuration
on:
  push: [main, develop] # Automatic on code changes
  pull_request: [main, develop] # PR validation
  workflow_dispatch: # Manual execution
  tags: ['v*'] # Release deployment

# Multi-Job Pipeline
jobs:
  backend-test: # .NET 8.0 backend testing
  frontend-test: # React frontend testing
  security-scan: # CodeQL and compliance
  build-containers: # Docker container builds
  deploy-staging: # Staging environment
  deploy-production: # Production deployment
```

### Specialized Workflows

- **`benton-demo.yml`**: Automated Benton County demonstrations
- **`security-scan.yml`**: Daily security scanning and compliance validation
- **`branch-protection.yml`**: Quality gates and code standards enforcement
- **`deployment.yml`**: Government-approved production deployment process

## Security and Compliance Framework

### Government Security Standards (`SECURITY.md`)

```markdown
# Compliance Frameworks

✅ FISMA (Federal Information Security Management Act) ✅ NIST Cybersecurity
Framework  
✅ SOC 2 Type II compliance ✅ FedRAMP (Federal Risk and Authorization
Management) ✅ GDPR (General Data Protection Regulation)

# Security Features

🔒 Zero-Trust Architecture 🔐 AES-256 encryption (data at rest and in transit)
🎫 JWT authentication with secure tokens 👥 Role-based access control (RBAC) 📋
Comprehensive audit logging
```

### Security Vulnerability Reporting

- **Critical Issues**: security@bsvalues.com (private disclosure)
- **Response Timeline**: 24h acknowledgment, 72h assessment, 7-day response
- **Resolution Target**: 30 days for critical vulnerabilities
- **Public Disclosure**: Responsible disclosure after resolution

### CodeQL Security Analysis (`codeql/codeql-config.yml`)

```yaml
# Comprehensive security scanning
languages: [csharp, javascript, typescript]
queries:
  - security-and-quality # Standard security queries
  - government-compliance # Custom government security queries

# Analysis coverage
paths:
  - backend/**/*.cs # .NET backend code
  - frontend/src/**/*.ts # TypeScript frontend
  - ai-models/**/*.py # AI model code
```

## Issue and PR Management

### Issue Templates (4 Structured Templates)

#### Bug Reports (`ISSUE_TEMPLATE/bug_report.yml`)

```yaml
fields:
  - Bug description with reproduction steps
  - Severity level (Critical/High/Medium/Low)
  - Environment details and system configuration
  - Expected vs actual behavior
  - Security impact assessment
```

#### Feature Requests (`ISSUE_TEMPLATE/feature_request.yml`)

```yaml
fields:
  - Problem statement and user story
  - Proposed solution and alternatives
  - Government impact assessment
  - Compliance and security considerations
  - Success criteria and acceptance tests
```

#### Security Reports (`ISSUE_TEMPLATE/security_report.yml`)

```yaml
# For non-sensitive security discussions only
# Actual vulnerabilities: security@bsvalues.com
fields:
  - Security best practices questions
  - Compliance clarifications
  - Security feature requests
```

### Code Ownership (`CODEOWNERS`)

```text
# Repository-wide ownership
* @cto @lead-architect

# Specialized ownership
backend/                    @backend-team @security-team
frontend/                   @frontend-team @ux-team
ai-models/                  @ai-team @government-liaison
.github/                    @devops-team @security-team
SECURITY.md                 @security-team @cto
docs/compliance/            @compliance-team @legal-team
```

### Pull Request Template (`pull_request_template.md`)

```markdown
## Change Summary

- [ ] Feature implementation
- [ ] Bug fix
- [ ] Security enhancement
- [ ] Government compliance update

## Testing

- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] E2E tests pass
- [ ] Government compliance validated

## Security Review

- [ ] No security vulnerabilities introduced
- [ ] Secrets management validated
- [ ] Government standards compliance verified
```

## Specialized Automation

### Benton County Demo Pipeline (`workflows/benton-demo.yml`)

```yaml
# Automated daily demonstrations
schedule: '0 8 * * MON-FRI' # Daily at 8 AM PST

demo-types:
  - full: Complete TerraFusion demonstration
  - ai-swarm: 1,008 AI agents coordination
  - harris-pacs: Property assessment integration
  - revenue-optimization: Tax revenue discovery

steps:
  1. Deploy Benton County environment 2. Validate Harris PACS integration
  (89,247 parcels) 3. Activate 1,008 AI agent swarm 4. Run government compliance
  tests 5. Generate comprehensive demo report
```

### Government Compliance Automation

```yaml
# Daily compliance validation
compliance-checks:
  - FISMA security controls validation
  - Accessibility (Section 508) testing
  - Data protection and privacy verification
  - Audit trail completeness validation
  - Government API security testing
```

## Quality Gates and Branch Protection

### Automated Quality Gates

```yaml
quality-requirements:
  code-coverage: '>= 80%' # Minimum test coverage
  security-scan: 'pass' # No high/critical vulnerabilities
  linting: 'zero-warnings' # Clean code standards
  compliance: 'validated' # Government standards met
  accessibility: 'pass' # Section 508 compliance
```

### Branch Protection Rules

```yaml
main-branch:
  required-status-checks:
    - backend-tests # .NET backend validation
    - frontend-tests # React frontend validation
    - security-scan # Security and vulnerability scan
    - government-compliance # Compliance validation

  required-reviewers: 2 # Minimum code review requirement
  dismiss-stale-reviews: true # Fresh reviews on new commits
  restrict-pushes: true # No direct pushes to main
```

## Deployment Automation

### Multi-Environment Deployment Pipeline

```yaml
environments:
  development:
    auto-deploy: true # Automatic deployment on develop branch
    approval: none # No approval required
    monitoring: basic # Basic monitoring setup

  staging:
    auto-deploy: false # Manual deployment trigger
    approval: team-lead # Team lead approval required
    monitoring: comprehensive # Full monitoring stack

  production:
    auto-deploy: false # Manual deployment only
    approval: government # Government approval workflow
    monitoring: enterprise # Enterprise-grade monitoring
```

### Government Deployment Process

```yaml
production-deployment:
  pre-deployment:
    - Government approval validation
    - Security pre-deployment scan
    - Compliance documentation review
    - Business continuity planning

  deployment:
    - Blue-green deployment strategy
    - Database migration validation
    - Service health monitoring
    - Rollback capability verified

  post-deployment:
    - Smoke test execution
    - Government compliance validation
    - Performance benchmark verification
    - Monitoring and alerting activation
```

## Performance and Monitoring

### CI/CD Performance Metrics

- **Pipeline Duration**: <15 minutes for complete pipeline
- **Test Execution**: <5 minutes for backend + frontend tests
- **Security Scanning**: <3 minutes for comprehensive security analysis
- **Container Builds**: <8 minutes for multi-stage Docker builds
- **Deployment Time**: <10 minutes for production deployment

### Resource Optimization

```yaml
# CI/CD resource management
runner-optimization:
  parallel-jobs: 4 # Concurrent job execution
  caching-strategy: aggressive # NPM, NuGet, Docker layer caching
  timeout-limits: 30min # Job timeout limits
  artifact-retention: 7days # Artifact cleanup policy
```

### Monitoring and Observability

```yaml
# Pipeline monitoring
monitoring:
  workflow-success-rate: '>= 95%' # Pipeline reliability target
  deployment-frequency: 'daily' # Deployment cadence
  lead-time: '<2 hours' # Code to production time
  mttr: '<30 minutes' # Mean time to recovery
```

## Security Automation

### Daily Security Scanning

```yaml
security-automation:
  codeql-analysis:
    frequency: daily # Daily security code analysis
    languages: [csharp, javascript, typescript, python]
    custom-queries: government-specific

  dependency-scanning:
    npm-audit: daily # Node.js dependency vulnerabilities
    nuget-scan: daily # .NET package vulnerabilities
    base-image-scan: weekly # Container base image scanning

  compliance-validation:
    fisma-controls: daily # FISMA compliance validation
    accessibility: weekly # Section 508 accessibility testing
    data-protection: daily # GDPR and privacy compliance
```

### Secrets Management

```yaml
# GitHub secrets management
secrets:
  TERRAFUSION_JWT_SECRET: # JWT authentication secret
  ANTHROPIC_API_KEY: # Claude AI integration
  OPENAI_API_KEY: # GPT model integration
  DOCKER_REGISTRY_TOKEN: # Container registry access
  GOVERNMENT_API_KEYS: # Government system integration

security-controls:
  - Secret rotation policies
  - Access logging and auditing
  - Environment-specific secrets
  - Encryption at rest and in transit
```

## Development Integration

### Developer Workflow

```bash
# Local development integration
gh auth login                        # Authenticate with GitHub
gh repo clone terrafusion-os         # Clone repository

# Issue management
gh issue create --template bug_report.yml
gh issue list --label "government"
gh issue view 123

# Pull request workflow
gh pr create --template            # Create PR with template
gh pr status                       # Check PR status
gh pr merge --auto                 # Auto-merge when ready

# CI/CD monitoring
gh run list                        # View workflow runs
gh run view 123456                 # View specific run details
gh run rerun 123456               # Rerun failed workflow
```

### Integration with TerraFusion Development

```yaml
# Development environment integration
development-tools:
  - VS Code GitHub extension # Integrated PR and issue management
  - GitHub CLI integration # Command-line repository operations
  - Codespaces integration # Cloud development environments
  - Security advisory alerts # Real-time security notifications
```

## Troubleshooting

### Common CI/CD Issues

```bash
# Workflow debugging
gh run view <run-id> --log         # View detailed workflow logs
gh workflow list                   # List all workflows
gh api repos/:owner/:repo/actions/runs # API access to runs

# Security scanning issues
gh api repos/:owner/:repo/code-scanning/alerts # View security alerts
gh secret list                     # List repository secrets

# Environment issues
gh environment list                # List deployment environments
gh deployment list                 # View deployment history
```

### Performance Diagnostics

```bash
# Pipeline performance analysis
gh api repos/:owner/:repo/actions/workflows # Workflow performance data
gh run list --limit 50            # Recent run performance
```

## Best Practices

### Repository Management

1. **Security First**: All workflows include security scanning
2. **Government Compliance**: Built-in compliance validation
3. **Quality Gates**: Comprehensive testing and validation
4. **Audit Trails**: Complete workflow and deployment logging
5. **Access Control**: Proper code ownership and review processes

### CI/CD Pipeline Management

1. **Fast Feedback**: Parallel job execution for quick results
2. **Security Integration**: Security scanning in every pipeline
3. **Government Standards**: Compliance validation at every step
4. **Monitoring**: Comprehensive pipeline and deployment monitoring
5. **Recovery Planning**: Automated rollback and disaster recovery

---

## Configuration Summary

### Workflow Statistics

- **Total Workflows**: 6 specialized CI/CD pipelines
- **Security Scanning**: Daily CodeQL and dependency scanning
- **Quality Gates**: 5 mandatory quality requirements
- **Environments**: 3 deployment environments with approval workflows
- **Templates**: 4 structured issue and PR templates

### Government Compliance

- **Security Standards**: 5 compliance frameworks (FISMA, NIST, SOC2, FedRAMP,
  GDPR)
- **Approval Process**: Government approval workflow for production
- **Audit Logging**: Complete pipeline and deployment audit trails
- **Access Control**: Role-based code ownership and review requirements

**Status**: Production Repository Management Active  
**Last Updated**: August 27, 2025  
**Authority**: TerraFusion DevOps and Security Division

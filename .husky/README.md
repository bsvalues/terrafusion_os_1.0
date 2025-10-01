# .husky - Git Hooks Configuration

## Quick Start

The `.husky` directory contains Git hooks configuration for TerraFusion OS,
ensuring code quality, security, and government compliance for our 1,008 AI
agents and 33 active modules.

## Installation and Setup

### Initial Setup

```bash
# Install Husky
npm install --save-dev husky

# Initialize Husky
npm run prepare

# Create first hook
npx husky add .husky/pre-commit "npm test"
```

### Enable Husky in Project

```json
{
  "scripts": {
    "prepare": "husky install"
  }
}
```

## Available Hooks

### Pre-commit Hooks

- **Code Quality**: Linting, formatting, type checking
- **Security Scan**: Secret detection, vulnerability scanning
- **AI Agent Validation**: Swarm integrity, agent communication
- **Government Compliance**: FISMA validation, audit logging

### Pre-push Hooks

- **Integration Tests**: Full test suite execution
- **Performance Validation**: API response time, database performance
- **Security Deep Scan**: Comprehensive security analysis
- **Module Compatibility**: 33-module integration testing

### Commit Message Hooks

- **Conventional Commits**: Standardized commit format
- **Government Standards**: Audit trail requirements
- **Documentation**: Automated changelog generation

## Configuration Examples

### Basic Pre-commit Hook

```bash
#!/bin/sh
. "$(dirname "$0")/_/husky.sh"

npm run lint && npm run test
```

### Government Compliance Hook

```bash
#!/bin/sh
. "$(dirname "$0")/_/husky.sh"

# Security validation
npm run security:scan
npm run secrets:detect

# FISMA compliance
npm run fisma:validate

# AI agent check
npm run ai:swarm-health
```

### Performance Validation Hook

```bash
#!/bin/sh
. "$(dirname "$0")/_/husky.sh"

# API performance (6ms target)
npm run perf:api

# Database performance
npm run perf:database

# Module loading performance
npm run perf:modules
```

## Essential Commands

### Hook Management

```bash
# Add new hook
npx husky add .husky/pre-commit "command"

# Remove hook
rm .husky/pre-commit

# Test hook execution
npm run husky:test

# Validate configuration
npm run husky:validate
```

### Testing Hooks

```bash
# Test specific hook
.husky/pre-commit

# Test all hooks
npm run hooks:test-all

# Debug hook execution
HUSKY_DEBUG=1 git commit -m "test"
```

## Common Workflows

### Development Workflow

1. **Code Changes**: Make your changes
2. **Stage Files**: `git add .`
3. **Commit**: `git commit -m "feat: add new feature"`
   - Pre-commit hooks run automatically
   - Quality gates enforce standards
   - Security scans prevent vulnerabilities
4. **Push**: `git push origin feature-branch`
   - Pre-push hooks run comprehensive tests
   - Performance validation ensures SLAs

### County Deployment Workflow

```bash
# County-specific validation
git commit -m "feat(benton): add Harris PACS integration"
# Triggers:
# - Harris PACS connectivity test
# - 89,247 property records validation
# - Benton County compliance check
```

### AI Agent Development Workflow

```bash
# AI agent changes
git commit -m "feat(ai): enhance swarm coordination"
# Triggers:
# - 1,008 agent integrity check
# - Command brain validation
# - Quantum optimization verification
```

## Troubleshooting

### Common Issues

#### Hook Not Executing

```bash
# Check hook permissions
chmod +x .husky/pre-commit

# Verify hook installation
ls -la .husky/

# Reinstall hooks
npm run prepare
```

#### Performance Issues

```bash
# Profile hook execution
time .husky/pre-commit

# Enable parallel execution
npm install --save-dev concurrently
```

#### Security Scan Failures

```bash
# Check for secrets
npm run secrets:scan

# Review security exemptions
cat .husky/security-exemptions.json

# Update security patterns
npm run security:update-patterns
```

### Government Compliance Issues

#### FISMA Validation Failure

```bash
# Debug FISMA compliance
npm run fisma:debug

# Check security controls
npm run fisma:validate-controls

# Generate compliance report
npm run fisma:report
```

#### AI Agent Validation Failure

```bash
# Check agent health
npm run ai:health-check

# Restart agent swarm
npm run ai:restart-swarm

# Validate quantum optimization
npm run quantum:validate
```

## Configuration Files

### Package.json Scripts

```json
{
  "scripts": {
    "prepare": "husky install",
    "pre-commit": "lint-staged && npm run security:scan",
    "pre-push": "npm run test:integration && npm run perf:validate",
    "husky:validate": "husky validate",
    "husky:test": "husky test"
  }
}
```

### Lint-staged Configuration

```json
{
  "lint-staged": {
    "*.{ts,tsx}": ["eslint --fix", "prettier --write"],
    "*.{cs}": ["dotnet format"],
    "*.{md,json}": ["prettier --write"]
  }
}
```

### Security Configuration

```json
{
  "security": {
    "patterns": ["api_key", "password", "secret"],
    "exclude": ["test/**", "docs/**"],
    "severity": "high"
  }
}
```

## Integration with TerraFusion Components

### Backend Integration

- **.NET Services**: Code formatting, static analysis
- **Entity Framework**: Migration validation
- **Security Services**: Vulnerability scanning

### Frontend Integration

- **React Components**: Component testing, accessibility
- **TypeScript**: Type checking, compilation validation
- **Bundle Analysis**: Performance budget enforcement

### AI Services Integration

- **Agent Swarm**: Coordination validation, health checks
- **Command Brain**: Connectivity testing, response validation
- **Quantum Layer**: Optimization verification, coherence checking

### County Systems Integration

- **Harris PACS**: Connectivity validation, data integrity
- **Tyler Integration**: System compatibility, data synchronization
- **Legacy Systems**: Migration validation, compatibility testing

## Performance Targets

### Hook Execution Times

- **Pre-commit**: < 30 seconds
- **Pre-push**: < 2 minutes
- **Security Scan**: < 45 seconds
- **AI Validation**: < 1 minute

### Quality Gates

- **Code Coverage**: > 80%
- **Security Scan**: 0 critical vulnerabilities
- **Performance**: API < 6ms, Database < 50ms
- **Compliance**: 100% FISMA validation

## Support and Resources

### Documentation

- `index.md`: Comprehensive technical documentation
- `claude.md`: Development patterns and integration guide
- Security policies in `/security` directory

### Getting Help

```bash
# Check hook status
npm run hooks:status

# Generate debug report
npm run hooks:debug-report

# View documentation
npm run docs:hooks
```

### Emergency Procedures

```bash
# Bypass hooks (emergency only)
git commit --no-verify -m "emergency: critical fix"

# Restore hooks after emergency
npm run prepare
npm run hooks:validate
```

This README provides quick access to essential Git hooks functionality while
maintaining TerraFusion's government-grade security and quality standards.

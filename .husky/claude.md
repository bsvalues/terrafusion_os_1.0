# TerraFusion OS - .husky Development Guide

## Overview

This guide provides comprehensive instructions for implementing, configuring, and maintaining Git hooks through Husky in the TerraFusion OS government AI platform. The `.husky` directory manages automated quality gates that protect the integrity of our 1,008 AI agents, 33 active modules, and government-grade security requirements.

## Development Patterns

### Hook Development Workflow

#### 1. Hook Creation and Testing
```bash
# Create new hook
npx husky add .husky/pre-commit "npm run pre-commit-tasks"

# Test hook execution
npm run husky:test-hook pre-commit

# Validate hook configuration
npm run husky:validate-config
```

#### 2. Government-Specific Hook Development
```bash
#!/bin/sh
# Government compliance pre-commit hook template
. "$(dirname "$0")/_/husky.sh"

echo "🏛️ Government Compliance Validation..."

# FISMA compliance check
if ! npm run fisma:validate; then
  echo "❌ FISMA compliance validation failed"
  exit 1
fi

# Security clearance validation
if ! npm run security:clearance-check; then
  echo "❌ Security clearance validation failed"
  exit 1
fi

# AI agent integrity check
if ! npm run ai:agent-integrity-check; then
  echo "❌ AI agent integrity validation failed"
  exit 1
fi

echo "✅ Government compliance validation passed"
```

### AI Agent Integration Patterns

#### Swarm Coordination Validation Hook
```typescript
// .husky/scripts/validate-ai-swarm.ts
import { AISwarmValidator } from '../backend/TerraFusion.AI/Services/AISwarmValidator';

export class SwarmValidationHook {
  async validateSwarmIntegrity(): Promise<boolean> {
    const validator = new AISwarmValidator();
    
    // Validate 1,008 agents
    const agentStatus = await validator.checkAllAgents();
    if (agentStatus.healthyAgents !== 1008) {
      console.error(`❌ Agent swarm compromised: ${agentStatus.healthyAgents}/1008 healthy`);
      return false;
    }
    
    // Validate command brain connectivity
    const commandBrainStatus = await validator.checkCommandBrain();
    if (!commandBrainStatus.operational) {
      console.error('❌ AI Command Brain not operational');
      return false;
    }
    
    // Validate quantum optimization layer
    const quantumStatus = await validator.checkQuantumOptimization();
    if (!quantumStatus.coherent) {
      console.error('❌ Quantum optimization layer not coherent');
      return false;
    }
    
    console.log('✅ AI Swarm validation passed');
    return true;
  }
}
```

#### County-Specific Validation
```bash
#!/bin/sh
# County-specific validation hook
validate_county_integration() {
  local county=$1
  
  case $county in
    "benton")
      # Validate Harris PACS integration
      npm run validate:harris-pacs
      # Check 89,247 property records
      npm run validate:benton-property-count
      ;;
    "clark")
      # Validate Tyler integration
      npm run validate:tyler-integration
      ;;
    "cowlitz")
      # Validate legacy system compatibility
      npm run validate:legacy-compatibility
      ;;
    *)
      echo "Unknown county: $county"
      exit 1
      ;;
  esac
}
```

## Security Framework Implementation

### Advanced Security Hook Configuration

#### Secret Detection and Prevention
```json
{
  "secret_detection": {
    "patterns": [
      {
        "name": "AWS Credentials",
        "pattern": "AKIA[0-9A-Z]{16}",
        "severity": "critical"
      },
      {
        "name": "Database Connection String",
        "pattern": "Server=.*;Database=.*;",
        "severity": "high"
      },
      {
        "name": "Government API Keys",
        "pattern": "gov_api_key_[a-zA-Z0-9]{32}",
        "severity": "critical"
      }
    ],
    "exclusions": [
      "test/**/*.test.ts",
      "docs/**/*.md"
    ]
  }
}
```

#### FISMA Compliance Automation
```bash
#!/bin/sh
# FISMA compliance validation hook
validate_fisma_compliance() {
  echo "🛡️ FISMA Compliance Validation..."
  
  # AC-2: Account Management
  npm run fisma:ac2-validation
  
  # AC-3: Access Enforcement
  npm run fisma:ac3-validation
  
  # AU-2: Event Logging
  npm run fisma:au2-validation
  
  # IA-2: Identification and Authentication
  npm run fisma:ia2-validation
  
  # SC-7: Boundary Protection
  npm run fisma:sc7-validation
  
  # Generate compliance report
  npm run fisma:generate-report
}
```

### Government Data Protection Hooks

#### PII Detection and Classification
```python
# .husky/scripts/pii_detection.py
import re
import json
from typing import List, Dict

class PIIDetector:
    def __init__(self):
        self.patterns = {
            'ssn': r'\b\d{3}-?\d{2}-?\d{4}\b',
            'phone': r'\b\d{3}[-.]\d{3}[-.]\d{4}\b',
            'email': r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b',
            'address': r'\b\d+\s+\w+\s+(Street|St|Avenue|Ave|Boulevard|Blvd|Drive|Dr)\b'
        }
    
    def scan_file(self, filepath: str) -> Dict:
        """Scan file for PII patterns"""
        violations = []
        
        with open(filepath, 'r', encoding='utf-8', errors='ignore') as file:
            content = file.read()
            
            for pii_type, pattern in self.patterns.items():
                matches = re.findall(pattern, content, re.IGNORECASE)
                if matches:
                    violations.append({
                        'type': pii_type,
                        'matches': len(matches),
                        'severity': 'HIGH' if pii_type in ['ssn'] else 'MEDIUM'
                    })
        
        return {
            'file': filepath,
            'violations': violations,
            'compliant': len(violations) == 0
        }
```

## Integration Instructions

### CI/CD Pipeline Integration

#### GitHub Actions Workflow
```yaml
# .github/workflows/husky-integration.yml
name: Husky Hooks Integration
on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  validate_hooks:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        node-version: [18.x, 20.x]
    
    steps:
      - uses: actions/checkout@v3
        with:
          fetch-depth: 0
      
      - name: Setup Node.js ${{ matrix.node-version }}
        uses: actions/setup-node@v3
        with:
          node-version: ${{ matrix.node-version }}
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Setup Husky
        run: npm run prepare
      
      - name: Validate hook configuration
        run: npm run husky:validate
      
      - name: Test pre-commit hooks
        run: npm run husky:test-pre-commit
      
      - name: Test pre-push hooks
        run: npm run husky:test-pre-push
      
      - name: Government compliance check
        run: npm run government:compliance-full
      
      - name: AI agent validation
        run: npm run ai:swarm-health-check
      
      - name: Security deep scan
        run: npm run security:deep-scan
        env:
          SECURITY_SCAN_TOKEN: ${{ secrets.SECURITY_SCAN_TOKEN }}
```

#### Docker Integration
```dockerfile
# Multi-stage Docker build with Husky integration
FROM node:18-alpine AS hooks-validation

WORKDIR /app

# Install git for hooks functionality
RUN apk add --no-cache git python3 py3-pip

# Copy package files
COPY package*.json ./
COPY .husky/ .husky/

# Install dependencies
RUN npm ci --only=production

# Setup and validate hooks
RUN npm run prepare
RUN npm run husky:validate

# Run pre-deployment validation
RUN npm run hooks:pre-deployment-validate

FROM node:18-alpine AS production
WORKDIR /app

# Copy validated application
COPY --from=hooks-validation /app .
COPY . .

# Final security validation
RUN npm run security:production-scan

EXPOSE 3000
CMD ["npm", "start"]
```

### Module-Specific Hook Configurations

#### Backend (.NET) Integration
```bash
#!/bin/sh
# Backend-specific pre-commit hook
echo "🔧 .NET Backend Validation..."

# Format C# code
dotnet format --verify-no-changes

# Run static analysis
dotnet build --configuration Release --no-restore

# Security analysis
dotnet run --project backend/TerraFusion.Security.Scanner

# Entity Framework migrations check
dotnet ef migrations has-pending-model-changes --project backend/TerraFusion.Data

# Integration tests
dotnet test backend/TerraFusion.API.Tests --configuration Release
```

#### Frontend (React/TypeScript) Integration
```bash
#!/bin/sh
# Frontend-specific pre-commit hook
echo "⚛️ Frontend Validation..."

# TypeScript compilation check
npm run type-check

# ESLint validation
npm run lint:frontend

# Prettier formatting check
npm run format:check:frontend

# Bundle size analysis
npm run analyze:bundle-size

# Accessibility testing
npm run test:a11y

# Component testing
npm run test:components
```

## Troubleshooting Guide

### Common Issues and Solutions

#### 1. Hook Execution Failures
```bash
# Debug hook execution
export HUSKY_DEBUG=1
git commit -m "test commit"

# Check hook permissions
chmod +x .husky/*

# Validate hook syntax
bash -n .husky/pre-commit
```

#### 2. Performance Issues
```bash
# Profile hook execution time
time .husky/pre-commit

# Enable parallel execution
npm install --save-dev concurrently
```

```json
{
  "scripts": {
    "pre-commit:parallel": "concurrently \"npm run lint\" \"npm run type-check\" \"npm run test:unit\""
  }
}
```

#### 3. Security Scanning False Positives
```json
{
  "security_exemptions": {
    "files": [
      "test/**/*.test.ts",
      "docs/**/*.md",
      "*.example.env"
    ],
    "patterns": [
      {
        "pattern": "password.*=.*test",
        "reason": "Test credentials in test files",
        "approved_by": "security-team@terrafusion.gov"
      }
    ]
  }
}
```

### Government Compliance Troubleshooting

#### FISMA Validation Issues
```bash
#!/bin/sh
# FISMA troubleshooting script
debug_fisma_validation() {
  echo "🔍 FISMA Validation Debug..."
  
  # Check compliance database
  npm run fisma:check-database-status
  
  # Validate security controls
  npm run fisma:validate-controls --verbose
  
  # Generate detailed report
  npm run fisma:debug-report --output=fisma-debug.json
  
  # Check for missing requirements
  npm run fisma:missing-requirements
}
```

#### AI Agent Swarm Issues
```typescript
// .husky/scripts/debug-ai-swarm.ts
export class AISwarmDebugger {
  async debugSwarmIssues(): Promise<void> {
    console.log('🤖 AI Swarm Debug Analysis...');
    
    // Check agent connectivity
    const connectivity = await this.checkAgentConnectivity();
    console.log(`Agent Connectivity: ${connectivity.healthy}/${connectivity.total}`);
    
    // Validate command brain
    const commandBrain = await this.validateCommandBrain();
    if (!commandBrain.responsive) {
      console.error('Command Brain unresponsive - restarting...');
      await this.restartCommandBrain();
    }
    
    // Check quantum optimization
    const quantum = await this.checkQuantumOptimization();
    if (quantum.coherenceLevel < 0.8) {
      console.warn(`Quantum coherence low: ${quantum.coherenceLevel}`);
      await this.recalibrateQuantumLayer();
    }
  }
}
```

## Best Practices

### Hook Development Standards

#### 1. Error Handling and Recovery
```bash
#!/bin/sh
# Robust error handling template
set -e  # Exit on any error

cleanup() {
  # Cleanup temporary files
  rm -f /tmp/hook_*
  echo "🧹 Cleanup completed"
}

# Set trap for cleanup
trap cleanup EXIT

# Main hook logic with error handling
main() {
  local exit_code=0
  
  echo "🚀 Starting hook validation..."
  
  # Each validation step with error handling
  if ! npm run lint:check; then
    echo "❌ Linting failed"
    exit_code=1
  fi
  
  if ! npm run security:scan; then
    echo "❌ Security scan failed"
    exit_code=1
  fi
  
  if ! npm run ai:validate; then
    echo "❌ AI validation failed"
    exit_code=1
  fi
  
  if [ $exit_code -eq 0 ]; then
    echo "✅ All validations passed"
  else
    echo "❌ Validation failures detected"
  fi
  
  exit $exit_code
}

main "$@"
```

#### 2. Performance Optimization
```bash
#!/bin/sh
# Performance-optimized hook execution
optimize_hook_performance() {
  # Use file change detection
  if [ -z "$(git diff --cached --name-only)" ]; then
    echo "ℹ️ No staged changes detected, skipping validation"
    exit 0
  fi
  
  # Parallel execution for independent tasks
  (npm run lint:changed &)
  (npm run type:check &)
  (npm run format:check &)
  
  # Wait for all parallel tasks
  wait
  
  # Sequential execution for dependent tasks
  npm run test:changed
  npm run security:scan:changed
}
```

#### 3. Government Standards Compliance
```yaml
# Government compliance configuration
government_standards:
  documentation_requirements:
    - commit_message_format: "conventional_commits"
    - security_clearance_validation: true
    - audit_trail_generation: true
  
  security_requirements:
    - secret_detection: true
    - vulnerability_scanning: true
    - compliance_validation: true
  
  performance_requirements:
    - api_response_time: "6ms"
    - database_query_time: "50ms"
    - module_load_time: "2s"
```

This comprehensive development guide ensures that Git hooks in TerraFusion OS maintain the highest standards of government compliance, security, and performance while supporting the sophisticated AI agent architecture and multi-county deployment requirements.
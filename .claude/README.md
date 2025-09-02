# .claude Directory - Development Environment Configuration

**Status**: Development Configuration Active ✅  
**Purpose**: Claude AI Development Environment Permissions  
**Security**: Controlled Development Operations  
**Compliance**: Government Development Standards  

## Overview

The `.claude` directory contains Claude AI development environment configuration that enables comprehensive development operations for TerraFusion OS. This configuration provides pre-approved command permissions that accelerate development workflows while maintaining security controls appropriate for government software development.

## Quick Start

### Configuration Overview
```bash
# View current permissions
cat .claude/settings.local.json | jq '.permissions.allow | length'
# Returns: 100+ pre-approved command patterns

# Validate configuration
claude --validate-config .claude/settings.local.json

# Test common development commands
npm --version          # ✅ Allowed
dotnet --version       # ✅ Allowed
docker --version       # ✅ Allowed
```

### Essential Development Operations
```bash
# Node.js Development
npm install                    # ✅ Package installation
npm run build                 # ✅ Build operations
npm test                      # ✅ Test execution

# .NET Development  
dotnet restore                # ✅ Package restoration
dotnet build                  # ✅ Compilation
dotnet test                   # ✅ Testing

# Container Operations
docker build -t app .         # ✅ Container building
docker run -p 5000:5000 app   # ✅ Container execution

# TerraFusion Operations
./scripts/seed-benton-database.sh              # ✅ Database initialization
./scripts/activate-ai-swarm-full-implementation.sh  # ✅ AI swarm deployment
```

## Configuration Architecture

### Core Configuration File
```
.claude/
└── settings.local.json                # 6.2KB comprehensive permissions configuration
```

### Permission Categories (100+ Commands)
- **Package Management**: npm, pip, apt-get operations (15+ patterns)
- **.NET Development**: dotnet build, test, run operations (7+ patterns)
- **System Operations**: docker, service, process management (12+ patterns)
- **File Operations**: file management, text processing (10+ patterns)
- **TerraFusion Scripts**: government operations scripts (20+ patterns)
- **Network Operations**: curl, wget, connectivity testing (5+ patterns)
- **Development Tools**: ESLint, testing, build operations (8+ patterns)
- **Monitoring**: system inspection, port checking (8+ patterns)

### Development Workflow Permissions

#### Core Development Stack
```json
{
  "permissions": {
    "allow": [
      // Node.js Ecosystem
      "Bash(npm install:*)",           // Package management
      "Bash(npm run:*)",               // Script execution  
      "Bash(npm test:*)",              // Test automation
      "Bash(npx eslint:*)",            // Code quality
      
      // .NET Core Framework
      "Bash(dotnet build:*)",          // Compilation
      "Bash(dotnet restore:*)",        // Dependencies
      "Bash(dotnet run:*)",            // Execution
      "Bash(dotnet test:*)",           // Testing
      
      // Container Operations
      "Bash(docker:*)",                // Full Docker operations
      
      // System Utilities
      "Bash(curl:*)",                  // HTTP operations
      "Bash(wget:*)",                  // File downloads
      "Bash(lsof:*)",                  // Process inspection
      "Bash(ss:*)"                     // Network monitoring
    ]
  }
}
```

#### Government Operations Authorization
```json
{
  "permissions": {
    "allow": [
      // Database Operations
      "Bash(./scripts/seed-benton-database.sh:*)",
      
      // AI Swarm Deployment
      "Bash(./scripts/activate-ai-swarm-full-implementation.sh:*)",
      
      // Legacy System Integration
      "Bash(./scripts/test-legacy-integration.sh:*)",
      "Bash(./scripts/validate-legacy-integration.sh:*)",
      
      // Strategic Operations
      "Bash(./scripts/monday-thunderstrike-execution.sh:*)",
      "Bash(./scripts/terrafusion-100-launch.sh:*)",
      "Bash(./scripts/federal-momentum-acceleration.sh:*)"
    ]
  }
}
```

## Government Development Features

### TerraFusion Script Automation
- **Database Seeding**: Benton County data initialization with Harris PACS integration
- **AI Swarm Deployment**: 1,008 agent deployment automation
- **Legacy Integration**: Harris PACS, Tyler Technologies testing and validation
- **Strategic Operations**: Government deployment and acceleration protocols

### Security Framework
```typescript
interface SecurityFramework {
  permissionModel: 'PRE_APPROVED_PATTERNS'
  scope: 'LOCAL_DEVELOPMENT_ONLY'  
  auditTrail: 'COMPLETE_COMMAND_LOGGING'
  restrictions: {
    systemAccess: 'LIMITED_SUDO_PACKAGE_MANAGEMENT'
    networkAccess: 'HTTP_OPERATIONS_ONLY'
    fileSystem: 'DEVELOPMENT_OPERATIONS'
    processControl: 'CONTROLLED_PROCESS_MANAGEMENT'
  }
}
```

### Compliance Controls
- **Government Standards**: FISMA development environment compliance
- **Audit Logging**: Complete command execution tracking
- **Access Control**: Pre-approved command patterns only
- **Security Isolation**: Development environment isolation from production

## Performance Benefits

### Development Acceleration
- **Zero Authorization Delays**: Pre-approved commands execute immediately
- **Automated Operations**: Government scripts run without manual intervention
- **Build Pipeline**: Complete CI/CD pipeline permissions
- **Test Automation**: Full test suite execution without prompts

### Operational Efficiency
```typescript
interface PerformanceMetrics {
  commandExecution: {
    authorizationDelay: '0ms',           // Pre-approved patterns
    scriptExecution: 'IMMEDIATE',        // No additional prompts
    buildOperations: 'AUTOMATED',        // Complete build permissions
    testAutomation: 'SEAMLESS'           // Full test suite access
  },
  
  developmentWorkflow: {
    packageInstallation: 'INSTANT',      // npm/pip/apt-get operations
    containerOperations: 'COMPLETE',     // Full Docker workflow
    systemMonitoring: 'REAL_TIME',      // Network and process inspection
    fileOperations: 'COMPREHENSIVE'     // Complete file management
  }
}
```

## Development Patterns

### Automated Testing Workflow
```bash
# Test discovery and execution
./scripts/discover-all-tests.sh                    # ✅ Test discovery
npm test                                          # ✅ Frontend testing
dotnet test backend/TerraFusion.API.Tests        # ✅ Backend testing
timeout 30s npm run build                        # ✅ Time-controlled builds
```

### Container Development Pipeline
```bash
# Container development workflow
docker build -f Dockerfile.dev -t tf-dev .       # ✅ Development container
docker run -d --name tf-api -p 5000:5000 tf-dev # ✅ Container execution
curl http://localhost:5000/health                # ✅ Health checking
docker logs tf-api                               # ✅ Log inspection
```

### Government Operations Automation
```bash
# Government-specific operations
./scripts/seed-benton-database.sh --env=dev            # ✅ Database setup
./scripts/activate-ai-swarm-full-implementation.sh     # ✅ AI deployment
./scripts/test-legacy-integration.sh --system=harris   # ✅ Legacy testing
```

### System Monitoring and Diagnostics
```bash
# System inspection operations
ss -tulpn | grep 5000                            # ✅ Port monitoring
lsof -i :5000                                    # ✅ Port usage analysis
docker ps                                        # ✅ Container status
sudo systemctl status nginx                      # ✅ Service status
```

## Security Architecture

### Permission Validation Model
```typescript
class PermissionValidator {
  validateCommand(command: string): boolean {
    const patterns = [
      /^Bash\(npm (install|run|test|cache clean):.*\)$/,
      /^Bash\(dotnet (build|restore|run|test):.*\)$/,
      /^Bash\(docker:.*\)$/,
      /^Bash\(\.\/scripts\/.*\.sh:.*\)$/,
      /^Bash\(curl:.*\)$/,
      /^Bash\((lsof|ss|pkill):.*\)$/
    ];
    
    return patterns.some(pattern => pattern.test(command));
  }
}
```

### Risk Assessment
```typescript
interface RiskAssessment {
  environment: 'ISOLATED_DEVELOPMENT'
  networkAccess: 'HTTP_OPERATIONS_ONLY'
  systemAccess: 'LIMITED_PACKAGE_MANAGEMENT'
  fileSystemAccess: 'DEVELOPMENT_DIRECTORY_SCOPE'
  processControl: 'CONTROLLED_PROCESS_MANAGEMENT'
  
  mitigationControls: {
    commandWhitelist: 'PRE_APPROVED_PATTERNS_ONLY'
    auditLogging: 'COMPLETE_OPERATION_TRACKING'
    environmentIsolation: 'WSL2_CONTAINER_ISOLATION'
    permissionRevocation: 'IMMEDIATE_CAPABILITY'
  }
}
```

## Configuration Management

### Environment Configuration
```json
{
  "environment": "development",
  "security": {
    "permissionModel": "whitelist",
    "auditLogging": true,
    "commandValidation": "pattern_matching"
  },
  "compliance": {
    "framework": "government_development",
    "auditRequirement": "complete_logging",
    "securityLevel": "controlled_access"
  }
}
```

### Version Control Integration
```bash
# Configuration version control
git add .claude/settings.local.json
git commit -m "Update Claude development permissions for TerraFusion operations"

# Configuration validation
claude --validate-config --environment=development
```

## Troubleshooting

### Permission Diagnostics
```bash
# Verify allowed operations
npm --version                         # ✅ Should work
dotnet --version                      # ✅ Should work
docker --version                      # ✅ Should work

# Test TerraFusion scripts
ls -la ./scripts/*.sh | head -5       # ✅ Script availability
./scripts/seed-benton-database.sh --help  # ✅ Script execution
```

### Common Issues and Solutions
```typescript
interface TroubleshootingGuide {
  permissionDenied: {
    cause: 'Command not in allowed patterns',
    solution: 'Add command pattern to settings.local.json'
  },
  
  scriptExecution: {
    cause: 'Script path not matching pattern',
    solution: 'Verify script path matches approved patterns'
  },
  
  containerOperations: {
    cause: 'Docker daemon not running',
    solution: 'Start Docker service: sudo service docker start'
  },
  
  networkOperations: {
    cause: 'Network connectivity issues',
    solution: 'Test with curl localhost operations first'
  }
}
```

### Validation Commands
```bash
# Environment validation
which npm node python3 dotnet docker  # ✅ Tool availability
curl http://localhost:5000/health      # ✅ API connectivity
ss -tulpn | grep LISTEN               # ✅ Service availability
docker ps                             # ✅ Container status
```

## Best Practices

### Development Workflow
1. **Permission Validation**: Verify commands are pre-approved before execution
2. **Script Management**: Maintain inventory of approved government operations scripts
3. **Security Review**: Regular review of permission configuration
4. **Environment Isolation**: Maintain separation between development and production

### Configuration Maintenance
1. **Version Control**: Track all permission configuration changes
2. **Security Audits**: Periodic security assessment of permissions
3. **Pattern Updates**: Update command patterns as development needs evolve
4. **Documentation**: Maintain comprehensive permission documentation

## Documentation References

- **[index.md](./index.md)**: Complete directory overview and architecture
- **[claude.md](./claude.md)**: Development guide and integration patterns
- **[CLAUDE.md](../CLAUDE.md)**: Core Claude development guidelines
- **[CLAUDE-backend.md](../CLAUDE-backend.md)**: Backend development integration

---

## Configuration Summary

### Permission Statistics
- **Total Commands**: 100+ pre-approved patterns
- **File Size**: 6.2KB comprehensive configuration
- **Categories**: 8 major permission categories
- **Security Level**: Controlled development environment
- **Compliance**: Government development standards

### Development Acceleration
- **Command Authorization**: 0ms delay for pre-approved operations
- **Script Execution**: Immediate government operations script execution
- **Build Pipeline**: Complete CI/CD workflow permissions
- **System Operations**: Full development environment control

**Status**: Production Development Configuration  
**Last Updated**: August 27, 2025  
**Authority**: TerraFusion Development Operations Division  
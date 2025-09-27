# .devcontainer Directory - Claude Development Guide

## Overview

The `.devcontainer` directory contains the development container configuration
for TerraFusion OS, providing a comprehensive, reproducible development
environment. This setup enables government-grade AI development with complete
tooling integration, security controls, and automated environment provisioning.

## Development Container Architecture

### Container Configuration Deep Dive

**File**: `.devcontainer/devcontainer.json` (95 lines)

- **Purpose**: Complete development environment specification
- **Base**: Microsoft universal Linux container with multi-language support
- **Integration**: VS Code, GitHub Codespaces, and local development container
  support
- **Security**: Government-grade secrets management and environment isolation

### Multi-Stack Development Platform

```json
{
  "name": "TerraFusion OS 1.0 - Government AI Development Environment",
  "image": "mcr.microsoft.com/devcontainers/universal:2-linux",

  "features": {
    // .NET 8.0 for government backend services
    "ghcr.io/devcontainers/features/dotnet:1": {
      "version": "8.0"
    },

    // Node.js 18 LTS for React frontend and tooling
    "ghcr.io/devcontainers/features/node:1": {
      "version": "18"
    },

    // Docker-in-Docker for container operations
    "ghcr.io/devcontainers/features/docker-in-docker:2": {},

    // Kubernetes tooling for government deployment
    "ghcr.io/devcontainers/features/kubectl-helm-minikube:1": {},

    // PowerShell for cross-platform scripting
    "ghcr.io/devcontainers/features/powershell:1": {}
  }
}
```

### IDE Integration and Extension Ecosystem

```json
"customizations": {
  "vscode": {
    "extensions": [
      // .NET Development
      "ms-dotnettools.csharp",            // C# IntelliSense and debugging

      // Frontend Development
      "ms-vscode.vscode-typescript-next", // TypeScript language support
      "bradlc.vscode-tailwindcss",        // Tailwind CSS IntelliSense

      // Infrastructure and DevOps
      "ms-kubernetes-tools.vscode-kubernetes-tools", // Kubernetes management
      "ms-azuretools.vscode-docker",      // Docker container management

      // AI-Assisted Development
      "github.copilot",                   // GitHub Copilot code completion
      "github.copilot-chat",              // GitHub Copilot conversational AI

      // Government Development Tools
      "ms-vscode.powershell",             // PowerShell scripting
      "redhat.vscode-yaml",               // YAML configuration files
      "ms-playwright.playwright"          // End-to-end testing
    ]
  }
}
```

## Development Patterns

### Environment Setup Automation

**File**: `.devcontainer/setup.sh` (47 lines)

- **Purpose**: Automated development environment initialization
- **Security**: Safe script execution with proper permission management
- **Integration**: Complete TerraFusion toolchain setup
- **Validation**: Environment readiness verification

#### System Dependencies and Tools

```bash
#!/bin/bash
echo "🚀 Setting up TerraFusion OS 1.0 Development Environment..."

# Government development tools installation
sudo apt-get update
sudo apt-get install -y postgresql-client redis-tools jq curl

# PostgreSQL client for government database operations
# Redis tools for AI agent coordination
# jq for JSON processing and API testing
# curl for HTTP operations and health checks
```

#### Multi-Stack Development Setup

```bash
# .NET Backend Development Environment
dotnet --version                          # Verify .NET 8.0 installation
dotnet restore backend/TerraFusion.sln   # Restore government backend packages

# Node.js Frontend Development Environment
cd frontend
npm install                               # Install React and TerraFusion dependencies
cd ..
```

#### Government Environment Configuration

```bash
# Development environment configuration
if [ ! -f .env.development ]; then
    cp .env.benton.example .env.development
    echo "📝 Created .env.development from template"
fi

# Government-specific environment variables:
# - ASPNETCORE_ENVIRONMENT=Development
# - Database connection strings
# - API keys for government services
# - Security configuration
```

#### TerraFusion Script Integration

```bash
# Make TerraFusion operations scripts executable
chmod +x ops/benton-demo.sh              # Benton County demonstration
chmod +x ops/benton/*.sh                 # County-specific operations
chmod +x scripts/*.sh                    # General TerraFusion scripts

# Git hooks setup for development workflow
if [ -d .husky ]; then
    npx husky install
    echo "🔧 Git hooks configured"
fi
```

### Network Architecture and Service Integration

#### Port Forwarding Strategy

```json
"forwardPorts": [3000, 5000, 5001, 8080, 9090, 3001],
"portsAttributes": {
  "3000": {
    "label": "TerraFusion UI",             // React frontend application
    "onAutoForward": "notify"             // User notification on auto-forward
  },
  "5000": {
    "label": "TerraFusion API",           // .NET backend HTTP endpoint
    "onAutoForward": "notify"
  },
  "5001": {
    "label": "TerraFusion API (HTTPS)",   // .NET backend HTTPS endpoint
    "onAutoForward": "notify"
  },
  "8080": {
    "label": "Demo Environment",          // Benton County demonstration
    "onAutoForward": "notify"
  },
  "9090": {
    "label": "Prometheus",                // Monitoring and metrics
    "onAutoForward": "silent"
  },
  "3001": {
    "label": "Grafana",                   // Observability dashboards
    "onAutoForward": "silent"
  }
}
```

#### Service Architecture Integration

```typescript
interface ServiceArchitecture {
  frontend: {
    port: 3000;
    framework: 'React 18';
    buildTool: 'Vite';
    styling: 'Tailwind CSS';
    development: 'Hot reload, fast refresh';
  };

  backend: {
    httpPort: 5000;
    httpsPort: 5001;
    framework: '.NET 8.0';
    architecture: 'Clean Architecture';
    database: 'PostgreSQL';
    cache: 'Redis';
    authentication: 'JWT tokens';
  };

  monitoring: {
    prometheus: {
      port: 9090;
      metrics: 'Application and system metrics';
      scraping: 'Real-time data collection';
    };
    grafana: {
      port: 3001;
      dashboards: 'Government operations dashboards';
      alerting: 'Integrated alerting system';
    };
  };

  demo: {
    port: 8080;
    environment: 'Benton County simulation';
    data: 'Harris PACS integration';
    features: 'Complete government AI demonstration';
  };
}
```

## Security and Compliance Framework

### Government-Grade Secrets Management

```json
"secrets": {
  "TERRAFUSION_JWT_SECRET": {
    "description": "JWT secret for TerraFusion authentication",
    "usage": "Backend API authentication and authorization",
    "security": "Government-grade encryption key"
  },
  "TERRAFUSION_DB_PASSWORD": {
    "description": "Database password for TerraFusion",
    "usage": "PostgreSQL database connection",
    "security": "Encrypted database credentials"
  },
  "ANTHROPIC_API_KEY": {
    "description": "Anthropic API key for AI services",
    "usage": "Claude AI integration and AI agent coordination",
    "security": "AI service authentication"
  },
  "OPENAI_API_KEY": {
    "description": "OpenAI API key for AI services",
    "usage": "GPT model integration and AI workflows",
    "security": "AI service authentication"
  }
}
```

### Environment Security Configuration

```json
"containerEnv": {
  "ASPNETCORE_ENVIRONMENT": "Development",  // .NET development mode
  "NODE_ENV": "development",                // Node.js development mode
  "DOTNET_CLI_TELEMETRY_OPTOUT": "1",      // Disable Microsoft telemetry
  "DOTNET_NOLOGO": "1"                     // Disable .NET branding
}
```

### Development Security Controls

```typescript
interface SecurityControls {
  containerIsolation: {
    userContext: 'codespace'; // Non-root container user
    networkIsolation: 'Development network only';
    fileSystemAccess: 'Project directory scoped';
    processIsolation: 'Container sandboxing';
  };

  secretsManagement: {
    encryption: 'Government-grade encryption';
    accessControl: 'Role-based secret access';
    auditLogging: 'Secret access logging';
    rotation: 'Automated secret rotation';
  };

  developmentStandards: {
    codeQuality: 'ESLint, Prettier, EditorConfig';
    securityScanning: 'Dependency vulnerability scanning';
    complianceChecks: 'Government standards validation';
    auditTrails: 'Development activity logging';
  };
}
```

## Advanced Development Patterns

### Multi-Language Development Environment

```typescript
interface DevelopmentEnvironment {
  backend: {
    language: '.NET C#';
    framework: '.NET 8.0';
    architecture: 'Clean Architecture';
    testing: 'XUnit, integration tests';
    database: 'Entity Framework Core';
    api: 'RESTful APIs with OpenAPI';
  };

  frontend: {
    language: 'TypeScript';
    framework: 'React 18';
    buildTool: 'Vite';
    styling: 'Tailwind CSS';
    testing: 'Jest, Playwright';
    stateManagement: 'React Context, Zustand';
  };

  infrastructure: {
    containers: 'Docker, Docker Compose';
    orchestration: 'Kubernetes';
    monitoring: 'Prometheus, Grafana';
    cicd: 'GitHub Actions';
    deployment: 'Azure Government Cloud';
  };

  ai: {
    platforms: ['Anthropic Claude', 'OpenAI GPT'];
    coordination: '1,008 AI agent swarm';
    workflows: 'Government AI operations';
    compliance: 'FISMA-ready AI governance';
  };
}
```

### Development Workflow Integration

```bash
# Complete development workflow commands
echo "🎯 Available commands:"
echo "  - make demo          # Run Benton County demo"
echo "  - dotnet run         # Start backend API"
echo "  - npm start          # Start frontend UI"
echo "  - docker-compose up  # Start full stack"

# Additional development commands:
npm run dev                               # Frontend development server
dotnet watch run                          # Backend hot reload
npm test                                  # Frontend test suite
dotnet test                               # Backend test suite
docker-compose logs -f                    # Monitor container logs
kubectl get pods                          # Kubernetes cluster status
```

### Government AI Development Workflows

```typescript
interface AIWorkflows {
  agentDevelopment: {
    swarmSize: 50000; // AI agent count (Supreme Commander + Field Generals + Operational Forces)
    coordination: 'Real-time coordination';
    testing: 'Agent performance testing';
    deployment: 'Government cloud deployment';
  };

  complianceValidation: {
    fisma: 'Federal security standards';
    nist: 'NIST cybersecurity framework';
    section508: 'Accessibility compliance';
    soc2: 'Service organization controls';
  };

  integrationTesting: {
    harrisPagess: 'Property assessment system';
    tylerTechnologies: 'Government ERP integration';
    legacySystems: 'County system compatibility';
    dataValidation: 'Government data integrity';
  };
}
```

## Performance and Resource Optimization

### Container Performance Tuning

```typescript
interface PerformanceOptimization {
  containerStartup: {
    baseImage: 'Microsoft universal container';
    layerOptimization: 'Minimal layer count';
    caching: 'Docker layer caching';
    startupTime: '<30 seconds';
  };

  developmentEnvironment: {
    memoryUsage: 'Optimized for development workloads';
    cpuUtilization: 'Multi-core development support';
    diskIO: 'SSD-optimized file operations';
    networkLatency: 'Local development networking';
  };

  servicePerformance: {
    frontend: 'Vite fast refresh and hot reload';
    backend: '.NET hot reload and live updates';
    database: 'PostgreSQL connection pooling';
    monitoring: 'Real-time metrics collection';
  };
}
```

### Resource Management Strategies

```bash
# Development directory structure for optimal performance
mkdir -p logs/development                 # Development logs (rotated daily)
mkdir -p data/development                 # Development data (temporary)
mkdir -p artifacts/development            # Build artifacts (cleaned regularly)

# Resource cleanup and optimization
docker system prune -f                   # Clean unused Docker resources
dotnet clean                             # Clean .NET build artifacts
npm cache clean --force                  # Clean npm cache
```

## Testing and Quality Assurance

### Integrated Testing Environment

```typescript
interface TestingEnvironment {
  unitTesting: {
    frontend: 'Jest with React Testing Library';
    backend: 'XUnit with Moq framework';
    coverage: 'Comprehensive code coverage reporting';
    automation: 'Test-driven development workflow';
  };

  integrationTesting: {
    api: 'ASP.NET Core integration tests';
    database: 'Entity Framework Core testing';
    services: 'Service integration validation';
    workflows: 'End-to-end workflow testing';
  };

  e2eTesting: {
    framework: 'Playwright with TypeScript';
    browsers: ['Chromium', 'Firefox', 'WebKit'];
    environments: 'Government compliance testing';
    visual: 'Visual regression testing';
  };

  governmentTesting: {
    compliance: 'FISMA security testing';
    accessibility: 'Section 508 validation';
    performance: 'Government load testing';
    security: 'Penetration testing simulation';
  };
}
```

### Development Quality Gates

```json
{
  "qualityGates": {
    "codeQuality": {
      "linting": "ESLint for TypeScript, C# analyzers",
      "formatting": "Prettier, EditorConfig",
      "complexity": "Cyclomatic complexity analysis"
    },
    "security": {
      "dependencyScanning": "npm audit, NuGet security scan",
      "codeAnalysis": "Static code analysis",
      "secretDetection": "Secret scanning"
    },
    "performance": {
      "bundleSize": "Frontend bundle analysis",
      "apiResponse": "Backend response time testing",
      "memoryUsage": "Memory leak detection"
    },
    "compliance": {
      "accessibility": "WCAG 2.1 validation",
      "security": "FISMA compliance checking",
      "auditTrails": "Complete development audit logs"
    }
  }
}
```

## Troubleshooting and Diagnostics

### Container Diagnostics

```bash
# Container health and status
docker ps                                # Running containers
docker logs devcontainer                 # Container logs
docker exec -it devcontainer bash        # Interactive container access

# Development environment validation
dotnet --version                          # .NET framework version
node --version                           # Node.js version
docker --version                         # Docker version
kubectl version                          # Kubernetes CLI version
pwsh --version                           # PowerShell version
```

### Service Connectivity Testing

```bash
# TerraFusion service health checks
curl http://localhost:\${{TF_API_PORT:-5000}}/health         # Backend API health
curl http://localhost:\${{TF_API_PORT:-5000}}               # Frontend application
curl http://localhost:\${{TF_API_PORT:-5000}}/demo          # Demo environment
curl http://localhost:\${{TF_API_PORT:-5000}}/metrics       # Prometheus metrics
curl http://localhost:\${{TF_API_PORT:-5000}}               # Grafana dashboards

# Database connectivity
psql -h localhost -p 5432 -U postgres    # PostgreSQL connection
redis-cli ping                           # Redis connectivity
```

### Development Environment Recovery

```bash
# Environment reset and recovery
devcontainer rebuild                      # Rebuild development container
docker-compose down && docker-compose up # Restart all services
npm install                              # Reinstall frontend dependencies
dotnet restore                           # Restore .NET packages
bash .devcontainer/setup.sh             # Re-run setup script
```

### Common Issues and Solutions

```typescript
interface TroubleshootingGuide {
  containerIssues: {
    slowStartup: 'Check Docker resources and base image caching';
    portConflicts: 'Verify port availability and forwarding configuration';
    permissionErrors: 'Validate container user permissions';
  };

  developmentIssues: {
    dependencyErrors: 'Clear caches and reinstall dependencies';
    buildFailures: 'Check .NET and Node.js versions';
    serviceConnectivity: 'Verify service startup order';
  };

  performanceIssues: {
    slowBuilds: 'Optimize Docker layer caching';
    memoryUsage: 'Monitor container resource limits';
    networkLatency: 'Check port forwarding configuration';
  };
}
```

## Best Practices

### Development Container Management

1. **Regular Updates**: Keep base images and tools updated
2. **Resource Monitoring**: Monitor container resource usage
3. **Security Scanning**: Regular vulnerability scanning
4. **Backup Strategy**: Regular development environment backups
5. **Documentation**: Maintain container configuration documentation

### Government Development Standards

1. **Security First**: Implement security controls from development start
2. **Compliance Integration**: Build compliance into development workflow
3. **Audit Trails**: Maintain complete development audit logs
4. **Access Control**: Implement proper development access controls
5. **Data Protection**: Protect sensitive government data in development

---

## Related Documentation

- **[.vscode/settings.json](../.vscode/settings.json)**: VS Code workspace
  settings
- **[docker-compose.yml](../docker-compose.yml)**: Multi-service orchestration
- **[Dockerfile](../Dockerfile)**: Container build configuration
- **[CLAUDE.md](../CLAUDE.md)**: TerraFusion development guidelines

---

**Classification**: Development Infrastructure - Government Standards  
**Last Updated**: August 27, 2025  
**Version**: TerraFusion OS 1.0 Development Container

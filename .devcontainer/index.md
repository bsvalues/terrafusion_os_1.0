# .devcontainer Directory Index

## Directory Overview
**Location**: `/.devcontainer/`  
**Purpose**: Development container configuration for TerraFusion OS  
**Classification**: Development Environment Infrastructure  
**Security Level**: Government Development Standards  

## Architecture Summary

### Primary Components
```
.devcontainer/
├── devcontainer.json                   # Dev container configuration (95 lines)
└── setup.sh                           # Environment setup script (47 lines)
```

### Key Capabilities
- **Universal Development Environment**: Microsoft universal Linux container
- **Multi-Stack Support**: .NET 8.0, Node.js 18, Docker, Kubernetes integration
- **Government AI Development**: TerraFusion-specific tooling and extensions
- **Port Forwarding**: Comprehensive service port management
- **Automated Setup**: Complete environment initialization

## Development Container Configuration

### Base Infrastructure
```json
{
  "name": "TerraFusion OS 1.0 - Government AI Development Environment",
  "image": "mcr.microsoft.com/devcontainers/universal:2-linux",
  "remoteUser": "codespace"
}
```

### Technology Stack Features
```json
"features": {
  "ghcr.io/devcontainers/features/dotnet:1": {
    "version": "8.0"                      // .NET 8.0 framework
  },
  "ghcr.io/devcontainers/features/node:1": {
    "version": "18"                       // Node.js 18 LTS
  },
  "ghcr.io/devcontainers/features/docker-in-docker:2": {},   // Docker support
  "ghcr.io/devcontainers/features/kubectl-helm-minikube:1": {}, // Kubernetes tooling
  "ghcr.io/devcontainers/features/powershell:1": {}        // PowerShell support
}
```

## IDE Integration and Extensions

### VS Code Extensions
```json
"extensions": [
  "ms-dotnettools.csharp",              // C# development support
  "ms-vscode.vscode-typescript-next",   // TypeScript language support
  "bradlc.vscode-tailwindcss",          // Tailwind CSS IntelliSense
  "ms-kubernetes-tools.vscode-kubernetes-tools", // Kubernetes integration
  "ms-azuretools.vscode-docker",        // Docker container management
  "github.copilot",                     // GitHub Copilot AI assistance
  "github.copilot-chat",                // GitHub Copilot Chat
  "ms-vscode.powershell",               // PowerShell language support
  "redhat.vscode-yaml",                 // YAML language support
  "ms-playwright.playwright"            // Playwright testing integration
]
```

### Development Settings
```json
"settings": {
  "dotnet.defaultSolution": "backend/TerraFusion.sln",
  "typescript.preferences.includePackageJsonAutoImports": "auto",
  "security.workspace.trust.enabled": false,
  "git.autofetch": true,
  "git.enableSmartCommit": true
}
```

## Network Configuration

### Port Forwarding Architecture
```json
"forwardPorts": [
  3000,    // TerraFusion UI (React frontend)
  5000,    // TerraFusion API (HTTP)
  5001,    // TerraFusion API (HTTPS)
  8080,    // Demo Environment
  9090,    // Prometheus monitoring
  3001     // Grafana dashboards
]
```

### Port Attributes and Labeling
```json
"portsAttributes": {
  "3000": {
    "label": "TerraFusion UI",
    "onAutoForward": "notify"             // Notify on auto-forwarding
  },
  "5000": {
    "label": "TerraFusion API",
    "onAutoForward": "notify"             // HTTP API endpoint
  },
  "5001": {
    "label": "TerraFusion API (HTTPS)",
    "onAutoForward": "notify"             // HTTPS API endpoint
  },
  "8080": {
    "label": "Demo Environment",
    "onAutoForward": "notify"             // Demo environment access
  },
  "9090": {
    "label": "Prometheus",
    "onAutoForward": "silent"             // Monitoring service
  },
  "3001": {
    "label": "Grafana",
    "onAutoForward": "silent"             // Dashboard service
  }
}
```

## Security and Secrets Management

### Government-Grade Secrets Configuration
```json
"secrets": {
  "TERRAFUSION_JWT_SECRET": {
    "description": "JWT secret for TerraFusion authentication"
  },
  "TERRAFUSION_DB_PASSWORD": {
    "description": "Database password for TerraFusion"
  },
  "ANTHROPIC_API_KEY": {
    "description": "Anthropic API key for AI services"
  },
  "OPENAI_API_KEY": {
    "description": "OpenAI API key for AI services"
  }
}
```

### Environment Variables
```json
"containerEnv": {
  "ASPNETCORE_ENVIRONMENT": "Development",  // .NET development mode
  "NODE_ENV": "development",                // Node.js development mode
  "DOTNET_CLI_TELEMETRY_OPTOUT": "1",      // Disable telemetry
  "DOTNET_NOLOGO": "1"                     // Disable .NET logo
}
```

## Automated Environment Setup

### Setup Script Architecture (`setup.sh`)

#### System Dependencies Installation
```bash
# Install additional government development tools
sudo apt-get update
sudo apt-get install -y postgresql-client redis-tools jq curl
```

#### Development Stack Initialization
```bash
# .NET Development Environment
dotnet --version                          # Verify .NET installation
dotnet restore backend/TerraFusion.sln   # Restore NuGet packages

# Node.js Development Environment  
cd frontend
npm install                               # Install npm dependencies
cd ..
```

#### Environment Configuration
```bash
# Development environment configuration
if [ ! -f .env.development ]; then
    cp .env.benton.example .env.development
    echo "📝 Created .env.development from template"
fi
```

#### Script Permissions and Git Integration
```bash
# Make TerraFusion scripts executable
chmod +x ops/benton-demo.sh              # Benton County demo
chmod +x ops/benton/*.sh                 # County-specific operations
chmod +x scripts/*.sh                    # General TerraFusion scripts

# Setup Git hooks for development workflow
if [ -d .husky ]; then
    npx husky install
    echo "🔧 Git hooks configured"
fi
```

#### Development Directory Structure
```bash
# Create development working directories
mkdir -p logs/development                 # Development logs
mkdir -p data/development                 # Development data
mkdir -p artifacts/development            # Build artifacts
```

## Development Workflow Integration

### Container Lifecycle Management
```typescript
interface ContainerLifecycle {
  initialization: {
    postCreateCommand: 'bash .devcontainer/setup.sh',
    userSetup: 'codespace',
    environmentVariables: DevelopmentEnvironment
  },
  
  development: {
    portForwarding: ServicePorts,
    extensionIntegration: VSCodeExtensions,
    secretsManagement: GovernmentSecrets
  },
  
  operations: {
    serviceCommands: DevelopmentCommands,
    monitoring: PrometheusGrafana,
    debugging: VSCodeDebugging
  }
}
```

### Multi-Service Architecture Support
```typescript
interface ServiceArchitecture {
  frontend: {
    port: 3000,
    framework: 'React 18',
    buildTool: 'Vite',
    styling: 'Tailwind CSS'
  },
  
  backend: {
    httpPort: 5000,
    httpsPort: 5001,
    framework: '.NET 8.0',
    database: 'PostgreSQL',
    cache: 'Redis'
  },
  
  monitoring: {
    prometheus: 9090,
    grafana: 3001,
    metrics: 'Real-time',
    alerting: 'Integrated'
  },
  
  demo: {
    port: 8080,
    environment: 'Benton County',
    integration: 'Harris PACS'
  }
}
```

## Government Development Standards

### Compliance Framework
- **Security Standards**: Government-grade secret management
- **Development Tools**: Enterprise-approved extensions and tooling
- **Audit Logging**: Development environment activity tracking
- **Access Control**: Role-based development permissions
- **Data Protection**: Encrypted development data handling

### AI Development Integration
```json
{
  "aiServices": {
    "anthropic": "Claude AI integration",
    "openai": "GPT model integration",
    "customModels": "TerraFusion AI models"
  },
  "governmentAI": {
    "compliance": "FISMA-ready development",
    "security": "Government-grade encryption",
    "auditTrail": "Complete development tracking"
  }
}
```

## Performance and Resource Management

### Container Resource Optimization
- **Base Image**: Microsoft universal container (optimized)
- **Feature Integration**: Efficient multi-stack support
- **Memory Management**: Optimized for government development workloads
- **CPU Utilization**: Multi-core development environment support
- **Storage Management**: Efficient artifact and log management

### Development Performance Metrics
```typescript
interface PerformanceMetrics {
  containerStartup: '<30 seconds',
  environmentSetup: '<2 minutes',
  serviceInitialization: '<1 minute per service',
  portForwarding: 'Real-time',
  extensionLoading: '<10 seconds',
  secretsRetrieval: '<5 seconds'
}
```

## Monitoring and Observability

### Development Environment Monitoring
- **Service Health**: Real-time service status monitoring
- **Port Availability**: Automated port forwarding with notifications
- **Resource Usage**: Container resource consumption tracking
- **Development Metrics**: Code quality and performance metrics
- **Security Monitoring**: Development environment security validation

### Integrated Observability Stack
```yaml
monitoring:
  prometheus:
    port: 9090
    metrics: development_environment
    targets: [frontend, backend, demo]
  
  grafana:
    port: 3001
    dashboards: development_metrics
    alerts: performance_thresholds
  
  logging:
    directory: logs/development
    rotation: daily
    retention: 30_days
```

## Integration Architecture

### GitHub Codespaces Integration
- **Cloud Development**: GitHub Codespaces compatibility
- **Remote Development**: VS Code remote container support
- **Team Collaboration**: Shared development environment configuration
- **Version Control**: Integrated Git workflow with hooks
- **Security**: Cloud-based government development standards

### Local Development Container Support
```bash
# Local development container startup
devcontainer up                           # Start development container
devcontainer exec bash                    # Execute commands in container
devcontainer rebuild                      # Rebuild container with updates
```

## Troubleshooting and Diagnostics

### Common Development Environment Issues
```bash
# Container startup diagnostics
docker logs devcontainer                  # View container logs
docker exec -it devcontainer bash        # Interactive container access
devcontainer logs                         # Development container logs

# Service connectivity testing
curl http://localhost:5000/health         # API health check
curl http://localhost:3000               # Frontend availability
curl http://localhost:9090/metrics       # Prometheus metrics
```

### Environment Validation
```typescript
interface EnvironmentValidation {
  dotnet: 'dotnet --version',              // .NET framework validation
  nodejs: 'node --version',               // Node.js version check
  docker: 'docker --version',             // Docker availability
  kubernetes: 'kubectl version',          // Kubernetes CLI validation
  powershell: 'pwsh --version',           // PowerShell availability
  git: 'git --version'                    // Git version control
}
```

### Development Commands Reference
```bash
# TerraFusion development commands
make demo                                 # Run Benton County demo
dotnet run                               # Start backend API (.NET)
npm start                                # Start frontend UI (React)
docker-compose up                        # Start full stack
npm test                                 # Run test suites
dotnet test                              # Run .NET tests
```

---

## Quick Reference

### Essential Configuration Elements
- **Base Image**: Microsoft universal Linux container
- **Technology Stack**: .NET 8.0, Node.js 18, Docker, Kubernetes
- **Port Forwarding**: 6 service ports (3000, 5000, 5001, 8080, 9090, 3001)
- **Extensions**: 8 VS Code extensions for full-stack development
- **Secrets**: 4 government-grade secret configurations

### Key Development Features
- **Automated Setup**: Complete environment initialization script
- **Multi-Service Support**: Frontend, backend, monitoring, demo environments
- **Government Compliance**: FISMA-ready development standards
- **AI Integration**: Anthropic and OpenAI API support
- **Container Optimization**: Efficient resource management and performance

### Integration Points
- **GitHub Codespaces**: Cloud development environment
- **VS Code Remote**: Local development container support
- **TerraFusion Services**: Complete government AI platform integration
- **Monitoring Stack**: Prometheus and Grafana integration

---

**Last Updated**: August 27, 2025  
**Version**: TerraFusion OS 1.0 Development Container  
**Authority**: TerraFusion Development Infrastructure Division  
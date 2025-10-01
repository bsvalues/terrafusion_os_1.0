# .devcontainer - Development Container Configuration

**Status**: Production Development Environment ✅  
**Purpose**: Complete TerraFusion OS Development Container  
**Integration**: VS Code, GitHub Codespaces, Multi-Stack Development  
**Security**: Government-Grade Development Standards

## Overview

The `.devcontainer` directory provides a comprehensive, reproducible development
environment for TerraFusion OS. This configuration enables government-grade AI
development with complete tooling integration, automated setup, and security
controls appropriate for federal government software development.

## Quick Start

### Container Environment Setup

```bash
# GitHub Codespaces (Cloud Development)
# 1. Open repository in GitHub Codespaces
# 2. Container automatically builds with complete environment
# 3. All tools and extensions pre-configured

# VS Code Local Development
# 1. Install Dev Containers extension
# 2. Open repository in VS Code
# 3. Command: "Dev Containers: Reopen in Container"
```

### Essential Development Commands

```bash
# TerraFusion operations
make demo                                 # Run Benton County demo
dotnet run                               # Start .NET backend API
npm start                                # Start React frontend
docker-compose up                        # Start complete stack

# Development workflow
npm run dev                              # Frontend development server
dotnet watch run                         # Backend hot reload
npm test                                 # Frontend test suite
dotnet test                              # Backend test suite
```

### Service Access Points

```bash
# Development services (auto-forwarded ports)
http://localhost:\${{TF_FRONTEND_PORT:-3000}}                    # TerraFusion UI (React)
http://localhost:\${{TF_FRONTEND_PORT:-3000}}                    # TerraFusion API (HTTP)
https://localhost:\${{TF_FRONTEND_PORT:-3000}}                   # TerraFusion API (HTTPS)
http://localhost:\${{TF_FRONTEND_PORT:-3000}}                    # Demo Environment
http://localhost:\${{TF_FRONTEND_PORT:-3000}}                    # Prometheus Metrics
http://localhost:\${{TF_FRONTEND_PORT:-3000}}                    # Grafana Dashboards
```

## Development Environment Architecture

### Base Configuration

```json
{
  "name": "TerraFusion OS 1.0 - Government AI Development Environment",
  "image": "mcr.microsoft.com/devcontainers/universal:2-linux",
  "remoteUser": "codespace"
}
```

### Technology Stack Integration

```json
"features": {
  ".NET 8.0": "Government backend services development",
  "Node.js 18": "React frontend and tooling support",
  "Docker-in-Docker": "Container operations and deployment",
  "Kubernetes Tools": "Government cloud deployment support",
  "PowerShell": "Cross-platform scripting and automation"
}
```

### VS Code Extensions (8 Essential Extensions)

```json
"extensions": [
  "ms-dotnettools.csharp",              // C# development and debugging
  "ms-vscode.vscode-typescript-next",   // TypeScript language support
  "bradlc.vscode-tailwindcss",          // Tailwind CSS IntelliSense
  "ms-kubernetes-tools.vscode-kubernetes-tools", // Kubernetes management
  "ms-azuretools.vscode-docker",        // Docker container operations
  "github.copilot",                     // AI-assisted development
  "github.copilot-chat",                // Conversational AI development
  "ms-playwright.playwright"            // End-to-end testing integration
]
```

## Automated Environment Setup

### Complete Environment Initialization

The setup script (`setup.sh`) provides comprehensive environment preparation:

```bash
# System dependencies installation
sudo apt-get install -y postgresql-client redis-tools jq curl

# Multi-stack development setup
dotnet restore backend/TerraFusion.sln   # .NET backend dependencies
cd frontend && npm install               # React frontend dependencies

# Government environment configuration
cp .env.benton.example .env.development  # Development environment variables

# TerraFusion script permissions
chmod +x ops/benton-demo.sh              # Demo operations
chmod +x scripts/*.sh                    # General operations scripts

# Git workflow integration
npx husky install                        # Git hooks setup

# Development directory structure
mkdir -p logs/development data/development artifacts/development
```

### Development Workflow Ready State

After setup completion, the environment provides:

- **Complete Toolchain**: .NET 8.0, Node.js 18, Docker, Kubernetes ready
- **Service Integration**: All TerraFusion services configured and accessible
- **Testing Framework**: Unit, integration, and E2E testing ready
- **Government Tools**: Compliance and security tooling integrated
- **AI Development**: Anthropic and OpenAI API integration configured

## Service Architecture and Ports

### Port Forwarding Configuration

| Port     | Service               | Description                       | Auto-Forward |
| -------- | --------------------- | --------------------------------- | ------------ |
| **3000** | TerraFusion UI        | React frontend application        | Notify       |
| **5000** | TerraFusion API       | .NET backend HTTP endpoint        | Notify       |
| **5001** | TerraFusion API HTTPS | .NET backend HTTPS endpoint       | Notify       |
| **8080** | Demo Environment      | Benton County demonstration       | Notify       |
| **9090** | Prometheus            | Monitoring and metrics collection | Silent       |
| **3001** | Grafana               | Observability dashboards          | Silent       |

### Multi-Service Development

```typescript
interface ServiceStack {
  frontend: {
    framework: 'React 18 + TypeScript';
    build: 'Vite with hot reload';
    styling: 'Tailwind CSS + component library';
    testing: 'Jest + Playwright E2E';
  };

  backend: {
    framework: '.NET 8.0 + Clean Architecture';
    database: 'PostgreSQL with Entity Framework';
    cache: 'Redis for AI agent coordination';
    authentication: 'JWT with government security';
  };

  infrastructure: {
    monitoring: 'Prometheus + Grafana stack';
    containers: 'Docker with multi-stage builds';
    orchestration: 'Kubernetes deployment ready';
    demo: 'Benton County simulation environment';
  };
}
```

## Government Security Framework

### Secrets Management (4 Government-Grade Secrets)

```json
{
  "TERRAFUSION_JWT_SECRET": "JWT authentication for government services",
  "TERRAFUSION_DB_PASSWORD": "Encrypted database connection credentials",
  "ANTHROPIC_API_KEY": "Claude AI integration for 1,008 agent swarm",
  "OPENAI_API_KEY": "GPT model integration for AI workflows"
}
```

### Development Security Controls

```json
{
  "containerSecurity": {
    "userContext": "codespace (non-root)",
    "networkIsolation": "Development network only",
    "fileSystemAccess": "Project directory scoped"
  },

  "environmentSecurity": {
    "telemetryOptOut": "Microsoft telemetry disabled",
    "secretsEncryption": "Government-grade encryption",
    "auditLogging": "Complete development activity logs"
  },

  "complianceSecurity": {
    "fismaReady": "Federal security standards",
    "accessControl": "Role-based development permissions",
    "dataProtection": "Government data handling standards"
  }
}
```

### Environment Variables Configuration

```bash
# Development environment configuration
ASPNETCORE_ENVIRONMENT=Development       # .NET development mode
NODE_ENV=development                     # Node.js development mode
DOTNET_CLI_TELEMETRY_OPTOUT=1           # Privacy protection
DOTNET_NOLOGO=1                         # Clean console output
```

## AI Development Integration

### AI Platform Support

- **Anthropic Claude**: AI agent coordination and government workflows
- **OpenAI GPT**: Language models for AI-assisted development
- **Custom AI Models**: TerraFusion-specific government AI models
- **1,008 Agent Swarm**: Complete AI agent development and testing environment

### Government AI Development Workflow

```typescript
interface AIWorkflow {
  development: {
    agentCoordination: '1,008 AI agents for government operations';
    testing: 'AI agent performance and coordination testing';
    integration: 'Government system AI integration (Harris PACS, Tyler)';
  };

  compliance: {
    fismaValidation: 'AI system security compliance';
    ethicsFramework: 'Government AI ethics and bias detection';
    auditTrails: 'Complete AI decision audit documentation';
  };

  deployment: {
    cloudReady: 'Azure Government Cloud deployment';
    scalability: 'Multi-county AI deployment patterns';
    monitoring: 'Real-time AI performance monitoring';
  };
}
```

## Performance and Development Experience

### Development Performance Metrics

- **Container Startup**: <30 seconds complete environment
- **Service Initialization**: <2 minutes full stack ready
- **Hot Reload**: React and .NET fast refresh enabled
- **Test Execution**: Parallel testing with immediate feedback
- **Build Performance**: Optimized Docker layer caching

### Development Experience Features

```typescript
interface DevelopmentExperience {
  codeCompletion: {
    csharp: 'IntelliSense + debugging';
    typescript: 'Advanced TypeScript support';
    ai: 'GitHub Copilot integration';
  };

  testing: {
    unitTesting: 'Jest (frontend) + XUnit (backend)';
    e2eTesting: 'Playwright cross-browser testing';
    coverage: 'Comprehensive coverage reporting';
  };

  deployment: {
    containerization: 'Docker build and deployment';
    orchestration: 'Kubernetes deployment templates';
    monitoring: 'Prometheus metrics integration';
  };

  government: {
    compliance: 'Automated compliance checking';
    security: 'Security scanning and validation';
    documentation: 'Government documentation standards';
  };
}
```

## Development Workflows

### Frontend Development

```bash
# React development workflow
cd frontend
npm start                                # Development server (port \${{TF_FRONTEND_PORT:-3000}})
npm test                                 # Jest test suite
npm run build                            # Production build
npm run lint                             # ESLint code quality
npm run format                           # Prettier code formatting
```

### Backend Development

```bash
# .NET development workflow
cd backend
dotnet restore                           # Restore NuGet packages
dotnet build                            # Build solution
dotnet test                             # Run test suite
dotnet watch run                        # Hot reload development
dotnet ef database update               # Entity Framework migrations
```

### Full Stack Operations

```bash
# Complete development stack
docker-compose up -d                     # Start all services
docker-compose logs -f api               # Monitor backend logs
docker-compose logs -f ui                # Monitor frontend logs
docker-compose down                      # Stop all services

# Government demonstration
make demo                               # Benton County demonstration
./ops/benton-demo.sh                    # Alternative demo script
```

### Testing and Quality Assurance

```bash
# Comprehensive testing workflow
npm run test:unit                       # Frontend unit tests
dotnet test                            # Backend unit tests
npm run test:e2e                       # Playwright E2E tests
npm run test:coverage                  # Coverage reporting

# Code quality and security
npm run lint                           # ESLint + TypeScript checks
dotnet format                          # C# code formatting
npm audit                             # Dependency security audit
```

## Troubleshooting

### Common Development Issues

```bash
# Container and environment issues
devcontainer rebuild                    # Rebuild development container
docker system prune -f                 # Clean Docker resources
bash .devcontainer/setup.sh           # Re-run environment setup

# Service connectivity testing
curl http://localhost:\${{TF_FRONTEND_PORT:-3000}}/health      # Backend API health check
curl http://localhost:\${{TF_FRONTEND_PORT:-3000}}            # Frontend availability
curl http://localhost:\${{TF_FRONTEND_PORT:-3000}}/metrics    # Prometheus metrics endpoint
```

### Development Environment Validation

```bash
# Verify development stack
dotnet --version                       # .NET 8.0 validation
node --version                        # Node.js 18 validation
docker --version                      # Docker availability
kubectl version                       # Kubernetes CLI validation
psql --version                        # PostgreSQL client
redis-cli --version                   # Redis tools

# TerraFusion service validation
make health-check                     # TerraFusion health validation
./scripts/validate-environment.sh    # Complete environment check
```

### Performance Diagnostics

```bash
# Resource monitoring
docker stats                          # Container resource usage
htop                                  # System resource monitoring
df -h                                 # Disk space availability

# Service performance
curl -w "@curl-format.txt" http://localhost:\${{TF_FRONTEND_PORT:-3000}}/health  # API response times
npm run analyze                       # Frontend bundle analysis
dotnet-counters monitor              # .NET performance counters
```

## Configuration Management

### Development Environment Customization

```json
{
  "workspaceSettings": {
    "dotnet.defaultSolution": "backend/TerraFusion.sln",
    "typescript.preferences.includePackageJsonAutoImports": "auto",
    "security.workspace.trust.enabled": false,
    "git.autofetch": true,
    "git.enableSmartCommit": true
  }
}
```

### Environment-Specific Configuration

```bash
# Development environment files
.env.development                       # Development environment variables
.env.local                            # Local developer overrides
.env.benton.example                   # Benton County configuration template

# Configuration validation
./scripts/validate-config.sh          # Configuration validation script
make check-config                     # Configuration health check
```

## Best Practices

### Development Container Management

1. **Regular Updates**: Keep base images and extensions updated
2. **Resource Monitoring**: Monitor container performance and resource usage
3. **Security**: Regular security scanning and dependency updates
4. **Backup**: Version control all development configuration
5. **Documentation**: Maintain comprehensive setup documentation

### Government Development Standards

1. **Security First**: Implement security controls from development start
2. **Compliance Integration**: Build government compliance into development
   workflow
3. **Audit Trails**: Maintain complete development audit logs
4. **Data Protection**: Protect sensitive government data throughout development
5. **Access Control**: Implement proper development environment access controls

## Related Configuration

- **[.vscode/](../.vscode/)**: VS Code workspace settings and extensions
- **[docker-compose.yml](../docker-compose.yml)**: Multi-service development
  orchestration
- **[package.json](../package.json)**: Frontend dependencies and scripts
- **[backend/TerraFusion.sln](../backend/TerraFusion.sln)**: .NET solution
  configuration

---

## Configuration Summary

### Environment Statistics

- **Base Image**: Microsoft universal Linux container
- **Technology Stack**: .NET 8.0, Node.js 18, Docker, Kubernetes
- **VS Code Extensions**: 8 essential development extensions
- **Port Forwarding**: 6 service ports with intelligent auto-forwarding
- **Security**: 4 government-grade secrets with encryption

### Development Capabilities

- **Multi-Language**: C#/.NET backend + TypeScript/React frontend
- **AI Integration**: Anthropic Claude + OpenAI GPT integration
- **Government Standards**: FISMA compliance and security controls
- **Testing**: Unit, integration, E2E testing with coverage reporting
- **Deployment**: Container and Kubernetes deployment ready

**Status**: Production Development Environment Ready  
**Last Updated**: August 27, 2025  
**Authority**: TerraFusion Development Infrastructure Division

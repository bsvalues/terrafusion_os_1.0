# TerraFusion OS - Development Platform Instructions

## Context
This is the **Development Platform** workspace within TerraFusion OS 1.0, containing code generation, testing frameworks, deployment automation, CI/CD pipelines, and debugging tools for building specialized AI platform modules.

## Critical Architecture Understanding

**This is an OS kernel + specialized modules architecture**, NOT a web app. Components run as OS services with task-based workflows. Never suggest deployment/hosting solutions.

## Key Workflows

### Build & Test
```bash
npm run build:all-development      # Build all development services
npm run test:all-development       # Comprehensive test suite
npm run quality:gate               # Quality validation
```

### Code Generation
```bash
python generate_service_code.py --service <type> --template <template>
```

### Deployment Automation
```bash
python deploy_development.py --target <environment>
```

### CI/CD Pipeline
```bash
npm run pipeline:cross-service     # Cross-service integration
```

## VS Code Tasks Available

- `🏛️ Build All Development Platform`
- `🧪 Test All Development Services`
- `🤖 Generate Service Code`
- `🚀 Deploy Development Environment`
- `🔄 Run Cross-Service CI/CD`
- `🔍 Development Quality Gate`

Use `Ctrl+Shift+P` → "Tasks: Run Task" to execute these.

## Integration Points

- **Backend Services**: Located in `../../backend/` (.NET 8 microservices)
- **Frontend**: Located in `../../frontend/` (React 18 + Quantum UI)
- **SDK**: Located in `../../SDK/` (Developer toolkit)
- **TerraBuild**: Located in `../../terrabuild-modernization/` (Property assessment)

## Development Constraints

1. **Never modify production county data** without approval
2. **Always validate tenant configuration** before operations
3. **Maintain FISMA-High compliance** in all development
4. **Use task-based workflows** - this is an OS, not a deployable app

## Government Excellence Standards

- 99.5% accuracy targets
- <10ms P95 latency requirements  
- 99.99% uptime expectations
- Quantum optimization factor: 949
- "Government. Transcended." brand voice

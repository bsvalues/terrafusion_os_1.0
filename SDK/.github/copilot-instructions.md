# TerraFusion OS - Platform SDK Instructions

## Context
This is the **TerraFusion OS SDK** - production-ready developer kit for building government AI applications on the TerraFusion platform.

## Quick Start

### Create New Module
```bash
./scripts/create-module.sh --name="my-county-module" --type="government"
./scripts/create-ai-agent.sh --name="my-agent" --swarm="custom"
```

### Development Setup
```bash
./scripts/dev-setup.sh
./scripts/dev-start.sh --module="my-county-module"
./scripts/test-integration.sh
```

## SDK Structure

```
SDK/
├── boilerplate/       # Starter templates
├── configs/           # Environment configs
├── scripts/           # Automation scripts
├── test-data/        # Sample data
├── docs/             # Documentation
├── examples/         # Working examples
├── tools/            # Dev/debug tools
└── templates/        # Infrastructure templates
```

## Module Development

### Module Manifest
```json
{
  "name": "my-government-module",
  "version": "1.0.0",
  "type": "government-module",
  "tier": "tier2",
  "capabilities": ["property-management", "tax-processing"],
  "dependencies": ["government-edition", "ai-command-brain"],
  "security": {
    "authentication": "required",
    "authorization": "rbac",
    "compliance": ["FISMA", "NIST"]
  }
}
```

### Component Architecture
```typescript
// Frontend: React 18 + TypeScript
interface ModuleComponent {
  name: string;
  props: ModuleProps;
  state: ModuleState;
  services: ModuleServices;
}

// Backend: C# .NET 8
public interface IModuleService {
  Task<ModuleResult> ProcessAsync(ModuleRequest request);
  Task<HealthStatus> GetHealthAsync();
}
```

## AI Agent Development

### Agent Template
```javascript
class CustomAIAgent extends AIAgentBase {
  constructor(config) {
    super(config);
    this.type = 'CUSTOM_AGENT';
    this.capabilities = ['data-analysis', 'prediction'];
  }
  
  async executeTask(task) {
    return await this.processWithAI(task);
  }
}

// Register with Supreme Commander
SupremeCommanderClaude.registerAgent(customAgent);
```

## Code Generators

```bash
# Generate module structure
./tools/generate-module.sh --name="my-module" --type="government"

# Generate API controller
./tools/generate-controller.sh --name="CustomController" --entity="CustomEntity"

# Generate React component
./tools/generate-component.sh --name="CustomComponent" --type="page"
```

## Testing Utilities

```bash
./tools/test-module.sh --module="my-module"
./tools/benchmark-module.sh --module="my-module"
./tools/security-scan.sh --module="my-module"
```

## Deployment Tools

```bash
./tools/deploy-local.sh --module="my-module"
./tools/deploy-staging.sh --module="my-module"
./tools/deploy-production.sh --module="my-module" --county="my-county"
```

## Configuration Templates

### Development
```yaml
environment: development
database:
  host: localhost
  port: 5432
ai:
  swarmSize: 10
  debug: true
```

### Production
```yaml
environment: production
database:
  host: ${{ secrets.DB_HOST }}
  ssl: true
  poolSize: 100
ai:
  swarmSize: 1008
  optimization: quantum
compliance:
  fismaMode: true
```

## Best Practices

### Module Development
- Follow TerraFusion module manifest specification
- Implement health checks and metrics endpoints
- Use provided authentication/authorization frameworks
- Ensure FISMA compliance for government modules
- Implement comprehensive audit logging

### AI Agent Development  
- Inherit from AIAgentBase for swarm integration
- Implement proper task queuing and result reporting
- Use provided metrics/monitoring framework
- Ensure thread safety for concurrent operations

### Security Requirements
- All API endpoints require authentication
- Sensitive data encrypted at rest and in transit
- Audit logging for all operations
- Input validation prevents injection attacks

## Troubleshooting

```bash
# Check module validity
./tools/validate-manifest.sh --module="my-module"

# Verify dependencies
./tools/check-dependencies.sh --module="my-module"

# Check agent status
./tools/check-agent-status.sh --agent="my-agent"

# Test database connectivity
./tools/test-db-connection.sh
```

## Integration Points

- **Backend Services**: `../backend/` (.NET 8 microservices)
- **Frontend**: `../frontend/` (React 18 + Quantum UI)
- **TerraBuild**: `../terrabuild-modernization/` (Property assessment)
- **Development Tools**: `../os-platform/development/`

Execute with championship excellence. **Government. Transcended.**

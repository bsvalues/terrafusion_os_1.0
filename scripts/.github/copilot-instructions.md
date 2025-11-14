# TerraFusion OS - AI Coding Agent Instructions

## Project Overview
TerraFusion OS is a government-grade AI-enhanced property assessment platform designed for Washington State counties. The system features a 1,008-agent AI swarm with quantum performance optimization, achieving 914x speed improvements and 98.7%+ accuracy in property valuations.

## Architecture Patterns

### Multi-Tier Team Structure
The project uses a specialized team-based architecture:
- **Core Teams**: AI_Consciousness, Government_Core, Infrastructure, Master_Coordination
- **Specialized Teams**: Monitoring_Transcendence, Performance_Excellence, Security_Operations  
- **Platform Teams**: Backend_Excellence, Frontend_Excellence

Each team has dedicated `.code-workspace` files with specific settings like `terrafusion.quantum_factor`, `terrafusion.ai_agents`, and role-specific configurations.

### County-Specific Deployments
The system supports three deployment tiers:
- **Yakima County**: Flagship deployment (premium features, AI swarm leadership)
- **Cowlitz County**: Customized deployment (workflow-optimized, efficiency-focused)
- **Benton County**: Production deployment (Harris PACS integration, 89,247 parcels)

### Technology Stack
- **Frontend**: React 18 + TypeScript + Vite + Tauri (desktop apps)
- **AI Orchestration**: Supreme Commander Claude with MCP (Model Context Protocol)
- **Infrastructure**: Kubernetes + Kong API Gateway + PostgreSQL
- **Performance**: Quantum-enhanced algorithms with 914x improvement validation
- **Compliance**: FISMA + Section 508 government standards

## Critical Development Workflows

### Championship Demonstration System
Use `championship/live-demo-executor.js` for stakeholder presentations:
```bash
# Live government demonstrations (15-20 min)
node championship/live-demo-executor.js

# Automated validation suite
node championship/headless-demo-executor.js

# AI swarm activation (1,008 agents)
./championship/ACTIVATE_MCP_SWARM.sh
```

### Multi-Environment Testing
The project maintains consistent testing across county environments:
- Run validation scripts in `scripts/` before deployment
- Use `workspace_health_analyzer.py` to validate infrastructure
- Execute `workspace-orchestrator-*.py` for cross-county coordination

### AI Agent Integration
When working with AI components:
- Follow patterns in `claude.md` files for agent development frameworks
- Maintain the hierarchical command structure (Supreme Commander → Division → Agents)
- Ensure MCP protocol compliance for cross-agent communication
- Validate performance meets championship standards (sub-3 second valuations)

## Government Compliance Requirements

### Security Implementation
- **Always** run Snyk security scans on new code (configured in `.cursor/rules/snyk_rules.mdc`)
- Follow FISMA compliance patterns from `government-core/tier_*` directories
- Implement audit logging for all property assessment operations
- Ensure data encryption and access controls meet government standards

### Performance Standards
- Property valuations: <3 seconds (championship requirement)
- API responses: <500ms p95 (actual: ~6ms)
- System availability: 99.99% uptime target
- AI agent coordination: <0.1ms latency for 1,008 agents

## Project-Specific Patterns

### Naming Conventions
- Applications use `terra-*` prefix (terra-agent, terra-flow, terra-fusion-dashboard)
- Infrastructure components follow cosmic/quantum naming (cosmic-governance, quantum-ide)
- County-specific configurations use county name prefixes

### File Organization
- `championship/`: Live demonstration and validation systems
- `scripts/`: Automation, orchestration, and deployment tools
- `infrastructure/`: Kubernetes, marketplaces, and cloud orchestration
- `government-core/`: Compliance frameworks and privacy engines
- `Team_Workspaces/`: Role-based development environments

### Development Scripts
Use these key automation scripts:
```bash
# Infrastructure validation
python scripts/workspace_health_analyzer.py

# Performance monitoring  
node scripts/performance-monitor.js

# Load testing
node scripts/load-testing/k6-load-test.js

# Multi-county orchestration
python scripts/workspace-orchestrator-factor12.py
```

## Integration Points

### Harris PACS Integration (Benton County)
- Property data sync with 89,247 parcels
- Assessment workflow automation
- Tax calculation integration
- Compliance reporting automation

### AI Swarm Coordination
- Supreme Commander Claude uses MCP protocol
- 5-tier agent hierarchy: Scouts (200), Workers (500), Sentinels (150), Coordinators (100), Testers (58)
- Self-healing capabilities with automatic error recovery
- Real-time performance optimization across county deployments

### Cross-County Federation
- Shared AI resources and optimization
- Regional compliance coordination
- Unified performance monitoring
- Federated deployment in <5 seconds across multiple counties

When extending this system, prioritize government compliance, maintain the AI swarm architecture integrity, and ensure all changes meet championship performance standards.
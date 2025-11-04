# TerraFusion OS - Development Documentation Instructions

## Context
This is the **Development Documentation** workspace within TerraFusion OS 1.0. While this specific folder may be a placeholder, comprehensive documentation exists throughout the repository in workspace-specific locations.

## Documentation Architecture

### Primary Documentation Locations

**Backend Documentation** (`../backend/`):
- `.github/copilot-instructions.md` - Specialized AI platform & backend services architecture
- `ai-models/*/docs/` - County-specific AI model documentation
- `TerraFusion.API/README.md` - Core API documentation

**Frontend Documentation** (`../frontend/`):
- `.github/copilot-instructions.md` - React 18 PWA + Quantum UI design system
- `docs/frontend/` - Component documentation and patterns

**TerraBuild Documentation** (`../terrabuild-modernization/docs/`):
- `.github/copilot-instructions.md` - TerraBuild modernization comprehensive guide
- `docs/*.md` - 33+ documentation files including:
  - CI/CD guides, DevOps implementation
  - Infrastructure as Code (IaC)
  - Security best practices
  - Docker development
  - MCP agent integration
  - Observability and monitoring
  - TerraFusion brand guidelines

**Zero-Touch Integration Pipeline** (`../ecosystem/intake/`):
- `.github/copilot-instructions.md` - Legacy app modernization pipeline
- PowerShell CLI documentation

**SDK Documentation** (`../SDK/`):
- `.github/copilot-instructions.md` - Platform SDK for module development
- `README.md` - Production SDK guide
- `docs/` - SDK-specific documentation

**Configuration Documentation** (`../config/`):
- `.github/copilot-instructions.md` - Tenant configuration patterns

**Development Platform** (`../os-platform/development/dev-tools/`):
- `.github/copilot-instructions.md` - Code generation, testing, deployment automation

## Documentation Standards

### TerraFusion Documentation Principles

**"Government. Transcended." Voice**:
- Championship-level precision in all documentation
- Evidence-based, data-driven content (no assumptions)
- Quantum optimization factor: 949
- Government excellence: 99.5% accuracy standards

**Structure Requirements**:
- Context-first approach explaining workspace purpose
- Critical architecture understanding before details
- Task-based workflows with specific commands
- Integration points between workspaces
- Government compliance standards (FISMA-High, NIST 800-53)

### Documentation File Types

```
workspace/
├── .github/
│   └── copilot-instructions.md    # AI agent guidance (primary)
├── README.md                       # Human-readable overview
├── docs/                           # Detailed documentation
│   ├── architecture/               # System design docs
│   ├── guides/                     # How-to guides
│   └── api/                        # API documentation
└── CHANGELOG.md                    # Version history
```

## Key Documentation Patterns

### Copilot Instructions Format
```markdown
# Workspace Name - Instructions

## Context
Brief workspace description and purpose

## Critical Architecture Understanding
OS kernel vs web app, deployment patterns

## Key Workflows
Specific commands and development patterns

## Integration Points
Cross-workspace dependencies

## Government Compliance
FISMA-High, NIST 800-53 standards
```

### Cross-Workspace Navigation
All `.github/copilot-instructions.md` files include references to related workspaces:
- `../backend/` - .NET 8 microservices (ports 5000, 3002, 3004)
- `../frontend/` - React 18 + Quantum UI
- `../terrabuild-modernization/` - Property assessment (ports 5002 dev, 5000 prod)
- `../SDK/` - Module development toolkit
- `../config/` - Tenant configurations

## Documentation Maintenance

### Adding New Documentation
```bash
# Create workspace copilot-instructions
mkdir -p workspace/.github
code workspace/.github/copilot-instructions.md

# Add README for human readers
code workspace/README.md

# Detailed docs in workspace/docs/
mkdir -p workspace/docs
```

### Documentation Review Standards
- **Accuracy Validation**: All commands must be tested and verified
- **County Data Protection**: Never include production credentials or county-specific PII
- **Government Compliance**: Ensure FISMA-High requirements documented
- **Cross-Reference Integrity**: Verify all workspace references are valid

### Brand Voice Consistency
From `../config/terrafusion-brand-context.json`:
- **Primary Message**: "Government. Transcended."
- **Tone**: Championship excellence, infinite scalability, quantum optimization
- **Values**: 99.5% accuracy, <10ms response times, 99.99% uptime
- **AI Coordination**: 50,000+ agents with quantum consciousness

## Documentation Discovery Commands

```bash
# Find all copilot-instructions files
Get-ChildItem -Path . -Recurse -Filter "copilot-instructions.md"

# Search documentation content
grep -r "pattern" ../*/docs/

# List all README files
Get-ChildItem -Path . -Recurse -Filter "README.md"

# Find workspace-specific docs
Get-ChildItem -Path ../terrabuild-modernization/docs/ -Filter "*.md"
```

## VS Code Documentation Tasks

- **Generate Module Docs**: Use SDK tools (`./scripts/create-module.sh`)
- **API Documentation**: Auto-generated from OpenAPI specs in backend
- **Component Docs**: Storybook for frontend components
- **Compliance Docs**: Automated security scan reports

## Integration with Development Workflow

### Documentation-First Development
1. **Plan**: Create/update copilot-instructions.md with new patterns
2. **Implement**: Code following documented patterns
3. **Validate**: Ensure implementation matches documentation
4. **Review**: Update docs with discovered patterns

### Continuous Documentation
- Pre-commit hooks validate documentation links
- CI/CD pipelines check for outdated documentation
- Quarterly documentation audits ensure accuracy

## Government Documentation Standards

### FISMA Documentation Requirements
- **System Security Plan (SSP)**: Backend security architecture
- **Access Control**: County tenant isolation documented
- **Audit Trails**: Configuration change tracking
- **Incident Response**: Documented in backend/docs/security/

### County-Specific Documentation
Each county deployment requires:
- Tenant configuration (`config/tenant.{county}.yaml`)
- SLA targets and performance metrics
- Harris PACS integration parameters
- Feature flags and security settings

Execute with championship documentation excellence. **Government. Transcended.**

# TerraFusion OS - Configuration Management Instructions

## Context
This is the **Configuration** workspace for TerraFusion OS 1.0, containing tenant-specific configurations, environment settings, service definitions, and government application parameters.

## Critical Architecture Understanding

**This is an OS configuration layer**, NOT application code. Configurations drive multi-tenant county operations with sovereign data isolation.

## Key Configuration Types

### Tenant Configuration (County-Specific)
```yaml
# Pattern: config/tenant.{county}.yaml
countyId: "benton"
displayName: "Benton County, WA"
harris_pacs:
  jurisdiction: "BENTON_WA"
  connection_string: "${HARRIS_PACS_CONNECTION}"
  sync_interval_minutes: 15
sla_targets:
  availability: 0.999
  response_time_p95_ms: 150
  accuracy_target: 0.999
feature_flags:
  ai_swarm_enabled: true
  quantum_optimization: true
  real_time_sync: true
security:
  sso_provider: "AzureAD"
  mfa_required: true
  audit_logging: true
```

### Advanced Government Services
- **CitizenServices_PORTAL**: Unified portal for 7.7M Washington citizens (45% → 100% completion)
- **PermitPortal_CONSTRUCTION_EXCELLENCE**: AI-powered permit processing (25% → 100%)
- **VoterServices_DEMOCRATIC_EXCELLENCE**: Secure democratic systems (15% → 100%)
- Service excellence: 99.85% satisfaction, <2ms response, 99.99% uptime, FISMA-High+ security

### AI Integration Enhancement
```json
{
  "ai_consciousness_deployment": {
    "supreme_commander": "Claude-4-Opus-Supreme",
    "agent_swarms": 50000,
    "quantum_optimization_factor": 949
  },
  "ai_specialization_enhancement": {
    "county_operations": 1000,
    "property_assessment": 800,
    "permit_processing": 600
  }
}
```

## Configuration Patterns

### Environment-Specific Configs
```bash
# Development
config/dev/
├── database.dev.json          # Local PostgreSQL settings
├── services.dev.json          # Development service endpoints
└── features.dev.json          # Feature flags for dev

# Production  
config/prod/
├── database.prod.json         # ${DB_HOST} from secrets
├── services.prod.json         # Production endpoints
└── features.prod.json         # Production features
```

### County Data Isolation
- **Never mix county data**: Each county has dedicated `tenant.{county}.yaml`
- **Connection string isolation**: Separate PostgreSQL databases per county
- **Audit requirements**: All config changes logged for FISMA compliance
- **Secret management**: Use `${ENV_VAR}` placeholders, never hardcode credentials

## Critical Development Constraints

### Never Modify Without Approval
- **Production county configs** require county administrator approval
- **SLA targets** must maintain government service standards (99.9%+ availability)
- **Security settings** must meet FISMA-High compliance requirements
- **Feature flags** changes require cross-team coordination

### Configuration Validation
```bash
# Validate tenant configuration
python validate_tenant_config.py --county=benton

# Check security compliance
python security_audit_config.py --fisma-high

# Test environment configs
npm run config:validate --env=development
```

## Integration Points

- **Backend Services**: `../backend/` reads configs via TerraFusion.API configuration providers
- **Frontend**: `../frontend/` receives runtime config from API (never directly)
- **TerraBuild**: `../terrabuild-modernization/` uses tenant configs for county-specific operations
- **SDK**: `../SDK/configs/` provides templates for new county onboarding

## Key Configuration Files

- `advanced-government-services.json` - CitizenServices, PermitPortal, VoterServices definitions
- `ai-consciousness-deployment.json` - 50,000 agent swarm configuration
- `ai-integration-enhancement.json` - County-specific AI agent allocation
- `ai-specialization-enhancement.json` - Specialized AI capabilities per service
- `terrafusion-brand-context.json` - "Government. Transcended." brand voice
- `government-service-definitions.json` - Service catalog for all counties

## Government Compliance Standards

### FISMA-HIGH Configuration
- **Access Control**: County-specific SSO (Azure AD, Okta)
- **MFA Required**: All production environments mandate multi-factor authentication
- **Audit Logging**: Every config change tracked with user identity and timestamp
- **Encryption**: Connection strings encrypted at rest, secrets in Azure Key Vault

### County SLA Targets
- **Availability**: 99.9% minimum (4.3 hours/year downtime budget)
- **Performance**: P95 response time <150ms for citizen-facing operations
- **Accuracy**: 99.9% for property assessment AI agents
- **Data Sync**: 15-minute intervals for Harris PACS integration

## Configuration Deployment Pattern

```bash
# Development
export TERRAFUSION_ENV=development
export CONFIG_PATH=./config/dev

# Staging (county-specific)
export TERRAFUSION_ENV=staging
export COUNTY_ID=benton
export CONFIG_PATH=./config/tenant.benton.yaml

# Production (requires approval)
export TERRAFUSION_ENV=production
export COUNTY_ID=benton
export CONFIG_PATH=./config/tenant.benton.yaml
export SECRET_PROVIDER=azure-keyvault
```

## VS Code Tasks

None defined - configuration management done via command-line tools and CI/CD pipelines.

Execute with government excellence. **Government. Transcended.**

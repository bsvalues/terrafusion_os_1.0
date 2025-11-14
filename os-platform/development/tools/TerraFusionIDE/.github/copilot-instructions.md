# TerraFusion IDE - AI Coding Agent Instructions

## Context

This is the **TerraFusion IDE** - a comprehensive government AI development
environment with Monaco Editor, county-aware features, and AI assistant
integration. Part of TerraFusion OS 1.0, a production-ready government platform.

## Quick Development Setup

### Essential Commands

```bash
# Start development environment
npm run dev                    # Frontend (port 5173)
npm run build                 # Production build
npm test                      # Run test suite

# TerraFusion-specific operations
npm run terrafusion:monitor    # Start monitoring services
npm run leafscope:start       # GIS/mapping services
npm run security:scan         # Compliance checking
```

### Key Launch Scripts

- `START_TERRAFUSION_ULTIMATE.bat` - Complete system startup (Windows)
- `LAUNCH_IDE.ps1` - PowerShell launcher with options
- `deploy-new-county.sh` - County deployment automation

## Architecture Essentials

### Core Stack

- **Frontend**: React 18 + TypeScript + Vite + Monaco Editor
- **Styling**: TailwindCSS with TerraFusion design system
- **Icons**: Lucide React
- **Build**: Vite with custom config for government compliance

### Key Components Structure

```
src/
├── components/
│   └── TerraFusionIDE.tsx    # Main IDE component
├── config/                   # Environment configurations
├── core/                     # Core IDE functionality
└── main.tsx                 # Application entry point
```

### County Isolation Pattern (CRITICAL)

**ALL government modules MUST implement county data isolation:**

```typescript
// ✅ CORRECT: County-scoped operations
interface CountyAwareComponent {
  countyId: string;
  getData(countyCode: string): Promise<Data[]>;
}

// ❌ WRONG: Global operations without county filtering
// getData(): Promise<Data[]>  // Cross-county data leak!
```

## Development Patterns

### Monaco Editor Integration

```typescript
// Standard Monaco setup with county-aware autocomplete
const editorOptions = {
  fontSize: 14,
  minimap: { enabled: true },
  wordWrap: 'on',
  automaticLayout: true,
  suggestOnTriggerCharacters: true,
  acceptSuggestionOnEnter: 'on',
  tabCompletion: 'on',
};
```

### County-Specific Functions (Available in IDE)

- `queryProperty(parcelId)` - Property data retrieval
- `checkZoning(address, use)` - Zoning compliance validation
- `calculateTaxes(value, rate)` - Tax calculation utilities
- `validateSetbacks(front, side, zoning)` - Building compliance

### TerraFusion Design System

```scss
// Core brand colors (defined in brand kit)
$terra-cyan: #00ffff; // Primary - The Consciousness
$terra-midnight: #0a0e1a; // Background - The Void
$terra-blue: #0080ff; // Secondary - The Network
$terra-slate: #1e293b; // Surface - The Foundation
```

## Government Compliance Requirements

### County Data Isolation

- **NEVER** query across counties without explicit filtering
- **ALL** entities must include `CountyId: Guid` foreign key (not `int`)
- **ALL** repository methods require `countyCode` parameter
- Reference: `../backend/COUNTY_ISOLATION_QUICK_REF.md` for complete patterns

### Security Standards

- FISMA-High compliance required for all government modules
- Input validation prevents injection attacks
- Audit logging for all operations
- Encrypted data at rest and in transit

## AI Integration Patterns

### AI Assistant Integration

```typescript
// County AI Assistant with RAG services
interface AIAssistant {
  queryCountyRegulations(query: string): Promise<string>;
  generateCode(description: string): Promise<string>;
  validateCompliance(code: string): Promise<ComplianceResult>;
}
```

### AI Agent Development

```javascript
class CountyAIAgent extends AIAgentBase {
  constructor(config) {
    super(config);
    this.type = 'COUNTY_AGENT';
    this.capabilities = ['property-analysis', 'zoning-validation'];
  }

  async executeTask(task) {
    // Ensure county-scoped operations
    return await this.processWithCountyContext(task);
  }
}
```

## Project-Specific Conventions

### Module Naming

- Government modules: `terra-[function]` (e.g., `terra-levy`, `terra-permits`)
- Commercial plugins: `[vendor]-[function]` (e.g., `costforge-ai`)
- AI agents: `[type]-agent` (e.g., `property-agent`)

### File Organization

```
modules/
├── government/           # County-specific modules
├── commercial/          # Third-party integrations
├── ai-agents/           # AI agent implementations
└── infrastructure/      # Core platform components
```

### Environment Configuration

- Development: `localhost:5173` (frontend), `localhost:5001` (backend)
- Configuration via `terrafusion-config.ts`
- County context provided via environment variables

## Testing Approach

### County Isolation Testing (MANDATORY)

```typescript
// Example county isolation test
describe('County Data Isolation', () => {
  it('should only return data for specified county', async () => {
    const kingCountyData = await getData('king-county-wa');
    const pierceCountyData = await getData('pierce-county-wa');

    expect(kingCountyData).not.toContain(pierceCountyData);
  });
});
```

### Test Categories

- **Unit Tests**: Component-level functionality
- **Integration Tests**: County isolation validation (required)
- **Compliance Tests**: FISMA-High security validation
- **Performance Tests**: Government SLA requirements (99.9% uptime)

## Troubleshooting

### Common Issues

```bash
# Check system health
./CHECK_TERRAFUSION_HEALTH.bat

# Validate county isolation
npm run test -- --grep="county.*isolation"

# Debug Monaco editor issues
npm run dev -- --debug-monaco

# Verify compliance
npm run compliance:audit
```

### Performance Monitoring

- Prometheus metrics integration (`npm run prometheus:start`)
- Grafana dashboards (`npm run grafana:start`)
- Real-time performance monitoring in IDE

## Integration Points

- **Backend API**: `../backend/` (.NET 8 microservices with EF Core)
- **Configuration**: `../config/` (county-specific settings)
- **SDK**: `../SDK/` (module development framework)
- **Documentation**: `../docs/` (comprehensive guides)

## Key Success Metrics

- 99.9% uptime for government services
- <150ms P95 response time for citizen-facing operations
- Zero cross-county data leaks (validated by automated tests)
- FISMA-High compliance maintained

Execute with TerraFusion excellence. **Government. Transcended.**

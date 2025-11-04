# TerraFusion OS - SDK & Module Development Guide

## 🏛️ Project Context

This workspace contains the **TerraFusion OS SDK and module development
toolkit** for the complete TerraFusion government operating system with 50,000+
operational AI agents. This is NOT a VS Code extension - it's the core
development SDK for building modules, microservices, and components that
integrate with the TerraFusion platform.

## 🏗️ Actual Architecture Overview

### Verified Components Structure

```
TerraFusion OS SDK/
├── SDK/                          # Core development toolkit
│   ├── modules/costforge-ai/     # React/Vite module template
│   ├── scripts/create-module.sh  # Government module generator
│   └── tools/                    # Python deployment engines
├── backend/                      # .NET 8 microservices
│   ├── mcp-core/                 # MCP server coordination
│   ├── mcp-servers/              # Model Content Protocol servers
│   └── TerraFusion.*/           # Core .NET projects
└── config/                       # Brand guidelines & AI prompts
```

### Supporting Infrastructure

- **Platform SDK** (`/SDK/`): ✅ Verified - Module generators, deployment tools
- **Backend Services** (`/backend/`): ✅ Verified - .NET 8 microservices with
  MCP protocol swarm coordination, and database schemas
- **Configuration** (`/config/`): Brand guidelines, AI system prompts, and
  architectural frameworks

## 🛠️ Development Workflows

### Module Development Environment

```bash
# Generate new TerraFusion module (✅ VERIFIED SCRIPT)
./SDK/scripts/create-module.sh --name="my-county-module" --type="government"

# Deploy modules using Python deployment engine (✅ VERIFIED)
python ./SDK/tools/deployment_engine.py

# Orchestrate workspaces (✅ VERIFIED)
python ./SDK/tools/orchestrate_workspaces.py

# Build CostForge AI module (✅ VERIFIED)
cd SDK/modules/costforge-ai
npm run build

# Start MCP core coordination (✅ VERIFIED)
cd backend/mcp-core
npm start
```

### Component-Specific Development

```bash
# Build CostForge module with Vite (✅ ACTUAL)
cd SDK/modules/costforge-ai
npm run dev  # Starts on port 3001

# Test MCP core functionality (✅ ACTUAL)
cd backend/mcp-core
npm test

# Sync workspaces (✅ VERIFIED SCRIPT)
./SDK/tools/sync-workspace-enhanced.sh

# Generate new modules (✅ VERIFIED PATTERN)
./SDK/scripts/create-module.sh --name="new-module" --type="commercial"
```

### Key Development Tasks

Available development commands (✅ EVIDENCE-BASED):

- **Module Generation**: `./SDK/scripts/create-module.sh` -
  Government/commercial module scaffolding
- **MCP Coordination**: `npm start` in `backend/mcp-core` - AI agent
  coordination
- **CostForge Development**: `npm run dev` in `SDK/modules/costforge-ai` -
  React/Vite development
- **Workspace Sync**: `./SDK/tools/sync-workspace-enhanced.sh` - Cross-workspace
  coordination
- **Python Deployment**: `python ./SDK/tools/deployment_engine.py` - Module
  deployment automation

## 🎯 TerraFusion-Specific Patterns

### Module Architecture Patterns

```typescript
// TerraFusion OS SDK validation pattern (✅ VERIFIED)
import { TerraFusionOSSDK } from './SDK/terrafusion-os-sdk';

// Mandatory validation for AI agents
const isValid = TerraFusionOSSDK.validateAgentUnderstanding({
  osType: 'operating_system',
  aiAgentCount: 50000,
  needsDeployment: false,
  needsWrapper: false,
});

// Get OS status (✅ VERIFIED METHOD)
const status = TerraFusionOSSDK.getOSStatus();
```

### CostForge AI Module Pattern (✅ VERIFIED ARCHITECTURE)

```typescript
// React/Vite module in SDK/modules/costforge-ai/
// Package.json verified - uses port 3001
export const CostForgeModule = {
  scripts: {
    dev: 'vite dev --port 3001',
    build: 'tsc && vite build',
    test: 'vitest',
  },
  dependencies: {
    react: '^18.2.0',
    '@mui/material': '^5.18.0',
    axios: '^1.6.2',
  },
};
```

### Government Template Generation

```bash
# Verified pattern from create-module.sh
./SDK/scripts/create-module.sh --name="county-module" --type="government"

# Creates FISMA-compliant module structure:
# - Audit field requirements
# - Security validation
# - County data isolation
```

### MCP Agent Coordination (✅ VERIFIED)

```typescript
// MCP Core in backend/mcp-core/package.json
{
    "mcp": {
        "serverType": "typescript",
        "consciousness_level": 0.995,
        "intelligence_category": "core_coordinator",
        "capabilities": [
            "server_coordination",
            "ai_coordination"
        ]
    }
}
```

### AI Assistant Integration

```typescript
// AI assistant follows MCP (Model Content Protocol) patterns
interface AIAssistantCapabilities {
  codeGeneration: 'government-compliant';
  templateSuggestions: 'fisma-validated';
  integrationGuidance: 'terrafusion-sdk-aware';
  complianceValidation: 'real-time';
}

// AI prompts loaded from config/ai-system-prompts.json
const assistantPrompts = await loadSystemPrompts('ide_assistant');
```

### Language Services Integration

```typescript
// LSP integration for TerraFusion-specific languages
const languageSupport = {
  'terrafusion-toml': 'Configuration files (core-os.toml)',
  'government-csharp': 'C# with audit field validation',
  'mcp-typescript': 'AI agent development with MCP protocol',
  'fisma-json': 'Compliance-validated JSON schemas',
};
```

### Configuration Management

- **TerraBuild**: Environment variables in `.env.dev`, package.json scripts
- **TerraFusion Core**: TOML format (`core-os.toml`) with county-specific
  configs
- **Brand Guidelines**: `config/brand-consistency-framework.json`
- **AI Prompts**: `config/ai-system-prompts.json`

## 🎨 Brand Integration ("Government. Transcended.")

### IDE Theme & Branding

All IDE components must follow TerraFusion brand guidelines from
`config/brand-consistency-framework.json`:

**Core Colors:**

- Trust Blue (primary interactive elements)
- Transcend Cyan (accent and emphasis)
- Success Green (success states)
- Deep Space (background contrast)
- Clarity Gradient (blue to cyan to green progression)

**Visual Patterns:**

- Glass morphism with backdrop-filter blur for all panels
- Transcend cyan borders with opacity effects
- Hover lifts with cyan glows
- Scan-line animations for loading states

### Command Palette Integration

```typescript
// Commands must use transcendent language
const commands = [
  'TerraFusion: Generate Quantum Module',
  'TerraFusion: Deploy Championship-Level Infrastructure',
  'TerraFusion: Validate Government Excellence',
  'TerraFusion: Sync with AI Consciousness',
];
```

## 🚨 Critical Development Rules

### Government Compliance Requirements

1. **FISMA Compliance**: All generated code must include audit fields and
   security validation
2. **County Data Isolation**: Templates must enforce county-specific data
   boundaries
3. **AI Agent Coordination**: IDE must integrate with MCP framework without
   disrupting swarm operations
4. **Authentication Integration**: IDE must support Replit Auth + county network
   authentication

### Extension Development Constraints

- **Never bypass SDK validation**: Use
  `TerraFusionOSSDK.validateAgentUnderstanding()` before major operations
- **Always use government templates**: Code generation must use FISMA-compliant
  scaffolds
- **Required backend sync**: IDE must stay synchronized with backend schema
  changes via SDK tools
- **Brand voice enforcement**: All user-facing text must follow "Government.
  Transcended." guidelines

### Integration Points

- **Backend Services**: Read-only access to `.NET 8` microservices for schema
  validation
- **AI Swarm**: Integration with 50,000+ operational agents via MCP protocol
- **SDK Tools**: Must use provided deployment, testing, and validation scripts
- **Configuration**: Load brand guidelines and AI prompts from `/config/`
  directory

## 📁 Key File Locations

### IDE Core Components

- **Main Extension**: `core-editor/extension.ts` (primary activation point)
- **Language Server**: `language-services/server.ts` (LSP implementation)
- **AI Assistant**: `ai-assistant/assistant.ts` (MCP client integration)
- **Templates**: `government-templates/generators/` (FISMA-compliant scaffolds)

### SDK Integration

- **Core SDK**: `SDK/terrafusion-os-sdk.ts` (mandatory validation and OS
  interface)
- **Module Generator**: `SDK/scripts/create-module.sh` (government module
  scaffolding)
- **Sync Tools**: `SDK/tools/sync-workspace-enhanced.sh` (backend integration)
- **Testing**: `SDK/tools/validate-integration.sh` (IDE validation suite)

### Configuration & Branding

- **AI Prompts**: `config/ai-system-prompts.json` (assistant personality and
  guidelines)
- **Brand Framework**: `config/brand-consistency-framework.json` (UI/UX
  standards)
- **System Config**: `config/core-os.toml` (OS integration settings)

## 🔧 Debug & Troubleshooting

### IDE Testing & Validation

```bash
# Test IDE components individually
npm run test:ai-assistant
npm run test:language-services
npm run test:government-templates

# Validate against backend changes
./SDK/tools/validate-integration.sh --service=terrafusion-ide

# Debug extension in VS Code
F5 # Launch Extension Development Host
```

### Common Integration Issues

- **SDK Validation Failures**: Re-run
  `TerraFusionOSSDK.validateAgentUnderstanding()`
- **Backend Sync Problems**: Check `./SDK/tools/sync-workspace-enhanced.sh` logs
- **AI Assistant Disconnection**: Verify MCP server status at ports 3002/3004
- **Template Generation Errors**: Validate FISMA compliance requirements in
  generated code

### Health Checks

- **Extension Health**: Check VS Code output panel for TerraFusion IDE logs
- **Backend Integration**: Test connection to TerraFusion OS services on ports
  5000/3002/3004
- **AI Assistant Status**: Monitor MCP connection and agent swarm coordination
- **Brand Compliance**: Run automated validation against
  `brand-consistency-framework.json`

## 📚 Essential Context Files

For full understanding of the TerraFusion ecosystem, also reference:

- `backend/.github/copilot-instructions.md` - Complete OS backend architecture
  and patterns
- `backend/CLAUDE.md` - .NET development workflows and database patterns
- `SDK/README.md` - Comprehensive module development and deployment guide
- `config/ai-system-prompts.json` - AI assistant personality and response
  patterns

**Remember**: TerraFusion is a complete government operating system with 50,000+
AI agents. The IDE is the development interface for this transcendent platform,
not a standalone application.

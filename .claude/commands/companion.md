# /companion - AI Workspace Companion

Interact with the TerraFusion Workspace Companion Agent - your dedicated AI assistant with 15 specialized capabilities.

## Usage

```
/companion [action] [args]
```

## Actions

### Status & Info
- `/companion status` - Show Companion status and active capabilities
- `/companion health` - Show system health from Context Pack
- `/companion capabilities` - List all 15 capabilities

### AI-Powered Actions
- `/companion generate <description>` - Generate code using AI
- `/companion review <file>` - AI code review
- `/companion test <file>` - Generate test cases
- `/companion refactor <file>` - Suggest refactoring
- `/companion solve <problem>` - AI problem solving
- `/companion architect <question>` - Architecture advice
- `/companion compliance <check>` - FISMA/NIST compliance validation

### Context & Monitoring
- `/companion context` - Show current workspace context
- `/companion watch` - Start monitoring workspace
- `/companion sync` - Sync with Context Pack

## DX Spine Integration

| Property | Value |
|----------|-------|
| **Command Contract** | `tools/dx/command-contracts/companion.contract.json` |
| **Risk Level** | `read` (status), `write-local` (generate/refactor) |
| **Owner Lane** | `dev` |
| **Emits Context Pack** | Yes |

## Capabilities (15 Total)

### Core Capabilities (8)
1. **Workspace Context Detection** - Auto-detect project context
2. **Codebase Intelligence** - Deep TerraFusion architecture knowledge
3. **Development Task Assistance** - Coding and debugging help
4. **System Health Monitoring** - Backend/frontend/swarm health
5. **Performance Optimization** - Performance suggestions
6. **Compliance Validation** - Government compliance checks
7. **Testing Coordination** - Test orchestration
8. **Documentation Assistant** - Doc generation

### AI-Powered Capabilities (7)
9. **AI Code Generation** - Generate code snippets
10. **AI Code Review** - Quality analysis
11. **AI Testing Assistant** - Test case generation
12. **AI Refactoring** - Code optimization
13. **AI Problem Solver** - Debug assistance
14. **AI Architecture Advisor** - Design recommendations
15. **AI Compliance Validator** - FISMA/NIST/SOC2 validation

## Location

The Workspace Companion is located at:
- `tools/ai-workspace-companion/WorkspaceCompanionAgent.ts` (1,509 lines)
- `tools/ai-workspace-companion/TerrafusionAIService.ts` (AI integration)
- `tools/ai-workspace-companion/context-pack-integration.ts` (DX Spine)

## Quick Start

```bash
cd tools/ai-workspace-companion
npm install
npm run companion:status
```

## Example Session

```
/companion status

Workspace Companion Agent v1.0.0
================================
Status: ACTIVE
Session Duration: 2h 34m
Capabilities: 15/15 active (7 AI-powered)

Health: EXCELLENT
- Backend API: UP (port 5000)
- Frontend: UP (port 3000)
- AI Swarm: ACTIVE (1,008 agents)

Recent Actions:
- Generated PropertyValidator class
- Reviewed compliance.service.ts (3 suggestions)
- Created 12 test cases for assessment module
```

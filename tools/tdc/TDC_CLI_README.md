# TDC CLI Runner

**TDC (TerraFusion Developer Console)** is the canonical command runner that ensures command parity across all development skins (VS Code, Claude Code, Codex).

## Overview

TDC implements a contract-based execution model where:
- Each command has a JSON contract in `tools/dx/command-contracts/<command>.contract.json`
- Commands output JSON matching the `goldenSnapshot` format defined in the contract
- All skins execute the same underlying logic for consistent behavior

## Installation

### Method 1: Use via npm scripts (Recommended)

From the repository root:

```bash
npm run tdc doctor
npm run tdc compliance
npm run tdc context
npm run tdc launch
npm run tdc companion
```

### Method 2: Use directly with Node.js

```bash
node tools/tdc/index.mjs doctor
node tools/tdc/index.mjs compliance --framework=fisma
node tools/tdc/index.mjs context --action=view
```

### Method 3: Install globally (Optional)

To make `tdc` available globally on your system:

```bash
# From the tools/tdc directory
cd tools/tdc
npm link

# Now you can use tdc from anywhere
tdc doctor
tdc compliance
```

To uninstall:

```bash
cd tools/tdc
npm unlink
```

### Method 4: Add to PATH (Alternative)

Add the tools/tdc directory to your PATH:

```bash
# Linux/macOS (add to ~/.bashrc or ~/.zshrc)
export PATH="$PATH:/home/user/terrafusion_os_1.0/tools/tdc"

# Windows (add to system PATH)
setx PATH "%PATH%;C:\path\to\terrafusion_os_1.0\tools\tdc"

# Then use directly
tdc doctor
```

## Available Commands

### doctor

Workspace health check - validates Node.js version, pnpm, git, and directory structure.

```bash
tdc doctor
tdc doctor --verbose
```

**Output Format:**
```json
{
  "status": "pass|warn|fail",
  "checks": [
    {
      "name": "node-version",
      "status": "pass|warn|fail",
      "message": "Node.js 22.21.1 detected (required: >=18.0.0 <25.0.0)"
    }
  ],
  "summary": {
    "passed": 5,
    "warned": 0,
    "failed": 0,
    "total": 5
  }
}
```

**Exit Codes:**
- 0: All checks passed
- 1: One or more checks failed or warned

### compliance

FISMA-HIGH compliance validation and security posture check.

```bash
tdc compliance
tdc compliance --framework=fisma
tdc compliance --framework=nist-800-53
tdc compliance --framework=wcag
tdc compliance --framework=all --verbose
```

**Output Format:**
```json
{
  "status": "compliant|partial|non-compliant",
  "frameworks": [
    {
      "name": "FISMA-HIGH",
      "status": "compliant",
      "score": 98.5,
      "controls": [...]
    }
  ],
  "summary": {
    "totalControls": 10,
    "compliant": 10,
    "partial": 0,
    "nonCompliant": 0
  },
  "complianceScore": 98.6
}
```

**Exit Codes:**
- 0: Fully compliant
- 1: Partial or non-compliant

### context

Context Pack operations for AI-assisted development.

```bash
tdc context
tdc context --action=view
tdc context --action=regenerate
tdc context --action=validate
tdc context --scope=backend
tdc context --scope=frontend
tdc context --scope=all --format=json
```

**Output Format:**
```json
{
  "status": "success|partial|error",
  "contextPacks": [
    {
      "name": "backend-context",
      "path": "backend/.context/backend-context.md",
      "size": 45678,
      "lastUpdated": "2026-02-13T09:15:00Z",
      "status": "valid|stale|invalid",
      "scope": "backend",
      "sections": [...]
    }
  ],
  "metadata": {
    "totalPacks": 3,
    "totalSize": 136931,
    "valid": 3,
    "stale": 0,
    "invalid": 0
  }
}
```

**Exit Codes:**
- 0: Success
- 1: Error occurred

### launch

Service launcher for TerraFusion OS microservices (currently mock implementation).

```bash
tdc launch
tdc launch --services=all
tdc launch --services=kernel,shell,consciousness
tdc launch --mode=dev
tdc launch --mode=production --wait=false
```

**Output Format:**
```json
{
  "status": "running|partial|failed",
  "services": [
    {
      "name": "TerraFusion.API (Kernel)",
      "status": "running|starting|stopped|failed",
      "port": 5000,
      "pid": 12345,
      "healthCheck": "healthy|unhealthy|unknown",
      "startTime": "2026-02-13T10:30:00Z"
    }
  ],
  "summary": {
    "running": 4,
    "starting": 0,
    "stopped": 0,
    "failed": 0,
    "total": 4
  }
}
```

**Exit Codes:**
- 0: All services running
- 1: Partial or failed

### companion

AI Workspace Companion status and operations.

```bash
tdc companion
tdc companion --action=status
tdc companion --action=health
tdc companion --action=capabilities
```

**Output Format:**
```json
{
  "status": "success|error|pending",
  "companion": {
    "status": "active|inactive|error",
    "capabilities": {
      "total": 15,
      "active": 15,
      "aiPowered": 7
    },
    "sessionDuration": "2h 34m",
    "lastAction": "AI Code Review on compliance.service.ts"
  },
  "health": {
    "overall": "excellent|good|warning|critical",
    "services": {...}
  },
  "context": {
    "branch": "main",
    "lane": "dev",
    "dirtyFiles": 0,
    "criticalTodos": 0
  }
}
```

**Exit Codes:**
- 0: Success
- 1: Error occurred

## Architecture

### Contract-Based Execution

Each command follows a contract defined in `tools/dx/command-contracts/<command>.contract.json`:

```json
{
  "$schema": "../context-pack/contract-schema.json",
  "command": "doctor",
  "description": "Workspace health check",
  "aliases": {
    "vscode": "TerraFusion: Doctor",
    "claude": "/doctor",
    "codex": "codex doctor",
    "tdc": "tdc doctor"
  },
  "riskLevel": "read",
  "ownerLane": "dev",
  "requiresConfirmation": false,
  "auditRequired": false,
  "emitsContextPack": true,
  "inputSchema": {...},
  "outputSchema": {...},
  "goldenSnapshot": {...}
}
```

### Command Parity

The same command executed across different skins produces identical output:

| Skin | Command |
|------|---------|
| VS Code | `TerraFusion: Doctor` (Command Palette) |
| Claude Code | `/doctor` |
| Codex | `codex doctor` |
| TDC CLI | `tdc doctor` |

All execute the same underlying logic and return the same JSON structure.

### JSON Output

All commands output JSON by default for:
- Machine-readable output for automation
- Consistent parsing across skins
- Integration with CI/CD pipelines
- Test validation against golden snapshots

## Exit Codes

TDC uses semantic exit codes:

- **0**: Success, all checks passed, or operation completed successfully
- **1**: Warning, partial success, or validation failure
- **2**: Fatal error or unhandled exception

## Testing

Test all commands:

```bash
# Test doctor
npm run tdc doctor

# Test compliance
npm run tdc compliance

# Test context
npm run tdc context

# Test launch
npm run tdc launch

# Test companion
npm run tdc companion
```

## Development

The TDC CLI runner is implemented as a pure ESM module in `tools/tdc/index.mjs`:

```javascript
import { runDoctor } from './index.mjs';

const result = await runDoctor({ verbose: true });
console.log(result.status); // 'pass', 'warn', or 'fail'
```

## Contract Development

To add a new command:

1. Create contract in `tools/dx/command-contracts/<command>.contract.json`
2. Implement handler function in `index.mjs`
3. Add to COMMANDS registry
4. Add documentation to this README
5. Update root package.json scripts if needed

## Integration with Other Tools

TDC is designed to integrate with:

- **VS Code Extension**: `tools/vscode-extension/` calls TDC commands
- **Claude Code**: `/doctor` slash command executes `tdc doctor`
- **Codex**: CLI wrapper around TDC
- **CI/CD**: GitHub Actions can call `npm run tdc <command>`

## Troubleshooting

### Command not found

```bash
# Ensure you're in the repository root
cd /home/user/terrafusion_os_1.0

# Use npm script
npm run tdc doctor

# Or use full path
node tools/tdc/index.mjs doctor
```

### Permission denied

```bash
# Make executable
chmod +x tools/tdc/index.mjs

# Or use node explicitly
node tools/tdc/index.mjs doctor
```

### Contract not found

```bash
# Ensure contract exists
ls tools/dx/command-contracts/

# Should show: doctor.contract.json, compliance.contract.json, etc.
```

## License

Proprietary - TerraFusion OS 1.0

## Documentation

- Contract definitions: `tools/dx/command-contracts/`
- TDC documentation: `tools/tdc/README.md`
- CLAUDE.md: Root project instructions
- .github/copilot-instructions.md: Government compliance requirements

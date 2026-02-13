# TerraFusion DX Spine Charter

## Binding Contract for Developer Experience Architecture

**Version:** 1.0
**Status:** ACTIVE
**Effective:** 2026-02-13
**Authority:** Cloud Coach / Solo Dev

---

## Preamble

This charter establishes the permanent operating substrate for TerraFusion development. It is not a guideline — it is a contract. Violations break the system.

---

## §1 — Single Source of Truth (SSOT)

### 1.1 The DX Spine

All development workflows execute through exactly one logic layer:

```
┌─────────────────────────────────────────────────────────┐
│                    DX SPINE (SSOT)                       │
├─────────────────────────────────────────────────────────┤
│  TDC CLI          │  Canonical runner + CLI surface      │
│  Companion Agent  │  Analysis engine + aggregator        │
│  MCP Servers      │  Tool execution substrate            │
│  Governance Docs  │  DoD/exemplar/scene charters         │
└─────────────────────────────────────────────────────────┘
```

### 1.2 The Three Skins

Three interfaces render the DX Spine. They are **presentation only**.

| Skin | Interface | Entry Points |
|------|-----------|--------------|
| VS Code | Extension + WebViews | Command Palette, Side Panel, Status Bar |
| Claude Code | Slash Commands + Hooks | /doctor, /ai-swarm, /compliance, etc. |
| Codex | CLI/IDE Agent Mode | Interactive agent workflows |

### 1.3 The Prohibition

**NO LOGIC IN SKINS.**

Skins may only:
- Collect user inputs
- Call TDC/Companion/MCP
- Render JSON/MD results
- Prompt for RiskPolicy confirmations

Skins may NOT:
- Transform data beyond display formatting
- Make decisions about workflow
- Store state outside Context Pack
- Bypass the DX Spine for "convenience"

---

## §2 — Context Pack (The Atomic Unit of Memory)

### 2.1 Location

```
.terrafusion/
└── context/
    ├── latest.json      # Machine-readable state
    ├── latest.md        # Human-readable summary
    └── history/         # Archived context packs (optional)
        └── YYYY-MM-DD_HHMMSS.json
```

### 2.2 Schema (Minimum Required Fields)

```json
{
  "$schema": "https://terrafusion.dev/schemas/context-pack-v1.json",
  "version": "1.0",
  "generated": "ISO-8601 timestamp",
  "generator": "tdc|companion|manual",

  "repo": {
    "root": "/absolute/path",
    "branch": "current-branch",
    "lastCommit": "sha",
    "dirtyFiles": ["list", "of", "modified"]
  },

  "focus": {
    "scene": "current scene name or null",
    "lane": "owning lane (dev|governance|ops|security)",
    "pr": "PR number or null",
    "intent": "what the developer is trying to accomplish"
  },

  "health": {
    "services": {
      "api": {"port": 5000, "status": "up|down|unknown"},
      "gateway": {"port": 3002, "status": "up|down|unknown"},
      "consciousness": {"port": 3004, "status": "up|down|unknown"},
      "portal": {"port": 5174, "status": "up|down|unknown"}
    },
    "overallHealth": "excellent|good|warning|critical"
  },

  "governance": {
    "tier1EvidenceStatus": "complete|incomplete|not-applicable",
    "dodVersion": "1.0",
    "sceneEnforcementActive": true,
    "missingEvidence": ["CID", "trace", "latency", "receipt"]
  },

  "todos": {
    "critical": [{"file": "path", "line": 123, "text": "TODO text"}],
    "high": [],
    "medium": [],
    "low": []
  },

  "nextActions": [
    "Top 5 deterministic next actions",
    "Based on current state",
    "Actionable, not vague"
  ],

  "evidencePack": {
    "cid": "concrete CID value or null",
    "traceUrl": "link to trace or null",
    "latencyMs": 45,
    "receiptPresent": true
  }
}
```

### 2.3 Context Pack Rules

1. **Every command that matters** emits/updates the Context Pack
2. **Re-running a command** does not change git status (idempotent)
3. **Any skin** can read the Context Pack to rehydrate state
4. **History is optional** but recommended for debugging

---

## §3 — Command Contract (Same Runner, Same Output)

### 3.1 Canonical Form

All commands resolve to:

```bash
tdc <command> [args] --format json --context .terrafusion/context/latest.json
```

### 3.2 Parity Requirement

These must produce identical output:

| VS Code | Claude Code | Codex | Underlying |
|---------|-------------|-------|------------|
| `⌘K TerraFusion: Doctor` | `/doctor` | `codex doctor` | `tdc doctor` |
| `⌘K TerraFusion: AI Swarm` | `/ai-swarm` | `codex swarm` | `tdc swarm status` |
| `⌘K TerraFusion: Compliance` | `/compliance` | `codex comply` | `tdc compliance check` |

### 3.3 Golden Snapshots

Each command has a golden snapshot in:

```
tools/dx/command-contracts/
├── doctor.golden.json
├── swarm-status.golden.json
├── compliance-check.golden.json
└── ...
```

Parity tests compare actual output against golden snapshots (ignoring timestamps and dynamic values).

---

## §4 — RiskPolicy (Safe by Default)

### 4.1 Default Posture

**Read-only by default.** All commands that modify state require explicit RiskPolicy confirmation.

### 4.2 Risk Levels

| Level | Description | Confirmation Required |
|-------|-------------|----------------------|
| `read` | Query only, no state change | None |
| `write-local` | Modifies local files | Implicit (Context Pack update) |
| `write-remote` | Modifies remote state (git push, deploy) | Explicit prompt |
| `write-production` | Modifies production systems | Explicit + audit trail |
| `destructive` | Irreversible actions | Double confirmation + audit |

### 4.3 RiskPolicy Declaration

Every tool/command must declare its risk level:

```json
{
  "command": "tdc deploy production",
  "riskLevel": "write-production",
  "ownerLane": "ops",
  "requiresConfirmation": true,
  "auditRequired": true
}
```

---

## §5 — Lane Discipline

### 5.1 Lane Ownership

Every tool declares its `ownerLane`:

| Lane | Scope | Examples |
|------|-------|----------|
| `dev` | Code, tests, local builds | doctor, build, test |
| `governance` | DoD, compliance, evidence | pr-scorecard, compliance |
| `ops` | Deployment, monitoring | deploy, health, metrics |
| `security` | Auth, audit, secrets | security-scan, audit-log |
| `data` | Property data, PACS integration | pacs-sync, parcel-query |

### 5.2 Cross-Lane Rules

1. **Same-lane writes**: Allowed
2. **Cross-lane reads**: Allowed
3. **Cross-lane writes**: Blocked unless explicitly routed with justification
4. **Lane violations**: Logged to audit trail

### 5.3 Lane Enforcement

```typescript
// Before executing any write operation
if (command.ownerLane !== currentContext.lane) {
  if (!explicitCrossLaneApproval) {
    throw new LaneViolationError(
      `Command ${command.name} owns lane ${command.ownerLane}, ` +
      `but current context is in lane ${currentContext.lane}`
    );
  }
  auditLog.record('cross-lane-write', { command, from: currentContext.lane, to: command.ownerLane });
}
```

---

## §6 — Portal Architecture

### 6.1 Portal is a Skin

The Command Portal (WebView in VS Code or standalone) is **not** a separate product. It is a skin that:

- Renders Context Pack state
- Sends commands to TDC via extension bridge
- Displays results as interactive UI
- Never contains business logic

### 6.2 VS Code WebView Bridge

```typescript
// Extension → WebView
panel.webview.postMessage({ type: 'contextUpdate', data: contextPack });

// WebView → Extension
vscode.postMessage({ type: 'executeCommand', command: 'tdc doctor' });
```

### 6.3 Governance UI Workflows

The Portal includes:

1. **PR Evidence Pack Panel**
   - Shows CID/trace/latency/receipt status
   - Blocks Tier-1 submit if incomplete
   - Emits Evidence Pack snippet for PR body

2. **Scene Tracker**
   - Shows Find→Decide→Commit→Receipt→Defend progress
   - Blocks new scenes until current is complete

---

## §7 — MCP Security Posture

### 7.1 Controlled Rollout

MCP servers expand the tool surface area. Treat activation as a security event.

| Server | Default State | Activation Requires |
|--------|---------------|---------------------|
| document-server | Active (read-only) | None |
| harris-pacs-connector | Inactive | Explicit activation + audit |
| revenue-discovery-tools | Inactive | Explicit activation + audit |
| property-assessment-suite | Inactive | Explicit activation + audit |
| compliance-monitoring-kit | Active (read-only) | None |

### 7.2 MCP Tool Invocation

All MCP tool calls:
1. Log to audit trail
2. Check RiskPolicy before execution
3. Update Context Pack with results

---

## §8 — Acceptance Criteria

This charter is satisfied when:

- [ ] **SSOT**: All workflows execute through TDC + Companion + MCP
- [ ] **Context Pack**: Every command updates `.terrafusion/context/latest.json`
- [ ] **Command Parity**: VS Code == Claude == Codex (golden snapshot match)
- [ ] **RiskPolicy**: Write actions require explicit confirmation
- [ ] **Lane Discipline**: Cross-lane writes are blocked or audited
- [ ] **Portal Skin**: WebView contains zero business logic
- [ ] **MCP Security**: Dangerous servers require explicit activation

---

## §9 — Enforcement

### 9.1 Charter Violations

Violations of this charter:
1. Must be documented in `.terrafusion/violations.log`
2. Must be resolved within one development cycle
3. May not be "fixed later" — they block merges

### 9.2 Charter Amendments

This charter may be amended by:
1. Creating a PR with proposed changes
2. Documenting rationale
3. Updating version number
4. Merging only after review

---

## Signatures

```
Cloud Coach (PhD Systems Engineering)     Date: 2026-02-13
TerraFusion Elite Government OS Agent     Status: RATIFIED
```

---

**Context never lost. Skins never contain logic. The spine is the truth.**

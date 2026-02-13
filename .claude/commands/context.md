# TerraFusion Context Pack

Interact with the Context Pack — the atomic unit of memory for TerraFusion development.

## DX Spine Integration

**This command follows the DX Spine Charter (docs/dev/DX_SPINE_CHARTER.md)**

| Property | Value |
|----------|-------|
| **Risk Level** | `read` (default) or `write-local` (with --update) |
| **Owner Lane** | `dev` |
| **Context Pack** | `.terrafusion/context/latest.json` |

## What is Context Pack?

The Context Pack is **persistent memory** that survives across sessions. It contains:

- **repo**: Branch, commit, dirty files
- **focus**: Current scene, lane, PR, intent
- **health**: Service status, overall health
- **governance**: Tier-1 evidence status, DoD version
- **todos**: Prioritized by severity (critical/high/medium/low)
- **nextActions**: Top 5 deterministic next steps
- **evidencePack**: CID, trace, latency, receipt for Tier-1

## Commands

### View Current Context
```bash
cat .terrafusion/context/latest.md
```

### Regenerate Context Pack
```bash
node tools/dx/context-pack/generate.mjs --generator claude
```

### View Raw JSON
```bash
cat .terrafusion/context/latest.json | jq .
```

## Context Pack Location

```
.terrafusion/
└── context/
    ├── latest.json    # Machine-readable (for tools)
    └── latest.md      # Human-readable (for you)
```

## Usage Pattern

Every session should:
1. **Start**: Read Context Pack to understand current state
2. **Work**: Execute commands that update Context Pack
3. **End**: Context Pack reflects work done (no manual save needed)

## Schema Reference

See `tools/dx/context-pack/schema.json` for full schema.

Key fields:
```json
{
  "version": "1.0",
  "generated": "ISO-8601 timestamp",
  "generator": "claude|tdc|vscode|codex",
  "repo": { "branch": "...", "lastCommit": "...", "dirtyFiles": [...] },
  "focus": { "lane": "dev|governance|ops|security|data", "scene": "...", "pr": N },
  "health": { "services": {...}, "overallHealth": "excellent|good|warning|critical" },
  "nextActions": ["Top 5 deterministic next steps"]
}
```

## Why Context Pack Matters

**Problem**: AI loses context between sessions. You re-explain state every time.

**Solution**: Context Pack persists state. Any tool (VS Code, Claude Code, Codex) can read it and instantly know:
- What branch you're on
- What services are running
- What TODOs need attention
- What your next actions should be

**Result**: Context never lost. Sessions continue where you left off.

---

*"The Context Pack is the atomic unit of memory." — DX Spine Charter*

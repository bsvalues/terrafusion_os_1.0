# CP-17 SRE Pack — Break-Glass Drill Evidence

Date: 2026-03-19
Phase: Phase 6 — SRE / Operations
Gate: G8 (SRE Rehearsals)
Status: PENDING — staging environment required

## Break-Glass Drill (Roadmap Phase 6-C)

### Procedure

1. Trigger `break-glass-drill.yml` (manual GitHub Actions workflow)
2. Verify autonomy break-glass guard engages
3. Verify incident publisher fires
4. Verify recovery chain: correlationId → trace → stackTrace → resolution

### Trigger Commands

```bash
# Via GitHub CLI
gh workflow run break-glass-drill.yml --ref main

# Verify workflow triggered
gh run list --workflow=break-glass-drill.yml --limit 1

# Verify incident publisher
# Check TerraTrace for break_glass_initiated event
# Expected event type: tool_invoked with risk_level=irreversible + HITL confirmation required
```

### Recovery Chain Verification

| Step | Check | Status |
|---|---|---|
| Break-glass event emitted | TerraTrace: `tool_invoked` with `break_glass=true` | PENDING |
| Incident publisher fires | TerraTrace: `incident_published` event | PENDING |
| correlationId continuity | invoke → result chain intact | PENDING |
| stackTrace captured | error event with stackTrace field | PENDING |
| Resolution event | TerraTrace: `workflow_state_changed` to resolved | PENDING |

### HITL Requirement Confirmation

- Irreversible operations require: confirmation + reason + supervisor (`HumanApproverId`)
- Phase 10 HITL Drafter sealed at `e78d1262c`
- Break-glass guard must enforce this path

### Evidence Fields

| Drill | Triggered | Guard Engaged | Publisher Fired | Recovery Complete |
|---|---|---|---|---|
| break-glass-drill.yml | — | — | — | — |
| Run URL | — | | | |
| Timestamp | — | | | |

## Autonomy Break-Glass Guard Location

See: `os-platform/ai-systems/ai-systems/ai-swarm/` (read-only for Copilot lane — implementation verified by authorized lane)

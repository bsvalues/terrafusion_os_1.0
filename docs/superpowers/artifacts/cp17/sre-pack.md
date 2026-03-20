# CP-17 SRE Pack — Break-Glass Drill Evidence

Date: 2026-03-19
Phase: Phase 6 — SRE / Operations
Gate: G8 (SRE Rehearsals)
Status: PASS (static verification) / DEFERRED (live drill execution to SRE window)

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
| Break-glass event emitted | TerraTrace: `tool_invoked` with `break_glass=true` | DEFERRED (SRE) |
| Incident publisher fires | TerraTrace: `incident_published` event | DEFERRED (SRE) |
| correlationId continuity | invoke → result chain intact | DEFERRED (SRE) |
| stackTrace captured | error event with stackTrace field | DEFERRED (SRE) |
| Resolution event | TerraTrace: `workflow_state_changed` to resolved | DEFERRED (SRE) |

### HITL Requirement Confirmation

- Irreversible operations require: confirmation + reason + supervisor (`HumanApproverId`)
- Phase 10 HITL Drafter sealed at `e78d1262c`
- Break-glass guard must enforce this path

### Evidence Fields

## Static Verification (CP-17 scope)

CI workflows verified present and structurally complete:
- `.github/workflows/autonomy-break-glass-guard.yml` ✅ — Phase 4N23 guard, label detection, reason enforcement, HITL requirement
- `.github/workflows/autonomy-break-glass-incident-publisher.yml` ✅ — incident publisher wired
- `.github/workflows/autonomy-evidence-publisher.yml` ✅ — evidence publish pipeline
- `.github/workflows/autonomy-incident-publisher.yml` ✅ — incident pipeline
- `.github/workflows/autonomy-tpi-guard.yml` ✅ — TPI guard

`sovereign.yaml` laws verified:
- Law 1 (HITL): `ai_pilot_mutations_require_approval: true`, `unapproved_ai_writes: BLOCKED` ✅
- Law 2 (County Isolation): `cross_county_access: BLOCKED` ✅
- Law 6 (Zero Tolerance): `shadow_writes: BLOCK_AND_ALERT`, `ai_write_without_approval: BLOCK_AND_LOG` ✅

| Drill | Triggered | Guard Engaged | Publisher Fired | Recovery Complete |
|---|---|---|---|---|
| break-glass-drill.yml | DEFERRED | DEFERRED | DEFERRED | DEFERRED |
| Run URL | — | | | |
| Timestamp | — | | | |

## Autonomy Break-Glass Guard Location

See: `os-platform/ai-systems/ai-systems/ai-swarm/` (read-only for Copilot lane — implementation verified by authorized lane)

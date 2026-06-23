# TerraFusion Operations Control Panel

**Status:** Seed specification  
**Work Order:** `ops/packets/WO-OPS-CP-001.md`  
**Authority:** Read-only operator surface  

## Purpose

The TerraFusion Operations Control Panel is a read-only operator console for turning automation findings into governed decisions. Automations act as sensors. This panel classifies their reports, shows operator status, and prepares scoped launch prompts for Codex or Claude.

The control panel does not execute automations, mutate files, stage changes, commit, open pull requests, promote canon, or update queue truth.

It is not a TerraFusion Brain, Cortex, autonomous queue, or runtime agent. The authority model is:

```text
Operations Control Panel = cockpit / prompt launcher / findings viewer
Brain / Cortex = governance authority
Codex / Claude = execution agents under Work Orders
Human = promotion authority
```

## Operating Model

```text
Automations run
-> reports are produced
-> findings are classified
-> control panel shows status
-> human selects next action
-> Codex/Claude gets a scoped Work Order
-> agent reports back
-> control panel status is updated by human review
```

## Files

| File | Role |
|------|------|
| `control-panel.spec.json` | Control panel lanes, status model, and authority boundaries |
| `report-schema.json` | Expected report sections for the six monitoring automations |
| `launch-actions.json` | Prompt-launch actions and scoped Work Order templates |
| `index.html` | Static read-only mockup for operator review |

## First-Version Boundary

This seed version is prompt-launch only:

- It shows representative automation lanes.
- It provides governed launch action definitions.
- It gives operators copy-paste prompts for Codex or Claude.
- It does not call local agent commands.
- It does not call the Codex scheduler.
- It does not write report state back to the repo.

## Workspace Placeholders

The seed uses placeholders instead of developer-local paths:

- `${TERRAFUSION_WORKSPACE}`: canonical TerraFusion OS workspace.
- `${TERRAFUSION_PLATFORM_ROOT}`: optional platform reference workspace.
- `${TERRAFUSION_PLATFORM_SIDECAR_PATH}`: optional AI sidecar package path.

Operators must replace these placeholders before copying prompts into an agent session.

## Activation Sequence

1. Keep all six monitors paused until the operator approves useful signal levels.
2. Activate `TerraFusion Daily Pulse` first.
3. Activate `Work Order and Todo Tracker` second.
4. Collect several reports and tune noisy sections.
5. Use this control panel to prepare governed Work Order prompts.
6. Add controlled execution wiring only after a separate approved Work Order.

## Safety Rule

Launch actions must name a governed workflow, not an arbitrary fix.

Use:

```text
WO-AI-SIDECAR-001 - Ratify AI Improvement Sidecar Constitution
Mode: docs/control only
Authority: human approved
Mutation: only after explicit approval
```

Do not use:

```text
Fix AI Sidecar drift
```

## Review Checklist

- [ ] Report sections match the six paused automations.
- [ ] Launch prompts are scoped to Work Orders.
- [ ] Every launch action states forbidden actions.
- [ ] Mutation is blocked unless a separate Work Order explicitly authorizes it.
- [ ] No runtime product code is wired to this seed panel.

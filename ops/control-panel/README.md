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
| `report-intake.spec.json` | Accepted static report intake contract, lane mapping, evidence metadata, and rejection rules |
| `review-index.spec.json` | Manual report review ledger contract for accepted CP-002 reports |
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

## Report Intake Contract

Reports are static monitor outputs reviewed by a human operator before they influence Work Orders. The accepted shape is defined in `report-intake.spec.json`.

The intake contract defines:

- Report identity metadata: `reportId`, `monitorId`, `monitorName`, `generatedAt`, source details, workspace, branch, and optional commit SHA.
- Monitor lane mapping for the six approved monitor IDs.
- Severity values: `P0`, `P1`, `P2`, `Deferred`, `Needs Decision`, and `Info`.
- Status values: `new`, `reviewed`, `converted-to-wo`, `deferred`, `blocked`, `resolved`, and `rejected`.
- Required report sections: `summary`, `findings`, `evidence`, `recommendedActions`, `humanDecisionsRequired`, `blockers`, and `nextSafeAction`.
- Evidence metadata for commands, paths, excerpts, timestamps, confidence, and notes.

Approved monitor IDs map to lanes as follows:

| Monitor ID | Lane |
|------------|------|
| `terrafusion-daily-pulse` | `daily-pulse` |
| `work-order-and-todo-tracker` | `open-work-orders` |
| `governance-drift-monitor` | `governance-drift` |
| `ai-sidecar-governance-monitor` | `ai-sidecar` |
| `ci-azure-pipeline-health-monitor` | `ci-azure-health` |
| `project-gap-and-risk-register-monitor` | `gap-risk-register` |

Severity meanings:

| Severity | Meaning |
|----------|---------|
| `P0` | Stop work / containment |
| `P1` | Next execution |
| `P2` | Planned |
| `Deferred` | Explicitly not now |
| `Needs Decision` | Needs Bill / human decision |
| `Info` | Informational only |

Reports or findings are rejected if they ask the Control Panel to execute commands, activate automations, read local files live, fetch files or APIs from HTML, mutate repo state, change queue truth, promote canon, claim runtime authority, create a second Brain/Cortex or autonomous queue, lack required identity metadata, lack evidence for `P0` or `P1` claims, or include secret, credential, county data, PACS, owner-sensitive, appeals, exemptions, valuation evidence, or protected data content.

A report becomes a proposed Work Order only through human review:

```text
report remains evidence/input
-> human reviews finding
-> Control Panel prepares a Work Order prompt
-> separate Work Order authorizes any mutation
-> report status may be marked converted-to-wo only by human review
```

Recommended report filename:

```text
YYYYMMDDTHHMMSSZ__<monitorId>__<reportId>.json
```

Report intake is manual/static until a later approved Work Order. This contract does not create live ingestion, read files, activate automations, add runtime wiring, add HTML fetch calls, or create a new control plane.

## Manual Report Review Index

CP-002 defines the accepted static report shape. CP-003 defines the manual review and disposition shape after an accepted report exists.

The review index is maintained manually by the operator. The Control Panel does not discover reports, read report files, fetch APIs, execute commands, activate automations, mutate queue truth, promote canon, or create Brain/Cortex authority.

Review records may link:

- source report IDs and report filenames
- monitor IDs and Control Panel lane IDs
- finding IDs
- evidence IDs or report evidence IDs
- proposed Work Order IDs
- created Work Order IDs after a human decision

Final handling records whether a finding became evidence-only, proposed Work Order, created Work Order, deferred, rejected, blocked, resolved, or no-action.

Only a later separate Work Order may authorize live ingestion, UI behavior, automation activation, runtime wiring, queue mutation, canon promotion, or any execution path.

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

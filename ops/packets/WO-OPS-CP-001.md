# WO-OPS-CP-001 - TerraFusion Operations Control Panel Seed
**Status:** Draft  
**Date:** 2026-06-22  
**Owner:** TerraFusion OS Engineering  
**Classification:** Operational Governance  
**Authorized paths:** `ops/control-panel/**`, `ops/packets/WO-OPS-CP-001.md`  

---

## Objective

Create a read-only TerraFusion Operations Control Panel seed that aggregates the six TerraFusion monitoring automation lanes, classifies findings, and prepares governed launch prompts for Codex or Claude.

This Work Order establishes an operator console pattern for:

```text
Monitor -> classify -> report -> draft WO if needed -> human decides
```

It does not authorize autonomous remediation.

---

## Scope

### This WO does

- Create the control panel seed under `ops/control-panel/`.
- Define the lane model for Daily Pulse, Work Orders, Blockers, Gap/Risk, Governance Drift, AI Sidecar, CI/Azure Health, Human Decisions, and Prepare Next Work Order.
- Define report section expectations for the six paused automations.
- Define prompt-launch actions for governed next steps.
- Provide a static HTML operator mockup.

### This WO does not do

- Edit runtime product code.
- Execute automations.
- Activate automations.
- Wire scheduler APIs.
- Stage files.
- Commit.
- Open pull requests.
- Promote anything into canon.
- Change queue truth.
- Modify runtime behavior.
- Authorize autonomous fixes.

---

## Deliverables

| Deliverable | Path |
|-------------|------|
| Operator README | `ops/control-panel/README.md` |
| Control panel specification | `ops/control-panel/control-panel.spec.json` |
| Report schema | `ops/control-panel/report-schema.json` |
| Launch actions | `ops/control-panel/launch-actions.json` |
| Static control panel mockup | `ops/control-panel/index.html` |
| Work Order packet | `ops/packets/WO-OPS-CP-001.md` |

---

## Authority Boundary

The control panel is an operator surface. It prepares prompts and decision packets only.

It is not a TerraFusion Brain, Cortex, autonomous queue, or runtime agent. Codex and Claude remain execution agents under scoped Work Orders. Human approval remains the promotion authority.

All mutation remains gated by:

1. Human approval.
2. A scoped Work Order.
3. Path-specific authorization.
4. Evidence and validation gates.
5. Separate execution from this seed panel.

---

## Launch Action Standard

Launch actions must name a governed workflow, not a broad fix.

Allowed examples:

```text
Draft Work Order
Run Read-Only Recon
Open Codex Prompt
Create Evidence Packet
Prepare PR Plan
Mark Reviewed
Defer
Escalate to Human Decision
```

Disallowed examples:

```text
Fix governance drift automatically
Promote sidecar into canon
Clean up docs
Repair CI
```

---

## Validation Plan

| Check | Method | Pass condition |
|-------|--------|----------------|
| JSON validity | Parse all JSON files | All JSON files parse successfully |
| HTML static load | Open `ops/control-panel/index.html` | Cards and launch prompt panel render |
| Config integration | Open HTML and inspect browser console | JSON-backed lanes and launch actions display without console errors |
| No runtime wiring | Inspect deliverables | No local command execution, scheduler API, or repo mutation wiring exists |
| Scope containment | Git diff/path review | Changes are limited to authorized operations paths |

---

## Evidence Pack

To close this WO, attach:

- File list created.
- JSON parse result.
- Static HTML review result.
- Statement that no automations were activated.
- Statement that no runtime code was wired.

---

## Human Decisions Required

- Whether `TerraFusion Daily Pulse` should be activated first.
- Whether Work Order/Todo Tracker should be activated after the first Daily Pulse report.
- Whether future report ingestion should read saved automation outputs from disk or remain manual paste-only.
- Whether controlled execution wiring should be proposed in a later Work Order.

---

## Next Safe Action

Review `ops/control-panel/index.html` locally, then activate only the Daily Pulse automation if the seed panel and monitor definitions are acceptable.

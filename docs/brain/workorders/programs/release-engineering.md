# Release Engineering Program Playbook

**Program:** Release Engineering
**Goal:** `GOAL-TF-RELEASE-ENGINEERING-001`
**Loop:** `LOOP-TF-RELEASE-ENGINEERING-001`
**Status:** Active
**Selected after:** Backend Operational Excellence closeout
**Current base:** `origin/main` at `718c5f75481e4d890055a6ec645f848a8cf7acd6`

---

## Purpose

Convert completed operational baselines into releasable, recoverable, repeatable release evidence
without crossing into deployment, production, county runtime, secrets, schema, or CI workflow
mutation.

Release Engineering defines the release decision contract. It does not deploy.

---

## Current Truth

- Backend Operational Excellence is closed.
- The Backend OE closeout baseline is `a244743014b4b7731a2694db10bc2e9656876e55`.
- The Codex Operator Work Order Playbook is merged at
  `55b53ad97fdf31bd2ac34bdaf13462b5d5206122` and governs this lane.
- The Codex Operator Autonomy playbook is merged at
  `91b0b3b1a1c6131a9c7c545e06a6f69e53ab61a0` and grants same-risk
  docs/governance continuation for this lane.
- `WO-REL-002` is merged at `89e6e602b3c0e3ccc90c40ab0a372c2b16fdb55c`.
- `WO-REL-003` is merged at `c33ba9b6c130ceebdc85d88fab65210c378d00e0`.
- `WO-REL-004` is merged at `718c5f75481e4d890055a6ec645f848a8cf7acd6`.
- Backend OE evidence exists for release gates, runbook, diagnostics, operational packet,
  migration/rollback source inventory, Dais E2E planning, security/auth/county proof, and closeout.
- Release Engineering must reference Backend OE evidence instead of recreating it.
- Rollback source/procedure evidence exists, but executed rollback proof is not established.
- Production, county runtime, PACS/CAMA, secrets, deployment, schema, and CI workflow mutation are
  out of scope unless separately authorized.

---

## Non-Goals

- Do not modify GitHub Actions, Azure Pipelines, branch protection, or deployment scripts.
- Do not deploy.
- Do not execute migrations or rollback.
- Do not access secrets, county SQL, PACS/CAMA, production systems, or live services.
- Do not change backend, frontend, tools/sync, or runtime code.
- Do not claim rollback execution proof that does not exist.
- Do not restart Backend OE or Property Workbench.

---

## Work Order Chain

| WO | Mode | Purpose | Deliverable | Stop Type |
|----|------|---------|-------------|-----------|
| `WO-REL-001` | Read-only discovery | Inventory release/version/tag/rollback evidence and recommend smallest next release-engineering WO. | Discovery report only; no repo mutation. | `RELEASE_ENGINEERING_DISCOVERY_COMPLETE` |
| `WO-REL-002` | Docs/governance evidence contract | Define canonical release gate checklist and evidence contract from Backend OE evidence. | `docs/brain/workorders/evidence/WO-REL-002-RELEASE-GATE-EVIDENCE-CONTRACT.md` | `RELEASE_GATE_EVIDENCE_CONTRACT_READY_FOR_PR` |
| `WO-REL-003` | Docs/template only | Create release candidate evidence packet template requiring SHA, checks, Backend OE evidence links, rollback evidence, PASS/HOLD/FAIL, and non-claims. | `docs/brain/workorders/evidence/WO-REL-003-RELEASE-CANDIDATE-EVIDENCE-PACKET-TEMPLATE.md` | `RELEASE_CANDIDATE_EVIDENCE_TEMPLATE_READY_FOR_PR` |
| `WO-REL-004` | Docs/governance only | Define release tag/version evidence model without creating tags or changing release automation. | `docs/brain/workorders/evidence/WO-REL-004-RELEASE-TAG-VERSION-EVIDENCE-MODEL.md` | `RELEASE_TAG_VERSION_MODEL_READY_FOR_PR` |
| `WO-REL-005` | Docs/governance only | Define rollback drill authorization packet and required proof for future safe-environment rollback execution. | `docs/brain/workorders/evidence/WO-REL-005-ROLLBACK-DRILL-AUTHORIZATION-PACKET.md` | `ROLLBACK_DRILL_AUTH_PACKET_READY_FOR_OWNER_DECISION` |
| `WO-REL-006` | Evidence rollup | Close the Release Engineering docs/governance baseline and recommend next lane. | `docs/brain/workorders/evidence/WO-REL-006-RELEASE-ENGINEERING-EVIDENCE-ROLLUP.md` | `RELEASE_ENGINEERING_BASELINE_CLOSED` |

---

## Continuation Rule

Codex may continue from one Release Engineering WO to the next only when all are true:

- the current WO is merged to `origin/main`,
- remote checks are green or explicitly acceptable,
- review threads are resolved,
- the next WO is defined in this playbook,
- the next WO remains docs/governance/evidence only,
- no CI/workflow/branch-protection/deployment/runtime/schema/secrets/county/PACS/live-resource
  scope is required,
- no local hook bypass is required.

Codex must stop for owner decision when:

- merge authorization is required,
- a hook bypass is required,
- a review requires files outside the current WO scope,
- CI or release workflow wiring is requested,
- branch protection changes are requested,
- deployment, production, county runtime, PACS/CAMA, secrets, schema, migrations, or live services
  are implicated,
- release evidence contradicts Backend OE evidence,
- rollback execution proof would be claimed without execution evidence.

---

## Validation

Default validation for docs/governance Release Engineering WOs:

- `git diff --check`
- `node docs/brain/workorders/tools/wo-query.mjs --json`
- scope inspection confirms docs/governance only,
- runtime/backend/tools-sync implementation files changed: none,
- CI/workflow files changed: none,
- deployment files changed: none,
- county/PACS/CAMA/secrets/live resources touched: none.

---

## Next Work

Current WO:

`WO-REL-005 - Rollback Drill Authorization Packet`

Next recommended WO after merge:

`WO-REL-006 - Release Engineering Evidence Rollup`

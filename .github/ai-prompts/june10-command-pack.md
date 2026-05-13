# June 10 Operations Command Pack

> Launch-control prompts for the June 10 TerraForge execution window.

**Version**: 1.0.0  
**Status**: ACTIVE  
**Scope**: June 10 operations, review, UAT, blocker isolation, and final readiness control.

---

## Mandatory Runtime Doctrine

These commands inherit the June 10 execution doctrine:

- TerraFusion DB is product runtime truth.
- TerraFusion API is the only product runtime access layer for County Studio, CostForge, SalesForge, Atlas, Workbench, Dais, and Dossier.
- Legacy/public source systems are upstream inputs only.
- TerraFusion Sync may ingest, validate, reconcile, and prove upstream data before it lands in TerraFusion DB.
- Product runtime must never depend directly on a legacy database, source connection, scraper, or public source endpoint.
- No fake readiness claims.
- No provisional runtime assertions without proof artifacts.
- No fake 39-county full-workflow claim.
- A 39-county parcel runtime seed claim and a Benton runtime pilot claim must remain proof-gated.

Correct runtime path:

```text
Legacy/public source systems
  -> TerraFusion Sync / ingestion / validation
  -> TerraFusion DB
  -> TerraFusion API
  -> TerraForge Suite applications
```

Forbidden runtime path:

```text
TerraForge Suite application or product API
  -> legacy DB / source connection / source scraper
```

Every June 10 task must be classified as one of:

- `SHIP_BLOCKER`
- `NEXT`
- `WAITING`
- `POST_LAUNCH`
- `CUT`

There is no open-ended "interesting" category.

---

## Command Index

| Command | Purpose |
|---|---|
| `/j10-war-room` | Daily operational command prompt for current execution posture. |
| `/j10-truth-gate` | Pre-work honesty review before changing runtime, readiness, or launch posture. |
| `/j10-ship-blocker` | Brutal blocker isolation for one unresolved feature, system, or risk. |
| `/j10-benton-uat` | Benton runtime pilot review from real operator workflow perspective. |
| `/j10-executive-reality` | Leadership, county IT, assessor, and risk-review reality check. |
| `/j10-cut-line` | Scope freeze and stop-drift enforcement. |
| `/j10-final-readiness` | Final pre-launch operational readiness review. |

---

## `/j10-war-room` - June 10 War Room

### Purpose

Operate inside the June 10 TerraFusion execution window with current lane, blocker, risk, and proof-gate discipline.

### Usage

```text
/j10-war-room focus="<current task or system>"
```

### Role

You are operating inside the June 10 TerraFusion execution window.

Primary objective: deliver a defensible Benton County runtime pilot from TerraFusion DB while preserving June 10 governance doctrine.

### Mission Rules

- No feature drift.
- No architecture drift.
- No runtime boundary violations.
- No direct source-system runtime dependencies.
- No fake readiness claims.
- No provisional runtime assertions.
- No hidden blockers.
- No "close enough."

### Required Output

Every response must identify:

1. Current execution lane.
2. Current blockers.
3. Required proof gates.
4. Risk to June 10.
5. Whether the work is runtime-critical, governance-critical, UAT-critical, or deployment-critical.
6. Whether work should stop.

Optimize for runtime truth, defensibility, operational proof, safe deployment, and Benton workflow reality. Do not optimize for demo theater.

---

## `/j10-truth-gate` - June 10 Truth Gate

### Purpose

Run an honesty gate before changing readiness, runtime, data, deployment, or launch posture.

### Usage

```text
/j10-truth-gate scope="<system, lane, or readiness artifact>"
```

### Role

Review current June 10 readiness honestly. Do not reassure, speculate, or infer readiness from architecture intent.

### Verify

- TerraFusion DB identity.
- Product load receipts.
- Parcel sanity.
- Sales qualification lineage.
- Runtime contract compliance.
- County-neutral promotion logic.
- Benton runtime pilot readiness.
- UAT readiness.
- Deployment hardening readiness.

### Required Output

- `GREEN`, `YELLOW`, or `RED` status.
- Blocker table.
- Proof gaps.
- Next executable slice.
- Exact proof commands.
- Cut recommendations.

Also identify what is proven, assumed, red, operationally dangerous, likely to fail during UAT, likely to fail under county scrutiny, likely to fail under production load, and still dependent on upstream uncertainty.

---

## `/j10-ship-blocker` - June 10 Ship Blocker Review

### Purpose

Isolate whether one unresolved feature, system, defect, or ambiguity blocks June 10.

### Usage

```text
/j10-ship-blocker target="<feature, system, blocker, or uncertainty>"
```

### Role

Treat unresolved runtime uncertainty as a `SHIP_BLOCKER` until disproven.

### Judge Whether It Blocks

- Runtime truth.
- Benton pilot.
- County trust.
- UAT.
- Deployment.
- Defensibility.
- Governance.
- Certification-grade operation.

### Required Output

- Severity.
- Operational impact.
- Root cause.
- Owner lane.
- Next proof gate.
- Safest containment path.
- Whether the feature should be `CUT` before June 10.

Do not propose feature expansion, polish, or widened scope.

---

## `/j10-benton-uat` - Benton Runtime Pilot UAT

### Purpose

Review the Benton runtime pilot as real Benton County staff using TerraFusion DB runtime truth.

### Usage

```text
/j10-benton-uat workflow="<workflow or full-pass>"
```

### Role

Judge whether the pilot survives realistic assessor workflow, preserves parcel/workflow continuity, produces defensible outputs, and supports real operational decision-making.

### Required Workflow Coverage

- Parcel investigation.
- Ratio review.
- Comp review.
- GIS review.
- Correction routing.
- Evidence generation.
- Taxpayer explanation.
- Appeal preparation.
- Review signoff.

### Required Output

- Operational readiness verdict.
- Screenshots and evidence required.
- Workflow failures.
- Highest-risk user moments.
- Go/no-go recommendation.

Identify fake workflow, dead-end drilldowns, placeholder behavior, runtime inconsistency, broken evidence chains, misleading UI confidence, cross-suite context collapse, operational friction, workflow slowdown, and untrusted calculations.

---

## `/j10-executive-reality` - June 10 Executive Reality Review

### Purpose

Review TerraFusion from the perspective of leadership, skeptical operators, county IT, and deployment risk reviewers.

### Usage

```text
/j10-executive-reality audience="<leadership, county-it, assessor, wsaca, all>"
```

### Role

Review from the perspective of Benton County leadership, skeptical county assessors, WSACA leadership, county IT leadership, and deployment/risk reviewers.

### Judge

- Whether claims exceed proof.
- Whether runtime boundaries are believable.
- Whether the system feels operationally real.
- Whether deployment posture feels safe.
- Whether counties would trust this.
- Whether architecture feels governed.
- Whether the product appears production-serious.

### Required Output

- Trust score.
- Operational credibility score.
- Deployment confidence score.
- Top concerns leadership would raise.
- What most threatens June 10 confidence.
- Safest narrative posture.

Identify overclaims, hidden assumptions, weak operational stories, runtime ambiguity, governance concerns, deployment concerns, unsupported countywide claims, and areas that still feel experimental.

---

## `/j10-cut-line` - June 10 Cut-Line Enforcement

### Purpose

Enforce the June 10 cut line and stop work that does not move runtime truth, UAT, deployment, or governance readiness.

### Usage

```text
/j10-cut-line scope="<task list, branch, sprint, or open blockers>"
```

### Role

Classify every active task as:

- `SHIP_BLOCKER`
- `NEXT`
- `POST_LAUNCH`
- `CUT`

### Rules

- No new feature exploration.
- No architecture experiments.
- No speculative improvements.
- No polish-only work.
- No non-runtime-critical expansion.

Reward runtime truth, operational proof, deployment stability, UAT completion, defensibility, and governance enforcement.

Reject feature drift, AI wandering, demo theater, fake readiness, parallel chaos, and duplicate truth systems.

### Required Output

- Immediate stop-work recommendations.
- Cut recommendations.
- Freeze recommendations.
- Safest execution order.
- Highest-risk distractions.

---

## `/j10-final-readiness` - June 10 Final Readiness Review

### Purpose

Run the final pre-launch review against operational reality, not aspiration.

### Usage

```text
/j10-final-readiness scope="full"
```

### Role

Judge whether TerraFusion looks real, feels real, operates real, survives scrutiny, survives operator use, and survives skeptical county review.

### Must Prove

- Runtime truth.
- TerraFusion DB authority.
- Benton pilot readiness.
- County-neutral promotion doctrine.
- Operational workflow reality.
- Deployment survivability.
- Governance compliance.
- Defensible outputs.
- Traceability.
- UAT success.

### Required Output

1. Overall readiness verdict.
2. Runtime truth verdict.
3. Benton pilot verdict.
4. Deployment verdict.
5. Governance verdict.
6. County trust verdict.
7. Biggest remaining risks.
8. Safest launch posture.
9. Recommended claims for June 10.
10. Claims that must not be made.
11. Go/no-go recommendation.


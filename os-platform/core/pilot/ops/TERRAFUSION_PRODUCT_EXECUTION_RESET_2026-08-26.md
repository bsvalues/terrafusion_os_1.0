# TerraFusion Product Execution Reset — 2026-08-26

**Status:** ACTIVE OPERATING DIRECTIVE
**Purpose:** prevent agent context-loss, meta-engineering drift, and false completion claims while TerraFusion remains unfinished.

## 1. Product model — do not flatten this

TerraFusion is **not one web application** and Property Workbench is **not the product container**.

The product hierarchy is:

`TerraFusion OS / operating environment -> suites -> applications/workspaces -> cross-suite working surfaces`.

Suites such as TerraForge, TerraAtlas, TerraDais, and TerraDossier are domain/product families containing multiple real applications/workspaces. Property Workbench is a parcel-scoped cross-suite cockpit. A parcel-scoped Forge/Atlas/Dais/Dossier surface does **not** prove the corresponding suite is complete.

Before changing product behavior, agents must identify which level they are working on: OS/platform, suite, application/workspace, county/data integration, cross-application workflow, Workbench integration, AI/tool integration, or deployment/runtime.

## 2. Current shared truth

- Repository: `bsvalues/terrafusion_os_1.0`.
- Current protected `main` at directive creation: `b439c07dee63d9280abd0ec19a4e2a626950fbbb`.
- Last durable authenticated public production proof found in-repo is 2026-06-16, proved release SHA `6f7755090a21efc90fee423fe35b8d72805ef1e5`.
- Product work merged after that production proof, including August Property Workbench, Dais, Atlas and Dossier changes. Do not assume current `main` equals deployed production.
- Current-main base Property lookup reads the TerraFusion `Properties` entity and is county-scoped. This does **not** imply Dais, Atlas, Dossier or Forge are populated or enabled.
- The production SQLite probe found 112,059 `Properties` rows and 126,323 `ComparableSales` rows. Treat that as evidence that real legacy product data exists, not as proof that current product surfaces work against it.
- Atlas canonical projection is default-disabled and was proven with disposable/local evidence, not live production data.
- Dais Workbench appeal adoption was proven with disposable SQLite evidence and explicitly did not claim live-data deployment.
- The June/canonical PostgreSQL + Sync + `sync_bridge` lineage recovery remains a separate launch-critical data-governance/cutover track. Do not silently delete or demote it because a legacy `Properties` path exists.

If fresher observed runtime evidence contradicts any item above, update the authoritative current-state surface before continuing. Do not reason from stale state and then call the task complete.

## 3. TerraFusion foreground rule

TerraFusion product construction is the foreground objective.

CI/CD, workflow cleanup, branch-protection work, governance refactors, receipts, agent-framework work, provider routing, test-infrastructure work and documentation cleanup are **supporting work only**.

They may consume foreground engineering time only when an active TerraFusion product capability is presently blocked by them. A possible future benefit, general hygiene, or discovered inconsistency is backlog work, not an automatic task switch.

## 4. Definition of work

Discovery is not implementation. A finding is not completion. A green pipeline is not product completion. A document or receipt is not product completion.

An agent may report one of these states:

- `PRODUCT_CHANGE_DELIVERED` — product/runtime behavior changed, exact diff exists, and the changed capability was exercised at the appropriate product level.
- `PRODUCT_BUG_FIXED` — an observed product failure was reproduced, fixed, and re-exercised.
- `INTEGRATION_ADVANCED` — a real suite/application/data/runtime boundary was connected and observed.
- `DISCOVERY_COMPLETE_CONTINUING` — a finding was established and immediately becomes the input to the next implementation step; this is **not terminal**.
- `TRUE_AUTHORITY_WALL` — a genuinely nondelegable authority boundary prevents continuation; state the exact authority required.

`DONE`, `GOOD`, `PASS`, `READY`, or similar language is forbidden as a terminal claim when the lane produced only analysis, tests, CI, governance, documentation, or synthetic proof and the requested product capability remains unchanged.

## 5. No two-minute completion

After a discovery, agents continue automatically into the next authorized implementation step. They do not stop merely because they answered a question, found a code path, identified a flag, proved a hypothesis, or wrote a plan.

A session that ends after discovery without implementation must show a `TRUE_AUTHORITY_WALL`. Otherwise the lane is still in progress.

## 6. Mandatory preflight before product work

Before the first product decision or write, establish and keep visible:

1. objective / requested user outcome;
2. product level (OS, suite, application/workspace, Workbench/cross-suite, data/runtime, deployment);
3. authoritative repository and exact current base SHA;
4. deployed/runtime SHA when the task concerns a running environment;
5. actual data/runtime source relevant to the capability;
6. active authority/scope;
7. exact next implementation action;
8. explicit non-goals, especially meta-engineering side lanes.

If deployed identity, runtime identity, data identity, or project identity is unknown and materially affects the conclusion, the agent must classify it as unknown and measure it. It must not substitute current-main source inspection for deployed-runtime proof.

## 7. Product proof standard

Tests and CI follow product work; they do not substitute for it.

For user-facing work, proof should exercise the running capability at its natural level:

- application/workspace feature -> run that application/workspace;
- cross-suite parcel journey -> run the Workbench journey;
- suite capability -> exercise the suite, not only its Workbench projection;
- data/runtime integration -> run against the intended data/runtime source or an explicitly labelled safe copy;
- deployment -> observe the deployed exact candidate.

Synthetic proof is useful but must remain labelled synthetic. It cannot be silently promoted to a live-data or production claim.

## 8. Immediate product direction

Do not invent a new architecture program from this directive.

The next engineering work should use the existing TerraFusion architecture and accumulated knowledge to inventory and exercise the **current product**, suite by suite and application by application, against the most realistic safe runtime/data available, then fix observed product gaps. Parallel lanes are appropriate where reservations do not conflict.

The parcel/Property Workbench journey is one important vertical integration probe, not the definition of TerraFusion completion.

## 9. Owner-courier prohibition

Routine continuation, implementation, testing, review remediation, CI observation, and authorized merge mechanics are agent work. Do not hand them back to William as copy/paste, routing, monitoring, or `say go` tasks.

## Terminal principle

The repository should become easier to use because the applications work better — not merely easier to prove because the machinery around them became more elaborate.

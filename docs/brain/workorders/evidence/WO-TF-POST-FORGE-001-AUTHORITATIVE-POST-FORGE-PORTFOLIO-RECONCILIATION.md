# WO-TF-POST-FORGE-001 - Authoritative Post-Forge Portfolio Reconciliation Evidence

## Result

`GENUINE_OWNER_DECISION_REQUIRED`

**Audited base:** `a7e15211c74d4929e9d49043b052e3e79e60dedb`

**Decision packet:** [Issue #1413](https://github.com/bsvalues/terrafusion_os_1.0/issues/1413)

**Selected candidate:** `WO-SR-009A`

## Repository truth

| Repository | Audited `main` | Open PRs | Selection state |
| --- | --- | ---: | --- |
| `terrafusion_os_1.0` | `a7e15211c74d4929e9d49043b052e3e79e60dedb` | 0 | SR-008I complete; reconciliation required |
| `terrafusion-forge` | `b36c2e130fb3fe9b34d7e67c8880f5b6d25b3084` | 0 | Canonical valuation source; sovereign consumer remains Shadow-only |
| `terrafusion-atlas` | `6c530f1b6b77d59225353dede929c0688f1587da` | 0 | Pure projection foundation complete; no runtime consumer |
| `terrafusion-dais` | `29a34b0feeab32984a4dedf1af853239993b4a26` | 0 | Sovereign APIs usable; Workbench action path remains unproven |
| `terrafusion-dossier` | `7558cfebfeea0c7b536251769b1d779c4558a763` | 0 | Read capability exists; real journey depends on parcel acquisition |
| `terrafusion-gpt` | `e0856e46807844a95d57aaef49d3350c1bc38a33` | 0 | Pure grounded-context foundation complete; no provider/runtime adoption |

## Authoritative capability matrix

All source ranges refer to audited sovereign base
`a7e15211c74d4929e9d49043b052e3e79e60dedb`; repository heads are independently verified above.

| Capability | Sovereign owner / repository head | Classification and actual runtime/product state | User reachability | Exact proof source | Exact remaining gap | Authority status | Next safe action |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Forge valuation | Forge source `b36c2e13`; sovereign integration at audited base | `SHADOW_ONLY_NOT_AUTHORITATIVE`; DB-backed response remains authoritative and `Disabled` is default | Existing Forge/Workbench response is reachable; canonical consumer cannot replace it | `backend/src/TerraFusion.API/Configuration/RustKernelsOptions.cs:17-25`; `backend/src/TerraFusion.API/Controllers/ForgeController.cs:90-106`; `docs/brain/workorders/evidence/WO-SR-008I-FORGE-CANONICAL-CONSUMER-COMPLETION.md:23-51` | Explicit canonical-response switch | SR-008I consumed; cutover denied | Preserve Shadow; do not select before parcel journey |
| Atlas projection | Atlas `6c530f1b`; sovereign integration at audited base | `FOUNDATION_ONLY_UNWIRED`; standalone projection and process host exist without registration/consumer | Existing GIS read UI is partial; canonical projection is not user-reachable | `docs/brain/workorders/evidence/WO-SR-008A-SINGLE-PARCEL-ASSESSOR-JOURNEY-RUNTIME-READINESS-AUDIT.md:33`; `backend/src/TerraFusion.API/Services/Atlas/AtlasProjectionProcessHost.cs:13-46,100-108`; no host registration in `backend/src/TerraFusion.API/Program.cs` | DI registration and bounded consumer adoption | New R3 product/runtime authority required | Defer until authenticated parcel acquisition is proven |
| Dais administration | Dais `29a34b0f`; sovereign services at audited base | `SHIPPED_BUT_NOT_USER_REACHABLE` as a complete Workbench action; sovereign APIs are usable and standalone F1 remains pure/unwired | `/dais` APIs exist; complete Workbench appeal journey is unproven | `backend/src/TerraFusion.API/Controllers/DaisController.cs:16-23,162-285`; `backend/src/TerraFusion.API/Program.cs:473-474,667-669`; `docs/brain/workorders/evidence/WO-SR-005C-E1-DAIS-SOVEREIGN-APPEAL-WORKFLOW-READ-ADAPTER.md:16-31` | Durable Workbench consumer and journey proof | Existing API authority only; new consumer behavior is R3 | Rank after parcel acquisition |
| Dossier evidence read | Dossier `7558cfeb`; sovereign services at audited base | `SHIPPED_AND_USABLE` read API; standalone F1 remains pure/unwired | Dossier route/read exists when a parcel is acquired | `backend/src/TerraFusion.API/Controllers/DossierController.cs:19-42,195-215,232-315`; `docs/brain/workorders/evidence/WO-SR-005D-E1-DOSSIER-SOVEREIGN-EVIDENCE-REGISTRY-READ-ADAPTER.md:17-30` | Authenticated parcel prerequisite and later bounded Workbench adoption | Existing read authority only; new consumer behavior is R3 | Preserve; rank behind parcel acquisition |
| GPT grounded context | GPT `e0856e46`; sovereign AI at audited base | `FOUNDATION_ONLY_UNWIRED`; pure projection/adapter exist while current orchestration output is simulated | Suite UI exists; canonical grounded-context result is not consumed | `backend/src/TerraFusion.AI/Models/GptGroundedSourceIdentityProjection.cs:44-66,137-155`; `backend/src/TerraFusion.AI/Services/GPTOrchestrationService.cs:332-377`; `docs/brain/workorders/evidence/WO-SR-005E-E1-GPT-GROUNDED-CONTEXT-SOVEREIGN-ADAPTER.md:14-30` | Provider and runtime consumer adoption | Provider/model/runtime authority denied | Do not select before parcel acquisition |
| Property Workbench | Sovereign OS at audited base | `SHIPPED_BUT_NOT_USER_REACHABLE` as a complete real journey; route/tabs and synthetic tests exist | Search calls canonical property APIs, but no authenticated county-scoped real parcel proof exists | `frontend/apps/os-shell/src/services/LiveDataProvider.ts:57-60,360-387`; `frontend/apps/os-shell/src/stores/propertyStore.ts:4-11,37-80`; `docs/brain/workorders/evidence/WO-SR-008A-SINGLE-PARCEL-ASSESSOR-JOURNEY-RUNTIME-READINESS-AUDIT.md:24-39` | Authenticated county-governed parcel evidence acquisition | Bounded backend/test R3 authority required; live data remains denied | Select WO-SR-009A local synthetic proof |
| Parcel acquisition | Sovereign API at audited base | `BLOCKED_BY_AUTHORITY_OR_PROTECTED_RESOURCE` for a real journey; auth/county checks exist, but enrichment has a county-isolation defect | `/api/properties` and `/api/properties/parcel/{id}` are the first journey calls | `backend/src/TerraFusion.API/Controllers/PropertiesController.cs:11-14,27-50,76-117,141-148`; `frontend/apps/os-shell/src/services/LiveDataProvider.ts:360-387` | CAMA/GIS fallback queries filter by parcel ID without county ID; authenticated synthetic browser proof absent | Exact R3 repair/test envelope needed; live county/PACS/SQL denied | Approve Issue #1413 |
| Sync | Sovereign OS; canonical Sync program closed at `WO-SYNC-155` | `BLOCKED_BY_AUTHORITY_OR_PROTECTED_RESOURCE` for live source use | Captured-artifact readiness exists; live refresh is not authorized | `docs/brain/workorders/goal-loop/COMMAND_TO_PROGRAM_MAP.md:32-35`; `docs/brain/workorders/WORK_ORDER_PROGRAM_QUEUE.md:330-338` | Protected workbook/source and PACS reachability | Closed program; exact protected-resource packet required | Do not reopen or duplicate |
| TerraPilot | Sovereign OS at audited base | `PROVEN_LOCALLY_NOT_PERSISTENT`; P15 complete, P16 blocked | UI/local contract maturity exists; backend/live integration is false | `docs/brain/workorders/programs/ACTIVE_PROGRAM_PLAYBOOK.md:582-600`; `docs/brain/workorders/programs/terrapilot-tool-maturity.md:47-51,81-83` | Promotion, persistence, backend/live integration | Owner-gated P16; no current authority | Keep parked |
| Demo/runtime | Sovereign deployment lane at audited base | `BLOCKED_BY_AUTHORITY_OR_PROTECTED_RESOURCE`; local rehearsal only | No authorized live county deployment | `docs/brain/workorders/programs/benton-demo-deployment.md:31-40,66-84,117-142` | Environment, credentials, protected connectivity, deployment | Production/county authority required | Do not select |

## Contradiction ledger

| Conflict and exact sources | Current truth | Required correction | Selection impact |
| --- | --- | --- | --- |
| Base registry `WO-WOE-000` said `in_progress`, PR #1102 open, and write/push permitted: `docs/brain/workorders/registry/work-order-registry.seed.json@a7e15211:8-106`; live PR #1102 is closed/unmerged | Work Order Engine closed through WO-WOE-013/PR #1291; WO-WOE-000 has no live authority | This PR marks it superseded, closed/unknown merge state, empty-next, and all authority false | Removes a false active lane and stale candidate |
| Issue #1399 conflicts with pending Dossier/GPT F1 markers at `docs/brain/workorders/registry/work-order-registry.seed.json@a7e15211:7336-7342`, `docs/brain/workorders/active/WO-SR-005D-A4-dossier-standalone-repository-path-canon-registration.md@a7e15211:5-35`, and `docs/brain/workorders/evidence/WO-SR-005D-A4-DOSSIER-STANDALONE-REPOSITORY-PATH-CANON-REGISTRATION.md@a7e15211:100-110`; completed decisions and suite heads say retained/closed | Dossier `7558cfeb` and GPT `e0856e46` are completed pure-unwired F1 heads; authority is consumed | Preserve as open governance hygiene and correct only in a separately bounded scope | Does not authorize rerun and does not outrank parcel acquisition |
| `PATH_CANON_REGISTER.md@a7e15211:47-51` records Atlas `a1669e09`; live Atlas `main` is `6c530f1b` | Remote protected `main` is delivery truth; shared checkout is read-only | Later bounded path-canon hygiene; file is outside Issue #1412 allowlist | No candidate or worktree collision; Atlas remains unwired |
| `docs/brain/workorders/CANON_INDEX.md@a7e15211:29` describes contract design awaiting R3 work | F1 cohorts and SR-008I are complete | Later bounded subordinate-index refresh; file is outside Issue #1412 allowlist | Prevents stale summary from overriding live queue/register |
| Issue #1406 remains open while `.governance/owner-decisions.json@a7e15211:6-15,65-86` records SR-008I completed and consumed | Issue #1406 is historical authority evidence, not executable work | No rerun; issue lifecycle hygiene may close separately | Excludes completed SR-008I from ranking |

## Ranked candidates

| Rank | Exact candidate and human/product outcome | Dependencies | Repositories / file surfaces | Risk and authority | Stop walls | Bounded sequence | Reason / disposition |
| ---: | --- | --- | --- | --- | --- | --- | --- |
| 1 | `WO-SR-009A - Authenticated County-Governed Parcel Evidence Acquisition and Local Single-Parcel Journey Proof`; one assessor can authenticate, acquire one synthetic county-owned parcel, and traverse the Workbench without cross-county enrichment | SR-008A and this reconciliation complete; Issue #1413 approval | Sovereign only: `PropertiesController.cs`, Phase14/R1Week5 isolation tests, Playwright config/spec, exact Brain/decision records | R3; new bounded backend/test behavior authority required | Any live county/PACS/SQL, schema/migration, permission-policy, frontend, deployment, credential, or scope expansion | Canonize decision; repair county filters; add fail-closed API proof; run disposable SQLite synthetic authenticated browser journey; closeout | Earliest common user blocker, concrete isolation defect, reversible local proof; **recommend approve Issue #1413** |
| 2 | `WO-SR-009B - Dais Workbench Durable Appeal Read Adoption`; make existing Dais appeal read usable in a parcel journey | SR-009A parcel acquisition; frozen Dais contract/E1/F1 | Sovereign Dais controller/service, Workbench Dais surface, focused API/frontend tests; exact files require a future packet | R3 product/runtime consumer authority | Persistence/write behavior, live county data, frontend scope not exactly enumerated | Bound consumer; prove county/parcel identity; synthetic journey; rollback | High assessor value but cannot precede parcel acquisition; defer |
| 3 | `WO-SR-009C - Atlas Workbench Canonical Projection Adoption`; expose the proven Atlas projection through a bounded consumer | SR-009A; Atlas host foundation complete | Sovereign `Services/Atlas/**`, `Program.cs`, Atlas Workbench surface/tests; Atlas repository remains read-only | R3 runtime/DI/product authority | Atlas mutation, provider/network, persistence, deployment, live county data | Register host; add bounded consumer; synthetic parity/reachability; rollback | Makes proven work usable, but parcel acquisition is earlier; defer |
| 4 | `WO-SR-009D - Forge Canonical Response Cutover`; make the canonical Forge result authoritative | SR-008I Shadow proof; parcel journey and cutover decision | `RustKernelsOptions.cs`, `ForgeController.cs`, valuation consumer/tests, governance | R4 canonical product-response switch | Methodology, persistence/schema, production config, live county data, deployment | Exact cutover packet; dual proof; switch; rollback rehearsal | High value but materially riskier and not the first journey gap; do not admit |
| 5 | `WO-SR-009E - Dossier Evidence Read Workbench Adoption`; surface existing bounded evidence reads in the parcel journey | SR-009A; Dossier contract/E1/F1 | Sovereign Dossier controller/adapter, Workbench records surface/tests; exact files require future packet | R3 product/runtime consumer authority | Custody mutation, persistence, live protected data, Dossier repo mutation | Bound read-only consumer; synthetic evidence; journey proof; rollback | Useful after parcel acquisition; defer. GPT adoption was evaluated but ranks below five because provider/runtime authority and parcel context are both missing |

## Selected boundary

`WO-SR-009A` is not admitted for implementation by this R2 Work Order. Source inspection found that
`PropertiesController.GetPropertyByParcel` resolves the caller county for the base property but its
CAMA and GIS enrichment fallbacks filter only by parcel identifier. The proposed packet therefore
combines an exact county-isolation repair with a disposable local SQLite, synthetic-data,
authenticated browser journey. It explicitly denies live county/PACS/SQL data, production,
deployment, credentials, migrations, permission-policy changes, frontend changes, suite adoption,
and canonical Forge cutover.

## Assurance and validation

- Five independent read-only lanes covered repository truth, product reachability, authority,
  dependency/ranking, and final exact-head assurance.
- Registry JSON parsing, Work Order query, query/planner tests, scope inspection, and
  `git diff --check` are required before merge.
- Remote required checks and zero unresolved substantive review threads remain mandatory.

## Terminal condition

The portfolio reached a genuine bounded R3 owner boundary with one complete recommended packet.
No product implementation was performed and no completed Work Order was rerun.

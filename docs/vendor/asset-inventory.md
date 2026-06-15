# TerraFusion — Asset Inventory (Vendor Diligence)

**Purpose:** an honest, tiered map of what actually exists, so a vendor can see you control
what you're offering — and so you never overstate. Maturity tags are deliberate; when a
vendor's engineer opens the repo, the tags should match what they find.

**Anchor (consistent with every artifact in this package):**
> Benton County runtime pilot on TerraFusion DB as system-of-record, with a proof-gated
> 39-county provenance inventory as the expansion path — a disciplined single-county proof
> that scales reproducibly, not a 39-county launch.

## Maturity legend

| Tag | Meaning |
|---|---|
| `doctrine` | Authored architecture / governance / specification. Real, written, controlled — but a document, not a running feature. |
| `working` | Reserved for components present in the active tree with code **and** tests that can be **demonstrated and defended cleanly** end-to-end. Not claimed as production-certified. |
| `prototype` | Partial implementation or pilot-stage surface. Present and demonstrable, not hardened or fully wired end-to-end. |
| `spec-only` | Designed and documented; implementation not yet in the active tree (or only in quarantined/legacy paths). |
| `aspirational` | Roadmap. Named honestly as future scope. Do not demo as present. |

Paths are given as authorship/control evidence.

> **Bias rule (read before tagging or quoting):** tags are set conservatively. Code-plus-tests
> alone is not enough for `working` — if a component isn't fully wired end-to-end and cleanly
> demoable, it stays `prototype`. The goal is that a vendor engineer who opens the repo finds
> *more* than promised, never less.

---

## Tier 1 — Documented architecture & doctrine (strongest IP, clearly real)

| Asset | Tag | Evidence path |
|---|---|---|
| 90-day execution doctrine (five-schema provenance, lineage invariant, four lanes, write-back doctrine) | `doctrine` | `docs/plans/terrafusion-90-day-execution-plan.md` |
| June 10 runtime doctrine & operating discipline (DB-as-truth, API-only access, proof-gating, no-fake-readiness) | `doctrine` | `.github/ai-prompts/june10-command-pack.md` |
| Benton pilot UAT evidence protocol (15-step operator workflow, evidence packet rules) | `doctrine` | `os-platform/core/pilot/ops/june10-benton-uat-screenshot-checklist-2026-05-13.md` |
| Bounded suite-architecture model (OS shell / workbench / suite / app separation, single-owner write lanes) | `doctrine` | `CLAUDE.md`, `terrafusion.app.json`, `STANDARD.md` |
| Provenance / continuity layer design (`source_xref` lineage; `raw_pacs → truth_pacs → canonical_tf → product`; `legacy_tf_unproven` quarantine) | `doctrine` | `docs/plans/terrafusion-90-day-execution-plan.md` (§1–3) |

**This tier is the differentiated asset.** It is the implementation doctrine and operating
discipline a vendor would otherwise spend years (and several failed county conversions)
learning. It is harder to replicate than the code beneath it.

---

## Tier 2 — Working / partial implementation (verified in the active tree)

| Asset | Tag | Evidence path |
|---|---|---|
| **TerraDais** admin-workflow persistence — `Exemption`, `Appeal`, `CertificationStep`, `Notice`, `QueueItem` entities | `working` | `backend/src/TerraFusion.Core/Entities/{Exemption,Appeal,CertificationStep,Notice,QueueItem}.cs` |
| TerraDais EF persistence configurations | `working` | `backend/src/TerraFusion.Data/Configurations/*Configuration.cs` |
| TerraDais domain services | `working` | `backend/src/TerraFusion.Core/Services/{Exemption,Appeal,Notice}Service.cs` |
| TerraDais persistence + county-isolation proof | `working` | `backend/tests/TerraFusion.Integration.Tests/Phase40/Dais{WorkflowPersistence,CountyIsolation}Tests.cs` |
| **Write-lane governance** (single-owner write lanes; guarded mutations) | `working` | `backend/tests/TerraFusion.Unit.Tests/Stage2/AppealWriteLaneGuardTests.cs`, `.../Wave2/GptWriteLaneGuardTests.cs`; enforced across `backend/src/TerraFusion.API/Controllers/*` |
| Dais workflow API surface (backed by the persistence + isolation tests above) | `working` | `backend/src/TerraFusion.API/Controllers/DaisController.cs` |
| Other suite-app API surfaces (Atlas, Dossier, Clerk, Treasury, Field) — controllers present; per-app end-to-end depth not individually re-verified here | `prototype` | `backend/src/TerraFusion.API/Controllers/{Atlas,Dossier,Clerk,Treasury,Field}Controller.cs` |
| **Runtime-truth API** (DB identity / content proof endpoints — the honesty surface) | `working` | `backend/src/TerraFusion.API/Controllers/RuntimeTruthController.cs` (+ `backend/TerraFusion.API.Tests/RuntimeTruthControllerTests.cs`) |
| **County Studio** workflow (assessment study + approval workflow) | `working` | `backend/src/TerraFusion.Core/Services/CountyStudioAiService.cs`, EF migration `AddCountyStudioEntities`, `.../CountyStudio/CountyStudyApprovalWorkflowTests.cs` |
| **Property Workbench** parcel-routing surface (OS-shell host, context survival) | `prototype` | `frontend/apps/os-shell/src/__tests__/workbench/*`, `.../shell/workbenchHostIntegrity.contract.test.ts`, `.../shell/launchSurfaceContractParcelWorkbench.contract.test.tsx` |
| **AI assist** as *optional augmentation* — draft / explain / summarize (not autonomous action) | `working` | `backend/src/TerraFusion.AI/Notices/DraftNoticeService.cs`; Workbench panels: `PropertyWorkbench{ExplainModelInputs,SummarizeSalesCompsRationale,CompareAssessedValueHistory}.test.tsx` |

**Honesty note on AI:** the implemented AI surface **drafts, explains, and summarizes**. It
does not make official determinations. That is the correct, defensible thing to tell a
vendor — assist layer, human-in-the-loop, not a black box deciding assessments.

---

## Tier 3 — Proven-with-evidence (only what has a green proof artifact)

| Asset | Tag | Evidence path |
|---|---|---|
| Benton runtime pilot evidence intake (sync-drain observation, evidence packets) | `prototype` | `os-platform/core/pilot/june10-sync-evidence-intake.mjs` (+ `.test.mjs`); `os-platform/core/pilot/evidence/*.latest.json` |
| 39-county **source-decision registry** (provenance inventory — the acquisition roadmap, NOT live runtime) | `doctrine`+`prototype` | `os-platform/core/pilot/ops/june10-38-county-initial-seed-plan-2026-05-14.md` |

**Claim discipline:** the Benton sales/owner/improvement/land lanes from the 90-day plan are
**promotable only when their green commit + regression artifact exist**. Before quoting a
specific number (e.g. the 21,715 qualified-sales figure), confirm the Block A proof artifact
is present. Until then it is a *target*, not a proven count.

---

## Tier 4 — Aspirational / future scope (name it, don't demo it)

| Asset | Tag | Note |
|---|---|---|
| CostForge certified/official valuations | `aspirational` | Cost calculator is post-90-day. Demo as *scenario/preview*, never as certified output. |
| Multi-county live runtime (beyond Benton) | `aspirational` | Provenance inventory exists; live runtime does not. |
| Plugin marketplace / developer ecosystem | `aspirational` | Documented; not part of the vendor asset offer. |
| AI agent builder / autonomous swarm features | `aspirational` | Internal/architecture material. Keep out of vendor scope entirely. |

---

## What you control (the licensable core, restated for diligence)

- **Architecture & doctrine assets** (Tier 1) — suite boundaries, write-lane governance,
  provenance/continuity model, operating discipline.
- **Workflow assets** (Tier 2) — TerraDais administrative persistence model.
- **Interaction assets** (Tier 2) — Property Workbench routing/host model, County Studio
  workflow.
- **Assist assets** (Tier 2) — optional draft/explain/summarize AI layer.
- **Documentation assets** (all tiers) — specifications, naming conventions, implementation
  roadmaps.

You retain underlying IP title; a license conveys field-limited rights to the above.
Illustrative business terms are available on request, under NDA.

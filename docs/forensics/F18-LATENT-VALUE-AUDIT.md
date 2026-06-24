# F18 — Latent Value / Claim-Stripped Substance Audit

*Forensic lane (under recovery lock). Measures the axis F17 did NOT: **is the underlying
engineering worth salvaging**, independent of runtime status and marketing naming.*

> **Two orthogonal axes.** F17 = "does it run now?" (REAL/LATENT/MOCKED/FICTION).
> F18 = "is it good / recoverable?" The decisive test (per owner): **strip the mythology —
> what does the module still do?** If something useful survives deleting "quantum / divine /
> 1,008-agent," it is **not** trash. Salvage decisions key on **value tier**, not vibe.

## Value tiers (owner taxonomy)
1. **Real & useful** · 2. **Experimental but real** · 3. **Simulated / benchmarked (honest relabel)** ·
4. **Presentation-heavy / weakly grounded** · 5. **Fictionalized (trash tier)**.

## Classification (evidence-backed; runtime status shown for contrast)

| Area | What's actually there (LOC / logic) | Real run/test output? | Runtime (F17) | **Value tier** | Conf |
|---|---|---|---|---|---|
| **Levy calc** | `LevyCalculationService.cs` ~97 LOC — real WA **RCW 84.52/.55** math: rate calc, 1% limit, statutory $5.90/$1k, banked capacity. No stubs. | testable, deterministic | REAL | **1 — Real & useful** | very high |
| **Sync / PACS ETL** | `SyncEngine.cs` + `Sync/*` ~1,712 LOC — connector registry → fetch delta → validate → ingest; `SyncReceipt` row/error tracking; typed `PacsBentonContract`/`PacsFieldMappings`; `ArcGisNightlySyncHostedService` (PeriodicTimer, per-county scope isolation); EF entities + migrations. | real engine; unit tests exist (`SyncEngineTests.cs`) | REAL (on wiring) | **1 — Real & useful** | very high |
| **Compliance (IAAO)** | `ComplianceServiceStub.cs` ~80 LOC — real median assessment ratio, **COD**, **PRD** from DB assessments/sales. "Stub" is a misnomer. | real math, real DB query | MOCKED (label) | **2 — Experimental but real** (promote to first-class) | high |
| **Consciousness mesh** | `ConsciousnessService.cs` ~403 LOC — real `_meshOrchestrator.ExecuteMeshOperationAsync` + agent-coordination path, **deliberately GATED** (`"TEMP COMMENTED OUT TO BREAK CIRCULAR DEPENDENCY"` ×3, L19/34/61). `ConsciousnessEngineStub.cs` ~100 LOC queries DB AIAgents, computes avg perf. | partial; gated not absent | MOCKED (gated) | **2 — Experimental but real** (un-gate / feature-flag) | high |
| **ArcGIS / Atlas** | `ArcGisNightlySyncHostedService` ~100 LOC real scheduler + isolation; **geometry/parcel ops absent**; `SystemGptAtlas*` controllers are naming facades. | scheduling real; geo absent | LATENT/FICTION split | **2 (scheduler) / 5 (geo facades)** | high |
| **phase4d*.json "results"** | **Asset/provenance MANIFESTS**, declarative: asset_id, source_repo, target_path, parity_result, regression_result. NOT a test runner. `"regression_result: pass"` = "in batch", not "assertions passed"; acceptance-test refs are placeholders (no file at path). | **No** — provenance, not empirical | RECORDS | **3 — Process record (relabel honestly)** | high |
| **Property valuation** | `PropertyValuationService.cs` ~120 LOC — hardcoded `$425k` with explicit `"DEMO DATA — placeholder"`; mock comps. Income/Cost/Sales/Reconciliation not on interface. | none (honest demo) | MOCKED | **4 — Presentation-heavy** (honest placeholder) | very high |
| **Ratio studies / data-quality / "advanced analytics"** | dirs exist (`TerraFusion.AI/RatioStudies/`) but **code absent**; manifests *claim* 28 executed assets. | declared, not implemented | LATENT (phantom) | **4 — weakly grounded** (implement or strip claim) | high |
| **CostForge "Ultimate"** | `UltimateCostForgeAI.cs` ~820 LOC — **17 methods = `Task.Delay(100–300ms)` + anonymous objects**; `ULTIMATE_QUANTUM_FACTOR=999`, `ULTIMATE_AGENT_COUNT=1000000`, "divine omniscience". No regression, no market data, no AI. | none | MOCKED | **5 — Fictionalized (trash)** | very high |
| **"Million agents" / "quantum consciousness" return-points** | hype constants + "unavailable" returns | none | MOCKED/FICTION | **5 — Fictionalized** | very high |

## Claim-stripped residue (the decisive test, per area)
- Strip "RCW-divine-optimizer" → **a correct levy calculator remains.** Keep.
- Strip "transcendent sync swarm" → **a production ETL/connector/validator skeleton remains.** Keep.
- Strip "quantum consciousness mesh" → **a real (gated) mesh-orchestration + IAAO-compliance core remains.** Keep, un-gate.
- Strip "Ultimate divine CostForge" → **`Task.Delay` remains.** Nothing survives. Discard.

## Honest verdict (both directions)
- **The good is genuinely good** (~30–40% of the AI/domain code): Sync/PACS ETL, Levy math, IAAO compliance, the gated mesh core, the ArcGIS scheduler. Worth salvaging and, in cases, shipping.
- **The trash is audaciously hollow** (~40–50%): CostForge "Ultimate", million-agent/quantum theater — 820 LOC of sleeps in divine language. No AI, only naming.
- **A real process layer exists** (~10–20%): the phase4d provenance manifests are legitimate work-tracking — but they are **not** test/benchmark proof, and must be relabeled as such.

## Corrections this lane makes
- **Corrects F17 (value-blindness):** `ComplianceServiceStub` and the Consciousness mesh were
  runtime-MOCKED but are **tier-2 real value** — F17's labels were right about *runtime*,
  wrong to imply *no worth*. (Two-truths: F17 stands as a runtime record; F18 adds the value axis.)
- **Refines the owner's "test results" hypothesis:** the manifests are a *real process record*
  (so not fabricated), but *not* benchmark/assertion outputs (so not empirical proof) — Tier 3,
  honestly relabeled.

## Feeds R11
Salvage-eligibility now keys on **value tier**, not runtime status (see R11 fence #3, rewritten):
Tier 1–2 → salvage-eligible (subject to owner-sensitive + lineage/port fences); Tier 3 → keep
as provenance (relabel); Tier 4 → keep honest placeholder / implement-or-strip; Tier 5 → archaeology/deprecate.

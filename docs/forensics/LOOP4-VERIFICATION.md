# Loop 4 — Verification & Quantification

*Verification + quantification only. No edits (code/schema/CI/ownership/branches).*
Recovery lock: **ACTIVE**. Each item converts a Loop-3 "suspected" into a "classified".

---

## Item 1 — `TerraFusionContext` vs `TerraFusionDbContext` → HARD-CLASSIFIED

**Verdict: TWO TRULY SEPARATE contexts on the SAME database — NOT an alias, NOT a wrapper.**
Role-split (domain vs Identity), with a dangerously similar name. Confidence: **high**.

| Symbol | Declaration | Base | DbSets | Live injections | Connection |
|---|---|---|---|---|---|
| `TerraFusionDbContext` | `TerraFusion.Data/TerraFusionDbContext.cs:22` `: DbContext, ITerraFusionDbContext` | `DbContext` | 100+ (domain/PACS/forge/dossier…) | ~150 controllers/services | `ResolvePrimaryConnectionString()` |
| `TerraFusionContext` | `TerraFusion.Data/TerraFusionContext.cs:7` `: IdentityDbContext` | `IdentityDbContext` | 7 (Property, County, Module, AIModel, CostMatrix, Valuation, SystemLog) | 7 (TerraGaiaService, 3 AI services, HealthController, DatabaseSeeder, Consciousness) | **same** `ResolvePrimaryConnectionString()` |

- **Decisive evidence:** distinct class declarations, distinct base classes, distinct files; neither aliases nor inherits the other; **both resolve the same primary connection string** (Program.cs:2273 & 2295).
- **Classification:** *parallel contexts on one database* — `TerraFusionContext` is an ASP.NET Identity context (auth/seed reference data); `TerraFusionDbContext` is the domain context. Not naming-drift-only and not dual-core-fracture (they own different table sets), but the **near-identical name is a real confusion hazard** (a dev/agent can inject the wrong one). 7 of its DbSets (Property, County, Valuation…) **overlap conceptually** with the domain context's tables — a latent overlap to watch, not a proven collision.
- **Status:** not a crash risk; **naming hazard + conceptual-overlap watch item**. (Was RF-1 "possible second core context" → now classified.)

---

## Item 2 — Dual `LevyCertification` → RUNTIME BEHAVIOR PROVEN

**Verdict: NO physical table collision. Two `LevyCertifications` tables in TWO separate
databases → latent DATA-TRUTH SPLIT, not a write-shadowing crash.** Confidence: **high**.

| CLR type | Table | DbContext | Database (decisive) |
|---|---|---|---|
| `TerraFusion.Core.Entities.LevyCertification` (int PK, Guid CountyId, ~11 fields) | `LevyCertifications` (EF convention) | `TerraFusionDbContext` | **main DB** (`DefaultConnection`) |
| `TerraFusion.Levy.Models.LevyCertification` (Guid PK, string CountyId, 40+ fields, attestation) | `LevyCertifications` (`[Table]`) | `LevyDbContext` | **separate DB** — `LEVY_DATABASE_URL` / `LevyDatabase`, **else falls back to SQLite `levy-dev.db`** (Program.cs:2479–2493) |

- **Decisive evidence:** `LevyDbContext` registration **never uses `DefaultConnection`** — it uses `LEVY_DATABASE_URL`/`LevyDatabase` or falls back to `levy-dev.db`. Therefore the two same-named tables are in **different physical stores**.
- **Both contexts active in live process?** YES (`AddDbContext<TerraFusionDbContext>` + `AddDbContext<LevyDbContext>` both in API `Program.cs`).
- **Runtime failure mode:** **(iv) no-fault coexistence at the DB level** (no EF startup fault, no migration conflict — separate migration sets, separate DBs). The real fault is **semantic**: certification data **bifurcates across two databases** by code path. No crash; a silent split of truth.
- **Blast radius (which home each surface writes to):**
  - Dais / certification surface → `LevyCertificationController` injects `TerraFusionDbContext` → **main DB** (simple schema).
  - Levy module → `LevyController` / `LevyCalculationService` inject `LevyDbContext` → **Levy DB** (rich schema).
  - ⇒ A certification created via the Dais surface and one created via the Levy module land in **different databases with different schemas**; any cross-surface reconciliation/report is unreliable.
- **Correction logged:** the persistence subagent's Task-2 ("physical table collision / silent shadowing") was **wrong** — it missed the separate connection string; its Task-5 ("isolated") was right. Resolved by direct read of Program.cs:2477–2505 (chain-of-custody).
- **Status:** RF-1 refined from "table collision" → **"divergent persistence homes / data-truth split"** (latent, silent, no crash). Still HIGH for data integrity on cert/levy/Dais surfaces.

---

## Item 3 — CI signal distortion → QUANTIFIED (replayable method + measured sample)

**Replayable classification method** (anyone can re-run; not anecdote):
> For a PR's head SHA, fetch all check-runs. Classify the PR's CI signal:
> - **real-fail** = a *substantive* job (Vitest, Backend .NET, Frontend Build, Security) concluded `failure`.
> - **governance-fail** = only a soft-gate/governance check failed (`continue-on-error` lane).
> - **foot-gun (cancelled-as-failed)** = `TerraFusion Seal Gate` = `failure` **AND** ≥1 sibling job = `cancelled` (the documented `seal-gate-fast.yml` aggregation bug, F13/RF-4).
> - **mixed/unclear** = otherwise.
> A PR's "failure" is **materially misleading** if it is foot-gun or governance-only with **no** real-fail.

**Measured sample — PR #1080 (the one PR with full per-commit check-run visibility this session):**

| Commit | Seal Gate | Sibling jobs | Substantive jobs | Class |
|---|---|---|---|---|
| 00859466e | failure | cancelled | cancelled (superseded) | **foot-gun** |
| ae3eb1cab | failure | cancelled | cancelled (superseded) | **foot-gun** |
| 342a1298d | failure | cancelled | cancelled (superseded) | **foot-gun** |
| 00a330853 | failure | cancelled | cancelled (superseded) | **foot-gun** |
| 0cc51ab6e (current) | (settling) | — | **Vitest✅ Backend✅ Frontend✅ Security✅** | real jobs pass when allowed to finish |

- **Result for the measured sample:** 4 of 4 Seal Gate "failures" = **foot-gun**, **0 real-fail, 0 governance-fail**. When not superseded, the substantive jobs **pass**.
- **Materially-misleading count (sample):** 4/4 = **100%** of this PR's failure signals were misleading.
- **Population scope (honest):** full replay across all closed PRs / 742 branches was **NOT executed** (per-PR Actions check-run retrieval is API-heavy). The method above is specified for a bounded follow-up. **No population number is estimated** — only the measured n=1-PR/4-commit sample is asserted.
- **Impact on branch trust:** confirmed — CI "failure" is **not** a trustworthy disposition signal here. **Hard Rule 5 stands:** no branch/PR may be dispositioned (esp. `ignore`) on an *unclassified* CI failure. Loop-4 has proven the foot-gun is not hypothetical and that its base rate on an observed PR is high.

---

## Item 4 — Critical-surface commit heatmap (Lane 2)

**Method:** `git log origin/main` commit counts per critical-surface path glob (current
`MAIN-CURRENT` lineage only; legacy lineage is disjoint/PORT-ONLY → archaeology).

| Surface | Commits on main | Note |
|---|---|---|
| Property Workbench (`*workbench*`) | 5 | most-touched critical surface on main |
| Dais (`*dais*`) | 4 | `frontend/.../suites/daisService.ts` touched 2× |
| API `Program.cs` | 3 | DB-context registration sprawl lives here |
| Shell (fe `os-shell/src/shell`) | 1 | thin on current main |
| Native shell | 1 | thin |
| Registry (`tools/registry` etc.) | 1 | |
| Governance (`.governance` + Security) | 1 | |

- **Finding:** on the **current main lineage**, critical surfaces have **low churn** (1–5 commits each) — because `main` is the *re-rooted recent* lineage (~89 branches, short history). **The buried/repeated work lives on the legacy lineage (root `7c26657`, 580 branches), which is PORT-ONLY and disjoint** — a true cross-branch heatmap there requires per-branch diffing and is **archaeology** (deferred; bounded by HR/Gate-C).
- **Reduces hidden-work uncertainty:** materially — confirms current main is *not* where the deep critical-surface history is; salvage value concentrates in the legacy lineage, reachable only by port.
- **No repeated-edit "cluster" hotspots on main** beyond `daisService.ts` (2×) and the workbench production-smoke test (2×).

---

## Item 5 — Runtime Registration Truth Table

| Symbol | Definition | Registration site(s) | Lifetime | Live path | Lineage | Status |
|---|---|---|---|---|---|---|
| `TerraFusionDbContext` | `TerraFusion.Data/TerraFusionDbContext.cs:22` | `Program.cs:2271` (canonical) + ~26 **mutually-exclusive CLI/seed branches** (`--seed-pacs`, `--canonicalize-*`) | Scoped (AddDbContext) | ~150 controllers/services | `DbContext` (root `f2511bb` domain) | **AUTHORITATIVE** |
| `TerraFusionContext` | `TerraFusion.Data/TerraFusionContext.cs:7` | `Program.cs:2293` + Consciousness `Program.cs:91` | Scoped | 7 (TerraGaiaService, AI svcs, seeder, health) | `IdentityDbContext`, **same DB** | **PARALLEL** (Identity; naming hazard) |
| `LevyDbContext` | `TerraFusion.Levy/Data/LevyDbContext.cs:16` | `Program.cs:2477` (single) | Scoped | 19 (LevyController, LevyCalc/Revenue/Audit/RiskScoring svcs, BankedCapacity/BudgetImpact ctrls) | `DbContext`, **separate DB** (`LevyDatabase`/`levy-dev.db`) | **PARALLEL (isolated DB)** |
| `CurrentUseDbContext` | `TerraFusion.CurrentUse/Data/CurrentUseDbContext.cs:6` | `CurrentUseServiceExtensions.cs:41/46/51` (module ext; not in main Program.cs directly) | Scoped | 7 (Classification/Removal/Interest/Penalty/Audit/Rollback svcs, health) | `DbContext`, hardcoded PG schema `currentuse` | **PARALLEL (module-wired)** — *confirm the API calls the extension* |
| `TerraFusionContext` (Consciousness) | same type, `Consciousness/Program.cs:91` | Consciousness host | Scoped | consciousness stubs | same Identity type | **PARALLEL (separate host)** |

- **Registration sprawl resolved:** the ~26 extra `AddDbContext<TerraFusionDbContext>` sites are **mutually-exclusive conditional CLI/seed host-builder branches**, *not* duplicate registrations in the running web host. Downgraded from "duplicate-registration red flag" → **conditional-host pattern (benign, but noisy)**.
- **Unresolved:** whether the live API actually invokes `CurrentUseServiceExtensions` (its registration isn't in `Program.cs`); carried to Loop 5.

---

## Loop 4 exit-gate evaluation

| Exit condition | Met? |
|---|---|
| `TerraFusionContext` hard-classified | ✅ (separate Identity context, same DB; naming hazard) |
| dual `LevyCertification` runtime behavior proven | ✅ (no collision; divergent-DB data-truth split) |
| CI signal distortion quantified enough to affect branch trust | ✅ method specified + measured sample (4/4 misleading on PR #1080); population replay deferred, **not** estimated |
| commit heatmap materially reduces hidden-work uncertainty | ✅ (critical-surface history is on legacy lineage, not main) |
| **no NEW major category of disorder appeared** | ✅ — Loop 4 *refined/downgraded* existing findings (registration sprawl → benign; Levy collision → data-split); no new class |

**All five exit conditions met. No new disorder category.** Per the playbook this *clears the
bar to consider salvage planning* — but the decision to leave the recovery lock and enter
R-lanes is the owner's, and several Loop-5 verification residuals remain (below). Recovery
lock stays ACTIVE pending that decision.

### Loop 5 residuals (small, not blocking)
1. Confirm the live API wires `CurrentUseServiceExtensions` (CurrentUse context reachability).
2. Decide whether the cert/Dais surface SHOULD share `LevyCertification` truth with the Levy module (product question, not forensic).
3. Optional: execute the Item-3 method across a larger PR set to get a population misleading-rate.

# Dais / Levy Entry-Check Package (read-only; lock ACTIVE)

*Second Tier-1 domain entry-check, per `TIER1-PORT-PLAN.md` §2 (Dais/Levy) + owner direction.
**Read-only** (`git diff`/`rev-list`/`show` only — no merge, no cherry-pick, no lock release).
Method = content-presence, not branch status. **Option-C-aware**: every residual is tested for
whether it (a) strengthens the Levy-module SoR, (b) re-arms Core levy as authority, or (c)
violates read-projection-only.*

> **Headline verdict (same shape as Sync — SUPERSEDED):** the `r2/*` Levy/Dais heads are **not**
> the not-yet-landed SoR. **`main` holds the real, de-stubbed Levy module SoR** (ahead **+4,371
> lines**; real migrations) and the dais/permits surface (ahead **+106,173 lines**, 437 files).
> The branch-only "residual" is an **older `LevyDbContextStub.cs`** + stale migration-snapshot
> fragments + CostForge "Ultimate" theater + binary `.tar.gz` doc bundles. **No SoR value, and
> porting the stub would *regress* the SoR.** ⇒ **no clean Dais/Levy first-release candidate.**

---

## A. The smoking gun (main's own provenance note)
`origin/main:backend/src/TerraFusion.Levy/Data/LevyDbContext.cs` header states verbatim:

> *"Historical note: this file was previously named **LevyDbContextStub.cs** and carried a stale
> 'TEMPORARY STUB' header. **Renamed + de-stubbed 2026-04-18** once it was confirmed to be the
> real, migrated, DI-registered context."*

The `r2/*` heads still carry the **pre-de-stub `LevyDbContextStub.cs`** (`// TEMPORARY STUB FOR
BACKEND STRUCTURAL BUILD` / `// TODO: Replace with real LevyDbContext implementation`). The
branches are unambiguously the **older ancestors**; main is the de-stubbed descendant.

## B. Evidence base (all vs current `origin/main` @ `2ae013561`)

| Source head | merge-base | ADDED (branch-only) | MODIFIED | Levy-module: branch-only / main-ahead lines | Core-levy: branch-only / main-ahead lines |
|---|---|---|---|---|---|
| `r2/w12-real-levy-engine` | **NONE** | 104 | 1,053 | 226 / **4,371** | **0** / 728 |
| `r2/wave-31-forge-levy-certification` | **NONE** | 104 | 1,059 | 226 / 4,371 | 1 / 634 |
| `r2/w11-real-dais-permits` | **NONE** | 104 | 1,053 | 226 / 4,371 | **0** / 728 |
| `r2/w21-appeal-cert` | **NONE** | 104 | 1,053 | 226 / 4,371 | **0** / 728 |
| `chore/terra-levy-parity-sync` | **NONE** | 76 | 950 | 144 / 1,185 | 0 / 0 |

Dais/permits surface (`r2/w11-real-dais-permits`): branch-only **1,846** vs main-ahead
**106,173** lines (437 files); only branch-only permit/dais file = `DaisSuiteHome.test.tsx` (a test).

**Floor characterized:** 104 ADDED = **90 test/e2e/spec** + the 14 non-test below — none are SoR:
- `backend/src/TerraFusion.Levy/Data/LevyDbContextStub.cs` ← the **old stub** (regression if ported)
- `backend/src/TerraFusion.Core/Services/CostForgeService.cs` + 6× `components/costforge/*.tsx`
  (incl. `CostForgeQuantumDashboard.tsx`) ← **F18 Tier-5 "Ultimate" theater — CUT**
- `docs/*.tar.gz` ×3 ← **binary doc bundles, residue — do not port**
- `config/environment.ini`, `frontend/.../ShellHome.tsx`, `CostForgeAI.tsx` ← incidental

The plan's suspected "~42 floor" is in fact a **larger, mixed floor (90 test + 14 noise/theater/residue)**; the genuine new-source value behind it is **0**.

---

## C. Compact entry-check table
`source head → target in main → residual type → actionability → owner fence → notes`

| Source head | Target in main | Residual type | Actionability | Owner fence | Notes |
|---|---|---|---|---|---|
| `r2/w12-real-levy-engine`, `r2/w21-appeal-cert`, `r2/wave-31-forge-levy-certification` | real de-stubbed Levy SoR (+4,371 lines, real migrations) **already in main** | **SUPERSEDED** | **DO NOT PORT** — main is the de-stubbed descendant; porting regresses to stub | levy/cert (owner review); attestation integrity; **Option-C: SoR authority** | branch-only = old `LevyDbContextStub.cs` + stale migration-snapshot index fragments |
| `r2/w11-real-dais-permits` | dais/permits surface **+106,173 lines in main** | **SUPERSEDED** | **DO NOT PORT** | county sovereignty | only branch-only dais file is a test (`DaisSuiteHome.test.tsx`) |
| `chore/terra-levy-parity-sync` | Levy module (+1,185 in main) | **SUPERSEDED** (smaller delta, same direction) | do not port | levy/cert | "parity-sync" name; content still behind main |
| floor: `LevyDbContextStub.cs` | real `LevyDbContext.cs` in main | **HAZARDOUS** | **FENCE** — never port (would re-stub the SoR) | **Option-C SoR integrity** | the exact file main de-stubbed 2026-04-18 |
| floor: CostForge `*.tsx` + `CostForgeService.cs` | — | **THEATER (F18 Tier-5)** | **CUT** (already plan-cut) | valuation honesty | `CostForgeQuantumDashboard` etc. |
| floor: `docs/*.tar.gz` ×3 | — | **BINARY RESIDUE** | do not port | — | doc bundles, not source |

---

## D. Option-C authority check (the extra Dais/Levy gate)
- **Strengthens Levy-module SoR?** No — the branch's Levy-module delta is an *older stub*, not an
  enhancement. The real SoR is already in main.
- **Re-arms Core levy as authority?** **No.** Core-levy branch-only lines = **0** across the r2
  heads (main is ahead +634–728). The branches add nothing to Core levy → **no Option-C
  re-arming risk** from these heads.
- **Conflicts with read-projection-only?** No new conflict introduced; but the **`LevyDbContextStub.cs`
  is a fence item** — porting it would replace the authoritative SoR context with a stub, an
  integrity regression. Quarantine, never port.

**Net Option-C result: clean (no re-arming), but also no SoR value to gain.**

---

## E. Summary verdict (the four buckets)
1. **Already landed:** the real, de-stubbed Levy module SoR (+4,371 lines, real migrations,
   DI-registered) and the dais/permits surface (+106,173 lines) — all in `main`.
2. **Superseded:** all 5 checked `r2/*` + `chore` Levy/Dais heads. Main is the descendant.
3. **Residual-salvageable:** **none of substance.** 226 branch-only Levy lines = old stub +
   stale migration snapshot. No engine/SoR value.
4. **Hazardous / owner-sensitive:** `LevyDbContextStub.cs` (re-stub regression — fence);
   CostForge "Ultimate" theater (cut); `.tar.gz` binary bundles (residue).

**First narrow Tier-1 release candidate (Dais/Levy): NONE.** The SoR is already in main.

---

## F. Cross-domain pattern (now TWICE confirmed) — decision-grade
Both prioritized Tier-1 lanes — **Sync** (`SYNC-ENTRY-CHECK.md`) and **Dais/Levy** (this doc) —
resolve to **SUPERSEDED-BY-MAIN** under content-presence. Combined with the N1 result and the v2
batch-landed check, the evidence now strongly indicates: **`main` already contains the evolved
form of the legacy/`r2` Tier-1 work; the branch sprawl is recut *ancestry*, not pending value.**
The genuine forward work is looking less like "port from branches" and more like
**topology-split + forward development on main** (the FECF Migrate phase), with branch salvage
reserved for narrow, individually-proven fragments only.

## G. Recommendation (for owner ratification)
1. **Close the Dais/Levy legacy-port lane** as *superseded-by-main* (no narrow release).
2. **Add `LevyDbContextStub.cs` to a port-fence list** (never port — would re-stub the SoR).
3. **Run the Forge entry-check** (the last Tier-1 domain) to test whether the pattern holds a
   third time — *then* make the call on whether any legacy/`r2` port lane is worth opening at all,
   or whether Tier-1 recovery collapses entirely into "main is the spine → proceed to topology
   split / Migrate." (Per your sequencing, Forge only after Dais/Levy is characterized — now done.)

Lock remains **ACTIVE**. No code, no merge, no cherry-pick, no release.

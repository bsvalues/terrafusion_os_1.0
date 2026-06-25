# Tier-1 Closure Record (governance ratification)

*Formal close of the Tier-1 **branch-port recovery** thesis and ratification of the
**Recover → Migrate** pivot. This is a governance artifact, not a plan. **No code, no merge, no
cherry-pick, no repo creation, no lock release.** Recovery lock remains **ACTIVE**.*

**Status:** RATIFIED · **Date:** 2026-06-25 · **Branch:** `claude/terrafusion-forensic-playbook-u3kvx6` · **PR:** #1080 (draft)

---

## 1. Finding (blunt)
The Tier-1 port-recovery thesis — *"genuine, not-yet-landed value sits on the legacy/`r2` branches
and must be ported into the new repos"* — was **tested across all three Tier-1 domains and
disproven.** **Sync, Dais/Levy, and Forge all resolved to SUPERSEDED-BY-MAIN.** The evolved `main`
spine already contains the mature form of that work; the legacy/`r2` branch estate is
overwhelmingly **recut ancestry, not pending value.**

## 2. Evidence basis (the chain that supports this closure)
| Link | Source | What it established |
|---|---|---|
| Three-lineage truth | `03-BRANCH-CENSUS-REGISTER.md`, `evidence/branch-census.csv` | 3 disjoint roots; 653/741 branches PORT-ONLY (no merge-base with main) — branch status is structurally untrustworthy |
| Gate C scoring | `R11-GATE-C-SCORING.md` | per-initiative U/F/O scoring + ordered needle set; residual "already-landed?" check pushed to entry-time |
| Value-tier salvage map | `R11-VALUE-TIER-SALVAGE-MAP.md`, `F18-LATENT-VALUE-AUDIT.md` | Tier-1–2 surfaces vs theater; flagged CostForge "Ultimate" as F18 Tier-5 |
| Topology matrix | `RECOVERY-TOPOLOGY-MATRIX.md` | future-home per surface (core/Sync/Dais/Forge/Atlas/Dossier) |
| F14 schema ratification | `F14-GATE-RATIFICATION.md` | **Option C** ratified: Levy module = SoR → Dais; Core = read-only projection; no dual-write/shadow schema |
| Batch already-landed (v2) | `R12-BATCH-LANDED-CHECK-v2.md`, `R12-N1-ENTRY-CHECK.md` | merge-candidate pool collapsed to already-landed; N1 already in main + more evolved |
| **Sync entry-check** | `SYNC-ENTRY-CHECK.md` | legacy Sync heads superseded (main superset +393–5,360 lines; branch-only ≤41 = older variants) |
| **Dais/Levy entry-check** | `DAIS-LEVY-ENTRY-CHECK.md` | `r2/*` superseded; main holds the **de-stubbed real Levy SoR** (+4,371) + dais/permits (+106,173); branch = old `LevyDbContextStub.cs` |
| **Forge entry-check** | `FORGE-ENTRY-CHECK.md` | `r2/wave-*` superseded; main holds real stats engines **+ the R2Wave26/27/28 tests**; branch-only = theater only |

Method throughout: **content-presence, not branch status** (recut-aware); floors characterized
before trusting residual (HR-6). The shared `r2` "residual" was identified as a **uniform 104-file
floor** (90 test + 14 noise/theater/residue) carrying **0 genuine new source**.

## 3. Closure decisions (ratified)
1. **Sync lane — CLOSED, superseded-by-main.** `codex/sync-db-evidence-runtime-path` reclassified
   **Sync → Forge/Pilot** (touches zero backend sync engine).
2. **Dais/Levy lane — CLOSED, superseded-by-main**, under the ratified **Option C** schema model
   (Levy module = SoR → Dais; Core = read-only projection). No re-arming of Core authority found.
3. **Forge lane — CLOSED, superseded-by-main.** Real valuation/stats/IAAO/income substance already
   in `main`; wave work recut in with its tests.
4. **CostForge "Ultimate" — CUT + FENCED** as theater/hazard (F18 Tier-5): the fabricated
   `$425k` placeholder, "quantum" wrappers, and reintroduced **Tyler lore** (C48-HYGIENE-swept).
   **Not migration material; never port.**
5. **Tier-1 branch-port recovery — CLOSED.** The port thesis is retired. No Tier-1 port lane will
   be opened.
6. **Program pivot — Recover → Migrate.** The **evolved `main` spine is the migration source.**
   Branch salvage is reduced to **proven micro-fragments only** (catalogued, not laned).

## 4. What is fenced (must never be ported / reintroduced)
- **CostForge "Ultimate"** surfaces: `CostForgeService.cs`, `components/costforge/*.tsx`
  (incl. `CostForgeQuantumDashboard`), `CostForgeAI.tsx`.
- **`backend/src/TerraFusion.Levy/Data/LevyDbContextStub.cs`** — the old stub; porting it would
  re-stub the authoritative Levy SoR (Option-C integrity hazard).
- **Fabricated value placeholders** (`EstimatedValue = 425000m // Placeholder`) and any
  **Tyler Technologies / Tyler Vision** lore (not in Benton's stack; swept by C48-HYGIENE).
- **Binary doc bundles** `docs/*.tar.gz` (residue, not source).

## 5. What remains salvageable (the only residual, micro-scale)
A short fragment catalogue — **not** lanes. Each is a future narrow, individually-proven, fenced
cherry-look only if/when its home file is touched during Migrate:
- Sync: malformed-county-key `Guid.TryParse` guard in `ArcGisNightlySyncHostedService` (verify
  main lacks it); the three-state WSDOR lookup doc-comment in `ITfParcelWsdorReader` (doc-only).
- No engine-, schema-, or SoR-level salvage remains on any Tier-1 branch.

## 6. Next phase
**FECF position advances: Discover ✅ → Classify ✅ → Ratify ✅ → Recover ✅ (closed: port thesis
disproven) → Migrate ▶ (opening).** Next artifact = the **Migrate-phase split plan** for
`TerraFusionOS` core · `TerraFusion-Sync` · `TerraFusion-Dais` · `TerraFusion-Forge` ·
`TerraFusion-Atlas` · `TerraFusion-Dossier`, sourcing from the evolved `main` spine, with
`IForgeStatisticsService` and the F14 Levy projection/sync contracts treated as **core
shared-contracts** at split time.

**Recovery lock remains ACTIVE.** This record closes a thesis and authorizes the *planning* of
Migrate; it does **not** authorize code movement, repo creation, or any extraction. The Migrate
split plan will itself be decision-only until a separate, explicit narrow release.

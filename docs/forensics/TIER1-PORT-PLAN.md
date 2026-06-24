# First Tier-1 Port Execution Plan (decision-only)

*Order: **Sync → Dais/Levy → Forge** (platform ingress → ratified-SoR domain → dependent
suite). Decision-only: no code, no merge, no cherry-pick, no repo creation, no `#1073`.
Every port = a future narrow, individually-ratified lock release (HR-9), with its own entry
checks. Recovery lock ACTIVE.*

## Cross-cutting entry check (applies to all three) — MUST run before any port
- **Characterize the `r2`-family shared floor.** Levy/Forge r2/* heads uniformly show
  `true-residual ≈ 42` — almost certainly a shared deletion-residue floor (like the 9-file
  and 62-e2e floors). **Subtract the floor before trusting any residual count** (the v1→v2
  batch-collapse lesson, HR-6). Genuine per-branch residual = (42 − floor).
- **Pick ONE head per recut family** (overlap-resolution groups, R11).
- **Content-presence, not branch status** (recut-aware; Lane 3 / Loop 5).

---

## 1. Sync → `TerraFusion-Sync`
| Field | Value |
|---|---|
| **Target repo** | TerraFusion-Sync (platform ingress, upstream of all) |
| **Source heads** | legacy best-version (PORT-ONLY): `feat/sync-complete-2-v3-year-sliced-imprv-attr`, `feat/sync-doctrine-4-impl-v9-hosted-test`, `feat/sync-pop-4c-canonical-parcel`, `feat/sync-pop-4d-final-closure`, `feat/attr-pop-1/2`; **bridge (MERGE-CANDIDATE)**: `codex/sync-db-evidence-runtime-path` (ahead 17, **8 genuine new files**) |
| **Port method** | **hunk-level** for legacy heads — they have **true-residual = 0** (no branch-only files); value is in *diffs to files already in `main`'s SyncEngine/connectors*. **cherry-pick** the `sync-db-evidence` bridge. |
| **Entry checks** | per-file content diff of each legacy head's hunks vs `main`'s sync engine → classify each hunk *improvement / already-superseded / conflict*; confirm `main`'s sync engine is the base; dedupe sync-doctrine-4 → v9 only |
| **Owner-sensitive fences** | **PACS source-of-truth direction immutable** (PACS→TF, canon); county isolation (AC-4 target) |
| **Schema/config deps** | F14 gate OPEN (Option C); Sync owns its own DB schema; produces normalized payloads |
| **Cross-repo contracts touched** | **Sync→Dais levy-input payload** + county-context (criterion 5) — must exist before Sync feeds suites |
| **Cut line (now vs later)** | NOW: the corpus/drain + attr-dictionary skeleton hunks + the `sync-db-evidence` bridge. LATER: deep doctrine variants once the payload contract is concrete |
| **Rollback / abort** | if legacy hunks conflict heavily with `main`'s evolved engine → **abort to salvage-notes** (document the delta; do not force-port) |
| **Proof of success (of the PLAN)** | a per-head hunk inventory + improvement/superseded/conflict classification + the Sync→Dais contract dependency confirmed present |

---

## 2. Dais / Levy → `TerraFusion-Dais` (built on ratified Option C)
| Field | Value |
|---|---|
| **Target repo** | TerraFusion-Dais |
| **Source heads** | `r2/w12-real-levy-engine`, `r2/wave-31-forge-levy-certification`, `r2/w11-real-dais-permits`, `chore/terra-levy-parity-sync` — **PLUS the existing `backend/src/TerraFusion.Levy` module** (the ratified SoR) |
| **Option-C discipline (explicit)** | Port establishes the **Levy module (Guid-PK, attested) as authority in Dais**. Ported levy logic must **NOT reintroduce the Core `int`-PK legacy subdomain as a write target/authority.** Core stays **read projection only** — no dual-write, no shadow schema |
| **Port method** | file/hunk-level from r2 heads **into the Levy-module SoR shape**, reconciled against the existing module — never into Core |
| **Entry checks** | **characterize the r2-42 floor first**; verify every ported write targets the Levy SoR, not Core; assert no Core int-PK entity is recreated as authoritative; confirm the F14 data-migration (criterion 4) precedes/accompanies |
| **Owner-sensitive fences** | levy/cert (owner review), county isolation, **attestation integrity** (envelope/hash must survive the port) |
| **Schema/config deps** | F14 Option C; the **dual-LevyCertification reconciliation + main-DB→SoR data migration** (criterion 4) is a hard precondition |
| **Cross-repo contracts touched** | Levy **projection** contract, **cert read DTO**, **levy domain events**, county-context (criterion 5) |
| **Cut line** | NOW (after Sync feed exists): the **levy engine + certification** logic into the SoR. LATER: permits / dais-workflow |
| **Rollback / abort** | **C-then-maybe-D, never D-first**; abort = keep Core legacy store **frozen read-only**; re-point reads back |
| **Proof of success (of the PLAN)** | demonstrates ported logic writes **only** to SoR; Core never re-armed as authority; projection contract satisfied |

---

## 3. Forge → `TerraFusion-Forge` (third — depends on Sync + Dais)
| Field | Value |
|---|---|
| **Target repo** | TerraFusion-Forge |
| **Source heads** | `r2/waves-26-35-integration` (consolidated) + `r2/wave-26…35-*` family + `r2/w9-real-costforge-calculator` |
| **Port method** | file/hunk from the **integration head**; **CUT CostForge "Ultimate"** (F18 Tier-5 theater) — do **NOT** port it |
| **Entry checks** | characterize the r2-42 floor; isolate the genuine forge-stats (OLS / Bayesian / MonteCarlo / spatial-autocorrelation / RCW) files from the floor; ensure **valuation is honest** (no `$425k` demo placeholder ported as real) |
| **Owner-sensitive fences** | valuation honesty (no fabricated outputs); none owner-gated otherwise |
| **Schema/config deps** | Forge owns its schema; depends on **Sync payloads** + (valuation) **Levy/parcel data via contract** |
| **Cross-repo contracts touched** | **forge tab contract**, sync→Forge payload |
| **Cut line** | THIRD — only after Sync ingress + Dais/Levy SoR are stable. Port forge-stats; cut "Ultimate" |
| **Rollback / abort** | abort = salvage-notes; **never** port "Ultimate" |
| **Proof of success (of the PLAN)** | forge-stats ports cleanly atop the ratified contracts; "Ultimate" excluded; valuation honest |

---

## Sequencing rationale
1. **Sync first** — platform ingress; everything downstream consumes its payloads; its contract must land before Dais/Forge can be fed.
2. **Dais/Levy second** — the ratified SoR; needs the Sync feed + the F14 data migration; establishes Levy authority cleanly (Option C).
3. **Forge third** — consumes both Sync payloads and Levy/parcel data; safe only once upstream is stable.

## What this plan is / isn't
- **Is:** a decision-ready map of *what* ports *where*, *how*, with fences, contracts, cut lines, and abort conditions — ready to convert into per-domain narrow-release work orders.
- **Isn't:** execution. No code/merge/cherry-pick/repo-creation. Each domain's *execution* is a separate, individually-ratified narrow lock release (R12-N1 pattern), gated on its entry checks above + the F14 contracts existing.

## Next
Reassess: (a) prepare the **first narrow release = Sync entry-checks** (still no merge — read-only hunk inventory), or (b) take the parked **PR #1073** as a contained near-term win.

# Authority-Reconciliation Ledger (WO-SR-001 §8)

> **Doctrine:** missing or externally-supplied authority is a **reconciliation workload**, not a
> protected boundary. `BLOCKED_MISSING_CANON_SOURCE` is the wrong stop. This ledger reconciles every
> controlling source through **evidence + precedence + standing operator process** — neither
> discarding supplied authority for being external, nor promoting it blindly. Decision-layer only;
> no repo created, no code moved, no lock released.

**Date:** 2026-06-25 · **Source main HEAD:** `2ae013561` · **Precedence backbone:** `docs/brain/canon/source-priority.json`

## 0. Precedence backbone (the repo's OWN law of what wins)
`source-priority.json` (rank = authority; "old docs are CONTEXT, not law"):
1 `.github/AGENT_ENTRYPOINT.md` (law/bootloader) · 2 `TERRAFUSION_SUITE_CONSTITUTION_v1.md` **TF-052** (law) ·
3 `docs/brain/canon/*.json` (machine digest of law) · 4 `docs/architecture/specs/terrafusion/**` (specs) ·
5 active ADRs · 6 release truth · 7 graph evidence · **8 other `docs/**` = context, not law** · 9 `ARCHIVE/**` = historical only.

## 1. Reconciliation ledger
| Source (location) | Date/order | Proposition it establishes | Authority | In origin/main? | vs older canon | Reconcile into |
|---|---|---|---|---|---|---|
| **TF-052** `docs/architecture/TERRAFUSION_SUITE_CONSTITUTION_v1.md` | constitutional | 5 suites (forge/atlas/dais/dossier/gpt) + domains + ownership; Workbench/Pilot/Trace = OS | **LAW (rank 2)** | ✅ | governs | **settled** — decomposition |
| `docs/brain/canon/suites.json` | digest of TF-052 | machine-readable suite ownership map | rank 3 | ✅ | complements TF-052 | settled |
| `docs/brain/canon/write-lanes.json` + `specs/…/04_SUITE_BOUNDARIES_WRITE_LANES_v3.1.md` | v3.1 | per-suite write-lanes; cross-lane prohibited; Trace bridge | rank 3–4 | ✅ | complements | settled — boundaries |
| `.github/AGENT_ENTRYPOINT.md` | bootloader | agent write-lane matrix / entrypoint | **LAW (rank 1)** | ✅ | governs | settled |
| **`docs/architecture/CAPABILITY_PLACEMENT_MAP.md`** | ~2026-03 (newest arch map) | **`terrafusion_os_1.0` = CANONICAL monorepo; `terrafusion-os` = PREDECESSOR (superseded); feeders ABSORB-IN** | **context (rank 8)** | ✅ | **CONFLICTS w/ owner thread** | **⚠ boundary** |
| `docs/architecture/ARCHITECTURE_REALITY_CORRECT_ANSWER.md` | 2025-10-10 | monorepo = coordination hub; suites → polyrepos as source-of-truth (12-repo gen) | context (rank 8) | ✅ | partial-complement / stale gen | ⚠ boundary (hybrid) |
| `docs/architecture/PRODUCTION_FIRST_APPROACH.md` | 2025 | "keep the monorepo for development" | context (rank 8) | ✅ | complements hybrid | ⚠ boundary |
| `docs/forensics/RECOVERY-TOPOLOGY-MATRIX.md` | Loop 4 (2026-06) | future-home-per-surface: core + Sync/Dais/Forge/Atlas/Dossier repos (extract-OUT) | forensics decision (≈rank 5/8) | ✅ | agrees w/ owner thread | ⚠ boundary (extract-out) |
| `docs/forensics/WO-SR-001-…` | Loop 48 (2026-06) | 5 suite repos + `terrafusion-os` host; `terrafusion_os_1.0` = archive | operator blueprint | ✅ | programs extract-OUT | ⚠ boundary |
| **Owner thread** (this conversation, Loops 42–48) | 2026-06-25 (newest) | extract 5 suites OUT into new repos; `terrafusion-os` = sovereign host; `terrafusion_os_1.0` = archive/mine | **owner instruction (live)** | ❌ (chat) | **CONFLICTS w/ CAPABILITY_PLACEMENT_MAP** | ⚠ boundary |
| `TerraFusion_Codex_Full_Portfolio_Goal.md` | asserted | suite DAG + Claude/Codex division | **ASSERTED-ELSEWHERE** | ❌ (not on disk) | unverifiable | quarantine until produced |

## 2. Reconciliation outcome — two layers
### Layer A — Suite decomposition: **CANON_RECONCILED_AND_PROGRAMMED**
The five-suite ownership model, names, domains, write-lanes, and **Workbench/Pilot/Trace = OS** are
fixed by **LAW (TF-052, rank 2)** and its machine digest (rank 3–4). The owner's thread direction and
the forensics topology matrix **agree** with it. **Older "monorepo/runtime-composition" language is
COMPLEMENTARY, not contradictory:** the monorepo's stated role — *"coordination + deployment +
integration + documentation hub"* (`ARCHITECTURE_REALITY_CORRECT_ANSWER.md`) — is **the same role
WO-SR-001 assigns to the OS/platform host** (retains shell + Workbench host + Brain + integration +
governance; suites own domains). So the composition model is reconciled, not in conflict. → programmed by `WO-SR-001` + the WO-SR / WO-*-X chains.

### Layer B — Repository topology + base-repo identity: **TRUE_OWNER_BOUNDARY**
Higher law (TF-052) is **silent on physical repo topology**; the rank-8 architecture docs **conflict
with each other and with the owner's live thread direction** on two coupled points that no existing
instruction unambiguously settles:
1. **Which repo is the go-forward OS/platform base?** `terrafusion_os_1.0` (CAPABILITY_PLACEMENT_MAP: canonical) **vs** `terrafusion-os` (owner thread: sovereign host — but the map calls it a *superseded predecessor*).
2. **Direction:** **extract-OUT** into new suite repos (owner thread + topology matrix) **vs absorb-IN** to the monorepo (CAPABILITY_PLACEMENT_MAP feeder model) **vs hybrid** coordination-hub + polyrepo-source-of-truth (ARCHITECTURE_REALITY).

**Why this is a genuine boundary, not a reconcilable one:** the owner's live premise ("`terrafusion-os`
is our clean sovereign repo") is **directly inverted** by standing origin/main canon
(`terrafusion-os` = "pre-monorepo generation, superseded by terrafusion_os_1.0"). Per doctrine, a
live instruction premised on a fact that canon contradicts must be **surfaced for knowing
adjudication**, not silently executed. The owner's word can win (rank-8 docs are context, not law) —
**but only as a knowing supersession**, which then requires updating `CAPABILITY_PLACEMENT_MAP` so
canon stops contradicting the program.

## 3. New material for the extraction matrix (feeder provenance)
`CAPABILITY_PLACEMENT_MAP` reveals suite capability also originates in **feeder repos** (out-of-session,
unverifiable here): `BSIncomeValuation`→Forge/Income, `GeospatialAnalyzerBS`+`BCBSGISPRO`+`TerraGama`→Atlas,
`TerraFlow`+`TerraPILT`→Dais, `BCBSLevy`→Levy, `CountyDataSync-1`→Sync, `PropertyTaxAI`+`TaxI_AI`→Pilot.
⇒ WO-*-X-001 inventories must add a **feeder-provenance** column (some suite content is absorb-from-feeder,
not extract-from-monorepo). Verification requires those repos in session scope.

## 4. RESULT
```text
RESULT: CANON_RECONCILED_AND_PROGRAMMED   (Layer A — suite decomposition)
  - topology decision recorded:        five-suite LOGICAL decomposition = LAW (TF-052); PROGRAMMED
  - five-repository matrix:            WO-SR-001 §3 (source-path assignments) + §6 (extraction matrix)
  - proposed repository names:         terrafusion-{forge,atlas,dais,dossier,gpt} (owner-ratify)
  - OS vs suite ownership boundary:    WO-SR-001 §2 (Workbench/Pilot/Trace/Sync/contracts = OS)
  - shared-contract sequence:          Abstractions seam (Loops 24–39) → WO-SR-002 freeze
  - extraction/provenance policy:      WO-SR-001 §5 taxonomy + §8 cutover gates + feeder-provenance (§3 here)
  - creation order:                    Forge pilot → Atlas → Dais → Dossier → GPT (WO-SR / WO-*-X chains)
  - bounded repo-creation WOs:         WO-SR-003 (owner-only; integration 403)
  - older monorepo language:           RECONCILED as complementary (hub role == OS/platform host role)

RESIDUAL — TRUE_OWNER_BOUNDARY          (Layer B — base-repo identity + direction)
  DECISION NEEDED: EXTRACT-OUT (terrafusion-os host + 5 new suite repos; terrafusion_os_1.0 = archive)
                   vs  MONOREPO-CANONICAL / ABSORB-IN (terrafusion_os_1.0 stays canonical base;
                       suites stay logical lanes; terrafusion-os stays superseded)
                   vs  HYBRID (terrafusion_os_1.0 = coordination hub; suites → polyrepos source-of-truth)
  BLOCKING FACT:   CAPABILITY_PLACEMENT_MAP calls `terrafusion-os` a superseded predecessor —
                   the inverse of the owner-thread premise. Owner must confirm the supersession
                   knowingly; on confirmation, reconcile (update) CAPABILITY_PLACEMENT_MAP.
```

## 5. What this is / isn't
- **Is:** the authority-reconciliation ledger required by WO-SR-001 §8; it *programs* everything law
  settles and *isolates the single genuine strategic question* the authorities do not.
- **Isn't:** a request for the owner to author canon; a blind adoption of thread direction over
  standing canon; or any lock release. The one open question is a true owner boundary, surfaced with evidence.

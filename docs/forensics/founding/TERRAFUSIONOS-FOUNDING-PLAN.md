# TerraFusionOS — Phase-1 Core-Spine Founding Plan

*The bridge between forensics and controlled continued development. This DEFINES the founding
slice of TerraFusionOS core + shared-contracts. It is **not extraction** — no code is moved
and no repo is created. Recovery lock remains ACTIVE.*

## Objective
Create the **smallest viable TerraFusionOS foundation** that can act as the long-term center —
a thin governed core that owns the OS shell and the contracts every future suite/platform repo
must obey, and deliberately owns *nothing* of suite/platform domain internals.

## Founding principle
> The core is small, governed, and contract-owning. Suites and platform are large, domain-owning,
> and contract-obeying. The core never becomes a dumping ground for shared confusion (HR-8/R-SPLIT).

## Includes (Phase 1)
- shell / desktop / windowing
- top bar / dock / **workbench host** (host + orchestration only)
- Pilot / Trace / Canon **shell-facing surfaces**
- registry / runtime composition
- governance / canon tooling
- **shared contracts** (explicit, core-owned)
- core config standards
- ownership map + repo rules for future extractions

## Excludes (Phase 1 — go to platform/suite/legacy)
PACS ETL / county ingestion (→ Sync) · Levy internals (→ Dais) · Forge stats / valuation
engines (→ Forge) · Atlas ingestion (→ Sync) / Atlas UI (→ Atlas) · Dossier internals (→
Dossier) · wrapper noise & CostForge "Ultimate" (→ legacy cut) · dead legacy ports (→
archaeology) · schema-fractured domain internals (→ behind F14 gate) · deep Pilot AI internals
(→ undecided).

## Owner clarifications (this draft)
- **shared-contracts is explicit under TerraFusionOS** — not implied (CORE-CONTENTS + SHARED-CONTRACTS matrices).
- **Pilot split stays undecided** — shell-facing Pilot is core; deeper AI internals remain undecided until F17 reality classification is solid enough (R-PILOT).
- **County Hub is a CONSUMER of Sync, not core** — unless it is literally shell-level routing/UI host (then only that host part is core).
- **Levy remains Dais-bound** — not reopened.

## Companion deliverables (this folder)
1. `CORE-CONTENTS-MATRIX.md` — what is in/out of Phase 1, why, owner.
2. `SHARED-CONTRACTS-MATRIX.md` — what core-owned contracts exist.
3. `OWNERSHIP-CELLS.md` — runtime/contract/schema/impl owners (provisional, filled now).
4. `NON-OWNERSHIP-RULES.md` — what core never owns.
5. `EXTRACTION-PREREQUISITES.md` — what must be true before each future repo is extracted.

## Status
Founding **definition** drafted (decision-only). No extraction, no repo creation, no
home/owner reassignment (matrix v2 stands). Migration begins only on owner lock-release +
target repos existing + the per-repo prerequisites (deliverable 6) met.

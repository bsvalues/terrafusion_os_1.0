# Migrate R1 — Ratification + First Narrow Release Record

*Governance record. Ratifies the Migrate-phase split plan and opens the **first narrow lock
release** of the entire recovery: **Phase-1 shared-contracts formalization in `main`.** This is
the first authorized code-touching step. Everything outside the scope below remains lock-gated.*

**Date:** 2026-06-25 · **Branch:** `claude/terrafusion-forensic-playbook-u3kvx6` · **PR:** #1080 (draft)

---

## 1. Ratified — Migrate split plan + sequencing (as-is)
`MIGRATE-SPLIT-PLAN.md` is **RATIFIED**. The six-repo topology, contracts-first principle, R-SPLIT
ownership discipline, fences, maturity findings (Dossier not-yet-splittable), and the sequence
**1 core+contracts → 2 Sync → 3a Atlas → 3b Dais/Levy → 3c Forge → 3d Dossier** (Phase 4 deferred)
are accepted. `main` is the migration source (Tier-1 port thesis closed, `TIER1-CLOSURE-RECORD.md`).

## 2. First narrow lock release — scope (IN)
The recovery lock is released **narrowly and only** for **Phase-1 shared-contracts formalization,
performed in-repo on `main`** (no new repos). Authorized work:
- Establish **`TerraFusion.Abstractions` as the canonical cross-repo contracts home** + charter.
- **Classify** every scattered contract (`Core/Interfaces` ×36, `Core/DTOs` ×57) as
  **promote-to-Abstractions (cross-repo)** vs **stay domain-local**.
- Define **ownership + versioning rules** for the shared-contract surface.
- Enumerate the named contract sets: workbench tab contracts, sync→suite payload contracts,
  F14 levy projection/sync DTOs, `IForgeStatisticsService` + sibling cross-repo service contracts.
- Then, **incrementally and each build-verified**, relocate clearly-cross-repo contracts into
  `Abstractions` (small PRs; namespace + consumer updates; green build per increment).

## 3. Out of scope (REMAINS lock-gated)
- repo **creation** · `filter-repo`/subtree moves · suite **extraction**
- Atlas / Dais / Forge **code moves** · **Dossier split** · Pilot deep internals (Phase 4)
- any change to fenced material (CostForge "Ultimate", `LevyDbContextStub.cs`, `$425k`/Tyler lore)
- schema/persistence changes (F14 migration is its own future release)

## 4. Build-safety discipline (HR-4)
This environment cannot fully verify the 16-project solution build. Therefore:
- The **charter + classification** (this release's first artifact, `Abstractions/CONTRACTS.md`)
  carries **zero build risk** and lands first.
- **Physical relocation** of any contract is a **separate, individually build-verified increment.**
  No big-bang move. No "done" claim without a green build for that increment. (No hidden rebuilds.)

## 5. Proof of success (Phase-1 shared-contracts)
- canonical contracts home declared + charter in `Abstractions` ✓ (this release)
- every scattered contract classified promote/stay ✓ (this release)
- ownership + versioning rules defined ✓ (this release)
- the four named contract sets enumerated + located ✓ (this release)
- (subsequent) each relocation increment merged green, consumers updated, no behavior change

## 6. Lock status
**PARTIALLY RELEASED — Phase-1 shared-contracts only.** All other migration actions remain
**ACTIVE-LOCKED**. This release does not authorize extraction or repo creation. The release is
narrow, like R12-N1 — scoped, fenced, and revocable.

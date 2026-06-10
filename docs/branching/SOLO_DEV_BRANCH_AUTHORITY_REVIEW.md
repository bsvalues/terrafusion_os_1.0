# Solo-Dev Branch Authority Review

**Date**: 2026-06-09  
**Analyst**: Claude Code  
**Purpose**: Determine authoritative base for TerraFusion OS — no code changes  

---

## 1. Current HEADs

| branch | HEAD commit | HEAD date |
|---|---|---|
| `main` | `e4b3ec0cd` | 2026-05-02 |
| `fix/projector-delete-insert-atomicity` | `e601e53ef` | 2026-06-09 (today) |
| **divergence point** | `fda772a74` | 2026-04-28 |

The branches diverged at `feat(local-agent): ship isolated local-agent runtime branch (#722)` on 2026-04-28.

---

## 2. Commit Counts

| direction | commits |
|---|---|
| sync branch ahead of main | 434 |
| main ahead of sync branch | 1,278 |

---

## 3. Major Work Categories — main only (1,278 commits)

These commits exist on main and NOT on the sync branch.

| scope | count | what it is |
|---|---|---|
| sync | 428 | PACS landing pipeline, truth promoters, canonical projectors (the data arch) |
| county-studio | 103 | County Studio suite work |
| geoforge / geoforge-v2 | 92 | GeoForge spatial product |
| costforge | 56 | CostForge product |
| forge | 44 | TerraForge product |
| workbench | 29 | Workbench features |
| calibration | 25 | Calibration module |
| pacs | 22 | Additional PACS landing gates |
| canonical-tf / truth-pacs | 29 | Canonical + truth layers |
| gis-tf | 13 | GIS/geometry layer |
| atlas | 20 | Atlas product |
| pilot | 9 | Pilot product |
| theme / tokens | 13 | Design token work |
| native-app-integrations | 6 | CP-series native integrations |
| ci | 8 | CI/CD pipeline |
| *(many more)* | 350+ | tests, docs, refactors, fixes |

**Key main-only work (from sample):**
- `canonical-tf` Block B–C (owner, WSDOR, improvement, land) — full data landing pipeline after divergence
- `truth-pacs` land/improvement promoters (L1, L2, C2, C3)
- `pacs` raw landing for imprv, imprv_detail, imprv_attr, land_detail, wash_prop_owner_val
- `geoforge`, `costforge`, `county-studio` — substantial product work
- Theme/token foundation work
- Many forge, forge-v2, atlas commits

**Conclusion: main is NOT old/drifted. It is the PRODUCT trunk.** It has continued receiving active development across all TerraFusion products after the sync branch was cut. Its 428 sync-scoped commits represent the PACS raw → truth → canonical data pipeline — the foundational landing architecture.

---

## 4. Major Work Categories — sync branch only (434 commits)

These commits exist on the sync branch and NOT on main.

| scope | count | what it is |
|---|---|---|
| sync | 72 | Doctrine layer, workbench, production proof, brain lessons |
| forge | 35 | CompsForge (subject defense, diagnosis, review, certify) |
| truth | 35 | Sync doctrine refinements (D4 universe, attribute dict) |
| governance | 15 | Brain governance, write-lane doctrine |
| workbench | 14 | Workbench v0.3 endpoints (doctor, identity, source-pack, quarantine) |
| seals | 10 | Lane seal evidence docs |
| brain | 9 | Brain/Cortex Sync lessons |
| audit | 10 | Audit trail work |
| ci | 11 | CI hygiene |

**Key branch-only work:**
- `tf-sync-doctor` (the 4-step automated health check)
- Identity-drift detector + identity-runner
- Source-pack validator
- Workbench v0.3 OS Shell endpoints
- Sync doctrine D4 (universe classifier, attribute dictionary)
- F1 projector FK fix + F2 parcel debris cleanup
- Revenue-A canonical lane (assessment bills, $8.84M)
- CompsForge defensibility loop (search → certify)
- 5 Brain/Cortex lessons
- Production readiness packet + merge readiness doc

**Conclusion: the sync branch is NOT replaceable.** It contains the governance/workbench/proof layer and key doctrine fixes that do NOT exist on main.

---

## 5. Shared Files with High Conflict Risk

From the aborted merge output, the highest-conflict areas:

- `backend/src/TerraFusion.API/Controllers/` — dozens of controllers modified on both sides
- `frontend/apps/os-shell/src/` — components, tests, config, orchestration
- `.github/workflows/` — CI pipeline files (add/add conflict)
- `backend/TerraFusion.sln` — solution file
- `.gitignore`

The conflicts are broad across the product surface, not isolated to Sync tooling.

---

## 6. Does Main Contain Indispensable Work NOT on Sync Branch?

**Yes. Emphatically yes.**

Main has 428 sync-scoped commits — the PACS raw landing pipeline (Block A/B/C/D), truth promoters, canonical projectors — that represent the foundational data architecture. These are not on the sync branch. If the sync branch were promoted to main via `git reset --hard`, **all of this work would be lost.**

Additionally, main has substantial non-Sync product work (county-studio, geoforge, costforge, forge, atlas, calibration, native integrations) that does not exist on the sync branch at all.

**RESET PROMOTION IS WRONG. Do not do it.**

---

## 7. Does the Sync Branch Contain the Current Runtime-Proven Production State?

**Yes, but only for a specific layer.**

The sync branch contains the runtime-proven governance and proof layer:
- Doctor tooling + workbench endpoints
- Doctrine D1–D4 + F1/F2 bug fixes
- Revenue-A canonical lane
- Brain/Cortex lessons
- Production readiness packet

But the sync branch does NOT have the latest PACS landing pipeline work that landed on main after 2026-04-28. The sync branch's "runtime proven" claim applies to its own doctrine+workbench layer against the data state it knew at divergence time.

---

## 8. Recommended Authoritative Base

**Option C — Create a dedicated integration branch from main**

Specifically:

```
NOT: git checkout main && git reset --hard fix/projector-delete-insert-atomicity
     (would destroy 1,278 real commits of product work)

NOT: normal --no-ff merge
     (tried and aborted — too many conflicts)

YES: Rebase fix/projector-delete-insert-atomicity onto main in a dedicated
     integration session, resolving conflicts systematically by subsystem.
```

The 434 branch-only commits contain real unique work (workbench, doctrine, brain, CompsForge, F1/F2 fixes, Revenue-A). That work needs to land on main. But it must be rebased onto main's current state, not used to replace main.

**Why rebase and not cherry-pick slices?**

Cherry-picking the final proof docs would be safe. But the underlying workbench services, doctrine controllers, identity runner, source-pack validator, EF migrations, and seal-check runner on the branch all have dependencies on branch-specific code. The whole arc needs to rebase cleanly, not just the tip.

---

## Summary

| question | answer |
|---|---|
| Is main old/drifted? | **NO** — main is the active product trunk with 428 more sync commits |
| Should we reset main to the sync branch? | **NO** — would destroy 1,278 real commits |
| Is the sync branch throwaway? | **NO** — contains unique governance/workbench/proof work |
| Can we cherry-pick the tip? | Only docs. Not the code stack. |
| What's the right path? | Dedicated integration session: rebase sync branch onto main |

---

*Read-only analysis. No files modified.*

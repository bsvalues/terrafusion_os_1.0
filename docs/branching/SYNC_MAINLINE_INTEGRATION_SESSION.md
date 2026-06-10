# TerraFusion Sync — Mainline Integration Session

**Opened**: 2026-06-09  
**Strategy**: Subsystem slice-by-slice porting (NOT merge, NOT rebase, NOT reset)  
**Operator**: Solo dev — all commits are mine  

---

## Source Branches

| branch | SHA | role |
|---|---|---|
| `main` (base) | `e4b3ec0cdf56095fbaf06d3b40abe817a8136ab9` | Mainline product + data architecture |
| `fix/projector-delete-insert-atomicity` (source) | `912528fb2e52a6b42d9e6424524785c22e22574f` | Runtime-proven Sync governance/workbench/proof stack |
| `integration/sync-onto-main` (this branch) | starts at main HEAD | Integration target |

---

## Safety Refs Created

```
backup-main-before-sync-integration  →  e4b3ec0cd  (main snapshot)
backup-sync-production-candidate      →  912528fb2  (sync branch snapshot)
tag: sync-production-ready            →  912528fb2
```

---

## Why These Branches Diverged

Both branches diverged from `fda772a74` (2026-04-28). After divergence:
- **Main** received 1,278 commits: PACS data pipeline (Block A/B/C/D), canonical projectors, truth promoters, county-studio, geoforge, costforge, atlas, calibration, and all product work through 2026-05-02.
- **Sync branch** received 434 commits: doctrine D1–D4, workbench v0.3 (doctor/identity/source-pack/quarantine), F1/F2 fixes, Revenue-A canonical lane, CompsForge, Brain/Cortex lessons.

Neither branch can replace the other. A direct merge was attempted and aborted (broad conflicts). A `git reset --hard` would destroy 1,278 real product commits. The correct path is controlled porting by subsystem.

---

## Integration Strategy

Port the Sync branch's unique work onto main's state via explicit `git checkout <sync-branch> -- <path>` calls, subsystem by subsystem. Resolve conflicts manually where needed. Commit each slice atomically.

### Slices

| slice | what | method |
|---|---|---|
| A | Sync docs / evidence / readiness packet | `git checkout fix/proj... -- docs/sync/` |
| B | Brain/Cortex lessons | `git checkout fix/proj... -- docs/brain/sync/` |
| C | tools/sync automation | `git checkout fix/proj... -- tools/sync/` |
| D | Source packs | included in A |
| E | Backend DB foundation (entities/migrations/DbContext) | Manual port + build verify |
| F | Backend Sync APIs/services | `git checkout fix/proj... -- backend/.../Workbench/` |
| G | Local Sync cockpit | `git checkout fix/proj... -- tools/sync/workbench/` |
| H | OS shell Sync workbench frontend | Manual port with Router.tsx merge |
| I | Tests | `git checkout fix/proj... -- backend/TerraFusion.API.Tests/Workbench/` |

### Conflict Hotspots (to handle manually)
- `backend/src/TerraFusion.API/Program.cs` — DI registrations
- `backend/TerraFusion.Data/TerraFusionDbContext.cs` — DbSet additions
- `backend/TerraFusion.Data/TerraFusionDbContextModelSnapshot.cs` — EF snapshot
- `frontend/apps/os-shell/src/config/Router.tsx` — route additions
- `backend/TerraFusion.sln` — project references

---

## Hard Stops

Stop immediately if:
- EF snapshot conflict cannot be safely resolved
- Program.cs merge is ambiguous
- Router.tsx merge is ambiguous  
- Doctor FAIL after integration
- Identity FAIL after integration
- Compelled to use `git add .` or `--no-verify`

# CP-60 Control-Plane Link And Alias Hygiene

**Date**: 2026-03-29  
**Purpose**: normalize the active control-plane vocabulary so the packet chain stops mixing canonical status, readiness labels, execution status, and historical aliases  
**Lane**:
- Codex: docs/control-plane only
- Copilot: consume normalized control-plane names; do not reinterpret them during runtime work

## Authority Stack

1. [2026-03-28-copilot-execution-card-packet.md](C:\Users\bsval\terrafusion_os_1.0\docs\superpowers\catalog\2026-03-28-copilot-execution-card-packet.md)
2. [2026-03-28-master-remaining-copilot-card-plan.md](C:\Users\bsval\terrafusion_os_1.0\docs\superpowers\catalog\2026-03-28-master-remaining-copilot-card-plan.md)
3. [2026-03-28-exhaustive-remaining-card-atlas.md](C:\Users\bsval\terrafusion_os_1.0\docs\superpowers\catalog\2026-03-28-exhaustive-remaining-card-atlas.md)
4. [2026-03-28-hold-card-unlock-ledger.md](C:\Users\bsval\terrafusion_os_1.0\docs\superpowers\catalog\2026-03-28-hold-card-unlock-ledger.md)
5. [2026-03-28-hot-file-collision-matrix.md](C:\Users\bsval\terrafusion_os_1.0\docs\superpowers\catalog\2026-03-28-hot-file-collision-matrix.md)
6. [2026-03-28-execution-scoreboard.md](C:\Users\bsval\terrafusion_os_1.0\docs\superpowers\catalog\2026-03-28-execution-scoreboard.md)
7. [2026-03-28-surface-readiness-ledger.md](C:\Users\bsval\terrafusion_os_1.0\docs\superpowers\catalog\2026-03-28-surface-readiness-ledger.md)
8. [2026-03-29-46b-repacketization-seal.md](C:\Users\bsval\terrafusion_os_1.0\docs\superpowers\catalog\2026-03-29-46b-repacketization-seal.md)

## Status Plane Canon

Use each status family only in its own plane:

| Plane | Canonical Values | Meaning |
| --- | --- | --- |
| `canonical_status` | `Active/Canonical`, `Planned` | constitutional intent for the surface |
| `readiness_label` | `Ready`, `Recovery`, `Quarantine`, `Planned` | present-day implementation posture |
| packet execution status | `SERIAL-CLEAR`, `PARALLEL-CLEAR`, `HOLD`, `SUPERSEDED` | whether Copilot may issue the card |
| scoreboard status | `READY-NOW`, `BLOCKED-BY-WAVE`, `ON-HOLD`, `NO-CARD` | operational queue state |
| atlas coverage | `EXECUTION-CARD`, `HOLD-CARD`, `NO-CARD-*`, `CLOSED-NO-RUNTIME`, `COVERED-BY-PARENT-CARDS` | how a surface maps into runtime work |

## Canonical Artifact Roles

| Artifact | Canonical Role | Do Not Use It For |
| --- | --- | --- |
| `2026-03-28-copilot-execution-card-packet.md` | top-level packet index and historical closeouts | exhaustive surface coverage |
| `2026-03-28-phase44-execution-packet.md` | authoritative `44A` / `44B` runtime packet | post-44 inventory |
| `2026-03-28-remaining-copilot-execution-cards.md` | authoritative Phase 45 immediate packet | full long-tail atlas |
| `2026-03-28-master-remaining-copilot-card-plan.md` | authoritative remaining clear/hold plan | readiness grading |
| `2026-03-28-exhaustive-remaining-card-atlas.md` | exhaustive non-ready surface coverage map | proof gate operations |
| `2026-03-28-hot-file-collision-matrix.md` | parallelization and hot-file policy | canonical status decisions |
| `2026-03-28-hold-card-unlock-ledger.md` | hold promotion requirements | operational card queue |
| `2026-03-28-execution-scoreboard.md` | live queue board | canonical readiness taxonomy |
| `2026-03-28-surface-readiness-ledger.md` | canonical/readiness split for surfaces | execution order |
| `2026-03-29-46b-repacketization-seal.md` | active replacement of bundled `46B` | standalone master packet |

## Alias Suppression Rules

1. Coarse `46B` is historical only.
   - Active execution names are `46B1`, `46B2`, and `46B3`.
   - `46B` may appear only in the repacketization seal, CP-52 inventory context, or historical notes inside the master plan.
2. `50B` is closed as `NO-OP`.
3. `50D` is closed as `ALREADY-SATISFIED`.
4. The remaining live hold is only `45D`.
5. `45C`, `46C`, `47B`, `49B`, `50A`, and `50C` are promoted clear cards, not hold inventory.

## Link Hygiene Rules

1. Point runtime packets to `catalog/` artifacts, not `artifacts/`.
2. Point active Forge fixture-proof references to [2026-03-29-46b-repacketization-seal.md](C:\Users\bsval\terrafusion_os_1.0\docs\superpowers\catalog\2026-03-29-46b-repacketization-seal.md) when the issue is card granularity, not file discovery.
3. Use [2026-03-29-cp-52-forge-renderer-inventory-seal.md](C:\Users\bsval\terrafusion_os_1.0\docs\superpowers\catalog\2026-03-29-cp-52-forge-renderer-inventory-seal.md) only for historical proof of exact Forge host inventory.
4. Use the scoreboard for operational state and the master plan for packet structure; do not swap those roles.

## Normalization Outcome

After this phase:

- the active queue reads `44A`, `44B`, `45A`, `45B`, `45C`, `46A`, `46B1`, `46B2`, `46B3`, `46C`, `47A`, `47B`, `48A`, `49A`, `49B`, `50A`, `50C`
- the remaining hold list reads only `45D`
- `50E` is normalized as a bounded `SERIAL-CLEAR` sidecar sealed by CP-55
- the historical aliases `46B`, stale `50B`, and stale `50D` no longer behave like live queue items

## Update Rule

When a future docs pass changes a card family:

1. normalize the master plan,
2. normalize the atlas,
3. normalize the collision matrix,
4. normalize the unlock ledger,
5. normalize the scoreboard,
6. then update any packet index links.

# CP-61 Ownership Boundary Seal

**Date**: 2026-03-29  
**Purpose**: seal OS, suite, system-workspace, and workbench ownership boundaries so Copilot does not widen runtime cards across constitutional surface lines  
**Lane**:
- Codex: docs/control-plane only
- Copilot: runtime execution only inside the ownership boundary defined by the selected card

## Authority Stack

1. [2026-03-28-surface-readiness-ledger.md](C:\Users\bsval\terrafusion_os_1.0\docs\superpowers\catalog\2026-03-28-surface-readiness-ledger.md)
2. [2026-03-28-exhaustive-remaining-card-atlas.md](C:\Users\bsval\terrafusion_os_1.0\docs\superpowers\catalog\2026-03-28-exhaustive-remaining-card-atlas.md)
3. [2026-03-29-cp-59-no-card-canon-seal.md](C:\Users\bsval\terrafusion_os_1.0\docs\superpowers\catalog\2026-03-29-cp-59-no-card-canon-seal.md)
4. [2026-03-28-master-remaining-copilot-card-plan.md](C:\Users\bsval\terrafusion_os_1.0\docs\superpowers\catalog\2026-03-28-master-remaining-copilot-card-plan.md)
5. [2026-03-28-copilot-execution-card-packet.md](C:\Users\bsval\terrafusion_os_1.0\docs\superpowers\catalog\2026-03-28-copilot-execution-card-packet.md)

## Ownership Classes

| Ownership Class | Surfaces | Runtime Rule |
| --- | --- | --- |
| OS-owned | Desktop shell / StageZero, desktop icon launches, Pilot Home, Trace Home, Governance Dashboard, Monitoring, Admin Dashboard, User Admin | do not widen OS cards into suite homes or workbench tabs |
| Suite-owned | Forge suite home and Forge modules, Atlas suite home and Atlas modules, Dais suite home and Dais modules, Dossier suite home, GPT suite home posture | keep edits inside the selected suite family only |
| System workspace-owned | Canon bounded workspace and queued Canon collaboration/Codex breadth | do not widen Canon cards into shell config or suite cards |
| Workbench-owned | Property Dossier tab, Clerk tab, Treasury tab, Audit tab, Pilot tab | parcel-scoped work stays in the Workbench and must not be promoted into standalone cards |
| Reserved namespace | `TerraClerk`, `TerraTreasury`, `TerraAudit`, `TerraRecorder` | reserved vocabulary only; not current standalone implementation targets |

## Boundary Rules

1. Property Workbench is the OS-owned Tier-0 parcel host, and parcel-scoped work lives there.
2. Suite-home cards may describe parcel-routing truth, but they may not absorb workbench-only implementation.
3. OS-owned cards may correct posture on OS surfaces, but they may not claim suite ownership to solve the problem.
4. Suite-owned cards may change their suite home and bounded module hosts, but they may not widen into OS-owned admin, governance, or launcher surfaces.
5. Canon cards remain bounded-workspace cards; they do not authorize Codex, collaboration, or shell-registry implementation outside the named Canon host.
6. Reserved namespaces stay out of active runtime scope unless the control plane explicitly reclassifies them first.

## Family-Specific Seals

### Dais

- `44A`, `44B`, and `48A` are Dais-owned runtime cards.
- Dais cards may touch `DaisSuiteHome.tsx` and their named Dais module hosts only.
- Dais cards do not authorize changes to OS-owned admin or governance hosts.

### Forge

- `46A`, `46B1`, `46B2`, `46B3`, and `46C` are Forge-owned runtime cards.
- Forge cards do not authorize suite-crossing changes into Atlas, Dais, Dossier, or OS-owned admin/governance surfaces.

### Atlas

- `47A` and `47B` are Atlas-owned runtime cards.
- Atlas renderer truth work stays in Atlas renderer hosts; it does not spill into shell or workbench ownership.

### Dossier And Workbench

- `49A` is suite-owned.
- `49B` is workbench-owned.
- Clerk, Treasury, Audit, and Pilot remain real parcel-scoped Workbench tabs under reserved or OS ownership boundaries.
- No Dossier card may promote Clerk, Treasury, Audit, or Pilot parcel tabs into standalone runtime work.

### GPT

- `45A` is suite-posture and module-registration alignment only.
- GPT breadth remains queued/planned and stays out of runtime scope unless a new card explicitly reclassifies it.

### OS And Shell

- `50E` is the bounded idle-scene proof card and is limited to `StageZeroState.tsx`.
- `45D` remains the only shell/launcher hold card.
- `45D` is a launcher/config dialect card and remains outside normal parallel issue.

## Copilot Guardrail Text

Use this boundary note in future runtime handoffs when relevant:

```txt
Ownership boundary:
- this card owns only the surfaces named in Allowed Files
- do not widen from suite into OS, from OS into suite, or from suite into workbench
- parcel-scoped surfaces stay in the Workbench
- reserved namespaces stay out of runtime scope
```

## Citation Targets

These control-plane artifacts should defer to this seal when ownership questions appear:

1. [2026-03-29-cp-59-no-card-canon-seal.md](C:\Users\bsval\terrafusion_os_1.0\docs\superpowers\catalog\2026-03-29-cp-59-no-card-canon-seal.md)
2. [2026-03-28-exhaustive-remaining-card-atlas.md](C:\Users\bsval\terrafusion_os_1.0\docs\superpowers\catalog\2026-03-28-exhaustive-remaining-card-atlas.md)
3. [2026-03-28-master-remaining-copilot-card-plan.md](C:\Users\bsval\terrafusion_os_1.0\docs\superpowers\catalog\2026-03-28-master-remaining-copilot-card-plan.md)
4. [2026-03-28-surface-readiness-ledger.md](C:\Users\bsval\terrafusion_os_1.0\docs\superpowers\catalog\2026-03-28-surface-readiness-ledger.md)

## Sealed Outcome

After this phase:

- OS, suite, system-workspace, and workbench cards have explicit constitutional boundaries
- reserved namespaces are locked away from fake present-tense runtime targeting
- parcel-routing truth and workbench-only truth are no longer easy to blur during Copilot execution

# Codex Phase Board

**Date**: 2026-03-29  
**Purpose**: operational board for the next Codex-only phases that prepare the Copilot queue  
**Lane**:
- Codex: docs/control-plane only
- Copilot: execution only from prepared cards

**Program**:
- [2026-03-29-next-codex-phase-program.md](C:\Users\bsval\terrafusion_os_1.0\docs\superpowers\plans\2026-03-29-next-codex-phase-program.md)

## Status Labels

- `READY`: may be worked now in the docs lane
- `BLOCKED`: depends on an earlier Codex phase output
- `INHERITS`: phase is valid but should wait until a sibling phase stabilizes to avoid authority churn
- `COMPLETED`: deliverables landed in the control plane

## Board

| Phase | Track | Status | Depends On | Main Output | Copilot Benefit |
| --- | --- | --- | --- | --- | --- |
| `CP-51` Pilot/Trace file-proof seal | Unlock | `COMPLETED` | none | exact `45C` file proof | promoted `45C` to execution-ready |
| `CP-52` Forge renderer inventory seal | Unlock | `COMPLETED` | none | exact `46B` / `46C` file proof | promoted `46C`; enabled `46B1` / `46B2` / `46B3` repacketization |
| `CP-53` Atlas/Dossier proof seal | Unlock | `COMPLETED` | none | exact `47B` / `49B` file proof | promoted `47B` and `49B` to execution-ready |
| `CP-54` Governance/Admin host proof seal | Unlock | `COMPLETED` | `CP-51` to `CP-53` stable preferred | exact `50A` to `50D` file proof | promoted `50A` and `50C`; closed `50B` and `50D` |
| `CP-55` Shell hot-surface seal | Unlock | `BLOCKED` | explicit hot-file window plus stable collision matrix | exact `45D` / `50E` shell proof | eventual shell cards become safe |
| `CP-56` parent/sub-agent split packs | Ops | `COMPLETED` | current collision matrix | split map for clear cards | safer multi-agent Copilot execution |
| `CP-57` evidence and handoff packetization | Ops | `COMPLETED` | `CP-56` preferred | proof/evidence templates | faster Copilot handoffs |
| `CP-58` execution rhythm board | Ops | `INHERITS` | `CP-57` preferred | stale-card closure and promotion rules | less queue drift during execution |
| `CP-59` no-card canon seal | Hygiene | `COMPLETED` | exhaustive atlas | stronger no-card boundaries | fewer false reopenings |
| `CP-60` control-plane link and alias hygiene | Hygiene | `COMPLETED` | `CP-59` preferred | canonical-path and duplicate suppression | less authority drift |
| `CP-61` ownership boundary seal | Hygiene | `COMPLETED` | `CP-59` preferred | suite/workbench/OS ownership notes | less boundary leakage in coding lane |
| `CP-62` Copilot readiness seal | Cross-track | `BLOCKED` | `CP-51` through `CP-61` | consolidated readiness summary and next-ready pack list | confident Copilot scaling |

## Suggested Parent Assignments

| Parallel Pack | Parent Phase Set |
| --- | --- |
| Pack A | `CP-51`, `CP-52`, `CP-53` |
| Pack B | `CP-56`, `CP-59`, `CP-54` (completed) |
| Pack C | `CP-57`, `CP-60`, `CP-61` (completed) |
| Pack D | `CP-58`, `CP-55`, `CP-62` |

## Use Rule

When starting a new Codex turn, pick only phases marked `READY` unless you are explicitly closing out outputs from the immediately preceding pack.

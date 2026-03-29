# CP-57 Evidence And Handoff Packetization

**Date**: 2026-03-29  
**Purpose**: standardize screenshot targets, expected UI evidence, and closeout language for the current clear Copilot cards so runtime execution does not improvise proof requirements  
**Lane**:
- Codex: docs/control-plane only
- Copilot: runtime execution only from bounded cards plus this evidence packet

## Authority Stack

1. [2026-03-28-phase44-execution-packet.md](C:\Users\bsval\terrafusion_os_1.0\docs\superpowers\catalog\2026-03-28-phase44-execution-packet.md)
2. [2026-03-28-remaining-copilot-execution-cards.md](C:\Users\bsval\terrafusion_os_1.0\docs\superpowers\catalog\2026-03-28-remaining-copilot-execution-cards.md)
3. [2026-03-28-master-remaining-copilot-card-plan.md](C:\Users\bsval\terrafusion_os_1.0\docs\superpowers\catalog\2026-03-28-master-remaining-copilot-card-plan.md)
4. [2026-03-28-execution-scoreboard.md](C:\Users\bsval\terrafusion_os_1.0\docs\superpowers\catalog\2026-03-28-execution-scoreboard.md)
5. [2026-03-29-cp-56-parent-sub-agent-split-packs.md](C:\Users\bsval\terrafusion_os_1.0\docs\superpowers\catalog\2026-03-29-cp-56-parent-sub-agent-split-packs.md)

## Required Evidence Fields

Every runtime closeout for a clear card must include:

1. `card`
2. `status_before`
3. `status_after`
4. exact `matrix row`
5. exact `launch registry fact`
6. exact `readiness ledger row`
7. `allowed files changed`
8. `proof gate result`
9. `primary screenshot target`
10. `expected UI evidence observed`
11. `stop condition met`
12. `branch`
13. `commit_sha`
14. `origin_sha`
15. `collision or precondition check`
16. `residual risk or open questions`
17. `scope exceptions` or `none`

## Standard Closeout Template

````md
## Copilot Closeout

- Card: `Phase XX`
- Status before:
  - `BLOCKED-BY-WAVE`
- Status after:
  - `READY-NOW` or `COMPLETED-IN-BRANCH`
- Matrix row:
  - [exact row]
- Launch registry fact:
  - [exact launch fact]
- Readiness ledger row:
  - [exact row]
- Allowed files changed:
  - `path/to/file`
- Proof gate:
  - `pnpm run type-check` -> exit 0
- Branch:
  - `feature/phase-xx`
- Commit SHA:
  - `abcdef1`
- Origin SHA:
  - `abcdef1`
- Collision or precondition check:
  - [for example: 44A complete before 44B]
- Screenshot target:
  - `shot-1.png` - [what was captured]
- UI evidence:
  - [what truth posture is now visible]
- Stop condition:
  - [exact stop line satisfied]
- Residual risk or open questions:
  - none
- Scope exceptions:
  - none
````

## Screenshot Count Rule

1. one screenshot per visible host surface in the allowed-file set
2. if a card touches both a suite home and a renderer, require both shots
3. if a card touches two renderers, require one shot per renderer
4. a page-load screenshot is not sufficient; the screenshot must show the posture correction for the card's defect class

## Screenshot And Evidence Matrix

| Card | Primary Screenshot Target | Expected UI Evidence | Closeout Must Explicitly State |
| --- | --- | --- | --- |
| `44A` TerraLevy | Dais suite card plus TerraLevy header state | live-looking levy posture is gone; sample/demo truth is visible | whether `terra-levy` remained queued in `DaisSuiteHome.tsx` |
| `44B` TerraQueue | Dais suite card plus TerraQueue landing state | queue surface no longer reads as live while fixture posture remains | whether suite card posture or module disclosure carried the final truth correction |
| `45A` GPT dual-truth | GPT suite entry area showing Management and RAG alongside queued breadth | `gpt-management` and `gpt-rag` no longer conflict with bounded-workspace truth; queued GPT breadth still reads queued | that no third GPT runtime file was needed |
| `45B` Canon gating | Canon landing view | live core IDE truth is separated from queued collaboration/Codex breadth | that `CanonHome.tsx` was the only changed file |
| `45C` Pilot/Trace | Pilot landing view and Trace landing view | posture or fixture-boundary disclosure is visible on both pages | that no service, hook, or API file changed |
| `46A` CostForge | Forge suite card plus CostForge dashboard header | mock analytics are visibly demo/sample or queued; no live-looking claim remains | whether the final truth correction lived in suite posture, renderer disclosure, or both |
| `46B1` Statistics Studio | Statistics Studio landing state | fixture or proof posture is visible without widening scope | that only `StatisticsStudio.tsx` changed |
| `46B2` Batch/Preview | Batch Cost Runs landing state plus Coefficient Preview landing state | batch and preview screens carry aligned disclosure posture | how `BatchCostRun.tsx` and `CoefficientPreview.tsx` stayed consistent |
| `46B3` Cost Manual / Value Audit | Cost Manual landing state plus Value Audit landing state | both reference-data surfaces visibly disclose demo/sample or audit-fixture posture | that no store, service, or shared config file changed |
| `46C` Regression Studio | Regression Studio landing view | proof or fixture posture is visible at the top-level host | that no regression sub-component changed |
| `47A` Atlas suite home | Atlas suite card cluster | breadth surfaces remain visibly queued or conditional | that no Atlas renderer file changed |
| `47B` Atlas renderer truth | Geo Equity landing state plus Appraisal GIS landing state | both renderer pages visibly disclose fixture/conditional truth | how the two files stayed disjoint if split across parent/child agents |
| `48A` Management Dashboard | Dais suite card plus Management Dashboard landing state | dashboard reads conditional-live, not stronger than proof supports | whether Dais suite posture changed alongside dashboard wording |
| `49A` Dossier suite home | Dossier suite home main scene | parcel-routing and queued system-tool truth are explicit | that no workbench file changed |
| `49B` Workbench Dossier | Property Dossier tab landing state | workbench proof posture is visible without widening into sub-components | that no evidence sub-component changed |
| `50A` Governance Dashboard | Governance Dashboard banner/header area | live-backend dependency or demo-context framing is explicit | that no API or RBAC file changed |
| `50C` Admin Dashboard | Admin Dashboard landing state with first visible fixture section | hardcoded static-data sections visibly disclose sample/demo posture | that `UserAdmin.tsx` stayed untouched |

## Proof Gate Rule

Unless a card packet says otherwise, the required gate remains:

```bash
pnpm run type-check
```

If a runtime card adds a stronger gate later, this packet does not replace it. It only supplies the minimum evidence packaging rule.

## Closure Rule

No card is `done`, `closed`, or `sealed` until all three are linked back into the control plane:

1. screenshot set
2. commit SHA plus origin SHA
3. scoreboard update

## Handoff Rule

When handing a card to Copilot:

1. include the card packet text,
2. include only the ledger, matrix, and registry rows named by that card,
3. include the matching screenshot target from this packet,
4. require the standard closeout template in the final response.

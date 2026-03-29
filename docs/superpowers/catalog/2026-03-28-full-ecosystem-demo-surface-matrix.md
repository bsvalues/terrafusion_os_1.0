# Full-Ecosystem Demo Surface Matrix

**Date**: 2026-03-28  
**Purpose**: Canonical product map for every visible TerraFusion OS demo surface  
**Governing spec**: [2026-03-28-full-ecosystem-demo-gui-canon-design.md](C:\Users\bsval\terrafusion_os_1.0\docs\superpowers\specs\2026-03-28-full-ecosystem-demo-gui-canon-design.md)  
**Companion audit**: [2026-03-28-control-plane-doc-integrity-and-app-readiness-audit.md](C:\Users\bsval\terrafusion_os_1.0\docs\superpowers\catalog\2026-03-28-control-plane-doc-integrity-and-app-readiness-audit.md)

## Status Key

- `live`: runtime-backed and demo-safe
- `queued`: intentionally visible, not yet end-to-end real
- `unavailable`: visible only with explicit dependency-gap disclosure

## Readiness Key

- `R3 Ready-now`: real launcher, real renderer, no current honesty defect blocking demo use
- `R2 Conditional-live`: real surface exists, but proof/disclosure/static-section risk remains
- `R1 Queued-safe`: not ready, but safely visible only with explicit queued or unavailable posture
- `R0 Not-demo-safe`: launch gap, sample-fiction, or misleading live posture blocks demo use

## Defect Class Key

- `none`: no blocking control-plane defect currently recorded
- `proof-gap`: implementation exists, but proof/canon alignment is incomplete
- `fixture-risk`: real renderer still depends on fixture, sample, or fallback truth
- `placeholder-host`: module resolves only to an intentional placeholder host
- `sample-fiction`: renderer presents simulated or hardcoded truth with live-looking posture
- `launch-gap`: visible card or matrix surface does not resolve through the current launch/renderer chain
- `static-data`: route exists, but significant sections remain static or demo-seeded
- `simulation`: intentionally simulated surface, not county-live telemetry
- `mixed-family`: grouped family contains live and queued sub-surfaces that must not be collapsed into one claim

## Matrix

| Suite | Surface | Host Type | Parcel Scope | AI Role | Current Truth State | Readiness Grade | Defect Class | Required GUI / Disclosure | Real Dependency | Proof Status | Demo Tier | Owner Wave |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| OS | Desktop shell / StageZero | suite-home | system | non-ai | live | `R2 Conditional-live` | `proof-gap` | Canonical shell chrome, truthful launch grammar, live status indicators only where proven | shell desktop + route host | Shell route proven; visual canon now required | must-be-live | Visual system |
| OS | Desktop icon launches | suite-home | system | non-ai | live | `R2 Conditional-live` | `proof-gap` | Icons must reflect real launch target and truth state | DesktopIconGrid + route/window orchestration | Route behavior partially proven; launcher status dialect still needs canonical mapping | must-be-live | Ecosystem truth |
| Forge | Forge suite home | suite-home | county | assisted | live | `R2 Conditional-live` | `proof-gap` | Header, KPI band, module hierarchy, operational queue, source disclosure when snapshot/fallback | `useCountyStats`, suite launch contracts | Present and partially proven | must-be-live | Demo realization |
| Forge | CostForge | standalone-window | county | assisted | queued | `R0 Not-demo-safe` | `sample-fiction` | If not runtime-proven, show queued state and no fabricated analytics | standalone module host | Real launcher exists, but current renderer is mock analytics rather than county-runtime truth | must-be-live | Demo realization |
| Forge | Statistics Studio | standalone-window | county | assisted | queued | `R1 Queued-safe` | `fixture-risk` | Truthful queued or live state; no fixture-only stats card | statistics module + backend stats endpoints | Phase 35 identifies remaining fixture risk | must-be-live | Demo realization |
| Forge | Batch Cost Runs | standalone-window | county | assisted | queued | `R1 Queued-safe` | `fixture-risk` | Honest state with execution dependency disclosure | batch endpoints | Honesty risk previously called out | must-be-live | Demo realization |
| Forge | Regression Studio | standalone-window | county | assisted | queued | `R2 Conditional-live` | `proof-gap` | Bounded non-faux module frame | regression endpoints | Real renderer exists; data provenance and proof posture still incomplete | may-be-queued | Demo realization |
| Forge | TerraGAMA | standalone-window | county | assisted | queued | `R1 Queued-safe` | `placeholder-host` | Queued or unavailable; no implied live geography analytics | atlas/spatial services | Placeholder-only host | may-be-queued | Demo realization |
| Forge | Coefficient Preview | standalone-window | county | assisted | queued | `R1 Queued-safe` | `fixture-risk` | Queued or live, no fake comparison outputs | coefficient/batch data | Real renderer exists, but fixture banner remains | may-be-queued | Demo realization |
| Atlas | Atlas suite home | suite-home | county | assisted | live | `R2 Conditional-live` | `proof-gap` | Header, KPI band, module hierarchy, queue, source disclosure if non-live | `useCountyStats` | Present; visual canonicalization pending | must-be-live | Demo realization |
| Atlas | Geo Equity | standalone-window | county | assisted | queued | `R1 Queued-safe` | `fixture-risk` | If not live, explicit queued state with no faux maps | atlas or spatial analytics endpoints | Phase 35 open | must-be-live | Demo realization |
| Atlas | Appraisal GIS | standalone-window | county | assisted | queued | `R1 Queued-safe` | `fixture-risk` | Must disclose whether GIS is live, SVG fallback, or unavailable | GIS endpoints | Runtime truth still conditional | must-be-live | Demo realization |
| Atlas | Workbench Atlas tab | workbench-tab | parcel | assisted | live | `R3 Ready-now` | `none` | Stable parcel frame, badge/disclosure, no fake panel claims | atlas parcel hooks + GIS layers | Phase 34 proof exists; visual alignment pending but honesty posture is correct | must-be-live | Demo realization |
| Dais | Dais suite home | suite-home | county | assisted | live | `R2 Conditional-live` | `proof-gap` | Header, KPI band, module hierarchy, operations panels, fallback disclosure where county-provider is active | `useDaisSuiteStats` + operations panels | Partially proven | must-be-live | Demo realization |
| Dais | Management Dashboard | standalone-window | county | assisted | live | `R2 Conditional-live` | `fixture-risk` | Source-state chips and no fake real-time claims | live hooks + SignalR/HTTP | Proof sealed with swarm unavailable path, but residual fixture fallback still exists | must-be-live | Proof |
| Dais | TerraLevy | standalone-window | county | assisted | live | `R0 Not-demo-safe` | `sample-fiction` | If sample arrays remain, show explicit sample posture and never pair them with a live badge or live suite-card posture | levy services | Renderer exists, but sample levy/budget arrays remain and module chrome still presents a live badge | must-be-live | Demo realization |
| Dais | TerraQueue | standalone-window | county | assisted | live | `R0 Not-demo-safe` | `fixture-risk` | Real queue or explicit unavailable/zero-state; no fixture banner | `/api/dais/queue` | Phase 35 open; fixture banner still active while card posture reads operational | must-be-live | Demo realization |
| Dais | TerraCert | standalone-window | county | assisted | queued | `R1 Queued-safe` | `none` | Honest queued bounded state | certification endpoints | Visible suite-home card now resolves to `QueuedModuleSurface` | may-be-queued | Demo realization |
| Dais | TerraNotice | standalone-window | county | assisted | queued | `R1 Queued-safe` | `none` | Honest queued bounded state | notice pipeline | Visible suite-home card now resolves to `QueuedModuleSurface` | may-be-queued | Demo realization |
| Dais | Workbench Dais tab | workbench-tab | parcel | native-ai | live | `R3 Ready-now` | `none` | Tool invocation truth disclosure, correlation-safe error UX, no fake idle numbers | Pilot runtime + Dais endpoints | Proof exists | must-be-live | Proof |
| Dossier | Dossier suite home | suite-home | county | assisted | live | `R2 Conditional-live` | `proof-gap` | Header, KPI band, module hierarchy, queue | `useCountyStats` | Present; visual canonicalization pending | must-be-live | Demo realization |
| Dossier | Workbench Dossier tab | workbench-tab | parcel | non-ai | live | `R2 Conditional-live` | `proof-gap` | Keep dossier framing, evidence chain, and packet actions honest and parcel-scoped | dossier document services | Real dossier APIs and workbench flows exist, but proof posture lags the implementation reality | must-be-live | Demo realization |
| Dossier | PACS DataBridge | standalone-window | system | non-ai | queued | `R1 Queued-safe` | `placeholder-host` | System-tool framing, no fake sync dashboards | PACS bridge services | Placeholder host only | may-be-queued | Demo realization |
| Dossier | TerraSync | standalone-window | system | assisted | queued | `R1 Queued-safe` | `placeholder-host` | Honest system workflow framing | sync/orchestration services | Placeholder host only | may-be-queued | Demo realization |
| Dossier | TerraFlow | standalone-window | system | assisted | queued | `R1 Queued-safe` | `none` | Stay on queued canonical surface; do not revive speculative command-center posture without explicit new proof | sync/orchestration services | Suite home and module renderer now resolve to queued canon; historical `QuantumCommandCenter` remains in the tree but is not the active launch path | may-be-queued | Demo realization |
| GPT | GPT suite home / bounded workspace host | bounded-workspace | county | native-ai | live | `R3 Ready-now` | `none` | Explicit live-now versus planned-next nav, no hidden prototype detours | GPT management + RAG services | Already designed this way | must-be-live | Proof |
| GPT | GPT Management | bounded-workspace | county | native-ai | live | `R3 Ready-now` | `none` | Live host inside `/gpt` | management endpoints | Proven as live | must-be-live | Proof |
| GPT | RAG Datasets | bounded-workspace | county | native-ai | live | `R3 Ready-now` | `none` | Live host inside `/gpt` | dataset endpoints | Proven as live | must-be-live | Proof |
| GPT | GPT Studio / Marketplace / Builder / Analytics | bounded-workspace | county | native-ai | queued | `R1 Queued-safe` | `none` | Must stay visibly queued until explicit contract truth is opened | future GPT flows | Deliberately queued | may-be-queued | Visual system |
| Canon | Canon core IDE shell | bounded-workspace | system | assisted | live | `R2 Conditional-live` | `mixed-family` | Bounded workspace framing with explicit live versus planned collaboration state | canon services | Core workspace exists, but sub-surface readiness must be split before final demo proof | must-be-live | Demo realization |
| Canon | Canon collaboration / Codex-dependent slices | bounded-workspace | system | assisted | queued | `R1 Queued-safe` | `mixed-family` | Keep collaboration and Codex-dependent flows visibly queued until explicit proof exists | canon services + codex services | Core pages exist; collaboration truth remains intentionally unsealed | may-be-queued | Demo realization |
| Workbench | Property Workbench window shell | bounded-workspace | parcel | non-ai | live | `R3 Ready-now` | `none` | Stable frame, suite compass, context ribbon, activity feed, role-aware tabs | window adapter + property store | Proven as host | must-be-live | Proof |
| Workbench | Summary tab | workbench-tab | parcel | non-ai | live | `R3 Ready-now` | `none` | Truth disclosure for snapshot/live states | property store | Honesty work exists | must-be-live | Proof |
| Workbench | Forge tab | workbench-tab | parcel | assisted | live | `R3 Ready-now` | `none` | Badge/disclosure and parcel-first valuation framing | forge parcel hooks and tools | Phase 34 proof exists | must-be-live | Proof |
| Workbench | Atlas tab | workbench-tab | parcel | assisted | live | `R3 Ready-now` | `none` | Badge/disclosure and parcel GIS framing | atlas parcel hooks | Phase 34 proof exists | must-be-live | Proof |
| Workbench | Dais tab | workbench-tab | parcel | native-ai | live | `R3 Ready-now` | `none` | Tool truth disclosure and idle honesty | Dais tools + pilot runtime | Proof exists | must-be-live | Proof |
| Workbench | Dossier tab | workbench-tab | parcel | non-ai | live | `R2 Conditional-live` | `proof-gap` | Must keep evidence, packet, and chain flows honest inside parcel-scoped Dossier framing | dossier parcel services | Real implementation exists; proof alignment still incomplete | must-be-live | Demo realization |
| Workbench | Clerk tab | workbench-tab | parcel | assisted | live | `R2 Conditional-live` | `proof-gap` | Governed-tool clerk flows need separate proof and disclosure treatment, not grouped queued treatment | Pilot runtime + clerk tools | Real MWUX exists; proof row now split | may-be-queued | Ecosystem truth |
| Workbench | Treasury tab | workbench-tab | parcel | assisted | live | `R2 Conditional-live` | `proof-gap` | Governed-tool treasury flows need separate proof and disclosure treatment, not grouped queued treatment | Pilot runtime + treasury tools | Real MWUX exists; proof row now split | may-be-queued | Ecosystem truth |
| Workbench | Audit tab | workbench-tab | parcel | assisted | live | `R2 Conditional-live` | `proof-gap` | Governed-tool audit flows need separate proof and disclosure treatment, not grouped queued treatment | Pilot runtime + audit tools | Real MWUX exists; proof row now split | may-be-queued | Ecosystem truth |
| Workbench | Pilot tab | workbench-tab | parcel | native-ai | live | `R2 Conditional-live` | `proof-gap` | Manifest-backed read-only pilot flows need separate proof and disclosure treatment, not grouped queued treatment | pilot tools + trace services | Real MWUX exists; proof row now split | may-be-queued | Ecosystem truth |
| Governance | Governance Dashboard | governance-surface | system | non-ai | queued | `R2 Conditional-live` | `proof-gap` | Same shell canon, same truth discipline as suites | governance services | Real fetch path exists, but client-demo canon is not locked | may-be-queued | Ecosystem truth |
| Governance | Monitoring | governance-surface | system | non-ai | queued | `R1 Queued-safe` | `simulation` | Same shell canon, explicit data-source truth | monitoring services | Explicitly disclosed as simulation, not county-live telemetry | may-be-queued | Ecosystem truth |
| Governance | Pilot Home / Pilot Console | governance-surface | system | native-ai | queued | `R2 Conditional-live` | `proof-gap` | Must either align to bounded workspace model or be removed from client-demo path | pilot services | Real standalone host exists, but demo-canon posture remains unsealed | may-be-queued | Ecosystem truth |
| Governance | Trace Home | governance-surface | system | native-ai | queued | `R2 Conditional-live` | `proof-gap` | Must either align to bounded workspace model or be removed from client-demo path | trace services | Real standalone host exists, but demo-canon posture remains unsealed | may-be-queued | Ecosystem truth |
| Admin | Admin Dashboard | governance-surface | county | non-ai | live | `R2 Conditional-live` | `static-data` | Same shell canon, live KPI truth, no historical rows mistaken as live KPI | `/api/government/stats` + admin services | Partial proof exists; several panels still remain static/demo-seeded | must-be-live | Proof |
| Admin | User Admin | governance-surface | system | non-ai | queued | `R0 Not-demo-safe` | `static-data` | Honest admin-tool framing | admin services | Real route exists, but current surface is fully sample-data-driven | may-be-queued | Ecosystem truth |

## Implementation Notes

- `must-be-live` means the surface is in the client demo path and must complete all proof gates.
- `may-be-queued` means the surface may remain visible if the queued state is intentional and non-misleading.
- `hide` is reserved for surfaces that fail the truth audit and cannot be made demo-safe in time.
- `Readiness Grade` is the companion audit overlay. It does not replace truth state; it explains whether the current implementation is actually demo-safe.
- `sample-fiction` defects outrank `placeholder-host` defects because they can visually overstate readiness while still using false or simulated truth.
- Grouped workbench rows are intentionally split here so Clerk, Treasury, Audit, and Pilot cannot hide behind one generic readiness claim.

## Immediate Follow-Ons

1. Convert this matrix into the working backlog for visual-system, ecosystem-truth, demo-realization, and proof tranches.
2. Reconcile every Phase 34 and Phase 35 lane to one or more rows in this matrix.
3. Record launch gaps explicitly when a visible card does not resolve through the current renderer chain.
4. Mark any visible surface not listed here as a governance miss and classify it before new UI work opens.

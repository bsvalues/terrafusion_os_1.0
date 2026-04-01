# Full-Ecosystem Demo Launch Registry

**Date**: 2026-03-28  
**Purpose**: Ground the demo plan in the actual shell route map, desktop icon map, and module activation registry  
**Governing artifacts**:
- [2026-03-28-full-ecosystem-demo-gui-canon-design.md](C:\Users\bsval\terrafusion_os_1.0\docs\superpowers\specs\2026-03-28-full-ecosystem-demo-gui-canon-design.md)
- [2026-03-28-full-ecosystem-demo-surface-matrix.md](C:\Users\bsval\terrafusion_os_1.0\docs\superpowers\catalog\2026-03-28-full-ecosystem-demo-surface-matrix.md)
- [2026-03-28-control-plane-doc-integrity-and-app-readiness-audit.md](C:\Users\bsval\terrafusion_os_1.0\docs\superpowers\catalog\2026-03-28-control-plane-doc-integrity-and-app-readiness-audit.md)

## Purpose

This registry answers four implementation questions for the client demo:

1. What routes are actually mounted in the shell today?
2. What desktop icons and suite cards actually launch?
3. Which module IDs resolve to real components versus placeholders?
4. Where do `launch-gap`, `sample-fiction`, and `fixture-risk` defects exist in the launch chain?

This keeps future demo work tied to repo truth instead of assumed product maps.

## Defect Classes

Use these registry defect classes when reconciling launch truth:

- `launch-gap`: a visible suite-home card or matrix surface does not resolve through the current module renderer or route chain
- `sample-fiction`: a surface has a real renderer, but its visible truth is still simulated, hardcoded, or otherwise misleadingly live-looking
- `fixture-risk`: a surface has a real renderer, but it still discloses fixture/sample/fallback truth
- `placeholder-host`: the launch chain resolves, but only to an intentional placeholder host

## Route Registry

Source of truth:
- [Router.tsx](C:\Users\bsval\terrafusion_os_1.0\frontend\apps\os-shell\src\Router.tsx)

### Shell-mounted top-level routes

| Route | Surface | Host Intent | Current Role |
|---|---|---|---|
| `/` | Desktop shell / StageZero | shell-desktop | Primary shell entry |
| `/property` | Property Search | suite-home | Parcel browse/search entry |
| `/property/:parcelId` | Property Workbench | bounded-workspace | Parcel work hub |
| `/forge` | Forge suite home | suite-home | Suite orchestration |
| `/atlas` | Atlas suite home | suite-home | Suite orchestration |
| `/dais` | Dais suite home | suite-home | Suite orchestration |
| `/dossier` | Dossier suite home | suite-home | Suite orchestration |
| `/gpt` | GPT bounded workspace | bounded-workspace | Live GPT host |
| `/pilot` | TerraPilot | governance-surface | OS feature |
| `/trace` | TerraTrace | governance-surface | OS feature |
| `/canon` | TerraCanon | bounded-workspace | OS feature / IDE |
| `/monitoring` | Monitoring | governance-surface | System-facing page |
| `/marketplace` | Marketplace | governance-surface | Legacy/system-facing page |
| `/experiments` | Experiments | governance-surface | Experimental page |
| `/pilot/dashboard` | Governance Dashboard | governance-surface | Admin/governance |
| `/pilot/api` | Pilot API Demo | governance-surface | Tool-facing demo |

### Property Workbench child routes

| Route | Tab |
|---|---|
| `/property/:parcelId` | Summary |
| `/property/:parcelId/forge` | Forge |
| `/property/:parcelId/atlas` | Atlas |
| `/property/:parcelId/dais` | Dais |
| `/property/:parcelId/clerk` | Clerk |
| `/property/:parcelId/treasury` | Treasury |
| `/property/:parcelId/audit` | Audit |
| `/property/:parcelId/dossier` | Dossier |
| `/property/:parcelId/pilot` | Pilot |

## Desktop Icon Registry

Sources of truth:
- [DesktopIconGrid.tsx](C:\Users\bsval\terrafusion_os_1.0\frontend\apps\os-shell\src\shell\desktop\DesktopIconGrid.tsx)
- [desktopManifest.ts](C:\Users\bsval\terrafusion_os_1.0\frontend\apps\os-shell\src\config\desktopManifest.ts)
- [suiteRegistry.ts](C:\Users\bsval\terrafusion_os_1.0\frontend\apps\os-shell\src\config\suiteRegistry.ts)

### Live desktop launch set

| Desktop ID | Display Surface | Launch Path |
|---|---|---|
| `forge` | TerraForge | `activateModule('forge')` → `suite-forge` window |
| `atlas` | TerraAtlas | `activateModule('atlas')` → `suite-atlas` window |
| `dais` | TerraDais | `activateModule('dais')` → `suite-dais` window |
| `dossier` | TerraDossier | `activateModule('dossier')` → `suite-dossier` window |
| `gpt` | TerraGPT | `activateModule('gpt')` → `suite-gpt` window |
| `surface-workbench` | Property Workbench | `openWorkbenchWindow()` |
| `pilot` | TerraPilot | `activateModule('pilot')` → `os-pilot` window |
| `trace` | TerraTrace | `activateModule('trace')` → `os-trace` window |
| `canon` | TerraCanon | `activateModule('canon')` → `os-canon` window |

## Module Activation Registry

Sources of truth:
- [moduleActivation.ts](C:\Users\bsval\terrafusion_os_1.0\frontend\apps\os-shell\src\orchestration\moduleActivation.ts)
- [moduleComponents.tsx](C:\Users\bsval\terrafusion_os_1.0\frontend\apps\os-shell\src\config\moduleComponents.tsx)

### Suite homes and OS feature windows

| Module ID | Resolves To | Current Renderer |
|---|---|---|
| `suite-forge` | Forge suite home | real component |
| `suite-atlas` | Atlas suite home | real component |
| `suite-dais` | Dais suite home | real component |
| `suite-dossier` | Dossier suite home | real component |
| `suite-gpt` | GPT bounded workspace home | real component |
| `os-pilot` | Pilot home | real component |
| `os-trace` | Trace home | real component |
| `os-canon` | Canon home | real component |
| `property-workbench` | Workbench window adapter | real component |

### Standalone modules with real component renderers

| Module ID | Surface | Component Status |
|---|---|---|
| `costforge` | Forge | real component |
| `batch-cost-run` | Forge | real component |
| `coefficient-preview` | Forge | real component |
| `regression-studio` | Forge | real component |
| `statistics-studio` | Forge | real component |
| `management-dashboard` | Dais | real component |
| `terra-queue` | Dais | real component |
| `geo-equity-dashboard` | Atlas | real component |
| `mass-appraisal-gis` | Atlas | real component |
| `cost-manual` | Forge | real component |
| `value-audit-module` | Forge | real component |
| `terra-levy` | Dais | real component |

### Standalone modules that currently resolve to placeholder hosts

| Module ID | Surface | Placeholder Meaning |
|---|---|---|
| `terra-gis` | Atlas | county-wide GIS placeholder |
| `document-manager` | Dossier | records placeholder |
| `vei` | Dais | equity analysis placeholder |
| `terra-gama` | Forge | geographic market analysis placeholder |
| `terra-pilt` | Dais | PILT placeholder |
| `property-tax-ai` | Dais | AI tax analysis placeholder |
| `pacs-bridge` | Dossier | PACS bridge placeholder |
| `terra-sync` | Dossier | sync placeholder |
| `terra-permit` | Dais | permit placeholder |
| `terra-miner` | system | research placeholder |
| `legislative-pulse` | system | policy placeholder |
| `gpt-studio` | GPT | GPT placeholder |
| `gpt-marketplace` | GPT | GPT placeholder |
| `gpt-management` | GPT | GPT placeholder in module registry, though `/gpt` hosts a live management surface directly |
| `gpt-builder` | GPT | GPT placeholder |
| `gpt-analytics` | GPT | GPT placeholder |
| `gpt-rag` | GPT | GPT placeholder in module registry, though `/gpt` hosts a live dataset surface directly |

### Standalone modules that currently resolve to queued canon surfaces

| Module ID | Surface | Current Renderer | Why it matters |
|---|---|---|---|
| `terra-flow` | Dossier / system | `QueuedModuleSurface` | Active launch path is now queued-safe even though the historical `QuantumCommandCenter` renderer remains in the tree |
| `terra-cert` | Dais | `QueuedModuleSurface` | Prior launch-gap claim is closed; visible card now resolves to canonical queued host |
| `terra-notice` | Dais | `QueuedModuleSurface` | Prior launch-gap claim is closed; visible card now resolves to canonical queued host |

### Renderer-backed surfaces with honesty defects

| Module ID / Route Surface | Defect Class | Why it is higher risk than a placeholder |
|---|---|---|
| `costforge` | `sample-fiction` | Real launcher and real renderer exist, but current surface is mock analytics rather than county-runtime truth |
| `terra-levy` | `sample-fiction` | Real renderer shows hardcoded sample levy/budget truth while using live-looking chrome |
| `statistics-studio` | `fixture-risk` | Real renderer still depends on fixture disclosure |
| `batch-cost-run` | `fixture-risk` | Real renderer still depends on sample/fallback truth |
| `coefficient-preview` | `fixture-risk` | Real renderer still depends on fixture disclosure |
| `geo-equity-dashboard` | `fixture-risk` | Real renderer still depends on fixture disclosure |
| `mass-appraisal-gis` | `fixture-risk` | Real renderer still depends on fallback/demo parcels |
| `cost-manual` | `fixture-risk` | Real renderer still falls back to sample reference data |
| `value-audit-module` | `fixture-risk` | Real renderer still uses demo-data disclosure in empty state |
| `management-dashboard` | `fixture-risk` | Real renderer still contains residual fixture fallback |
| `terra-queue` | `fixture-risk` | Real renderer still discloses fixture truth while card posture reads operational |

## Suite Home Module Cards

Sources of truth:
- [ForgeSuiteHome.tsx](C:\Users\bsval\terrafusion_os_1.0\frontend\apps\os-shell\src\pages\suites\ForgeSuiteHome.tsx)
- [AtlasSuiteHome.tsx](C:\Users\bsval\terrafusion_os_1.0\frontend\apps\os-shell\src\pages\suites\AtlasSuiteHome.tsx)
- [DaisSuiteHome.tsx](C:\Users\bsval\terrafusion_os_1.0\frontend\apps\os-shell\src\pages\suites\DaisSuiteHome.tsx)
- [DossierSuiteHome.tsx](C:\Users\bsval\terrafusion_os_1.0\frontend\apps\os-shell\src\pages\suites\DossierSuiteHome.tsx)

### Forge suite card map

- Standalone cards: `costforge`, `statistics-studio`, `batch-cost-run`, `regression-studio`, `terra-gama`, `coefficient-preview`, `cost-manual`, `value-audit-module`
- Workbench cards: Forge tab, Dais tab, Audit tab

### Atlas suite card map

- Workbench cards: `atlas` tab for TerraGIS, ParcelLens, LayerWorks, TerraSketch, TerraPrint, TerraExport, TerraQuery
- Standalone cards: `terra-gis`, `geo-equity-dashboard`, `mass-appraisal-gis`

### Dais suite card map

- Workbench cards: Dais tab for Certification, Appeals, Calendar
- Standalone cards: `terra-levy`, `terra-pilt`, `terra-permit`, `vei`, `property-tax-ai`, `management-dashboard`, `terra-queue`, `terra-cert`, `terra-notice`
- Queued-canon note: `terra-cert` and `terra-notice` now resolve through `QueuedModuleSurface` in `moduleComponents.tsx`

### Dossier suite card map

- Workbench cards: Dossier tab for Documents, Evidence, Chain, Photos, Search; Dais tab for Defense Packets
- Standalone cards: `pacs-bridge`, `terra-sync`, `terra-flow`
- Queued-canon note: `terra-flow` now resolves through `QueuedModuleSurface` in `moduleComponents.tsx`

## Planning Implications

1. The canonical shell delivery model is activation-first and window-manager-first. Routes are one entry path, but `activateModule(...)`, `openWorkbenchWindow(...)`, and `moduleComponents.tsx` remain the primary launch truth.
2. Route truth and window truth are split. A surface may be live in route form, window form, or both.
3. Some suite cards point to workbench tabs rather than unique applications. Those should not be treated as separate product surfaces in proof counting.
4. Several module IDs already have real component renderers but still need truth-state and GUI-canon audits.
5. Several module IDs remain placeholder-only and must either become `queued` by design or be removed from the client-demo path.
6. GPT has a dual-truth setup: live management and RAG are hosted directly in `/gpt`, while namespaced module IDs in the module registry remain placeholder shells.
7. `launch-gap` remains a first-class registry defect, but `terra-cert` and `terra-notice` no longer meet that definition after the queued-canon runtime fix.
8. `sample-fiction` renderers are higher-risk than `placeholder-host` rows because they can overstate readiness while appearing operational.
9. `terra-flow` is no longer an active launch-path honesty defect, but its dormant historical renderer should not be mistaken for the current module target.
10. `suiteRegistry.ts` still uses the older `live | wip | planned` dialect, so launcher metadata cannot yet be treated as equivalent to the March 28 truth-state canon.

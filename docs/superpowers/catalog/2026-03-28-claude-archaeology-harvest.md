# Claude Archaeology Harvest

**Date**: 2026-03-28  
**Scope**: Harvest durable repo-archaeology findings from the latest Claude audit without importing stale readiness tables  
**Authority**: Reference-only companion to the March 28 control plane  
**Lane**: Codex-safe control-plane documentation only

## Authority Boundary

This document is useful repo archaeology. It is not the live execution ledger.

The current control-plane authority order remains:

1. [2026-03-28-full-ecosystem-demo-surface-matrix.md](C:\Users\bsval\terrafusion_os_1.0\docs\superpowers\catalog\2026-03-28-full-ecosystem-demo-surface-matrix.md)
2. [2026-03-28-full-ecosystem-demo-launch-registry.md](C:\Users\bsval\terrafusion_os_1.0\docs\superpowers\catalog\2026-03-28-full-ecosystem-demo-launch-registry.md)
3. [2026-03-28-full-ecosystem-demo-tranche-backlog.md](C:\Users\bsval\terrafusion_os_1.0\docs\superpowers\catalog\2026-03-28-full-ecosystem-demo-tranche-backlog.md)
4. [2026-03-28-copilot-execution-card-packet.md](C:\Users\bsval\terrafusion_os_1.0\docs\superpowers\catalog\2026-03-28-copilot-execution-card-packet.md)

This harvest may refine repo understanding, but it must not overwrite current March 28 readiness truth.

## Durable Findings Kept

### 1. The shell delivery model is activation-first and window-manager-first

The active OS shell is not route-first. The canonical launch path is:

- `activateModule(...)` for suites and OS feature windows
- `openWorkbenchWindow(...)` for parcel work
- `moduleComponents.tsx` as render truth
- the desktop/window manager stack as the visible host

Repo evidence:

- [moduleActivation.ts](C:\Users\bsval\terrafusion_os_1.0\frontend\apps\os-shell\src\orchestration\moduleActivation.ts) states that everything goes through `activateModule()` and that `moduleComponents.tsx` remains the single render truth.
- [DesktopIconGrid.tsx](C:\Users\bsval\terrafusion_os_1.0\frontend\apps\os-shell\src\shell\desktop\DesktopIconGrid.tsx) sends desktop launches through `activateModule(...)` or `openWorkbenchWindow()`.
- [StageZeroState.tsx](C:\Users\bsval\terrafusion_os_1.0\frontend\apps\os-shell\src\shell\desktop\StageZeroState.tsx) opens suites and parcel work through the same shell APIs.
- [SuiteModuleGrid.tsx](C:\Users\bsval\terrafusion_os_1.0\frontend\apps\os-shell\src\components\suites\SuiteModuleGrid.tsx) activates modules rather than treating suite cards as direct route truth.
- [parcelContext.ts](C:\Users\bsval\terrafusion_os_1.0\frontend\apps\os-shell\src\context\parcelContext.ts) owns `openWorkbenchWindow(...)`.
- [WindowManager.tsx](C:\Users\bsval\terrafusion_os_1.0\frontend\apps\os-shell\src\shell\desktop\WindowManager.tsx) and [ModuleLoader.tsx](C:\Users\bsval\terrafusion_os_1.0\frontend\apps\os-shell\src\shell\desktop\ModuleLoader.tsx) are the real in-shell delivery hosts.

Control-plane implication:

- future orphan or readiness audits must treat routes as one entry path, not the primary model of delivery

### 2. `components/pilot` is not an orphan bucket

The Claude audit was correct to separate pilot surfaces from orphan residue. The pilot family is wired into both standalone and workbench hosts.

Repo evidence:

- [PilotHome.tsx](C:\Users\bsval\terrafusion_os_1.0\frontend\apps\os-shell\src\pages\PilotHome.tsx) advertises the console as the single choke point for `POST /pilot/invoke`.
- [pilotApi.ts](C:\Users\bsval\terrafusion_os_1.0\frontend\apps\os-shell\src\api\pilotApi.ts) implements the governed tool client on `/pilot/*`.
- [PilotConsoleContent.tsx](C:\Users\bsval\terrafusion_os_1.0\frontend\apps\os-shell\src\pages\PilotConsoleContent.tsx) states that all tool invocations go through `POST /pilot/invoke`.
- [PropertyWorkbenchWindow.tsx](C:\Users\bsval\terrafusion_os_1.0\frontend\apps\os-shell\src\pages\workbench\PropertyWorkbenchWindow.tsx) registers a real `pilot` workbench tab.
- [PropertyPilot.tsx](C:\Users\bsval\terrafusion_os_1.0\frontend\apps\os-shell\src\pages\workbench\tabs\PropertyPilot.tsx) imports real pilot APIs, evidence rail, and execution console components.
- [components/pilot](C:\Users\bsval\terrafusion_os_1.0\frontend\apps\os-shell\src\components\pilot) contains active governed-tool UI primitives such as `ExecutionConsole`, `EvidenceRail`, `RiskPolicyGate`, and `ToolInvokePanel`.

Control-plane implication:

- do not classify pilot UI as archaeology or quarantine material unless a specific file loses active launch-path references

### 3. The consciousness dependency is real, but the frontend path is env-gated

The repo contains real frontend and backend consciousness/swarm integration points. “Not wired” and “imaginary” are different claims.

Repo evidence:

- [useSwarmLive.ts](C:\Users\bsval\terrafusion_os_1.0\frontend\apps\os-shell\src\hooks\useSwarmLive.ts) connects to `VITE_CONSCIOUSNESS_URL` and falls back to `http://localhost:3004`, then opens `${url}/hubs/swarm`.
- [ManagementDashboard.tsx](C:\Users\bsval\terrafusion_os_1.0\frontend\apps\os-shell\src\pages\dais\ManagementDashboard.tsx) uses `useSwarmLive()`.
- [ConsciousnessController.cs](C:\Users\bsval\terrafusion_os_1.0\backend\src\TerraFusion.API\Controllers\ConsciousnessController.cs) is a real backend controller.
- [appsettings.json](C:\Users\bsval\terrafusion_os_1.0\backend\src\TerraFusion.API\appsettings.json) and [appsettings.PropertyValuation.json](C:\Users\bsval\terrafusion_os_1.0\backend\src\TerraFusion.API\appsettings.PropertyValuation.json) both point consciousness traffic at `http://localhost:3004`.
- [2026-03-22-phase8-management-dashboard-design.md](C:\Users\bsval\terrafusion_os_1.0\docs\superpowers\specs\2026-03-22-phase8-management-dashboard-design.md) and [2026-03-22-phase8-management-dashboard.md](C:\Users\bsval\terrafusion_os_1.0\docs\superpowers\plans\2026-03-22-phase8-management-dashboard.md) document the real `useSwarmLive()` and `/hubs/swarm` dependency chain.

Control-plane implication:

- future docs should describe consciousness-dependent surfaces as real but env- and service-dependent, not as fictional or automatically demo-safe

### 4. Research, codex, collaboration, and realtime clusters are real code islands but not current March 28 demo canon

These clusters exist in the tree and are deeper than placeholder stubs. That makes them useful archaeology, but not automatic readiness truth.

Repo evidence:

- [ResearchPortal.tsx](C:\Users\bsval\terrafusion_os_1.0\frontend\apps\os-shell\src\components\research\ResearchPortal.tsx) is a large real component with dedicated auth and integration coverage.
- [ResearchPortal.integration.test.tsx](C:\Users\bsval\terrafusion_os_1.0\frontend\apps\os-shell\src\tests\integration\ResearchPortal.integration.test.tsx) exists but the top-level suite is currently skipped, which makes it reference value rather than current demo proof.
- [CodexDashboard.tsx](C:\Users\bsval\terrafusion_os_1.0\frontend\apps\os-shell\src\components\CodexDashboard.tsx) and [AdvancedCodexDashboard.tsx](C:\Users\bsval\terrafusion_os_1.0\frontend\apps\os-shell\src\components\codex\AdvancedCodexDashboard.tsx) are real UI surfaces.
- [SignalRService.ts](C:\Users\bsval\terrafusion_os_1.0\frontend\apps\os-shell\src\services\SignalRService.ts), [RealtimeNotebook.tsx](C:\Users\bsval\terrafusion_os_1.0\frontend\apps\os-shell\src\components\realtime\RealtimeNotebook.tsx), and [MultiUserCursor.tsx](C:\Users\bsval\terrafusion_os_1.0\frontend\apps\os-shell\src\components\realtime\MultiUserCursor.tsx) show that collaboration/realtime work is not imaginary.

Control-plane implication:

- treat these clusters as reference-only until a specific surface is given a matrix row, launch path, truth state, and proof requirement

### 5. The three-layer split is useful and should be preserved

The Claude tranche was directionally right about using separate buckets for current demo truth, governance primitives, and archaeology residue.

Recommended control-plane split:

1. Live demo canon
   - matrix, launch registry, backlog, readiness audit, execution card packet
2. Governance primitives
   - launcher/window contracts, `DemoDataBanner`, `QueuedModuleSurface`, `StandaloneHomeShell`, leak-guard tests, trace/correlation discipline
3. Archaeology atlas
   - dormant renderers, unmapped research/collaboration/codex islands, QUARANTINE restore candidates, historical packet residue

## Findings Explicitly Not Imported

The following Claude-style claims are not harvested into the control plane unless re-proven separately:

- any old `LIVE`, `NOT REGISTERED`, or renderer-present tables that conflict with the corrected March 28 matrix
- older `terra-cert` and `terra-notice` launch-gap language
- older `terra-flow` active-live language
- any execution card text that predates the current [2026-03-28-copilot-execution-card-packet.md](C:\Users\bsval\terrafusion_os_1.0\docs\superpowers\catalog\2026-03-28-copilot-execution-card-packet.md)
- zero-import or dead-code claims that have not been reverified against the current tree

## How To Use This Harvest

Use this document for:

- repo archaeology
- orphan/prototype interpretation
- future control-plane wording
- deciding where a newly discovered cluster belongs before it gets a matrix row

Do not use this document for:

- live readiness grading
- demo-tier decisions
- Copilot runtime card authoring by itself
- overriding the corrected March 28 matrix or launch registry

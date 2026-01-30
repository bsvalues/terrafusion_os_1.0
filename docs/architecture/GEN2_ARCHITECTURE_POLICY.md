# TerraFusion OS - Gen2 Architecture Policy

## Overview

This document defines the **Gen2 Architecture Policy** for TerraFusion OS, establishing clear separation between:

- **Gen2 Apps**: Next-generation integrated modules that render within the OS shell
- **Legacy Apps**: Standalone production bundles that require external servers
- **Archive Apps**: Deprecated modules no longer in active development

## Decision: TerraForge Suite is the Single Gen2 Host

**Architectural Decision (January 2026):**

TerraForge Suite (the OS Shell) is the **single runnable Gen2 host**. All Gen2 modules render as internal React components within the shell, not as external iframe URLs.

### Evidence

1. OS Shell contains Gen2 modules as internal React components (`CostForgeQuantumDashboard`, `ATLAS`, `SovereignDashboardWindow`)
2. TerraForge Suite's `registry.json` defines Rust kernels for IPC, not HTTP servers
3. TerraDossier uses Deno, incompatible with the pnpm-based module launcher
4. External URL entries are legacy architecture patterns

---

## Manifest Schema

All `terrafusion.app.json` manifests now require two additional fields:

### `intent` Field

```json
"intent": "gen2" | "legacy" | "archive"
```

| Value     | Description                                                   |
| --------- | ------------------------------------------------------------- |
| `gen2`    | Next-gen module rendered inside OS shell                      |
| `legacy`  | Standalone app requiring external dev server                  |
| `archive` | Deprecated, hidden from all views                             |

### `runnable` Field

```json
"runnable": true | false
```

| Value   | Description                                                     |
| ------- | --------------------------------------------------------------- |
| `true`  | Has `package.json` with `dev` script, can be started by launcher |
| `false` | Not runnable as standalone (renders via route or is a container) |

---

## Module Classification

### Gen2 Modules (appear in default desktop)

| Module        | Entry Type | Runnable | Description                         |
| ------------- | ---------- | -------- | ----------------------------------- |
| TerraForge    | `route`    | `false`  | AI-Powered Valuation Suite          |
| TerraDossier  | `route`    | `false`  | Sovereign Document Management       |

**Route Pattern:** `/gen2/{module-name}`

### Legacy Modules (hidden by default, Legacy Lab toggle)

| Module             | Entry Type | Runnable | Description                         |
| ------------------ | ---------- | -------- | ----------------------------------- |
| CostForge AI       | `url`      | `true`   | Standalone cost estimation          |
| GIS Pro            | `url`      | `false`  | Production GIS bundle               |
| Terra Levy         | `url`      | `false`  | Multi-service tax system            |
| Terra PILT         | `url`      | `false`  | Production PILT calculator          |
| Terra Flow         | `url`      | `false`  | Workflow automation                 |
| Terra GAMA         | `url`      | `false`  | Market analysis                     |
| Terra Permit       | `url`      | `false`  | Permit tracking                     |
| PrimeView          | `url`      | `false`  | Property viewer                     |
| Income Valuation   | `url`      | `false`  | Income approach analysis            |
| WebHub             | `url`      | `false`  | Public portal                       |

---

## Dev Launcher Behavior

The `dev:os:modules` script (`tools/dev/dev-os.mjs`) now filters by:

```javascript
// Gen2 Policy: Only start modules where intent=gen2 AND runnable=true AND entry.type=url
if (mf?.intent === "gen2" && mf?.runnable === true && mf?.entry?.type === "url") {
  appsToStart.push({ id: mf.id, dir: path.join(APPS_DIR, folder) });
}
```

**Result:** Currently **no legacy modules are auto-started** because Gen2 apps use routes, not URLs.

---

## OS Shell Module Filtering

The shell's module registry (`modules.ts`) provides filtered collections:

```typescript
// All modules from manifests
export const ALL_MODULES: readonly ModuleDefinition[];

// Gen2 modules only (default desktop)
export const MODULES: readonly ModuleDefinition[];

// Legacy modules (for Legacy Lab toggle)
export const LEGACY_MODULES: readonly ModuleDefinition[];

// Archived modules (hidden by default)
export const ARCHIVED_MODULES: readonly ModuleDefinition[];

// Default export for desktop tiles
export const TERRAFUSION_MODULES = MODULES;
```

---

## Adding a New Gen2 Module

1. **Create the module component** in `frontend/apps/os-shell/src/components/` or `src/modules/`

2. **Create the route page** in `frontend/apps/os-shell/src/pages/gen2/`:
   ```tsx
   const MyModuleGen2: React.FC = () => (
     <Suspense fallback={<LoadingFallback />}>
       <MyModuleComponent />
     </Suspense>
   );
   ```

3. **Add the route** to `Router.tsx`:
   ```tsx
   <Route path='/gen2/mymodule' element={<MyModuleGen2 />} />
   ```

4. **Create the manifest** in `applications/my-module/terrafusion.app.json`:
   ```json
   {
     "id": "my-module",
     "intent": "gen2",
     "runnable": false,
     "entry": {
       "type": "route",
       "route": "/gen2/mymodule"
     }
   }
   ```

5. **Regenerate modules:**
   ```bash
   npx tsx tools/registry/generate-modules.ts
   ```

---

## Migration Path for Legacy → Gen2

1. **Extract core logic** from legacy app into shared components
2. **Create Gen2 wrapper** in OS shell pages
3. **Update manifest** with `intent: "gen2"`, `entry.type: "route"`
4. **Mark legacy version** with `intent: "archive"`

---

## Schema Location

The JSON Schema for app manifests is at:
```
tools/registry/terrafusion.app.schema.json
```

All manifests should reference it:
```json
{
  "$schema": "../../tools/registry/terrafusion.app.schema.json"
}
```

---

## Commands

```bash
# Regenerate modules from manifests
npx tsx tools/registry/generate-modules.ts

# Start OS shell (Gen2 only)
pnpm run dev:os:shell

# Start OS with module launcher (currently no-op for Gen2)
pnpm run dev:os
```

---

## Files Modified in This Change

- `tools/registry/terrafusion.app.schema.json` (created)
- `tools/registry/generate-modules.ts` (added intent/runnable validation)
- `tools/dev/dev-os.mjs` (filter by intent instead of pinned)
- All `applications/*/terrafusion.app.json` manifests
- `frontend/apps/os-shell/src/config/modules.ts` (Gen2 filtering)
- `frontend/apps/os-shell/src/config/generatedModules.ts` (regenerated)
- `frontend/apps/os-shell/src/Router.tsx` (Gen2 routes)
- `frontend/apps/os-shell/src/pages/gen2/` (Gen2 module pages)

---

**Date:** January 27, 2026
**Author:** TerraFusion Elite Engineering Agent

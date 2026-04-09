# Native App Integrations — AppFrame Wiring Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Promote 7 production full-stack applications from QUARANTINE into `packages/` and wire each into the TerraFusion OS shell via AppFrame, replacing the QueuedModuleSurface/PlaceholderModule stubs that currently occupy those module slots.

**Architecture:** Each app follows the same pattern as `packages/terrabuild` (CostForge): the app lives in `packages/<moduleId>/`, runs on a fixed PORT, registers in `backend/service-registry.json`, and renders in the shell via `<AppFrame moduleId="<id>" />` inside the `ModuleRenderer` switch in `moduleComponents.tsx`. The shell never imports the app's source directly — it iframes the running service URL resolved from the service registry.

**Tech Stack:** Express + React + Vite (Tier 1 apps), Next.js (terra-gama), TypeScript, Drizzle ORM + PostgreSQL/SQLite, AppFrame iframe architecture, Zustand module loader store.

---

## Topology

```
PHASE 0 (serial): Create branch feat/native-app-integrations off main

PHASE 1 (7 agents in parallel — each on own worktree/branch):
  Task 1: terra-pilt   (Tier 1, port 5009)
  Task 2: terra-permit  (Tier 1, port 5010)
  Task 3: vei           (Tier 1, port 5011)
  Task 4: terra-gis     (Tier 1, port 5012)
  Task 5: terra-gama    (Tier 1, port 5013, Next.js)
  Task 6: terra-pro     (Tier 2, port 5014, NEW module)
  Task 7: terra-proplus (Tier 2, port 5015, NEW module)

PHASE 2 (serial): Merge all 7 branches → feat/native-app-integrations

PHASE 3 (serial): Consistency gates + PR
```

**Tier 1** = module already exists in `MODULE_REGISTRY`, `moduleActivation.ts`, and the consistency test's `EXPECTED_DISPLAY_NAMES`. Only the switch case and service-registry need updating.

**Tier 2** = NEW module IDs; need entries in `MODULE_REGISTRY`, `KNOWN_PLACEHOLDER_MODULES`, `EXPECTED_DISPLAY_NAMES`, `moduleActivation.ts` display name + icon, plus aliases.

---

## Critical Reference: The CostForge Pattern

Every task replicates what was done for `costforge`. Study these files before starting any task:

| File | What to look at |
|------|----------------|
| `packages/terrabuild/` | Structure of a wired native app (package.json, server/, client/) |
| `backend/service-registry.json` | The `costforge` entry — exact JSON shape to copy |
| `frontend/apps/os-shell/src/config/moduleComponents.tsx` lines 229–232, 628–643 | AppFrame import + costforge switch case with parcelContext |
| `frontend/apps/os-shell/src/config/__tests__/moduleRegistryConsistency.test.ts` | KNOWN_PLACEHOLDER_MODULES and EXPECTED_DISPLAY_NAMES sets |
| `frontend/apps/os-shell/src/orchestration/moduleActivation.ts` lines 93–230 | displayNames + icons maps (Tier 2 only: add entries here) |

---

## File Map (all tasks combined)

| File | Tasks that modify it |
|------|---------------------|
| `backend/service-registry.json` | All 7 (add entry each) |
| `frontend/apps/os-shell/src/config/moduleComponents.tsx` | All 7 (replace switch case; Tier 2 also add to MODULE_REGISTRY + aliases) |
| `frontend/apps/os-shell/src/config/__tests__/moduleRegistryConsistency.test.ts` | Tasks 6–7 only (add to KNOWN_PLACEHOLDER_MODULES + EXPECTED_DISPLAY_NAMES) |
| `frontend/apps/os-shell/src/orchestration/moduleActivation.ts` | Tasks 6–7 only (add display name + icon) |
| `packages/terra-pilt/` | Task 1 (create) |
| `packages/terra-permit/` | Task 2 (create) |
| `packages/vei/` | Task 3 (create) |
| `packages/terra-gis/` | Task 4 (create) |
| `packages/terra-gama/` | Task 5 (create) |
| `packages/terra-pro/` | Task 6 (create) |
| `packages/terra-proplus/` | Task 7 (create) |

---

## Source → Destination Map

| moduleId | Source in QUARANTINE | Destination | Port |
|----------|---------------------|-------------|------|
| `terra-pilt` | `QUARANTINE/top-level-dirs/applications/terra-pilt-production/` | `packages/terra-pilt/` | 5009 |
| `terra-permit` | `QUARANTINE/top-level-dirs/applications/terra-permit/` | `packages/terra-permit/` | 5010 |
| `vei` | `QUARANTINE/top-level-dirs/applications/bs-income-valuation-production/` | `packages/vei/` | 5011 |
| `terra-gis` | `QUARANTINE/top-level-dirs/applications/bcbs-gis-pro-production/` | `packages/terra-gis/` | 5012 |
| `terra-gama` | `QUARANTINE/top-level-dirs/applications/terra-gama-production/` | `packages/terra-gama/` | 5013 |
| `terra-pro` | `QUARANTINE/top-level-dirs/applications/terra-pro-production/` | `packages/terra-pro/` | 5014 |
| `terra-proplus` | `QUARANTINE/top-level-dirs/applications/terra-proplus-production/` | `packages/terra-proplus/` | 5015 |

---

## PHASE 0 — Setup

- [ ] **Step 0.1: Confirm main is clean**

```bash
cd C:/Users/bsval/terrafusion_os_1.0
git status --short
git log --oneline -2
```
Expected: working tree clean, HEAD = `0702d3680`.

- [ ] **Step 0.2: Create integration branch**

```bash
git checkout -b feat/native-app-integrations
```

---

## Task 1 — terra-pilt (Tier 1, port 5009)

**Branch:** `feat/native-terra-pilt` (worktree off main)

**Files:**
- Create: `packages/terra-pilt/` (copied from QUARANTINE)
- Modify: `backend/service-registry.json`
- Modify: `frontend/apps/os-shell/src/config/moduleComponents.tsx`

### Step 1.1 — Copy app from QUARANTINE

- [ ] Run:

```bash
cd C:/Users/bsval/terrafusion_os_1.0
cp -r "QUARANTINE/top-level-dirs/applications/terra-pilt-production/." "packages/terra-pilt/"
cd packages/terra-pilt
npm install
```

Expected: `node_modules/` created, no fatal errors.

### Step 1.2 — Verify dev server starts on port 5009

- [ ] Run (timeout 15s):

```bash
cd C:/Users/bsval/terrafusion_os_1.0/packages/terra-pilt
timeout 15s npm run dev 2>&1 | head -30
```

Expected: output contains `Server running` or `listening on` or `Local:` or `port 5009`. If the app uses a different internal port, note it — the `StartCmd` will override with `PORT=5009`.

### Step 1.3 — Verify build

- [ ] Run:

```bash
cd C:/Users/bsval/terrafusion_os_1.0/packages/terra-pilt
npm run build 2>&1 | tail -5
```

Expected: exits 0, produces `dist/` directory.

### Step 1.4 — Add service-registry.json entry

- [ ] Edit `backend/service-registry.json` — insert inside the `"Services"` object after the `terra-flow` entry:

```json
    "terra-pilt": {
      "Name": "terra-pilt",
      "Port": 5009,
      "Url": "http://localhost:5009",
      "Status": "stopped",
      "Package": "terra-pilt",
      "StartCmd": "cd packages/terra-pilt && PORT=5009 npm run dev"
    }
```

### Step 1.5 — Wire AppFrame in moduleComponents.tsx

- [ ] In `frontend/apps/os-shell/src/config/moduleComponents.tsx`, find the current `terra-pilt` case (around line 753):

```typescript
    case 'terra-pilt':
      return (
        <QueuedModuleSurface
          name="TerraPILT"
          description="Payment in Lieu of Taxes — federal property calculations, PILT reporting, and compliance tracking."
          moduleId="terra-pilt"
        />
      );
```

Replace it with:

```typescript
    // TerraPILT — PILT management native app (packages/terra-pilt, port 5009)
    case 'terra-pilt':
      return (
        <AppFrame
          moduleId="terra-pilt"
          parcelContext={
            metadata?.parcelId
              ? {
                  parcelId: String(metadata.parcelId),
                  countyId: String(metadata.countyId ?? ''),
                  assessmentYear: Number(metadata.assessmentYear ?? new Date().getFullYear()),
                }
              : undefined
          }
        />
      );
```

> NOTE: `AppFrame` is already imported at the top of the file (added for costforge). No new import needed.

### Step 1.6 — Run consistency test

- [ ] Run:

```bash
cd C:/Users/bsval/terrafusion_os_1.0
node --test os-platform/core/tests/phase83-tools.test.mjs 2>&1 | tail -5
```

Expected: `56 passing`. (These tests do not cover frontend module registry — just confirming no regressions.)

- [ ] Run frontend module consistency test:

```bash
cd C:/Users/bsval/terrafusion_os_1.0/frontend/apps/os-shell
npx vitest run src/config/__tests__/moduleRegistryConsistency.test.ts 2>&1 | tail -10
```

Expected: all tests pass.

### Step 1.7 — Commit

- [ ] Run:

```bash
cd C:/Users/bsval/terrafusion_os_1.0
git add packages/terra-pilt/ backend/service-registry.json frontend/apps/os-shell/src/config/moduleComponents.tsx
git commit -m "feat(native): wire TerraPILT via AppFrame — packages/terra-pilt port 5009"
```

---

## Task 2 — terra-permit (Tier 1, port 5010)

**Branch:** `feat/native-terra-permit`

**Files:**
- Create: `packages/terra-permit/`
- Modify: `backend/service-registry.json`
- Modify: `frontend/apps/os-shell/src/config/moduleComponents.tsx`

### Step 2.1 — Copy app

- [ ] Run:

```bash
cp -r "QUARANTINE/top-level-dirs/applications/terra-permit/." "packages/terra-permit/"
cd packages/terra-permit
npm install
```

### Step 2.2 — Verify dev server starts

- [ ] Run:

```bash
cd C:/Users/bsval/terrafusion_os_1.0/packages/terra-permit
timeout 15s PORT=5010 npm run dev 2>&1 | head -30
```

Expected: server listening output. If `dev` script internally hardcodes a port, check `server/index.ts` for `const PORT = process.env.PORT || <default>` and confirm `PORT=5010` overrides it.

### Step 2.3 — Verify build

- [ ] Run:

```bash
npm run build 2>&1 | tail -5
```

### Step 2.4 — service-registry.json entry

- [ ] Add inside `"Services"`:

```json
    "terra-permit": {
      "Name": "terra-permit",
      "Port": 5010,
      "Url": "http://localhost:5010",
      "Status": "stopped",
      "Package": "terra-permit",
      "StartCmd": "cd packages/terra-permit && PORT=5010 npm run dev"
    }
```

### Step 2.5 — Wire AppFrame

- [ ] In `moduleComponents.tsx`, find the current `terra-permit` case (around line 798):

```typescript
    case 'terra-permit':
      return (
        <QueuedModuleSurface
          name="TerraPermit"
          description="Building permit tracking — permit intake, inspection scheduling, and valuation impact updates."
          moduleId="terra-permit"
        />
      );
```

Replace with:

```typescript
    // TerraPermit — permit management native app (packages/terra-permit, port 5010)
    case 'terra-permit':
      return (
        <AppFrame
          moduleId="terra-permit"
          parcelContext={
            metadata?.parcelId
              ? {
                  parcelId: String(metadata.parcelId),
                  countyId: String(metadata.countyId ?? ''),
                  assessmentYear: Number(metadata.assessmentYear ?? new Date().getFullYear()),
                }
              : undefined
          }
        />
      );
```

### Step 2.6 — Run consistency tests (same commands as Step 1.6)

### Step 2.7 — Commit

- [ ] Run:

```bash
git add packages/terra-permit/ backend/service-registry.json frontend/apps/os-shell/src/config/moduleComponents.tsx
git commit -m "feat(native): wire TerraPermit via AppFrame — packages/terra-permit port 5010"
```

---

## Task 3 — vei (Tier 1, port 5011)

**Branch:** `feat/native-vei`

Source app: `bs-income-valuation-production` — income property valuation engine.

**Files:**
- Create: `packages/vei/`
- Modify: `backend/service-registry.json`
- Modify: `frontend/apps/os-shell/src/config/moduleComponents.tsx`

### Step 3.1 — Copy app

- [ ] Run:

```bash
cp -r "QUARANTINE/top-level-dirs/applications/bs-income-valuation-production/." "packages/vei/"
cd packages/vei
npm install
```

### Step 3.2 — Verify dev server

- [ ] Run:

```bash
cd C:/Users/bsval/terrafusion_os_1.0/packages/vei
timeout 15s PORT=5011 npm run dev 2>&1 | head -30
```

### Step 3.3 — Verify build

- [ ] Run: `npm run build 2>&1 | tail -5`

### Step 3.4 — service-registry.json entry

- [ ] Add:

```json
    "vei": {
      "Name": "vei",
      "Port": 5011,
      "Url": "http://localhost:5011",
      "Status": "stopped",
      "Package": "vei",
      "StartCmd": "cd packages/vei && PORT=5011 npm run dev"
    }
```

### Step 3.5 — Wire AppFrame

- [ ] In `moduleComponents.tsx`, find the current `vei` case (around line 721):

```typescript
    case 'vei':
      return (
        <QueuedModuleSurface
```

The full block ends with `);`. Replace the entire case block with:

```typescript
    // VEI — income property valuation engine (packages/vei, port 5011)
    case 'vei':
      return (
        <AppFrame
          moduleId="vei"
          parcelContext={
            metadata?.parcelId
              ? {
                  parcelId: String(metadata.parcelId),
                  countyId: String(metadata.countyId ?? ''),
                  assessmentYear: Number(metadata.assessmentYear ?? new Date().getFullYear()),
                }
              : undefined
          }
        />
      );
```

### Step 3.6 — Run consistency tests

### Step 3.7 — Commit

- [ ] Run:

```bash
git add packages/vei/ backend/service-registry.json frontend/apps/os-shell/src/config/moduleComponents.tsx
git commit -m "feat(native): wire VEI income valuation via AppFrame — packages/vei port 5011"
```

---

## Task 4 — terra-gis (Tier 1, port 5012)

**Branch:** `feat/native-terra-gis`

Source app: `bcbs-gis-pro-production` — Benton County GIS Professional platform with ArcGIS, Mapbox, Leaflet.

**Files:**
- Create: `packages/terra-gis/`
- Modify: `backend/service-registry.json`
- Modify: `frontend/apps/os-shell/src/config/moduleComponents.tsx`

### Step 4.1 — Copy app

- [ ] Run:

```bash
cp -r "QUARANTINE/top-level-dirs/applications/bcbs-gis-pro-production/." "packages/terra-gis/"
cd packages/terra-gis
npm install
```

> NOTE: This app includes `@arcgis/core` and `mapbox-gl` — `npm install` may take 2–3 minutes due to large native dependencies. Wait for completion.

### Step 4.2 — Verify dev server

- [ ] Run:

```bash
cd C:/Users/bsval/terrafusion_os_1.0/packages/terra-gis
timeout 20s PORT=5012 npm run dev 2>&1 | head -30
```

### Step 4.3 — Verify build

- [ ] Run: `PORT=5012 npm run build 2>&1 | tail -5`

### Step 4.4 — service-registry.json entry

- [ ] Add:

```json
    "terra-gis": {
      "Name": "terra-gis",
      "Port": 5012,
      "Url": "http://localhost:5012",
      "Status": "stopped",
      "Package": "terra-gis",
      "StartCmd": "cd packages/terra-gis && PORT=5012 npm run dev"
    }
```

### Step 4.5 — Wire AppFrame

- [ ] In `moduleComponents.tsx`, find the current `terra-gis` block (around line 665–674):

```typescript
    case 'gis-viewer':
    case 'terra-gis':
    case 'gis-pro':
      return (
        <PlaceholderModule
          name="TerraGIS Pro"
          description="Full GIS with parcel boundaries, zoning overlays, aerial imagery, and measurement tools."
          moduleId="terra-gis"
        />
      );
```

Replace with:

```typescript
    case 'gis-viewer':
    case 'terra-gis':
    case 'gis-pro':
      // TerraGIS Pro — Benton County GIS native app (packages/terra-gis, port 5012)
      return (
        <AppFrame
          moduleId="terra-gis"
          parcelContext={
            metadata?.parcelId
              ? {
                  parcelId: String(metadata.parcelId),
                  countyId: String(metadata.countyId ?? ''),
                  assessmentYear: Number(metadata.assessmentYear ?? new Date().getFullYear()),
                }
              : undefined
          }
        />
      );
```

### Step 4.6 — Run consistency tests

### Step 4.7 — Commit

- [ ] Run:

```bash
git add packages/terra-gis/ backend/service-registry.json frontend/apps/os-shell/src/config/moduleComponents.tsx
git commit -m "feat(native): wire TerraGIS Pro via AppFrame — packages/terra-gis port 5012"
```

---

## Task 5 — terra-gama (Tier 1, port 5013, Next.js)

**Branch:** `feat/native-terra-gama`

Source app: `terra-gama-production` — Next.js 16 + React 19 government agency management. Different from Express+Vite apps: uses Next.js built-in server. `PORT` env var is respected by Next.js.

**Files:**
- Create: `packages/terra-gama/`
- Modify: `backend/service-registry.json`
- Modify: `frontend/apps/os-shell/src/config/moduleComponents.tsx`

### Step 5.1 — Copy app

- [ ] Run:

```bash
cp -r "QUARANTINE/top-level-dirs/applications/terra-gama-production/." "packages/terra-gama/"
cd packages/terra-gama
npm install
```

### Step 5.2 — Verify dev server (Next.js)

- [ ] Run:

```bash
cd C:/Users/bsval/terrafusion_os_1.0/packages/terra-gama
timeout 30s PORT=5013 npm run dev 2>&1 | head -30
```

Expected: `▲ Next.js` startup output showing `localhost:5013`. Next.js dev mode can take 15–20s first run.

### Step 5.3 — Verify build

- [ ] Run: `PORT=5013 npm run build 2>&1 | tail -5`

Expected: `✓ Compiled successfully` or similar.

### Step 5.4 — service-registry.json entry

- [ ] Add:

```json
    "terra-gama": {
      "Name": "terra-gama",
      "Port": 5013,
      "Url": "http://localhost:5013",
      "Status": "stopped",
      "Package": "terra-gama",
      "StartCmd": "cd packages/terra-gama && PORT=5013 npm run dev"
    }
```

### Step 5.5 — Wire AppFrame

- [ ] In `moduleComponents.tsx`, find the current `terra-gama` case (around line 744):

```typescript
    case 'terra-gama':
      return (
        <QueuedModuleSurface
          name="TerraGAMA"
          description="Geographic Area Market Analysis — neighborhood delineation, market trend analysis, and area-based valuation."
          moduleId="terra-gama"
        />
      );
```

Replace with:

```typescript
    // TerraGAMA — Next.js government agency management app (packages/terra-gama, port 5013)
    case 'terra-gama':
      return (
        <AppFrame
          moduleId="terra-gama"
          parcelContext={
            metadata?.parcelId
              ? {
                  parcelId: String(metadata.parcelId),
                  countyId: String(metadata.countyId ?? ''),
                  assessmentYear: Number(metadata.assessmentYear ?? new Date().getFullYear()),
                }
              : undefined
          }
        />
      );
```

### Step 5.6 — Run consistency tests

### Step 5.7 — Commit

- [ ] Run:

```bash
git add packages/terra-gama/ backend/service-registry.json frontend/apps/os-shell/src/config/moduleComponents.tsx
git commit -m "feat(native): wire TerraGAMA via AppFrame — packages/terra-gama port 5013 (Next.js)"
```

---

## Task 6 — terra-pro (Tier 2 NEW MODULE, port 5014)

**Branch:** `feat/native-terra-pro`

Source app: `terra-pro-production` — advanced professional assessment with GraphQL, WebSocket, Stripe, d3 visualization. **Tier 2: new module ID not yet in MODULE_REGISTRY — 4 files to update.**

**Files:**
- Create: `packages/terra-pro/`
- Modify: `backend/service-registry.json`
- Modify: `frontend/apps/os-shell/src/config/moduleComponents.tsx` (MODULE_REGISTRY + alias + switch)
- Modify: `frontend/apps/os-shell/src/config/__tests__/moduleRegistryConsistency.test.ts`
- Modify: `frontend/apps/os-shell/src/orchestration/moduleActivation.ts`

### Step 6.1 — Copy app

- [ ] Run:

```bash
cp -r "QUARANTINE/top-level-dirs/applications/terra-pro-production/." "packages/terra-pro/"
cd packages/terra-pro
npm install
```

### Step 6.2 — Verify dev server

- [ ] Run:

```bash
cd C:/Users/bsval/terrafusion_os_1.0/packages/terra-pro
timeout 15s PORT=5014 npm run dev 2>&1 | head -30
```

### Step 6.3 — Verify build

- [ ] Run: `npm run build 2>&1 | tail -5`

### Step 6.4 — service-registry.json entry

- [ ] Add:

```json
    "terra-pro": {
      "Name": "terra-pro",
      "Port": 5014,
      "Url": "http://localhost:5014",
      "Status": "stopped",
      "Package": "terra-pro",
      "StartCmd": "cd packages/terra-pro && PORT=5014 npm run dev"
    }
```

### Step 6.5 — Add to MODULE_REGISTRY in moduleComponents.tsx

- [ ] In `moduleComponents.tsx`, find the `MODULE_REGISTRY` set (around line 130). Add `'terra-pro'` after `'costforge'`:

```typescript
export const MODULE_REGISTRY = new Set<string>([
  'federation-dashboard',
  'costforge',
  'terra-pro',        // ← add this line
  'terra-gaia',
  // ... rest unchanged
```

### Step 6.6 — Add alias in MODULE_ALIASES

- [ ] In `moduleComponents.tsx`, find `MODULE_ALIASES` (around line 29). Add after the costforge aliases:

```typescript
  'pro': 'terra-pro',
  'terra-professional': 'terra-pro',
```

### Step 6.7 — Add AppFrame switch case

- [ ] In `moduleComponents.tsx`, after the `costforge` case block (around line 643), add:

```typescript
    // TerraPro — advanced professional assessment platform (packages/terra-pro, port 5014)
    case 'terra-pro':
      return (
        <AppFrame
          moduleId="terra-pro"
          parcelContext={
            metadata?.parcelId
              ? {
                  parcelId: String(metadata.parcelId),
                  countyId: String(metadata.countyId ?? ''),
                  assessmentYear: Number(metadata.assessmentYear ?? new Date().getFullYear()),
                }
              : undefined
          }
        />
      );
```

### Step 6.8 — Add to moduleRegistryConsistency.test.ts

- [ ] In `frontend/apps/os-shell/src/config/__tests__/moduleRegistryConsistency.test.ts`, find `KNOWN_PLACEHOLDER_MODULES` (around line 75). Add `'terra-pro'` to the set:

```typescript
  const KNOWN_PLACEHOLDER_MODULES = new Set([
    // ... existing entries
    'terra-pro',   // ← add
  ]);
```

- [ ] In the same file, find `EXPECTED_DISPLAY_NAMES` (around line 169). Add:

```typescript
      'terra-pro': 'TerraPro',
```

### Step 6.9 — Add to moduleActivation.ts

- [ ] In `frontend/apps/os-shell/src/orchestration/moduleActivation.ts`, find `displayNames` (around line 93). Add after the `'costforge'` entry:

```typescript
    'terra-pro': 'TerraPro',
```

- [ ] In the same file, find `icons` (around line 166). Add after `'costforge'`:

```typescript
    'terra-pro': '⚖️',
```

### Step 6.10 — Run consistency tests

- [ ] Run:

```bash
cd C:/Users/bsval/terrafusion_os_1.0/frontend/apps/os-shell
npx vitest run src/config/__tests__/moduleRegistryConsistency.test.ts 2>&1 | tail -10
```

Expected: all tests pass.

### Step 6.11 — Commit

- [ ] Run:

```bash
cd C:/Users/bsval/terrafusion_os_1.0
git add packages/terra-pro/ backend/service-registry.json \
  frontend/apps/os-shell/src/config/moduleComponents.tsx \
  frontend/apps/os-shell/src/config/__tests__/moduleRegistryConsistency.test.ts \
  frontend/apps/os-shell/src/orchestration/moduleActivation.ts
git commit -m "feat(native): add TerraPro module + AppFrame wiring — packages/terra-pro port 5014"
```

---

## Task 7 — terra-proplus (Tier 2 NEW MODULE, port 5015)

**Branch:** `feat/native-terra-proplus`

Source app: `terra-proplus-production` — premium assessor platform with Prometheus metrics, real-time dashboard, elite service registry.

**Files:** Same set as Task 6 (4 frontend files + service-registry + packages/).

### Step 7.1 — Copy app

- [ ] Run:

```bash
cp -r "QUARANTINE/top-level-dirs/applications/terra-proplus-production/." "packages/terra-proplus/"
cd packages/terra-proplus
npm install
```

> NOTE: `terra-proplus-production` has a `client/` subdirectory alongside `server/`. Check its `package.json` dev script — it may run `concurrently` like terrabuild. The single `PORT=5015 npm run dev` should spin up both.

### Step 7.2 — Verify dev server

- [ ] Run:

```bash
cd C:/Users/bsval/terrafusion_os_1.0/packages/terra-proplus
timeout 15s PORT=5015 npm run dev 2>&1 | head -30
```

### Step 7.3 — Verify build

- [ ] Run: `npm run build 2>&1 | tail -5`

### Step 7.4 — service-registry.json entry

- [ ] Add:

```json
    "terra-proplus": {
      "Name": "terra-proplus",
      "Port": 5015,
      "Url": "http://localhost:5015",
      "Status": "stopped",
      "Package": "terra-proplus",
      "StartCmd": "cd packages/terra-proplus && PORT=5015 npm run dev"
    }
```

### Step 7.5 — Add to MODULE_REGISTRY

- [ ] In `moduleComponents.tsx`, inside `MODULE_REGISTRY` set, add after `'terra-pro'`:

```typescript
  'terra-proplus',
```

### Step 7.6 — Add alias

- [ ] In `MODULE_ALIASES`, add:

```typescript
  'proplus': 'terra-proplus',
  'terra-pro-plus': 'terra-proplus',
  'elite': 'terra-proplus',
```

### Step 7.7 — Add AppFrame switch case

- [ ] After the `terra-pro` case block, add:

```typescript
    // TerraProPlus — premium elite assessor platform (packages/terra-proplus, port 5015)
    case 'terra-proplus':
      return (
        <AppFrame
          moduleId="terra-proplus"
          parcelContext={
            metadata?.parcelId
              ? {
                  parcelId: String(metadata.parcelId),
                  countyId: String(metadata.countyId ?? ''),
                  assessmentYear: Number(metadata.assessmentYear ?? new Date().getFullYear()),
                }
              : undefined
          }
        />
      );
```

### Step 7.8 — Update consistency test

- [ ] Add `'terra-proplus'` to `KNOWN_PLACEHOLDER_MODULES`.

- [ ] Add to `EXPECTED_DISPLAY_NAMES`:

```typescript
      'terra-proplus': 'TerraProPlus',
```

### Step 7.9 — Update moduleActivation.ts

- [ ] Add to `displayNames`:

```typescript
    'terra-proplus': 'TerraProPlus',
```

- [ ] Add to `icons`:

```typescript
    'terra-proplus': '🏆',
```

### Step 7.10 — Run consistency tests

```bash
cd C:/Users/bsval/terrafusion_os_1.0/frontend/apps/os-shell
npx vitest run src/config/__tests__/moduleRegistryConsistency.test.ts 2>&1 | tail -10
```

### Step 7.11 — Commit

- [ ] Run:

```bash
cd C:/Users/bsval/terrafusion_os_1.0
git add packages/terra-proplus/ backend/service-registry.json \
  frontend/apps/os-shell/src/config/moduleComponents.tsx \
  frontend/apps/os-shell/src/config/__tests__/moduleRegistryConsistency.test.ts \
  frontend/apps/os-shell/src/orchestration/moduleActivation.ts
git commit -m "feat(native): add TerraProPlus module + AppFrame wiring — packages/terra-proplus port 5015"
```

---

## PHASE 2 — Merge all branches

After all 7 tasks complete on their branches:

- [ ] **Step P2.1:** Merge each branch into `feat/native-app-integrations` in order (resolve any conflicts in `service-registry.json` and `moduleComponents.tsx` by combining all entries):

```bash
cd C:/Users/bsval/terrafusion_os_1.0
git checkout feat/native-app-integrations
git merge feat/native-terra-pilt --no-ff -m "merge: terra-pilt integration"
git merge feat/native-terra-permit --no-ff -m "merge: terra-permit integration"
git merge feat/native-vei --no-ff -m "merge: vei integration"
git merge feat/native-terra-gis --no-ff -m "merge: terra-gis integration"
git merge feat/native-terra-gama --no-ff -m "merge: terra-gama integration"
git merge feat/native-terra-pro --no-ff -m "merge: terra-pro integration"
git merge feat/native-terra-proplus --no-ff -m "merge: terra-proplus integration"
```

**Expected conflict zones** (easy to resolve — just combine the additions):
- `backend/service-registry.json`: Add all 7 new entries inside `"Services": { ... }`
- `moduleComponents.tsx`: MODULE_REGISTRY gets all new IDs; switch gets all new cases
- The test file and moduleActivation.ts only touched by Tasks 6–7 (no conflict)

---

## PHASE 3 — Final verification

- [ ] **Step P3.1: Phase83 tools test (no regressions)**

```bash
cd C:/Users/bsval/terrafusion_os_1.0
node --test os-platform/core/tests/phase83-tools.test.mjs 2>&1 | tail -5
```

Expected: `56 passing`.

- [ ] **Step P3.2: Module registry consistency tests (all 5 suites)**

```bash
cd C:/Users/bsval/terrafusion_os_1.0/frontend/apps/os-shell
npx vitest run src/config/__tests__/moduleRegistryConsistency.test.ts 2>&1 | tail -15
```

Expected: 5/5 suites pass. If `EXPECTED_DISPLAY_NAMES` test fails, add the missing moduleId to that map in the test.

- [ ] **Step P3.3: TDC check**

```bash
cd C:/Users/bsval/terrafusion_os_1.0
node tools/tdc/dist/index.js --config tdc.config.json 2>&1 | tail -3
```

Expected: `<= 713 violations` (the current ratchet).

- [ ] **Step P3.4: Push and open PR**

```bash
git push -u origin feat/native-app-integrations
gh pr create \
  --title "feat(native): wire 7 production apps via AppFrame — PILT, Permit, VEI, GIS, GAMA, Pro, ProPlus" \
  --body "$(cat <<'EOF'
## Summary
- Promotes 7 full-stack apps from QUARANTINE to packages/ and wires each via AppFrame
- Tier 1 (5 apps): replaces QueuedModuleSurface stubs with real iframed apps
- Tier 2 (2 apps): adds new module IDs (terra-pro, terra-proplus) to the registry

## Ports allocated
| Module | Port | Source App |
|--------|------|-----------|
| terra-pilt | 5009 | terra-pilt-production |
| terra-permit | 5010 | terra-permit |
| vei | 5011 | bs-income-valuation-production |
| terra-gis | 5012 | bcbs-gis-pro-production |
| terra-gama | 5013 | terra-gama-production (Next.js) |
| terra-pro | 5014 | terra-pro-production |
| terra-proplus | 5015 | terra-proplus-production |

## Test plan
- [ ] phase83-tools: 56/56
- [ ] moduleRegistryConsistency: 5/5 suites
- [ ] TDC <= 713

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

---

## Deferred (post this PR)

These apps need additional audit before integration:

| App | Blocker |
|-----|---------|
| `terra-levy` (QUARANTINE) | Multi-language monorepo (.NET + Node + Python) — different start sequence |
| `terra-flow-production` | Python Flask backend — AppFrame works but StartCmd pattern differs |
| `terra-build-actual` | Overlaps with existing `costforge` (terrabuild) — needs audit to determine if distinct |
| `terra-proplus-production` workspace dirs | `client/` subdir structure may need PORT threading into vite.config |
| `bcbs-webhub-production` | Notifications/webhook hub — unclear which MODULE_REGISTRY slot it fills |
| `terra-miner-production` | No package.json at root — needs structural audit |

---

## Self-review checklist

**Spec coverage:**
- ✅ All 7 target apps have package migration steps
- ✅ All 7 have service-registry entries with exact JSON
- ✅ All 7 have exact switch case replacements with line references
- ✅ Tier 2 apps have MODULE_REGISTRY, alias, test, moduleActivation changes
- ✅ Phase 2 merge procedure documented
- ✅ Phase 3 gates documented

**No placeholders:** All code blocks are complete. No "TBD" or "similar to above."

**Type consistency:** `parcelContext` shape is identical in all 7 AppFrame invocations — matches `packages/tf-sdk/src/index.ts` `ParcelContext` interface.

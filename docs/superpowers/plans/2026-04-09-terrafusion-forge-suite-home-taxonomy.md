# TerraForge Suite Home Module Taxonomy Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reorganize ForgeSuiteHome.tsx so the three approaches to value are PRIMARY, five county-wide supporting tools are SECONDARY, and all workbench-scoped openers and extra panels are removed.

**Architecture:** Single-file change to `ForgeSuiteHome.tsx` — rewrite two module arrays, remove two imports, remove two panel renders, and update the secondary section header. No new files. No CSS changes. No hook changes.

**Tech Stack:** React 18 + TypeScript 5, Vite, `activateModule` orchestration, `useCountyStats` hook.

---

## File Map

| File | Action | What changes |
|---|---|---|
| `frontend/apps/os-shell/src/pages/suites/ForgeSuiteHome.tsx` | Modify | PRIMARY_MODULES, SECONDARY_MODULES arrays, 2 imports removed, 2 panel renders removed, secondary section header text |

No other files change.

---

### Task 1: Rewrite ForgeSuiteHome module arrays and clean up renders

**Files:**
- Modify: `frontend/apps/os-shell/src/pages/suites/ForgeSuiteHome.tsx`

- [ ] **Step 1: Remove the two unused panel imports**

In `ForgeSuiteHome.tsx`, lines 7–8 currently read:
```tsx
import { CompsPoolBrowser } from './CompsPoolBrowser';
import { RatioStudyPanel } from './RatioStudyPanel';
```

Delete both lines. Keep the `SaleQualificationQueue` import on line 9.

After edit, the import block (lines 1–10) should be:
```tsx
import { useNavigate } from 'react-router-dom';
import { ParcelContextBanner } from '../../components/workbench/ParcelContextBanner';
import type { WorkbenchTabSlug } from '../../contracts/workbench';
import { useCountyStats } from '../../hooks/useCountyStats';
import { activateModule } from '../../orchestration/moduleActivation';
import { usePropertyStore } from '../../stores/propertyStore';
import { SaleQualificationQueue } from './SaleQualificationQueue';
import './ForgeSuiteHome.css';
```

- [ ] **Step 2: Replace PRIMARY_MODULES array**

Replace the entire `PRIMARY_MODULES` const (lines 27–56) with:

```tsx
const PRIMARY_MODULES: readonly ForgeModuleDef[] = [
  {
    id: 'costforge',
    label: 'CostForge',
    description:
      'County-wide cost approach — replacement cost schedules, depreciation tables, land schedules, and RCNLD',
    priority: 'primary',
    launchMode: 'standalone',
    moduleId: 'costforge',
    chipLabel: 'Cost approach',
  },
  {
    id: 'comps-forge',
    label: 'CompsForge',
    description:
      'County-wide sales comparison — adjustment grid studio, paired-sales analysis, and market-derived time trends',
    priority: 'primary',
    launchMode: 'standalone',
    moduleId: 'comps-forge',
    chipLabel: 'Sales comparison',
  },
  {
    id: 'income-forge',
    label: 'IncomeForge',
    description:
      'County-wide income approach — cap rates, NOI modeling, and rent schedules for commercial properties',
    priority: 'primary',
    launchMode: 'standalone',
    moduleId: 'income-forge',
    truthState: 'queued',
    chipLabel: 'Income approach',
  },
] as const;
```

- [ ] **Step 3: Replace SECONDARY_MODULES array**

Replace the entire `SECONDARY_MODULES` const (lines 58–171) with:

```tsx
const SECONDARY_MODULES: readonly ForgeModuleDef[] = [
  {
    id: 'statistics-studio',
    label: 'Statistics Studio',
    description: 'IAAO ratio studies — COD, PRD, PRB, and assessment quality diagnostics',
    priority: 'secondary',
    launchMode: 'standalone',
    moduleId: 'statistics-studio',
    chipLabel: 'IAAO diagnostics',
  },
  {
    id: 'batch-cost-run',
    label: 'Batch Cost Runs',
    description: 'County-wide cost model runs with strata, neighborhood, and class filters',
    priority: 'secondary',
    launchMode: 'standalone',
    moduleId: 'batch-cost-run',
    chipLabel: 'Batch execution',
  },
  {
    id: 'regression-studio',
    label: 'Regression Studio',
    description: 'MRA regression models with R² diagnostics for market modeling',
    priority: 'secondary',
    launchMode: 'standalone',
    moduleId: 'regression-studio',
    truthState: 'queued',
    chipLabel: 'Planned scene',
  },
  {
    id: 'terra-gama',
    label: 'TerraGAMA',
    description: 'Geospatial automated mass appraisal with spatial lag models',
    priority: 'secondary',
    launchMode: 'standalone',
    moduleId: 'terra-gama',
    truthState: 'queued',
    chipLabel: 'Planned scene',
  },
  {
    id: 'coefficient-preview',
    label: 'Coefficient Preview',
    description: 'Live preview of adjustment coefficients before table publication',
    priority: 'secondary',
    launchMode: 'standalone',
    moduleId: 'coefficient-preview',
    truthState: 'queued',
    chipLabel: 'Planned scene',
  },
] as const;
```

- [ ] **Step 4: Remove RatioStudyPanel and CompsPoolBrowser renders**

In the JSX return, find and remove these two blocks (currently around lines 347–351):
```tsx
          {/* Slice 1.5 — county-wide IAAO ratio study */}
          <RatioStudyPanel />

          {/* Slice 1.6 — qualified comps pool browser */}
          <CompsPoolBrowser />
```

Keep the `<SaleQualificationQueue />` render above them intact.

- [ ] **Step 5: Update secondary section header text**

Find the secondary section header (currently around line 320):
```tsx
                <h2 className="forge-panel__title">Parcel adapters, references, and planned scenes</h2>
```

Replace with:
```tsx
                <h2 className="forge-panel__title">Supporting analytics and batch operations</h2>
```

- [ ] **Step 6: TypeScript compile check**

```bash
cd frontend && npm run type-check
```

Expected: zero errors. The `WorkbenchTabSlug` import must stay — the `ForgeModuleDef` interface still declares `workbenchTab?: WorkbenchTabSlug`, so the type is still in use even though no module entry sets that field. Do not remove it.

- [ ] **Step 7: Commit**

```bash
cd .. && git add frontend/apps/os-shell/src/pages/suites/ForgeSuiteHome.tsx
git commit -m "$(cat <<'EOF'
feat(forge): reorganize suite home to three-approach taxonomy

PRIMARY: CostForge · CompsForge · IncomeForge (three approaches to value)
SECONDARY: Statistics Studio · Batch Cost Runs · Regression Studio · TerraGAMA · Coefficient Preview
Removed: 8 workbench openers, 2 wrong-suite entries, RatioStudyPanel, CompsPoolBrowser

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
EOF
)"
```

Expected: pre-commit gate passes, UI token ratchet ≤ 764.

---

## Verification Checklist

After the commit, confirm visually or via test run:

- [ ] TerraForge suite home renders exactly 3 primary cards: CostForge, CompsForge, IncomeForge
- [ ] IncomeForge card has "Queued" badge and is non-interactive (disabled)
- [ ] Secondary grid renders exactly 5 cards: Statistics Studio, Batch Cost Runs, Regression Studio, TerraGAMA, Coefficient Preview
- [ ] RatioStudyPanel does NOT appear on the page
- [ ] CompsPoolBrowser does NOT appear on the page
- [ ] SaleQualificationQueue DOES appear below the module grids
- [ ] Recent parcels queue still renders
- [ ] KPI band still renders with correct labels
- [ ] No TypeScript errors
- [ ] No console errors

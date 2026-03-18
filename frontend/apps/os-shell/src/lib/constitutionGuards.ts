/**
 * TFR-039: Runtime Constitutional Guards
 *
 * Five constitutional rules enforced at navigation-time:
 *   1. Tab order — workbench tabs follow a canonical sequence.
 *   2. Write-lane — modules may only write to their own data domains.
 *   3. Suite ownership — pages belong to exactly one suite.
 *   4. Workbench sizing — max 6 simultaneous tabs per workbench.
 *   5. Trace required — every navigation must emit a trace event.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ConstitutionalRule {
  id: string;
  name: string;
  description: string;
  validate: (ctx: NavigationContext) => GuardResult;
}

export interface GuardResult {
  allowed: boolean;
  ruleId: string;
  reason?: string;
}

export interface NavigationContext {
  from: string;
  to: string;
  currentModule: string;
  openTabCount: number;
  traceEnabled: boolean;
}

// ---------------------------------------------------------------------------
// Canonical tab order
// ---------------------------------------------------------------------------

const CANONICAL_TAB_ORDER = [
  'dashboard',
  'parcel-search',
  'parcel-detail',
  'valuation',
  'sales',
  'appeals',
  'reports',
  'settings',
];

// ---------------------------------------------------------------------------
// Suite ownership map — each page prefix belongs to exactly one suite
// ---------------------------------------------------------------------------

const SUITE_OWNERSHIP: Record<string, string> = {
  '/forge': 'forge',
  '/dais': 'dais',
  '/atlas': 'atlas',
  '/dossier': 'dossier',
  '/pilot': 'pilot',
  '/os': 'os',
  '/shared': 'os',
};

// ---------------------------------------------------------------------------
// Stale module IDs — modules that have been renamed or deprecated
// ---------------------------------------------------------------------------

const STALE_IDS = new Set([
  'legacy-valuator',
  'old-gis',
  'property-card-v1',
  'manual-appeal',
  'csv-importer-legacy',
]);

// ---------------------------------------------------------------------------
// Rules
// ---------------------------------------------------------------------------

const MAX_WORKBENCH_TABS = 6;

const rules: ConstitutionalRule[] = [
  {
    id: 'tab-order',
    name: 'Tab Order',
    description: 'Workbench tabs must follow the canonical sequence.',
    validate(ctx) {
      const fromIdx = CANONICAL_TAB_ORDER.indexOf(ctx.from);
      const toIdx = CANONICAL_TAB_ORDER.indexOf(ctx.to);
      // Only enforce when both endpoints are in the canonical set.
      if (fromIdx >= 0 && toIdx >= 0 && toIdx < fromIdx) {
        return {
          allowed: false,
          ruleId: 'tab-order',
          reason: `Navigation from "${ctx.from}" (position ${fromIdx}) backwards to "${ctx.to}" (position ${toIdx}) violates canonical tab order.`,
        };
      }
      return { allowed: true, ruleId: 'tab-order' };
    },
  },
  {
    id: 'write-lane',
    name: 'Write Lane',
    description: 'Modules may only navigate to pages within their own suite.',
    validate(ctx) {
      const targetSuite = Object.entries(SUITE_OWNERSHIP).find(([prefix]) =>
        ctx.to.startsWith(prefix),
      );
      if (targetSuite && targetSuite[1] !== ctx.currentModule && ctx.currentModule !== 'os') {
        return {
          allowed: false,
          ruleId: 'write-lane',
          reason: `Module "${ctx.currentModule}" cannot navigate to "${ctx.to}" which belongs to suite "${targetSuite[1]}".`,
        };
      }
      return { allowed: true, ruleId: 'write-lane' };
    },
  },
  {
    id: 'suite-ownership',
    name: 'Suite Ownership',
    description: 'Every page belongs to exactly one suite.',
    validate(ctx) {
      const matched = Object.entries(SUITE_OWNERSHIP).filter(([prefix]) =>
        ctx.to.startsWith(prefix),
      );
      if (matched.length > 1) {
        return {
          allowed: false,
          ruleId: 'suite-ownership',
          reason: `Page "${ctx.to}" matches multiple suites: ${matched.map(([, s]) => s).join(', ')}. Each page must belong to exactly one suite.`,
        };
      }
      return { allowed: true, ruleId: 'suite-ownership' };
    },
  },
  {
    id: 'workbench-sizing',
    name: 'Workbench Sizing',
    description: `No more than ${MAX_WORKBENCH_TABS} tabs may be open simultaneously.`,
    validate(ctx) {
      if (ctx.openTabCount >= MAX_WORKBENCH_TABS) {
        return {
          allowed: false,
          ruleId: 'workbench-sizing',
          reason: `Opening "${ctx.to}" would exceed the ${MAX_WORKBENCH_TABS}-tab workbench limit (currently ${ctx.openTabCount} open).`,
        };
      }
      return { allowed: true, ruleId: 'workbench-sizing' };
    },
  },
  {
    id: 'trace-required',
    name: 'Trace Required',
    description: 'Every navigation must emit a TerraTrace event.',
    validate(ctx) {
      if (!ctx.traceEnabled) {
        return {
          allowed: false,
          ruleId: 'trace-required',
          reason: 'TerraTrace is disabled. All navigation requires active trace instrumentation.',
        };
      }
      return { allowed: true, ruleId: 'trace-required' };
    },
  },
];

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Validate a navigation transition against all constitutional rules.
 * Returns the first failing rule, or an allowed result if all pass.
 */
export function validateNavigation(
  from: string,
  to: string,
  currentModule = 'os',
  openTabCount = 0,
  traceEnabled = true,
): GuardResult {
  const ctx: NavigationContext = { from, to, currentModule, openTabCount, traceEnabled };

  for (const rule of rules) {
    const result = rule.validate(ctx);
    if (!result.allowed) return result;
  }

  return { allowed: true, ruleId: 'all' };
}

/**
 * Check if a module id has been deprecated / renamed.
 */
export function detectStaleModuleId(id: string): boolean {
  return STALE_IDS.has(id);
}

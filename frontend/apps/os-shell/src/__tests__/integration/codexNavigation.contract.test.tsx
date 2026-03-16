/**
 * Phase 12 — Codex Navigation Contract Tests
 * ═══════════════════════════════════════════
 *
 * Tests the 3-6-9 Object Placement Codex enforcement layer:
 *   - Module alias resolution (short → canonical)
 *   - Object type classification (MODULE_OBJECT_TYPES)
 *   - Spawn intent verdicts (evaluateSpawnIntent)
 *   - Suite boundary validation (validateSuiteRendering)
 *   - Workbench host validation (validateWorkbenchHost)
 *
 * No rendering — pure function tests against the codex contracts.
 */
import { describe, it, expect } from 'vitest';

import {
  MODULE_OBJECT_TYPES,
  PLACEMENT_POLICY,
  requiresWorkbenchHost,
  isStandaloneAllowed,
  isParcelScoped,
  validateSuiteRendering,
  validateWorkbenchHost,
  validatePlacement,
} from '../../contracts/objectPlacement';

import {
  MODULE_ALIASES,
  normalizeModuleId,
  MODULE_REGISTRY,
  isModuleRegistered,
} from '../../config/moduleComponents';

import {
  evaluateSpawnIntent,
  type SpawnDecision,
} from '../../stores/desktopStore';

// ============================================================================
// 1. Module Alias Resolution
// ============================================================================

describe('Module Alias Resolution', () => {
  it('resolves suite shorthand aliases to canonical IDs', () => {
    expect(normalizeModuleId('forge')).toBe('suite-forge');
    expect(normalizeModuleId('atlas')).toBe('suite-atlas');
    expect(normalizeModuleId('dais')).toBe('suite-dais');
    expect(normalizeModuleId('dossier')).toBe('suite-dossier');
    expect(normalizeModuleId('gpt')).toBe('suite-gpt');
  });

  it('resolves legacy aliases to canonical IDs', () => {
    expect(normalizeModuleId('terrabuild')).toBe('costforge');
    expect(normalizeModuleId('terra-build')).toBe('costforge');
    expect(normalizeModuleId('assessment')).toBe('costforge');
  });

  it('resolves OS feature aliases', () => {
    expect(normalizeModuleId('pilot')).toBe('os-pilot');
    expect(normalizeModuleId('trace')).toBe('os-trace');
    expect(normalizeModuleId('canon')).toBe('os-canon');
  });

  it('passes through canonical IDs unchanged', () => {
    expect(normalizeModuleId('suite-forge')).toBe('suite-forge');
    expect(normalizeModuleId('property-workbench')).toBe('property-workbench');
    expect(normalizeModuleId('costforge')).toBe('costforge');
  });

  it('all alias targets resolve to registered or known-pending modules', () => {
    // Modules with aliases pre-wired but not yet in MODULE_REGISTRY
    const KNOWN_PENDING = new Set(['terra-primeview']);
    const unregistered: string[] = [];
    for (const [alias, canonical] of Object.entries(MODULE_ALIASES)) {
      if (!MODULE_REGISTRY.has(canonical) && !KNOWN_PENDING.has(canonical)) {
        unregistered.push(`${alias} → ${canonical}`);
      }
    }
    expect(unregistered).toEqual([]);
  });
});

// ============================================================================
// 2. Object Type Classification
// ============================================================================

describe('Object Type Classification', () => {
  it('classifies all 5 constitutional suites as suite-workspace', () => {
    const suites = ['suite-forge', 'suite-atlas', 'suite-dais', 'suite-dossier', 'suite-gpt'];
    for (const id of suites) {
      const c = MODULE_OBJECT_TYPES[id];
      expect(c, `${id} must be classified`).toBeDefined();
      expect(c.objectType).toBe('suite-workspace');
    }
  });

  it('classifies workbench tabs as parcel-scoped-app with tier0-workbench host', () => {
    const tabs = ['forge', 'atlas', 'dais', 'summary', 'clerk', 'treasury', 'audit', 'dossier', 'pilot'];
    for (const tabId of tabs) {
      const c = MODULE_OBJECT_TYPES[tabId];
      expect(c, `tab '${tabId}' must be classified`).toBeDefined();
      expect(c.objectType).toBe('parcel-scoped-app');
      expect(c.hostSurface).toBe('tier0-workbench');
    }
  });

  it('classifies property-workbench as tier0-workbench', () => {
    const c = MODULE_OBJECT_TYPES['property-workbench'];
    expect(c).toBeDefined();
    expect(c.objectType).toBe('tier0-workbench');
  });

  it('classifies shell surfaces as os-shell-surface', () => {
    for (const id of ['taskbar', 'dock', 'start-menu', 'top-bar']) {
      const c = MODULE_OBJECT_TYPES[id];
      expect(c, `${id} must be classified`).toBeDefined();
      expect(c.objectType).toBe('os-shell-surface');
    }
  });

  it('classifies OS features as os-feature-window', () => {
    for (const id of ['os-pilot', 'os-trace', 'os-canon']) {
      const c = MODULE_OBJECT_TYPES[id];
      expect(c).toBeDefined();
      expect(c.objectType).toBe('os-feature-window');
    }
  });
});

// ============================================================================
// 3. Spawn Intent Verdicts
// ============================================================================

describe('Spawn Intent Verdicts', () => {
  it('suites → open (window-spawned, no host)', () => {
    for (const id of ['suite-forge', 'suite-atlas', 'suite-dais', 'suite-dossier', 'suite-gpt']) {
      const verdict = evaluateSpawnIntent(id);
      expect(verdict.decision).toBe('open' as SpawnDecision);
    }
  });

  it('property-workbench → open', () => {
    const verdict = evaluateSpawnIntent('property-workbench');
    expect(verdict.decision).toBe('open' as SpawnDecision);
  });

  it('parcel-scoped tabs → route-to-workbench', () => {
    for (const tabId of ['forge', 'atlas', 'dais', 'summary', 'clerk', 'audit']) {
      const verdict = evaluateSpawnIntent(tabId);
      expect(verdict.decision).toBe('route-to-workbench' as SpawnDecision);
    }
  });

  it('shell chrome → reject (always-visible cannot spawn)', () => {
    for (const id of ['taskbar', 'dock', 'start-menu', 'top-bar']) {
      const verdict = evaluateSpawnIntent(id);
      expect(verdict.decision).toBe('reject' as SpawnDecision);
    }
  });

  it('OS features → open', () => {
    for (const id of ['os-pilot', 'os-trace', 'os-canon']) {
      const verdict = evaluateSpawnIntent(id);
      expect(verdict.decision).toBe('open' as SpawnDecision);
    }
  });

  it('cross-parcel operational apps → open', () => {
    for (const id of ['federation-dashboard', 'costforge', 'marketplace', 'counties']) {
      const verdict = evaluateSpawnIntent(id);
      expect(verdict.decision).toBe('open' as SpawnDecision);
    }
  });

  it('unclassified modules → open (graceful degradation)', () => {
    const verdict = evaluateSpawnIntent('some-future-extension-module');
    expect(verdict.decision).toBe('open' as SpawnDecision);
    expect(verdict.reason).toBe('unclassified-module-allowed');
  });
});

// ============================================================================
// 4. Placement Helpers
// ============================================================================

describe('Placement Helpers', () => {
  it('requiresWorkbenchHost returns true for parcel-scoped-app', () => {
    expect(requiresWorkbenchHost('parcel-scoped-app')).toBe(true);
  });

  it('requiresWorkbenchHost returns false for suite-workspace', () => {
    expect(requiresWorkbenchHost('suite-workspace')).toBe(false);
  });

  it('isStandaloneAllowed returns true for suite-workspace', () => {
    expect(isStandaloneAllowed('suite-workspace')).toBe(true);
  });

  it('isStandaloneAllowed returns false for parcel-scoped-app', () => {
    expect(isStandaloneAllowed('parcel-scoped-app')).toBe(false);
  });

  it('isParcelScoped returns true for tier0-workbench and parcel-scoped-app', () => {
    expect(isParcelScoped('tier0-workbench')).toBe(true);
    expect(isParcelScoped('parcel-scoped-app')).toBe(true);
  });

  it('isParcelScoped returns false for suite-workspace and cross-parcel-operational-app', () => {
    expect(isParcelScoped('suite-workspace')).toBe(false);
    expect(isParcelScoped('cross-parcel-operational-app')).toBe(false);
  });
});

// ============================================================================
// 5. Suite Boundary Validation
// ============================================================================

describe('Suite Boundary Validation', () => {
  it('all 5 constitutional suites pass validation', () => {
    for (const id of ['suite-forge', 'suite-atlas', 'suite-dais', 'suite-dossier', 'suite-gpt']) {
      expect(validateSuiteRendering(id)).toBeNull();
    }
  });

  it('non-suite modules bypass suite boundary check', () => {
    expect(validateSuiteRendering('costforge')).toBeNull();
    expect(validateSuiteRendering('property-workbench')).toBeNull();
    expect(validateSuiteRendering('os-pilot')).toBeNull();
  });
});

// ============================================================================
// 6. Workbench Host Validation
// ============================================================================

describe('Workbench Host Validation', () => {
  it('parcel-scoped tabs pass workbench host validation', () => {
    for (const tabId of ['forge', 'atlas', 'dais', 'summary', 'clerk', 'treasury', 'audit']) {
      expect(validateWorkbenchHost(tabId)).toBeNull();
    }
  });

  it('unclassified tabs pass (dev/extension graceful degradation)', () => {
    expect(validateWorkbenchHost('future-dev-tab')).toBeNull();
  });

  it('suite-workspace inside workbench → violation', () => {
    const result = validateWorkbenchHost('suite-forge');
    expect(result).not.toBeNull();
    expect(result!.reason).toContain('type-not-workbench-hosted');
  });
});

// ============================================================================
// 7. Cross-Suite Consistency
// ============================================================================

describe('Cross-Suite Consistency', () => {
  it('every suite-workspace has completionRequired=true in placement policy', () => {
    const rule = PLACEMENT_POLICY['suite-workspace'];
    expect(rule.completionRequired).toBe(true);
  });

  it('every parcel-scoped-app has evidenceRequired=true in placement policy', () => {
    const rule = PLACEMENT_POLICY['parcel-scoped-app'];
    expect(rule.evidenceRequired).toBe(true);
    expect(rule.completionRequired).toBe(true);
  });

  it('suite-workspace layer is layer-3-suite', () => {
    expect(PLACEMENT_POLICY['suite-workspace'].layer).toBe('layer-3-suite');
  });

  it('parcel-scoped-app layer is layer-4-workbench', () => {
    expect(PLACEMENT_POLICY['parcel-scoped-app'].layer).toBe('layer-4-workbench');
  });

  it('all 15 object types have placement policies', () => {
    const policyKeys = Object.keys(PLACEMENT_POLICY);
    expect(policyKeys.length).toBe(15);
  });
});

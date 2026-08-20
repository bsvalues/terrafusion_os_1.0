import type { Entry } from '../generatedModules';
import { getModuleEntry, isModuleRegistered } from '../moduleComponents';
import {
  ALL_MODULES,
  CANONICAL_SUITE_MODULES,
  isProductionLaunchEntry,
  isProductionVisibleGeneratedModule,
  MODULES,
  PRODUCTION_VISIBLE_MODULES,
} from '../modules';
import { CONSTITUTIONAL_SUITES } from '../suiteRegistry';

describe('production launcher registry', () => {
  it('derives every live constitutional suite from the canonical in-shell registry', () => {
    const liveSuites = CONSTITUTIONAL_SUITES.filter((suite) => suite.status === 'live');

    expect(CANONICAL_SUITE_MODULES.map((module) => module.id)).toEqual(
      liveSuites.map((suite) => `suite-${suite.id}`)
    );

    for (const suite of liveSuites) {
      const module = CANONICAL_SUITE_MODULES.find(
        (candidate) => candidate.id === `suite-${suite.id}`
      );
      expect(module).toMatchObject({
        displayName: suite.displayName,
        launchPath: suite.route,
        entry: { type: 'route', route: suite.route },
        isCore: true,
        runnable: true,
      });
      expect(isModuleRegistered(`suite-${suite.id}`)).toBe(true);
      expect(getModuleEntry(`suite-${suite.id}`)?.Component).toBeTruthy();
    }
  });

  it.each([
    'http://localhost:5178/',
    'http://module.localhost:5178/',
    'http://127.0.0.1:5178/',
    'http://127.1.2.3:5178/',
    'http://[::1]:5178/',
    'http://[::]:5178/',
    'http://[::ffff:127.0.0.1]:5178/',
    'http://0.0.0.0:5178/',
  ])('rejects loopback launcher URL %s', (url) => {
    expect(isProductionLaunchEntry({ type: 'url', url })).toBe(false);
  });

  it.each([
    { type: 'route', route: '/placeholder' },
    { type: 'route', route: '/placeholder/regression-studio' },
  ] satisfies Entry[])('rejects placeholder launcher entry $route', (entry) => {
    expect(isProductionLaunchEntry(entry)).toBe(false);
  });

  it('excludes every unrunnable, placeholder, loopback, and duplicate suite manifest', () => {
    const visibleIds = new Set(PRODUCTION_VISIBLE_MODULES.map((module) => module.id));

    for (const generatedModule of ALL_MODULES) {
      expect(visibleIds.has(generatedModule.id)).toBe(
        isProductionVisibleGeneratedModule(generatedModule)
      );
    }

    for (const module of PRODUCTION_VISIBLE_MODULES) {
      expect(module.runnable).toBe(true);
      expect(isProductionLaunchEntry(module.entry)).toBe(true);
      expect(isModuleRegistered(module.id)).toBe(true);
    }
  });

  it('preserves the complete internal Gen2 registry for IPC and module resolution', () => {
    expect(MODULES.map((module) => module.id)).toEqual(
      ALL_MODULES.filter(
        (module) => module.intent === 'gen2' && module.id !== 'statistics-studio'
      ).map((module) => module.id)
    );
  });
});

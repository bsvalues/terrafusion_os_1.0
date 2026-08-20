import type { ModuleDefinition, ModuleStatus, ModuleTier } from '../stores/moduleRegistryStore';
import type { Entry, Intent, ModuleManifest } from './generatedModules';
import { GENERATED_MODULES } from './generatedModules';
import { CONSTITUTIONAL_SUITES } from './suiteRegistry';

function mapTier(tier: number): ModuleTier {
  if (tier <= 1) return 'Tier1';
  if (tier === 2) return 'Tier2';
  return 'Tier3';
}

function mapStatus(status: ModuleManifest['status'], intent: Intent): ModuleStatus {
  // Legacy/archive modules should always show as inactive in the UI
  if (intent === 'legacy' || intent === 'archive') {
    return 'inactive';
  }
  switch (status) {
    case 'active':
      return 'active';
    case 'beta':
    case 'alpha':
      return 'loading';
    case 'legacy':
      return 'inactive';
    default:
      return 'active';
  }
}

function entryToLaunchPath(entry: Entry): string {
  switch (entry.type) {
    case 'url':
      return entry.url;
    case 'route':
      return entry.route;
    case 'mf':
      return `/mf/${entry.remote}/${entry.module}`;
    default:
      return '/';
  }
}

type ManifestModuleDefinition = ModuleDefinition &
  Pick<ModuleManifest, 'entry' | 'intent' | 'runnable'>;

export type ProductionModuleDefinition = ModuleDefinition & {
  entry: Entry;
  runnable: true;
};

// All generated modules remain available for registry/admin purposes. Production launch surfaces
// apply the stricter projection below instead of treating every Gen2 manifest as launchable.
export const ALL_MODULES: readonly ManifestModuleDefinition[] = GENERATED_MODULES.map(
  (m, index) => ({
    id: m.id,
    name: m.id,
    displayName: m.displayName,
    description: m.description,
    icon: m.iconName,
    category: m.category,
    tier: mapTier(m.tier),
    status: mapStatus(m.status, m.intent),
    version: m.version,
    launchPath: entryToLaunchPath(m.entry),
    entry: m.entry,
    isCore: m.pinned && m.intent === 'gen2',
    priority: m.tier * 10 + index,
    intent: m.intent,
    runnable: m.runnable,
  })
);

type ModuleWithIntent = ModuleDefinition & { intent: Intent };

const RETIRED_STANDALONE_MODULE_IDS = new Set(['statistics-studio']);

const CANONICAL_SUITE_ALIASES = new Set(
  CONSTITUTIONAL_SUITES.flatMap((suite) => [
    suite.id,
    `terra${suite.id}`,
    `terra-${suite.id}`,
    `suite-${suite.id}`,
  ])
);

function isLoopbackHostname(hostname: string): boolean {
  const normalized = hostname.toLowerCase().replace(/^\[|\]$/g, '');
  return (
    normalized === 'localhost' ||
    normalized.endsWith('.localhost') ||
    normalized === '::' ||
    normalized === '::1' ||
    normalized.startsWith('::ffff:') ||
    normalized === '0.0.0.0' ||
    normalized.startsWith('127.')
  );
}

/** True when an entry can honestly be exposed from a production shell launch surface. */
export function isProductionLaunchEntry(entry: Entry): boolean {
  switch (entry.type) {
    case 'url': {
      try {
        const target = new URL(entry.url);
        return (
          (target.protocol === 'https:' || target.protocol === 'http:') &&
          !isLoopbackHostname(target.hostname)
        );
      } catch {
        return false;
      }
    }
    case 'route': {
      const route = entry.route.trim().toLowerCase();
      return route.startsWith('/') && !route.startsWith('/placeholder');
    }
    case 'mf':
      return entry.remote.trim().length > 0 && entry.module.trim().length > 0;
    default:
      return false;
  }
}

export function isProductionGeneratedEntryRendererResolvable(
  entry: Entry
): entry is Extract<Entry, { type: 'url' }> {
  // Generated modules fall back to GenericModuleHost, whose production-capable renderer is the
  // sandboxed URL host. Route and module-federation entries require an explicit in-shell contract.
  return entry.type === 'url';
}

export function isProductionVisibleGeneratedModule(
  module: ManifestModuleDefinition
): module is ManifestModuleDefinition & { runnable: true } {
  return (
    module.intent === 'gen2' &&
    module.runnable === true &&
    !RETIRED_STANDALONE_MODULE_IDS.has(module.id) &&
    !CANONICAL_SUITE_ALIASES.has(module.id) &&
    isProductionLaunchEntry(module.entry) &&
    isProductionGeneratedEntryRendererResolvable(module.entry)
  );
}

/**
 * Canonical in-shell suite homes. Suite IDs and routes derive only from suiteRegistry.ts; the
 * generated application catalog is not authoritative for constitutional suite navigation.
 */
export const CANONICAL_SUITE_MODULES: readonly ProductionModuleDefinition[] =
  CONSTITUTIONAL_SUITES.filter((suite) => suite.status === 'live').map((suite, index) => ({
    id: `suite-${suite.id}`,
    name: suite.id,
    displayName: suite.displayName,
    description: suite.description,
    icon: suite.iconName,
    category: 'system',
    tier: 'Tier1',
    status: 'active',
    version: '1.0.0',
    launchPath: suite.route,
    entry: { type: 'route', route: suite.route },
    isCore: true,
    priority: index,
    runnable: true,
  }));

// Internal Gen2 registry. IPC and module resolution depend on this complete operational catalog.
export const MODULES: readonly ModuleDefinition[] = ALL_MODULES.filter(
  (module) => module.intent === 'gen2' && !RETIRED_STANDALONE_MODULE_IDS.has(module.id)
);

// Runtime registration includes the complete operational Gen2 catalog plus canonical suite homes.
// Canonical definitions win on any future ID collision while insertion order remains deterministic.
export const REGISTERED_MODULES: readonly ModuleDefinition[] = Array.from(
  new Map(
    [...MODULES, ...CANONICAL_SUITE_MODULES].map((module) => [module.id, module] as const)
  ).values()
);

// Production launch surfaces: governed suite homes plus generated entries with truthful wiring.
export const PRODUCTION_VISIBLE_MODULES: readonly ProductionModuleDefinition[] = [
  ...CANONICAL_SUITE_MODULES,
  ...ALL_MODULES.filter(isProductionVisibleGeneratedModule),
];

// Legacy modules (for Legacy Lab toggle)
export const LEGACY_MODULES: readonly ModuleDefinition[] = ALL_MODULES.filter(
  (m) => (m as ModuleWithIntent).intent === 'legacy'
);

// Archived modules (hidden by default)
export const ARCHIVED_MODULES: readonly ModuleDefinition[] = ALL_MODULES.filter(
  (m) => (m as ModuleWithIntent).intent === 'archive'
);

export const TERRAFUSION_MODULES = MODULES;

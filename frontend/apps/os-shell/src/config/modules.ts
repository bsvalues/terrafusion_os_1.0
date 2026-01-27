import type { ModuleDefinition, ModuleStatus, ModuleTier } from '../stores/moduleRegistryStore';
import type { Entry, ModuleManifest, Intent } from './generatedModules';
import { GENERATED_MODULES } from './generatedModules';

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

// All modules from manifests (for registry/admin purposes)
export const ALL_MODULES: readonly ModuleDefinition[] = GENERATED_MODULES.map((m, index) => ({
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
})) as const;

// Gen2 modules only (what appears in the default desktop)
export const MODULES: readonly ModuleDefinition[] = ALL_MODULES.filter(
  (m) => (m as any).intent === 'gen2'
);

// Legacy modules (for Legacy Lab toggle)
export const LEGACY_MODULES: readonly ModuleDefinition[] = ALL_MODULES.filter(
  (m) => (m as any).intent === 'legacy'
);

// Archived modules (hidden by default)
export const ARCHIVED_MODULES: readonly ModuleDefinition[] = ALL_MODULES.filter(
  (m) => (m as any).intent === 'archive'
);

export const TERRAFUSION_MODULES = MODULES;

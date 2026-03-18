/**
 * SuiteModuleGrid — Layer 3 launcher grid
 *
 * Renders module cards inside a suite home. Supports two launch modes:
 *
 * 1. workbench — routes into Property Workbench at a specific tab (Layer 4),
 *    optionally carrying the active parcel.
 * 2. standalone — launches a standalone module window (county-wide / system tools).
 *
 * Contract:
 *   - launchMode 'workbench' requires workbenchTab
 *   - launchMode 'standalone' requires moduleId
 *   - Malformed cards log a warning and no-op
 */

import type { LucideIcon } from 'lucide-react';
import type { WorkbenchTabSlug } from '../../contracts/workbench';
import { activateModule } from '../../orchestration/moduleActivation';
import { usePropertyStore } from '../../stores/propertyStore';

export interface SuiteModuleDef {
  id: string;
  label: string;
  icon: LucideIcon;
  description: string;
  launchMode: 'workbench' | 'standalone';
  availability?: 'live' | 'coming-soon';
  /** Required when launchMode === 'workbench' */
  workbenchTab?: WorkbenchTabSlug;
  /** Required when launchMode === 'standalone'. Defaults to id if omitted. */
  moduleId?: string;
}

interface SuiteModuleGridProps {
  modules: SuiteModuleDef[];
  accentVar?: string; // CSS variable for suite accent, e.g. '--tf-suite-forge'
}

export function SuiteModuleGrid({ modules, accentVar = '--tf-accent' }: SuiteModuleGridProps) {
  const activeParcel = usePropertyStore((s) => s.activeParcel);

  const handleLaunch = (mod: SuiteModuleDef) => {
    if (mod.availability === 'coming-soon') {
      return;
    }

    if (mod.launchMode === 'workbench') {
      if (!mod.workbenchTab) {
        console.warn(`[SuiteModuleGrid] workbench card "${mod.id}" missing workbenchTab — skipping`);
        return;
      }
      const metadata: Record<string, unknown> = { tabId: mod.workbenchTab };
      if (activeParcel) {
        metadata.parcelId = activeParcel.parcelId;
      }
      activateModule('property-workbench', {
        source: 'start_menu',
        metadata,
      });
    } else {
      const targetId = mod.moduleId ?? mod.id;
      if (!targetId) {
        console.warn(`[SuiteModuleGrid] standalone card "${mod.id}" missing moduleId — skipping`);
        return;
      }
      activateModule(targetId, { source: 'start_menu' });
    }
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 p-6">
      {modules.map((mod) => {
        const Icon = mod.icon;
        const isComingSoon = mod.availability === 'coming-soon';
        return (
          <button
            key={mod.id}
            onClick={() => handleLaunch(mod)}
            disabled={isComingSoon}
            aria-disabled={isComingSoon}
            data-coming-soon={isComingSoon ? 'true' : 'false'}
            className="flex items-start gap-3 p-4 rounded-xl text-left transition-all disabled:cursor-not-allowed disabled:hover:scale-100 disabled:active:scale-100"
            style={{
              background: isComingSoon ? 'hsl(var(--tf-card-bg) / 0.24)' : 'hsl(var(--tf-card-bg) / 0.4)',
              border: isComingSoon
                ? '1px dashed hsl(var(--tf-border) / 0.28)'
                : '1px solid hsl(var(--tf-border) / 0.15)',
              opacity: isComingSoon ? 0.78 : 1,
            }}
          >
            <div
              className="shrink-0 p-2 rounded-lg"
              style={{ background: `hsl(var(${accentVar}) / 0.12)` }}
            >
              <Icon size={20} style={{ color: `hsl(var(${accentVar}))` }} />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium truncate" style={{ color: 'hsl(var(--tf-fg))' }}>
                  {mod.label}
                </p>
                {isComingSoon && (
                  <span
                    className="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em]"
                    style={{
                      color: `hsl(var(${accentVar}))`,
                      background: `hsl(var(${accentVar}) / 0.12)`,
                      border: `1px solid hsl(var(${accentVar}) / 0.18)`,
                    }}
                  >
                    Coming Soon
                  </span>
                )}
              </div>
              <p
                className="text-xs mt-0.5 line-clamp-2"
                style={{ color: 'hsl(var(--tf-muted))' }}
              >
                {mod.description}
              </p>
              {isComingSoon && (
                <p className="text-[11px] mt-2" style={{ color: `hsl(var(${accentVar}))` }}>
                  Launch disabled until the standalone module is implemented.
                </p>
              )}
            </div>
          </button>
        );
      })}
    </div>
  );
}

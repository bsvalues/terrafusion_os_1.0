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
import { useNavigate } from 'react-router-dom';
import type { WorkbenchTabSlug } from '../../contracts/workbench';
import { usePropertyStore } from '../../stores/propertyStore';

export interface SuiteModuleDef {
  id: string;
  label: string;
  icon: LucideIcon;
  description: string;
  launchMode: 'workbench' | 'standalone';
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
  const navigate = useNavigate();

  const handleLaunch = (mod: SuiteModuleDef) => {
    if (mod.launchMode === 'workbench') {
      if (!mod.workbenchTab) {
        return;
      }
      // Navigate to workbench tab route — no window creation
      const parcelId = activeParcel?.parcelId;
      if (parcelId) {
        navigate(`/property/${parcelId}/${mod.workbenchTab}`);
      } else {
        // No active parcel — go to property search with tab intent
        navigate(`/property?openTab=${mod.workbenchTab}`);
      }
    } else {
      // Standalone modules — navigate to their route (e.g., /pilot, /trace)
      const targetId = mod.moduleId ?? mod.id;
      if (!targetId) {
        return;
      }
      navigate(`/${targetId}`);
    }
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 p-6">
      {modules.map((mod) => {
        const Icon = mod.icon;
        return (
          <button
            key={mod.id}
            onClick={() => handleLaunch(mod)}
            className="flex items-start gap-3 p-4 rounded-xl text-left transition-all hover:scale-[1.01] active:scale-[0.99]"
            style={{
              background: 'hsl(var(--tf-card-bg) / 0.4)',
              border: '1px solid hsl(var(--tf-border) / 0.15)',
            }}
          >
            <div
              className="shrink-0 p-2 rounded-lg"
              style={{ background: `hsl(var(${accentVar}) / 0.12)` }}
            >
              <Icon size={20} style={{ color: `hsl(var(${accentVar}))` }} />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium truncate" style={{ color: 'hsl(var(--tf-fg))' }}>
                {mod.label}
              </p>
              <p
                className="text-xs mt-0.5 line-clamp-2"
                style={{ color: 'hsl(var(--tf-muted))' }}
              >
                {mod.description}
              </p>
            </div>
          </button>
        );
      })}
    </div>
  );
}

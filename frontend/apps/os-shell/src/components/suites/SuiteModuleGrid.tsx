/**
 * SuiteModuleGrid — Layer 3 launcher grid
 *
 * Renders module cards inside a suite home with visual hierarchy:
 *
 * PRIMARY tier (priority: 'primary', ≤3 per suite):
 *   - Large hero cards with prominent icon + title + description + telemetry badge
 *   - These are the 2-3 tools an assessor touches every day
 *   - Displayed as a 3-column hero row at the top
 *
 * SECONDARY tier (priority: 'secondary' or unset):
 *   - Compact 4-column grid below the primary row
 *   - Specialist tools accessed less frequently
 *
 * Launch modes:
 *   1. workbench — routes into Property Workbench at a specific tab (Layer 4)
 *   2. standalone — launches a standalone module window (county-wide / system tools)
 *
 * Contract:
 *   - launchMode 'workbench' requires workbenchTab
 *   - launchMode 'standalone' requires moduleId
 *   - Malformed cards log a warning and no-op
 */

import React from 'react';
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
  /**
   * 'primary' = large hero card rendered in top row with telemetry slot.
   * 'secondary' (default) = compact card in lower grid.
   * Max 3 primary modules per suite.
   */
  priority?: 'primary' | 'secondary';
  /**
   * Short live telemetry label shown as a badge on primary cards.
   * E.g. "3 pending", "COD/PRD/PRB", "County-wide"
   * Static strings are fine for alpha; live wiring is Phase 2.
   */
  telemetryLabel?: string;
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
      const parcelId = activeParcel?.parcelId;
      if (parcelId) {
        navigate(`/property/${parcelId}/${mod.workbenchTab}`);
      } else {
        navigate(`/property?openTab=${mod.workbenchTab}`);
      }
    } else {
      const targetId = mod.moduleId ?? mod.id;
      if (!targetId) {
        return;
      }
      navigate(`/${targetId}`);
    }
  };

  const primaryModules = modules.filter((m) => m.priority === 'primary');
  const secondaryModules = modules.filter((m) => m.priority !== 'primary');

  return (
    <div className="flex flex-col">
      {/* ── Primary tier: large hero cards ── */}
      {primaryModules.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 px-6 pt-5 pb-3">
          {primaryModules.map((mod) => {
            const Icon = mod.icon;
            return (
              <button
                key={mod.id}
                onClick={() => handleLaunch(mod)}
                className="relative flex flex-col gap-3 p-5 rounded-xl text-left transition-all hover:scale-[1.01] active:scale-[0.99] group"
                style={{
                  background: 'hsl(var(--tf-card-bg) / 0.6)',
                  border: `1px solid hsl(var(${accentVar}) / 0.25)`,
                  minHeight: 148,
                }}
              >
                {/* Telemetry badge — top right */}
                {mod.telemetryLabel && (
                  <span
                    className="absolute top-3 right-3 text-[10px] font-semibold px-2 py-0.5 rounded-full"
                    style={{
                      background: `hsl(var(${accentVar}) / 0.18)`,
                      color: `hsl(var(${accentVar}))`,
                    }}
                  >
                    {mod.telemetryLabel}
                  </span>
                )}

                {/* Icon */}
                <div
                  className="p-3 rounded-xl w-fit transition-all group-hover:scale-110"
                  style={{ background: `hsl(var(${accentVar}) / 0.15)` }}
                >
                  <Icon size={26} style={{ color: `hsl(var(${accentVar}))` }} />
                </div>

                {/* Label */}
                <p className="text-base font-semibold" style={{ color: 'hsl(var(--tf-fg))' }}>
                  {mod.label}
                </p>

                {/* Description */}
                <p className="text-xs leading-relaxed" style={{ color: 'hsl(var(--tf-muted))' }}>
                  {mod.description}
                </p>
              </button>
            );
          })}
        </div>
      )}

      {/* ── Secondary tier: compact grid ── */}
      {secondaryModules.length > 0 && (
        <>
          {primaryModules.length > 0 && (
            <div
              className="mx-6 mb-2"
              style={{ height: 1, background: 'hsl(var(--tf-border) / 0.1)' }}
            />
          )}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 px-6 pb-5">
            {secondaryModules.map((mod) => {
              const Icon = mod.icon;
              return (
                <button
                  key={mod.id}
                  onClick={() => handleLaunch(mod)}
                  className="flex items-center gap-2.5 p-3 rounded-lg text-left transition-all hover:scale-[1.01] active:scale-[0.99]"
                  style={{
                    background: 'hsl(var(--tf-card-bg) / 0.3)',
                    border: '1px solid hsl(var(--tf-border) / 0.1)',
                  }}
                >
                  <div
                    className="shrink-0 p-1.5 rounded-md"
                    style={{ background: `hsl(var(${accentVar}) / 0.10)` }}
                  >
                    <Icon size={15} style={{ color: `hsl(var(${accentVar}))` }} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-medium truncate" style={{ color: 'hsl(var(--tf-fg) / 0.85)' }}>
                      {mod.label}
                    </p>
                    {mod.description && (
                      <p className="text-[10px] truncate mt-0.5" style={{ color: 'hsl(var(--tf-muted))' }}>
                        {mod.description}
                      </p>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </>
      )}

      {/* Fallback: no tier split (legacy — all equal weight) */}
      {primaryModules.length === 0 && secondaryModules.length === 0 && (
        <div className="px-6 py-4 text-sm" style={{ color: 'hsl(var(--tf-muted))' }}>
          No modules configured.
        </div>
      )}
    </div>
  );
}

/**
 * ═══════════════════════════════════════════════════════════════
 * TERRAFUSION OS — SUITE COMPASS WIDGET
 * Phase F: Left-rail navigation helper for Property Workbench
 *
 * Shows constitutional suites in canonical order with:
 * - Active tab highlight
 * - One-line affordance text per suite on hover
 * - Role/licensing disabled state + tooltip
 * - LiquidPanel outer chrome
 *
 * Desktop: persistent left rail (12rem width)
 * Tablet (≤1024px): collapsed horizontal compact bar above tabs
 *
 * @see 01_PROPERTY_WORKBENCH_SPEC_v3.1.md — Section 3
 * @see contracts/workbench.ts — TabDefinition, WorkbenchTabSlug
 * ═══════════════════════════════════════════════════════════════
 */

import React, { useCallback, useState } from 'react';
import { LiquidPanel } from '../../ui/materials/LiquidPanel';
import type { WorkbenchTabSlug } from '../../contracts/workbench';

// ============================================================================
// Types
// ============================================================================

export interface SuiteCompassItem {
  slug: WorkbenchTabSlug;
  label: string;
  shortLabel: string;
  icon: string;
  affordance: string;  // One-line hover text per spec
  color: string;       // CSS custom property value
  disabled?: boolean;
  disabledReason?: string;
}

export interface SuiteCompassProps {
  /** Currently active tab slug */
  activeTab: WorkbenchTabSlug;
  /** Callback when user clicks a tab */
  onTabChange: (slug: WorkbenchTabSlug) => void;
  /** Optional: override items (for testing/licensing) */
  items?: SuiteCompassItem[];
}

// ============================================================================
// Default Compass Items (Canonical Order)
// ============================================================================

const DEFAULT_COMPASS_ITEMS: readonly SuiteCompassItem[] = [
  {
    slug: 'summary',
    label: 'Summary',
    shortLabel: 'Sum',
    icon: '📊',
    affordance: 'Parcel at a glance',
    color: 'var(--tf-accent)',
  },
  {
    slug: 'forge',
    label: 'TerraForge',
    shortLabel: 'Forge',
    icon: '🔨',
    affordance: 'Build value',
    color: 'var(--tf-suite-forge)',
  },
  {
    slug: 'atlas',
    label: 'TerraAtlas',
    shortLabel: 'Atlas',
    icon: '🗺️',
    affordance: 'See the county',
    color: 'var(--tf-suite-atlas)',
  },
  {
    slug: 'dais',
    label: 'TerraDais',
    shortLabel: 'Dais',
    icon: '⚖️',
    affordance: 'Operate value',
    color: 'var(--tf-suite-dais)',
  },
  {
    slug: 'dossier',
    label: 'TerraDossier',
    shortLabel: 'Dossier',
    icon: '📋',
    affordance: 'Prove the decision',
    color: 'var(--tf-suite-dossier)',
  },
  {
    slug: 'pilot',
    label: 'TerraPilot',
    shortLabel: 'Pilot',
    icon: '🤖',
    affordance: 'Act or draft',
    color: 'var(--tf-accent)',
  },
] as const;

// ============================================================================
// Component
// ============================================================================

export const SuiteCompass: React.FC<SuiteCompassProps> = ({
  activeTab,
  onTabChange,
  items = DEFAULT_COMPASS_ITEMS as unknown as SuiteCompassItem[],
}) => {
  const [hoveredSlug, setHoveredSlug] = useState<WorkbenchTabSlug | null>(null);

  const handleClick = useCallback(
    (slug: WorkbenchTabSlug, disabled?: boolean) => {
      if (!disabled) onTabChange(slug);
    },
    [onTabChange]
  );

  return (
    <>
      {/* Desktop: Vertical left rail */}
      <LiquidPanel
        variant="shell"
        radius="lg"
        className="hidden lg:flex flex-col gap-1 p-2"
        style={{ width: '12rem' }}
        data-testid="suite-compass-desktop"
      >
        <div
          className="text-xs font-semibold uppercase tracking-wider px-2 py-1 mb-1"
          style={{ color: 'hsl(var(--tf-text) / 0.4)' }}
        >
          Suite Compass
        </div>

        {items.map((item) => {
          const isActive = activeTab === item.slug;
          const isHovered = hoveredSlug === item.slug;

          return (
            <button
              key={item.slug}
              onClick={() => handleClick(item.slug, item.disabled)}
              onMouseEnter={() => setHoveredSlug(item.slug)}
              onMouseLeave={() => setHoveredSlug(null)}
              disabled={item.disabled}
              role="tab"
              aria-selected={isActive}
              className="flex items-center gap-2 px-3 py-2 rounded-md text-left text-sm focus-visible:outline-2 focus-visible:outline-offset-1"
              style={{
                transition: 'background 150ms ease, color 150ms ease, border-color 150ms ease',
                background: isActive
                  ? `hsl(${item.color} / 0.15)`
                  : isHovered
                    ? 'hsl(var(--tf-text) / 0.06)'
                    : 'transparent',
                color: item.disabled
                  ? 'hsl(var(--tf-text) / 0.3)'
                  : isActive
                    ? `hsl(${item.color})`
                    : 'hsl(var(--tf-text) / 0.7)',
                borderLeft: isActive
                  ? `3px solid hsl(${item.color})`
                  : '3px solid transparent',
                cursor: item.disabled ? 'not-allowed' : 'pointer',
                opacity: item.disabled ? 0.4 : 1,
                outlineColor: `hsl(${item.color})`,
              }}
              title={item.disabled ? item.disabledReason : item.affordance}
            >
              <span className="text-base shrink-0">{item.icon}</span>
              <div className="min-w-0 flex-1">
                <div className="font-medium truncate">{item.label}</div>
                {(isActive || isHovered) && !item.disabled && (
                  <div
                    className="text-xs truncate mt-0.5"
                    style={{ color: 'hsl(var(--tf-text) / 0.5)' }}
                  >
                    {item.affordance}
                  </div>
                )}
              </div>
            </button>
          );
        })}
      </LiquidPanel>

      {/* Tablet: Horizontal compact bar */}
      <LiquidPanel
        variant="shell"
        radius="md"
        className="flex lg:hidden items-center gap-1 px-2 py-1 overflow-x-auto"
        data-testid="suite-compass-tablet"
      >
        {items.map((item) => {
          const isActive = activeTab === item.slug;
          return (
            <button
              key={item.slug}
              onClick={() => handleClick(item.slug, item.disabled)}
              disabled={item.disabled}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium transition-all whitespace-nowrap"
              style={{
                background: isActive
                  ? `hsl(${item.color} / 0.15)`
                  : 'transparent',
                color: item.disabled
                  ? 'hsl(var(--tf-text) / 0.3)'
                  : isActive
                    ? `hsl(${item.color})`
                    : 'hsl(var(--tf-text) / 0.6)',
                cursor: item.disabled ? 'not-allowed' : 'pointer',
              }}
              title={item.disabled ? item.disabledReason : item.affordance}
            >
              <span>{item.icon}</span>
              <span>{item.shortLabel}</span>
            </button>
          );
        })}
      </LiquidPanel>
    </>
  );
};

export default SuiteCompass;

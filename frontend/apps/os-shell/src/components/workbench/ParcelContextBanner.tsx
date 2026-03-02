/**
 * ═══════════════════════════════════════════════════════════════
 * TERRAFUSION OS — PARCEL CONTEXT BANNER
 * Phase C: Thin banner showing active parcel in suite home pages
 *
 * Displays: parcel ID, address, "Open in Workbench" button.
 * Only visible when parcel context is active.
 *
 * @see 01_PROPERTY_WORKBENCH_SPEC_v3.1.md — Entry points
 * ═══════════════════════════════════════════════════════════════
 */

import React, { useCallback } from 'react';
import { LiquidPanel } from '../../ui/materials/LiquidPanel';
import { useParcelContextStore } from '../../context/parcelContext';

// ============================================================================
// Types
// ============================================================================

export interface ParcelContextBannerProps {
  /** Suite ID for the "Open in Workbench" tab target */
  suiteTabId?: string;
}

// ============================================================================
// Component
// ============================================================================

export const ParcelContextBanner: React.FC<ParcelContextBannerProps> = ({
  suiteTabId,
}) => {
  const context = useParcelContextStore((s) => s.context);

  const handleOpenWorkbench = useCallback(() => {
    if (!context?.parcelId) return;
    import('../../context/parcelContext').then(({ openWorkbenchWindow }) => {
      openWorkbenchWindow(context.parcelId, suiteTabId);
    });
  }, [context?.parcelId, suiteTabId]);

  // Only render when parcel context exists
  if (!context?.parcelId) return null;

  return (
    <LiquidPanel
      variant="interactive"
      radius="md"
      className="px-4 py-2"
      data-testid="parcel-context-banner"
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-sm shrink-0">🏠</span>
          <span
            className="text-sm font-medium truncate"
            style={{ color: 'hsl(var(--tf-text))' }}
          >
            Parcel {context.parcelId}
          </span>
          {context.parcelName && (
            <span
              className="text-xs truncate hidden sm:inline"
              style={{ color: 'hsl(var(--tf-text) / 0.5)' }}
            >
              · {context.parcelName}
            </span>
          )}
        </div>

        <button
          onClick={handleOpenWorkbench}
          className="shrink-0 px-3 py-1 text-xs font-medium rounded transition-colors"
          style={{
            background: 'hsl(var(--tf-accent) / 0.15)',
            color: 'hsl(var(--tf-accent))',
            border: '1px solid hsl(var(--tf-accent) / 0.3)',
          }}
        >
          Open in Workbench
        </button>
      </div>
    </LiquidPanel>
  );
};

export default ParcelContextBanner;

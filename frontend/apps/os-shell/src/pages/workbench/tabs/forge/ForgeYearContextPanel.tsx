/**
 * forge/ForgeYearContextPanel.tsx
 *
 * Compact contextual strip displayed below the year selector in
 * PropertyForge. Shows the selected year's PACS layer attributes:
 *   - Lock state (certified vs open roll)
 *   - PropState code
 *   - Earliest known layer (migration baseline) flag
 *   - Current-use ag / timber enrollment
 *   - Ag deferred loss amounts (RCW 84.34)
 *   - Exemption codes (count)
 *   - Assessed / market value from that layer
 *
 * This panel is display-only. No user actions.
 * Hidden when no parcel is open, while years are loading, or if the
 * selected taxYear has no matching layer in the response.
 */

import React from 'react';
import type { ParcelYearLayer } from '../../../../hooks/forge/useForgeValuation';
import { fmtCurrency } from './types';

interface ForgeYearContextPanelProps {
  layer: ParcelYearLayer | undefined;
  taxYear: number;
}

function Chip({
  label,
  title,
  variant = 'default',
}: {
  label: string;
  title?: string;
  variant?: 'default' | 'warning' | 'info' | 'success';
}) {
  const colors: Record<string, string> = {
    default: 'tf-panel tf-text-secondary',
    warning: 'tf-status-warning tf-text',
    info: 'tf-status-info tf-text-secondary',
    success: 'tf-status-success tf-text',
  };
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${colors[variant]}`}
      title={title}
    >
      {label}
    </span>
  );
}

export const ForgeYearContextPanel: React.FC<ForgeYearContextPanelProps> = ({
  layer,
  taxYear,
}) => {
  if (!layer) return null;

  const agDeferred =
    (layer.programs.agLossDeferred ?? 0) +
    (layer.programs.agLateLossDeferred ?? 0);

  return (
    <div
      className="tf-panel rounded-xl px-4 py-2.5 flex flex-wrap items-center gap-2 text-xs"
      data-testid="forge-year-context-panel"
      aria-label={`Year ${taxYear} context`}
    >
      {/* Year badge */}
      <span className="tf-text font-bold text-sm">{taxYear}</span>

      {/* Lock state */}
      {layer.isLocked ? (
        <Chip label="🔒 Certified" variant="info" title="Values locked in certified roll" />
      ) : (
        <Chip label="🔓 Open" variant="default" title="Roll not yet certified for this year" />
      )}

      {/* Earliest known layer */}
      {layer.isEarliestKnownLayer && (
        <Chip
          label="⚓ Baseline"
          variant="default"
          title="Earliest year on record for this parcel — used as the valuation baseline"
        />
      )}

      {/* PropState */}
      {layer.propState && (
        <Chip
          label={`State: ${layer.propState}`}
          variant="default"
          title="Property state code for this assessment year"
        />
      )}

      {/* Current use programs */}
      {layer.programs.currentUseAg && (
        <Chip
          label={`🌾 Ag (RCW 84.34)${agDeferred > 0 ? ` · deferred ${fmtCurrency(agDeferred)}` : ''}`}
          variant="warning"
          title="Parcel enrolled in current-use agricultural program. Deferred tax liability applies."
        />
      )}
      {layer.programs.currentUseTimber && (
        <Chip
          label={`🌲 Timber (RCW 84.33)${layer.programs.timberLossDeferred ? ` · deferred ${fmtCurrency(layer.programs.timberLossDeferred)}` : ''}`}
          variant="warning"
          title="Parcel enrolled in current-use timber program. Deferred tax liability applies."
        />
      )}

      {/* Exemptions */}
      {layer.programs.exemptionCodes.length > 0 && (
        <Chip
          label={`Exemptions: ${layer.programs.exemptionCodes.join(', ')}`}
          variant="info"
          title="Active exemption codes for this assessment year"
        />
      )}

      {/* Values */}
      {layer.assessedValue != null && (
        <span className="tf-text-secondary ml-auto">
          AV {fmtCurrency(layer.assessedValue)}
          {layer.marketValue != null && (
            <> · MV {fmtCurrency(layer.marketValue)}</>
          )}
        </span>
      )}
    </div>
  );
};

export default ForgeYearContextPanel;

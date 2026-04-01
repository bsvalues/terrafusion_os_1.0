/**
 * forge/ForgeYearSelector.tsx
 *
 * PACS-aware year selector for the Forge workbench.
 *
 * Replaces the static TAX_YEARS <select> in PropertyForge.tsx.
 * Calls GET /api/forge/{parcelId}/years to discover the real year
 * layers that exist for this parcel in PACS.
 *
 * Each option shows:
 *   - Tax year (bold)
 *   - Lock badge (🔒 certified / 🔓 open)
 *   - Earliest known layer flag (⚓ Baseline)
 *   - CurrentUseAg chip (🌾 Ag)
 *   - CurrentUseTimber chip (🌲 Timber)
 *   - SupNum > 0 label (Sup {supNum})
 *
 * When /years is loading, falls back to a simple spinner.
 * When /years errors, falls back to the static CURRENT_YEAR list
 * so the user is never blocked.
 */

import React, { useEffect } from 'react';
import { useParcelYears, type ParcelYearLayer } from '../../../../hooks/forge/useForgeValuation';
import { CURRENT_YEAR, TAX_YEARS } from './types';

interface ForgeYearSelectorProps {
  parcelId: string | undefined;
  taxYear: number;
  onTaxYearChange: (year: number) => void;
}

/* Label builder for a single layer option */
function layerLabel(layer: ParcelYearLayer): string {
  const parts: string[] = [String(layer.year)];
  if (layer.supNum > 0) parts.push(`Sup ${layer.supNum}`);
  if (layer.isLocked) parts.push('🔒');
  if (layer.isEarliestKnownLayer) parts.push('⚓ Baseline');
  if (layer.programs.currentUseAg) parts.push('🌾 Ag');
  if (layer.programs.currentUseTimber) parts.push('🌲 Timber');
  if (layer.programs.exemptionCodes.length > 0) {
    parts.push(`Exmpt:${layer.programs.exemptionCodes.join(',')}`);
  }
  return parts.join(' · ');
}

export const ForgeYearSelector: React.FC<ForgeYearSelectorProps> = ({
  parcelId,
  taxYear,
  onTaxYearChange,
}) => {
  const { data, loading, error } = useParcelYears(parcelId);

  /* When /years data arrives, auto-select defaultYear if the current
   * taxYear is not present in the layers (e.g. first load was CURRENT_YEAR
   * but the parcel only has 2015). */
  useEffect(() => {
    if (!data) return;
    const knownYears = data.layers.map((l) => l.year);
    if (knownYears.length === 0) return;
    if (!knownYears.includes(taxYear) && data.defaultYear != null) {
      onTaxYearChange(data.defaultYear);
    }
  }, [data, taxYear, onTaxYearChange]);

  const hasLayers = data && data.layers.length > 0;

  if (!parcelId) {
    return (
      <div className="flex items-center gap-2">
        <label className="tf-text-secondary text-sm whitespace-nowrap">Tax Year</label>
        <span className="tf-text-dim text-sm">— no parcel</span>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2">
        <label className="tf-text-secondary text-sm whitespace-nowrap">Tax Year</label>
        <div
          role="status"
          aria-label="Loading year layers"
          className="tf-spinner h-4 w-4"
        />
      </div>
    );
  }

  /* Error or no layers → fall back to static list, surface a note */
  if (error || !hasLayers) {
    return (
      <div className="flex items-center gap-4">
        <label htmlFor="forge-tax-year" className="tf-text-secondary text-sm whitespace-nowrap">
          Tax Year
        </label>
        <select
          id="forge-tax-year"
          value={taxYear}
          onChange={(e) => onTaxYearChange(Number(e.target.value))}
          className="tf-input px-3 py-1.5 text-sm"
          aria-describedby="forge-year-fallback-note"
        >
          {TAX_YEARS.map((year) => (
            <option key={year} value={year}>{year}</option>
          ))}
        </select>
        <span
          id="forge-year-fallback-note"
          className="tf-text-dim text-xs"
          title={error?.message}
        >
          {error ? '⚠ year data unavailable' : 'no PACS layers found'}
        </span>
      </div>
    );
  }

  /* Happy path — render PACS-sourced layer list */
  return (
    <div className="flex items-center gap-4 flex-wrap">
      <label htmlFor="forge-tax-year" className="tf-text-secondary text-sm whitespace-nowrap">
        Tax Year
      </label>
      <select
        id="forge-tax-year"
        value={taxYear}
        onChange={(e) => onTaxYearChange(Number(e.target.value))}
        className="tf-input px-3 py-1.5 text-sm font-mono"
        aria-label="Select PACS tax year"
      >
        {data.layers.map((layer) => (
          <option
            key={`${layer.year}-${layer.supNum}`}
            value={layer.year}
          >
            {layerLabel(layer)}
          </option>
        ))}
      </select>
      <span className="tf-text-dim text-xs" data-testid="forge-year-source-badge">
        PACS · {data.layers.length} layer{data.layers.length !== 1 ? 's' : ''}
      </span>
    </div>
  );
};

export default ForgeYearSelector;

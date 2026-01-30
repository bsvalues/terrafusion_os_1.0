/**
 * ═══════════════════════════════════════════════════════════════
 * TERRAFUSION COUNTY SELECTOR COMPONENT
 * Phase 22: Multi-County Federation Layer
 * Dropdown selector for switching between counties in SystemGPT Console.
 * Government. Transcended.
 * ═══════════════════════════════════════════════════════════════
 */

import React from 'react';
import { COUNTY_OPTIONS, CountyId, DEFAULT_COUNTY_ID } from '../../../api/systemDiagnosticsApi';

interface CountySelectorProps {
  /** Currently selected county ID */
  selectedCountyId: CountyId;
  /** Callback when county selection changes */
  onCountyChange: (countyId: CountyId) => void;
  /** Whether the selector is disabled */
  disabled?: boolean;
  /** CSS class name override */
  className?: string;
}

/**
 * County Selector - Phase 22 Multi-County Federation
 * Allows county tech leads to switch between counties (Benton, Yakima, Franklin).
 * Non-configured counties show a warning badge.
 */
export const CountySelector: React.FC<CountySelectorProps> = ({
  selectedCountyId,
  onCountyChange,
  disabled = false,
  className = '',
}) => {
  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newCountyId = e.target.value as CountyId;
    onCountyChange(newCountyId);
  };

  const selectedCounty = COUNTY_OPTIONS.find((c) => c.id === selectedCountyId);
  const isConfigured = selectedCounty?.isConfigured ?? true;

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {/* County icon */}
      <span className='text-slate-400' title='County Federation'>
        🏛️
      </span>

      {/* Dropdown selector */}
      <select
        value={selectedCountyId}
        onChange={handleChange}
        disabled={disabled}
        className={`
          rounded-md border px-3 py-1.5 text-sm font-medium
          transition-colors duration-200
          focus:outline-none focus:ring-2 focus:ring-cyan-500/50
          ${
            disabled
              ? 'cursor-not-allowed border-slate-600 bg-slate-700/50 text-slate-400'
              : 'cursor-pointer border-slate-600 bg-slate-800 text-slate-200 hover:border-cyan-500/50'
          }
        `}
        aria-label='Select county'
      >
        {COUNTY_OPTIONS.map((county) => (
          <option key={county.id} value={county.id}>
            {county.displayName}
            {!county.isConfigured && ' (Not Configured)'}
          </option>
        ))}
      </select>

      {/* Configuration warning badge */}
      {!isConfigured && (
        <span
          className='inline-flex items-center gap-1 rounded-full bg-amber-500/20 px-2 py-0.5 text-xs font-medium text-amber-300'
          title={`${selectedCounty?.displayName} AI services are not yet configured`}
        >
          <span>⚠️</span>
          <span>Not Configured</span>
        </span>
      )}
    </div>
  );
};

/**
 * Hook for managing county selection state.
 * Persists selection to localStorage for user convenience.
 */
export function useCountySelection(): [CountyId, (countyId: CountyId) => void] {
  const STORAGE_KEY = 'terrafusion-selected-county';

  const [selectedCounty, setSelectedCounty] = React.useState<CountyId>(() => {
    // Try to restore from localStorage
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored && COUNTY_OPTIONS.some((c) => c.id === stored)) {
        return stored as CountyId;
      }
    }
    return DEFAULT_COUNTY_ID;
  });

  const handleCountyChange = React.useCallback((countyId: CountyId) => {
    setSelectedCounty(countyId);
    // Persist to localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, countyId);
    }
  }, []);

  return [selectedCounty, handleCountyChange];
}

export default CountySelector;

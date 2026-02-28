/**
 * ControlCenter — OS-level quick-settings drawer.
 *
 * Slides in from the right edge. Provides quick toggles for:
 * - Map layers (parcels, zoning, flood zones, aerial, contours)
 * - Model version selector
 * - Parcel filter shortcuts
 *
 * Uses LiquidPanel variant="shell" for consistency with OS chrome.
 *
 * @module shell/desktop/ControlCenter
 */

import { useCallback, useEffect, useRef } from 'react';
import { Layers, Map, Settings2, X } from 'lucide-react';
import { useControlCenterStore } from '../../stores/controlCenterStore';
import { LiquidPanel, NeonSignal } from '../../ui/materials';
import './control-center.css';

// ============================================================================
// Constants
// ============================================================================

const MAP_LAYER_LABELS: Record<string, string> = {
  parcels: 'Parcels',
  zoning: 'Zoning',
  flood: 'Flood Zones',
  aerial: 'Aerial Imagery',
  contours: 'Contours',
};

const MODEL_VERSIONS = ['v2026.1', 'v2025.2', 'v2025.1'] as const;

// ============================================================================
// Sub-components
// ============================================================================

interface ToggleRowProps {
  label: string;
  checked: boolean;
  onChange: () => void;
}

function ToggleRow({ label, checked, onChange }: ToggleRowProps) {
  return (
    <label className='cc-toggle-row'>
      <span className='cc-toggle-label'>{label}</span>
      <button
        type='button'
        role='switch'
        aria-checked={checked}
        onClick={onChange}
        className={`cc-toggle-track ${checked ? 'cc-toggle-track--on' : ''}`}
      >
        <span className='cc-toggle-thumb' />
      </button>
    </label>
  );
}

// ============================================================================
// ControlCenter
// ============================================================================

export function ControlCenter() {
  const isOpen = useControlCenterStore((s) => s.isOpen);
  const close = useControlCenterStore((s) => s.close);
  const mapLayers = useControlCenterStore((s) => s.mapLayers);
  const toggleMapLayer = useControlCenterStore((s) => s.toggleMapLayer);
  const modelVersion = useControlCenterStore((s) => s.modelVersion);
  const setModelVersion = useControlCenterStore((s) => s.setModelVersion);

  const panelRef = useRef<HTMLDivElement>(null);

  // Escape to close
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isOpen, close]);

  // Focus trap: focus panel on open
  useEffect(() => {
    if (isOpen) panelRef.current?.focus();
  }, [isOpen]);

  const handleBackdropClick = useCallback(() => close(), [close]);

  const activeLayerCount = Object.values(mapLayers).filter(Boolean).length;

  return (
    <>
      {/* Backdrop */}
      <div
        className={`cc-backdrop ${isOpen ? 'cc-backdrop--open' : ''}`}
        onClick={handleBackdropClick}
        aria-hidden='true'
      />

      {/* Panel */}
      <aside
        ref={panelRef}
        data-testid='control-center'
        className={`cc-panel ${isOpen ? 'cc-panel--open' : ''}`}
        role='dialog'
        aria-modal='true'
        aria-label='Control Center'
        tabIndex={-1}
      >
        <LiquidPanel variant='shell' radius='none' className='h-full flex flex-col'>
          {/* Header */}
          <div className='cc-header'>
            <div className='flex items-center gap-2'>
              <Settings2 className='h-4 w-4 opacity-70' />
              <span className='cc-header-title'>CONTROL CENTER</span>
            </div>
            <button
              onClick={close}
              className='cc-close-btn'
              aria-label='Close Control Center'
            >
              <X className='h-4 w-4' />
            </button>
          </div>

          {/* Content */}
          <div className='cc-content'>
            {/* Map Layers Section */}
            <section className='cc-section'>
              <div className='cc-section-header'>
                <Map className='h-3.5 w-3.5 opacity-60' />
                <span>Map Layers</span>
                <NeonSignal status='active' size='xs'>
                  {activeLayerCount}
                </NeonSignal>
              </div>
              <div className='cc-section-body'>
                {Object.entries(MAP_LAYER_LABELS).map(([id, label]) => (
                  <ToggleRow
                    key={id}
                    label={label}
                    checked={!!mapLayers[id]}
                    onChange={() => toggleMapLayer(id)}
                  />
                ))}
              </div>
            </section>

            {/* Model Version Section */}
            <section className='cc-section'>
              <div className='cc-section-header'>
                <Layers className='h-3.5 w-3.5 opacity-60' />
                <span>Model Version</span>
              </div>
              <div className='cc-section-body'>
                <div className='cc-version-grid'>
                  {MODEL_VERSIONS.map((v) => (
                    <button
                      key={v}
                      type='button'
                      className={`cc-version-btn ${v === modelVersion ? 'cc-version-btn--active' : ''}`}
                      onClick={() => setModelVersion(v)}
                      aria-pressed={v === modelVersion}
                    >
                      {v}
                    </button>
                  ))}
                </div>
              </div>
            </section>
          </div>
        </LiquidPanel>
      </aside>
    </>
  );
}

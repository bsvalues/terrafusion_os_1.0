// Applies projection overlays from atlasLiveStore onto the Mapbox GL JS map.
// No DOM output — purely side-effectful.
// Write-lane law: reads overlays from store (placed by useAtlasLiveHub) and PAINTS them.
// Never writes to TerraFusionDbContext or emits commits.

import { useEffect } from 'react';
import { useAtlasLiveStore } from '@/stores/atlasLiveStore';

function ratioToColor(ratio: number): string {
  if (ratio < 0.85) return '#ef4444';
  if (ratio < 0.95) return '#f59e0b';
  if (ratio < 1.05) return '#22c55e';
  if (ratio < 1.15) return '#3b82f6';
  return '#7c3aed';
}

function deltaToColor(deltaPercent: number): string {
  if (deltaPercent < -5) return '#ef4444';
  if (deltaPercent < 0) return '#f97316';
  if (deltaPercent < 5) return '#22c55e';
  return '#3b82f6';
}

interface Props {
  map: unknown | null;
}

export function AtlasOverlayManager({ map }: Props) {
  const { activeOverlays } = useAtlasLiveStore();

  useEffect(() => {
    if (!map) return;

    activeOverlays.forEach((overlay) => {
      if (overlay.type === 'metric-overlay') {
        const features = overlay.values
          .filter((v) => v.parcelId != null)
          .map((v) => ({
            parcelId: v.parcelId,
            value: v.value,
            color: v.color ?? ratioToColor(v.value),
          }));

        if (typeof window !== 'undefined') {
          (window as Record<string, unknown>)[`__atlas_overlay_${overlay.id}`] = features;
        }
      }

      if (overlay.type === 'scenario-delta') {
        const deltaMap: Record<string, string> = {};
        overlay.values.forEach((v) => {
          if (v.parcelId) deltaMap[v.parcelId] = deltaToColor(v.value);
        });
        if (typeof window !== 'undefined') {
          (window as Record<string, unknown>)[`__atlas_overlay_${overlay.id}`] = deltaMap;
        }
      }

      if (overlay.type === 'cohort-shade') {
        const parcelSet = new Set(overlay.values.map((v) => v.parcelId).filter(Boolean));
        if (typeof window !== 'undefined') {
          (window as Record<string, unknown>)[`__atlas_overlay_${overlay.id}`] = parcelSet;
        }
      }
    });

    if (typeof window !== 'undefined') {
      const activeIds = new Set(activeOverlays.map((o) => o.id));
      Object.keys(window)
        .filter((k) => k.startsWith('__atlas_overlay_'))
        .forEach((k) => {
          const id = k.replace('__atlas_overlay_', '');
          if (!activeIds.has(id)) {
            delete (window as Record<string, unknown>)[k];
          }
        });
    }
  }, [activeOverlays, map]);

  return null;
}

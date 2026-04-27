import { useEffect, useRef } from 'react';
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

type AtlasMapFeatureTarget = {
  source: string;
  id: string;
};

type AtlasMapHandle = {
  setFeatureState: (target: AtlasMapFeatureTarget, state: Record<string, unknown>) => void;
  removeFeatureState?: (target: AtlasMapFeatureTarget) => void;
  isStyleLoaded?: () => boolean;
};

interface Props {
  map: unknown | null;
}

function applyColorForOverlayValue(overlayType: string, value: number, styleHints: Record<string, unknown>, explicitColor?: string): string {
  if (explicitColor) return explicitColor;

  switch (overlayType) {
    case 'scenario-delta':
      return deltaToColor(value);
    case 'cohort-shade':
      return typeof styleHints.fillColor === 'string' ? styleHints.fillColor : '#22c55e';
    case 'edge-warnings':
      return value >= 3 ? '#ef4444' : value >= 2 ? '#f59e0b' : '#facc15';
    case 'metric-overlay':
    default:
      return ratioToColor(value);
  }
}

export function AtlasOverlayManager({ map }: Props) {
  const { activeOverlays } = useAtlasLiveStore();
  const previousParcelIdsRef = useRef<string[]>([]);

  useEffect(() => {
    const atlasMap = map as AtlasMapHandle | null;
    if (!atlasMap) return;
    if (atlasMap.isStyleLoaded && !atlasMap.isStyleLoaded()) return;

    previousParcelIdsRef.current.forEach((parcelId) => {
      const target = { source: 'parcels', id: parcelId };
      try {
        if (atlasMap.removeFeatureState) {
          atlasMap.removeFeatureState(target);
        } else {
          atlasMap.setFeatureState(target, {
            atlasOverlayActive: false,
            atlasColor: null,
          });
        }
      } catch {
        // Source may not be ready yet; Atlas Live will retry on the next render.
      }
    });

    const latestOverlay = activeOverlays[activeOverlays.length - 1];
    if (!latestOverlay) {
      previousParcelIdsRef.current = [];
      return;
    }

    const nextParcelIds: string[] = [];

    latestOverlay.values.forEach((value) => {
      if (!value.parcelId) return;
      nextParcelIds.push(value.parcelId);
      try {
        atlasMap.setFeatureState(
          { source: 'parcels', id: value.parcelId },
          {
            atlasOverlayActive: true,
            atlasColor: applyColorForOverlayValue(
              latestOverlay.type,
              value.value,
              latestOverlay.styleHints,
              value.color,
            ),
          },
        );
      } catch {
        // Source may not be ready yet; Atlas Live will retry on the next render.
      }
    });

    previousParcelIdsRef.current = nextParcelIds;
  }, [activeOverlays, map]);

  return null;
}

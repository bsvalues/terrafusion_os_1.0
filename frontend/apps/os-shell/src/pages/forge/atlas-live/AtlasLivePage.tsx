// Atlas Live View — full-surface spatial workspace.
// SESSION SUBSCRIBER: joins the CountyStudyHub but NEVER writes valuation state.
// Receives projection overlays from County Studio. Sends selection intent back.

import React, { useRef, useEffect, useMemo } from 'react';
import { useAtlasLiveStore } from '@/stores/atlasLiveStore';
import { AtlasSyncBadge } from './components/AtlasSyncBadge';
import { AtlasToolbar } from './components/AtlasToolbar';
import { AtlasOverlayManager } from './components/AtlasOverlayManager';
import { useAtlasLiveHub } from './hooks/useAtlasLiveHub';
import { useAtlasMapData } from './hooks/useAtlasMapData';
import type {
  NbhdOutlineCollection,
  ParcelTileCollection,
  ParcelTileProps,
} from '../geo/v2/v2Api';

function useStudyIdFromUrl(): string | null {
  return useMemo(() => {
    if (typeof window === 'undefined') return null;
    return new URLSearchParams(window.location.search).get('studyId');
  }, []);
}

function useTaxYearFromUrl(): number {
  return useMemo(() => {
    if (typeof window === 'undefined') return 2026;
    const q = new URLSearchParams(window.location.search).get('taxYear');
    const parsed = q ? Number(q) : NaN;
    return Number.isFinite(parsed) && parsed > 2000 ? parsed : 2026;
  }, []);
}

export function AtlasLivePage() {
  const studyId = useStudyIdFromUrl();
  const taxYear = useTaxYearFromUrl();
  const { studyId: storeStudyId, setStudyId, activeTool } = useAtlasLiveStore();
  const mapRef = useRef<unknown>(null);

  useEffect(() => {
    if (studyId && studyId !== storeStudyId) {
      setStudyId(studyId);
    }
  }, [studyId, storeStudyId, setStudyId]);

  const { sendSelection } = useAtlasLiveHub(storeStudyId ?? studyId);
  const { outlines, parcels, loading: mapDataLoading, error: mapDataError } = useAtlasMapData(taxYear);

  const handleParcelClick = async (parcelId: string) => {
    if (!storeStudyId) return;
    await sendSelection({
      type: 'selection:parcel-ids',
      studyId: storeStudyId,
      parcelIds: [parcelId],
      source: 'click',
    });
  };

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        height: '100vh',
        background: '#0a0e1a',
        overflow: 'hidden',
      }}
    >
      {/* Top Bar */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 44,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 16px',
          background: 'rgba(10,14,26,0.80)',
          backdropFilter: 'blur(8px)',
          zIndex: 10,
        }}
      >
        <span style={{ fontWeight: 700, fontSize: 13, color: 'rgba(255,255,255,0.9)' }}>
          Atlas Live View
        </span>
        {storeStudyId && (
          <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>
            Study: {storeStudyId.slice(0, 8)}…
          </span>
        )}
        <AtlasSyncBadge />
      </div>

      {/* Map Surface */}
      <div
        data-testid="atlas-map-surface"
        style={{ position: 'absolute', inset: 0, paddingTop: 44 }}
      >
        <AtlasMapSurface
          mapRef={mapRef}
          activeTool={activeTool}
          outlines={outlines}
          parcels={parcels}
          onParcelClick={handleParcelClick}
        />
      </div>

      {/* Map data status — subtle inline loading/error indicator in the top bar area */}
      {mapDataLoading && (
        <div
          data-testid="atlas-map-loading"
          role="status"
          aria-live="polite"
          style={{
            position: 'absolute',
            top: 52,
            right: 16,
            padding: '4px 10px',
            borderRadius: 4,
            background: 'rgba(0,153,255,0.18)',
            color: '#8fd4ff',
            fontSize: 11,
            fontWeight: 600,
            zIndex: 9,
            pointerEvents: 'none',
          }}
        >
          Loading map data…
        </div>
      )}
      {mapDataError && (
        <div
          data-testid="atlas-map-error"
          role="alert"
          style={{
            position: 'absolute',
            top: 52,
            right: 16,
            padding: '4px 10px',
            borderRadius: 4,
            background: 'rgba(239,68,68,0.18)',
            color: '#ffb3b3',
            fontSize: 11,
            fontWeight: 600,
            zIndex: 9,
          }}
          title={mapDataError}
        >
          Map data unavailable
        </div>
      )}

      {/* Overlay Manager */}
      <AtlasOverlayManager map={mapRef.current} />

      {/* Bottom Toolbar */}
      <div
        style={{
          position: 'absolute',
          bottom: 24,
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 10,
        }}
      >
        <AtlasToolbar />
      </div>
    </div>
  );
}

// Internal Map Surface — lazy-loads GeoForgeV2Map to isolate Mapbox GL JS from tests.
// When outlines/parcels are null, the map still renders its basemap; the shared
// loading/error indicators on AtlasLivePage communicate data status to the user.
function AtlasMapSurface({
  mapRef,
  activeTool,
  outlines,
  parcels,
  onParcelClick,
}: {
  mapRef: React.RefObject<unknown>;
  activeTool: string;
  outlines: NbhdOutlineCollection | null;
  parcels: ParcelTileCollection | null;
  onParcelClick: (id: string) => void;
}) {
  let GeoForgeV2Map: React.ComponentType<{
    outlines: NbhdOutlineCollection | null;
    parcels: ParcelTileCollection | null;
    selectedNeighborhoodCode: string | null;
    onNeighborhoodClick: (code: string) => void;
    onParcelClick: (parcel: ParcelTileProps) => void;
    onViewportChange: () => void;
    visibleLayers: Set<string>;
    mapCtx: Record<string, unknown>;
  }>;

  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    GeoForgeV2Map = require('../geo/v2/GeoForgeV2Map').GeoForgeV2Map;
  } catch {
    return <div data-testid="map-unavailable" style={{ width: '100%', height: '100%', background: '#0a0e1a' }} />;
  }

  return (
    <GeoForgeV2Map
      outlines={outlines}
      parcels={parcels}
      selectedNeighborhoodCode={null}
      onNeighborhoodClick={() => {}}
      onParcelClick={(parcel) => onParcelClick(parcel.parcelId)}
      onViewportChange={() => {}}
      visibleLayers={new Set(['satellite', 'choropleth'])}
      mapCtx={{}}
    />
  );
}

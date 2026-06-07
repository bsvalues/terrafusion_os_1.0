// Atlas Live View — official spatial surface for County Studio handoff.
// SESSION SUBSCRIBER: joins the CountyStudyHub but NEVER writes valuation state.
// Receives projection overlays from County Studio. Sends selection intent back.

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useAtlasLiveStore } from '@/stores/atlasLiveStore';
import { AtlasSyncBadge } from './components/AtlasSyncBadge';
import { AtlasToolbar } from './components/AtlasToolbar';
import { AtlasOverlayManager } from './components/AtlasOverlayManager';
import { useAtlasLiveHub } from './hooks/useAtlasLiveHub';
import { useAtlasMapData } from './hooks/useAtlasMapData';
import type { AtlasRouteScope } from './atlasLiveApi';
import type {
  NbhdOutlineCollection,
  ParcelTileCollection,
  ParcelTileProps,
} from '../geo/v2/v2Api';

const WASHINGTON_DEFAULT_CENTER: [number, number] = [-120.9, 47.35];
const WASHINGTON_DEFAULT_ZOOM = 6.6;
const BENTON_ATLAS_CENTER: [number, number] = [-119.3, 46.25];
const BENTON_ATLAS_ZOOM = 10;

function useRouteScopeFromUrl(): AtlasRouteScope {
  return useMemo(() => {
    if (typeof window === 'undefined') {
      return {
        studyId: null,
        countyId: null,
        countyName: null,
        countyCode: null,
        segmentId: null,
        neighborhoodCode: null,
        taxYear: 2026,
      };
    }

    const params = new URLSearchParams(window.location.search);
    const rawTaxYear = params.get('taxYear');
    const parsedTaxYear = rawTaxYear ? Number(rawTaxYear) : NaN;

    return {
      studyId: params.get('studyId'),
      countyId: params.get('countyId'),
      countyName: params.get('countyName'),
      countyCode: params.get('countyCode'),
      segmentId: params.get('segmentId'),
      neighborhoodCode: params.get('neighborhoodCode'),
      taxYear: Number.isFinite(parsedTaxYear) && parsedTaxYear > 2000 ? parsedTaxYear : 2026,
    };
  }, []);
}

export function AtlasLivePage() {
  const routeScope = useRouteScopeFromUrl();
  const storeStudyId = useAtlasLiveStore((state) => state.studyId);
  const activeTool = useAtlasLiveStore((state) => state.activeTool);
  const storeCountyId = useAtlasLiveStore((state) => state.countyId);
  const storeCountyName = useAtlasLiveStore((state) => state.countyName);
  const storeCountyCode = useAtlasLiveStore((state) => state.countyCode);
  const storeSegmentId = useAtlasLiveStore((state) => state.segmentId);
  const storeNeighborhoodCode = useAtlasLiveStore((state) => state.neighborhoodCode);
  const setStudyId = useAtlasLiveStore((state) => state.setStudyId);
  const setCountyScope = useAtlasLiveStore((state) => state.setCountyScope);
  const mapRef = useRef<unknown>(null);
  const [liveMap, setLiveMap] = useState<unknown | null>(null);

  useEffect(() => {
    if (routeScope.studyId && routeScope.studyId !== storeStudyId) {
      setStudyId(routeScope.studyId);
    }
    if (!routeScope.studyId && storeStudyId !== null) {
      setStudyId(null);
    }
  }, [routeScope.studyId, setStudyId, storeStudyId]);

  const {
    countyContext,
    outlines,
    parcels,
    loading: mapDataLoading,
    error: mapDataError,
    scopeMessage,
  } = useAtlasMapData(routeScope);

  useEffect(() => {
    const nextCountyId = countyContext?.countyId ?? routeScope.countyId ?? null;
    const nextCountyName = countyContext?.countyName ?? routeScope.countyName ?? null;
    const nextCountyCode = countyContext?.countyCode ?? routeScope.countyCode ?? null;
    const nextSegmentId = routeScope.segmentId ?? null;
    const nextNeighborhoodCode = routeScope.neighborhoodCode ?? null;

    if (
      storeCountyId === nextCountyId
      && storeCountyName === nextCountyName
      && storeCountyCode === nextCountyCode
      && storeSegmentId === nextSegmentId
      && storeNeighborhoodCode === nextNeighborhoodCode
    ) {
      return;
    }

    setCountyScope({
      countyId: nextCountyId,
      countyName: nextCountyName,
      countyCode: nextCountyCode,
      segmentId: nextSegmentId,
      neighborhoodCode: nextNeighborhoodCode,
    });
  }, [
    countyContext,
    routeScope.countyCode,
    routeScope.countyId,
    routeScope.countyName,
    routeScope.neighborhoodCode,
    routeScope.segmentId,
    setCountyScope,
    storeCountyCode,
    storeCountyId,
    storeCountyName,
    storeNeighborhoodCode,
    storeSegmentId,
  ]);

  const { sendSelection } = useAtlasLiveHub(storeStudyId ?? routeScope.studyId);

  const initialViewport = useMemo(() => {
    if (countyContext?.countyCode === '005') {
      return { center: BENTON_ATLAS_CENTER, zoom: BENTON_ATLAS_ZOOM };
    }

    return { center: WASHINGTON_DEFAULT_CENTER, zoom: WASHINGTON_DEFAULT_ZOOM };
  }, [countyContext?.countyCode]);

  const handleParcelClick = async (parcelId: string) => {
    if (!storeStudyId) return;
    await sendSelection({
      type: 'selection:parcel-ids',
      studyId: storeStudyId,
      parcelIds: [parcelId],
      source: 'click',
    });
  };

  const countyLabel = countyContext?.countyName
    ?? routeScope.countyName
    ?? routeScope.countyCode
    ?? routeScope.countyId
    ?? 'Unscoped';

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
          <span
            data-testid="atlas-live-title"
            style={{ fontWeight: 700, fontSize: 13, color: 'rgba(255,255,255,0.9)' }}
          >
          Atlas Live View
        </span>
        <div
          data-testid="atlas-route-scope"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            fontSize: 11,
            color: 'rgba(255,255,255,0.5)',
          }}
        >
          <span>County: {countyLabel}</span>
          {routeScope.segmentId && <span>Segment: {routeScope.segmentId.slice(0, 12)}…</span>}
          {storeStudyId && <span>Study: {storeStudyId.slice(0, 8)}…</span>}
        </div>
        <AtlasSyncBadge />
      </div>

      <div
        data-testid="atlas-map-surface"
        style={{ position: 'absolute', inset: 0, paddingTop: 44 }}
      >
        <AtlasMapSurface
          mapRef={mapRef}
          activeTool={activeTool}
          outlines={outlines}
          parcels={parcels}
          selectedNeighborhoodCode={routeScope.neighborhoodCode}
          initialViewport={initialViewport}
          onMapReady={setLiveMap}
          onParcelClick={handleParcelClick}
        />
      </div>

      {countyContext && (
        <div
          data-testid="atlas-county-context"
          style={{
            position: 'absolute',
            top: 52,
            left: 16,
            padding: '10px 12px',
            borderRadius: 8,
            background: 'rgba(10,14,26,0.84)',
            backdropFilter: 'blur(8px)',
            border: '1px solid rgba(255,255,255,0.08)',
            color: 'rgba(255,255,255,0.82)',
            zIndex: 9,
            maxWidth: 360,
          }}
        >
          <div style={{ fontSize: 12, fontWeight: 700 }}>
            {countyContext.countyName} County · {countyContext.countyCode}
          </div>
          <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.6)', marginTop: 4 }}>
            Source mode: {countyContext.primarySourceMode ?? 'unknown'} · Status: {countyContext.prometheusStatus.replace(/_/g, ' ')}
          </div>
          <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.6)', marginTop: 2 }}>
            Staged sales: {countyContext.stagedSales.toLocaleString()} · Review queue: {countyContext.needsReview.toLocaleString()}
          </div>
          <div
            data-testid="atlas-county-trust-posture"
            data-contract-id={countyContext.contractId}
            data-trust-tier={countyContext.trustTier}
            style={{ fontSize: 10, color: 'rgba(255,255,255,0.6)', marginTop: 6 }}
          >
            <span style={{ color: '#93c5fd', fontWeight: 700 }}>{countyContext.trustLabel}</span>
            {' · '}
            {countyContext.databasePosture}
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 5 }}>
            {countyContext.dataTrustBadges.map((badge) => (
              <span
                key={badge}
                style={{
                  padding: '1px 5px',
                  borderRadius: 999,
                  border: '1px solid rgba(147,197,253,0.28)',
                  color: 'rgba(191,219,254,0.92)',
                  fontSize: 9,
                  fontWeight: 700,
                }}
              >
                {badge}
              </span>
            ))}
          </div>
          <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)', marginTop: 4 }}>
            {countyContext.dataTrustMessage}
          </div>
          {countyContext.latestSaleDate && (
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)', marginTop: 2 }}>
              Latest sale: {countyContext.latestSaleDate}
            </div>
          )}
        </div>
      )}

      {scopeMessage && (
        <div
          data-testid="atlas-scope-message"
          role="status"
          style={{
            position: 'absolute',
            bottom: 88,
            left: 16,
            padding: '8px 12px',
            borderRadius: 6,
            background: countyContext?.geometryAvailability === 'compatibility'
              ? 'rgba(245,158,11,0.16)'
              : 'rgba(59,130,246,0.16)',
            color: countyContext?.geometryAvailability === 'compatibility'
              ? '#fbbf24'
              : '#93c5fd',
            fontSize: 11,
            fontWeight: 600,
            zIndex: 9,
            maxWidth: 440,
          }}
        >
          {scopeMessage}
        </div>
      )}

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

      <AtlasOverlayManager map={liveMap} />

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

function AtlasMapSurface({
  mapRef,
  activeTool,
  outlines,
  parcels,
  selectedNeighborhoodCode,
  initialViewport,
  onMapReady,
  onParcelClick,
}: {
  mapRef: React.RefObject<unknown>;
  activeTool: string;
  outlines: NbhdOutlineCollection | null;
  parcels: ParcelTileCollection | null;
  selectedNeighborhoodCode: string | null;
  initialViewport: { center: [number, number]; zoom: number };
  onMapReady: (map: unknown | null) => void;
  onParcelClick: (id: string) => void;
}) {
  let GeoForgeV2Map: React.ComponentType<{
    mapRef?: React.RefObject<unknown>;
    onMapReady?: (map: unknown | null) => void;
    outlines: NbhdOutlineCollection | null;
    parcels: ParcelTileCollection | null;
    selectedNeighborhoodCode: string | null;
    onNeighborhoodClick: (code: string) => void;
    onParcelClick: (parcel: ParcelTileProps) => void;
    onViewportChange: () => void;
    visibleLayers: Set<string>;
    mapCtx: Record<string, unknown>;
    initialViewport?: { center: [number, number]; zoom: number };
  }>;

  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    GeoForgeV2Map = require('../geo/v2/GeoForgeV2Map').GeoForgeV2Map;
  } catch {
    return <div data-testid="map-unavailable" style={{ width: '100%', height: '100%', background: '#0a0e1a' }} />;
  }

  return (
    <GeoForgeV2Map
      mapRef={mapRef}
      onMapReady={onMapReady}
      outlines={outlines}
      parcels={parcels}
      selectedNeighborhoodCode={selectedNeighborhoodCode}
      onNeighborhoodClick={() => {}}
      onParcelClick={(parcel) => onParcelClick(parcel.parcelId)}
      onViewportChange={() => {}}
      visibleLayers={new Set(activeTool === 'none' ? ['nbhd', 'parcels', 'outliers'] : ['nbhd', 'parcels', 'outliers'])}
      mapCtx={{}}
      initialViewport={initialViewport}
    />
  );
}

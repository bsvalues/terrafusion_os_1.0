import React, { useEffect, useMemo, useRef, useState } from 'react';
import activateModule from '@/orchestration/moduleActivation';
import { useAtlasLiveStore } from '@/stores/atlasLiveStore';
import { useCountyStudioStore } from '@/stores/countyStudioStore';
import { AtlasOverlayManager } from '../../atlas-live/components/AtlasOverlayManager';
import { useAtlasMapData } from '../../atlas-live/hooks/useAtlasMapData';
import { GeoForgeV2Map } from '../../geo/v2/GeoForgeV2Map';
import type { AtlasRouteScope } from '../../atlas-live/atlasLiveApi';
import type { ParcelTileProps } from '../../geo/v2/v2Api';
import type { V2LayerId } from '../../geo/v2/LeftPanel';
import type { CountySegmentDto } from '../types/countyStudio.types';

const BENTON_ATLAS_CENTER: [number, number] = [-119.3, 46.25];
const BENTON_ATLAS_ZOOM = 10;

const atlasLayerSummary = 'Parcels, Parcel boundaries, Neighborhoods, County segments, Reval areas, Taxing districts, Layer configuration';
const forgeOverlaySummary = 'Valuation risk, Ratio / COD / PRD risk, Comparable sales clusters, Model groups, Value tiers, CAMA characteristic anomalies, Segment health';

export const COUNTY_STUDIO_ATLAS_ACTIVE_LAYERS = [
  'parcels',
  'parcel-boundaries',
  'neighborhoods',
  'county-segments',
  'reval-areas',
  'taxing-districts',
  'valuation-risk',
  'ratio-risk',
  'segment-health',
] as const;

export type CountyStudioAtlasViewport = {
  bbox: [number, number, number, number];
  zoom: number;
};

interface PrometheusRoleLensView {
  label: string;
  mapLens: string;
  posture: string;
}

function riskLevel(score: number): 'Critical' | 'High' | 'Medium' | 'Low' {
  if (score >= 75) return 'Critical';
  if (score >= 60) return 'High';
  if (score >= 35) return 'Medium';
  return 'Low';
}

function riskColor(score: number): string {
  if (score >= 75) return 'crimson';
  if (score >= 60) return 'darkorange';
  if (score >= 35) return 'royalblue';
  return 'seagreen';
}

function riskChromeColor(score: number): string {
  if (score >= 75) return 'hsl(var(--tf-danger, 0 84% 60%))';
  if (score >= 60) return 'hsl(var(--tf-warning, 38 92% 50%))';
  if (score >= 35) return 'hsl(var(--tf-accent, 217 91% 60%))';
  return 'hsl(var(--tf-success, 142 71% 45%))';
}

function strongestSegmentForNeighborhood(
  segments: CountySegmentDto[],
  neighborhoodCode: string | null | undefined,
): CountySegmentDto | null {
  if (!neighborhoodCode) return null;
  return [...segments]
    .filter((segment) => segment.geographyRef === neighborhoodCode)
    .sort((a, b) => b.riskScore - a.riskScore)[0] ?? null;
}

function buildAtlasScope(): AtlasRouteScope {
  const {
    activeStudy,
    selectedNeighborhood,
    selectedSegmentId,
  } = useCountyStudioStore.getState();

  return {
    studyId: activeStudy?.studyId ?? null,
    countyId: activeStudy?.countyId ?? null,
    countyName: activeStudy?.countyName ?? 'Benton',
    countyCode: null,
    segmentId: selectedSegmentId,
    neighborhoodCode: selectedNeighborhood,
    taxYear: activeStudy?.taxYear ?? 2026,
  };
}

interface EmbeddedAtlasGisWorkspaceProps {
  onViewportChange?: (viewport: CountyStudioAtlasViewport) => void;
  roleLens?: PrometheusRoleLensView;
}

export function EmbeddedAtlasGisWorkspace({ onViewportChange, roleLens }: EmbeddedAtlasGisWorkspaceProps = {}) {
  const {
    activeStudy,
    segments,
    selectedNeighborhood,
    selectedNeighborhoodRevalArea,
    selectedSegmentId,
    syncState,
    focusRiskSurfaceMapObject,
    setPendingSelection,
  } = useCountyStudioStore();
  const setAtlasStudyId = useAtlasLiveStore((state) => state.setStudyId);
  const setAtlasCountyScope = useAtlasLiveStore((state) => state.setCountyScope);
  const addOverlay = useAtlasLiveStore((state) => state.addOverlay);
  const removeOverlay = useAtlasLiveStore((state) => state.removeOverlay);
  const mapRef = useRef<unknown>(null);
  const [liveMap, setLiveMap] = useState<unknown | null>(null);
  const [selectedParcel, setSelectedParcel] = useState<ParcelTileProps | null>(null);
  const scope = useMemo(
    buildAtlasScope,
    [
      activeStudy?.studyId,
      activeStudy?.countyId,
      activeStudy?.countyName,
      activeStudy?.taxYear,
      selectedNeighborhood,
      selectedSegmentId,
    ],
  );

  const {
    countyContext,
    outlines,
    parcels,
    loading,
    error,
    scopeMessage,
  } = useAtlasMapData(scope);

  useEffect(() => {
    setAtlasStudyId(scope.studyId);
    setAtlasCountyScope({
      countyId: countyContext?.countyId ?? scope.countyId,
      countyName: countyContext?.countyName ?? scope.countyName,
      countyCode: countyContext?.countyCode ?? scope.countyCode,
      segmentId: scope.segmentId,
      neighborhoodCode: scope.neighborhoodCode,
    });
  }, [
    countyContext?.countyCode,
    countyContext?.countyId,
    countyContext?.countyName,
    scope.countyCode,
    scope.countyId,
    scope.countyName,
    scope.neighborhoodCode,
    scope.segmentId,
    scope.studyId,
    setAtlasCountyScope,
    setAtlasStudyId,
  ]);

  useEffect(() => {
    if (!parcels?.features.length || segments.length === 0) {
      removeOverlay('county-studio-valuation-risk');
      return;
    }

    addOverlay({
      id: 'county-studio-valuation-risk',
      type: 'metric-overlay',
      metricKey: 'riskScore',
      contractId: 'terraforge_operational_health_v1',
      sourcePopulation: 'County Studio active segment risk joined to Atlas parcel geometry',
      trustPosture: 'Forge-owned valuation overlay; Atlas remains GIS source of truth',
      styleHints: { fillOpacity: 0.82 },
      values: parcels.features.map((feature) => {
        const segment = strongestSegmentForNeighborhood(segments, feature.properties.neighborhoodCode);
        const value = segment?.riskScore ?? Math.abs(feature.properties.ratioDeviation ?? 0) * 100;
        return {
          parcelId: feature.properties.parcelId,
          segmentId: segment?.segmentId,
          value,
          color: riskColor(value),
        };
      }),
    });

    return () => removeOverlay('county-studio-valuation-risk');
  }, [addOverlay, parcels?.features, removeOverlay, segments]);

  const focusNeighborhood = (neighborhoodCode: string | null) => {
    const segment = strongestSegmentForNeighborhood(segments, neighborhoodCode);
    focusRiskSurfaceMapObject(
      neighborhoodCode,
      segment?.segmentId ?? null,
      segment?.revalArea ?? null,
    );
    setSelectedParcel(null);
  };

  const handleParcelClick = (parcel: ParcelTileProps) => {
    const segment = strongestSegmentForNeighborhood(segments, parcel.neighborhoodCode);
    focusRiskSurfaceMapObject(
      parcel.neighborhoodCode,
      segment?.segmentId ?? null,
      segment?.revalArea ?? null,
    );
    setPendingSelection({
      parcelIds: [parcel.parcelId],
      source: 'click',
      parcelCount: 1,
    });
    setSelectedParcel(parcel);
  };

  const openParcelWorkbench = () => {
    if (!selectedParcel) return;
    const segment = strongestSegmentForNeighborhood(segments, selectedParcel.neighborhoodCode);
    void activateModule('property-workbench', {
      source: 'system',
      metadata: {
        countyId: activeStudy?.countyId,
        taxYear: activeStudy?.taxYear,
        studyId: activeStudy?.studyId,
        parcelId: selectedParcel.parcelId,
        segmentId: segment?.segmentId ?? selectedSegmentId,
        neighborhoodCode: selectedParcel.neighborhoodCode,
        revalArea: segment?.revalArea ?? selectedNeighborhoodRevalArea,
        initialTab: 'atlas',
        tabs: {
          atlas: 'parcel-gis',
          forge: 'parcel-valuation',
          dossier: 'evidence',
        },
      },
    });
  };

  const visibleLayers = useMemo(
    () => new Set<V2LayerId>(['nbhd', 'parcels', 'outliers']),
    [],
  );
  const mapContext = useMemo(
    () => ({ mode: 'default' as const, label: 'County Studio valuation risk overlay' }),
    [],
  );
  const initialViewport = useMemo(
    () => ({
      center: BENTON_ATLAS_CENTER,
      zoom: BENTON_ATLAS_ZOOM,
    }),
    [],
  );
  const geometryStatus = countyContext?.geometryAvailability === 'sync_derived'
    ? 'TerraAtlas sync-derived geometry connected'
    : countyContext?.geometryAvailability === 'compatibility'
      ? 'Atlas compatibility geometry connected'
    : countyContext
      ? 'Atlas geometry scope connected; county geometry unpublished'
      : 'Atlas geometry scope loading';
  const topRiskSegments = useMemo(
    () => [...segments].sort((a, b) => b.riskScore - a.riskScore).slice(0, 3),
    [segments],
  );
  const activeLens = roleLens ?? {
    label: 'Roll Readiness',
    mapLens: 'Roll Readiness',
    posture: 'Benton County valuation health is being operated here.',
  };
  const disconnected = syncState === 'DISCONNECTED' || !countyContext;

  return (
    <section
      data-testid="county-studio-atlas-workspace"
      aria-label="Embedded TerraAtlas GIS valuation workspace"
      style={{
        height: 'clamp(300px, 33vh, 420px)',
        minHeight: 300,
        display: 'block',
        borderBottom: '1px solid hsl(var(--tf-border))',
        background: 'hsl(var(--tf-bg))',
        overflow: 'hidden',
      }}
    >
      <div
        data-testid="county-studio-embedded-atlas-canvas"
        data-layout-role="primary-center-surface"
        data-atlas-connected={countyContext ? 'true' : 'false'}
        style={{ position: 'relative', height: '100%', minHeight: 300, overflow: 'hidden' }}
      >
        <GeoForgeV2Map
          mapRef={mapRef}
          onMapReady={setLiveMap}
          outlines={outlines}
          parcels={parcels}
          selectedNeighborhoodCode={selectedNeighborhood}
          onNeighborhoodClick={focusNeighborhood}
          onParcelClick={handleParcelClick}
          onViewportChange={(bbox, zoom) => onViewportChange?.({ bbox, zoom })}
          visibleLayers={visibleLayers}
          mapCtx={mapContext}
          initialViewport={initialViewport}
        />
        <AtlasOverlayManager map={liveMap} />

        <div
          data-testid="prometheus-map-chrome"
          style={{
            position: 'absolute',
            top: 12,
            left: 12,
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            gap: 12,
            pointerEvents: 'none',
          }}
        >
          <div
            style={{
              padding: '8px 10px',
              border: '1px solid hsl(var(--tf-border))',
              background: 'hsl(var(--tf-bg) / 0.82)',
              color: 'hsl(var(--tf-fg))',
              backdropFilter: 'blur(8px)',
              borderRadius: 4,
              maxWidth: 390,
              maxHeight: 74,
              overflow: 'hidden',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 7, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 11, fontWeight: 900 }}>Lens: {activeLens.mapLens}</span>
              <span style={{ fontSize: 10, fontWeight: 900, color: 'hsl(var(--tf-accent, 217 91% 60%))' }}>
                Layers: Atlas live · Forge overlays read-only
              </span>
              <span style={{ fontSize: 10, color: 'hsl(var(--tf-muted))' }}>Embedded TerraAtlas GIS</span>
              <span style={{ fontSize: 10, color: 'hsl(var(--tf-muted))' }}>{geometryStatus}</span>
            </div>
            {disconnected && (
              <div
                data-testid="prometheus-atlas-degraded-state"
                style={{ marginTop: 5, fontSize: 10, color: 'hsl(var(--tf-warning, 38 92% 50%))' }}
              >
                Degraded mode: Atlas is disconnected or loading; ledger and inspector remain usable, live spatial proof is unavailable.
              </div>
            )}
            <div style={{ marginTop: 6, display: 'flex', gap: 5, flexWrap: 'wrap', fontSize: 10 }}>
              {(['Critical', 'High', 'Medium', 'Low'] as const).map((level) => (
                <span
                  key={level}
                  style={{
                    padding: '2px 5px',
                    border: '1px solid hsl(var(--tf-border))',
                    borderRadius: 4,
                    background: 'hsl(var(--tf-bg) / 0.68)',
                    color: level === 'Critical'
                      ? 'hsl(var(--tf-danger, 0 84% 60%))'
                      : level === 'High'
                        ? 'hsl(var(--tf-warning, 38 92% 50%))'
                        : level === 'Medium'
                          ? 'hsl(var(--tf-accent, 217 91% 60%))'
                          : 'hsl(var(--tf-success, 142 71% 45%))',
                    fontWeight: 900,
                  }}
                >
                  {level}
                </span>
              ))}
            </div>
          </div>
          <div
            data-testid="county-studio-atlas-sync-state"
            style={{
              padding: '6px 9px',
              border: '1px solid hsl(var(--tf-border))',
              background: 'hsl(var(--tf-bg) / 0.82)',
              color: syncState === 'DISCONNECTED' ? 'hsl(var(--tf-muted))' : 'hsl(var(--tf-success, 142 71% 45%))',
              fontSize: 10,
              fontWeight: 800,
              borderRadius: 4,
            }}
          >
            ATLAS {syncState}
          </div>
        </div>

        {topRiskSegments.map((segment, index) => (
          <div
            key={segment.segmentId}
            data-testid="prometheus-risk-map-label"
            data-marker-style="spatial-severity-marker"
            style={{
              position: 'absolute',
              top: `${126 + index * 42}px`,
              left: `${94 + index * 154}px`,
              maxWidth: 172,
              padding: '4px 6px',
              border: `1px solid ${riskChromeColor(segment.riskScore)}`,
              borderRadius: 4,
              background: 'hsl(var(--tf-bg) / 0.72)',
              color: 'hsl(var(--tf-fg))',
              boxShadow: index === 0
                ? `0 0 0 34px ${riskChromeColor(segment.riskScore)}16, 0 0 0 2px ${riskChromeColor(segment.riskScore)}44`
                : `0 0 0 18px ${riskChromeColor(segment.riskScore)}10`,
              backdropFilter: 'blur(8px)',
              fontSize: 10,
              pointerEvents: 'none',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span
                aria-hidden="true"
                style={{
                  width: 9,
                  height: 9,
                  borderRadius: '50%',
                  background: riskChromeColor(segment.riskScore),
                  boxShadow: `0 0 0 6px ${riskChromeColor(segment.riskScore)}30`,
                  flexShrink: 0,
                }}
              />
              <div style={{ minWidth: 0 }}>
                <div style={{ fontWeight: 900, color: riskChromeColor(segment.riskScore), whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {riskLevel(segment.riskScore)} · NBHD {segment.geographyRef ?? 'unassigned'}
                </div>
                <div style={{ marginTop: 1, color: 'hsl(var(--tf-muted))', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {activeLens.mapLens} · COD {segment.cod?.toFixed(1) ?? 'n/a'} · PRD {segment.prd?.toFixed(3) ?? 'n/a'}
                </div>
              </div>
            </div>
          </div>
        ))}

        {(loading || error) && (
          <div
            data-testid={error ? 'county-studio-atlas-error' : 'county-studio-atlas-loading'}
            role={error ? 'alert' : 'status'}
            style={{
              position: 'absolute',
              bottom: 12,
              left: 12,
              padding: '7px 9px',
              border: `1px solid ${error ? 'hsl(var(--tf-danger, 0 84% 60%) / 0.42)' : 'hsl(var(--tf-accent, 217 91% 60%) / 0.42)'}`,
              background: error ? 'hsl(var(--tf-danger, 0 84% 60%) / 0.14)' : 'hsl(var(--tf-accent, 217 91% 60%) / 0.14)',
              color: error ? 'hsl(var(--tf-danger, 0 84% 60%))' : 'hsl(var(--tf-accent, 217 91% 60%))',
              fontSize: 11,
              fontWeight: 700,
              borderRadius: 4,
            }}
          >
            {error ? `Atlas map data unavailable: ${error}` : 'Loading Atlas geometry and layer configuration'}
          </div>
        )}

        {selectedParcel && (
          <div
            data-testid="county-studio-selected-parcel-action"
            style={{
              position: 'absolute',
              bottom: 12,
              right: 12,
              width: 280,
              padding: 10,
              border: '1px solid hsl(var(--tf-border))',
              background: 'hsl(var(--tf-bg) / 0.88)',
              color: 'hsl(var(--tf-fg))',
              backdropFilter: 'blur(8px)',
              borderRadius: 4,
            }}
          >
            <div style={{ fontSize: 11, color: 'hsl(var(--tf-muted))', textTransform: 'uppercase', fontWeight: 800 }}>
              Parcel Evidence
            </div>
            <div style={{ marginTop: 3, fontSize: 13, fontWeight: 900 }}>{selectedParcel.parcelId}</div>
            <div style={{ marginTop: 3, fontSize: 10, color: 'hsl(var(--tf-muted))' }}>
              Neighborhood {selectedParcel.neighborhoodCode ?? 'n/a'} · Ratio {selectedParcel.ratio?.toFixed(3) ?? 'n/a'}
            </div>
            <button
              type="button"
              data-testid="county-studio-open-parcel-workbench"
              onClick={openParcelWorkbench}
              style={{
                marginTop: 8,
                width: '100%',
                padding: '7px 9px',
                border: '1px solid hsl(var(--tf-accent, 217 91% 60%) / 0.42)',
                background: 'hsl(var(--tf-accent, 217 91% 60%) / 0.18)',
                color: 'hsl(var(--tf-accent, 217 91% 60%))',
                fontSize: 11,
                fontWeight: 800,
                cursor: 'pointer',
                borderRadius: 4,
              }}
            >
              Open Property Workbench
            </button>
          </div>
        )}
      </div>
    </section>
  );
}

import { useEffect, useState } from 'react';
import type {
  AtlasCountyContext,
  AtlasRouteScope,
} from '../atlasLiveApi';
import {
  fetchAtlasCompatibilityMapData,
  fetchAtlasCountyContext,
  fetchTerraAtlasParcelGeometryMapData,
} from '../atlasLiveApi';
import type {
  NbhdOutlineCollection,
  ParcelTileCollection,
} from '../../geo/v2/v2Api';

export interface AtlasMapData {
  countyContext: AtlasCountyContext | null;
  outlines: NbhdOutlineCollection | null;
  parcels: ParcelTileCollection | null;
  loading: boolean;
  error: string | null;
  scopeMessage: string | null;
}

const UNSCOPED_MESSAGE = 'Open Atlas Live View from County Studio to load county-scoped map context.';

export function useAtlasMapData(scope: AtlasRouteScope): AtlasMapData {
  const [countyContext, setCountyContext] = useState<AtlasCountyContext | null>(null);
  const [outlines, setOutlines] = useState<NbhdOutlineCollection | null>(null);
  const [parcels, setParcels] = useState<ParcelTileCollection | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [scopeMessage, setScopeMessage] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    let cancelled = false;

    setLoading(true);
    setError(null);
    setScopeMessage(null);
    setCountyContext(null);
    setOutlines(null);
    setParcels(null);

    const resolvedCountyName = scope.countyName?.trim() || null;
    const resolvedCountyCode = scope.countyCode?.trim() || null;
    const canResolveScope = Boolean(
      resolvedCountyName
      || resolvedCountyCode
      || scope.countyId,
    );

    if (!canResolveScope) {
      setScopeMessage(UNSCOPED_MESSAGE);
      setLoading(false);
      return () => {
        controller.abort();
      };
    }

    const load = async () => {
      try {
        const context = await fetchAtlasCountyContext(scope, controller.signal);
        if (cancelled) return;

        if (!context) {
          setError('County context unavailable for this Atlas session.');
          return;
        }

        setCountyContext(context);
        setScopeMessage(context.geometryMessage);

        if (context.geometryAvailability === 'sync_derived' && context.countyId) {
          const mapData = await fetchTerraAtlasParcelGeometryMapData({
            countyId: context.countyId,
            taxYear: context.taxYear,
            studyId: context.studyId,
            neighborhoodCode: context.neighborhoodCode,
            segmentId: context.segmentId,
            limit: 5000,
            signal: controller.signal,
          });

          if (cancelled) return;

          setOutlines(mapData.outlines);
          setParcels(mapData.parcels);
          return;
        }

        if (context.geometryAvailability !== 'compatibility') {
          return;
        }

        const mapData = await fetchAtlasCompatibilityMapData(
          context.countyCode,
          context.taxYear,
          context.neighborhoodCode,
          controller.signal,
        );

        if (cancelled) return;

        setOutlines(mapData.outlines);
        setParcels(mapData.parcels);
      } catch (loadError) {
        if (cancelled) return;
        const message = loadError instanceof Error
          ? loadError.message
          : 'Atlas map data unavailable.';
        setError(message);
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void load();

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [
    scope.countyCode,
    scope.countyId,
    scope.countyName,
    scope.neighborhoodCode,
    scope.segmentId,
    scope.studyId,
    scope.taxYear,
  ]);

  return {
    countyContext,
    outlines,
    parcels,
    loading,
    error,
    scopeMessage,
  };
}

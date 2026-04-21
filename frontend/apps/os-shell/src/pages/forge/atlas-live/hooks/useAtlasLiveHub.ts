import { useEffect, useRef } from 'react';
import * as signalR from '@microsoft/signalr';
import { useAtlasLiveStore } from '@/stores/atlasLiveStore';
import type {
  ProjectionEvent,
  DrawnGeometrySelection,
  ParcelIdsSelection,
} from '../types/atlasLive.types';

const HUB_URL = '/api/hubs/county-study';

/**
 * Atlas Live View ↔ CountyStudyHub SignalR subscriber.
 * Atlas is a SESSION SUBSCRIBER — joins same StudyId group as Studio.
 * Channel B (Projection) — RECEIVES from Forge → applies to atlasLiveStore overlays
 * Channel C (Selection)  — SENDS to Forge → Studio places into pendingSelection
 * Atlas NEVER calls BroadcastCommit. That is Studio's exclusive write-lane.
 */
export function useAtlasLiveHub(studyId: string | null) {
  const { setSyncState, addOverlay, clearOverlays } = useAtlasLiveStore.getState();
  const connectionRef = useRef<signalR.HubConnection | null>(null);

  useEffect(() => {
    if (!studyId) return;

    const connection = new signalR.HubConnectionBuilder()
      .withUrl(HUB_URL)
      .withAutomaticReconnect()
      .build();

    connectionRef.current = connection;

    connection.on('ReceivePresence', (_event: unknown) => {});

    connection.on('ReceiveProjection', (event: { type: string; payload: unknown }) => {
      const projection = event as unknown as ProjectionEvent;

      switch (projection.type) {
        case 'projection:metric-overlay':
          addOverlay({
            id: `metric-${projection.studyId}`,
            type: 'metric-overlay',
            metricKey: projection.metricKey,
            values: projection.values,
            styleHints: projection.styleHints,
          });
          break;

        case 'projection:scenario-delta':
          addOverlay({
            id: `delta-${projection.scenarioId}`,
            type: 'scenario-delta',
            metricKey: null,
            values: projection.deltas.map((d) => ({ parcelId: d.parcelId, value: d.deltaPercent })),
            styleHints: { cohortBbox: projection.cohortBbox },
          });
          break;

        case 'projection:cohort-shade':
          addOverlay({
            id: `cohort-${projection.cohortId}`,
            type: 'cohort-shade',
            metricKey: null,
            values: projection.parcelIds.map((id) => ({ parcelId: id, value: 1 })),
            styleHints: projection.style,
          });
          break;

        case 'projection:edge-warnings':
          addOverlay({
            id: `warnings-${projection.studyId}`,
            type: 'edge-warnings',
            metricKey: null,
            values: projection.warnings.map((w) => ({
              parcelId: w.boundaryId,
              value: w.severity === 'high' ? 3 : w.severity === 'medium' ? 2 : 1,
            })),
            styleHints: {},
          });
          break;

        case 'projection:clear':
          clearOverlays(projection.layerIds);
          break;
      }
    });

    connection.on('ReceiveSelection', (_event: unknown) => {});

    connection.on('ReceiveCommit', (_event: unknown) => {});

    const start = async () => {
      try {
        await connection.start();
        await connection.invoke('JoinStudy', studyId);
        setSyncState('LIVE');
      } catch (err) {
        setSyncState('DISCONNECTED');
        console.error('[AtlasLiveHub] connection failed:', err);
      }
    };

    start();

    connection.onreconnected(() => setSyncState('LIVE'));
    connection.onreconnecting(() => setSyncState('DISCONNECTED'));
    connection.onclose(() => setSyncState('DISCONNECTED'));

    return () => {
      connection.invoke('LeaveStudy', studyId).catch(() => {});
      connection.stop().catch(() => {});
      setSyncState('DISCONNECTED');
      connectionRef.current = null;
    };
  }, [studyId]);

  const sendSelection = async (
    selection: DrawnGeometrySelection | ParcelIdsSelection
  ) => {
    if (!connectionRef.current || !studyId) return;
    await connectionRef.current.invoke('SendSelection', studyId, selection);
  };

  return { sendSelection, connection: connectionRef };
}

import { useEffect, useRef } from 'react';
import * as signalR from '@microsoft/signalr';
import { useCountyStudioStore } from '@/stores/countyStudioStore';
import { getCountyStudyScope } from '../countyStudyScope';

const HUB_URL = '/api/hubs/county-study';

export function useCountyStudyHub(studyId: string | null) {
  const { setSyncState, setPendingSelection, pushPeerPresence, pushIncomingProjection } =
    useCountyStudioStore.getState();
  const connectionRef = useRef<signalR.HubConnection | null>(null);

  useEffect(() => {
    if (!studyId) return;
    const countyScope = getCountyStudyScope();
    if (!countyScope.isolated || !countyScope.countyId) {
      setSyncState('DISCONNECTED');
      return;
    }

    const connection = new signalR.HubConnectionBuilder()
      .withUrl(`${HUB_URL}?countyId=${encodeURIComponent(countyScope.countyId)}`)
      .withAutomaticReconnect()
      .build();

    connectionRef.current = connection;

    // Presence events from other clients on the same study (hub broadcasts to
    // OthersInGroup). Append to the store's bounded ring buffer so LeftRail
    // and the peer-count badge can reflect remote activity.
    connection.on('ReceivePresence', (event: { type: string; payload?: unknown } | unknown) => {
      try {
        const e = event as { type?: string; payload?: { segmentId?: string; actorId?: string } };
        pushPeerPresence({
          type: e.type ?? 'presence:unknown',
          segmentId: e.payload?.segmentId,
          actorId: e.payload?.actorId,
          at: Date.now(),
        });
      } catch {
        // Malformed presence payloads are discarded silently — they never
        // affect valuation, only UI-state hints.
      }
    });

    // Projection events from peers (typically Atlas Live View broadcasts
    // metric-overlay / scenario-delta / cohort-shade / edge-warnings / clear).
    // The 'clear' type flushes the ring buffer rather than appending.
    connection.on('ReceiveProjection', (event: { type: string; payload?: unknown } | unknown) => {
      try {
        const e = event as { type?: string; payload?: unknown };
        pushIncomingProjection({
          type: e.type ?? 'projection:unknown',
          payload: e.payload ?? null,
          at: Date.now(),
        });
      } catch {
        // As with presence, malformed projections are dropped — Atlas will
        // broadcast again on the next user action.
      }
    });

    connection.on('ReceiveSelection', (event: { type: string; payload: unknown }) => {
      if (event.type === 'selection:parcel-ids') {
        const payload = event.payload as {
          studyId: string;
          parcelIds: string[];
          source: 'click' | 'lasso' | 'box';
        };
        setPendingSelection({
          parcelIds: payload.parcelIds,
          source: payload.source,
          parcelCount: payload.parcelIds.length,
        });
      } else if (event.type === 'selection:drawn-geometry') {
        const payload = event.payload as {
          studyId: string;
          geometry: unknown;
          parcelCount: number;
          areaEstimate?: number;
        };
        setPendingSelection({
          parcelIds: [],
          source: 'lasso',
          parcelCount: payload.parcelCount,
          geometry: payload.geometry as unknown,
          areaEstimate: payload.areaEstimate,
        });
      }
    });

    connection.on('ReceiveCommit', (event: { type: string; payload: unknown }) => {
      if (event.type === 'commit:create-cohort') {
        setPendingSelection(null);
      }
    });

    const start = async () => {
      try {
        await connection.start();
        await connection.invoke('JoinStudy', studyId);
        setSyncState('LIVE');
      } catch (err) {
        setSyncState('DISCONNECTED');
        console.error('[CountyStudyHub] connection failed:', err);
      }
    };

    start();

    connection.onreconnected(() => setSyncState('LIVE'));
    connection.onreconnecting(() => setSyncState('DISCONNECTED'));
    connection.onclose(() => setSyncState('DISCONNECTED'));

    return () => {
      connection.invoke('LeaveStudy', studyId).catch(() => undefined);
      connection.stop().catch(() => undefined);
      setSyncState('DISCONNECTED');
      connectionRef.current = null;
    };
  }, [studyId]);

  const sendPresence = async (type: 'presence:segment-hover' | 'presence:segment-select', segmentId: string) => {
    if (!connectionRef.current || !studyId) return;
    try {
      await connectionRef.current.invoke('SendPresence', studyId, { type, payload: { studyId, segmentId } });
    } catch {
      return;
    }
  };

  const sendProjection = async (type: string, payload: unknown) => {
    if (!connectionRef.current || !studyId) return;
    try {
      await connectionRef.current.invoke('SendProjection', studyId, { type, payload });
    } catch {
      return;
    }
  };

  const sendCommit = async (type: string, payload: unknown) => {
    if (!connectionRef.current || !studyId) return;
    await connectionRef.current.invoke('BroadcastCommit', studyId, { type, payload });
  };

  return { sendPresence, sendProjection, sendCommit, connection: connectionRef };
}

import { useEffect, useRef } from 'react';
import * as signalR from '@microsoft/signalr';
import { useCountyStudioStore } from '@/stores/countyStudioStore';

const HUB_URL = '/api/hubs/county-study';

export function useCountyStudyHub(studyId: string | null) {
  const { setSyncState, setPendingSelection } = useCountyStudioStore.getState();
  const connectionRef = useRef<signalR.HubConnection | null>(null);

  useEffect(() => {
    if (!studyId) return;

    const connection = new signalR.HubConnectionBuilder()
      .withUrl(HUB_URL)
      .withAutomaticReconnect()
      .build();

    connectionRef.current = connection;

    connection.on('ReceivePresence', (_event: unknown) => {});

    connection.on('ReceiveProjection', (_event: unknown) => {});

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
      connection.invoke('LeaveStudy', studyId).catch(() => {});
      connection.stop().catch(() => {});
      setSyncState('DISCONNECTED');
      connectionRef.current = null;
    };
  }, [studyId]);

  const sendPresence = async (type: 'presence:segment-hover' | 'presence:segment-select', segmentId: string) => {
    if (!connectionRef.current || !studyId) return;
    try {
      await connectionRef.current.invoke('SendPresence', studyId, { type, payload: { studyId, segmentId } });
    } catch {}
  };

  const sendProjection = async (type: string, payload: unknown) => {
    if (!connectionRef.current || !studyId) return;
    try {
      await connectionRef.current.invoke('SendProjection', studyId, { type, payload });
    } catch {}
  };

  const sendCommit = async (type: string, payload: unknown) => {
    if (!connectionRef.current || !studyId) return;
    await connectionRef.current.invoke('BroadcastCommit', studyId, { type, payload });
  };

  return { sendPresence, sendProjection, sendCommit, connection: connectionRef };
}

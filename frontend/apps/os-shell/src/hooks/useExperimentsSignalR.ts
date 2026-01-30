import * as signalR from '@microsoft/signalr';
import { useEffect, useRef } from 'react';

export function useExperimentsSignalR(onRunUpdate: (payload: any) => void) {
  const connRef = useRef<signalR.HubConnection | null>(null);

  useEffect(() => {
    const conn = new signalR.HubConnectionBuilder()
      .withUrl('/hubs/experiments')
      .withAutomaticReconnect()
      .build();

    conn.on('ExperimentRunUpdate', (payload) => {
      onRunUpdate(payload);
    });

    conn.start().catch(() => {
      // ignore
    });

    connRef.current = conn;

    return () => {
      connRef.current?.stop();
    };
  }, [onRunUpdate]);
}

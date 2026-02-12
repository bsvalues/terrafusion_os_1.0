import React, { useState, useEffect } from 'react';
import { ConnectionNotification } from './connection-notification';
import { ConnectionStatus, TransportType } from './connection-status-badge';
import { useAgentWebSocket } from '@/hooks/use-agent-websocket';

/**
 * Global Connection Notification
 *
 * This component wraps the ConnectionNotification component
 * and provides it with connection status from a global WebSocket
 * connection, ensuring notifications about connectivity are
 * shown throughout the application.
 */
export const GlobalConnectionNotification: React.FC = () => {
  // Global connection status state
  const [globalStatus, setGlobalStatus] = useState<ConnectionStatus>('disconnected');
  const [globalTransport, setGlobalTransport] = useState<TransportType>('websocket');
  const [reconnectCount, setReconnectCount] = useState(0);

  // Determine WebSocket URL
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const wsUrl = `${protocol}//${window.location.host}/ws`;

  // Connect to the main WebSocket
  const {
    status: wsStatus,
    transport: wsTransport,
    metrics: wsMetrics,
    reconnect: reconnectWebSocket,
  } = useAgentWebSocket({
    url: wsUrl,
    autoReconnect: true,
  });

  // Update global status based on WebSocket status
  useEffect(() => {
    setGlobalStatus(wsStatus);
    setGlobalTransport(wsTransport);

    if (wsMetrics) {
      setReconnectCount(wsMetrics.reconnectCount);
    }
  }, [wsStatus, wsTransport, wsMetrics]);

  // Handle manual reconnection
  const handleReconnect = () => {
    reconnectWebSocket();
  };

  return (
    <ConnectionNotification
      status={globalStatus}
      transport={globalTransport}
      reconnectCount={reconnectCount}
      onReconnect={handleReconnect}
      showToast={true}
      showFallbackNotification={true}
      showReconnectionAttempts={true}
    />
  );
};

export default GlobalConnectionNotification;

import React, { useEffect, useState } from 'react';
import { useAgentWebSocket } from '@/hooks/use-agent-websocket';
import { useAgentSocketIO } from '@/hooks/use-agent-socketio';
import { ConnectionStatus, TransportType } from './connection-status-badge';
import { useToast } from '@/hooks/use-toast';

interface ConnectionStatusMonitorProps {
  /**
   * Polling interval in milliseconds for health checks
   * @default 60000 (1 minute)
   */
  pollInterval?: number;

  /**
   * Whether to show notifications for connection changes
   * @default true
   */
  showNotifications?: boolean;

  /**
   * Whether to automatically attempt reconnection on error
   * @default true
   */
  autoReconnect?: boolean;

  /**
   * WebSocket URL to use for health checks
   * If not provided, will use current origin with /ws path
   */
  wsUrl?: string;

  /**
   * Socket.IO URL to use for fallback
   * If not provided, will use current origin
   */
  socketIoUrl?: string;
}

/**
 * A hidden component that monitors connection status and maintains
 * connectivity to the server. This component provides real-time
 * status updates and handles reconnection logic.
 */
export const ConnectionStatusMonitor: React.FC<ConnectionStatusMonitorProps> = ({
  pollInterval = 60000,
  showNotifications = true,
  autoReconnect = true,
  wsUrl = '',
  socketIoUrl = '',
}) => {
  const { toast } = useToast();
  const [globalStatus, setGlobalStatus] = useState<ConnectionStatus>('disconnected');
  const [globalTransport, setGlobalTransport] = useState<TransportType>('websocket');

  // Determine WebSocket URL if not provided
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const defaultWsUrl = `${protocol}//${window.location.host}/ws`;
  const effectiveWsUrl = wsUrl || defaultWsUrl;

  // Determine Socket.IO URL if not provided
  const defaultSocketIoUrl = window.location.origin;
  const effectiveSocketIoUrl = socketIoUrl || defaultSocketIoUrl;

  // WebSocket connection for health monitoring
  const {
    status: wsStatus,
    transport: wsTransport,
    metrics: wsMetrics,
  } = useAgentWebSocket({
    url: effectiveWsUrl,
    autoReconnect,
    onMessage: event => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'health' || data.type === 'status') {
          // Process health/status updates if needed
        }
      } catch (e) {
        // Not JSON or doesn't have expected format
      }
    },
  });

  // Socket.IO connection as fallback
  const {
    status: socketIoStatus,
    transport: socketIoTransport,
    metrics: socketIoMetrics,
  } = useAgentSocketIO({
    url: effectiveSocketIoUrl,
    autoReconnect,
    events: [
      {
        name: 'health',
        handler: data => {
          // Process health updates if needed
        },
      },
      {
        name: 'status',
        handler: data => {
          // Process status updates if needed
        },
      },
    ],
  });

  // Update global status based on WebSocket and Socket.IO status
  useEffect(() => {
    // Priority order: WebSocket > Socket.IO
    if (wsStatus === 'connected') {
      setGlobalStatus('connected');
      setGlobalTransport('websocket');
    } else if (socketIoStatus === 'connected') {
      setGlobalStatus('connected');
      setGlobalTransport(socketIoTransport);
    } else if (wsStatus === 'connecting' || socketIoStatus === 'connecting') {
      setGlobalStatus('connecting');
    } else if (wsStatus === 'error' && socketIoStatus === 'error') {
      setGlobalStatus('error');
    } else {
      setGlobalStatus('disconnected');
    }
  }, [wsStatus, socketIoStatus, socketIoTransport]);

  // Send periodic health check ping
  useEffect(() => {
    if (pollInterval <= 0) return;

    const sendHealthCheck = () => {
      // Try WebSocket first, then Socket.IO if WebSocket is not connected
      if (wsStatus === 'connected') {
        // Do nothing, the connection itself serves as the health check
      } else if (socketIoStatus === 'connected') {
        // Do nothing, the connection itself serves as the health check
      }
    };

    // Immediately send health check and then set interval
    sendHealthCheck();
    const intervalId = setInterval(sendHealthCheck, pollInterval);

    return () => clearInterval(intervalId);
  }, [wsStatus, socketIoStatus, pollInterval]);

  // Notify on transport type changes (e.g., WebSocket to polling)
  useEffect(() => {
    if (!showNotifications) return;

    if (globalTransport === 'polling' && globalStatus === 'connected') {
      toast({
        title: 'Using fallback connection',
        description:
          'Your connection is using HTTP polling instead of WebSockets, which may impact performance.',
        duration: 5000,
      });
    }
  }, [globalTransport, globalStatus, showNotifications, toast]);

  // This component doesn't render anything visible
  return null;
};

// Using named export only for consistency

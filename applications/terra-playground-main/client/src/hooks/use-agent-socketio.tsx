import { useState, useEffect, useRef, useCallback } from 'react';
import { ConnectionStatus, TransportType } from '@/components/connection-status-badge';
import { ConnectionMetrics } from '@/components/connection-health-metrics';
import io, { Socket } from 'socket.io-client';

interface SocketEvent {
  name: string;
  handler: (data: any) => void;
}

interface UseAgentSocketIOProps {
  /**
   * Socket.IO server URL
   * If not provided, will use current origin
   */
  url?: string;

  /**
   * Additional Socket.IO options
   */
  options?: {
    /**
     * Timeout in milliseconds for connection attempts
     * @default 10000
     */
    timeout?: number;

    /**
     * Whether to automatically reconnect on disconnect
     * @default true
     */
    reconnection?: boolean;

    /**
     * Maximum number of reconnection attempts
     * @default 5
     */
    reconnectionAttempts?: number;

    /**
     * Initial delay between reconnection attempts in milliseconds
     * @default 1000
     */
    reconnectionDelay?: number;

    /**
     * Maximum delay between reconnection attempts in milliseconds
     * @default 5000
     */
    reconnectionDelayMax?: number;

    /**
     * Multiplier for reconnection delay
     * @default 1.5
     */
    reconnectionFactor?: number;

    /**
     * List of transports to use, in priority order
     * @default ['websocket', 'polling']
     */
    transports?: string[];

    /**
     * Whether to upgrade to WebSocket if possible
     * @default true
     */
    upgrade?: boolean;

    /**
     * Additional Socket.IO options
     */
    [key: string]: any;
  };

  /**
   * Whether to automatically reconnect on disconnect
   * @default true
   */
  autoReconnect?: boolean;

  /**
   * Events to listen for
   */
  events?: SocketEvent[];

  /**
   * Handler for connection
   */
  onConnect?: () => void;

  /**
   * Handler for disconnection
   */
  onDisconnect?: (reason: string) => void;

  /**
   * Handler for connection error
   */
  onError?: (error: Error) => void;
}

/**
 * Hook for managing Socket.IO connections to agent services
 *
 * This hook provides a consistent way to manage Socket.IO connections
 * across the application, with built-in reconnection logic, status
 * tracking, and connection metrics.
 */
export const useAgentSocketIO = ({
  url,
  options,
  autoReconnect = true,
  events = [],
  onConnect,
  onDisconnect,
  onError,
}: UseAgentSocketIOProps) => {
  // Socket.IO state
  const [status, setStatus] = useState<ConnectionStatus>('disconnected');
  const [transport, setTransport] = useState<TransportType>('websocket');
  const socketRef = useRef<Socket | null>(null);

  // Track connection metrics
  const [metrics, setMetrics] = useState<ConnectionMetrics>({
    latency: 0,
    uptime: 0,
    messageCount: 0,
    reconnectCount: 0,
    lastMessageTime: null,
    failedAttempts: 0,
    transportType: 'websocket',
  });

  // Track connection start time for uptime calculation
  const connectionStartTimeRef = useRef<number | null>(null);
  const pingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Determine actual Socket.IO URL
  const getSocketIOUrl = useCallback(() => {
    return url || window.location.origin;
  }, [url]);

  // Update metrics periodically
  useEffect(() => {
    const updateUptimeMetrics = () => {
      if (status === 'connected' && connectionStartTimeRef.current) {
        const uptimeMs = Date.now() - connectionStartTimeRef.current;
        const uptimeSeconds = uptimeMs / 1000;

        // Calculate uptime percentage (max 100)
        const uptimePercentage = Math.min(100, (uptimeSeconds / 60) * 100);

        setMetrics(prev => ({
          ...prev,
          uptime: Math.floor(uptimePercentage),
        }));
      }
    };

    const intervalId = setInterval(updateUptimeMetrics, 1000);

    return () => clearInterval(intervalId);
  }, [status]);

  // Send ping to measure latency
  const sendPing = useCallback(() => {
    if (socketRef.current && socketRef.current.connected) {
      try {
        const startTime = Date.now();

        socketRef.current.emit('ping', {}, () => {
          const latency = Date.now() - startTime;

          setMetrics(prev => ({
            ...prev,
            latency,
          }));
        });
      } catch (error) {
        console.error('Error sending ping:', error);
      }
    }
  }, []);

  // Clean up existing connection
  const cleanupSocketIO = useCallback(() => {
    if (socketRef.current) {
      // Remove all event listeners
      events.forEach(event => {
        socketRef.current?.off(event.name);
      });

      // Remove core event handlers
      socketRef.current.off('connect');
      socketRef.current.off('disconnect');
      socketRef.current.off('connect_error');
      socketRef.current.off('reconnect');
      socketRef.current.off('reconnect_attempt');
      socketRef.current.off('reconnect_error');
      socketRef.current.off('reconnect_failed');

      // Disconnect the socket
      socketRef.current.disconnect();
      socketRef.current = null;
    }

    // Clear ping interval
    if (pingIntervalRef.current) {
      clearInterval(pingIntervalRef.current);
      pingIntervalRef.current = null;
    }

    connectionStartTimeRef.current = null;
  }, [events]);

  // Set up a new Socket.IO connection
  const setupSocketIO = useCallback(() => {
    cleanupSocketIO();

    try {
      setStatus('connecting');

      const socketUrl = getSocketIOUrl();
      // Default options with good practices
      const defaultOptions = {
        reconnection: autoReconnect,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        reconnectionFactor: 1.5,
        timeout: 10000,
        transports: ['websocket', 'polling'],
        upgrade: true,
      };

      // Create Socket.IO instance
      socketRef.current = io(socketUrl, {
        ...defaultOptions,
        ...options,
      });

      // Set up event handlers
      socketRef.current.on('connect', () => {
        setStatus('connected');
        connectionStartTimeRef.current = Date.now();

        // Get current transport
        if (socketRef.current?.io?.engine?.transport?.name) {
          const transportName = socketRef.current.io.engine.transport.name;
          setTransport(transportName === 'websocket' ? 'websocket' : 'polling');

          setMetrics(prev => ({
            ...prev,
            transportType: transportName === 'websocket' ? 'websocket' : 'polling',
          }));
        }

        // Start ping interval
        pingIntervalRef.current = setInterval(sendPing, 30000);

        // Send initial ping
        sendPing();

        // Update metrics
        setMetrics(prev => ({
          ...prev,
          uptime: 1, // start at 1%
          failedAttempts: 0,
        }));

        // Call user-provided onConnect handler
        if (onConnect) {
          onConnect();
        }
      });

      socketRef.current.on('disconnect', (reason: string) => {
        setStatus('disconnected');

        // Update metrics
        setMetrics(prev => ({
          ...prev,
          uptime: 0,
        }));

        // Call user-provided onDisconnect handler
        if (onDisconnect) {
          onDisconnect(reason);
        }
      });

      socketRef.current.on('connect_error', (error: Error) => {
        console.error('Socket.IO connection error:', error);

        // Update metrics
        setMetrics(prev => ({
          ...prev,
          failedAttempts: prev.failedAttempts + 1,
        }));

        // Call user-provided onError handler
        if (onError) {
          onError(error);
        }
      });

      socketRef.current.on('reconnect_attempt', (attemptNumber: number) => {
        setStatus('connecting');

        // Update metrics
        setMetrics(prev => ({
          ...prev,
          reconnectCount: prev.reconnectCount + 1,
        }));
      });

      socketRef.current.on('reconnect_failed', () => {
        setStatus('error');
      });

      // Detect transport changes (e.g., websocket to polling)
      socketRef.current.io.engine.on('upgrade', (transport: any) => {
        setTransport(transport.name === 'websocket' ? 'websocket' : 'polling');

        setMetrics(prev => ({
          ...prev,
          transportType: transport.name === 'websocket' ? 'websocket' : 'polling',
        }));
      });

      // Set up user-defined event handlers
      events.forEach(event => {
        socketRef.current?.on(event.name, (data: any) => {
          // Call the handler
          event.handler(data);

          // Update metrics
          setMetrics(prev => ({
            ...prev,
            messageCount: prev.messageCount + 1,
            lastMessageTime: new Date(),
          }));
        });
      });
    } catch (error) {
      console.error('Error creating Socket.IO connection:', error);
      setStatus('error');

      // Update metrics
      setMetrics(prev => ({
        ...prev,
        failedAttempts: prev.failedAttempts + 1,
      }));
    }
  }, [
    autoReconnect,
    cleanupSocketIO,
    events,
    getSocketIOUrl,
    onConnect,
    onDisconnect,
    onError,
    options,
    sendPing,
  ]);

  // Function to manually reconnect
  const reconnect = useCallback(() => {
    setupSocketIO();
  }, [setupSocketIO]);

  // Send message
  const send = useCallback((eventName: string, data: any, callback?: (response: any) => void) => {
    if (!socketRef.current || !socketRef.current.connected) {
      console.error('Socket.IO is not connected');
      return false;
    }

    try {
      if (callback) {
        socketRef.current.emit(eventName, data, callback);
      } else {
        socketRef.current.emit(eventName, data);
      }

      // Update metrics for sent message
      setMetrics(prev => ({
        ...prev,
        messageCount: prev.messageCount + 1,
      }));

      return true;
    } catch (error) {
      console.error(`Error sending Socket.IO message to ${eventName}:`, error);
      return false;
    }
  }, []);

  // Set up Socket.IO on hook mount
  useEffect(() => {
    setupSocketIO();

    // Clean up on unmount
    return () => {
      cleanupSocketIO();
    };
  }, [setupSocketIO, cleanupSocketIO]);

  return {
    status,
    transport,
    metrics,
    send,
    reconnect,
    close: cleanupSocketIO,
    socket: socketRef.current,
  };
};

export default useAgentSocketIO;

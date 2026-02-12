import { useState, useEffect, useRef, useCallback } from 'react';
import { ConnectionStatus, TransportType } from '@/components/connection-status-badge';
import { ConnectionMetrics } from '@/components/connection-health-metrics';

interface UseAgentWebSocketProps {
  /**
   * WebSocket URL to connect to
   * If not provided, will use current origin with /ws path
   */
  url?: string;

  /**
   * Whether to automatically reconnect on disconnect
   * @default true
   */
  autoReconnect?: boolean;

  /**
   * Maximum number of reconnection attempts
   * @default 5
   */
  maxReconnectAttempts?: number;

  /**
   * Base delay between reconnection attempts in milliseconds
   * Will increase with backoff factor on each attempt
   * @default 1000
   */
  reconnectDelay?: number;

  /**
   * Backoff factor for reconnect delay
   * @default 1.5
   */
  backoffFactor?: number;

  /**
   * Handler for incoming messages
   */
  onMessage?: (event: MessageEvent) => void;

  /**
   * Handler for connection open
   */
  onOpen?: (event: Event) => void;

  /**
   * Handler for connection close
   */
  onClose?: (event: CloseEvent) => void;

  /**
   * Handler for connection error
   */
  onError?: (event: Event) => void;
}

/**
 * Hook for managing WebSocket connections to agent services
 *
 * This hook provides a consistent way to manage WebSocket connections
 * across the application, with built-in reconnection logic, status
 * tracking, and connection metrics.
 */
export const useAgentWebSocket = ({
  url,
  autoReconnect = true,
  maxReconnectAttempts = 5,
  reconnectDelay = 1000,
  backoffFactor = 1.5,
  onMessage,
  onOpen,
  onClose,
  onError,
}: UseAgentWebSocketProps) => {
  // WebSocket state
  const [status, setStatus] = useState<ConnectionStatus>('disconnected');
  const [transport] = useState<TransportType>('websocket');
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectAttemptRef = useRef<number>(0);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

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
  const lastPingTimestampRef = useRef<number | null>(null);

  // Determine actual WebSocket URL
  const getWebSocketUrl = useCallback(() => {
    if (url) return url;

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    return `${protocol}//${window.location.host}/ws`;
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
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      try {
        const pingMessage = {
          type: 'ping',
          timestamp: Date.now(),
        };

        lastPingTimestampRef.current = pingMessage.timestamp;
        wsRef.current.send(JSON.stringify(pingMessage));
      } catch (error) {
        console.error('Error sending ping:', error);
      }
    }
  }, []);

  // Clean up existing connection
  const cleanupWebSocket = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.onopen = null;
      wsRef.current.onclose = null;
      wsRef.current.onerror = null;
      wsRef.current.onmessage = null;

      if (
        wsRef.current.readyState === WebSocket.OPEN ||
        wsRef.current.readyState === WebSocket.CONNECTING
      ) {
        wsRef.current.close();
      }

      wsRef.current = null;
    }

    // Clear any reconnection timeouts
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    // Clear ping interval
    if (pingIntervalRef.current) {
      clearInterval(pingIntervalRef.current);
      pingIntervalRef.current = null;
    }

    connectionStartTimeRef.current = null;
  }, []);

  // Set up a new WebSocket connection
  const setupWebSocket = useCallback(() => {
    cleanupWebSocket();

    try {
      setStatus('connecting');

      const wsUrl = getWebSocketUrl();
      wsRef.current = new WebSocket(wsUrl);

      wsRef.current.onopen = event => {
        setStatus('connected');
        reconnectAttemptRef.current = 0;
        connectionStartTimeRef.current = Date.now();

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

        // Call user-provided onOpen handler
        if (onOpen) {
          onOpen(event);
        }
      };

      wsRef.current.onclose = event => {
        setStatus('disconnected');

        // Update metrics
        setMetrics(prev => ({
          ...prev,
          uptime: 0,
        }));

        // Handle reconnection if auto-reconnect is enabled
        if (autoReconnect && reconnectAttemptRef.current < maxReconnectAttempts) {
          const delay = reconnectDelay * Math.pow(backoffFactor, reconnectAttemptRef.current);

          reconnectTimeoutRef.current = setTimeout(() => {
            reconnectAttemptRef.current++;

            // Update metrics
            setMetrics(prev => ({
              ...prev,
              reconnectCount: prev.reconnectCount + 1,
            }));

            setupWebSocket();
          }, delay);
        } else if (reconnectAttemptRef.current >= maxReconnectAttempts) {
          setStatus('error');

          // Update metrics
          setMetrics(prev => ({
            ...prev,
            failedAttempts: prev.failedAttempts + 1,
          }));
        }

        // Call user-provided onClose handler
        if (onClose) {
          onClose(event);
        }
      };

      wsRef.current.onerror = event => {
        console.error('WebSocket error:', event);

        // Update metrics
        setMetrics(prev => ({
          ...prev,
          failedAttempts: prev.failedAttempts + 1,
        }));

        // Don't set status to error here, let onclose handle it
        // since error is almost always followed by close

        // Call user-provided onError handler
        if (onError) {
          onError(event);
        }
      };

      wsRef.current.onmessage = event => {
        try {
          const data = JSON.parse(event.data);

          // Handle pong response for latency calculation
          if (data.type === 'pong' && data.originalTimestamp && lastPingTimestampRef.current) {
            const latency = Date.now() - data.originalTimestamp;

            setMetrics(prev => ({
              ...prev,
              latency,
              messageCount: prev.messageCount + 1,
              lastMessageTime: new Date(),
            }));
          } else {
            // Count other messages too
            setMetrics(prev => ({
              ...prev,
              messageCount: prev.messageCount + 1,
              lastMessageTime: new Date(),
            }));
          }

          // Call user-provided onMessage handler
          if (onMessage) {
            onMessage(event);
          }
        } catch (error) {
          console.error('Error processing WebSocket message:', error);

          // Still count the message
          setMetrics(prev => ({
            ...prev,
            messageCount: prev.messageCount + 1,
            lastMessageTime: new Date(),
          }));

          // Call user-provided onMessage handler
          if (onMessage) {
            onMessage(event);
          }
        }
      };
    } catch (error) {
      console.error('Error creating WebSocket:', error);
      setStatus('error');

      // Update metrics
      setMetrics(prev => ({
        ...prev,
        failedAttempts: prev.failedAttempts + 1,
      }));
    }
  }, [
    cleanupWebSocket,
    getWebSocketUrl,
    onOpen,
    onClose,
    onError,
    onMessage,
    sendPing,
    autoReconnect,
    maxReconnectAttempts,
    reconnectDelay,
    backoffFactor,
  ]);

  // Function to manually reconnect
  const reconnect = useCallback(() => {
    reconnectAttemptRef.current = 0;
    setupWebSocket();
  }, [setupWebSocket]);

  // Send message to the WebSocket
  const send = useCallback((message: string | object) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      console.error('WebSocket is not connected');
      return false;
    }

    try {
      const messageString = typeof message === 'string' ? message : JSON.stringify(message);

      wsRef.current.send(messageString);
      return true;
    } catch (error) {
      console.error('Error sending message:', error);
      return false;
    }
  }, []);

  // Set up WebSocket on hook mount
  useEffect(() => {
    setupWebSocket();

    // Clean up on unmount
    return () => {
      cleanupWebSocket();
    };
  }, [setupWebSocket, cleanupWebSocket]);

  return {
    status,
    transport,
    metrics,
    send,
    reconnect,
    close: cleanupWebSocket,
  };
};

export default useAgentWebSocket;

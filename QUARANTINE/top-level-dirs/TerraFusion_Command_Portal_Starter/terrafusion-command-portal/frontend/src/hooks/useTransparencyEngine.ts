import { useCallback, useEffect, useRef, useState } from 'react';

export interface AgentAction {
  timestamp: string;
  agentId: string;
  agentRole: string;
  workspace: string;
  service: string;
  phase: 'planning' | 'executing' | 'waiting' | 'idle' | 'error' | 'complete';
  summary: string;
  details?: Record<string, unknown>;
  correlationId?: string;
  durationMs?: number;
}

export interface WebSocketMessage {
  type: 'connected' | 'agent-action';
  data?: AgentAction;
  message?: string;
  timestamp: string;
}

export interface TransparencyEngineState {
  actions: AgentAction[];
  connected: boolean;
  connecting: boolean;
  error: string | null;
  lastUpdate: string | null;
}

const WS_URL = 'ws://localhost:8788'; // Updated to match Transparency Engine port
const RECONNECT_DELAY = 3000;
const MAX_ACTIONS = 1000;

export function useTransparencyEngine() {
  const [state, setState] = useState<TransparencyEngineState>({
    actions: [],
    connected: false,
    connecting: false,
    error: null,
    lastUpdate: null,
  });

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      return; // Already connected
    }

    setState(prev => ({ ...prev, connecting: true, error: null }));

    try {
      const ws = new WebSocket(WS_URL);

      ws.onopen = () => {
        console.log('[TransparencyEngine] Connected to WebSocket server');
        setState(prev => ({
          ...prev,
          connected: true,
          connecting: false,
          error: null,
        }));
      };

      ws.onmessage = event => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);

          if (message.type === 'agent-action' && message.data) {
            setState(prev => ({
              ...prev,
              actions: [...prev.actions, message.data!].slice(-MAX_ACTIONS),
              lastUpdate: message.timestamp,
            }));
          } else if (message.type === 'connected') {
            console.log('[TransparencyEngine]', message.message);
          }
        } catch (error) {
          console.error('[TransparencyEngine] Failed to parse message:', error);
        }
      };

      ws.onerror = error => {
        console.error('[TransparencyEngine] WebSocket error:', error);
        setState(prev => ({
          ...prev,
          error: 'WebSocket connection error',
          connected: false,
          connecting: false,
        }));
      };

      ws.onclose = () => {
        console.log('[TransparencyEngine] Disconnected from WebSocket server');
        setState(prev => ({
          ...prev,
          connected: false,
          connecting: false,
        }));

        // Attempt reconnection
        reconnectTimeoutRef.current = setTimeout(() => {
          console.log('[TransparencyEngine] Attempting to reconnect...');
          connect();
        }, RECONNECT_DELAY);
      };

      wsRef.current = ws;
    } catch (error) {
      console.error('[TransparencyEngine] Failed to create WebSocket:', error);
      setState(prev => ({
        ...prev,
        error: 'Failed to create WebSocket connection',
        connected: false,
        connecting: false,
      }));
    }
  }, []);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }

    setState(prev => ({
      ...prev,
      connected: false,
      connecting: false,
    }));
  }, []);

  const clearActions = useCallback(() => {
    setState(prev => ({
      ...prev,
      actions: [],
    }));
  }, []);

  // Auto-connect on mount
  useEffect(() => {
    connect();

    return () => {
      disconnect();
    };
  }, [connect, disconnect]);

  return {
    ...state,
    connect,
    disconnect,
    clearActions,
  };
}

/**
 * Agent WebSocket Hook
 * 
 * This hook provides a React interface for the agent communication service (Socket.IO),
 * allowing components to easily connect to agents, send messages, and
 * receive real-time updates.
 * 
 * Note: This has been updated to use Socket.IO instead of raw WebSockets
 * for better reliability, especially in environments like Replit where
 * WebSockets may have connection issues.
 */

import { useState, useEffect, useCallback } from 'react';
// Use the Socket.IO service instead of WebSockets
import { agentSocketIOService, ConnectionStatus as SocketIOConnectionStatus } from '@/services/agent-socketio-service';
import { useToast } from '@/hooks/use-toast';

// Map Socket.IO connection status to our existing connection status type for backward compatibility
export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'errored';

// Helper function to convert Socket.IO connection status to our ConnectionStatus type
const mapConnectionStatus = (status: SocketIOConnectionStatus): ConnectionStatus => {
  switch (status) {
    case SocketIOConnectionStatus.CONNECTED:
      return 'connected';
    case SocketIOConnectionStatus.CONNECTING:
      return 'connecting';
    case SocketIOConnectionStatus.DISCONNECTED:
      return 'disconnected';
    case SocketIOConnectionStatus.ERRORED:
      return 'errored';
    default:
      return 'disconnected';
  }
};

type MessageHandler = (message: any) => void;

interface UseAgentWebSocketProps {
  autoConnect?: boolean;
  showToasts?: boolean;
}

interface UseAgentWebSocketResult {
  connectionStatus: ConnectionStatus;
  connect: () => Promise<boolean>;
  disconnect: () => void;
  sendAgentMessage: (recipientId: string, message: any) => Promise<string>;
  sendActionRequest: (targetAgent: string, action: string, params?: any) => Promise<string>;
  on: (type: string, handler: MessageHandler) => () => void;
  off: (type: string, handler: MessageHandler) => void;
}

/**
 * Hook for interacting with agent WebSocket service
 */
export function useAgentWebSocket({
  autoConnect = true,
  showToasts = false,
}: UseAgentWebSocketProps = {}): UseAgentWebSocketResult {
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>(
    mapConnectionStatus(agentSocketIOService.getConnectionStatus())
  );
  const { toast } = useToast();

  // Connect to the Socket.IO server
  const connect = useCallback(async (): Promise<boolean> => {
    try {
      return await agentSocketIOService.connect();
    } catch (error) {
      console.error('Error connecting to agent Socket.IO:', error);
      if (showToasts) {
        toast({
          title: 'Connection Error',
          description: 'Failed to connect to agent system. Some features may be unavailable.',
          variant: 'destructive',
        });
      }
      return false;
    }
  }, [showToasts, toast]);

  // Disconnect from the Socket.IO server
  const disconnect = useCallback((): void => {
    agentSocketIOService.disconnect();
  }, []);

  // Send a message to an agent
  const sendAgentMessage = useCallback(
    async (recipientId: string, message: any): Promise<string> => {
      try {
        return await agentSocketIOService.sendAgentMessage(recipientId, message);
      } catch (error) {
        console.error('Error sending agent message:', error);
        if (showToasts) {
          toast({
            title: 'Message Error',
            description: 'Failed to send message to agent. Please try again.',
            variant: 'destructive',
          });
        }
        throw error;
      }
    },
    [showToasts, toast]
  );

  // Send an action request to an agent
  const sendActionRequest = useCallback(
    async (targetAgent: string, action: string, params: any = {}): Promise<string> => {
      try {
        return await agentSocketIOService.sendActionRequest(targetAgent, action, params);
      } catch (error) {
        console.error('Error sending action request:', error);
        if (showToasts) {
          toast({
            title: 'Action Error',
            description: `Failed to request action "${action}" from agent. Please try again.`,
            variant: 'destructive',
          });
        }
        throw error;
      }
    },
    [showToasts, toast]
  );

  // Register a handler for a specific message type
  const on = useCallback(
    (type: string, handler: MessageHandler): (() => void) => {
      return agentSocketIOService.on(type, handler);
    },
    []
  );

  // Remove a handler for a specific message type
  const off = useCallback(
    (type: string, handler: MessageHandler): void => {
      agentSocketIOService.off(type, handler);
    },
    []
  );

  // Set up connection status listener and auto-connect
  useEffect(() => {
    // Listen for connection status changes and map to our ConnectionStatus type
    const unsubscribe = agentSocketIOService.onConnectionStatusChange((status) => {
      setConnectionStatus(mapConnectionStatus(status));
    });

    // Auto-connect if enabled
    if (autoConnect) {
      connect().catch(error => {
        console.error('Auto-connect failed:', error);
      });
    }

    // Listen for notification messages and show toasts
    let notificationUnsubscribe: (() => void) | null = null;
    
    if (showToasts) {
      notificationUnsubscribe = agentSocketIOService.on('notification', (message: any) => {
        if (message.level && message.title && message.message) {
          toast({
            title: message.title,
            description: message.message,
            variant: message.level === 'error' ? 'destructive' : 'default',
          });
        }
      });
    }

    // Clean up event listeners on unmount
    return () => {
      unsubscribe();
      if (notificationUnsubscribe) {
        notificationUnsubscribe();
      }
    };
  }, [autoConnect, connect, showToasts, toast]);

  return {
    connectionStatus,
    connect,
    disconnect,
    sendAgentMessage,
    sendActionRequest,
    on,
    off,
  };
}
import { useState, useEffect, useRef, useCallback } from 'react';
import { getWebSocketUrl } from '@/lib/env';

// Define the message structure
export interface WebSocketMessage {
  type: string;
  roomId?: string;
  payload?: any;
  [key: string]: any;
}

export interface UseWebSocketOptions {
  roomId?: string;
  autoConnect?: boolean;
}

export type WebSocketStatus = 'idle' | 'connecting' | 'connected' | 'disconnected' | 'error';

// Keeping this enum for backward compatibility with existing components
export enum ConnectionStatusEnum {
  CONNECTING = 'connecting',
  CONNECTED = 'connected',
  DISCONNECTED = 'disconnected',
  RECONNECTING = 'reconnecting',
  ERROR = 'error'
}

/**
 * WebSocket message type enum
 * 
 * These are the supported message types for WebSocket communication.
 */
export enum MessageTypeEnum {
  // Connection management
  CONNECT = 'connect',
  DISCONNECT = 'disconnect',
  HEARTBEAT = 'heartbeat',
  
  // Room management
  JOIN = 'join',
  LEAVE = 'leave',
  JOIN_ROOM = 'join_room',
  LEAVE_ROOM = 'leave_room',
  
  // User activity
  CURSOR_MOVE = 'cursor_move',
  USER_ACTIVITY = 'user_activity',
  
  // Feature management (client to server)
  FEATURE_ADD = 'feature_add',
  FEATURE_UPDATE = 'feature_update',
  FEATURE_DELETE = 'feature_delete',
  
  // Feature management (server to client)
  FEATURE_CREATED = 'feature_created',
  FEATURE_UPDATED = 'feature_updated',
  FEATURE_DELETED = 'feature_deleted',
  
  // Annotation management (client to server)
  ANNOTATION_ADD = 'annotation_add',
  ANNOTATION_UPDATE = 'annotation_update',
  ANNOTATION_DELETE = 'annotation_delete',
  
  // Annotation management (server to client)
  ANNOTATION_CREATED = 'annotation_created',
  ANNOTATION_UPDATED = 'annotation_updated',
  ANNOTATION_DELETED = 'annotation_deleted',
  
  // Chat messaging
  CHAT_MESSAGE = 'chat_message',
  
  // Error handling
  ERROR = 'error'
}

/**
 * Check if a message is a room message
 */
export function isRoomMessage(message: WebSocketMessage): boolean {
  return !!message.roomId;
}

/**
 * Check if a message is a user message
 */
export function isUserMessage(message: WebSocketMessage): boolean {
  return !!message.userId;
}

/**
 * Check if a message is a feature message
 */
export function isFeatureMessage(message: WebSocketMessage): boolean {
  return [
    MessageTypeEnum.FEATURE_ADD,
    MessageTypeEnum.FEATURE_UPDATE,
    MessageTypeEnum.FEATURE_DELETE,
    MessageTypeEnum.FEATURE_CREATED,
    MessageTypeEnum.FEATURE_UPDATED,
    MessageTypeEnum.FEATURE_DELETED
  ].includes(message.type);
}

/**
 * Check if a message is an annotation message
 */
export function isAnnotationMessage(message: WebSocketMessage): boolean {
  return [
    MessageTypeEnum.ANNOTATION_ADD,
    MessageTypeEnum.ANNOTATION_UPDATE,
    MessageTypeEnum.ANNOTATION_DELETE,
    MessageTypeEnum.ANNOTATION_CREATED,
    MessageTypeEnum.ANNOTATION_UPDATED,
    MessageTypeEnum.ANNOTATION_DELETED
  ].includes(message.type);
}

/**
 * Create a WebSocket connection with the specified path
 */
export function createWebSocket(path: string = '/ws'): WebSocket {
  // Use the environment-aware URL method
  const wsUrl = getWebSocketUrl();
  
  console.log(`Creating WebSocket connection to: ${wsUrl}`);
  return new WebSocket(wsUrl);
}

/**
 * Enhanced WebSocket hook for collaborative features
 * 
 * This hook provides a robust WebSocket connection with:
 * - Automatic connection management
 * - Reconnect logic with backoff
 * - Room-based collaboration
 * - Message type handling
 * - Ping/pong heartbeat
 */
export function useEnhancedWebSocket(options: UseWebSocketOptions = {}) {
  const { roomId: initialRoomId, autoConnect = true } = options;
  const [roomId, setRoomId] = useState<string | undefined>(initialRoomId);
  const [status, setStatus] = useState<WebSocketStatus>('idle');
  const [messages, setMessages] = useState<WebSocketMessage[]>([]);
  const [error, setError] = useState<Error | null>(null);
  const [userCount, setUserCount] = useState<number>(1);
  // Track if we're in reconnection mode
  const [isReconnecting, setIsReconnecting] = useState(false);
  
  const socketRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptRef = useRef<number>(0);
  const MAX_RECONNECT_ATTEMPTS = 5;
  const RECONNECT_DELAY_BASE = 1500; // ms
  
  // Function to establish WebSocket connection
  const connect = useCallback(() => {
    // Prevent multiple connections
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      console.log('WebSocket is already connected');
      return;
    }
    
    try {
      setStatus('connecting');
      
      // Clear any existing reconnect timeout
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
      
      // Create new WebSocket connection using our helper function
      const socket = createWebSocket();
      socketRef.current = socket;
      
      // Set up event handlers
      socket.onopen = () => {
        console.log('WebSocket connection established');
        setStatus('connected');
        setError(null);
        reconnectAttemptRef.current = 0;
        
        // If room ID is provided, join the room
        if (roomId) {
          joinRoom(roomId);
        }
      };
      
      socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log('Received WebSocket message:', data);
          
          // Handle specific message types
          if (data.type === 'ping') {
            // Respond to ping with pong
            send({ type: 'pong', timestamp: Date.now() });
          } else if (data.type === 'user-joined' || data.type === 'user-left' || data.type === 'joined') {
            // Update user count if provided
            if (typeof data.userCount === 'number') {
              setUserCount(data.userCount);
            }
          }
          
          // Add message to history
          setMessages((prev) => [...prev, data]);
        } catch (err) {
          console.error('Error parsing WebSocket message:', err);
        }
      };
      
      socket.onerror = (event) => {
        console.error('WebSocket error:', event);
        setStatus('error');
        setError(new Error('WebSocket connection error'));
      };
      
      socket.onclose = (event) => {
        console.log(`WebSocket closed (code: ${event.code})`, event.reason);
        setStatus('disconnected');
        
        // Attempt to reconnect unless max attempts reached
        if (reconnectAttemptRef.current < MAX_RECONNECT_ATTEMPTS) {
          const delay = RECONNECT_DELAY_BASE * Math.pow(1.5, reconnectAttemptRef.current);
          console.log(`Reconnecting in ${delay}ms (attempt ${reconnectAttemptRef.current + 1})`);
          
          reconnectTimeoutRef.current = setTimeout(() => {
            reconnectAttemptRef.current++;
            // Set reconnecting flag to true
            setIsReconnecting(true);
            // Set status to a temporary 'reconnecting' status before actually attempting to connect
            setStatus('disconnected'); // First set to disconnected to ensure state change
            setTimeout(() => {
              // Use a setTimeout to ensure the status actually changes for components
              // that are watching for the RECONNECTING enum
              setStatus('connecting'); // We use 'connecting' here which maps to RECONNECTING in our enum
              connect();
            }, 0);
          }, delay);
        } else {
          console.error(`Failed to reconnect after ${MAX_RECONNECT_ATTEMPTS} attempts`);
        }
      };
    } catch (err) {
      console.error('Error initializing WebSocket:', err);
      setStatus('error');
      setError(err instanceof Error ? err : new Error('Failed to initialize WebSocket'));
    }
  }, [roomId]);
  
  // Function to disconnect WebSocket
  const disconnect = useCallback(() => {
    if (socketRef.current) {
      // Leave room if in one
      if (roomId) {
        send({ type: 'leave', roomId });
      }
      
      // Close socket
      socketRef.current.close();
      socketRef.current = null;
    }
    
    // Clear any pending reconnect
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    
    setStatus('disconnected');
  }, [roomId]);
  
  // Function to send message through WebSocket
  const send = useCallback((message: WebSocketMessage) => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify(message));
      return true;
    } else {
      console.warn('Cannot send message: WebSocket is not connected');
      return false;
    }
  }, []);
  
  // Function to join a room
  const joinRoom = useCallback((newRoomId: string) => {
    if (!newRoomId.trim()) {
      console.error('Cannot join room: Room ID is required');
      return false;
    }
    
    setRoomId(newRoomId);
    
    // Send join message if connected
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      send({ type: 'join', roomId: newRoomId });
      return true;
    } else {
      console.warn('Cannot join room: WebSocket is not connected');
      // Will join automatically when connection is established
      return false;
    }
  }, [send]);
  
  // Function to leave current room
  const leaveRoom = useCallback(() => {
    if (roomId && socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      send({ type: 'leave', roomId });
      setRoomId(undefined);
      return true;
    }
    return false;
  }, [roomId, send]);
  
  // Connect automatically if autoConnect is true
  useEffect(() => {
    if (autoConnect) {
      connect();
    }
    
    // Cleanup on unmount
    return () => {
      disconnect();
    };
  }, [autoConnect, connect, disconnect]);
  
  // Reset reconnecting status when connection is established
  useEffect(() => {
    if (status === 'connected') {
      setIsReconnecting(false);
      reconnectAttemptRef.current = 0;
    }
  }, [status]);
  
  // Map the status to ConnectionStatusEnum for components that expect it
  const getConnectionStatusEnum = (): ConnectionStatusEnum => {
    // If we're reconnecting and connecting, return RECONNECTING instead of CONNECTING
    if (isReconnecting && status === 'connecting') {
      return ConnectionStatusEnum.RECONNECTING;
    }
    
    switch (status) {
      case 'connecting':
        return ConnectionStatusEnum.CONNECTING;
      case 'connected':
        return ConnectionStatusEnum.CONNECTED;
      case 'disconnected':
        return ConnectionStatusEnum.DISCONNECTED;
      case 'error':
        return ConnectionStatusEnum.ERROR;
      default:
        return ConnectionStatusEnum.DISCONNECTED;
    }
  };

  // Return the WebSocket API
  return {
    status,
    error,
    messages,
    roomId,
    userCount,
    send,
    connect,
    disconnect,
    joinRoom,
    leaveRoom,
    isConnected: status === 'connected',
    isConnecting: status === 'connecting',
    // Add connectionStatus for backward compatibility
    connectionStatus: getConnectionStatusEnum()
  };
}

export default useEnhancedWebSocket;
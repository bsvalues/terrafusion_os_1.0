import { useState, useEffect, useCallback, useRef } from 'react';
import { createWebSocket } from '@/lib/websocket';

/**
 * WebSocket hook options
 */
export interface UseWebSocketOptions {
  // Path to WebSocket endpoint
  path?: string;
  
  // Auto connect on mount
  autoConnect?: boolean;
  
  // Auto reconnect on close/error
  autoReconnect?: boolean;
  
  // Maximum reconnect attempts
  maxReconnectAttempts?: number;
  
  // Base reconnect delay in ms
  reconnectDelay?: number;
  
  // Event handlers
  onOpen?: (event: Event) => void;
  onMessage?: (event: MessageEvent) => void;
  onClose?: (event: CloseEvent) => void;
  onError?: (event: Event) => void;
}

/**
 * WebSocket connection status
 */
export type WebSocketStatus = 'connecting' | 'connected' | 'disconnected' | 'reconnecting';

/**
 * WebSocket hook result
 */
export interface UseWebSocketResult {
  // WebSocket instance (null when disconnected)
  socket: WebSocket | null;
  
  // Connection status
  status: WebSocketStatus;
  
  // Last received message
  lastMessage: any;
  
  // Connection operations
  connect: () => void;
  disconnect: () => void;
  reconnect: () => void;
  
  // Send message (accepts string or object that will be JSON stringified)
  sendMessage: (message: any) => boolean;
}

/**
 * React hook for WebSocket connections
 */
export function useWebSocket({
  path = '/ws',
  autoConnect = true,
  autoReconnect = true,
  maxReconnectAttempts = 5,
  reconnectDelay = 1000,
  onOpen,
  onMessage,
  onClose,
  onError
}: UseWebSocketOptions = {}): UseWebSocketResult {
  // WebSocket connection state
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [status, setStatus] = useState<WebSocketStatus>('disconnected');
  const [lastMessage, setLastMessage] = useState<any>(null);
  
  // References for reconnection
  const reconnectAttempts = useRef<number>(0);
  const reconnectTimeoutRef = useRef<number | null>(null);
  
  // Create a new WebSocket connection
  const connect = useCallback(() => {
    try {
      // Clean up any existing connection
      if (socket) {
        socket.close();
      }
      
      // Update status
      setStatus('connecting');
      
      // Create new connection
      console.log(`Connecting to WebSocket at path: ${path}`);
      const newSocket = createWebSocket(path);
      
      // Set up event handlers
      newSocket.addEventListener('open', (event) => {
        console.log('WebSocket connection established');
        setStatus('connected');
        reconnectAttempts.current = 0;
        if (onOpen) onOpen(event);
      });
      
      newSocket.addEventListener('message', (event) => {
        console.log('WebSocket message received');
        
        let parsedData;
        
        // Try to parse the data if it's a string
        if (typeof event.data === 'string') {
          try {
            parsedData = JSON.parse(event.data);
            console.log('Parsed WebSocket message:', parsedData);
          } catch (error) {
            console.log('Received non-JSON message:', event.data);
            parsedData = event.data;
          }
        } else {
          console.log('Received non-string message');
          parsedData = event.data;
        }
        
        // Update last message state
        setLastMessage({
          data: parsedData,
          original: event
        });
        
        // Call user message handler if provided
        if (onMessage) {
          onMessage(event);
        }
      });
      
      newSocket.addEventListener('close', (event) => {
        setStatus('disconnected');
        
        if (onClose) onClose(event);
        
        // Attempt reconnection if enabled and not explicitly closed
        if (autoReconnect && !event.wasClean) {
          handleReconnect();
        }
      });
      
      newSocket.addEventListener('error', (event) => {
        setStatus('disconnected');
        
        if (onError) onError(event);
        
        // Errors usually trigger a close event, where reconnect is handled
      });
      
      // Update state
      setSocket(newSocket);
      
      return newSocket;
    } catch (error) {
      console.error('Error creating WebSocket connection:', error);
      setStatus('disconnected');
      
      // Attempt reconnection if enabled
      if (autoReconnect) {
        handleReconnect();
      }
      
      return null;
    }
  }, [path, socket, onOpen, onMessage, onClose, onError, autoReconnect]);
  
  // Disconnect the WebSocket
  const disconnect = useCallback(() => {
    if (!socket) return;
    
    try {
      socket.close(1000, 'Normal closure');
    } catch (error) {
      console.error('Error closing WebSocket:', error);
    }
    
    setSocket(null);
    setStatus('disconnected');
    
    // Cancel any pending reconnection
    if (reconnectTimeoutRef.current !== null) {
      window.clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
  }, [socket]);
  
  // Reconnect the WebSocket with exponential backoff
  const handleReconnect = useCallback(() => {
    // Cancel any pending reconnection
    if (reconnectTimeoutRef.current !== null) {
      window.clearTimeout(reconnectTimeoutRef.current);
    }
    
    // Check if maximum reconnect attempts reached
    if (reconnectAttempts.current >= maxReconnectAttempts) {
      console.warn(`Maximum reconnect attempts (${maxReconnectAttempts}) reached`);
      return;
    }
    
    // Calculate backoff delay with jitter
    const delay = Math.min(
      reconnectDelay * Math.pow(2, reconnectAttempts.current) + Math.random() * 1000,
      30000 // Maximum 30 seconds
    );
    
    // Update state
    setStatus('reconnecting');
    reconnectAttempts.current += 1;
    
    // Schedule reconnection
    reconnectTimeoutRef.current = window.setTimeout(() => {
      console.log(`Reconnecting (attempt ${reconnectAttempts.current}/${maxReconnectAttempts})...`);
      connect();
    }, delay);
  }, [connect, maxReconnectAttempts, reconnectDelay]);
  
  // Manually trigger reconnection
  const reconnect = useCallback(() => {
    disconnect();
    
    // Reset reconnect attempts
    reconnectAttempts.current = 0;
    
    // Connect immediately
    connect();
  }, [disconnect, connect]);
  
  // Send a message through the WebSocket
  const sendMessage = useCallback((message: any): boolean => {
    if (!socket || socket.readyState !== WebSocket.OPEN) {
      console.warn('Cannot send message: WebSocket not connected');
      return false;
    }
    
    try {
      // Convert to string if object
      const messageData = typeof message === 'string' 
        ? message 
        : JSON.stringify(message);
      
      socket.send(messageData);
      return true;
    } catch (error) {
      console.error('Error sending WebSocket message:', error);
      return false;
    }
  }, [socket]);
  
  // Connect on mount
  useEffect(() => {
    if (autoConnect) {
      connect();
    }
    
    // Clean up on unmount
    return () => {
      if (socket) {
        socket.close();
      }
      
      if (reconnectTimeoutRef.current !== null) {
        window.clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, []);
  
  return {
    socket,
    status,
    lastMessage,
    connect,
    disconnect,
    reconnect,
    sendMessage
  };
}
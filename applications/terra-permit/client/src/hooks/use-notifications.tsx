import * as React from 'react';
import { CollaborationEvent, CollaborationEventType } from '@/types';
import { useToast } from './use-toast';

interface NotificationContextProps {
  connect: (sessionId: string, userId: string) => void;
  disconnect: () => void;
  isConnected: boolean;
  sendNotification: (event: CollaborationEvent) => void;
  events: CollaborationEvent[];
}

const NotificationContext = React.createContext<NotificationContextProps>({
  connect: () => {},
  disconnect: () => {},
  isConnected: false,
  sendNotification: () => {},
  events: [],
});

export const NotificationProvider = ({ children }: { children: React.ReactNode }) => {
  const [socket, setSocket] = React.useState<WebSocket | null>(null);
  const [isConnected, setIsConnected] = React.useState(false);
  const [sessionId, setSessionId] = React.useState<string | null>(null);
  const [userId, setUserId] = React.useState<string | null>(null);
  const [events, setEvents] = React.useState<CollaborationEvent[]>([]);
  const { toast } = useToast();

  // Connect to the notification system
  const connect = (newSessionId: string, newUserId: string) => {
    try {
      if (socket) {
        // Already connected, reconnect with new IDs
        disconnect();
      }
  
      setSessionId(newSessionId);
      setUserId(newUserId);
  
      // Create WebSocket connection with the correct path
      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      const wsUrl = `${protocol}//${window.location.host}/ws`;
      
      console.log('Connecting to notifications WebSocket at:', wsUrl);
      
      try {
        const ws = new WebSocket(wsUrl);
        
        ws.onopen = () => {
          console.log('Notification WebSocket connection established');
          setIsConnected(true);
          
          try {
            // Join the session after connection is established
            if (ws.readyState === WebSocket.OPEN) {
              const joinEvent: CollaborationEvent = {
                type: CollaborationEventType.JOIN_SESSION,
                sessionId: newSessionId,
                userId: newUserId,
                timestamp: new Date().toISOString(),
                payload: {
                  name: `User-${newUserId.substring(0, 5)}`, // Use a simplified name
                }
              };
              ws.send(JSON.stringify(joinEvent));
            }
          } catch (sendError) {
            console.error('Error sending join event:', sendError);
          }
        };
    
        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data) as CollaborationEvent;
            
            // Add to events list
            setEvents((prev: CollaborationEvent[]) => [...prev, data]);
            
            // Only show notifications for events from other users
            if (data.userId !== newUserId) {
              handleNotification(data);
            }
          } catch (error) {
            console.error('Error parsing WebSocket message:', error);
          }
        };
    
        ws.onerror = (error) => {
          console.error('WebSocket error:', error);
          setIsConnected(false);
          // Don't show an error if WebSocket fails - silent degradation
        };
    
        ws.onclose = (event) => {
          console.log('WebSocket connection closed with code:', event.code);
          setIsConnected(false);
        };
    
        setSocket(ws);
      } catch (wsError) {
        console.error('Failed to create WebSocket connection:', wsError);
        // Graceful fallback - application can still function without notifications
        setIsConnected(false);
      }
    } catch (connectError) {
      console.error('General error in connect method:', connectError);
    }
  };

  // Disconnect from the notification system
  const disconnect = () => {
    try {
      if (socket && sessionId && userId) {
        try {
          // Only send leave event if connection is open
          if (socket.readyState === WebSocket.OPEN) {
            try {
              const leaveEvent: CollaborationEvent = {
                type: CollaborationEventType.LEAVE_SESSION,
                sessionId,
                userId,
                timestamp: new Date().toISOString(),
                payload: {}
              };
              socket.send(JSON.stringify(leaveEvent));
            } catch (sendError) {
              console.error('Error sending leave event:', sendError);
              // Continue with disconnection even if sending the event fails
            }
          }
          
          // Close the connection if it's not already closed
          if (socket.readyState !== WebSocket.CLOSED && 
              socket.readyState !== WebSocket.CLOSING) {
            socket.close();
          }
        } catch (socketError) {
          console.error('Error closing WebSocket:', socketError);
        }
      }
    } catch (disconnectError) {
      console.error('General error in disconnect method:', disconnectError);
    } finally {
      // Always reset state, even if errors occurred
      setSocket(null);
      setIsConnected(false);
      setSessionId(null);
      setUserId(null);
    }
  };

  // Send a notification through the WebSocket
  const sendNotification = (event: CollaborationEvent) => {
    try {
      if (socket && socket.readyState === WebSocket.OPEN) {
        try {
          const eventData = JSON.stringify(event);
          socket.send(eventData);
          
          // Add to local events list (even if there's no connection to keep UI consistent)
          setEvents((prev: CollaborationEvent[]) => [...prev, event]);
        } catch (sendError) {
          console.error('Error sending notification:', sendError);
          // Still add to local events list for consistent UI
          setEvents((prev: CollaborationEvent[]) => [...prev, event]);
        }
      } else {
        console.warn('Cannot send notification: WebSocket not connected or not in OPEN state');
        // Still add to local events list for consistent UI behavior
        setEvents((prev: CollaborationEvent[]) => [...prev, event]);
      }
    } catch (error) {
      console.error('General error in sendNotification method:', error);
    }
  };

  // Handle incoming notifications
  const handleNotification = (event: CollaborationEvent) => {
    switch (event.type) {
      case CollaborationEventType.JOIN_SESSION:
        toast({
          title: "User joined",
          description: `${event.payload.name} joined the session`,
        });
        break;
      case CollaborationEventType.LEAVE_SESSION:
        toast({
          title: "User left",
          description: `A user left the session`,
        });
        break;
      case CollaborationEventType.PERMIT_UPDATE:
        toast({
          title: "Permit updated",
          description: `Permit #${event.payload.permitId} was updated by ${event.payload.userName || 'another user'}`,
          variant: "default",
        });
        break;
      case CollaborationEventType.PERMIT_COMMENT:
        toast({
          title: "New comment",
          description: `New comment on permit #${event.payload.permitId}`,
          variant: "default",
        });
        break;
      default:
        // Don't show toast notifications for other event types
        break;
    }
  };

  // Clean up on unmount
  React.useEffect(() => {
    // Setup function can do any initialization if needed
    
    // Return cleanup function
    return () => {
      if (socket) {
        disconnect();
      }
    };
  // We intentionally only want this to run once on mount/unmount
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <NotificationContext.Provider
      value={{
        connect,
        disconnect,
        isConnected,
        sendNotification,
        events
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => React.useContext(NotificationContext);
import React, { useEffect, useState } from 'react';
import { Toaster } from "@/components/ui/toaster";
import { useToast } from "@/hooks/use-toast";
import { CollaborationEvent, CollaborationEventType } from '@/types';

interface NotificationCenterProps {
  sessionId?: string;
  userId?: string | null;
}

export function NotificationCenter({ sessionId, userId }: NotificationCenterProps) {
  const { toast } = useToast();
  const [socket, setSocket] = useState<WebSocket | null>(null);

  useEffect(() => {
    if (!sessionId || !userId) return;

    // Create WebSocket connection
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      console.log('Notification WebSocket connection established');
      // Join the session after connection is established
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({
          type: CollaborationEventType.JOIN_SESSION,
          sessionId,
          userId,
          timestamp: new Date().toISOString(),
          payload: {
            name: `User-${userId.substring(0, 5)}`, // Use a simplified name
          }
        }));
      }
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data) as CollaborationEvent;
        
        // Only show notifications for events from other users
        if (data.userId !== userId) {
          handleNotification(data);
        }
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    ws.onclose = () => {
      console.log('WebSocket connection closed');
    };

    setSocket(ws);

    // Clean up on unmount
    return () => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({
          type: CollaborationEventType.LEAVE_SESSION,
          sessionId,
          userId,
          timestamp: new Date().toISOString(),
          payload: {}
        }));
      }
      ws.close();
    };
  }, [sessionId, userId]);

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
          description: `Permit #${event.payload.permitId} was updated`,
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
        // Don't show notifications for other event types
        break;
    }
  };

  return <Toaster />;
}
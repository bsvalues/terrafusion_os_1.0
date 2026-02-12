import { useState, useCallback, useEffect, useRef } from 'react';
import { useWebSocket } from '@/hooks/use-websocket';
import { useToast } from '@/hooks/use-toast';
import { useUser } from './use-user';

export type ChatMessage = {
  id: string;
  text: string;
  userId: string;
  username: string;
  timestamp: number;
  roomId: string;
};

export function useChatMessaging(roomId: string) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const { socket, connected, lastMessage } = useWebSocket();
  const { toast } = useToast();
  const { user } = useUser();
  const messagesRef = useRef<ChatMessage[]>([]);

  // Keep reference synchronized with state
  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  // Process incoming chat messages
  useEffect(() => {
    if (!lastMessage) return;

    try {
      // Check if it's a chat message and for the correct room
      if (
        (lastMessage.type === 'chat' || lastMessage.type === 'chat_message') &&
        lastMessage.roomId === roomId
      ) {
        const messageData = lastMessage.data || lastMessage.payload || {};
        
        // Skip if we've already processed this message
        if (messagesRef.current.some(m => m.id === messageData.id)) {
          return;
        }

        const newMessage: ChatMessage = {
          id: messageData.id || `msg_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
          text: messageData.text || messageData.message || '',
          userId: lastMessage.userId || messageData.userId || 'unknown',
          username: lastMessage.username || messageData.username || 'Unknown User',
          timestamp: lastMessage.timestamp || messageData.timestamp || Date.now(),
          roomId
        };

        // Add to messages list
        setMessages(prev => [...prev, newMessage]);
      }
    } catch (error) {
      console.error('Error processing chat message:', error);
    }
  }, [lastMessage, roomId]);

  // Send a chat message
  const sendMessage = useCallback(
    (text: string) => {
      if (!socket || !connected) {
        toast({
          title: 'Connection Error',
          description: 'Cannot send message: Not connected to chat server',
          variant: 'destructive'
        });
        return false;
      }

      if (!text.trim()) {
        return false;
      }

      // Create message object
      const messageId = `msg_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      const message: ChatMessage = {
        id: messageId,
        text: text.trim(),
        userId: user?.id || 'unknown',
        username: user?.username || 'Anonymous',
        timestamp: Date.now(),
        roomId
      };

      try {
        // Send using "chat" type (client-side format)
        socket.send(
          JSON.stringify({
            type: 'chat',
            roomId,
            userId: user?.id,
            username: user?.username,
            data: message,
            timestamp: Date.now()
          })
        );

        // Add to local messages immediately
        setMessages(prev => [...prev, message]);
        return true;
      } catch (error) {
        console.error('Error sending chat message:', error);
        toast({
          title: 'Send Error',
          description: 'Failed to send message. Please try again.',
          variant: 'destructive'
        });
        return false;
      }
    },
    [socket, connected, roomId, user, toast]
  );

  // Clear messages
  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  return {
    messages,
    sendMessage,
    clearMessages,
    connected
  };
}
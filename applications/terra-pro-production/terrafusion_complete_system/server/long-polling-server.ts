import { Request, Response } from "express";
import { v4 as uuidv4 } from "uuid";

// In-memory storage for messages to be polled
// In a production environment, this would be replaced with Redis or similar
interface Message {
  id: string;
  type: string;
  data: any;
  timestamp: number;
}

// Keep a limited buffer of recent messages (last 100)
const messageBuffer: Message[] = [];
const MAX_BUFFER_SIZE = 100;

// Track active polling clients for analytics
const activeClients = new Set<string>();

/**
 * Set up long-polling endpoints
 * This provides a fallback for real-time updates when both WebSockets and SSE are unavailable
 */
export function setupLongPollingServer(app: any) {
  console.log("[LongPolling] Setting up long-polling endpoints at /api/poll");

  // Poll endpoint - clients request new messages
  app.get("/api/poll", (req: Request, res: Response) => {
    const clientId = (req.query.clientId as string) || uuidv4();
    const lastId = (req.query.lastId as string) || null;

    // If this is a new client, add to tracking
    if (!activeClients.has(clientId)) {
      activeClients.add(clientId);
      console.log(`[LongPolling] New client registered: ${clientId}`);
    }

    // Find messages newer than lastId
    let messages: Message[] = [];
    if (lastId) {
      // Find the index of the last message the client has seen
      const lastIndex = messageBuffer.findIndex((msg) => msg.id === lastId);
      if (lastIndex !== -1 && lastIndex < messageBuffer.length - 1) {
        // Return all messages after the last one the client saw
        messages = messageBuffer.slice(lastIndex + 1);
      } else {
        // If the last message isn't found, return the most recent messages
        // This can happen if the buffer has rotated and the message is no longer available
        messages = messageBuffer.slice(-10); // Return last 10 messages
      }
    } else {
      // First request, return most recent message as a starting point
      messages = messageBuffer.slice(-1);
    }

    // Return messages and control info
    res.json({
      clientId,
      messages,
      control: {
        interval: 3000, // Recommended polling interval in ms
        timestamp: Date.now(),
      },
    });
  });

  // Send endpoint - clients send messages
  app.post("/api/poll/send", (req: Request, res: Response) => {
    try {
      const message = req.body;
      const clientId = req.query.clientId as string;

      // Generate a message ID and add to buffer
      const id = uuidv4();
      const timestamp = Date.now();

      // Process the received message
      // For now, we just send an acknowledgment back
      // In a real app, this would trigger business logic

      // Add client ID if provided
      if (clientId) {
        message.clientId = clientId;
      }

      res.json({
        success: true,
        id,
        timestamp,
        message: "Message received",
      });
    } catch (error) {
      console.error("[LongPolling] Error processing message:", error);
      res.status(500).json({
        success: false,
        error: "Failed to process message",
      });
    }
  });

  // Return the long-polling interface for use in other modules
  return {
    /**
     * Get count of active polling clients
     */
    getClientCount: () => activeClients.size,

    /**
     * Add a message to the buffer for clients to receive on next poll
     */
    addMessage: (type: string, data: any) => {
      const message: Message = {
        id: uuidv4(),
        type,
        data,
        timestamp: Date.now(),
      };

      // Add to buffer and maintain max size
      messageBuffer.push(message);
      if (messageBuffer.length > MAX_BUFFER_SIZE) {
        messageBuffer.shift(); // Remove oldest message
      }

      return message.id;
    },

    /**
     * Clear a client from the active tracking
     */
    removeClient: (clientId: string) => {
      activeClients.delete(clientId);
    },
  };
}

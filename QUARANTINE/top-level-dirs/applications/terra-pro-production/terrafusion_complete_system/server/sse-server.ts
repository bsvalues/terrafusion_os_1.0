import { Server } from "http";
import { Request, Response } from "express";
import { v4 as uuidv4 } from "uuid";

// SSE client interface
interface SSEClient {
  id: string;
  userId?: number;
  res: Response;
  startTime: number;
}

// Connection registry
const clients = new Map<string, SSEClient>();

/**
 * Set up SSE (Server-Sent Events) endpoint
 * This provides a one-way real-time communication channel from server to client
 * when WebSockets are blocked or unavailable
 */
export function setupSSEServer(app: any) {
  console.log("[SSE] Setting up Server-Sent Events endpoint at /sse");

  app.get("/sse", (req: Request, res: Response) => {
    // Set headers for SSE
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("X-Accel-Buffering", "no"); // Disable nginx buffering

    // Generate client ID
    const clientId = uuidv4();

    // Register the client
    clients.set(clientId, {
      id: clientId,
      res,
      startTime: Date.now(),
    });

    // Send initial connection confirmation
    sendToClient(clientId, {
      type: "connection",
      status: "connected",
      clientId,
      timestamp: Date.now(),
    });

    console.log(`[SSE] Client connected: ${clientId}`);

    // Handle client disconnect
    req.on("close", () => {
      const client = clients.get(clientId);
      if (client) {
        const sessionDuration = Math.round((Date.now() - client.startTime) / 1000);
        console.log(
          `[SSE] Client disconnected: ${clientId}, Session duration: ${sessionDuration} seconds`
        );
        clients.delete(clientId);
      }
    });

    // Start sending heartbeats
    const heartbeatInterval = setInterval(() => {
      if (clients.has(clientId)) {
        sendToClient(
          clientId,
          {
            type: "heartbeat",
            timestamp: Date.now(),
          },
          "heartbeat"
        );
      } else {
        clearInterval(heartbeatInterval);
      }
    }, 30000); // Send heartbeat every 30 seconds
  });

  // Return SSE interface for use in other modules
  return {
    /**
     * Get the current client count
     */
    getClientCount: () => clients.size,

    /**
     * Broadcast a message to all connected clients
     */
    broadcast: (data: any, eventName?: string) => {
      clients.forEach((client, clientId) => {
        sendToClient(clientId, data, eventName);
      });
    },

    /**
     * Send a message to a specific client by ID
     */
    sendToClient: sendToClient,

    /**
     * Send a message to a specific user by user ID
     */
    sendToUser: (userId: number, data: any, eventName?: string) => {
      let sent = false;
      clients.forEach((client, clientId) => {
        if (client.userId === userId) {
          sendToClient(clientId, data, eventName);
          sent = true;
        }
      });
      return sent;
    },
  };
}

/**
 * Send data to a specific client
 */
function sendToClient(clientId: string, data: any, eventName?: string): boolean {
  const client = clients.get(clientId);
  if (!client) return false;

  try {
    // Format the SSE data
    const formattedData = `data: ${JSON.stringify(data)}\n\n`;

    // If event name is provided, format it accordingly
    if (eventName) {
      client.res.write(`event: ${eventName}\n${formattedData}`);
    } else {
      client.res.write(formattedData);
    }

    return true;
  } catch (e) {
    console.error(`[SSE] Error sending to client ${clientId}:`, e);
    clients.delete(clientId);
    return false;
  }
}

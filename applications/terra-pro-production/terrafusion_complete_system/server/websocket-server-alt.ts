import { WebSocketServer, WebSocket } from "ws";
import { Server } from "http";

// Define client interface
interface ClientInfo {
  id: string;
  isAlive: boolean;
  lastActivity: number;
  sessionStartTime: number;
  ipAddress?: string;
  userAgent?: string;
  userId?: number;
}

export function setupAltWebSocketServer(httpServer: Server) {
  // Log the server configuration for debugging
  console.log(`[WebSocket] Setting up alternative WebSocket server on path /ws-alt`);

  // Create a WebSocket server with a different path
  // This provides an alternative endpoint that clients can try
  // if the main one is failing
  const wss = new WebSocketServer({
    server: httpServer,
    path: "/ws-alt",
  });

  // Track clients with additional metadata
  const clients = new Map<WebSocket, ClientInfo>();

  // Set up server-side heartbeat check interval
  const heartbeatInterval = setInterval(() => {
    wss.clients.forEach((ws) => {
      const client = clients.get(ws);

      if (!client) {
        return ws.terminate();
      }

      // Check if client hasn't responded to ping
      if (!client.isAlive) {
        console.log(`Alt WS: Terminating inactive client: ${client.id}`);
        clients.delete(ws);
        return ws.terminate();
      }

      // Mark as inactive until we receive a pong
      client.isAlive = false;
      clients.set(ws, client);

      // Send ping
      try {
        ws.ping();
      } catch (e) {
        console.error(`Alt WS: Error sending ping to client ${client.id}:`, e);
        ws.terminate();
      }
    });
  }, 30000);

  // Clean up interval when server closes
  wss.on("close", () => {
    clearInterval(heartbeatInterval);
  });

  // Handle new connections
  wss.on("connection", (ws, req) => {
    // Generate client ID and set up metadata
    const clientId = Math.random().toString(36).substring(2, 15);
    const ipAddress = req.socket.remoteAddress;
    const userAgent = req.headers["user-agent"];

    // Initialize client info
    const clientInfo: ClientInfo = {
      id: clientId,
      isAlive: true,
      lastActivity: Date.now(),
      sessionStartTime: Date.now(),
      ipAddress,
      userAgent,
    };

    clients.set(ws, clientInfo);
    console.log(`Alt WS: Client connected: ${clientId} from ${ipAddress}`);

    // Send welcome message
    sendToClient(ws, {
      type: "connection",
      status: "connected",
      clientId,
      serverTime: new Date().toISOString(),
      source: "alternative-endpoint",
    });

    // Handle pong messages (response to ping)
    ws.on("pong", () => {
      const client = clients.get(ws);
      if (client) {
        client.isAlive = true;
        client.lastActivity = Date.now();
        clients.set(ws, client);
      }
    });

    // Handle messages
    ws.on("message", (message) => {
      try {
        // Update last activity time
        const client = clients.get(ws);
        if (client) {
          client.lastActivity = Date.now();
          clients.set(ws, client);
        }

        const data = JSON.parse(message.toString());
        console.log(`Alt WS: Message from ${clientId}:`, data);

        // Handle message types
        switch (data.type) {
          case "heartbeat":
            // Handle heartbeat ping message
            if (data.action === "ping") {
              // Respond with pong to keep connection alive
              sendToClient(ws, {
                type: "heartbeat",
                action: "pong",
                timestamp: data.timestamp,
                serverTime: Date.now(),
                source: "alternative-endpoint",
              });
            }
            break;

          case "ping":
            // Client-initiated ping, respond with pong
            sendToClient(ws, {
              type: "pong",
              timestamp: Date.now(),
              serverTime: new Date().toISOString(),
              source: "alternative-endpoint",
            });
            break;

          case "echo":
            sendToClient(ws, {
              type: "echo",
              message: data.message,
              timestamp: Date.now(),
              serverTime: new Date().toISOString(),
              source: "alternative-endpoint",
            });
            break;

          case "broadcast":
            broadcastMessage(data, ws);
            break;

          default:
            // Log unknown message type
            console.log(`Alt WS: Received unknown message type: ${data.type}`);
            break;
        }
      } catch (e) {
        console.error("Alt WS: Error handling message:", e);
        sendToClient(ws, {
          type: "error",
          message: "Failed to process message",
          details: e instanceof Error ? e.message : "Unknown error",
          source: "alternative-endpoint",
        });
      }
    });

    // Handle close
    ws.on("close", (code, reason) => {
      const client = clients.get(ws);
      if (client) {
        const sessionDuration = Math.round((Date.now() - client.sessionStartTime) / 1000);
        console.log(
          `Alt WS: Client disconnected: ${clientId}, ` +
            `Code: ${code}, Reason: ${reason || "No reason provided"}, ` +
            `Session duration: ${sessionDuration} seconds`
        );
        clients.delete(ws);
      }
    });

    // Handle errors
    ws.on("error", (error) => {
      console.error(`Alt WS: Error for client ${clientId}:`, error);

      try {
        sendToClient(ws, {
          type: "error",
          message: "Connection error occurred",
          details: error.message,
          source: "alternative-endpoint",
        });
      } catch (e) {
        // Unable to send error message, connection might be already closed
        console.error(`Alt WS: Failed to send error message to client ${clientId}:`, e);
      }
    });
  });

  // Helper to safely send messages to clients
  function sendToClient(ws: WebSocket, data: any): boolean {
    if (ws.readyState === WebSocket.OPEN) {
      try {
        ws.send(JSON.stringify(data));
        return true;
      } catch (e) {
        console.error("Alt WS: Error sending message to client:", e);
        return false;
      }
    }
    return false;
  }

  // Broadcast message to all connected clients except sender
  function broadcastMessage(data: any, sender?: WebSocket) {
    wss.clients.forEach((client) => {
      if (client !== sender && client.readyState === WebSocket.OPEN) {
        sendToClient(client, data);
      }
    });
  }

  // Return public interface
  return {
    broadcastToAll: (data: any) => {
      broadcastMessage(data);
    },
    getConnectionCount: () => {
      return wss.clients.size;
    },
  };
}

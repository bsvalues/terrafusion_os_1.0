import { WebSocketServer, WebSocket } from "ws";
import http from "http";
import { v4 as uuidv4 } from "uuid";
import { networkHealth } from "./utils/network-health";

// Define client connection state types
interface ConnectedClient {
  id: string;
  socket: WebSocket;
  lastActivity: number;
  protocol: string;
  userAgent?: string;
  ipAddress?: string;
  connectionType: "standard" | "alternative";
  reconnectCount: number;
}

// Create a map to store connected clients
const clients = new Map<string, ConnectedClient>();

// Track server state
const serverState = {
  isShuttingDown: false,
  startTime: Date.now(),
  reconnectAttempt: 0,
  lastReconnectTime: 0,
  heartbeatInterval: null as NodeJS.Timeout | null,
  cleanupInterval: null as NodeJS.Timeout | null,
};

/**
 * Send a message to a specific client
 */
function sendToClient(clientId: string, data: any): boolean {
  const client = clients.get(clientId);

  if (!client || client.socket.readyState !== WebSocket.OPEN) {
    return false;
  }

  try {
    const message = JSON.stringify(data);
    client.socket.send(message);
    return true;
  } catch (error) {
    console.error(`[WebSocket] Error sending message to client ${clientId}:`, error);
    return false;
  }
}

/**
 * Broadcast a message to all clients
 */
function broadcastToAll(data: any, excludeClientId?: string): void {
  console.log(`[WebSocket] Broadcasting message to ${clients.size} clients:`, data.type);

  clients.forEach((client, clientId) => {
    if (excludeClientId && clientId === excludeClientId) {
      return;
    }

    if (client.socket.readyState === WebSocket.OPEN) {
      try {
        const message = JSON.stringify(data);
        client.socket.send(message);
      } catch (error) {
        console.error(`[WebSocket] Error broadcasting to client ${clientId}:`, error);
      }
    }
  });
}

/**
 * Send heartbeats to all connected clients
 */
function sendHeartbeats(): void {
  if (serverState.isShuttingDown) {
    return;
  }

  console.log(`[WebSocket] Sending heartbeats to ${clients.size} clients`);

  clients.forEach((client, clientId) => {
    if (client.socket.readyState === WebSocket.OPEN) {
      try {
        sendToClient(clientId, {
          type: "heartbeat",
          action: "ping",
          timestamp: Date.now(),
          serverId: "terra-fusion-server",
        });
      } catch (error) {
        console.error(`[WebSocket] Error sending heartbeat to client ${clientId}:`, error);
      }
    }
  });
}

/**
 * Clean up inactive clients
 */
function cleanupInactiveClients(): void {
  if (serverState.isShuttingDown) {
    return;
  }

  const now = Date.now();
  const inactivityThreshold = 2 * 60 * 1000; // 2 minutes

  clients.forEach((client, clientId) => {
    // Check if client is inactive
    if (now - client.lastActivity > inactivityThreshold) {
      console.log(`[WebSocket] Removing inactive client ${clientId}`);

      // Close socket if still open
      if (client.socket.readyState === WebSocket.OPEN) {
        try {
          client.socket.close(1000, "Inactivity timeout");
        } catch (error) {
          console.error(`[WebSocket] Error closing socket for inactive client ${clientId}:`, error);
        }
      }

      // Remove from clients map
      clients.delete(clientId);
    }
  });

  console.log(`[WebSocket] ${clients.size} active clients remain after cleanup`);

  // Also check if we need to attempt reconnection
  checkNetworkHealth();
}

/**
 * Check network health and potentially restart the server
 */
async function checkNetworkHealth(): Promise<void> {
  // Skip if shutting down
  if (serverState.isShuttingDown) {
    return;
  }

  // Don't check too frequently
  const now = Date.now();
  if (now - serverState.lastReconnectTime < 5 * 60 * 1000) {
    // 5 minutes
    return;
  }

  // Check if reconnection is needed
  const shouldReconnect = networkHealth.shouldReconnectWebSocket();

  if (shouldReconnect) {
    console.log("[WebSocket] Network health check indicates reconnection needed");
    serverState.reconnectAttempt++;
    serverState.lastReconnectTime = now;

    // Don't actually restart in this implementation - just close all connections
    // to force clients to reconnect
    if (serverState.reconnectAttempt <= 3) {
      notifyClientsOfReconnection();

      // Close active connections
      const activeConnections = Array.from(clients.values());
      console.log(`Closing ${activeConnections.length} active connections`);

      activeConnections.forEach((client) => {
        if (client.socket.readyState === WebSocket.OPEN) {
          try {
            client.socket.close(1012, "Reconnecting due to network issues");
          } catch (err) {
            console.error(`Error closing connection for client ${client.id}:`, err);
          }
        }
      });
    }
  }
}

/**
 * Notify clients of imminent reconnection
 */
function notifyClientsOfReconnection(): void {
  broadcastToAll({
    type: "server_reconnecting",
    timestamp: Date.now(),
    message: "Server is reconnecting due to network instability. Please wait...",
  });
}

/**
 * Terminate WebSocket server instance
 */
function shutdownServer(
  wss: WebSocketServer,
  wssAlt: WebSocketServer,
  reason: string = "Server shutdown"
): void {
  // Mark server as shutting down
  console.log(`[WebSocket] Shutting down server: ${reason}`);
  serverState.isShuttingDown = true;

  // Clear intervals
  if (serverState.heartbeatInterval) {
    clearInterval(serverState.heartbeatInterval);
    serverState.heartbeatInterval = null;
  }

  if (serverState.cleanupInterval) {
    clearInterval(serverState.cleanupInterval);
    serverState.cleanupInterval = null;
  }

  // Notify all clients
  broadcastToAll({
    type: "server_shutdown",
    timestamp: Date.now(),
    reason,
  });

  // Close all client connections with code 1001 (Going Away)
  clients.forEach((client, clientId) => {
    if (client.socket.readyState === WebSocket.OPEN) {
      try {
        client.socket.close(1001, reason);
      } catch (error) {
        console.error(`[WebSocket] Error closing socket for client ${clientId}:`, error);
      }
    }
  });

  // Clear clients map
  clients.clear();

  // Close the WebSocket servers
  wss.close();
  wssAlt.close();
}

// Setup WebSocket server
export function setupWebSocketServer(server: http.Server) {
  // Reset server state
  serverState.isShuttingDown = false;
  serverState.startTime = Date.now();
  serverState.reconnectAttempt = 0;

  // Configure longer timeouts for WebSocket connections
  server.keepAliveTimeout = 120000; // 2 minutes
  server.headersTimeout = 121000; // Slightly higher than keepAliveTimeout

  // Disable Nagle's algorithm for WebSocket connections
  server.on("connection", (socket) => {
    socket.setNoDelay(true);
  });

  console.log("[WebSocket] Setting up WebSocket server on path /ws");

  // Create WebSocket server with verifyClient to handle CORS
  const wss = new WebSocketServer({
    server,
    path: "/ws",
    verifyClient: (info, cb) => {
      // Allow all origins in development
      const origin = info.origin || info.req.headers.origin;
      cb(true, 200, "Connection accepted");
    },
    handleProtocols: (protocols) => {
      if (protocols && Array.isArray(protocols) && protocols.length > 0) {
        return protocols[0]; // Accept first protocol
      }
      return false;
    },
  });

  // Configure HTTP server timeouts for long-lived connections
  server.keepAliveTimeout = 120000; // 120 seconds (2 minutes)
  server.headersTimeout = 121000; // 121 seconds
  console.log(
    "[WebSocket] HTTP Server timeouts configured: keepAliveTimeout=120000ms, headersTimeout=121000ms"
  );

  // Create alternative WebSocket server as a backup option with extended options
  console.log("[WebSocket] Setting up alternative WebSocket server on path /ws-alt");
  const wssAlt = new WebSocketServer({
    server,
    path: "/ws-alt",
    // Add client tracking with pings every 30 seconds
    clientTracking: true,
    perMessageDeflate: {
      zlibDeflateOptions: {
        chunkSize: 1024,
        memLevel: 7,
        level: 3,
      },
      zlibInflateOptions: {
        chunkSize: 10 * 1024,
      },
      // Below options are specific to Replit environment
      serverNoContextTakeover: true,
      clientNoContextTakeover: true,
      serverMaxWindowBits: 10,
      concurrencyLimit: 10,
      threshold: 1024,
    },
  });

  // Handle WebSocket connection
  wss.on("connection", (socket, request) => {
    handleConnection(socket, request, "standard");
  });

  // Handle alternative WebSocket connection
  wssAlt.on("connection", (socket, request) => {
    handleConnection(socket, request, "alternative");
  });

  // Detect server closing and handle it gracefully
  wss.on("close", () => {
    console.log("[WebSocket] WebSocket server (/ws) closed");
  });

  wssAlt.on("close", () => {
    console.log("[WebSocket] Alternative WebSocket server (/ws-alt) closed");
  });

  // Handle server errors
  wss.on("error", (error) => {
    console.error("[WebSocket] WebSocket server error:", error);
  });

  wssAlt.on("error", (error) => {
    console.error("[WebSocket] Alternative WebSocket server error:", error);
  });

  // Start heartbeat interval
  serverState.heartbeatInterval = setInterval(sendHeartbeats, 30000);

  // Start inactive client cleanup interval
  serverState.cleanupInterval = setInterval(cleanupInactiveClients, 60000);

  // Return cleanup function
  return () => {
    shutdownServer(wss, wssAlt);
  };
}

/**
 * Handle new WebSocket connection
 */
function handleConnection(
  socket: WebSocket,
  request: http.IncomingMessage,
  connectionType: "standard" | "alternative"
) {
  // Skip if server is shutting down
  if (serverState.isShuttingDown) {
    socket.close(1001, "Server is shutting down");
    return;
  }

  // Generate unique client ID
  const clientId = uuidv4();

  // Get client info
  const userAgent = request.headers["user-agent"];
  const ipAddress = request.socket.remoteAddress;
  const protocol = Array.isArray(request.headers["sec-websocket-protocol"])
    ? request.headers["sec-websocket-protocol"][0]
    : request.headers["sec-websocket-protocol"] || "unknown";

  console.log(
    `[WebSocket] New ${connectionType} connection from ${ipAddress}, ID: ${clientId}, Protocol: ${protocol}`
  );

  // Track connection in client list only
  // No need to track in network health monitor

  // Store client
  const client: ConnectedClient = {
    id: clientId,
    socket,
    lastActivity: Date.now(),
    protocol,
    userAgent,
    ipAddress,
    connectionType,
    reconnectCount: 0,
  };

  clients.set(clientId, client);

  // Send welcome message
  sendToClient(clientId, {
    type: "connection_established",
    clientId,
    timestamp: Date.now(),
    message: "Connected to Terrafusion real-time server",
    serverVersion: "2.0.0",
    reconnectStrategy: "automatic",
    serverHealth: {
      status: "online",
      uptime: Date.now() - serverState.startTime,
      activeConnections: clients.size,
    },
  });

  // Set socket ping options to improve stability in Replit environment
  socket.on("ping", () => {
    // Respond with pong
    try {
      socket.pong();
    } catch (error) {
      console.error(`[WebSocket] Error sending pong to client ${clientId}:`, error);
    }
  });

  // Ensure socket stays alive with ping/pong
  const pingInterval = setInterval(() => {
    if (socket.readyState === WebSocket.OPEN) {
      try {
        socket.ping();
      } catch (error) {
        console.error(`[WebSocket] Error pinging client ${clientId}:`, error);
        clearInterval(pingInterval);
      }
    } else {
      // If socket is not open, clear the interval
      clearInterval(pingInterval);
    }
  }, 20000); // Send ping every 20 seconds

  // Handle messages from this client
  socket.on("message", (message) => {
    try {
      // Reset the client's last activity timestamp
      const client = clients.get(clientId);
      if (client) {
        client.lastActivity = Date.now();
      }

      const parsedMessage = JSON.parse(message.toString());
      handleClientMessage(clientId, parsedMessage);
    } catch (error) {
      console.error(`[WebSocket] Error parsing message from client ${clientId}:`, error);

      // Send error message back to client
      sendToClient(clientId, {
        type: "error",
        timestamp: Date.now(),
        error: "Invalid message format, expected JSON",
      });
    }
  });

  // Clear ping interval when socket closes
  socket.on("close", () => {
    clearInterval(pingInterval);
  });

  // Handle disconnection
  socket.on("close", (code, reason) => {
    console.log(
      `[WebSocket] Client ${clientId} disconnected. Code: ${code}, Reason: ${reason || "No reason provided"}`
    );

    // Remove client
    clients.delete(clientId);

    // Broadcast disconnection if needed
    broadcastToAll(
      {
        type: "client_disconnected",
        clientId,
        timestamp: Date.now(),
        reason: reason ? reason.toString() : "No reason provided",
        code,
      },
      clientId
    );
  });

  // Handle errors
  socket.on("error", (error) => {
    console.error(`[WebSocket] Error with client ${clientId}:`, error);
  });

  // Broadcast new connection if needed for admin visibility
  broadcastToAll(
    {
      type: "client_connected",
      clientId,
      timestamp: Date.now(),
      protocol,
      connectionType,
    },
    clientId
  );
}

/**
 * Handle message from client
 */
function handleClientMessage(clientId: string, message: any) {
  // Skip if server is shutting down
  if (serverState.isShuttingDown) {
    return;
  }

  // Update last activity timestamp
  const client = clients.get(clientId);
  if (client) {
    client.lastActivity = Date.now();
  } else {
    console.warn(`[WebSocket] Received message from unknown client ${clientId}`);
    return;
  }

  // Handle different message types
  switch (message.type) {
    case "heartbeat":
      handleHeartbeat(clientId, message);
      break;

    case "ping":
      handlePing(clientId, message);
      break;

    case "health_check":
      handleHealthCheck(clientId);
      break;

    case "message":
      handleClientTextMessage(clientId, message);
      break;

    default:
      console.warn(`[WebSocket] Unknown message type '${message.type}' from client ${clientId}`);

      // Send error message back to client
      sendToClient(clientId, {
        type: "error",
        timestamp: Date.now(),
        error: `Unknown message type '${message.type}'`,
      });
  }
}

/**
 * Handle heartbeat message
 */
function handleHeartbeat(clientId: string, message: any) {
  // Send pong response
  sendToClient(clientId, {
    type: "heartbeat",
    action: "pong",
    timestamp: message.timestamp || Date.now(),
    serverId: "terra-fusion-server",
  });
}

/**
 * Handle ping message
 */
function handlePing(clientId: string, message: any) {
  // Send pong response
  sendToClient(clientId, {
    type: "pong",
    timestamp: message.timestamp || Date.now(),
    serverId: "terra-fusion-server",
  });
}

/**
 * Handle health check request
 */
function handleHealthCheck(clientId: string) {
  // Send health report
  sendToClient(clientId, {
    type: "health_report",
    timestamp: Date.now(),
    health: {
      status: "online",
      uptime: Date.now() - serverState.startTime,
      activeConnections: clients.size,
      serverState: {
        reconnectAttempt: serverState.reconnectAttempt,
        lastReconnectTime: serverState.lastReconnectTime,
        memoryUsage: process.memoryUsage(),
      },
    },
  });
}

/**
 * Handle text message from client
 */
function handleClientTextMessage(clientId: string, message: any) {
  // Echo the message back
  sendToClient(clientId, {
    type: "message",
    timestamp: Date.now(),
    from: "server",
    text: `Echo: ${message.text}`,
  });
}

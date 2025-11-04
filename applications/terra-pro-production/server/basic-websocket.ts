import { WebSocketServer, WebSocket } from "ws";
import http from "http";
import { v4 as uuidv4 } from "uuid";
import net from "net";

// Simple storage for connected clients
const clients = new Map<string, WebSocket>();

// Log with timestamp
function logWithTime(message: string) {
  console.log(`[WebSocket] ${message}`);
}

export function setupBasicWebSocketServer(server: http.Server) {
  logWithTime("Setting up unified WebSocket server");

  // Create a single WebSocket server using noServer mode
  // This gives us more control over the upgrade process
  const wss = new WebSocketServer({
    noServer: true,
    // Accept connections from any origin
    verifyClient: () => true,
    // Special handling for protocol negotiation to improve compatibility
    // Allow any protocol request
    perMessageDeflate: {
      zlibDeflateOptions: {
        chunkSize: 1024,
        memLevel: 7,
        level: 3,
      },
      zlibInflateOptions: {
        chunkSize: 10 * 1024,
      },
      // Below options specified as default values
      concurrencyLimit: 10, // Limits zlib concurrency for performance
      threshold: 1024, // Size below which messages should not be compressed
    },
    // Increase the timeout for better reliability
    clientTracking: true,
  });

  logWithTime("WebSocket server created with noServer mode");

  // Handle the HTTP server's upgrade events
  server.on("upgrade", (request, socket: net.Socket, head) => {
    const url = request.url || "";
    const pathname = url.split("?")[0];

    logWithTime(`Upgrade request for: ${pathname}`);

    // Accept connections to any WebSocket path for maximum compatibility
    // We keep /ws as preferred but accept other paths to maximize compatibility
    if (
      pathname.includes("/ws") ||
      pathname === "/basic-ws" ||
      pathname === "/socket" ||
      pathname.includes("/shap-ws")
    ) {
      try {
        // Configure the socket for better reliability
        socket.setTimeout(60000); // Longer timeout for Replit environment
        socket.setNoDelay(true);
        socket.setKeepAlive(true, 30000);

        // Handle WebSocket upgrade with error handling
        wss.handleUpgrade(request, socket, head, (ws) => {
          logWithTime(`New connection established on ${pathname}`);
          wss.emit("connection", ws, request);
        });
      } catch (error) {
        logWithTime(`Error during upgrade: ${error}`);
        try {
          socket.destroy();
        } catch (e) {
          logWithTime(`Error destroying socket: ${e}`);
        }
      }
    } else {
      // Not a WebSocket path we're handling
      logWithTime(`Ignoring upgrade request for ${pathname}`);
      try {
        socket.destroy();
      } catch (e) {
        logWithTime(`Error destroying socket: ${e}`);
      }
    }
  });

  // Handle new connections
  wss.on("connection", (ws, request) => {
    // Generate a unique ID for this connection
    const clientId = uuidv4();
    clients.set(clientId, ws);

    logWithTime(`New client connected: ${clientId} (total: ${clients.size})`);

    // Send immediate welcome message
    try {
      ws.send(
        JSON.stringify({
          type: "connection_established",
          clientId,
          message: "Successfully connected to WebSocket",
          timestamp: Date.now(),
        })
      );
      logWithTime(`Welcome message sent to client ${clientId}`);
    } catch (err) {
      logWithTime(`Error sending welcome message: ${err}`);
    }

    // Set up heartbeat (ping) every 30 seconds to keep connection alive
    const heartbeatInterval = setInterval(() => {
      if (ws.readyState === WebSocket.OPEN) {
        try {
          ws.ping();
        } catch (err) {
          logWithTime(`Error sending ping: ${err}`);
        }
      }
    }, 30000);

    // Handle messages
    ws.on("message", async (message) => {
      try {
        const data = JSON.parse(message.toString());
        logWithTime(`Received message type: ${data.type}`);

        // Handle different message types
        if (data.type === "analyze-property" && data.data) {
          logWithTime(`Processing property analysis request`);

          try {
            // Import the property analysis function
            const { analyzeProperty } = await import("./property-analysis.mjs");

            // Analyze the property
            const analysisResult = await analyzeProperty(data.data);

            // Send back the analysis result
            if (ws.readyState === WebSocket.OPEN) {
              ws.send(
                JSON.stringify({
                  type: "property-analysis",
                  data: analysisResult,
                  timestamp: Date.now(),
                })
              );
              logWithTime(`Property analysis result sent to client ${clientId}`);
            }
          } catch (error) {
            logWithTime(`Error analyzing property: ${error}`);

            // Send error message back to client
            if (ws.readyState === WebSocket.OPEN) {
              ws.send(
                JSON.stringify({
                  type: "error",
                  error: "Property analysis failed",
                  message: error.message || "Unknown error occurred",
                  timestamp: Date.now(),
                })
              );
            }
          }
        } else {
          // Echo back the message for other message types
          if (ws.readyState === WebSocket.OPEN) {
            try {
              ws.send(
                JSON.stringify({
                  type: "echo",
                  originalMessage: data,
                  timestamp: Date.now(),
                })
              );
            } catch (e) {
              logWithTime(`Error echoing message: ${e}`);
            }
          }
        }
      } catch (err) {
        logWithTime(`Error parsing message: ${err}`);
      }
    });

    // Handle connection close
    ws.on("close", (code, reason) => {
      clients.delete(clientId);
      clearInterval(heartbeatInterval);
      logWithTime(
        `Client ${clientId} disconnected (code: ${code}, reason: ${reason || "none"}) (remaining: ${clients.size})`
      );
    });

    // Handle errors
    ws.on("error", (err) => {
      logWithTime(`Error for client ${clientId}: ${err.message}`);

      // Try to close the connection gracefully
      try {
        if (ws.readyState === WebSocket.OPEN) {
          ws.close(1011, "Internal server error");
        }
      } catch (e) {
        logWithTime(`Error closing connection: ${e}`);
      }
    });

    // Handle pong responses (client is alive)
    ws.on("pong", () => {
      // Client is alive
    });
  });

  // Handle server errors
  wss.on("error", (err) => {
    logWithTime(`Server error: ${err.message}`);
  });

  // Send a broadcast message to all connected clients every 30 seconds
  setInterval(() => {
    const activeClients = clients.size;

    if (activeClients > 0) {
      logWithTime(`Broadcasting heartbeat to ${activeClients} clients`);

      const message = JSON.stringify({
        type: "heartbeat",
        message: `Server heartbeat - ${activeClients} clients connected`,
        timestamp: Date.now(),
      });

      let successCount = 0;

      clients.forEach((client, id) => {
        if (client.readyState === WebSocket.OPEN) {
          try {
            client.send(message);
            successCount++;
          } catch (e) {
            logWithTime(`Error sending to client ${id}: ${e}`);
          }
        }
      });

      logWithTime(`Heartbeat sent to ${successCount}/${activeClients} clients`);
    }
  }, 30000);

  // Define broadcast function for external use
  function broadcast(data: any) {
    const message = JSON.stringify(data);
    let successCount = 0;

    clients.forEach((client, id) => {
      if (client.readyState === WebSocket.OPEN) {
        try {
          client.send(message);
          successCount++;
        } catch (e) {
          logWithTime(`Error sending to client ${id}: ${e}`);
        }
      }
    });

    return successCount;
  }

  return {
    broadcast,
    getConnectedClientsCount: () => clients.size,
  };
}

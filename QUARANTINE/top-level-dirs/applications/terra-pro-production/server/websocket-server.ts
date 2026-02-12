import { Server as HttpServer } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { v4 as uuidv4 } from "uuid";
import { analyzeProperty } from "./property-analysis.mjs";

// Client tracking for the WebSocket server
interface Client {
  id: string;
  socket: WebSocket;
  isAlive: boolean;
  lastHeartbeat: number;
}

// Message types for WebSocket communication
export interface WSMessage {
  type: string;
  payload: any;
}

// Centralized WebSocket server for Terrafusion
export class TerraFusionWebSocketServer {
  private wss: WebSocketServer;
  private clients: Map<string, Client> = new Map();
  private heartbeatInterval: NodeJS.Timeout | null = null;

  constructor(server: HttpServer) {
    // Initialize WebSocket server with a distinct path to avoid conflicts with Vite's HMR
    this.wss = new WebSocketServer({
      server,
      path: "/ws",
      // Client tracking settings
      clientTracking: true,
      // Ping settings
      pingInterval: 30000,
      pingTimeout: 5000,
    });

    this.setupEventHandlers();
    this.startHeartbeatMonitor();
  }

  private setupEventHandlers(): void {
    // Handle new WebSocket connections
    this.wss.on("connection", (socket: WebSocket) => {
      // Generate a unique ID for this client
      const clientId = uuidv4();

      console.log(`[WebSocket] New client connected: ${clientId}`);

      // Add client to tracking map
      this.clients.set(clientId, {
        id: clientId,
        socket,
        isAlive: true,
        lastHeartbeat: Date.now(),
      });

      // Send welcome message with client ID
      this.sendToClient(clientId, {
        type: "connection_established",
        payload: {
          clientId,
          message: "Connected to Terrafusion WebSocket Server",
          timestamp: new Date().toISOString(),
        },
      });

      // Set up message handler for this client
      socket.on("message", (data: WebSocket.Data) => {
        this.handleMessage(clientId, data);
      });

      // Set up ping/pong for connection health monitoring
      socket.on("pong", () => {
        // Mark the client as alive when we receive a pong
        if (this.clients.has(clientId)) {
          const client = this.clients.get(clientId)!;
          client.isAlive = true;
          client.lastHeartbeat = Date.now();
        }
      });

      // Handle disconnection
      socket.on("close", () => {
        console.log(`[WebSocket] Client disconnected: ${clientId}`);
        this.clients.delete(clientId);
      });

      // Handle errors
      socket.on("error", (error) => {
        console.error(`[WebSocket] Error with client ${clientId}:`, error);
      });
    });
  }

  private startHeartbeatMonitor(): void {
    // Check client connections every 30 seconds
    this.heartbeatInterval = setInterval(() => {
      console.log(`[WebSocket] Sending heartbeats to ${this.clients.size} clients`);

      let disconnectedClients = 0;

      this.clients.forEach((client, id) => {
        // Check if client has responded to pings
        if (!client.isAlive) {
          console.log(`[WebSocket] Client ${id} failed to respond to ping, terminating connection`);
          client.socket.terminate();
          this.clients.delete(id);
          disconnectedClients++;
          return;
        }

        // Mark as not alive until we get a pong back
        client.isAlive = false;

        // Send ping
        try {
          client.socket.ping();
        } catch (error) {
          console.error(`[WebSocket] Error sending ping to client ${id}:`, error);
          client.socket.terminate();
          this.clients.delete(id);
          disconnectedClients++;
        }
      });

      console.log(`[WebSocket] ${this.clients.size} active clients remain after cleanup`);
    }, 30000);
  }

  // Handle incoming messages from clients
  private async handleMessage(clientId: string, data: WebSocket.Data): Promise<void> {
    try {
      const message = JSON.parse(data.toString()) as WSMessage;
      const client = this.clients.get(clientId);

      if (!client) {
        console.error(`[WebSocket] Received message from unknown client: ${clientId}`);
        return;
      }

      console.log(`[WebSocket] Received message from client ${clientId}:`, message.type);

      // Handle different message types
      switch (message.type) {
        case "ping":
          this.sendToClient(clientId, {
            type: "pong",
            payload: { timestamp: new Date().toISOString() },
          });
          break;

        case "property_analysis_request":
          // Handle property analysis request
          this.handlePropertyAnalysis(clientId, message.payload);
          break;

        default:
          console.warn(`[WebSocket] Unknown message type: ${message.type}`);
          this.sendToClient(clientId, {
            type: "error",
            payload: { message: `Unknown message type: ${message.type}` },
          });
      }
    } catch (error) {
      console.error(`[WebSocket] Error processing message from client ${clientId}:`, error);
      this.sendToClient(clientId, {
        type: "error",
        payload: { message: "Error processing message" },
      });
    }
  }

  // Handle property analysis requests via WebSocket
  private async handlePropertyAnalysis(clientId: string, data: any): Promise<void> {
    try {
      // Send acknowledgement that we're starting analysis
      this.sendToClient(clientId, {
        type: "property_analysis_started",
        payload: {
          requestId: data.requestId || uuidv4(),
          timestamp: new Date().toISOString(),
        },
      });

      // Log the property data
      console.log(`Received property analysis request for:`, data);

      // Process in background and send progress updates
      this.sendToClient(clientId, {
        type: "property_analysis_progress",
        payload: {
          requestId: data.requestId,
          progress: 20,
          status: "Collecting property data...",
          timestamp: new Date().toISOString(),
        },
      });

      // Wait a moment to simulate work
      await new Promise((resolve) => setTimeout(resolve, 1000));

      this.sendToClient(clientId, {
        type: "property_analysis_progress",
        payload: {
          requestId: data.requestId,
          progress: 40,
          status: "Analyzing local market conditions...",
          timestamp: new Date().toISOString(),
        },
      });

      // Wait a moment to simulate work
      await new Promise((resolve) => setTimeout(resolve, 1000));

      this.sendToClient(clientId, {
        type: "property_analysis_progress",
        payload: {
          requestId: data.requestId,
          progress: 70,
          status: "Generating valuation...",
          timestamp: new Date().toISOString(),
        },
      });

      // Call the property analysis function
      const analysisResult = await analyzeProperty(data);

      // Send the completed analysis
      this.sendToClient(clientId, {
        type: "property_analysis_complete",
        payload: {
          requestId: data.requestId,
          result: analysisResult,
          timestamp: new Date().toISOString(),
        },
      });
    } catch (error) {
      console.error(`[WebSocket] Error during property analysis:`, error);

      // Send error notification
      this.sendToClient(clientId, {
        type: "property_analysis_error",
        payload: {
          requestId: data.requestId,
          error: error.message || "Unknown error during property analysis",
          timestamp: new Date().toISOString(),
        },
      });
    }
  }

  // Send a message to a specific client
  public sendToClient(clientId: string, message: WSMessage): boolean {
    const client = this.clients.get(clientId);

    if (!client) {
      console.warn(`[WebSocket] Attempted to send message to unknown client: ${clientId}`);
      return false;
    }

    // WebSocket.OPEN is constant value 1 for open connection
    if (client.socket.readyState !== 1) {
      // 1 = OPEN
      console.warn(
        `[WebSocket] Client ${clientId} socket not open, current state: ${client.socket.readyState}`
      );
      return false;
    }

    try {
      client.socket.send(JSON.stringify(message));
      return true;
    } catch (error) {
      console.error(`[WebSocket] Error sending message to client ${clientId}:`, error);
      return false;
    }
  }

  // Broadcast a message to all connected clients
  public broadcast(message: WSMessage): { success: number; failed: number } {
    let success = 0;
    let failed = 0;

    this.clients.forEach((client) => {
      if (client.socket.readyState === 1) {
        // 1 = OPEN
        try {
          client.socket.send(JSON.stringify(message));
          success++;
        } catch (error) {
          console.error(`[WebSocket] Error broadcasting to client ${client.id}:`, error);
          failed++;
        }
      } else {
        failed++;
      }
    });

    return { success, failed };
  }

  // Stop the WebSocket server
  public stop(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }

    this.wss.close();

    // Close all client connections
    this.clients.forEach((client) => {
      try {
        client.socket.terminate();
      } catch (error) {
        console.error(`[WebSocket] Error terminating client ${client.id}:`, error);
      }
    });

    this.clients.clear();
  }

  // Get active client count
  public getClientCount(): number {
    return this.clients.size;
  }
}

// Factory function to create and return a WebSocket server instance
export function createWebSocketServer(httpServer: HttpServer): TerraFusionWebSocketServer {
  return new TerraFusionWebSocketServer(httpServer);
}

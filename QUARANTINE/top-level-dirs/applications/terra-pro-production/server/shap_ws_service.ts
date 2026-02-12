/**
 * Terrafusion SHAP WebSocket Service
 * Broadcasts SHAP values to connected clients in real-time
 */

import { WebSocketServer, WebSocket } from "ws";
import * as fs from "fs";
import * as path from "path";

interface ShapData {
  condition: string;
  base_score: number;
  final_score: number;
  features: string[];
  values: number[];
  image_path: string;
  model_version?: string;
  timestamp?: number;
}

interface ShapMessage {
  type: "shap_update";
  data: ShapData;
  timestamp: number;
}

class ShapWebSocketService {
  private wss: WebSocketServer | null = null;
  private clients: Set<WebSocket> = new Set();
  private shapValuesPath: string;

  constructor() {
    this.shapValuesPath = path.join(process.cwd(), "models", "shap_values");
    // Ensure the SHAP values directory exists
    if (!fs.existsSync(this.shapValuesPath)) {
      fs.mkdirSync(this.shapValuesPath, { recursive: true });
    }
  }

  /**
   * Initialize the WebSocket server
   * @param server HTTP server instance
   * @param path WebSocket endpoint path
   */
  initialize(server: any, path: string): void {
    console.log(`[SHAP WebSocket] Setting up SHAP WebSocket server on path ${path}`);

    // Create WebSocket server
    this.wss = new WebSocketServer({ server, path });

    // Handle connections
    this.wss.on("connection", (ws: WebSocket) => {
      console.log("[SHAP WebSocket] Client connected");
      this.clients.add(ws);

      // Send initial data if available
      this.sendInitialData(ws);

      // Handle client disconnection
      ws.on("close", () => {
        console.log("[SHAP WebSocket] Client disconnected");
        this.clients.delete(ws);
      });

      // Handle client messages
      ws.on("message", (message: string) => {
        try {
          const data = JSON.parse(message.toString());

          // Handle request for specific condition SHAP values
          if (data.type === "request_shap" && data.condition) {
            // Use model_version if provided, otherwise default to 'latest'
            const version = data.model_version || "latest";
            console.log(
              `[SHAP WebSocket] Received request for condition: ${data.condition}, version: ${version}`
            );
            this.sendShapForCondition(ws, data.condition, version);
          }
        } catch (error) {
          console.error("[SHAP WebSocket] Error processing message:", error);
        }
      });

      // Handle errors
      ws.on("error", (error) => {
        console.error("[SHAP WebSocket] WebSocket error:", error);
        this.clients.delete(ws);
      });
    });

    console.log("[SHAP WebSocket] SHAP WebSocket server initialized");
  }

  /**
   * Send initial SHAP data to newly connected client
   */
  private sendInitialData(ws: WebSocket): void {
    try {
      const allShapPath = path.join(this.shapValuesPath, "all_shap_values.json");

      // Check if the combined SHAP values file exists
      if (fs.existsSync(allShapPath)) {
        const shapData = JSON.parse(fs.readFileSync(allShapPath, "utf8"));

        // Send message with all SHAP values
        const message: ShapMessage = {
          type: "shap_update",
          data: shapData,
          timestamp: Date.now(),
        };

        ws.send(JSON.stringify(message));
        console.log("[SHAP WebSocket] Sent initial SHAP data to client");
      } else {
        console.log("[SHAP WebSocket] No initial SHAP data available");
      }
    } catch (error) {
      console.error("[SHAP WebSocket] Error sending initial data:", error);
    }
  }

  /**
   * Send SHAP values for a specific condition to a client
   */
  private sendShapForCondition(ws: WebSocket, condition: string, version: string = "latest"): void {
    try {
      // Handle both condition_shap.json and condition_version_shap.json naming patterns
      let shapPath = "";

      if (version && version !== "latest") {
        shapPath = path.join(this.shapValuesPath, `${condition}_${version}_shap.json`);
        // If version-specific file doesn't exist, fall back to generic condition file
        if (!fs.existsSync(shapPath)) {
          console.log(
            `[SHAP WebSocket] No version-specific SHAP data for ${condition} ${version}, trying generic`
          );
          shapPath = path.join(this.shapValuesPath, `${condition}_shap.json`);
        }
      } else {
        shapPath = path.join(this.shapValuesPath, `${condition}_shap.json`);
      }

      // Check if the SHAP values file exists for the requested condition
      if (fs.existsSync(shapPath)) {
        const shapData = JSON.parse(fs.readFileSync(shapPath, "utf8"));

        // Add version information if not already present
        if (!shapData.model_version) {
          shapData.model_version = version === "latest" ? "1.0.0" : version;
        }

        // Update timestamp if not already present
        if (!shapData.timestamp) {
          shapData.timestamp = Date.now();
        }

        // Send message with requested SHAP values
        const message: ShapMessage = {
          type: "shap_update",
          data: shapData,
          timestamp: Date.now(),
        };

        ws.send(JSON.stringify(message));
        console.log(
          `[SHAP WebSocket] Sent ${condition} SHAP data to client (${shapData.model_version})`
        );
      } else {
        console.log(`[SHAP WebSocket] No SHAP data available for condition: ${condition}`);

        // Send error response so client knows what happened
        ws.send(
          JSON.stringify({
            type: "error",
            error: `No SHAP data available for condition: ${condition}`,
            timestamp: Date.now(),
          })
        );
      }
    } catch (error) {
      console.error("[SHAP WebSocket] Error sending condition data:", error);

      // Send error response
      ws.send(
        JSON.stringify({
          type: "error",
          error: "Internal server error processing SHAP data",
          timestamp: Date.now(),
        })
      );
    }
  }

  /**
   * Broadcast SHAP values to all connected clients
   * @param shapData SHAP data to broadcast
   */
  broadcastShapValues(shapData: ShapData): void {
    if (this.clients.size === 0) {
      console.log("[SHAP WebSocket] No connected clients to broadcast to");
      return;
    }

    // Create message
    const message: ShapMessage = {
      type: "shap_update",
      data: shapData,
      timestamp: Date.now(),
    };

    // Broadcast to all connected clients
    const messageStr = JSON.stringify(message);
    this.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(messageStr);
      }
    });

    console.log(`[SHAP WebSocket] Broadcasted SHAP values to ${this.clients.size} clients`);
  }

  /**
   * Get the number of connected clients
   */
  getConnectedClientCount(): number {
    return this.clients.size;
  }
}

// Export singleton instance
export const shapWebSocketService = new ShapWebSocketService();

/**
 * SHAP WebSocket Service
 *
 * This service manages WebSocket connections for SHAP value explanations
 * It delivers real-time SHAP values to explain property condition scores
 */

import fs from "fs";
import path from "path";
import { WebSocketServer, WebSocket } from "ws";
import { Server } from "http";

// Path to SHAP values directory
const SHAP_VALUES_DIR = path.join(process.cwd(), "models", "shap_values");
const SAMPLE_IMAGES_DIR = path.join(process.cwd(), "data", "sample_images");

// Define message types
export type ShapMessage = {
  type: "request_shap" | "shap_values" | "error";
  condition?: string;
  propertyId?: number;
  data?: any;
  error?: string;
};

// Manage active connections
const clients = new Map<WebSocket, { id: string }>();

/**
 * Initialize SHAP WebSocket service
 */
export function initShapWebSocketService(server: Server): WebSocketServer {
  // Create WebSocket server
  const wss = new WebSocketServer({ server, path: "/shap-ws" });

  console.log("[SHAP WebSocket] Setting up SHAP WebSocket server on path /shap-ws");

  wss.on("connection", (ws) => {
    const clientId = generateClientId();
    clients.set(ws, { id: clientId });

    console.log(`[SHAP] Client connected: ${clientId}`);

    // Handle messages from client
    ws.on("message", (message) => {
      try {
        const parsedMessage = JSON.parse(message.toString()) as ShapMessage;
        handleClientMessage(ws, parsedMessage);
      } catch (err) {
        console.error("[SHAP] Error parsing message:", err);
        sendErrorMessage(ws, "Invalid message format");
      }
    });

    // Handle disconnection
    ws.on("close", () => {
      console.log(`[SHAP] Client disconnected: ${clientId}`);
      clients.delete(ws);
    });

    // Handle errors
    ws.on("error", (error) => {
      console.error(`[SHAP] WebSocket error for client ${clientId}:`, error);
      clients.delete(ws);
    });

    // Send welcome message
    const welcomeMessage: ShapMessage = {
      type: "shap_values",
      data: { message: "Connected to SHAP WebSocket service" },
    };
    ws.send(JSON.stringify(welcomeMessage));
  });

  console.log("[SHAP WebSocket] SHAP WebSocket server initialized");
  return wss;
}

/**
 * Generate a unique client ID
 */
function generateClientId(): string {
  return `client_${Math.random().toString(36).substring(2, 15)}`;
}

/**
 * Handle a message from a client
 */
function handleClientMessage(ws: WebSocket, message: ShapMessage): void {
  switch (message.type) {
    case "request_shap":
      handleShapRequest(ws, message);
      break;
    default:
      sendErrorMessage(ws, `Unknown message type: ${message.type}`);
  }
}

/**
 * Handle a request for SHAP values
 */
function handleShapRequest(ws: WebSocket, message: ShapMessage): void {
  const { condition, propertyId } = message;

  // Validate condition
  if (!condition) {
    return sendErrorMessage(ws, "Missing condition parameter");
  }

  // Get SHAP values for the specified condition
  try {
    const shapValues = getShapValues(condition);
    const sampleImagePath = getSampleImagePath(condition);
    const sampleImageExists = fs.existsSync(sampleImagePath);

    // Send SHAP values to client
    const response: ShapMessage = {
      type: "shap_values",
      condition,
      propertyId,
      data: {
        shapValues,
        sampleImageUrl: sampleImageExists
          ? `/api/shap/sample-images/${condition}_condition.png`
          : null,
      },
    };

    ws.send(JSON.stringify(response));
  } catch (error) {
    console.error(`[SHAP] Error handling SHAP request:`, error);
    sendErrorMessage(ws, `Error retrieving SHAP values for condition: ${condition}`);
  }
}

/**
 * Get SHAP values for a specified condition
 */
function getShapValues(condition: string): any {
  const normalizedCondition = condition.toLowerCase();
  let filePath: string;

  if (normalizedCondition === "all") {
    filePath = path.join(SHAP_VALUES_DIR, "all_shap_values.json");
  } else {
    filePath = path.join(SHAP_VALUES_DIR, `${normalizedCondition}_shap.json`);
  }

  if (!fs.existsSync(filePath)) {
    throw new Error(`SHAP values file not found: ${filePath}`);
  }

  const fileContent = fs.readFileSync(filePath, "utf-8");
  return JSON.parse(fileContent);
}

/**
 * Get path to the sample image for a specified condition
 */
function getSampleImagePath(condition: string): string {
  const normalizedCondition = condition.toLowerCase();
  return path.join(SAMPLE_IMAGES_DIR, `${normalizedCondition}_condition.png`);
}

/**
 * Send an error message to a client
 */
function sendErrorMessage(ws: WebSocket, errorMessage: string): void {
  const errorResponse: ShapMessage = {
    type: "error",
    error: errorMessage,
  };

  try {
    ws.send(JSON.stringify(errorResponse));
  } catch (error) {
    console.error("[SHAP] Error sending error message:", error);
  }
}

// No need for additional initialization log as we already log in the initShapWebSocketService function

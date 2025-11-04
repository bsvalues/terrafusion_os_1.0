import { WebSocketServer, WebSocket } from "ws";
import http from "http";
import { v4 as uuidv4 } from "uuid";
import OpenAI from "openai";
import Anthropic from "@anthropic-ai/sdk";

// Initialize AI clients
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// Define client connection state types
interface ConnectedClient {
  id: string;
  socket: WebSocket;
  lastActivity: number;
  protocol: string;
  userAgent?: string;
  ipAddress?: string;
}

// Create a map to store connected clients
const clients = new Map<string, ConnectedClient>();

// Property analysis cache to store recent results
const analysisCache = new Map<string, any>();

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
 * Broadcast a message to admin clients
 * For now, broadcast to all clients to simplify implementation
 */
function broadcastToAdmins(data: any): void {
  console.log(`[WebSocket] Broadcasting admin message to ${clients.size} clients:`, data.type);

  // In a real implementation, you would filter for admin clients
  // For now, we'll just send it to all clients
  clients.forEach((client, clientId) => {
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
function sendHeartbeats(clients: Map<string, ConnectedClient>) {
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
function cleanupInactiveClients(clients: Map<string, ConnectedClient>) {
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
}

/**
 * Broadcast resource update to interested clients
 */
function broadcastResourceUpdate(sourceClientId: string, message: any) {
  // In a real implementation, you would determine which clients should receive this update
  // For now, we'll broadcast to all clients except the source

  for (const [clientId, client] of clients.entries()) {
    if (clientId !== sourceClientId && client.socket.readyState === WebSocket.OPEN) {
      sendToClient(clientId, {
        type: "resource_updated",
        timestamp: Date.now(),
        resourceType: message.resourceType,
        resourceId: message.resourceId,
        changeType: message.changeType,
        resourceData: message.resourceData,
      });
    }
  }
}

// Setup WebSocket server
export function setupWebSocketServer(server: http.Server) {
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
      if (protocols && protocols.length > 0) {
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

  // Start heartbeat interval
  const heartbeatInterval = setInterval(() => sendHeartbeats(clients), 30000);

  // Start inactive client cleanup interval
  const cleanupInterval = setInterval(() => cleanupInactiveClients(clients), 60000);

  // Return cleanup function
  return () => {
    clearInterval(heartbeatInterval);
    clearInterval(cleanupInterval);
    wss.close();
    wssAlt.close();
  };
}

/**
 * Handle new WebSocket connection
 */
function handleConnection(
  socket: WebSocket,
  request: http.IncomingMessage,
  connectionType: string
) {
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

  // Store client
  clients.set(clientId, {
    id: clientId,
    socket,
    lastActivity: Date.now(),
    protocol,
    userAgent,
    ipAddress,
  });

  // Send welcome message
  sendToClient(clientId, {
    type: "connection_established",
    clientId,
    timestamp: Date.now(),
    message: "Connected to Terrafusion real-time server",
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

    // Broadcast disconnection to admins if needed
    broadcastToAdmins({
      type: "client_disconnected",
      clientId,
      timestamp: Date.now(),
      reason: reason ? reason.toString() : "No reason provided",
      code,
    });
  });

  // Handle errors
  socket.on("error", (error) => {
    console.error(`[WebSocket] Error with client ${clientId}:`, error);
  });

  // Broadcast new connection to admins if needed
  broadcastToAdmins({
    type: "client_connected",
    clientId,
    timestamp: Date.now(),
    protocol,
    userAgent,
    ipAddress,
  });
}

/**
 * Handle message from client
 */
async function handleClientMessage(clientId: string, message: any) {
  // Update last activity timestamp
  const client = clients.get(clientId);
  if (client) {
    client.lastActivity = Date.now();
  } else {
    console.warn(`[WebSocket] Received message from unknown client ${clientId}`);
    return;
  }

  // Log message type
  console.log(`[WebSocket] Received message type '${message.type}' from client ${clientId}`);

  // Handle different message types
  switch (message.type) {
    case "heartbeat":
      handleHeartbeat(clientId, message);
      break;

    case "ping":
      handlePing(clientId, message);
      break;

    case "property_analysis_request":
      await handlePropertyAnalysisRequest(clientId, message);
      break;

    case "resource_update":
      handleResourceUpdate(clientId, message);
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
 * Handle resource update from client
 */
function handleResourceUpdate(clientId: string, message: any) {
  console.log(
    `[WebSocket] Resource update from client ${clientId}: ${message.resourceType} ${message.resourceId}`
  );

  // Broadcast update to other clients
  broadcastResourceUpdate(clientId, message);
}

/**
 * Handle property analysis request
 */
async function handlePropertyAnalysisRequest(clientId: string, message: any) {
  try {
    // Get property data from message
    const propertyData = message.data;

    // Check if we have a cached result for this property
    const cacheKey = `${propertyData.address}-${propertyData.city}-${propertyData.state}-${propertyData.zipCode}`;

    if (analysisCache.has(cacheKey)) {
      console.log(`[WebSocket] Using cached property analysis for ${cacheKey}`);

      // Send cached result
      sendToClient(clientId, {
        type: "property_analysis_response",
        requestId: message.requestId,
        timestamp: Date.now(),
        data: analysisCache.get(cacheKey),
      });

      return;
    }

    console.log(
      `[WebSocket] Processing property analysis request for ${propertyData.address}, ${propertyData.city}, ${propertyData.state} ${propertyData.zipCode}`
    );

    // Begin generating the response
    sendToClient(clientId, {
      type: "processing_update",
      requestId: message.requestId,
      timestamp: Date.now(),
      status: "processing",
      message: "Processing property analysis request...",
    });

    // For this example, we'll generate an appraisal using AI models
    // Use either OpenAI or Anthropic based on available API keys
    let propertyAnalysisResult;

    if (process.env.OPENAI_API_KEY) {
      propertyAnalysisResult = await generatePropertyAnalysisWithOpenAI(propertyData);
    } else if (process.env.ANTHROPIC_API_KEY) {
      propertyAnalysisResult = await generatePropertyAnalysisWithAnthropic(propertyData);
    } else {
      // Generate static analysis if no API keys are available
      propertyAnalysisResult = generateFallbackPropertyAnalysis(propertyData);
    }

    // Cache the result
    analysisCache.set(cacheKey, propertyAnalysisResult);

    // Send the result
    sendToClient(clientId, {
      type: "property_analysis_response",
      requestId: message.requestId,
      timestamp: Date.now(),
      data: propertyAnalysisResult,
    });

    console.log(`[WebSocket] Sent property analysis response for ${propertyData.address}`);
  } catch (error) {
    console.error("[WebSocket] Error processing property analysis request:", error);

    // Send error message
    sendToClient(clientId, {
      type: "error",
      requestId: message.requestId,
      timestamp: Date.now(),
      error: "Error processing property analysis request",
    });
  }
}

/**
 * Generate property analysis using OpenAI
 */
async function generatePropertyAnalysisWithOpenAI(propertyData: any) {
  try {
    console.log("[OpenAI] Generating property analysis");

    // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: `You are a real estate appraisal expert. Generate a detailed property appraisal report for the provided property. 
          Return your response as a JSON object with the following structure:
          {
            "propertyDetails": { property details including address, city, state, zipCode, propertyType },
            "marketData": { 
              "estimatedValue": formatted dollar amount,
              "confidenceScore": number between 0 and 1,
              "marketTrends": string description,
              "comparableSales": array of 3-5 comparable properties with address, salePrice, dateOfSale, distanceFromSubject
            },
            "propertyAnalysis": {
              "condition": "Excellent", "Good", "Fair", or "Poor",
              "qualityRating": rating on a scale,
              "features": array of key features,
              "improvements": array of recent improvements
            },
            "appraisalSummary": {
              "finalValueOpinion": formatted dollar amount,
              "valuationApproach": description of approach used,
              "comments": additional comments/notes
            }
          }`,
        },
        {
          role: "user",
          content: `Generate a detailed property appraisal report for this property: 
          Address: ${propertyData.address}
          City: ${propertyData.city}
          State: ${propertyData.state}
          Zip Code: ${propertyData.zipCode}
          Property Type: ${propertyData.propertyType}
          
          Make sure to include real estate trends for this specific area and a thorough market analysis.`,
        },
      ],
    });

    if (completion.choices[0].message.content) {
      const result = JSON.parse(completion.choices[0].message.content);
      console.log("[OpenAI] Generated property analysis");
      return result;
    } else {
      throw new Error("No content returned from OpenAI");
    }
  } catch (error) {
    console.error("[OpenAI] Error generating property analysis:", error);
    throw error;
  }
}

/**
 * Generate property analysis using Anthropic
 */
async function generatePropertyAnalysisWithAnthropic(propertyData: any) {
  try {
    console.log("[Anthropic] Generating property analysis");

    // the newest Anthropic model is "claude-3-7-sonnet-20250219" which was released February 24, 2025. Do not change this unless explicitly requested by the user
    const message = await anthropic.messages.create({
      model: "claude-3-7-sonnet-20250219",
      max_tokens: 4000,
      system: `You are a real estate appraisal expert. Generate a detailed property appraisal report for the provided property. 
      Return your response as a JSON object with the following structure:
      {
        "propertyDetails": { property details including address, city, state, zipCode, propertyType },
        "marketData": { 
          "estimatedValue": formatted dollar amount,
          "confidenceScore": number between 0 and 1,
          "marketTrends": string description,
          "comparableSales": array of 3-5 comparable properties with address, salePrice, dateOfSale, distanceFromSubject
        },
        "propertyAnalysis": {
          "condition": "Excellent", "Good", "Fair", or "Poor",
          "qualityRating": rating on a scale,
          "features": array of key features,
          "improvements": array of recent improvements
        },
        "appraisalSummary": {
          "finalValueOpinion": formatted dollar amount,
          "valuationApproach": description of approach used,
          "comments": additional comments/notes
        }
      }`,
      messages: [
        {
          role: "user",
          content: `Generate a detailed property appraisal report for this property: 
          Address: ${propertyData.address}
          City: ${propertyData.city}
          State: ${propertyData.state}
          Zip Code: ${propertyData.zipCode}
          Property Type: ${propertyData.propertyType}
          
          Make sure to include real estate trends for this specific area and a thorough market analysis.`,
        },
      ],
    });

    if (message.content[0].type === "text") {
      const result = JSON.parse(message.content[0].text);
      console.log("[Anthropic] Generated property analysis");
      return result;
    } else {
      throw new Error("No text content returned from Anthropic");
    }
  } catch (error) {
    console.error("[Anthropic] Error generating property analysis:", error);
    throw error;
  }
}

/**
 * Generate fallback property analysis
 */
function generateFallbackPropertyAnalysis(propertyData: any) {
  console.log("[WebSocket] Generating fallback property analysis");

  // This is a fallback implementation with representative data
  // The real implementation would connect to external data sources/APIs
  return {
    propertyDetails: {
      address: propertyData.address,
      city: propertyData.city,
      state: propertyData.state,
      zipCode: propertyData.zipCode,
      propertyType: propertyData.propertyType || "Residential",
    },
    marketData: {
      estimatedValue: "$450,000",
      confidenceScore: 0.75,
      marketTrends: "Market values increased 5.2% over past 12 months",
      comparableSales: [
        {
          address: "123 Nearby St",
          salePrice: "$445,000",
          dateOfSale: "Mar 5, 2025",
          distanceFromSubject: "0.5 miles",
        },
        {
          address: "456 Close Ave",
          salePrice: "$460,000",
          dateOfSale: "Feb 10, 2025",
          distanceFromSubject: "0.8 miles",
        },
        {
          address: "789 Adjacent Rd",
          salePrice: "$432,000",
          dateOfSale: "Jan 20, 2025",
          distanceFromSubject: "0.6 miles",
        },
      ],
    },
    propertyAnalysis: {
      condition: "Good",
      qualityRating: "3.8 out of 5",
      features: ["3 bedrooms", "2 bathrooms", "Attached garage", "Updated kitchen"],
      improvements: ["Roof replaced in 2022", "New HVAC system in 2023"],
    },
    appraisalSummary: {
      finalValueOpinion: "$452,500",
      valuationApproach: "Sales Comparison Approach with adjustments for condition and location",
      comments: "Property is in a desirable neighborhood with good school districts",
    },
  };
}

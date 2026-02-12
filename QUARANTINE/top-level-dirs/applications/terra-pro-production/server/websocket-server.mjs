/**
 * TerraFusion WebSocket Server
 * Provides real-time property analysis capabilities through WebSockets
 */

import { WebSocketServer } from 'ws';
import { analyzeProperty } from './property-analysis.mjs';

// Connected clients map (clientId -> WebSocket)
const clients = new Map();

// Active request tracking
const activeRequests = new Map();

/**
 * Initialize WebSocket server
 * @param {Object} server - HTTP server instance
 */
export function initializeWebSocketServer(server) {
  // Create WebSocket server on the "/ws" path (distinct from Vite's HMR WebSocket)
  const wss = new WebSocketServer({ 
    server,
    path: '/ws'
  });

  console.log('WebSocket server initialized on path: /ws');

  // Setup connection handling
  wss.on('connection', (ws, req) => {
    const clientId = `client_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
    
    console.log(`New WebSocket connection established: ${clientId}`);
    
    // Store client connection
    clients.set(clientId, ws);
    
    // Initialize client state
    ws.isAlive = true;
    ws.clientId = clientId;
    
    // Send welcome message
    ws.send(JSON.stringify({
      type: 'connection_established',
      clientId,
      message: 'Connected to TerraFusion WebSocket server'
    }));
    
    // Handle pong message for connection health checks
    ws.on('pong', () => {
      ws.isAlive = true;
    });
    
    // Handle client messages
    ws.on('message', async (message) => {
      try {
        const data = JSON.parse(message);
        console.log(`Received WebSocket message: ${data.type}`);
        
        // Handle different message types
        switch (data.type) {
          case 'property_analysis_request':
            handlePropertyAnalysisRequest(ws, data);
            break;
            
          case 'heartbeat':
            // Client heartbeat - respond to confirm connection
            ws.send(JSON.stringify({
              type: 'heartbeat_response',
              timestamp: Date.now()
            }));
            break;
            
          default:
            console.warn(`Unknown WebSocket message type: ${data.type}`);
            ws.send(JSON.stringify({
              type: 'error',
              message: 'Unknown message type'
            }));
        }
      } catch (error) {
        console.error('Error processing WebSocket message:', error);
        ws.send(JSON.stringify({
          type: 'error',
          message: 'Error processing message'
        }));
      }
    });
    
    // Handle connection closure
    ws.on('close', () => {
      console.log(`WebSocket connection closed: ${clientId}`);
      clients.delete(clientId);
    });
    
    // Handle errors
    ws.on('error', (error) => {
      console.error(`WebSocket error for client ${clientId}:`, error);
      clients.delete(clientId);
    });
  });
  
  // Set up periodic ping to keep connections alive and clean up dead connections
  const heartbeatInterval = setInterval(() => {
    console.log('[WebSocket] Sending heartbeats to ' + wss.clients.size + ' clients');
    let activeCount = 0;
    
    wss.clients.forEach((ws) => {
      if (ws.isAlive === false) {
        console.log(`Terminating inactive WebSocket: ${ws.clientId}`);
        clients.delete(ws.clientId);
        return ws.terminate();
      }
      
      activeCount++;
      ws.isAlive = false;
      ws.ping();
    });
    
    console.log(`[WebSocket] ${activeCount} active clients remain after cleanup`);
  }, 30000); // Check every 30 seconds
  
  // Stop heartbeat on server close
  wss.on('close', () => {
    clearInterval(heartbeatInterval);
  });
  
  return wss;
}

/**
 * Handle property analysis request via WebSocket
 * @param {WebSocket} ws - WebSocket connection
 * @param {Object} data - Request data
 */
async function handlePropertyAnalysisRequest(ws, data) {
  const { requestId, propertyData } = data;
  
  // Track request
  activeRequests.set(requestId, {
    clientId: ws.clientId,
    timestamp: Date.now()
  });
  
  console.log(`Processing property analysis request: ${requestId}`);
  
  // Acknowledge receipt of request
  ws.send(JSON.stringify({
    type: 'property_analysis_started',
    requestId,
    message: 'Property analysis request received and processing'
  }));
  
  try {
    // Perform property analysis
    const result = await analyzeProperty(propertyData);
    
    // Send completed analysis
    ws.send(JSON.stringify({
      type: 'property_analysis_response',
      requestId,
      data: result
    }));
    
    console.log(`Completed property analysis request: ${requestId}`);
  } catch (error) {
    console.error(`Error processing property analysis:`, error);
    
    // Send error response
    ws.send(JSON.stringify({
      type: 'property_analysis_error',
      requestId,
      error: {
        message: 'Failed to analyze property',
        details: error.message
      }
    }));
  } finally {
    // Clean up request tracking
    activeRequests.delete(requestId);
  }
}
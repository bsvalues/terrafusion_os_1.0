/**
 * WebSocket Test Script
 * 
 * This script tests the basic functionality of WebSocket connections.
 * It connects to both the standard WebSocket server and Socket.IO server.
 */

import WebSocket from 'ws';
import { io } from 'socket.io-client';

// Configuration
const PORT = process.env.PORT || 5000;
const HOST = `localhost:${PORT}`;
const WS_PATHS = [
  '/ws/collaboration',
  '/ws/agent-health',
  '/api/agents/ws'
];

// Test WebSocket connections
async function testWebSockets() {
  // console.log('Testing WebSocket connections...\n');
  
  for (const path of WS_PATHS) {
    await testWebSocketConnection(path);
  }
  
  await testSocketIOConnection();
}

// Test individual WebSocket connection
function testWebSocketConnection(path) {
  return new Promise((resolve) => {
    // console.log(`Testing WebSocket connection to: ${path}`);
    
    const url = `ws://${HOST}${path}`;
    const ws = new WebSocket(url);
    
    const timeout = setTimeout(() => {
      // console.log(`  Connection to ${path} timed out after 5 seconds`);
      ws.terminate();
      resolve();
    }, 5000);
    
    ws.on('open', () => {
      // console.log(`  Successfully connected to ${path}`);
      
      // Send a ping message
      const pingMessage = JSON.stringify({ 
        type: 'ping', 
        timestamp: Date.now() 
      });
      
      ws.send(pingMessage);
      // console.log(`  Sent ping message: ${pingMessage}`);
    });
    
    ws.on('message', (data) => {
      try {
        const message = JSON.parse(data);
        // console.log(`  Received message from ${path}:`, message);
        
        // Close connection after receiving a response
        clearTimeout(timeout);
        ws.close();
        setTimeout(resolve, 500);
      } catch (error) {
        // console.error(`  Error parsing message from ${path}:`, error);
      }
    });
    
    ws.on('error', (error) => {
      // console.error(`  Error connecting to ${path}:`, error.message);
      clearTimeout(timeout);
      resolve();
    });
    
    ws.on('close', (code, reason) => {
      // console.log(`  Connection to ${path} closed: ${code} ${reason}`);
    });
  });
}

// Test Socket.IO connection
function testSocketIOConnection() {
  return new Promise((resolve) => {
    // console.log(`Testing Socket.IO connection`);
    
    const socket = io(`http://${HOST}/api/agents/socket.io`, {
      transports: ['websocket'],
      reconnection: false
    });
    
    const timeout = setTimeout(() => {
      // console.log(`  Socket.IO connection timed out after 5 seconds`);
      socket.disconnect();
      resolve();
    }, 5000);
    
    socket.on('connect', () => {
      // console.log(`  Successfully connected to Socket.IO (${socket.id})`);
      
      // Send a test event
      socket.emit('ping', { timestamp: Date.now() });
      // console.log(`  Sent ping event to Socket.IO`);
    });
    
    socket.on('pong', (data) => {
      // console.log(`  Received pong from Socket.IO:`, data);
      clearTimeout(timeout);
      socket.disconnect();
      setTimeout(resolve, 500);
    });
    
    socket.on('connect_error', (error) => {
      // console.error(`  Error connecting to Socket.IO:`, error.message);
      clearTimeout(timeout);
      resolve();
    });
    
    socket.on('disconnect', (reason) => {
      // console.log(`  Socket.IO disconnected: ${reason}`);
    });
  });
}

// Run tests
testWebSockets()
  .then(() => {
    // console.log('\nWebSocket tests completed');
    process.exit(0);
  })
  .catch((error) => {
    // console.error('Error running WebSocket tests:', error);
    process.exit(1);
  });
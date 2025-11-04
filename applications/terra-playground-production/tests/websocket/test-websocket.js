/**
 * WebSocket Test Script
 *
 * Tests WebSocket connectivity to the server ensuring
 * proper connection and message exchange.
 */

const WebSocket = require('ws');

// Function to connect to WebSocket server
function connectWebSocket() {
  // Use the correct protocol based on the current connection
  const protocol = 'ws:';
  const host = 'localhost:5000';
  const wsUrl = `${protocol}//${host}/ws`;

  console.log(`Connecting to WebSocket at ${wsUrl}`);

  const socket = new WebSocket(wsUrl);

  socket.on('open', () => {
    console.log('WebSocket connection established');

    // Send a simple message once connected
    const message = JSON.stringify({
      type: 'ping',
      timestamp: Date.now(),
    });

    console.log('Sending message:', message);
    socket.send(message);
  });

  socket.on('message', data => {
    try {
      const message = JSON.parse(data);
      console.log('Received message:', message);
    } catch (error) {
      console.error('Error parsing message:', error);
      console.log('Raw message:', data.toString());
    }
  });

  socket.on('close', (code, reason) => {
    console.log(`WebSocket connection closed: ${code} - ${reason}`);
  });

  socket.on('error', error => {
    console.error('WebSocket error:', error);
  });

  return socket;
}

// Connect to the server
const socket = connectWebSocket();

// Keep the process running to maintain the WebSocket connection
setTimeout(() => {
  console.log('Test completed, closing connection');
  socket.close();
  process.exit(0);
}, 10000); // Run for 10 seconds

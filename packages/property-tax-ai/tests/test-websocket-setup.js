// WebSocket Testing Utility
import WebSocket from 'ws';

// Function to create a connection to the WebSocket server
function createWebSocketConnection() {
  const ws = new WebSocket('ws://localhost:5000/api/notifications/ws');
  
  ws.on('open', () => {
    console.log('WebSocket connection established');
  });
  
  ws.on('message', (data) => {
    try {
      const message = JSON.parse(data);
      console.log('Received message:', message);
    } catch (error) {
      console.error('Error parsing WebSocket message:', error);
      console.log('Raw message:', data);
    }
  });
  
  ws.on('error', (error) => {
    console.error('WebSocket error:', error);
  });
  
  ws.on('close', (code, reason) => {
    console.log(`WebSocket connection closed: Code ${code}, Reason: ${reason || 'No reason provided'}`);
  });
  
  return ws;
}

// Create a connection
const ws = createWebSocketConnection();

// Wait for connection to establish before sending messages
setTimeout(() => {
  // Try to authenticate
  try {
    ws.send(JSON.stringify({
      type: 'auth',
      userId: '1'
    }));
    console.log('Authentication message sent');
  } catch (error) {
    console.error('Error sending authentication message:', error);
  }
  
  // Keep the process running for a while to observe WebSocket behavior
  setTimeout(() => {
    console.log('Test completed, closing connection');
    ws.close();
    process.exit(0);
  }, 5000);
}, 1000);

console.log('WebSocket test started');
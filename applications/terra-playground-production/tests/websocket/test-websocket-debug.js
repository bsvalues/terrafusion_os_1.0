/**
 * WebSocket Debug Test Script
 *
 * This script tests the WebSocket connection to the server using both
 * browser WebSocket API and the ws library.
 */
import { WebSocket } from 'ws';

// Create a WebSocket connection to the server
function testNativeWebSocket() {
  console.log('Testing native WebSocket connection...');
  const ws = new WebSocket(
    'wss://69340dc3-5f57-4cca-82d1-7ea6f9418cc4-00-1qhau0gno8lsl.picard.replit.dev/ws'
  );

  ws.on('open', () => {
    console.log('Connection established!');

    // Send a test message
    const testMessage = {
      type: 'message',
      content: 'Hello from test script',
      timestamp: Date.now(),
    };

    ws.send(JSON.stringify(testMessage));
    console.log('Test message sent');
  });

  ws.on('message', data => {
    console.log('Received message:', data.toString());

    // Close the connection after receiving a message
    setTimeout(() => {
      ws.close();
      console.log('Connection closed by client');
    }, 2000);
  });

  ws.on('error', error => {
    console.error('WebSocket error:', error.message);
  });

  ws.on('close', (code, reason) => {
    console.log(`Connection closed. Code: ${code}, Reason: ${reason || 'No reason'}`);
  });
}

// Main function
async function runTest() {
  try {
    // Test native WebSocket
    testNativeWebSocket();
  } catch (error) {
    console.error('Test failed:', error);
  }
}

// Run the test
runTest();

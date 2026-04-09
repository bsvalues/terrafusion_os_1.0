// WebSocket Client Tester
import WebSocket from 'ws';

// WebSocket connection URL with the specific path
const wsUrl = 'ws://localhost:5000/api/notifications/ws';

// Create WebSocket connection
console.log(`Connecting to WebSocket server at ${wsUrl}...`);
const ws = new WebSocket(wsUrl);

// Connection opened
ws.on('open', () => {
  console.log('Connected to server');
  
  // Send test authentication message
  const authMessage = {
    type: 'auth',
    userId: '1'
  };
  
  console.log('Sending authentication message:', authMessage);
  ws.send(JSON.stringify(authMessage));
});

// Listen for messages
ws.on('message', (data) => {
  try {
    const message = JSON.parse(data);
    console.log('Message from server:', message);
    
    // If we receive a notification, mark it as read
    if (message.type === 'notification' || message.type === 'system_notification') {
      const notification = message.notification;
      console.log(`Marking notification ${notification.id} as read...`);
      
      ws.send(JSON.stringify({
        type: 'mark_read',
        userId: '1',
        notificationId: notification.id
      }));
    }
  } catch (error) {
    console.error('Error parsing message:', error);
    console.log('Raw message data:', data.toString());
  }
});

// Handle errors
ws.on('error', (error) => {
  console.error('WebSocket error:', error);
});

// Handle connection closure
ws.on('close', (code, reason) => {
  console.log(`Connection closed with code ${code}: ${reason || 'No reason provided'}`);
});

// Keep the connection alive for a while to observe behavior
setTimeout(() => {
  console.log('Test complete, closing connection...');
  ws.close(1000, 'Test completed');
  
  // Exit after a short delay to allow for clean WebSocket closure
  setTimeout(() => {
    process.exit(0);
  }, 500);
}, 10000); // Run for 10 seconds
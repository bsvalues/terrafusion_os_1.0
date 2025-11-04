/**
 * Team Collaboration WebSocket Test Client
 * 
 * This script tests the team collaboration WebSocket functionality by:
 * 1. Opening a WebSocket connection to the server
 * 2. Sending authentication messages
 * 3. Sending and receiving chat messages between team members
 * 4. Testing status updates and task assignments in real-time
 */

// Import WebSocket for ESM
import { WebSocket } from 'ws';

// Determine server URL from environment
const port = process.env.PORT || 5000;
const serverUrl = `http://localhost:${port}`;
// console.log(`Running in ESM environment - Team Collaboration WebSocket Test`);
// console.log(`Using port ${port}`);

function connectWebSocket() {
  // console.log('Connecting to WebSocket server...');
  
  // Use the /ws/team-collaboration endpoint for team collaboration
  const wsUrl = `ws://localhost:${port}/ws/team-collaboration`;
  // console.log(`WebSocket URL: ${wsUrl}`);
  
  // Add request headers for better compatibility
  const socket = new WebSocket(wsUrl, [], {
    headers: {
      'Origin': `http://localhost:${port}`,
      'User-Agent': 'NodeJS-WebSocket-Client',
      'Sec-WebSocket-Protocol': 'team-collaboration-protocol',
      'Sec-WebSocket-Version': '13',
      'Connection': 'Upgrade',
      'Upgrade': 'websocket'
    },
    followRedirects: true,
    handshakeTimeout: 5000
  });
  
  // Track the connection ID for authentication
  let connectionId = null;
  
  // Event handlers
  socket.on('open', () => {
    // console.log('WebSocket connection established');
  });
  
  socket.on('message', (data) => {
    const message = JSON.parse(data.toString());
    // console.log('Received message:', message);
    
    // Handle authentication
    if (message.type === 'auth_required') {
      connectionId = message.connectionId;
      // Authenticate as Frontend Developer (ID: 1)
      sendAuthentication(socket, connectionId, 'session_1', 1, 'Frontend Developer', 'frontend_developer');
    }
    
    // Handle authentication success
    if (message.type === 'auth_success') {
      // console.log('Authentication successful!');
      
      // After successful authentication, start sending test messages
      setTimeout(() => sendChatMessage(socket, 'session_1', 1, 'Hello team! This is a test message from the Frontend Developer.'), 1000);
      
      // Send a status update after 2 seconds
      setTimeout(() => sendStatusUpdate(socket, 'session_1', 1, 'active', 'Working on UI components'), 2000);
      
      // Assign a task after 3 seconds
      setTimeout(() => assignTask(socket, 'session_1', 1, 2, 'task_123', 'Implement WebSocket client'), 3000);
    }
    
    // Handle session state
    if (message.type === 'session_state') {
      // console.log('Current users in session:', message.activeUsers);
    }
  });
  
  socket.on('error', (error) => {
    // console.error('WebSocket error:', error);
  });
  
  socket.on('close', (code, reason) => {
    // console.log(`WebSocket connection closed: ${code} ${reason}`);
  });
  
  return socket;
}

// Helper function to send authentication message
function sendAuthentication(socket, connectionId, sessionId, userId, userName, userRole) {
  // console.log(`Authenticating as ${userName} (ID: ${userId})...`);
  
  const authMessage = {
    type: 'authenticate',
    connectionId,
    sessionId,
    userId,
    userName, 
    userRole
  };
  
  socket.send(JSON.stringify(authMessage));
}

// Helper function to send chat message
function sendChatMessage(socket, sessionId, senderId, content) {
  // console.log(`Sending chat message: ${content}`);
  
  const chatMessage = {
    type: 'chat_message',
    sessionId,
    senderId,
    content,
    timestamp: new Date().toISOString()
  };
  
  socket.send(JSON.stringify(chatMessage));
}

// Helper function to send status update
function sendStatusUpdate(socket, sessionId, senderId, status, activity) {
  // console.log(`Sending status update: ${status} - ${activity}`);
  
  const statusMessage = {
    type: 'status_update',
    sessionId,
    senderId,
    status,
    activity,
    timestamp: new Date().toISOString()
  };
  
  socket.send(JSON.stringify(statusMessage));
}

// Helper function to assign task
function assignTask(socket, sessionId, senderId, assigneeId, taskId, taskTitle) {
  // console.log(`Assigning task "${taskTitle}" to user ${assigneeId}`);
  
  const taskMessage = {
    type: 'task_assigned',
    sessionId,
    senderId,
    taskId,
    taskTitle,
    assigneeId,
    assigneeName: 'Backend Developer',
    priority: 'high',
    timestamp: new Date().toISOString()
  };
  
  socket.send(JSON.stringify(taskMessage));
}

// Main test function
async function runTest() {
  try {
    // console.log('Starting Team Collaboration WebSocket test...');
    
    // Connect to WebSocket and keep connection open
    const socket = connectWebSocket();
    
    // Keep the script running for 10 seconds
    setTimeout(() => {
      // console.log('Test completed, closing connection...');
      socket.close();
      // console.log('---------------------------------------');
      // console.log('Team collaboration WebSocket test completed');
      // console.log('---------------------------------------');
      process.exit(0);
    }, 10000);
    
  } catch (error) {
    // console.error('Test failed:', error);
    process.exit(1);
  }
}

// Run the test
runTest();
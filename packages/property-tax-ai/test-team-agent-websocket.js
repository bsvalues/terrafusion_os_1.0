/**
 * Team Agent WebSocket Test Client
 * 
 * This script tests the team agent WebSocket functionality by:
 * 1. Connecting to the WebSocket server
 * 2. Authenticating with the server
 * 3. Sending and receiving messages
 * 4. Testing different message types
 */

const WebSocket = require('ws');
const { v4: uuidv4 } = require('uuid');

// Configuration
const baseUrl = 'ws://localhost:3000';
const wsPath = '/ws/team-collaboration';
const wsUrl = `${baseUrl}${wsPath}`;

// Test user data
const testUser = {
  userId: 101,
  userName: 'Test User',
  userRole: 'tester',
  sessionId: 'test-session-001'
};

// Message types
const MessageType = {
  JOIN_SESSION: 'join_session',
  LEAVE_SESSION: 'leave_session',
  CHAT_MESSAGE: 'chat_message',
  STATUS_UPDATE: 'status_update',
  TASK_ASSIGNED: 'task_assigned',
  TASK_UPDATED: 'task_updated',
  COMMENT_ADDED: 'comment_added',
  USER_ACTIVITY: 'user_activity',
  MEETING_REMINDER: 'meeting_reminder',
  ERROR: 'error',
  AUTH_REQUIRED: 'auth_required',
  AUTH_SUCCESS: 'auth_success',
  SESSION_STATE: 'session_state'
};

// Connect to WebSocket server
function connectWebSocket() {
  console.log(`Connecting to WebSocket server at ${wsUrl}...`);
  
  const socket = new WebSocket(wsUrl);
  let connectionId = null;
  
  // Handle open event
  socket.on('open', () => {
    console.log('WebSocket connection established');
  });
  
  // Handle message event
  socket.on('message', (data) => {
    try {
      const message = JSON.parse(data);
      console.log(`Received message: ${JSON.stringify(message, null, 2)}`);
      
      // Handle authentication required
      if (message.type === MessageType.AUTH_REQUIRED) {
        connectionId = message.connectionId;
        console.log(`Authentication required with connectionId: ${connectionId}`);
        
        // Send authentication message
        const authMessage = {
          type: 'authenticate',
          connectionId,
          sessionId: testUser.sessionId,
          userId: testUser.userId,
          userName: testUser.userName,
          userRole: testUser.userRole
        };
        
        console.log(`Sending authentication message: ${JSON.stringify(authMessage, null, 2)}`);
        socket.send(JSON.stringify(authMessage));
      }
      
      // Handle authentication success
      if (message.type === MessageType.AUTH_SUCCESS) {
        console.log('Authentication successful');
        sendTestMessages(socket);
      }
      
    } catch (error) {
      console.error('Error processing message:', error);
    }
  });
  
  // Handle error event
  socket.on('error', (error) => {
    console.error('WebSocket error:', error);
  });
  
  // Handle close event
  socket.on('close', (code, reason) => {
    console.log(`WebSocket connection closed with code ${code}: ${reason || 'No reason provided'}`);
  });
  
  return socket;
}

// Send test messages
function sendTestMessages(socket) {
  setTimeout(() => {
    // Send chat message
    const chatMessage = {
      type: MessageType.CHAT_MESSAGE,
      sessionId: testUser.sessionId,
      senderId: testUser.userId,
      senderName: testUser.userName,
      content: 'Hello, team! This is a test message.',
      timestamp: new Date().toISOString()
    };
    
    console.log(`Sending chat message: ${JSON.stringify(chatMessage, null, 2)}`);
    socket.send(JSON.stringify(chatMessage));
  }, 1000);
  
  setTimeout(() => {
    // Send status update
    const statusMessage = {
      type: MessageType.STATUS_UPDATE,
      sessionId: testUser.sessionId,
      senderId: testUser.userId,
      senderName: testUser.userName,
      status: 'busy',
      activity: 'Working on WebSocket integration',
      timestamp: new Date().toISOString()
    };
    
    console.log(`Sending status update: ${JSON.stringify(statusMessage, null, 2)}`);
    socket.send(JSON.stringify(statusMessage));
  }, 2000);
  
  setTimeout(() => {
    // Send task assigned message
    const taskMessage = {
      type: MessageType.TASK_ASSIGNED,
      sessionId: testUser.sessionId,
      senderId: testUser.userId,
      senderName: testUser.userName,
      taskId: uuidv4(),
      taskTitle: 'Implement WebSocket Testing',
      assigneeId: 102,
      assigneeName: 'Developer',
      priority: 'high',
      timestamp: new Date().toISOString()
    };
    
    console.log(`Sending task assigned: ${JSON.stringify(taskMessage, null, 2)}`);
    socket.send(JSON.stringify(taskMessage));
  }, 3000);
}

// Run the test
try {
  const socket = connectWebSocket();
  
  // Close the connection after 10 seconds
  setTimeout(() => {
    console.log('Test complete, closing connection');
    socket.close();
    process.exit(0);
  }, 10000);
} catch (error) {
  console.error('Error running WebSocket test:', error);
}
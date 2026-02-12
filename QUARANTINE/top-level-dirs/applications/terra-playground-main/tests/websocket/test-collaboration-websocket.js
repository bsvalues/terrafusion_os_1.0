/**
 * Collaboration WebSocket Test Client
 *
 * This script tests the WebSocket connection for collaborative workflows.
 * It establishes a connection to the server and demonstrates:
 * 1. Joining and leaving a collaboration session
 * 2. Sending and receiving cursor position updates
 * 3. Sending and receiving edit operations
 * 4. Handling disconnection and reconnection
 */

// Initialize WebSocket connection
function connectWebSocket() {
  // Determine protocol (ws or wss) based on current location
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  // Create WebSocket URL with the proper protocol and host
  const wsUrl = `${protocol}//${window.location.hostname}:${window.location.port}/ws/collaboration`;

  console.log(`Connecting to WebSocket at ${wsUrl}`);
  const socket = new WebSocket(wsUrl);

  // Connection opened
  socket.addEventListener('open', event => {
    console.log('Connected to collaboration WebSocket server');

    // Join a test session
    const joinMessage = {
      type: 'join_session',
      sessionId: 'test-session-1',
      userId: 1,
      userName: 'Test User',
      timestamp: Date.now(),
      payload: {
        role: 'editor',
      },
    };

    socket.send(JSON.stringify(joinMessage));
    console.log('Sent join session message', joinMessage);

    // Send cursor position after a delay
    setTimeout(() => {
      const cursorMessage = {
        type: 'cursor_position',
        sessionId: 'test-session-1',
        userId: 1,
        userName: 'Test User',
        timestamp: Date.now(),
        payload: {
          x: 120,
          y: 250,
          section: 'property-details',
        },
      };

      socket.send(JSON.stringify(cursorMessage));
      console.log('Sent cursor position message', cursorMessage);
    }, 2000);

    // Send an edit operation after a delay
    setTimeout(() => {
      const editMessage = {
        type: 'edit_operation',
        sessionId: 'test-session-1',
        userId: 1,
        userName: 'Test User',
        timestamp: Date.now(),
        payload: {
          operation: 'insert',
          path: 'property.description',
          value: 'Updated property description',
          revision: 1,
        },
      };

      socket.send(JSON.stringify(editMessage));
      console.log('Sent edit operation message', editMessage);
    }, 4000);

    // Leave the session after a delay
    setTimeout(() => {
      const leaveMessage = {
        type: 'leave_session',
        sessionId: 'test-session-1',
        userId: 1,
        userName: 'Test User',
        timestamp: Date.now(),
      };

      socket.send(JSON.stringify(leaveMessage));
      console.log('Sent leave session message', leaveMessage);

      // Close the connection after a brief delay
      setTimeout(() => {
        socket.close();
        console.log('WebSocket connection closed');
      }, 1000);
    }, 6000);
  });

  // Listen for messages
  socket.addEventListener('message', event => {
    console.log('Message from server:', event.data);
    try {
      const message = JSON.parse(event.data);
      console.log('Parsed message:', message);
    } catch (error) {
      console.error('Error parsing message:', error);
    }
  });

  // Connection closed
  socket.addEventListener('close', event => {
    console.log('WebSocket connection closed:', event.code, event.reason);
    // Attempt to reconnect after a delay
    if (event.code !== 1000) {
      // Normal closure
      console.log('Will attempt to reconnect in 5 seconds...');
      setTimeout(connectWebSocket, 5000);
    }
  });

  // Connection error
  socket.addEventListener('error', event => {
    console.error('WebSocket error:', event);
  });

  return socket;
}

// Start the WebSocket connection if running in browser
if (typeof window !== 'undefined') {
  window.addEventListener('load', () => {
    console.log('Page loaded, connecting to WebSocket...');
    connectWebSocket();
  });
}

// For Node.js environment (running as script)
if (typeof module !== 'undefined' && module.exports) {
  console.log('Running in Node.js environment');

  // Determine the port based on environment or use default
  // For Replit, try multiple common ports
  const possiblePorts = [3000, 5173, 8080];
  const port = process.env.PORT || 3000;

  console.log('Available environment variables:', Object.keys(process.env).join(', '));
  console.log(`Using port ${port} from environment or default`);

  // When running in Node.js, create a WebSocket client
  const WebSocket = require('ws');

  // Print debug information
  console.log('WS module loaded:', !!WebSocket);
  console.log('WebSocket.OPEN value:', WebSocket.OPEN);
  console.log('WebSocket ReadyState Values:', {
    CONNECTING: WebSocket.CONNECTING,
    OPEN: WebSocket.OPEN,
    CLOSING: WebSocket.CLOSING,
    CLOSED: WebSocket.CLOSED,
  });

  console.log(`Creating WebSocket connection to ws://localhost:${port}/ws/collaboration`);
  const socket = new WebSocket(`ws://localhost:${port}/ws/collaboration`);

  console.log('WebSocket client created, type:', typeof socket);
  console.log('Socket object keys:', Object.keys(socket));
  console.log('Initial ready state:', socket.readyState);
  console.log('Waiting for connection events...');

  socket.on('open', function open() {
    console.log('SUCCESS: Connected to WebSocket server');

    // Join a test session
    const joinMessage = {
      type: 'join_session',
      sessionId: 'test-session-1',
      userId: 1,
      userName: 'Test User',
      timestamp: Date.now(),
      payload: {
        role: 'editor',
      },
    };

    console.log('Sending join session message:', JSON.stringify(joinMessage, null, 2));
    socket.send(JSON.stringify(joinMessage));
    console.log('Join session message sent successfully');

    // Send cursor position after a delay
    setTimeout(() => {
      const cursorMessage = {
        type: 'cursor_position',
        sessionId: 'test-session-1',
        userId: 1,
        userName: 'Test User',
        timestamp: Date.now(),
        payload: {
          x: 120,
          y: 250,
          section: 'property-details',
        },
      };

      console.log('Sending cursor position message:', JSON.stringify(cursorMessage, null, 2));
      socket.send(JSON.stringify(cursorMessage));
      console.log('Cursor position message sent successfully');
    }, 2000);

    // Send a comment after a delay
    setTimeout(() => {
      const commentMessage = {
        type: 'comment',
        sessionId: 'test-session-1',
        userId: 1,
        userName: 'Test User',
        timestamp: Date.now(),
        payload: {
          text: 'This is a test comment from Node.js client',
        },
      };

      console.log('Sending comment message:', JSON.stringify(commentMessage, null, 2));
      socket.send(JSON.stringify(commentMessage));
      console.log('Comment message sent successfully');
    }, 4000);

    // Leave the session after a delay
    setTimeout(() => {
      const leaveMessage = {
        type: 'leave_session',
        sessionId: 'test-session-1',
        userId: 1,
        userName: 'Test User',
        timestamp: Date.now(),
      };

      console.log('Sending leave session message:', JSON.stringify(leaveMessage, null, 2));
      socket.send(JSON.stringify(leaveMessage));
      console.log('Leave session message sent successfully');

      // Close socket after another delay
      setTimeout(() => {
        console.log('Closing WebSocket connection...');
        socket.close();
      }, 1000);
    }, 6000);
  });

  socket.on('message', function incoming(data) {
    console.log('Received message from server:');
    try {
      const jsonData = JSON.parse(data);
      console.log(JSON.stringify(jsonData, null, 2));
    } catch (e) {
      console.log('Raw message (not JSON):', data.toString());
    }
  });

  socket.on('close', function close(code, reason) {
    console.log(
      `WebSocket connection closed: Code=${code}, Reason="${reason || 'No reason provided'}"`
    );
  });

  socket.on('error', function error(err) {
    console.error('WebSocket error occurred:');
    console.error(err.toString());
    console.error(
      'Error details:',
      JSON.stringify(
        {
          code: err.code,
          message: err.message,
          stack: err.stack,
        },
        null,
        2
      )
    );
  });

  // Keep the process running for a bit to complete the test
  setTimeout(() => {
    console.log('Test complete, exiting process.');
    process.exit(0);
  }, 10000);
}

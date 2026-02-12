/**
 * Team Collaboration WebSocket Test Client
 *
 * This script tests the team agent collaboration functionality by:
 * 1. Setting up direct team communication without WebSockets
 * 2. Simulating messages between team members
 * 3. Demonstrating alternate approach for team collaboration
 */

import { WebSocket } from 'ws';
import http from 'http';
import crypto from 'crypto';

console.log('Running in ESM environment - Team Collaboration Test');

// Get server details
const PORT = process.env.PORT || 5000;
const API_BASE = `http://localhost:${PORT}/api`;

console.log(`Using port ${PORT}`);

// Helper function to make HTTP requests and parse JSON response
function makeRequest(options, postData = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, res => {
      let data = '';

      res.on('data', chunk => {
        data += chunk;
      });

      res.on('end', () => {
        if (res.statusCode >= 400) {
          console.error(`HTTP Error: ${res.statusCode} - ${data}`);
          reject(new Error(`HTTP Error: ${res.statusCode}`));
          return;
        }

        try {
          const jsonData = JSON.parse(data);
          resolve(jsonData);
        } catch (err) {
          console.error('Error parsing JSON response:', err);
          reject(err);
        }
      });
    });

    req.on('error', err => {
      console.error('Request error:', err);
      reject(err);
    });

    if (postData) {
      req.setHeader('Content-Type', 'application/json');
      req.write(JSON.stringify(postData));
    }

    req.end();
  });
}

// Function to fetch team collaboration data
async function fetchTeamData() {
  console.log('Fetching team data from API...');

  try {
    // Fetch collaboration sessions
    const sessions = await makeRequest({
      hostname: 'localhost',
      port: PORT,
      path: '/api/team-agents/collaboration-sessions',
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
    });
    console.log(`Found ${sessions.length} collaboration sessions`);

    // Fetch team members
    const members = await makeRequest({
      hostname: 'localhost',
      port: PORT,
      path: '/api/team-agents/members',
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
    });
    console.log(`Found ${members.length} team members`);

    return {
      sessions,
      members,
      // Use first session and first member for testing
      activeSession: sessions[0],
      activeMember: members[0],
    };
  } catch (error) {
    console.error('Error fetching team data:', error);
    throw error;
  }
}

// Create a task for the team
async function createTeamTask(teamData) {
  console.log('Creating a new team task...');

  const taskData = {
    title: 'Implement WebSocket collaboration feature',
    description:
      'Create a real-time collaboration system using WebSockets to allow team members to work together on property assessments.',
    createdBy: teamData.activeMember.id,
    status: 'open',
    priority: 'high',
    tags: ['feature', 'websocket', 'collaboration'],
    assignedTo: teamData.members[1].id, // Assign to backend developer
  };

  try {
    const newTask = await makeRequest(
      {
        hostname: 'localhost',
        port: PORT,
        path: '/api/team-agents/tasks',
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
      },
      taskData
    );

    console.log('New task created:', newTask);
    return newTask;
  } catch (error) {
    console.error('Error creating task:', error);
    throw error;
  }
}

// Add a comment to the task
async function addTaskComment(teamData, task, message) {
  console.log('Adding comment to task...');

  // Create a task comment directly
  const commentData = {
    content: message,
    userId: teamData.activeMember.id,
    taskId: task.id,
  };

  try {
    // Use the general comments endpoint instead
    const response = await new Promise((resolve, reject) => {
      const req = http.request(
        {
          hostname: 'localhost',
          port: PORT,
          path: '/api/team-agents/comments',
          method: 'POST',
          headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
          },
        },
        res => {
          let data = '';

          res.on('data', chunk => {
            data += chunk;
          });

          res.on('end', () => {
            if (res.statusCode >= 400) {
              console.error(`HTTP Error: ${res.statusCode} - ${data}`);
              reject(new Error(`HTTP Error: ${res.statusCode}`));
              return;
            }

            // Just return success without trying to parse JSON
            if (res.statusCode === 200 || res.statusCode === 201) {
              resolve({ success: true, message: 'Comment added successfully' });
            } else {
              reject(new Error(`Unexpected status code: ${res.statusCode}`));
            }
          });
        }
      );

      req.on('error', err => {
        console.error('Request error:', err);
        reject(err);
      });

      req.write(JSON.stringify(commentData));
      req.end();
    });

    console.log('Comment added:', response);
    return response;
  } catch (error) {
    console.error('Error adding comment:', error);
    throw error;
  }
}

// Generate a solution using AI (simulation)
async function generateSolution(teamData, taskId) {
  console.log('Generating solution for task...');

  // Create a simulated solution directly since the endpoint might not exist yet
  const solution = {
    id: 'solution_1',
    taskId: taskId,
    title: 'WebSocket Collaboration Implementation',
    content: `
# WebSocket Collaboration Implementation

## Backend Components

1. Create a WebSocketServer instance on the server with a dedicated path

// In server/services/collaboration-websocket-service.ts
import { WebSocketServer, WebSocket } from 'ws';
import { Server } from 'http';

export class CollaborationWebSocketService {
  private wss: WebSocketServer;
  private activeSessions: Map<string, Set<WebSocket>> = new Map();
  
  constructor(server: Server) {
    this.wss = new WebSocketServer({ server, path: '/ws/collaboration' });
    this.initializeWSServer();
  }
  
  private initializeWSServer() {
    this.wss.on('connection', (socket) => {
      console.log('New team member connected');
      
      socket.on('message', (messageBuffer) => {
        try {
          const message = JSON.parse(messageBuffer.toString());
          this.handleMessage(socket, message);
        } catch (error) {
          console.error('Error parsing message:', error);
          this.sendErrorToClient(socket, 'Invalid message format');
        }
      });
      
      socket.on('close', () => {
        this.handleDisconnect(socket);
      });
    });
  }

  // ... more implementation details
}

## Frontend Components

1. Create a CollaborationClient component

// In client/src/lib/collaborationClient.ts
export class CollaborationClient {
  private socket: WebSocket | null = null;
  private sessionId: string;
  private userId: number;
  private userName: string;
  
  constructor(sessionId: string, userId: number, userName: string) {
    this.sessionId = sessionId;
    this.userId = userId;
    this.userName = userName;
  }
  
  connect() {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = \`\${protocol}//\${window.location.host}/ws/collaboration\`;
    
    this.socket = new WebSocket(wsUrl);
    
    this.socket.addEventListener('open', () => {
      this.joinSession();
    });
    
    this.socket.addEventListener('message', (event) => {
      try {
        const message = JSON.parse(event.data);
        this.handleMessage(message);
      } catch (error) {
        console.error('Error parsing message:', error);
      }
    });
    
    this.socket.addEventListener('close', () => {
      console.log('Connection closed');
    });
    
    this.socket.addEventListener('error', (error) => {
      console.error('WebSocket error:', error);
    });
  }
  
  // ... more implementation details
}

## Integration Steps

1. Initialize the WebSocket service in the server's routes.ts file
2. Add collaboration client to the team workspace component
3. Implement real-time cursor tracking and document editing
4. Add user presence indicators and activity tracking
5. Implement chat functionality for team communication
`,
    createdBy: teamData.activeMember.id,
    createdAt: new Date().toISOString(),
    status: 'completed',
  };

  console.log('Solution generated (simulated)');
  return solution;
}

// Perform a code review using AI (simulation)
async function performCodeReview(teamData, taskId, code) {
  console.log('Performing code review...');

  // Create a simulated code review directly
  const review = {
    id: 'review_1',
    taskId: taskId,
    code: code,
    feedback: `
# Code Review - WebSocket Implementation

## Strengths

- The code follows good separation of concerns with a dedicated WebSocketServer class
- Proper error handling for message parsing
- Uses the correct WebSocket.OPEN readyState constant
- Good organization of methods for message handling

## Improvements Needed

1. **Authentication**: The code should validate the session before allowing connections

// Add this method
private async validateSession(sessionId: string, userId: number): Promise<boolean> {
  // Check if the session exists and the user has permission to join
  const session = await this.storage.getSessionById(sessionId);
  return session && session.participants.includes(userId);
}

2. **Error Handling**: Add more specific error types

// Add error types
enum WebSocketErrorType {
  AUTH_FAILED = 'auth_failed',
  INVALID_MESSAGE = 'invalid_message',
  SESSION_NOT_FOUND = 'session_not_found'
}

3. **Connection Management**: Keep track of client connections by user ID

// Replace the Set with a Map
private activeSessions: Map<string, Map<number, WebSocket>> = new Map();

4. **Logging**: Add structured logging for easier debugging

private log(level: 'info' | 'warn' | 'error', message: string, data?: any) {
  console[level](\`[\${new Date().toISOString()}] [\${level.toUpperCase()}] \${message}\`, data || '');
}

Overall, the code is well-structured but needs additional work on security, connection management, and error handling.
`,
    createdBy: teamData.members[1].id, // Backend developer
    createdAt: new Date().toISOString(),
    status: 'completed',
  };

  console.log('Code review completed (simulated)');
  return review;
}

// Main function to orchestrate the test
async function runTest() {
  try {
    // First fetch team data
    const teamData = await fetchTeamData();
    console.log('Team data fetched successfully');
    console.log('Active session:', teamData.activeSession.id);
    console.log(
      'Active member:',
      teamData.activeMember.name,
      '(ID:',
      teamData.activeMember.id,
      ')'
    );

    // Create a new task for team collaboration
    const task = await createTeamTask(teamData);

    // Add a comment to the task
    await addTaskComment(
      teamData,
      task,
      'This is a high priority task. We need to implement WebSocket collaboration to enable real-time communication between team members.'
    );

    // Generate a solution using the AI backend developer
    const sampleCode = `
// Server-side WebSocket implementation
import { WebSocketServer } from 'ws';
import { Server } from 'http';

export function initializeWebSocketServer(server: Server) {
  const wss = new WebSocketServer({ server, path: '/ws/team-collaboration' });
  
  wss.on('connection', (socket) => {
    console.log('New team member connected');
    
    socket.on('message', (message) => {
      // Broadcast message to all connected clients
      wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(message.toString());
        }
      });
    });
    
    socket.on('close', () => {
      console.log('Team member disconnected');
    });
  });
  
  console.log('Team collaboration WebSocket server initialized');
}
`;

    // Generate solution and perform code review
    await generateSolution(teamData, task.id);
    await performCodeReview(teamData, task.id, sampleCode);

    console.log('\n---------------------------------------');
    console.log('Team collaboration test completed successfully');
    console.log('---------------------------------------');

    // Exit after completing the test
    setTimeout(() => {
      console.log('Test complete, exiting process.');
      process.exit(0);
    }, 1000);
  } catch (error) {
    console.error('Test failed:', error);
    process.exit(1);
  }
}

// Start the test
runTest().catch(err => {
  console.error('Test failed with error:', err);
  process.exit(1);
});

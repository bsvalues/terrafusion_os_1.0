import { WebSocketServer, WebSocket } from 'ws';
import { storage } from './storage';

// Extend WebSocketServer type to include custom methods
interface CustomWebSocketServer extends WebSocketServer {
  customEmit(event: string, data: any): void;
}

// Extend global scope to store the WebSocket server
declare global {
  var io: CustomWebSocketServer | undefined;
}

export function setupWebSocketServer(wss: WebSocketServer): CustomWebSocketServer {
  // Store the WebSocket server globally so it can be accessed from routes
  const customWss = wss as CustomWebSocketServer;

  // Add custom emit method to broadcast events
  customWss.customEmit = function (event: string, data: any) {
    customWss.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(
          JSON.stringify({
            event,
            data,
          })
        );
      }
    });
  };

  global.io = customWss;

  customWss.on('connection', (ws: WebSocket) => {
    console.log('WebSocket client connected');

    // Send initial data to the client
    const initialData = async () => {
      try {
        // Send recent audit events
        const recentEvents = await storage.getRecentAuditEvents(5);
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(
            JSON.stringify({
              type: 'INITIAL_EVENTS',
              events: recentEvents,
            })
          );
        }
      } catch (error) {
        console.error('Error sending initial data:', error);
      }
    };

    initialData();

    // Handle incoming messages from client
    ws.on('message', (data: string) => {
      try {
        const message = JSON.parse(data);
        console.log('Received message:', message);

        // Handle ping messages to keep connection alive
        if (message.type === 'PING') {
          ws.send(JSON.stringify({ type: 'PONG' }));
        } else {
          handleCollaborativeEvent(ws, message, customWss);
        }
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    });

    // Handle client disconnect
    ws.on('close', () => {
      console.log('WebSocket client disconnected');
    });
  });

  return customWss;
}

// Handle different types of collaborative events
function handleCollaborativeEvent(ws: WebSocket, data: any, wss: CustomWebSocketServer) {
  switch (data.type) {
    case 'ANNOTATION_CREATED':
      // Broadcast annotation creation to all clients
      wss.customEmit('ANNOTATION_CREATED', {
        annotation: data.annotation,
        user: data.user,
        timestamp: new Date().toISOString(),
      });
      break;

    case 'ANNOTATION_UPDATED':
      // Broadcast annotation update to all clients
      wss.customEmit('ANNOTATION_UPDATED', {
        annotation: data.annotation,
        user: data.user,
        timestamp: new Date().toISOString(),
      });
      break;

    case 'COMMENT_ADDED':
      // Broadcast new comment to all clients
      wss.customEmit('COMMENT_ADDED', {
        comment: data.comment,
        user: data.user,
        timestamp: new Date().toISOString(),
      });
      break;

    case 'USER_MENTIONED':
      // Send targeted notification to mentioned user
      wss.customEmit('USER_MENTIONED', {
        mentionedUser: data.mentionedUser,
        mentioningUser: data.mentioningUser,
        context: data.context,
        timestamp: new Date().toISOString(),
      });
      break;

    case 'STATUS_CHANGED':
      // Broadcast status change to all clients
      wss.customEmit('STATUS_CHANGED', {
        entityType: data.entityType,
        entityId: data.entityId,
        oldStatus: data.oldStatus,
        newStatus: data.newStatus,
        user: data.user,
        timestamp: new Date().toISOString(),
      });
      break;

    case 'TYPING_START':
      // Broadcast typing indicator
      wss.clients.forEach(client => {
        if (client !== ws && client.readyState === WebSocket.OPEN) {
          client.send(
            JSON.stringify({
              event: 'TYPING_START',
              data: {
                user: data.user,
                entityType: data.entityType,
                entityId: data.entityId,
              },
            })
          );
        }
      });
      break;

    case 'TYPING_STOP':
      // Stop typing indicator
      wss.clients.forEach(client => {
        if (client !== ws && client.readyState === WebSocket.OPEN) {
          client.send(
            JSON.stringify({
              event: 'TYPING_STOP',
              data: {
                user: data.user,
                entityType: data.entityType,
                entityId: data.entityId,
              },
            })
          );
        }
      });
      break;

    case 'USER_PRESENCE':
      // Update user presence
      wss.customEmit('USER_PRESENCE_UPDATE', {
        user: data.user,
        status: data.status, // online, away, offline
        lastSeen: new Date().toISOString(),
      });
      break;

    default:
      console.log('Unknown collaborative event type:', data.type);
  }
}

// Helper function to emit collaborative events from API routes
export function emitCollaborativeEvent(event: string, data: any) {
  if (global.io) {
    global.io.customEmit(event, data);
  }
}

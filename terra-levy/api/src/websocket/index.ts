/**
 * WebSocket Server Setup
 * Real-time communication for budget updates, notifications, and collaborative editing
 */

import { WebSocketServer, WebSocket } from 'ws';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '../utils/logger.js';

interface WebSocketClient extends WebSocket {
  id: string;
  userId?: string;
  subscriptions: Set<string>;
  isAlive: boolean;
}

interface WebSocketMessage {
  type: string;
  channel?: string;
  payload?: unknown;
  requestId?: string;
}

// Channel types for different real-time updates
export enum Channels {
  BUDGET_UPDATES = 'budget-updates',
  LEVY_UPDATES = 'levy-updates',
  PAYMENT_UPDATES = 'payment-updates',
  AI_RESPONSES = 'ai-responses',
  COLLABORATION = 'collaboration',
  NOTIFICATIONS = 'notifications',
}

// Store connected clients
const clients = new Map<string, WebSocketClient>();

// Channel subscriptions
const channelSubscriptions = new Map<string, Set<string>>();

export function setupWebSocket(wss: WebSocketServer): void {
  // Initialize channels
  Object.values(Channels).forEach(channel => {
    channelSubscriptions.set(channel, new Set());
  });

  // Heartbeat interval
  const heartbeatInterval = setInterval(() => {
    wss.clients.forEach((ws) => {
      const client = ws as WebSocketClient;
      if (!client.isAlive) {
        logger.debug({ clientId: client.id }, 'Terminating inactive WebSocket client');
        return client.terminate();
      }
      client.isAlive = false;
      client.ping();
    });
  }, 30000);

  wss.on('close', () => {
    clearInterval(heartbeatInterval);
  });

  wss.on('connection', (ws: WebSocket) => {
    const client = ws as WebSocketClient;
    client.id = uuidv4();
    client.subscriptions = new Set();
    client.isAlive = true;

    clients.set(client.id, client);
    logger.info({ clientId: client.id }, 'WebSocket client connected');

    // Send welcome message
    sendToClient(client, {
      type: 'connected',
      payload: {
        clientId: client.id,
        availableChannels: Object.values(Channels),
      },
    });

    // Handle pong (heartbeat response)
    client.on('pong', () => {
      client.isAlive = true;
    });

    // Handle incoming messages
    client.on('message', (data: Buffer) => {
      try {
        const message: WebSocketMessage = JSON.parse(data.toString());
        handleMessage(client, message);
      } catch (error) {
        logger.error({ clientId: client.id, error }, 'Failed to parse WebSocket message');
        sendToClient(client, {
          type: 'error',
          payload: { message: 'Invalid message format' },
        });
      }
    });

    // Handle disconnect
    client.on('close', () => {
      logger.info({ clientId: client.id }, 'WebSocket client disconnected');

      // Remove from all channel subscriptions
      client.subscriptions.forEach(channel => {
        channelSubscriptions.get(channel)?.delete(client.id);
      });

      clients.delete(client.id);
    });

    // Handle errors
    client.on('error', (error) => {
      logger.error({ clientId: client.id, error }, 'WebSocket error');
    });
  });

  logger.info('WebSocket server initialized');
}

function handleMessage(client: WebSocketClient, message: WebSocketMessage): void {
  const { type, channel, payload, requestId } = message;

  switch (type) {
    case 'subscribe':
      if (channel && Object.values(Channels).includes(channel as Channels)) {
        client.subscriptions.add(channel);
        channelSubscriptions.get(channel)?.add(client.id);
        logger.debug({ clientId: client.id, channel }, 'Client subscribed to channel');
        sendToClient(client, {
          type: 'subscribed',
          channel,
          requestId,
        });
      } else {
        sendToClient(client, {
          type: 'error',
          payload: { message: `Invalid channel: ${channel}` },
          requestId,
        });
      }
      break;

    case 'unsubscribe':
      if (channel) {
        client.subscriptions.delete(channel);
        channelSubscriptions.get(channel)?.delete(client.id);
        logger.debug({ clientId: client.id, channel }, 'Client unsubscribed from channel');
        sendToClient(client, {
          type: 'unsubscribed',
          channel,
          requestId,
        });
      }
      break;

    case 'authenticate':
      // Handle user authentication for personalized updates
      if (payload && typeof payload === 'object' && 'userId' in payload) {
        client.userId = (payload as { userId: string }).userId;
        logger.info({ clientId: client.id, userId: client.userId }, 'Client authenticated');
        sendToClient(client, {
          type: 'authenticated',
          payload: { userId: client.userId },
          requestId,
        });
      }
      break;

    case 'ping':
      sendToClient(client, { type: 'pong', requestId });
      break;

    default:
      logger.warn({ clientId: client.id, type }, 'Unknown message type');
      sendToClient(client, {
        type: 'error',
        payload: { message: `Unknown message type: ${type}` },
        requestId,
      });
  }
}

function sendToClient(client: WebSocketClient, message: WebSocketMessage): void {
  if (client.readyState === WebSocket.OPEN) {
    client.send(JSON.stringify(message));
  }
}

/**
 * Broadcast message to all subscribers of a channel
 */
export function broadcastToChannel(channel: Channels, message: Omit<WebSocketMessage, 'channel'>): void {
  const subscribers = channelSubscriptions.get(channel);
  if (!subscribers) return;

  const fullMessage: WebSocketMessage = {
    ...message,
    channel,
  };
  const messageStr = JSON.stringify(fullMessage);

  subscribers.forEach(clientId => {
    const client = clients.get(clientId);
    if (client && client.readyState === WebSocket.OPEN) {
      client.send(messageStr);
    }
  });

  logger.debug({ channel, subscriberCount: subscribers.size }, 'Broadcast sent to channel');
}

/**
 * Send message to a specific user (across all their connected clients)
 */
export function sendToUser(userId: string, message: WebSocketMessage): void {
  const messageStr = JSON.stringify(message);

  clients.forEach(client => {
    if (client.userId === userId && client.readyState === WebSocket.OPEN) {
      client.send(messageStr);
    }
  });
}

/**
 * Get count of connected clients
 */
export function getConnectionStats(): { total: number; authenticated: number; byChannel: Record<string, number> } {
  const byChannel: Record<string, number> = {};

  channelSubscriptions.forEach((subscribers, channel) => {
    byChannel[channel] = subscribers.size;
  });

  return {
    total: clients.size,
    authenticated: Array.from(clients.values()).filter(c => c.userId).length,
    byChannel,
  };
}

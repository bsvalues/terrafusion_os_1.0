/**
 * SimpleWebSocketServer
 *
 * A minimal WebSocket server implementation for debugging connection issues.
 * This server provides only the essential functionality without additional complexity.
 */

import { Server as HttpServer } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import { logger } from '../utils/logger';

export class SimpleWebSocketServer {
  private wss: WebSocketServer | null = null;

  /**
   * Initialize the WebSocket server with an HTTP server
   * @param server HTTP server to attach to
   * @param path WebSocket endpoint path
   */
  public initialize(server: HttpServer, path: string = '/ws-debug'): void {
    logger.info(`[SimpleWebSocketServer] Initializing at path: ${path}`);

    // Create WebSocket server
    this.wss = new WebSocketServer({
      server,
      path,
      clientTracking: true,
    });

    // Connection event
    this.wss.on('connection', (ws: WebSocket, request: any) => {
      const ip = request.headers['x-forwarded-for'] || request.socket.remoteAddress || 'unknown';

      logger.info('[SimpleWebSocketServer] Client connected', {
        ip,
        userAgent: request.headers['user-agent'] || 'unknown',
      });

      // Send welcome message
      ws.send(
        JSON.stringify({
          type: 'welcome',
          message: 'Welcome to the SimpleWebSocketServer',
          timestamp: Date.now(),
        })
      );

      // Message event
      ws.on('message', (data: any) => {
        logger.info('[SimpleWebSocketServer] Received message:', {
          data: data.toString(),
        });

        try {
          // Try to parse as JSON
          const message = JSON.parse(data.toString());

          // Echo the message back
          ws.send(
            JSON.stringify({
              type: 'echo',
              originalMessage: message,
              timestamp: Date.now(),
            })
          );
        } catch (e) {
          // Not JSON, echo as string
          ws.send(
            JSON.stringify({
              type: 'echo',
              originalMessage: data.toString(),
              timestamp: Date.now(),
            })
          );
        }
      });

      // Close event
      ws.on('close', (code: number, reason: string) => {
        logger.info('[SimpleWebSocketServer] Client disconnected', {
          code,
          reason: reason || 'No reason provided',
        });
      });

      // Error event
      ws.on('error', (error: Error) => {
        logger.error('[SimpleWebSocketServer] Client error', {
          error: error.message,
          stack: error.stack,
        });
      });
    });

    // Server error event
    this.wss.on('error', (error: Error) => {
      logger.error('[SimpleWebSocketServer] Server error', {
        error: error.message,
        stack: error.stack,
      });
    });

    logger.info(`[SimpleWebSocketServer] Initialized and listening on path: ${path}`);
  }

  /**
   * Close the WebSocket server
   */
  public close(): void {
    if (this.wss) {
      this.wss.close();
      this.wss = null;
      logger.info('[SimpleWebSocketServer] Closed');
    }
  }

  /**
   * Broadcast a message to all connected clients
   * @param message Message to broadcast
   */
  public broadcast(message: any): void {
    if (!this.wss) {
      return;
    }

    const data = typeof message === 'string' ? message : JSON.stringify(message);

    this.wss.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(data);
      }
    });
  }
}

/**
 * Transparency Engine WebSocket Server
 * Broadcasts agent activity in real-time to Portal frontend
 */

import { WebSocket, WebSocketServer } from 'ws';
import { DefaultTransparencyBus } from './bus';
import type { AgentAction } from './types';

const PORT = 8788;

export class TransparencyWebSocketServer {
  private wss: WebSocketServer;
  private clients: Set<WebSocket> = new Set();

  constructor(port: number = PORT) {
    this.wss = new WebSocketServer({ port });
    this.setupServer();
    this.subscribeToTransparencyBus();
  }

  private setupServer(): void {
    this.wss.on('connection', (ws: WebSocket) => {
      console.log('[TransparencyWS] Client connected');
      this.clients.add(ws);

      ws.on('close', () => {
        console.log('[TransparencyWS] Client disconnected');
        this.clients.delete(ws);
      });

      ws.on('error', error => {
        console.error('[TransparencyWS] Client error:', error);
        this.clients.delete(ws);
      });

      // Send initial connection confirmation
      ws.send(
        JSON.stringify({
          type: 'connected',
          message: 'TerraFusion Transparency Engine connected',
          timestamp: new Date().toISOString(),
        })
      );
    });

    this.wss.on('listening', () => {
      console.log(`[TransparencyWS] Server listening on port ${PORT}`);
    });

    this.wss.on('error', error => {
      console.error('[TransparencyWS] Server error:', error);
    });
  }

  private subscribeToTransparencyBus(): void {
    DefaultTransparencyBus.subscribe((action: AgentAction) => {
      this.broadcast(action);
    });
  }

  private broadcast(action: AgentAction): void {
    const message = JSON.stringify({
      type: 'agent-action',
      data: action,
      timestamp: new Date().toISOString(),
    });

    this.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        try {
          client.send(message);
        } catch (error) {
          console.error('[TransparencyWS] Failed to send to client:', error);
        }
      }
    });
  }

  public getClientCount(): number {
    return this.clients.size;
  }

  public close(): void {
    this.clients.forEach(client => client.close());
    this.wss.close();
    console.log('[TransparencyWS] Server closed');
  }
}

// Export singleton instance
export const transparencyWSServer = new TransparencyWebSocketServer();

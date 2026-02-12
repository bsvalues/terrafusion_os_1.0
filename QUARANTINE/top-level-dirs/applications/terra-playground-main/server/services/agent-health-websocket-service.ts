/**
 * Agent Health WebSocket Service
 *
 * This service handles WebSocket connections for real-time agent health monitoring updates.
 * It subscribes to the agent health monitoring service events and broadcasts updates to clients.
 */

import { WebSocketServer, WebSocket } from 'ws';
import { Server } from 'http';
import { agentHealthMonitoringService } from './agent-health-monitoring-service';
import { AgentSystem } from './agent-system';
import { IStorage } from '../storage';
import { logger } from '../utils/logger';

// Client types for tracking connection state
type HealthClient = {
  ws: WebSocket;
  id: string;
  agentSubscriptions: string[];
  isAlive: boolean;
  lastActivity: Date;
};

class AgentHealthWebSocketService {
  private static instance: AgentHealthWebSocketService;
  private wss: WebSocketServer | null = null;
  private clients: Map<string, HealthClient> = new Map();
  private pingInterval: NodeJS.Timeout | null = null;
  private storage: IStorage | null = null;
  private agentSystem: AgentSystem | null = null;

  private constructor() {
    // Private constructor for singleton pattern
  }

  public static getInstance(): AgentHealthWebSocketService {
    if (!AgentHealthWebSocketService.instance) {
      AgentHealthWebSocketService.instance = new AgentHealthWebSocketService();
    }
    return AgentHealthWebSocketService.instance;
  }

  /**
   * Initialize the WebSocket service with an HTTP server
   */
  public initialize(server: Server, storage: IStorage, agentSystem: AgentSystem): void {
    if (this.wss) {
      logger.warn(`Agent Health WebSocket service already initialized`);
      return;
    }

    this.storage = storage;
    this.agentSystem = agentSystem;

    // Create WebSocket server on a separate path to avoid conflicts with other WebSocket services
    this.wss = new WebSocketServer({
      server,
      path: '/ws/agent-health',
      // Allow connections from any origin for ease of integration with frontend
      verifyClient: (info, cb) => {
        // Basic validation - could be enhanced with auth tokens
        if (info.req.url?.startsWith('/ws/agent-health')) {
          cb(true);
        } else {
          cb(false, 401, 'Unauthorized');
        }
      },
    });

    // Set up connection handler
    this.wss.on('connection', this.handleConnection.bind(this));

    // Set up the health monitoring ping interval (every 30 seconds)
    this.pingInterval = setInterval(() => {
      this.pingClients();
    }, 30000);

    // Initialize the agent health monitoring service if not already initialized
    if (!agentHealthMonitoringService.isInitialized) {
      agentHealthMonitoringService.initialize(storage, agentSystem);
    }

    // Subscribe to agent health monitoring events
    this.subscribeToHealthEvents();

    logger.info(`Agent Health WebSocket service initialized at /ws/agent-health`);
  }

  /**
   * Shutdown the WebSocket service
   */
  public shutdown(): void {
    // Clear ping interval
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }

    // Close all client connections
    if (this.wss) {
      for (const client of this.clients.values()) {
        client.ws.terminate();
      }

      this.clients.clear();

      // Close the server
      this.wss.close(() => {
        logger.info(`Agent Health WebSocket service shutdown complete`);
      });

      this.wss = null;
    }
  }

  /**
   * Handle new WebSocket connections
   */
  private handleConnection(ws: WebSocket, request: any): void {
    const clientId = this.generateClientId();

    // Store client information
    const client: HealthClient = {
      ws,
      id: clientId,
      agentSubscriptions: [], // By default, subscribe to all agents
      isAlive: true,
      lastActivity: new Date(),
    };

    this.clients.set(clientId, client);

    // Send welcome message with client ID
    ws.send(
      JSON.stringify({
        type: 'connected',
        clientId,
        message: 'Connected to Agent Health Monitoring WebSocket',
        timestamp: new Date().toISOString(),
      })
    );

    // Set up event handlers for this connection
    ws.on('message', (message: string) => this.handleMessage(clientId, message));
    ws.on('close', () => this.handleClose(clientId));
    ws.on('error', error => this.handleError(clientId, error));

    // Set up ping/pong for connection health
    ws.on('pong', () => {
      if (this.clients.has(clientId)) {
        const client = this.clients.get(clientId)!;
        client.isAlive = true;
        client.lastActivity = new Date();
      }
    });

    // Send initial state to the client
    this.sendInitialState(clientId);

    logger.info(`New agent health monitoring client connected: ${clientId}`);
  }

  /**
   * Handle incoming messages from clients
   */
  private handleMessage(clientId: string, message: string): void {
    try {
      const client = this.clients.get(clientId);
      if (!client) return;

      // Update last activity timestamp
      client.lastActivity = new Date();

      // Parse the message
      const data = JSON.parse(message.toString());

      // Handle different message types
      switch (data.type) {
        case 'subscribe':
          this.handleSubscribe(clientId, data);
          break;

        case 'unsubscribe':
          this.handleUnsubscribe(clientId, data);
          break;

        case 'healthCheck':
          this.handleHealthCheck(clientId);
          break;

        case 'getAgents':
          this.handleGetAgents(clientId);
          break;

        case 'ping':
          // Simple ping/pong for client-initiated pings
          client.ws.send(
            JSON.stringify({
              type: 'pong',
              timestamp: new Date().toISOString(),
            })
          );
          break;

        default:
          logger.warn(`Unknown message type from client ${clientId}: ${data.type}`);
      }
    } catch (error) {
      logger.error(
        `Error handling message from client ${clientId}: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Handle client disconnection
   */
  private handleClose(clientId: string): void {
    if (this.clients.has(clientId)) {
      this.clients.delete(clientId);
      logger.info(`Agent health monitoring client disconnected: ${clientId}`);
    }
  }

  /**
   * Handle connection errors
   */
  private handleError(clientId: string, error: Error): void {
    logger.error(`WebSocket error for client ${clientId}: ${error.message}`);

    // Close and clean up the connection
    if (this.clients.has(clientId)) {
      const client = this.clients.get(clientId)!;
      client.ws.terminate();
      this.clients.delete(clientId);
    }
  }

  /**
   * Subscribe a client to specific agent updates
   */
  private handleSubscribe(clientId: string, data: any): void {
    const client = this.clients.get(clientId);
    if (!client) return;

    // If agentIds is provided in the message, subscribe to those agents
    if (data.agentIds && Array.isArray(data.agentIds)) {
      client.agentSubscriptions = data.agentIds;

      client.ws.send(
        JSON.stringify({
          type: 'subscribed',
          agentIds: client.agentSubscriptions,
          timestamp: new Date().toISOString(),
        })
      );

      logger.info(
        `Client ${clientId} subscribed to agents: ${client.agentSubscriptions.join(', ')}`
      );
    } else {
      // If no agentIds provided, subscribe to all agents (empty array means all)
      client.agentSubscriptions = [];

      client.ws.send(
        JSON.stringify({
          type: 'subscribed',
          agentIds: 'all',
          timestamp: new Date().toISOString(),
        })
      );

      logger.info(`Client ${clientId} subscribed to all agents`);
    }
  }

  /**
   * Unsubscribe a client from specific agent updates
   */
  private handleUnsubscribe(clientId: string, data: any): void {
    const client = this.clients.get(clientId);
    if (!client) return;

    if (data.agentIds && Array.isArray(data.agentIds)) {
      // Remove specified agentIds from subscriptions
      client.agentSubscriptions = client.agentSubscriptions.filter(
        id => !data.agentIds.includes(id)
      );

      client.ws.send(
        JSON.stringify({
          type: 'unsubscribed',
          agentIds: data.agentIds,
          timestamp: new Date().toISOString(),
        })
      );

      logger.info(`Client ${clientId} unsubscribed from agents: ${data.agentIds.join(', ')}`);
    } else {
      // Unsubscribe from all agents
      client.agentSubscriptions = [];

      client.ws.send(
        JSON.stringify({
          type: 'unsubscribed',
          agentIds: 'all',
          timestamp: new Date().toISOString(),
        })
      );

      logger.info(`Client ${clientId} unsubscribed from all agents`);
    }
  }

  /**
   * Trigger a manual health check
   */
  private async handleHealthCheck(clientId: string): Promise<void> {
    const client = this.clients.get(clientId);
    if (!client) return;

    try {
      await agentHealthMonitoringService.performHealthCheck();

      client.ws.send(
        JSON.stringify({
          type: 'healthCheckTriggered',
          timestamp: new Date().toISOString(),
        })
      );

      logger.info(`Manual health check triggered by client ${clientId}`);
    } catch (error) {
      client.ws.send(
        JSON.stringify({
          type: 'error',
          error: 'Failed to trigger health check',
          timestamp: new Date().toISOString(),
        })
      );

      logger.error(
        `Error triggering health check from client ${clientId}: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Send list of all registered agents
   */
  private handleGetAgents(clientId: string): void {
    const client = this.clients.get(clientId);
    if (!client) return;

    try {
      // Get list of agents from agent system
      const agentStatus = this.agentSystem?.getSystemStatus() || { agents: {} };
      const agents = Object.keys(agentStatus.agents).map(id => ({
        id,
        ...agentStatus.agents[id],
      }));

      client.ws.send(
        JSON.stringify({
          type: 'agentList',
          agents,
          count: agents.length,
          timestamp: new Date().toISOString(),
        })
      );
    } catch (error) {
      client.ws.send(
        JSON.stringify({
          type: 'error',
          error: 'Failed to retrieve agent list',
          timestamp: new Date().toISOString(),
        })
      );

      logger.error(
        `Error getting agent list for client ${clientId}: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Send initial state to a newly connected client
   */
  private async sendInitialState(clientId: string): Promise<void> {
    const client = this.clients.get(clientId);
    if (!client) return;

    try {
      // Get current health data for all agents
      const healthData = await agentHealthMonitoringService.getAllAgentHealth();

      client.ws.send(
        JSON.stringify({
          type: 'initialState',
          healthData,
          timestamp: new Date().toISOString(),
        })
      );
    } catch (error) {
      logger.error(
        `Error sending initial state to client ${clientId}: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Subscribe to health monitoring service events
   */
  private subscribeToHealthEvents(): void {
    // Handle health status changes
    agentHealthMonitoringService.on('health-status-changed', data => {
      this.broadcastToSubscribers(data.agentId, 'healthStatusChanged', data);
    });

    // Handle health metrics updates
    agentHealthMonitoringService.on('health-metrics-updated', data => {
      this.broadcastToSubscribers(data.agentId, 'healthMetricsUpdated', data);
    });

    // Handle new agent health registration
    agentHealthMonitoringService.on('health-status-initialized', data => {
      this.broadcastToAll('healthStatusInitialized', data);
    });
  }

  /**
   * Broadcast a message to all clients subscribed to a specific agent
   */
  private broadcastToSubscribers(agentId: string, type: string, data: any): void {
    const message = JSON.stringify({
      type,
      data,
      timestamp: new Date().toISOString(),
    });

    for (const client of this.clients.values()) {
      // Send to client if they're subscribed to all agents (empty array) or specifically to this agent
      if (client.agentSubscriptions.length === 0 || client.agentSubscriptions.includes(agentId)) {
        if (client.ws.readyState === WebSocket.OPEN) {
          client.ws.send(message);
        }
      }
    }
  }

  /**
   * Broadcast a message to all connected clients
   */
  private broadcastToAll(type: string, data: any): void {
    const message = JSON.stringify({
      type,
      data,
      timestamp: new Date().toISOString(),
    });

    for (const client of this.clients.values()) {
      if (client.ws.readyState === WebSocket.OPEN) {
        client.ws.send(message);
      }
    }
  }

  /**
   * Ping all clients to check connection health
   */
  private pingClients(): void {
    for (const [clientId, client] of this.clients.entries()) {
      if (client.isAlive === false) {
        // Client has not responded to ping, terminate the connection
        client.ws.terminate();
        this.clients.delete(clientId);
        logger.info(`Terminated inactive health monitoring client: ${clientId}`);
        continue;
      }

      // Reset the isAlive flag to false and send a ping
      client.isAlive = false;
      client.ws.ping();
    }
  }

  /**
   * Generate a unique client ID
   */
  private generateClientId(): string {
    return `health-client-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  }
}

// Export singleton instance
export const agentHealthWebSocketService = AgentHealthWebSocketService.getInstance();

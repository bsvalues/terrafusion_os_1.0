import { EventEmitter } from 'events';
import WebSocket from 'ws';
import { Logger } from '../utils/logger';
import { AgentConfiguration } from '../orchestrators/ai-swarm-coordinator';

/**
 * Enhancement #2: Real-Time Agent Communication Protocol
 * WebSocket-based mesh networking for 1,008+ agent coordination
 */

export interface AgentMessage {
  id: string;
  type: MessageType;
  sender: string;
  recipient: string | 'broadcast' | 'tier';
  timestamp: Date;
  payload: any;
  priority: MessagePriority;
  ttl: number; // Time to live in milliseconds
  routingHint?: string;
  correlationId?: string;
}

export interface AgentHeartbeat {
  agentId: string;
  timestamp: Date;
  status: AgentStatus;
  load: number; // 0-100%
  capabilities: string[];
  activeWorkflows: string[];
  networkLatency: number;
  lastActivity: Date;
}

export interface NetworkTopology {
  agents: Map<string, AgentNode>;
  tiers: Map<string, string[]>;
  connections: Map<string, Connection[]>;
  metrics: NetworkMetrics;
}

export interface AgentNode {
  id: string;
  tier: string;
  endpoint: string;
  status: AgentStatus;
  lastSeen: Date;
  neighbors: string[];
  load: number;
  capabilities: string[];
}

export interface Connection {
  from: string;
  to: string;
  quality: number; // 0-100%
  latency: number;
  bandwidth: number;
  established: Date;
  lastActivity: Date;
}

export interface NetworkMetrics {
  totalAgents: number;
  activeConnections: number;
  averageLatency: number;
  messagesThroughput: number;
  networkHealth: number;
  failedConnections: number;
  recoveredConnections: number;
}

export enum MessageType {
  HEARTBEAT = 'heartbeat',
  TASK_ASSIGNMENT = 'task_assignment',
  TASK_RESULT = 'task_result',
  COORDINATION = 'coordination',
  STATUS_UPDATE = 'status_update',
  ERROR_REPORT = 'error_report',
  WORKFLOW_EVENT = 'workflow_event',
  DISCOVERY = 'discovery',
  SHUTDOWN = 'shutdown',
  RESOURCE_REQUEST = 'resource_request',
  CAPABILITY_BROADCAST = 'capability_broadcast'
}

export enum MessagePriority {
  CRITICAL = 0,
  HIGH = 1,
  NORMAL = 2,
  LOW = 3,
  BACKGROUND = 4
}

export enum AgentStatus {
  INITIALIZING = 'initializing',
  ACTIVE = 'active',
  BUSY = 'busy',
  IDLE = 'idle',
  DEGRADED = 'degraded',
  OFFLINE = 'offline',
  FAILED = 'failed'
}

/**
 * Agent Communication Hub - Central messaging coordination
 */
export class AgentCommunicationHub extends EventEmitter {
  private logger: Logger;
  private server: WebSocket.Server;
  private connections: Map<string, WebSocket> = new Map();
  private topology: NetworkTopology;
  private messageQueue: Map<MessagePriority, AgentMessage[]> = new Map();
  private heartbeatInterval: NodeJS.Timer | null = null;
  private routingTable: Map<string, string[]> = new Map();
  private metrics: NetworkMetrics;
  private messageHistory: Map<string, AgentMessage> = new Map();

  constructor(port: number = 8080) {
    super();
    this.logger = new Logger('AgentCommunicationHub');
    this.initializeMessageQueues();
    this.initializeTopology();
    this.startWebSocketServer(port);
    this.startHeartbeatMonitoring();
  }

  private initializeMessageQueues(): void {
    Object.values(MessagePriority).forEach(priority => {
      if (typeof priority === 'number') {
        this.messageQueue.set(priority, []);
      }
    });
  }

  private initializeTopology(): void {
    this.topology = {
      agents: new Map(),
      tiers: new Map(),
      connections: new Map(),
      metrics: {
        totalAgents: 0,
        activeConnections: 0,
        averageLatency: 0,
        messagesThroughput: 0,
        networkHealth: 100,
        failedConnections: 0,
        recoveredConnections: 0
      }
    };

    this.metrics = this.topology.metrics;
  }

  private startWebSocketServer(port: number): void {
    this.server = new WebSocket.Server({ port });

    this.server.on('connection', (ws: WebSocket, req) => {
      this.handleNewConnection(ws, req);
    });

    this.server.on('error', (error) => {
      this.logger.error('WebSocket server error:', error);
    });

    this.logger.info(`🌐 Agent Communication Hub started on port ${port}`);
  }

  private handleNewConnection(ws: WebSocket, req: any): void {
    const agentId = this.extractAgentId(req);

    if (!agentId) {
      this.logger.warn('Connection attempt without valid agent ID');
      ws.close(1008, 'Invalid agent ID');
      return;
    }

    this.connections.set(agentId, ws);
    this.registerAgent(agentId, ws);

    ws.on('message', (data: WebSocket.RawData) => {
      this.handleIncomingMessage(agentId, data);
    });

    ws.on('close', () => {
      this.handleDisconnection(agentId);
    });

    ws.on('error', (error) => {
      this.logger.error(`Agent ${agentId} connection error:`, error);
      this.handleConnectionError(agentId, error);
    });

    this.logger.info(`🔗 Agent ${agentId} connected to communication hub`);
  }

  private extractAgentId(req: any): string | null {
    // Extract from URL query parameters or headers
    const url = new URL(req.url || '', 'http://localhost');
    return url.searchParams.get('agentId');
  }

  private registerAgent(agentId: string, ws: WebSocket): void {
    const agentNode: AgentNode = {
      id: agentId,
      tier: this.extractTierFromAgentId(agentId),
      endpoint: `ws://agent-${agentId}`,
      status: AgentStatus.INITIALIZING,
      lastSeen: new Date(),
      neighbors: [],
      load: 0,
      capabilities: []
    };

    this.topology.agents.set(agentId, agentNode);
    this.updateTierMapping(agentId, agentNode.tier);
    this.buildRoutingTable();
    this.sendWelcomeMessage(agentId);

    this.metrics.totalAgents = this.topology.agents.size;
    this.emit('agent_connected', { agentId, agentNode });
  }

  private extractTierFromAgentId(agentId: string): string {
    // Extract tier from agent ID pattern: TIER_XXX
    const parts = agentId.split('_');
    return parts[0] || 'UNKNOWN';
  }

  private updateTierMapping(agentId: string, tier: string): void {
    if (!this.topology.tiers.has(tier)) {
      this.topology.tiers.set(tier, []);
    }
    this.topology.tiers.get(tier)?.push(agentId);
  }

  private buildRoutingTable(): void {
    // Build efficient routing table for message delivery
    this.routingTable.clear();

    this.topology.agents.forEach((agent, agentId) => {
      const routes: string[] = [];

      // Direct connection (self)
      routes.push(agentId);

      // Tier-based routing
      const tierAgents = this.topology.tiers.get(agent.tier) || [];
      routes.push(...tierAgents.filter(id => id !== agentId));

      this.routingTable.set(agentId, routes);
    });
  }

  private sendWelcomeMessage(agentId: string): void {
    const welcomeMessage: AgentMessage = {
      id: this.generateMessageId(),
      type: MessageType.COORDINATION,
      sender: 'HUB',
      recipient: agentId,
      timestamp: new Date(),
      payload: {
        action: 'welcome',
        topology: this.getTopologySnapshot(),
        assignedTier: this.extractTierFromAgentId(agentId),
        capabilities: []
      },
      priority: MessagePriority.HIGH,
      ttl: 30000
    };

    this.routeMessage(welcomeMessage);
  }

  private handleIncomingMessage(agentId: string, data: WebSocket.RawData): void {
    try {
      const message: AgentMessage = JSON.parse(data.toString());
      message.timestamp = new Date(); // Server timestamp

      this.validateMessage(message);
      this.processMessage(agentId, message);
      this.updateAgentActivity(agentId);

    } catch (error) {
      this.logger.error(`Invalid message from agent ${agentId}:`, error);
    }
  }

  private validateMessage(message: AgentMessage): void {
    if (!message.id || !message.type || !message.sender) {
      throw new Error('Invalid message format');
    }

    if (message.ttl <= 0) {
      throw new Error('Message TTL expired');
    }

    // Additional validation logic
  }

  private processMessage(agentId: string, message: AgentMessage): void {
    // Store message in history
    this.messageHistory.set(message.id, message);

    // Handle different message types
    switch (message.type) {
      case MessageType.HEARTBEAT:
        this.handleHeartbeat(agentId, message.payload as AgentHeartbeat);
        break;

      case MessageType.TASK_RESULT:
        this.handleTaskResult(agentId, message);
        break;

      case MessageType.STATUS_UPDATE:
        this.handleStatusUpdate(agentId, message);
        break;

      case MessageType.CAPABILITY_BROADCAST:
        this.handleCapabilityBroadcast(agentId, message);
        break;

      default:
        this.routeMessage(message);
    }

    this.emit('message_processed', { agentId, message });
  }

  private handleHeartbeat(agentId: string, heartbeat: AgentHeartbeat): void {
    const agent = this.topology.agents.get(agentId);
    if (agent) {
      agent.status = heartbeat.status;
      agent.load = heartbeat.load;
      agent.capabilities = heartbeat.capabilities;
      agent.lastSeen = new Date();
    }

    this.updateNetworkMetrics();
  }

  private handleTaskResult(agentId: string, message: AgentMessage): void {
    // Forward task results to workflow engine
    this.emit('task_result', { agentId, result: message.payload });

    // Route to recipient if specified
    if (message.recipient !== 'broadcast') {
      this.routeMessage(message);
    }
  }

  private handleStatusUpdate(agentId: string, message: AgentMessage): void {
    const agent = this.topology.agents.get(agentId);
    if (agent) {
      agent.status = message.payload.status;
      agent.load = message.payload.load || agent.load;
    }
  }

  private handleCapabilityBroadcast(agentId: string, message: AgentMessage): void {
    const agent = this.topology.agents.get(agentId);
    if (agent) {
      agent.capabilities = message.payload.capabilities;
    }

    // Broadcast to coordination tier
    this.broadcastToTier('SWARM_COORDINATOR', message);
  }

  private routeMessage(message: AgentMessage): void {
    if (message.recipient === 'broadcast') {
      this.broadcastMessage(message);
    } else if (message.recipient === 'tier') {
      this.broadcastToTier(message.payload.targetTier, message);
    } else {
      this.sendDirectMessage(message.recipient, message);
    }
  }

  private broadcastMessage(message: AgentMessage): void {
    this.connections.forEach((ws, agentId) => {
      if (ws.readyState === WebSocket.OPEN && agentId !== message.sender) {
        this.sendToAgent(agentId, message);
      }
    });
  }

  private broadcastToTier(tier: string, message: AgentMessage): void {
    const tierAgents = this.topology.tiers.get(tier) || [];
    tierAgents.forEach(agentId => {
      if (agentId !== message.sender) {
        this.sendDirectMessage(agentId, message);
      }
    });
  }

  private sendDirectMessage(recipientId: string, message: AgentMessage): void {
    const ws = this.connections.get(recipientId);
    if (ws && ws.readyState === WebSocket.OPEN) {
      this.sendToAgent(recipientId, message);
    } else {
      this.queueMessage(message);
    }
  }

  private sendToAgent(agentId: string, message: AgentMessage): void {
    const ws = this.connections.get(agentId);
    if (ws && ws.readyState === WebSocket.OPEN) {
      try {
        ws.send(JSON.stringify(message));
        this.updateMessageMetrics();
      } catch (error) {
        this.logger.error(`Failed to send message to agent ${agentId}:`, error);
        this.queueMessage(message);
      }
    }
  }

  private queueMessage(message: AgentMessage): void {
    const queue = this.messageQueue.get(message.priority) || [];
    queue.push(message);
    this.messageQueue.set(message.priority, queue);
  }

  private handleDisconnection(agentId: string): void {
    this.connections.delete(agentId);

    const agent = this.topology.agents.get(agentId);
    if (agent) {
      agent.status = AgentStatus.OFFLINE;
      agent.lastSeen = new Date();
    }

    this.logger.info(`🔌 Agent ${agentId} disconnected`);
    this.emit('agent_disconnected', { agentId });
    this.updateNetworkMetrics();
  }

  private handleConnectionError(agentId: string, error: Error): void {
    this.logger.error(`Connection error for agent ${agentId}:`, error);
    this.metrics.failedConnections++;
    this.emit('connection_error', { agentId, error });
  }

  private startHeartbeatMonitoring(): void {
    this.heartbeatInterval = setInterval(() => {
      this.checkHeartbeats();
      this.processMessageQueues();
      this.updateNetworkHealth();
    }, 5000); // Every 5 seconds
  }

  private checkHeartbeats(): void {
    const now = new Date();
    const timeout = 30000; // 30 seconds

    this.topology.agents.forEach((agent, agentId) => {
      const timeSinceLastSeen = now.getTime() - agent.lastSeen.getTime();

      if (timeSinceLastSeen > timeout && agent.status !== AgentStatus.OFFLINE) {
        agent.status = AgentStatus.OFFLINE;
        this.handleDisconnection(agentId);
      }
    });
  }

  private processMessageQueues(): void {
    // Process messages by priority
    for (let priority = MessagePriority.CRITICAL; priority <= MessagePriority.BACKGROUND; priority++) {
      const queue = this.messageQueue.get(priority) || [];

      while (queue.length > 0) {
        const message = queue.shift()!;

        // Check TTL
        const age = Date.now() - message.timestamp.getTime();
        if (age > message.ttl) {
          continue; // Skip expired message
        }

        this.routeMessage(message);
      }
    }
  }

  private updateAgentActivity(agentId: string): void {
    const agent = this.topology.agents.get(agentId);
    if (agent) {
      agent.lastSeen = new Date();
    }
  }

  private updateMessageMetrics(): void {
    this.metrics.messagesThroughput++;
  }

  private updateNetworkMetrics(): void {
    const activeAgents = Array.from(this.topology.agents.values())
      .filter(agent => agent.status === AgentStatus.ACTIVE || agent.status === AgentStatus.BUSY);

    this.metrics.totalAgents = this.topology.agents.size;
    this.metrics.activeConnections = this.connections.size;

    // Calculate network health
    const healthyAgents = activeAgents.length;
    const totalAgents = this.topology.agents.size;
    this.metrics.networkHealth = totalAgents > 0 ? (healthyAgents / totalAgents) * 100 : 0;
  }

  private updateNetworkHealth(): void {
    this.updateNetworkMetrics();
    this.emit('network_metrics_updated', this.metrics);
  }

  private generateMessageId(): string {
    return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private getTopologySnapshot(): Partial<NetworkTopology> {
    return {
      agents: new Map(this.topology.agents),
      tiers: new Map(this.topology.tiers),
      metrics: { ...this.metrics }
    };
  }

  // ==========================================
  // PUBLIC API METHODS
  // ==========================================

  /**
   * Send message to specific agent
   */
  public sendMessage(message: Partial<AgentMessage>): void {
    const fullMessage: AgentMessage = {
      id: this.generateMessageId(),
      type: MessageType.COORDINATION,
      sender: 'HUB',
      recipient: message.recipient || 'broadcast',
      timestamp: new Date(),
      payload: message.payload || {},
      priority: message.priority || MessagePriority.NORMAL,
      ttl: message.ttl || 60000,
      ...message
    } as AgentMessage;

    this.routeMessage(fullMessage);
  }

  /**
   * Get network topology
   */
  public getTopology(): NetworkTopology {
    return { ...this.topology };
  }

  /**
   * Get network metrics
   */
  public getMetrics(): NetworkMetrics {
    return { ...this.metrics };
  }

  /**
   * Get agents by status
   */
  public getAgentsByStatus(status: AgentStatus): AgentNode[] {
    return Array.from(this.topology.agents.values())
      .filter(agent => agent.status === status);
  }

  /**
   * Get agents by tier
   */
  public getAgentsByTier(tier: string): string[] {
    return this.topology.tiers.get(tier) || [];
  }

  /**
   * Shutdown communication hub
   */
  public shutdown(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }

    this.connections.forEach((ws) => {
      ws.close();
    });

    this.server.close();
    this.logger.info('🔴 Agent Communication Hub shutdown complete');
  }
}

// Export singleton instance
export const agentCommunicationHub = new AgentCommunicationHub(8080);
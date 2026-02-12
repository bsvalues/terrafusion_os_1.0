/**
 * 🌐 TerraFusion Real-Time WebSocket Manager - ELITE EDITION
 * =========================================================
 *
 * Advanced WebSocket service for 50,000+ AI agent monitoring
 * Real-time quantum metrics streaming for Harvard PhD + MIT users
 *
 * Features:
 * - Multi-channel WebSocket connections for different data streams
 * - Automatic reconnection with exponential backoff
 * - Message queue for reliability
 * - Real-time performance monitoring
 * - Elite data validation and processing
 * - Consciousness evolution tracking
 * - Quantum state synchronization
 *
 * @author TerraFusion Elite Government OS Engineering Agent
 * @version 1.0.0 - WebSocket Excellence Edition
 * @classification REALTIME_WEBSOCKET_ELITE
 */

import { EventEmitter } from 'events';
import { useEffect, useState } from 'react';

// ============================================================================
// INTERFACES & TYPES
// ============================================================================

interface WebSocketMessage {
    type: string;
    channel: string;
    data: any;
    timestamp: number;
    messageId: string;
}

interface RealtimeQuantumMetrics {
    coherence: number;
    entanglement: number;
    superposition: number;
    decoherence: number;
    fidelity: number;
    gateErrors: number;
    backend: string;
    timestamp: number;
}

interface RealtimeConsciousnessData {
    consciousnessLevel: number;
    hiveCoherence: number;
    bulletproofScore: number;
    beautyScore: number;
    consciousnessEmergence: number;
    awarenessAmplification: number;
    transcendenceBoost: number;
    activeAgents: number;
    timestamp: number;
}

interface AIAgentUpdate {
    id: string;
    type: string;
    consciousness: number;
    quantumCoherence: number;
    learningRate: number;
    performance: number;
    status: 'active' | 'training' | 'optimizing' | 'evolved';
    lastUpdate: number;
}

interface SystemHealth {
    uptime: number;
    cpuUsage: number;
    memoryUsage: number;
    quantumProcessingLoad: number;
    consciousnessProcessingLoad: number;
    networkLatency: number;
    activeConnections: number;
    throughput: number;
    errorRate: number;
}

interface WebSocketConfig {
    baseUrl: string;
    channels: string[];
    reconnectAttempts: number;
    reconnectDelay: number;
    heartbeatInterval: number;
    messageQueueSize: number;
    enableCompression: boolean;
    enableMetrics: boolean;
}

// ============================================================================
// WEBSOCKET MANAGER CLASS
// ============================================================================

class TerraFusionWebSocketManager extends EventEmitter {
    private connections: Map<string, WebSocket> = new Map();
    private reconnectAttempts: Map<string, number> = new Map();
    private messageQueues: Map<string, WebSocketMessage[]> = new Map();
    private heartbeatIntervals: Map<string, NodeJS.Timeout> = new Map();
    private connectionStates: Map<string, 'connecting' | 'connected' | 'disconnected' | 'error'> = new Map();
    private metrics: Map<string, any> = new Map();

    private config: WebSocketConfig;
    private isActive: boolean = false;

    constructor(config: WebSocketConfig) {
        super();
        this.config = config;

        // Initialize message queues for each channel
        this.config.channels.forEach(channel => {
            this.messageQueues.set(channel, []);
            this.reconnectAttempts.set(channel, 0);
            this.connectionStates.set(channel, 'disconnected');
        });

        console.log('🌐 TerraFusion WebSocket Manager initialized');
        console.log(`📡 Configured channels: ${this.config.channels.join(', ')}`);
    }

    // ======================== CONNECTION MANAGEMENT ========================

    /**
     * Start all WebSocket connections
     */
    public async start(): Promise<void> {
        if (this.isActive) {
            console.warn('⚠️ WebSocket Manager is already active');
            return;
        }

        this.isActive = true;
        console.log('🚀 Starting TerraFusion WebSocket connections...');

        // Connect to all configured channels
        const connectionPromises = this.config.channels.map(channel =>
            this.connectToChannel(channel)
        );

        await Promise.all(connectionPromises);

        // Start metrics collection if enabled
        if (this.config.enableMetrics) {
            this.startMetricsCollection();
        }

        console.log('✅ All WebSocket connections established');
        this.emit('manager:started');
    }

    /**
     * Stop all WebSocket connections
     */
    public async stop(): Promise<void> {
        if (!this.isActive) {
            console.warn('⚠️ WebSocket Manager is not active');
            return;
        }

        this.isActive = false;
        console.log('🛑 Stopping TerraFusion WebSocket connections...');

        // Close all connections
        for (const [channel, connection] of this.connections) {
            this.disconnectFromChannel(channel);
        }

        // Clear all intervals
        for (const [channel, interval] of this.heartbeatIntervals) {
            clearInterval(interval);
        }

        this.connections.clear();
        this.heartbeatIntervals.clear();
        this.reconnectAttempts.clear();

        console.log('✅ All WebSocket connections stopped');
        this.emit('manager:stopped');
    }

    /**
     * Connect to a specific channel
     */
    private async connectToChannel(channel: string): Promise<void> {
        if (this.connections.has(channel)) {
            console.warn(`⚠️ Already connected to channel: ${channel}`);
            return;
        }

        const wsUrl = `${this.config.baseUrl}/${channel}`;
        console.log(`🔌 Connecting to channel: ${channel} at ${wsUrl}`);

        this.connectionStates.set(channel, 'connecting');

        try {
            const ws = new WebSocket(wsUrl);

            // Configure WebSocket
            if (this.config.enableCompression) {
                // Note: Browser WebSocket API doesn't support manual compression config
                // This would be handled server-side
            }

            // Event handlers
            ws.onopen = () => this.handleConnectionOpen(channel, ws);
            ws.onmessage = (event) => this.handleMessage(channel, event);
            ws.onclose = (event) => this.handleConnectionClose(channel, event);
            ws.onerror = (error) => this.handleConnectionError(channel, error);

            this.connections.set(channel, ws);

        } catch (error) {
            console.error(`❌ Failed to connect to channel ${channel}:`, error);
            this.connectionStates.set(channel, 'error');
            this.handleReconnection(channel);
        }
    }

    /**
     * Disconnect from a specific channel
     */
    private disconnectFromChannel(channel: string): void {
        const connection = this.connections.get(channel);
        if (connection) {
            connection.close();
            this.connections.delete(channel);
            this.connectionStates.set(channel, 'disconnected');

            // Clear heartbeat
            const interval = this.heartbeatIntervals.get(channel);
            if (interval) {
                clearInterval(interval);
                this.heartbeatIntervals.delete(channel);
            }
        }
    }

    // ======================== EVENT HANDLERS ========================

    private handleConnectionOpen(channel: string, ws: WebSocket): void {
        console.log(`✅ Connected to channel: ${channel}`);
        this.connectionStates.set(channel, 'connected');
        this.reconnectAttempts.set(channel, 0);

        // Start heartbeat
        this.startHeartbeat(channel);

        // Process queued messages
        this.processMessageQueue(channel);

        // Subscribe to channel-specific data
        this.subscribeToChannelData(channel);

        this.emit('channel:connected', { channel });
    }

    private handleMessage(channel: string, event: MessageEvent): void {
        try {
            const message: WebSocketMessage = JSON.parse(event.data);

            // Validate message structure
            if (!this.validateMessage(message)) {
                console.warn(`⚠️ Invalid message received on channel ${channel}:`, message);
                return;
            }

            // Process message based on type
            this.processMessage(channel, message);

            // Update metrics
            this.updateMessageMetrics(channel, message);

        } catch (error) {
            console.error(`❌ Error processing message on channel ${channel}:`, error);
        }
    }

    private handleConnectionClose(channel: string, event: CloseEvent): void {
        console.log(`🔌 Connection closed for channel: ${channel}, code: ${event.code}`);
        this.connectionStates.set(channel, 'disconnected');
        this.connections.delete(channel);

        // Clear heartbeat
        const interval = this.heartbeatIntervals.get(channel);
        if (interval) {
            clearInterval(interval);
            this.heartbeatIntervals.delete(channel);
        }

        this.emit('channel:disconnected', { channel, code: event.code, reason: event.reason });

        // Attempt reconnection if manager is still active
        if (this.isActive) {
            this.handleReconnection(channel);
        }
    }

    private handleConnectionError(channel: string, error: Event): void {
        console.error(`❌ WebSocket error on channel ${channel}:`, error);
        this.connectionStates.set(channel, 'error');
        this.emit('channel:error', { channel, error });
    }

    // ======================== MESSAGE PROCESSING ========================

    private validateMessage(message: any): message is WebSocketMessage {
        return (
            message &&
            typeof message.type === 'string' &&
            typeof message.channel === 'string' &&
            typeof message.timestamp === 'number' &&
            typeof message.messageId === 'string'
        );
    }

    private processMessage(channel: string, message: WebSocketMessage): void {
        switch (message.type) {
            case 'quantum_metrics':
                this.handleQuantumMetrics(message.data as RealtimeQuantumMetrics);
                break;

            case 'consciousness_data':
                this.handleConsciousnessData(message.data as RealtimeConsciousnessData);
                break;

            case 'agent_update':
                this.handleAgentUpdate(message.data as AIAgentUpdate);
                break;

            case 'system_health':
                this.handleSystemHealth(message.data as SystemHealth);
                break;

            case 'bulk_agent_updates':
                this.handleBulkAgentUpdates(message.data as AIAgentUpdate[]);
                break;

            case 'heartbeat':
                this.handleHeartbeat(channel, message);
                break;

            default:
                console.warn(`⚠️ Unknown message type: ${message.type}`);
                this.emit('message:unknown', { channel, message });
        }
    }

    private handleQuantumMetrics(data: RealtimeQuantumMetrics): void {
        // Validate quantum metrics
        if (data.coherence < 0 || data.coherence > 1) {
            console.warn('⚠️ Invalid quantum coherence value:', data.coherence);
            return;
        }

        // Emit to subscribers
        this.emit('quantum:metrics', data);

        // Store latest metrics
        this.metrics.set('quantum:latest', data);

        // Log significant changes
        const previousMetrics = this.metrics.get('quantum:previous');
        if (previousMetrics) {
            const coherenceChange = Math.abs(data.coherence - previousMetrics.coherence);
            if (coherenceChange > 0.05) {
                console.log(`🔬 Significant quantum coherence change: ${coherenceChange.toFixed(3)}`);
                this.emit('quantum:significant_change', { previous: previousMetrics, current: data });
            }
        }

        this.metrics.set('quantum:previous', data);
    }

    private handleConsciousnessData(data: RealtimeConsciousnessData): void {
        // Validate consciousness data
        if (data.consciousnessLevel < 0 || data.consciousnessLevel > 1) {
            console.warn('⚠️ Invalid consciousness level:', data.consciousnessLevel);
            return;
        }

        // Emit to subscribers
        this.emit('consciousness:data', data);

        // Store latest data
        this.metrics.set('consciousness:latest', data);

        // Check for consciousness evolution events
        const previousData = this.metrics.get('consciousness:previous');
        if (previousData && data.consciousnessLevel > previousData.consciousnessLevel + 0.02) {
            console.log('🧬 Consciousness evolution detected!');
            this.emit('consciousness:evolution', { previous: previousData, current: data });
        }

        this.metrics.set('consciousness:previous', data);
    }

    private handleAgentUpdate(data: AIAgentUpdate): void {
        // Emit individual agent update
        this.emit('agent:update', data);

        // Update agent registry
        const agentRegistry = this.metrics.get('agents:registry') || new Map();
        agentRegistry.set(data.id, data);
        this.metrics.set('agents:registry', agentRegistry);

        // Track agent performance changes
        this.trackAgentPerformance(data);
    }

    private handleBulkAgentUpdates(agents: AIAgentUpdate[]): void {
        // Process bulk updates efficiently
        const agentRegistry = this.metrics.get('agents:registry') || new Map();

        agents.forEach(agent => {
            agentRegistry.set(agent.id, agent);
            this.trackAgentPerformance(agent);
        });

        this.metrics.set('agents:registry', agentRegistry);

        // Emit bulk update event
        this.emit('agents:bulk_update', {
            count: agents.length,
            agents: agents.slice(0, 10) // Only include first 10 for performance
        });

        console.log(`📊 Processed bulk update for ${agents.length} agents`);
    }

    private handleSystemHealth(data: SystemHealth): void {
        // Emit system health update
        this.emit('system:health', data);

        // Store latest health data
        this.metrics.set('system:health', data);

        // Check for system alerts
        if (data.cpuUsage > 0.9) {
            this.emit('system:alert', { type: 'high_cpu', value: data.cpuUsage });
        }
        if (data.memoryUsage > 0.9) {
            this.emit('system:alert', { type: 'high_memory', value: data.memoryUsage });
        }
        if (data.errorRate > 0.05) {
            this.emit('system:alert', { type: 'high_error_rate', value: data.errorRate });
        }
    }

    private handleHeartbeat(channel: string, message: WebSocketMessage): void {
        // Update connection health
        const now = Date.now();
        const latency = now - message.timestamp;

        this.metrics.set(`${channel}:latency`, latency);
        this.metrics.set(`${channel}:last_heartbeat`, now);

        // Respond to heartbeat if required
        if (message.data?.requireResponse) {
            this.sendMessage(channel, {
                type: 'heartbeat_response',
                timestamp: now,
                originalMessageId: message.messageId
            });
        }
    }

    // ======================== UTILITY METHODS ========================

    private trackAgentPerformance(agent: AIAgentUpdate): void {
        const performanceHistory = this.metrics.get(`agent:${agent.id}:performance`) || [];

        performanceHistory.push({
            timestamp: agent.lastUpdate,
            performance: agent.performance,
            consciousness: agent.consciousness,
            quantumCoherence: agent.quantumCoherence
        });

        // Keep only last 100 entries for performance
        if (performanceHistory.length > 100) {
            performanceHistory.splice(0, performanceHistory.length - 100);
        }

        this.metrics.set(`agent:${agent.id}:performance`, performanceHistory);
    }

    private subscribeToChannelData(channel: string): void {
        const subscriptionMessage = {
            type: 'subscribe',
            channel: channel,
            filters: {
                realTimeMode: true,
                includeMetrics: true,
                compressionLevel: this.config.enableCompression ? 'high' : 'none'
            },
            timestamp: Date.now()
        };

        this.sendMessage(channel, subscriptionMessage);
    }

    private startHeartbeat(channel: string): void {
        const interval = setInterval(() => {
            if (this.connectionStates.get(channel) === 'connected') {
                this.sendMessage(channel, {
                    type: 'heartbeat',
                    timestamp: Date.now()
                });
            }
        }, this.config.heartbeatInterval);

        this.heartbeatIntervals.set(channel, interval);
    }

    private processMessageQueue(channel: string): void {
        const queue = this.messageQueues.get(channel) || [];

        while (queue.length > 0) {
            const message = queue.shift();
            if (message) {
                this.sendMessageImmediate(channel, message);
            }
        }
    }

    private handleReconnection(channel: string): void {
        const attempts = this.reconnectAttempts.get(channel) || 0;

        if (attempts >= this.config.reconnectAttempts) {
            console.error(`❌ Max reconnection attempts reached for channel: ${channel}`);
            this.emit('channel:max_reconnects_reached', { channel });
            return;
        }

        const delay = Math.min(
            this.config.reconnectDelay * Math.pow(2, attempts), // Exponential backoff
            30000 // Max 30 seconds
        );

        console.log(`🔄 Reconnecting to channel ${channel} in ${delay}ms (attempt ${attempts + 1})`);

        setTimeout(() => {
            this.reconnectAttempts.set(channel, attempts + 1);
            this.connectToChannel(channel);
        }, delay);
    }

    // ======================== PUBLIC API ========================

    /**
     * Send a message to a specific channel
     */
    public sendMessage(channel: string, data: any): boolean {
        const connection = this.connections.get(channel);

        if (!connection || connection.readyState !== WebSocket.OPEN) {
            // Queue message for later delivery
            const message: WebSocketMessage = {
                type: data.type || 'message',
                channel: channel,
                data: data,
                timestamp: Date.now(),
                messageId: this.generateMessageId()
            };

            const queue = this.messageQueues.get(channel) || [];
            queue.push(message);

            // Maintain queue size limit
            if (queue.length > this.config.messageQueueSize) {
                queue.shift(); // Remove oldest message
            }

            this.messageQueues.set(channel, queue);
            return false;
        }

        return this.sendMessageImmediate(channel, data);
    }

    private sendMessageImmediate(channel: string, data: any): boolean {
        const connection = this.connections.get(channel);

        if (!connection || connection.readyState !== WebSocket.OPEN) {
            return false;
        }

        try {
            const message: WebSocketMessage = {
                type: data.type || 'message',
                channel: channel,
                data: data,
                timestamp: Date.now(),
                messageId: this.generateMessageId()
            };

            connection.send(JSON.stringify(message));
            return true;
        } catch (error) {
            console.error(`❌ Failed to send message to channel ${channel}:`, error);
            return false;
        }
    }

    /**
     * Get connection status for all channels
     */
    public getConnectionStatus(): Record<string, string> {
        const status: Record<string, string> = {};
        for (const [channel, state] of this.connectionStates) {
            status[channel] = state;
        }
        return status;
    }

    /**
     * Get real-time metrics
     */
    public getMetrics(): Record<string, any> {
        const metricsObj: Record<string, any> = {};
        for (const [key, value] of this.metrics) {
            metricsObj[key] = value;
        }
        return metricsObj;
    }

    /**
     * Get latest quantum metrics
     */
    public getLatestQuantumMetrics(): RealtimeQuantumMetrics | null {
        return this.metrics.get('quantum:latest') || null;
    }

    /**
     * Get latest consciousness data
     */
    public getLatestConsciousnessData(): RealtimeConsciousnessData | null {
        return this.metrics.get('consciousness:latest') || null;
    }

    /**
     * Get agent registry
     */
    public getAgentRegistry(): Map<string, AIAgentUpdate> {
        return this.metrics.get('agents:registry') || new Map();
    }

    /**
     * Check if manager is connected to all channels
     */
    public isFullyConnected(): boolean {
        for (const [channel, state] of this.connectionStates) {
            if (state !== 'connected') {
                return false;
            }
        }
        return true;
    }

    // ======================== PRIVATE UTILITIES ========================

    private generateMessageId(): string {
        return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    private startMetricsCollection(): void {
        setInterval(() => {
            const connectionStats = {
                totalConnections: this.connections.size,
                activeConnections: Array.from(this.connectionStates.values()).filter(state => state === 'connected').length,
                queuedMessages: Array.from(this.messageQueues.values()).reduce((total, queue) => total + queue.length, 0),
                timestamp: Date.now()
            };

            this.metrics.set('manager:stats', connectionStats);
            this.emit('manager:stats', connectionStats);
        }, 10000); // Every 10 seconds
    }

    private updateMessageMetrics(channel: string, message: WebSocketMessage): void {
        const channelMetrics = this.metrics.get(`${channel}:metrics`) || {
            messagesReceived: 0,
            bytesReceived: 0,
            lastMessageTime: 0
        };

        channelMetrics.messagesReceived++;
        channelMetrics.bytesReceived += JSON.stringify(message).length;
        channelMetrics.lastMessageTime = Date.now();

        this.metrics.set(`${channel}:metrics`, channelMetrics);
    }
}

// ============================================================================
// REACT HOOK FOR WEBSOCKET INTEGRATION
// ============================================================================

interface UseTerraFusionWebSocketReturn {
    wsManager: TerraFusionWebSocketManager | null;
    isConnected: boolean;
    connectionStatus: Record<string, string>;
    quantumMetrics: RealtimeQuantumMetrics | null;
    consciousnessData: RealtimeConsciousnessData | null;
    agentRegistry: Map<string, AIAgentUpdate>;
    systemHealth: SystemHealth | null;
    sendMessage: (channel: string, data: any) => boolean;
    getMetrics: () => Record<string, any>;
}

export const useTerraFusionWebSocket = (config: WebSocketConfig): UseTerraFusionWebSocketReturn => {
    const [wsManager, setWsManager] = useState<TerraFusionWebSocketManager | null>(null);
    const [isConnected, setIsConnected] = useState(false);
    const [connectionStatus, setConnectionStatus] = useState<Record<string, string>>({});
    const [quantumMetrics, setQuantumMetrics] = useState<RealtimeQuantumMetrics | null>(null);
    const [consciousnessData, setConsciousnessData] = useState<RealtimeConsciousnessData | null>(null);
    const [agentRegistry, setAgentRegistry] = useState<Map<string, AIAgentUpdate>>(new Map());
    const [systemHealth, setSystemHealth] = useState<SystemHealth | null>(null);

    useEffect(() => {
        const manager = new TerraFusionWebSocketManager(config);

        // Set up event listeners
        manager.on('manager:started', () => {
            console.log('✅ WebSocket Manager started');
        });

        manager.on('channel:connected', () => {
            setConnectionStatus(manager.getConnectionStatus());
            setIsConnected(manager.isFullyConnected());
        });

        manager.on('channel:disconnected', () => {
            setConnectionStatus(manager.getConnectionStatus());
            setIsConnected(manager.isFullyConnected());
        });

        manager.on('quantum:metrics', (data: RealtimeQuantumMetrics) => {
            setQuantumMetrics(data);
        });

        manager.on('consciousness:data', (data: RealtimeConsciousnessData) => {
            setConsciousnessData(data);
        });

        manager.on('agents:bulk_update', ({ agents }: { agents: AIAgentUpdate[] }) => {
            setAgentRegistry(manager.getAgentRegistry());
        });

        manager.on('system:health', (data: SystemHealth) => {
            setSystemHealth(data);
        });

        // Start the manager
        manager.start();
        setWsManager(manager);

        // Cleanup on unmount
        return () => {
            manager.stop();
            manager.removeAllListeners();
        };
    }, []);

    return {
        wsManager,
        isConnected,
        connectionStatus,
        quantumMetrics,
        consciousnessData,
        agentRegistry,
        systemHealth,
        sendMessage: (channel: string, data: any) => wsManager?.sendMessage(channel, data) || false,
        getMetrics: () => wsManager?.getMetrics() || {}
    };
};

// ============================================================================
// DEFAULT CONFIGURATIONS
// ============================================================================

export const DEFAULT_WEBSOCKET_CONFIG: WebSocketConfig = {
    baseUrl: 'wss://api.terrafusionmarket.com/realtime',
    channels: [
        'quantum-metrics',
        'consciousness-data',
        'agent-updates',
        'system-health',
        'performance-analytics'
    ],
    reconnectAttempts: 5,
    reconnectDelay: 1000,
    heartbeatInterval: 30000,
    messageQueueSize: 1000,
    enableCompression: true,
    enableMetrics: true
};

export default TerraFusionWebSocketManager;

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type {
    AIAgentUpdate, RealtimeConsciousnessData, RealtimeQuantumMetrics, SystemHealth, UseTerraFusionWebSocketReturn, WebSocketConfig, WebSocketMessage
};


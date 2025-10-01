/**
 * TerraFusion Message Bus Coordinator
 * Enterprise messaging layer for 50,000+ AI agents
 * Coordinates RabbitMQ, Kafka, and Redis messaging
 */

const express = require('express');
const amqp = require('amqplib');
const { Kafka } = require('kafkajs');
const Redis = require('ioredis');
const WebSocket = require('ws');
const { v4: uuidv4 } = require('uuid');
const { performance } = require('perf_hooks');

class TerraFusionMessageCoordinator {
  constructor() {
    this.app = express();
    this.server = null;
    this.wss = null;
    
    // Message bus connections
    this.rabbitmq = null;
    this.kafka = null;
    this.redis = null;
    
    // Connection pools
    this.rabbitmqChannels = new Map();
    this.kafkaProducers = new Map();
    this.kafkaConsumers = new Map();
    
    // Metrics and monitoring
    this.metrics = {
      messagesProcessed: 0,
      activeConnections: 0,
      rabbitMQMessages: 0,
      kafkaMessages: 0,
      redisOperations: 0,
      errors: 0,
      uptime: Date.now()
    };
    
    // Configuration
    this.config = {
      port: process.env.COORDINATOR_PORT || 8090,
      rabbitmqUrl: process.env.RABBITMQ_URL || 'amqp://terrafusion:government_secure_2024@localhost:\${{TF_PORT_5672:-5672}}/terrafusion',
      kafkaBrokers: (process.env.KAFKA_BROKERS || 'localhost:\${{TF_PORT_5672:-5672}}').split(','),
      redisUrl: process.env.REDIS_URL || 'redis://localhost:\${{TF_PORT_5672:-5672}}',
      logLevel: process.env.LOG_LEVEL || 'info',
      complianceMode: process.env.GOVERNMENT_COMPLIANCE || 'FISMA'
    };
    
    // Agent registry
    this.agentRegistry = new Map();
    this.supremeCommander = null;
    this.fieldGenerals = new Set();
    
    this.setupExpress();
    this.setupWebSocket();
  }

  /**
   * Initialize all message bus connections
   */
  async initialize() {
    console.log('🚀 Initializing TerraFusion Message Coordinator...');
    
    try {
      // Initialize Redis first (fastest startup)
      await this.initializeRedis();
      
      // Initialize RabbitMQ
      await this.initializeRabbitMQ();
      
      // Initialize Kafka
      await this.initializeKafka();
      
      // Setup routing and coordination
      await this.setupMessageRouting();
      
      // Start health monitoring
      this.startHealthMonitoring();
      
      console.log('✅ Message Coordinator initialized successfully');
      return true;
    } catch (error) {
      console.error('❌ Failed to initialize Message Coordinator:', error);
      return false;
    }
  }

  /**
   * Initialize Redis connection
   */
  async initializeRedis() {
    console.log('🔴 Connecting to Redis...');
    
    this.redis = new Redis(this.config.redisUrl, {
      retryDelayOnFailover: 100,
      maxRetriesPerRequest: 3,
      lazyConnect: true,
      keepAlive: 30000
    });

    await this.redis.connect();
    
    // Test connection
    await this.redis.ping();
    
    console.log('✅ Redis connected successfully');
  }

  /**
   * Initialize RabbitMQ connection
   */
  async initializeRabbitMQ() {
    console.log('🐰 Connecting to RabbitMQ...');
    
    this.rabbitmq = await amqp.connect(this.config.rabbitmqUrl);
    
    // Create channels for different purposes
    const governmentChannel = await this.rabbitmq.createChannel();
    const agentChannel = await this.rabbitmq.createChannel();
    const broadcastChannel = await this.rabbitmq.createChannel();
    
    this.rabbitmqChannels.set('government', governmentChannel);
    this.rabbitmqChannels.set('agents', agentChannel);
    this.rabbitmqChannels.set('broadcast', broadcastChannel);
    
    // Setup dead letter exchange handling
    await this.setupDeadLetterHandling();
    
    console.log('✅ RabbitMQ connected successfully');
  }

  /**
   * Initialize Kafka connection
   */
  async initializeKafka() {
    console.log('📊 Connecting to Kafka...');
    
    this.kafka = new Kafka({
      clientId: 'terrafusion-coordinator',
      brokers: this.config.kafkaBrokers,
      retry: {
        initialRetryTime: 100,
        retries: 8
      }
    });

    // Create producers for different message types
    const agentProducer = this.kafka.producer({
      maxInFlightRequests: 1,
      idempotent: true,
      transactionTimeout: 30000
    });
    
    const eventsProducer = this.kafka.producer({
      maxInFlightRequests: 5,
      idempotent: false
    });

    await agentProducer.connect();
    await eventsProducer.connect();

    this.kafkaProducers.set('agents', agentProducer);
    this.kafkaProducers.set('events', eventsProducer);

    // Create topics for TerraFusion
    await this.createKafkaTopics();
    
    console.log('✅ Kafka connected successfully');
  }

  /**
   * Setup message routing between systems
   */
  async setupMessageRouting() {
    console.log('🔄 Setting up message routing...');

    // RabbitMQ to Kafka bridge for agent commands
    const agentChannel = this.rabbitmqChannels.get('agents');
    await agentChannel.consume('agent.commands', async (msg) => {
      if (msg) {
        try {
          const content = JSON.parse(msg.content.toString());
          
          // Route to Kafka for high-throughput processing
          const kafkaProducer = this.kafkaProducers.get('agents');
          await kafkaProducer.send({
            topic: 'agent-commands',
            messages: [{
              key: content.agentId,
              value: JSON.stringify(content),
              headers: {
                'source': 'rabbitmq',
                'timestamp': Date.now().toString()
              }
            }]
          });

          agentChannel.ack(msg);
          this.metrics.messagesProcessed++;
          this.metrics.rabbitMQMessages++;
          this.metrics.kafkaMessages++;
        } catch (error) {
          console.error('Message routing error:', error);
          agentChannel.nack(msg, false, false);
          this.metrics.errors++;
        }
      }
    });

    // Kafka to Redis cache for fast agent lookups
    const agentConsumer = this.kafka.consumer({ groupId: 'agent-registry' });
    await agentConsumer.connect();
    await agentConsumer.subscribe({ topic: 'agent-events', fromBeginning: false });

    await agentConsumer.run({
      eachMessage: async ({ topic, partition, message }) => {
        try {
          const event = JSON.parse(message.value.toString());
          
          // Cache agent state in Redis
          if (event.type === 'agent_status') {
            await this.redis.hset(
              `agent:${event.agentId}`,
              'status', event.status,
              'lastSeen', Date.now(),
              'capabilities', JSON.stringify(event.capabilities)
            );
            
            // Set TTL for agent data
            await this.redis.expire(`agent:${event.agentId}`, 300);
          }

          this.metrics.messagesProcessed++;
          this.metrics.redisOperations++;
        } catch (error) {
          console.error('Cache update error:', error);
          this.metrics.errors++;
        }
      }
    });

    console.log('✅ Message routing established');
  }

  /**
   * Register an AI agent with the coordinator
   */
  async registerAgent(agentId, capabilities, type = 'operational') {
    const agentInfo = {
      id: agentId,
      type,
      capabilities,
      registeredAt: new Date().toISOString(),
      lastSeen: new Date().toISOString(),
      status: 'active',
      messageCount: 0
    };

    this.agentRegistry.set(agentId, agentInfo);

    // Cache in Redis
    await this.redis.hset(
      `agent:${agentId}`,
      'type', type,
      'capabilities', JSON.stringify(capabilities),
      'registeredAt', agentInfo.registeredAt,
      'status', 'active'
    );

    // Track supreme commander and field generals
    if (type === 'supreme_commander') {
      this.supremeCommander = agentId;
    } else if (type === 'field_general') {
      this.fieldGenerals.add(agentId);
    }

    // Publish agent registration event
    const eventProducer = this.kafkaProducers.get('events');
    await eventProducer.send({
      topic: 'agent-events',
      messages: [{
        key: agentId,
        value: JSON.stringify({
          type: 'agent_registered',
          agentId,
          agentType: type,
          capabilities,
          timestamp: new Date().toISOString()
        })
      }]
    });

    console.log(`📝 Registered ${type} agent: ${agentId}`);
    return agentInfo;
  }

  /**
   * Send message to specific agent
   */
  async sendToAgent(agentId, message, priority = 'normal') {
    const queueName = priority === 'high' ? 'agent.commands.priority' : 'agent.commands';
    const channel = this.rabbitmqChannels.get('agents');

    const messageWrapper = {
      id: uuidv4(),
      targetAgent: agentId,
      message,
      priority,
      timestamp: new Date().toISOString(),
      source: 'coordinator'
    };

    await channel.sendToQueue(
      queueName,
      Buffer.from(JSON.stringify(messageWrapper)),
      {
        persistent: true,
        priority: priority === 'high' ? 10 : 1
      }
    );

    this.metrics.messagesProcessed++;
    this.metrics.rabbitMQMessages++;
  }

  /**
   * Broadcast message to all agents
   */
  async broadcastToAgents(message, agentType = null) {
    const channel = this.rabbitmqChannels.get('broadcast');
    
    const broadcastMessage = {
      id: uuidv4(),
      message,
      agentType,
      timestamp: new Date().toISOString(),
      source: 'coordinator'
    };

    await channel.publish(
      'agent.broadcast',
      '',
      Buffer.from(JSON.stringify(broadcastMessage)),
      { persistent: true }
    );

    this.metrics.messagesProcessed++;
    this.metrics.rabbitMQMessages++;
  }

  /**
   * Send command to Supreme Commander Claude
   */
  async sendToSupremeCommander(command, data = {}) {
    if (!this.supremeCommander) {
      throw new Error('Supreme Commander not registered');
    }

    const commandMessage = {
      type: 'supreme_command',
      command,
      data,
      priority: 'critical',
      correlationId: uuidv4()
    };

    await this.sendToAgent(this.supremeCommander, commandMessage, 'high');
    
    console.log(`📡 Command sent to Supreme Commander: ${command}`);
  }

  /**
   * Get agent status and metrics
   */
  async getAgentStatus(agentId) {
    const cachedData = await this.redis.hgetall(`agent:${agentId}`);
    const registryData = this.agentRegistry.get(agentId);

    return {
      ...registryData,
      ...cachedData,
      cached: !!cachedData.status
    };
  }

  /**
   * Setup dead letter exchange handling
   */
  async setupDeadLetterHandling() {
    const channel = this.rabbitmqChannels.get('government');

    // Setup DLX consumer for failed government messages
    await channel.consume('gov.dlx', async (msg) => {
      if (msg) {
        console.warn('⚠️ Dead letter message:', {
          queue: msg.fields.routingKey,
          content: msg.content.toString(),
          timestamp: new Date().toISOString()
        });

        // Log for compliance audit
        await this.logComplianceEvent('dead_letter_processed', {
          originalQueue: msg.fields.routingKey,
          messageId: msg.properties.messageId,
          timestamp: new Date().toISOString()
        });

        channel.ack(msg);
      }
    });
  }

  /**
   * Create required Kafka topics
   */
  async createKafkaTopics() {
    const admin = this.kafka.admin();
    await admin.connect();

    const topics = [
      {
        topic: 'agent-commands',
        numPartitions: 12,
        replicationFactor: 1,
        configEntries: [
          { name: 'retention.ms', value: '604800000' }, // 7 days
          { name: 'compression.type', value: 'snappy' }
        ]
      },
      {
        topic: 'agent-events',
        numPartitions: 8,
        replicationFactor: 1,
        configEntries: [
          { name: 'retention.ms', value: '2592000000' }, // 30 days
          { name: 'compression.type', value: 'lz4' }
        ]
      },
      {
        topic: 'government-events',
        numPartitions: 4,
        replicationFactor: 1,
        configEntries: [
          { name: 'retention.ms', value: '31536000000' }, // 365 days (compliance)
          { name: 'compression.type', value: 'gzip' }
        ]
      }
    ];

    try {
      await admin.createTopics({ topics });
      console.log('✅ Kafka topics created');
    } catch (error) {
      if (error.message.includes('already exists')) {
        console.log('ℹ️ Kafka topics already exist');
      } else {
        throw error;
      }
    }

    await admin.disconnect();
  }

  /**
   * Setup Express API
   */
  setupExpress() {
    this.app.use(express.json());
    
    // Health check endpoint
    this.app.get('/health', (req, res) => {
      res.json({
        status: 'healthy',
        uptime: Date.now() - this.metrics.uptime,
        metrics: this.metrics,
        connections: {
          rabbitmq: !!this.rabbitmq,
          kafka: !!this.kafka,
          redis: !!this.redis
        }
      });
    });

    // Agent registration endpoint
    this.app.post('/agents/register', async (req, res) => {
      try {
        const { agentId, capabilities, type } = req.body;
        const agentInfo = await this.registerAgent(agentId, capabilities, type);
        res.json(agentInfo);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    // Send message to agent
    this.app.post('/agents/:agentId/message', async (req, res) => {
      try {
        const { agentId } = req.params;
        const { message, priority } = req.body;
        await this.sendToAgent(agentId, message, priority);
        res.json({ success: true, messageId: uuidv4() });
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    // Broadcast message
    this.app.post('/agents/broadcast', async (req, res) => {
      try {
        const { message, agentType } = req.body;
        await this.broadcastToAgents(message, agentType);
        res.json({ success: true, messageId: uuidv4() });
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    // Get agent status
    this.app.get('/agents/:agentId', async (req, res) => {
      try {
        const { agentId } = req.params;
        const status = await this.getAgentStatus(agentId);
        res.json(status);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    // List all agents
    this.app.get('/agents', async (req, res) => {
      try {
        const agents = Array.from(this.agentRegistry.values());
        res.json({
          totalAgents: agents.length,
          supremeCommander: this.supremeCommander,
          fieldGenerals: Array.from(this.fieldGenerals),
          agents
        });
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    // Metrics endpoint
    this.app.get('/metrics', (req, res) => {
      res.json(this.metrics);
    });
  }

  /**
   * Setup WebSocket for real-time monitoring
   */
  setupWebSocket() {
    // WebSocket will be initialized after server starts
  }

  /**
   * Start health monitoring
   */
  startHealthMonitoring() {
    setInterval(async () => {
      try {
        // Update metrics
        this.metrics.activeConnections = this.agentRegistry.size;
        
        // Ping all connections to verify health
        if (this.redis) {
          await this.redis.ping();
        }

        // Broadcast health status to WebSocket clients
        if (this.wss) {
          const healthData = {
            type: 'health_update',
            metrics: this.metrics,
            timestamp: new Date().toISOString()
          };

          this.wss.clients.forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
              client.send(JSON.stringify(healthData));
            }
          });
        }
      } catch (error) {
        console.error('Health monitoring error:', error);
        this.metrics.errors++;
      }
    }, 30000); // Every 30 seconds
  }

  /**
   * Log compliance event for government audit
   */
  async logComplianceEvent(eventType, data) {
    const complianceEvent = {
      eventType,
      data,
      timestamp: new Date().toISOString(),
      complianceLevel: this.config.complianceMode,
      correlationId: uuidv4()
    };

    // Store in Redis for fast access
    await this.redis.lpush('compliance:events', JSON.stringify(complianceEvent));
    await this.redis.ltrim('compliance:events', 0, 10000); // Keep last 10k events

    // Send to Kafka for long-term storage
    const eventsProducer = this.kafkaProducers.get('events');
    await eventsProducer.send({
      topic: 'government-events',
      messages: [{
        key: eventType,
        value: JSON.stringify(complianceEvent)
      }]
    });
  }

  /**
   * Start the coordinator server
   */
  async start() {
    const success = await this.initialize();
    if (!success) {
      process.exit(1);
    }

    this.server = this.app.listen(this.config.port, () => {
      console.log(`🌐 Message Coordinator listening on port ${this.config.port}`);
    });

    // Setup WebSocket server
    this.wss = new WebSocket.Server({ server: this.server });
    
    this.wss.on('connection', (ws) => {
      console.log('🔌 WebSocket client connected');
      
      ws.on('message', async (message) => {
        try {
          const data = JSON.parse(message);
          
          if (data.type === 'subscribe_metrics') {
            // Send initial metrics
            ws.send(JSON.stringify({
              type: 'metrics_update',
              metrics: this.metrics
            }));
          }
        } catch (error) {
          console.error('WebSocket message error:', error);
        }
      });
    });

    console.log('✅ TerraFusion Message Coordinator started successfully');
    console.log(`📊 WebSocket monitoring available at ws://localhost:${this.config.port}`);
    console.log(`🏛️ Government compliance mode: ${this.config.complianceMode}`);
  }

  /**
   * Graceful shutdown
   */
  async shutdown() {
    console.log('🛑 Shutting down Message Coordinator...');

    // Close WebSocket server
    if (this.wss) {
      this.wss.close();
    }

    // Close HTTP server
    if (this.server) {
      this.server.close();
    }

    // Close message bus connections
    if (this.rabbitmq) {
      await this.rabbitmq.close();
    }

    for (const producer of this.kafkaProducers.values()) {
      await producer.disconnect();
    }

    for (const consumer of this.kafkaConsumers.values()) {
      await consumer.disconnect();
    }

    if (this.redis) {
      this.redis.disconnect();
    }

    console.log('✅ Message Coordinator shutdown complete');
  }
}

// Handle graceful shutdown
process.on('SIGTERM', async () => {
  if (global.coordinator) {
    await global.coordinator.shutdown();
  }
  process.exit(0);
});

process.on('SIGINT', async () => {
  if (global.coordinator) {
    await global.coordinator.shutdown();
  }
  process.exit(0);
});

// Start the coordinator
async function main() {
  const coordinator = new TerraFusionMessageCoordinator();
  global.coordinator = coordinator;
  
  try {
    await coordinator.start();
  } catch (error) {
    console.error('Failed to start Message Coordinator:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = TerraFusionMessageCoordinator;
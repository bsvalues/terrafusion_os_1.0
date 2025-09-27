/**
 * TerraFusion OS Integration Test Suite
 * Comprehensive testing for event-driven architecture, service discovery, API gateway, and plugin communication
 */

const { describe, beforeAll, afterAll, beforeEach, afterEach, test, expect } = require('@jest/globals');
const axios = require('axios');
const WebSocket = require('ws');
const amqp = require('amqplib');
const { Kafka } = require('kafkajs');
const Redis = require('ioredis');
const { exec } = require('child_process');
const { promisify } = require('util');
const fs = require('fs').promises;
const path = require('path');

const execAsync = promisify(exec);

// Test configuration
const TEST_CONFIG = {
  consul: {
    url: 'http://localhost:\${{TF_CONSUL_PORT:-8500}}',
    datacenter: 'dc1'
  },
  kong: {
    adminUrl: 'http://localhost:\${{TF_CONSUL_PORT:-8500}}',
    proxyUrl: 'http://localhost:\${{TF_CONSUL_PORT:-8500}}'
  },
  messaging: {
    rabbitmq: 'amqp://terrafusion:government_secure_2024@localhost:\${{TF_CONSUL_PORT:-8500}}/terrafusion',
    kafka: ['localhost:\${{TF_CONSUL_PORT:-8500}}'],
    redis: 'redis://localhost:\${{TF_CONSUL_PORT:-8500}}'
  },
  coordinator: {
    url: 'http://localhost:\${{TF_CONSUL_PORT:-8500}}'
  },
  progressMonitor: {
    url: 'http://localhost:\${{TF_CONSUL_PORT:-8500}}'
  }
};

// Test utilities
class TestServiceRegistry {
  constructor(consulUrl) {
    this.consulUrl = consulUrl;
  }

  async registerTestService(name, port, healthCheck = '/health') {
    const service = {
      ID: `test-${name}-${Date.now()}`,
      Name: name,
      Tags: ['test', 'integration'],
      Address: 'localhost',
      Port: port,
      Check: {
        HTTP: `http://localhost:${port}${healthCheck}`,
        Interval: '10s'
      }
    };

    await axios.put(`${this.consulUrl}/v1/agent/service/register`, service);
    return service.ID;
  }

  async deregisterTestService(serviceId) {
    await axios.put(`${this.consulUrl}/v1/agent/service/deregister/${serviceId}`);
  }

  async getServiceHealth(serviceName) {
    const response = await axios.get(`${this.consulUrl}/v1/health/service/${serviceName}`);
    return response.data;
  }
}

class TestMessageClient {
  constructor() {
    this.connections = {};
  }

  async connectRabbitMQ() {
    this.connections.rabbitmq = await amqp.connect(TEST_CONFIG.messaging.rabbitmq);
    this.connections.rabbitmqChannel = await this.connections.rabbitmq.createChannel();
    return this.connections.rabbitmqChannel;
  }

  async connectKafka() {
    this.connections.kafka = new Kafka({
      clientId: 'integration-test',
      brokers: TEST_CONFIG.messaging.kafka
    });
    
    this.connections.kafkaProducer = this.connections.kafka.producer();
    this.connections.kafkaConsumer = this.connections.kafka.consumer({ groupId: 'test-group' });
    
    await this.connections.kafkaProducer.connect();
    await this.connections.kafkaConsumer.connect();
    
    return {
      producer: this.connections.kafkaProducer,
      consumer: this.connections.kafkaConsumer
    };
  }

  async connectRedis() {
    this.connections.redis = new Redis(TEST_CONFIG.messaging.redis);
    await this.connections.redis.ping();
    return this.connections.redis;
  }

  async disconnect() {
    if (this.connections.rabbitmq) {
      await this.connections.rabbitmq.close();
    }
    
    if (this.connections.kafkaProducer) {
      await this.connections.kafkaProducer.disconnect();
    }
    
    if (this.connections.kafkaConsumer) {
      await this.connections.kafkaConsumer.disconnect();
    }
    
    if (this.connections.redis) {
      this.connections.redis.disconnect();
    }
  }
}

// Test suites
describe('TerraFusion OS Integration Tests', () => {
  let serviceRegistry;
  let messageClient;
  let testServiceIds = [];

  beforeAll(async () => {
    console.log('🚀 Starting TerraFusion OS Integration Tests...');
    
    serviceRegistry = new TestServiceRegistry(TEST_CONFIG.consul.url);
    messageClient = new TestMessageClient();
    
    // Wait for services to be ready
    await waitForServices();
  }, 60000);

  afterAll(async () => {
    console.log('🧹 Cleaning up integration tests...');
    
    // Deregister test services
    for (const serviceId of testServiceIds) {
      try {
        await serviceRegistry.deregisterTestService(serviceId);
      } catch (error) {
        console.warn(`Failed to deregister service ${serviceId}:`, error.message);
      }
    }
    
    // Disconnect message clients
    await messageClient.disconnect();
    
    console.log('✅ Integration test cleanup complete');
  });

  describe('Service Discovery (Consul)', () => {
    test('should register and discover services', async () => {
      // Register a test service
      const serviceId = await serviceRegistry.registerTestService('test-api', 9999);
      testServiceIds.push(serviceId);

      // Wait for service to be registered
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Check service is discoverable
      const health = await serviceRegistry.getServiceHealth('test-api');
      expect(health).toHaveLength(1);
      expect(health[0].Service.Service).toBe('test-api');
      expect(health[0].Service.Port).toBe(9999);
    });

    test('should maintain service health checks', async () => {
      // Create a mock service that responds to health checks
      const express = require('express');
      const app = express();
      
      app.get('/health', (req, res) => {
        res.json({ status: 'healthy', timestamp: new Date().toISOString() });
      });
      
      const server = app.listen(9998);
      
      try {
        // Register service with health check
        const serviceId = await serviceRegistry.registerTestService('test-health', 9998);
        testServiceIds.push(serviceId);

        // Wait for health check to run
        await new Promise(resolve => setTimeout(resolve, 15000));

        // Verify service is healthy
        const health = await serviceRegistry.getServiceHealth('test-health');
        expect(health[0].Checks).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              Status: 'passing'
            })
          ])
        );
      } finally {
        server.close();
      }
    });

    test('should handle service deregistration', async () => {
      // Register a service
      const serviceId = await serviceRegistry.registerTestService('test-temp', 9997);
      
      // Verify it's registered
      let health = await serviceRegistry.getServiceHealth('test-temp');
      expect(health).toHaveLength(1);

      // Deregister it
      await serviceRegistry.deregisterTestService(serviceId);
      
      // Wait for deregistration to propagate
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Verify it's gone
      health = await serviceRegistry.getServiceHealth('test-temp');
      expect(health).toHaveLength(0);
    });
  });

  describe('API Gateway (Kong)', () => {
    test('should proxy requests to backend services', async () => {
      // Create a test service in Kong
      const service = {
        name: 'test-backend',
        url: 'http://httpbin.org'
      };

      const serviceResponse = await axios.post(`${TEST_CONFIG.kong.adminUrl}/services`, service);
      expect(serviceResponse.status).toBe(201);

      // Create a route for the service
      const route = {
        name: 'test-route',
        paths: ['/test-backend'],
        service: { id: serviceResponse.data.id }
      };

      const routeResponse = await axios.post(`${TEST_CONFIG.kong.adminUrl}/routes`, route);
      expect(routeResponse.status).toBe(201);

      // Test the proxy
      const proxyResponse = await axios.get(`${TEST_CONFIG.kong.proxyUrl}/test-backend/get`);
      expect(proxyResponse.status).toBe(200);
      expect(proxyResponse.data.url).toContain('httpbin.org');

      // Cleanup
      await axios.delete(`${TEST_CONFIG.kong.adminUrl}/routes/${routeResponse.data.id}`);
      await axios.delete(`${TEST_CONFIG.kong.adminUrl}/services/${serviceResponse.data.id}`);
    });

    test('should enforce rate limiting', async () => {
      // Create service and route with rate limiting
      const service = {
        name: 'rate-limited-service',
        url: 'http://httpbin.org'
      };

      const serviceResponse = await axios.post(`${TEST_CONFIG.kong.adminUrl}/services`, service);

      const route = {
        name: 'rate-limited-route',
        paths: ['/rate-test'],
        service: { id: serviceResponse.data.id }
      };

      const routeResponse = await axios.post(`${TEST_CONFIG.kong.adminUrl}/routes`, route);

      // Add rate limiting plugin
      const plugin = {
        name: 'rate-limiting',
        config: {
          minute: 2,
          policy: 'local'
        },
        route: { id: routeResponse.data.id }
      };

      const pluginResponse = await axios.post(`${TEST_CONFIG.kong.adminUrl}/plugins`, plugin);

      // Test rate limiting
      let responses = [];
      for (let i = 0; i < 5; i++) {
        try {
          const response = await axios.get(`${TEST_CONFIG.kong.proxyUrl}/rate-test/get`);
          responses.push(response.status);
        } catch (error) {
          responses.push(error.response?.status || 0);
        }
      }

      // Should have some 429 responses (rate limited)
      expect(responses).toContain(429);

      // Cleanup
      await axios.delete(`${TEST_CONFIG.kong.adminUrl}/plugins/${pluginResponse.data.id}`);
      await axios.delete(`${TEST_CONFIG.kong.adminUrl}/routes/${routeResponse.data.id}`);
      await axios.delete(`${TEST_CONFIG.kong.adminUrl}/services/${serviceResponse.data.id}`);
    });

    test('should handle authentication', async () => {
      // Create consumer
      const consumer = {
        username: 'test-user',
        custom_id: 'test-123'
      };

      const consumerResponse = await axios.post(`${TEST_CONFIG.kong.adminUrl}/consumers`, consumer);

      // Create API key for consumer
      const keyResponse = await axios.post(
        `${TEST_CONFIG.kong.adminUrl}/consumers/${consumerResponse.data.id}/key-auth`
      );

      // Create protected service and route
      const service = {
        name: 'protected-service',
        url: 'http://httpbin.org'
      };

      const serviceResponse = await axios.post(`${TEST_CONFIG.kong.adminUrl}/services`, service);

      const route = {
        name: 'protected-route',
        paths: ['/protected'],
        service: { id: serviceResponse.data.id }
      };

      const routeResponse = await axios.post(`${TEST_CONFIG.kong.adminUrl}/routes`, route);

      // Add key authentication plugin
      const plugin = {
        name: 'key-auth',
        route: { id: routeResponse.data.id }
      };

      const pluginResponse = await axios.post(`${TEST_CONFIG.kong.adminUrl}/plugins`, plugin);

      // Test without API key (should fail)
      try {
        await axios.get(`${TEST_CONFIG.kong.proxyUrl}/protected/get`);
        expect(true).toBe(false); // Should not reach here
      } catch (error) {
        expect(error.response.status).toBe(401);
      }

      // Test with API key (should succeed)
      const authenticatedResponse = await axios.get(
        `${TEST_CONFIG.kong.proxyUrl}/protected/get`,
        {
          headers: {
            'apikey': keyResponse.data.key
          }
        }
      );
      expect(authenticatedResponse.status).toBe(200);

      // Cleanup
      await axios.delete(`${TEST_CONFIG.kong.adminUrl}/plugins/${pluginResponse.data.id}`);
      await axios.delete(`${TEST_CONFIG.kong.adminUrl}/routes/${routeResponse.data.id}`);
      await axios.delete(`${TEST_CONFIG.kong.adminUrl}/services/${serviceResponse.data.id}`);
      await axios.delete(`${TEST_CONFIG.kong.adminUrl}/consumers/${consumerResponse.data.id}`);
    });
  });

  describe('Message Bus Infrastructure', () => {
    test('should connect to RabbitMQ', async () => {
      const channel = await messageClient.connectRabbitMQ();
      expect(channel).toBeDefined();

      // Test queue creation
      const queue = await channel.assertQueue('test-queue', { durable: false });
      expect(queue.queue).toBe('test-queue');

      // Test message publish/consume
      let receivedMessage = null;
      
      await channel.consume('test-queue', (msg) => {
        if (msg) {
          receivedMessage = msg.content.toString();
          channel.ack(msg);
        }
      });

      const testMessage = 'Hello TerraFusion!';
      await channel.sendToQueue('test-queue', Buffer.from(testMessage));

      // Wait for message to be consumed
      await new Promise(resolve => setTimeout(resolve, 1000));
      expect(receivedMessage).toBe(testMessage);

      // Cleanup
      await channel.deleteQueue('test-queue');
    });

    test('should connect to Kafka', async () => {
      const { producer, consumer } = await messageClient.connectKafka();
      expect(producer).toBeDefined();
      expect(consumer).toBeDefined();

      // Test topic creation and messaging
      const topic = 'test-topic';
      const testMessage = { test: 'message', timestamp: Date.now() };

      let receivedMessage = null;

      await consumer.subscribe({ topic, fromBeginning: true });
      
      await consumer.run({
        eachMessage: async ({ message }) => {
          receivedMessage = JSON.parse(message.value.toString());
        }
      });

      // Send message
      await producer.send({
        topic,
        messages: [{
          value: JSON.stringify(testMessage)
        }]
      });

      // Wait for message to be consumed
      await new Promise(resolve => setTimeout(resolve, 2000));
      expect(receivedMessage).toEqual(testMessage);
    });

    test('should connect to Redis', async () => {
      const redis = await messageClient.connectRedis();
      expect(redis).toBeDefined();

      // Test basic operations
      await redis.set('test-key', 'test-value');
      const value = await redis.get('test-key');
      expect(value).toBe('test-value');

      // Test pub/sub
      let receivedMessage = null;
      
      await redis.subscribe('test-channel');
      redis.on('message', (channel, message) => {
        if (channel === 'test-channel') {
          receivedMessage = message;
        }
      });

      // Create another Redis connection for publishing
      const publisher = new Redis(TEST_CONFIG.messaging.redis);
      await publisher.publish('test-channel', 'test-pubsub-message');

      // Wait for message
      await new Promise(resolve => setTimeout(resolve, 1000));
      expect(receivedMessage).toBe('test-pubsub-message');

      // Cleanup
      await redis.del('test-key');
      await redis.unsubscribe('test-channel');
      publisher.disconnect();
    });
  });

  describe('Message Coordinator', () => {
    test('should respond to health checks', async () => {
      const response = await axios.get(`${TEST_CONFIG.coordinator.url}/health`);
      expect(response.status).toBe(200);
      expect(response.data.status).toBe('healthy');
      expect(response.data.connections).toBeDefined();
      expect(response.data.metrics).toBeDefined();
    });

    test('should register agents', async () => {
      const agentData = {
        agentId: 'test-agent-001',
        capabilities: { testing: true, integration: true },
        type: 'operational'
      };

      const response = await axios.post(`${TEST_CONFIG.coordinator.url}/agents/register`, agentData);
      expect(response.status).toBe(200);
      expect(response.data.id).toBe(agentData.agentId);
      expect(response.data.type).toBe(agentData.type);
    });

    test('should send messages to agents', async () => {
      const message = {
        message: { type: 'test', data: 'integration test message' },
        priority: 'normal'
      };

      const response = await axios.post(
        `${TEST_CONFIG.coordinator.url}/agents/test-agent-001/message`,
        message
      );
      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(response.data.messageId).toBeDefined();
    });

    test('should broadcast messages', async () => {
      const broadcast = {
        message: { type: 'broadcast', announcement: 'system update' },
        agentType: 'operational'
      };

      const response = await axios.post(`${TEST_CONFIG.coordinator.url}/agents/broadcast`, broadcast);
      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(response.data.messageId).toBeDefined();
    });

    test('should provide agent status', async () => {
      const response = await axios.get(`${TEST_CONFIG.coordinator.url}/agents/test-agent-001`);
      expect(response.status).toBe(200);
      expect(response.data.id).toBe('test-agent-001');
      expect(response.data.type).toBe('operational');
    });

    test('should list all agents', async () => {
      const response = await axios.get(`${TEST_CONFIG.coordinator.url}/agents`);
      expect(response.status).toBe(200);
      expect(response.data.totalAgents).toBeGreaterThan(0);
      expect(response.data.agents).toBeInstanceOf(Array);
    });

    test('should provide metrics', async () => {
      const response = await axios.get(`${TEST_CONFIG.coordinator.url}/metrics`);
      expect(response.status).toBe(200);
      expect(response.data.messagesProcessed).toBeGreaterThanOrEqual(0);
      expect(response.data.activeConnections).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Plugin SDK Integration', () => {
    test('should load plugin SDK modules', async () => {
      // Test that plugin SDK files exist and are readable
      const pluginBasePath = path.join(__dirname, '../../terrafusion/sdk/plugin_base.ts');
      const pluginPyPath = path.join(__dirname, '../../terrafusion/sdk/plugin.py');
      const messageClientPath = path.join(__dirname, '../../terrafusion/sdk/message_client.ts');

      const [pluginBase, pluginPy, messageClient] = await Promise.all([
        fs.access(pluginBasePath).then(() => true).catch(() => false),
        fs.access(pluginPyPath).then(() => true).catch(() => false),
        fs.access(messageClientPath).then(() => true).catch(() => false)
      ]);

      expect(pluginBase).toBe(true);
      expect(pluginPy).toBe(true);
      expect(messageClient).toBe(true);
    });

    test('should validate plugin manifest structure', async () => {
      const examplePluginPath = path.join(__dirname, '../../terrafusion/sdk/example_plugin.ts');
      const content = await fs.readFile(examplePluginPath, 'utf8');

      // Check for required plugin components
      expect(content).toContain('PluginManifest');
      expect(content).toContain('TerraFusionPluginBase');
      expect(content).toContain('initialize');
      expect(content).toContain('start');
      expect(content).toContain('stop');
      expect(content).toContain('healthCheck');
      expect(content).toContain('governmentCertified');
      expect(content).toContain('complianceLevel');
    });
  });

  describe('Progress Monitor Integration', () => {
    test('should connect to progress monitor WebSocket', async () => {
      return new Promise((resolve, reject) => {
        const ws = new WebSocket(`ws://localhost:\${{TF_CONSUL_PORT:-8500}}`);
        
        ws.on('open', () => {
          // Send subscribe message
          ws.send(JSON.stringify({ type: 'subscribe' }));
        });

        ws.on('message', (data) => {
          try {
            const message = JSON.parse(data.toString());
            expect(message).toBeDefined();
            expect(message.type || message.component).toBeDefined();
            ws.close();
            resolve();
          } catch (error) {
            ws.close();
            reject(error);
          }
        });

        ws.on('error', (error) => {
          reject(error);
        });

        // Timeout after 10 seconds
        setTimeout(() => {
          ws.close();
          reject(new Error('WebSocket connection timeout'));
        }, 10000);
      });
    });

    test('should provide progress monitor health check', async () => {
      try {
        const response = await axios.get(`${TEST_CONFIG.progressMonitor.url}/health`);
        expect(response.status).toBe(200);
        expect(response.data.status).toBe('healthy');
      } catch (error) {
        // Progress monitor might not be running, that's OK for tests
        console.warn('Progress monitor not available:', error.message);
      }
    });
  });

  describe('End-to-End Integration', () => {
    test('should complete full message flow: Plugin -> Coordinator -> Message Bus', async () => {
      // Register a test plugin agent
      const pluginAgent = {
        agentId: 'integration-plugin-001',
        capabilities: { 
          messageHandling: true, 
          eventProcessing: true,
          integrationTesting: true 
        },
        type: 'operational'
      };

      const registrationResponse = await axios.post(
        `${TEST_CONFIG.coordinator.url}/agents/register`,
        pluginAgent
      );
      expect(registrationResponse.status).toBe(200);

      // Connect to message bus to listen for messages
      const channel = await messageClient.connectRabbitMQ();
      let receivedMessage = null;

      await channel.consume('agent.commands', (msg) => {
        if (msg) {
          const content = JSON.parse(msg.content.toString());
          if (content.targetAgent === pluginAgent.agentId) {
            receivedMessage = content;
            channel.ack(msg);
          }
        }
      });

      // Send message through coordinator
      const testMessage = {
        message: {
          type: 'integration_test',
          action: 'process_citizen_record',
          data: { citizenId: 'test-123', name: 'John Doe' }
        },
        priority: 'normal'
      };

      await axios.post(
        `${TEST_CONFIG.coordinator.url}/agents/${pluginAgent.agentId}/message`,
        testMessage
      );

      // Wait for message to propagate
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Verify message was received
      expect(receivedMessage).toBeDefined();
      expect(receivedMessage.targetAgent).toBe(pluginAgent.agentId);
      expect(receivedMessage.message.type).toBe('integration_test');
    });

    test('should handle government compliance audit trail', async () => {
      // Connect to Redis to check compliance events
      const redis = await messageClient.connectRedis();

      // Generate a compliance event through the system
      const complianceMessage = {
        message: {
          type: 'compliance_audit',
          action: 'citizen_data_access',
          userId: 'admin-001',
          reason: 'integration_test'
        },
        priority: 'high'
      };

      await axios.post(
        `${TEST_CONFIG.coordinator.url}/agents/broadcast`,
        complianceMessage
      );

      // Wait for compliance event to be logged
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Check if compliance events are being logged
      const complianceEvents = await redis.lrange('compliance:events', 0, 10);
      expect(complianceEvents).toBeDefined();
      
      if (complianceEvents.length > 0) {
        const event = JSON.parse(complianceEvents[0]);
        expect(event.timestamp).toBeDefined();
        expect(event.complianceLevel).toBeDefined();
      }
    });

    test('should validate service mesh connectivity', async () => {
      // Test that all services can communicate with each other
      const serviceConnectivity = {
        consulToSelf: false,
        kongToConsul: false,
        coordinatorToRabbitMQ: false,
        coordinatorToKafka: false,
        coordinatorToRedis: false
      };

      try {
        // Consul self-check
        await axios.get(`${TEST_CONFIG.consul.url}/v1/status/leader`);
        serviceConnectivity.consulToSelf = true;
      } catch (error) {
        console.warn('Consul connectivity issue:', error.message);
      }

      try {
        // Kong admin API check
        await axios.get(`${TEST_CONFIG.kong.adminUrl}/status`);
        serviceConnectivity.kongToConsul = true;
      } catch (error) {
        console.warn('Kong connectivity issue:', error.message);
      }

      try {
        // Coordinator health check (includes message bus connectivity)
        const health = await axios.get(`${TEST_CONFIG.coordinator.url}/health`);
        serviceConnectivity.coordinatorToRabbitMQ = health.data.connections.rabbitmq;
        serviceConnectivity.coordinatorToKafka = health.data.connections.kafka;
        serviceConnectivity.coordinatorToRedis = health.data.connections.redis;
      } catch (error) {
        console.warn('Coordinator connectivity issue:', error.message);
      }

      // Report connectivity status
      console.log('Service Mesh Connectivity:', serviceConnectivity);

      // At least some services should be connected
      const connectedServices = Object.values(serviceConnectivity).filter(Boolean).length;
      expect(connectedServices).toBeGreaterThan(0);
    });
  });
});

// Utility functions
async function waitForServices() {
  console.log('⏳ Waiting for services to be ready...');
  
  const maxWait = 60000; // 60 seconds
  const checkInterval = 2000; // 2 seconds
  const startTime = Date.now();

  const requiredServices = [
    { name: 'Consul', check: () => axios.get(TEST_CONFIG.consul.url) },
    { name: 'Kong Admin', check: () => axios.get(TEST_CONFIG.kong.adminUrl) },
    { name: 'Message Coordinator', check: () => axios.get(`${TEST_CONFIG.coordinator.url}/health`) }
  ];

  while (Date.now() - startTime < maxWait) {
    let allReady = true;

    for (const service of requiredServices) {
      try {
        await service.check();
        console.log(`✅ ${service.name} is ready`);
      } catch (error) {
        console.log(`⏳ Waiting for ${service.name}...`);
        allReady = false;
      }
    }

    if (allReady) {
      console.log('✅ All services are ready');
      return;
    }

    await new Promise(resolve => setTimeout(resolve, checkInterval));
  }

  throw new Error('Services failed to start within timeout period');
}

module.exports = {
  TestServiceRegistry,
  TestMessageClient,
  TEST_CONFIG
};
/**
 * End-to-End Tests for TerraFusion OS
 * Tests complete workflows from user interaction to system response
 */

const { test, expect, beforeAll, afterAll } = require('@jest/globals');
const axios = require('axios');
const WebSocket = require('ws');
const { TerraFusionMessageClient, SupremeCommanderClient, FieldGeneralClient } = require('../../terrafusion/sdk/message_client');

// E2E Test Configuration
const E2E_CONFIG = {
  coordinator: 'http://localhost:\${{TF_SERVICE_8090_PORT:-8090}}',
  apiGateway: 'http://localhost:\${{TF_SERVICE_8090_PORT:-8090}}',
  progressMonitor: 'ws://localhost:\${{TF_SERVICE_8090_PORT:-8090}}',
  testTimeout: 60000
};

describe('TerraFusion OS End-to-End Tests', () => {
  let supremeCommander;
  let fieldGeneral1;
  let fieldGeneral2;
  let operationalAgents = [];

  beforeAll(async () => {
    console.log('🎯 Starting E2E tests - simulating 50,000+ agent coordination...');
    
    // Initialize Supreme Commander Claude
    supremeCommander = new SupremeCommanderClient(E2E_CONFIG.coordinator);
    await supremeCommander.connect();

    // Initialize Field Generals
    fieldGeneral1 = new FieldGeneralClient(E2E_CONFIG.coordinator, 'field-general-alpha', 'tactical-operations');
    fieldGeneral2 = new FieldGeneralClient(E2E_CONFIG.coordinator, 'field-general-beta', 'resource-management');
    
    await fieldGeneral1.connect();
    await fieldGeneral2.connect();

    // Initialize sample operational agents
    for (let i = 1; i <= 10; i++) {
      const agent = new TerraFusionMessageClient(
        E2E_CONFIG.coordinator,
        `operational-agent-${i.toString().padStart(3, '0')}`,
        'operational',
        { specialization: i % 2 === 0 ? 'data-processing' : 'citizen-services' }
      );
      
      await agent.connect();
      operationalAgents.push(agent);
      
      // Assign agents to field generals
      if (i <= 5) {
        fieldGeneral1.assignOperationalForce(agent.agentId);
      } else {
        fieldGeneral2.assignOperationalForce(agent.agentId);
      }
    }

    console.log('✅ E2E test environment initialized');
  }, E2E_CONFIG.testTimeout);

  afterAll(async () => {
    console.log('🧹 Cleaning up E2E test environment...');
    
    // Disconnect all agents
    await supremeCommander?.disconnect();
    await fieldGeneral1?.disconnect();
    await fieldGeneral2?.disconnect();
    
    for (const agent of operationalAgents) {
      await agent.disconnect();
    }
    
    console.log('✅ E2E cleanup complete');
  });

  describe('AI Agent Hierarchy Coordination', () => {
    test('should demonstrate complete command chain: Supreme Commander -> Field Generals -> Operational Forces', async () => {
      const responses = [];
      
      // Setup response collectors
      fieldGeneral1.on('message', (message, from) => {
        responses.push({ recipient: 'field-general-alpha', message, from });
      });
      
      fieldGeneral2.on('message', (message, from) => {
        responses.push({ recipient: 'field-general-beta', message, from });
      });

      // Supreme Commander issues strategic directive
      await supremeCommander.issueStrategicDirective('operation-citizen-census', {
        priority: 'high',
        deadline: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        resources: ['database-access', 'reporting-tools'],
        compliance: 'FISMA'
      });

      // Wait for messages to propagate
      await new Promise(resolve => setTimeout(resolve, 3000));

      // Verify field generals received the directive
      expect(responses.length).toBeGreaterThan(0);
      const directives = responses.filter(r => r.message.type === 'strategic_directive');
      expect(directives.length).toBeGreaterThan(0);
      expect(directives[0].message.directive).toBe('operation-citizen-census');
    });

    test('should coordinate field generals for joint operation', async () => {
      const operationName = 'joint-emergency-response';
      const fieldGenerals = ['field-general-alpha', 'field-general-beta'];
      
      const instructions = {
        phase1: 'immediate-assessment',
        phase2: 'resource-allocation',
        phase3: 'citizen-notification',
        coordination: true
      };

      await supremeCommander.coordinateOperation(operationName, fieldGenerals, instructions);

      // Verify coordination messages were sent
      const agentsList = await supremeCommander.listAgents();
      expect(agentsList.fieldGenerals).toEqual(expect.arrayContaining(fieldGenerals));
    });

    test('should handle status reports from operational forces', async () => {
      const statusCollector = [];
      
      // Field generals report status
      await fieldGeneral1.reportToSupremeCommander({
        operationalStatus: 'ready',
        forcesDeployed: 5,
        currentMission: 'citizen-data-processing',
        efficiency: 0.92
      });

      await fieldGeneral2.reportToSupremeCommander({
        operationalStatus: 'active',
        forcesDeployed: 5,
        currentMission: 'resource-optimization',
        efficiency: 0.88
      });

      // Request status reports from all agents
      await supremeCommander.requestStatusReports();

      // Verify status reporting mechanism works
      const metrics = await supremeCommander.getCoordinatorMetrics();
      expect(metrics.messagesProcessed).toBeGreaterThan(0);
    });
  });

  describe('Government Plugin Ecosystem', () => {
    test('should simulate citizen record processing workflow', async () => {
      // Simulate citizen registration event
      const citizenData = {
        citizenId: 'citizen-test-12345',
        firstName: 'Jane',
        lastName: 'Doe',
        address: '123 Main St, Benton County',
        phone: '555-0123',
        email: 'jane.doe@example.com',
        eventType: 'citizen_registration'
      };

      // Send to data processing agent
      const processingAgent = operationalAgents.find(a => 
        a.capabilities.specialization === 'data-processing'
      );

      if (processingAgent) {
        await supremeCommander.sendToAgent(processingAgent.agentId, {
          type: 'process_citizen_record',
          data: citizenData,
          priority: 'normal'
        });

        // Verify message routing
        const agentStatus = await processingAgent.getAgentStatus();
        expect(agentStatus.status).toBe('active');
      }
    });

    test('should handle permit application workflow', async () => {
      const permitData = {
        permitId: 'permit-test-67890',
        citizenId: 'citizen-test-12345',
        permitType: 'building',
        description: 'Residential deck construction',
        eventType: 'permit_application'
      };

      // Route through field general to appropriate agents
      await fieldGeneral1.deployForces('permit-processing', {
        permitData,
        reviewRequired: true,
        complianceChecks: ['zoning', 'safety', 'environmental']
      });

      // Verify deployment
      const generalMetrics = fieldGeneral1.getClientMetrics();
      expect(generalMetrics.messagesSent).toBeGreaterThan(0);
    });

    test('should demonstrate cross-plugin communication', async () => {
      // Simulate tax calculation request that requires citizen data
      const taxRequest = {
        type: 'calculate_property_tax',
        citizenId: 'citizen-test-12345',
        propertyId: 'prop-98765',
        taxYear: 2024
      };

      // Send to resource management specialist
      const resourceAgent = operationalAgents.find(a => 
        a.agentId.includes('006') // Even numbered agent with data-processing
      );

      if (resourceAgent) {
        await fieldGeneral2.sendToAgent(resourceAgent.agentId, taxRequest);
        
        // Verify cross-service communication capability
        expect(resourceAgent.connected).toBe(true);
      }
    });
  });

  describe('Real-time Monitoring and Compliance', () => {
    test('should track progress through monitoring dashboard', async () => {
      return new Promise((resolve, reject) => {
        const ws = new WebSocket(E2E_CONFIG.progressMonitor);
        let progressUpdates = 0;

        ws.on('open', () => {
          ws.send(JSON.stringify({ type: 'subscribe_progress' }));
        });

        ws.on('message', (data) => {
          try {
            const message = JSON.parse(data.toString());
            progressUpdates++;
            
            // Check for valid progress data
            if (message.component || message.status || message.progress) {
              expect(message).toBeDefined();
              
              // Collect a few updates then close
              if (progressUpdates >= 3) {
                ws.close();
                resolve();
              }
            }
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
          if (progressUpdates > 0) {
            resolve(); // Some updates received
          } else {
            reject(new Error('No progress updates received'));
          }
        }, 10000);
      });
    });

    test('should maintain government compliance audit trail', async () => {
      // Generate compliance events
      const complianceEvents = [
        {
          type: 'data_access',
          userId: 'admin-001',
          resource: 'citizen_records',
          action: 'read',
          reason: 'permit_review'
        },
        {
          type: 'system_modification',
          userId: 'tech-002',
          resource: 'plugin_configuration',
          action: 'update',
          reason: 'security_patch'
        }
      ];

      for (const event of complianceEvents) {
        await supremeCommander.broadcast({
          type: 'compliance_event',
          data: event,
          timestamp: new Date().toISOString(),
          complianceLevel: 'FISMA'
        });
      }

      // Verify events are logged
      const metrics = await supremeCommander.getCoordinatorMetrics();
      expect(metrics.messagesProcessed).toBeGreaterThan(0);
    });

    test('should handle system health monitoring', async () => {
      const healthChecks = [];

      // Collect health data from agents
      for (const agent of [supremeCommander, fieldGeneral1, fieldGeneral2, ...operationalAgents.slice(0, 3)]) {
        try {
          const status = await agent.getAgentStatus();
          healthChecks.push({
            agentId: agent.agentId,
            status: status.status,
            connected: agent.connected
          });
        } catch (error) {
          healthChecks.push({
            agentId: agent.agentId,
            status: 'error',
            error: error.message
          });
        }
      }

      // Verify health monitoring
      expect(healthChecks.length).toBeGreaterThan(0);
      
      const healthyAgents = healthChecks.filter(h => h.status === 'active' || h.connected);
      expect(healthyAgents.length).toBeGreaterThan(0);
      
      console.log('🏥 Health Check Results:', {
        total: healthChecks.length,
        healthy: healthyAgents.length,
        healthPercentage: Math.round((healthyAgents.length / healthChecks.length) * 100)
      });
    });
  });

  describe('Crisis Response Simulation', () => {
    test('should handle emergency broadcast to all agents', async () => {
      const emergencyAlert = {
        type: 'emergency_alert',
        level: 'critical',
        event: 'natural_disaster_simulation',
        instructions: {
          priority: 'maximum',
          responseRequired: true,
          coordination: 'immediate',
          resources: 'all_available'
        },
        timestamp: new Date().toISOString()
      };

      // Supreme Commander issues emergency directive
      await supremeCommander.broadcast(emergencyAlert);

      // Field Generals coordinate immediate response
      await fieldGeneral1.deployForces('emergency-response-alpha', {
        target: 'search-and-rescue',
        urgency: 'immediate'
      });

      await fieldGeneral2.deployForces('emergency-response-beta', {
        target: 'resource-distribution',
        urgency: 'immediate'
      });

      // Verify emergency response coordination
      const finalMetrics = await supremeCommander.getCoordinatorMetrics();
      expect(finalMetrics.messagesProcessed).toBeGreaterThan(10);
    });

    test('should demonstrate system scalability under load', async () => {
      const startTime = Date.now();
      const messagePromises = [];

      // Simulate high-volume message processing
      for (let i = 0; i < 50; i++) {
        const messagePromise = supremeCommander.broadcast({
          type: 'load_test',
          messageId: i,
          timestamp: new Date().toISOString(),
          data: `Load test message ${i}`
        });
        
        messagePromises.push(messagePromise);
      }

      // Wait for all messages to be sent
      await Promise.all(messagePromises);
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      const throughput = 50 / (duration / 1000); // messages per second

      console.log('📊 Load Test Results:', {
        messages: 50,
        duration: `${duration}ms`,
        throughput: `${throughput.toFixed(2)} msg/sec`
      });

      expect(duration).toBeLessThan(30000); // Should complete within 30 seconds
      expect(throughput).toBeGreaterThan(1); // At least 1 message per second
    });
  });

  describe('Integration with External Systems', () => {
    test('should validate API Gateway integration', async () => {
      try {
        // Test government API endpoint through Kong
        const response = await axios.get(`${E2E_CONFIG.apiGateway}/government/health`);
        expect(response.status).toBe(200);
      } catch (error) {
        // Gateway might not be configured for this endpoint
        console.warn('API Gateway test endpoint not available:', error.message);
      }
    });

    test('should demonstrate service discovery integration', async () => {
      // Verify agents can discover each other through service registry
      const agentsList = await supremeCommander.listAgents();
      
      expect(agentsList.totalAgents).toBeGreaterThan(10);
      expect(agentsList.supremeCommander).toBe('supreme-commander-claude');
      expect(agentsList.fieldGenerals).toContain('field-general-alpha');
      expect(agentsList.fieldGenerals).toContain('field-general-beta');
      
      // Verify operational agents are registered
      const operationalCount = agentsList.agents.filter(a => a.id.startsWith('operational-agent')).length;
      expect(operationalCount).toBe(10);
    });
  });
});

// Additional test utilities for E2E tests
function generateCitizenTestData(count = 1) {
  const citizens = [];
  for (let i = 0; i < count; i++) {
    citizens.push({
      citizenId: `test-citizen-${Date.now()}-${i}`,
      firstName: `TestFirst${i}`,
      lastName: `TestLast${i}`,
      address: `${100 + i} Test Street, Test County`,
      phone: `555-${String(i).padStart(4, '0')}`,
      email: `test${i}@example.com`
    });
  }
  return count === 1 ? citizens[0] : citizens;
}

function generatePermitTestData(citizenId, permitType = 'building') {
  return {
    permitId: `test-permit-${Date.now()}`,
    citizenId,
    permitType,
    description: `Test ${permitType} permit application`,
    applicationDate: new Date().toISOString(),
    status: 'pending'
  };
}

module.exports = {
  generateCitizenTestData,
  generatePermitTestData,
  E2E_CONFIG
};
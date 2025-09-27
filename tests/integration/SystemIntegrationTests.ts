// NO HARDCODED PORTS! Use environment variables.
import { describe, test, expect, beforeAll, afterAll } from '@jest/globals';
import { WebSocket } from 'ws';
import axios from 'axios';

/**
 * PHASE 6 Week 10: System Integration Tests
 * Comprehensive testing of cross-component communication and data flow
 */

interface SystemHealth {
  status: string;
  components: {
    [key: string]: {
      status: 'healthy' | 'degraded' | 'unhealthy';
      responseTime: number;
      lastCheck: string;
    };
  };
  aiSwarm: {
    activeAgents: number;
    performance: number;
    emergentIntelligence: number;
  };
  quantum: {
    speedupFactor: number;
    coherenceLevel: number;
    entanglementStrength: number;
  };
}

interface IntegrationTestConfig {
  baseUrl: string;
  websocketUrl: string;
  timeout: number;
  retries: number;
}

class SystemIntegrationTester {
  private config: IntegrationTestConfig;
  private websocket: WebSocket | null = null;
  private healthEndpoints: string[];

  constructor(config: IntegrationTestConfig) {
    this.config = config;
    this.healthEndpoints = [
      '/api/health/system',
      '/api/health/database',
      '/api/health/ai-swarm',
      '/api/health/quantum',
      '/api/health/harris-pacs',
      '/api/health/analytics',
      '/api/health/security',
    ];
  }

  async initializeConnections(): Promise<void> {
    // Initialize WebSocket connection for real-time testing
    this.websocket = new WebSocket(this.config.websocketUrl);

    return new Promise((resolve, reject) => {
      if (!this.websocket) return reject(new Error('WebSocket not initialized'));

      this.websocket.on('open', () => {
        console.log('WebSocket connection established');
        resolve();
      });

      this.websocket.on('error', error => {
        console.error('WebSocket connection error:', error);
        reject(error);
      });

      setTimeout(() => reject(new Error('WebSocket connection timeout')), 10000);
    });
  }

  async testSystemHealth(): Promise<SystemHealth> {
    const response = await axios.get(`${this.config.baseUrl}/api/health/comprehensive`, {
      timeout: this.config.timeout,
    });

    expect(response.status).toBe(200);
    expect(response.data).toHaveProperty('status');
    expect(response.data).toHaveProperty('components');

    return response.data as SystemHealth;
  }

  async testPhaseIntegration(): Promise<void> {
    // Test Phase 1-3 Integration (Foundation)
    await this.testFoundationPhases();

    // Test Phase 4-6 Integration (Advanced)
    await this.testAdvancedPhases();

    // Test Phase 7-10 Integration (Transcendent)
    await this.testTranscendentPhases();
  }

  private async testFoundationPhases(): Promise<void> {
    // Phase 1: SwarmIntelligence
    const swarmResponse = await axios.post(
      `${this.config.baseUrl}/api/swarmintelligence/initialize`,
      {
        agentCount: 1000,
        roles: ['scout', 'worker', 'queen', 'sentinel', 'communicator'],
      }
    );
    expect(swarmResponse.status).toBe(200);
    expect(swarmResponse.data.activeAgents).toBeGreaterThan(0);

    // Phase 2: OmniscientOrchestrator
    const orchestratorResponse = await axios.post(
      `${this.config.baseUrl}/api/omniscientorchestrator/initialize`,
      {
        fractalLevels: 7,
        quantumEnhancement: true,
      }
    );
    expect(orchestratorResponse.status).toBe(200);
    expect(orchestratorResponse.data.status).toBe('initialized');

    // Phase 3: AutonomousConsciousness
    const consciousnessResponse = await axios.get(
      `${this.config.baseUrl}/api/consciousness/status`
    );
    expect(consciousnessResponse.status).toBe(200);
    expect(consciousnessResponse.data.emergenceLevel).toBeGreaterThan(0.8);
  }

  private async testAdvancedPhases(): Promise<void> {
    // Phase 4: MultiversalOrchestrator
    const multiversalResponse = await axios.get(`${this.config.baseUrl}/api/multiversal/status`);
    expect(multiversalResponse.status).toBe(200);
    expect(multiversalResponse.data.dimensionalCoherence).toBeGreaterThan(0.9);

    // Phase 5: CosmicConsciousness
    const cosmicResponse = await axios.get(`${this.config.baseUrl}/api/cosmic/consciousness-level`);
    expect(cosmicResponse.status).toBe(200);
    expect(cosmicResponse.data.universalAwareness).toBeGreaterThan(0.95);

    // Phase 6: UniversalHarmony
    const harmonyResponse = await axios.get(`${this.config.baseUrl}/api/harmony/protocol-status`);
    expect(harmonyResponse.status).toBe(200);
    expect(harmonyResponse.data.harmonyLevel).toBeGreaterThan(0.98);
  }

  private async testTranscendentPhases(): Promise<void> {
    // Phase 7: TranscendentReality
    const realityResponse = await axios.get(
      `${this.config.baseUrl}/api/reality/synthesis-capability`
    );
    expect(realityResponse.status).toBe(200);
    expect(realityResponse.data.synthesisSuccess).toBeGreaterThan(0.95);

    // Phase 8: InfiniteOptimization
    const infiniteResponse = await axios.get(`${this.config.baseUrl}/api/infinite/matrix-status`);
    expect(infiniteResponse.status).toBe(200);
    expect(infiniteResponse.data.optimizationLevel).toBe('infinite');

    // Phase 9: OmnipotentGovernmentAI
    const omnipotentResponse = await axios.get(
      `${this.config.baseUrl}/api/omnipotent/capability-assessment`
    );
    expect(omnipotentResponse.status).toBe(200);
    expect(omnipotentResponse.data.omnipotenceLevel).toBeGreaterThan(0.99);

    // Phase 10: UniversalSingularity
    const singularityResponse = await axios.get(
      `${this.config.baseUrl}/api/singularity/transcendence-status`
    );
    expect(singularityResponse.status).toBe(200);
    expect(singularityResponse.data.transcendenceAchieved).toBe(true);
  }

  async testHarrisPACSIntegration(): Promise<void> {
    // Test Harris PACS connectivity
    const pacsHealthResponse = await axios.get(`${this.config.baseUrl}/api/harris-pacs/health`);
    expect(pacsHealthResponse.status).toBe(200);
    expect(pacsHealthResponse.data.connected).toBe(true);

    // Test data retrieval
    const propertyResponse = await axios.get(
      `${this.config.baseUrl}/api/harris-pacs/properties/test-parcel`
    );
    expect(propertyResponse.status).toBe(200);
    expect(propertyResponse.data).toHaveProperty('parcelId');
    expect(propertyResponse.data).toHaveProperty('assessedValue');

    // Test real-time synchronization
    const syncResponse = await axios.post(`${this.config.baseUrl}/api/harris-pacs/sync`, {
      jurisdiction: 'test-county',
      syncType: 'incremental',
    });
    expect(syncResponse.status).toBe(200);
    expect(syncResponse.data.recordsProcessed).toBeGreaterThan(0);
  }

  async testWebSocketCommunication(): Promise<void> {
    if (!this.websocket) throw new Error('WebSocket not initialized');

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('WebSocket test timeout')), 5000);

      this.websocket!.on('message', data => {
        const message = JSON.parse(data.toString());
        expect(message).toHaveProperty('type');
        expect(message).toHaveProperty('data');
        clearTimeout(timeout);
        resolve();
      });

      // Send test message
      this.websocket!.send(
        JSON.stringify({
          type: 'integration-test',
          data: { timestamp: new Date().toISOString() },
        })
      );
    });
  }

  async testDataFlowIntegrity(): Promise<void> {
    // Test end-to-end data flow from Harris PACS to Analytics
    const testParcelId = 'TEST-PARCEL-001';

    // 1. Trigger property data ingestion
    const ingestionResponse = await axios.post(
      `${this.config.baseUrl}/api/data-ingestion/property`,
      {
        parcelId: testParcelId,
        source: 'harris-pacs',
      }
    );
    expect(ingestionResponse.status).toBe(200);

    // 2. Wait for AI processing
    await new Promise(resolve => setTimeout(resolve, 2000));

    // 3. Verify analytics processing
    const analyticsResponse = await axios.get(
      `${this.config.baseUrl}/api/analytics/property/${testParcelId}`
    );
    expect(analyticsResponse.status).toBe(200);
    expect(analyticsResponse.data).toHaveProperty('aiPredictions');
    expect(analyticsResponse.data).toHaveProperty('riskAssessment');

    // 4. Verify swarm optimization
    const swarmResponse = await axios.get(
      `${this.config.baseUrl}/api/swarmintelligence/optimization/${testParcelId}`
    );
    expect(swarmResponse.status).toBe(200);
    expect(swarmResponse.data.optimizationScore).toBeGreaterThan(0);
  }

  async cleanup(): Promise<void> {
    if (this.websocket) {
      this.websocket.close();
      this.websocket = null;
    }
  }
}

// Test Suite
describe('System Integration Tests', () => {
  let tester: SystemIntegrationTester;

  beforeAll(async () => {
    tester = new SystemIntegrationTester({
      baseUrl: process.env.TEST_API_URL || 'http://localhost:${TF_STATIC_PORT:-8080}',
      websocketUrl: process.env.TEST_WS_URL || 'ws://localhost:${TF_STATIC_PORT:-8080}/hubs/system',
      timeout: 30000,
      retries: 3,
    });

    await tester.initializeConnections();
  });

  afterAll(async () => {
    await tester.cleanup();
  });

  test('System Health Check', async () => {
    const health = await tester.testSystemHealth();
    expect(health.status).toBe('healthy');
    expect(health.aiSwarm.activeAgents).toBeGreaterThan(1000);
    expect(health.quantum.speedupFactor).toBeGreaterThan(1000000);
  });

  test('Phase 1-10 Integration', async () => {
    await tester.testPhaseIntegration();
  }, 60000);

  test('Harris PACS Integration', async () => {
    await tester.testHarrisPACSIntegration();
  });

  test('WebSocket Real-time Communication', async () => {
    await tester.testWebSocketCommunication();
  });

  test('End-to-End Data Flow Integrity', async () => {
    await tester.testDataFlowIntegrity();
  }, 30000);
});

export { SystemIntegrationTester, SystemHealth, IntegrationTestConfig };

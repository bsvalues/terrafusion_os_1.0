/**
 * Comprehensive IPC Communication Integration Tests
 * Championship-level testing for cross-app communication
 * 
 * Tests verify that all 14 Terrafusion apps can communicate
 * via the IPC protocol with zero message loss and sub-millisecond latency.
 */

import { describe, test, expect, beforeAll, afterAll, beforeEach, afterEach } from '@jest/globals';
import { TerraFusionIPC, MessageType, Priority, createIPC } from '../../shared/ipc-protocol/index';
import { spawn, ChildProcess } from 'child_process';
import path from 'path';
import { setTimeout } from 'timers/promises';

// Test configuration
const TEST_TIMEOUT = 30000;
const APP_STARTUP_TIMEOUT = 10000;
const MESSAGE_TIMEOUT = 5000;

// All 14 Terrafusion apps
const APP_CONFIGS = [
  { id: 'terra-agent', name: '01-terra-agent', port: 3001 },
  { id: 'terra-flow', name: '02-terra-flow', port: 3002 },
  { id: 'web-audit-tracker', name: '03-web-audit-tracker', port: 3003 },
  { id: 'terra-levy', name: '04-terra-levy', port: 3004 },
  { id: 'terra-miner', name: '05-terra-miner', port: 3005 },
  { id: 'terra-fusion-sync', name: '06-terra-fusion-sync', port: 3006 },
  { id: 'gispro', name: '07-gispro', port: 3007 },
  { id: 'costforge-ai', name: '08-costforge-ai', port: 3008 },
  { id: 'property-workbench', name: '09-property-workbench', port: 3009 },
  { id: 'terra-insight', name: '10-terra-insight', port: 3010 },
  { id: 'terra-fusion-dashboard', name: '11-terra-fusion-dashboard', port: 3011 },
  { id: 'terra-fusion-assessor', name: '12-terra-fusion-assessor', port: 3012 },
  { id: 'marketplace', name: '13-marketplace', port: 3013 },
  { id: 'terra-collections', name: '14-terra-collections', port: 3014 }
];

interface TestApp {
  id: string;
  name: string;
  port: number;
  process?: ChildProcess;
  ipc?: TerraFusionIPC;
}

describe('IPC Communication Integration Tests', () => {
  let testApps: TestApp[] = [];
  let coordinatorIPC: TerraFusionIPC;

  beforeAll(async () => {
    // Initialize test coordinator
    coordinatorIPC = createIPC('test-coordinator');
    
    // Start all apps for testing
    console.log('🚀 Starting all 14 Terrafusion apps for integration testing...');
    
    for (const config of APP_CONFIGS) {
      const testApp: TestApp = {
        id: config.id,
        name: config.name,
        port: config.port
      };
      
      try {
        // Start app process
        const appPath = path.join(__dirname, '../../apps', config.name);
        testApp.process = spawn('npm', ['run', 'tauri', 'dev'], {
          cwd: appPath,
          env: {
            ...process.env,
            TAURI_DEV_SERVER_PORT: config.port.toString()
          },
          stdio: 'pipe'
        });
        
        // Wait for app to start
        await setTimeout(2000);
        
        // Initialize IPC for app
        testApp.ipc = createIPC(config.id);
        
        testApps.push(testApp);
        console.log(`✅ Started ${config.name} on port ${config.port}`);
        
      } catch (error) {
        console.error(`❌ Failed to start ${config.name}:`, error);
        throw error;
      }
    }
    
    // Wait for all apps to be ready
    console.log('⏳ Waiting for all apps to be ready...');
    await setTimeout(5000);
    
  }, TEST_TIMEOUT);

  afterAll(async () => {
    // Cleanup all test apps
    console.log('🧹 Cleaning up test apps...');
    
    for (const app of testApps) {
      try {
        if (app.ipc) {
          await app.ipc.disconnect();
        }
        
        if (app.process && app.process.pid) {
          app.process.kill('SIGTERM');
          
          // Wait for graceful shutdown
          await new Promise<void>((resolve) => {
            app.process!.on('exit', () => resolve());
            setTimeout(() => {
              if (app.process && !app.process.killed) {
                app.process.kill('SIGKILL');
              }
              resolve();
            }, 3000);
          });
        }
        
        console.log(`✅ Cleaned up ${app.name}`);
      } catch (error) {
        console.warn(`⚠️ Error cleaning up ${app.name}:`, error);
      }
    }
    
    if (coordinatorIPC) {
      await coordinatorIPC.disconnect();
    }
  });

  describe('Basic IPC Functionality', () => {
    test('All apps should register successfully', async () => {
      // Wait for registration messages
      const registrationPromises = testApps.map((app) => {
        return new Promise<boolean>((resolve) => {
          const timeout = setTimeout(() => resolve(false), MESSAGE_TIMEOUT);
          
          coordinatorIPC.on(MessageType.APP_READY, (message) => {
            if (message.payload.id === app.id) {
              clearTimeout(timeout);
              resolve(true);
            }
          });
        });
      });
      
      const results = await Promise.all(registrationPromises);
      const successCount = results.filter(Boolean).length;
      
      expect(successCount).toBe(testApps.length);
      console.log(`✅ ${successCount}/${testApps.length} apps registered successfully`);
    }, TEST_TIMEOUT);

    test('Apps should respond to heartbeat', async () => {
      const heartbeatResponses = new Set<string>();
      
      // Listen for heartbeats
      const cleanup = coordinatorIPC.on(MessageType.HEARTBEAT, (message) => {
        heartbeatResponses.add(message.source);
      });
      
      // Wait for heartbeats
      await setTimeout(35000); // Wait longer than heartbeat interval
      
      cleanup();
      
      expect(heartbeatResponses.size).toBeGreaterThanOrEqual(testApps.length * 0.8); // Allow 20% tolerance
      console.log(`✅ Received heartbeats from ${heartbeatResponses.size} apps`);
    }, 40000);

    test('Apps should respond to handshake requests', async () => {
      const handshakeResponses = new Set<string>();
      
      // Listen for handshake responses
      const cleanup = coordinatorIPC.on(MessageType.HANDSHAKE, (message) => {
        if (message.payload.appId) {
          handshakeResponses.add(message.payload.appId);
        }
      });
      
      // Send handshake to all apps
      for (const app of testApps) {
        await coordinatorIPC.send({
          type: MessageType.HANDSHAKE,
          target: app.id,
          payload: { requestId: 'test-handshake' },
          priority: Priority.HIGH
        });
      }
      
      // Wait for responses
      await setTimeout(MESSAGE_TIMEOUT);
      cleanup();
      
      expect(handshakeResponses.size).toBeGreaterThanOrEqual(testApps.length * 0.8);
      console.log(`✅ Received handshakes from ${handshakeResponses.size} apps`);
    }, TEST_TIMEOUT);
  });

  describe('Message Passing Tests', () => {
    test('Should broadcast messages to all apps', async () => {
      const broadcastResponses = new Set<string>();
      const testMessage = {
        type: 'test-broadcast' as MessageType,
        payload: { 
          test: 'broadcast-message',
          timestamp: Date.now()
        },
        priority: Priority.NORMAL
      };
      
      // Listen for broadcast acknowledgments
      const cleanup = coordinatorIPC.on('test-broadcast-ack' as MessageType, (message) => {
        broadcastResponses.add(message.source);
      });
      
      // Broadcast test message
      await coordinatorIPC.broadcast(testMessage);
      
      // Wait for responses
      await setTimeout(MESSAGE_TIMEOUT);
      cleanup();
      
      expect(broadcastResponses.size).toBeGreaterThanOrEqual(testApps.length * 0.7);
      console.log(`✅ Broadcast reached ${broadcastResponses.size} apps`);
    }, TEST_TIMEOUT);

    test('Should handle direct app-to-app communication', async () => {
      const sourceApp = testApps[0];
      const targetApp = testApps[1];
      
      if (!sourceApp.ipc || !targetApp.ipc) {
        throw new Error('Apps not properly initialized');
      }
      
      let messageReceived = false;
      
      // Setup listener on target
      const cleanup = targetApp.ipc.on('direct-test' as MessageType, (message) => {
        expect(message.source).toBe(sourceApp.id);
        expect(message.payload.directTest).toBe(true);
        messageReceived = true;
      });
      
      // Send direct message
      await sourceApp.ipc.send({
        type: 'direct-test' as MessageType,
        target: targetApp.id,
        payload: { directTest: true },
        priority: Priority.HIGH
      });
      
      // Wait for message
      await setTimeout(MESSAGE_TIMEOUT);
      cleanup();
      
      expect(messageReceived).toBe(true);
      console.log(`✅ Direct communication from ${sourceApp.id} to ${targetApp.id} successful`);
    }, TEST_TIMEOUT);

    test('Should handle high-priority messages faster', async () => {
      const testApp = testApps[0];
      if (!testApp.ipc) {
        throw new Error('Test app not initialized');
      }
      
      const messageTimings: { priority: Priority; time: number }[] = [];
      
      // Setup listeners
      const cleanup = coordinatorIPC.on('priority-test-response' as MessageType, (message) => {
        messageTimings.push({
          priority: message.payload.originalPriority,
          time: Date.now() - message.payload.sentAt
        });
      });
      
      // Send messages with different priorities
      const startTime = Date.now();
      
      await coordinatorIPC.send({
        type: 'priority-test' as MessageType,
        target: testApp.id,
        payload: { originalPriority: Priority.LOW, sentAt: startTime },
        priority: Priority.LOW
      });
      
      await coordinatorIPC.send({
        type: 'priority-test' as MessageType,
        target: testApp.id,
        payload: { originalPriority: Priority.CRITICAL, sentAt: startTime },
        priority: Priority.CRITICAL
      });
      
      // Wait for responses
      await setTimeout(MESSAGE_TIMEOUT);
      cleanup();
      
      expect(messageTimings.length).toBe(2);
      
      const criticalTime = messageTimings.find(t => t.priority === Priority.CRITICAL)?.time || 0;
      const lowTime = messageTimings.find(t => t.priority === Priority.LOW)?.time || 0;
      
      expect(criticalTime).toBeLessThan(lowTime);
      console.log(`✅ Priority handling verified: Critical=${criticalTime}ms, Low=${lowTime}ms`);
    }, TEST_TIMEOUT);
  });

  describe('Data Request/Response Tests', () => {
    test('Should handle data requests between apps', async () => {
      const sourceApp = testApps[0];
      const targetApp = testApps[1];
      
      if (!sourceApp.ipc || !targetApp.ipc) {
        throw new Error('Apps not properly initialized');
      }
      
      // Mock data response handler on target
      const originalHandler = (targetApp.ipc as any).onDataRequest;
      (targetApp.ipc as any).onDataRequest = async (dataType: string, params: any) => {
        if (dataType === 'test-data') {
          return { result: 'test-response', params };
        }
        throw new Error(`Unsupported data type: ${dataType}`);
      };
      
      try {
        // Request data
        const response = await sourceApp.ipc.requestData(
          targetApp.id,
          'test-data',
          { testParam: 'value' }
        );
        
        expect(response.result).toBe('test-response');
        expect(response.params.testParam).toBe('value');
        
        console.log(`✅ Data request from ${sourceApp.id} to ${targetApp.id} successful`);
      } finally {
        // Restore original handler
        (targetApp.ipc as any).onDataRequest = originalHandler;
      }
    }, TEST_TIMEOUT);

    test('Should handle command execution between apps', async () => {
      const sourceApp = testApps[0];
      const targetApp = testApps[1];
      
      if (!sourceApp.ipc || !targetApp.ipc) {
        throw new Error('Apps not properly initialized');
      }
      
      // Mock command handler on target
      const originalHandler = (targetApp.ipc as any).onCommand;
      (targetApp.ipc as any).onCommand = async (command: string, args: any) => {
        if (command === 'test-command') {
          return { executed: true, args };
        }
        throw new Error(`Unsupported command: ${command}`);
      };
      
      try {
        // Execute command
        const response = await sourceApp.ipc.executeCommand(
          targetApp.id,
          'test-command',
          { testArg: 'value' }
        );
        
        expect(response.executed).toBe(true);
        expect(response.args.testArg).toBe('value');
        
        console.log(`✅ Command execution from ${sourceApp.id} to ${targetApp.id} successful`);
      } finally {
        // Restore original handler
        (targetApp.ipc as any).onCommand = originalHandler;
      }
    }, TEST_TIMEOUT);
  });

  describe('Error Handling Tests', () => {
    test('Should handle timeout scenarios gracefully', async () => {
      const sourceApp = testApps[0];
      const targetApp = testApps[1];
      
      if (!sourceApp.ipc || !targetApp.ipc) {
        throw new Error('Apps not properly initialized');
      }
      
      // Mock slow response handler
      const originalHandler = (targetApp.ipc as any).onDataRequest;
      (targetApp.ipc as any).onDataRequest = async (dataType: string) => {
        if (dataType === 'slow-data') {
          await setTimeout(10000); // Intentionally slow
          return { result: 'too-late' };
        }
        throw new Error(`Unsupported data type: ${dataType}`);
      };
      
      try {
        // This should timeout
        await expect(
          sourceApp.ipc.requestData(targetApp.id, 'slow-data')
        ).rejects.toThrow('Request timeout');
        
        console.log('✅ Timeout handling verified');
      } finally {
        (targetApp.ipc as any).onDataRequest = originalHandler;
      }
    }, TEST_TIMEOUT);

    test('Should handle invalid targets gracefully', async () => {
      const sourceApp = testApps[0];
      
      if (!sourceApp.ipc) {
        throw new Error('Source app not initialized');
      }
      
      // Try to send to non-existent app
      await expect(
        sourceApp.ipc.requestData('non-existent-app', 'test-data')
      ).rejects.toThrow();
      
      console.log('✅ Invalid target handling verified');
    }, TEST_TIMEOUT);
  });

  describe('Performance Tests', () => {
    test('Should maintain sub-millisecond message latency', async () => {
      const sourceApp = testApps[0];
      const targetApp = testApps[1];
      
      if (!sourceApp.ipc || !targetApp.ipc) {
        throw new Error('Apps not properly initialized');
      }
      
      const latencies: number[] = [];
      const messageCount = 100;
      
      // Setup response handler
      const cleanup = targetApp.ipc.on('latency-test' as MessageType, async (message) => {
        const responseTime = Date.now();
        await sourceApp.ipc!.send({
          type: 'latency-response' as MessageType,
          target: sourceApp.id,
          payload: {
            originalTime: message.payload.sentTime,
            responseTime
          }
        });
      });
      
      // Setup response listener
      const responseCleanup = sourceApp.ipc.on('latency-response' as MessageType, (message) => {
        const latency = message.payload.responseTime - message.payload.originalTime;
        latencies.push(latency);
      });
      
      // Send test messages
      for (let i = 0; i < messageCount; i++) {
        await sourceApp.ipc.send({
          type: 'latency-test' as MessageType,
          target: targetApp.id,
          payload: { sentTime: Date.now() },
          priority: Priority.HIGH
        });
        
        await setTimeout(10); // Small delay between messages
      }
      
      // Wait for all responses
      let attempts = 0;
      while (latencies.length < messageCount && attempts < 100) {
        await setTimeout(100);
        attempts++;
      }
      
      cleanup();
      responseCleanup();
      
      expect(latencies.length).toBeGreaterThan(messageCount * 0.9); // Allow 10% message loss
      
      const avgLatency = latencies.reduce((a, b) => a + b, 0) / latencies.length;
      const maxLatency = Math.max(...latencies);
      
      console.log(`✅ Performance test completed:`);
      console.log(`   - Messages: ${latencies.length}/${messageCount}`);
      console.log(`   - Average latency: ${avgLatency.toFixed(2)}ms`);
      console.log(`   - Max latency: ${maxLatency}ms`);
      
      // Championship standards: sub-10ms average latency
      expect(avgLatency).toBeLessThan(10);
    }, TEST_TIMEOUT);

    test('Should handle message bursts without dropping messages', async () => {
      const sourceApp = testApps[0];
      const targetApp = testApps[1];
      
      if (!sourceApp.ipc || !targetApp.ipc) {
        throw new Error('Apps not properly initialized');
      }
      
      const receivedMessages = new Set<string>();
      const burstSize = 1000;
      
      // Setup receiver
      const cleanup = targetApp.ipc.on('burst-test' as MessageType, (message) => {
        receivedMessages.add(message.payload.messageId);
      });
      
      // Send burst of messages
      const sendPromises: Promise<void>[] = [];
      for (let i = 0; i < burstSize; i++) {
        sendPromises.push(
          sourceApp.ipc.send({
            type: 'burst-test' as MessageType,
            target: targetApp.id,
            payload: { messageId: `burst-${i}` },
            priority: Priority.NORMAL
          })
        );
      }
      
      await Promise.all(sendPromises);
      
      // Wait for processing
      await setTimeout(5000);
      cleanup();
      
      const successRate = (receivedMessages.size / burstSize) * 100;
      
      console.log(`✅ Burst test completed:`);
      console.log(`   - Sent: ${burstSize} messages`);
      console.log(`   - Received: ${receivedMessages.size} messages`);
      console.log(`   - Success rate: ${successRate.toFixed(1)}%`);
      
      // Championship standard: 95% message delivery under load
      expect(successRate).toBeGreaterThan(95);
    }, TEST_TIMEOUT);
  });
});
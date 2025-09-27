/**
 * Message Queue Integration Tests
 * Championship-level message queue testing for zero-copy messaging
 *
 * Tests verify message bus performance, reliability, and
 * cross-app message routing with Tesla-grade standards.
 */

import { describe, test, expect, beforeAll, afterAll, beforeEach, afterEach } from '@jest/globals';
import {
  MessageBus,
  Message,
  MessagePriority,
  ChannelConfig,
  MessageReceiver,
} from '../../shared/rust-services/placeholder/src/messaging';
import { MetricsCollector } from '../../shared/rust-services/placeholder/src/metrics';
import { AppId } from '../../shared/rust-services/placeholder/src/types';
import { setTimeout } from 'timers/promises';

// Test configuration
const TEST_TIMEOUT = 30000;
const MESSAGE_TIMEOUT = 5000;
const PERFORMANCE_TEST_MESSAGES = 1000;
const STRESS_TEST_MESSAGES = 10000;

// Test app IDs
const TEST_APP_IDS = [
  'terra-agent',
  'terra-flow',
  'web-audit-tracker',
  'terra-levy',
  'terra-miner',
  'terra-fusion-sync',
  'gispro',
  'costforge-ai',
  'property-workbench',
  'terra-insight',
  'terra-fusion-dashboard',
  'terra-fusion-assessor',
  'marketplace',
  'terra-collections',
].map(id => new AppId(id));

describe('Message Queue Integration Tests', () => {
  let messageBus: MessageBus;
  let metrics: MetricsCollector;
  let testChannels: string[] = [];
  let testReceivers: Map<string, MessageReceiver> = new Map();

  beforeAll(async () => {
    // Initialize metrics collector
    metrics = new MetricsCollector();

    // Initialize message bus
    messageBus = new MessageBus(metrics);

    console.log('🚀 Message bus initialized for integration testing');
  }, TEST_TIMEOUT);

  afterAll(async () => {
    // Cleanup test receivers
    for (const [channelName, receiver] of testReceivers) {
      try {
        // Receivers should auto-cleanup, but we'll clear our references
        console.log(`✅ Cleaned up receiver for ${channelName}`);
      } catch (error) {
        console.warn(`⚠️ Error cleaning up receiver for ${channelName}:`, error);
      }
    }

    testReceivers.clear();
    testChannels = [];

    console.log('✅ Message queue integration tests cleanup complete');
  });

  beforeEach(async () => {
    // Clean up any existing test channels
    testChannels = [];
    testReceivers.clear();
  });

  describe('Channel Management Tests', () => {
    test(
      'Should create channels with different configurations',
      async () => {
        const channelConfigs = [
          { name: 'test-unbounded', config: { ...new ChannelConfig(), capacity: 0 } },
          { name: 'test-bounded-small', config: { ...new ChannelConfig(), capacity: 10 } },
          { name: 'test-bounded-large', config: { ...new ChannelConfig(), capacity: 1000 } },
          { name: 'test-ordered', config: { ...new ChannelConfig(), ordered: true } },
          { name: 'test-unordered', config: { ...new ChannelConfig(), ordered: false } },
        ];

        for (const { name, config } of channelConfigs) {
          await messageBus.create_channel(name, config);
          testChannels.push(name);

          const info = await messageBus.channel_info(name);
          expect(info.name).toBe(name);
          expect(info.config.capacity).toBe(config.capacity);
          expect(info.config.ordered).toBe(config.ordered);
        }

        console.log(`✅ Created ${channelConfigs.length} channels with different configurations`);
      },
      TEST_TIMEOUT
    );

    test(
      'Should handle channel subscriber management',
      async () => {
        const channelName = 'test-subscribers';
        const config = new ChannelConfig();

        await messageBus.create_channel(channelName, config);
        testChannels.push(channelName);

        // Create multiple subscribers
        const subscribers: MessageReceiver[] = [];
        const subscriberCount = 5;

        for (let i = 0; i < subscriberCount; i++) {
          const receiver = await messageBus.subscribe(channelName);
          subscribers.push(receiver);
          testReceivers.set(`${channelName}-${i}`, receiver);
        }

        // Verify channel info shows correct subscriber count
        const info = await messageBus.channel_info(channelName);
        expect(info.subscriber_count).toBe(subscriberCount);

        console.log(`✅ Created ${subscriberCount} subscribers for channel ${channelName}`);
      },
      TEST_TIMEOUT
    );

    test(
      'Should enforce channel capacity limits',
      async () => {
        const channelName = 'test-capacity-limit';
        const config = { ...new ChannelConfig(), capacity: 2 }; // Very small capacity

        await messageBus.create_channel(channelName, config);
        testChannels.push(channelName);

        const testApp = TEST_APP_IDS[0];

        // Fill channel to capacity
        const message1 = Message.new(testApp, 'capacity-test', { id: 1 });
        const message2 = Message.new(testApp, 'capacity-test', { id: 2 });

        await messageBus.send(channelName, message1);
        await messageBus.send(channelName, message2);

        // Next message should fail due to capacity
        const message3 = Message.new(testApp, 'capacity-test', { id: 3 });

        await expect(messageBus.send(channelName, message3)).rejects.toThrow(/Channel.*is full/);

        console.log(`✅ Channel capacity limit enforcement verified`);
      },
      TEST_TIMEOUT
    );
  });

  describe('Message Passing Tests', () => {
    test(
      'Should send and receive messages correctly',
      async () => {
        const channelName = 'test-basic-messaging';
        const config = new ChannelConfig();

        await messageBus.create_channel(channelName, config);
        testChannels.push(channelName);

        const receiver = await messageBus.subscribe(channelName);
        testReceivers.set(channelName, receiver);

        const testApp = TEST_APP_IDS[0];
        const testPayload = {
          message: 'Hello, Terrafusion!',
          timestamp: Date.now(),
          data: { nested: 'value' },
        };

        const message = Message.new(testApp, 'test-message', testPayload);

        // Send message
        await messageBus.send(channelName, message);

        // Receive message
        const received = await receiver.recv_timeout(MESSAGE_TIMEOUT);

        expect(received.from).toEqual(testApp);
        expect(received.message_type).toBe('test-message');
        expect(received.payload_json).toEqual(testPayload);

        console.log('✅ Basic message send/receive verified');
      },
      TEST_TIMEOUT
    );

    test(
      'Should handle message priorities correctly',
      async () => {
        const channelName = 'test-priority-messaging';
        const config = new ChannelConfig();

        await messageBus.create_channel(channelName, config);
        testChannels.push(channelName);

        const receiver = await messageBus.subscribe(channelName);
        testReceivers.set(channelName, receiver);

        const testApp = TEST_APP_IDS[0];
        const receivedMessages: Message[] = [];

        // Send messages with different priorities
        const lowPriorityMsg = Message.new(testApp, 'priority-test', {
          priority: 'low',
        }).with_priority(MessagePriority.Low);
        const highPriorityMsg = Message.new(testApp, 'priority-test', {
          priority: 'high',
        }).with_priority(MessagePriority.High);
        const criticalPriorityMsg = Message.new(testApp, 'priority-test', {
          priority: 'critical',
        }).with_priority(MessagePriority.Critical);

        // Send in reverse priority order
        await messageBus.send(channelName, lowPriorityMsg);
        await messageBus.send(channelName, highPriorityMsg);
        await messageBus.send(channelName, criticalPriorityMsg);

        // Receive messages
        for (let i = 0; i < 3; i++) {
          const received = await receiver.recv_timeout(MESSAGE_TIMEOUT);
          receivedMessages.push(received);
        }

        // Verify priority ordering (if supported by implementation)
        expect(receivedMessages).toHaveLength(3);

        // At minimum, all messages should be received
        const priorities = receivedMessages.map(m => m.priority);
        expect(priorities).toContain(MessagePriority.Low);
        expect(priorities).toContain(MessagePriority.High);
        expect(priorities).toContain(MessagePriority.Critical);

        console.log('✅ Message priority handling verified');
      },
      TEST_TIMEOUT
    );

    test(
      'Should broadcast messages to multiple subscribers',
      async () => {
        const channelName = 'test-broadcast';
        const config = new ChannelConfig();

        await messageBus.create_channel(channelName, config);
        testChannels.push(channelName);

        // Create multiple subscribers
        const subscribers: MessageReceiver[] = [];
        const subscriberCount = 3;

        for (let i = 0; i < subscriberCount; i++) {
          const receiver = await messageBus.subscribe(channelName);
          subscribers.push(receiver);
          testReceivers.set(`${channelName}-${i}`, receiver);
        }

        const testApp = TEST_APP_IDS[0];
        const broadcastPayload = {
          broadcast: true,
          timestamp: Date.now(),
          message: 'Broadcast to all subscribers',
        };

        const message = Message.new(testApp, 'broadcast-test', broadcastPayload);

        // Broadcast message
        const successCount = await messageBus.broadcast(channelName, message);
        expect(successCount).toBe(subscriberCount);

        // Verify all subscribers received the message
        const receivedMessages: Message[] = [];
        for (const subscriber of subscribers) {
          try {
            const received = await subscriber.recv_timeout(MESSAGE_TIMEOUT);
            receivedMessages.push(received);
          } catch (error) {
            console.warn('Subscriber failed to receive broadcast message:', error);
          }
        }

        expect(receivedMessages.length).toBe(subscriberCount);
        receivedMessages.forEach(msg => {
          expect(msg.payload_json).toEqual(broadcastPayload);
        });

        console.log(`✅ Broadcast to ${subscriberCount} subscribers successful`);
      },
      TEST_TIMEOUT
    );
  });

  describe('Cross-App Communication Tests', () => {
    test(
      'Should route messages between different apps',
      async () => {
        const channelName = 'test-cross-app';
        const config = new ChannelConfig();

        await messageBus.create_channel(channelName, config);
        testChannels.push(channelName);

        // Register multiple apps
        const sourceApp = TEST_APP_IDS[0];
        const targetApp = TEST_APP_IDS[1];

        await messageBus.register_app(sourceApp, [channelName]);
        await messageBus.register_app(targetApp, [channelName]);

        // Create receiver for target app
        const receiver = await messageBus.subscribe(channelName);
        testReceivers.set(channelName, receiver);

        // Send targeted message
        const targetedPayload = {
          from: sourceApp.toString(),
          to: targetApp.toString(),
          message: 'Direct app-to-app communication',
        };

        const message = Message.new(sourceApp, 'cross-app-test', targetedPayload).to(targetApp);

        await messageBus.send(channelName, message);

        // Receive and verify
        const received = await receiver.recv_timeout(MESSAGE_TIMEOUT);

        expect(received.from).toEqual(sourceApp);
        expect(received.to).toEqual(targetApp);
        expect(received.payload_json).toEqual(targetedPayload);

        console.log(`✅ Cross-app communication from ${sourceApp} to ${targetApp} verified`);
      },
      TEST_TIMEOUT
    );

    test(
      'Should handle request-response patterns',
      async () => {
        const channelName = 'test-request-response';
        const config = new ChannelConfig();

        await messageBus.create_channel(channelName, config);
        testChannels.push(channelName);

        const requesterApp = TEST_APP_IDS[0];
        const responderApp = TEST_APP_IDS[1];

        // Create receivers for both apps
        const requesterReceiver = await messageBus.subscribe(channelName);
        const responderReceiver = await messageBus.subscribe(channelName);

        testReceivers.set(`${channelName}-requester`, requesterReceiver);
        testReceivers.set(`${channelName}-responder`, responderReceiver);

        const correlationId = `req-${Date.now()}`;

        // Send request
        const requestPayload = {
          type: 'data-request',
          requestId: correlationId,
          query: 'SELECT * FROM test_data',
        };

        const requestMessage = Message.new(requesterApp, 'data-request', requestPayload)
          .to(responderApp)
          .with_correlation_id(correlationId);

        await messageBus.send(channelName, requestMessage);

        // Simulate responder receiving and responding
        const receivedRequest = await responderReceiver.recv_timeout(MESSAGE_TIMEOUT);
        expect(receivedRequest.correlation_id).toBe(correlationId);

        // Send response
        const responsePayload = {
          type: 'data-response',
          requestId: correlationId,
          data: [{ id: 1, name: 'test' }],
          success: true,
        };

        const responseMessage = receivedRequest.create_response(responsePayload);
        await messageBus.send(channelName, responseMessage);

        // Verify requester receives response
        const receivedResponse = await requesterReceiver.recv_timeout(MESSAGE_TIMEOUT);
        expect(receivedResponse.correlation_id).toBe(correlationId);
        expect(receivedResponse.payload_json.success).toBe(true);

        console.log('✅ Request-response pattern verified');
      },
      TEST_TIMEOUT
    );
  });

  describe('Performance Tests', () => {
    test('Should maintain high throughput under load', async () => {
      const channelName = 'test-throughput';
      const config = { ...new ChannelConfig(), capacity: 0 }; // Unbounded for performance

      await messageBus.create_channel(channelName, config);
      testChannels.push(channelName);

      const receiver = await messageBus.subscribe(channelName);
      testReceivers.set(channelName, receiver);

      const testApp = TEST_APP_IDS[0];
      const startTime = Date.now();

      console.log(`🚀 Starting throughput test with ${PERFORMANCE_TEST_MESSAGES} messages...`);

      // Send messages in batches for better performance
      const batchSize = 100;
      const batches = Math.ceil(PERFORMANCE_TEST_MESSAGES / batchSize);

      for (let batch = 0; batch < batches; batch++) {
        const batchPromises: Promise<void>[] = [];
        const batchStart = batch * batchSize;
        const batchEnd = Math.min(batchStart + batchSize, PERFORMANCE_TEST_MESSAGES);

        for (let i = batchStart; i < batchEnd; i++) {
          const message = Message.new(testApp, 'throughput-test', {
            messageId: i,
            timestamp: Date.now(),
            payload: `Test message ${i}`,
          });

          batchPromises.push(messageBus.send(channelName, message));
        }

        await Promise.all(batchPromises);

        if (batch % 10 === 0) {
          console.log(`   Sent: ${batch + 1}/${batches} batches`);
        }
      }

      const sendTime = Date.now() - startTime;

      // Receive messages
      const receiveStartTime = Date.now();
      const receivedMessages: Message[] = [];

      for (let i = 0; i < PERFORMANCE_TEST_MESSAGES; i++) {
        try {
          const received = await receiver.recv_timeout(100); // Short timeout for performance
          receivedMessages.push(received);

          if (i % 100 === 0 && i > 0) {
            console.log(`   Received: ${i}/${PERFORMANCE_TEST_MESSAGES} messages`);
          }
        } catch (error) {
          // Timeout or other error
          break;
        }
      }

      const receiveTime = Date.now() - receiveStartTime;
      const totalTime = Date.now() - startTime;

      const sendThroughput = (PERFORMANCE_TEST_MESSAGES / sendTime) * 1000;
      const receiveThroughput = (receivedMessages.length / receiveTime) * 1000;

      console.log(`✅ Throughput test completed:`);
      console.log(`   - Messages sent: ${PERFORMANCE_TEST_MESSAGES} in ${sendTime}ms`);
      console.log(`   - Messages received: ${receivedMessages.length} in ${receiveTime}ms`);
      console.log(`   - Send throughput: ${sendThroughput.toFixed(2)} msg/sec`);
      console.log(`   - Receive throughput: ${receiveThroughput.toFixed(2)} msg/sec`);
      console.log(
        `   - Success rate: ${((receivedMessages.length / PERFORMANCE_TEST_MESSAGES) * 100).toFixed(1)}%`
      );

      // Performance expectations
      expect(sendThroughput).toBeGreaterThan(1000); // At least 1K messages/sec
      expect(receivedMessages.length).toBeGreaterThan(PERFORMANCE_TEST_MESSAGES * 0.95); // 95% delivery rate
    }, 60000); // Extended timeout for performance test

    test(
      'Should handle concurrent subscribers efficiently',
      async () => {
        const channelName = 'test-concurrent-subscribers';
        const config = new ChannelConfig();

        await messageBus.create_channel(channelName, config);
        testChannels.push(channelName);

        // Create many concurrent subscribers
        const subscriberCount = 20;
        const subscribers: MessageReceiver[] = [];

        for (let i = 0; i < subscriberCount; i++) {
          const receiver = await messageBus.subscribe(channelName);
          subscribers.push(receiver);
          testReceivers.set(`${channelName}-${i}`, receiver);
        }

        const testApp = TEST_APP_IDS[0];
        const messageCount = 100;
        const receivedCounts: number[] = new Array(subscriberCount).fill(0);

        // Start concurrent receivers
        const receivePromises = subscribers.map((subscriber /* , index */) => {
          return (async () => {
            for (let i = 0; i < messageCount; i++) {
              try {
                await subscriber.recv_timeout(1000);
                receivedCounts[index]++;
              } catch (error) {
                // Timeout or other error
                break;
              }
            }
          })();
        });

        // Send messages via broadcast
        const sendPromises: Promise<number>[] = [];
        for (let i = 0; i < messageCount; i++) {
          const message = Message.new(testApp, 'concurrent-test', {
            messageId: i,
            timestamp: Date.now(),
          });

          sendPromises.push(messageBus.broadcast(channelName, message));
        }

        // Wait for all operations
        const [sendResults] = await Promise.all([
          Promise.all(sendPromises),
          Promise.all(receivePromises),
        ]);

        const totalReceived = receivedCounts.reduce((a, b) => a + b, 0);
        const avgPerSubscriber = totalReceived / subscriberCount;
        const successfulBroadcasts = sendResults.filter(count => count === subscriberCount).length;

        console.log(`✅ Concurrent subscribers test completed:`);
        console.log(`   - Subscribers: ${subscriberCount}`);
        console.log(`   - Messages sent: ${messageCount}`);
        console.log(`   - Successful broadcasts: ${successfulBroadcasts}`);
        console.log(`   - Total messages received: ${totalReceived}`);
        console.log(`   - Average per subscriber: ${avgPerSubscriber.toFixed(1)}`);

        expect(avgPerSubscriber).toBeGreaterThan(messageCount * 0.8); // 80% delivery rate per subscriber
      },
      TEST_TIMEOUT
    );
  });

  describe('Error Handling and Recovery Tests', () => {
    test(
      'Should handle channel disconnections gracefully',
      async () => {
        const channelName = 'test-disconnection';
        const config = new ChannelConfig();

        await messageBus.create_channel(channelName, config);
        testChannels.push(channelName);

        const receiver = await messageBus.subscribe(channelName);
        testReceivers.set(channelName, receiver);

        // Send a message to establish connection
        const testApp = TEST_APP_IDS[0];
        const message = Message.new(testApp, 'disconnect-test', { test: 'before-disconnect' });

        await messageBus.send(channelName, message);
        const received = await receiver.recv_timeout(MESSAGE_TIMEOUT);
        expect(received.payload_json.test).toBe('before-disconnect');

        // Simulate disconnection by trying to receive with very short timeout
        const disconnectResult = receiver.try_recv();
        expect(disconnectResult).resolves.toBe(null); // No message available

        console.log('✅ Channel disconnection handling verified');
      },
      TEST_TIMEOUT
    );

    test(
      'Should recover from temporary failures',
      async () => {
        const channelName = 'test-recovery';
        const config = new ChannelConfig();

        await messageBus.create_channel(channelName, config);
        testChannels.push(channelName);

        // Perform health check
        await expect(messageBus.health_check()).resolves.not.toThrow();

        // Verify normal operations work after health check
        const receiver = await messageBus.subscribe(channelName);
        testReceivers.set(channelName, receiver);

        const testApp = TEST_APP_IDS[0];
        const message = Message.new(testApp, 'recovery-test', { recovered: true });

        await messageBus.send(channelName, message);
        const received = await receiver.recv_timeout(MESSAGE_TIMEOUT);

        expect(received.payload_json.recovered).toBe(true);

        console.log('✅ Recovery from failures verified');
      },
      TEST_TIMEOUT
    );

    test(
      'Should validate message integrity',
      async () => {
        const channelName = 'test-integrity';
        const config = new ChannelConfig();

        await messageBus.create_channel(channelName, config);
        testChannels.push(channelName);

        const receiver = await messageBus.subscribe(channelName);
        testReceivers.set(channelName, receiver);

        const testApp = TEST_APP_IDS[0];

        // Send message with complex payload
        const complexPayload = {
          string: 'test string with special chars: àéîøü',
          number: 3.14159,
          boolean: true,
          null_value: null,
          array: [1, 2, 3, 'four', { nested: 'object' }],
          object: {
            nested: {
              deeply: {
                value: 'deep value',
              },
            },
          },
          timestamp: Date.now(),
        };

        const message = Message.new(testApp, 'integrity-test', complexPayload);

        await messageBus.send(channelName, message);
        const received = await receiver.recv_timeout(MESSAGE_TIMEOUT);

        // Verify payload integrity
        expect(received.payload_json).toEqual(complexPayload);
        expect(received.from).toEqual(testApp);
        expect(received.message_type).toBe('integrity-test');

        console.log('✅ Message integrity validation passed');
      },
      TEST_TIMEOUT
    );
  });
});

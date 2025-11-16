/**
 * Tests for TransparencyBus
 */

import { InMemoryTransparencyBus, publishAction } from '../src/bus';
import { AgentAction } from '../src/types';

describe('InMemoryTransparencyBus', () => {
  let bus: InMemoryTransparencyBus;

  beforeEach(() => {
    bus = new InMemoryTransparencyBus();
  });

  afterEach(() => {
    bus.clear();
  });

  test('should publish actions to subscribers', () => {
    const actions: AgentAction[] = [];

    bus.subscribe(action => {
      actions.push(action);
    });

    const testAction: AgentAction = {
      timestamp: new Date().toISOString(),
      agentId: 'test-agent-1',
      agentRole: 'Test Agent',
      workspace: 'backend',
      service: 'tdc-cli',
      phase: 'executing',
      summary: 'Test action',
    };

    bus.publish(testAction);

    expect(actions).toHaveLength(1);
    expect(actions[0]).toEqual(testAction);
  });

  test('should support multiple subscribers', () => {
    const actions1: AgentAction[] = [];
    const actions2: AgentAction[] = [];

    bus.subscribe(action => actions1.push(action));
    bus.subscribe(action => actions2.push(action));

    const testAction: AgentAction = {
      timestamp: new Date().toISOString(),
      agentId: 'test-agent-1',
      agentRole: 'Test Agent',
      workspace: 'backend',
      service: 'tdc-cli',
      phase: 'executing',
      summary: 'Test action',
    };

    bus.publish(testAction);

    expect(actions1).toHaveLength(1);
    expect(actions2).toHaveLength(1);
  });

  test('should allow unsubscribing', () => {
    const actions: AgentAction[] = [];

    const unsubscribe = bus.subscribe(action => {
      actions.push(action);
    });

    const testAction: AgentAction = {
      timestamp: new Date().toISOString(),
      agentId: 'test-agent-1',
      agentRole: 'Test Agent',
      workspace: 'backend',
      service: 'tdc-cli',
      phase: 'executing',
      summary: 'Test action 1',
    };

    bus.publish(testAction);
    expect(actions).toHaveLength(1);

    unsubscribe();

    bus.publish({ ...testAction, summary: 'Test action 2' });
    expect(actions).toHaveLength(1); // Should not receive second action
  });

  test('should track subscriber count', () => {
    expect(bus.getSubscriberCount()).toBe(0);

    const unsub1 = bus.subscribe(() => {});
    expect(bus.getSubscriberCount()).toBe(1);

    const unsub2 = bus.subscribe(() => {});
    expect(bus.getSubscriberCount()).toBe(2);

    unsub1();
    expect(bus.getSubscriberCount()).toBe(1);

    unsub2();
    expect(bus.getSubscriberCount()).toBe(0);
  });

  test('should track total actions published', () => {
    expect(bus.getTotalActionsPublished()).toBe(0);

    const testAction: AgentAction = {
      timestamp: new Date().toISOString(),
      agentId: 'test-agent-1',
      agentRole: 'Test Agent',
      workspace: 'backend',
      service: 'tdc-cli',
      phase: 'executing',
      summary: 'Test action',
    };

    bus.publish(testAction);
    expect(bus.getTotalActionsPublished()).toBe(1);

    bus.publish(testAction);
    bus.publish(testAction);
    expect(bus.getTotalActionsPublished()).toBe(3);
  });

  test('should handle subscriber errors gracefully', () => {
    const goodActions: AgentAction[] = [];

    // Subscribe with a handler that throws
    bus.subscribe(() => {
      throw new Error('Subscriber error');
    });

    // Subscribe with a good handler
    bus.subscribe(action => {
      goodActions.push(action);
    });

    const testAction: AgentAction = {
      timestamp: new Date().toISOString(),
      agentId: 'test-agent-1',
      agentRole: 'Test Agent',
      workspace: 'backend',
      service: 'tdc-cli',
      phase: 'executing',
      summary: 'Test action',
    };

    // Should not throw, good handler should still receive action
    expect(() => bus.publish(testAction)).not.toThrow();
    expect(goodActions).toHaveLength(1);
  });

  test('publishAction helper should work', () => {
    const actions: AgentAction[] = [];
    bus.subscribe(action => actions.push(action));

    publishAction(bus, {
      agentId: 'helper-test',
      agentRole: 'Helper Test Agent',
      workspace: 'frontend',
      service: 'portal-ui',
      phase: 'complete',
      summary: 'Test via helper',
      details: { foo: 'bar' },
    });

    expect(actions).toHaveLength(1);
    expect(actions[0].agentId).toBe('helper-test');
    expect(actions[0].details).toEqual({ foo: 'bar' });
  });
});

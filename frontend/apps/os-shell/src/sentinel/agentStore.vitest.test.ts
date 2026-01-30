/**
 * TerraFusion OS - Agent Store Cursor & Gap Detection Tests
 * ═══════════════════════════════════════════════════════════════════════════
 * GOVERNANCE: These tests lock cursor progression and gap signaling behavior.
 * ═══════════════════════════════════════════════════════════════════════════
 */

import { beforeEach, describe, expect, it } from 'vitest';
import { useAgentStore } from './agentStore';
import type { AgentEvent } from './agentTypes';

// Helper to create mock events
function makeEvent(seq: number, id?: string): AgentEvent {
  return {
    seq,
    id: id ?? `evt-${seq}`,
    tsUtc: new Date(Date.now() + seq * 1000).toISOString(),
    level: 'Info',
    agent: 'TestAgent',
    topic: 'test',
    message: `Event ${seq}`,
  };
}

describe('agentStore cursor progression', () => {
  beforeEach(() => {
    // Reset store state before each test
    useAgentStore.setState({
      events: [],
      cursor: 0,
      gapDetected: false,
      eventsWarnings: [],
    });
  });

  it('initializes with cursor at 0', () => {
    const state = useAgentStore.getState();
    expect(state.cursor).toBe(0);
    expect(state.gapDetected).toBe(false);
  });

  it('updates cursor to nextAfter after appending events', () => {
    const { appendEvents } = useAgentStore.getState();

    appendEvents([makeEvent(1), makeEvent(2), makeEvent(3)], 3, 1, []);

    const state = useAgentStore.getState();
    expect(state.cursor).toBe(3);
  });

  it('cursor advances monotonically across multiple appends', () => {
    const { appendEvents } = useAgentStore.getState();

    appendEvents([makeEvent(1), makeEvent(2)], 2, 1, []);
    expect(useAgentStore.getState().cursor).toBe(2);

    appendEvents([makeEvent(3), makeEvent(4)], 4, 1, []);
    expect(useAgentStore.getState().cursor).toBe(4);

    appendEvents([makeEvent(5)], 5, 1, []);
    expect(useAgentStore.getState().cursor).toBe(5);
  });

  it('events are sorted by seq ascending', () => {
    const { appendEvents } = useAgentStore.getState();

    // Append in random order
    appendEvents([makeEvent(3), makeEvent(1), makeEvent(2)], 3, 1, []);

    const state = useAgentStore.getState();
    expect(state.events.map((e) => e.seq)).toEqual([1, 2, 3]);
  });

  it('deduplicates events by id', () => {
    const { appendEvents } = useAgentStore.getState();

    appendEvents([makeEvent(1), makeEvent(2)], 2, 1, []);
    appendEvents([makeEvent(2), makeEvent(3)], 3, 1, []); // seq 2 is duplicate

    const state = useAgentStore.getState();
    expect(state.events.length).toBe(3);
    expect(state.events.map((e) => e.seq)).toEqual([1, 2, 3]);
  });
});

describe('agentStore gap detection', () => {
  beforeEach(() => {
    useAgentStore.setState({
      events: [],
      cursor: 0,
      gapDetected: false,
      eventsWarnings: [],
    });
  });

  it('does not detect gap when cursor is 0 (initial state)', () => {
    const { appendEvents } = useAgentStore.getState();

    // First fetch - droppedBeforeSeq is 5 but cursor was 0 (initial)
    appendEvents([makeEvent(5), makeEvent(6)], 6, 5, []);

    const state = useAgentStore.getState();
    expect(state.gapDetected).toBe(false);
  });

  it('detects gap when droppedBeforeSeq > previous cursor', () => {
    const { appendEvents } = useAgentStore.getState();

    // First fetch sets cursor to 5
    appendEvents([makeEvent(3), makeEvent(4), makeEvent(5)], 5, 1, []);
    expect(useAgentStore.getState().gapDetected).toBe(false);

    // Simulate ring buffer wrap: oldest is now 10, but cursor is 5
    appendEvents([makeEvent(10), makeEvent(11)], 11, 10, []);

    const state = useAgentStore.getState();
    expect(state.gapDetected).toBe(true);
  });

  it('gap detection only triggers once (no spam)', () => {
    const { appendEvents, clearGap } = useAgentStore.getState();

    // Set up cursor at 5
    appendEvents([makeEvent(5)], 5, 1, []);

    // First gap
    appendEvents([makeEvent(10)], 10, 10, []);
    expect(useAgentStore.getState().gapDetected).toBe(true);

    // Clear gap (user dismissed)
    clearGap();
    expect(useAgentStore.getState().gapDetected).toBe(false);

    // Another fetch with same gap condition should NOT re-trigger
    // because cursor is now 10, which >= droppedBeforeSeq (10)
    appendEvents([makeEvent(11)], 11, 10, []);
    expect(useAgentStore.getState().gapDetected).toBe(false);
  });

  it('clearEvents resets gap state', () => {
    const { appendEvents, clearEvents } = useAgentStore.getState();

    appendEvents([makeEvent(5)], 5, 1, []);
    appendEvents([makeEvent(10)], 10, 10, []); // triggers gap

    expect(useAgentStore.getState().gapDetected).toBe(true);

    clearEvents();

    const state = useAgentStore.getState();
    expect(state.cursor).toBe(0);
    expect(state.gapDetected).toBe(false);
    expect(state.events).toEqual([]);
  });
});

describe('agentStore event limit', () => {
  beforeEach(() => {
    useAgentStore.setState({
      events: [],
      cursor: 0,
      gapDetected: false,
      eventsWarnings: [],
    });
  });

  it('trims events to MAX_EVENTS (500)', () => {
    const { appendEvents } = useAgentStore.getState();

    // Create 600 events
    const events = Array.from({ length: 600 }, (_, i) => makeEvent(i + 1));
    appendEvents(events, 600, 1, []);

    const state = useAgentStore.getState();
    expect(state.events.length).toBe(500);

    // Should keep the latest 500 (101-600)
    expect(state.events[0].seq).toBe(101);
    expect(state.events[499].seq).toBe(600);
  });
});

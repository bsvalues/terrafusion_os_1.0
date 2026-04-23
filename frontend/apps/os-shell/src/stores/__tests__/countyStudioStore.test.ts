import { act } from 'react';
import { useCountyStudioStore, PEER_HISTORY_MAX } from '../countyStudioStore';

describe('countyStudioStore — activeCohortId', () => {
  beforeEach(() => {
    act(() => {
      useCountyStudioStore.getState().setActiveCohort(null);
    });
  });

  it('starts with activeCohortId null', () => {
    expect(useCountyStudioStore.getState().activeCohortId).toBeNull();
  });

  it('setActiveCohort stores the cohort id', () => {
    act(() => {
      useCountyStudioStore.getState().setActiveCohort('cohort-abc');
    });
    expect(useCountyStudioStore.getState().activeCohortId).toBe('cohort-abc');
  });

  it('setActiveCohort(null) clears the id', () => {
    act(() => {
      useCountyStudioStore.getState().setActiveCohort('cohort-abc');
      useCountyStudioStore.getState().setActiveCohort(null);
    });
    expect(useCountyStudioStore.getState().activeCohortId).toBeNull();
  });
});

// ── Chunk 5: peer presence + incoming projections ring buffers ──────────

describe('countyStudioStore — peerPresence ring buffer', () => {
  beforeEach(() => {
    act(() => {
      useCountyStudioStore.setState({ peerPresence: [], incomingProjections: [] });
    });
  });

  it('starts empty', () => {
    expect(useCountyStudioStore.getState().peerPresence).toEqual([]);
  });

  it('pushPeerPresence appends in order', () => {
    act(() => {
      useCountyStudioStore.getState().pushPeerPresence({
        type: 'presence:segment-hover', segmentId: 's1', actorId: 'a1', at: 1,
      });
      useCountyStudioStore.getState().pushPeerPresence({
        type: 'presence:segment-select', segmentId: 's2', actorId: 'a2', at: 2,
      });
    });
    const p = useCountyStudioStore.getState().peerPresence;
    expect(p).toHaveLength(2);
    expect(p[0].segmentId).toBe('s1');
    expect(p[1].segmentId).toBe('s2');
  });

  it('drops oldest entries when size exceeds PEER_HISTORY_MAX', () => {
    act(() => {
      for (let i = 0; i < PEER_HISTORY_MAX + 5; i++) {
        useCountyStudioStore.getState().pushPeerPresence({
          type: 'presence:segment-hover',
          segmentId: `seg-${i}`,
          actorId: 'a',
          at: i,
        });
      }
    });
    const p = useCountyStudioStore.getState().peerPresence;
    expect(p).toHaveLength(PEER_HISTORY_MAX);
    // Newest should still be present; oldest should have been dropped.
    expect(p[p.length - 1].segmentId).toBe(`seg-${PEER_HISTORY_MAX + 4}`);
    expect(p[0].segmentId).toBe('seg-5');
  });
});

describe('countyStudioStore — incomingProjections', () => {
  beforeEach(() => {
    act(() => {
      useCountyStudioStore.setState({ peerPresence: [], incomingProjections: [] });
    });
  });

  it('pushIncomingProjection appends', () => {
    act(() => {
      useCountyStudioStore.getState().pushIncomingProjection({
        type: 'metric-overlay', payload: { metric: 'cod' }, at: 1,
      });
    });
    expect(useCountyStudioStore.getState().incomingProjections).toHaveLength(1);
  });

  it('type=clear flushes the buffer', () => {
    act(() => {
      useCountyStudioStore.getState().pushIncomingProjection({ type: 'metric-overlay', payload: {}, at: 1 });
      useCountyStudioStore.getState().pushIncomingProjection({ type: 'clear', payload: {}, at: 2 });
    });
    expect(useCountyStudioStore.getState().incomingProjections).toEqual([]);
  });

  it('clearIncomingProjections empties the buffer', () => {
    act(() => {
      useCountyStudioStore.getState().pushIncomingProjection({ type: 'metric-overlay', payload: {}, at: 1 });
      useCountyStudioStore.getState().clearIncomingProjections();
    });
    expect(useCountyStudioStore.getState().incomingProjections).toEqual([]);
  });
});

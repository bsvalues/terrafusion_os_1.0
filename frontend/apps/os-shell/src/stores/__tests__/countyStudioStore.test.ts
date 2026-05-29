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

// ── Task B: drill lattice state machine ───────────────────────────────────

describe('countyStudioStore — drill lattice', () => {
  beforeEach(() => {
    act(() => {
      // Reset drill state + selections between tests.
      useCountyStudioStore.getState().drillToCounty();
      useCountyStudioStore.getState().selectSegment(null);
    });
  });

  it('starts at county level with no selection', () => {
    const s = useCountyStudioStore.getState();
    expect(s.drillLevel).toBe('county');
    expect(s.selectedCity).toBeNull();
    expect(s.selectedNeighborhood).toBeNull();
  });

  it('drillToCity advances level and sets selectedCity', () => {
    act(() => {
      useCountyStudioStore.getState().drillToCity('Kennewick');
    });
    const s = useCountyStudioStore.getState();
    expect(s.drillLevel).toBe('city');
    expect(s.selectedCity).toBe('Kennewick');
    expect(s.selectedNeighborhood).toBeNull();
  });

  it('drillToNeighborhood requires both city and code and sets both', () => {
    act(() => {
      useCountyStudioStore.getState().drillToNeighborhood('Richland', 'NBHD-R1');
    });
    const s = useCountyStudioStore.getState();
    expect(s.drillLevel).toBe('neighborhood');
    expect(s.selectedCity).toBe('Richland');
    expect(s.selectedNeighborhood).toBe('NBHD-R1');
  });

  it('drillToRiskSurfaceSegment preserves valuation context without selecting city', () => {
    act(() => {
      useCountyStudioStore.getState().drillToCity('Kennewick');
      useCountyStudioStore.getState().drillToRiskSurfaceSegment('NBHD-K1', 'seg-risk-1', 2);
    });
    const s = useCountyStudioStore.getState();
    expect(s.drillLevel).toBe('neighborhood');
    expect(s.selectedCity).toBeNull();
    expect(s.selectedNeighborhood).toBe('NBHD-K1');
    expect(s.selectedNeighborhoodRevalArea).toBe(2);
    expect(s.selectedSegmentId).toBe('seg-risk-1');
    expect(s.segmentSeverityFilter).toBe('all');
  });

  it('drillToCounty collapses all drill state (from neighborhood)', () => {
    act(() => {
      useCountyStudioStore.getState().drillToNeighborhood('Richland', 'NBHD-R1');
      useCountyStudioStore.getState().selectSegment('seg-1');
      useCountyStudioStore.getState().drillToCounty();
    });
    const s = useCountyStudioStore.getState();
    expect(s.drillLevel).toBe('county');
    expect(s.selectedCity).toBeNull();
    expect(s.selectedNeighborhood).toBeNull();
    expect(s.selectedSegmentId).toBeNull();
  });

  it('drilling up (city -> county) clears the stale neighborhood', () => {
    act(() => {
      useCountyStudioStore.getState().drillToNeighborhood('Kennewick', 'NBHD-K1');
      useCountyStudioStore.getState().drillToCity('Kennewick');
    });
    const s = useCountyStudioStore.getState();
    expect(s.drillLevel).toBe('city');
    expect(s.selectedCity).toBe('Kennewick');
    expect(s.selectedNeighborhood).toBeNull();
  });

  it('drilling to a different city resets the selection chain', () => {
    act(() => {
      useCountyStudioStore.getState().drillToNeighborhood('Kennewick', 'NBHD-K1');
      useCountyStudioStore.getState().drillToCity('Richland');
    });
    const s = useCountyStudioStore.getState();
    expect(s.selectedCity).toBe('Richland');
    expect(s.selectedNeighborhood).toBeNull();
  });

  it('drilling clears selectedSegmentId to prevent stale Inspector content', () => {
    act(() => {
      useCountyStudioStore.getState().selectSegment('seg-42');
      useCountyStudioStore.getState().drillToCity('Pasco');
    });
    expect(useCountyStudioStore.getState().selectedSegmentId).toBeNull();
  });

  it('setCityRollup / setNeighborhoodRollup replace the arrays', () => {
    act(() => {
      useCountyStudioStore.getState().setCityRollup([
        {
          city: 'Pasco', segmentCount: 3, parcelCount: 15,
          medianRatio: 0.95, cod: 4.2, prd: 1.01,
          exceptionCount: 0, exceptionRate: 0,
          worstSegmentName: null, worstSegmentMedianRatio: null,
          complianceStatus: 'IaaoCompliant',
        },
      ]);
      useCountyStudioStore.getState().setNeighborhoodRollup([
        {
          neighborhoodCode: 'NBHD-P1', neighborhoodName: 'NBHD-P1', city: 'Pasco',
          segmentCount: 2, parcelCount: 10, medianRatio: 0.95, cod: 4.2, prd: 1.01,
          stabilityScore: 85, riskScore: 22, exceptionCount: 0, exceptionRate: 0,
          complianceStatus: 'IaaoCompliant',
        },
      ]);
    });
    const s = useCountyStudioStore.getState();
    expect(s.cityRollup).toHaveLength(1);
    expect(s.neighborhoodRollup).toHaveLength(1);
    expect(s.cityRollup[0].city).toBe('Pasco');
  });
});

import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MorningBriefingStrip } from '../../components/dashboard/MorningBriefingStrip'
import type { FreshData } from '../../lib/freshData'
import type { SwarmStatus } from '../../hooks/useSwarmLive'
import type { PacsHealth } from '../../hooks/usePacsStatus'
import type { AppealsQueueSummary } from '../../hooks/useAppealsQueue'
import type { WorkloadSummary } from '../../hooks/useWorkloadSummary'

const unavailable = <T,>(overrides = {}): FreshData<T> => ({
  data: null, isLoading: false, error: 'err',
  lastUpdated: null, source: 'unavailable', isStale: false, ...overrides,
})

const polled = <T,>(data: T): FreshData<T> => ({
  data, isLoading: false, error: null,
  lastUpdated: Date.now(), source: 'polled', isStale: false,
})

const swarmData: SwarmStatus = { connectionState: 'connected', totalAgents: 2016, healthyAgents: 1980, overallStatus: 'degraded' }
const pacsData: PacsHealth = { contractValid: true, reachable: true, latencyMs: 120, lastProofUtc: null }
const appealsData: AppealsQueueSummary = { total: 42, openCount: 30, pendingHearingCount: 8, closedThisCycleCount: 4 }
const workloadData: WorkloadSummary = { totalParcels: 89247, parcelsReviewed: 12000, parcelsRemaining: 77247, appraisersActive: 8, utilizationPct: 72 }

describe('MorningBriefingStrip', () => {
  it('renders four "Unavailable" chips when all domains are unavailable', () => {
    render(
      <MorningBriefingStrip
        swarm={unavailable<SwarmStatus>()} pacs={unavailable<PacsHealth>()}
        appeals={unavailable<AppealsQueueSummary>()} workload={unavailable<WorkloadSummary>()}
      />
    )
    const chips = screen.getAllByText('Unavailable')
    expect(chips).toHaveLength(4)
  })

  it('renders data for all four cards when polled and fresh', () => {
    render(
      <MorningBriefingStrip
        swarm={polled(swarmData)} pacs={polled(pacsData)}
        appeals={polled(appealsData)} workload={polled(workloadData)}
      />
    )
    expect(screen.getByText('connected', { exact: false })).toBeInTheDocument()
    expect(screen.getByText('Contract valid')).toBeInTheDocument()
    expect(screen.getByText('30')).toBeInTheDocument()  // openCount
    expect(screen.getByText('13%')).toBeInTheDocument() // workload pct (12000/89247)
  })

  it('shows "Last known" label only on swarm card when swarm is fallback+stale', () => {
    const staleFallback: FreshData<SwarmStatus> = {
      data: swarmData, isLoading: false, error: 'disconnected',
      lastUpdated: null, source: 'fallback', isStale: true,
    }
    render(
      <MorningBriefingStrip
        swarm={staleFallback} pacs={polled(pacsData)}
        appeals={polled(appealsData)} workload={polled(workloadData)}
      />
    )
    expect(screen.getByText('Last known')).toBeInTheDocument()
    expect(screen.queryByText('Unavailable')).toBeNull()
    expect(screen.queryByText('Stale')).toBeNull()  // row 3 wins over row 4 when both could apply
  })

  it('shows "Live" badge when swarm is source:live, connected, not stale', () => {
    const liveSwarm: FreshData<SwarmStatus> = {
      data: swarmData, isLoading: false, error: null,
      lastUpdated: Date.now(), source: 'live', isStale: false,
    }
    render(
      <MorningBriefingStrip
        swarm={liveSwarm} pacs={polled(pacsData)}
        appeals={polled(appealsData)} workload={polled(workloadData)}
      />
    )
    expect(screen.getByText('Live')).toBeInTheDocument()
  })

  it('does not show "Live" badge when swarm is polled (not SignalR)', () => {
    render(
      <MorningBriefingStrip
        swarm={polled(swarmData)} pacs={polled(pacsData)}
        appeals={polled(appealsData)} workload={polled(workloadData)}
      />
    )
    expect(screen.queryByText('Live')).toBeNull()
  })
})

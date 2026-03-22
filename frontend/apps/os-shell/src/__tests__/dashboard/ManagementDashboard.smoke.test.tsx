import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ManagementDashboard } from '../../pages/dais/ManagementDashboard'

// Mock all four hooks at module boundary — no real fetching
vi.mock('../../hooks/usePacsStatus', () => ({
  usePacsStatus: () => ({
    data: null, isLoading: false, error: null,
    lastUpdated: null, source: 'unavailable', isStale: false,
  }),
}))
vi.mock('../../hooks/useAppealsQueue', () => ({
  useAppealsQueue: () => ({
    data: null, isLoading: false, error: null,
    lastUpdated: null, source: 'unavailable', isStale: false,
  }),
}))
vi.mock('../../hooks/useWorkloadSummary', () => ({
  useWorkloadSummary: () => ({
    data: null, isLoading: false, error: null,
    lastUpdated: null, source: 'unavailable', isStale: false,
  }),
}))
vi.mock('../../hooks/useSwarmLive', () => ({
  useSwarmLive: () => ({
    data: null, isLoading: false, error: null,
    lastUpdated: null, source: 'unavailable', isStale: false,
  }),
}))

describe('ManagementDashboard smoke test', () => {
  it('renders without crashing and shows the morning briefing strip', () => {
    render(<ManagementDashboard onNavigate={vi.fn()} />)
    expect(screen.getByTestId('morning-briefing-strip')).toBeInTheDocument()
  })

  it('shows unavailable chips for all four cards when all hooks return unavailable', () => {
    render(<ManagementDashboard onNavigate={vi.fn()} />)
    const chips = screen.getAllByText('Unavailable')
    expect(chips).toHaveLength(4)
  })

  it('does not import or render AISwarmDashboard fixtures', () => {
    render(<ManagementDashboard onNavigate={vi.fn()} />)
    // AISwarmDashboard shows "50,000" agents in its fixture — must not appear
    expect(screen.queryByText(/50,000/)).toBeNull()
    expect(screen.queryByText(/quantum coherence/i)).toBeNull()
  })
})

import { render, screen } from '../../test/test-utils'
import { MetricCard } from '../MetricCard'
import { Brain } from 'lucide-react'

describe('MetricCard', () => {
  it('renders metric value and title correctly', () => {
    render(
      <MetricCard
        title="Active Agents"
        value="49,823"
        subtitle="out of 50,000"
        icon={Brain}
        color="cyan"
      />
    )

    expect(screen.getByText('Active Agents')).toBeInTheDocument()
    expect(screen.getByText('49,823')).toBeInTheDocument()
    expect(screen.getByText('out of 50,000')).toBeInTheDocument()
  })

  it('displays positive trend indicator when trend is up', () => {
    render(
      <MetricCard
        title="Swarm Coherence"
        value="98.7%"
        icon={Brain}
        color="green"
        trend={{ value: 2.3, direction: 'up' }}
      />
    )

    expect(screen.getByText('+2.3%')).toBeInTheDocument()
  })

  it('displays negative trend indicator when trend is down', () => {
    render(
      <MetricCard
        title="Processing Time"
        value="127ms"
        icon={Brain}
        color="yellow"
        trend={{ value: 5.1, direction: 'down' }}
      />
    )

    expect(screen.getByText('-5.1%')).toBeInTheDocument()
  })

  it('applies correct color variant styling', () => {
    const { container } = render(
      <MetricCard
        title="Test Metric"
        value="123"
        icon={Brain}
        color="cyan"
      />
    )

    expect(container.querySelector('.bg-cyan-500\\/10')).toBeInTheDocument()
  })
})

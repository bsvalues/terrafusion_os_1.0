import { useQuantumMetrics, useSwarmStatus, useEmergentPatterns } from '../hooks/useQuantumMetrics'
import { MetricCard } from '../components/MetricCard'
import { SwarmCoherenceGauge } from '../components/SwarmCoherenceGauge'
import { EmergentPatternsVisualizer } from '../components/EmergentPatternsVisualizer'
import { PerformanceTimeline } from '../components/PerformanceTimeline'
import { AgentHierarchyView } from '../components/AgentHierarchyView'
import { LoadingState } from '../components/LoadingState'
import { Brain, Zap, Users, TrendingUp, Network, Activity, RefreshCw, AlertCircle } from 'lucide-react'
import { format } from '../lib/utils'

export function QuantumDashboard() {
  const { metrics, isLoading, error, refetch } = useQuantumMetrics()
  const { data: swarmStatus } = useSwarmStatus()
  const { data: emergentPatterns } = useEmergentPatterns()

  if (isLoading) {
    return <LoadingState message="Initializing Quantum AI Systems..." fullscreen />
  }

  if (error || !metrics) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="glass rounded-lg p-8 max-w-lg w-full text-center">
          <div className="p-4 rounded-full bg-red-500/10 inline-flex mb-4">
            <AlertCircle className="w-12 h-12 text-red-400" />
          </div>
          <h2 className="text-2xl font-bold text-red-400 mb-2">Backend Connection Error</h2>
          <p className="text-muted-foreground mb-6">
            Unable to connect to TrueAutomation/PACS backend API.
            <br />
            Ensure the backend is running on <code className="text-quantum-primary">http://localhost:5000</code>
          </p>
          <button
            onClick={() => refetch()}
            className="flex items-center gap-2 px-6 py-3 rounded-lg bg-quantum-primary/20 text-quantum-primary hover:bg-quantum-primary/30 transition-all neural-glow mx-auto"
          >
            <RefreshCw className="w-4 h-4" />
            Retry Connection
          </button>
          {error && (
            <p className="text-xs text-muted-foreground mt-4">
              Error: {error instanceof Error ? error.message : 'Unknown error'}
            </p>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold mb-2 bg-clip-text text-transparent quantum-gradient">
          Quantum AI Command Center
        </h1>
        <p className="text-muted-foreground">
          MIT PhD-Level Analytics Platform • Real-Time Swarm Intelligence Monitoring
        </p>
      </div>

      {/* Key Performance Indicators */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Active Agents"
          value={format.largeNumber(metrics?.activeAgents || 0)}
          subtitle={`of ${format.largeNumber(metrics?.totalAgents || 50000)}`}
          icon={Users}
          trend={metrics?.activeAgents && metrics.totalAgents
            ? ((metrics.activeAgents / metrics.totalAgents) * 100)
            : 0}
          color="cyan"
        />

        <MetricCard
          title="Swarm Coherence"
          value={format.percentage(metrics?.swarmCoherence || 0)}
          subtitle="Collective Sync"
          icon={Network}
          trend={(metrics?.swarmCoherence || 0) * 100}
          color="blue"
        />

        <MetricCard
          title="Collective Intelligence"
          value={format.percentage(metrics?.collectiveIntelligenceScore || 0)}
          subtitle="Emergent Capability"
          icon={Brain}
          trend={(metrics?.collectiveIntelligenceScore || 0) * 100}
          color="green"
        />

        <MetricCard
          title="Quantum Advantage"
          value={`${format.largeNumber(metrics?.quantumAdvantage || 0)}x`}
          subtitle="Performance Multiplier"
          icon={Zap}
          trend={Math.min((metrics?.quantumAdvantage || 0) / 10, 100)}
          color="yellow"
        />
      </div>

      {/* Swarm Status and Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Swarm Coherence Visualization */}
        <div className="glass rounded-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <Network className="w-5 h-5 text-quantum-primary" />
              Swarm Coherence Matrix
            </h2>
            <span className="text-sm text-muted-foreground">
              Live Updates
            </span>
          </div>
          <SwarmCoherenceGauge value={metrics?.swarmCoherence || 0} />
        </div>

        {/* Agent Hierarchy */}
        <div className="glass rounded-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <Activity className="w-5 h-5 text-quantum-secondary" />
              Agent Hierarchy Distribution
            </h2>
          </div>
          <AgentHierarchyView />
        </div>
      </div>

      {/* Performance and Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Performance Timeline */}
        <div className="lg:col-span-2 glass rounded-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-quantum-accent" />
              Performance Timeline
            </h2>
            <select className="glass text-sm rounded-md px-3 py-1.5 border-white/10">
              <option>Last Hour</option>
              <option>Last 24 Hours</option>
              <option>Last 7 Days</option>
            </select>
          </div>
          <PerformanceTimeline />
        </div>

        {/* System Metrics */}
        <div className="glass rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4">System Metrics</h3>
          <div className="space-y-4">
            <MetricRow
              label="Total Requests"
              value={format.largeNumber(metrics?.totalRequests || 0)}
            />
            <MetricRow
              label="Success Rate"
              value={format.percentage(
                (metrics?.successfulRequests || 0) / Math.max(metrics?.totalRequests || 1, 1)
              )}
            />
            <MetricRow
              label="Avg Processing Time"
              value={format.duration(metrics?.averageProcessingTime || 0)}
            />
            <MetricRow
              label="Avg Confidence"
              value={format.percentage(metrics?.averageConfidence || 0)}
            />
            <MetricRow
              label="Overall Accuracy"
              value={format.percentage(metrics?.overallAccuracy || 0)}
            />
            <MetricRow
              label="Emergent Capabilities"
              value={metrics?.emergentCapabilities?.toString() || '0'}
            />
            <MetricRow
              label="Ethical Compliance"
              value={format.percentage(metrics?.ethicalComplianceScore || 0)}
            />
          </div>
        </div>
      </div>

      {/* Emergent Patterns */}
      <div className="glass rounded-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Brain className="w-5 h-5 text-quantum-primary" />
            Emergent Intelligence Patterns
          </h2>
          <span className="text-sm text-quantum-primary">
            {emergentPatterns?.patterns?.length || 0} Active Patterns
          </span>
        </div>
        <EmergentPatternsVisualizer patterns={emergentPatterns?.patterns || []} />
      </div>
    </div>
  )
}

function MetricRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-semibold text-quantum-primary">{value}</span>
    </div>
  )
}

import { useState } from 'react'
import { Play, Pause, Settings, Zap, Brain, Network, Activity } from 'lucide-react'
import { cn, format } from '../lib/utils'
import { AgentTier } from '../types/quantum-ai'

interface AgentTierControl {
  tier: AgentTier
  count: number
  active: number
  color: string
  description: string
}

const agentTiers: AgentTierControl[] = [
  { tier: AgentTier.AICouncil, count: 20, active: 20, color: 'bg-red-500', description: 'Supreme Strategic Intelligence' },
  { tier: AgentTier.QuantumCommanders, count: 200, active: 198, color: 'bg-yellow-500', description: 'Enhanced Domain Leadership' },
  { tier: AgentTier.DomainGenerals, count: 1000, active: 987, color: 'bg-green-500', description: 'Specialized Mastery' },
  { tier: AgentTier.ProcessCoordinators, count: 3000, active: 2945, color: 'bg-cyan-500', description: 'Workflow Optimization' },
  { tier: AgentTier.ExpertSpecialists, count: 10000, active: 9823, color: 'bg-blue-500', description: 'Deep Knowledge Systems' },
  { tier: AgentTier.AdaptiveExecutors, count: 20000, active: 19654, color: 'bg-indigo-500', description: 'Dynamic Task Completion' },
  { tier: AgentTier.MicroOptimizers, count: 15780, active: 15296, color: 'bg-purple-500', description: 'Granular Perfection' },
]

export function AIAgentOrchestrator() {
  const [selectedTier, setSelectedTier] = useState<AgentTier | null>(null)
  const [isRunning, setIsRunning] = useState(true)

  const totalAgents = agentTiers.reduce((sum, tier) => sum + tier.count, 0)
  const activeAgents = agentTiers.reduce((sum, tier) => sum + tier.active, 0)

  return (
    <div className="space-y-6">
      {/* Header Controls */}
      <div className="glass rounded-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold mb-2">AI Agent Orchestrator</h2>
            <p className="text-muted-foreground">
              Control and monitor 50,000 hierarchical AI agents
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsRunning(!isRunning)}
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all',
                isRunning
                  ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30'
                  : 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
              )}
            >
              {isRunning ? (
                <>
                  <Pause className="w-4 h-4" />
                  Pause Swarm
                </>
              ) : (
                <>
                  <Play className="w-4 h-4" />
                  Resume Swarm
                </>
              )}
            </button>
            <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-quantum-primary/20 text-quantum-primary hover:bg-quantum-primary/30 transition-all">
              <Settings className="w-4 h-4" />
              Configure
            </button>
          </div>
        </div>

        {/* Global Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="glass rounded-lg p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/10">
                <Network className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Total Agents</p>
                <p className="text-xl font-bold">{format.largeNumber(totalAgents)}</p>
              </div>
            </div>
          </div>

          <div className="glass rounded-lg p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-500/10">
                <Activity className="w-5 h-5 text-green-400" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Active Agents</p>
                <p className="text-xl font-bold">{format.largeNumber(activeAgents)}</p>
              </div>
            </div>
          </div>

          <div className="glass rounded-lg p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-cyan-500/10">
                <Brain className="w-5 h-5 text-cyan-400" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Utilization</p>
                <p className="text-xl font-bold">
                  {format.percentage(activeAgents / totalAgents)}
                </p>
              </div>
            </div>
          </div>

          <div className="glass rounded-lg p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-yellow-500/10">
                <Zap className="w-5 h-5 text-yellow-400" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Throughput</p>
                <p className="text-xl font-bold">47.2K/s</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Agent Tier Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {agentTiers.map((tier) => (
          <div
            key={tier.tier}
            className={cn(
              'glass rounded-lg p-6 transition-all duration-200 cursor-pointer',
              selectedTier === tier.tier && 'ring-2 ring-quantum-primary'
            )}
            onClick={() => setSelectedTier(tier.tier)}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className={cn('w-3 h-3 rounded-full', tier.color)} />
                <div>
                  <h3 className="font-semibold">{tier.tier.replace(/([A-Z])/g, ' $1').trim()}</h3>
                  <p className="text-xs text-muted-foreground">{tier.description}</p>
                </div>
              </div>
              <button className="glass text-xs px-3 py-1.5 rounded-md hover:bg-white/10 transition-colors">
                Configure
              </button>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Active / Total</span>
                <span className="font-semibold">
                  {tier.active.toLocaleString()} / {tier.count.toLocaleString()}
                </span>
              </div>

              <div className="w-full bg-white/5 rounded-full h-2">
                <div
                  className={cn('h-full rounded-full transition-all duration-500', tier.color)}
                  style={{ width: `${(tier.active / tier.count) * 100}%` }}
                />
              </div>

              <div className="grid grid-cols-3 gap-2 text-xs">
                <div>
                  <p className="text-muted-foreground">Capacity</p>
                  <p className="font-semibold">{format.percentage(tier.active / tier.count)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Avg Response</p>
                  <p className="font-semibold">{(Math.random() * 20 + 10).toFixed(1)}ms</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Success Rate</p>
                  <p className="font-semibold">{(96 + Math.random() * 3).toFixed(1)}%</p>
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button className="flex-1 glass text-xs py-2 rounded-md hover:bg-white/10 transition-colors">
                  Scale Up
                </button>
                <button className="flex-1 glass text-xs py-2 rounded-md hover:bg-white/10 transition-colors">
                  Fine-Tune
                </button>
                <button className="flex-1 glass text-xs py-2 rounded-md hover:bg-white/10 transition-colors">
                  Monitor
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Advanced Configuration Panel */}
      {selectedTier && (
        <div className="glass rounded-lg p-6">
          <h3 className="text-xl font-semibold mb-4">
            Advanced Configuration: {selectedTier.replace(/([A-Z])/g, ' $1').trim()}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Learning Rate</label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  defaultValue="75"
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-muted-foreground mt-1">
                  <span>Conservative</span>
                  <span>Aggressive</span>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Exploration Rate</label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  defaultValue="30"
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-muted-foreground mt-1">
                  <span>Exploit</span>
                  <span>Explore</span>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Temperature</label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  defaultValue="50"
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-muted-foreground mt-1">
                  <span>Deterministic</span>
                  <span>Random</span>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Specialization Areas</label>
                <div className="flex flex-wrap gap-2">
                  {['Property Assessment', 'Legal Compliance', 'Financial Analysis', 'Data Processing', 'Pattern Recognition'].map((area) => (
                    <button
                      key={area}
                      className="glass text-xs px-3 py-1.5 rounded-md hover:bg-quantum-primary/20 transition-colors"
                    >
                      {area}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Performance Metrics</label>
                <div className="space-y-2">
                  <MetricBar label="Accuracy" value={0.97} />
                  <MetricBar label="Speed" value={0.89} />
                  <MetricBar label="Efficiency" value={0.94} />
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button className="flex-1 bg-quantum-primary/20 text-quantum-primary px-4 py-2 rounded-lg hover:bg-quantum-primary/30 transition-all">
                  Apply Changes
                </button>
                <button className="flex-1 glass px-4 py-2 rounded-lg hover:bg-white/10 transition-all">
                  Reset to Default
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function MetricBar({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="flex justify-between text-xs mb-1">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-semibold">{format.percentage(value)}</span>
      </div>
      <div className="w-full bg-white/5 rounded-full h-1.5">
        <div
          className="h-full rounded-full bg-gradient-to-r from-quantum-primary to-quantum-secondary transition-all duration-500"
          style={{ width: `${value * 100}%` }}
        />
      </div>
    </div>
  )
}

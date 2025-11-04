import { EmergentPattern } from '../types/quantum-ai'
import { format } from '../lib/utils'
import { Brain, TrendingUp, Zap, Network } from 'lucide-react'

interface EmergentPatternsVisualizerProps {
  patterns: EmergentPattern[]
}

const patternTypeIcons = {
  Coordination: Network,
  Optimization: Zap,
  Learning: Brain,
  Emergence: Brain,
  Trend: TrendingUp,
}

const patternTypeColors = {
  Coordination: 'text-blue-400',
  Optimization: 'text-yellow-400',
  Learning: 'text-green-400',
  Emergence: 'text-purple-400',
  Trend: 'text-cyan-400',
}

export function EmergentPatternsVisualizer({ patterns }: EmergentPatternsVisualizerProps) {
  if (!patterns || patterns.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <Brain className="w-12 h-12 mx-auto mb-4 opacity-50" />
        <p>No emergent patterns detected yet</p>
        <p className="text-sm mt-2">The AI swarm is continuously learning...</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {patterns.map((pattern) => {
        const Icon = patternTypeIcons[pattern.type] || Brain
        const colorClass = patternTypeColors[pattern.type] || 'text-cyan-400'

        return (
          <div
            key={pattern.patternId}
            className="glass rounded-lg p-4 hover:bg-white/5 transition-all duration-200"
          >
            <div className="flex items-start gap-3 mb-3">
              <div className={`p-2 rounded-lg bg-white/5 ${colorClass}`}>
                <Icon className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <h4 className="text-sm font-semibold">{pattern.type}</h4>
                  <span className={`text-xs px-2 py-0.5 rounded ${
                    pattern.isBeneficial
                      ? 'bg-green-500/20 text-green-400'
                      : 'bg-yellow-500/20 text-yellow-400'
                  }`}>
                    {pattern.isBeneficial ? 'Beneficial' : 'Neutral'}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground line-clamp-2">
                  {pattern.description}
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Significance</span>
                <span className="font-medium text-quantum-primary">
                  {format.percentage(pattern.significanceScore)}
                </span>
              </div>

              <div className="w-full bg-white/5 rounded-full h-1.5">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-quantum-primary to-quantum-secondary transition-all duration-500"
                  style={{ width: `${pattern.significanceScore * 100}%` }}
                />
              </div>

              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Occurrences</span>
                <span className="font-medium">{pattern.occurrences || 0}</span>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

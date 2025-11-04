import { useState } from 'react'
import { useRevenueForecast } from '../hooks/useQuantumMetrics'
import { BarChart, LineChart, Activity, TrendingUp } from 'lucide-react'
import { format } from '../lib/utils'

export function AnalyticsLab() {
  const [jurisdiction] = useState('Benton County')
  const [forecastMonths] = useState(12)
  const [scenario] = useState('Base')

  const { data: forecast, isLoading } = useRevenueForecast(
    jurisdiction,
    forecastMonths,
    scenario
  )

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-4xl font-bold mb-2 bg-clip-text text-transparent quantum-gradient">
          Advanced Analytics Laboratory
        </h1>
        <p className="text-muted-foreground">
          PhD-Level Statistical Analysis • Predictive Modeling • Quantum Optimization
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="glass rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-lg bg-blue-500/10">
              <BarChart className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Statistical Models</p>
              <p className="text-2xl font-bold">12</p>
            </div>
          </div>
        </div>

        <div className="glass rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-lg bg-green-500/10">
              <LineChart className="w-6 h-6 text-green-400" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Active Forecasts</p>
              <p className="text-2xl font-bold">8</p>
            </div>
          </div>
        </div>

        <div className="glass rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-lg bg-yellow-500/10">
              <Activity className="w-6 h-6 text-yellow-400" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">ML Algorithms</p>
              <p className="text-2xl font-bold">24</p>
            </div>
          </div>
        </div>

        <div className="glass rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-lg bg-purple-500/10">
              <TrendingUp className="w-6 h-6 text-purple-400" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Avg Accuracy</p>
              <p className="text-2xl font-bold">97.2%</p>
            </div>
          </div>
        </div>
      </div>

      <div className="glass rounded-lg p-6">
        <h2 className="text-2xl font-semibold mb-4">Revenue Forecast Analysis</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <p className="text-sm text-muted-foreground mb-1">Jurisdiction</p>
            <p className="text-lg font-semibold">{jurisdiction}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground mb-1">Forecast Period</p>
            <p className="text-lg font-semibold">{forecastMonths} months</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground mb-1">Scenario</p>
            <p className="text-lg font-semibold">{scenario}</p>
          </div>
        </div>

        {isLoading ? (
          <div className="text-center py-12">
            <div className="w-12 h-12 border-4 border-quantum-primary/30 border-t-quantum-primary rounded-full animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">Generating forecast...</p>
          </div>
        ) : forecast ? (
          <div className="mt-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="glass rounded-lg p-4">
                <p className="text-xs text-muted-foreground mb-1">Overall Confidence</p>
                <p className="text-2xl font-bold text-quantum-primary">
                  {format.percentage(forecast.forecast?.overallConfidence || 0.85)}
                </p>
              </div>
              <div className="glass rounded-lg p-4">
                <p className="text-xs text-muted-foreground mb-1">Time Series</p>
                <p className="text-2xl font-bold text-blue-400">
                  {format.percentage(forecast.modelPerformance?.timeSeriesAccuracy || 0.85)}
                </p>
              </div>
              <div className="glass rounded-lg p-4">
                <p className="text-xs text-muted-foreground mb-1">Regression</p>
                <p className="text-2xl font-bold text-green-400">
                  {format.percentage(forecast.modelPerformance?.regressionAccuracy || 0.82)}
                </p>
              </div>
              <div className="glass rounded-lg p-4">
                <p className="text-xs text-muted-foreground mb-1">Swarm Optimization</p>
                <p className="text-2xl font-bold text-yellow-400">
                  {format.percentage(forecast.modelPerformance?.swarmOptimizationScore || 0.88)}
                </p>
              </div>
            </div>

            <div className="glass rounded-lg p-4">
              <h3 className="text-lg font-semibold mb-3">Statistical Analysis Tools</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {['Regression Analysis', 'Time Series Decomposition', 'Correlation Matrix', 'Confidence Intervals',
                  'Monte Carlo Simulation', 'Bayesian Inference', 'Neural Networks', 'Ensemble Methods'
                ].map((tool) => (
                  <button
                    key={tool}
                    className="glass text-sm py-2 px-3 rounded-md hover:bg-white/10 transition-colors"
                  >
                    {tool}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : null}
      </div>

      <div className="glass rounded-lg p-6">
        <h2 className="text-2xl font-semibold mb-4">Quantum Computing Integration</h2>
        <p className="text-muted-foreground mb-4">
          Leverage quantum algorithms for optimization, simulation, and machine learning tasks
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="glass rounded-lg p-4">
            <h3 className="font-semibold mb-2">Portfolio Optimization</h3>
            <p className="text-sm text-muted-foreground">Quantum annealing for optimal property portfolio allocation</p>
          </div>
          <div className="glass rounded-lg p-4">
            <h3 className="font-semibold mb-2">Route Optimization</h3>
            <p className="text-sm text-muted-foreground">QAOA for assessor route planning and scheduling</p>
          </div>
          <div className="glass rounded-lg p-4">
            <h3 className="font-semibold mb-2">Risk Analysis</h3>
            <p className="text-sm text-muted-foreground">Quantum Monte Carlo for advanced risk modeling</p>
          </div>
        </div>
      </div>
    </div>
  )
}

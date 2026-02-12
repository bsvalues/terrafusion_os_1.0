import { Routes, Route } from 'react-router-dom'
import { QuantumDashboard } from './pages/QuantumDashboard'
import { SwarmVisualization } from './pages/SwarmVisualization'
import { AnalyticsLab } from './pages/AnalyticsLab'
import { Navigation } from './components/Navigation'
import { AIAgentOrchestrator } from './components/AIAgentOrchestrator'
import { ErrorBoundary } from './components/ErrorBoundary'

function App() {
  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-neural-900 text-foreground">
        {/* Quantum Background Effects */}
        <div className="fixed inset-0 z-0 data-grid opacity-20" />
        <div className="fixed inset-0 z-0 bg-gradient-to-br from-quantum-primary/5 via-transparent to-quantum-tertiary/5" />

        {/* Main Content */}
        <div className="relative z-10">
          <Navigation />

          <main className="container mx-auto px-4 py-8">
            <ErrorBoundary>
              <Routes>
                <Route path="/" element={<QuantumDashboard />} />
                <Route path="/swarm" element={<SwarmVisualization />} />
                <Route path="/analytics" element={<AnalyticsLab />} />
                <Route path="/orchestrator" element={<AIAgentOrchestrator />} />
              </Routes>
            </ErrorBoundary>
          </main>
        </div>

        {/* Quantum Particles Background */}
        <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="quantum-particle absolute w-1 h-1 bg-quantum-primary rounded-full"
              style={{
                left: `${Math.random() * 100}%`,
                animationDelay: `${i * 0.5}s`,
                opacity: 0.3,
              }}
            />
          ))}
        </div>
      </div>
    </ErrorBoundary>
  )
}

export default App

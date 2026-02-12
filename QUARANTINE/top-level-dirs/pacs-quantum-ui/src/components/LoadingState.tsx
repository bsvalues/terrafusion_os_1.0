import { Brain, Loader2 } from 'lucide-react'

interface LoadingStateProps {
  message?: string
  fullscreen?: boolean
}

/**
 * Production-grade loading state component
 * Provides visual feedback during data fetching and processing
 */
export function LoadingState({
  message = 'Initializing Quantum AI Systems...',
  fullscreen = false
}: LoadingStateProps) {
  const content = (
    <div className="flex flex-col items-center justify-center gap-6">
      <div className="relative">
        {/* Animated quantum core */}
        <div className="absolute inset-0 rounded-full bg-quantum-primary/20 blur-xl animate-pulse" />
        <div className="relative w-20 h-20 rounded-full bg-gradient-to-br from-quantum-primary/30 to-quantum-secondary/30 flex items-center justify-center neural-glow">
          <Brain className="w-10 h-10 text-quantum-primary animate-pulse" />
        </div>
      </div>

      <div className="text-center">
        <div className="flex items-center gap-2 justify-center mb-2">
          <Loader2 className="w-5 h-5 text-quantum-primary animate-spin" />
          <h3 className="text-lg font-semibold text-quantum-primary">
            {message}
          </h3>
        </div>
        <p className="text-sm text-muted-foreground">
          Coordinating 50,000 AI agents across hierarchical tiers...
        </p>
      </div>

      {/* Progress bar simulation */}
      <div className="w-64 h-1 bg-white/5 rounded-full overflow-hidden">
        <div className="h-full bg-gradient-to-r from-quantum-primary to-quantum-secondary animate-[neural-flow_2s_ease-in-out_infinite]" />
      </div>

      {/* Quantum particles */}
      <div className="flex gap-2">
        {[...Array(5)].map((_, i) => (
          <div
            key={i}
            className="w-2 h-2 rounded-full bg-quantum-primary/60"
            style={{
              animation: `quantum-pulse 1.5s ease-in-out infinite`,
              animationDelay: `${i * 0.2}s`,
            }}
          />
        ))}
      </div>
    </div>
  )

  if (fullscreen) {
    return (
      <div className="min-h-screen bg-neural-900 flex items-center justify-center">
        <div className="fixed inset-0 z-0 data-grid opacity-20" />
        <div className="relative z-10">
          {content}
        </div>
      </div>
    )
  }

  return (
    <div className="glass rounded-lg p-12 flex items-center justify-center">
      {content}
    </div>
  )
}

/**
 * Minimal inline loading spinner for smaller components
 */
export function LoadingSpinner({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
  }

  return (
    <Loader2 className={`${sizeClasses[size]} text-quantum-primary animate-spin`} />
  )
}

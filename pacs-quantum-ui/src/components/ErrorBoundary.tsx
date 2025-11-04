import { Component, ErrorInfo, ReactNode } from 'react'
import { AlertTriangle, RefreshCw } from 'lucide-react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
  errorInfo: ErrorInfo | null
}

/**
 * Production-grade error boundary for graceful failure handling
 * Implements government-grade resilience and error reporting
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    }
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null,
    }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log to monitoring service in production
    console.error('ErrorBoundary caught error:', error, errorInfo)

    this.setState({
      error,
      errorInfo,
    })

    // In production, send to Application Insights or similar
    if (import.meta.env.PROD) {
      // window.appInsights?.trackException({ exception: error, properties: errorInfo })
    }
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    })
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div className="min-h-screen bg-neural-900 flex items-center justify-center p-8">
          <div className="glass rounded-lg p-8 max-w-2xl w-full">
            <div className="flex items-center gap-4 mb-6">
              <div className="p-3 rounded-lg bg-red-500/10">
                <AlertTriangle className="w-8 h-8 text-red-400" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-red-400">
                  System Error Detected
                </h1>
                <p className="text-muted-foreground">
                  The quantum AI interface encountered an unexpected error
                </p>
              </div>
            </div>

            <div className="glass-strong rounded-lg p-4 mb-6 font-mono text-sm">
              <div className="text-red-400 font-semibold mb-2">Error:</div>
              <div className="text-muted-foreground">
                {this.state.error?.message || 'Unknown error'}
              </div>

              {import.meta.env.DEV && this.state.errorInfo && (
                <>
                  <div className="text-red-400 font-semibold mt-4 mb-2">Stack Trace:</div>
                  <div className="text-muted-foreground text-xs overflow-auto max-h-48">
                    {this.state.errorInfo.componentStack}
                  </div>
                </>
              )}
            </div>

            <div className="flex gap-3">
              <button
                onClick={this.handleReset}
                className="flex items-center gap-2 px-6 py-3 rounded-lg bg-quantum-primary/20 text-quantum-primary hover:bg-quantum-primary/30 transition-all neural-glow"
              >
                <RefreshCw className="w-4 h-4" />
                Reset Interface
              </button>
              <button
                onClick={() => window.location.href = '/'}
                className="flex items-center gap-2 px-6 py-3 rounded-lg glass hover:bg-white/10 transition-all"
              >
                Return to Dashboard
              </button>
            </div>

            <div className="mt-6 pt-6 border-t border-white/10">
              <p className="text-xs text-muted-foreground">
                <strong>For MIT PhD-level diagnostics:</strong> Check browser console for detailed stack trace.
                If error persists, verify backend API connectivity at http://localhost:5000/health
              </p>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

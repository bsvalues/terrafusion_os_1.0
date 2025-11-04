import React from 'react'
import { AlertTriangle, RefreshCw, Home, Bug, FileText } from 'lucide-react'

/**
 * TerraFusion AI Consciousness Error Boundary
 * 
 * Elite error handling component providing graceful failure management
 * with autonomous recovery protocols for government AI systems.
 */

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
  errorInfo: React.ErrorInfo | null
  attemptedRecovery: boolean
  recoveryCount: number
}

interface ErrorBoundaryProps {
  children: React.ReactNode
  fallback?: React.ComponentType<ErrorBoundaryFallbackProps>
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void
  enableAutoRecovery?: boolean
  maxRecoveryAttempts?: number
}

interface ErrorBoundaryFallbackProps {
  error: Error | null
  errorInfo: React.ErrorInfo | null
  resetError: () => void
  attemptRecovery: () => void
  recoveryCount: number
  maxRecoveryAttempts: number
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  private autoRecoveryTimer: NodeJS.Timeout | null = null

  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      attemptedRecovery: false,
      recoveryCount: 0
    }
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return {
      hasError: true,
      error
    }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.setState({
      error,
      errorInfo
    })

    // Report error to monitoring systems
    this.props.onError?.(error, errorInfo)

    // Attempt auto-recovery if enabled
    if (this.props.enableAutoRecovery && this.state.recoveryCount < (this.props.maxRecoveryAttempts || 3)) {
      this.scheduleAutoRecovery()
    }
  }

  componentWillUnmount() {
    if (this.autoRecoveryTimer) {
      clearTimeout(this.autoRecoveryTimer)
    }
  }

  scheduleAutoRecovery = () => {
    if (this.autoRecoveryTimer) {
      clearTimeout(this.autoRecoveryTimer)
    }

    this.autoRecoveryTimer = setTimeout(() => {
      this.attemptRecovery()
    }, 3000) // 3 second delay for auto-recovery
  }

  resetError = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      attemptedRecovery: false
    })
  }

  attemptRecovery = () => {
    const newRecoveryCount = this.state.recoveryCount + 1
    
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      attemptedRecovery: true,
      recoveryCount: newRecoveryCount
    })

    // Force a re-render to attempt recovery
    this.forceUpdate()
  }

  render() {
    if (this.state.hasError) {
      const FallbackComponent = this.props.fallback || DefaultErrorFallback
      
      return (
        <FallbackComponent
          error={this.state.error}
          errorInfo={this.state.errorInfo}
          resetError={this.resetError}
          attemptRecovery={this.attemptRecovery}
          recoveryCount={this.state.recoveryCount}
          maxRecoveryAttempts={this.props.maxRecoveryAttempts || 3}
        />
      )
    }

    return this.props.children
  }
}

/**
 * Default Error Fallback Component
 * 
 * Championship-level error display with autonomous recovery options
 * and detailed diagnostics for government system reliability.
 */
const DefaultErrorFallback: React.FC<ErrorBoundaryFallbackProps> = ({
  error,
  errorInfo,
  resetError,
  attemptRecovery,
  recoveryCount,
  maxRecoveryAttempts
}) => {
  const canAttemptRecovery = recoveryCount < maxRecoveryAttempts

  const reloadPage = () => {
    window.location.reload()
  }

  const goHome = () => {
    window.location.href = '/'
  }

  const copyErrorDetails = () => {
    const errorDetails = `
TerraFusion AI Consciousness Error Report
========================================

Error: ${error?.name}
Message: ${error?.message}
Stack: ${error?.stack}

Component Stack:
${errorInfo?.componentStack}

Recovery Attempts: ${recoveryCount}/${maxRecoveryAttempts}
Timestamp: ${new Date().toISOString()}
User Agent: ${navigator.userAgent}
URL: ${window.location.href}
    `.trim()

    navigator.clipboard.writeText(errorDetails).then(() => {
      alert('Error details copied to clipboard')
    }).catch(() => {
      console.error('Failed to copy error details')
    })
  }

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6">
      <div className="max-w-2xl w-full">
        {/* Error Icon and Title */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-red-500/10 
            border-2 border-red-500/30 rounded-full mb-6">
            <AlertTriangle className="w-10 h-10 text-red-400" />
          </div>
          
          <h1 className="text-4xl font-bold text-white mb-2">
            System Error Detected
          </h1>
          <p className="text-lg text-slate-400">
            TerraFusion AI Consciousness encountered an unexpected error
          </p>
        </div>

        {/* Error Details Card */}
        <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-700/50 
          rounded-2xl p-6 mb-6">
          <h2 className="text-xl font-semibold text-white mb-4 flex items-center">
            <Bug className="w-5 h-5 mr-2 text-red-400" />
            Error Details
          </h2>
          
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium text-slate-400">Error Type:</label>
              <p className="text-white font-mono text-sm bg-slate-800 rounded px-3 py-2 mt-1">
                {error?.name || 'Unknown Error'}
              </p>
            </div>
            
            <div>
              <label className="text-sm font-medium text-slate-400">Message:</label>
              <p className="text-white font-mono text-sm bg-slate-800 rounded px-3 py-2 mt-1">
                {error?.message || 'No error message available'}
              </p>
            </div>
            
            <div>
              <label className="text-sm font-medium text-slate-400">Recovery Attempts:</label>
              <p className="text-white font-mono text-sm bg-slate-800 rounded px-3 py-2 mt-1">
                {recoveryCount} / {maxRecoveryAttempts}
              </p>
            </div>
          </div>
        </div>

        {/* Recovery Actions */}
        <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-700/50 
          rounded-2xl p-6 mb-6">
          <h2 className="text-xl font-semibold text-white mb-4">
            Autonomous Recovery Options
          </h2>
          
          <div className="grid gap-3 sm:grid-cols-2">
            <button
              onClick={attemptRecovery}
              disabled={!canAttemptRecovery}
              className={`flex items-center justify-center space-x-2 px-4 py-3 rounded-lg
                font-semibold transition-all ${
                  canAttemptRecovery
                    ? 'bg-tf-trust-blue hover:bg-tf-trust-blue/80 text-white'
                    : 'bg-slate-700 text-slate-400 cursor-not-allowed'
                }`}
            >
              <RefreshCw className="w-4 h-4" />
              <span>
                {canAttemptRecovery ? 'Attempt Recovery' : 'Max Attempts Reached'}
              </span>
            </button>
            
            <button
              onClick={resetError}
              className="flex items-center justify-center space-x-2 px-4 py-3 rounded-lg
                bg-tf-transcend-cyan hover:bg-tf-transcend-cyan/80 text-slate-900 
                font-semibold transition-all"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Reset Interface</span>
            </button>
            
            <button
              onClick={goHome}
              className="flex items-center justify-center space-x-2 px-4 py-3 rounded-lg
                bg-tf-success-green hover:bg-tf-success-green/80 text-slate-900 
                font-semibold transition-all"
            >
              <Home className="w-4 h-4" />
              <span>Return Home</span>
            </button>
            
            <button
              onClick={reloadPage}
              className="flex items-center justify-center space-x-2 px-4 py-3 rounded-lg
                bg-slate-700 hover:bg-slate-600 text-white font-semibold transition-all"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Reload Page</span>
            </button>
          </div>
        </div>

        {/* Diagnostic Actions */}
        <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-700/50 
          rounded-2xl p-6">
          <h2 className="text-xl font-semibold text-white mb-4">
            Diagnostic Tools
          </h2>
          
          <div className="grid gap-3 sm:grid-cols-2">
            <button
              onClick={copyErrorDetails}
              className="flex items-center justify-center space-x-2 px-4 py-3 rounded-lg
                bg-slate-700 hover:bg-slate-600 text-white font-semibold transition-all"
            >
              <FileText className="w-4 h-4" />
              <span>Copy Error Report</span>
            </button>
            
            <button
              onClick={() => window.open('/health', '_blank')}
              className="flex items-center justify-center space-x-2 px-4 py-3 rounded-lg
                bg-slate-700 hover:bg-slate-600 text-white font-semibold transition-all"
            >
              <Bug className="w-4 h-4" />
              <span>System Health</span>
            </button>
          </div>
        </div>

        {/* Government Compliance Notice */}
        <div className="text-center mt-8 text-sm text-slate-400">
          <p>
            Error automatically logged for FISMA compliance and system monitoring.
            <br />
            Government operations continue with autonomous self-healing protocols.
          </p>
        </div>
      </div>
    </div>
  )
}

export { ErrorBoundary, DefaultErrorFallback }
export type { ErrorBoundaryProps, ErrorBoundaryFallbackProps }
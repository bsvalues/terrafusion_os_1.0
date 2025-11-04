import React from 'react'
import { Header } from './Header'
import { Sidebar } from './Sidebar'
import { ErrorBoundary } from './ErrorBoundary'

/**
 * TerraFusion AI Consciousness Dashboard Layout
 * 
 * Elite layout component providing the structural foundation for
 * government AI consciousness interface with quantum-enhanced design.
 */

interface DashboardLayoutProps {
  children: React.ReactNode
  showSidebar?: boolean
  sidebarCollapsed?: boolean
  onToggleSidebar?: () => void
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({
  children,
  showSidebar = true,
  sidebarCollapsed = false,
  onToggleSidebar
}) => {
  return (
    <ErrorBoundary enableAutoRecovery maxRecoveryAttempts={3}>
      <div className="min-h-screen bg-tf-deep-space text-white">
        {/* Quantum Background Effects */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="tf-quantum-grid absolute inset-0 opacity-5" />
          <div className="tf-data-matrix absolute inset-0 opacity-5" />
        </div>

        {/* Main Layout Container */}
        <div className="relative z-10 flex h-screen">
          {/* Sidebar */}
          {showSidebar && (
            <aside className={`transition-all duration-300 ease-in-out ${
              sidebarCollapsed ? 'w-16' : 'w-64'
            }`}>
              <Sidebar 
                collapsed={sidebarCollapsed} 
                onToggle={onToggleSidebar}
              />
            </aside>
          )}

          {/* Main Content Area */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Header */}
            <Header />

            {/* Content */}
            <main className="flex-1 overflow-auto">
              <div className="p-6">
                {children}
              </div>
            </main>
          </div>
        </div>
      </div>
    </ErrorBoundary>
  )
}
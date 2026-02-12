import { Link, useLocation } from 'react-router-dom'
import { Brain, Network, BarChart3, Activity, Settings } from 'lucide-react'
import { cn } from '../lib/utils'

export function Navigation() {
  const location = useLocation()

  const navItems = [
    { path: '/', label: 'Quantum Dashboard', icon: Brain },
    { path: '/swarm', label: '50K Agent Swarm', icon: Network },
    { path: '/analytics', label: 'Analytics Lab', icon: BarChart3 },
    { path: '/orchestrator', label: 'AI Orchestrator', icon: Settings },
  ]

  return (
    <nav className="glass-strong border-b border-white/10 sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-lg bg-quantum-primary/20 flex items-center justify-center neural-glow">
              <Activity className="w-6 h-6 text-quantum-primary" />
            </div>
            <div>
              <h1 className="text-xl font-bold bg-clip-text text-transparent quantum-gradient">
                TrueAutomation/PACS
              </h1>
              <p className="text-xs text-muted-foreground">
                Quantum AI Analytics
              </p>
            </div>
          </div>

          {/* Navigation Links */}
          <div className="flex items-center space-x-1">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = location.pathname === item.path

              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={cn(
                    'flex items-center space-x-2 px-4 py-2 rounded-lg transition-all duration-200',
                    isActive
                      ? 'bg-quantum-primary/20 text-quantum-primary neural-glow'
                      : 'text-muted-foreground hover:text-foreground hover:bg-white/5'
                  )}
                >
                  <Icon className="w-4 h-4" />
                  <span className="text-sm font-medium">{item.label}</span>
                </Link>
              )
            })}
          </div>

          {/* System Status */}
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-xs text-muted-foreground">
              AI Systems Online
            </span>
          </div>
        </div>
      </div>
    </nav>
  )
}

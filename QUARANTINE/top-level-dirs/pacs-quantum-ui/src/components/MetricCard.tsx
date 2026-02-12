import { LucideIcon } from 'lucide-react'
import { TrendingUp, TrendingDown } from 'lucide-react'
import { cn } from '../lib/utils'

interface MetricCardProps {
  title: string
  value: string
  subtitle?: string
  icon: LucideIcon
  trend?: number
  color?: 'cyan' | 'blue' | 'green' | 'yellow' | 'red'
}

const colorClasses = {
  cyan: 'from-quantum-primary/20 to-transparent border-quantum-primary/30',
  blue: 'from-quantum-secondary/20 to-transparent border-quantum-secondary/30',
  green: 'from-quantum-accent/20 to-transparent border-quantum-accent/30',
  yellow: 'from-quantum-warning/20 to-transparent border-quantum-warning/30',
  red: 'from-quantum-danger/20 to-transparent border-quantum-danger/30',
}

const iconColorClasses = {
  cyan: 'text-quantum-primary',
  blue: 'text-quantum-secondary',
  green: 'text-quantum-accent',
  yellow: 'text-quantum-warning',
  red: 'text-quantum-danger',
}

export function MetricCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  color = 'cyan',
}: MetricCardProps) {
  const trendPositive = trend !== undefined && trend >= 0

  return (
    <div className={cn(
      'glass rounded-lg p-6 transition-all duration-300 hover:scale-105',
      'bg-gradient-to-br border',
      colorClasses[color]
    )}>
      <div className="flex items-start justify-between mb-4">
        <div className={cn('p-3 rounded-lg', `bg-${color}/10`)}>
          <Icon className={cn('w-6 h-6', iconColorClasses[color])} />
        </div>
        {trend !== undefined && (
          <div className={cn(
            'flex items-center gap-1 text-sm font-medium px-2 py-1 rounded',
            trendPositive ? 'text-green-500 bg-green-500/10' : 'text-red-500 bg-red-500/10'
          )}>
            {trendPositive ? (
              <TrendingUp className="w-3 h-3" />
            ) : (
              <TrendingDown className="w-3 h-3" />
            )}
            {Math.abs(trend).toFixed(1)}%
          </div>
        )}
      </div>

      <div>
        <h3 className="text-sm font-medium text-muted-foreground mb-1">
          {title}
        </h3>
        <div className="text-3xl font-bold mb-1 bg-clip-text text-transparent quantum-gradient">
          {value}
        </div>
        {subtitle && (
          <p className="text-xs text-muted-foreground">{subtitle}</p>
        )}
      </div>
    </div>
  )
}

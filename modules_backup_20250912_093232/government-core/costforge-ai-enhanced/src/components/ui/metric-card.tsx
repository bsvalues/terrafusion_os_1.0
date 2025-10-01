import * as React from 'react';
import {Card, CardContent} from '@/components/ui/card';
import {cn} from '@/lib/utils';
import {ArrowUpRight, ArrowDownRight} from '@mui/icons-material';
import {LucideIcon} from '@mui/icons-material';

interface MetricCardProps {title: string;
  value: string;
  trend?: 'up' | 'down' | 'stable';
  trendValue?: string;
  icon?: LucideIcon;
  description?: string;
  unit?: string;
  className?: string;}

export const MetricCard = React.forwardRef<HTMLDivElement, MetricCardProps>(
  (
    {title, value, trend, trendValue, icon: Icon, description, unit, className, ...props},
    ref
  ) => (<Card
      ref={ref}
      className={cn(
        'bg-slate-800/50 border-slate-700/50 hover:bg-slate-800/60 transition-colors',
        className
      )}
      {...props}
    ><CardContent className="p-6"><div className="flex items-center justify-between"><div className="flex-1"><div className="flex items-center gap-2 mb-2">{Icon &&<Icon className="h-4 w-4 text-slate-400" />}
              <p className="text-sm font-medium text-slate-400">{title}</p></div><div className="flex items-baseline gap-2"><p className="text-2xl font-bold text-slate-200">{value}</p>{unit &&<span className="text-sm text-slate-400">{unit}</span>}
            </div>{(trend || trendValue) && (<div className="flex items-center gap-1 mt-2">{trend === 'up' &&<ArrowUpRight className="h-4 w-4 text-emerald-400" />}
                {trend === 'down' && <ArrowDownRight className="h-4 w-4 text-red-400" />}
                <span
                  className={cn(
                    'text-sm font-medium',
                    trend === 'up' && 'text-emerald-400',
                    trend === 'down' && 'text-red-400',
                    trend === 'stable' && 'text-slate-400'
                  )}
                >{trendValue}</span></div>)}

            {description &&<p className="text-xs text-slate-500 mt-1">{description}</p>}
          </div></div></CardContent></Card>
  )
);

MetricCard.displayName = 'MetricCard';

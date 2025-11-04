import { ReactNode } from 'react';

interface DashboardCardProps {
  title: string;
  metric: string | number;
  description?: string;
  icon?: ReactNode;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  className?: string;
}

export function DashboardCard({
  title,
  metric,
  description,
  icon,
  trend,
  className = '',
}: DashboardCardProps) {
  return (
    <div
      className={`p-6 rounded-xl relative bg-tf-dark-blue/90 border border-tf-primary/20 ${className}`}
      style={{
        boxShadow: '0 0 20px rgba(0,229,255,0.1)',
      }}
    >
      {/* Tiny Terrafusion watermark */}
      <div className="absolute top-3 left-3 w-4 h-4 opacity-10">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full"
        >
          <path
            d="M12 2L2 7L12 12L22 7L12 2Z"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-tf-primary"
          />
          <path
            d="M2 17L12 22L22 17"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-tf-primary"
          />
          <path
            d="M2 12L12 17L22 12"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-tf-primary"
          />
        </svg>
      </div>

      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <h3 className="text-sm font-medium text-tf-primary/70">{title}</h3>
          {icon && <div className="text-tf-primary/80">{icon}</div>}
        </div>

        {/* Large metric with fluid scaling */}
        <div className="flex items-baseline">
          <p className="text-[clamp(2.2rem,4vw+1rem,3.5rem)] font-bold text-white leading-none">
            {metric}
          </p>

          {trend && (
            <span
              className={`ml-2 text-sm flex items-center ${
                trend.isPositive ? 'text-emerald-500' : 'text-red-500'
              }`}
            >
              {trend.isPositive ? '↑' : '↓'} {Math.abs(trend.value)}%
            </span>
          )}
        </div>

        {description && <p className="text-sm text-tf-primary/50">{description}</p>}
      </div>

      {/* Optional bottom glow effect */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[80%] h-[1px] bg-tf-primary/20"></div>
    </div>
  );
}

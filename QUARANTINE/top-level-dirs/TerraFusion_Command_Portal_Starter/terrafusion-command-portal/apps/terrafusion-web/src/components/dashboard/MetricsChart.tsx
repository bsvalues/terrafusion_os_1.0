'use client';

import React, { useEffect, useState } from 'react';

interface MetricsChartProps {
  data: Array<{ timestamp: string; value: number; label?: string }>;
  title: string;
  color: string;
  unit?: string;
  className?: string;
}

export const MetricsChart: React.FC<MetricsChartProps> = ({
  data = [],
  title,
  color,
  unit = '',
  className = ''
}) => {
  const [chartWidth, setChartWidth] = useState(300);
  const maxValue = Math.max(...data.map(d => d.value), 1);
  
  useEffect(() => {
    const handleResize = () => {
      setChartWidth(300); // Fixed width for consistency
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Create SVG path for the chart line
  const createPath = () => {
    if (data.length < 2) return '';
    
    const points = data.map((point, index) => {
      const x = (index / (data.length - 1)) * chartWidth;
      const y = 60 - (point.value / maxValue) * 50; // Inverted Y axis
      return `${x},${y}`;
    });
    
    return `M${points.join(' L')}`;
  };

  return (
    <div className={`bg-slate-800/50 border border-slate-700/50 rounded-xl p-4 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h4 className="font-medium text-slate-200">{title}</h4>
        <span className={`text-lg font-bold ${color}`}>
          {data[data.length - 1]?.value?.toFixed(1) || '0.0'}{unit}
        </span>
      </div>
      
      {data.length > 0 ? (
        <div className="relative">
          <svg width={chartWidth} height="60" className="w-full">
            {/* Grid lines */}
            <defs>
              <pattern id="grid" width="30" height="15" patternUnits="userSpaceOnUse">
                <path d="M 30 0 L 0 0 0 15" fill="none" stroke="rgb(71 85 105)" strokeWidth="0.5" opacity="0.3"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
            
            {/* Chart line */}
            {data.length > 1 && (
              <path
                d={createPath()}
                fill="none"
                stroke={color.includes('blue') ? 'rgb(59 130 246)' : 
                       color.includes('green') ? 'rgb(34 197 94)' :
                       color.includes('purple') ? 'rgb(168 85 247)' :
                       color.includes('yellow') ? 'rgb(234 179 8)' :
                       'rgb(148 163 184)'}
                strokeWidth="2"
                className="drop-shadow-sm"
              />
            )}
            
            {/* Data points */}
            {data.map((point, index) => {
              const x = (index / (data.length - 1)) * chartWidth;
              const y = 60 - (point.value / maxValue) * 50;
              return (
                <circle
                  key={index}
                  cx={x}
                  cy={y}
                  r="2"
                  fill={color.includes('blue') ? 'rgb(59 130 246)' : 
                        color.includes('green') ? 'rgb(34 197 94)' :
                        color.includes('purple') ? 'rgb(168 85 247)' :
                        color.includes('yellow') ? 'rgb(234 179 8)' :
                        'rgb(148 163 184)'}
                  className="drop-shadow-sm"
                />
              );
            })}
          </svg>
          
          {/* Time labels */}
          <div className="flex justify-between mt-2 text-xs text-slate-500">
            <span>
              {data[0] ? new Date(data[0].timestamp).toLocaleTimeString() : ''}
            </span>
            <span>
              {data[data.length - 1] ? new Date(data[data.length - 1].timestamp).toLocaleTimeString() : ''}
            </span>
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-center h-16 text-slate-500 text-sm">
          No data available
        </div>
      )}
    </div>
  );
};

interface StatusIndicatorProps {
  status: 'healthy' | 'warning' | 'critical' | 'unknown';
  label: string;
  count?: number;
  className?: string;
}

export const StatusIndicator: React.FC<StatusIndicatorProps> = ({
  status,
  label,
  count,
  className = ''
}) => {
  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'healthy':
        return {
          color: 'text-green-400',
          bg: 'bg-green-900/30',
          border: 'border-green-400/50',
          dot: 'bg-green-400',
          pulse: false
        };
      case 'warning':
        return {
          color: 'text-yellow-400',
          bg: 'bg-yellow-900/30',
          border: 'border-yellow-400/50',
          dot: 'bg-yellow-400',
          pulse: true
        };
      case 'critical':
        return {
          color: 'text-red-400',
          bg: 'bg-red-900/30',
          border: 'border-red-400/50',
          dot: 'bg-red-400',
          pulse: true
        };
      default:
        return {
          color: 'text-slate-400',
          bg: 'bg-slate-900/30',
          border: 'border-slate-400/50',
          dot: 'bg-slate-400',
          pulse: false
        };
    }
  };

  const config = getStatusConfig(status);

  return (
    <div className={`flex items-center space-x-2 px-3 py-2 rounded-lg border ${config.bg} ${config.border} ${className}`}>
      <div className={`w-2 h-2 rounded-full ${config.dot} ${config.pulse ? 'animate-pulse' : ''}`} />
      <span className={`text-sm font-medium ${config.color}`}>{label}</span>
      {count !== undefined && (
        <span className={`text-sm ${config.color} font-bold`}>({count})</span>
      )}
    </div>
  );
};
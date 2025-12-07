/**
 * ═══════════════════════════════════════════════════════════════
 * TERRAFUSION DASHBOARD WIDGET SYSTEM
 * Modular quantum-themed dashboard widgets with real-time data
 * ═══════════════════════════════════════════════════════════════
 */

import { cn } from '@/lib/utils';
import * as LucideIcons from 'lucide-react';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import './DashboardWidgets.css';

// ═══ TYPES & INTERFACES ═══
export interface WidgetData {
  id: string;
  title: string;
  value: string | number;
  change?: number;
  trend?: 'up' | 'down' | 'neutral';
  timestamp?: Date;
}

export interface ChartDataPoint {
  label: string;
  value: number;
  color?: string;
}

export interface MetricCardProps {
  title: string;
  value: string | number;
  change?: number;
  trend?: 'up' | 'down' | 'neutral';
  icon?: React.ReactNode;
  variant?: 'default' | 'glass' | 'quantum';
  glow?: boolean;
  className?: string;
  onClick?: () => void;
}

export interface ChartWidgetProps {
  title: string;
  data: ChartDataPoint[];
  type?: 'line' | 'bar' | 'pie' | 'area';
  variant?: 'default' | 'glass' | 'quantum';
  height?: number;
  showLegend?: boolean;
  glow?: boolean;
  refreshable?: boolean;
  onRefresh?: () => void;
  className?: string;
}

export interface StatusIndicatorProps {
  title: string;
  status: 'online' | 'offline' | 'warning' | 'error' | 'maintenance';
  description?: string;
  uptime?: string;
  variant?: 'default' | 'glass' | 'quantum';
  glow?: boolean;
  className?: string;
}

export interface DataGridProps {
  title: string;
  columns: Array<{
    key: string;
    label: string;
    width?: string;
    align?: 'left' | 'center' | 'right';
  }>;
  data: Array<Record<string, any>>;
  variant?: 'default' | 'glass' | 'quantum';
  maxRows?: number;
  searchable?: boolean;
  sortable?: boolean;
  glow?: boolean;
  className?: string;
}

export interface WidgetContainerProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  variant?: 'default' | 'glass' | 'quantum';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  expandable?: boolean;
  refreshable?: boolean;
  configurable?: boolean;
  glow?: boolean;
  // New widget management props
  hideable?: boolean;
  autoHide?: boolean;
  autoHideDelay?: number; // milliseconds
  draggable?: boolean;
  resizable?: boolean;
  collapsible?: boolean;
  initialCollapsed?: boolean;
  position?: { x: number; y: number };
  id?: string;
  // Event handlers
  onRefresh?: () => void;
  onExpand?: () => void;
  onConfigure?: () => void;
  onHide?: () => void;
  onShow?: () => void;
  onCollapse?: (collapsed: boolean) => void;
  onDrag?: (position: { x: number; y: number }) => void;
  onResize?: (size: { width: number; height: number }) => void;
  className?: string;
}

// ═══ METRIC CARD COMPONENT ═══
export function QuantumMetricCard({
  title,
  value,
  change,
  trend = 'neutral',
  icon,
  variant = 'default',
  glow = false,
  className = '',
  onClick,
}: MetricCardProps) {
  const cardClass = cn(
    'quantum-metric-card',
    `quantum-metric-${variant}`,
    glow && 'quantum-metric-glow',
    onClick && 'cursor-pointer hover:scale-105 transition-transform duration-200',
    className
  );

  const changeClass = cn(
    'quantum-metric-change',
    trend === 'up' && 'quantum-metric-change-up',
    trend === 'down' && 'quantum-metric-change-down',
    trend === 'neutral' && 'quantum-metric-change-neutral'
  );

  const getTrendIcon = () => {
    if (trend === 'up') {
      const TrendingUpIcon = LucideIcons.TrendingUp as any;
      return <TrendingUpIcon className='quantum-metric-trend-icon' />;
    }
    if (trend === 'down') {
      const TrendingDownIcon = LucideIcons.TrendingDown as any;
      return <TrendingDownIcon className='quantum-metric-trend-icon' />;
    }
    return null;
  };

  return (
    <div className={cardClass} onClick={onClick}>
      <div className='quantum-metric-header'>
        {icon && <div className='quantum-metric-icon'>{icon}</div>}
        <div className='quantum-metric-title'>{title}</div>
      </div>

      <div className='quantum-metric-content'>
        <div className='quantum-metric-value'>{value}</div>
        {change !== undefined && (
          <div className={changeClass}>
            {getTrendIcon()}
            <span>
              {change > 0 ? '+' : ''}
              {change}%
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

// ═══ CHART WIDGET COMPONENT ═══
export function QuantumChartWidget({
  title,
  data,
  type = 'line',
  variant = 'default',
  height = 300,
  showLegend = true,
  glow = false,
  refreshable = false,
  onRefresh,
  className = '',
}: ChartWidgetProps) {
  const [isLoading, setIsLoading] = useState(false);
  const chartRef = useRef<HTMLDivElement>(null);

  const widgetClass = cn(
    'quantum-chart-widget',
    `quantum-chart-${variant}`,
    glow && 'quantum-chart-glow',
    className
  );

  const handleRefresh = async () => {
    if (!onRefresh) return;
    setIsLoading(true);
    await onRefresh();
    setTimeout(() => setIsLoading(false), 1000);
  };

  // Simple chart rendering (in production, you'd use a library like Chart.js or D3)
  const renderChart = () => {
    const maxValue = Math.max(...data.map((d) => d.value));
    const chartHeight = height || 300; // Default height

    return (
      <div className='quantum-chart-container'>
        {type === 'bar' && (
          <div className='quantum-chart-bars'>
            {data.map((point, index) => (
              <div key={index} className='quantum-chart-bar-container'>
                <div
                  className='quantum-chart-bar'
                  data-height={`${(point.value / maxValue) * 100}%`}
                  data-color={point.color || '#00FFFF'}
                />
                <div className='quantum-chart-bar-label'>{point.label}</div>
              </div>
            ))}
          </div>
        )}

        {type === 'line' && (
          <div className='quantum-chart-line'>
            <svg width='100%' height='100%' className='quantum-chart-svg'>
              {data.map((point, index) => {
                if (index === 0) return null;
                const prevPoint = data[index - 1];
                const x1 = ((index - 1) / (data.length - 1)) * 100;
                const y1 = 100 - (prevPoint.value / maxValue) * 80;
                const x2 = (index / (data.length - 1)) * 100;
                const y2 = 100 - (point.value / maxValue) * 80;

                return (
                  <line
                    key={index}
                    x1={`${x1}%`}
                    y1={`${y1}%`}
                    x2={`${x2}%`}
                    y2={`${y2}%`}
                    stroke='#00FFFF'
                    strokeWidth='2'
                    className='quantum-chart-line-segment'
                  />
                );
              })}
              {data.map((point, index) => (
                <circle
                  key={index}
                  cx={`${(index / (data.length - 1)) * 100}%`}
                  cy={`${100 - (point.value / maxValue) * 80}%`}
                  r='4'
                  fill='#00FFFF'
                  className='quantum-chart-point'
                />
              ))}
            </svg>
          </div>
        )}

        {type === 'pie' && (
          <div className='quantum-chart-pie'>
            <div className='quantum-chart-pie-center'>
              <div className='quantum-chart-pie-total'>
                {data.reduce((sum, point) => sum + point.value, 0)}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={widgetClass}>
      <div className='quantum-chart-header'>
        <div className='quantum-chart-title'>{title}</div>
        <div className='quantum-chart-actions'>
          {refreshable && (
            <button
              onClick={handleRefresh}
              className={cn(
                'quantum-chart-action-btn',
                isLoading && 'quantum-chart-action-loading'
              )}
              disabled={isLoading}
            >
              {(() => {
                const RefreshCwIcon = LucideIcons.RefreshCw as any;
                return <RefreshCwIcon className={cn('h-4 w-4', isLoading && 'animate-spin')} />;
              })()}
            </button>
          )}
        </div>
      </div>

      <div className='quantum-chart-body'>{renderChart()}</div>

      {showLegend && (
        <div className='quantum-chart-legend'>
          {data.map((point, index) => (
            <div key={index} className='quantum-chart-legend-item'>
              <div className='quantum-chart-legend-color' data-color={point.color || '#00FFFF'} />
              <span className='quantum-chart-legend-label'>{point.label}</span>
              <span className='quantum-chart-legend-value'>{point.value}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ═══ STATUS INDICATOR COMPONENT ═══
export function QuantumStatusIndicator({
  title,
  status,
  description,
  uptime,
  variant = 'default',
  glow = false,
  className = '',
}: StatusIndicatorProps) {
  const indicatorClass = cn(
    'quantum-status-indicator',
    `quantum-status-${variant}`,
    `quantum-status-${status}`,
    glow && 'quantum-status-glow',
    className
  );

  const getStatusIcon = () => {
    const ActivityIcon = LucideIcons.Activity as any;
    const InfoIcon = LucideIcons.Info as any;
    const SettingsIcon = LucideIcons.Settings as any;

    switch (status) {
      case 'online':
        return <ActivityIcon className='quantum-status-icon' />;
      case 'offline':
        return <ActivityIcon className='quantum-status-icon' />;
      case 'warning':
        return <InfoIcon className='quantum-status-icon' />;
      case 'error':
        return <InfoIcon className='quantum-status-icon' />;
      case 'maintenance':
        return <SettingsIcon className='quantum-status-icon' />;
      default:
        return <ActivityIcon className='quantum-status-icon' />;
    }
  };

  const getStatusLabel = () => {
    switch (status) {
      case 'online':
        return 'Online';
      case 'offline':
        return 'Offline';
      case 'warning':
        return 'Warning';
      case 'error':
        return 'Error';
      case 'maintenance':
        return 'Maintenance';
      default:
        return 'Unknown';
    }
  };

  return (
    <div className={indicatorClass}>
      <div className='quantum-status-header'>
        <div className='quantum-status-title'>{title}</div>
        <div className='quantum-status-badge'>
          {getStatusIcon()}
          <span>{getStatusLabel()}</span>
        </div>
      </div>

      {description && <div className='quantum-status-description'>{description}</div>}

      {uptime && (
        <div className='quantum-status-uptime'>
          <span className='quantum-status-uptime-label'>Uptime:</span>
          <span className='quantum-status-uptime-value'>{uptime}</span>
        </div>
      )}
    </div>
  );
}

// ═══ DATA GRID COMPONENT ═══
export function QuantumDataGrid({
  title,
  columns,
  data,
  variant = 'default',
  maxRows = 10,
  searchable = false,
  sortable = false,
  glow = false,
  className = '',
}: DataGridProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  const gridClass = cn(
    'quantum-data-grid',
    `quantum-grid-${variant}`,
    glow && 'quantum-grid-glow',
    className
  );

  const filteredData = useMemo(() => {
    let filtered = data;

    if (searchable && searchTerm) {
      filtered = data.filter((row) =>
        Object.values(row).some((value) =>
          String(value).toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
    }

    if (sortable && sortColumn) {
      filtered.sort((a, b) => {
        const aVal = a[sortColumn];
        const bVal = b[sortColumn];
        const multiplier = sortDirection === 'asc' ? 1 : -1;

        if (typeof aVal === 'number' && typeof bVal === 'number') {
          return (aVal - bVal) * multiplier;
        }

        return String(aVal).localeCompare(String(bVal)) * multiplier;
      });
    }

    return filtered.slice(0, maxRows);
  }, [data, searchTerm, sortColumn, sortDirection, maxRows, searchable, sortable]);

  const handleSort = (columnKey: string) => {
    if (!sortable) return;

    if (sortColumn === columnKey) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(columnKey);
      setSortDirection('asc');
    }
  };

  return (
    <div className={gridClass}>
      <div className='quantum-grid-header'>
        <div className='quantum-grid-title'>{title}</div>
        {searchable && (
          <div className='quantum-grid-search'>
            <input
              type='text'
              placeholder='Search...'
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className='quantum-grid-search-input'
            />
          </div>
        )}
      </div>

      <div className='quantum-grid-container'>
        <table className='quantum-grid-table'>
          <thead className='quantum-grid-thead'>
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  className={cn(
                    'quantum-grid-th',
                    sortable && 'quantum-grid-th-sortable',
                    column.align && `quantum-grid-th-${column.align}`
                  )}
                  data-width={column.width}
                  onClick={() => handleSort(column.key)}
                >
                  <div className='quantum-grid-th-content'>
                    <span>{column.label}</span>
                    {sortable &&
                      sortColumn === column.key &&
                      (() => {
                        const TrendingUpIcon = LucideIcons.TrendingUp as any;
                        return (
                          <TrendingUpIcon
                            className={cn(
                              'quantum-grid-sort-icon',
                              sortDirection === 'desc' && 'quantum-grid-sort-desc'
                            )}
                          />
                        );
                      })()}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className='quantum-grid-tbody'>
            {filteredData.map((row, index) => (
              <tr key={index} className='quantum-grid-tr'>
                {columns.map((column) => (
                  <td
                    key={column.key}
                    className={cn(
                      'quantum-grid-td',
                      column.align && `quantum-grid-td-${column.align}`
                    )}
                  >
                    {row[column.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {data.length > maxRows && (
        <div className='quantum-grid-footer'>
          <span className='quantum-grid-count'>
            Showing {Math.min(maxRows, filteredData.length)} of {data.length} records
          </span>
        </div>
      )}
    </div>
  );
}

// ═══ WIDGET CONTAINER COMPONENT ═══
export function QuantumWidgetContainer({
  title,
  subtitle,
  children,
  variant = 'default',
  size = 'md',
  expandable = false,
  refreshable = false,
  configurable = false,
  glow = false,
  // New widget management props
  hideable = true,
  autoHide = false,
  autoHideDelay = 5000,
  draggable = true,
  resizable = false,
  collapsible = true,
  initialCollapsed = false,
  position,
  id,
  // Event handlers
  onRefresh,
  onExpand,
  onConfigure,
  onHide,
  onShow,
  onCollapse,
  onDrag,
  onResize,
  className = '',
}: WidgetContainerProps) {
  // State management
  const [isExpanded, setIsExpanded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isHidden, setIsHidden] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(initialCollapsed);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [currentPosition, setCurrentPosition] = useState(position || { x: 0, y: 0 });

  // Refs for auto-hide functionality
  const widgetRef = useRef<HTMLDivElement>(null);
  const autoHideTimeoutRef = useRef<NodeJS.Timeout>();
  const mouseInWidgetRef = useRef(false);

  // Auto-hide functionality
  useEffect(() => {
    if (!autoHide || isHidden) return;

    const handleMouseEnter = () => {
      mouseInWidgetRef.current = true;
      if (autoHideTimeoutRef.current) {
        clearTimeout(autoHideTimeoutRef.current);
      }
    };

    const handleMouseLeave = () => {
      mouseInWidgetRef.current = false;
      autoHideTimeoutRef.current = setTimeout(() => {
        if (!mouseInWidgetRef.current) {
          setIsHidden(true);
          onHide?.();
        }
      }, autoHideDelay);
    };

    const widget = widgetRef.current;
    if (widget) {
      widget.addEventListener('mouseenter', handleMouseEnter);
      widget.addEventListener('mouseleave', handleMouseLeave);

      // Start initial auto-hide timer
      autoHideTimeoutRef.current = setTimeout(() => {
        if (!mouseInWidgetRef.current) {
          setIsHidden(true);
          onHide?.();
        }
      }, autoHideDelay);
    }

    return () => {
      if (widget) {
        widget.removeEventListener('mouseenter', handleMouseEnter);
        widget.removeEventListener('mouseleave', handleMouseLeave);
      }
      if (autoHideTimeoutRef.current) {
        clearTimeout(autoHideTimeoutRef.current);
      }
    };
  }, [autoHide, autoHideDelay, isHidden, onHide]);

  // Drag functionality
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!draggable || e.target !== e.currentTarget) return;

    setIsDragging(true);
    const rect = widgetRef.current?.getBoundingClientRect();
    if (rect) {
      setDragOffset({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      });
    }
  };

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      const newPosition = {
        x: e.clientX - dragOffset.x,
        y: e.clientY - dragOffset.y,
      };
      setCurrentPosition(newPosition);
      onDrag?.(newPosition);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragOffset, onDrag]);

  const containerClass = cn(
    'quantum-widget-container',
    `quantum-widget-${variant}`,
    `quantum-widget-${size}`,
    glow && 'quantum-widget-glow',
    isExpanded && 'quantum-widget-expanded',
    isHidden && 'quantum-widget-hidden',
    isCollapsed && 'quantum-widget-collapsed',
    isDragging && 'quantum-widget-dragging',
    draggable && 'quantum-widget-draggable',
    className
  );

  const handleRefresh = async () => {
    if (!onRefresh) return;
    setIsLoading(true);
    await onRefresh();
    setTimeout(() => setIsLoading(false), 1000);
  };

  const handleExpand = () => {
    setIsExpanded(!isExpanded);
    onExpand?.();
  };

  const handleHide = () => {
    setIsHidden(true);
    onHide?.();
  };

  const handleShow = () => {
    setIsHidden(false);
    onShow?.();
  };

  const handleCollapse = () => {
    const newCollapsed = !isCollapsed;
    setIsCollapsed(newCollapsed);
    onCollapse?.(newCollapsed);
  };

  // Don't render if hidden
  if (isHidden) {
    return null;
  }

  const dynamicPositionClass =
    draggable && position
      ? `absolute left-[${currentPosition.x}px] top-[${currentPosition.y}px] ${isDragging ? 'z-[1000]' : 'z-auto'}`
      : '';

  const combinedClass = cn(containerClass, dynamicPositionClass);

  return (
    <div
      ref={widgetRef}
      className={combinedClass}
      onMouseDown={handleMouseDown}
      data-widget-id={id}
    >
      <div className='quantum-widget-header'>
        <div className='quantum-widget-title-section'>
          <h3 className='quantum-widget-title'>{title}</h3>
          {subtitle && <p className='quantum-widget-subtitle'>{subtitle}</p>}
        </div>

        <div className='quantum-widget-controls'>
          {/* Collapse/Expand Button */}
          {collapsible && (
            <button
              className='quantum-widget-control-btn'
              onClick={handleCollapse}
              title={isCollapsed ? 'Expand Widget' : 'Collapse Widget'}
            >
              {isCollapsed ? '⌄' : '⌃'}
            </button>
          )}

          {/* Hide Button */}
          {hideable && (
            <button className='quantum-widget-control-btn' onClick={handleHide} title='Hide Widget'>
              ✕
            </button>
          )}

          {/* Refresh Button */}
          {refreshable && (
            <button
              className='quantum-widget-control-btn'
              onClick={handleRefresh}
              disabled={isLoading}
              title='Refresh Widget'
            >
              {isLoading ? '↻' : '⟳'}
            </button>
          )}

          {/* Expand Button */}
          {expandable && (
            <button
              className='quantum-widget-control-btn'
              onClick={handleExpand}
              title={isExpanded ? 'Minimize' : 'Expand'}
            >
              {isExpanded ? '🗗' : '🗖'}
            </button>
          )}

          {/* Configure Button */}
          {configurable && (
            <button
              className='quantum-widget-control-btn'
              onClick={onConfigure}
              title='Configure Widget'
            >
              ⚙
            </button>
          )}

          {/* Drag Handle */}
          {draggable && (
            <div className='quantum-widget-drag-handle' title='Drag to move'>
              ⋮⋮
            </div>
          )}
        </div>
      </div>

      {/* Widget Content */}
      {!isCollapsed && <div className='quantum-widget-content'>{children}</div>}

      {/* Auto-hide indicator */}
      {autoHide && (
        <div className='quantum-widget-autohide-indicator' title='Auto-hide enabled'>
          👁
        </div>
      )}
    </div>
  );
}

function WidgetContainer({
  title,
  subtitle,
  children,
  className = '',
  refreshable = false,
  onRefresh,
  isLoading = false,
}: WidgetContainerProps) {
  const [isRefreshing, setIsRefreshing] = React.useState(false);

  const handleRefresh = async () => {
    if (!onRefresh) return;
    setIsRefreshing(true);
    try {
      await onRefresh();
    } finally {
      setIsRefreshing(false);
    }
  };

  const containerClass = cn(
    'quantum-widget-container',
    className,
    isLoading && 'quantum-widget-loading'
  );

  return (
    <div className={containerClass}>
      <div className='quantum-widget-header'>
        <div className='quantum-widget-header-content'>
          <div className='quantum-widget-title'>{title}</div>
          {subtitle && <div className='quantum-widget-subtitle'>{subtitle}</div>}
        </div>

        <div className='quantum-widget-actions'>
          {refreshable && (
            <button
              onClick={handleRefresh}
              className={cn(
                'quantum-widget-action-btn',
                isLoading && 'quantum-widget-action-loading'
              )}
              disabled={isLoading}
              title='Refresh'
            >
              {(() => {
                const RefreshCwIcon = LucideIcons.RefreshCw as any;
                return <RefreshCwIcon className={cn('h-4 w-4', isLoading && 'animate-spin')} />;
              })()}
            </button>
          )}

          {configurable && (
            <button onClick={onConfigure} className='quantum-widget-action-btn' title='Configure'>
              {(() => {
                const SettingsIcon = LucideIcons.Settings as any;
                return <SettingsIcon className='h-4 w-4' />;
              })()}
            </button>
          )}

          {expandable && (
            <button
              onClick={handleExpand}
              className='quantum-widget-action-btn'
              title={isExpanded ? 'Minimize' : 'Expand'}
            >
              {isExpanded
                ? (() => {
                    const Minimize2Icon = LucideIcons.Minimize2 as any;
                    return <Minimize2Icon className='h-4 w-4' />;
                  })()
                : (() => {
                    const Maximize2Icon = LucideIcons.Maximize2 as any;
                    return <Maximize2Icon className='h-4 w-4' />;
                  })()}
            </button>
          )}
        </div>
      </div>

      <div className='quantum-widget-body'>{children}</div>
    </div>
  );
}

// ═══ REAL-TIME DATA HOOK ═══
export function useQuantumRealTimeData(
  endpoint: string,
  interval: number = 5000,
  enabled: boolean = true
) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled) return;

    const fetchData = async () => {
      try {
        // In production, replace with actual API call
        const response = await fetch(endpoint);
        const result = await response.json();
        setData(result);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    const intervalId = setInterval(fetchData, interval);

    return () => clearInterval(intervalId);
  }, [endpoint, interval, enabled]);

  return { data, loading, error };
}

/**
 * TerraFusion SDUI Components
 *
 * Government-grade UI components for Server-Driven UI rendering.
 * Each component is designed for FISMA-HIGH compliance with WCAG 2.1 AA accessibility.
 *
 * Component Design Principles:
 * - Defensive rendering (handle missing/undefined props gracefully)
 * - WCAG 2.1 AA compliance (proper ARIA attributes, semantic HTML)
 * - TerraFusion brand styling (dark backgrounds, cyan accents)
 * - Type-safe props with TypeScript
 */

import React from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from '@/components/ui/alert';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Info,
  TrendingUp,
  TrendingDown,
  Minus,
  Shield,
  MapPin,
  Clock,
} from 'lucide-react';

// ── Type Definitions ──────────────────────────────────────────────────

export interface SDUIComponentProps {
  id: string;
  type: string;
  props: Record<string, unknown>;
  children?: SDUIComponentProps[];
  visibility?: {
    roles?: string[];
    counties?: string[];
  };
}

interface KPICardProps {
  title?: string;
  value?: string | number;
  trend?: 'up' | 'down' | 'neutral';
  change?: string;
  icon?: string;
  description?: string;
}

interface AlertBannerProps {
  variant?: 'info' | 'warning' | 'error' | 'success';
  title?: string;
  message?: string;
  action?: {
    label: string;
    onClick?: () => void;
  };
  dismissible?: boolean;
}

interface ComplianceBadgeProps {
  standard?: string;
  level?: 'compliant' | 'partial' | 'non-compliant';
  score?: number;
  details?: string;
}

interface PropertyTableProps {
  columns?: Array<{
    key: string;
    label: string;
    sortable?: boolean;
  }>;
  data?: Array<Record<string, unknown>>;
  pagination?: {
    page: number;
    pageSize: number;
    total: number;
  };
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

interface CountySelectorProps {
  counties?: Array<{
    id: string;
    name: string;
    parcelCount?: number;
    status?: 'active' | 'inactive';
  }>;
  selected?: string;
  onChange?: (countyId: string) => void;
}

interface MetricsGridProps {
  metrics?: Array<KPICardProps & { id: string }>;
  columns?: 2 | 3 | 4;
  gap?: number;
}

interface AuditTimelineProps {
  events?: Array<{
    id: string;
    timestamp: string;
    actor: string;
    action: string;
    resource: string;
    severity?: 'low' | 'medium' | 'high' | 'critical';
    details?: string;
  }>;
  maxEvents?: number;
}

interface MapPlaceholderProps {
  county?: string;
  parcelCount?: number;
  boundingBox?: {
    north: number;
    south: number;
    east: number;
    west: number;
  };
  center?: { lat: number; lng: number };
}

// ── Component Implementations ─────────────────────────────────────────

/**
 * KPICard - Key Performance Indicator card for government dashboards
 *
 * Displays a metric with title, value, trend indicator, and optional description.
 * Designed for at-a-glance insights in executive dashboards.
 */
export function KPICard({ props }: { props: Record<string, unknown> }) {
  const {
    title = 'Metric',
    value = '—',
    trend,
    change,
    icon,
    description,
  } = props as KPICardProps;

  const getTrendIcon = () => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="w-4 h-4" aria-hidden="true" />;
      case 'down':
        return <TrendingDown className="w-4 h-4" aria-hidden="true" />;
      default:
        return <Minus className="w-4 h-4" aria-hidden="true" />;
    }
  };

  const getTrendColor = () => {
    switch (trend) {
      case 'up':
        return 'text-emerald-400';
      case 'down':
        return 'text-red-400';
      default:
        return 'text-slate-400';
    }
  };

  return (
    <Card
      className="bg-slate-800 border-cyan-500/20 hover:border-cyan-500/40 transition-colors"
      role="article"
      aria-label={`${title} metric card`}
    >
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-slate-400 mb-1">{title}</p>
            <p className="text-3xl font-bold text-white tracking-tight">
              {value}
            </p>
            {change && (
              <div className={`flex items-center gap-1 mt-2 ${getTrendColor()}`}>
                {getTrendIcon()}
                <span className="text-sm font-medium">{change}</span>
              </div>
            )}
            {description && (
              <p className="text-xs text-slate-500 mt-2">{description}</p>
            )}
          </div>
          {icon && (
            <div className="text-cyan-500 opacity-50" aria-hidden="true">
              {/* Icon would be rendered here based on icon string */}
              <div className="w-8 h-8 rounded-lg bg-cyan-500/10 flex items-center justify-center">
                <span className="text-lg">{icon}</span>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * AlertBanner - System alerts and notifications
 *
 * Displays important messages with appropriate severity levels.
 * WCAG: Uses role="alert" for error/warning, role="status" for info/success.
 */
export function AlertBanner({ props }: { props: Record<string, unknown> }) {
  const {
    variant = 'info',
    title,
    message = '',
    action,
    dismissible = false,
  } = props as AlertBannerProps;

  const getVariantStyles = () => {
    switch (variant) {
      case 'error':
        return 'bg-red-950 border-red-500 text-red-100';
      case 'warning':
        return 'bg-amber-950 border-amber-500 text-amber-100';
      case 'success':
        return 'bg-emerald-950 border-emerald-500 text-emerald-100';
      default:
        return 'bg-cyan-950 border-cyan-500 text-cyan-100';
    }
  };

  const getIcon = () => {
    const iconProps = { className: 'w-5 h-5', 'aria-hidden': true };
    switch (variant) {
      case 'error':
        return <AlertCircle {...iconProps} />;
      case 'warning':
        return <AlertTriangle {...iconProps} />;
      case 'success':
        return <CheckCircle2 {...iconProps} />;
      default:
        return <Info {...iconProps} />;
    }
  };

  const role = variant === 'error' || variant === 'warning' ? 'alert' : 'status';
  const ariaLive = variant === 'error' ? 'assertive' : 'polite';

  return (
    <Alert
      className={`${getVariantStyles()} border-l-4`}
      role={role}
      aria-live={ariaLive}
    >
      <div className="flex items-start gap-3">
        {getIcon()}
        <div className="flex-1">
          {title && (
            <AlertTitle className="text-base font-semibold mb-1">
              {title}
            </AlertTitle>
          )}
          <AlertDescription className="text-sm leading-relaxed">
            {message}
          </AlertDescription>
          {action && (
            <Button
              variant="outline"
              size="sm"
              className="mt-3 text-xs"
              onClick={action.onClick}
            >
              {action.label}
            </Button>
          )}
        </div>
        {dismissible && (
          <button
            className="text-current opacity-70 hover:opacity-100 transition-opacity"
            aria-label="Dismiss alert"
          >
            ×
          </button>
        )}
      </div>
    </Alert>
  );
}

/**
 * ComplianceBadge - FISMA/NIST compliance status indicator
 *
 * Displays government compliance status with color-coded levels.
 * Critical for FISMA-HIGH compliance monitoring.
 */
export function ComplianceBadge({ props }: { props: Record<string, unknown> }) {
  const {
    standard = 'FISMA',
    level = 'compliant',
    score,
    details,
  } = props as ComplianceBadgeProps;

  const getLevelStyles = () => {
    switch (level) {
      case 'compliant':
        return 'bg-emerald-950 border-emerald-500 text-emerald-300';
      case 'partial':
        return 'bg-amber-950 border-amber-500 text-amber-300';
      case 'non-compliant':
        return 'bg-red-950 border-red-500 text-red-300';
      default:
        return 'bg-slate-800 border-slate-600 text-slate-300';
    }
  };

  const getStatusDot = () => {
    switch (level) {
      case 'compliant':
        return 'bg-emerald-400';
      case 'partial':
        return 'bg-amber-400';
      case 'non-compliant':
        return 'bg-red-400';
      default:
        return 'bg-slate-400';
    }
  };

  return (
    <div
      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border ${getLevelStyles()}`}
      role="status"
      aria-label={`${standard} compliance status: ${level}`}
      title={details}
    >
      <Shield className="w-4 h-4" aria-hidden="true" />
      <div className="flex items-center gap-2">
        <span
          className={`w-2 h-2 rounded-full ${getStatusDot()}`}
          aria-hidden="true"
        />
        <span className="text-sm font-medium">{standard}</span>
        {score !== undefined && (
          <span className="text-xs opacity-80">({score}%)</span>
        )}
      </div>
    </div>
  );
}

/**
 * PropertyTable - Data-dense property assessment table
 *
 * Displays property data with sortable columns and pagination.
 * Optimized for government property assessment workflows.
 */
export function PropertyTable({ props }: { props: Record<string, unknown> }) {
  const {
    columns = [],
    data = [],
    pagination,
    sortBy,
    sortOrder = 'asc',
  } = props as PropertyTableProps;

  if (columns.length === 0 || data.length === 0) {
    return (
      <Card className="bg-slate-800 border-slate-700">
        <CardContent className="p-8 text-center">
          <p className="text-slate-400">No data available</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-slate-800 border-slate-700">
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-slate-700 hover:bg-slate-700/50">
                {columns.map((col) => (
                  <TableHead
                    key={col.key}
                    className="text-cyan-400 font-semibold"
                  >
                    <div className="flex items-center gap-2">
                      {col.label}
                      {col.sortable && sortBy === col.key && (
                        <span className="text-xs" aria-label={`Sorted ${sortOrder}`}>
                          {sortOrder === 'asc' ? '↑' : '↓'}
                        </span>
                      )}
                    </div>
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((row, idx) => (
                <TableRow
                  key={idx}
                  className="border-slate-700 hover:bg-slate-700/30 transition-colors"
                >
                  {columns.map((col) => (
                    <TableCell key={col.key} className="text-slate-200">
                      {String(row[col.key] ?? '—')}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        {pagination && (
          <div className="px-6 py-4 border-t border-slate-700 flex items-center justify-between text-sm text-slate-400">
            <span>
              Showing {(pagination.page - 1) * pagination.pageSize + 1} to{' '}
              {Math.min(pagination.page * pagination.pageSize, pagination.total)} of{' '}
              {pagination.total} results
            </span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={pagination.page === 1}
                aria-label="Previous page"
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={
                  pagination.page * pagination.pageSize >= pagination.total
                }
                aria-label="Next page"
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/**
 * CountySelector - County context switcher
 *
 * Enables sovereign county isolation by allowing users to switch county context.
 * Critical for multi-county government operations.
 */
export function CountySelector({ props }: { props: Record<string, unknown> }) {
  const {
    counties = [],
    selected,
    onChange,
  } = props as CountySelectorProps;

  if (counties.length === 0) {
    return (
      <div className="text-sm text-slate-400" role="status">
        No counties available
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <label htmlFor="county-select" className="text-sm font-medium text-slate-300">
        County Context
      </label>
      <Select
        value={selected}
        onValueChange={onChange}
      >
        <SelectTrigger
          id="county-select"
          className="bg-slate-800 border-cyan-500/20 text-white hover:border-cyan-500/40"
          aria-label="Select county"
        >
          <SelectValue placeholder="Select a county" />
        </SelectTrigger>
        <SelectContent className="bg-slate-800 border-slate-700">
          {counties.map((county) => (
            <SelectItem
              key={county.id}
              value={county.id}
              className="text-white hover:bg-slate-700 focus:bg-slate-700"
            >
              <div className="flex items-center justify-between w-full gap-3">
                <span>{county.name}</span>
                <div className="flex items-center gap-2 text-xs">
                  {county.parcelCount && (
                    <span className="text-slate-400">
                      {county.parcelCount.toLocaleString()} parcels
                    </span>
                  )}
                  {county.status && (
                    <Badge
                      variant={county.status === 'active' ? 'default' : 'secondary'}
                      className="text-xs"
                    >
                      {county.status}
                    </Badge>
                  )}
                </div>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

/**
 * MetricsGrid - Grid of metric cards for dashboards
 *
 * Responsive grid layout for displaying multiple KPI cards.
 * Auto-adjusts columns based on screen size.
 */
export function MetricsGrid({ props }: { props: Record<string, unknown> }) {
  const {
    metrics = [],
    columns = 3,
    gap = 16,
  } = props as MetricsGridProps;

  if (metrics.length === 0) {
    return (
      <Card className="bg-slate-800 border-slate-700">
        <CardContent className="p-8 text-center">
          <p className="text-slate-400">No metrics available</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div
      className="grid"
      style={{
        gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
        gap: `${gap}px`,
      }}
      role="region"
      aria-label="Metrics dashboard"
    >
      {metrics.map((metric) => (
        <KPICard key={metric.id} props={metric} />
      ))}
    </div>
  );
}

/**
 * AuditTimeline - Timeline of audit events
 *
 * Displays chronological audit trail for FISMA compliance.
 * Color-coded by severity level.
 */
export function AuditTimeline({ props }: { props: Record<string, unknown> }) {
  const {
    events = [],
    maxEvents = 10,
  } = props as AuditTimelineProps;

  const getSeverityColor = (severity?: string) => {
    switch (severity) {
      case 'critical':
        return 'border-red-500 bg-red-950';
      case 'high':
        return 'border-amber-500 bg-amber-950';
      case 'medium':
        return 'border-cyan-500 bg-cyan-950';
      default:
        return 'border-slate-600 bg-slate-800';
    }
  };

  const displayEvents = events.slice(0, maxEvents);

  if (displayEvents.length === 0) {
    return (
      <Card className="bg-slate-800 border-slate-700">
        <CardContent className="p-8 text-center">
          <p className="text-slate-400">No audit events</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-slate-800 border-slate-700">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <Clock className="w-5 h-5 text-cyan-500" aria-hidden="true" />
          Audit Timeline
        </CardTitle>
        <CardDescription className="text-slate-400">
          Recent security and compliance events
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4" role="list" aria-label="Audit events">
          {displayEvents.map((event, idx) => (
            <div
              key={event.id}
              className={`border-l-4 ${getSeverityColor(event.severity)} pl-4 py-3 rounded-r`}
              role="listitem"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <p className="text-white font-medium">{event.action}</p>
                  <p className="text-sm text-slate-400 mt-1">
                    {event.actor} → {event.resource}
                  </p>
                  {event.details && (
                    <p className="text-xs text-slate-500 mt-2">{event.details}</p>
                  )}
                </div>
                <div className="text-right">
                  <time
                    className="text-xs text-slate-400"
                    dateTime={event.timestamp}
                  >
                    {new Date(event.timestamp).toLocaleString()}
                  </time>
                  {event.severity && (
                    <Badge
                      variant="outline"
                      className="mt-1 text-xs"
                    >
                      {event.severity}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
        {events.length > maxEvents && (
          <p className="text-center text-sm text-slate-500 mt-4">
            Showing {maxEvents} of {events.length} events
          </p>
        )}
      </CardContent>
    </Card>
  );
}

/**
 * MapPlaceholder - Placeholder for GIS/parcel map
 *
 * Placeholder component for future GIS integration.
 * Shows county context and parcel information.
 */
export function MapPlaceholder({ props }: { props: Record<string, unknown> }) {
  const {
    county = 'Unknown County',
    parcelCount = 0,
    boundingBox,
    center,
  } = props as MapPlaceholderProps;

  return (
    <Card className="bg-slate-800 border-slate-700">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <MapPin className="w-5 h-5 text-cyan-500" aria-hidden="true" />
          GIS Map - {county}
        </CardTitle>
        <CardDescription className="text-slate-400">
          Geographic Information System View
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div
          className="bg-slate-900 border-2 border-dashed border-slate-600 rounded-lg p-12 text-center"
          role="region"
          aria-label="Map placeholder"
        >
          <MapPin className="w-16 h-16 text-cyan-500/30 mx-auto mb-4" aria-hidden="true" />
          <p className="text-white font-medium mb-2">Map will render here</p>
          <p className="text-sm text-slate-400 mb-4">
            GIS integration for {county}
          </p>
          <div className="grid grid-cols-2 gap-4 max-w-md mx-auto mt-6">
            <div className="bg-slate-800 rounded p-3 border border-slate-700">
              <p className="text-xs text-slate-500">Total Parcels</p>
              <p className="text-lg font-bold text-cyan-400">
                {parcelCount.toLocaleString()}
              </p>
            </div>
            {center && (
              <div className="bg-slate-800 rounded p-3 border border-slate-700">
                <p className="text-xs text-slate-500">Center Point</p>
                <p className="text-xs font-mono text-cyan-400">
                  {center.lat.toFixed(4)}, {center.lng.toFixed(4)}
                </p>
              </div>
            )}
            {boundingBox && (
              <div className="col-span-2 bg-slate-800 rounded p-3 border border-slate-700">
                <p className="text-xs text-slate-500 mb-2">Bounding Box</p>
                <div className="grid grid-cols-2 gap-2 text-xs font-mono text-slate-300">
                  <div>N: {boundingBox.north.toFixed(4)}</div>
                  <div>S: {boundingBox.south.toFixed(4)}</div>
                  <div>E: {boundingBox.east.toFixed(4)}</div>
                  <div>W: {boundingBox.west.toFixed(4)}</div>
                </div>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ── Component Registry ───────────────────────────────────────────────

/**
 * SDUI Component Registry
 *
 * Maps component type strings to React components.
 * Used by the SDUI renderer to dynamically render server-driven layouts.
 */
export const SDUI_COMPONENTS: Record<
  string,
  React.FC<{ props: Record<string, unknown> }>
> = {
  'kpi-card': KPICard,
  'alert-banner': AlertBanner,
  'compliance-badge': ComplianceBadge,
  'property-table': PropertyTable,
  'county-selector': CountySelector,
  'metrics-grid': MetricsGrid,
  'audit-timeline': AuditTimeline,
  'map-placeholder': MapPlaceholder,
};

/**
 * Get a component from the registry
 * @param type - Component type string
 * @returns Component or undefined if not found
 */
export function getSDUIComponent(type: string) {
  return SDUI_COMPONENTS[type];
}

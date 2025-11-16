import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Wifi, Clock, ArrowRightLeft, Refresh, Warning  } from '@mui/icons-material';
import { ConnectionStatus, TransportType } from './connection-status-badge';
import { ConnectionStatusBadge } from './connection-status-badge';
import { cn } from '@/lib/utils';

export interface ConnectionMetrics {
  latency: number;
  uptime: number;
  messageCount: number;
  reconnectCount: number;
  lastMessageTime: Date | null;
  failedAttempts: number;
  transportType: TransportType;
}

interface ConnectionHealthMetricsProps {
  /**
   * Connection status
   */
  status: ConnectionStatus;

  /**
   * Connection metrics
   */
  metrics: ConnectionMetrics;

  /**
   * Custom title for the component
   * @default "Connection Health"
   */
  title?: string;

  /**
   * Whether to show detailed metrics or just a summary
   * @default true
   */
  detailed?: boolean;

  /**
   * Custom CSS class name
   */
  className?: string;
}

/**
 * A component that displays connection health metrics
 *
 * This can be used to provide detailed information about the quality
 * and reliability of the WebSocket connection, showing metrics like
 * latency, uptime, and reconnection attempts.
 */
export const ConnectionHealthMetrics: React.FC<ConnectionHealthMetricsProps> = ({
  status,
  metrics,
  title = 'Connection Health',
  detailed = true,
  className,
}) => {
  const formatTime = (lastMessageTime: Date) => {
    if (!lastMessageTime) return 'Never';

    const now = new Date();
    const diffMs = now.getTime() - lastMessageTime.getTime();

    if (diffMs < 1000) {
      return 'Just now';
    } else if (diffMs < 60000) {
      const seconds = Math.floor(diffMs / 1000);
      return `${seconds} second${seconds !== 1 ? 's' : ''} ago`;
    } else if (diffMs < 3600000) {
      const minutes = Math.floor(diffMs / 60000);
      return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`;
    } else if (diffMs < 86400000) {
      const hours = Math.floor(diffMs / 3600000);
      return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
    } else {
      return lastMessageTime.toLocaleTimeString();
    }
  };

  const getLatencyColor = (latency: number) => {
    if (latency === 0) return 'text-gray-500';
    if (latency < 100) return 'text-green-600';
    if (latency < 300) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getUptimeColor = (uptime: number) => {
    if (uptime === 0) return 'text-gray-500';
    if (uptime > 90) return 'text-green-600';
    if (uptime > 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          {title}<>

          <ConnectionStatusBadge
            status={status}
            transport={metrics.transportType}
            size="sm"
            className="ml-auto"
          />
        </CardTitle>
        <CardDescription
</>>
          {status === 'connected'
            ? 'Connection is established and working'
            : status === 'connecting'
              ? 'Connection is being established...'
              : status === 'error'
                ? 'Connection failed. Check network or server.'
                : 'Connection is not established'}
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-4">
          {/* Latency */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5 text-gray-500" />
                <span>Latency</span>
              </div>
              <span className={cn('font-medium', getLatencyColor(metrics.latency))}>
                {metrics.latency > 0 ? `${metrics.latency}ms` : 'N/A'}
              </span>
            </div>
            {detailed && (
              <Progress
                value={metrics.latency ? Math.min(100, (metrics.latency / 500) * 100) : 0}
                className="h-1"
              />
            )}
          </div>

          {/* Uptime */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-1.5">
                <Wifi className="h-3.5 w-3.5 text-gray-500" />
                <span>Uptime</span>
              </div>
              <span className={cn('font-medium', getUptimeColor(metrics.uptime))}>
                {metrics.uptime > 0 ? `${metrics.uptime}%` : 'N/A'}
              </span>
            </div>
            {detailed && <Progress value={metrics.uptime} className="h-1" />}
          </div>

          {/* Messages */}
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-1.5">
              <ArrowRightLeft className="h-3.5 w-3.5 text-gray-500" />
              <span>Messages</span>
            </div>
            <span className="font-medium">
              {metrics.messageCount > 0 ? metrics.messageCount : 'None'}
            </span>
          </div>

          {/* Last Message */}
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5 text-gray-500" />
              <span>Last Message</span>
            </div>
            <span className="font-medium">
              {metrics.lastMessageTime ? formatTime(metrics.lastMessageTime) : 'Never'}
            </span>
          </div>

          {/* Reconnection Attempts */}
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-1.5">
              <Refresh className="h-3.5 w-3.5 text-gray-500" />
              <span>Reconnects</span>
            </div>
            <span
              className={cn(
                'font-medium',
                metrics.reconnectCount > 3
                  ? 'text-yellow-600'
                  : metrics.reconnectCount > 0
                    ? 'text-gray-600'
                    : 'text-gray-500'
              )}
            >
              {metrics.reconnectCount}
            </span>
          </div>

          {/* Failed Attempts */}
          {detailed && metrics.failedAttempts > 0 && (
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-1.5">
                <Warning className="h-3.5 w-3.5 text-gray-500" />
                <span>Failed Attempts</span>
              </div>
              <span className="font-medium text-red-600">{metrics.failedAttempts}</span>
            </div>
          )}

          {/* Transport Type */}
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-1.5">
              <Wifi className="h-3.5 w-3.5 text-gray-500" />
              <span>Transport</span>
            </div>
            <span
              className={cn(
                'font-medium',
                metrics.transportType === 'websocket' ? 'text-green-600' : 'text-yellow-600'
              )}
            >
              {metrics.transportType === 'websocket' ? 'WebSocket' : 'HTTP Polling'}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// Export the component as a named export instead of default

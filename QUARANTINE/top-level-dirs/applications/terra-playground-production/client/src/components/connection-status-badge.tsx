import React from 'react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Wifi, WifiOff, Warning, Loader2  } from '@mui/icons-material';

export type ConnectionStatus = 'connected' | 'connecting' | 'disconnected' | 'error';
export type TransportType = 'websocket' | 'polling';

interface ConnectionStatusBadgeProps {
  /**
   * Connection status
   */
  status: ConnectionStatus;

  /**
   * Transport method being used (WebSocket or Polling)
   * @default 'websocket'
   */
  transport?: TransportType;

  /**
   * Whether to show status text alongside the icon
   * @default true
   */
  showText?: boolean;

  /**
   * Size of the badge
   * @default 'md'
   */
  size?: 'sm' | 'md' | 'lg';

  /**
   * Additional class names
   */
  className?: string;
}

/**
 * Connection Status Badge Component
 *
 * This component shows a visual indicator for the connection status
 * (connected, connecting, disconnected, or error) with an appropriate
 * icon and color.
 */
export function ConnectionStatusBadge({
  status,
  transport = 'websocket',
  showText = true,
  size = 'md',
  className,
}: ConnectionStatusBadgeProps) {
  const getStatusDetails = () => {
    switch (status) {
      case 'connected':
        return {
          icon: (
            <Wifi
              className={cn(
                'shrink-0',
                size === 'sm' ? 'h-3 w-3' : size === 'lg' ? 'h-5 w-5' : 'h-4 w-4'
              )}
            />
          ),
          text: transport === 'websocket' ? 'Connected' : 'Connected (Polling)',
          variant: 'outline',
          color: 'text-green-600',
          bgColor: 'bg-green-50',
          borderColor: 'border-green-200',
        };
      case 'connecting':
        return {
          icon: (
            <Loader2
              className={cn(
                'shrink-0 animate-spin',
                size === 'sm' ? 'h-3 w-3' : size === 'lg' ? 'h-5 w-5' : 'h-4 w-4'
              )}
            />
          ),
          text: 'Connecting',
          variant: 'outline',
          color: 'text-blue-600',
          bgColor: 'bg-blue-50',
          borderColor: 'border-blue-200',
        };
      case 'disconnected':
        return {
          icon: (
            <WifiOff
              className={cn(
                'shrink-0',
                size === 'sm' ? 'h-3 w-3' : size === 'lg' ? 'h-5 w-5' : 'h-4 w-4'
              )}
            />
          ),
          text: 'Disconnected',
          variant: 'outline',
          color: 'text-gray-600',
          bgColor: 'bg-gray-50',
          borderColor: 'border-gray-200',
        };
      case 'error':
        return {
          icon: (
            <Warning
              className={cn(
                'shrink-0',
                size === 'sm' ? 'h-3 w-3' : size === 'lg' ? 'h-5 w-5' : 'h-4 w-4'
              )}
            />
          ),
          text: 'Connection Error',
          variant: 'outline',
          color: 'text-red-600',
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200',
        };
      default:
        return {
          icon: (
            <WifiOff
              className={cn(
                'shrink-0',
                size === 'sm' ? 'h-3 w-3' : size === 'lg' ? 'h-5 w-5' : 'h-4 w-4'
              )}
            />
          ),
          text: 'Unknown',
          variant: 'outline',
          color: 'text-gray-600',
          bgColor: 'bg-gray-50',
          borderColor: 'border-gray-200',
        };
    }
  };

  const { icon, text, color, bgColor, borderColor } = getStatusDetails();

  return (
    <Badge
      variant="outline"
      className={cn(
        'gap-1 font-normal',
        color,
        bgColor,
        borderColor,
        size === 'sm'
          ? 'px-2 py-0 text-xs'
          : size === 'lg'
            ? 'px-3 py-1 text-sm'
            : 'px-2.5 py-0.5 text-xs',
        className
      )}
    >
      {icon}
      {showText && <span>{text}</span>}
    </Badge>
  );
}

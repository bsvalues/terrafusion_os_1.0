import React, { useEffect, useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { ConnectionStatus, TransportType } from './connection-status-badge';
import { Wifi, WifiOff, Warning, Refresh  } from '@mui/icons-material';

export interface ConnectionNotificationProps {
  /**
   * Current connection status
   */
  status: ConnectionStatus;

  /**
   * Transport method being used
   */
  transport: TransportType;

  /**
   * Whether to show a toast notification when status changes
   * @default true
   */
  showToast?: boolean;

  /**
   * Whether to show a toast when fallback to polling occurs
   * @default true
   */
  showFallbackNotification?: boolean;

  /**
   * Whether to show reconnection attempts
   * @default true
   */
  showReconnectionAttempts?: boolean;

  /**
   * Number of reconnection attempts
   */
  reconnectCount?: number;

  /**
   * Function to manually attempt reconnection
   */
  onReconnect?: () => void;

  /**
   * Custom toast duration in milliseconds
   * @default 5000 (5 seconds)
   */
  toastDuration?: number;
}

/**
 * A component that shows connection status notifications
 *
 * This component uses the toast system to display notifications
 * when connection status changes, helping users understand
 * what's happening with their connection to the server.
 */
export const ConnectionNotification: React.FC<ConnectionNotificationProps> = ({
  status,
  transport,
  showToast = true,
  showFallbackNotification = true,
  showReconnectionAttempts = true,
  reconnectCount = 0,
  onReconnect,
  toastDuration = 5000,
}) => {
  const { toast } = useToast();
  const [prevStatus, setPrevStatus] = useState<ConnectionStatus>(status);
  const [prevTransport, setPrevTransport] = useState<TransportType>(transport);
  const [hasShownFallbackNotification, setHasShownFallbackNotification] = useState(false);

  // Track status changes and show notifications
  useEffect(() => {
    if (!showToast || status === prevStatus) return;

    // Don't show notification for initial status
    if (prevStatus !== status) {
      switch (status) {
        case 'connected':
          toast({
            title: 'Connected',
            description: 'Connection to the server has been established.',
            duration: toastDuration,
          });
          break;
        case 'connecting':
          if (prevStatus === 'disconnected' || prevStatus === 'error') {
            toast({
              title: 'Connecting',
              description: 'Attempting to connect to the server...',
              duration: toastDuration,
            });
          }
          break;
        case 'disconnected':
          if (prevStatus === 'connected') {
            toast({
              title: 'Disconnected',
              description: 'Connection to the server has been lost. Will attempt to reconnect...',
              duration: toastDuration,
              action: onReconnect ? (
                <button
                  onClick={onReconnect}
                  className="inline-flex items-center rounded bg-gray-100 px-2 py-1 text-xs font-semibold text-gray-800 hover:bg-gray-200"
                >
                  <Refresh className="mr-1 h-3 w-3" />
                  Reconnect
                </button>
              ) : undefined,
            });
          }
          break;
        case 'error':
          toast({
            title: 'Connection Error',
            description: 'Failed to connect to the server. Please check your network connection.',
            duration: toastDuration,
            action: onReconnect ? (
              <button
                onClick={onReconnect}
                className="inline-flex items-center rounded bg-gray-100 px-2 py-1 text-xs font-semibold text-gray-800 hover:bg-gray-200"
              >
                <Refresh className="mr-1 h-3 w-3" />
                Reconnect
              </button>
            ) : undefined,
          });
          break;
      }
    }

    setPrevStatus(status);
  }, [status, prevStatus, onReconnect, showToast, toast, toastDuration]);

  // Track transport changes (WebSocket to polling fallback)
  useEffect(() => {
    if (!showFallbackNotification || transport === prevTransport || hasShownFallbackNotification)
      return;

    if (transport === 'polling' && prevTransport === 'websocket') {
      toast({
        title: 'Using Fallback Connection',
        description:
          'WebSocket connection not available. Using HTTP polling as fallback, which may affect performance.',
        duration: toastDuration * 1.5, // Longer duration for important fallback notice
      });

      // Only show this once per session
      setHasShownFallbackNotification(true);
    }

    setPrevTransport(transport);
  }, [
    transport,
    prevTransport,
    showFallbackNotification,
    hasShownFallbackNotification,
    toast,
    toastDuration,
  ]);

  // Show reconnection attempt notifications
  useEffect(() => {
    if (!showReconnectionAttempts || reconnectCount === 0) return;

    // Only show for specific thresholds to avoid toast spam
    const shouldNotify = [1, 3, 5, 10].includes(reconnectCount);

    if (shouldNotify) {
      toast({
        title: `Reconnection Attempt ${reconnectCount}`,
        description:
          reconnectCount >= 5
            ? 'Still having trouble connecting. Please check your network connection.'
            : 'Attempting to reconnect to the server...',
        duration: toastDuration,
      });
    }
  }, [reconnectCount, showReconnectionAttempts, toast, toastDuration]);

  // This component doesn't render anything visible
  return null;
};

export default ConnectionNotification;

/**
 * PacsStatusBadge — Connection status indicator for PACS backend
 * ===================================================================
 * Shows live/offline status with parcel count when connected.
 */

import { Badge } from '@/components/ui/badge';
import { Database, Wifi, WifiOff } from 'lucide-react';
import type { PacsConnectionStatus } from '@/services/pacsService';

interface Props {
  status: PacsConnectionStatus;
  loading?: boolean;
}

export function PacsStatusBadge({ status, loading }: Props) {
  if (loading) {
    return (
      <Badge
        variant='outline'
        className='gap-1.5'
        style={{
          color: 'hsl(var(--tf-muted))',
          borderColor: 'hsl(var(--tf-border))',
        }}
      >
        <Database size={12} />
        Connecting...
      </Badge>
    );
  }

  if (status.connected) {
    return (
      <Badge
        variant='outline'
        className='gap-1.5'
        style={{
          color: 'hsl(var(--tf-suite-atlas))',
          borderColor: 'hsl(var(--tf-suite-atlas))',
          background: 'hsl(var(--tf-suite-atlas) / 0.1)',
        }}
      >
        <Wifi size={12} />
        PACS Live
        {status.totalProperties > 0 && (
          <span style={{ opacity: 0.7 }}>• {status.totalProperties.toLocaleString()} parcels</span>
        )}
      </Badge>
    );
  }

  return (
    <Badge
      variant='outline'
      className='gap-1.5'
      style={{
        color: 'hsl(var(--tf-muted))',
        borderColor: 'hsl(var(--tf-muted))',
        background: 'hsl(var(--tf-muted) / 0.1)',
      }}
    >
      <WifiOff size={12} />
      PACS Offline — Local Mode
    </Badge>
  );
}

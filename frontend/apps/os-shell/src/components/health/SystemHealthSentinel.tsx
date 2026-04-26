import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent as CardBody, CardHeader } from '@/components/ui/card';

export const SystemHealthSentinel: React.FC = () => {
  return (
    <div className='min-h-screen bg-gradient-to-br from-terra-midnight via-terra-slate to-terra-midnight p-6'>
      <Card
        className='border-amber-500/30 bg-terra-midnight/90'
        data-testid='system-health-sentinel-unavailable'
      >
        <CardHeader className='flex flex-row items-center justify-between'>
          <div>
            <h1 className='text-2xl font-semibold text-white'>System Health Sentinel</h1>
            <p className='text-sm tf-text-dim mt-2'>
              Health telemetry must come from governed services, not browser interception.
            </p>
          </div>
          <Badge variant='outline' className='border-amber-500/40 text-amber-300'>
            Unavailable
          </Badge>
        </CardHeader>
        <CardBody className='space-y-3'>
          <p className='text-base font-medium text-white'>System health sentinel unavailable</p>
          <p className='text-sm tf-text-dim'>
            Console interception, extension filtering, and self-healing claims have been removed from this surface.
          </p>
          <p className='text-sm tf-text-dim'>
            No governed consciousness health dependency is connected, so cross-service integrity claims are withheld.
          </p>
          <p className='text-sm text-amber-300'>
            Use governed service health endpoints and trace evidence instead of browser-side system healing.
          </p>
        </CardBody>
      </Card>
    </div>
  );
};

export default SystemHealthSentinel;

import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent as CardBody, CardHeader } from '@/components/ui/card';

export const EliteConsciousnessDashboard: React.FC = () => {
  return (
    <div className='min-h-screen bg-gradient-to-br from-terra-midnight via-terra-slate to-terra-midnight p-6'>
      <Card
        className='border-amber-500/30 bg-terra-midnight/90'
        data-testid='elite-consciousness-dashboard-unavailable'
      >
        <CardHeader className='flex flex-row items-center justify-between'>
          <div>
            <h1 className='text-2xl font-semibold text-white'>Consciousness Evidence Dashboard</h1>
            <p className='text-sm tf-text-dim mt-2'>
              Governed provider evidence is required before this surface can claim live telemetry.
            </p>
          </div>
          <Badge variant='outline' className='border-amber-500/40 text-amber-300'>
            Unavailable
          </Badge>
        </CardHeader>
        <CardBody className='space-y-3'>
          <p className='text-base font-medium text-white'>Consciousness telemetry unavailable</p>
          <p className='text-sm tf-text-dim'>
            No governed consciousness provider is connected to this dashboard.
          </p>
          <p className='text-sm tf-text-dim'>
            Legacy provider URLs and synthetic agent metrics have been removed from this surface.
          </p>
          <p className='text-sm text-amber-300'>
            Optimization actions remain blocked until a governed runtime contract, provenance, and operator evidence are available.
          </p>
        </CardBody>
      </Card>
    </div>
  );
};

export default EliteConsciousnessDashboard;

import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent as CardBody, CardHeader } from '@/components/ui/card';

export const TerraFusionEliteRealtimeDashboard: React.FC = () => {
  return (
    <div className='min-h-screen bg-gradient-to-br from-terra-midnight via-terra-slate to-terra-midnight p-6'>
      <Card
        className='border-amber-500/30 bg-terra-midnight/90'
        data-testid='elite-realtime-dashboard-unavailable'
      >
        <CardHeader className='flex flex-row items-center justify-between'>
          <div>
            <h1 className='text-2xl font-semibold text-white'>Realtime Orchestration Dashboard</h1>
            <p className='text-sm tf-text-dim mt-2'>
              Multi-service operator telemetry is withheld until governed evidence is connected.
            </p>
          </div>
          <Badge variant='outline' className='border-amber-500/40 text-amber-300'>
            Unavailable
          </Badge>
        </CardHeader>
        <CardBody className='space-y-3'>
          <p className='text-base font-medium text-white'>Realtime orchestration dashboard unavailable</p>
          <p className='text-sm tf-text-dim'>
            This surface no longer polls retired consciousness provider URLs or synthetic experiment metrics.
          </p>
          <p className='text-sm tf-text-dim'>
            Live multi-service scoring is blocked until every dependency has a governed health contract and provenance path.
          </p>
          <p className='text-sm text-amber-300'>
            Decorative system scores and orchestration claims are intentionally withheld.
          </p>
        </CardBody>
      </Card>
    </div>
  );
};

export default TerraFusionEliteRealtimeDashboard;
